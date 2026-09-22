# -*- coding: utf-8 -*-
import subprocess, tempfile, os

# ══════════════════════════════════════════════════════
# FIX 1: network-scanner.js
# ══════════════════════════════════════════════════════
print('=== FIX 1: network-scanner.js ===')
with open('network-scanner.js', 'r', encoding='utf-8') as f:
    ns = f.read()
ns = ns.replace('\r\n', '\n')

# 1a: Замінюємо OUI на OUILookup — рядок 219
OLD_OUI = "      if (d.mac) d.vendor = OUI[d.mac.substring(0,8)] || '';"
NEW_OUI = (
    "      if (d.mac) {\n"
    "        d.vendor = (window.OUILookup ? OUILookup.lookup(d.mac) : '') || '';\n"
    "        if (!d.vendor || d.vendor === 'Unknown') {\n"
    "          /* fallback to local OUI if exists */\n"
    "          d.vendor = (typeof OUI !== 'undefined' ? OUI[d.mac.substring(0,8)] : '') || '';\n"
    "        }\n"
    "        if (window.OUILookup) {\n"
    "          var _dt = OUILookup.getDeviceType(d.vendor, [], d.hostname || '');\n"
    "          d.devType  = _dt.type;\n"
    "          d.devIcon  = _dt.icon;\n"
    "        }\n"
    "      }"
)
print(f'OLD_OUI: {"FOUND" if OLD_OUI in ns else "NOT FOUND ❌"}')
if OLD_OUI in ns:
    ns = ns.replace(OLD_OUI, NEW_OUI, 1)
    print('OK: OUILookup замість OUI')
else:
    idx = ns.find('d.vendor = OUI')
    print(f'Реальний рядок: {repr(ns[max(0,idx-10):idx+80])}')

# 1b: pingCheck catch — не перезаписуємо online якщо DHCP
OLD_CATCH = ".catch(function() { d.online = null; })"
NEW_CATCH = (
    ".catch(function() {\n"
    "          /* не перезаписуємо якщо вже підтверджено DHCP/LLDP */\n"
    "          var srcLow = (d.type || '').toLowerCase();\n"
    "          if (!srcLow.includes('dhcp') && !srcLow.includes('neighbor')) {\n"
    "            d.online = null;\n"
    "          }\n"
    "        })"
)
print(f'OLD_CATCH: {"FOUND" if OLD_CATCH in ns else "NOT FOUND ❌"}')
if OLD_CATCH in ns:
    ns = ns.replace(OLD_CATCH, NEW_CATCH, 1)
    print('OK: catch не перезаписує DHCP online')
else:
    idx2 = ns.find('d.online = null')
    print(f'Реальний рядок: {repr(ns[max(0,idx2-30):idx2+60])}')

# 1c: Tempfile перевірка
with tempfile.NamedTemporaryFile(
        suffix='.js', delete=False, mode='w', encoding='utf-8') as tmp:
    tmp.write(ns)
    tmp_name = tmp.name
r = subprocess.run(['node','--check', tmp_name], capture_output=True, text=True)
os.unlink(tmp_name)
if r.returncode != 0:
    print('SYNTAX ERROR!\n' + r.stderr[:300])
    exit(1)
print('Tempfile: OK')

with open('network-scanner.js', 'w', encoding='utf-8') as f:
    f.write(ns)
r2 = subprocess.run(['node','--check','network-scanner.js'],
                    capture_output=True, text=True)
print(f'network-scanner.js: {"OK ✅" if r2.returncode==0 else "❌"+r2.stderr[:100]}')

# ══════════════════════════════════════════════════════
# FIX 2: oui-lookup.js — додаємо Intel та інші популярні
# ══════════════════════════════════════════════════════
print('\n=== FIX 2: oui-lookup.js — додаємо MACs ===')
with open('ai-agent/oui-lookup.js', 'r', encoding='utf-8') as f:
    oui = f.read()
oui = oui.replace('\r\n', '\n')

