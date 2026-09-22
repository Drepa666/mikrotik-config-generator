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

function renderDiffVisual(textA, textB, diffResult, outputEl, statsEl) {
  if (!outputEl) return;
  var pairs   = diffResult.pairs   || [];
  var nAdded  = pairs.filter(function(p){return p.type==='insert';}).length;
  var nRemoved= pairs.filter(function(p){return p.type==='delete';}).length;
  var nChanged= pairs.filter(function(p){return p.type==='change';}).length;
  var nSame   = pairs.filter(function(p){return p.type==='equal'; }).length;

  /* ── Статистика ── */
  if (statsEl) {
    statsEl.innerHTML =
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">'+
      '<span style="background:#0a2a0a;border:1px solid #2a5a2a;border-radius:5px;'+
        'padding:2px 10px;color:#5fd0a5;font-size:12px;">+' + nAdded   + ' додано</span>'+
      '<span style="background:#2a0a0a;border:1px solid #5a2a2a;border-radius:5px;'+
        'padding:2px 10px;color:#e08080;font-size:12px;">−' + nRemoved + ' видалено</span>'+
      '<span style="background:#1a1a0a;border:1px solid #4a4a2a;border-radius:5px;'+
        'padding:2px 10px;color:#f0c060;font-size:12px;">~' + nChanged + ' змінено</span>'+
      '<span style="background:#0a0f1a;border:1px solid #2a3a4a;border-radius:5px;'+
        'padding:2px 10px;color:#4a6070;font-size:12px;">'  + nSame    + ' однаково</span>'+
      '</div>';
  }

  function escHtml(s) {
    return String(s||'')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
  }

  /* ── Заголовки колонок ── */
  var html =
    '<table style="width:100%;border-collapse:collapse;table-layout:fixed;">'+
    '<colgroup><col style="width:50%"><col style="width:50%"></colgroup>'+
    '<thead><tr>'+
    '<th style="background:#0a1a0a;color:#5fd0a5;padding:8px 12px;'+
      'border:1px solid #1a3a2a;font-size:12px;text-align:left;">'+
      '📄 КОНФІГ A — Поточний (на роутері)'+
    '</th>'+
    '<th style="background:#0a0f1a;color:#5b9bd5;padding:8px 12px;'+
      'border:1px solid #1a2a3a;font-size:12px;text-align:left;">'+
      '📝 КОНФІГ B — Новий (для застосування)'+
    '</th>'+
    '</tr></thead><tbody>';

  var baseCell = 'padding:3px 10px;font-family:monospace;font-size:11px;'+
    'border:1px solid #1a2a30;vertical-align:top;'+
    'white-space:pre-wrap;word-break:break-word;';

  pairs.forEach(function(pair) {
    /* Поля: pair.a = рядок з A, pair.b = рядок з B */
    var lineA = pair.a || '';
    var lineB = pair.b || '';

    if (pair.type === 'equal') {
      var st = baseCell + 'color:#3a5060;background:#070d10;';
      html += '<tr>'+
        '<td style="'+st+'">'+escHtml(lineA)+'</td>'+
        '<td style="'+st+'">'+escHtml(lineB)+'</td>'+
        '</tr>';

    } else if (pair.type === 'delete') {
      /* Тільки в A — червоне — буде ВИДАЛЕНО */
      html += '<tr>'+
        '<td style="'+baseCell+'background:#1a0505;color:#e08080;border-left:3px solid #c03030;">'+
          '<span style="color:#c03030;font-size:10px;">−</span> '+
          escHtml(lineA)+
          '<div style="color:#6a3030;font-size:10px;margin-top:2px;">'+
            '⚠ Є в A, відсутнє в B — буде ВИДАЛЕНО'+
          '</div>'+
        '</td>'+
        '<td style="'+baseCell+'background:#0d0505;color:#3a1515;font-style:italic;">'+
          '— відсутнє в B —'+
        '</td>'+
        '</tr>';

    } else if (pair.type === 'insert') {
      /* Тільки в B — зелене — буде ДОДАНО */
      html += '<tr>'+
        '<td style="'+baseCell+'background:#050d05;color:#2a4a2a;font-style:italic;">'+
          '— відсутнє в A —'+
        '</td>'+
        '<td style="'+baseCell+'background:#051505;color:#5fd0a5;border-left:3px solid #3a9a3a;">'+
          '<span style="color:#3a9a3a;font-size:10px;">+</span> '+
          escHtml(lineB)+
          '<div style="color:#2a5a2a;font-size:10px;margin-top:2px;">'+
            '✅ Відсутнє в A — буде ДОДАНО'+
          '</div>'+
        '</td>'+
        '</tr>';

    } else if (pair.type === 'change') {
      /* Змінено — жовте ліворуч, зелене праворуч */
      html += '<tr>'+
        '<td style="'+baseCell+'background:#1a1200;color:#d4a820;border-left:3px solid #a07820;">'+
          '<span style="color:#a07820;font-size:10px;">~</span> '+
          escHtml(lineA)+
          '<div style="color:#504010;font-size:10px;margin-top:2px;">~ Старе значення в A</div>'+
        '</td>'+
        '<td style="'+baseCell+'background:#0d1800;color:#b8d060;border-left:3px solid #608030;">'+
          '<span style="color:#608030;font-size:10px;">~</span> '+
          escHtml(lineB)+
          '<div style="color:#304010;font-size:10px;margin-top:2px;">~ Нове значення в B</div>'+
        '</td>'+
        '</tr>';
    }
  });

  html += '</tbody></table>';
  outputEl.innerHTML = html;

  /* AI кнопка */
  var aiDiv = document.getElementById('da-ai-explain');
  if (!aiDiv) {
    aiDiv = document.createElement('div');
    aiDiv.id = 'da-ai-explain';
    outputEl.parentNode.appendChild(aiDiv);
  }
  aiDiv.innerHTML = '';
  if (nAdded + nRemoved + nChanged === 0) {
    aiDiv.innerHTML = '<div style="color:#5fd0a5;padding:12px;text-align:center;">'+
      '✅ Конфіги ідентичні — відмінностей немає!</div>';
    return;
  }
  var aiBtn = document.createElement('button');
  aiBtn.textContent = '🤖 AI — Пояснити відмінності';
  aiBtn.style.cssText = 'margin-top:12px;background:linear-gradient(135deg,#1a3a2a,#2a5a3a);'+
    'border:1px solid #3a7a4a;color:#5fd0a5;border-radius:8px;padding:8px 18px;'+
    'cursor:pointer;font-size:13px;font-weight:600;display:block;';
  aiBtn.onclick = function() { window.DiffAIExplain && DiffAIExplain(textA, textB); };
  aiDiv.appendChild(aiBtn);
}

