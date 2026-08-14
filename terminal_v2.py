with open('terminal.js', 'r', encoding='utf-8') as f:
    c = f.read()

# ── 1. Додаємо нову панель інструментів терміналу ──
OLD_TERM_HEADER = """'<div style="background:#0d1a24;border-bottom:1px solid #1c2a37;padding:6px 12px;display:flex;align-items:center;gap:8px;">' +
    '<span style="width:10px;height:10px;border-radius:50%;background:#e0665a;display:inline-block;"></span>' +
    '<span style="width:10px;height:10px;border-radius:50%;background:#e6b35a;display:inline-block;"></span>' +
    '<span style="width:10px;height:10px;border-radius:50%;background:#5fd0a5;display:inline-block;"></span>' +
    '<span style="font-size:11px;color:#4a6070;margin-left:8px;font-family:monospace;">MikroTik RouterOS Terminal</span>' +
    '<button id="tm-clear" style="margin-left:auto;background:transparent;border:1px solid #2a3b48;color:#4a6070;padding:2px 8px;border-radius:4px;cursor:pointer;font-size:10px;">Очистити</button>' +
    '</div>' +"""

NEW_TERM_HEADER = """'<div style="background:#0d1a24;border-bottom:1px solid #1c2a37;padding:6px 12px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
    '<span style="width:10px;height:10px;border-radius:50%;background:#e0665a;display:inline-block;"></span>' +
    '<span style="width:10px;height:10px;border-radius:50%;background:#e6b35a;display:inline-block;"></span>' +
    '<span style="width:10px;height:10px;border-radius:50%;background:#5fd0a5;display:inline-block;"></span>' +
    '<span style="font-size:11px;color:#4a6070;margin-left:4px;font-family:monospace;">MikroTik Terminal</span>' +

    /* Кнопки панелі */
    '<div style="margin-left:auto;display:flex;gap:4px;flex-wrap:wrap;">' +

    /* Пошук */
    '<button id="tm-search-btn" title="Пошук в виводі (Ctrl+F)" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:2px 8px;border-radius:4px;cursor:pointer;font-size:10px;">🔍</button>' +

    /* Копіювати */
    '<button id="tm-copy-btn" title="Копіювати вивід" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:2px 8px;border-radius:4px;cursor:pointer;font-size:10px;">📋</button>' +

    /* Live моніторинг */
    '<button id="tm-live-btn" title="Live моніторинг" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:2px 8px;border-radius:4px;cursor:pointer;font-size:10px;">📊 Live</button>' +

    /* Закладки */
    '<button id="tm-bookmarks-btn" title="Закладки команд" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:2px 8px;border-radius:4px;cursor:pointer;font-size:10px;">🔖</button>' +

    /* Макроси */
    '<button id="tm-macros-btn" title="Макроси" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:2px 8px;border-radius:4px;cursor:pointer;font-size:10px;">📝</button>' +

    /* Очистити */
    '<button id="tm-clear" title="Очистити термінал" style="background:transparent;border:1px solid #2a3b48;color:#4a6070;padding:2px 8px;border-radius:4px;cursor:pointer;font-size:10px;">🗑️</button>' +

    '</div>' +
    '</div>' +

    /* Панель пошуку (прихована) */
    '<div id="tm-search-bar" style="display:none;background:#0a1520;border-bottom:1px solid #1c2a37;padding:6px 12px;display:none;align-items:center;gap:6px;">' +
    '<span style="font-size:11px;color:#8ea3b0;">🔍</span>' +
    '<input id="tm-search-input" type="text" placeholder="Пошук в виводі..." style="background:#0d1a24;border:1px solid #2a3b48;color:#e6edf3;padding:4px 8px;border-radius:4px;font-size:11px;flex:1;outline:none;">' +
    '<span id="tm-search-count" style="font-size:11px;color:#4a6070;"></span>' +
    '<button id="tm-search-prev" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:2px 6px;border-radius:4px;cursor:pointer;font-size:10px;">▲</button>' +
    '<button id="tm-search-next" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:2px 6px;border-radius:4px;cursor:pointer;font-size:10px;">▼</button>' +
    '<button id="tm-search-close" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:2px 6px;border-radius:4px;cursor:pointer;font-size:10px;">✕</button>' +
    '</div>' +

    /* Панель закладок (прихована) */
    '<div id="tm-bookmarks-bar" style="display:none;background:#0a1520;border-bottom:1px solid #1c2a37;padding:8px 12px;">' +
    '<div style="font-size:11px;color:#8ea3b0;margin-bottom:6px;display:flex;justify-content:space-between;">' +
    '<span>🔖 Закладки</span>' +
    '<button id="tm-bookmark-add" style="background:#5fd0a533;border:1px solid #5fd0a5;color:#5fd0a5;padding:2px 8px;border-radius:4px;cursor:pointer;font-size:10px;">+ Додати поточну</button>' +
    '</div>' +
    '<div id="tm-bookmarks-list" style="display:flex;gap:4px;flex-wrap:wrap;max-height:80px;overflow-y:auto;"></div>' +
    '</div>' +

    /* Панель макросів (прихована) */
    '<div id="tm-macros-bar" style="display:none;background:#0a1520;border-bottom:1px solid #1c2a37;padding:8px 12px;">' +
    '<div style="font-size:11px;color:#8ea3b0;margin-bottom:6px;display:flex;justify-content:space-between;">' +
    '<span>📝 Макроси</span>' +
    '<button id="tm-macro-add" style="background:#5b9bd533;border:1px solid #5b9bd5;color:#5b9bd5;padding:2px 8px;border-radius:4px;cursor:pointer;font-size:10px;">+ Новий макрос</button>' +
    '</div>' +
    '<div id="tm-macros-list" style="display:flex;gap:4px;flex-wrap:wrap;max-height:80px;overflow-y:auto;"></div>' +
    '</div>' +

    /* Live панель (прихована) */
    '<div id="tm-live-bar" style="display:none;background:#0a1520;border-bottom:1px solid #1c2a37;padding:8px 12px;">' +
    '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' +
    '<span style="font-size:11px;color:#8ea3b0;">📊 Live:</span>' +
    '<select id="tm-live-cmd" style="background:#0d1a24;border:1px solid #2a3b48;color:#e6edf3;padding:4px 8px;border-radius:4px;font-size:11px;">' +
    '<option>/interface print</option>' +
    '<option>/ip address print</option>' +
    '<option>/system resource print</option>' +
    '<option>/ip dhcp-server lease print</option>' +
    '<option>/ip firewall connection print count-only</option>' +
    '<option>/log print</option>' +
    '<option>/user active print</option>' +
    '</select>' +
    '<select id="tm-live-interval" style="background:#0d1a24;border:1px solid #2a3b48;color:#e6edf3;padding:4px 8px;border-radius:4px;font-size:11px;">' +
    '<option value="3000">3s</option>' +
    '<option value="5000" selected>5s</option>' +
    '<option value="10000">10s</option>' +
    '<option value="30000">30s</option>' +
    '</select>' +
    '<button id="tm-live-start" style="background:#5fd0a5;color:#082018;border:none;padding:4px 12px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:700;">▶ Старт</button>' +
    '<button id="tm-live-stop" style="background:#e0665a;color:#fff;border:none;padding:4px 12px;border-radius:4px;cursor:pointer;font-size:11px;display:none;">⏹ Стоп</button>' +
    '<span id="tm-live-status" style="font-size:11px;color:#4a6070;"></span>' +
    '</div>' +
    '</div>' +"""

