# -*- coding: utf-8 -*-
# ТІЛЬКИ ЧИТАЄМО — НІЧОГО НЕ ЗМІНЮЄМО
import subprocess, os, re

print('=' * 60)
print('ДІАГНОСТИКА — тільки читання, жодних змін')
print('=' * 60)

# ════════════════════════════════════
# 1. Синтаксис всіх ключових файлів
# ════════════════════════════════════
print('\n--- Синтаксис файлів ---')
files = [
    'router-manager.js',
    'topology-visual.js',
    'topology-extend.js',
    'ai-agent/switch-scanner.js',
    'ai-agent/oui-lookup.js',
    'preload.js',
    'main.js',
    'index.html',
    'switch-topology.js',
]
for f in files:
    if not os.path.exists(f):
        print(f'  MISSING: {f}')
        continue
    size = os.path.getsize(f)
    if f.endswith('.js'):
        r = subprocess.run(['node','--check', f], capture_output=True, text=True)
        status = 'OK' if r.returncode == 0 else 'BROKEN'
        err = '' if r.returncode == 0 else ' | ' + r.stderr.split('\n')[1].strip()[:60]
        print(f'  {status:6s} {f:45s} {size:7d}b{err}')
    else:
        print(f'  OK     {f:45s} {size:7d}b')

# ════════════════════════════════════
# 2. index.html — порядок скриптів
# ════════════════════════════════════
print('\n--- Порядок скриптів в index.html ---')
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

scripts = re.findall(r'<script[^>]*src=["\']([^"\']+)["\']', html)
for i, s in enumerate(scripts):
    print(f'  {i+1:2d}. {s}')

# ════════════════════════════════════
# 3. router-manager.js — що зламалось
# ════════════════════════════════════
print('\n--- router-manager.js ---')
if os.path.exists('router-manager.js'):
    with open('router-manager.js', 'r', encoding='utf-8') as f:
        rm = f.read()
    print(f'  Розмір: {len(rm)} символів')
    print(f'  buildSkeleton:    {"YES" if "buildSkeleton" in rm else "NO ❌"}')
    print(f'  rm-overlay:       {"YES" if "rm-overlay" in rm else "NO ❌"}')
    print(f'  rm-panel:         {"YES" if "rm-panel" in rm else "NO ❌"}')
    print(f'  openManager:      {"YES" if "openManager" in rm else "NO ❌"}')
    print(f'  RouterManager:    {"YES" if "window.RouterManager" in rm else "NO ❌"}')
    print(f'  SwitchScanner:    {"YES" if "SwitchScanner" in rm else "NO ❌"}')
    print(f'  buildScannerPanel:{"YES" if "buildScannerPanel" in rm else "NO ❌"}')
    print(f'  ss-panel:         {"YES" if "ss-panel" in rm else "NO ❌"}')

    # Знаходимо де SwitchScanner викликається
    for kw in ['SwitchScanner._showTab', 'SwitchScanner.scan',
               'window.SwitchScanner']:
        idx = rm.find(kw)
        if idx > 0:
            print(f'\n  "{kw}" @ {idx}:')
            print(f'  {repr(rm[max(0,idx-30):idx+80])}')

# ════════════════════════════════════
# 4. Git — останні зміни router-manager.js
# ════════════════════════════════════
print('\n--- Git log router-manager.js (останні 10) ---')
r = subprocess.run(
    ['git','log','--oneline','-10','--','router-manager.js'],
    capture_output=True, text=True
)
print(r.stdout)

print('\n--- Git diff --stat HEAD~1 HEAD ---')
r2 = subprocess.run(
    ['git','diff','--stat','HEAD~1','HEAD'],
    capture_output=True, text=True
)
print(r2.stdout[:800])

# ════════════════════════════════════
# 5. switch-scanner.js — що там зараз
# ════════════════════════════════════
print('\n--- switch-scanner.js ключові місця ---')
if os.path.exists('ai-agent/switch-scanner.js'):
    with open('ai-agent/switch-scanner.js', 'r', encoding='utf-8') as f:
        sc = f.read()
    print(f'  Розмір: {len(sc)} символів')
    print(f'  hasDHCP кількість: {sc.count("hasDHCP")}')
    print(f'  hasConfirmed: {"YES" if "hasConfirmed" in sc else "NO ❌"}')
    print(f'  dotColor: {"YES" if "dotColor" in sc else "NO ❌"}')
    print(f'  directScan: {"YES" if "directScan" in sc else "NO ❌"}')

    # Показуємо весь блок dotColor
    m = re.search(r'(var has\w+.*?var dotTitle[^\n]+)', sc, re.DOTALL)
    if m:
        print(f'\n  dotColor блок:')
        print(m.group())

# ════════════════════════════════════
# 6. topology-visual.js — draw функція
# ════════════════════════════════════
print('\n--- topology-visual.js ---')
if os.path.exists('topology-visual.js'):
    with open('topology-visual.js', 'r', encoding='utf-8') as f:
        tv = f.read()
    print(f'  Розмір: {len(tv)} символів')
    print(f'  function draw:      {"YES" if "function draw()" in tv else "NO ❌"}')
    print(f'  runSwitchScan:      {"YES" if "function runSwitchScan" in tv else "NO ❌"}')
    print(f'  draw() in scanFn:   {"YES" if "draw();" in tv[tv.find("runSwitchScan"):] else "NO ❌"}')
    print(f'  electronAPI.direct: {"YES" if "electronAPI.directScan" in tv else "NO ❌"}')

    # Перші 5 рядків runSwitchScan
    idx = tv.find('function runSwitchScan')
    if idx > 0:
        print(f'\n  runSwitchScan початок:')
        print(repr(tv[idx:idx+200]))

print('\n' + '=' * 60)
print('ДІАГНОСТИКА ЗАВЕРШЕНА — нічого не змінено')
print('=' * 60)