/* ── AI аналіз різниці конфігів ── */
window.DiffAIExplain = function(textA, textB) {
  var el = document.getElementById('da-ai-explain');
  if (!el) return;
  if (!window.AIAgent || !AIAgent.send) {
    el.innerHTML = '<div style="color:#ff8080">AI агент недоступний</div>';
    return;
  }
  el.innerHTML = '<div style="color:#5fd0a5;padding:10px">🤖 Аналізую відмінності...</div>';
  var linesA = textA.split('\n').length;
  var linesB = textB.split('\n').length;
  /* Беремо перші 3000 символів щоб не перевантажити */
  var shortA = textA.substring(0, 1500);
  var shortB = textB.substring(0, 1500);
  var prompt = 'Порівняй два конфіги MikroTik RouterOS.\n' +
    'КОНФІГ A (поточний):' + shortA + '\n\n' +
    'КОНФІГ B (новий):' + shortB + '\n\n' +
    'Поясни: 1) Що змінилося? 2) Які ризики? 3) Чи безпечно застосовувати? ' +
    '4) Що покращиться після застосування? Відповідь українською, коротко і чітко.';
  AIAgent.send(prompt, { includeContext: false })
    .then(function(resp) {
      var txt = resp && resp.content ? resp.content
              : resp && resp.text    ? resp.text
              : String(resp || 'Немає відповіді');
      /* Форматуємо markdown */
      txt = txt
        .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
        .replace(/\n/g, '<br>')
        .replace(/```[\s\S]*?```/g, function(m) {
          return '<code style="background:#0a1a0a;padding:2px 6px;border-radius:4px;">' +
            m.replace(/```\w*/g,'').replace(/```/g,'') + '</code>';
        });
      el.innerHTML =
        '<div style="background:#0d1f0d;border:1px solid #2a4a2a;border-radius:10px;' +
          'padding:14px 18px;margin-top:12px;">' +
          '<div style="color:#5fd0a5;font-weight:700;margin-bottom:8px;">🤖 AI Аналіз відмінностей</div>' +
          '<div style="color:#c9d8e4;font-size:13px;line-height:1.6;">' + txt + '</div>' +
        '</div>';
    })
    .catch(function(e) {
      el.innerHTML = '<div style="color:#ff8080">Помилка AI: ' + e + '</div>';
    });
};


