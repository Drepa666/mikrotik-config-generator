# Дивимось як dashboard.js робить круглу кнопку
with open('dashboard.js', 'r', encoding='utf-8') as f:
    d = f.read()

import re
# Шукаємо fab блок
fab = re.search(r'(fab[\s\S]{0,500})', d)
if fab:
    print('=== FAB в dashboard.js ===')
    print(fab.group(0)[:400])

# Знаходимо SyntaxError в audit.js рядок 328
with open('audit.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print('\n=== audit.js рядки 320-335 ===')
for i, l in enumerate(lines[319:335], 320):
    print(f'{i}: {repr(l[:100])}')