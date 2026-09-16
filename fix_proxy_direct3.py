# -*- coding: utf-8 -*-
import subprocess

with open('proxy.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Показуємо рядки 195-210
print('Контекст рядки 195-210:')
for i, l in enumerate(lines[194:212], 195):
    print(f'{i:4}: {repr(l)}')