if OLD_TERM_HEADER in c:
    c = c.replace(OLD_TERM_HEADER, NEW_TERM_HEADER)
    print('OK: термінал header оновлено!')
else:
    print('WARN: header не знайдено')

# ── 2. Додаємо логіку після tm-clear ──
OLD_CLEAR = """  document.getElementById('tm-clear').addEventListener('click', function() {
    var out = document.getElementById('tm-output');
    out.innerHTML = '<span style="color:#5fd0a5;">Terminal cleared\\n\\n</span>';
  });"""

NEW_CLEAR = """  document.getElementById('tm-clear').addEventListener('click', function() {
    var out = document.getElementById('tm-output');
    out.innerHTML = '<span style="color:#5fd0a5;">Terminal cleared\\n\\n</span>';
  });

  /* ══════════════════════════════════════════
     ЗБЕРЕЖЕННЯ ІСТОРІЇ В localStorage
  ══════════════════════════════════════════ */
  function saveHistory() {
    try {
      localStorage.setItem('tm-cmd-history', JSON.stringify(cmdHistory.slice(0, 100)));
    } catch(e) {}
  }

  function loadHistory() {
    try {
      var saved = localStorage.getItem('tm-cmd-history');
      if (saved) {
        cmdHistory = JSON.parse(saved);
        appendOutput('[' + cmdHistory.length + ' команд з попередньої сесії]\\n', '#3a5048');
      }
    } catch(e) {}
  }

  loadHistory();

  /* ══════════════════════════════════════════
     ПОШУК В ВИВОДІ
  ══════════════════════════════════════════ */
  var searchMatches = [];
  var searchIdx     = 0;

  document.getElementById('tm-search-btn').addEventListener('click', function() {
    var bar = document.getElementById('tm-search-bar');
    bar.style.display = bar.style.display === 'none' ? 'flex' : 'none';
    if (bar.style.display === 'flex') {
      document.getElementById('tm-search-input').focus();
    }
  });

  document.getElementById('tm-search-close').addEventListener('click', function() {
    document.getElementById('tm-search-bar').style.display = 'none';
    clearSearchHighlights();
  });

  document.getElementById('tm-search-input').addEventListener('input', function() {
    performSearch(this.value);
  });

  document.getElementById('tm-search-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') nextSearchMatch();
    if (e.key === 'Escape') document.getElementById('tm-search-close').click();
  });

  document.getElementById('tm-search-next').addEventListener('click', nextSearchMatch);
  document.getElementById('tm-search-prev').addEventListener('click', prevSearchMatch);

  /* Ctrl+F відкриває пошук */
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'f') {
      var termTab = document.getElementById('tm-tab-terminal');
      if (termTab && termTab.style.display !== 'none') {
        e.preventDefault();
        document.getElementById('tm-search-btn').click();
      }
    }
  });

  function clearSearchHighlights() {
    var out = document.getElementById('tm-output');
    out.querySelectorAll('mark.tm-hl').forEach(function(m) {
      m.replaceWith(document.createTextNode(m.textContent));
    });
    searchMatches = [];
    document.getElementById('tm-search-count').textContent = '';
  }

  function performSearch(query) {
    clearSearchHighlights();
    if (!query) return;

    var out   = document.getElementById('tm-output');
    var spans = out.querySelectorAll('span');
    searchMatches = [];

    spans.forEach(function(span) {
      var text = span.textContent;
      if (text.toLowerCase().indexOf(query.toLowerCase()) === -1) return;

      var html = span.innerHTML;
      var re   = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\\\]/g, '\\\\$&') + ')', 'gi');
      span.innerHTML = html.replace(re, '<mark class="tm-hl" style="background:#e6b35a;color:#082018;border-radius:2px;">$1</mark>');
      span.querySelectorAll('mark.tm-hl').forEach(function(m) {
        searchMatches.push(m);
      });
    });

    if (searchMatches.length) {
      searchIdx = 0;
      searchMatches[0].scrollIntoView({ block: 'center' });
      document.getElementById('tm-search-count').textContent =
        '1 / ' + searchMatches.length;
    } else {
      document.getElementById('tm-search-count').textContent = 'Не знайдено';
    }
  }

  function nextSearchMatch() {
    if (!searchMatches.length) return;
    searchIdx = (searchIdx + 1) % searchMatches.length;
    searchMatches[searchIdx].scrollIntoView({ block: 'center' });
    document.getElementById('tm-search-count').textContent =
      (searchIdx + 1) + ' / ' + searchMatches.length;
  }

  function prevSearchMatch() {
    if (!searchMatches.length) return;
    searchIdx = (searchIdx - 1 + searchMatches.length) % searchMatches.length;
    searchMatches[searchIdx].scrollIntoView({ block: 'center' });
    document.getElementById('tm-search-count').textContent =
      (searchIdx + 1) + ' / ' + searchMatches.length;
  }

  /* ══════════════════════════════════════════
     КОПІЮВАННЯ ВИВОДУ
  ══════════════════════════════════════════ */
  document.getElementById('tm-copy-btn').addEventListener('click', function() {
    var out  = document.getElementById('tm-output');
    var text = out.innerText || out.textContent;
    navigator.clipboard.writeText(text).then(function() {
      var btn = document.getElementById('tm-copy-btn');
      btn.textContent = '✅';
      setTimeout(function() { btn.textContent = '📋'; }, 1500);
    });
  });

  /* ══════════════════════════════════════════
     ЗАКЛАДКИ
  ══════════════════════════════════════════ */
  var bookmarks = [];

  function loadBookmarks() {
    try {
      bookmarks = JSON.parse(localStorage.getItem('tm-bookmarks') || '[]');
    } catch(e) { bookmarks = []; }
    renderBookmarks();
  }

  function saveBookmarks() {
    try {
      localStorage.setItem('tm-bookmarks', JSON.stringify(bookmarks));
    } catch(e) {}
  }

  function renderBookmarks() {
    var list = document.getElementById('tm-bookmarks-list');
    if (!list) return;
    list.innerHTML = '';

    if (!bookmarks.length) {
      list.innerHTML = '<span style="font-size:11px;color:#4a6070;">Немає закладок. Введи команду і натисни "+ Додати поточну"</span>';
      return;
    }

    bookmarks.forEach(function(bm, idx) {
      var btn = document.createElement('button');
      btn.style.cssText = 'background:#0d1a24;border:1px solid #2a3b48;color:#5b9bd5;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:10px;font-family:monospace;display:flex;align-items:center;gap:4px;';
      btn.innerHTML = bm + ' <span style="color:#4a6070;font-size:9px;cursor:pointer;" data-idx="' + idx + '">✕</span>';

      btn.addEventListener('click', function(e) {
        if (e.target.getAttribute('data-idx') !== null) {
          bookmarks.splice(parseInt(e.target.getAttribute('data-idx')), 1);
          saveBookmarks();
          renderBookmarks();
        } else {
          document.getElementById('tm-cmd').value = bm;
          document.getElementById('tm-cmd').focus();
        }
      });
      list.appendChild(btn);
    });
  }

  document.getElementById('tm-bookmarks-btn').addEventListener('click', function() {
    var bar = document.getElementById('tm-bookmarks-bar');
    bar.style.display = bar.style.display === 'none' ? 'block' : 'none';
    if (bar.style.display === 'block') renderBookmarks();
  });

  document.getElementById('tm-bookmark-add').addEventListener('click', function() {
    var cmd = document.getElementById('tm-cmd').value.trim() ||
              (cmdHistory.length ? cmdHistory[0] : '');
    if (!cmd) {
      appendOutput('⚠️ Спочатку введи команду\\n', '#e6b35a');
      return;
    }
    if (bookmarks.indexOf(cmd) === -1) {
      bookmarks.push(cmd);
      saveBookmarks();
      renderBookmarks();
      appendOutput('🔖 Додано в закладки: ' + cmd + '\\n', '#5fd0a5');
    } else {
      appendOutput('⚠️ Вже є в закладках\\n', '#e6b35a');
    }
  });

  loadBookmarks();

  /* ══════════════════════════════════════════
     МАКРОСИ
  ══════════════════════════════════════════ */
  var macros = [
    { name: '🔍 Статус', cmds: ['/system identity print', '/system resource print', '/ip address print'] },
    { name: '🔥 Firewall', cmds: ['/ip firewall filter print', '/ip firewall nat print'] },
    { name: '📡 Мережа', cmds: ['/interface print', '/ip route print', '/ip neighbor print'] },
    { name: '👥 Клієнти', cmds: ['/ip dhcp-server lease print', '/user active print'] },
    { name: '📋 Логи', cmds: ['/log print'] },
  ];

  function loadMacros() {
    try {
      var saved = JSON.parse(localStorage.getItem('tm-macros') || 'null');
      if (saved) macros = saved;
    } catch(e) {}
    renderMacros();
  }

  function saveMacros() {
    try {
      localStorage.setItem('tm-macros', JSON.stringify(macros));
    } catch(e) {}
  }

  function renderMacros() {
    var list = document.getElementById('tm-macros-list');
    if (!list) return;
    list.innerHTML = '';

    macros.forEach(function(macro, idx) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;align-items:center;gap:2px;';

      var btn = document.createElement('button');
      btn.style.cssText = 'background:#0d1a24;border:1px solid #2a3b48;color:#e6b35a;padding:3px 10px;border-radius:4px;cursor:pointer;font-size:10px;';
      btn.textContent = macro.name;
      btn.title = macro.cmds.join(' → ');

      btn.addEventListener('click', function() {
        appendOutput('\\n📝 Макрос: ' + macro.name + '\\n', '#e6b35a');
        var delay = 0;
        macro.cmds.forEach(function(cmd) {
          setTimeout(function() { runCommand(cmd); }, delay);
          delay += 2000;
        });
      });

      var del = document.createElement('button');
      del.style.cssText = 'background:transparent;border:none;color:#4a6070;cursor:pointer;font-size:9px;padding:0 2px;';
      del.textContent = '✕';
      del.title = 'Видалити макрос';
      del.addEventListener('click', function() {
        if (confirm('Видалити макрос "' + macro.name + '"?')) {
          macros.splice(idx, 1);
          saveMacros();
          renderMacros();
        }
      });

      wrap.appendChild(btn);
      wrap.appendChild(del);
      list.appendChild(wrap);
    });
  }

  document.getElementById('tm-macros-btn').addEventListener('click', function() {
    var bar = document.getElementById('tm-macros-bar');
    bar.style.display = bar.style.display === 'none' ? 'block' : 'none';
    if (bar.style.display === 'block') renderMacros();
  });

  document.getElementById('tm-macro-add').addEventListener('click', function() {
    var name = prompt('Назва макросу:');
    if (!name) return;
    var cmdsRaw = prompt('Команди (через крапку з комою):',
      '/system identity print;/system resource print');
    if (!cmdsRaw) return;
    var cmds = cmdsRaw.split(';').map(function(s) { return s.trim(); }).filter(Boolean);
    macros.push({ name: name, cmds: cmds });
    saveMacros();
    renderMacros();
    appendOutput('📝 Макрос "' + name + '" створено (' + cmds.length + ' команд)\\n', '#5fd0a5');
  });

  loadMacros();

  /* ══════════════════════════════════════════
     LIVE МОНІТОРИНГ
  ══════════════════════════════════════════ */
  var liveTimer   = null;
  var liveRunning = false;

  document.getElementById('tm-live-btn').addEventListener('click', function() {
    var bar = document.getElementById('tm-live-bar');
    bar.style.display = bar.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('tm-live-start').addEventListener('click', function() {
    if (liveRunning) return;
    if (!sshConnected) {
      appendOutput('❌ Підключись по SSH!\\n', '#e0665a');
      return;
    }

    var cmd      = document.getElementById('tm-live-cmd').value;
    var interval = parseInt(document.getElementById('tm-live-interval').value);
    liveRunning  = true;

    document.getElementById('tm-live-start').style.display = 'none';
    document.getElementById('tm-live-stop').style.display  = 'inline-block';
    document.getElementById('tm-live-status').textContent  = '🟢 Оновлення кожні ' + (interval/1000) + 's';

    function tick() {
      if (!liveRunning) return;
      var ts = new Date().toLocaleTimeString();
      appendOutput('\\n── 📊 ' + cmd + ' [' + ts + '] ──', '#3a5048');
      runCommand(cmd);
      liveTimer = setTimeout(tick, interval);
    }

    tick();
  });

  document.getElementById('tm-live-stop').addEventListener('click', function() {
    liveRunning = false;
    clearTimeout(liveTimer);
    document.getElementById('tm-live-start').style.display = 'inline-block';
    document.getElementById('tm-live-stop').style.display  = 'none';
    document.getElementById('tm-live-status').textContent  = '⏹ Зупинено';
    appendOutput('⏹ Live моніторинг зупинено\\n', '#e6b35a');
  });"""

if OLD_CLEAR in c:
    c = c.replace(OLD_CLEAR, NEW_CLEAR)
    print('OK: всі 6 функцій додано!')
else:
    print('WARN: tm-clear блок не знайдено')

# ── 3. Зберігаємо історію при кожній команді ──
OLD_HIST = """    cmdHistory.unshift(cmd);
    if (cmdHistory.length > 100) cmdHistory.pop();
    historyIdx = -1;"""

NEW_HIST = """    cmdHistory.unshift(cmd);
    if (cmdHistory.length > 100) cmdHistory.pop();
    historyIdx = -1;
    saveHistory();"""

if OLD_HIST in c:
    c = c.replace(OLD_HIST, NEW_HIST)
    print('OK: saveHistory() додано!')

with open('terminal.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
print('terminal.js збережено!')