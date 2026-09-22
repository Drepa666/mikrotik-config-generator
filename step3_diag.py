# -*- coding: utf-8 -*-
# ТІЛЬКИ ЧИТАЄМО

with open('topology-visual.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f'Рядків: {len(lines)}')

# Знаходимо де оголошені nodes і links
print('\n--- var nodes / var links ---')
for i, l in enumerate(lines, 1):
    if ('var nodes' in l or 'var links' in l) and 'filter' not in l:
        print(f'  {i}: {repr(l)}')

# Знаходимо buildSwitchTopology — перші 5 рядків
print('\n--- buildSwitchTopology ---')
for i, l in enumerate(lines, 1):
    if 'function buildSwitchTopology' in l:
        print(f'Початок @ {i}:')
        for j, ll in enumerate(lines[i-1:i+10], i):
            print(f'  {j}: {repr(ll)}')
        break

# Знаходимо runSwitchScanStart
print('\n--- runSwitchScanStart ---')
for i, l in enumerate(lines, 1):
    if 'function runSwitchScanStart' in l:
        print(f'Початок @ {i}:')
        for j, ll in enumerate(lines[i-1:i+5], i):
            print(f'  {j}: {repr(ll)}')
        break

# Показуємо кінець файлу
print('\n--- Кінець файлу (рядки -10) ---')
for i, l in enumerate(lines[-10:], len(lines)-9):
    print(f'  {i}: {repr(l)}')