# -*- coding: utf-8 -*-
import subprocess

# ════════════════════════════════════
# 1. ФІКС: AI аналіз логів — передаємо текст
# ════════════════════════════════════
with open('ai-agent/terminal-log.js', 'r', encoding='utf-8') as f:
    tl = f.read()

# Знаходимо кнопку "Читати export" і додаємо "Аналіз логів"
old_export_btn = (
    "        '<button id=\"termlog-export-read\" style=\"background:#1a2a3a;border:1px solid #2a3a5a;' +\n"
    "          'color:#5b9bd5;border-radius:5px;padding:2px 12px;cursor:pointer;font-size:11px;\">📄 Export</button>'+\n"
    "      '</div>'"
)
new_export_btn = (
    "        '<button id=\"termlog-export-read\" style=\"background:#1a2a3a;border:1px solid #2a3a5a;' +\n"
    "          'color:#5b9bd5;border-radius:5px;padding:2px 12px;cursor:pointer;font-size:11px;\">📄 Export</button>'+\n"
    "        '<button id=\"termlog-analyze-logs\" style=\"background:#1a1a3a;border:1px solid #3a2a5a;' +\n"
    "          'color:#c084fc;border-radius:5px;padding:2px 12px;cursor:pointer;font-size:11px;\">🤖 Аналіз логів</button>'+\n"
    "        '<button id=\"termlog-multi-router\" style=\"background:#1a2a1a;border:1px solid #3a5a2a;' +\n"
    "          'color:#90c060;border-radius:5px;padding:2px 12px;cursor:pointer;font-size:11px;\">🔀 Multi-router</button>'+\n"
    "      '</div>'"
)

if old_export_btn in tl:
    tl = tl.replace(old_export_btn, new_export_btn)
    print('OK: кнопки Аналіз логів + Multi-router ✅')

# Додаємо listener для нових кнопок
old_listeners = (
    "    document.getElementById('termlog-export-read').onclick = function() { TermLog.readExport(); };"
)
new_listeners = (
    "    document.getElementById('termlog-export-read').onclick  = function() { TermLog.readExport(); };\n"
    "    document.getElementById('termlog-analyze-logs').onclick = function() { TermLog.analyzeLogs(); };\n"
    "    document.getElementById('termlog-multi-router').onclick = function() { TermLog.showMultiRouter(); };"
)
if old_listeners in tl:
    tl = tl.replace(old_listeners, new_listeners)
    print('OK: listeners ✅')

