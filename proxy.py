"""
MikroTik Config Generator — Proxy Server v4
Підтримує: REST API proxy, SSH exec, статичні файли
Режими: звичайний (8080+8888) та --electron (тільки 8888)
Платформи: Windows, macOS, Linux
"""

import os
import sys
import json
import threading
import http.server
import urllib.request
import urllib.error
import time

# ── Порти ──────────────────────────────────────────────────
WEB_PORT   = 8080
PROXY_PORT = 8888

# ── Режим Electron ─────────────────────────────────────────
ELECTRON_MODE = '--electron' in sys.argv
if ELECTRON_MODE:
    print('[proxy] Electron режим — веб-сервер 8080 вимкнено')

# ── Базова директорія ──────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ── SSH підтримка ──────────────────────────────────────────
try:
    import paramiko
    SSH_OK = True
except ImportError:
    SSH_OK = False
    print('[proxy] paramiko не знайдено — SSH exec недоступний')
    print('[proxy] Встановити: python -m pip install paramiko')


# ══════════════════════════════════════════════════════════════
#  CORS хелпер
# ══════════════════════════════════════════════════════════════
def send_json(handler, data, status=200):
    body = json.dumps(data, ensure_ascii=False).encode('utf-8')
    handler.send_response(status)
    handler.send_header('Content-Type',  'application/json; charset=utf-8')
    handler.send_header('Content-Length', str(len(body)))
    handler.send_header('Access-Control-Allow-Origin',  '*')
    handler.send_header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    handler.send_header('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-router-ip,x-router-port,x-router-user,x-router-pass')
    handler.end_headers()
    handler.wfile.write(body)


# ══════════════════════════════════════════════════════════════
#  SSH виконання команд
# ══════════════════════════════════════════════════════════════
def ssh_exec(host, port, username, password, command, timeout=15):
    if not SSH_OK:
        return {'ok': False, 'error': 'paramiko не встановлено. Виконай: python -m pip install paramiko'}

    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(
            hostname=host,
            port=int(port),
            username=username,
            password=password,
            timeout=10,
            look_for_keys=False,
            allow_agent=False,
        )
        stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
        out = stdout.read().decode('utf-8', errors='replace')
        err = stderr.read().decode('utf-8', errors='replace')
        client.close()
        return {'ok': True, 'output': out, 'error': err}
    except paramiko.AuthenticationException:
        return {'ok': False, 'error': 'Невірний логін або пароль SSH'}
    except paramiko.NoValidConnectionsError:
        return {'ok': False, 'error': 'SSH: неможливо підключитись до ' + host + ':' + str(port)}
    except Exception as e:
        return {'ok': False, 'error': 'SSH помилка: ' + str(e)}


