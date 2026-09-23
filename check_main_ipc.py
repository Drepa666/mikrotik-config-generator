# -*- coding: utf-8 -*-
with open('main.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f'main.js: {len(lines)} рядків')

# Знаходимо всі ipcMain.handle
print('\n=== ipcMain.handle ===')
for i, l in enumerate(lines, 1):
    if 'ipcMain.handle' in l:
        print(f'{i}: {l.rstrip()[:80]}')

# Знаходимо router-rest
print('\n=== router-rest ===')
for i, l in enumerate(lines, 1):
    if 'router-rest' in l or 'router-ssh' in l:
        print(f'{i}: {l.rstrip()[:80]}')

# Знаходимо ssh2
print('\n=== ssh2 ===')
for i, l in enumerate(lines, 1):
    if 'ssh2' in l:
        print(f'{i}: {l.rstrip()[:80]}')