# -*- coding: utf-8 -*-
with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Знаходимо AI chat/send кнопку
print('=== AI chat інтерфейс (4140-4400) ===')
for i, l in enumerate(lines[4139:4400], 4140):
    print(f'{i}: {l.rstrip()[:120]}')