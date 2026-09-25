# -*- coding: utf-8 -*-
with open('ai-agent/ai-agent-ui.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Знаходимо executeCmd
print('=== executeCmd ===')
start = None
for i, l in enumerate(lines, 1):
    if 'executeCmd' in l and 'function' in l or 'AIAgentUI.executeCmd' in l:
        start = i
    if start and i >= start:
        print(f'{i}: {l.rstrip()[:120]}')
        if i > start + 3 and '};' in l.strip():
            break

# Знаходимо system prompt рядок 14 в core.js
print('\n=== systemPrompt (рядки 10-40) ===')
with open('ai-agent/ai-agent-core.js', 'r', encoding='utf-8') as f:
    clines = f.readlines()
for i, l in enumerate(clines[9:60], 10):
    print(f'{i}: {l.rstrip()[:120]}')