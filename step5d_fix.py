# -*- coding: utf-8 -*-
import subprocess, tempfile, os

with open('ai-agent/switch-scanner.js', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('\r\n', '\n')

# КРОК 1: Перевіряємо реальне значення source в коді
print('source values в коді:')
import re
for m in re.finditer(r"source:\s*['\"]([^'\"]+)['\"]", content):
    print(f'  {repr(m.group())}')

# КРОК 2: Фікс — робимо confirmed case-insensitive
OLD_CONFIRMED = (
    "      var confirmed = d.source && (\n"
    "        d.source.includes('DHCP') ||\n"
    "        d.source.includes('LLDP') ||\n"
    "        d.source.includes('WiFi')\n"
    "      );"
)
NEW_CONFIRMED = (
    "      /* case-insensitive — source може бути ARP+DHCP або arp+dhcp */\n"
    "      var _src = (d.source || '').toLowerCase();\n"
    "      var confirmed = _src.includes('dhcp') ||\n"
    "                      _src.includes('lldp') ||\n"
    "                      _src.includes('wifi');"
)

print(f'\nOLD confirmed: {"FOUND" if OLD_CONFIRMED in content else "NOT FOUND"}')

if OLD_CONFIRMED in content:
    content = content.replace(OLD_CONFIRMED, NEW_CONFIRMED, 1)
    print('OK: confirmed тепер case-insensitive')
else:
    # Шукаємо будь-який варіант
    m2 = re.search(r"var confirmed = d\.source.*?;", content, re.DOTALL)
    if m2:
        print(f'Знайдено інший варіант: {repr(m2.group())}')
        content = content[:m2.start()] + NEW_CONFIRMED + content[m2.end():]
        print('OK: замінено через regex')

# Також фіксуємо всі інші місця де перевіряємо source
# confirmedCount, _green, legendEl тощо
OLD_CHECKS = [
    "d.source.includes('DHCP') ||\n               d.source.includes('LLDP') || d.source.includes('WiFi')",
    "d.source.includes('DHCP') ||\n          (d.source.includes('LLDP') || d.source.includes('WiFi'))",
    "d.source.includes('DHCP')||d.source.includes('LLDP')||d.source.includes('WiFi')",
    "d.source.includes('DHCP') ||\n        d.source.includes('LLDP') ||\n        d.source.includes('WiFi')",
    "(d.source.includes('DHCP') ||\n               d.source.includes('LLDP') || d.source.includes('WiFi'))",
]

def make_ci_check(indent=''):
    return (
        "(d.source || '').toLowerCase().includes('dhcp') ||\n"
        + indent + "               (d.source || '').toLowerCase().includes('lldp') ||\n"
        + indent + "               (d.source || '').toLowerCase().includes('wifi')"
    )

count_replaced = 0
for old in OLD_CHECKS:
    if old in content:
        new = make_ci_check()
        content = content.replace(old, new)
        count_replaced += 1

# Замінюємо всі що залишились через regex
def replace_source_check(m):
    return "(d.source || '').toLowerCase().includes('dhcp') || (d.source || '').toLowerCase().includes('lldp') || (d.source || '').toLowerCase().includes('wifi')"

content = re.sub(
    r"d\.source\.includes\('DHCP'\)\s*\|\|\s*[^\n]*\.includes\('LLDP'\)\s*\|\|\s*[^\n]*\.includes\('WiFi'\)",
    replace_source_check,
    content
)
print(f'OK: {count_replaced} додаткових source checks замінено')

# ARP only перевірка теж
content = re.sub(
    r"d\.source\s*===\s*'ARP'",
    "(d.source || '').toLowerCase() === 'arp'",
    content
)
print('OK: ARP only checks зроблено case-insensitive')

# КРОК 3: Tempfile
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

# КРОК 4: Записуємо
with open('ai-agent/switch-scanner.js', 'w', encoding='utf-8') as f:
    f.write(content)

size = os.path.getsize('ai-agent/switch-scanner.js')
r2 = subprocess.run(['node','--check','ai-agent/switch-scanner.js'],
                    capture_output=True, text=True)
print(f'switch-scanner.js: {"OK ✅" if r2.returncode==0 else "❌"} ({size}b)')
if r2.returncode != 0:
    print(r2.stderr[:200])
    exit(1)

subprocess.run(['git','add','ai-agent/switch-scanner.js'], capture_output=True)
subprocess.run(['git','commit','-m',
    'fix: case-insensitive source check, bondarenko-ay green dot'],
    capture_output=True)
rp = subprocess.run(['git','push','origin','main'], capture_output=True, text=True)
print('push:', rp.stdout.strip() or rp.stderr.strip()[-60:])
print('\nDone! npm start')