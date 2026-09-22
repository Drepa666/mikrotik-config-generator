# -*- coding: utf-8 -*-
import subprocess

# ════════════════════════════════════
# 1. ФІКС: Сканер — online з ARP/DHCP
# ════════════════════════════════════
with open('network-scanner.js', 'r', encoding='utf-8') as f:
    ns = f.read()

# Проблема: ARP пристрої мають online:null
# Рішення: online=true для ARP (вони є в таблиці = онлайн)
old_arp = (
    "      devices[key] = {ip:ip, mac:mac, hostname:'', iface:e['interface']||'',\n"
    "                      type:'arp', vendor:'', signal:'', online:null};"
)
new_arp = (
    "      devices[key] = {ip:ip, mac:mac, hostname:'', iface:e['interface']||'',\n"
    "                      type:'arp', vendor:'', signal:'', online:true};"
)

if old_arp in ns:
    ns = ns.replace(old_arp, new_arp)
    print('OK: ARP online=true ✅')
else:
    print('WARN: ARP рядок не знайдено точно — шукаємо варіант')
    idx = ns.find("type:'arp'")
    print(repr(ns[max(0,idx-150):idx+50]))

# Проблема: DHCP пристрої теж null
old_dhcp_online = "online:null};\n    });\n\n    neighborList"
new_dhcp_online = "online:true};\n    });\n\n    neighborList"
if old_dhcp_online in ns:
    ns = ns.replace(old_dhcp_online, new_dhcp_online)
    print('OK: DHCP online=true ✅')

# Проблема: pingNext парсить output неправильно
# RouterOS /ping повертає: "sent=1 received=1" або "host unreachable"
old_ping_parse = (
    "          d.online = (out.includes('received=1') || out.includes('ttl=')) ? true : false;"
)
new_ping_parse = (
    "          /* RouterOS ping output: sent=1 received=1 або host unreachable */\n"
    "          var received = out.match(/received=(\\d+)/);\n"
    "          var rcvNum   = received ? parseInt(received[1]) : 0;\n"
    "          d.online = (rcvNum > 0 ||\n"
    "                      out.includes('ttl=') ||\n"
    "                      out.includes('time=')) ? true : false;"
)

if old_ping_parse in ns:
    ns = ns.replace(old_ping_parse, new_ping_parse)
    print('OK: pingNext parse ✅')
else:
    print('WARN: pingNext parse не знайдено')

with open('network-scanner.js', 'w', encoding='utf-8') as f:
    f.write(ns)

r = subprocess.run(['node', '--check', 'network-scanner.js'],
                   capture_output=True, text=True)
