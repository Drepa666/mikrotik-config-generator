# -*- coding: utf-8 -*-
with open('router-manager.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Знаходимо rmCrudFWFilter
print('=== rmCrudFWFilter ===')
start = None
for i, l in enumerate(lines, 1):
    if 'rmCrudFWFilter' in l or 'CrudFWFilter' in l:
        print(f'{i}: {l.rstrip()[:120]}')
        if 'function' in l or '= function' in l:
            start = i

# Також шукаємо в router-manager-crud.js
import os
if os.path.exists('router-manager-crud.js'):
    with open('router-manager-crud.js', 'r', encoding='utf-8') as f:
        lines2 = f.readlines()
    print(f'\n=== router-manager-crud.js: {len(lines2)} рядків ===')
    for i, l in enumerate(lines2, 1):
        if 'FWFilter' in l or 'fw-filter' in l or 'firewall/filter' in l:
            print(f'{i}: {l.rstrip()[:120]}')