# -*- coding: utf-8 -*-
# ТІЛЬКИ ЧИТАЄМО

with open('topology-visual.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f'Рядків: {len(lines)}')

# Знаходимо кнопку Switch Scan
for i, l in enumerate(lines, 1):
    if 'switch-scan' in l.lower() or 'switchscan' in l.lower():
        print(f'  {i}: {repr(l)}')

# Знаходимо runSwitchScan
print('\nrunSwitchScan:')
for i, l in enumerate(lines, 1):
    if 'runSwitchScan' in l:
        print(f'  {i}: {repr(l)}')

# Знаходимо electronAPI.directScan
print('\nelectronAPI.directScan:')
for i, l in enumerate(lines, 1):
    if 'directScan' in l:
        print(f'  {i}: {repr(l)}')

# Знаходимо draw()
print('\ndraw():')
for i, l in enumerate(lines, 1):
    if 'function draw(' in l or ('draw()' in l and 'runSwitch' in ''.join(lines[max(0,i-50):i+50])):
        print(f'  {i}: {repr(l)}')