# -*- coding: utf-8 -*-
with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Знаходимо блок з мовами UA EN PL DE
print('=== Блок мови ===')
for i, l in enumerate(lines, 1):
    if 'UA' in l or 'EN' in l or 'lang' in l.lower() or 'language' in l.lower():
        if 'script' not in l.lower():
            print(f'{i}: {l.rstrip()[:120]}')

# Знаходимо sc-trigger
print('\n=== sc-trigger ===')
for i, l in enumerate(lines, 1):
    if 'sc-trigger' in l:
        print(f'{i}: {l.rstrip()[:120]}')