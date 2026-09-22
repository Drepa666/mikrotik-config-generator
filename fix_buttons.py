# -*- coding: utf-8 -*-
import subprocess

with open('ai-agent/ai-agent-ui.js', 'r', encoding='utf-8') as f:
    ui = f.read()

# ── 1. Замінюємо блок після appendChild ──
old_bind = (
    "  /* Вішаємо listeners одразу після додавання в DOM */\n"
    "  var _closeBtn = document.getElementById('ai-close-btn');\n"
    "  var _minBtn   = document.getElementById('ai-minimize-btn');\n"
    "  var _zBtn     = document.getElementById('ai-zindex-btn');\n"
    "  if (_closeBtn) _closeBtn.onclick = function() { AIAgentUI.toggle(); };\n"
    "  if (_minBtn)   _minBtn.onclick   = function() { AIAgentUI.minimize(); };\n"
    "  if (_zBtn)     _zBtn.onclick     = function() { AIAgentUI.toggleZIndex(); };\n"
    "  console.log('[AIAgentUI] Buttons OK ✅');"
)

new_bind = (
    "  /* EVENT DELEGATION — не губляться при перерендері */\n"
    "  document.addEventListener('click', function(e) {\n"
    "    var t = e.target;\n"
    "    /* Шукаємо кнопку вгору по DOM */\n"
    "    while (t && t !== document.body) {\n"
    "      var id = t.id || '';\n"
    "      if (id === 'ai-close-btn') {\n"
    "        e.stopPropagation();\n"
    "        AIAgentUI.toggle();\n"
    "        return;\n"
    "      }\n"
    "      if (id === 'ai-minimize-btn') {\n"
    "        e.stopPropagation();\n"
    "        AIAgentUI.minimize();\n"
    "        return;\n"
    "      }\n"
    "      if (id === 'ai-zindex-btn') {\n"
    "        e.stopPropagation();\n"
    "        AIAgentUI.toggleZIndex();\n"
    "        return;\n"
    "      }\n"
    "      t = t.parentElement;\n"
    "    }\n"
    "  }, true); /* capture=true щоб перехопити до інших handlers */\n"
    "  console.log('[AIAgentUI] Event delegation OK ✅');"
)

if old_bind in ui:
    ui = ui.replace(old_bind, new_bind)
    print('OK: event delegation ✅')
else:
    print('WARN: старий bind не знайдено точно')
    idx = ui.find("'ai-close-btn'")
    print(repr(ui[max(0,idx-100):idx+200]))

# ── 2. Замінюємо minimize — згортає в правий нижній кут ──
old_minimize = (
    "AIAgentUI.minimize = function() {\n"
    "  var sidebar  = document.getElementById('ai-sidebar');\n"
    "  var minBtn   = document.getElementById('ai-minimize-btn');\n"
    "  if (!sidebar) return;\n"
    "\n"
    "  AIAgentUI._minimized = !AIAgentUI._minimized;\n"
    "\n"
    "  if (AIAgentUI._minimized) {\n"
    "    sidebar.style.height = '54px';\n"
    "    sidebar.style.overflow = 'hidden';\n"
    "    sidebar.style.resize = 'none';\n"
    "    if (minBtn) { minBtn.innerHTML = '🗖'; minBtn.title = 'Розгорнути'; }\n"
    "  } else {\n"
    "    sidebar.style.height = '85vh';\n"
    "    sidebar.style.overflow = 'hidden';\n"
    "    sidebar.style.resize = 'both';\n"
    "    if (minBtn) { minBtn.innerHTML = '🗕'; minBtn.title = 'Згорнути'; }\n"
    "  }\n"
    "}"
)

