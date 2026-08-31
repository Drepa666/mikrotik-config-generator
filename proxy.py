#!/usr/bin/env python3
import http.server
import threading
import urllib.request
import urllib.error
import base64
import json
import ssl
import os
import webbrowser
import time

WEB_PORT   = 8080
PROXY_PORT = 8888
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode    = ssl.CERT_NONE

CORS = (
    'Content-Type,Authorization,'
    'X-Router-IP,X-Router-User,X-Router-Pass,'
    'X-Router-Port,X-Router-Proto,X-Router-Host,'
    'x-router-ip,x-router-user,x-router-pass,'
    'x-router-port,x-router-proto,x-router-host'
)

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


class StaticHandler(http.server.BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        pass

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods',
                         'GET,POST,PUT,PATCH,DELETE,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', CORS)

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
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(data)))
        self._cors()
        self.end_headers()
        self.wfile.write(data)


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
        self.send_header('Access-Control-Allow-Headers', CORS)

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.send_header('Content-Length', '0')
        self.end_headers()

    def do_GET(self):
        self._proxy('GET')

    def do_POST(self):
        self._proxy('POST')

    def do_PUT(self):
        self._proxy('PUT')

    def do_PATCH(self):
        self._proxy('PATCH')

    def do_DELETE(self):
        self._proxy('DELETE')

    def _proxy(self, method):
        ip = (self.headers.get('X-Router-Host') or
              self.headers.get('x-router-host') or
              self.headers.get('X-Router-IP')   or
              self.headers.get('x-router-ip')   or '192.168.88.1')
        port = (self.headers.get('X-Router-Port') or
                self.headers.get('x-router-port') or '80')

        # SSH exec — не підтримується через HTTP proxy
        # Повертаємо зрозумілу помилку замість 501
        if self.path == '/ssh/exec':
            rb = json.dumps({
                'error': 'SSH exec не підтримується через HTTP proxy. '
                         'Використовуй REST API або SSH напряму.'
            }).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(rb)))
            self._cors()
            self.end_headers()
            self.wfile.write(rb)
            return

        target = 'http://{}:{}{}'.format(ip, port, self.path)

        body = b''
        cl = int(self.headers.get('Content-Length', 0) or 0)
        if cl > 0:
            body = self.rfile.read(cl)

        auth = (self.headers.get('Authorization') or
                self.headers.get('authorization') or '')

        fwd = {
            'Content-Type': self.headers.get(
                'Content-Type', 'application/json'),
            'Accept': 'application/json',
        }
        if auth:
            fwd['Authorization'] = auth

        print('[proxy] {} {}  auth={}'.format(
            method, target,
            auth[:25] if auth else 'NONE'))

        try:
            req = urllib.request.Request(
                target, data=body or None,
                headers=fwd, method=method)
            with urllib.request.urlopen(
                req, context=SSL_CTX, timeout=15
            ) as r:
                rb   = r.read()
                code = r.status
                ct   = r.headers.get(
                    'Content-Type', 'application/json')
            self.send_response(code)
            self.send_header('Content-Type', ct)
            self.send_header('Content-Length', str(len(rb)))
            self._cors()
            self.end_headers()
            self.wfile.write(rb)

        except urllib.error.HTTPError as e:
            rb = e.read()
            self.send_response(e.code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(rb)))
            self._cors()
            self.end_headers()
            self.wfile.write(rb)

        except Exception as e:
            rb = json.dumps({'error': str(e)}).encode()
            self.send_response(502)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(rb)))
            self._cors()
            self.end_headers()
            self.wfile.write(rb)


def open_browser():
    time.sleep(2)
    webbrowser.open('http://localhost:{}'.format(WEB_PORT))


def main():
    try:
        import paramiko
        ssh_ok = True
    except ImportError:
        ssh_ok = False

    print('=' * 50)
    print('MikroTik Config Generator v3')
    print('=' * 50)
    print('Web UI  -> http://localhost:{}'.format(WEB_PORT))
    print('Proxy   -> http://localhost:{}'.format(PROXY_PORT))
    print('SSH OK  -> {}'.format(ssh_ok))
    print('Ctrl+C щоб зупинити')
    print('=' * 50)

    proxy_srv = http.server.ThreadingHTTPServer(
        ('0.0.0.0', PROXY_PORT), ProxyHandler)
    proxy_thread = threading.Thread(
        target=proxy_srv.serve_forever, daemon=True)
    proxy_thread.start()
    print('Proxy сервер -> http://localhost:{}'.format(PROXY_PORT))

    browser_thread = threading.Thread(
        target=open_browser, daemon=True)
    browser_thread.start()

    web_srv = http.server.ThreadingHTTPServer(
        ('0.0.0.0', WEB_PORT), StaticHandler)
    print('HTTP сервер  -> http://localhost:{}'.format(WEB_PORT))

    try:
        web_srv.serve_forever()
    except KeyboardInterrupt:
        print('\n[proxy] Зупинено.')
        web_srv.shutdown()
        proxy_srv.shutdown()


if __name__ == '__main__':
    main()