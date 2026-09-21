# -*- coding: utf-8 -*-
import subprocess

with open('network-scanner.js', 'r', encoding='utf-8') as f:
    ns = f.read()

# ── 1. Фікс nsRestCall — використовуємо window.restCall ──
idx_fn = ns.find('function nsRestCall')
if idx_fn < 0: idx_fn = ns.find('nsRestCall = function')
depth = 0; found = False; end_fn = idx_fn
for i, ch in enumerate(ns[idx_fn:], idx_fn):
    if ch == '{': depth += 1; found = True
    elif ch == '}': depth -= 1
    if found and depth == 0: end_fn = i + 1; break

print(f'nsRestCall: {idx_fn}-{end_fn}')
old_fn = ns[idx_fn:end_fn]
print(repr(old_fn))

NEW_NS_CALL = (
    "function nsRestCall(path) {\n"
    "  /* Використовуємо window.restCall з router-manager.js */\n"
    "  if (window.restCall && window.getActiveRouter) {\n"
    "    var r = window.getActiveRouter();\n"
    "    if (!r) return Promise.reject('No router');\n"
    "    return window.restCall(r, 'GET', path)\n"
    "      .then(function(d) { return Array.isArray(d) ? d : (d ? [d] : []); });\n"
    "  }\n"
    "  /* Fallback */\n"
    "  var r2 = window.getActiveRouter ? window.getActiveRouter() : null;\n"
    "  if (!r2) return Promise.reject('No router');\n"
    "  return fetch('http://localhost:8888/rest' + path, {\n"
    "    headers: {\n"
    "      'x-router-ip':   r2.ip,\n"
    "      'x-router-port': String(r2.port || 80),\n"
    "      'x-router-user': r2.user || 'admin',\n"
    "      'x-router-pass': r2.pass || '',\n"
    "      'Authorization': 'Basic ' + btoa((r2.user||'admin') + ':' + (r2.pass||'')),\n"
    "    }\n"
    "  }).then(function(r) {\n"
    "    if (!r.ok) return [];\n"
    "    return r.json().then(function(d) { return Array.isArray(d) ? d : []; });\n"
    "  }).catch(function() { return []; });\n"
    "}"
)

ns = ns[:idx_fn] + NEW_NS_CALL + ns[end_fn:]

# ── 2. Фікс results — перевіряємо status і Array.isArray ──
old_results = (
    "    var arpList      = results[0].value || [];\n"
    "    var dhcpList     = results[1].value || [];\n"
    "    var neighborList = results[2].value || [];\n"
    "    var wifiList     = results[3].value || [];"
)
new_results = (
    "    function safeList(r) { return (r && r.status==='fulfilled' && Array.isArray(r.value)) ? r.value : []; }\n"
    "    var arpList      = safeList(results[0]);\n"
    "    var dhcpList     = safeList(results[1]);\n"
    "    var neighborList = safeList(results[2]);\n"
    "    var wifiList     = safeList(results[3]);"
)

if old_results in ns:
    ns = ns.replace(old_results, new_results)
    print('OK: safeList ✅')
else:
    print('WARN: results не знайдено')

with open('network-scanner.js', 'w', encoding='utf-8') as f:
    f.write(ns)

r = subprocess.run(['node', '--check', 'network-scanner.js'],
                   capture_output=True, text=True)
print('network-scanner.js:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:200])

print('\nВсе готово! npm start')