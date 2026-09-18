# -*- coding: utf-8 -*-
import subprocess

with open('network-scanner.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Знаходимо другий чекбокс (@ 3984) і видаляємо його блок
idx = content.find('ns-online-only', 3700)  # шукаємо після першого
print(f'Другий чекбокс @ {idx}')

# Знаходимо початок label
start = content.rfind("'<label", 0, idx)
# Знаходимо кінець label блоку
end = content.find("</label>' +", idx) + len("</label>' +")
print(f'Блок: {start}-{end}')
print('Видаляємо:', repr(content[start:end]))

content = content[:start] + content[end:]
print('OK: дублікат видалено ✅')

with open('network-scanner.js', 'w', encoding='utf-8') as f:
    f.write(content)

r = subprocess.run(['node', '--check', 'network-scanner.js'],
                   capture_output=True, text=True)
print('Синтаксис:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:200])