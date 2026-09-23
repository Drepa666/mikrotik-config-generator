# -*- coding: utf-8 -*-
import subprocess, tempfile, os

SHORTCUTS = r"""'use strict';
/* ═══════════════════════════════════════════════════════
   rm-shortcuts.js — Keyboard shortcuts help panel
   Ctrl+? або натиснути кнопку ? — відкрити панель
   ═══════════════════════════════════════════════════════ */

window.RMShortcuts = (function() {

  var SHORTCUTS = [
    {
      section: 'Router Manager',
      icon: '&#128187;',
      items: [
        { keys: ['F9'],           desc: 'Safe Mode — увімкнути / вимкнути' },
        { keys: ['Ctrl', 'R'],    desc: 'Оновити поточний розділ' },
        { keys: ['Ctrl', 'F'],    desc: 'Пошук по таблиці' },
        { keys: ['Ctrl', '?'],    desc: 'Показати цю панель' },
        { keys: ['Esc'],          desc: 'Закрити діалог / скинути вибір' },
      ]
    },
    {
      section: 'Таблиці (DataGrid)',
      icon: '&#128203;',
      items: [
        { keys: ['Click'],            desc: 'Вибрати рядок' },
        { keys: ['Ctrl', 'Click'],    desc: 'Додати до вибору' },
        { keys: ['Shift', 'Click'],   desc: 'Вибрати діапазон' },
        { keys: ['Ctrl', 'A'],        desc: 'Вибрати всі рядки' },
        { keys: ['&#8593;&#8595;'],   desc: 'Навігація по рядках' },
        { keys: ['Esc'],              desc: 'Скинути вибір' },
        { keys: ['RMB'],              desc: 'Контекстне меню' },
        { keys: ['Drag'],             desc: 'Перетягнути рядок (зміна порядку)' },
        { keys: ['Drag header'],      desc: 'Змінити ширину колонки' },
        { keys: ['Click header'],     desc: 'Сортування &#9650;&#9660;' },
      ]
    },
    {
      section: 'Safe Mode',
      icon: '&#9888;',
      items: [
        { keys: ['F9'],           desc: 'Увімкнути Safe Mode (знімок конфігу)' },
        { keys: ['Confirm'],      desc: 'Зберегти зміни і вийти з Safe Mode' },
        { keys: ['Revert'],       desc: 'Відкотити всі зміни' },
        { keys: ['60s'],          desc: 'Автовідкат якщо не підтверджено' },
      ]
    },
    {
      section: 'Firewall',
      icon: '&#128293;',
      items: [
        { keys: ['Drag row'],     desc: 'Змінити порядок правил' },
        { keys: ['&#9646;&#9646; Disable'], desc: 'Вимкнути правило' },
        { keys: ['&#9654; Enable'],  desc: 'Увімкнути правило' },
        { keys: ['Bulk select'],  desc: 'Enable/Disable/Delete кількох правил' },
      ]
    },
    {
      section: 'Terminal (SSH)',
      icon: '&#128187;',
      items: [
        { keys: ['Tab'],          desc: 'Автодоповнення команди' },
        { keys: ['&#8593;&#8595;'], desc: 'Історія команд' },
        { keys: ['Ctrl', 'C'],    desc: 'Перервати команду' },
        { keys: ['Ctrl', 'L'],    desc: 'Очистити термінал' },
      ]
    },
    {
      section: 'Глобально',
      icon: '&#127758;',
      items: [
        { keys: ['Ctrl', 'S'],    desc: 'Зберегти поточну форму' },
        { keys: ['Ctrl', 'N'],    desc: 'Додати новий запис' },
        { keys: ['Del'],          desc: 'Видалити вибрані рядки' },
        { keys: ['F5'],           desc: 'Перезавантажити сторінку' },
      ]
    },
  ];

  /* ── CSS ── */
  function injectCSS() {
    if (document.getElementById('sc-css')) return;
    var s = document.createElement('style');
    s.id = 'sc-css';
    s.textContent = [
      /* Overlay */
      '#sc-overlay {',
      '  display:none; position:fixed; inset:0; z-index:999998;',
      '  background:rgba(0,0,0,.7); backdrop-filter:blur(4px);',
      '  align-items:center; justify-content:center;',
      '}',
      '#sc-overlay.sc-visible { display:flex; }',
      /* Panel */
      '#sc-panel {',
      '  background:#0d1117; border:1px solid #2a3b48;',
      '  border-radius:16px; padding:0; width:820px; max-width:95vw;',
      '  max-height:85vh; overflow:hidden; display:flex; flex-direction:column;',
      '  box-shadow:0 20px 60px rgba(0,0,0,.8);',
      '}',
      /* Header */
      '#sc-header {',
      '  display:flex; align-items:center; gap:12px;',
      '  padding:16px 20px; border-bottom:1px solid #1c2a37;',
      '  background:#060d14;',
      '}',
      '#sc-title {',
      '  flex:1; color:#c9d8e4; font-size:16px; font-weight:700;',
      '}',
      '#sc-close {',
      '  background:transparent; border:1px solid #2a3b48;',
      '  color:#4a6070; border-radius:6px; padding:4px 10px;',
      '  cursor:pointer; font-size:14px;',
      '}',
      '#sc-close:hover { color:#c9d8e4; border-color:#4a6070; }',
      /* Search */
      '#sc-search-wrap {',
      '  padding:12px 20px; border-bottom:1px solid #1c2a37;',
      '}',
      '#sc-search {',
      '  width:100%; background:#060d14; border:1px solid #1c2a37;',
      '  color:#c9d8e4; border-radius:8px; padding:8px 14px;',
      '  font-size:13px; outline:none; box-sizing:border-box;',
      '}',
      '#sc-search:focus { border-color:#3a5a78; }',
      /* Body */
      '#sc-body {',
      '  overflow-y:auto; padding:16px 20px; flex:1;',
      '  display:grid; grid-template-columns:1fr 1fr; gap:16px;',
      '}',
      /* Section */
      '.sc-section {',
      '  background:#060d14; border:1px solid #1c2a37;',
      '  border-radius:10px; padding:14px;',
      '}',
      '.sc-section-title {',
      '  color:#8ea3b0; font-size:11px; font-weight:700;',
      '  text-transform:uppercase; letter-spacing:.08em;',
      '  margin-bottom:10px; display:flex; align-items:center; gap:6px;',
      '}',
      /* Row */
      '.sc-row {',
      '  display:flex; align-items:center; justify-content:space-between;',
      '  padding:5px 0; border-bottom:1px solid #0d1a28;',
      '}',
      '.sc-row:last-child { border-bottom:none; }',
      '.sc-desc { color:#8ea3b0; font-size:12px; flex:1; }',
      '.sc-desc.sc-match { color:#c9d8e4; }',
      /* Keys */
      '.sc-keys { display:flex; gap:4px; align-items:center; flex-shrink:0; }',
      '.sc-key {',
      '  background:#0d1a28; border:1px solid #2a3b48;',
      '  border-bottom:2px solid #1c3a54; border-radius:5px;',
      '  padding:2px 7px; font-size:11px; font-family:monospace;',
      '  color:#5fd0a5; white-space:nowrap;',
      '}',
      '.sc-plus { color:#4a6070; font-size:10px; }',
      /* Footer */
      '#sc-footer {',
      '  padding:10px 20px; border-top:1px solid #1c2a37;',
      '  text-align:center; color:#4a6070; font-size:11px;',
      '  background:#060d14;',
      '}',
      /* Trigger button */
      '#sc-trigger {',
      '  position:fixed; bottom:16px; right:60px; z-index:9990;',
      '  width:36px; height:36px; border-radius:50%;',
      '  background:#0d1117; border:1px solid #2a3b48;',
      '  color:#4a6070; cursor:pointer; font-size:16px;',
      '  display:flex; align-items:center; justify-content:center;',
      '  transition:all .2s;',
      '}',
      '#sc-trigger:hover {',
      '  border-color:#5fd0a5; color:#5fd0a5;',
      '  box-shadow:0 0 12px rgba(95,208,165,.2);',
      '}',
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ── Build key badge ── */
  function renderKey(k) {
    return '<span class="sc-key">' + k + '</span>';
  }

  function renderKeys(keys) {
    return '<div class="sc-keys">' +
      keys.map(function(k, i) {
        return (i > 0 ? '<span class="sc-plus">+</span>' : '') + renderKey(k);
      }).join('') +
    '</div>';
  }

  /* ── Build panel HTML ── */
  function buildHTML(filter) {
    var lo = (filter || '').toLowerCase();
    var html = '';

    SHORTCUTS.forEach(function(section) {
      var items = section.items.filter(function(item) {
        if (!lo) return true;
        return item.desc.toLowerCase().includes(lo) ||
               item.keys.join(' ').toLowerCase().includes(lo);
      });
      if (!items.length) return;

      html += '<div class="sc-section">';
      html += '<div class="sc-section-title">' +
              section.icon + ' ' + section.section + '</div>';

      items.forEach(function(item) {
        var matched = lo && (
          item.desc.toLowerCase().includes(lo) ||
          item.keys.join(' ').toLowerCase().includes(lo)
        );
        html += '<div class="sc-row">' +
          '<span class="sc-desc' + (matched ? ' sc-match' : '') + '">' +
          item.desc + '</span>' +
          renderKeys(item.keys) +
          '</div>';
      });

      html += '</div>';
    });

    return html;
  }

  /* ── Build UI ── */
  function buildUI() {
    if (document.getElementById('sc-overlay')) return;

    /* Overlay */
    var overlay = document.createElement('div');
    overlay.id = 'sc-overlay';
    overlay.innerHTML =
      '<div id="sc-panel">' +
        '<div id="sc-header">' +
          '<span style="font-size:20px;">&#9875;</span>' +
          '<span id="sc-title">Keyboard Shortcuts</span>' +
          '<input id="sc-search" placeholder="&#128269; Search shortcuts..." autocomplete="off">' +
          '<button id="sc-close">&#10005;</button>' +
        '</div>' +
        '<div id="sc-body">' + buildHTML('') + '</div>' +
        '<div id="sc-footer">' +
          'Press <span class="sc-key">Ctrl</span>+<span class="sc-key">?</span> to open &nbsp;|&nbsp; ' +
          'Press <span class="sc-key">Esc</span> to close' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    /* Trigger button */
    var trigger = document.createElement('button');
    trigger.id = 'sc-trigger';
    trigger.title = 'Keyboard Shortcuts (Ctrl+?)';
    trigger.innerHTML = '?';
    document.body.appendChild(trigger);

    /* Events */
    trigger.onclick = open;
    document.getElementById('sc-close').onclick = close;

    /* Click outside */
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) close();
    });

    /* Search */
    var searchEl = document.getElementById('sc-search');
    searchEl.addEventListener('input', function() {
      var body = document.getElementById('sc-body');
      if (body) body.innerHTML = buildHTML(searchEl.value);
    });

    /* Move search to header */
    var header = document.getElementById('sc-header');
    if (header && searchEl.parentNode !== header) {
      header.insertBefore(searchEl, document.getElementById('sc-close'));
    }
  }

  /* ── Open / Close ── */
  function open() {
    var overlay = document.getElementById('sc-overlay');
    if (!overlay) buildUI();
    overlay = document.getElementById('sc-overlay');
    if (overlay) {
      overlay.classList.add('sc-visible');
      var s = document.getElementById('sc-search');
      if (s) { s.value = ''; s.focus(); }
      var body = document.getElementById('sc-body');
      if (body) body.innerHTML = buildHTML('');
    }
  }

  function close() {
    var overlay = document.getElementById('sc-overlay');
    if (overlay) overlay.classList.remove('sc-visible');
  }

  /* ── Keyboard ── */
  function initKeyboard() {
    document.addEventListener('keydown', function(e) {
      /* Ctrl+? або Ctrl+Shift+/ */
      if ((e.ctrlKey || e.metaKey) && (e.key === '?' || e.key === '/')) {
        e.preventDefault();
        var overlay = document.getElementById('sc-overlay');
        if (overlay && overlay.classList.contains('sc-visible')) {
          close();
        } else {
          open();
        }
        return;
      }
      /* Esc */
      if (e.key === 'Escape') {
        var overlay2 = document.getElementById('sc-overlay');
        if (overlay2 && overlay2.classList.contains('sc-visible')) {
          close();
        }
      }
    });
  }

  /* ── Add shortcut dynamically ── */
  function addShortcut(section, keys, desc) {
    var sec = SHORTCUTS.find(function(s) { return s.section === section; });
    if (!sec) {
      sec = { section: section, icon: '&#128279;', items: [] };
      SHORTCUTS.push(sec);
    }
    sec.items.push({ keys: keys, desc: desc });
  }

  /* ── Init ── */
  function init() {
    injectCSS();
    buildUI();
    initKeyboard();
    console.log('[Shortcuts] ready — Ctrl+? to open');
  }

  return { init: init, open: open, close: close, addShortcut: addShortcut };

})();

/* Auto-init */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { window.RMShortcuts.init(); });
} else {
  window.RMShortcuts.init();
}

console.log('[Shortcuts] rm-shortcuts.js loaded');
"""