new_minimize = (
    "AIAgentUI.minimize = function() {\n"
    "  var sidebar = document.getElementById('ai-sidebar');\n"
    "  var minBtn  = document.getElementById('ai-minimize-btn');\n"
    "  if (!sidebar) return;\n\n"
    "  AIAgentUI._minimized = !AIAgentUI._minimized;\n\n"
    "  if (AIAgentUI._minimized) {\n"
    "    /* Зберігаємо поточну позицію */\n"
    "    AIAgentUI._savedPos = {\n"
    "      top:    sidebar.style.top,\n"
    "      left:   sidebar.style.left,\n"
    "      right:  sidebar.style.right,\n"
    "      bottom: sidebar.style.bottom,\n"
    "      height: sidebar.style.height,\n"
    "      width:  sidebar.style.width,\n"
    "    };\n"
    "    /* Переміщуємо в правий нижній кут */\n"
    "    sidebar.style.cssText += [\n"
    "      'transition:all 0.3s ease',\n"
    "      'top:auto',\n"
    "      'left:auto',\n"
    "      'right:20px',\n"
    "      'bottom:20px',\n"
    "      'height:54px',\n"
    "      'width:320px',\n"
    "      'overflow:hidden',\n"
    "      'resize:none',\n"
    "      'border-radius:14px',\n"
    "    ].join(';');\n"
    "    if (minBtn) { minBtn.innerHTML = '🗖'; minBtn.title = 'Розгорнути'; }\n"
    "  } else {\n"
    "    /* Відновлюємо позицію */\n"
    "    var p = AIAgentUI._savedPos || {};\n"
    "    sidebar.style.cssText += [\n"
    "      'transition:all 0.3s ease',\n"
    "      'top:'    + (p.top    || '80px'),\n"
    "      'left:'   + (p.left   || 'auto'),\n"
    "      'right:'  + (p.right  || '20px'),\n"
    "      'bottom:' + (p.bottom || 'auto'),\n"
    "      'height:' + (p.height || '85vh'),\n"
    "      'width:'  + (p.width  || '420px'),\n"
    "      'overflow:hidden',\n"
    "      'resize:both',\n"
    "    ].join(';');\n"
    "    if (minBtn) { minBtn.innerHTML = '🗕'; minBtn.title = 'Згорнути'; }\n"
    "  }\n"
    "}"
)

if old_minimize in ui:
    ui = ui.replace(old_minimize, new_minimize)
    print('OK: minimize з анімацією ✅')
else:
    print('WARN: minimize не знайдено')

# ── 3. Замінюємо toggle — чисте закриття/відкриття ──
old_toggle = (
    "AIAgentUI.toggle = function() {\n"
    "  var sidebar = document.getElementById('ai-sidebar');\n"
    "  var btn     = document.getElementById('ai-toggle-btn');\n"
    "  if (!sidebar) return;\n"
    "  AIAgentUI.state.isOpen = !AIAgentUI.state.isOpen;\n"
    "  sidebar.classList.toggle('open', AIAgentUI.state.isOpen);\n"
    "  if (btn) btn.classList.toggle('open', AIAgentUI.state.isOpen);\n"
    "  if (AIAgentUI.state.isOpen) {\n"
    "    /* Завжди піднімаємо на передній план при відкритті */\n"
    "    if (sidebar) {\n"
    "      sidebar.style.zIndex = '999999';\n"
    "      AIAgentUI._zHigh = true;\n"
    "      var zBtn = document.getElementById('ai-zindex-btn');\n"
    "      if (zBtn) zBtn.style.color = '#f0a840';\n"
    "    }\n"
    "    AIAgentUI.updateRouterBar();\n"
    "    AIAgentUI.initDrag();\n"
    "    setTimeout(function() {\n"
    "      var input = document.getElementById('ai-input');\n"
    "      if (input) input.focus();\n"
    "    }, 100);\n"
    "  }\n"
    "}"
)

new_toggle = (
    "AIAgentUI.toggle = function() {\n"
    "  var sidebar = document.getElementById('ai-sidebar');\n"
    "  var btn     = document.getElementById('ai-toggle-btn');\n"
    "  if (!sidebar) return;\n\n"
    "  AIAgentUI.state.isOpen = !AIAgentUI.state.isOpen;\n\n"
    "  if (AIAgentUI.state.isOpen) {\n"
    "    /* Відкриваємо */\n"
    "    sidebar.style.display = 'flex';\n"
    "    sidebar.style.opacity = '0';\n"
    "    sidebar.style.transform = 'translateY(20px)';\n"
    "    /* Скидаємо мінімізацію якщо була */\n"
    "    if (AIAgentUI._minimized) {\n"
    "      AIAgentUI._minimized = false;\n"
    "      sidebar.style.height = '85vh';\n"
    "      sidebar.style.width  = '420px';\n"
    "      sidebar.style.overflow = 'hidden';\n"
    "      var mb = document.getElementById('ai-minimize-btn');\n"
    "      if (mb) { mb.innerHTML = '🗕'; mb.title = 'Згорнути'; }\n"
    "    }\n"
    "    requestAnimationFrame(function() {\n"
    "      sidebar.style.transition = 'opacity 0.2s ease, transform 0.2s ease';\n"
    "      sidebar.style.opacity    = '1';\n"
    "      sidebar.style.transform  = 'translateY(0)';\n"
    "    });\n"
    "    sidebar.style.zIndex = '999999';\n"
    "    AIAgentUI._zHigh = true;\n"
    "    AIAgentUI.updateRouterBar();\n"
    "    AIAgentUI.initDrag();\n"
    "    setTimeout(function() {\n"
    "      var input = document.getElementById('ai-input');\n"
    "      if (input) input.focus();\n"
    "    }, 200);\n"
    "  } else {\n"
    "    /* Закриваємо з анімацією */\n"
    "    sidebar.style.transition = 'opacity 0.2s ease, transform 0.2s ease';\n"
    "    sidebar.style.opacity    = '0';\n"
    "    sidebar.style.transform  = 'translateY(20px)';\n"
    "    setTimeout(function() {\n"
    "      sidebar.style.display = 'none';\n"
    "      sidebar.style.transition = '';\n"
    "      sidebar.style.transform  = '';\n"
    "    }, 200);\n"
    "  }\n"
    "  if (btn) btn.classList.toggle('open', AIAgentUI.state.isOpen);\n"
    "}"
)

