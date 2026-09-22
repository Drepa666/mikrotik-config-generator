# -*- coding: utf-8 -*-
import subprocess, re

# ════════════════════════════════════
# 1. switch-scanner.js — без surrogate emoji
# ════════════════════════════════════
with open('ai-agent/switch-scanner.js', 'r', encoding='utf-8') as f:
    sc = f.read()
sc = sc.replace('\r\n', '\n')

# Видаляємо подвійний hasDHCP блок
OLD_TRIPLE = (
    "      var hasDHCP = d.source && d.source.includes('DHCP');\n"
    "      var hasLLDP = d.source && d.source.includes('LLDP');\n"
    "      var hasWiFi = d.source && d.source.includes('WiFi');\n"
    "      /* Online status: green=DHCP/LLDP/WiFi confirmed, yellow=ARP only, red=offline */\n"
    "      var hasConfirmed = d.source && (\n"
    "        d.source.includes('DHCP') ||\n"
    "        d.source.includes('LLDP') ||\n"
    "        d.source.includes('WiFi')\n"
    "      );"
)
NEW_TRIPLE = (
    "      /* green=DHCP/LLDP/WiFi, yellow=ARP only, red=offline */\n"
    "      var hasConfirmed = d.source && (\n"
    "        d.source.includes('DHCP') ||\n"
    "        d.source.includes('LLDP') ||\n"
    "        d.source.includes('WiFi')\n"
    "      );"
)
if OLD_TRIPLE in sc:
    sc = sc.replace(OLD_TRIPLE, NEW_TRIPLE, 1)
    print('OK: hasDHCP dedup fixed')
else:
    # Видаляємо будь-який варіант дублювання
    sc = re.sub(
        r"var hasDHCP = d\.source.*?var hasWiFi = d\.source[^\n]*\n",
        "", sc, flags=re.DOTALL
    )
    # Перевіряємо чи є hasConfirmed
    if 'hasConfirmed' not in sc:
        sc = re.sub(
            r"(var dotColor = !d\.online)",
            ("var hasConfirmed = d.source && (\n"
             "        d.source.includes('DHCP') ||\n"
             "        d.source.includes('LLDP') ||\n"
             "        d.source.includes('WiFi')\n"
             "      );\n      \\1"),
            sc, count=1
        )
    print('OK: hasDHCP cleaned via regex')

# Фіксуємо dotColor
sc = re.sub(
    r"var dotColor\s*=.*?var dotTitle\s*=[^\n]+",
    ("var dotColor = !d.online    ? '#e08080'\n"
     "                   : hasConfirmed ? '#5fd0a5'\n"
     "                   : '#f0a840';\n"
     "      var dotTitle = !d.online    ? 'Offline'\n"
     "                   : hasConfirmed ? 'Online'\n"
     "                   : 'ARP only'"),
    sc, flags=re.DOTALL, count=1
)
print('OK: dotColor fixed')

# Статус — ASCII тільки (без emoji в python string)
sc = re.sub(
    r"var _total.*?SwitchScanner\.setStatus\([^;]+;",
    ("var _total  = SwitchScanner._devices.length;\n"
     "      var _green  = SwitchScanner._devices.filter(function(d){\n"
     "        return d.online && d.source && (\n"
     "          d.source.includes('DHCP') ||\n"
     "          d.source.includes('LLDP') ||\n"
     "          d.source.includes('WiFi'));\n"
     "      }).length;\n"
     "      var _yellow = _total - _green;\n"
     "      SwitchScanner.setStatus(\n"
     "        'Found: ' + _total + ' | Online: ' + _green + ' | ARP: ' + _yellow,\n"
     "        '#5fd0a5'\n"
     "      );"),
    sc, flags=re.DOTALL, count=1
)
print('OK: status fixed')

with open('ai-agent/switch-scanner.js', 'w', encoding='utf-8') as f:
    f.write(sc)

r1 = subprocess.run(['node','--check','ai-agent/switch-scanner.js'],
                    capture_output=True, text=True)
print('switch-scanner:', 'OK' if r1.returncode==0 else '❌\n'+r1.stderr[:200])

# ════════════════════════════════════
# 2. topology-visual.js — draw() + electronAPI.directScan
# ════════════════════════════════════
with open('topology-visual.js', 'r', encoding='utf-8') as f:
    tv = f.read()
tv = tv.replace('\r\n', '\n')

# Замінюємо redraw() на draw()
if 'function runSwitchScan' in tv:
    count = tv.count('redraw();')
    tv = tv.replace('redraw();', 'draw();')
    print(f'OK: redraw() -> draw() ({count} замін)')

