# -*- coding: utf-8 -*-
import os

# Шукаємо в JS файлах
for fname in ['index.html', 'router-manager.js', 'rm-sections.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    for i, l in enumerate(lines, 1):
        if ('ua UA' in l or 'gb EN' in l or 'lang-btn' in l or
            'langBtn' in l or 'setLang' in l):
            print(f'{fname}:{i}: {l.rstrip()[:120]}')