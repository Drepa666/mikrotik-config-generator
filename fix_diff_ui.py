# -*- coding: utf-8 -*-
import subprocess

with open('diff-apply.js', 'r', encoding='utf-8') as f:
    diff = f.read()

# ════════════════════════════════════
# 1. ФІКС renderDiffVisual — поля a/b замість lineA/lineB
#    типи delete/insert замість remove/add
# ════════════════════════════════════
idx = diff.find('renderDiffVisual')
depth = 0; found = False; end = idx
for i, ch in enumerate(diff[idx:], idx):
    if ch == '{': depth += 1; found = True
    elif ch == '}': depth -= 1
    if found and depth == 0: end = i + 1; break

NEW_RENDER = (
    "renderDiffVisual(textA, textB, diffResult, outputEl, statsEl) {\n"
    "  if (!outputEl) return;\n"
    "  var pairs   = diffResult.pairs   || [];\n"
    "  var nAdded  = pairs.filter(function(p){return p.type==='insert';}).length;\n"
    "  var nRemoved= pairs.filter(function(p){return p.type==='delete';}).length;\n"
    "  var nChanged= pairs.filter(function(p){return p.type==='change';}).length;\n"
    "  var nSame   = pairs.filter(function(p){return p.type==='equal'; }).length;\n\n"

    "  /* ── Статистика ── */\n"
    "  if (statsEl) {\n"
    "    statsEl.innerHTML =\n"
    "      '<div style=\"display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;\">'+\n"
    "      '<span style=\"background:#0a2a0a;border:1px solid #2a5a2a;border-radius:5px;'+\n"
    "        'padding:2px 10px;color:#5fd0a5;font-size:12px;\">+' + nAdded   + ' додано</span>'+\n"
    "      '<span style=\"background:#2a0a0a;border:1px solid #5a2a2a;border-radius:5px;'+\n"
    "        'padding:2px 10px;color:#e08080;font-size:12px;\">−' + nRemoved + ' видалено</span>'+\n"
    "      '<span style=\"background:#1a1a0a;border:1px solid #4a4a2a;border-radius:5px;'+\n"
    "        'padding:2px 10px;color:#f0c060;font-size:12px;\">~' + nChanged + ' змінено</span>'+\n"
    "      '<span style=\"background:#0a0f1a;border:1px solid #2a3a4a;border-radius:5px;'+\n"
    "        'padding:2px 10px;color:#4a6070;font-size:12px;\">'  + nSame    + ' однаково</span>'+\n"
    "      '</div>';\n"
    "  }\n\n"

    "  function escHtml(s) {\n"
    "    return String(s||'')\n"
    "      .replace(/&/g,'&amp;')\n"
    "      .replace(/</g,'&lt;')\n"
    "      .replace(/>/g,'&gt;');\n"
    "  }\n\n"

    "  /* ── Заголовки колонок ── */\n"
    "  var html =\n"
    "    '<table style=\"width:100%;border-collapse:collapse;table-layout:fixed;\">'+\n"
    "    '<colgroup><col style=\"width:50%\"><col style=\"width:50%\"></colgroup>'+\n"
    "    '<thead><tr>'+\n"
    "    '<th style=\"background:#0a1a0a;color:#5fd0a5;padding:8px 12px;'+\n"
    "      'border:1px solid #1a3a2a;font-size:12px;text-align:left;\">'+\n"
    "      '📄 КОНФІГ A — Поточний (на роутері)'+\n"
    "    '</th>'+\n"
    "    '<th style=\"background:#0a0f1a;color:#5b9bd5;padding:8px 12px;'+\n"
    "      'border:1px solid #1a2a3a;font-size:12px;text-align:left;\">'+\n"
    "      '📝 КОНФІГ B — Новий (для застосування)'+\n"
    "    '</th>'+\n"
    "    '</tr></thead><tbody>';\n\n"

    "  var baseCell = 'padding:3px 10px;font-family:monospace;font-size:11px;'+\n"
    "    'border:1px solid #1a2a30;vertical-align:top;'+\n"
    "    'white-space:pre-wrap;word-break:break-word;';\n\n"

    "  pairs.forEach(function(pair) {\n"
    "    /* Поля: pair.a = рядок з A, pair.b = рядок з B */\n"
    "    var lineA = pair.a || '';\n"
    "    var lineB = pair.b || '';\n\n"

    "    if (pair.type === 'equal') {\n"
    "      var st = baseCell + 'color:#3a5060;background:#070d10;';\n"
    "      html += '<tr>'+\n"
    "        '<td style=\"'+st+'\">'+escHtml(lineA)+'</td>'+\n"
    "        '<td style=\"'+st+'\">'+escHtml(lineB)+'</td>'+\n"
    "        '</tr>';\n\n"

    "    } else if (pair.type === 'delete') {\n"
    "      /* Тільки в A — червоне — буде ВИДАЛЕНО */\n"
    "      html += '<tr>'+\n"
    "        '<td style=\"'+baseCell+'background:#1a0505;color:#e08080;border-left:3px solid #c03030;\">'+\n"
    "          '<span style=\"color:#c03030;font-size:10px;\">−</span> '+\n"
    "          escHtml(lineA)+\n"
    "          '<div style=\"color:#6a3030;font-size:10px;margin-top:2px;\">'+\n"
    "            '⚠ Є в A, відсутнє в B — буде ВИДАЛЕНО'+\n"
    "          '</div>'+\n"
    "        '</td>'+\n"
    "        '<td style=\"'+baseCell+'background:#0d0505;color:#3a1515;font-style:italic;\">'+\n"
    "          '— відсутнє в B —'+\n"
    "        '</td>'+\n"
    "        '</tr>';\n\n"

    "    } else if (pair.type === 'insert') {\n"
    "      /* Тільки в B — зелене — буде ДОДАНО */\n"
    "      html += '<tr>'+\n"
    "        '<td style=\"'+baseCell+'background:#050d05;color:#2a4a2a;font-style:italic;\">'+\n"
    "          '— відсутнє в A —'+\n"
    "        '</td>'+\n"
    "        '<td style=\"'+baseCell+'background:#051505;color:#5fd0a5;border-left:3px solid #3a9a3a;\">'+\n"
    "          '<span style=\"color:#3a9a3a;font-size:10px;\">+</span> '+\n"
    "          escHtml(lineB)+\n"
    "          '<div style=\"color:#2a5a2a;font-size:10px;margin-top:2px;\">'+\n"
    "            '✅ Відсутнє в A — буде ДОДАНО'+\n"
    "          '</div>'+\n"
    "        '</td>'+\n"
    "        '</tr>';\n\n"

    "    } else if (pair.type === 'change') {\n"
    "      /* Змінено — жовте ліворуч, зелене праворуч */\n"
    "      html += '<tr>'+\n"
    "        '<td style=\"'+baseCell+'background:#1a1200;color:#d4a820;border-left:3px solid #a07820;\">'+\n"
    "          '<span style=\"color:#a07820;font-size:10px;\">~</span> '+\n"
    "          escHtml(lineA)+\n"
    "          '<div style=\"color:#504010;font-size:10px;margin-top:2px;\">~ Старе значення в A</div>'+\n"
    "        '</td>'+\n"
    "        '<td style=\"'+baseCell+'background:#0d1800;color:#b8d060;border-left:3px solid #608030;\">'+\n"
    "          '<span style=\"color:#608030;font-size:10px;\">~</span> '+\n"
    "          escHtml(lineB)+\n"
    "          '<div style=\"color:#304010;font-size:10px;margin-top:2px;\">~ Нове значення в B</div>'+\n"
    "        '</td>'+\n"
    "        '</tr>';\n"
    "    }\n"
    "  });\n\n"

    "  html += '</tbody></table>';\n"
    "  outputEl.innerHTML = html;\n\n"

    "  /* AI кнопка */\n"
    "  var aiDiv = document.getElementById('da-ai-explain');\n"
    "  if (!aiDiv) {\n"
    "    aiDiv = document.createElement('div');\n"
    "    aiDiv.id = 'da-ai-explain';\n"
    "    outputEl.parentNode.appendChild(aiDiv);\n"
    "  }\n"
    "  aiDiv.innerHTML = '';\n"
    "  if (nAdded + nRemoved + nChanged === 0) {\n"
    "    aiDiv.innerHTML = '<div style=\"color:#5fd0a5;padding:12px;text-align:center;\">'+\n"
    "      '✅ Конфіги ідентичні — відмінностей немає!</div>';\n"
    "    return;\n"
    "  }\n"
    "  var aiBtn = document.createElement('button');\n"
    "  aiBtn.textContent = '🤖 AI — Пояснити відмінності';\n"
    "  aiBtn.style.cssText = 'margin-top:12px;background:linear-gradient(135deg,#1a3a2a,#2a5a3a);'+\n"
    "    'border:1px solid #3a7a4a;color:#5fd0a5;border-radius:8px;padding:8px 18px;'+\n"
    "    'cursor:pointer;font-size:13px;font-weight:600;display:block;';\n"
    "  aiBtn.onclick = function() { window.DiffAIExplain && DiffAIExplain(textA, textB); };\n"
    "  aiDiv.appendChild(aiBtn);\n"
    "}"
)

