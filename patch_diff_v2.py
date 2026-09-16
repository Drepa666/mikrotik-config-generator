# -*- coding: utf-8 -*-
import re, subprocess

with open('diff-apply.js', 'r', encoding='utf-8') as f:
    content = f.read()

# ════════════════════════════════════════════════════════
# 1. Замінюємо diffLines на LCS алгоритм
# ════════════════════════════════════════════════════════
def replace_function(content, func_name, new_code):
    pattern = r'function ' + re.escape(func_name) + r'\s*\([^)]*\)\s*\{'
    m = re.search(pattern, content)
    if not m:
        print(f'  Function {func_name} not found!')
        return content, False
    start = m.start()
    depth = 0; found = False; end = start
    for i, ch in enumerate(content[start:], start):
        if ch == '{': depth += 1; found = True
        elif ch == '}': depth -= 1
        if found and depth == 0: end = i + 1; break
    print(f'  {func_name}: {start}-{end}')
    return content[:start] + new_code + content[end:], True

NEW_DIFF_LINES = '''function diffLines(textA, textB) {
  var linesA = textA.split('\\n');
  var linesB = textB.split('\\n');
  var m = linesA.length, n = linesB.length;

  /* LCS таблиця */
  var dp = [];
  for (var i = 0; i <= m; i++) { dp[i] = []; for (var j = 0; j <= n; j++) dp[i][j] = 0; }
  for (var i = 1; i <= m; i++) {
    for (var j = 1; j <= n; j++) {
      if (linesA[i-1].trim() === linesB[j-1].trim()) dp[i][j] = dp[i-1][j-1] + 1;
      else dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
    }
  }
  /* Backtrack */
  var added = [], removed = [], unchanged = [], pairs = [];
  var i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i-1].trim() === linesB[j-1].trim()) {
      pairs.unshift({ type:'equal',  a: linesA[i-1], b: linesB[j-1], na: i, nb: j });
      unchanged.unshift(linesA[i-1]); i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      pairs.unshift({ type:'insert', b: linesB[j-1], nb: j });
      added.unshift(linesB[j-1]); j--;
    } else {
      pairs.unshift({ type:'delete', a: linesA[i-1], na: i });
      removed.unshift(linesA[i-1]); i--;
    }
  }
  /* Об'єднуємо delete+insert в change */
  var merged = [];
  var k = 0;
  while (k < pairs.length) {
    var cur = pairs[k], nxt = pairs[k+1];
    if (cur.type === 'delete' && nxt && nxt.type === 'insert') {
      merged.push({ type:'change', a: cur.a, b: nxt.b, na: cur.na, nb: nxt.nb });
      k += 2;
    } else { merged.push(cur); k++; }
  }
  return { added: added, removed: removed, unchanged: unchanged, pairs: merged };
}'''

content, ok = replace_function(content, 'diffLines', NEW_DIFF_LINES)
print('diffLines замінено:', ok)

# ════════════════════════════════════════════════════════
# 2. Замінюємо обробник da-compare
# ════════════════════════════════════════════════════════
old_compare = """document.getElementById('da-compare').addEventListener('click', function() {
    var textA = document.getElementById('da-text-a').value.trim();
    var textB = document.getElementById('da-text-b').value.trim();
    if (!textA || !textB) {
      alert('Заповни обидва поля!');
      return;
    }
    var diff   = diffLines(textA, textB);
    var output = document.getElementById('da-diff-output');
    var stats  = documen"""

# Знаходимо повний блок addEventListener для da-compare
idx = content.find("document.getElementById('da-compare').addEventListener")
if idx < 0:
    idx = content.find('da-compare')
    print(f'da-compare @ {idx}')

# Знаходимо кінець цього addEventListener блоку
if idx >= 0:
    # Знаходимо початок функції callback
    cb_start = content.find('function()', idx)
    if cb_start < 0:
        cb_start = content.find('function ()', idx)
    brace_start = content.find('{', cb_start)
    depth = 0; end_cb = brace_start
    for i, ch in enumerate(content[brace_start:], brace_start):
        if ch == '{': depth += 1
        elif ch == '}': depth -= 1
        if depth == 0: end_cb = i + 1; break
    # Кінець addEventListener(...)
    end_listener = content.find(';', end_cb) + 1
    if end_listener <= 0: end_listener = end_cb + 2

    old_block = content[idx:end_listener]
    print(f'Старий compare блок ({len(old_block)} символів):')
    print(old_block[:200])

    NEW_COMPARE = """document.getElementById('da-compare').addEventListener('click', function() {
    var textA = document.getElementById('da-text-a').value.trim();
    var textB = document.getElementById('da-text-b').value.trim();
    if (!textA || !textB) { alert('Заповни обидва поля!'); return; }

    var diff   = diffLines(textA, textB);
    var output = document.getElementById('da-diff-output');
    var stats  = document.getElementById('da-diff-stats');

    /* ── Рендер результату ── */
    renderDiffVisual(textA, textB, diff, output, stats);
  });"""

    content = content[:idx] + NEW_COMPARE + content[end_listener:]
    print('OK: da-compare обробник замінено')