function runDiffAI(btn, mode) {
  var out = document.getElementById('diff-ai-out');
  var d   = window.__diffData;
  if (!out || !d) { console.error('runDiffAI: no out or data'); return; }
  if (btn) btn.disabled = true;
  out.innerHTML = '<div style="color:#4a6070;">&#9203; AI аналізує...</div>';

  var q = (mode === 'custom')
    ? ((document.getElementById('diff-ai-q') || {value:''}).value || '')
    : '';

  var prompts = {
    analyze: 'Проаналізуй зміни в конфігурації MikroTik RouterOS:\n' + d.summary + '\n\nПоясни що змінилось.',
    risk:    'Знайди небезпечні зміни в конфігурації MikroTik:\n' + d.summary + '\n\nЩо може зламатись?',
    apply:   'Чи безпечно застосувати ці зміни MikroTik:\n' + d.summary + '\n\nДай рекомендацію.',
    custom:  q + '\n\nКонтекст diff:\n' + d.summary,
  };
  var prompt = 'Ти експерт MikroTik RouterOS. ' +
    (prompts[mode] || prompts.analyze) +
    '\nВідповідай українською, стисло і по суті.';

  var done = function(text) {
    out.innerHTML =
      '<div style="line-height:1.8;font-size:12px;color:#c9d8e4;">' +
      (text||'').replace(/\*\*(.*?)\*\*/g,'<b style="color:#5fd0a5;">$1</b>')
                .replace(/\n/g,'<br>') +
      '</div>';
    if (btn) btn.disabled = false;
  };

  var fail = function() {
    done(localDiffAI(d, mode));
    if (btn) btn.disabled = false;
  };

  /* window.callAI — electron-bridge.js */
  if (typeof window.callAI === 'function') {
    window.callAI(prompt).then(done).catch(fail);
    return;
  }
  /* window.electronAPI.aiRequest — preload.js */
  if (window.electronAPI && typeof window.electronAPI.aiRequest === 'function') {
    window.electronAPI.aiRequest({ prompt: prompt, provider: 'groq' })
      .then(function(r){ done(r && r.result ? r.result : JSON.stringify(r)); })
      .catch(fail);
    return;
  }
  /* Локальний аналіз */
  fail();
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
function localDiffAI(d, mode) { return localDiffAnalysis(d); }


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

  /* LCS dp */
  var dp = [];
  for (var i = 0; i <= m; i++) {
    dp[i] = [];
    for (var j = 0; j <= n; j++) dp[i][j] = 0;
  }
  for (var i = 1; i <= m; i++)
    for (var j = 1; j <= n; j++)
      dp[i][j] = (linesA[i-1].trim() === linesB[j-1].trim())
        ? dp[i-1][j-1] + 1
        : Math.max(dp[i-1][j], dp[i][j-1]);

  /* Backtrack */
  var raw = []; var i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i-1].trim() === linesB[j-1].trim()) {
      raw.unshift({type:'equal',  a:linesA[i-1], b:linesB[j-1], na:i, nb:j}); i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      raw.unshift({type:'insert', b:linesB[j-1], nb:j}); j--;
    } else {
      raw.unshift({type:'delete', a:linesA[i-1], na:i}); i--;
    }
  }

  /* Side-by-side: zip delete+insert блоки разом */
  var pairs = [];
  var k = 0;
  while (k < raw.length) {
    if (raw[k].type === 'equal') {
      pairs.push(raw[k]); k++;
    } else {
      /* Збираємо блок delete і insert */
      var dels = [], ins = [];
      while (k < raw.length && raw[k].type === 'delete') { dels.push(raw[k]); k++; }
      while (k < raw.length && raw[k].type === 'insert') { ins.push(raw[k]); k++; }
      /* Zip: пари delete+insert в одному рядку */
      var maxLen = Math.max(dels.length, ins.length);
      for (var z = 0; z < maxLen; z++) {
        var dd = dels[z] || null;
        var ii = ins[z]  || null;
        if (dd && ii) {
          pairs.push({type:'change', a:dd.a, b:ii.b, na:dd.na, nb:ii.nb});
        } else if (dd) {
          pairs.push({type:'delete', a:dd.a, na:dd.na, nb:null});
        } else {
          pairs.push({type:'insert', b:ii.b, na:null, nb:ii.nb});
        }
      }
    }
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
      <div id="da-diff-output" style="margin-bottom:12px;overflow:auto;"></div>

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
    var daIp   = document.getElementById('da-ip');
    var daUser = document.getElementById('da-user');
    var daPass = document.getElementById('da-pass');
    if (!daIp || !daUser || !daPass) return;

    try {
      /* 1. Активний роутер з rm-routers */
      var activeId = localStorage.getItem('rm-active-router');
      var routers  = JSON.parse(localStorage.getItem('rm-routers') || '[]');
      var active   = routers.find(function(r) { return r.id === activeId; })
                  || routers[0]
                  || null;

      if (active) {
        if (active.ip)   daIp.value   = active.ip;
        if (active.user) daUser.value = active.user;
        if (active.pass) daPass.value = active.pass;
        console.log('[DiffApply] sync from rm-routers:',
          active.ip, active.user, 'pass:', active.pass ? '***' : 'empty');
      }

      /* 2. Якщо пароль порожній — беремо з rm-form-saved */
      if (!daPass.value) {
        var formSaved = JSON.parse(localStorage.getItem('rm-form-saved') || 'null');
        if (formSaved) {
          if (formSaved.user && !daUser.value) daUser.value = formSaved.user;
          if (formSaved.pass)                  daPass.value = formSaved.pass;
          console.log('[DiffApply] pass from rm-form-saved:', formSaved.user);
        }
      }

      /* 3. Якщо user порожній — беремо з rm-form-saved */
      if (!daUser.value) {
        var fs2 = JSON.parse(localStorage.getItem('rm-form-saved') || 'null');
        if (fs2 && fs2.user) daUser.value = fs2.user;
      }

    } catch(e) {
      console.warn('[DiffApply] syncFromTerminal error:', e);
    }
  }

  /* ── Отримати поточний конфіг з роутера ── */
  document.getElementById('da-fetch-current').addEventListener('click', function() {
    var btn    = this;
    var status = document.getElementById('da-conn-status');
    btn.textContent = '⏳ Отримую...';
    btn.disabled    = true;
    status.textContent = '';

    /* ── Авто-заповнення credentials ── */
    /* Оновлюємо поля перед читанням */
    syncFromTerminal();

    var ip   = document.getElementById('da-ip').value.trim();
    var user = document.getElementById('da-user').value.trim();
    var pass = document.getElementById('da-pass').value.trim();

    /* Fallback якщо syncFromTerminal не дав результату */
    if (!pass && window.RouterManager) {
      var routers = RouterManager.getAll ? RouterManager.getAll()
                  : RouterManager.routers || RouterManager._routers || [];
      if (!Array.isArray(routers)) routers = Object.values(routers);
      routers.forEach(function(r) {
        if (!r) return;
        var rIp = r.ip || r.host || r.address || '';
        if (rIp && (!ip || ip === rIp)) {
          ip   = ip   || rIp;
          user = user || r.user || r.username || r.login || '';
          pass = pass || r.pass || r.password || '';
        }
      });
    }

    /* 2. Keystore */
    if (!pass && window.AIKeystore) {
      var allKeys = AIKeystore.getAll ? AIKeystore.getAll() : {};
      /* Шукаємо по IP */
      Object.values(allKeys).forEach(function(k) {
        if (!k) return;
        if (k.host === ip || k.ip === ip) {
          user = user || k.user || k.username || '';
          pass = pass || k.pass || k.password || '';
        }
      });
      /* Будь-який збережений якщо IP не знайдено */
      if (!pass) {
        var anyKey = Object.values(allKeys)[0] || {};
        user = user || anyKey.user || anyKey.username || '';
        pass = pass || anyKey.pass || anyKey.password || '';
      }
    }

    /* 3. LocalStorage — шукаємо збережені роутери */
    if (!pass) {
      try {
        var lsKeys = ['routers','mikrotik-routers','saved-routers',
                      'router-list','connections'];
        lsKeys.forEach(function(key) {
          if (pass) return;
          var raw = localStorage.getItem(key);
          if (!raw) return;
          var data = JSON.parse(raw);
          var arr = Array.isArray(data) ? data : Object.values(data);
          arr.forEach(function(r) {
            if (!r || pass) return;
            var rIp = r.ip || r.host || r.address || '';
            if (!ip || rIp === ip) {
              user = user || r.user || r.username || r.login || 'admin';
              pass = pass || r.pass || r.password || '';
              if (rIp) ip = rIp;
            }
          });
        });
      } catch(e) {}
    }

    /* Оновлюємо поля UI */
    var daIp   = document.getElementById('da-ip');
    var daUser = document.getElementById('da-user');
    var daPass = document.getElementById('da-pass');
    if (daIp   && ip)   daIp.value   = ip;
    if (daUser && user) daUser.value = user;
    if (daPass && pass) daPass.value = pass;

    /* Фінальна перевірка */
    if (!ip || !user || !pass) {
      status.textContent = '❌ Заповніть IP, логін та пароль';
      status.style.color = '#e0665a';
      btn.textContent    = '📥 Отримати поточний конфіг';
      btn.disabled       = false;
      return;
    }

    console.log('[DiffApply] Connecting:', ip, user);
    status.textContent = '🔄 Підключення до ' + ip + '...';
    status.style.color = '#8ea3b0';

    fetch(PROXY + '/ssh/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: ip,
        port: (function(){
          try{
            var rs=JSON.parse(localStorage.getItem('rm-routers')||'[]');
            var aid=localStorage.getItem('rm-active-router');
            var ar=rs.find(function(r){return r.id===aid;})||rs[0]||{};
            return ar.sshPort||22;
          }catch(e){return 22;}
        })(),
        user: user, username: user, password: pass,
        command: '/export compact',
        timeout: 30,
      }),
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (!d.ok) throw new Error(d.error || 'SSH error');
      var cfg = d.output || d.result || '';
      /* Очищаємо зайві пробіли і порожні рядки */
      cfg = cfg.split('\n')
        .map(function(l){return l.trimRight();})
        .join('\n')
        .trim();
      if (!cfg || cfg.length < 10) throw new Error('Порожня відповідь від роутера');
      var taA = document.getElementById('da-text-a');
      if (!taA) throw new Error('textarea da-text-a не знайдено в DOM');
      taA.value = cfg;
      /* Тригеримо events щоб UI оновився */
      taA.dispatchEvent(new Event('input'));
      taA.dispatchEvent(new Event('change'));
      updateLineCount('da-text-a', 'da-lines-a');
      /* Логуємо в TermLog */
      if (window.TermLog) {
        TermLog.log('ok', 'Export отримано (' + cfg.split('\n').length + ' рядків)');
        TermLog.log('info', cfg.substring(0, 200) + (cfg.length > 200 ? '...' : ''));
      }
      status.textContent = '✅ Конфіг отримано! (' + cfg.split('\n').length + ' рядків)';
      status.style.color = '#5fd0a5';
    })
    .catch(function(e) {
      var msg = e.message || String(e);
      /* Підказки по типу помилки */
      var hint = '';
      if (msg.indexOf('Wrong login') >= 0 || msg.indexOf('password') >= 0)
        hint = ' — перевірте логін/пароль';
      else if (msg.indexOf('ECONNREFUSED') >= 0 || msg.indexOf('connect') >= 0)
        hint = ' — роутер недоступний по SSH';
      else if (msg.indexOf('timeout') >= 0)
        hint = ' — перевищено час очікування';
      status.textContent = '❌ ' + msg + hint;
      status.style.color = '#e0665a';
      console.error('[DiffApply] Error:', msg, {ip, user});
    })
    .finally(function() {
      btn.textContent = '📥 Отримати поточний конфіг';
      btn.disabled    = false;
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
      output.removeAttribute('style');
      output.style.marginBottom = '12px';
      renderDiffVisual(textA, textB, diff, output, stats);
      /* Показуємо da-diff-result (батько da-diff-output) */
      var res = document.getElementById('da-diff-result');
      if (res) res.style.display = 'block';
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
function toggleDiffAIChat(){var e=document.getElementById("diff-ai-chat");if(e)e.style.display=e.style.display==="none"?"block":"none";}

/* ── Глобальні аліаси ── */
window.runDiffAI        = runDiffAI;
window.toggleDiffAIChat = toggleDiffAIChat;
window.injectDiffCSS    = injectDiffCSS;
window.renderDiffVisual = renderDiffVisual;
window.diffLines        = diffLines;
