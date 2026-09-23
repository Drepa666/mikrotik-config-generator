# -*- coding: utf-8 -*-
import subprocess, tempfile, os

# ════ Читаємо rm-shortcuts.js ════
with open('rm-shortcuts.js', 'r', encoding='utf-8') as f:
    sc = f.read()
sc = sc.replace('\r\n', '\n')

# Показуємо поточний trigger код
idx = sc.find("trigger.id = 'sc-trigger'")
print('Поточний trigger:')
print(repr(sc[max(0,idx-50):idx+300]))

# ════ FIX: змінюємо buildUI — вставляємо в lang-switcher замість fixed ════
OLD_TRIGGER = (
    "    /* Trigger button */\n"
    "    var trigger = document.createElement('button');\n"
    "    trigger.id = 'sc-trigger';\n"
    "    trigger.title = 'Keyboard Shortcuts (Ctrl+?)';\n"
    "    trigger.innerHTML = '?';\n"
    "    document.body.appendChild(trigger);\n"
)
NEW_TRIGGER = (
    "    /* Trigger button — вставляємо в lang-switcher */\n"
    "    var trigger = document.createElement('button');\n"
    "    trigger.id = 'sc-trigger';\n"
    "    trigger.title = 'Keyboard Shortcuts (Ctrl+?)';\n"
    "    trigger.innerHTML = '?';\n"
    "    /* Шукаємо lang-switcher */\n"
    "    var langSw = document.getElementById('lang-switcher');\n"
    "    if (langSw) {\n"
    "      /* Роздільник */\n"
    "      var sep = document.createElement('span');\n"
    "      sep.style.cssText = 'width:1px;background:#2a3b48;margin:4px 4px;';\n"
    "      langSw.appendChild(sep);\n"
    "      langSw.appendChild(trigger);\n"
    "    } else {\n"
    "      /* Fallback — fixed position */\n"
    "      document.body.appendChild(trigger);\n"
    "    }\n"
)

print(f'\nOLD_TRIGGER: {"FOUND" if OLD_TRIGGER in sc else "NOT FOUND"}')

if OLD_TRIGGER in sc:
    sc = sc.replace(OLD_TRIGGER, NEW_TRIGGER, 1)
    print('OK: trigger перенесено в lang-switcher')
else:
    # Показуємо що є навколо trigger
    idx2 = sc.find('sc-trigger')
    print(f'Реальний код @ {idx2}:')
    print(repr(sc[max(0,idx2-100):idx2+300]))
    exit(1)

# ════ FIX CSS: прибираємо fixed position зі стилю кнопки ════
OLD_CSS = (
    "      '#sc-trigger {',\n"
    "      '  position:fixed; bottom:16px; right:60px; z-index:9990;',\n"
    "      '  width:36px; height:36px; border-radius:50%;',\n"
    "      '  background:#0d1117; border:1px solid #2a3b48;',\n"
    "      '  color:#4a6070; cursor:pointer; font-size:16px;',\n"
    "      '  display:flex; align-items:center; justify-content:center;',\n"
    "      '  transition:all .2s;',\n"
    "      '}',\n"
    "      '#sc-trigger:hover {',\n"
    "      '  border-color:#5fd0a5; color:#5fd0a5;',\n"
    "      '  box-shadow:0 0 12px rgba(95,208,165,.2);',\n"
    "      '}',\n"
)
NEW_CSS = (
    "      '#sc-trigger {',\n"
    "      '  background:transparent; border:1px solid #2a3b48;',\n"
    "      '  color:#8ea3b0; cursor:pointer; font-size:13px;',\n"
    "      '  font-weight:700; border-radius:6px;',\n"
    "      '  padding:3px 10px; transition:all .15s;',\n"
    "      '  display:inline-flex; align-items:center; gap:4px;',\n"
    "      '}',\n"
    "      '#sc-trigger:hover {',\n"
    "      '  border-color:#5fd0a5; color:#5fd0a5;',\n"
    "      '}',\n"
)
print(f'OLD_CSS: {"FOUND" if OLD_CSS in sc else "NOT FOUND — шукаємо частину"}')
if OLD_CSS in sc:
    sc = sc.replace(OLD_CSS, NEW_CSS, 1)
    print('OK: CSS оновлено')
else:
    # Замінюємо тільки position:fixed рядок
    sc = sc.replace(
        "'  position:fixed; bottom:16px; right:60px; z-index:9990;',",
        "'  display:inline-flex; align-items:center; gap:4px;',",
        1
    )
    print('OK: fixed position прибрано')

# ════ Оновлюємо innerHTML кнопки — додаємо іконку ════
sc = sc.replace(
    "    trigger.innerHTML = '?';",
    "    trigger.innerHTML = '&#9875; ?';",
    1
)
print('OK: іконку додано')

# ════ Tempfile ════
with tempfile.NamedTemporaryFile(
        suffix='.js', delete=False, mode='w', encoding='utf-8') as tmp:
    tmp.write(sc)
    tmp_name = tmp.name

r = subprocess.run(['node','--check', tmp_name], capture_output=True, text=True)
os.unlink(tmp_name)
if r.returncode != 0:
    print('SYNTAX ERROR!\n' + r.stderr[:300])
    exit(1)
print('Tempfile: OK')

# ════ Записуємо ════
with open('rm-shortcuts.js', 'w', encoding='utf-8') as f:
    f.write(sc)

size = os.path.getsize('rm-shortcuts.js')
r2 = subprocess.run(['node','--check','rm-shortcuts.js'], capture_output=True, text=True)
print(f'rm-shortcuts.js: {"OK ✅" if r2.returncode==0 else "FAIL"} ({size:,}b)')
if r2.returncode != 0:
    print(r2.stderr[:200])
    exit(1)

# ════ Git ════
subprocess.run(['git','add','rm-shortcuts.js'], capture_output=True)
subprocess.run(['git','commit','-m',
    'fix: move shortcuts button into lang-switcher header'],
    capture_output=True)
rp = subprocess.run(['git','push','origin','main'], capture_output=True, text=True)
print('push:', rp.stdout.strip() or rp.stderr.strip()[-60:])
print('\nDone! npm start')