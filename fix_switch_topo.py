# -*- coding: utf-8 -*-
import subprocess, os

# ════════════════════════════════════
# 1. Знаходимо backend server
# ════════════════════════════════════
print('=== BACKEND ===')
for fname in ['server.js', 'proxy.js', 'backend.js', 'main.js',
              'electron-main.js', 'index.js']:
    if os.path.exists(fname):
        size = os.path.getsize(fname)
        with open(fname, encoding='utf-8', errors='ignore') as f:
            c = f.read()
        # Шукаємо де є express/http routes
        for kw in ['app.post', 'app.get', 'createServer', '/rest/', '/ssh/']:
            if kw in c:
                idx = c.find(kw)
                print(f'\n{fname} ({size}b) — "{kw}" @ {idx}:')
                print(repr(c[idx:idx+120]))
                break

# Шукаємо в підпапках
for root, dirs, files in os.walk('.'):
    if any(x in root for x in ['node_modules','dist','.git']): continue
    for f in files:
        if f in ['server.js','proxy.js','backend.js']:
            path = os.path.join(root, f)
            size = os.path.getsize(path)
            with open(path, encoding='utf-8', errors='ignore') as fh:
                c = fh.read()
            if 'app.post' in c or 'createServer' in c:
                print(f'\nЗнайдено: {path} ({size}b)')
                idx = c.find('app.post')
                if idx < 0: idx = c.find('createServer')
                print(repr(c[idx:idx+200]))