diff = diff[:idx] + NEW_RENDER + diff[end:]
print('OK: renderDiffVisual з правильними полями ✅')

# ════════════════════════════════════
# 2. ФІКС fetch handler — /export terse замість compact
#    + кладемо результат в textarea одразу
# ════════════════════════════════════
old_export_cmd = "'command: '/export compact',"
new_export_cmd = "'command: '/export terse',"

if "'command: '/export compact'," in diff:
    diff = diff.replace(
        "command: '/export compact',",
        "command: '/export terse',"
    )
    print('OK: /export terse (один рядок = одна команда) ✅')

# ════════════════════════════════════
# 3. ФІКС — textarea не заповнюється
#    Перевіряємо де textarea і що відбувається після fetch
# ════════════════════════════════════
old_cfg = (
    "      var cfg = d.output || d.result || '';\n"
    "      if (!cfg) throw new Error('Порожня відповідь від роутера');\n"
    "      document.getElementById('da-text-a').value = cfg;\n"
    "      updateLineCount('da-text-a', 'da-lines-a');\n"
    "      status.textContent = '✅ Конфіг отримано! (' + cfg.split('\\n').length + ' рядків)';\n"
    "      status.style.color = '#5fd0a5';"
)
new_cfg = (
    "      var cfg = d.output || d.result || '';\n"
    "      /* Очищаємо зайві пробіли і порожні рядки */\n"
    "      cfg = cfg.split('\\n')\n"
    "        .map(function(l){return l.trimRight();})\n"
    "        .join('\\n')\n"
    "        .trim();\n"
    "      if (!cfg || cfg.length < 10) throw new Error('Порожня відповідь від роутера');\n"
    "      var taA = document.getElementById('da-text-a');\n"
    "      if (!taA) throw new Error('textarea da-text-a не знайдено в DOM');\n"
    "      taA.value = cfg;\n"
    "      /* Тригеримо events щоб UI оновився */\n"
    "      taA.dispatchEvent(new Event('input'));\n"
    "      taA.dispatchEvent(new Event('change'));\n"
    "      updateLineCount('da-text-a', 'da-lines-a');\n"
    "      /* Логуємо в TermLog */\n"
    "      if (window.TermLog) {\n"
    "        TermLog.log('ok', 'Export отримано (' + cfg.split('\\n').length + ' рядків)');\n"
    "        TermLog.log('info', cfg.substring(0, 200) + (cfg.length > 200 ? '...' : ''));\n"
    "      }\n"
    "      status.textContent = '✅ Конфіг отримано! (' + cfg.split('\\n').length + ' рядків)';\n"
    "      status.style.color = '#5fd0a5';"
)

