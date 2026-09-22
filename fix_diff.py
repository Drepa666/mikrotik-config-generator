# -*- coding: utf-8 -*-
import subprocess

with open('diff-apply.js', 'r', encoding='utf-8') as f:
    diff = f.read()

# Замінюємо fetch handler — REST замість SSH
old_fetch = (
    "    console.log('[DiffApply] Connecting:', ip, user);\n"
    "    status.textContent = '🔄 Підключення до ' + ip + '...';\n"
    "    status.style.color = '#8ea3b0';\n\n"
    "    fetch(PROXY + '/ssh/exec', {\n"
    "      method: 'POST',\n"
    "      headers: { 'Content-Type': 'application/json' },\n"
    "      body: JSON.stringify({\n"
    "        host: ip, port: 22,\n"
    "        user: user, password: pass,\n"
    "        command: '/export compact',\n"
    "        timeout: 30,\n"
    "      }),\n"
    "    })\n"
    "    .then(function(r) { return r.json(); })\n"
    "    .then(function(d) {\n"
    "      if (!d.ok) throw new Error(d.error || 'SSH error');\n"
    "      var cfg = d.output || d.result || '';\n"
    "      if (!cfg) throw new Error('Порожня відповідь від роутера');\n"
    "      document.getElementById('da-text-a').value = cfg;\n"
    "      updateLineCount('da-text-a', 'da-lines-a');\n"
    "      status.textContent = '✅ Конфіг отримано! (' + cfg.split('\\n').length + ' рядків)';\n"
    "      status.style.color = '#5fd0a5';\n"
    "    })\n"
    "    .catch(function(e) {\n"
    "      var msg = e.message || String(e);\n"
    "      /* Підказки по типу помилки */\n"
    "      var hint = '';\n"
    "      if (msg.indexOf('Wrong login') >= 0 || msg.indexOf('password') >= 0)\n"
    "        hint = ' — перевірте логін/пароль';\n"
    "      else if (msg.indexOf('ECONNREFUSED') >= 0 || msg.indexOf('connect') >= 0)\n"
    "        hint = ' — роутер недоступний по SSH';\n"
    "      else if (msg.indexOf('timeout') >= 0)\n"
    "        hint = ' — перевищено час очікування';\n"
    "      status.textContent = '❌ ' + msg + hint;\n"
    "      status.style.color = '#e0665a';\n"
    "      console.error('[DiffApply] Error:', msg, {ip, user});\n"
    "    })\n"
    "    .finally(function() {\n"
    "      btn.textContent = '📥 Отримати поточний конфіг';\n"
    "      btn.disabled    = false;\n"
    "    });"
)

