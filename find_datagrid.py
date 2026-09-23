# -*- coding: utf-8 -*-
with open('rm-datagrid.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f'rm-datagrid.js: {len(lines)} рядків')

# Знаходимо де рендеряться рядки таблиці
print('\n=== tbody / row render ===')
for i, l in enumerate(lines, 1):
    if ('tbody' in l or '<tr' in l or 'draggable' in l or
        'canMove' in l or 'canDrag' in l or 'row' in l.lower() and 'render' in l.lower()):
        print(f'{i}: {l.rstrip()[:120]}')

# Перші 60 рядків — структура
print('\n=== Початок (1-60) ===')
for i, l in enumerate(lines[:60], 1):
    print(f'{i}: {l.rstrip()[:120]}')