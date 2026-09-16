# -*- coding: utf-8 -*-
import subprocess, re

with open('diff-apply.js', 'r', encoding='utf-8') as f:
    content = f.read()

# ════════════════════════════════════════════
# 1. Знаходимо і замінюємо обробник da-compare
# ════════════════════════════════════════════
idx = content.find("document.getElementById('da-compare').addEventListener")
if idx < 0:
    print('ERR: da-compare не знайдено!')
    exit()

# Знаходимо кінець цього addEventListener блоку
brace_start = content.find('{', content.find('function()', idx))
depth = 0; end_cb = brace_start
for i, ch in enumerate(content[brace_start:], brace_start):
    if ch == '{': depth += 1
    elif ch == '}': depth -= 1
    if depth == 0: end_cb = i + 1; break
end_listener = content.find(');', end_cb) + 2

OLD_HANDLER = content[idx:end_listener]
print(f'Замінюємо обробник: {len(OLD_HANDLER)} символів')

NEW_HANDLER = """document.getElementById('da-compare').addEventListener('click', function() {
    var textA = document.getElementById('da-text-a').value.trim();
    var textB = document.getElementById('da-text-b').value.trim();
    if (!textA || !textB) { alert('Заповни обидва поля!'); return; }

    /* diff */
    var diff = diffLines(textA, textB);

    /* Очищуємо старий стиль output */
    var out = document.getElementById('da-diff-output');
    out.removeAttribute('style');
    out.style.marginBottom = '12px';

    /* stats */
    var st = document.getElementById('da-diff-stats');

    /* CSS */
    injectDiffCSS();

    /* Render */
    renderDiffVisual(textA, textB, diff, out, st);

    /* AI панель */
    showDiffAIPanel(diff);
  });"""

content = content[:idx] + NEW_HANDLER + content[end_listener:]
print('OK: обробник замінено ✅')

