# -*- coding: utf-8 -*-
with open('rm-sections.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Знаходимо що рендерить Firewall Filter з checkbox
print('=== rmSectionFirewall або Filter Rules ===')
for i, l in enumerate(lines, 1):
    if ('Filter Rules' in l or 'filter-rules' in l or
        'rmSectionFirewall' in l or 'fwFilter' in l):
        print(f'{i}: {l.rstrip()[:120]}')

# Показуємо рядки 975-1050
print('\n=== Рядки 975-1050 ===')
for i, l in enumerate(lines[974:1050], 975):
    print(f'{i}: {l.rstrip()[:120]}')