print('network-scanner:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:150])

# ════════════════════════════════════
# 2. ФІКС: Diff — auto-fill з activeRouter
# ════════════════════════════════════
with open('diff-apply.js', 'r', encoding='utf-8') as f:
    diff = f.read()

# Проблема: da-user завжди "admin" але роутер може мати "admin1"
# Рішення: при відкритті Diff — беремо credentials з activeRouter
old_da_ip = (
    '<input id="da-ip" type="text" value="192.168.88.1"'
)
new_da_ip = (
    '<input id="da-ip" type="text" value="192.168.88.1"'
)

# Знаходимо функцію відкриття Diff вікна
idx_open = diff.find('DiffApply.open')
if idx_open < 0: idx_open = diff.find('diffApply.open')
if idx_open < 0: idx_open = diff.find("'da-ip'")
print(f'\nDiff open @ {idx_open}:')
print(repr(diff[max(0,idx_open-100):idx_open+300]))

# Знаходимо де ініціалізується вікно і додаємо auto-fill
old_init = "var daIp   = document.getElementById('da-ip');"
if old_init not in diff:
    old_init = "document.getElementById('da-ip')"

# Шукаємо fetchConfig функцію
idx_fetch = diff.find('fetchConfig')
if idx_fetch < 0: idx_fetch = diff.find('da-conn-status')
print(f'\nfetchConfig @ {idx_fetch}:')
print(repr(diff[max(0,idx_fetch-50):idx_fetch+400]))

# ── Додаємо auto-fill після відкриття вікна ──
# Знаходимо DiffApply.show або відкриття модалу
old_show = "da-modal"
idx_modal = diff.find("id='da-modal'")
if idx_modal < 0: idx_modal = diff.find('id="da-modal"')
print(f'\nda-modal @ {idx_modal}:')
print(repr(diff[max(0,idx_modal-50):idx_modal+100]))

# Знаходимо функцію show/open
for fn in ['DiffApply.show', 'show: function', 'open: function', '.show =']:
    idx_fn = diff.find(fn)
    if idx_fn > 0:
        print(f'\n"{fn}" @ {idx_fn}:')
        print(repr(diff[idx_fn:idx_fn+400]))
        break

# ── Фікс: авто-підтягування даних роутера при показі вікна ──
old_modal_show = "style.display = 'flex'"
idx_ms = diff.find(old_modal_show)
print(f'\nmodal show @ {idx_ms}:')
print(repr(diff[max(0,idx_ms-100):idx_ms+200]))

# Замінюємо щоб після показу авто-заповнювались поля
new_modal_show = (
    "style.display = 'flex';\n"
    "    /* Авто-заповнення з активного роутера */\n"
    "    if (window.getActiveRouter) {\n"
    "      var _r = window.getActiveRouter();\n"
    "      if (_r) {\n"
    "        var _ip   = document.getElementById('da-ip');\n"
    "        var _user = document.getElementById('da-user');\n"
    "        var _pass = document.getElementById('da-pass');\n"
    "        if (_ip   && _r.ip)   _ip.value   = _r.ip;\n"
    "        if (_user && _r.user) _user.value = _r.user;\n"
    "        if (_pass && _r.pass) _pass.value = _r.pass;\n"
    "      }\n"
    "    }"
)

if "style.display = 'flex'" in diff:
    diff = diff.replace("style.display = 'flex'", new_modal_show, 1)
    print('OK: auto-fill з activeRouter ✅')

# ════════════════════════════════════
# 3. ФІКС: Diff CSS — читабельний вигляд
# ════════════════════════════════════

# Проблема: word-break:break-all розбиває слова посеред
old_css_cell = (
    "cell:    'padding:2px 10px;white-space:pre-wrap;word-break:break-all;color:#4a6070;',"
)
new_css_cell = (
    "cell:    'padding:4px 12px;white-space:pre;font-family:monospace;font-size:12px;"
    "overflow-x:auto;color:#4a6070;',"
)

if old_css_cell in diff:
    diff = diff.replace(old_css_cell, new_css_cell)
    print('OK: cell CSS ✅')

old_css_cellD = (
    "cellD:   'padding:2px 10px;white-space:pre-wrap;word-break:break-all;color:#e08080;background:#2a0808;border"
)
new_css_cellD = (
    "cellD:   'padding:4px 12px;white-space:pre;font-family:monospace;font-size:12px;"
    "overflow-x:auto;color:#ff6060;background:#2a0808;border"
)

if old_css_cellD in diff:
    diff = diff.replace(old_css_cellD, new_css_cellD)
    print('OK: cellD CSS ✅')

# Додаємо CSS для колонок (рівна ширина)
old_table_style = diff.find("'<table style='")
if old_table_style < 0: old_table_style = diff.find('"<table style="')
print(f'\ntable style @ {old_table_style}')
print(repr(diff[old_table_style:old_table_style+150]))

# Фікс таблиці — рівні колонки, нормальний шрифт
old_tbl = "table-layout:fixed;width:100%"
if old_tbl not in diff:
    diff = diff.replace(
        "<table style='",
        "<table style='table-layout:fixed;width:100%;",
        1
    )

# ════════════════════════════════════
# 4. ФІКС: Diff — AI аналіз відмінностей
# ════════════════════════════════════
# Знаходимо кінець renderDiffVisual і додаємо AI кнопку
idx_render_end = diff.find('renderDiffVisual')
depth = 0; found = False; end_render = idx_render_end
for i, ch in enumerate(diff[idx_render_end:], idx_render_end):
    if ch == '{': depth += 1; found = True
    elif ch == '}': depth -= 1
    if found and depth == 0: end_render = i + 1; break

print(f'\nrenderDiffVisual end: {end_render}')

AI_EXPLAIN_FN = (
    "\n\n/* ── AI аналіз різниці конфігів ── */\n"
    "window.DiffAIExplain = function(textA, textB) {\n"
    "  var el = document.getElementById('da-ai-explain');\n"
    "  if (!el) return;\n"
    "  if (!window.AIAgent || !AIAgent.send) {\n"
    "    el.innerHTML = '<div style=\"color:#ff8080\">AI агент недоступний</div>';\n"
    "    return;\n"
    "  }\n"
    "  el.innerHTML = '<div style=\"color:#5fd0a5;padding:10px\">🤖 Аналізую відмінності...</div>';\n"
    "  var linesA = textA.split('\\n').length;\n"
    "  var linesB = textB.split('\\n').length;\n"
    "  /* Беремо перші 3000 символів щоб не перевантажити */\n"
    "  var shortA = textA.substring(0, 1500);\n"
    "  var shortB = textB.substring(0, 1500);\n"
    "  var prompt = 'Порівняй два конфіги MikroTik RouterOS.\\n' +\n"
    "    'КОНФІГ A (поточний):' + shortA + '\\n\\n' +\n"
    "    'КОНФІГ B (новий):' + shortB + '\\n\\n' +\n"
    "    'Поясни: 1) Що змінилося? 2) Які ризики? 3) Чи безпечно застосовувати? ' +\n"
    "    '4) Що покращиться після застосування? Відповідь українською, коротко і чітко.';\n"
    "  AIAgent.send(prompt, { includeContext: false })\n"
    "    .then(function(resp) {\n"
    "      var txt = resp && resp.content ? resp.content\n"
    "              : resp && resp.text    ? resp.text\n"
    "              : String(resp || 'Немає відповіді');\n"
    "      /* Форматуємо markdown */\n"
    "      txt = txt\n"
    "        .replace(/\\*\\*(.+?)\\*\\*/g, '<b>$1</b>')\n"
    "        .replace(/\\n/g, '<br>')\n"
    "        .replace(/```[\\s\\S]*?```/g, function(m) {\n"
    "          return '<code style=\"background:#0a1a0a;padding:2px 6px;border-radius:4px;\">' +\n"
    "            m.replace(/```\\w*/g,'').replace(/```/g,'') + '</code>';\n"
    "        });\n"
    "      el.innerHTML =\n"
    "        '<div style=\"background:#0d1f0d;border:1px solid #2a4a2a;border-radius:10px;' +\n"
    "          'padding:14px 18px;margin-top:12px;\">' +\n"
    "          '<div style=\"color:#5fd0a5;font-weight:700;margin-bottom:8px;\">🤖 AI Аналіз відмінностей</div>' +\n"
    "          '<div style=\"color:#c9d8e4;font-size:13px;line-height:1.6;\">' + txt + '</div>' +\n"
    "        '</div>';\n"
    "    })\n"
    "    .catch(function(e) {\n"
    "      el.innerHTML = '<div style=\"color:#ff8080\">Помилка AI: ' + e + '</div>';\n"
    "    });\n"
    "};\n"
)

diff = diff[:end_render] + AI_EXPLAIN_FN + diff[end_render:]
print('OK: DiffAIExplain ✅')

# Додаємо AI кнопку і блок після statsEl
old_stats_update = "if (statsEl) statsEl.innerHTML ="
idx_stats = diff.find(old_stats_update)
print(f'\nstatsEl @ {idx_stats}:')
print(repr(diff[idx_stats:idx_stats+200]))

# Знаходимо кінець блоку stats і додаємо AI кнопку
old_after_stats = "outputEl.appendChild(table);"
if old_after_stats not in diff:
    old_after_stats = "outputEl.innerHTML = "
idx_after = diff.find(old_after_stats)
print(f'\nafter_stats @ {idx_after}')

# Додаємо AI блок після таблиці
old_append = "outputEl.appendChild(table);"
new_append = (
    "outputEl.appendChild(table);\n\n"
    "  /* AI кнопка аналізу */\n"
    "  var aiDiv = document.getElementById('da-ai-explain');\n"
    "  if (!aiDiv) {\n"
    "    aiDiv = document.createElement('div');\n"
    "    aiDiv.id = 'da-ai-explain';\n"
    "    outputEl.parentNode.appendChild(aiDiv);\n"
    "  }\n"
    "  aiDiv.innerHTML = '';\n"
    "  var aiBtn = document.createElement('button');\n"
    "  aiBtn.textContent = '🤖 AI Пояснити відмінності';\n"
    "  aiBtn.style.cssText = 'margin-top:12px;background:linear-gradient(135deg,#1a3a2a,#2a5a3a);' +\n"
    "    'border:1px solid #3a7a4a;color:#5fd0a5;border-radius:8px;padding:8px 18px;' +\n"
    "    'cursor:pointer;font-size:13px;font-weight:600;';\n"
    "  aiBtn.onclick = function() { window.DiffAIExplain(textA, textB); };\n"
    "  aiDiv.appendChild(aiBtn);"
)

if old_append in diff:
    diff = diff.replace(old_append, new_append)
    print('OK: AI кнопка в diff ✅')

with open('diff-apply.js', 'w', encoding='utf-8') as f:
    f.write(diff)

r2 = subprocess.run(['node', '--check', 'diff-apply.js'],
                    capture_output=True, text=True)
print('diff-apply:', 'OK ✅' if r2.returncode == 0 else '❌\n' + r2.stderr[:200])

print('\nВсе готово! npm start')