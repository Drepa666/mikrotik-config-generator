# -*- coding: utf-8 -*-
import subprocess, re

with open('diff-apply.js', 'r', encoding='utf-8') as f:
    content = f.read()

# ════════════════════════════════════════════════════════
# ФІК 1: Замінюємо runDiffAIAnalysis на runDiffAI(btn, mode)
# ════════════════════════════════════════════════════════
m = re.search(r'function runDiffAIAnalysis\s*\(\)', content)
if m:
    start = m.start()
    depth = 0; found = False; end = start
    for i, ch in enumerate(content[start:], start):
        if ch == '{': depth += 1; found = True
        elif ch == '}': depth -= 1
        if found and depth == 0: end = i+1; break
    print(f'runDiffAIAnalysis: {start}-{end}')

    NEW_AI = r"""function runDiffAI(btn, mode) {
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
}"""

    content = content[:start] + NEW_AI + content[end:]
    print('OK: runDiffAI замінено ✅')

# ════════════════════════════════════════════════════════
# ФІК 2: localDiffAI — замість localDiffAnalysis
# ════════════════════════════════════════════════════════
if 'function localDiffAI' not in content:
    # Знаходимо localDiffAnalysis і додаємо аліас
    idx_local = content.find('function localDiffAnalysis')
    if idx_local > 0:
        # Знаходимо кінець
        depth = 0; found = False; end_local = idx_local
        for i, ch in enumerate(content[idx_local:], idx_local):
            if ch == '{': depth += 1; found = True
            elif ch == '}': depth -= 1
            if found and depth == 0: end_local = i+1; break
        # Додаємо аліас після
        alias = '\nfunction localDiffAI(d, mode) { return localDiffAnalysis(d); }\n'
        content = content[:end_local] + alias + content[end_local:]
        print('OK: localDiffAI аліас додано ✅')
    else:
        # Додаємо просту функцію
        LOCAL_AI = """
function localDiffAI(d, mode) {
  var lines = (d.summary||'').split('\\n').filter(Boolean);
  var warn = [], info = [];
  lines.forEach(function(l) {
    var lo = l.toLowerCase();
    if (lo.includes('password')||lo.includes('pass')) warn.push('🔐 ' + l.trim());
    else if (lo.includes('firewall')||lo.includes('drop')||lo.includes('accept')) warn.push('🛡 ' + l.trim());
    else if (l.startsWith('+ ')) info.push('✅ Додано: ' + l.slice(2));
    else if (l.startsWith('- ')) info.push('❌ Видалено: ' + l.slice(2));
    else if (l.startsWith('~ ')) info.push('📝 Змінено: ' + l.slice(2));
  });
  var r = '';
  if (warn.length) r += '**⚠️ Увага:**\\n' + warn.join('\\n') + '\\n\\n';
  r += '**Зміни:**\\n' + info.slice(0,15).join('\\n');
  r += '\\n\\n**Статистика:** +' + d.added + ' / −' + d.removed + ' / ~' + d.changed;
  return r;
}
"""
        idx_init = content.find('function initDiffApply')
        content = content[:idx_init] + LOCAL_AI + content[idx_init:]
        print('OK: localDiffAI додано ✅')

# ════════════════════════════════════════════════════════
# ФІК 3: toggleDiffAIChat
# ════════════════════════════════════════════════════════
if 'function toggleDiffAIChat' not in content:
    content += '\nfunction toggleDiffAIChat(){var e=document.getElementById("diff-ai-chat");if(e)e.style.display=e.style.display==="none"?"block":"none";}\n'
    print('OK: toggleDiffAIChat додано ✅')

# ════════════════════════════════════════════════════════
# ФІК 4: window.* в кінці — після всіх функцій
# ════════════════════════════════════════════════════════
# Видаляємо старі window.*
content = re.sub(
    r'\n/\* ── Глобальні функції[^*]*\*/\n.*?window\.diffLines[^\n]*\n',
    '\n',
    content, flags=re.DOTALL
)

# Додаємо в самий кінець
GLOBALS = """
/* ── Глобальні аліаси ── */
window.runDiffAI        = runDiffAI;
window.toggleDiffAIChat = toggleDiffAIChat;
window.injectDiffCSS    = injectDiffCSS;
window.renderDiffVisual = renderDiffVisual;
window.diffLines        = diffLines;
"""
content = content.rstrip() + '\n' + GLOBALS
print('OK: window.* додано в кінець ✅')

# ════════════════════════════════════════════════════════
# ФІК 5: Diff вирівнювання — замінюємо diffLines merge
# ════════════════════════════════════════════════════════
m2 = re.search(r'function diffLines\s*\(textA,\s*textB\)\s*\{', content)
if m2:
    start2 = m2.start()
    depth = 0; found = False; end2 = start2
    for i, ch in enumerate(content[start2:], start2):
        if ch == '{': depth += 1; found = True
        elif ch == '}': depth -= 1
        if found and depth == 0: end2 = i+1; break

    NEW_DIFF = r"""function diffLines(textA, textB) {
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
}"""

    content = content[:start2] + NEW_DIFF + content[end2:]
    print('OK: diffLines з вирівнюванням замінено ✅')

with open('diff-apply.js', 'w', encoding='utf-8') as f:
    f.write(content)

r = subprocess.run(['node', '--check', 'diff-apply.js'],
                   capture_output=True, text=True)
print('Syntax:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:300])