# -*- coding: utf-8 -*-
import subprocess, re

# ════════════════════════════════════
# 1. Діагностика topology-visual.js
# ════════════════════════════════════
with open('topology-visual.js', 'r', encoding='utf-8') as f:
    tv = f.read()

print('=== topology-visual.js ===')
print('runSwitchScan:', 'YES' if 'function runSwitchScan' in tv else 'NO ❌')
print('buildSwitchTopology:', 'YES' if 'function buildSwitchTopology' in tv else 'NO ❌')
print('topo-switch-scan-btn:', 'YES' if 'topo-switch-scan-btn' in tv else 'NO ❌')
print('Switch Scan handler:', 'YES' if '_ssBtnEl' in tv or 'topo-switch-scan-btn' in tv else 'NO ❌')
print('redraw function:', 'YES' if 'function redraw' in tv else 'NO ❌')
print('electronAPI:', 'YES' if 'electronAPI' in tv else 'NO ❌')

# Де handler кнопки?
idx = tv.find('topo-switch-scan-btn')
while idx > 0:
    print(f'\ntopo-switch-scan-btn @ {idx}:')
    print(repr(tv[max(0,idx-50):idx+120]))
    idx = tv.find('topo-switch-scan-btn', idx+1)

# Чи electronAPI прокинутий через preload?
print('\n=== preload.js / contextBridge ===')
for fname in ['preload.js', 'src/preload.js']:
    import os
    if os.path.exists(fname):
        with open(fname, encoding='utf-8') as f:
            pl = f.read()
        print(f'{fname}:')
        print(pl[:500])
        break
else:
    print('preload.js not found!')

# main.js — чи є direct-scan?
with open('main.js', 'r', encoding='utf-8') as f:
    mj = f.read()
print('\n=== main.js ===')
print('direct-scan IPC:', 'YES' if "handle('direct-scan'" in mj else 'NO ❌')
print('net module:', 'YES' if "require('net')" in mj else 'NO ❌')
print('execSync:', 'YES' if 'execSync' in mj else 'NO ❌')

idx2 = mj.find("handle('direct-scan'")
if idx2 > 0:
    print(f'direct-scan @ {idx2}:')
    print(repr(mj[idx2:idx2+100]))

# ════════════════════════════════════
# 2. Діагностика switch-scanner.js — індикатори
# ════════════════════════════════════
with open('ai-agent/switch-scanner.js', 'r', encoding='utf-8') as f:
    sc = f.read()

print('\n=== switch-scanner.js ===')
# Знаходимо весь блок dotColor
m = re.search(r'var hasDHCP.*?var dotTitle[^\n]+', sc, re.DOTALL)
if m:
    print('dotColor block:')
    print(m.group())
else:
    print('dotColor block NOT FOUND ❌')
    idx3 = sc.find('dotColor')
    print(repr(sc[max(0,idx3-20):idx3+200]))

# Перевіряємо чи LLDP devices отримують online=true
idx4 = sc.find('source: \'LLDP\'')
if idx4 < 0: idx4 = sc.find("source: 'LLDP'")
print(f'\nLLDP source @ {idx4}:')
if idx4 > 0:
    print(repr(sc[max(0,idx4-100):idx4+50]))

# Перевіряємо updateStats
idx5 = sc.find('updateStats')
print(f'\nupdateStats @ {idx5}:')
if idx5 > 0:
    print(repr(sc[idx5:idx5+200]))