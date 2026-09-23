# -*- coding: utf-8 -*-
import subprocess, tempfile, os

with open('rm-datastore.js', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('\r\n', '\n')

# Фікс 1: закоментувати health
OLD = "        health:          '/system/health',\n"
NEW = "        /* health: '/system/health', */\n"
if OLD in content:
    content = content.replace(OLD, NEW, 1)
    print('OK: health закоментовано')
else:
    print('WARN: health не знайдено')

# Фікс 2: статус 400/404 не кидати помилку
OLD2 = "      return r.json().catch(function() { return {}; });\n    });\n  }"
NEW2 = "      if (r.status === 400 || r.status === 404) return [];\n      return r.json().catch(function() { return {}; });\n    }).catch(function() { return []; });\n  }"
if OLD2 in content:
    content = content.replace(OLD2, NEW2, 1)
    print('OK: 400/404 handled')
else:
    print('WARN: OLD2 не знайдено')

# Tempfile check
with tempfile.NamedTemporaryFile(suffix='.js', delete=False, mode='w', encoding='utf-8') as tmp:
    tmp.write(content)
    tmp_name = tmp.name
r = subprocess.run(['node','--check', tmp_name], capture_output=True, text=True)
os.unlink(tmp_name)
if r.returncode != 0:
    print('SYNTAX ERROR!\n' + r.stderr[:200])
    exit(1)
print('Tempfile: OK')

with open('rm-datastore.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('rm-datastore.js: OK')

subprocess.run(['git','pull','--rebase','origin','main'], capture_output=True)
subprocess.run(['git','add','rm-datastore.js'], capture_output=True)
subprocess.run(['git','commit','-m','fix: health endpoint disabled, silent 400/404'], capture_output=True)
rp = subprocess.run(['git','push','origin','main'], capture_output=True, text=True)
print('push:', rp.stdout.strip() or rp.stderr.strip()[-60:])
print('Done! npm start')