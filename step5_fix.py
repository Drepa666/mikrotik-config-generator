# -*- coding: utf-8 -*-
import subprocess, tempfile, os

with open('ai-agent/switch-scanner.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f'Рядків: {len(lines)}')

# ════ FIX 1: Після ARP — додаємо індекс по IP ════
# Знаходимо рядок після ARP forEach (рядок 68 = '      });\n')
# Вставляємо індекс по IP перед DHCP блоком

# Шукаємо точне місце: після ARP блоку, перед '      /* DHCP */'
dhcp_comment = None
for i, l in enumerate(lines, 1):
    if '/* DHCP */' in l:
        dhcp_comment = i - 1  # індекс (0-based)
        print(f'DHCP comment @ рядок {i}')
        break

if dhcp_comment is None:
    print('DHCP comment not found!')
    exit(1)

print(f'Вставляємо після рядка {dhcp_comment} (0-based index):')
print(repr(lines[dhcp_comment-1]))

INSERT_IP_INDEX = (
    "\n"
    "      /* Вторинний індекс по IP для надійного мержу */\n"
    "      var byIP = {};\n"
    "      Object.values(devices).forEach(function(d) {\n"
    "        if (d.ip) byIP[d.ip] = d;\n"
    "      });\n"
    "\n"
)
lines.insert(dhcp_comment, INSERT_IP_INDEX)
print('OK: IP index inserted')

# ════ FIX 2: DHCP мерж — шукаємо по mac АБО ip ════
# Після вставки рядки зсунулись на 1
# Знаходимо: if (devices[key]) {  в DHCP блоці
content = ''.join(lines)

OLD_DHCP_LOOKUP = (
    "        if (devices[key]) {\n"
    "          devices[key].hostname = e['host-name'] || '';\n"
    "          devices[key].dhcpName = e['host-name'] || '';\n"
    "          devices[key].comment  = e['comment']   || '';\n"
    "          /* Якщо DHCP каже bound — точно онлайн */\n"
    "          if (dhcpOnline) devices[key].online = true;\n"
    "          if (!devices[key].source.includes('DHCP'))\n"
    "            devices[key].source += '+DHCP';\n"
)
NEW_DHCP_LOOKUP = (
    "        /* Шукаємо по MAC або IP */\n"
    "        var existing = devices[key] || byIP[ip];\n"
    "        if (existing) {\n"
    "          existing.hostname = e['host-name'] || existing.hostname || '';\n"
    "          existing.dhcpName = e['host-name'] || '';\n"
    "          existing.comment  = e['comment']   || existing.comment  || '';\n"
    "          /* DHCP bound = підтверджено онлайн */\n"
    "          if (dhcpOnline) existing.online = true;\n"
    "          if (!existing.source.includes('DHCP'))\n"
    "            existing.source += '+DHCP';\n"
)
if OLD_DHCP_LOOKUP in content:
    content = content.replace(OLD_DHCP_LOOKUP, NEW_DHCP_LOOKUP, 1)
    print('OK: DHCP lookup fixed (mac OR ip)')
else:
    print('WARN: OLD_DHCP_LOOKUP not found')
    idx = content.find("devices[key].hostname = e['host-name']")
    print(repr(content[max(0,idx-100):idx+200]))

# Також фіксуємо закриваючий } else if -> else if
OLD_ELSE = (
    "        } else if (ip) {\n"
    "          devices[key] = {\n"
    "            ip: ip, mac: mac, iface: '',\n"
    "            hostname: e['host-name'] || '',\n"
    "            vendor: '', type: '', typeIcon: '',\n"
    "            signal: '', dhcpName: e['host-name'] || '',\n"
    "            comment: e['comment'] || '',\n"
    "            online: dhcpOnline,\n"
    "            source: 'DHCP',\n"
    "          };\n"
    "        }\n"
)
NEW_ELSE = (
    "        } else if (ip) {\n"
    "          devices[key] = {\n"
    "            ip: ip, mac: mac, iface: '',\n"
    "            hostname: e['host-name'] || '',\n"
    "            vendor: '', type: '', typeIcon: '',\n"
    "            signal: '', dhcpName: e['host-name'] || '',\n"
    "            comment: e['comment'] || '',\n"
    "            online: dhcpOnline,\n"
    "            source: 'DHCP',\n"
    "          };\n"
    "          if (ip) byIP[ip] = devices[key];\n"
    "        }\n"
)
if OLD_ELSE in content:
    content = content.replace(OLD_ELSE, NEW_ELSE, 1)
    print('OK: DHCP else branch updated byIP')

# ════ FIX 3: pingCheck — не перезаписує online якщо DHCP/LLDP ════
OLD_PING_ONLINE = (
    "          d.online = rcv > 0 ||\n"
    "                     out.includes('time=') ||\n"
    "                     out.toLowerCase().includes('ttl=');\n"
)
NEW_PING_ONLINE = (
    "          var pingOk = rcv > 0 ||\n"
    "                       out.includes('time=') ||\n"
    "                       out.toLowerCase().includes('ttl=');\n"
    "          /* Якщо підтверджено DHCP/LLDP — не ставимо offline по пінгу */\n"
    "          var isConfirmed = d.source && (\n"
    "            d.source.includes('DHCP') ||\n"
    "            d.source.includes('LLDP') ||\n"
    "            d.source.includes('WiFi')\n"
    "          );\n"
    "          if (!isConfirmed) d.online = pingOk;\n"
)
if OLD_PING_ONLINE in content:
    content = content.replace(OLD_PING_ONLINE, NEW_PING_ONLINE, 1)
    print('OK: pingCheck does not override DHCP/LLDP confirmed devices')
else:
    print('WARN: pingCheck pattern not found')
    idx2 = content.find("out.includes('time=')")
    print(repr(content[max(0,idx2-50):idx2+150]))

# ════ Tempfile перевірка ════
with tempfile.NamedTemporaryFile(
        suffix='.js', delete=False, mode='w', encoding='utf-8') as tmp:
    tmp.write(content)
    tmp_name = tmp.name

r = subprocess.run(['node','--check', tmp_name], capture_output=True, text=True)
os.unlink(tmp_name)

if r.returncode != 0:
    print('SYNTAX ERROR!\n' + r.stderr[:300])
    exit(1)
print('Tempfile: OK')

# ════ Записуємо ════
with open('ai-agent/switch-scanner.js', 'w', encoding='utf-8') as f:
    f.write(content)

size = os.path.getsize('ai-agent/switch-scanner.js')
r2 = subprocess.run(['node','--check','ai-agent/switch-scanner.js'],
                    capture_output=True, text=True)
print(f'switch-scanner.js: {"OK ✅" if r2.returncode==0 else "❌"} ({size}b)')
if r2.returncode != 0:
    print(r2.stderr[:200])
    exit(1)

# Git
subprocess.run(['git','add','ai-agent/switch-scanner.js'], capture_output=True)
subprocess.run(['git','commit','-m',
    'fix: DHCP merge by mac OR ip, pingCheck respects DHCP/LLDP confirmed status'],
    capture_output=True)
rp = subprocess.run(['git','push','origin','main'], capture_output=True, text=True)
print('push:', rp.stdout.strip() or rp.stderr.strip()[-60:])
print('\nDone! npm start')