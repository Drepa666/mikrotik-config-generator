# -*- coding: utf-8 -*-
import subprocess, re

# ════════════════════════════════════
# 1. Знаходимо функцію render в topology-visual.js
# ════════════════════════════════════
with open('topology-visual.js', 'r', encoding='utf-8') as f:
    tv = f.read()
tv = tv.replace('\r\n', '\n')

print('=== Шукаємо render функцію ===')
for kw in ['function redraw', 'function render', 'function draw',
           'function refresh', 'function update', 'function paint']:
    if kw in tv:
        idx = tv.find(kw)
        print(f'ЗНАЙДЕНО: {kw} @ {idx}')
        print(repr(tv[idx:idx+60]))

# Також шукаємо що викликається після зміни nodes
print('\n=== Що викликається після nodes.push ===')
idx = tv.rfind('nodes.push')
if idx > 0:
    print(repr(tv[idx:idx+200]))

# ════════════════════════════════════
# 2. Фіксуємо preload.js — додаємо directScan
# ════════════════════════════════════
with open('preload.js', 'r', encoding='utf-8') as f:
    pl = f.read()
pl = pl.replace('\r\n', '\n')

print('\n=== preload.js повний вміст ===')
print(pl)

if 'directScan' not in pl:
    # Знаходимо останній метод перед });
    last_method_end = pl.rfind('  },\n')
    if last_method_end > 0:
        insert_pos = last_method_end + 4  # після },\n
        NEW_METHODS = (
            "  directScan: function(opts) {\n"
            "    return ipcRenderer.invoke('direct-scan', opts);\n"
            "  },\n"
            "  onScanProgress: function(callback) {\n"
            "    ipcRenderer.on('scan-progress', function(event, data) { callback(data); });\n"
            "  },\n"
        )
        pl = pl[:insert_pos] + NEW_METHODS + pl[insert_pos:]
        with open('preload.js', 'w', encoding='utf-8', newline='\n') as f:
            f.write(pl)
        print('\nOK: directScan додано в preload.js')
    else:
        print('WARN: не знайдено місце в preload.js')
        print(repr(pl[-200:]))
else:
    print('\nOK: directScan вже є в preload.js')

# ════════════════════════════════════
# 3. Фіксуємо switch-scanner.js — дублювання hasDHCP
# ════════════════════════════════════
with open('ai-agent/switch-scanner.js', 'r', encoding='utf-8') as f:
    sc = f.read()
sc = sc.replace('\r\n', '\n')

# Видаляємо СТАРИЙ блок (hasDHCP + hasLLDP + hasWiFi окремо)
OLD_TRIPLE = (
    "      var hasDHCP = d.source && d.source.includes('DHCP');\n"
    "      var hasLLDP = d.source && d.source.includes('LLDP');\n"
    "      var hasWiFi = d.source && d.source.includes('WiFi');\n"
    "      var hasDHCP  = d.source && (d.source.includes('DHCP') || d.source.includes('LLDP') || d.source.includes('WiFi'));"
)
NEW_TRIPLE = (
    "      /* Online status: green=DHCP/LLDP/WiFi confirmed, yellow=ARP only, red=offline */\n"
    "      var hasConfirmed = d.source && (\n"
    "        d.source.includes('DHCP') ||\n"
    "        d.source.includes('LLDP') ||\n"
    "        d.source.includes('WiFi')\n"
    "      );"
)
if OLD_TRIPLE in sc:
    sc = sc.replace(OLD_TRIPLE, NEW_TRIPLE, 1)
    print('\nOK: дублювання hasDHCP виправлено')

# Фіксуємо використання hasDHCP → hasConfirmed
OLD_DOT_COLOR = (
    "      var dotColor = !d.online  ? '#e08080'\n"
    "                   : hasDHCP    ? '#5fd0a5'\n"
    "                   : '#f0a840';\n"
    "      var dotTitle = !d.online  ? 'Офлайн'\n"
    "                   : hasDHCP    ? 'Онлайн (підтверджено)'\n"
    "                   : 'ARP (нещодавно активний)';"
)
NEW_DOT_COLOR = (
    "      var dotColor = !d.online      ? '#e08080'\n"
    "                   : hasConfirmed   ? '#5fd0a5'\n"
    "                   : '#f0a840';\n"
    "      var dotTitle = !d.online      ? 'Offline'\n"
    "                   : hasConfirmed   ? 'Online (confirmed)'\n"
    "                   : 'ARP only';"
)
if OLD_DOT_COLOR in sc:
    sc = sc.replace(OLD_DOT_COLOR, NEW_DOT_COLOR, 1)
    print('OK: dotColor використовує hasConfirmed')
else:
    # Fallback — regex замінна
    sc = re.sub(
        r"var dotColor = !d\.online.*?'ARP \(нещодавно активний\)';",
        NEW_DOT_COLOR,
        sc, flags=re.DOTALL, count=1
    )
    print('OK: dotColor замінено через regex')