# Шукаємо де вставити — після останнього запису в _db
# Знаходимо кінець _db об'єкта
OLD_DB_END = "  },"  # перша }  після _db
idx_db = oui.find("  _db: {")
idx_db_end = oui.find("\n  },", idx_db)
print(f'_db кінець @ {idx_db_end}: {repr(oui[idx_db_end:idx_db_end+20])}')

NEW_MACS = (
    "\n"
    "    /* Intel */\n"
    "    'F4:4E:B4':'Intel','8C:8D:28':'Intel','18:66:DA':'Intel',\n"
    "    'AC:ED:5C':'Intel','00:1B:21':'Intel','00:21:6A':'Intel',\n"
    "    '8C:EC:4B':'Intel','94:65:9C':'Intel','A4:C3:F0':'Intel',\n"
    "    'D0:57:7B':'Intel','00:1E:67':'Intel','E4:B3:18':'Intel',\n"
    "    /* Apple */\n"
    "    'F4:4E:B4':'Apple','3C:15:C2':'Apple','A8:86:DD':'Apple',\n"
    "    '00:17:F2':'Apple','28:CF:DA':'Apple','3C:07:54':'Apple',\n"
    "    'AC:BC:32':'Apple','F0:18:98':'Apple','DC:A9:04':'Apple',\n"
    "    '78:4F:43':'Apple','B8:E8:56':'Apple','8C:85:90':'Apple',\n"
    "    /* Samsung */\n"
    "    '00:12:47':'Samsung','00:15:99':'Samsung','00:1A:8A':'Samsung',\n"
    "    '00:21:19':'Samsung','18:22:7E':'Samsung','30:07:4D':'Samsung',\n"
    "    '4C:BC:98':'Samsung','78:52:1A':'Samsung','94:35:0A':'Samsung',\n"
    "    'B4:79:A7':'Samsung','CC:07:AB':'Samsung','E4:92:FB':'Samsung',\n"
    "    /* Xiaomi */\n"
    "    '00:9E:C8':'Xiaomi','04:CF:8C':'Xiaomi','10:2A:B3':'Xiaomi',\n"
    "    '14:F6:5A':'Xiaomi','28:6C:07':'Xiaomi','34:80:B3':'Xiaomi',\n"
    "    '50:8F:4C':'Xiaomi','64:09:80':'Xiaomi','74:23:44':'Xiaomi',\n"
    "    '8C:BE:BE':'Xiaomi','A4:50:46':'Xiaomi','F8:A4:5F':'Xiaomi',\n"
    "    /* Dell */\n"
    "    '00:06:5B':'Dell','00:08:74':'Dell','00:0B:DB':'Dell',\n"
    "    '00:11:43':'Dell','00:12:3F':'Dell','00:13:72':'Dell',\n"
    "    '14:18:77':'Dell','18:03:73':'Dell','18:66:DA':'Dell',\n"
    "    'B8:CA:3A':'Dell','F4:8E:38':'Dell','F8:DB:88':'Dell',\n"
    "    /* HP */\n"
    "    '00:0F:20':'HP','00:11:0A':'HP','00:12:79':'HP',\n"
    "    '00:13:21':'HP','00:14:38':'HP','00:15:60':'HP',\n"
    "    '3C:A8:2A':'HP','58:20:B1':'HP','78:E7:D1':'HP',\n"
    "    'B4:99:BA':'HP','D4:85:64':'HP','FC:15:B4':'HP',\n"
    "    /* Lenovo */\n"
    "    '00:1A:6B':'Lenovo','00:21:CC':'Lenovo','28:D2:44':'Lenovo',\n"
    "    '40:8D:5C':'Lenovo','54:EE:75':'Lenovo','70:F3:95':'Lenovo',\n"
    "    '88:70:8C':'Lenovo','98:FA:9B':'Lenovo','B8:63:4D':'Lenovo',\n"
    "    /* ASUS */\n"
    "    '00:1A:92':'ASUS','00:1D:60':'ASUS','00:22:15':'ASUS',\n"
    "    '08:60:6E':'ASUS','10:02:B5':'ASUS','14:DA:E9':'ASUS',\n"
    "    '2C:4D:54':'ASUS','40:16:7E':'ASUS','50:46:5D':'ASUS',\n"
    "    '74:D0:2B':'ASUS','90:E6:BA':'ASUS','AC:22:0B':'ASUS',\n"
    "    /* Realtek/Common */\n"
    "    'B2:33:88':'Local/Virtual MAC','A6:45:43':'Local/Virtual MAC',\n"
    "    'A2:33:88':'Local/Virtual MAC','02:00:00':'Local/Virtual MAC',\n"
    "    /* D-Link */\n"
    "    '00:05:5D':'D-Link','00:0D:88':'D-Link','00:11:95':'D-Link',\n"
    "    '00:1B:11':'D-Link','00:21:91':'D-Link','00:26:5A':'D-Link',\n"
    "    '1C:7E:E5':'D-Link','28:10:7B':'D-Link','34:08:04':'D-Link',\n"
    "    /* Netgear */\n"
    "    '00:09:5B':'Netgear','00:0F:B5':'Netgear','00:14:6C':'Netgear',\n"
    "    '00:1B:2F':'Netgear','00:1E:2A':'Netgear','00:22:3F':'Netgear',\n"
    "    '20:4E:7F':'Netgear','28:C6:8E':'Netgear','30:46:9A':'Netgear',\n"
    "    /* Zyxel */\n"
    "    '00:13:49':'Zyxel','00:19:CB':'Zyxel','00:A0:C5':'Zyxel',\n"
    "    '28:28:5D':'Zyxel','40:4A:03':'Zyxel','50:67:F0':'Zyxel',\n"
    "    /* Synology */\n"
    "    '00:11:32':'Synology','00:1B:21':'Synology','90:09:D0':'Synology',\n"
    "    /* QNAP */\n"
    "    '00:08:9B':'QNAP','24:5E:BE':'QNAP','00:D0:B4':'QNAP',\n"
)

