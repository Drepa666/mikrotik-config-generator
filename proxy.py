#!/usr/bin/env python3
import http.server
import threading
import urllib.request
import urllib.error
import base64
import json
import ssl
import os

WEB_PORT   = 8080
PROXY_PORT = 8888
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode    = ssl.CERT_NONE

MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'application/javascript; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.json': 'application/json',
    '.png':  'image/png',
    '.ico':  'image/x-icon',
    '.txt':  'text/plain; charset=utf-8',
    '.webmanifest': 'application/manifest+json',
}

CORS_HEADERS = (
    'Content-Type,Authorization,'
    'X-Router-IP,X-Router-User,X-Router-Pass,X-Router-Port,'
    'X-Router-Proto,X-Router-Host,X-Router-Timeout,'
    'x-router-ip,x-router-user,x-router-pass,x-router-port,'
    'x-router-proto,x-router-host,x-router-timeout'
)

# ══════════════════════════════
#  СТАТИЧНИЙ СЕРВЕР  (8080)
# ══════════════════════════════
class StaticHandler(http.server.BaseHTTPRequestHandler):

    def log_message(self, fmt, *args): pass

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods',
                         'GET,POST,PUT,PATCH,DELETE,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', CORS_HEADERS)

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.send_header('Content-Length', '0')
        self.end_headers()

    def do_GET(self):
        path = self.path.split('?')[0]
        if path in ('/', ''):
            path = '/index.html'

        safe  = path.lstrip('/').replace('..', '')
        fpath = os.path.join(BASE_DIR, safe)

        if not os.path.isfile(fpath):
            self.send_response(404)
            self._cors()
            self.end_headers()
            self.wfile.write(b'404 Not found')
            return

        ext  = os.path.splitext(fpath)[1].lower()
        mime = MIME.get(ext, 'application/octet-stream')

        with open(fpath, 'rb') as f:
            data = f.read()

        self.send_response(200)
        self.send_header('Content-Type',   mime)
        self.send_header('Content-Length', str(len(data)))
        self._cors()
        self.end_headers()
        self.wfile.write(data)


# ══════════════════════════════
#  PROXY СЕРВЕР  (8888)
# ══════════════════════════════
class ProxyHandler(http.server.BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        msg = fmt % args
        if '200' in msg or '304' in msg:
            return
        print('[proxy]', msg)

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods',
                         'GET,POST,PUT,PATCH,DELETE,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', CORS_HEADERS)

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.send_header('Content-Length', '0')
        self.end_headers()

    def do_GET(self):    self._proxy('GET')
    def do_POST(self):   self._proxy('POST')
    def do_PUT(self):    self._proxy('PUT')
    def do_PATCH(self):  self._proxy('PATCH')
    def do_DELETE(self): self._proxy('DELETE')

    def _proxy(self, method):
        # ── Параметри роутера ──
        ip   = (self.headers.get('X-Router-IP')   or
                self.headers.get('x-router-ip')   or '192.168.88.1')
        user = (self.headers.get('X-Router-User') or
                self.headers.get('x-router-user') or 'admin')
        pwd  = (self.headers.get('X-Router-Pass') or
                self.headers.get('x-router-pass') or '')
        port = (self.headers.get('X-Router-Port') or
                self.headers.get('x-router-port') or '80')

        target = f'http://{ip}:{port}{self.path}'

        # ── Тіло ──
        body = b''
        cl = int(self.headers.get('Content-Length', 0) or 0)
        if cl > 0:
            body = self.rfile.read(cl)

        # ── Basic Auth ──
        creds = base64.b64encode(f'{user}:{pwd}'.encode()).decode()

        fwd = {
            'Authorization': f'Basic {creds}',
            'Content-Type':  self.headers.get('Content-Type', 'application/json'),
            'Accept':        'application/json',
        }

        print(f'[proxy] {method} {target}  user={user}')

        try:
            req = urllib.request.Request(
                target, data=body or None,
                headers=fwd, method=method
            )
            with urllib.request.urlopen(req, context=SSL_CTX, timeout=15) as r:
                rb   = r.read()
                code = r.status
                ct   = r.headers.get('Content-Type', 'application/json')

            self.send_response(code)
            self.send_header('Content-Type',   ct)
            self.send_header('Content-Length', str(len(rb)))
            self._cors()
            self.end_headers()
            self.wfile.write(rb)

        except urllib.error.HTTPError as e:
            rb = e.read()
            self.send_response(e.code)
            self.send_header('Content-Type',   'application/json')
            self.send_header('Content-Length', str(len(rb)))
            self._cors()
            self.end_headers()
            self.wfile.write(rb)

        except Exception as e:
            rb = json.dumps({'error': str(e)}).encode()
            self.send_response(502)
            self.send_header('Content-Type',   'application/json')
            self.send_header('Content-Length', str(len(rb)))
            self._cors()
            self.end_headers()
            self.wfile.write(rb)


# ══════════════════════════════
#  MAIN
# ══════════════════════════════
def main():
    # SSH статус
    try:
        import paramiko
        ssh_ok = True
    except ImportError:
        ssh_ok = False

    print('=' * 50)
    print('🚀 MikroTik Config Generator v3')
    print('=' * 50)
    print(f'🌐 Web UI  → http://localhost:{WEB_PORT}')
    print(f'🔌 Proxy   → http://localhost:{PROXY_PORT}')
    print(f'🔒 SSH OK  → {ssh_ok}')
    print(f'⚡ SSH Pool → {"увімкнено (keepalive 30s)" if ssh_ok else "pip install paramiko"}')
    print('Ctrl+C щоб зупинити')
    print('=' * 50)

    # Proxy в окремому потоці
    proxy = http.server.ThreadingHTTPServer(
        ('0.0.0.0', PROXY_PORT), ProxyHandler
    )
    t = threading.Thread(target=proxy.serve_forever, daemon=True)
    t.start()
    print(f'🔌 Proxy сервер → http://localhost:{PROXY_PORT}')

    # Static у головному потоці
    web = http.server.ThreadingHTTPServer(
        ('0.0.0.0', WEB_PORT), StaticHandler
    )
    print(f'🌐 HTTP сервер  → http://localhost:{WEB_PORT}')

    try:
        web.serve_forever()
    except KeyboardInterrupt:
        print('\n[proxy] Зупинено.')
        web.shutdown()
        proxy.shutdown()

if __name__ == '__main__':
    main()