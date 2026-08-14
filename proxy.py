#!/usr/bin/env python3
"""
MikroTik Proxy v2 — REST API + SSH Terminal
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request, urllib.error, json, ssl, threading

try:
    import paramiko
    SSH_OK = True
except ImportError:
    SSH_OK = False
    print('[proxy] paramiko не встановлено — SSH недоступний')
    print('[proxy] Встанови: pip install paramiko')

# ── SSH пул з'єднань ──────────────────────────────────────────
ssh_lock    = threading.Lock()
ssh_clients = {}   # key → paramiko.SSHClient

def get_ssh(host, port, user, password):
    key = f'{user}@{host}:{port}'
    with ssh_lock:
        cl = ssh_clients.get(key)
        if cl:
            try:
                cl.exec_command('', timeout=2)
                return cl
            except Exception:
                try: cl.close()
                except: pass
                del ssh_clients[key]

        cl = paramiko.SSHClient()
        cl.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        cl.connect(
            hostname=host, port=int(port),
            username=user, password=password,
            timeout=10, allow_agent=False, look_for_keys=False,
            banner_timeout=10
        )
        ssh_clients[key] = cl
        print(f'[SSH] Підключено: {key}')
        return cl

def ssh_exec(host, port, user, password, command, timeout=10):
    """Виконати команду і повернути вивід з таймаутом."""
    cl  = get_ssh(host, port, user, password)
    _, stdout, stderr = cl.exec_command(command, timeout=timeout)
    
    # Читаємо з таймаутом по шматках
    output = ''
    error  = ''
    
    import select, time
    start = time.time()
    channel = stdout.channel
    channel.setblocking(False)
    
    while True:
        elapsed = time.time() - start
        if elapsed > timeout:
            output += '\n[⚠️ Таймаут {}s — команда перервана]'.format(timeout)
            try: channel.close()
            except: pass
            break
            
        # Перевіряємо чи є дані
        if channel.exit_status_ready() and not channel.recv_ready():
            break
            
        ready, _, _ = select.select([channel], [], [], 0.5)
        if ready:
            chunk = ''
            while channel.recv_ready():
                chunk += channel.recv(4096).decode('utf-8', errors='replace')
            while channel.recv_stderr_ready():
                error += channel.recv_stderr(4096).decode('utf-8', errors='replace')
            if chunk:
                output += chunk
        elif channel.exit_status_ready():
            break
    
    # Читаємо залишок stderr
    try:
        error += stderr.read().decode('utf-8', errors='replace')
    except: pass
    
    return output, error

# ── HTTP Handler ──────────────────────────────────────────────
class ProxyHandler(BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        method = args[0] if args else ''
        if '/rest/' in str(method):
            print(f'[REST] {args[0]} {args[1]} {args[2]}')

    def send_cors(self):
        self.send_header('Access-Control-Allow-Origin',  '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
        self.send_header('Access-Control-Allow-Headers',
            'Content-Type,Authorization,X-Router-Host,X-Router-Port,'
            'X-Router-Proto,X-SSH-User,X-SSH-Pass,X-SSH-Port,X-SSH-Command')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors()
        self.end_headers()

    def do_GET(self):    self.proxy('GET')
    def do_POST(self):   self.proxy('POST')
    def do_PUT(self):    self.proxy('PUT')
    def do_PATCH(self):  self.proxy('PATCH')
    def do_DELETE(self): self.proxy('DELETE')

    def proxy(self, method):
        try:
            path = self.path

            # ── SSH термінал ──────────────────────────
            if path == '/ssh/exec':
                self.handle_ssh()
                return

            # ── SSH статус ────────────────────────────
            if path == '/ssh/status':
                self.handle_ssh_status()
                return

            # ── REST API проксі ───────────────────────
            router_host  = self.headers.get('X-Router-Host',  '192.168.88.1')
            router_port  = self.headers.get('X-Router-Port',  '80')
            router_proto = self.headers.get('X-Router-Proto', 'http')
            auth         = self.headers.get('Authorization',  '')

            url = f'{router_proto}://{router_host}:{router_port}{path}'

            length = int(self.headers.get('Content-Length', 0))
            body   = self.rfile.read(length) if length else None

            req = urllib.request.Request(url, data=body, method=method)
            req.add_header('Content-Type',  'application/json')
            req.add_header('Authorization', auth)

            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode    = ssl.CERT_NONE

            with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
                data = resp.read()
                self.send_response(resp.status)
                self.send_cors()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(data)

        except urllib.error.HTTPError as e:
            body = e.read()
            self.send_response(e.code)
            self.send_cors()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            err = json.dumps({'error': str(e)}).encode()
            self.send_response(502)
            self.send_cors()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(err)

    def handle_ssh(self):
        if not SSH_OK:
            err = json.dumps({'ok': False, 'error': 'paramiko не встановлено. Запусти: pip install paramiko'}).encode()
            self.send_response(500)
            self.send_cors()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(err)
            return

        try:
            length  = int(self.headers.get('Content-Length', 0))
            payload = json.loads(self.rfile.read(length)) if length else {}

            host     = payload.get('host',     '192.168.88.1')
            port     = payload.get('port',     22)
            user     = payload.get('user',     'admin')
            password = payload.get('password', '')
            command  = payload.get('command',  '')

            if not command:
                raise ValueError('Порожня команда')

            print(f'[SSH] {user}@{host} → {command}')
            out, err = ssh_exec(host, port, user, password, command)

            result = json.dumps({
                'ok':     True,
                'output': out,
                'error':  err,
            }).encode()

            self.send_response(200)
            self.send_cors()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(result)

        except Exception as e:
            err = json.dumps({'ok': False, 'error': str(e)}).encode()
            self.send_response(200)
            self.send_cors()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(err)

    def handle_ssh_status(self):
        result = json.dumps({
            'ok':          True,
            'ssh_ready':   SSH_OK,
            'connections': list(ssh_clients.keys()),
        }).encode()
        self.send_response(200)
        self.send_cors()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(result)


if __name__ == '__main__':
    port = 8888
    print(f'🚀 MikroTik Proxy v2 запущено → http://localhost:{port}')
    print(f'   REST API: http://localhost:{port}/rest/...')
    print(f'   SSH Term: http://localhost:{port}/ssh/exec')
    print(f'   SSH OK:   {SSH_OK}')
    print(f'   Ctrl+C щоб зупинити')
    HTTPServer(('localhost', port), ProxyHandler).serve_forever()