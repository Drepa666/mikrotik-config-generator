# -*- coding: utf-8 -*-
import subprocess

with open('ai-agent/ai-agent-core.js', 'r', encoding='utf-8') as f:
    core = f.read()

idx = core.find('systemPrompt:')
depth = 0; found = False; end = idx
for i, ch in enumerate(core[idx:], idx):
    if ch == '`': 
        if not found: found = True
        else: end = i + 1; break

print(f'systemPrompt: {idx}-{end}')
print(repr(core[idx:end]))