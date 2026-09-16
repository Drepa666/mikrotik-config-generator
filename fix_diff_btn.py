# -*- coding: utf-8 -*-
import subprocess

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Знаходимо де кнопки Версії і Масовий Deploy
idx = content.find('Масовий Deploy')
print(f'Масовий Deploy @ {idx}')
print(content[max(0,idx-100):idx+200])