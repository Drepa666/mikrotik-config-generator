# -*- coding: utf-8 -*-
import subprocess

# ── Фікс 1: restCall — додаємо x-router-user/pass ──
with open('router-manager.js', 'r', encoding='utf-8') as f:
    js = f.read()

old = """      headers: {
        'Content-Type': 'application/json',
        'x-router-ip':   router.ip,
        'x-router-port': String(router.port),
        'Authorization': 'Basic ' + btoa(router.user + ':' + router.pass),
      },"""

new = """      headers: {
        'Content-Type':  'application/json',
        'x-router-ip':   router.ip,
        'x-router-port': String(router.port || 80),
        'x-router-user': router.user || 'admin',
        'x-router-pass': router.pass || '',
        'Authorization': 'Basic ' + btoa((router.user||'admin') + ':' + (router.pass||'')),
      },"""

if old in js:
    js = js.replace(old, new)
    print('OK: restCall headers виправлено ✅')
else:
    print('ERR: restCall не знайдено!')
    idx = js.find("'x-router-ip'")
    print(js[max(0,idx-100):idx+300])

with open('router-manager.js', 'w', encoding='utf-8') as f:
    f.write(js)

# ── Фікс 2: proxy — читаємо і Authorization і x-router-* ──
with open('proxy.py', 'r', encoding='utf-8') as f:
    py = f.read()

old_py = """        rip  = self.headers.get('x-router-ip',   '')
        rport= self.headers.get('x-router-port', '80')
        ruser= self.headers.get('x-router-user', 'admin')
        rpass= self.headers.get('x-router-pass', '')"""

new_py = """        rip  = self.headers.get('x-router-ip',   '')
        rport= self.headers.get('x-router-port', '80')
        ruser= self.headers.get('x-router-user', '')
        rpass= self.headers.get('x-router-pass', '')
        # Fallback: decode Authorization: Basic header
        if not ruser:
            auth_hdr = self.headers.get('Authorization', '')
            if auth_hdr.startswith('Basic '):
                import base64 as _b64
                try:
                    decoded = _b64.b64decode(auth_hdr[6:]).decode('utf-8')
                    ruser, rpass = decoded.split(':', 1)
                except:
                    ruser = 'admin'
        if not ruser: ruser = 'admin'"""

if old_py in py:
    py = py.replace(old_py, new_py)
    print('OK: proxy auth виправлено ✅')
else:
    print('ERR: proxy блок не знайдено — пробуємо regex')
    import re
    m = re.search(r"ruser\s*=\s*self\.headers\.get\('x-router-user'[^\n]+\)\s*\n\s*rpass", py)
    if m:
        print(f'Знайдено на позиції {m.start()}:')
        print(py[m.start():m.start()+200])

with open('proxy.py', 'w', encoding='utf-8') as f:
    f.write(py)

# ── Перевірка синтаксису ──
r1 = subprocess.run(['node', '--check', 'router-manager.js'], capture_output=True, text=True)
r2 = subprocess.run(['python', '-m', 'py_compile', 'proxy.py'],  capture_output=True, text=True)
print('router-manager.js:', 'OK ✅' if r1.returncode == 0 else '❌\n' + r1.stderr[:200])
print('proxy.py:',          'OK ✅' if r2.returncode == 0 else '❌\n' + r2.stderr[:200])