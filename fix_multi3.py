# -*- coding: utf-8 -*-
import subprocess

# ════════════════════════════════════
# 1. Додаємо _getAllRouters в router-manager.js
# ════════════════════════════════════
with open('router-manager.js', 'r', encoding='utf-8') as f:
    rm = f.read()

old_rm_export = (
    "window.RouterManager = {\n"
    "    open:      openManager,\n"
    "    close:     closeManager,\n"
    "    addRouter: addRouter,\n"
    "    _state:    state,\n"
    "    _getActiveRouter: function() {\n"
    "      return state.routers.find(function(r) { return r.id === state.activeRouter; }) || null;\n"
    "    },\n"
    "  };"
)

new_rm_export = (
    "window.RouterManager = {\n"
    "    open:      openManager,\n"
    "    close:     closeManager,\n"
    "    addRouter: addRouter,\n"
    "    _state:    state,\n"
    "    /* Повертає активний роутер */\n"
    "    _getActiveRouter: function() {\n"
    "      return state.routers.find(function(r) { return r.id === state.activeRouter; }) || null;\n"
    "    },\n"
    "    /* Повертає ВСІ роутери */\n"
    "    _getAllRouters: function() {\n"
    "      return state.routers || [];\n"
    "    },\n"
    "    /* Повертає кількість роутерів */\n"
    "    _getCount: function() {\n"
    "      return (state.routers || []).length;\n"
    "    },\n"
    "  };"
)

if old_rm_export in rm:
    rm = rm.replace(old_rm_export, new_rm_export)
    print('OK: _getAllRouters додано в RouterManager ✅')
else:
    print('WARN: не знайдено точно')
    idx = rm.find('window.RouterManager =')
    print(repr(rm[idx:idx+300]))

with open('router-manager.js', 'w', encoding='utf-8') as f:
    f.write(rm)

r = subprocess.run(['node','--check','router-manager.js'],
                   capture_output=True, text=True)
print('router-manager:', 'OK ✅' if r.returncode==0 else '❌\n'+r.stderr[:200])

# ════════════════════════════════════
# 2. Виправляємо showMultiRouter в terminal-log.js
# ════════════════════════════════════
with open('ai-agent/terminal-log.js', 'r', encoding='utf-8') as f:
    tl = f.read()

# Знаходимо showMultiRouter повністю
idx = tl.find('showMultiRouter: function()')
depth = 0; found = False; end = idx
for i, ch in enumerate(tl[idx:], idx):
    if ch == '{': depth += 1; found = True
    elif ch == '}': depth -= 1
    if found and depth == 0: end = i + 1; break

