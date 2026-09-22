# -*- coding: utf-8 -*-
import subprocess, tempfile, os

with open('main.js', 'r', encoding='utf-8') as f:
    mj = f.read()
mj = mj.replace('\r\n', '\n')

# ТОЧНИЙ OLD з виводу
OLD = (
    "      var result = Object.values(devices).filter(function(d) {\n"
    "        return d.ip && !d.ip.endsWith('.0') && !d.ip.endsWith('.255');\n"
    "      });"
)

NEW = (
    "      var result = Object.values(devices).filter(function(d) {\n"
    "        if (!d.ip) return false;\n"
    "        if (d.ip.endsWith('.0'))   return false;\n"
    "        if (d.ip.endsWith('.255')) return false;\n"
    "        /* multicast 224.x - 239.x */\n"
    "        var first = parseInt(d.ip.split('.')[0], 10);\n"
    "        if (first >= 224 && first <= 239) return false;\n"
    "        /* multicast MAC — перший байт непарний */\n"
    "        if (d.mac) {\n"
    "          var b = parseInt((d.mac.split(':')[0]||'0'), 16);\n"
    "          if (b & 0x01) return false;\n"
    "        }\n"
    "        return true;\n"
    "      });"
)

print(f'OLD знайдено: {"YES" if OLD in mj else "NO"}')
if OLD not in mj:
    exit(1)

mj_new = mj.replace(OLD, NEW, 1)

# Tempfile перевірка
with tempfile.NamedTemporaryFile(
        suffix='.js', delete=False, mode='w', encoding='utf-8') as tmp:
    tmp.write(mj_new)
    tmp_name = tmp.name

r = subprocess.run(['node','--check', tmp_name], capture_output=True, text=True)
os.unlink(tmp_name)
if r.returncode != 0:
    print('SYNTAX ERROR!\n' + r.stderr[:200])
    exit(1)
print('Tempfile: OK')

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(mj_new)

r2 = subprocess.run(['node','--check','main.js'], capture_output=True, text=True)
print(f'main.js: {"OK" if r2.returncode==0 else "❌"+r2.stderr[:100]}')

subprocess.run(['git','add','main.js'], capture_output=True)
subprocess.run(['git','commit','-m','fix: filter multicast IPs and MACs in direct-scan'],
               capture_output=True)
subprocess.run(['git','push','origin','main'], capture_output=True)
print('Done! npm start')