# Замінюємо IPC виклик на electronAPI.directScan
OLD_IPC = (
    "    var _ipc = window.electronAPI\n"
    "      || (window.require && window.require('electron').ipcRenderer);\n"
    "\n"
    "    if (!_ipc || !_ipc.invoke) {\n"
    "      st.textContent = '\\u274c IPC not available';\n"
    "      st.style.borderColor = '#e08080';\n"
    "      setTimeout(function(){ st.remove(); }, 3000);\n"
    "      return;\n"
    "    }\n"
    "\n"
    "    _ipc.invoke('direct-scan', { subnet: subnet, timeout: 2000 })\n"
)
NEW_IPC = (
    "    /* electronAPI.directScan через preload.js */\n"
    "    if (!window.electronAPI || !window.electronAPI.directScan) {\n"
    "      st.textContent = 'IPC not available';\n"
    "      st.style.borderColor = '#e08080';\n"
    "      setTimeout(function(){ st.remove(); }, 3000);\n"
    "      return;\n"
    "    }\n"
    "\n"
    "    window.electronAPI.directScan({ subnet: subnet, timeout: 2000 })\n"
)
if OLD_IPC in tv:
    tv = tv.replace(OLD_IPC, NEW_IPC, 1)
    print('OK: electronAPI.directScan in topology')
else:
    # Ширший пошук
    tv = re.sub(
        r"var _ipc = window\.electronAPI.*?_ipc\.invoke\('direct-scan'[^\)]+\)",
        ("window.electronAPI.directScan({ subnet: subnet, timeout: 2000 })"),
        tv, flags=re.DOTALL, count=1
    )
    print('OK: IPC replaced via regex')

# Також фіксуємо SwitchScanner.scanDirect — там теж _ipc.invoke
with open('ai-agent/switch-scanner.js', 'r', encoding='utf-8') as f:
    sc2 = f.read()

OLD_SC_IPC = (
    "    var _ipc = window.electronAPI || (window.require && window.require('electron').ipcRenderer);\n"
    "    if (!_ipc || !_ipc.invoke) {\n"
    "      SwitchScanner.setStatus('❌ IPC недоступний', '#e08080');\n"
    "      SwitchScanner._scanning = false;\n"
    "      return;\n"
    "    }\n"
    "    _ipc.invoke('direct-scan', { subnet: subnet, timeout: 2000 })\n"
)
NEW_SC_IPC = (
    "    if (!window.electronAPI || !window.electronAPI.directScan) {\n"
    "      SwitchScanner.setStatus('IPC not available', '#e08080');\n"
    "      SwitchScanner._scanning = false;\n"
    "      return;\n"
    "    }\n"
    "    window.electronAPI.directScan({ subnet: subnet, timeout: 2000 })\n"
)
if OLD_SC_IPC in sc2:
    sc2 = sc2.replace(OLD_SC_IPC, NEW_SC_IPC, 1)
    print('OK: scanner directScan IPC fixed')
    with open('ai-agent/switch-scanner.js', 'w', encoding='utf-8') as f:
        f.write(sc2)

with open('topology-visual.js', 'w', encoding='utf-8') as f:
    f.write(tv)

r2 = subprocess.run(['node','--check','topology-visual.js'],
                    capture_output=True, text=True)
print('topology-visual:', 'OK' if r2.returncode==0 else '❌\n'+r2.stderr[:200])

# ════════════════════════════════════
# 3. preload.js — перевіряємо directScan
# ════════════════════════════════════
with open('preload.js', 'r', encoding='utf-8') as f:
    pl = f.read()

if 'directScan' not in pl:
    pl = pl.replace(
        "  isElectron: true,\n",
        ("  directScan: function(opts) {\n"
         "    return ipcRenderer.invoke('direct-scan', opts);\n"
         "  },\n"
         "  isElectron: true,\n")
    )
    with open('preload.js', 'w', encoding='utf-8') as f:
        f.write(pl)
    print('OK: directScan added to preload')
else:
    print('OK: directScan already in preload')

# ════════════════════════════════════
# 4. Перевіряємо всі файли
# ════════════════════════════════════
for fname in ['preload.js', 'ai-agent/switch-scanner.js', 'topology-visual.js']:
    r = subprocess.run(['node','--check', fname], capture_output=True, text=True)
    print(f'{fname}: {"OK" if r.returncode==0 else "❌ "+r.stderr[:100]}')

# Git
subprocess.run(['git','add','-A'], capture_output=True)
subprocess.run(['git','commit','-m',
    'fix: draw() not redraw, electronAPI.directScan, hasDHCP dedup, no surrogate emoji'],
    capture_output=True)
r_p = subprocess.run(['git','push','origin','main'], capture_output=True, text=True)
print('push:', r_p.stdout.strip() or r_p.stderr.strip()[-60:])
print('\nDone! npm start')