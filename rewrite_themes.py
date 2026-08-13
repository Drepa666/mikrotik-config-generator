content = r"""/* ============================================================
   themes.js — Patch 38
   ============================================================ */
'use strict';

var THEMES = {
  dark:      { name:'🌙 Dark',      bg:'#0f1720', panel:'#16212c', panel2:'#1c2a37', border:'#2a3b48', text:'#e6edf3', muted:'#8ea3b0', accent:'#5fd0a5', out_bg:'#0a1017', out_text:'#c9e8d8' },
  light:     { name:'☀️ Light',     bg:'#f0f4f8', panel:'#ffffff', panel2:'#e8eef4', border:'#c0ccd8', text:'#1a2a3a', muted:'#5a7a90', accent:'#1a8a6a', out_bg:'#1a2a3a', out_text:'#c9e8d8' },
  hacker:    { name:'💻 Hacker',    bg:'#000000', panel:'#0a0a0a', panel2:'#0f0f0f', border:'#1a3a1a', text:'#00ff41', muted:'#00aa2a', accent:'#00ff41', out_bg:'#000800', out_text:'#00ff41' },
  navy:      { name:'🌊 Navy',      bg:'#0a0e1a', panel:'#0f1628', panel2:'#162040', border:'#1e3060', text:'#c8d8f0', muted:'#6888b0', accent:'#4da8ff', out_bg:'#060a14', out_text:'#a8d0ff' },
  solarized: { name:'🌅 Solarized', bg:'#002b36', panel:'#073642', panel2:'#0d4a5a', border:'#1a5a6a', text:'#839496', muted:'#586e75', accent:'#2aa198', out_bg:'#001e27', out_text:'#93a1a1' },
};

var _currentTheme = 'dark';

function applyTheme(id) {
  var t = THEMES[id];
  if (!t) return;
  _currentTheme = id;

  /* Видаляємо старий override */
  var old = document.getElementById('mt-theme-css');
  if (old) old.parentNode.removeChild(old);

  var s = document.createElement('style');
  s.id = 'mt-theme-css';
  s.textContent = [
    'body{background:' + t.bg + '!important;color:' + t.text + '!important}',
    '.card{background:' + t.panel + '!important;border-color:' + t.border + '!important}',
    '.card h2{color:' + t.accent + '!important}',
    'input,select,textarea{background:' + t.panel2 + '!important;color:' + t.text + '!important;border-color:' + t.border + '!important}',
    'label{color:' + t.muted + '!important}',
    '#output{background:' + t.out_bg + '!important;color:' + t.out_text + '!important}',
    '.hint{color:' + t.muted + '!important}',
    '.btnbar button.sec{border-color:' + t.border + '!important;color:' + t.text + '!important}',
    '.badge{background:' + t.panel2 + '!important}',
    id === 'hacker' ? '*{font-family:"Courier New",monospace!important}' : '',
  ].join('\n');
  document.head.appendChild(s);

  if (id === 'hacker') {
    if (!document.getElementById('mt-scanlines')) {
      var sc = document.createElement('div');
      sc.id = 'mt-scanlines';
      sc.style.cssText = 'position:fixed;inset:0;z-index:99998;pointer-events:none;background:repeating-linear-gradient(to bottom,transparent 0,transparent 2px,rgba(0,0,0,.15) 2px,rgba(0,0,0,.15) 4px)';
      document.body.appendChild(sc);
    }
  } else {
    var sc = document.getElementById('mt-scanlines');
    if (sc) sc.parentNode.removeChild(sc);
  }

  /* Оновлюємо кнопки */
  document.querySelectorAll('[data-theme-id]').forEach(function(btn) {
    var active = btn.getAttribute('data-theme-id') === id;
    btn.style.background  = active ? t.accent : 'transparent';
    btn.style.color       = active ? '#082018' : t.muted;
    btn.style.borderColor = active ? t.accent  : t.border;
    btn.style.fontWeight  = active ? '700' : '400';
  });

  localStorage.setItem('mt-theme', id);
}

function createPanel() {
  if (document.getElementById('mt-theme-panel')) return;

  var panel = document.createElement('div');
  panel.id = 'mt-theme-panel';
  panel.style.cssText = 'display:none;position:fixed;bottom:60px;right:16px;background:#16212c;border:1px solid #2a3b48;border-radius:12px;padding:12px;z-index:99997;min-width:190px;box-shadow:0 8px 24px rgba(0,0,0,.5);flex-direction:column;gap:6px;';

  var title = document.createElement('div');
  title.style.cssText = 'font-size:11px;color:#8ea3b0;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;';
  title.textContent = '🎨 Тема оформлення';
  panel.appendChild(title);

  Object.keys(THEMES).forEach(function(id) {
    var t = THEMES[id];
    var btn = document.createElement('button');
    btn.setAttribute('data-theme-id', id);
    btn.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;cursor:pointer;font-size:12px;text-align:left;width:100%;border:1px solid #2a3b48;background:transparent;color:#8ea3b0;transition:all .15s;';

    var dot = document.createElement('span');
    dot.style.cssText = 'width:14px;height:14px;border-radius:50%;background:' + t.accent + ';flex-shrink:0;display:inline-block;';

    var lbl = document.createElement('span');
    lbl.textContent = t.name;

    btn.appendChild(dot);
    btn.appendChild(lbl);

    btn.addEventListener('click', function() {
      applyTheme(id);
    });

    panel.appendChild(btn);
  });

  document.body.appendChild(panel);

  /* Закрити при кліку поза панеллю */
  document.addEventListener('click', function(e) {
    var fab = document.getElementById('mt-theme-fab');
    if (panel.style.display === 'flex' &&
        !panel.contains(e.target) &&
        e.target !== fab) {
      panel.style.display = 'none';
    }
  });
}

function createFab() {
  if (document.getElementById('mt-theme-fab')) return;

  var fab = document.createElement('button');
  fab.id = 'mt-theme-fab';
  fab.title = 'Тема оформлення';
  fab.style.cssText = 'position:fixed;bottom:16px;right:64px;background:#16212c;border:1px solid #2a3b48;color:#5fd0a5;border-radius:20px;padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer;z-index:9990;box-shadow:0 4px 12px rgba(0,0,0,.4);transition:all .2s;';
  fab.textContent = '🎨 Тема';

  fab.addEventListener('mouseenter', function() { fab.style.transform = 'scale(1.05)'; });
  fab.addEventListener('mouseleave', function() { fab.style.transform = ''; });

  fab.addEventListener('click', function(e) {
    e.stopPropagation();
    var panel = document.getElementById('mt-theme-panel');
    if (!panel) return;
    panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
  });

  document.body.appendChild(fab);
}

function addThemeBtnToBar() {
  if (document.getElementById('btn-theme')) return;

  var btn = document.createElement('button');
  btn.id = 'btn-theme';
  btn.className = 'sec';
  btn.textContent = '🎨 Тема';
  btn.style.cursor = 'pointer';

  btn.addEventListener('click', function() {
    var panel = document.getElementById('mt-theme-panel');
    if (!panel) return;
    panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
  });

  /* Шукаємо btnbar */
  var bars = document.querySelectorAll('.btnbar');
  if (bars.length > 0) {
    bars[0].appendChild(btn);
    console.log('[themes] btn-theme додано в .btnbar');
    return true;
  }
  return false;
}

function initThemes() {
  createPanel();
  createFab();

  /* Відновлюємо тему */
  var saved = localStorage.getItem('mt-theme') || 'dark';
  if (saved !== 'dark') applyTheme(saved);
  else applyTheme('dark');

  /* Додаємо кнопку — з retry */
  if (!addThemeBtnToBar()) {
    var tries = 0;
    var timer = setInterval(function() {
      tries++;
      if (addThemeBtnToBar() || tries > 20) clearInterval(timer);
    }, 200);
  }

  console.log('[themes] ready | saved:', saved);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThemes);
} else {
  initThemes();
}
"""

with open('themes.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print('themes.js перезаписано OK!')