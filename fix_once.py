# -*- coding: utf-8 -*-
import subprocess, re, os

# ════════════════════════════════════
# КРОК 1: Зберігаємо поточний стан
# ════════════════════════════════════
print('=== ЗБЕРЕЖЕННЯ ===')
subprocess.run(['git','add','-A'], capture_output=True)
subprocess.run(['git','commit','--allow-empty','-m','checkpoint: working state before final fix'],
               capture_output=True)
subprocess.run(['git','tag','-f','working-state'], capture_output=True)
print('OK: збережено як тег "working-state"')

# ════════════════════════════════════
# КРОК 2: Діагностика точних проблем
# ════════════════════════════════════
print('\n=== ДІАГНОСТИКА ===')

# switch-scanner.js — знаходимо точний код dotColor
with open('ai-agent/switch-scanner.js', 'r', encoding='utf-8') as f:
    sc = f.read()

m_dot = re.search(r'var dotColor\s*=.*?;', sc, re.DOTALL)
print('dotColor блок:')
print(repr(m_dot.group()) if m_dot else 'NOT FOUND')

# Знаходимо hasDHCP
m_has = re.search(r'(var has[A-Z]\w+\s*=.*?)\n\s*var dotColor', sc, re.DOTALL)
print('\nПеред dotColor:')
print(repr(m_has.group(1)) if m_has else 'NOT FOUND')

# topology-visual.js — кнопка і handler
with open('topology-visual.js', 'r', encoding='utf-8') as f:
    tv = f.read()

print('\n--- topology-visual.js ---')
# Як додається кнопка
idx_btn = tv.find('topo-switch-scan-btn')
while idx_btn > 0:
    chunk = tv[max(0,idx_btn-20):idx_btn+120]
    print(f'@ {idx_btn}: {repr(chunk)}')
    idx_btn = tv.find('topo-switch-scan-btn', idx_btn+1)

# Як викликається runSwitchScan
print('\nrunSwitchScan виклики:')
for m in re.finditer(r'runSwitchScan', tv):
    print(f'  @ {m.start()}: {repr(tv[max(0,m.start()-30):m.start()+50])}')

# preload.js
with open('preload.js', 'r', encoding='utf-8') as f:
    pl = f.read()
print('\n--- preload.js ---')
print('directScan:', 'YES' if 'directScan' in pl else 'NO ❌')
print(pl)

# ════════════════════════════════════
# КРОК 3: FIX — один раз і назавжди
# ════════════════════════════════════
print('\n=== FIX ===')

# ── FIX 1: preload.js — додаємо directScan якщо немає ──
if 'directScan' not in pl:
    pl = pl.replace(
        '  isElectron: true,\n',
        '  directScan: function(opts) {\n'
        '    return ipcRenderer.invoke(\'direct-scan\', opts);\n'
        '  },\n'
        '  isElectron: true,\n'
    )
    with open('preload.js', 'w', encoding='utf-8') as f:
        f.write(pl)
    print('OK: preload.js directScan додано')
else:
    print('OK: preload.js directScan вже є')

# ── FIX 2: switch-scanner.js — кольори крапок ──
# Стратегія: видаляємо ВСЕ що пов'язано з has* і dotColor,
# вставляємо чистий блок

# Знаходимо точний рядок де починається блок кольорів
# (перед рядком з var dotColor)
dot_start = sc.find('var hasDHCP')
if dot_start < 0:
    dot_start = sc.find('var dotColor')

dot_end_m = re.search(r"var dotTitle\s*=[^\n]+\n", sc[dot_start:])
if dot_end_m:
    dot_end = dot_start + dot_end_m.end()
else:
    dot_end = dot_start + 300

print(f'\nКольоровий блок [{dot_start}:{dot_end}]:')
print(repr(sc[dot_start:dot_end]))

NEW_DOT_BLOCK = (
    "var confirmed = d.source && (\n"
    "        d.source.includes('DHCP') ||\n"
    "        d.source.includes('LLDP') ||\n"
    "        d.source.includes('WiFi')\n"
    "      );\n"
    "      var dotColor = !d.online   ? '#e08080'\n"
    "                   : confirmed   ? '#5fd0a5'\n"
    "                   : '#f0a840';\n"
    "      var dotTitle = !d.online   ? 'Offline'\n"
    "                   : confirmed   ? 'Online'\n"
    "                   : 'ARP only';\n"
)

sc_new = sc[:dot_start] + NEW_DOT_BLOCK + sc[dot_end:]
with open('ai-agent/switch-scanner.js', 'w', encoding='utf-8') as f:
    f.write(sc_new)
