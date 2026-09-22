# -*- coding: utf-8 -*-
import subprocess

# ════════════════════════════════════
# 1. Читаємо topology-extend.js — знаходимо getMacVendor
# ════════════════════════════════════
with open('topology-extend.js', 'r', encoding='utf-8') as f:
    te = f.read()

# Знаходимо getMacVendor повністю
idx = te.find('function getMacVendor')
depth = 0; found = False; end = idx
for i, ch in enumerate(te[idx:], idx):
    if ch == '{': depth += 1; found = True
    elif ch == '}': depth -= 1
    if found and depth == 0: end = i + 1; break

print('getMacVendor:')
print(repr(te[idx:end][:300]))

# Знаходимо _vendorCache і OUI базу
idx2 = te.find('_vendorCache')
print(f'\n_vendorCache @ {idx2}:')
print(repr(te[max(0,idx2-200):idx2+100]))

# Знаходимо де vendor підставляється в node
for kw in ['detail-vendor', 'getMacVendor', 'vendor']:
    i = te.find(kw, idx + 1)
    if i > 0:
        print(f'\n"{kw}" @ {i}:')
        print(repr(te[max(0,i-50):i+150]))
        break

# ════════════════════════════════════
# 2. Читаємо topology-visual.js — де vendor відображається
# ════════════════════════════════════
with open('topology-visual.js', 'r', encoding='utf-8') as f:
    tv = f.read()

idx3 = tv.find('detail-vendor')
print(f'\ntopology-visual detail-vendor @ {idx3}:')
print(repr(tv[max(0,idx3-100):idx3+300]))

# Де викликається getMacVendor або vendor заповнюється
for kw in ['getMacVendor', 'vendor', 'Невідомий', 'Unknown']:
    i = tv.find(kw)
    if i > 0:
        print(f'\ntopology-visual "{kw}" @ {i}:')
        print(repr(tv[i:i+200]))
        break