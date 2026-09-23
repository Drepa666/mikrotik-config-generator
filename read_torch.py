# -*- coding: utf-8 -*-
import os

# Знаходимо Traffic Monitor
with open('router-manager.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print('=== Traffic Monitor ===')
for i, l in enumerate(lines, 1):
    if 'traffic' in l.lower() or 'torch' in l.lower() or 'rmSectionTraffic' in l:
        print(f'{i}: {l.rstrip()[:100]}')

# Знаходимо в rm-sections.js
for fname in ['rm-sections.js', 'rm-sections-extra.js']:
    if not os.path.exists(fname): continue
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'traffic' in content.lower() or 'torch' in content.lower():
        print(f'\n=== {fname} ===')
        for i, l in enumerate(content.split('\n'), 1):
            if 'traffic' in l.lower() or 'torch' in l.lower():
                print(f'{i}: {l.rstrip()[:100]}')