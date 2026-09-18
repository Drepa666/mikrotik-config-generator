# -*- coding: utf-8 -*-
import re

with open('router-manager.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Шукаємо MENU масив і topology
idx = content.find('MENU')
print(f'MENU @ {idx}:')
print(content[idx:idx+800])
print('---')

# Шукаємо topology
for needle in ['topology', 'Topology', 'topo', 'neighbor']:
    idx2 = content.find(needle)
    if idx2 > 0:
        print(f'"{needle}" @ {idx2}:')
        print(content[max(0,idx2-50):idx2+150])
        print('---')