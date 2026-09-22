# -*- coding: utf-8 -*-
import subprocess, tempfile, os

with open('main.js', 'r', encoding='utf-8') as f:
    mj = f.read()
mj = mj.replace('\r\n', '\n')

# КРОК 1: Показуємо ТОЧНИЙ текст finalize
idx = mj.find('function finalize')
print('ТОЧНИЙ finalize:')
print(repr(mj[idx:idx+400]))