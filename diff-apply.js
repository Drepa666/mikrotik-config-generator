/* ============================================================
   diff-apply.js — Diff & Apply конфігурацій v1
   Порівнює два .rsc файли і застосовує тільки зміни
   ============================================================ */
'use strict';


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



function diffLines(textA, textB) {
  var linesA = textA.split('\n');
  var linesB = textB.split('\n');
  var m = linesA.length, n = linesB.length;
  var dp = [];
  for (var i = 0; i <= m; i++) {
    dp[i] = [];
    for (var j = 0; j <= n; j++) dp[i][j] = 0;
  }
  for (var i = 1; i <= m; i++) {
    for (var j = 1; j <= n; j++) {
      dp[i][j] = (linesA[i-1].trim() === linesB[j-1].trim())
        ? dp[i-1][j-1] + 1
        : Math.max(dp[i-1][j], dp[i][j-1]);
    }
  }
  var raw = [];
  var i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i-1].trim() === linesB[j-1].trim()) {
      raw.unshift({type:'equal',  a:linesA[i-1], b:linesB[j-1], na:i, nb:j});
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      raw.unshift({type:'insert', b:linesB[j-1], nb:j});
      j--;
    } else {
      raw.unshift({type:'delete', a:linesA[i-1], na:i});
      i--;
    }
  }
  var pairs = [];
  var k = 0;
  while (k < raw.length) {
    var cur = raw[k], nxt = raw[k+1];
    if (cur.type === 'delete' && nxt && nxt.type === 'insert') {
      pairs.push({type:'change', a:cur.a, b:nxt.b, na:cur.na, nb:nxt.nb});
      k += 2;
    } else { pairs.push(cur); k++; }
  }
  return {
    pairs:     pairs,
    added:     pairs.filter(function(p){return p.type==='insert';}).map(function(p){return p.b;}),
    removed:   pairs.filter(function(p){return p.type==='delete';}).map(function(p){return p.a;}),
    unchanged: pairs.filter(function(p){return p.type==='equal'; }).map(function(p){return p.a;}),
  };
}