if old_toggle in ui:
    ui = ui.replace(old_toggle, new_toggle)
    print('OK: toggle з анімацією ✅')
else:
    print('WARN: toggle не знайдено точно')

# ── 4. Замінюємо initDrag — повноцінний drag & drop ──
idx_drag = ui.find('AIAgentUI.initDrag = function')
depth = 0; found = False; end_drag = idx_drag
for i, ch in enumerate(ui[idx_drag:], idx_drag):
    if ch == '{': depth += 1; found = True
    elif ch == '}': depth -= 1
    if found and depth == 0: end_drag = i + 1; break

print(f'\ninitDrag: {idx_drag}-{end_drag}')

NEW_DRAG = (
    "AIAgentUI.initDrag = function() {\n"
    "  var sidebar = document.getElementById('ai-sidebar');\n"
    "  var handle  = document.getElementById('ai-drag-handle');\n"
    "  if (!sidebar || !handle || handle._dragInit) return;\n"
    "  handle._dragInit = true;\n\n"
    "  var startX, startY, startL, startT;\n"
    "  var isDragging = false;\n\n"
    "  handle.style.cursor = 'grab';\n\n"
    "  handle.addEventListener('mousedown', function(e) {\n"
    "    /* Не перехоплюємо кліки на кнопках */\n"
    "    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;\n"
    "    isDragging = true;\n"
    "    handle.style.cursor = 'grabbing';\n"
    "    var rect = sidebar.getBoundingClientRect();\n"
    "    startX = e.clientX;\n"
    "    startY = e.clientY;\n"
    "    startL = rect.left;\n"
    "    startT = rect.top;\n"
    "    /* Переводимо в абсолютне позиціонування */\n"
    "    sidebar.style.right  = 'auto';\n"
    "    sidebar.style.bottom = 'auto';\n"
    "    sidebar.style.left   = startL + 'px';\n"
    "    sidebar.style.top    = startT + 'px';\n"
    "    sidebar.style.margin = '0';\n"
    "    sidebar.style.transition = 'none';\n"
    "    e.preventDefault();\n"
    "  });\n\n"
    "  document.addEventListener('mousemove', function(e) {\n"
    "    if (!isDragging) return;\n"
    "    var dx = e.clientX - startX;\n"
    "    var dy = e.clientY - startY;\n"
    "    var newL = startL + dx;\n"
    "    var newT = startT + dy;\n"
    "    /* Не виходимо за межі екрану */\n"
    "    var maxL = window.innerWidth  - sidebar.offsetWidth;\n"
    "    var maxT = window.innerHeight - sidebar.offsetHeight;\n"
    "    newL = Math.max(0, Math.min(newL, maxL));\n"
    "    newT = Math.max(0, Math.min(newT, maxT));\n"
    "    sidebar.style.left = newL + 'px';\n"
    "    sidebar.style.top  = newT + 'px';\n"
    "  });\n\n"
    "  document.addEventListener('mouseup', function() {\n"
    "    if (isDragging) {\n"
    "      isDragging = false;\n"
    "      handle.style.cursor = 'grab';\n"
    "    }\n"
    "  });\n"
    "}"
)

if idx_drag > 0:
    ui = ui[:idx_drag] + NEW_DRAG + ui[end_drag:]
    print('OK: initDrag повноцінний ✅')
else:
    print('WARN: initDrag не знайдено — додаємо')
    ui += '\n\n' + NEW_DRAG

with open('ai-agent/ai-agent-ui.js', 'w', encoding='utf-8') as f:
    f.write(ui)

r = subprocess.run(['node', '--check', 'ai-agent/ai-agent-ui.js'],
                   capture_output=True, text=True)
print('ui:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:200])

print('\nВсе готово! npm start')