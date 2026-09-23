# -*- coding: utf-8 -*-
with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Показуємо як index.html викликає aiRequest
print('=== index.html aiRequest виклик (рядки 1500-1600) ===')
for i, l in enumerate(lines[1499:1600], 1500):
    print(f'{i}: {l.rstrip()[:120]}')