# -*- coding: utf-8 -*-
with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f'index.html: {len(lines)} рядків')

# Знаходимо AI панель в HTML
print('\n=== AI панель HTML структура ===')
for i, l in enumerate(lines, 1):
    if ('ai-panel' in l or 'ai-btn' in l or 'ai-chat' in l or
        'ai-input' in l or 'ai-prov' in l or 'ai-key' in l or
        'ai-send' in l or 'chatBox' in l or 'ai-overlay' in l):
        print(f'{i}: {l.rstrip()[:120]}')

# Знаходимо JS функції AI
print('\n=== AI JS функції ===')
for i, l in enumerate(lines, 1):
    if ('function callAI' in l or 'function sendAI' in l or
        'function renderAI' in l or 'function openAI' in l or
        'function closeAI' in l or 'function toggleAI' in l or
        'window.callAI' in l or 'AI_COMPAT' in l):
        print(f'{i}: {l.rstrip()[:120]}')