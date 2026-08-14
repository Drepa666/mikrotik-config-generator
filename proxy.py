#!/usr/bin/env python3
"""
MikroTik REST API Proxy
Запускай: python proxy.py
Потім Deploy буде працювати через localhost:8888
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request
import urllib.error
import json
import ssl

class ProxyHandler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        print(f'[proxy] {args[0]} {args[1]} {args[2]}')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors()
        self.end_headers()

    def send_cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Router-Host,X-Router-Port,X-Router-Proto')

    def do_GET(self):  self.proxy('GET')
    def do_POST(self): self.proxy('POST')
    def do_PUT(self):  self.proxy('PUT')
    def do_DELETE(self): self.proxy('DELETE')

    def proxy(self, method):
        try:
            # Читаємо заголовки
            router_host  = self.headers.get('X-Router-Host',  '192.168.88.1')
            router_port  = self.headers.get('X-Router-Port',  '80')
            router_proto = self.headers.get('X-Router-Proto', 'http')
            auth         = self.headers.get('Authorization',  '')

            # Будуємо URL до роутера
            path = self.path  # /rest/system/identity etc
            url  = f'{router_proto}://{router_host}:{router_port}{path}'

            # Читаємо тіло запиту
            length = int(self.headers.get('Content-Length', 0))
            body   = self.rfile.read(length) if length else None

            # Запит до роутера
            req = urllib.request.Request(url, data=body, method=method)
            req.add_header('Content-Type', 'application/json')
            req.add_header('Authorization', auth)

            # SSL без перевірки сертифікату
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode    = ssl.CERT_NONE

            with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
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

if __name__ == '__main__':
    port = 8888
    print(f'🚀 MikroTik Proxy запущено на http://localhost:{port}')
    print(f'   Генератор:  http://localhost:8080')
    print(f'   Проксі:     http://localhost:{port}')
    print(f'   Ctrl+C щоб зупинити')
    HTTPServer(('localhost', port), ProxyHandler).serve_forever()