# -*- coding: utf-8 -*-
import subprocess, os

# ════════════════════════════════════
# 1. Діагностика — що реально в switch-scanner.js
# ════════════════════════════════════
with open('ai-agent/switch-scanner.js', 'r', encoding='utf-8') as f:
    sc = f.read()
sc = sc.replace('\r\n', '\n')

idx = sc.find('var dotColor')
print('=== Поточний код кольорів ===')
print(repr(sc[max(0,idx-20):idx+300]))

# ════════════════════════════════════
# 2. ФІКС кольорів — знаходимо точний текст
# ════════════════════════════════════
# Шукаємо будь-який варіант dotColor
import re
dot_match = re.search(r'var dotColor\s*=.*?;', sc, re.DOTALL)
if dot_match:
    print(f'\nЗнайдено dotColor: {repr(dot_match.group()[:100])}')
    old_dot = dot_match.group()
    new_dot = (
        "var hasDHCP  = d.source && (d.source.includes('DHCP') || d.source.includes('LLDP') || d.source.includes('WiFi'));\n"
        "      var dotColor = !d.online  ? '#e08080'\n"
        "                   : hasDHCP    ? '#5fd0a5'\n"
        "                   : '#f0a840';\n"
        "      var dotTitle = !d.online  ? 'Офлайн'\n"
        "                   : hasDHCP    ? 'Онлайн (підтверджено)'\n"
        "                   : 'ARP (нещодавно активний)'"
    )
    sc = sc[:dot_match.start()] + new_dot + sc[dot_match.end():]
    print('OK: dotColor замінено ✅')

# ════════════════════════════════════
# 3. Фікс легенди в статусі
# ════════════════════════════════════
# Замінюємо оновлення статусу після сканування
old_status = re.search(
    r"SwitchScanner\.setStatus\(\s*'Знайдено:.*?'\s*,\s*'#5fd0a5'\s*\);",
    sc, re.DOTALL
)
if old_status:
    new_status = (
        "var _total   = SwitchScanner._devices.length;\n"
        "      var _green   = SwitchScanner._devices.filter(function(d){\n"
        "        return d.online && d.source && \n"
        "          (d.source.includes('DHCP')||d.source.includes('LLDP')||d.source.includes('WiFi'));\n"
        "      }).length;\n"
        "      var _yellow  = SwitchScanner._devices.filter(function(d){\n"
        "        return d.online && d.source === 'ARP';\n"
        "      }).length;\n"
        "      SwitchScanner.setStatus(\n"
        "        'Всього: ' + _total +\n"
        "        '  🟢 ' + _green + ' онлайн' +\n"
        "        '  🟡 ' + _yellow + ' ARP only',\n"
        "        '#5fd0a5'\n"
        "      );"
    )
    sc = sc[:old_status.start()] + new_status + sc[old_status.end():]
    print('OK: статус з легендою ✅')

with open('ai-agent/switch-scanner.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(sc)

r1 = subprocess.run(['node','--check','ai-agent/switch-scanner.js'],
                    capture_output=True, text=True)
print('switch-scanner:', 'OK ✅' if r1.returncode==0 else '❌\n'+r1.stderr[:200])

# ════════════════════════════════════
# 4. Читаємо main.js — додаємо IPC direct-scan
# ════════════════════════════════════
with open('main.js', 'r', encoding='utf-8') as f:
    mj = f.read()
mj = mj.replace('\r\n', '\n')

print('\n=== main.js структура ===')
# Показуємо де є ipcMain.handle
for kw in ['ipcMain.handle', 'ipcMain.on', 'require(\'net\')',
           'require("net")', 'ssh', 'proxy', 'localhost:8888']:
    idx = mj.find(kw)
    if idx > 0:
        print(f'"{kw}" @ {idx}: {repr(mj[idx:idx+80])}')

# Останній ipcMain.handle — після нього вставимо наш
last_ipc = mj.rfind('ipcMain.handle')
last_ipc_end = mj.find('\n});', last_ipc) + 4
print(f'\nОстанній ipcMain.handle @ {last_ipc}:{last_ipc_end}')
print(repr(mj[last_ipc:last_ipc_end]))