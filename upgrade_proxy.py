with open('proxy.py', 'r', encoding='utf-8') as f:
    c = f.read()

ADD = """
# ── Вбудований HTTP сервер для статичних файлів ──────────────
import threading, os
from http.server import HTTPServer, SimpleHTTPRequestHandler

class StaticHandler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # тихий режим

def start_static_server(directory, port=8080):
    os.chdir(directory)
    server = HTTPServer(('localhost', port), StaticHandler)
    print(f'🌐 HTTP сервер запущено → http://localhost:{port}')
    server.serve_forever()
"""

OLD = """if __name__ == '__main__':
    port = 8888
    print(f'🚀 MikroTik Proxy v2 запущено → http://localhost:{port}')
    print(f'   REST API: http://localhost:{port}/rest/...')
    print(f'   SSH Term: http://localhost:{port}/ssh/exec')
    print(f'   SSH OK:   {SSH_OK}')
    print(f'   Ctrl+C щоб зупинити')
    HTTPServer(('localhost', port), ProxyHandler).serve_forever()"""

NEW = """if __name__ == '__main__':
    import webbrowser

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    PROXY_PORT  = 8888
    STATIC_PORT = 8080

    print('=' * 50)
    print('🚀 MikroTik Config Generator')
    print('=' * 50)
    print(f'🌐 Web UI  → http://localhost:{STATIC_PORT}')
    print(f'🔌 Proxy   → http://localhost:{PROXY_PORT}')
    print(f'🔒 SSH OK  → {SSH_OK}')
    print('Ctrl+C щоб зупинити')
    print('=' * 50)

    # Запускаємо статичний сервер в окремому потоці
    t = threading.Thread(
        target=start_static_server,
        args=(BASE_DIR, STATIC_PORT),
        daemon=True
    )
    t.start()

    # Відкриваємо браузер
    import time
    time.sleep(0.5)
    webbrowser.open(f'http://localhost:{STATIC_PORT}')

    # Запускаємо проксі (головний потік)
    HTTPServer(('localhost', PROXY_PORT), ProxyHandler).serve_forever()"""

c = ADD + c
c = c.replace(OLD, NEW)

with open('proxy.py', 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
print('proxy.py оновлено!')