# ════════════════════════════════════════════
# 2. Додаємо showDiffAIPanel перед initDiffApply
# ════════════════════════════════════════════
AI_PANEL = '''
/* ══════════════════════════════════════════════════════
   AI ПАНЕЛЬ для Diff
   ══════════════════════════════════════════════════════ */
function showDiffAIPanel(diff) {
  /* Видаляємо стару панель */
  var old = document.getElementById('diff-ai-panel');
  if (old) old.remove();

  var added   = diff.added.length;
  var removed = diff.removed.length;
  var changed = diff.pairs.filter(function(p){ return p.type==='change'; }).length;
  if (added + removed + changed === 0) return;

  /* Збираємо summary */
  var summary = diff.pairs
    .filter(function(p){ return p.type !== 'equal'; })
    .map(function(p){
      if (p.type === 'delete') return '- ' + p.a;
      if (p.type === 'insert') return '+ ' + p.b;
      if (p.type === 'change') return '~ ' + p.a + ' -> ' + p.b;
      return '';
    }).slice(0, 60).join('\\n');

  window.__diffSummary = summary;
  window.__diffStats   = { added: added, removed: removed, changed: changed };

  /* Знаходимо контейнер */
  var wrap = document.getElementById('da-diff-output').parentElement;
  if (!wrap) return;

  var panel = document.createElement('div');
  panel.id  = 'diff-ai-panel';
  panel.style.cssText = 'margin-top:12px;background:#0a0f1a;border:1px solid #3a2a6a;border-radius:10px;overflow:hidden;';
  panel.innerHTML =
    '<div style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid #1a1a3a;">' +
      '<span style="font-size:18px;">🤖</span>' +
      '<span style="color:#c9d8e4;font-weight:600;font-size:14px;">AI Аналіз змін</span>' +
      '<span style="margin-left:auto;font-size:11px;color:#4a6070;">+' + added + ' −' + removed + ' ~' + changed + '</span>' +
    '</div>' +
    '<div style="padding:12px 16px;">' +
      '<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">' +
        '<button onclick="runDiffAI(\'analyze\')" style="background:#5b4efc;color:#fff;border:none;border-radius:6px;padding:7px 14px;cursor:pointer;font-size:12px;font-weight:600;">🔍 Аналізувати зміни</button>' +
        '<button onclick="runDiffAI(\'risk\')"    style="background:#c0392b;color:#fff;border:none;border-radius:6px;padding:7px 14px;cursor:pointer;font-size:12px;font-weight:600;">⚠️ Перевірити ризики</button>' +
        '<button onclick="runDiffAI(\'apply\')"   style="background:#27ae60;color:#fff;border:none;border-radius:6px;padding:7px 14px;cursor:pointer;font-size:12px;font-weight:600;">✅ Рекомендація</button>' +
        '<button onclick="showAIChat()"         style="background:#1a2a3a;color:#8ea3b0;border:1px solid #2a3b48;border-radius:6px;padding:7px 14px;cursor:pointer;font-size:12px;">💬 Запит до AI</button>' +
      '</div>' +
      '<div id="diff-ai-input" style="display:none;margin-bottom:10px;">' +
        '<textarea id="diff-ai-question" rows="2" placeholder="Запитай AI про зміни в конфігурації..." ' +
          'style="width:100%;background:#060d14;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:8px;font-size:12px;resize:none;box-sizing:border-box;"></textarea>' +
        '<button onclick="runDiffAI(\'custom\')" style="margin-top:6px;background:#4a90d9;color:#fff;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:12px;">Надіслати</button>' +
      '</div>' +
      '<div id="diff-ai-result" style="font-size:12px;color:#c9d8e4;line-height:1.7;min-height:20px;"></div>' +
    '</div>';

  wrap.appendChild(panel);
}

function showAIChat() {
  var inp = document.getElementById('diff-ai-input');
  if (inp) inp.style.display = inp.style.display === 'none' ? 'block' : 'none';
}

function runDiffAI(mode) {
  var result = document.getElementById('diff-ai-result');
  if (!result) return;

  var summary = window.__diffSummary || '';
  var stats   = window.__diffStats   || {};

  var prompts = {
    analyze: 'Проаналізуй ці зміни в конфігурації MikroTik RouterOS:\\n' + summary + '\\n\\nПоясни коротко що змінилось.',
    risk:    'Перевір ризики в цих змінах MikroTik:\\n' + summary + '\\n\\nЧи є небезпечні зміни? Що може зламатись?',
    apply:   'Ці зміни MikroTik:\\n' + summary + '\\n\\nЧи рекомендуєш застосовувати? Що треба перевірити перед застосуванням?',
    custom:  document.getElementById('diff-ai-question') ? document.getElementById('diff-ai-question').value : '',
  };

  var prompt = 'Ти експерт MikroTik RouterOS. ' + (prompts[mode] || prompts.analyze) + '\\nВідповідай українською, стисло.';

  result.innerHTML = '<div style="color:#4a6070;">⏳ AI аналізує...</div>';

  /* Шукаємо AI функцію */
  var aiFn = window.groqChat || window.sendToAI || window.askAI || window.callGroq;

  if (typeof aiFn === 'function') {
    aiFn(prompt).then(function(r) {
      result.innerHTML = formatAIResp(r);
    }).catch(function(e) {
      result.innerHTML = localAIAnalysis(summary, stats, mode);
    });
  } else {
    /* Локальний аналіз */
    result.innerHTML = localAIAnalysis(summary, stats, mode);
  }
}

function localAIAnalysis(summary, stats, mode) {
  var lines = (summary||'').split('\\n').filter(Boolean);
  var warnings = [], changes = [];

  lines.forEach(function(l) {
    var lo = l.toLowerCase();
    if (lo.includes('password')||lo.includes('pass')) warnings.push('🔐 Зміна пароля: ' + l.trim());
    else if (lo.includes('firewall')||lo.includes('drop')||lo.includes('accept')||lo.includes('reject')) warnings.push('🛡 Firewall: ' + l.trim());
    else if (lo.includes('address')||lo.includes('ip ')) changes.push('🌐 IP: ' + l.trim());
    else if (lo.includes('disable')||lo.includes('enable')) changes.push('⚙️ Стан: ' + l.trim());
    else if (lo.startsWith('+ ')) changes.push('✅ Додано: ' + l.slice(2).trim());
    else if (lo.startsWith('- ')) changes.push('❌ Видалено: ' + l.slice(2).trim());
    else changes.push('📝 ' + l.trim());
  });

  var html = '<div style="line-height:1.8;">';
  if (warnings.length) {
    html += '<div style="color:#e05252;font-weight:600;margin-bottom:6px;">⚠️ Увага — потребує перевірки:</div>';
    html += warnings.map(function(w){ return '<div style="color:#e08080;margin-left:12px;">'+w+'</div>'; }).join('');
    html += '<br>';
  }
  if (changes.length) {
    html += '<div style="color:#5fd0a5;font-weight:600;margin-bottom:6px;">📋 Зміни:</div>';
    html += changes.slice(0,15).map(function(c){ return '<div style="color:#c9d8e4;margin-left:12px;">'+c+'</div>'; }).join('');
  }
  html += '<br><div style="color:#4a6070;font-size:11px;">Статистика: <b style="color:#5fd0a5;">+' +
    (stats.added||0) + '</b> додано, <b style="color:#e05252;">−' +
    (stats.removed||0) + '</b> видалено, <b style="color:#f0a840;">~' +
    (stats.changed||0) + '</b> змінено</div>';
  html += '</div>';
  return html;
}

function formatAIResp(text) {
  return '<div style="line-height:1.8;">' +
    (text||'').replace(/\\*\\*(.*?)\\*\\*/g, '<b style="color:#5fd0a5;">$1</b>')
              .replace(/^(\\d+\\.)/gm, '<br><b>$1</b>')
              .replace(/\\n/g, '<br>') +
  '</div>';
}
/* ══════════════════════════════════════════════════════ END AI ══ */

'''

idx_init = content.find('function initDiffApply')
if idx_init > 0:
    content = content[:idx_init] + AI_PANEL + content[idx_init:]
    print('OK: AI панель додано ✅')
else:
    content += '\n' + AI_PANEL
    print('OK: AI панель додано в кінець ✅')

# ════════════════════════════════════════════
# 3. Фіксуємо da-diff-output стиль в HTML
# ════════════════════════════════════════════
content = re.sub(
    r'(id="da-diff-output"[^>]*?)white-space:pre-wrap;?',
    r'\1',
    content
)
content = re.sub(
    r'(id="da-diff-output"[^>]*?)padding:\d+px;?',
    r'\1',
    content
)
print('OK: da-diff-output стиль очищено ✅')

with open('diff-apply.js', 'w', encoding='utf-8') as f:
    f.write(content)

r = subprocess.run(['node', '--check', 'diff-apply.js'],
                   capture_output=True, text=True)
print('Синтаксис:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:300])