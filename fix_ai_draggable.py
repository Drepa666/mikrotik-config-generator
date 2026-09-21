# -*- coding: utf-8 -*-
import subprocess

with open('ai-agent/ai-agent-ui.js', 'r', encoding='utf-8') as f:
    ui = f.read()

# ── Замінюємо стиль sidebar на draggable ──
old_style = """    #ai-sidebar {
      position: fixed;
      top: 0; right: -420px;
      width: 420px; height: 100vh;
      background: #0a0f1a;
      border-left: 1px solid #1a2a3a;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      transition: right .3s cubic-bezier(.4,0,.2,1);
      box-shadow: -4px 0 24px rgba(0,0,0,.5);
    }
    #ai-sidebar.open { right: 0; }"""

new_style = """    #ai-sidebar {
      position: fixed;
      top: 60px; right: 20px;
      width: 420px; height: 85vh;
      background: #0a0f1a;
      border: 1px solid #1a2a3a;
      border-radius: 12px;
      z-index: 9999;
      display: none;
      flex-direction: column;
      box-shadow: 0 8px 40px rgba(0,0,0,.7);
      resize: both;
      overflow: hidden;
      min-width: 320px;
      min-height: 400px;
    }
    #ai-sidebar.open { display: flex; }
    #ai-drag-handle {
      cursor: move;
      user-select: none;
      -webkit-user-select: none;
    }"""

if old_style in ui:
    ui = ui.replace(old_style, new_style)
    print('OK: стиль sidebar ✅')
else:
    print('ERR: стиль не знайдено')
    idx = ui.find('#ai-sidebar {')
    print(repr(ui[idx:idx+200]))

# ── Додаємо id="ai-drag-handle" до header ──
old_header = """'<div style="display:flex;align-items:center;gap:10px;padding:14px 16px;',
      'border-bottom:1px solid #1a2a38;background:#080f17;flex-shrink:0;">',"""

new_header = """'<div id="ai-drag-handle" style="display:flex;align-items:center;gap:10px;padding:14px 16px;',
      'border-bottom:1px solid #1a2a38;background:#080f17;flex-shrink:0;border-radius:12px 12px 0 0;">',"""

if old_header in ui:
    ui = ui.replace(old_header, new_header)
    print('OK: drag handle ✅')
else:
    print('ERR: header не знайдено')

# ── Додаємо кнопку z-index ──
old_close_btn = """        '<button onclick="window.AIAgentUI.toggle()" title="Закрити"',
          ' style="background:transparent;border:1px solid #2a3b48;color:#4a6070;',
          'border-radius:6px;padding:4px 8px;cursor:pointer;font-size:14px;">✕</button>',"""

new_close_btn = """        '<button onclick="window.AIAgentUI.toggleZIndex()" title="Перший/Другий план" id="ai-zindex-btn"',
          ' style="background:transparent;border:1px solid #2a3b48;color:#4a6070;',
          'border-radius:6px;padding:4px 8px;cursor:pointer;font-size:12px;">📌</button>',
        '<button onclick="window.AIAgentUI.toggle()" title="Закрити"',
          ' style="background:transparent;border:1px solid #2a3b48;color:#4a6070;',
          'border-radius:6px;padding:4px 8px;cursor:pointer;font-size:14px;">✕</button>',"""

if old_close_btn in ui:
    ui = ui.replace(old_close_btn, new_close_btn)
    print('OK: кнопка z-index ✅')

# ── Замінюємо toggle ──
old_toggle = """AIAgentUI.toggle = function() {
  var sidebar = document.getElementById('ai-sidebar');
  var btn     = document.getElementById('ai-toggle-btn');
  if (!sidebar) return;
  AIAgentUI.state.isOpen = !AIAgentUI.state.isOpen;
  sidebar.classList.toggle('open', AIAgentUI.state.isOpen);
  if (btn) btn.classList.toggle('open', AIAgentUI.state.isOpen);
  if (AIAgentUI.state.isOpen) {
    AIAgentUI.updateRouterBar();
    setTimeout(function() {
      var input = document.getElementById('ai-input');
      if (input) input.focus();
    }, 300);
  }
};"""

