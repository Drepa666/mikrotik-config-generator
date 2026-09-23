# -*- coding: utf-8 -*-
with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Знаходимо де відкривається AI панель — кнопка і overlay
print('=== AI кнопка і панель (350-450) ===')
for i, l in enumerate(lines[349:500], 350):
    print(f'{i}: {l.rstrip()[:120]}')