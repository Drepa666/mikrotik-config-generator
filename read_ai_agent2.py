# -*- coding: utf-8 -*-
with open('ai-agent/ai-agent-ui.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Знаходимо quick buttons і send функцію
print('=== Рядки 260-360 ===')
for i, l in enumerate(lines[259:360], 260):
    print(f'{i}: {l.rstrip()[:120]}')