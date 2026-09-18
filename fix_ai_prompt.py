# -*- coding: utf-8 -*-
with open('router-manager.js', 'r', encoding='utf-8') as f:
    rm = f.read()

# Знаходимо runCommand
idx = rm.find('runCommand')
print('runCommand:')
print(repr(rm[max(0,idx-50):idx+600]))