new_toggle = """AIAgentUI.toggle = function() {
  var sidebar = document.getElementById('ai-sidebar');
  var btn     = document.getElementById('ai-toggle-btn');
  if (!sidebar) return;
  AIAgentUI.state.isOpen = !AIAgentUI.state.isOpen;
  sidebar.classList.toggle('open', AIAgentUI.state.isOpen);
  if (btn) btn.classList.toggle('open', AIAgentUI.state.isOpen);
  if (AIAgentUI.state.isOpen) {
    AIAgentUI.updateRouterBar();
    AIAgentUI.initDrag();
    setTimeout(function() {
      var input = document.getElementById('ai-input');
      if (input) input.focus();
    }, 100);
  }
};

/* ── Z-index перемикач ── */
AIAgentUI._zHigh = true;
AIAgentUI.toggleZIndex = function() {
  var sidebar = document.getElementById('ai-sidebar');
  var btn     = document.getElementById('ai-zindex-btn');
  if (!sidebar) return;
  AIAgentUI._zHigh = !AIAgentUI._zHigh;
  sidebar.style.zIndex = AIAgentUI._zHigh ? '9999' : '100';
  if (btn) {
    btn.style.color = AIAgentUI._zHigh ? '#f0a840' : '#4a6070';
    btn.title = AIAgentUI._zHigh ? 'Відправити на задній план' : 'Підняти на передній план';
  }
};

/* ── Drag ── */
AIAgentUI.initDrag = function() {
  var sidebar = document.getElementById('ai-sidebar');
  var handle  = document.getElementById('ai-drag-handle');
  if (!sidebar || !handle || handle._dragInit) return;
  handle._dragInit = true;

  var startX, startY, startLeft, startTop;

  handle.addEventListener('mousedown', function(e) {
    if (e.target.tagName === 'BUTTON') return;
    e.preventDefault();
    var rect   = sidebar.getBoundingClientRect();
    startX     = e.clientX;
    startY     = e.clientY;
    startLeft  = rect.left;
    startTop   = rect.top;

    /* Переводимо з right в left */
    sidebar.style.right  = 'auto';
    sidebar.style.left   = startLeft + 'px';
    sidebar.style.top    = startTop  + 'px';

    function onMove(e) {
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      var newLeft = Math.max(0, Math.min(window.innerWidth  - sidebar.offsetWidth,  startLeft + dx));
      var newTop  = Math.max(0, Math.min(window.innerHeight - sidebar.offsetHeight, startTop  + dy));
      sidebar.style.left = newLeft + 'px';
      sidebar.style.top  = newTop  + 'px';
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
      /* Зберігаємо позицію */
      localStorage.setItem('ai-sidebar-pos', JSON.stringify({
        left: sidebar.style.left,
        top:  sidebar.style.top
      }));
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });

  /* Відновлюємо позицію */
  try {
    var pos = JSON.parse(localStorage.getItem('ai-sidebar-pos') || '{}');
    if (pos.left && pos.top) {
      sidebar.style.right = 'auto';
      sidebar.style.left  = pos.left;
      sidebar.style.top   = pos.top;
    }
  } catch(e) {}
};"""

if old_toggle in ui:
    ui = ui.replace(old_toggle, new_toggle)
    print('OK: toggle + drag + zindex ✅')
else:
    print('ERR: toggle не знайдено')

with open('ai-agent/ai-agent-ui.js', 'w', encoding='utf-8') as f:
    f.write(ui)

r = subprocess.run(['node', '--check', 'ai-agent/ai-agent-ui.js'],
                   capture_output=True, text=True)
print('Синтаксис:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:200])