NEW_SHOW_MULTI = (
    "showMultiRouter: function() {\n"
    "    var old = document.getElementById('termlog-multi-panel');\n"
    "    if (old) { old.remove(); return; }\n\n"

    "    /* ── Отримуємо роутери через _getAllRouters ── */\n"
    "    var routers = [];\n"
    "    try {\n"
    "      /* 1. Найкращий спосіб — через closure метод */\n"
    "      if (window.RouterManager && RouterManager._getAllRouters) {\n"
    "        routers = RouterManager._getAllRouters();\n"
    "        console.log('[MultiRouter] _getAllRouters:', routers.length);\n"
    "      }\n"
    "      /* 2. Якщо порожньо — активний роутер */\n"
    "      if (routers.length === 0 && window.RouterManager && RouterManager._getActiveRouter) {\n"
    "        var ar = RouterManager._getActiveRouter();\n"
    "        if (ar) routers = [ar];\n"
    "        console.log('[MultiRouter] _getActiveRouter:', ar && ar.ip);\n"
    "      }\n"
    "      /* 3. Fallback — window.getActiveRouter */\n"
    "      if (routers.length === 0 && window.getActiveRouter) {\n"
    "        var ar2 = window.getActiveRouter();\n"
    "        if (ar2) routers = [ar2];\n"
    "        console.log('[MultiRouter] getActiveRouter:', ar2 && ar2.ip);\n"
    "      }\n"
    "    } catch(e) {\n"
    "      console.error('[MultiRouter] error:', e);\n"
    "    }\n\n"

    "    if (routers.length === 0) {\n"
    "      TermLog.log('error', 'Немає роутерів. Підключіться до роутера в Router Manager');\n"
    "      return;\n"
    "    }\n"
    "    console.log('[MultiRouter] Знайдено роутерів:', routers.length,\n"
    "      routers.map(function(r){return r.ip;}));\n\n"

    "    /* ── Завантажуємо збережені групи ── */\n"
    "    var groups = {};\n"
    "    try { groups = JSON.parse(localStorage.getItem('mr-groups') || '{}'); } catch(e) {}\n\n"

    "    /* ── HTML чекбоксів ── */\n"
    "    var checkboxes = routers.map(function(r) {\n"
    "      return '<label style=\"display:flex;align-items:center;gap:8px;padding:4px 0;'+\n"
    "        'color:#c9d8e4;font-size:12px;cursor:pointer;\">'+\n"
    "        '<input type=\"checkbox\" class=\"mr-check\"'+\n"
    "          ' data-id=\"' + (r.id||r.ip) + '\"'+\n"
    "          ' data-ip=\"' + r.ip + '\"'+\n"
    "          ' checked style=\"accent-color:#5fd0a5;\">'+\n"
    "        '<span style=\"color:#5fd0a5;\">◉</span> '+\n"
    "        (r.name||r.ip) +\n"
    "        ' <span style=\"color:#4a6070;font-size:10px;\">' + r.ip + '</span>'+\n"
    "        '</label>';\n"
    "    }).join('');\n\n"

    "    /* ── Кнопки груп ── */\n"
    "    var groupBtns = Object.keys(groups).map(function(gname) {\n"
    "      return '<button class=\"mr-group-btn\" data-group=\"' + gname + '\"'+\n"
    "        ' style=\"background:#1a1a2a;border:1px solid #3a2a5a;color:#c084fc;'+\n"
    "        'border-radius:5px;padding:2px 8px;cursor:pointer;font-size:11px;\">'+\n"
    "        '📁 ' + gname + ' (' + (groups[gname]||[]).length + ')</button>';\n"
    "    }).join(' ');\n\n"

    "    /* ── Панель ── */\n"
    "    var panel = document.createElement('div');\n"
    "    panel.id = 'termlog-multi-panel';\n"
    "    panel.style.cssText = [\n"
    "      'position:absolute', 'bottom:100%', 'right:0',\n"
    "      'background:#0d1117', 'border:1px solid #2a3b48',\n"
    "      'border-radius:8px 8px 0 0', 'padding:12px 16px',\n"
    "      'min-width:320px', 'max-width:420px', 'z-index:999999',\n"
    "      'box-shadow:0 -4px 20px rgba(0,0,0,.5)',\n"
    "    ].join(';');\n\n"

    "    panel.innerHTML =\n"
    "      '<div style=\"color:#90c060;font-weight:700;margin-bottom:8px;\">'+\n"
    "        '🔀 Multi-Router — ' + routers.length + ' роутерів'+\n"
    "      '</div>'+\n"
    "      (Object.keys(groups).length > 0\n"
    "        ? '<div style=\"margin-bottom:8px;display:flex;flex-wrap:wrap;gap:4px;\">'+\n"
    "            '<span style=\"color:#4a6070;font-size:11px;\">Групи: </span>' + groupBtns +\n"
    "          '</div>'\n"
    "        : '') +\n"
    "      '<div id=\"mr-router-list\" style=\"max-height:200px;overflow-y:auto;margin-bottom:8px;\">'+\n"
    "        checkboxes +\n"
    "      '</div>'+\n"
    "      '<div style=\"display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;\">'+\n"
    "        '<button id=\"mr-select-all\" style=\"background:transparent;border:1px solid #2a3b48;'+\n"
    "          'color:#4a6070;border-radius:5px;padding:2px 8px;cursor:pointer;font-size:11px;\">✓ Всі</button>'+\n"
    "        '<button id=\"mr-select-none\" style=\"background:transparent;border:1px solid #2a3b48;'+\n"
    "          'color:#4a6070;border-radius:5px;padding:2px 8px;cursor:pointer;font-size:11px;\">✗ Жодного</button>'+\n"
    "        '<button id=\"mr-save-group\" style=\"background:#1a1a2a;border:1px solid #3a2a5a;'+\n"
    "          'color:#c084fc;border-radius:5px;padding:2px 8px;cursor:pointer;font-size:11px;\">💾 Зберегти групу</button>'+\n"
    "      '</div>'+\n"
    "      '<div style=\"display:flex;gap:8px;\">'+\n"
    "        '<button id=\"mr-run-all\" style=\"background:#1a3a1a;border:1px solid #3a6a2a;'+\n"
    "          'color:#90c060;border-radius:6px;padding:5px 14px;cursor:pointer;font-size:12px;flex:1;\">'+\n"
    "          '▶ Виконати на вибраних</button>'+\n"
    "        '<button id=\"mr-cancel\" style=\"background:transparent;border:1px solid #2a3b48;'+\n"
    "          'color:#4a6070;border-radius:6px;padding:5px 10px;cursor:pointer;font-size:12px;\">✕</button>'+\n"
    "      '</div>';\n\n"

    "    var bar = document.getElementById('termlog-input-bar');\n"
    "    if (bar) { bar.style.position='relative'; bar.appendChild(panel); }\n\n"

    "    /* ── Хелпери ── */\n"
    "    function getChecked() {\n"
    "      var checks = panel.querySelectorAll('.mr-check:checked');\n"
    "      var ids = Array.from(checks).map(function(c){return c.dataset.id;});\n"
    "      return routers.filter(function(r){return ids.indexOf(r.id||r.ip)>=0;});\n"
    "    }\n\n"

    "    /* Кнопки вибору */\n"
    "    document.getElementById('mr-select-all').onclick = function() {\n"
    "      panel.querySelectorAll('.mr-check').forEach(function(c){c.checked=true;});\n"
    "    };\n"
    "    document.getElementById('mr-select-none').onclick = function() {\n"
    "      panel.querySelectorAll('.mr-check').forEach(function(c){c.checked=false;});\n"
    "    };\n\n"

    "    /* Зберегти групу */\n"
    "    document.getElementById('mr-save-group').onclick = function() {\n"
    "      var sel = getChecked();\n"
    "      if (sel.length === 0) { TermLog.log('warning','Виберіть роутери'); return; }\n"
    "      var gname = prompt('Назва групи (Офіси, Склади...):');\n"
    "      if (!gname || !gname.trim()) return;\n"
    "      try {\n"
    "        var gs = JSON.parse(localStorage.getItem('mr-groups')||'{}');\n"
    "        gs[gname.trim()] = sel.map(function(r){return r.id||r.ip;});\n"
    "        localStorage.setItem('mr-groups', JSON.stringify(gs));\n"
    "        TermLog.log('ok','💾 Групу \"'+gname.trim()+'\" збережено ('+sel.length+' роутерів)');\n"
    "        panel.remove();\n"
    "        setTimeout(function(){TermLog.showMultiRouter();},100);\n"
    "      } catch(e) { TermLog.log('error','Помилка: '+e); }\n"
    "    };\n\n"

    "    /* Кнопки груп */\n"
    "    panel.querySelectorAll('.mr-group-btn').forEach(function(btn) {\n"
    "      btn.onclick = function() {\n"
    "        var gs = JSON.parse(localStorage.getItem('mr-groups')||'{}');\n"
    "        var gids = gs[this.dataset.group] || [];\n"
    "        panel.querySelectorAll('.mr-check').forEach(function(c) {\n"
    "          c.checked = gids.indexOf(c.dataset.id) >= 0;\n"
    "        });\n"
    "        panel.querySelectorAll('.mr-group-btn').forEach(function(b){\n"
    "          b.style.background='#1a1a2a'; b.style.color='#c084fc';\n"
    "        });\n"
    "        this.style.background='#3a1a5a'; this.style.color='#e0a0ff';\n"
    "      };\n"
    "      btn.oncontextmenu = function(e) {\n"
    "        e.preventDefault();\n"
    "        if (!confirm('Видалити групу \"'+this.dataset.group+'\"?')) return;\n"
    "        var gs = JSON.parse(localStorage.getItem('mr-groups')||'{}');\n"
    "        delete gs[this.dataset.group];\n"
    "        localStorage.setItem('mr-groups', JSON.stringify(gs));\n"
    "        panel.remove();\n"
    "        setTimeout(function(){TermLog.showMultiRouter();},100);\n"
    "      };\n"
    "    });\n\n"

    "    /* Виконати */\n"
    "    document.getElementById('mr-run-all').onclick = function() {\n"
    "      var cmd = (document.getElementById('termlog-cmd-input')||{}).value;\n"
    "      cmd = cmd ? cmd.trim() : '';\n"
    "      if (!cmd) { TermLog.log('error','Введіть команду в поле вводу!'); return; }\n"
    "      var sel = getChecked();\n"
    "      if (sel.length === 0) { TermLog.log('warning','Виберіть хоча б один роутер'); return; }\n"
    "      panel.remove();\n"
    "      TermLog.runOnMultiple(cmd, sel);\n"
    "    };\n"
    "    document.getElementById('mr-cancel').onclick = function() { panel.remove(); };\n"
    "  }"
)

tl = tl[:idx] + NEW_SHOW_MULTI + tl[end:]
print('OK: showMultiRouter повністю переписано ✅')

with open('ai-agent/terminal-log.js', 'w', encoding='utf-8') as f:
    f.write(tl)

r2 = subprocess.run(['node','--check','ai-agent/terminal-log.js'],
                    capture_output=True, text=True)
print('terminal-log:', 'OK ✅' if r2.returncode==0 else '❌\n'+r2.stderr[:200])

print('\nВсе готово! npm start')