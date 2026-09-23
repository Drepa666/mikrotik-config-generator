# -*- coding: utf-8 -*-
# ТІЛЬКИ ЧИТАЄМО

with open('router-manager-crud.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Показуємо renderRows повністю
print('=== renderRows (рядки 305-420) ===')
for i, l in enumerate(lines[304:420], 305):
    print(f'{i}: {l}', end='')

# Показуємо як викликається renderTableCRUD
print('\n\n=== renderTableCRUD виклики (перші 5) ===')
found = 0
for i, l in enumerate(lines, 1):
    if 'renderTableCRUD' in l and 'function' not in l:
        print(f'{i}: {l}', end='')
        found += 1
        if found >= 5:
            break

# Показуємо структуру таблиці що генерується
print('\n\n=== Структура HTML таблиці ===')
for i, l in enumerate(lines, 1):
    if '<table' in l or '<thead' in l or '<th' in l or '<tr' in l:
        print(f'{i}: {l.strip()[:100]}')
        if i > 400:
            break