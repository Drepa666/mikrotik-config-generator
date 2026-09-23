# -*- coding: utf-8 -*-
import subprocess, tempfile, os

with open('rm-datastore.js', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('\r\n', '\n')

# Видаляємо health з apiMap — не всі роутери підтримують
OLD = "        health:          '/system/health',\n"
NEW = "        /* health: '/system/health', */ /* не всі роутери підтримують */\n"

if OLD in content:
    content = content.replace(OLD, NEW, 1)
    print('OK: health закоментовано')
else:
    print('NOT FOUND — шукаємо варіант без пробілів')
    idx = content.find("health:")
    print(repr(content[idx-8:idx+40]))
    exit(1)

# Також фіксуємо restCall в rm-datastore.js — додаємо IPC + silent 400
OLD_REST = (
    "  function restCall(router, method, path, body) {\n"
    "    var url  = PROXY + '/rest' + path;\n"
    "    var opts = {\n"
    "      method: method,\n"
    "      headers: {\n"
    "        'Content-Type':  'application/json',\n"
    "        'x-router-ip':   router.ip,\n"
    "        'x-router-port': String(router.port),\n"
    "        'Authorization': 'Basic ' + btoa(router.user + ':' + router.pass),\n"
    "      },\n"
    "    };\n"
    "    if (body) opts.body = JSON.stringify(body);\n"
    "    return fetch(url, opts).then(function(r) {\n"
    "      if (r.status === 204) return {};\n"
    "      return r.json().catch(function() { return {}; });\n"
    "    });\n"
    "  }"
)

NEW_REST = (
    "  function restCall(router, method, path, body) {\n"
    "    /* ── IPC direct (без proxy.py) ── */\n"
    "    if (window.electronAPI && window.electronAPI.routerRest) {\n"
    "      return window.electronAPI.routerRest({\n"
    "        ip: router.ip, port: router.port || 80,\n"
    "        user: router.user || 'admin', pass: router.pass || '',\n"
    "        useHttps: router.useHttps || false,\n"
    "        method: method, path: path, body: body || null,\n"
    "      }).then(function(res) {\n"
    "        if (!res || (res.error && !Array.isArray(res))) return [];\n"
    "        return res;\n"
    "      }).catch(function() { return []; });\n"
    "    }\n"
    "    /* ── Fallback: proxy ── */\n"
    "    var url  = PROXY + '/rest' + path;\n"
    "    var opts = {\n"
    "      method: method,\n"
    "      headers: {\n"
    "        'Content-Type':  'application/json',\n"
    "        'x-router-ip':   router.ip,\n"
    "        'x-router-port': String(router.port),\n"
    "        'Authorization': 'Basic ' + btoa(router.user + ':' + router.pass),\n"
    "      },\n"
    "    };\n"
    "    if (body) opts.body = JSON.stringify(body);\n"
    "    return fetch(url, opts).then(function(r) {\n"
    "      if (r.status === 204) return {};\n"
    "      if (r.status === 400 || r.status === 404) return [];\n"
    "      return r.json().catch(function() { return {}; });\n"
    "    }).catch(function() { return []; });\n"
    "  }"
)

print(f'OLD_REST: {"FOUND" if OLD_REST in content else "NOT FOUND"}')
if OLD_REST in content:
    content = content.replace(OLD_REST, NEW_REST, 1)
    print('OK: restCall в rm-datastore.js оновлено')

# Також фіксуємо sshCall в rm-datastore.js
OLD_SSH = (
    "  function sshCall(router, command) {\n"
    "    return fetch(PROXY + '/ssh/exec', {\n"
    "      method:  'POST',\n"
    "      headers: { 'Content-Type': 'application/json' },\n"
    "      body: JSON.stringify({\n"
    "        host: router.ip, port: router.sshPort || 22,\n"
    "        username: router.user, password: router.pass,\n"
    "        command: command,\n"
    "      }),\n"
    "    }).then(function(r) { return r.json(); });\n"
    "  }"
)
NEW_SSH = (
    "  function sshCall(router, command) {\n"
    "    if (window.electronAPI && window.electronAPI.routerSsh) {\n"
    "      return window.electronAPI.routerSsh({\n"
    "        ip: router.ip, sshPort: router.sshPort || 22,\n"
    "        user: router.user || 'admin', pass: router.pass || '',\n"
    "        command: command,\n"
    "      }).catch(function() { return { ok: false, error: 'SSH failed' }; });\n"
    "    }\n"
    "    return fetch(PROXY + '/ssh/exec', {\n"
    "      method:  'POST',\n"
    "      headers: { 'Content-Type': 'application/json' },\n"
    "      body: JSON.stringify({\n"
    "        host: router.ip, port: router.sshPort || 22,\n"
    "        username: router.user, password: router.pass,\n"
    "        command: command,\n"
    "      }),\n"
    "    }).then(function(r) { return r.json(); })\n"
    "    .catch(function() { return { ok: false, error: 'SSH failed' }; });\n"
    "  }"
)
print(f'OLD_SSH: {"FOUND" if OLD_SSH in content else "NOT FOUND"}')
if OLD_SSH in content:
    content = content.replace(OLD_SSH, NEW_SSH, 1)
    print('OK: sshCall в rm-datastore.js оновлено')

# ════ Tempfile ════
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

with open('rm-datastore.js', 'w', encoding='utf-8') as f:
    f.write(content)
size = os.path.getsize('rm-datastore.js')
r2 = subprocess.run(['node','--check','rm-datastore.js'], capture_output=True, text=True)
print(f'rm-datastore.js: {"OK ✅" if r2.returncode==0 else "FAIL"} ({size:,}b)')
if r2.returncode != 0:
    print(r2.stderr[:200])
    exit(1)

# ════ Git ════
subprocess.run(['git','pull','--rebase','origin','main'], capture_output=True)
subprocess.run(['git','add','rm-datastore.js'], capture_output=True)
subprocess.run(['git','commit','-m',
    'fix: disable health endpoint, add IPC to rm-datastore restCall/sshCall'],