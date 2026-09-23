# -*- coding: utf-8 -*-
with open('proxy.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f'proxy.py: {len(lines)} рядків')

# Знаходимо endpoints які він обробляє
print('\n=== Endpoints ===')
import re
for i, l in enumerate(lines, 1):
    if re.search(r"'/(ssh|rest|api|router)', |/ssh|/rest|route\(|@app\.", l):
        print(f'{i}: {l.rstrip()[:120]}')

# Знаходимо SSH логіку
print('\n=== SSH логіка ===')
for i, l in enumerate(lines, 1):
    if 'paramiko' in l or 'ssh' in l.lower() or 'SSHClient' in l:
        print(f'{i}: {l.rstrip()[:120]}')

# Знаходимо REST/HTTP логіку
print('\n=== REST/HTTP логіка ===')
for i, l in enumerate(lines, 1):
    if 'requests' in l or 'urllib' in l or 'http' in l.lower():
        print(f'{i}: {l.rstrip()[:120]}')

# Перші 30 рядків
print('\n=== Початок файлу ===')
for i, l in enumerate(lines[:30], 1):
    print(f'{i}: {l.rstrip()[:120]}')