# -*- coding: utf-8 -*-
with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Знаходимо AI floating кнопку і панель
print('=== AI floating панель ===')
for i, l in enumerate(lines, 1):
    if ('ai-float' in l or 'ai-overlay' in l or 'ai-window' in l or
        'ai-chat-panel' in l or 'chatBox' in l or
        'btn-ai-chat' in l or 'ai-toggle' in l or
        'ai-bubble' in l or 'floating' in l.lower()):
        print(f'{i}: {l.rstrip()[:120]}')

# Знаходимо фіолетову кнопку AI
print('\n=== Кнопка AI (пурпурна) ===')
for i, l in enumerate(lines, 1):
    if ('purple' in l or '#9b59' in l or 'robot' in l or
        '🤖' in l or 'copilot' in l.lower() or
        'fixed' in l and 'bottom' in l and 'right' in l):
        print(f'{i}: {l.rstrip()[:120]}')