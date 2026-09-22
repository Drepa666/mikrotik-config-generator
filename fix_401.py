# -*- coding: utf-8 -*-
import subprocess

with open('ai-agent/ros-adapter.js', 'r', encoding='utf-8') as f:
    adapter = f.read()

# Знаходимо де робляться restCall і перевіряємо
idx = adapter.find('window.restCall(router,')
print(f'restCall @ {idx}:')
print(repr(adapter[max(0,idx-100):idx+200]))