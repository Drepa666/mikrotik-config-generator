# -*- coding: utf-8 -*-
import subprocess, tempfile, os

with open('topology-visual.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f'Рядків до: {len(lines)}')

# ════ FIX 1: Додаємо var links поруч з var nodes (рядок 9, індекс 8) ════
print(f'\nРядок 9: {repr(lines[8])}')
print(f'Рядок 10: {repr(lines[9])}')

if 'var links' not in ''.join(lines[:15]):
    # Вставляємо після рядка 9 (індекс 8)
    lines.insert(9, '  var links    = [];   /* { from, to, label, dashed } */\n')
    print('OK: var links додано після var nodes')
else:
    print('OK: var links вже є')

# ════ FIX 2: Видаляємо дублювання TopoVisual (рядки 1436-1437) ════
# Після FIX 1 рядки зсунулись на +1
content = ''.join(lines)

OLD_DUP = (
    "  window.TopoVisual = window.TopoVisual || {};\n"
    "  window.TopoVisual.runSwitchScan       = runSwitchScan;\n"
    "  window.TopoVisual.buildSwitchTopology = buildSwitchTopology;\n"
    "\n"
    "  window.TopoVisual = window.TopoVisual || {};\n"
    "  window.TopoVisual.runSwitchScan = runSwitchScan;\n"
)
NEW_DUP = (
    "  window.TopoVisual = window.TopoVisual || {};\n"
    "  window.TopoVisual.runSwitchScan       = runSwitchScan;\n"
    "  window.TopoVisual.buildSwitchTopology = buildSwitchTopology;\n"
)
if OLD_DUP in content:
    content = content.replace(OLD_DUP, NEW_DUP, 1)
    print('OK: дублювання TopoVisual видалено')
else:
    print('WARN: дублювання не знайдено — перевіряємо вручну')
    idx = content.rfind('window.TopoVisual = window.TopoVisual || {};')
    print(repr(content[max(0,idx-10):idx+150]))

# ════ Перевіряємо в tempfile ════
with tempfile.NamedTemporaryFile(
        suffix='.js', delete=False, mode='w', encoding='utf-8') as tmp:
    tmp.write(content)
    tmp_name = tmp.name

r = subprocess.run(['node','--check', tmp_name],
                   capture_output=True, text=True)
os.unlink(tmp_name)

if r.returncode != 0:
    print('SYNTAX ERROR — не записуємо!')
    print(r.stderr[:300])
    exit(1)
print('Tempfile: OK')

# ════ Записуємо ════
with open('topology-visual.js', 'w', encoding='utf-8') as f:
    f.write(content)

size = os.path.getsize('topology-visual.js')
r2 = subprocess.run(['node','--check','topology-visual.js'],
                    capture_output=True, text=True)
print(f'topology-visual.js: {"OK ✅" if r2.returncode==0 else "❌"} ({size}b)')
if r2.returncode != 0:
    print(r2.stderr[:200])
    exit(1)

# Перевіряємо що var links є
with open('topology-visual.js', 'r', encoding='utf-8') as f:
    check = f.readlines()
print(f'\nРядки 8-12 після фіксу:')
for i, l in enumerate(check[7:12], 8):
    print(f'  {i}: {repr(l)}')

# Git
subprocess.run(['git','add','topology-visual.js'], capture_output=True)
subprocess.run(['git','commit','-m',
    'fix: add missing var links=[], remove duplicate TopoVisual'],
    capture_output=True)
rp = subprocess.run(['git','push','origin','main'],
                    capture_output=True, text=True)
print('push:', rp.stdout.strip() or rp.stderr.strip()[-60:])
print('\nDone! npm start')