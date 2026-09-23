# -*- coding: utf-8 -*-
with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Знаходимо всі fixed кнопки
print('=== Всі fixed кнопки ===')
for i, l in enumerate(lines, 1):
    if 'position:fixed' in l or 'position: fixed' in l:
        print(f'{i}: {l.rstrip()[:120]}')

# Знаходимо AI chat панель
print('\n=== Рядки 6330-6440 (кінець файлу) ===')
for i, l in enumerate(lines[6329:], 6330):
    print(f'{i}: {l.rstrip()[:120]}')