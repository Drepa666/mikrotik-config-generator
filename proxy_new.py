# -*- coding: utf-8 -*-
"""
MikroTik Proxy Server v5
Підтримує: REST API proxy, SSH exec, Ruijie RPC, статичні файли
"""
import os, sys, json, threading, time
import http.server, http.client
import urllib.request, urllib.error

WEB_PORT      = 8080
PROXY_PORT    = 8888
ELECTRON_MODE = '--electron' in sys.argv
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))

try:
    import paramiko
    SSH_OK = True
except ImportError:
    SSH_OK = False
    print('[proxy] Встановити: python -m pip install paramiko')

# ══════════════════════════════════════════════════════════════
# CORS / JSON хелпер
# ══════════════════════════════════════════════════════════════
def send_json(handler, data, status=200):
    body = json.dumps(data, ensure_ascii=False).encode('utf-8')
    handler.send_response(status)
    handler.send_header('Content-Type',   'application/json; charset=utf-8')
    handler.send_header('Content-Length', str(len(body)))
    handler.send_header('Access-Control-Allow-Origin',  '*')
    handler.send_header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    handler.send_header('Access-Control-Allow-Headers',
        'Content-Type,Authorization,x-router-ip,x-router-port,x-router-user,x-router-pass')
    handler.end_headers()
    handler.wfile.write(body)

# ══════════════════════════════════════════════════════════════
# SSH виконання команд
# ══════════════════════════════════════════════════════════════
def ssh_exec(host, port, username, password, command, timeout=15):
    if not SSH_OK:
        return {'ok': False, 'error': 'paramiko не встановлено'}
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(hostname=host, port=int(port), username=username,
                       password=password, timeout=15,
                       look_for_keys=False, allow_agent=False)
        stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
        out = stdout.read().decode('utf-8', errors='replace')
        err = stderr.read().decode('utf-8', errors='replace')
        client.close()
        return {'ok': True, 'output': out, 'error': err}
    except paramiko.AuthenticationException:
        return {'ok': False, 'error': 'Невірний логін або пароль SSH'}
    except Exception as e:
        return {'ok': False, 'error': 'SSH помилка: ' + str(e)}

# ══════════════════════════════════════════════════════════════
# Ruijie SSL контекст
# ══════════════════════════════════════════════════════════════
def make_ruijie_ssl():
    import ssl
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ctx.check_hostname = False
    ctx.verify_mode    = ssl.CERT_NONE
    try:    ctx.minimum_version = ssl.TLSVersion.TLSv1
    except: pass
    try:    ctx.set_ciphers('ALL:@SECLEVEL=0')
    except: ctx.set_ciphers('DEFAULT@SECLEVEL=0')
    return ctx

