# -*- coding: utf-8 -*-
import re, subprocess

with open('router-manager.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Знаходимо restCall
idx = content.find('function restCall')
if idx < 0:
    idx = content.find('restCall')
print('restCall контекст:')
print(content[idx:idx+600])