# -*- coding: utf-8 -*-
# ТІЛЬКИ ЧИТАЄМО

import os, re

files = [
    'router-manager-crud.js',
    'rm-sections.js',
    'rm-sections-extra.js',
    'router-manager.js',
]

for fname in files:
    if not os.path.exists(fname):
        continue
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()
    lines = content.split('\n')
    print(f'\n{"="*50}')
    print(f'{fname} ({len(lines)} рядків)')
    print('='*50)

    # Знаходимо функції рендеру таблиць
    print('\n--- Функції рендеру ---')
    for i, l in enumerate(lines, 1):
        if re.search(r'function\s+(render|build|draw|make)(Table|Row|Grid|List|Crud)', l, re.I):
            print(f'  {i}: {l.strip()}')

    # Знаходимо tbody
    print('\n--- tbody записів ---')
    count = content.count('tbody')
    print(f'  tbody: {count}x')

    # Знаходимо renderTableCRUD
    count2 = content.count('renderTableCRUD')
    print(f'  renderTableCRUD: {count2}x')

    # Перші 5 рядків де є Edit/Delete кнопки
    print('\n--- Edit/Delete кнопки ---')
    found = 0
    for i, l in enumerate(lines, 1):
        if ('edit' in l.lower() or 'delete' in l.lower()) and '<button' in l.lower():
            print(f'  {i}: {l.strip()[:80]}')
            found += 1
            if found >= 3:
                break

    # Знаходимо sort/drag/multiselect
    print('\n--- Існуючі функції ---')
    for kw in ['sort', 'drag', 'multiselect', 'select', 'checkbox', 'context']:
        c = len(re.findall(kw, content, re.I))
        if c > 0:
            print(f'  {kw}: {c}x')