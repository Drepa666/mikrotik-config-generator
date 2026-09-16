# -*- coding: utf-8 -*-
import re, subprocess

with open('diff-apply.js', 'r', encoding='utf-8') as f:
    content = f.read()

# ── Діагностика ──
print('=== Аналіз diff-apply.js ===')
print(f'Розмір: {len(content)} символів')

# Знаходимо ключові елементи
for needle in ['config-a', 'config-b', 'confA', 'confB', 'textA', 'textB',
               'Порівняти', 'compare', 'doDiff', 'runDiff', 'addEventListener']:
    idx = content.find(needle)
    if idx > 0:
        print(f'  "{needle}" @ {idx}: ...{content[max(0,idx-30):idx+60]}...')

print()

# Знаходимо всі функції
funcs = re.findall(r'function\s+(\w+)\s*\(', content)
print('Функції:', funcs[:20])