# ══════════════════════════════════════════════════════════════
#  Proxy Handler — обробник запитів на порту 8888
# ══════════════════════════════════════════════════════════════
class ProxyHandler(http.server.BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        # Тихий режим — виводимо тільки помилки
        if args and len(args) >= 2 and str(args[1]) not in ('200', '204'):
            print('[proxy] ' + fmt % args)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin',  '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-router-ip,x-router-port,x-router-user,x-router-pass')
        self.send_header('Content-Length', '0')
        self.end_headers()

    def do_GET(self):
        self._handle('GET')

    def do_POST(self):
        self._handle('POST')

    def do_PUT(self):
        self._handle('PUT')

    def do_PATCH(self):
        self._handle('PATCH')

    def do_DELETE(self):
        self._handle('DELETE')

    def _read_body(self):
        length = int(self.headers.get('Content-Length', 0) or 0)
        if length > 0:
            return self.rfile.read(length)
        return b''

    def _handle(self, method):
        path = self.path.split('?')[0]

        # ── Health check ────────────────────────────────────
        if path == '/health' or path == '/ping':
            send_json(self, {'ok': True, 'ssh': SSH_OK, 'electron': ELECTRON_MODE})
            return

        # ── SSH exec endpoint ────────────────────────────────
        if path == '/ssh/exec':
            body_bytes = self._read_body()
            try:
                body = json.loads(body_bytes) if body_bytes else {}
            except Exception:
                send_json(self, {'ok': False, 'error': 'Невалідний JSON'}, 400)
                return

            host     = body.get('host')     or self.headers.get('x-router-ip')   or '192.168.88.1'
            port     = body.get('port')     or self.headers.get('x-router-port')  or 22
            username = body.get('username') or self.headers.get('x-router-user')  or 'admin'
            password = body.get('password') or self.headers.get('x-router-pass')  or ''
            command  = body.get('command',  '')

            if not command:
                send_json(self, {'ok': False, 'error': 'Команда не вказана'}, 400)
                return

            result = ssh_exec(host, int(port), username, password, command)
            send_json(self, result, 200 if result['ok'] else 500)
            return

        # ── REST API proxy до роутера ────────────────────────
        router_ip   = self.headers.get('x-router-ip')   or '192.168.88.1'
        router_port = self.headers.get('x-router-port') or '80'
        auth        = self.headers.get('Authorization')  or ''

        target = 'http://{}:{}{}'.format(router_ip, router_port, self.path)

        body_bytes = self._read_body()

        fwd_headers = {
            'Content-Type': self.headers.get('Content-Type', 'application/json'),
        }
        if auth:
            fwd_headers['Authorization'] = auth

        try:
            req = urllib.request.Request(
                target,
                data=body_bytes or None,
                headers=fwd_headers,
                method=method,
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                data    = resp.read()
                status  = resp.status
                ctype   = resp.headers.get('Content-Type', 'application/json')

            self.send_response(status)
            self.send_header('Content-Type',   ctype)
            self.send_header('Content-Length', str(len(data)))
            self.send_header('Access-Control-Allow-Origin',  '*')
            self.send_header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-router-ip,x-router-port,x-router-user,x-router-pass')
            self.end_headers()
            self.wfile.write(data)

        except urllib.error.HTTPError as e:
            err_body = e.read()
            self.send_response(e.code)
            self.send_header('Content-Type',   'application/json')
            self.send_header('Content-Length', str(len(err_body)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(err_body)

        except Exception as e:
            msg = json.dumps({'error': str(e), 'target': target}).encode()
            self.send_response(502)
            self.send_header('Content-Type',   'application/json')
            self.send_header('Content-Length', str(len(msg)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(msg)


# ══════════════════════════════════════════════════════════════
#  Static Handler — обробник статичних файлів на порту 8080
# ══════════════════════════════════════════════════════════════
class StaticHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def log_message(self, fmt, *args):
        pass  # тихий режим


# ══════════════════════════════════════════════════════════════
#  Відкрити браузер після запуску
# ══════════════════════════════════════════════════════════════
def open_browser():
    time.sleep(1.5)
    import webbrowser
    webbrowser.open('http://localhost:{}'.format(WEB_PORT))


# ══════════════════════════════════════════════════════════════
#  Головна функція
# ══════════════════════════════════════════════════════════════
def main():
    print('=' * 52)
    print('  MikroTik Config Generator v4')
    print('=' * 52)
    if not ELECTRON_MODE:
        print('  Web UI  -> http://localhost:{}'.format(WEB_PORT))
    print('  Proxy   -> http://localhost:{}'.format(PROXY_PORT))
    print('  SSH     -> {}'.format('OK (paramiko)' if SSH_OK else 'НЕДОСТУПНИЙ'))
    print('  Ctrl+C щоб зупинити')
    print('=' * 52)

    # Запускаємо proxy сервер (порт 8888) — завжди
    proxy_server = http.server.ThreadingHTTPServer(
        ('127.0.0.1', PROXY_PORT),
        ProxyHandler,
    )
    proxy_thread = threading.Thread(
        target=proxy_server.serve_forever,
        daemon=True,
    )
    proxy_thread.start()
    print('[proxy] Proxy сервер -> http://localhost:{}'.format(PROXY_PORT))

    # В Electron режимі — тільки proxy, без веб-сервера
    if ELECTRON_MODE:
        print('[proxy] Electron режим — тільки proxy на порту {}'.format(PROXY_PORT))
        try:
            proxy_server.serve_forever()
        except KeyboardInterrupt:
            print('\n[proxy] Зупинено.')
            proxy_server.shutdown()
        return

    # Звичайний режим — веб-сервер + автовідкриття браузера
    browser_thread = threading.Thread(target=open_browser, daemon=True)
    browser_thread.start()

    web_server = http.server.ThreadingHTTPServer(
        ('127.0.0.1', WEB_PORT),
        StaticHandler,
    )
    print('[proxy] HTTP сервер  -> http://localhost:{}'.format(WEB_PORT))

    try:
        web_server.serve_forever()
    except KeyboardInterrupt:
        print('\n[proxy] Зупинено.')
        web_server.shutdown()
        proxy_server.shutdown()


if __name__ == '__main__':
    main()