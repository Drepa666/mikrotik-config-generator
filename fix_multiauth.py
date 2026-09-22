# -*- coding: utf-8 -*-
import subprocess

# ════════════════════════════════════
# 1. Фіксуємо router-manager.js
# ════════════════════════════════════
with open('router-manager.js', 'r', encoding='utf-8') as f:
    rm = f.read()

# Фікс addRouter — прибираємо default 'admin'
old_add = (
    "      user:      cfg.user || 'admin',\n"
    "      pass:      cfg.pass || '',"
)
new_add = (
    "      user:      cfg.user || '',\n"
    "      pass:      cfg.pass || '',"
)

if old_add in rm:
    rm = rm.replace(old_add, new_add)
    print('OK: addRouter no default admin ✅')

# Фікс rm-form-saved — зберігаємо також IP роутера
old_form_save = (
    "        localStorage.setItem('rm-form-saved', JSON.stringify({\n"
    "          user:user, pass:remember?pass:'', remember:remember\n"
    "        }));"
)
new_form_save = (
    "        localStorage.setItem('rm-form-saved', JSON.stringify({\n"
    "          user:user, pass:remember?pass:'', remember:remember\n"
    "        }));\n"
    "        /* Оновлюємо також rm-routers — щоб diff/scanner мали правильні дані */\n"
    "        try {\n"
    "          var _rs  = JSON.parse(localStorage.getItem('rm-routers') || '[]');\n"
    "          var _aid = localStorage.getItem('rm-active-router');\n"
    "          var _ar  = _rs.find(function(r){return r.id===_aid;});\n"
    "          if (_ar) {\n"
    "            _ar.user = user;\n"
    "            if (remember) _ar.pass = pass;\n"
    "            localStorage.setItem('rm-routers', JSON.stringify(_rs));\n"
    "            console.log('[RM] rm-routers synced:', _ar.ip, user);\n"
    "          }\n"
    "        } catch(e) {}"
)

if old_form_save in rm:
    rm = rm.replace(old_form_save, new_form_save)
    print('OK: rm-form-saved синхронізує rm-routers ✅')
else:
    print('WARN: rm-form-saved не знайдено — шукаємо')
    idx = rm.find("'rm-form-saved'")
    print(repr(rm[max(0,idx-50):idx+200]))

with open('router-manager.js', 'w', encoding='utf-8') as f:
    f.write(rm)

r = subprocess.run(['node', '--check', 'router-manager.js'],
                   capture_output=True, text=True)