r1 = subprocess.run(['node','--check','ai-agent/switch-scanner.js'],
                    capture_output=True, text=True)
print('switch-scanner:', 'OK' if r1.returncode==0 else '❌\n'+r1.stderr[:150])

# ── FIX 3: topology-visual.js ──
# Проблема кнопки: addEventListener може не спрацювати якщо
# панель ще не відрендерена. Рішення: onclick напряму в HTML

# Замінюємо кнопку — додаємо onclick напряму
OLD_BTN = (
    "'<button id=\"topo-switch-scan-btn\""
    " title=\"Scan network and build topology\""
)
NEW_BTN = (
    "'<button id=\"topo-switch-scan-btn\""
    " onclick=\"window.TopoVisual && window.TopoVisual.runSwitchScan()\""
    " title=\"Scan network and build topology\""
)
if OLD_BTN in tv:
    tv = tv.replace(OLD_BTN, NEW_BTN, 1)
    print('OK: onclick додано в кнопку Switch Scan')
else:
    # Знаходимо і додаємо onclick будь-яким способом
    tv = re.sub(
        r"'<button id=\"topo-switch-scan-btn\"",
        "'<button id=\"topo-switch-scan-btn\""
        " onclick=\"window.TopoVisual&&window.TopoVisual.runSwitchScan()\"",
        tv, count=1
    )
    print('OK: onclick додано через regex')

# Переконуємось що TopoVisual.runSwitchScan публічний
if 'window.TopoVisual.runSwitchScan = runSwitchScan' not in tv \
   and 'TopoVisual.runSwitchScan = runSwitchScan' not in tv:
    # Додаємо перед })();
    iife = tv.rfind('})();')
    if iife > 0:
        tv = tv[:iife] + (
            "\n  window.TopoVisual = window.TopoVisual || {};\n"
            "  window.TopoVisual.runSwitchScan = runSwitchScan;\n"
        ) + tv[iife:]
        print('OK: TopoVisual.runSwitchScan exposed')
else:
    print('OK: TopoVisual.runSwitchScan вже є')

with open('topology-visual.js', 'w', encoding='utf-8') as f:
    f.write(tv)

r2 = subprocess.run(['node','--check','topology-visual.js'],
                    capture_output=True, text=True)
print('topology-visual:', 'OK' if r2.returncode==0 else '❌\n'+r2.stderr[:150])

# ── FIX 4: Перевіряємо що draw() існує і доступна ──
with open('topology-visual.js', 'r', encoding='utf-8') as f:
    tv2 = f.read()

has_draw = 'function draw()' in tv2
has_draw_in_scan = False
idx_scan = tv2.find('function runSwitchScan')
if idx_scan > 0:
    scan_chunk = tv2[idx_scan:idx_scan+2000]
    has_draw_in_scan = 'draw();' in scan_chunk

print(f'\nfunction draw(): {"YES" if has_draw else "NO ❌"}')
print(f'draw() в runSwitchScan: {"YES" if has_draw_in_scan else "NO ❌"}')

if has_draw and not has_draw_in_scan:
    # redraw() не замінено — робимо зараз
    tv2 = tv2.replace('redraw();', 'draw();')
    # Але тільки в runSwitchScan
    with open('topology-visual.js', 'w', encoding='utf-8') as f:
        f.write(tv2)
    print('OK: redraw() -> draw() виправлено')

# ════════════════════════════════════
# КРОК 4: Фінальна перевірка
# ════════════════════════════════════
print('\n=== ФІНАЛЬНА ПЕРЕВІРКА ===')
checks = [
    'ai-agent/switch-scanner.js',
    'topology-visual.js',
    'router-manager.js',
    'preload.js',
    'main.js',
]
all_ok = True
for fname in checks:
    size = os.path.getsize(fname)
    r = subprocess.run(['node','--check',fname], capture_output=True, text=True)
    ok = r.returncode == 0 and size > 100
    all_ok = all_ok and ok
    print(f'  {"OK" if ok else "❌"} {fname} ({size}b)')

if all_ok:
    subprocess.run(['git','add','-A'], capture_output=True)
    subprocess.run(['git','commit','-m',
        'fix: onclick in Switch Scan btn, confirmed dot colors, preload directScan'],
        capture_output=True)
    r_p = subprocess.run(['git','push','origin','main'],
                         capture_output=True, text=True)
    print('\npush:', r_p.stdout.strip() or r_p.stderr.strip()[-60:])
    print('\nDone! npm start')
else:
    print('\n❌ Є помилки — НЕ комітимо')
    print('Відновлення: git checkout working-state -- .')