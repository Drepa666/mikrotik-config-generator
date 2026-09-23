# -*- coding: utf-8 -*-
with open('main.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Показуємо ai-request handler повністю
print('=== ai-request handler ===')
start = None
for i, l in enumerate(lines, 1):
    if "ipcMain.handle('ai-request'" in l:
        start = i
    if start and i >= start:
        print(f'{i}: {l.rstrip()[:120]}')
        if i > start and l.strip() == '});':
            break

# Як index.html викликає AI
print('\n=== index.html AI виклик ===')
with open('index.html', 'r', encoding='utf-8') as f:
    idx_lines = f.readlines()
for i, l in enumerate(idx_lines, 1):
    if 'aiRequest' in l or 'ai-request' in l or 'provider' in l.lower():
        if 'gemini' in l.lower() or 'aiRequest' in l or 'provider' in l:
            print(f'{i}: {l.rstrip()[:120]}')