print('router-manager:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:200])

# ════════════════════════════════════
# 2. Фіксуємо diff-apply.js — 
#    читаємо SSH порт з роутера
# ════════════════════════════════════
with open('diff-apply.js', 'r', encoding='utf-8') as f:
    diff = f.read()

# Замінюємо syncFromTerminal — правильний пріоритет
old_sync_start = "function syncFromTerminal() {"
idx_sync = diff.find(old_sync_start)
depth = 0; found = False; end_sync = idx_sync
for i, ch in enumerate(diff[idx_sync:], idx_sync):
    if ch == '{': depth += 1; found = True
    elif ch == '}': depth -= 1
    if found and depth == 0: end_sync = i + 1; break

NEW_SYNC = (
    "function syncFromTerminal() {\n"
    "    var daIp   = document.getElementById('da-ip');\n"
    "    var daUser = document.getElementById('da-user');\n"
    "    var daPass = document.getElementById('da-pass');\n"
    "    if (!daIp || !daUser || !daPass) return;\n\n"
    "    try {\n"
    "      /* 1. Активний роутер з rm-routers */\n"
    "      var activeId = localStorage.getItem('rm-active-router');\n"
    "      var routers  = JSON.parse(localStorage.getItem('rm-routers') || '[]');\n"
    "      var active   = routers.find(function(r) { return r.id === activeId; })\n"
    "                  || routers[0]\n"
    "                  || null;\n\n"
    "      if (active) {\n"
    "        if (active.ip)   daIp.value   = active.ip;\n"
    "        if (active.user) daUser.value = active.user;\n"
    "        if (active.pass) daPass.value = active.pass;\n"
    "        console.log('[DiffApply] sync from rm-routers:',\n"
    "          active.ip, active.user, 'pass:', active.pass ? '***' : 'empty');\n"
    "      }\n\n"
    "      /* 2. Якщо пароль порожній — беремо з rm-form-saved */\n"
    "      if (!daPass.value) {\n"
    "        var formSaved = JSON.parse(localStorage.getItem('rm-form-saved') || 'null');\n"
    "        if (formSaved) {\n"
    "          if (formSaved.user && !daUser.value) daUser.value = formSaved.user;\n"
    "          if (formSaved.pass)                  daPass.value = formSaved.pass;\n"
    "          console.log('[DiffApply] pass from rm-form-saved:', formSaved.user);\n"
    "        }\n"
    "      }\n\n"
    "      /* 3. Якщо user порожній — беремо з rm-form-saved */\n"
    "      if (!daUser.value) {\n"
    "        var fs2 = JSON.parse(localStorage.getItem('rm-form-saved') || 'null');\n"
    "        if (fs2 && fs2.user) daUser.value = fs2.user;\n"
    "      }\n\n"
    "    } catch(e) {\n"
    "      console.warn('[DiffApply] syncFromTerminal error:', e);\n"
    "    }\n"
    "  }"
)

diff = diff[:idx_sync] + NEW_SYNC + diff[end_sync:]
print('OK: syncFromTerminal повна перепис ✅')

with open('diff-apply.js', 'w', encoding='utf-8') as f:
    f.write(diff)

r2 = subprocess.run(['node', '--check', 'diff-apply.js'],
                    capture_output=True, text=True)
print('diff-apply:', 'OK ✅' if r2.returncode == 0 else '❌\n' + r2.stderr[:200])

# ════════════════════════════════════
# 3. Виправляємо rm-routers в localStorage
#    через спеціальний патч-скрипт
# ════════════════════════════════════
PATCH_JS = (
    "/* Патч localStorage — виконати ОДИН РАЗ в консолі */\n"
    "(function fixRouters() {\n"
    "  try {\n"
    "    var routers = JSON.parse(localStorage.getItem('rm-routers') || '[]');\n"
    "    var form    = JSON.parse(localStorage.getItem('rm-form-saved') || '{}');\n"
    "    console.log('Поточні роутери:', JSON.stringify(routers));\n"
    "    console.log('Збережений логін:', form);\n"
    "    routers.forEach(function(r) {\n"
    "      console.log('Router:', r.id, r.ip, 'user:', r.user, 'pass:', r.pass ? '***' : 'EMPTY');\n"
    "      /* Якщо пароль порожній — беремо з form-saved */\n"
    "      if (!r.pass && form.pass) {\n"
    "        r.pass = form.pass;\n"
    "        console.log('Патч пароля для', r.ip, 'з form-saved ✅');\n"
    "      }\n"
    "      /* Якщо user = admin але form каже admin1 */\n"
    "      if (r.user === 'admin' && form.user && form.user !== 'admin') {\n"
    "        r.user = form.user;\n"
    "        console.log('Патч user для', r.ip, ':', r.user, '✅');\n"
    "      }\n"
    "    });\n"
    "    localStorage.setItem('rm-routers', JSON.stringify(routers));\n"
    "    console.log('rm-routers оновлено ✅', routers);\n"
    "  } catch(e) { console.error('Помилка:', e); }\n"
    "})();\n"
)

with open('fix-localstorage.js', 'w', encoding='utf-8') as f:
    f.write(PATCH_JS)
print('OK: fix-localstorage.js ✅')

# ════════════════════════════════════
# 4. network-scanner.js — читає з rm-routers
# ════════════════════════════════════
with open('network-scanner.js', 'r', encoding='utf-8') as f:
    ns = f.read()

# Знаходимо де nsSSH бере credentials
for kw in ['nsIp', 'ns-ip', 'nsUser', 'ns-user',
           'document.getElementById(\'ns-']:
    idx = ns.find(kw)
    if idx > 0:
        print(f'\n"{kw}" @ {idx}:')
        print(repr(ns[max(0,idx-50):idx+200]))
        break

# Знаходимо функцію nsSSH
idx_ssh = ns.find('function nsSSH')
depth = 0; found = False; end_ssh = idx_ssh
for i, ch in enumerate(ns[idx_ssh:], idx_ssh):
    if ch == '{': depth += 1; found = True
    elif ch == '}': depth -= 1
    if found and depth == 0: end_ssh = i + 1; break

print(f'\nnsSSH ({idx_ssh}-{end_ssh}):')
print(repr(ns[idx_ssh:end_ssh]))