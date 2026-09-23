# -*- coding: utf-8 -*-
import os

# Читаємо ai-agent-ui.js
with open('ai-agent/ai-agent-ui.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f'ai-agent-ui.js: {len(lines)} рядків')

# Знаходимо структуру панелі — таби, кнопки
print('\n=== Таби і секції ===')
for i, l in enumerate(lines, 1):
    if ('tab' in l.lower() or 'panel' in l.lower() or
        'section' in l.lower() or 'btn' in l.lower()):
        if any(x in l for x in ['id=', 'data-', 'class=', 'innerHTML', 'function ']):
            print(f'{i}: {l.rstrip()[:120]}')

# Перші 80 рядків — структура
print('\n=== Початок файлу ===')
for i, l in enumerate(lines[:80], 1):
    print(f'{i}: {l.rstrip()[:120]}')