function initDiffApply() {

  var PROXY = 'http://localhost:8888';

  /* ── Модальне вікно ── */
  var modal = document.createElement('div');
  modal.id = 'diffapply-modal';
  modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9998;overflow-y:auto;padding:20px;';

  modal.innerHTML = `
  <div style="max-width:1100px;margin:auto;background:#16212c;border:1px solid #2a3b48;border-radius:12px;padding:24px;">

    <!-- Шапка -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div>
        <h3 style="margin:0;color:#5fd0a5;font-size:16px;">🔄 Diff & Apply</h3>
        <div style="font-size:11px;color:#4a6070;margin-top:2px;">Порівняй конфіги — застосуй тільки зміни</div>
      </div>
      <button id="da-close" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;">✕ Закрити</button>
    </div>

    <!-- Підключення -->
    <div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;padding:12px;margin-bottom:16px;display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;">
      <div>
        <label style="font-size:10px;color:#8ea3b0;display:block;margin-bottom:3px;">IP роутера</label>
        <input id="da-ip" type="text" value="192.168.88.1" style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:6px 10px;border-radius:6px;font-size:12px;width:140px;">
      </div>
      <div>
        <label style="font-size:10px;color:#8ea3b0;display:block;margin-bottom:3px;">Логін</label>
        <input id="da-user" type="text" value="admin" style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:6px 10px;border-radius:6px;font-size:12px;width:80px;">
      </div>
      <div>
        <label style="font-size:10px;color:#8ea3b0;display:block;margin-bottom:3px;">Пароль</label>
        <input id="da-pass" type="password" placeholder="пароль" style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:6px 10px;border-radius:6px;font-size:12px;width:100px;">
      </div>
      <button id="da-fetch-current" style="background:#5b9bd5;color:#fff;border:none;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">📥 Отримати поточний конфіг</button>
      <span id="da-conn-status" style="font-size:11px;color:#4a6070;padding:6px 0;"></span>
    </div>

    <!-- Два редактори -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">

      <!-- Конфіг A (поточний) -->
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <label style="font-size:11px;color:#8ea3b0;">📄 Конфіг A (поточний / оригінал)</label>
          <div style="display:flex;gap:4px;">
            <label style="background:#0d1a24;border:1px solid #2a3b48;color:#8ea3b0;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:10px;">
              📂 Файл
              <input type="file" id="da-file-a" accept=".rsc,.txt" style="display:none;">
            </label>
            <button id="da-clear-a" style="background:transparent;border:1px solid #2a3b48;color:#4a6070;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:10px;">🗑️</button>
          </div>
        </div>
        <textarea id="da-text-a" rows="18" placeholder="Вставте поточний конфіг або отримайте з роутера..." style="width:100%;background:#060d14;border:1px solid #2a3b48;color:#c9e8d8;padding:10px;border-radius:6px;font-family:monospace;font-size:11px;resize:vertical;box-sizing:border-box;"></textarea>
        <div style="font-size:10px;color:#4a6070;margin-top:4px;" id="da-lines-a">0 рядків</div>
      </div>

      <!-- Конфіг B (новий) -->
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <label style="font-size:11px;color:#8ea3b0;">📄 Конфіг B (новий)</label>
          <div style="display:flex;gap:4px;">
            <label style="background:#0d1a24;border:1px solid #2a3b48;color:#8ea3b0;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:10px;">
              📂 Файл
              <input type="file" id="da-file-b" accept=".rsc,.txt" style="display:none;">
            </label>
            <button id="da-from-generator" style="background:#5fd0a533;border:1px solid #5fd0a5;color:#5fd0a5;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:10px;">← З генератора</button>
            <button id="da-clear-b" style="background:transparent;border:1px solid #2a3b48;color:#4a6070;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:10px;">🗑️</button>
          </div>
        </div>
        <textarea id="da-text-b" rows="18" placeholder="Вставте новий конфіг або завантажте з генератора..." style="width:100%;background:#060d14;border:1px solid #2a3b48;color:#c9e8d8;padding:10px;border-radius:6px;font-family:monospace;font-size:11px;resize:vertical;box-sizing:border-box;"></textarea>
        <div style="font-size:10px;color:#4a6070;margin-top:4px;" id="da-lines-b">0 рядків</div>
      </div>

    </div>

    <!-- Кнопка порівняти -->
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
      <button id="da-compare" style="background:#5fd0a5;color:#082018;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:700;">🔍 Порівняти</button>
      <button id="da-clear-result" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:8px 14px;border-radius:6px;cursor:pointer;font-size:12px;">✖ Очистити</button>
      <div id="da-diff-stats" style="font-size:11px;padding:8px 0;color:#4a6070;"></div>
    </div>

    <!-- Результат Diff -->
    <div id="da-diff-result" style="display:none;">

      <!-- Легенда -->
      <div style="display:flex;gap:12px;margin-bottom:8px;font-size:11px;">
        <span style="color:#5fd0a5;">+ Додано</span>
        <span style="color:#e0665a;">- Видалено</span>
        <span style="color:#4a6070;">  Без змін</span>
        <span style="color:#e6b35a;">~ Змінено</span>
      </div>

      <!-- Вивід diff -->
      <div id="da-diff-output" style="background:#060d14;border:1px solid #2a3b48;border-radius:8px;padding:14px;font-family:monospace;font-size:11px;max-height:350px;overflow-y:auto;line-height:1.7;margin-bottom:12px;overflow:auto;"></div>

      <!-- Apply секція -->
      <div style="background:#0a1f14;border:1px solid #1a4a2a;border-radius:8px;padding:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div>
            <div style="font-size:13px;color:#5fd0a5;font-weight:700;">🚀 Apply — застосувати зміни</div>
            <div style="font-size:11px;color:#4a6070;margin-top:2px;">Будуть виконані тільки нові/змінені рядки</div>
          </div>
          <div style="display:flex;gap:8px;">
            <button id="da-apply-btn" style="background:#5fd0a5;color:#082018;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:700;">⚡ Apply</button>
            <button id="da-apply-dry" style="background:transparent;border:1px solid #5fd0a5;color:#5fd0a5;padding:8px 14px;border-radius:6px;cursor:pointer;font-size:12px;">🧪 Dry Run</button>
          </div>
        </div>

        <!-- Нові рядки для apply -->
        <div style="margin-bottom:10px;">
          <div style="font-size:11px;color:#8ea3b0;margin-bottom:6px;">Рядки для застосування (можна редагувати):</div>
          <textarea id="da-apply-cmds" rows="6" style="width:100%;background:#060d14;border:1px solid #2a3b48;color:#5fd0a5;padding:10px;border-radius:6px;font-family:monospace;font-size:11px;resize:vertical;box-sizing:border-box;"></textarea>
        </div>

        <!-- Прогрес apply -->
        <div id="da-apply-progress" style="display:none;">
          <div style="background:#1c2a37;border-radius:4px;height:6px;margin-bottom:8px;overflow:hidden;">
            <div id="da-apply-bar" style="height:100%;background:#5fd0a5;width:0%;transition:width .3s;border-radius:4px;"></div>
          </div>
          <div id="da-apply-log" style="background:#060d14;border:1px solid #2a3b48;border-radius:6px;padding:10px;font-family:monospace;font-size:11px;max-height:150px;overflow-y:auto;"></div>
        </div>
      </div>

    </div>

  </div>`;

  document.body.appendChild(modal);

  /* ── Синхронізація з терміналом ── */
  function syncFromTerminal() {
    var fields = [
      ['tm-ip',   'da-ip'],
      ['tm-user', 'da-user'],
      ['tm-pass', 'da-pass'],
    ];
    fields.forEach(function(pair) {
      var src = document.getElementById(pair[0]);
      var dst = document.getElementById(pair[1]);
      if (src && dst && src.value) dst.value = src.value;
    });
  }

  /* ── Отримати поточний конфіг з роутера ── */
  document.getElementById('da-fetch-current').addEventListener('click', function() {
    var btn = this;
    btn.textContent = '⏳ Отримую...';
    btn.disabled = true;

    var ip   = document.getElementById('da-ip').value.trim();
    var user = document.getElementById('da-user').value.trim();
    var pass = document.getElementById('da-pass').value;
    var status = document.getElementById('da-conn-status');

    fetch(PROXY + '/ssh/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: ip, port: 22,
        user: user, password: pass,
        command: '/export compact',
        timeout: 30,
      }),
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (!d.ok) throw new Error(d.error);
      document.getElementById('da-text-a').value = d.output || '';
      updateLineCount('da-text-a', 'da-lines-a');
      status.textContent = '✅ Конфіг отримано!';
      status.style.color = '#5fd0a5';
    })
    .catch(function(e) {
      status.textContent = '❌ ' + e.message;
      status.style.color = '#e0665a';
    })
    .finally(function() {
      btn.textContent = '📥 Отримати поточний конфіг';
      btn.disabled = false;
    });
  });

  /* ── Завантаження файлів ── */
  function loadFile(inputId, textareaId, countId) {
    var input = document.getElementById(inputId);
    input.addEventListener('change', function() {
      var file = this.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(e) {
        document.getElementById(textareaId).value = e.target.result;
        updateLineCount(textareaId, countId);
      };
      reader.readAsText(file, 'utf-8');
    });
  }

  loadFile('da-file-a', 'da-text-a', 'da-lines-a');
  loadFile('da-file-b', 'da-text-b', 'da-lines-b');

  /* ── З генератора ── */
  document.getElementById('da-from-generator').addEventListener('click', function() {
    var output = document.getElementById('output');
    if (output && output.textContent.trim()) {
      document.getElementById('da-text-b').value = output.textContent;
      updateLineCount('da-text-b', 'da-lines-b');
    } else {
      alert('Спочатку згенеруй конфіг в генераторі!');
    }
  });

  /* ── Очистити ── */
  document.getElementById('da-clear-a').addEventListener('click', function() {
    document.getElementById('da-text-a').value = '';
    updateLineCount('da-text-a', 'da-lines-a');
  });
  document.getElementById('da-clear-b').addEventListener('click', function() {
    document.getElementById('da-text-b').value = '';
    updateLineCount('da-text-b', 'da-lines-b');
  });
  document.getElementById('da-clear-result').addEventListener('click', function() {
    document.getElementById('da-diff-result').style.display = 'none';
    document.getElementById('da-diff-output').innerHTML = '';
    document.getElementById('da-diff-stats').textContent = '';
    document.getElementById('da-apply-cmds').value = '';
  });

  /* ── Лічильник рядків ── */
  function updateLineCount(textareaId, countId) {
    var ta  = document.getElementById(textareaId);
    var cnt = document.getElementById(countId);
    if (!ta || !cnt) return;
    var lines = ta.value ? ta.value.split('\n').length : 0;
    cnt.textContent = lines + ' рядків';
  }

  ['da-text-a', 'da-text-b'].forEach(function(id) {
    var countId = id === 'da-text-a' ? 'da-lines-a' : 'da-lines-b';
    document.getElementById(id).addEventListener('input', function() {
      updateLineCount(id, countId);
    });
  });

  /* ── LCS Diff алгоритм ── */
  


  /* ── Порівняти ── */
  document.getElementById('da-compare').addEventListener('click', function() {
    var textA = document.getElementById('da-text-a').value.trim();
    var textB = document.getElementById('da-text-b').value.trim();
    if (!textA || !textB) { alert('Заповни обидва поля!'); return; }

    var diff   = diffLines(textA, textB);
    var output = document.getElementById('da-diff-output');
    var stats  = document.getElementById('da-diff-stats');
    injectDiffCSS();
    /* ── Рендер результату ── */
    try {
      output.style.whiteSpace = 'normal';
      output.style.padding    = '0';
      output.style.background = 'transparent';
      output.style.border     = 'none';
      renderDiffVisual(textA, textB, diff, output, stats);
    } catch(err) {
      console.error('Diff error:', err);
      output.innerHTML = '<div style="color:#e05252;padding:12px">❌ ' + err.message + '</div>';
    }
  });

  /* ── Apply — застосувати зміни ── */
  document.getElementById('da-apply-btn').addEventListener('click', function() {
    applyChanges(false);
  });

  document.getElementById('da-apply-dry').addEventListener('click', function() {
    applyChanges(true);
  });

  function applyChanges(dryRun) {
    var cmds = document.getElementById('da-apply-cmds').value.trim();
    if (!cmds) {
      alert('Немає команд для застосування!');
      return;
    }

    var ip   = document.getElementById('da-ip').value.trim();
    var user = document.getElementById('da-user').value.trim();
    var pass = document.getElementById('da-pass').value;
    var lines = cmds.split('\n').filter(function(l) { return l.trim(); });

    var progress = document.getElementById('da-apply-progress');
    var bar      = document.getElementById('da-apply-bar');
    var log      = document.getElementById('da-apply-log');

    progress.style.display = 'block';
    log.innerHTML = '';
    bar.style.width = '0%';

    if (dryRun) {
      log.innerHTML = '<span style="color:#e6b35a;">🧪 DRY RUN — команди НЕ виконуються на роутері:</span>\n\n';
      lines.forEach(function(cmd, i) {
        log.innerHTML += '<span style="color:#c9e8d8;">' + (i+1) + '. ' + cmd + '</span>\n';
        bar.style.width = ((i+1) / lines.length * 100) + '%';
      });
      log.innerHTML += '\n<span style="color:#5fd0a5;">✅ Dry run завершено! ' + lines.length + ' команд готові до застосування.</span>';
      return;
    }

    /* Реальне застосування — по одній команді */
    var idx = 0;

    function applyNext() {
      if (idx >= lines.length) {
        log.innerHTML += '\n<span style="color:#5fd0a5;">✅ Apply завершено! ' + lines.length + ' команд застосовано.</span>';
        bar.style.width = '100%';
        return;
      }

      var cmd = lines[idx];
      idx++;
      bar.style.width = (idx / lines.length * 100) + '%';

      log.innerHTML += '<span style="color:#4a6070;">' + idx + '/' + lines.length + '</span> <span style="color:#8ea3b0;">' + cmd + '</span>\n';
      log.scrollTop = log.scrollHeight;

      fetch(PROXY + '/ssh/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: ip, port: 22,
          user: user, password: pass,
          command: cmd,
          timeout: 10,
        }),
      })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (!d.ok || d.error) {
          log.innerHTML += '<span style="color:#e0665a;">  ❌ ' + (d.error || 'помилка') + '</span>\n';
        } else if (d.output && d.output.trim()) {
          log.innerHTML += '<span style="color:#5fd0a5;">  → ' + d.output.trim() + '</span>\n';
        } else {
          log.innerHTML += '<span style="color:#5fd0a5;">  ✅ OK</span>\n';
        }
        log.scrollTop = log.scrollHeight;
        applyNext();
      })
      .catch(function(e) {
        log.innerHTML += '<span style="color:#e0665a;">  ❌ ' + e.message + '</span>\n';
        applyNext();
      });
    }

    applyNext();
  }

  /* ── Закрити ── */
  document.getElementById('da-close').addEventListener('click', function() {
    modal.style.display = 'none';
  });
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.style.display = 'none';
  });

  /* ── Кнопка в панелі ── */
  function addBtn() {
    if (document.getElementById('btn-diffapply')) return true;
    var btn = document.createElement('button');
    btn.id        = 'btn-diffapply';
    btn.className = 'sec';
    btn.textContent = '🔄 Diff & Apply';
    btn.title = 'Порівняй конфіги і застосуй зміни';
    btn.addEventListener('click', function() {
      modal.style.display = 'block';
      syncFromTerminal();
    });
    var bar = document.querySelector('.btnbar');
    if (bar) { bar.appendChild(btn); return true; }
    return false;
  }

  if (!addBtn()) {
    var t = setInterval(function() { if (addBtn()) clearInterval(t); }, 300);
  }

  console.log('[diff-apply] v1 ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDiffApply);
} else {
  initDiffApply();
}