# ══════════════════════════════════════════════════════════════
# Proxy Handler
# ══════════════════════════════════════════════════════════════
class ProxyHandler(http.server.BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        if args and len(args) >= 2 and str(args[1]) not in ('200', '204'):
            print('[proxy] ' + fmt % args)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin',  '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
        self.send_header('Access-Control-Allow-Headers',
            'Content-Type,Authorization,x-router-ip,x-router-port,x-router-user,x-router-pass')
        self.send_header('Content-Length', '0')
        self.end_headers()

    def do_GET(self):    self._handle('GET')
    def do_POST(self):   self._handle('POST')
    def do_PUT(self):    self._handle('PUT')
    def do_PATCH(self):  self._handle('PATCH')
    def do_DELETE(self): self._handle('DELETE')

    def _read_body(self):
        length = int(self.headers.get('Content-Length', 0) or 0)
        return self.rfile.read(length) if length > 0 else b''

    def _handle(self, method):
        path = self.path.split('?')[0]

        # ── Health check ──
        if path in ('/health', '/ping'):
            send_json(self, {'ok': True, 'ssh': SSH_OK, 'electron': ELECTRON_MODE})
            return

        # ── SSH exec ──
        if path == '/ssh/exec':
            try:
                body = json.loads(self._read_body().decode('utf-8'))
                result = ssh_exec(
                    host     = body.get('host', ''),
                    port     = body.get('port', 22),
                    username = body.get('username', 'admin'),
                    password = body.get('password', ''),
                    command  = body.get('command', ''),
                    timeout  = body.get('timeout', 15),
                )
                send_json(self, result)
            except Exception as e:
                send_json(self, {'ok': False, 'error': str(e)}, 500)
            return

        # ── Ruijie RPC ──
        if path == '/ruijie-rpc':
            try:
                body   = json.loads(self._read_body().decode('utf-8'))
                host   = body.get('host',   '192.168.110.1')
                port   = body.get('port',   443)
                token  = body.get('token',  '')
                rpc_m  = body.get('method', '')
                params = body.get('params', {})

                ctx  = make_ruijie_ssl()
                conn = http.client.HTTPSConnection(host, port, timeout=15, context=ctx)
                conn.request('POST',
                    '/cgi-bin/luci/api/cmd?auth=' + token,
                    body=json.dumps({'method': rpc_m, 'params': params}),
                    headers={
                        'Content-Type':     'application/json;charset=UTF-8',
                        'Accept':           'application/json, text/plain, */*',
                        'Connection':       'close',
                        'X-Requested-With': 'XMLHttpRequest',
                    })
                resp = conn.getresponse()
                rb   = resp.read()
                conn.close()
                send_json(self, json.loads(rb))
            except Exception as e:
                send_json(self, {'error': str(e)}, 500)
            return

        # ── REST API proxy до MikroTik ──
        router_ip   = self.headers.get('x-router-ip',   '')
        router_port = self.headers.get('x-router-port', '80')
        router_user = self.headers.get('x-router-user', 'admin')
        router_pass = self.headers.get('x-router-pass', '')

        if not router_ip:
            send_json(self, {'error': 'Missing x-router-ip header'}, 400)
            return

        try:
            target_url = 'http://{}:{}/rest{}'.format(
                router_ip, router_port, path)

            body = self._read_body()
            req  = urllib.request.Request(
                url    = target_url,
                data   = body if body else None,
                method = method,
            )
            # Basic auth
            import base64
            creds = base64.b64encode(
                '{}:{}'.format(router_user, router_pass).encode()
            ).decode()
            req.add_header('Authorization',  'Basic ' + creds)
            req.add_header('Content-Type',   'application/json')
            req.add_header('Accept',         'application/json')

            # Копіюємо query string
            if '?' in self.path:
                qs = self.path.split('?', 1)[1]
                target_url += '?' + qs
                req.full_url = target_url

            with urllib.request.urlopen(req, timeout=15) as resp:
                resp_body = resp.read()
                self.send_response(resp.status)
                self.send_header('Content-Type',  'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-Length', str(len(resp_body)))
                self.end_headers()
                self.wfile.write(resp_body)

        except urllib.error.HTTPError as e:
            err_body = e.read()
            self.send_response(e.code)
            self.send_header('Content-Type',  'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', str(len(err_body)))
            self.end_headers()
            self.wfile.write(err_body)
        except Exception as e:
            send_json(self, {'error': str(e)}, 502)

# ══════════════════════════════════════════════════════════════
# Static File Handler (для веб-сервера)
# ══════════════════════════════════════════════════════════════
class StaticHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def log_message(self, fmt, *args):
        pass  # тихий режим

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

# ══════════════════════════════════════════════════════════════
# Відкрити браузер
# ══════════════════════════════════════════════════════════════
def open_browser():
    time.sleep(1.5)
    import webbrowser
    webbrowser.open('http://localhost:{}'.format(WEB_PORT))

# ══════════════════════════════════════════════════════════════
# Main
# ══════════════════════════════════════════════════════════════
def main():
    print('=' * 52)
    print('  MikroTik Config Generator v5')
    print('=' * 52)
    if not ELECTRON_MODE:
        print('  Web UI  -> http://localhost:{}'.format(WEB_PORT))
    print('  Proxy   -> http://localhost:{}'.format(PROXY_PORT))
    print('  SSH     -> {}'.format('OK (paramiko)' if SSH_OK else 'НЕДОСТУПНИЙ'))
    print('  Ctrl+C щоб зупинити')
    print('=' * 52)

    proxy_server = http.server.ThreadingHTTPServer(
        ('127.0.0.1', PROXY_PORT), ProxyHandler)
    proxy_thread = threading.Thread(
        target=proxy_server.serve_forever, daemon=True)
    proxy_thread.start()
    print('[proxy] Proxy сервер -> http://localhost:{}'.format(PROXY_PORT))

    if ELECTRON_MODE:
        try:
            proxy_server.serve_forever()
        except KeyboardInterrupt:
            print('\n[proxy] Зупинено.')
            proxy_server.shutdown()
        return

    threading.Thread(target=open_browser, daemon=True).start()

    web_server = http.server.ThreadingHTTPServer(
        ('127.0.0.1', WEB_PORT), StaticHandler)
    print('[proxy] HTTP сервер  -> http://localhost:{}'.format(WEB_PORT))
    try:
        web_server.serve_forever()
    except KeyboardInterrupt:
        print('\n[proxy] Зупинено.')
        web_server.shutdown()
        proxy_server.shutdown()

if __name__ == '__main__':
    main()