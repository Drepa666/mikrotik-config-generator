# -*- coding: utf-8 -*-
with open('rm-sections.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Знаходимо renderFWRuleTable
print('=== renderFWRuleTable ===')
start = None
for i, l in enumerate(lines, 1):
    if 'function renderFWRuleTable' in l:
        start = i
    if start and i >= start:
        print(f'{i}: {l.rstrip()[:120]}')
        if i > start + 2 and l.strip() == '}':
            break