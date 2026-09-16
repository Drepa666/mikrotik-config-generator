# -*- coding: utf-8 -*-
import subprocess

with open('proxy.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Знаходимо рядок з target_url
for i, line in enumerate(lines):
    if 'target_url' in line and '/rest{}' in line:
        print(f'Знайдено на рядку {i+1}: {line.rstrip()}')
        # Дивимось відступ
        indent = len(line) - len(line.lstrip())
        sp = ' ' * indent
        print(f'Відступ: {indent} пробілів')

        # Замінюємо цей рядок на правильний
        lines[i] = (
            sp + 'api_path = path[5:] if path.startswith("/rest") else path\n' +
            sp + 'qs = full_path.split("?",1)[1] if "?" in full_path else ""\n' +
            sp + 'target_url = "http://{}:{}/rest{}{}".format(\n' +
            sp + '    router_ip, router_port, api_path, ("?"+qs) if qs else "")\n'
        )
        print('OK: замінено ✅')
        break

with open('proxy.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)

r = subprocess.run(['python', '-m', 'py_compile', 'proxy.py'],
                   capture_output=True, text=True)
print('proxy.py:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:300])