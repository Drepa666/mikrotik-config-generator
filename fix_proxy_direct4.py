# -*- coding: utf-8 -*-
import subprocess

with open('proxy.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Видаляємо рядки 192-202 (індекси 191-201) і замінюємо чистим кодом
print('До:')
for i, l in enumerate(lines[190:204], 191):
    print(f'{i:4}: {repr(l)}')

NEW = [
    '                api_path = path[5:] if path.startswith("/rest") else path\n',
    '                qs = full_path.split("?",1)[1] if "?" in full_path else ""\n',
    '                target_url = "http://{}:{}/rest{}{}".format(router_ip, router_port, api_path, ("?"+qs) if qs else "")\n',
]

# Знаходимо перший рядок блоку (десь біля 192) і кінець (202)
start_idx = None
end_idx   = None

for i, l in enumerate(lines):
    if 'api_path = api_path' in l or ("api_path = path" in l and 'startswith' in l) or ('api_path' in l and 'api_path[5:]' in l):
        if start_idx is None:
            start_idx = i
    if start_idx and 'router_ip, router_port, api_path' in l:
        end_idx = i + 1

print(f'\nstart_idx={start_idx}, end_idx={end_idx}')

if start_idx is not None and end_idx is not None:
    lines = lines[:start_idx] + NEW + lines[end_idx:]
    print('OK: замінено ✅')
else:
    print('ERR: не знайдено')

print('\nПісля:')
s = max(0, (start_idx or 192) - 2)
for i, l in enumerate(lines[s:s+10], s+1):
    print(f'{i:4}: {repr(l)}')

with open('proxy.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)

r = subprocess.run(['python', '-m', 'py_compile', 'proxy.py'],
                   capture_output=True, text=True)
print('\nproxy.py:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:300])