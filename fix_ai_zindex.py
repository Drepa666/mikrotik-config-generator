# -*- coding: utf-8 -*-
import subprocess

with open('router-manager.js', 'r', encoding='utf-8') as f:
    rm = f.read()

# Знаходимо точний початок restCall і sshCall
idx_rest = rm.find('path, body) {\n    var url  = PROXY')
start_rest = rm.rfind('function ', 0, idx_rest)
print(f'restCall @ {start_rest}:')
print(repr(rm[start_rest:start_rest+50]))

idx_ssh = rm.find('function sshCall')
print(f'sshCall @ {idx_ssh}:')
if idx_ssh > 0:
    print(repr(rm[idx_ssh:idx_ssh+100]))

# ── Робимо restCall глобальною ──
old_rest = rm[start_rest:start_rest+12]
print(f'\nЗамінюємо: {repr(old_rest)}')
new_rest = 'window.restCall = ' + old_rest

if 'window.restCall' not in rm:
    rm = rm[:start_rest] + new_rest + rm[start_rest+12:]
    print('OK: restCall → window.restCall ✅')
else:
    print('window.restCall вже є ✅')

# ── Робимо sshCall глобальною ──
if idx_ssh > 0 and 'window.sshCall' not in rm:
    rm = rm[:idx_ssh] + 'window.sshCall = ' + rm[idx_ssh:]
    print('OK: sshCall → window.sshCall ✅')
elif 'window.sshCall' in rm:
    print('window.sshCall вже є ✅')

with open('router-manager.js', 'w', encoding='utf-8') as f:
    f.write(rm)

r = subprocess.run(['node', '--check', 'router-manager.js'],
                   capture_output=True, text=True)
print('router-manager.js:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:200])

# ── Оновлюємо ai-agent-core.js ──
with open('ai-agent/ai-agent-core.js', 'r', encoding='utf-8') as f:
    core = f.read()

# Замінюємо getRouterContext — використовуємо window.restCall
old_fetch_block = """    function apiFetch(ep) {
      if (window.rmFetch) {
        return window.rmFetch(router, ep)
          .then(function(d) { return { ep: ep, data: Array.isArray(d) ? d : [] }; })
          .catch(function() { return { ep: ep, data: [] }; });
      }
      return fetch('http://localhost:8888/rest' + ep, { headers: h })
        .then(function(r) {
          if (!r.ok) return [];
          return r.json();
        })
        .then(function(data) { return { ep: ep, data: Array.isArray(data) ? data : [] }; })
        .catch(function() { return { ep: ep, data: [] }; });
    }

    return Promise.allSettled(
      endpoints.map(function(ep) { return apiFetch(ep); })
    ).then(function(results) {"""

new_fetch_block = """    function apiFetch(ep) {
      /* Використовуємо restCall з router-manager.js */
      if (window.restCall) {
        return window.restCall(router, 'GET', ep)
          .then(function(d) { return { ep: ep, data: Array.isArray(d) ? d : [] }; })
          .catch(function() { return { ep: ep, data: [] }; });
      }
      /* Fallback — прямий fetch */
      return fetch('http://localhost:8888/rest' + ep, { headers: h })
        .then(function(r) { if (!r.ok) return []; return r.json(); })
        .then(function(d) { return { ep: ep, data: Array.isArray(d) ? d : [] }; })
        .catch(function() { return { ep: ep, data: [] }; });
    }

    return Promise.allSettled(
      endpoints.map(function(ep) { return apiFetch(ep); })
    ).then(function(results) {"""

if old_fetch_block in core:
    core = core.replace(old_fetch_block, new_fetch_block)
    print('OK: apiFetch → restCall ✅')
else:
    # Шукаємо будь-який apiFetch
    idx_af = core.find('function apiFetch')
    print(f'apiFetch @ {idx_af}:')
    print(repr(core[idx_af:idx_af+200]))

# Замінюємо AIAgent.ssh ── використовуємо sshCall
old_ssh = """AIAgent.ssh = function(cmd) {
  /* Використовуємо sshCall з router-manager.js якщо є */
  if (window.sshCall) {
    var router = AIAgent.getRouter();
    if (!router) return Promise.reject('Немає підключеного роутера');
    return window.sshCall(router, cmd);
  }
  /* Fallback через REST */
  var router = AIAgent.getRouter();
  if (!router) return Promise.reject('Немає підключеного роутера');
  return fetch('http://localhost:8888/ssh/exec', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host:     router.ip,
      port:     router.sshPort || 22,
      username: router.user    || 'admin',
      password: router.pass    || '',
      command:  cmd
    })
  }).then(function(r) { return r.json(); });
};"""

new_ssh = """AIAgent.ssh = function(cmd) {
  var router = AIAgent.getRouter();
  if (!router) return Promise.reject('Немає підключеного роутера');
  /* Використовуємо sshCall з router-manager.js */
  if (window.sshCall) {
    return window.sshCall(router, cmd)
      .then(function(r) { return { ok: true, output: r }; })
      .catch(function(e) { return { ok: false, error: String(e) }; });
  }
  return Promise.reject('sshCall не доступний');
};"""

if old_ssh in core:
    core = core.replace(old_ssh, new_ssh)
    print('OK: AIAgent.ssh → sshCall ✅')
else:
    idx_ssh2 = core.find('AIAgent.ssh = function')
    print(f'ssh @ {idx_ssh2}:')
    print(repr(core[idx_ssh2:idx_ssh2+100]))

with open('ai-agent/ai-agent-core.js', 'w', encoding='utf-8') as f:
    f.write(core)

r2 = subprocess.run(['node', '--check', 'ai-agent/ai-agent-core.js'],
                    capture_output=True, text=True)
print('ai-agent-core.js:', 'OK ✅' if r2.returncode == 0 else '❌\n' + r2.stderr[:200])

print('\nВсе готово! npm start')