if old_cfg in diff:
    diff = diff.replace(old_cfg, new_cfg)
    print('OK: textarea заповнення + TermLog ✅')
else:
    print('WARN: cfg block не знайдено — шукаємо')
    idx2 = diff.find("document.getElementById('da-text-a').value = cfg")
    print(repr(diff[max(0,idx2-50):idx2+100]))

# ════════════════════════════════════
# 4. ФІКС updateLineCount — можливо не визначена
# ════════════════════════════════════
if 'function updateLineCount' not in diff:
    # Додаємо функцію
    insert_before = "document.getElementById('da-fetch-current')"
    if insert_before in diff:
        add_fn = (
            "  /* Оновлює лічильник рядків */\n"
            "  function updateLineCount(taId, countId) {\n"
            "    var ta  = document.getElementById(taId);\n"
            "    var cnt = document.getElementById(countId);\n"
            "    if (!ta || !cnt) return;\n"
            "    var n = ta.value ? ta.value.split('\\n').length : 0;\n"
            "    cnt.textContent = n + ' рядків';\n"
            "  }\n\n  "
        )
        diff = diff.replace(insert_before, add_fn + insert_before)
        print('OK: updateLineCount визначена ✅')
else:
    print('OK: updateLineCount вже є ✅')

with open('diff-apply.js', 'w', encoding='utf-8') as f:
    f.write(diff)

r = subprocess.run(['node','--check','diff-apply.js'],
                   capture_output=True, text=True)
print('diff-apply:', 'OK ✅' if r.returncode==0 else '❌\n'+r.stderr[:200])

# ════════════════════════════════════
# 5. Перевіряємо terminal-log — TermLog.readExport теж фіксуємо
# ════════════════════════════════════
with open('ai-agent/terminal-log.js', encoding='utf-8') as f:
    tl = f.read()

old_export_tl = "command: '/export compact'"
if old_export_tl in tl:
    tl = tl.replace(old_export_tl, "command: '/export terse'")
    print('OK: TermLog export terse ✅')
    with open('ai-agent/terminal-log.js', 'w', encoding='utf-8') as f:
        f.write(tl)

r2 = subprocess.run(['node','--check','ai-agent/terminal-log.js'],
                    capture_output=True, text=True)
print('terminal-log:', 'OK ✅' if r2.returncode==0 else '❌\n'+r2.stderr[:100])

print('\nВсе готово! npm start')
print('\nПісля запуску перевір в консолі після натискання "Отримати конфіг":')
print('  document.getElementById("da-text-a").value.length  // має бути > 100')