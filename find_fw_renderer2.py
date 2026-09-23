# -*- coding: utf-8 -*-
import os

# Перевіряємо всі файли де є Firewall Filter rendering
for fname in ['rm-sections-extra.js', 'rm-datagrid.js', 'router-manager.js']:
    if not os.path.exists(fname): continue
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'firewall' in content.lower() or 'fwFilter' in content or 'Filter Rules' in content:
        print(f'\n=== {fname} ===')
        for i, l in enumerate(content.split('\n'), 1):
            if ('filter' in l.lower() and 'firewall' in l.lower() or
                'fwFilter' in l or 'Filter Rules' in l or
                'renderFW' in l or 'DataGrid' in l and 'filter' in l.lower()):
                print(f'{i}: {l.rstrip()[:120]}')