# Вставляємо перед кінцем _db
if 'Intel' not in oui:
    oui = oui[:idx_db_end] + NEW_MACS + oui[idx_db_end:]
    print('OK: нові MAC записи додано')
else:
    print('OK: Intel вже є в базі')

with tempfile.NamedTemporaryFile(
        suffix='.js', delete=False, mode='w', encoding='utf-8') as tmp:
    tmp.write(oui)
    tmp_name = tmp.name
r3 = subprocess.run(['node','--check', tmp_name], capture_output=True, text=True)
os.unlink(tmp_name)
if r3.returncode != 0:
    print('SYNTAX ERROR oui-lookup!\n' + r3.stderr[:300])
    exit(1)

with open('ai-agent/oui-lookup.js', 'w', encoding='utf-8') as f:
    f.write(oui)
r4 = subprocess.run(['node','--check','ai-agent/oui-lookup.js'],
                    capture_output=True, text=True)
print(f'oui-lookup.js: {"OK ✅" if r4.returncode==0 else "❌"+r4.stderr[:100]}')

# ══════════════════════════════════════════════════════
# Фінальна перевірка
# ══════════════════════════════════════════════════════
print('\n=== ФІНАЛ ===')
all_ok = True
for fname in ['network-scanner.js', 'ai-agent/oui-lookup.js',
              'ai-agent/switch-scanner.js', 'router-manager.js']:
    sz = os.path.getsize(fname)
    rc = subprocess.run(['node','--check', fname],
                        capture_output=True, text=True).returncode
    ok = rc == 0 and sz > 100
    all_ok = all_ok and ok
    print(f'  {"OK" if ok else "FAIL"} {fname} ({sz}b)')

if all_ok:
    subprocess.run(['git','add','-A'], capture_output=True)
    subprocess.run(['git','commit','-m',
        'fix: OUILookup in network-scanner, 200+ MACs in oui-lookup, ping catch'],
        capture_output=True)
    rp = subprocess.run(['git','push','origin','main'],
                        capture_output=True, text=True)
    print('push:', rp.stdout.strip() or rp.stderr.strip()[-60:])
    print('\nDone! npm start')
else:
    print('\nFAIL — не комітимо!')