new_fetch = (
    "    console.log('[DiffApply] Connecting:', ip, user);\n"
    "    status.textContent = '🔄 Підключення до ' + ip + '...';\n"
    "    status.style.color = '#8ea3b0';\n\n"
    "    /* Спочатку REST API — потім SSH як fallback */\n"
    "    var port = (function() {\n"
    "      try {\n"
    "        var rs = JSON.parse(localStorage.getItem('rm-routers') || '[]');\n"
    "        var aid = localStorage.getItem('rm-active-router');\n"
    "        var ar = rs.find(function(r){return r.id===aid;}) || rs[0] || {};\n"
    "        return ar.port || 80;\n"
    "      } catch(e) { return 80; }\n"
    "    })();\n\n"
    "    function tryREST() {\n"
    "      /* REST API /rest/system/export — не потребує SSH */\n"
    "      var protocol = port === 443 ? 'https' : 'http';\n"
    "      var base64   = btoa(user + ':' + pass);\n"
    "      return fetch(PROXY + '/rest-proxy', {\n"
    "        method: 'POST',\n"
    "        headers: { 'Content-Type': 'application/json' },\n"
    "        body: JSON.stringify({\n"
    "          url: protocol + '://' + ip + ':' + port + '/rest/system/export',\n"
    "          method: 'GET',\n"
    "          auth: base64,\n"
    "        }),\n"
    "      })\n"
    "      .then(function(r) { return r.json(); })\n"
    "      .then(function(d) {\n"
    "        if (!d.ok) throw new Error('REST failed: ' + (d.error || d.status));\n"
    "        return d.data || d.output || d.result || '';\n"
    "      });\n"
    "    }\n\n"
    "    function trySSH() {\n"
    "      /* SSH fallback */\n"
    "      var sshPort = (function() {\n"
    "        try {\n"
    "          var rs = JSON.parse(localStorage.getItem('rm-routers') || '[]');\n"
    "          var aid = localStorage.getItem('rm-active-router');\n"
    "          var ar = rs.find(function(r){return r.id===aid;}) || rs[0] || {};\n"
    "          return ar.sshPort || 22;\n"
    "        } catch(e) { return 22; }\n"
    "      })();\n"
    "      return fetch(PROXY + '/ssh/exec', {\n"
    "        method: 'POST',\n"
    "        headers: { 'Content-Type': 'application/json' },\n"
    "        body: JSON.stringify({\n"
    "          host: ip, port: sshPort,\n"
    "          user: user, password: pass,\n"
    "          command: '/export compact',\n"
    "          timeout: 30,\n"
    "        }),\n"
    "      })\n"
    "      .then(function(r) { return r.json(); })\n"
    "      .then(function(d) {\n"
    "        if (!d.ok) throw new Error(d.error || 'SSH error');\n"
    "        return d.output || d.result || '';\n"
    "      });\n"
    "    }\n\n"
    "    function tryDirectREST() {\n"
    "      /* Прямий REST через backend proxy з headers */\n"
    "      return fetch(PROXY + '/rest/system/export', {\n"
    "        headers: {\n"
    "          'x-router-ip':   ip,\n"
    "          'x-router-port': String(port),\n"
    "          'x-router-user': user,\n"
    "          'x-router-pass': pass,\n"
    "        },\n"
    "      })\n"
    "      .then(function(r) { return r.json(); })\n"
    "      .then(function(d) {\n"
    "        if (!d.ok && !Array.isArray(d)) throw new Error('Direct REST failed');\n"
    "        var txt = typeof d === 'string' ? d\n"
    "                : Array.isArray(d) ? JSON.stringify(d, null, 2)\n"
    "                : (d.output || d.result || JSON.stringify(d, null, 2));\n"
    "        return txt;\n"
    "      });\n"
    "    }\n\n"
    "    /* Пробуємо REST → Direct REST → SSH */\n"
    "    tryDirectREST()\n"
    "      .catch(function() {\n"
    "        console.log('[DiffApply] Direct REST failed, trying SSH...');\n"
    "        return trySSH();\n"
    "      })\n"
    "      .then(function(cfg) {\n"
    "        if (!cfg || cfg.length < 10) throw new Error('Порожня відповідь від роутера');\n"
    "        document.getElementById('da-text-a').value = cfg;\n"
    "        updateLineCount('da-text-a', 'da-lines-a');\n"
    "        status.textContent = '✅ Конфіг отримано! (' + cfg.split('\\n').length + ' рядків)';\n"
    "        status.style.color = '#5fd0a5';\n"
    "      })\n"
    "      .catch(function(e) {\n"
    "        var msg = e.message || String(e);\n"
    "        var hint = '';\n"
    "        if (msg.indexOf('Wrong login') >= 0 || msg.indexOf('password') >= 0)\n"
    "          hint = ' — перевірте логін/пароль';\n"
    "        else if (msg.indexOf('ECONNREFUSED') >= 0)\n"
    "          hint = ' — роутер недоступний';\n"
    "        else if (msg.indexOf('timeout') >= 0)\n"
    "          hint = ' — перевищено час очікування';\n"
    "        status.textContent = '❌ ' + msg + hint;\n"
    "        status.style.color = '#e0665a';\n"
    "        console.error('[DiffApply] All methods failed:', msg, {ip, user, port});\n"
    "      })\n"
    "      .finally(function() {\n"
    "        btn.textContent = '📥 Отримати поточний конфіг';\n"
    "        btn.disabled    = false;\n"
    "      });"
)

if old_fetch in diff:
    diff = diff.replace(old_fetch, new_fetch)
    print('OK: REST + SSH fallback ✅')
else:
    print('WARN: не знайдено — шукаємо частину')
    idx = diff.find("console.log('[DiffApply] Connecting:'")
    print(repr(diff[max(0,idx-50):idx+200]))

with open('diff-apply.js', 'w', encoding='utf-8') as f:
    f.write(diff)

r = subprocess.run(['node', '--check', 'diff-apply.js'],
                   capture_output=True, text=True)
print('diff-apply:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:200])

# ════════════════════════════════════
# Перевіряємо backend — чи є /rest/ proxy
# ════════════════════════════════════
import os
for f in ['server.js', 'backend.js', 'proxy.js', 'index.js', 'app.js']:
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as fh:
            content = fh.read()
        for kw in ['/rest/', 'x-router-ip', 'export', '/ssh/exec']:
            idx = content.find(kw)
            if idx > 0:
                print(f'\n{f} "{kw}" @ {idx}:')
                print(repr(content[idx:idx+200]))
                break

print('\nВсе готово! npm start')