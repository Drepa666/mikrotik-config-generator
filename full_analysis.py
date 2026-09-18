# -*- coding: utf-8 -*-
import re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

print('=' * 60)
print('FULL ANALYSIS')
print('=' * 60)

# electron-bridge.js
print('\n=== electron-bridge.js ===')
with open('electron-bridge.js', 'r', encoding='utf-8') as f:
    eb = f.read()
print(f'Size: {len(eb)}')
for m in re.finditer(r'window\.\w+\s*=', eb):
    print(f'  window.* @ {m.start()}: {eb[m.start():m.start()+60]}')
for needle in ['callAI', 'groqChat', 'ipcRenderer', 'contextBridge']:
    idx = eb.find(needle)
    if idx >= 0:
        print(f'  [{needle}] @ {idx}: {eb[max(0,idx-10):idx+80]}')

# preload.js
print('\n=== preload.js ===')
with open('preload.js', 'r', encoding='utf-8') as f:
    pl = f.read()
print(pl)

# main.js AI
print('\n=== main.js AI handlers ===')
with open('main.js', 'r', encoding='utf-8') as f:
    mj = f.read()
for needle in ['callAI', 'groq', 'ipcMain.handle', 'ipcMain.on']:
    idx = 0
    while True:
        idx = mj.find(needle, idx)
        if idx < 0: break
        print(f'  [{needle}] @ {idx}: {mj[idx:idx+100]}')
        idx += 1

# diff-apply.js
print('\n=== diff-apply.js FUNCTIONS ===')
with open('diff-apply.js', 'r', encoding='utf-8') as f:
    da = f.read()
print(f'Size: {len(da)}')

for m in re.finditer(r'function\s+(\w+)\s*\(', da):
    print(f'  function {m.group(1)} @ {m.start()}')

print('\n=== IIFE structure ===')
for m in re.finditer(r'\(function\s*\(\)\s*\{', da):
    s = m.start()
    depth = 0; found = False; e = s
    for i, ch in enumerate(da[s:], s):
        if ch == '{': depth += 1; found = True
        elif ch == '}': depth -= 1
        if found and depth == 0: e = i+1; break
    inside_fns = re.findall(r'function\s+(\w+)\s*\(', da[s:e])
    print(f'  IIFE {s}-{e}: {inside_fns}')

print('\n=== window.* in diff-apply ===')
for m in re.finditer(r'window\.\w+\s*=', da):
    print(f'  {da[m.start():m.start()+60]} @ {m.start()}')

print('\n=== runDiffAI function ===')
idx = da.find('function runDiffAI')
if idx >= 0:
    depth = 0; found = False; end = idx
    for i, ch in enumerate(da[idx:], idx):
        if ch == '{': depth += 1; found = True
        elif ch == '}': depth -= 1
        if found and depth == 0: end = i+1; break
    print(da[idx:end])

print('\n=== diffLines merge ===')
idx = da.find('/* Групуємо')
if idx < 0: idx = da.find('var pairs')
print(da[max(0,idx-20):idx+600])