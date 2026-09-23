# -*- coding: utf-8 -*-
with open('router-manager.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Знаходимо як будується sidebar меню
print('=== Sidebar/menu рядки ===')
for i, l in enumerate(lines, 1):
    if ('rm-nav' in l or 'rm-menu' in l or 'sidebar' in l.lower() or
        'Filter Rules' in l or 'nav-item' in l or 'data-section' in l or
        'renderSection' in l or 'showSection' in l or 'loadSection' in l):
        print(f'{i}: {l.rstrip()[:120]}')