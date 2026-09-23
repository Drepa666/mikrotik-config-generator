# -*- coding: utf-8 -*-
import os

# Знаходимо всі restCall виклики — які endpoints вже є
with open('router-manager.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print('=== restCall endpoints в router-manager.js ===')
import re
for i, l in enumerate(lines, 1):
    m = re.search(r"restCall\s*\([^,]+,\s*'[A-Z]+',\s*'([^']+)'", l)
    if m:
        print(f'  {i}: {m.group(1)}')

# Знаходимо sshCall
print('\n=== sshCall команди ===')
for i, l in enumerate(lines, 1):
    m = re.search(r"sshCall\s*\([^,]+,\s*'([^']+)'", l)
    if m:
        print(f'  {i}: {m.group(1)[:60]}')

# Знаходимо існуючий Ctrl+F
print('\n=== Ctrl+F / search ===')
for i, l in enumerate(lines, 1):
    if 'ctrlKey' in l or 'key.*f' in l.lower() or 'search' in l.lower():
        if 'keydown' in l or 'ctrl' in l.lower():
            print(f'  {i}: {l.strip()[:80]}')