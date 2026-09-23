# -*- coding: utf-8 -*-
with open('rm-datagrid.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Знаходимо enableDragDrop та renderTableCRUD
print('=== enableDragDrop ===')
start = None
for i, l in enumerate(lines, 1):
    if 'function enableDragDrop' in l:
        start = i
    if start and i >= start:
        print(f'{i}: {l.rstrip()[:120]}')
        if i > start + 3 and l.strip() == '}':
            start = None
            break

# Знаходимо renderTableCRUD
print('\n=== renderTableCRUD (пошук) ===')
with open('router-manager-crud.js', 'r', encoding='utf-8') as f:
    lines2 = f.readlines()
print(f'router-manager-crud.js: {len(lines2)} рядків')
for i, l in enumerate(lines2, 1):
    if 'renderTableCRUD' in l or 'canMove' in l or 'onMove' in l or 'data-idx' in l:
        print(f'{i}: {l.rstrip()[:120]}')