# ════ Tempfile ════
with tempfile.NamedTemporaryFile(
        suffix='.js', delete=False, mode='w', encoding='utf-8') as tmp:
    tmp.write(SHORTCUTS)
    tmp_name = tmp.name

r = subprocess.run(['node','--check', tmp_name], capture_output=True, text=True)
os.unlink(tmp_name)
if r.returncode != 0:
    print('SYNTAX ERROR!\n' + r.stderr[:500])
    exit(1)
print('Tempfile: OK')

# ════ Записуємо ════
with open('rm-shortcuts.js', 'w', encoding='utf-8') as f:
    f.write(SHORTCUTS)

size = os.path.getsize('rm-shortcuts.js')
r2 = subprocess.run(['node','--check','rm-shortcuts.js'], capture_output=True, text=True)
print(f'rm-shortcuts.js: {"OK" if r2.returncode==0 else "FAIL"} ({size:,}b)')
if r2.returncode != 0:
    print(r2.stderr[:200])
    exit(1)

# ════ index.html ════
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

TARGET = '<script src="rm-safemode.js"></script>'
INSERT = '<script src="rm-shortcuts.js"></script>\n    ' + TARGET

if 'rm-shortcuts.js' in html:
    print('OK: вже є в index.html')
elif TARGET in html:
    html = html.replace(TARGET, INSERT, 1)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print('OK: rm-shortcuts.js додано в index.html')

# ════ Git ════
subprocess.run(['git','add','rm-shortcuts.js','index.html'], capture_output=True)
subprocess.run(['git','commit','-m',
    'feat: rm-shortcuts.js - keyboard shortcuts panel, Ctrl+?, search, F9/DataGrid/Firewall'],
    capture_output=True)
rp = subprocess.run(['git','push','origin','main'], capture_output=True, text=True)
print('push:', rp.stdout.strip() or rp.stderr.strip()[-60:])
print('\nDone! npm start')