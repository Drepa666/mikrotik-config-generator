# -*- coding: utf-8 -*-
import subprocess, tempfile, os

# КРОК 1: Читаємо і показуємо точний код runSwitchScan
with open('topology-visual.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print('Рядки 1218-1250:')
for i, l in enumerate(lines[1217:1250], 1218):
    print(f'  {i}: {repr(l)}')

# КРОК 2: Знаходимо точний OLD текст
with open('topology-visual.js', 'r', encoding='utf-8') as f:
    tv = f.read()
tv = tv.replace('\r\n', '\n')

# Знаходимо весь блок з prompt()
OLD = (
    "  function runSwitchScan() {\n"
    "    var subnet = prompt('Subnet to scan (e.g. 192.168.88 or 10.1.51):', '192.168.88');\n"
    "    if (!subnet || !subnet.trim()) return;\n"
    "    subnet = subnet.trim();\n"
)

print(f'\nOLD знайдено: {"YES" if OLD in tv else "NO ❌"}')
if OLD not in tv:
    idx = tv.find('function runSwitchScan')
    print('Реальний код:')
    print(repr(tv[idx:idx+300]))
    exit(1)

# КРОК 3: NEW — власний діалог замість prompt()
# Тільки ASCII + html entities
NEW = (
    "  function runSwitchScan() {\n"
    "    /* prompt() not supported in Electron -- use custom dialog */\n"
    "    var old = document.getElementById('sw-scan-dlg');\n"
    "    if (old) { old.remove(); return; }\n"
    "    var dlg = document.createElement('div');\n"
    "    dlg.id = 'sw-scan-dlg';\n"
    "    dlg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);'\n"
    "      + 'background:#0d1117;border:2px solid #5a3a9a;border-radius:12px;'\n"
    "      + 'padding:24px 28px;z-index:9999999;min-width:320px;'\n"
    "      + 'box-shadow:0 8px 40px rgba(0,0,0,.8);';\n"
    "    dlg.innerHTML =\n"
    "      '<div style=\"color:#c084fc;font-weight:700;font-size:15px;margin-bottom:16px;\">'\n"
    "        + '&#128268; Switch Scan</div>'\n"
    "      + '<div style=\"color:#8ea3b0;font-size:12px;margin-bottom:12px;\">'\n"
    "        + 'Subnet to scan:</div>'\n"
    "      + '<div style=\"display:flex;gap:8px;margin-bottom:16px;\">'\n"
    "        + '<input id=\"sw-scan-input\" type=\"text\" value=\"192.168.88\"'\n"
    "        + ' style=\"flex:1;background:#060d14;border:1px solid #2a3b48;'\n"
    "        + 'color:#e6edf3;padding:8px 12px;border-radius:6px;font-size:14px;'\n"
    "        + 'font-family:monospace;\">'\n"
    "        + '<span style=\"color:#4a6070;line-height:36px;\">.0/24</span>'\n"
    "      + '</div>'\n"
    "      + '<div style=\"display:flex;gap:8px;\">'\n"
    "        + '<button id=\"sw-scan-ok\" style=\"flex:1;background:linear-gradient(135deg,#2a1a4a,#3a2a6a);'\n"
    "        + 'border:1px solid #5a3a9a;color:#c084fc;border-radius:8px;'\n"
    "        + 'padding:9px;cursor:pointer;font-size:13px;font-weight:700;\">'\n"
    "        + '&#128269; Scan</button>'\n"
    "        + '<button id=\"sw-scan-cancel\" style=\"background:transparent;'\n"
    "        + 'border:1px solid #2a3b48;color:#4a6070;border-radius:8px;'\n"
    "        + 'padding:9px 16px;cursor:pointer;font-size:13px;\">'\n"
    "        + '&#10005;</button>'\n"
    "      + '</div>';\n"
    "    document.body.appendChild(dlg);\n"
    "    var inp = document.getElementById('sw-scan-input');\n"
    "    inp.focus(); inp.select();\n"
    "    document.getElementById('sw-scan-cancel').onclick = function() { dlg.remove(); };\n"
    "    document.getElementById('sw-scan-ok').onclick = function() {\n"
    "      var subnet = inp.value.trim();\n"
    "      dlg.remove();\n"
    "      if (!subnet) return;\n"
    "      runSwitchScanStart(subnet);\n"
    "    };\n"
    "    inp.addEventListener('keydown', function(e) {\n"
    "      if (e.key === 'Enter') {\n"
    "        var subnet = inp.value.trim();\n"
    "        dlg.remove();\n"
    "        if (subnet) runSwitchScanStart(subnet);\n"
    "      }\n"
    "      if (e.key === 'Escape') dlg.remove();\n"
    "    });\n"
    "  }\n"
    "\n"
    "  function runSwitchScanStart(subnet) {\n"
)

# КРОК 4: Перевіряємо що після OLD іде блок зі st = createElement
# Тобто NEW просто замінює початок функції, решта залишається
idx_old = tv.find(OLD)
idx_after = idx_old + len(OLD)

# Перевіряємо що далі
print(f'\nПісля OLD:')
print(repr(tv[idx_after:idx_after+100]))

tv_new = tv[:idx_old] + NEW + tv[idx_after:]

# Також видаляємо дублювання window.TopoVisual.runSwitchScan
# Рядок 1384 і 1388 — обидва є, залишаємо тільки один
OLD_DUP = (
    "  window.TopoVisual.runSwitchScan       = runSwitchScan;\n"
    "  window.TopoVisual.buildSwitchTopology = buildSwitchTopology;\n"
    "\n"
    "\n"
    "  window.TopoVisual = window.TopoVisual || {};\n"
    "  window.TopoVisual.runSwitchScan = runSwitchScan;\n"
)
NEW_DUP = (
    "  window.TopoVisual = window.TopoVisual || {};\n"
    "  window.TopoVisual.runSwitchScan       = runSwitchScan;\n"
    "  window.TopoVisual.buildSwitchTopology = buildSwitchTopology;\n"
)
if OLD_DUP in tv_new:
    tv_new = tv_new.replace(OLD_DUP, NEW_DUP, 1)
    print('OK: дублювання TopoVisual видалено')

# КРОК 5: Tempfile перевірка
with tempfile.NamedTemporaryFile(
        suffix='.js', delete=False, mode='w', encoding='utf-8') as tmp:
    tmp.write(tv_new)
    tmp_name = tmp.name

r = subprocess.run(['node','--check', tmp_name], capture_output=True, text=True)
os.unlink(tmp_name)

if r.returncode != 0:
    print('SYNTAX ERROR — не записуємо!')
    print(r.stderr[:300])
    exit(1)

print('Tempfile: OK')

# КРОК 6: Записуємо
with open('topology-visual.js', 'w', encoding='utf-8') as f:
    f.write(tv_new)

size = os.path.getsize('topology-visual.js')
r2 = subprocess.run(['node','--check','topology-visual.js'],
                    capture_output=True, text=True)
print(f'topology-visual.js: {"OK ✅" if r2.returncode==0 else "❌"} ({size}b)')
if r2.returncode != 0:
    print(r2.stderr[:200])
    exit(1)

# Git
subprocess.run(['git','add','topology-visual.js'], capture_output=True)
subprocess.run(['git','commit','-m',
    'fix: replace prompt() with custom dialog in runSwitchScan'],
    capture_output=True)
rp = subprocess.run(['git','push','origin','main'], capture_output=True, text=True)
print('push:', rp.stdout.strip() or rp.stderr.strip()[-60:])
print('\nDone! npm start')