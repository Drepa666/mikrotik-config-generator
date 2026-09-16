# -*- coding: utf-8 -*-
import subprocess

with open('proxy.py', 'r', encoding='utf-8') as f:
    content = f.read()

old = "target_url = 'http://{}:{}/rest{}'.format(\n                router_ip, router_port, path)"

new = """# path може вже містити /rest — прибираємо щоб не дублювати
                api_path = path
                if api_path.startswith('/rest'):
                    api_path = api_path[5:]
                # Додаємо query string якщо є
                qs = full_path.split('?', 1)[1] if '?' in full_path else ''
                target_url = 'http://{}:{}/rest{}{}'.format(
                    router_ip, router_port, api_path, ('?' + qs) if qs else '')"""

if old in content:
    content = content.replace(old, new)
    print('OK ✅')
else:
    print('Не знайдено! Поточний вміст:')
    idx = content.find('target_url')
    print(repr(content[idx:idx+120]))

with open('proxy.py', 'w', encoding='utf-8') as f:
    f.write(content)

r = subprocess.run(['python', '-m', 'py_compile', 'proxy.py'],
                   capture_output=True, text=True)
print('proxy.py:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr)