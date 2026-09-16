# -*- coding: utf-8 -*-
import subprocess

with open('diff-apply.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Знаходимо da-diff-output і показуємо точний стиль
idx = content.find('id="da-diff-output"')
print(repr(content[idx:idx+250]))