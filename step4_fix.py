# -*- coding: utf-8 -*-
import subprocess, tempfile, os

# ════ FIX 1: main.js — фільтр multicast в direct-scan ════
with open('main.js', 'r', encoding='utf-8') as f:
    mj = f.read()
mj = mj.replace('\r\n', '\n')

# Знаходимо точний рядок фільтрації в finalize()
print('=== main.js ===')
idx = mj.find('function finalize')
print(f'finalize @ {idx}:')
print(repr(mj[idx:idx+300]))

OLD_FILTER = (
    "    var result = Object.values(devices).filter(function(d) {\n"
    "      return d.ip && !d.ip.endsWith('.0') && !d.ip.endsWith('.255');\n"
    "    });"
)
NEW_FILTER = (
    "    var result = Object.values(devices).filter(function(d) {\n"
    "      if (!d.ip) return false;\n"
    "      /* Фільтруємо multicast (224.x-239.x), broadcast, service */\n"
    "      var first = parseInt(d.ip.split('.')[0]);\n"
    "      if (first >= 224) return false;          /* multicast */\n"
    "      if (d.ip.endsWith('.0'))   return false; /* network */\n"
    "      if (d.ip.endsWith('.255')) return false; /* broadcast */\n"
    "      /* Фільтруємо multicast MAC (01:xx або 33:33:xx) */\n"
    "      if (d.mac) {\n"
    "        var firstOctet = parseInt(d.mac.split(':')[0], 16);\n"
    "        if (firstOctet & 0x01) return false; /* multicast MAC bit */\n"
    "      }\n"
    "      return true;\n"
    "    });"
)

if OLD_FILTER in mj:
    mj = mj.replace(OLD_FILTER, NEW_FILTER, 1)
    print('OK: multicast filter added')
else:
    print('WARN: OLD_FILTER not found, showing finalize:')
    idx2 = mj.find('finalize()')
    print(repr(mj[max(0,idx2-200):idx2+400]))

with tempfile.NamedTemporaryFile(
        suffix='.js', delete=False, mode='w', encoding='utf-8') as tmp:
    tmp.write(mj)
    tmp_name = tmp.name
r = subprocess.run(['node','--check', tmp_name], capture_output=True, text=True)
os.unlink(tmp_name)
if r.returncode != 0:
    print('SYNTAX ERROR main.js!\n' + r.stderr[:200])
    exit(1)

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(mj)
print(f'main.js: OK ({os.path.getsize("main.js")}b)')

# ════ FIX 2: topology-visual.js — vendor lookup для scan результатів ════
with open('topology-visual.js', 'r', encoding='utf-8') as f:
    tv = f.read()
tv = tv.replace('\r\n', '\n')

print('\n=== topology-visual.js vendor lookup ===')
# Знаходимо де vendor призначається в buildSwitchTopology
idx3 = tv.find('function buildSwitchTopology')
chunk = tv[idx3:idx3+2000]
print(repr(chunk[:500]))

# Знаходимо де ноутбук отримує label
# Проблема: label = d.vendor || d.ip — якщо vendor='' то IP
# Але vendor не визначається для ноутбука!
# Перевіряємо чи є OUILookup виклик в buildSwitchTopology
if 'OUILookup.lookup' in chunk:
    print('OK: OUILookup є в buildSwitchTopology')
else:
    print('WARN: OUILookup НЕ викликається в buildSwitchTopology!')

# Знаходимо де devs обробляються в runSwitchScanStart
idx4 = tv.find('function runSwitchScanStart')
chunk2 = tv[idx4:idx4+1500]
oui_idx = chunk2.find('OUILookup')
print(f'\nOUILookup в runSwitchScanStart: {"YES @ "+str(oui_idx) if oui_idx>0 else "NO ❌"}')
if oui_idx > 0:
    print(repr(chunk2[oui_idx:oui_idx+200]))

# Перевіряємо label у вузлах Gateway
gw_node = tv.find("label: gw.vendor || gw.ip")
print(f'\ngw label: {repr(tv[gw_node:gw_node+40]) if gw_node>0 else "not found"}')

# Перевіряємо label у клієнтів  
dev_label = tv.find("label: d.hostname || d.vendor || d.ip")
print(f'dev label: {repr(tv[dev_label:dev_label+50]) if dev_label>0 else "not found"}')

# Git push
subprocess.run(['git','add','-A'], capture_output=True)
subprocess.run(['git','commit','-m',
    'fix: filter multicast IPs and MACs from direct-scan results'],
    capture_output=True)
rp = subprocess.run(['git','push','origin','main'], capture_output=True, text=True)
print('\npush:', rp.stdout.strip() or rp.stderr.strip()[-60:])
print('\nDone! npm start')