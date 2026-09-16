# -*- coding: utf-8 -*-
import subprocess

with open('proxy.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Видаляємо рядки 192-197 (індекси 191-196) повністю
# і замінюємо одним чистим рядком
print('До (188-200):')
for i, l in enumerate(lines[187:202], 188):
    print(f'{i:4}: {repr(l)}')

# Знаходимо рядок з коментарем про /rest і видаляємо до target_url включно
start = None
end   = None
for i, l in enumerate(lines):
    if '# path може' in l or '# Додаємо query' in l:
        if start is None:
            start = i
    if start and 'target_url' in l and 'format' in l:
        end = i + 1
        break

print(f'\nВидаляємо рядки {start+1}-{end}')

if start is not None and end is not None:
    sp = '            '  # 12 пробілів — рівень try блоку
    NEW = [
        sp + 'api_path = path[5:] if path.startswith("/rest") else path\n',
        sp + 'qs = full_path.split("?",1)[1] if "?" in full_path else ""\n',
        sp + 'target_url = "http://{}:{}/rest{}{}".format(router_ip, router_port, api_path, ("?"+qs) if qs else "")\n',
    ]
    lines = lines[:start] + NEW + lines[end:]
    print('OK ✅')

print('\nПісля (188-200):')
for i, l in enumerate(lines[187:202], 188):
    print(f'{i:4}: {repr(l)}')

with open('proxy.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)

r = subprocess.run(['python', '-m', 'py_compile', 'proxy.py'],
                   capture_output=True, text=True)
print('\nproxy.py:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:300])