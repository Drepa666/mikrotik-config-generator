# -*- coding: utf-8 -*-
import os

# Знаходимо існуючий AI код
for fname in ['router-manager.js', 'index.html', 'main.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'gemini' in content.lower() or 'ai-request' in content.lower():
        print(f'\n=== {fname} ===')
        for i, l in enumerate(content.split('\n'), 1):
            if 'gemini' in l.lower() or 'ai-request' in l or 'aiRequest' in l:
                print(f'{i}: {l.strip()[:100]}')

# Знаходимо AI кнопку
for fname in os.listdir('.'):
    if not fname.endswith('.js'): continue
    with open(fname, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    if 'gemini' in content.lower() and fname != 'router-manager.js':
        print(f'\n=== {fname} (AI) ===')
        for i, l in enumerate(content.split('\n'), 1):
            if 'gemini' in l.lower() or 'apiKey' in l or 'model' in l.lower():
                print(f'{i}: {l.strip()[:100]}')