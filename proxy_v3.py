#!/usr/bin/env python3
"""MikroTik Proxy v3 — SSH Pool + Keepalive + Auto-reconnect"""

from http.server import HTTPServer, SimpleHTTPRequestHandler, BaseHTTPRequestHandler
import urllib.request, urllib.error
import json, ssl, threading, os, time

try:
    import paramiko
    SSH_OK = True
except ImportError:
    SSH_OK = False

# ── SSH Connection Pool ───────────────────────────────────────
class SSHPool:
    def __init__(self):
        self._lock    = threading.Lock()
        self._clients = {}   # key → {client, last_used, host, port, user, password}
        
        # Keepalive thread
        t = threading.Thread(target=self._keepalive_loop, daemon=True)
        t.start()

    def _key(self, host, port, user):
        return f'{user}@{host}:{port}'

    def _connect(self, host, port, user, password):
        cl = paramiko.SSHClient()
        cl.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        cl.connect(
            hostname=host, port=int(port),
            username=user, password=password,
            timeout=10, allow_agent=False, look_for_keys=False,
            banner_timeout=10
        )
        print(f'[SSH] Підключено: {user}@{host}:{port}')
        return cl

    def get(self, host, port, user, password):
        key = self._key(host, port, user)
        with self._lock:
            entry = self._clients.get(key)
            if entry:
                try:
                    # Перевіряємо чи живий
                    transport = entry['client'].get_transport()
                    if transport and transport.is_active():
                        entry['last_used'] = time.time()
                        return entry['client']
                except:
                    pass
                # Мертвий — видаляємо
                try: entry['client'].close()
                except: pass
                del self._clients[key]

            # Нове з'єднання
            cl = self._connect(host, port, user, password)
            self._clients[key] = {
                'client':   cl,
                'last_used': time.time(),
                'host': host, 'port': port,
                'user': user, 'password': password,
            }
            return cl

    def _keepalive_loop(self):
        """Кожні 30с — ping + авто-реконнект"""
        while True:
            time.sleep(30)
            with self._lock:
                for key, entry in list(self._clients.items()):
                    try:
                        transport = entry['client'].get_transport()
                        if transport and transport.is_active():
                            transport.send_ignore()  # keepalive ping
                        else:
                            raise Exception('dead')
                    except:
                        print(f'[SSH] Реконнект: {key}')
                        try:
                            cl = self._connect(
                                entry['host'], entry['port'],
                                entry['user'], entry['password']
                            )
                            entry['client']    = cl
                            entry['last_used'] = time.time()
                        except Exception as e:
                            print(f'[SSH] Реконнект failed: {e}')
                            del self._clients[key]

    def status(self):
        with self._lock:
            return {
                key: {
                    'active': entry['client'].get_transport().is_active()
                        if entry['client'].get_transport() else False,
                    'idle': round(time.time() - entry['last_used']),
                }
                for key, entry in self._clients.items()
            }

pool = SSHPool() if SSH_OK else None

# ── SSH Execute ───────────────────────────────────────────────
def ssh_exec(host, port, user, password, command, timeout=12):
    cl = pool.get(host, port, user, password)
    
    _, stdout, stderr = cl.exec_command(command, timeout=timeout)
    channel = stdout.channel
    channel.setblocking(False)

    output = []
    error  = []
    start  = time.time()

    while True:
        if time.time() - start > timeout:
            output.append(f'\n[⚠️ Таймаут {timeout}s]')
            try: channel.close()
            except: pass
            break

        import select
        ready, _, _ = select.select([channel], [], [], 0.3)

        if ready:
            while channel.recv_ready():
                output.append(channel.recv(8192).decode('utf-8', errors='replace'))
            while channel.recv_stderr_ready():
                error.append(channel.recv_stderr(8192).decode('utf-8', errors='replace'))

        if channel.exit_status_ready() and not channel.recv_ready():
            break

    return ''.join(output), ''.join(error)

# ── HTTP Handlers ─────────────────────────────────────────────
class StaticHandler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args): pass
    def handle_error(self, req, addr): pass

class ProxyHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        if '/ssh/' in str(args):
            print(f'[SSH-API] {args[1]}')

    def send_cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
        self.send_header('Access-Control-Allow-Headers',
            'Content-Type,Authorization,X-Router-Host,X-Router-Port,X-Router-Proto')

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

            # SSH exec
            if path == '/ssh/exec':
                self.handle_ssh()
                return

            # SSH status
            if path == '/ssh/status':
                result = json.dumps({
                    'ok': True,
                    'ssh_ready': SSH_OK,
                    'connections': pool.status() if pool else {},
                }).encode()
                self.send_response(200)
                self.send_cors()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(result)
                return

            # SSH disconnect
            if path == '/ssh/disconnect':
                length  = int(self.headers.get('Content-Length', 0))
                payload = json.loads(self.rfile.read(length)) if length else {}
                key = f"{payload.get('user','admin')}@{payload.get('host','192.168.88.1')}:{payload.get('port',22)}"
                if pool and key in pool._clients:
                    try: pool._clients[key]['client'].close()
                    except: pass
                    del pool._clients[key]
                result = json.dumps({'ok': True}).encode()
                self.send_response(200)
                self.send_cors()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(result)
                return

            # REST API proxy
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
            err = json.dumps({'ok': False, 'error': 'pip install paramiko'}).encode()
            self.send_response(500)
            self.send_cors()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(err)
            return

        try:
            length  = int(self.headers.get('Content-Length', 0))
            payload = json.loads(self.rfile.read(length)) if length else {}

            host     = payload.get('host',    '192.168.88.1')
            port     = payload.get('port',    22)
            user     = payload.get('user',    'admin')
            password = payload.get('password','')
            command  = payload.get('command', '')
            timeout  = int(payload.get('timeout', 12))

            if not command:
                raise ValueError('Порожня команда')

            t0 = time.time()
            out, err = ssh_exec(host, port, user, password, command, timeout)
            elapsed  = round((time.time() - t0) * 1000)

            result = json.dumps({
                'ok':      True,
                'output':  out,
                'error':   err,
                'elapsed': elapsed,
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


# ── Main ──────────────────────────────────────────────────────
if __name__ == '__main__':
    import webbrowser

    BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
    PROXY_PORT  = 8888
    STATIC_PORT = 8080

    print('=' * 50)
    print('🚀 MikroTik Config Generator v3')
    print('=' * 50)
    print(f'🌐 Web UI  → http://localhost:{STATIC_PORT}')
    print(f'🔌 Proxy   → http://localhost:{PROXY_PORT}')
    print(f'🔒 SSH OK  → {SSH_OK}')
    print(f'⚡ SSH Pool → увімкнено (keepalive 30s)')
    print('Ctrl+C щоб зупинити')
    print('=' * 50)

    # Статичний сервер
    os.chdir(BASE_DIR)
    static_server = HTTPServer(('localhost', STATIC_PORT), StaticHandler)
    t = threading.Thread(target=static_server.serve_forever, daemon=True)
    t.start()
    print(f'🌐 HTTP сервер → http://localhost:{STATIC_PORT}')

    # Відкриваємо браузер
    time.sleep(0.5)
    webbrowser.open(f'http://localhost:{STATIC_PORT}')

    # Proxy сервер (головний потік)
    HTTPServer(('localhost', PROXY_PORT), ProxyHandler).serve_forever()