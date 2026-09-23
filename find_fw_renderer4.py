# -*- coding: utf-8 -*-
with open('router-manager-crud.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print('=== rmCrudFWFilter (рядки 585-680) ===')
for i, l in enumerate(lines[584:680], 585):
    print(f'{i}: {l.rstrip()[:120]}')