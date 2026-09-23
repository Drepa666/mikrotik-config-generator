# -*- coding: utf-8 -*-
# ТІЛЬКИ ЧИТАЄМО

import re

files = ['router-manager.js', 'rm-sections.js', 'router-manager-crud.js']

for fname in files:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Знаходимо sshCall визначення і використання
    if 'sshCall' in content:
        print(f'\n=== {fname} ===')
        lines = content.split('\n')
        for i, l in enumerate(lines, 1):
            if 'sshCall' in l:
                print(f'  {i}: {l.strip()[:100]}')

    # Знаходимо getActiveRouter
    if 'getActiveRouter' in content:
        print(f'\n--- getActiveRouter в {fname} ---')
        lines = content.split('\n')
        for i, l in enumerate(lines, 1):
            if 'getActiveRouter' in l:
                print(f'  {i}: {l.strip()[:100]}')
                break