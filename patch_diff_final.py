# -*- coding: utf-8 -*-
import subprocess

with open('diff-apply.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Знаходимо renderDiffVisual і показуємо повністю
idx = content.find('function renderDiffVisual')
print(content[idx:idx+2000])