# ════════════════════════════════════════════════════════
# 3. Додаємо renderDiffVisual + CSS + AI перед initDiffApply
# ════════════════════════════════════════════════════════
DIFF_VISUAL = r"""
/* ═══════════════════════════════════════════════════════
   DIFF VISUAL ENGINE
   ═══════════════════════════════════════════════════════ */

function escH(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function inlineDiff(a, b) {
  var tA = a.split(/(\s+|[=,;])/), tB = b.split(/(\s+|[=,;])/);
  var hA = '', hB = '';
  var len = Math.max(tA.length, tB.length);
  for (var i = 0; i < len; i++) {
    var ta = tA[i] !== undefined ? tA[i] : '';
    var tb = tB[i] !== undefined ? tB[i] : '';
    if (ta === tb) { hA += escH(ta); hB += escH(tb); }
    else {
      if (ta) hA += '<mark class="da-mark-del">' + escH(ta) + '</mark>';
      if (tb) hB += '<mark class="da-mark-add">' + escH(tb) + '</mark>';
    }
  }
  return { a: hA, b: hB };
}

function renderDiffVisual(textA, textB, diff, outputEl, statsEl) {
  var pairs  = diff.pairs || [];
  var added  = diff.added.length;
  var removed= diff.removed.length;
  var changed= pairs.filter(function(p){ return p.type==='change'; }).length;
  var same   = pairs.filter(function(p){ return p.type==='equal'; }).length;

  /* Статистика */
  if (statsEl) {
    statsEl.innerHTML =
      '<span class="da-stat da-stat-add">+' + added + ' додано</span>' +
      '<span class="da-stat da-stat-rem">&#8722;' + removed + ' видалено</span>' +
      '<span class="da-stat da-stat-chg">~ ' + changed + ' змінено</span>' +
      '<span class="da-stat da-stat-eq">' + same + ' однакових</span>' +
      (added+removed+changed === 0 ?
        '<span class="da-stat da-stat-ok">&#10003; Конфіги ідентичні</span>' : '');
  }

  /* Таблиця */
  var rows = pairs.map(function(p) {
    if (p.type === 'equal') {
      var txt = escH(p.a);
      return '<tr class="da-row-eq">' +
        '<td class="da-ln">' + p.na + '</td>' +
        '<td class="da-cell da-cell-eq">' + txt + '</td>' +
        '<td class="da-ln">' + p.nb + '</td>' +
        '<td class="da-cell da-cell-eq">' + txt + '</td>' +
        '</tr>';
    }
    if (p.type === 'delete') {
      return '<tr class="da-row-del">' +
        '<td class="da-ln da-ln-del">' + p.na + '</td>' +
        '<td class="da-cell da-cell-del"><span class="da-pfx">&#8722;</span> ' + escH(p.a) + '</td>' +
        '<td class="da-ln"></td>' +
        '<td class="da-cell da-cell-empty"></td>' +
        '</tr>';
    }
    if (p.type === 'insert') {
      return '<tr class="da-row-ins">' +
        '<td class="da-ln"></td>' +
        '<td class="da-cell da-cell-empty"></td>' +
        '<td class="da-ln da-ln-ins">' + p.nb + '</td>' +
        '<td class="da-cell da-cell-ins"><span class="da-pfx">+</span> ' + escH(p.b) + '</td>' +
        '</tr>';
    }
    if (p.type === 'change') {
      var inl = inlineDiff(p.a, p.b);
      return '<tr class="da-row-chg">' +
        '<td class="da-ln da-ln-del">' + p.na + '</td>' +
        '<td class="da-cell da-cell-del"><span class="da-pfx">~</span> ' + inl.a + '</td>' +
        '<td class="da-ln da-ln-ins">' + p.nb + '</td>' +
        '<td class="da-cell da-cell-ins"><span class="da-pfx">~</span> ' + inl.b + '</td>' +
        '</tr>';
    }
    return '';
  }).join('');

  outputEl.innerHTML =
    '<div class="da-table-wrap">' +
      '<table class="da-diff-table">' +
        '<thead><tr>' +
          '<th class="da-ln-h"></th>' +
          '<th class="da-head">&#128196; Конфіг A (оригінал)</th>' +
          '<th class="da-ln-h"></th>' +
          '<th class="da-head">&#128196; Конфіг B (новий)</th>' +
        '</tr></thead>' +
        '<tbody>' + (rows || '<tr><td colspan="4" style="padding:20px;text-align:center;color:#4a6070;">Немає змін</td></tr>') + '</tbody>' +
      '</table>' +
    '</div>' +
    /* AI кнопка */
    (added+removed+changed > 0 ?
      '<div style="margin-top:12px;display:flex;gap:10px;align-items:center;">' +
        '<button class="da-ai-btn" id="da-ai-btn" onclick="runDiffAIAnalysis()">&#129302; AI Аналіз змін</button>' +
        '<span style="font-size:11px;color:#4a6070;">AI пояснить що змінилось і чи безпечно застосовувати</span>' +
      '</div>' +
      '<div id="da-ai-out" style="margin-top:10px;"></div>'
    : '');

  /* Зберігаємо для AI */
  window.__daDiffData = {
    added: added, removed: removed, changed: changed,
    summary: pairs
      .filter(function(p){ return p.type !== 'equal'; })
      .map(function(p){
        if (p.type==='delete') return '- ' + p.a;
        if (p.type==='insert') return '+ ' + p.b;
        if (p.type==='change') return '~ ' + p.a + ' -> ' + p.b;
        return '';
      }).slice(0, 60).join('\n')
  };

  injectDiffCSS();
}

function runDiffAIAnalysis() {
  var btn = document.getElementById('da-ai-btn');
  var out = document.getElementById('da-ai-out');
  var d   = window.__daDiffData;
  if (!btn || !out || !d) return;

  btn.disabled    = true;
  btn.textContent = '\u23F3 Аналізую...';
  out.innerHTML   = '<div style="color:#4a6070;font-size:12px;">&#129302; AI аналізує зміни...</div>';

  var prompt = 'Ти експерт MikroTik RouterOS. Проаналізуй diff конфігурації.\n\n' +
    'ЗМІНИ:\n' + d.summary + '\n\n' +
    'Поясни:\n1. Що змінилось\n2. Чи є небезпечні зміни\n3. Чи рекомендуєш застосовувати\n' +
    'Відповідай українською, стисло.';

  /* Шукаємо AI функцію */
  var fn = window.sendToAI || window.askAI || window.groqChat ||
           window.sendGroqMessage || window.aiChat;

  if (typeof fn === 'function') {
    fn(prompt).then(function(r) {
      showAIResult(out, r);
      btn.disabled = false; btn.textContent = '\u{1F916} AI Аналіз змін';
    }).catch(function(e) {
      out.innerHTML = '<div style="color:#e05252;font-size:12px;">\u274C ' + e + '</div>';
      btn.disabled = false; btn.textContent = '\u{1F916} AI Аналіз змін';
    });
  } else {
    /* Локальний аналіз без AI */
    var res = localDiffAnalysis(d);
    showAIResult(out, res);
    btn.disabled = false; btn.textContent = '\u{1F916} AI Аналіз змін';
  }
}

function localDiffAnalysis(d) {
  var lines = d.summary.split('\n').filter(Boolean);
  var warn = [], info = [];
  lines.forEach(function(l) {
    var lo = l.toLowerCase();
    if (lo.includes('password')||lo.includes('pass'))
      warn.push('\uD83D\uDD10 Зміна пароля: ' + l.trim());
    else if (lo.includes('firewall')||lo.includes('drop')||lo.includes('accept'))
      warn.push('\uD83D\uDEE1 Firewall: ' + l.trim());
    else if (lo.includes('address')||lo.includes('ip '))
      info.push('\uD83C\uDF10 IP: ' + l.trim());
    else if (lo.includes('disable')||lo.includes('enable'))
      info.push('\u2699\uFE0F Стан: ' + l.trim());
    else info.push('\uD83D\uDCDD ' + l.trim());
  });
  var r = '';
  if (warn.length) r += '**\u26A0\uFE0F Увага:**\n' + warn.join('\n') + '\n\n';
  r += '**Зміни:**\n' + info.slice(0,10).join('\n') + '\n\n';
  r += '**Статистика:** +' + d.added + ' / \u2212' + d.removed + ' / ~' + d.changed;
  return r;
}

function showAIResult(el, text) {
  var html = (text||'')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\n/g, '<br>');
  el.innerHTML =
    '<div style="background:#0a0f1a;border:1px solid #3a2a6a;border-radius:8px;padding:14px 16px;">' +
      '<div style="font-size:11px;color:#5fd0a5;font-weight:600;margin-bottom:8px;">&#129302; AI Аналіз</div>' +
      '<div style="font-size:12px;color:#c9d8e4;line-height:1.6;">' + html + '</div>' +
    '</div>';
}

function injectDiffCSS() {
  if (document.getElementById('da-diff-css')) return;
  var s = document.createElement('style');
  s.id  = 'da-diff-css';
  s.textContent = [
    '.da-table-wrap{overflow:auto;max-height:420px;border-radius:6px;border:1px solid #2a3b48;}',
    '.da-diff-table{width:100%;border-collapse:collapse;font-family:monospace;font-size:12px;}',
    '.da-diff-table thead th{background:#080f17;color:#4a6070;padding:6px 12px;',
      'border-bottom:1px solid #2a3b48;position:sticky;top:0;z-index:2;text-align:left;}',
    '.da-ln{width:36px;min-width:36px;text-align:right;padding:2px 6px;',
      'color:#4a6070;font-size:11px;background:#060d14;border-right:1px solid #1a2a38;user-select:none;}',
    '.da-ln-h{width:36px;background:#060d14;}',
    '.da-cell{padding:2px 10px;white-space:pre;word-break:break-all;}',
    '.da-head{border-right:2px solid #1a2a38;}',
    '.da-cell:nth-child(2){border-right:2px solid #1a2a38;}',
    '.da-row-eq .da-cell{color:#5a7080;}',
    '.da-row-del{background:#1a0505;}',
    '.da-cell-del{color:#e08080;background:#2a0808;}',
    '.da-row-ins{background:#051a05;}',
    '.da-cell-ins{color:#80e0a0;background:#082808;}',
    '.da-row-chg{background:#1a1405;}',
    '.da-row-chg .da-cell-del{color:#e0c080;background:#2a1f08;}',
    '.da-row-chg .da-cell-ins{color:#80c0e0;background:#081f2a;}',
    '.da-cell-empty{background:#0a0f14;}',
    '.da-ln-del{color:#e05252;}',
    '.da-ln-ins{color:#5fd0a5;}',
    '.da-pfx{font-weight:700;margin-right:4px;}',
    'mark.da-mark-del{background:#5a1a1a;color:#ffaaaa;border-radius:2px;padding:0 2px;}',
    'mark.da-mark-add{background:#1a5a1a;color:#aaffaa;border-radius:2px;padding:0 2px;}',
    '.da-stat{display:inline-block;padding:2px 8px;border-radius:4px;',
      'font-size:12px;font-weight:600;margin-right:8px;}',
    '.da-stat-add{background:#0a2a1a;color:#5fd0a5;}',
    '.da-stat-rem{background:#2a0a0a;color:#e05252;}',
    '.da-stat-chg{background:#1a1a0a;color:#f0a840;}',
    '.da-stat-eq{background:#0a0f14;color:#4a6070;}',
    '.da-stat-ok{color:#5fd0a5;font-size:13px;}',
    '.da-ai-btn{background:linear-gradient(135deg,#5b4efc,#8b5efc);',
      'color:#fff;border:none;border-radius:6px;padding:8px 16px;',
      'cursor:pointer;font-size:13px;font-weight:600;transition:opacity .2s;}',
    '.da-ai-btn:hover{opacity:.85;}',
    '.da-ai-btn:disabled{opacity:.5;cursor:default;}',
  ].join('');
  document.head.appendChild(s);
}
/* ═══════════════════════════════════════ END DIFF VISUAL ═══ */

"""

