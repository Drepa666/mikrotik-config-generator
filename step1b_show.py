# -*- coding: utf-8 -*-
# ТІЛЬКИ ЧИТАЄМО — нічого не змінюємо

with open('ai-agent/switch-scanner.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print('Рядки 328-360:')
for i, l in enumerate(lines[327:360], 328):
    print(f'  {i}: {repr(l)}')