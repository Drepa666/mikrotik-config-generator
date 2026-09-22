# -*- coding: utf-8 -*-
# ТІЛЬКИ ЧИТАЄМО

import os, re

# ════ 1. Знаходимо ЯКИЙ файл відповідає за фото 2 ════
print('=== Файли сканерів ===')
for fname in ['network-scanner.js', 'ai-agent/switch-scanner.js',
              'scan-cache.js', 'ip-scanner-plugin.js']:
    if os.path.exists(fname):
        with open(fname, encoding='utf-8') as f:
            c = f.read()
        size = len(c)
        has_oui   = 'OUILookup' in c
        has_vendor= 'vendor' in c
        has_render= 'renderTable' in c or 'tbody' in c
        has_scan  = 'Сканувати' in c or 'scan' in c.lower()
        print(f'\n{fname} ({size}b):')
        print(f'  OUILookup: {"YES" if has_oui else "NO ❌"}')
        print(f'  vendor:    {"YES" if has_vendor else "NO ❌"}')
        print(f'  renderTable/tbody: {"YES" if has_render else "NO ❌"}')
        print(f'  scan: {"YES" if has_scan else "NO ❌"}')
        if has_render and not has_oui:
            # Шукаємо де vendor виставляється
            idx = c.find('vendor')
            print(f'  vendor @ {idx}: {repr(c[idx:idx+80])}')

# ════ 2. switch-scanner.js — confirmed блок ЗАРАЗ ════
print('\n=== switch-scanner.js confirmed блок ===')
with open('ai-agent/switch-scanner.js', encoding='utf-8') as f:
    sc = f.read()

# Знаходимо ВЕСЬ блок confirmed
m = re.search(r'var _src.*?var confirmed.*?;', sc, re.DOTALL)
if m:
    print(repr(m.group()))
else:
    # Шукаємо інакше
    idx = sc.find('confirmed')
    print(f'confirmed @ {idx}: {repr(sc[max(0,idx-50):idx+150])}')

# ════ 3. Перевіряємо renderTable — чи там старий confirmed ════
print('\n=== renderTable confirmed check ===')
idx_rt = sc.find('renderTable: function')
chunk = sc[idx_rt:idx_rt+3000]
for m2 in re.finditer(r'confirmed|dotColor|_src', chunk):
    pos = m2.start() + idx_rt
    print(f'  @ {pos}: {repr(sc[max(0,pos-20):pos+60])}')

# ════ 4. network-scanner.js — як він рендерить vendor ════
print('\n=== network-scanner.js vendor/type ===')
if os.path.exists('network-scanner.js'):
    with open('network-scanner.js', encoding='utf-8') as f:
        ns = f.read()
    # Знаходимо де vendor виставляється
    for kw in ['vendor', 'OUILookup', 'lookup(', 'getDeviceType', 'Unknown']:
        idx = ns.find(kw)
        if idx > 0:
            print(f'  "{kw}" @ {idx}: {repr(ns[idx:idx+100])}')