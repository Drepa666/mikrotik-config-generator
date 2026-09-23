# -*- coding: utf-8 -*-
with open('rm-sections.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f'rm-sections.js: {len(lines)} рядків')

# Знаходимо firewall filter секцію
print('\n=== Firewall Filter функції ===')
for i, l in enumerate(lines, 1):
    if ('fwFilter' in l or 'FWFilter' in l or
        'firewall/filter' in l or 'fw-filter' in l or
        'rmCrud' in l and 'filter' in l.lower()):
        print(f'{i}: {l.rstrip()[:120]}')

# Знаходимо renderTableCRUD виклик для filter
print('\n=== renderTableCRUD для filter ===')
for i, l in enumerate(lines, 1):
    if 'renderTableCRUD' in l or 'fwFilter' in l:
        print(f'{i}: {l.rstrip()[:120]}')