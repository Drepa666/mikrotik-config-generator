# -*- coding: utf-8 -*-
import subprocess, os, re

# ════════════════════════════════════
# 1. ЗНАХОДИМО СПРАВЖНІЙ BACKEND
# ════════════════════════════════════
print('=== ШУКАЄМО BACKEND ===')
backend_file = None
backend_content = None

search_dirs = ['.', 'src', 'electron', 'backend', 'server', 'main']
for d in search_dirs:
    if not os.path.exists(d): continue
    for f in os.listdir(d):
        if not f.endswith('.js'): continue
        path = os.path.join(d, f)
        try:
            with open(path, encoding='utf-8') as fh:
                c = fh.read()
            if ('ssh/exec' in c or 'ssh.connect' in c or
                'node-ssh' in c or 'Client' in c and 'ssh2' in c):
                print(f'BACKEND: {path}')
                # Знаходимо ssh handler
                for kw in ['ssh/exec', 'ssh.connect', '.connect({',
                           'username', 'privateKey']:
                    idx = c.find(kw)
                    if idx > 0:
                        print(f'  "{kw}" @ {idx}:')
                        print(repr(c[max(0,idx-50):idx+200]))
                        print()
                backend_file    = path
                backend_content = c
        except: pass

# Також шукаємо в package.json — main файл
if os.path.exists('package.json'):
    import json
    with open('package.json', encoding='utf-8') as f:
        pkg = json.load(f)
    print(f'\npackage.json main: {pkg.get("main")}')
    print(f'scripts: {pkg.get("scripts")}')

# ════════════════════════════════════
# 2. ВИПРАВЛЯЄМО nsSSH username→user
# ════════════════════════════════════
print('\n=== ФІКС network-scanner.js ===')
with open('network-scanner.js', encoding='utf-8') as f:
    ns = f.read()

old_nsssh = (
    "    body: JSON.stringify({\n"
    "      host: r.ip, port: r.sshPort || 22,\n"
    "      username: r.user, password: r.pass,\n"
    "      command: cmd\n"
    "    })"
)
new_nsssh = (
    "    body: JSON.stringify({\n"
    "      host: r.ip, port: r.sshPort || 22,\n"
    "      user: r.user, username: r.user, password: r.pass,\n"
    "      command: cmd\n"
    "    })"
)
if old_nsssh in ns:
    ns = ns.replace(old_nsssh, new_nsssh)
    print('OK: nsSSH username→user ✅')
else:
    print('WARN: nsSSH не знайдено — показую що є:')
    idx = ns.find("'http://localhost:8888/ssh/exec'")
    print(repr(ns[max(0,idx-50):idx+250]))

with open('network-scanner.js', 'w', encoding='utf-8') as f:
    f.write(ns)

r = subprocess.run(['node','--check','network-scanner.js'],
                   capture_output=True, text=True)
print('scanner:', 'OK ✅' if r.returncode==0 else '❌\n'+r.stderr[:100])

# ════════════════════════════════════
# 3. ВИПРАВЛЯЄМО diff-apply — port з роутера
# ════════════════════════════════════
print('\n=== ФІКС diff-apply.js ===')
with open('diff-apply.js', encoding='utf-8') as f:
    diff = f.read()

# Фікс: SSH port hard-coded=22, треба з роутера
old_ssh_body = (
    "      body: JSON.stringify({\n"
    "        host: ip, port: 22,\n"
    "        user: user, password: pass,\n"
    "        command: '/export compact',\n"
    "        timeout: 30,\n"
    "      }),"
)
new_ssh_body = (
    "      body: JSON.stringify({\n"
    "        host: ip,\n"
    "        port: (function(){\n"
    "          try{\n"
    "            var rs=JSON.parse(localStorage.getItem('rm-routers')||'[]');\n"
    "            var aid=localStorage.getItem('rm-active-router');\n"
    "            var ar=rs.find(function(r){return r.id===aid;})||rs[0]||{};\n"
    "            return ar.sshPort||22;\n"
    "          }catch(e){return 22;}\n"
    "        })(),\n"
    "        user: user, username: user, password: pass,\n"
    "        command: '/export compact',\n"
    "        timeout: 30,\n"
    "      }),"
)
if old_ssh_body in diff:
    diff = diff.replace(old_ssh_body, new_ssh_body)
    print('OK: diff SSH port з роутера + username ✅')
else:
    print('WARN: diff SSH body не знайдено')
    idx = diff.find("host: ip, port: 22")
    if idx < 0: idx = diff.find("host: ip,\n")
    print(repr(diff[max(0,idx-20):idx+150]))

with open('diff-apply.js', 'w', encoding='utf-8') as f:
    f.write(diff)

r2 = subprocess.run(['node','--check','diff-apply.js'],
                    capture_output=True, text=True)
print('diff:', 'OK ✅' if r2.returncode==0 else '❌\n'+r2.stderr[:100])

# ════════════════════════════════════
# 4. ВИПРАВЛЯЄМО localStorage — 17 роутерів!
#    Залишаємо тільки активний
# ════════════════════════════════════
CLEANUP_JS = """
(function cleanupRouters() {
  try {
    var routers  = JSON.parse(localStorage.getItem('rm-routers') || '[]');
    var activeId = localStorage.getItem('rm-active-router');
    var formSaved = JSON.parse(localStorage.getItem('rm-form-saved') || '{}');

    console.log('Всього роутерів:', routers.length);

    /* Знаходимо активний */
    var active = routers.find(function(r){ return r.id === activeId; })
              || routers[0];

    if (!active) {
      console.error('Активний роутер не знайдено!');
      return;
    }

    /* Виправляємо credentials */
    if (formSaved.user) active.user = formSaved.user;
    if (formSaved.pass) active.pass = formSaved.pass;

    console.log('Активний роутер:', active.ip,
      'user:', active.user,
      'pass:', active.pass ? '***' : 'EMPTY',
      'sshPort:', active.sshPort);

    /* Зберігаємо ТІЛЬКИ активний (якщо хочеш зберегти всі — закоментуй) */
    /* localStorage.setItem('rm-routers', JSON.stringify([active])); */

    /* АБО просто оновлюємо credentials активного */
    routers = routers.map(function(r) {
      if (r.id === activeId) {
        r.user = formSaved.user || r.user;
        r.pass = formSaved.pass || r.pass;
      }
      return r;
    });
    localStorage.setItem('rm-routers', JSON.stringify(routers));
    console.log('rm-routers оновлено ✅');
    console.log('Активний:', active.ip, active.user, active.sshPort);
  } catch(e) { console.error(e); }
})();
"""

with open('cleanup-routers.js', 'w', encoding='utf-8') as f:
    f.write(CLEANUP_JS)
print('\nOK: cleanup-routers.js ✅')

print('\n' + '='*60)
print('ПІДСУМОК ЗМІН:')
print('='*60)
print('1. nsSSH: username → user+username (обидва поля) ✅')
print('2. diff-apply: SSH port з rm-routers + username ✅')
print('3. cleanup-routers.js: виконай в консолі браузера')
print('\nДо npm start виконай в консолі браузера:')
print('  copy/paste вміст cleanup-routers.js')