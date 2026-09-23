# -*- coding: utf-8 -*-
with open('preload.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f'preload.js: {len(lines)} рядків')
print('\n=== Весь файл ===')
for i, l in enumerate(lines, 1):
    print(f'{i}: {l.rstrip()[:120]}')