# Фіксуємо статус
OLD_STAT = re.search(
    r"var _total.*?SwitchScanner\.setStatus\([^;]+;",
    sc, re.DOTALL
)
if OLD_STAT:
    NEW_STAT = (
        "var _total  = SwitchScanner._devices.length;\n"
        "      var _green  = SwitchScanner._devices.filter(function(d){\n"
        "        return d.online && d.source && (\n"
        "          d.source.includes('DHCP') ||\n"
        "          d.source.includes('LLDP') ||\n"
        "          d.source.includes('WiFi'));\n"
        "      }).length;\n"
        "      var _yellow = SwitchScanner._devices.filter(function(d){\n"
        "        return d.online && !(d.source && (\n"
        "          d.source.includes('DHCP') ||\n"
        "          d.source.includes('LLDP') ||\n"
        "          d.source.includes('WiFi')));\n"
        "      }).length;\n"
        "      SwitchScanner.setStatus(\n"
        "        'Total: ' + _total +\n"
        "        '  \uD83D\uDFE2 ' + _green + ' online' +\n"
        "        '  \uD83D\uDFE1 ' + _yellow + ' ARP only',\n"
        "        '#5fd0a5'\n"
        "      );"
    )
    sc = sc[:OLD_STAT.start()] + NEW_STAT + sc[OLD_STAT.end():]
    print('OK: статус оновлено')

with open('ai-agent/switch-scanner.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(sc)

r1 = subprocess.run(['node','--check','ai-agent/switch-scanner.js'],
                    capture_output=True, text=True)
print('switch-scanner:', 'OK' if r1.returncode==0 else '❌\n'+r1.stderr[:200])

# ════════════════════════════════════
# 4. Фіксуємо topology-visual.js — Switch Scan
#    Знаходимо правильну назву render функції
# ════════════════════════════════════
# Шукаємо що викликається після зміни nodes/links
render_fn = None
for kw in ['redraw()', 'render()', 'drawAll()', 'refresh()',
           'drawTopology()', 'updateCanvas()', 'renderAll()']:
    if kw in tv:
        render_fn = kw
        print(f'\nrender функція: {kw}')
        break

if not render_fn:
    # Шукаємо по патерну function xxx() що малює canvas
    m = re.search(r'function (\w+)\(\)\s*\{[^}]*canvas', tv)
    if m:
        render_fn = m.group(1) + '()'
        print(f'render знайдено через canvas: {render_fn}')
    else:
        # Шукаємо requestAnimationFrame або ctx.clearRect
        for kw in ['ctx.clearRect', 'requestAnimationFrame', '.clearRect']:
            idx = tv.find(kw)
            if idx > 0:
                # Йдемо назад до function
                chunk = tv[max(0,idx-500):idx]
                fm = re.findall(r'function (\w+)\(', chunk)
                if fm:
                    render_fn = fm[-1] + '()'
                    print(f'render знайдено через canvas2: {render_fn}')
                    break

if not render_fn:
    print('WARN: render функція не знайдена! Показуємо всі функції:')
    for m in re.finditer(r'function (\w+)\(', tv):
        print(f'  {m.group(1)}')
    render_fn = 'console.log("redraw not found")'

# Замінюємо redraw() на правильну функцію в runSwitchScan
if 'function runSwitchScan' in tv:
    tv = tv.replace('redraw();', render_fn + ';')
    print(f'OK: redraw() замінено на {render_fn}')

# Замінюємо виклик через electronAPI.directScan (замість _ipc.invoke)
OLD_IPC_CALL = (
    "    _ipc.invoke('direct-scan', { subnet: subnet, timeout: 2000 })\n"
)
NEW_IPC_CALL = (
    "    /* Використовуємо electronAPI.directScan з preload */\n"
    "    var _scanPromise = (window.electronAPI && window.electronAPI.directScan)\n"
    "      ? window.electronAPI.directScan({ subnet: subnet, timeout: 2000 })\n"
    "      : (_ipc && _ipc.invoke\n"
    "          ? _ipc.invoke('direct-scan', { subnet: subnet, timeout: 2000 })\n"
    "          : Promise.reject('No IPC available'));\n"
    "    _scanPromise\n"
)
if OLD_IPC_CALL in tv:
    tv = tv.replace(OLD_IPC_CALL, NEW_IPC_CALL, 1)
    print('OK: electronAPI.directScan використовується')

with open('topology-visual.js', 'w', encoding='utf-8') as f:
    f.write(tv)

r2 = subprocess.run(['node','--check','topology-visual.js'],
                    capture_output=True, text=True)
print('topology-visual:', 'OK' if r2.returncode==0 else '❌\n'+r2.stderr[:300])

# Git
subprocess.run(['git','add','-A'], capture_output=True)
subprocess.run(['git','commit','-m',
    'fix: preload directScan, hasDHCP dedup, find render fn, electronAPI in topo'],
    capture_output=True)
r_push = subprocess.run(['git','push','origin','main'],
                        capture_output=True, text=True)
print('push:', r_push.stdout.strip() or r_push.stderr.strip()[-80:])
print('\nDone! npm start')