# Вставляємо перед initDiffApply
idx_init = content.find('function initDiffApply')
if idx_init >= 0:
    content = content[:idx_init] + DIFF_VISUAL + content[idx_init:]
    print('OK: renderDiffVisual + AI додано перед initDiffApply')
else:
    content += '\n' + DIFF_VISUAL
    print('OK: додано в кінець')

# ════════════════════════════════════════════════════════
# 4. Додаємо da-diff-stats div в HTML форму якщо немає
# ════════════════════════════════════════════════════════
if 'da-diff-stats' not in content:
    content = content.replace(
        "id='da-diff-output'",
        "id='da-diff-stats' style='display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;'></div>\n    <div id='da-diff-output'"
    )
    content = content.replace(
        'id="da-diff-output"',
        'id="da-diff-stats" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;"></div>\n    <div id="da-diff-output"'
    )
    print('OK: da-diff-stats div додано')

with open('diff-apply.js', 'w', encoding='utf-8') as f:
    f.write(content)

r = subprocess.run(['node', '--check', 'diff-apply.js'],
                   capture_output=True, text=True)
if r.returncode == 0:
    print('\ndiff-apply.js: OK ✅\nЗапускай: npm start')
else:
    print('\ndiff-apply.js: ❌\n' + r.stderr[:400])
    m = re.search(r':(\d+)\n', r.stderr)
    if m:
        ln = int(m.group(1))
        lines = content.split('\n')
        s = max(0, ln-4); e = min(len(lines), ln+3)
        for i, l in enumerate(lines[s:e], s+1):
            print(f'{">>>" if i==ln else "   "} {i}: {l}')