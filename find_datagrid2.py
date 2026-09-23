# -*- coding: utf-8 -*-
with open('rm-datagrid.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print('=== Drag-drop код (595-697) ===')
for i, l in enumerate(lines[594:], 595):
    print(f'{i}: {l.rstrip()[:120]}')