# Додаємо методи analyzeLogs і showMultiRouter
old_intercept = "  /* ── Перехоплення sshCall ── */"
new_methods = (
    "  /* ── AI аналіз логів ── */\n"
    "  analyzeLogs: function() {\n"
    "    var r = window.getActiveRouter ? window.getActiveRouter() : null;\n"
    "    if (!r) { TermLog.log('error', 'Немає підключеного роутера'); return; }\n"
    "    TermLog.log('info', '🤖 Читаємо логи з роутера...');\n"
    "    TermLog.show();\n"
    "    /* Читаємо останні 50 рядків логу */\n"
    "    window.sshCall(r, '/log print')\n"
    "      .then(function(d) {\n"
    "        var logText = typeof d === 'string' ? d\n"
    "                    : (d && d.output) ? d.output\n"
    "                    : JSON.stringify(d);\n"
    "        if (!logText || logText.length < 10) {\n"
    "          TermLog.log('warning', 'Лог порожній');\n"
    "          return;\n"
    "        }\n"
    "        /* Показуємо лог в терміналі */\n"
    "        TermLog.log('ok', '=== LOG (' + logText.split('\\n').length + ' рядків) ===');\n"
    "        var logDiv = document.createElement('div');\n"
    "        logDiv.style.cssText = 'background:#050d05;border:1px solid #1a3a1a;border-radius:6px;'+\n"
    "          'padding:8px 12px;margin:4px 0;max-height:160px;overflow-y:auto;'+\n"
    "          'font-family:monospace;font-size:11px;color:#8ea3b0;white-space:pre-wrap;';\n"
    "        /* Підсвічуємо error/warning рядки */\n"
    "        logDiv.innerHTML = logText\n"
    "          .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')\n"
    "          .replace(/(.*error.*)/gi, '<span style=\"color:#e08080;\">$1</span>')\n"
    "          .replace(/(.*warning.*)/gi, '<span style=\"color:#f0a840;\">$1</span>')\n"
    "          .replace(/(.*critical.*)/gi, '<span style=\"color:#ff4040;font-weight:bold;\">$1</span>')\n"
    "          .replace(/(.*logged in.*)/gi, '<span style=\"color:#5fd0a5;\">$1</span>')\n"
    "          .replace(/(.*logged out.*)/gi, '<span style=\"color:#4a6070;\">$1</span>');\n"
    "        TermLog._bodyEl.appendChild(logDiv);\n"
    "        TermLog.scrollBottom();\n"
    "        /* Відправляємо AI */\n"
    "        if (!window.AIAgent || !AIAgent.send) {\n"
    "          TermLog.log('error', 'AI агент недоступний');\n"
    "          return;\n"
    "        }\n"
    "        TermLog.log('info', '🤖 AI аналізує логи...');\n"
    "        var routerInfo = window.ROSAdapter ? ROSAdapter.getAIContext() : '';\n"
    "        var prompt =\n"
    "          'Проаналізуй логи MikroTik RouterOS і поясни що відбувається:\\n\\n' +\n"
    "          '```\\n' + logText.slice(-3000) + '\\n```\\n\\n' +\n"
    "          (routerInfo ? 'Роутер: ' + routerInfo + '\\n\\n' : '') +\n"
    "          'Відповідай українською. Поясни:\\n' +\n"
    "          '1) Що відбувається в цих логах?\\n' +\n"
    "          '2) Чи є помилки або підозрілі події?\\n' +\n"
    "          '3) Що треба перевірити або виправити?\\n' +\n"
    "          '4) Чи є ознаки злому або проблем з безпекою?';\n"
    "        AIAgent.send(prompt, { includeContext: false })\n"
    "          .then(function(resp) {\n"
    "            var txt = resp && resp.content ? resp.content\n"
    "                    : resp && resp.text    ? resp.text\n"
    "                    : String(resp || '');\n"
    "            /* Рендеримо відповідь AI */\n"
    "            var aiEl = document.createElement('div');\n"
    "            aiEl.style.cssText = 'background:#0d1a0d;border:1px solid #2a4a2a;border-radius:8px;'+\n"
    "              'padding:12px 16px;margin:8px 0;color:#c9d8e4;font-size:12px;line-height:1.6;';\n"
    "            aiEl.innerHTML =\n"
    "              '<div style=\"color:#c084fc;font-weight:700;margin-bottom:8px;\">🤖 AI Аналіз логів</div>'+\n"
    "              '<div>' + txt\n"
    "                .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')\n"
    "                .replace(/\\*\\*(.+?)\\*\\*/g,'<b>$1</b>')\n"
    "                .replace(/\\n/g,'<br>') +\n"
    "              '</div>';\n"
    "            TermLog._bodyEl.appendChild(aiEl);\n"
    "            TermLog.scrollBottom();\n"
    "          })\n"
    "          .catch(function(e) {\n"
    "            TermLog.log('error', 'AI помилка: ' + e);\n"
    "          });\n"
    "      })\n"
    "      .catch(function(e) {\n"
    "        TermLog.log('error', 'Не вдалось прочитати лог: ' + e);\n"
    "      });\n"
    "  },\n\n"

    "  /* ── Multi-router термінал ── */\n"
    "  showMultiRouter: function() {\n"
    "    var old = document.getElementById('termlog-multi-panel');\n"
    "    if (old) { old.remove(); return; }\n"
    "    /* Отримуємо всі роутери */\n"
    "    var routers = [];\n"
    "    try {\n"
    "      var rs  = JSON.parse(localStorage.getItem('rm-routers') || '[]');\n"
    "      var aid = localStorage.getItem('rm-active-router');\n"
    "      routers = rs;\n"
    "    } catch(e) {}\n"
    "    if (routers.length === 0) {\n"
    "      TermLog.log('error', 'Немає збережених роутерів');\n"
    "      return;\n"
    "    }\n"
    "    /* Панель вибору роутерів */\n"
    "    var panel = document.createElement('div');\n"
    "    panel.id  = 'termlog-multi-panel';\n"
    "    panel.style.cssText = 'position:absolute;bottom:100%;right:0;'+\n"
    "      'background:#0d1117;border:1px solid #2a3b48;border-radius:8px 8px 0 0;'+\n"
    "      'padding:12px 16px;min-width:320px;z-index:999999;'+\n"
    "      'box-shadow:0 -4px 20px rgba(0,0,0,.5);';\n"
    "    var checkboxes = routers.map(function(r) {\n"
    "      return '<label style=\"display:flex;align-items:center;gap:8px;padding:4px 0;'+\n"
    "        'color:#c9d8e4;font-size:12px;cursor:pointer;\">'+\n"
    "        '<input type=\"checkbox\" class=\"mr-check\" data-id=\"' + r.id + '\" checked '+\n"
    "          'style=\"accent-color:#5fd0a5;\">'+\n"
    "        '<span style=\"color:#5fd0a5;\">◉</span> '+\n"
    "        r.name + ' <span style=\"color:#4a6070;\">' + r.ip + '</span>'+\n"
    "        '</label>';\n"
    "    }).join('');\n"
    "    panel.innerHTML =\n"
    "      '<div style=\"color:#90c060;font-weight:700;margin-bottom:10px;\">🔀 Multi-Router виконання</div>'+\n"
    "      checkboxes +\n"
    "      '<div style=\"margin-top:10px;display:flex;gap:8px;\">'+\n"
    "        '<button id=\"mr-run-all\" style=\"background:#1a3a1a;border:1px solid #3a6a2a;'+\n"
    "          'color:#90c060;border-radius:6px;padding:5px 14px;cursor:pointer;font-size:12px;flex:1;\">'+\n"
    "          '▶ Виконати на вибраних</button>'+\n"
    "        '<button id=\"mr-cancel\" style=\"background:transparent;border:1px solid #2a3b48;'+\n"
    "          'color:#4a6070;border-radius:6px;padding:5px 10px;cursor:pointer;font-size:12px;\">✕</button>'+\n"
    "      '</div>';\n"
    "    var bar = document.getElementById('termlog-input-bar');\n"
    "    if (bar) {\n"
    "      bar.style.position = 'relative';\n"
    "      bar.appendChild(panel);\n"
    "    }\n"
    "    document.getElementById('mr-cancel').onclick = function() { panel.remove(); };\n"
    "    document.getElementById('mr-run-all').onclick = function() {\n"
    "      var cmd = document.getElementById('termlog-cmd-input').value.trim();\n"
    "      if (!cmd) { TermLog.log('error', 'Введіть команду в поле вводу'); return; }\n"
    "      /* Збираємо вибрані роутери */\n"
    "      var checks = panel.querySelectorAll('.mr-check:checked');\n"
    "      var ids = Array.from(checks).map(function(c) { return c.dataset.id; });\n"
    "      var selected = routers.filter(function(r) { return ids.indexOf(r.id) >= 0; });\n"
    "      panel.remove();\n"
    "      TermLog.runOnMultiple(cmd, selected);\n"
    "    };\n"
    "  },\n\n"

    "  /* ── Виконати команду на кількох роутерах ── */\n"
    "  runOnMultiple: function(cmd, routers) {\n"
    "    if (!routers || routers.length === 0) return;\n"
    "    TermLog.log('info', '🔀 Виконую \"' + cmd + '\" на ' + routers.length + ' роутерах...');\n"
    "    TermLog.show();\n"
    "    /* Паралельно на всіх роутерах */\n"
    "    var promises = routers.map(function(r) {\n"
    "      return fetch('http://localhost:8888/ssh/exec', {\n"
    "        method: 'POST',\n"
    "        headers: { 'Content-Type': 'application/json' },\n"
    "        body: JSON.stringify({\n"
    "          host: r.ip, port: r.sshPort || 22,\n"
    "          user: r.user, username: r.user, password: r.pass,\n"
    "          command: cmd, timeout: 15,\n"
    "        }),\n"
    "      })\n"
    "      .then(function(res) { return res.json(); })\n"
    "      .then(function(d) { return { router: r, ok: d.ok, output: d.output||d.result||'', error: d.error }; })\n"
    "      .catch(function(e) { return { router: r, ok: false, output: '', error: String(e) }; });\n"
    "    });\n"
    "    Promise.all(promises).then(function(results) {\n"
    "      /* Показуємо результати */\n"
    "      var resDiv = document.createElement('div');\n"
    "      resDiv.style.cssText = 'background:#080d10;border:1px solid #1a2a38;border-radius:8px;'+\n"
    "        'padding:10px 14px;margin:6px 0;';\n"
    "      resDiv.innerHTML = '<div style=\"color:#90c060;font-weight:700;margin-bottom:8px;\">'+\n"
    "        '🔀 Результати: ' + cmd + '</div>';\n"
    "      results.forEach(function(r) {\n"
    "        var color  = r.ok ? '#5fd0a5' : '#e08080';\n"
    "        var icon   = r.ok ? '✅' : '❌';\n"
    "        var output = r.output || r.error || '(порожньо)';\n"
    "        var block  = document.createElement('div');\n"
    "        block.style.cssText = 'margin-bottom:8px;border-left:3px solid '+color+';padding-left:10px;';\n"
    "        block.innerHTML =\n"
    "          '<div style=\"color:'+color+';font-size:11px;font-weight:600;\">'+\n"
    "            icon+' '+r.router.name+' ('+r.router.ip+')</div>'+\n"
    "          '<div style=\"color:#8ea3b0;font-family:monospace;font-size:11px;'+\n"
    "            'white-space:pre-wrap;max-height:100px;overflow-y:auto;\">'+\n"
    "            output.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+\n"
    "          '</div>';\n"
    "        resDiv.appendChild(block);\n"
    "      });\n"
    "      TermLog._bodyEl.appendChild(resDiv);\n"
    "      TermLog.scrollBottom();\n"
    "    });\n"
    "  },\n\n"

    "  /* ── Перехоплення sshCall ── */"
)

if old_intercept in tl:
    tl = tl.replace(old_intercept, new_methods)
    print('OK: analyzeLogs + showMultiRouter + runOnMultiple ✅')

# Також фіксуємо кнопку "обясни ці логи мені" в головному UI
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

idx = html.find('обясни ці логи мені')
if idx > 0:
    print(f'Знайдено кнопку @ {idx}:')
    print(repr(html[max(0,idx-200):idx+100]))

with open('ai-agent/terminal-log.js', 'w', encoding='utf-8') as f:
    f.write(tl)

r = subprocess.run(['node','--check','ai-agent/terminal-log.js'],
                   capture_output=True, text=True)
print('terminal-log:', 'OK ✅' if r.returncode==0 else '❌\n'+r.stderr[:200])

print('\nВсе готово! npm start')