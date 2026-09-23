# -*- coding: utf-8 -*-
with open('router-manager.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Показуємо рядки 460-620
print('=== Sidebar структура (460-620) ===')
for i, l in enumerate(lines[459:620], 460):
    print(f'{i}: {l.rstrip()[:120]}')