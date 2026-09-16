# -*- coding: utf-8 -*-
import subprocess

DIFF_JS = r"""/* ═══════════════════════════════════════════════════════
   Diff & Apply — повний модуль
   ═══════════════════════════════════════════════════════ */

/* ── Утиліти ── */
function escH(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ── LCS Diff ── */
function diffLines(textA, textB) {
  var linesA = textA.split('\n');
  var linesB = textB.split('\n');
  var m = linesA.length, n = linesB.length;
  var dp = [];
  for (var i = 0; i <= m; i++) {
    dp[i] = [];
    for (var j = 0; j <= n; j++) dp[i][j] = 0;
  }
  for (var i = 1; i <= m; i++)
    for (var j = 1; j <= n; j++)
      dp[i][j] = linesA[i-1].trim() === linesB[j-1].trim()
        ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);

  var raw = [], i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i-1].trim() === linesB[j-1].trim()) {
      raw.unshift({type:'equal',  a:linesA[i-1], b:linesB[j-1], na:i, nb:j});
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      raw.unshift({type:'insert', b:linesB[j-1], nb:j}); j--;
    } else {
      raw.unshift({type:'delete', a:linesA[i-1], na:i}); i--;
    }
  }

  var pairs = [], k = 0;
  while (k < raw.length) {
    var cur = raw[k], nxt = raw[k+1];
    if (cur.type === 'delete' && nxt && nxt.type === 'insert') {
      pairs.push({type:'change', a:cur.a, b:nxt.b, na:cur.na, nb:nxt.nb}); k += 2;
    } else { pairs.push(cur); k++; }
  }
  return {
    pairs:     pairs,
    added:     pairs.filter(function(p){return p.type==='insert';}).map(function(p){return p.b;}),
    removed:   pairs.filter(function(p){return p.type==='delete';}).map(function(p){return p.a;}),
    unchanged: pairs.filter(function(p){return p.type==='equal'; }).map(function(p){return p.a;}),
  };
}

/* ── Inline diff ── */
function inlineDiff(a, b) {
  var tA = a.split(/(\s+|[=,;])/), tB = b.split(/(\s+|[=,;])/);
  var hA = '', hB = '', len = Math.max(tA.length, tB.length);
  for (var i = 0; i < len; i++) {
    var ta = tA[i]||'', tb = tB[i]||'';
    if (ta === tb) { hA += escH(ta); hB += escH(tb); }
    else {
      if (ta) hA += '<mark style="background:#5a1a1a;color:#ffaaaa;border-radius:2px;padding:0 2px;">' + escH(ta) + '</mark>';
      if (tb) hB += '<mark style="background:#1a5a1a;color:#aaffaa;border-radius:2px;padding:0 2px;">' + escH(tb) + '</mark>';
    }
  }
  return {a: hA, b: hB};
}

/* ── CSS ── */
function injectDiffCSS() {
  if (document.getElementById('da-diff-css')) return;
  var s = document.createElement('style');
  s.id = 'da-diff-css';
  s.textContent = [
    '.da-wrap{overflow:auto;max-height:420px;border-radius:6px;border:1px solid #2a3b48;}',
    '.da-tbl{width:100%;border-collapse:collapse;font-family:monospace;font-size:12px;}',
    '.da-tbl thead th{background:#080f17;color:#4a6070;padding:6px 12px;border-bottom:1px solid #2a3b48;position:sticky;top:0;text-align:left;}',
    '.da-ln{width:36px;min-width:36px;text-align:right;padding:2px 6px;color:#4a6070;font-size:11px;',
      'background:#060d14;border-right:1px solid #1a2a38;user-select:none;}',
    '.da-cell{padding:2px 10px;white-space:pre-wrap;word-break:break-all;}',
    '.da-eq .da-cell{color:#4a6070;}',
    '.da-del{background:#1a0505;} .da-del .da-cell{color:#e08080;background:#2a0808;}',
    '.da-ins{background:#051a05;} .da-ins .da-cell{color:#80e0a0;background:#082808;}',
    '.da-chg .da-cdel{color:#e0c080;background:#2a1f08;} .da-chg .da-cins{color:#80c0e0;background:#081f2a;}',
    '.da-empty{background:#0a0f14;}',
    '.da-ln-d{color:#e05252;} .da-ln-i{color:#5fd0a5;}',
    '.da-pfx{font-weight:700;margin-right:4px;}',
    '.da-stat{display:inline-block;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:600;margin-right:6px;}',
    '.da-s-a{background:#0a2a1a;color:#5fd0a5;} .da-s-r{background:#2a0a0a;color:#e05252;}',
    '.da-s-c{background:#1a1a0a;color:#f0a840;} .da-s-e{background:#0a0f14;color:#4a6070;}',
    '.da-s-ok{color:#5fd0a5;font-size:13px;}',
    '.da-ai-btn{background:linear-gradient(135deg,#5b4efc,#8b5efc);color:#fff;border:none;',
      'border-radius:6px;padding:8px 16px;cursor:pointer;font-size:13px;font-weight:600;transition:opacity .2s;}',
    '.da-ai-btn:hover{opacity:.85;} .da-ai-btn:disabled{opacity:.5;cursor:default;}',
  ].join('');
  document.head.appendChild(s);
}

/* ── Render ── */
function renderDiffVisual(textA, textB, diff, outputEl, statsEl) {
  if (!outputEl) { console.error('outputEl is null!'); return; }
  var pairs   = diff.pairs || [];
  var added   = diff.added.length;
  var removed = diff.removed.length;
  var changed = pairs.filter(function(p){return p.type==='change';}).length;
  var same    = pairs.filter(function(p){return p.type==='equal'; }).length;

  if (statsEl) {
    statsEl.innerHTML =
      '<span class="da-stat da-s-a">+' + added + ' додано</span>' +
      '<span class="da-stat da-s-r">&#8722;' + removed + ' видалено</span>' +
      '<span class="da-stat da-s-c">~' + changed + ' змінено</span>' +
      '<span class="da-stat da-s-e">' + same + ' однакових</span>' +
      (added+removed+changed===0 ? '<span class="da-s-ok">&#10003; Ідентичні</span>' : '');
  }

  var rows = pairs.map(function(p) {
    if (p.type === 'equal')
      return '<tr class="da-eq"><td class="da-ln">'+(p.na||'')+'</td><td class="da-cell">'+escH(p.a)+'</td>' +
             '<td class="da-ln">'+(p.nb||'')+'</td><td class="da-cell">'+escH(p.b||p.a)+'</td></tr>';
    if (p.type === 'delete')
      return '<tr class="da-del"><td class="da-ln da-ln-d">'+p.na+'</td>' +
             '<td class="da-cell"><span class="da-pfx">&#8722;</span>'+escH(p.a)+'</td>' +
             '<td class="da-ln"></td><td class="da-cell da-empty"></td></tr>';
    if (p.type === 'insert')
      return '<tr class="da-ins"><td class="da-ln"></td><td class="da-cell da-empty"></td>' +
             '<td class="da-ln da-ln-i">'+p.nb+'</td>' +
             '<td class="da-cell"><span class="da-pfx">+</span>'+escH(p.b)+'</td></tr>';
    if (p.type === 'change') {
      var inl = inlineDiff(p.a, p.b);
      return '<tr class="da-chg"><td class="da-ln da-ln-d">'+p.na+'</td>' +
             '<td class="da-cell da-cdel"><span class="da-pfx">~</span>'+inl.a+'</td>' +
             '<td class="da-ln da-ln-i">'+p.nb+'</td>' +
             '<td class="da-cell da-cins"><span class="da-pfx">~</span>'+inl.b+'</td></tr>';
    }
    return '';
  }).join('');

  outputEl.style.cssText = 'margin-bottom:12px;';
  outputEl.innerHTML =
    '<div class="da-wrap"><table class="da-tbl">' +
      '<thead><tr>' +
        '<th style="width:36px;background:#060d14;"></th>' +
        '<th>&#128196; Конфіг A (оригінал)</th>' +
        '<th style="width:36px;background:#060d14;"></th>' +
        '<th>&#128196; Конфіг B (новий)</th>' +
      '</tr></thead>' +
      '<tbody>' + (rows || '<tr><td colspan="4" style="padding:20px;text-align:center;color:#4a6070;">Немає змін</td></tr>') + '</tbody>' +
    '</table></div>';

  /* AI панель */
  window.__diffData = {
    added: added, removed: removed, changed: changed,
    summary: pairs.filter(function(p){return p.type!=='equal';})
      .map(function(p){
        if(p.type==='delete') return '- '+p.a;
        if(p.type==='insert') return '+ '+p.b;
        if(p.type==='change') return '~ '+p.a+' -> '+p.b;
      }).slice(0,60).join('\n')
  };

  /* Видаляємо стару AI панель */
  var old = document.getElementById('diff-ai-panel');
  if (old) old.remove();

  if (added + removed + changed > 0) {
    var panel = document.createElement('div');
    panel.id  = 'diff-ai-panel';
    panel.style.cssText = 'margin-top:12px;background:#0a0f1a;border:1px solid #3a2a6a;border-radius:10px;overflow:hidden;';
    panel.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid #1a1a3a;">' +
        '<span style="font-size:16px;">&#129302;</span>' +
        '<span style="color:#c9d8e4;font-weight:600;font-size:13px;">AI Аналіз diff</span>' +
        '<span style="margin-left:auto;font-size:11px;color:#4a6070;">+'+added+' &#8722;'+removed+' ~'+changed+'</span>' +
      '</div>' +
      '<div style="padding:12px 16px;">' +
        '<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">' +
          '<button class="da-ai-btn" onclick="runDiffAI(this,\'analyze\')">&#128269; Аналіз</button>' +
          '<button class="da-ai-btn" style="background:linear-gradient(135deg,#c0392b,#e74c3c);" onclick="runDiffAI(this,\'risk\')">&#9888;&#65039; Ризики</button>' +
          '<button class="da-ai-btn" style="background:linear-gradient(135deg,#27ae60,#2ecc71);" onclick="runDiffAI(this,\'apply\')">&#9989; Рекомендація</button>' +
          '<button class="da-ai-btn" style="background:#1a2a3a;border:1px solid #2a3b48;" onclick="toggleAIChat()">&#128172; Запит</button>' +
        '</div>' +
        '<div id="diff-ai-chat" style="display:none;margin-bottom:10px;">' +
          '<textarea id="diff-ai-q" rows="2" placeholder="Запитай AI про ці зміни..." ' +
            'style="width:100%;background:#060d14;border:1px solid #2a3b48;border-radius:6px;' +
            'color:#e6edf3;padding:8px;font-size:12px;resize:none;box-sizing:border-box;"></textarea>' +
          '<button class="da-ai-btn" style="margin-top:6px;font-size:12px;" onclick="runDiffAI(this,\'custom\')">&#128640; Надіслати</button>' +
        '</div>' +
        '<div id="diff-ai-out" style="font-size:12px;color:#c9d8e4;line-height:1.7;"></div>' +
      '</div>';
    outputEl.parentElement.appendChild(panel);
  }
}

function toggleAIChat() {
  var el = document.getElementById('diff-ai-chat');
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function runDiffAI(btn, mode) {
  var out = document.getElementById('diff-ai-out');
  var d   = window.__diffData;
  if (!out || !d) return;
  if (btn) { btn.disabled = true; }
  out.innerHTML = '<div style="color:#4a6070;">&#9203; AI аналізує...</div>';

  var q = mode === 'custom' ? (document.getElementById('diff-ai-q')||{value:''}).value : '';
  var prompts = {
    analyze: 'Проаналізуй зміни в конфігурації MikroTik RouterOS:\n' + d.summary + '\n\nПоясни що змінилось.',
    risk:    'Знайди ризики в змінах MikroTik:\n' + d.summary + '\n\nЩо небезпечно?',
    apply:   'Чи безпечно застосувати ці зміни MikroTik:\n' + d.summary + '\n\nРекомендація?',
    custom:  q + '\n\nКонтекст diff:\n' + d.summary,
  };
  var prompt = 'Ти експерт MikroTik RouterOS. ' + (prompts[mode]||prompts.analyze) + '\nВідповідай українською стисло.';
  var aiFn = window.groqChat || window.sendToAI || window.askAI;
  var done = function(text) {
    out.innerHTML = '<div style="line-height:1.8;">' +
      text.replace(/\*\*(.*?)\*\*/g,'<b style="color:#5fd0a5;">$1</b>').replace(/\n/g,'<br>') +
    '</div>';
    if (btn) btn.disabled = false;
  };
  if (typeof aiFn === 'function') {
    aiFn(prompt).then(done).catch(function(){ done(localDiffAI(d, mode)); });
  } else {
    done(localDiffAI(d, mode));
  }
}

function localDiffAI(d, mode) {
  var lines = (d.summary||'').split('\n').filter(Boolean);
  var w = [], c = [];
  lines.forEach(function(l) {
    var lo = l.toLowerCase();
    if (lo.includes('password')||lo.includes('pass')) w.push('🔐 ' + l.trim());
    else if (lo.includes('firewall')||lo.includes('drop')||lo.includes('accept')) w.push('🛡 ' + l.trim());
    else if (l.startsWith('+ ')) c.push('✅ Додано: ' + l.slice(2));
    else if (l.startsWith('- ')) c.push('❌ Видалено: ' + l.slice(2));
    else if (l.startsWith('~ ')) c.push('📝 Змінено: ' + l.slice(2));
  });
  var r = '';
  if (w.length) r += '**⚠️ Увага:**\n' + w.join('\n') + '\n\n';
  r += '**Зміни:**\n' + c.slice(0,12).join('\n');
  r += '\n\n**Статистика:** +' + d.added + ' / −' + d.removed + ' / ~' + d.changed;
  return r;
}

/* ════════════════════════════════════════════
   INIT — підключення всіх обробників
   ════════════════════════════════════════════ */
function initDiffApply() {
  /* Лічильники рядків */
  function updateLineCount(textareaId, counterId) {
    var el  = document.getElementById(textareaId);
    var cnt = document.getElementById(counterId);
    if (!el || !cnt) return;
    cnt.textContent = el.value ? el.value.split('\n').length + ' рядків' : '0 рядків';
  }

  var taA = document.getElementById('da-text-a');
  var taB = document.getElementById('da-text-b');
  if (taA) taA.addEventListener('input', function(){ updateLineCount('da-text-a','da-count-a'); });
  if (taB) taB.addEventListener('input', function(){ updateLineCount('da-text-b','da-count-b'); });

  /* ── Порівняти ── */
  var btnCmp = document.getElementById('da-compare');
  if (btnCmp) btnCmp.addEventListener('click', function() {
    var textA = (document.getElementById('da-text-a')||{value:''}).value.trim();
    var textB = (document.getElementById('da-text-b')||{value:''}).value.trim();
    if (!textA || !textB) { alert('Заповни обидва поля!'); return; }
    injectDiffCSS();
    var diff   = diffLines(textA, textB);
    var output = document.getElementById('da-diff-output');
    var stats  = document.getElementById('da-diff-stats');
    renderDiffVisual(textA, textB, diff, output, stats);
    /* Показуємо секцію результату */
    var res = document.getElementById('da-diff-result');
    if (res) res.style.display = 'block';
  });

  /* ── Очистити ── */
  var btnClr = document.getElementById('da-clear-result') || document.getElementById('da-clear');
  if (btnClr) btnClr.addEventListener('click', function() {
    ['da-text-a','da-text-b'].forEach(function(id){
      var el = document.getElementById(id); if(el) el.value='';
    });
    var out = document.getElementById('da-diff-output'); if(out) out.innerHTML='';
    var st  = document.getElementById('da-diff-stats');  if(st)  st.innerHTML='';
    var panel = document.getElementById('diff-ai-panel'); if(panel) panel.remove();
    updateLineCount('da-text-a','da-count-a');
    updateLineCount('da-text-b','da-count-b');
  });

  /* ── Файл A ── */
  var fileA = document.getElementById('da-file-a');
  if (fileA) fileA.addEventListener('change', function() {
    var f = this.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function(e) {
      var el = document.getElementById('da-text-a');
      if (el) { el.value = e.target.result; updateLineCount('da-text-a','da-count-a'); }
    };
    r.readAsText(f);
  });

  /* ── Файл B ── */
  var fileB = document.getElementById('da-file-b');
  if (fileB) fileB.addEventListener('change', function() {
    var f = this.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function(e) {
      var el = document.getElementById('da-text-b');
      if (el) { el.value = e.target.result; updateLineCount('da-text-b','da-count-b'); }
    };
    r.readAsText(f);
  });

  /* ── Очистити A ── */
  var clrA = document.getElementById('da-clear-a');
  if (clrA) clrA.addEventListener('click', function(){
    var el = document.getElementById('da-text-a'); if(el){el.value=''; updateLineCount('da-text-a','da-count-a');}
  });

  /* ── Очистити B ── */
  var clrB = document.getElementById('da-clear-b');
  if (clrB) clrB.addEventListener('click', function(){
    var el = document.getElementById('da-text-b'); if(el){el.value=''; updateLineCount('da-text-b','da-count-b');}
  });

  /* ── З генератора (B) ── */
  var fromGen = document.getElementById('da-from-gen');
  if (fromGen) fromGen.addEventListener('click', function() {
    var gen = document.getElementById('output') ||
              document.getElementById('config-output') ||
              document.getElementById('result');
    if (gen && gen.value) {
      var el = document.getElementById('da-text-b');
      if (el) { el.value = gen.value; updateLineCount('da-text-b','da-count-b'); }
    } else {
      alert('Спочатку згенеруй конфіг!');
    }
  });

  /* ── Отримати поточний конфіг ── */
  var btnFetch = document.getElementById('da-fetch-current');
  if (btnFetch) btnFetch.addEventListener('click', function() {
    var ip   = (document.getElementById('da-router-ip')  ||{value:''}).value.trim() || '192.168.88.1';
    var user = (document.getElementById('da-router-user')||{value:'admin'}).value.trim() || 'admin';
    var pass = (document.getElementById('da-router-pass')||{value:''}).value.trim();
    if (!pass) { alert('Введи пароль!'); return; }

    var btn = this;
    btn.disabled    = true;
    btn.textContent = '⏳ Отримую...';

    fetch('http://localhost:8888/ssh/exec', {
      method:  'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        host: ip, port: 22,
        username: user, password: pass,
        command: '/export compact'
      })
    }).then(function(r){ return r.json(); })
      .then(function(d) {
        btn.disabled    = false;
        btn.textContent = '&#128228; Отримати поточний конфіг';
        if (d.ok && d.output) {
          var el = document.getElementById('da-text-a');
          if (el) { el.value = d.output; updateLineCount('da-text-a','da-count-a'); }
          var st = document.getElementById('da-fetch-status');
          if (st) { st.textContent = '✅ Конфіг отримано!'; st.style.color = '#5fd0a5'; }
        } else {
          alert('Помилка: ' + (d.error||'невідома'));
        }
      }).catch(function(e) {
        btn.disabled    = false;
        btn.textContent = '&#128228; Отримати поточний конфіг';
        alert('Помилка з\'єднання: ' + e);
      });
  });

  /* ── Apply ── */
  var btnApply = document.getElementById('da-apply-btn');
  if (btnApply) btnApply.addEventListener('click', function(){ applyChanges(false); });
  var btnDry = document.getElementById('da-apply-dry');
  if (btnDry) btnDry.addEventListener('click', function(){ applyChanges(true); });

  /* ── Apply Next ── */
  var btnNext = document.getElementById('da-apply-next');
  if (btnNext) btnNext.addEventListener('click', function(){ applyNext(); });

  console.log('[DiffApply] ініціалізовано ✅');
}

/* ── Apply Changes ── */
function applyChanges(dryRun) {
  var textA = (document.getElementById('da-text-a')||{value:''}).value.trim();
  var textB = (document.getElementById('da-text-b')||{value:''}).value.trim();
  if (!textA || !textB) { alert('Заповни обидва поля!'); return; }

  var diff = diffLines(textA, textB);
  var cmds = diff.added.filter(function(l){
    return l.trim() && !l.trim().startsWith('#');
  });

  var ta = document.getElementById('da-apply-cmds');
  if (ta) ta.value = cmds.join('\n');

  if (dryRun) {
    alert('Dry run: ' + cmds.length + ' команд до застосування');
    return;
  }

  var ip   = (document.getElementById('da-router-ip')  ||{value:''}).value.trim();
  var user = (document.getElementById('da-router-user')||{value:'admin'}).value.trim();
  var pass = (document.getElementById('da-router-pass')||{value:''}).value.trim();
  if (!ip || !pass) { alert('Введи IP і пароль!'); return; }

  fetch('http://localhost:8888/ssh/exec', {
    method:  'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({host:ip, port:22, username:user, password:pass, command:cmds.join('\n')})
  }).then(function(r){return r.json();}).then(function(d){
    if (d.ok) alert('✅ Застосовано ' + cmds.length + ' команд!\n' + (d.output||'').substring(0,200));
    else      alert('❌ Помилка: ' + d.error);
  }).catch(function(e){ alert('❌ ' + e); });
}

function applyNext() { applyChanges(false); }

/* ── Автозапуск ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDiffApply);
} else {
  initDiffApply();
}
"""

with open('diff-apply.js', 'w', encoding='utf-8') as f:
    f.write(DIFF_JS)

r = subprocess.run(['node', '--check', 'diff-apply.js'],
                   capture_output=True, text=True)
print('Синтаксис:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:400])