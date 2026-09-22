# -*- coding: utf-8 -*-

with open('ai-agent/switch-scanner.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# ARP ключ — як формується
print('Рядки 38-68 (ARP):')
for i, l in enumerate(lines[37:68], 38):
    print(f'  {i}: {repr(l)}')

# pingCheck — чи він перезаписує source?
print('\nРядки 215-260 (pingCheck):')
for i, l in enumerate(lines[214:260], 215):
    print(f'  {i}: {repr(l)}')