'use strict';
(function() {

/* ════════════════════════════════════════
   TERMINAL++ v1
   Розширення вбудованого терміналу:
   - Пошук по виводу (Ctrl+F)
   - Копіювання виводу
   - Закладки команд
   - Макроси
   - Live моніторинг
   - Історія між сесіями
════════════════════════════════════════ */

var HISTORY_KEY   = 'mt-term-history';
var BOOKMARKS_KEY = 'mt-term-bookmarks';
var MACROS_KEY    = 'mt-term-macros';
var MAX_HISTORY   = 200;

/* ── Зберігання ── */
function loadHistory()   { try { return JSON.parse(localStorage.getItem(HISTORY_KEY)   || '[]'); } catch(e) { return []; } }
function loadBookmarks() { try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]'); } catch(e) { return []; } }
function loadMacros()    { try { return JSON.parse(localStorage.getItem(MACROS_KEY)    || '[]'); } catch(e) { return []; } }

function saveHistory(h)   { try { localStorage.setItem(HISTORY_KEY,   JSON.stringify(h)); } catch(e) {} }
function saveBookmarks(b) { try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(b)); } catch(e) {} }
function saveMacros(m)    { try { localStorage.setItem(MACROS_KEY,    JSON.stringify(m)); } catch(e) {} }

/* ════════════════════════════════════════
   ЧЕКАЄМО ПОКИ ТЕРМІНАЛ ЗАВАНТАЖИТЬСЯ
════════════════════════════════════════ */
function waitForTerminal(cb) {
  var attempts = 0;
  var timer = setInterval(function() {
    attempts++;
    var term = document.getElementById('tm-output') ||
               document.getElementById('terminal-output') ||
               document.querySelector('.terminal-output') ||
               document.querySelector('#term-out');
    var inp  = document.getElementById('tm-cmd') ||
               document.getElementById('terminal-input') ||
               document.querySelector('.terminal-input');
    if (term && inp) {
      clearInterval(timer);
      cb(term, inp);
    }
    if (attempts > 50) {
      clearInterval(timer);
      console.warn('[terminal++] термінал не знайдено за 5 секунд');
    }
  }, 100);
}

waitForTerminal(function(termOutput, termInput) {
  console.log('[terminal++] термінал знайдено!');
  init(termOutput, termInput);
});

function init(termOutput, termInput) {

  var historyIndex = -1;
  var historyList  = loadHistory();
  var liveTimer    = null;
  var liveActive   = false;
  var searchActive = false;
  var searchMatches = [];
  var searchCurrent = 0;

  /* ════════════════════════════════════════
     ПАНЕЛЬ ІНСТРУМЕНТІВ ТЕРМІНАЛУ
  ════════════════════════════════════════ */
  var toolbar = document.createElement('div');
  toolbar.id  = 'termpp-toolbar';
  toolbar.style.cssText = 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;' +
    'padding:8px 12px;background:#0a1520;border:1px solid #1c2a37;' +
    'border-bottom:none;border-radius:8px 8px 0 0;margin-top:12px;';

  toolbar.innerHTML =
    /* Пошук */
    '<button id="termpp-search-btn" title="Пошук (Ctrl+F)" style="' +
    'background:transparent;border:1px solid #2a3b48;color:#8ea3b0;' +
    'padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;">🔍 Пошук</button>' +

    /* Копіювати */
    '<button id="termpp-copy-btn" title="Копіювати вивід" style="' +
    'background:transparent;border:1px solid #2a3b48;color:#8ea3b0;' +
    'padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;">📋 Копіювати</button>' +

    /* Очистити */
    '<button id="termpp-clear-btn" title="Очистити вивід" style="' +
    'background:transparent;border:1px solid #2a3b48;color:#8ea3b0;' +
    'padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;">🗑️ Очистити</button>' +

    '<span style="color:#2a3b48;padding:0 2px;">|</span>' +

    /* Закладки */
    '<button id="termpp-bookmarks-btn" title="Закладки команд" style="' +
    'background:transparent;border:1px solid #2a3b48;color:#e6b35a;' +
    'padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;">🔖 Закладки</button>' +

    /* Макроси */
    '<button id="termpp-macros-btn" title="Макроси" style="' +
    'background:transparent;border:1px solid #2a3b48;color:#9b87f5;' +
    'padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;">📝 Макроси</button>' +

    /* Історія */
    '<button id="termpp-history-btn" title="Історія команд" style="' +
    'background:transparent;border:1px solid #2a3b48;color:#5b9bd5;' +
    'padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;">📜 Історія</button>' +

    '<span style="color:#2a3b48;padding:0 2px;">|</span>' +

    /* Live моніторинг */
    '<span style="font-size:10px;color:#4a6070;">Live:</span>' +
    '<select id="termpp-live-sel" style="background:#060d14;border:1px solid #1c2a37;' +
    'color:#e6edf3;padding:3px 6px;border-radius:4px;font-size:10px;">' +
    '<option value="0">Вимк</option>' +
    '<option value="3000">3s</option>' +
    '<option value="5000">5s</option>' +
    '<option value="10000">10s</option>' +
    '<option value="30000">30s</option>' +
    '</select>' +

    '<span id="termpp-live-status" style="font-size:10px;color:#4a6070;"></span>' +
    '<span style="margin-left:auto;font-size:10px;color:#4a6070;" id="termpp-info"></span>';

  /* Вставляємо toolbar перед терміналом */
  termOutput.parentNode.insertBefore(toolbar, termOutput);
  termOutput.style.borderRadius = '0 0 8px 8px';

  /* ════════════════════════════════════════
     ПАНЕЛЬ ПОШУКУ
  ════════════════════════════════════════ */
  var searchBar = document.createElement('div');
  searchBar.id  = 'termpp-search-bar';
  searchBar.style.cssText = 'display:none;align-items:center;gap:6px;' +
    'padding:6px 12px;background:#0d1a24;border:1px solid #1c2a37;border-bottom:none;';

  searchBar.innerHTML =
    '<input id="termpp-search-inp" type="text" placeholder="Пошук у виводі..." style="' +
    'background:#060d14;border:1px solid #1c2a37;color:#e6edf3;' +
    'padding:5px 8px;border-radius:4px;font-size:12px;width:200px;">' +
    '<button id="termpp-search-prev" style="background:transparent;border:1px solid #2a3b48;' +
    'color:#8ea3b0;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;">▲</button>' +
    '<button id="termpp-search-next" style="background:transparent;border:1px solid #2a3b48;' +
    'color:#8ea3b0;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;">▼</button>' +
    '<span id="termpp-search-count" style="font-size:11px;color:#4a6070;min-width:60px;"></span>' +
    '<button id="termpp-search-close" style="background:transparent;border:none;' +
    'color:#4a6070;cursor:pointer;font-size:14px;">✕</button>';

  termOutput.parentNode.insertBefore(searchBar, termOutput);

  /* ════════════════════════════════════════
     ПАНЕЛЬ ЗАКЛАДОК
  ════════════════════════════════════════ */
  var bookmarksPanel = document.createElement('div');
  bookmarksPanel.id  = 'termpp-bookmarks';
  bookmarksPanel.style.cssText = 'display:none;position:absolute;background:#0d1a24;' +
    'border:1px solid #2a3b48;border-radius:8px;padding:12px;z-index:1000;' +
    'width:320px;max-height:350px;overflow-y:auto;box-shadow:0 4px 20px rgba(0,0,0,.5);';
  document.body.appendChild(bookmarksPanel);

  /* ════════════════════════════════════════
     ПАНЕЛЬ МАКРОСІВ
  ════════════════════════════════════════ */
  var macrosPanel = document.createElement('div');
  macrosPanel.id  = 'termpp-macros-panel';
  macrosPanel.style.cssText = 'display:none;position:absolute;background:#0d1a24;' +
    'border:1px solid #2a3b48;border-radius:8px;padding:12px;z-index:1000;' +
    'width:380px;max-height:400px;overflow-y:auto;box-shadow:0 4px 20px rgba(0,0,0,.5);';
  document.body.appendChild(macrosPanel);

  /* ════════════════════════════════════════
     ПАНЕЛЬ ІСТОРІЇ
  ════════════════════════════════════════ */
  var historyPanel = document.createElement('div');
  historyPanel.id  = 'termpp-history-panel';
  historyPanel.style.cssText = 'display:none;position:absolute;background:#0d1a24;' +
    'border:1px solid #2a3b48;border-radius:8px;padding:12px;z-index:1000;' +
    'width:340px;max-height:400px;overflow-y:auto;box-shadow:0 4px 20px rgba(0,0,0,.5);';
  document.body.appendChild(historyPanel);

  /* ════════════════════════════════════════
     ФУНКЦІЇ ПОШУКУ
  ════════════════════════════════════════ */
  function doSearch(query) {
    if (!query) {
      termOutput.innerHTML = termOutput.innerHTML.replace(
        /<mark class="termpp-hl"[^>]*>(.*?)<\/mark>/g, '$1'
      );
      document.getElementById('termpp-search-count').textContent = '';
      return;
    }

    var text = termOutput.innerText;
    var regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    var matches = text.match(regex);
    var count   = matches ? matches.length : 0;

    document.getElementById('termpp-search-count').textContent =
      count ? (searchCurrent + 1) + ' / ' + count : 'Не знайдено';

    if (!count) return;

    /* Підсвічуємо */
    termOutput.innerHTML = termOutput.innerHTML.replace(
      /<mark class="termpp-hl"[^>]*>(.*?)<\/mark>/g, '$1'
    );

    var walker = document.createTreeWalker(termOutput, NodeFilter.SHOW_TEXT);
    var nodes  = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(function(node) {
      var parent = node.parentNode;
      if (!parent || parent.classList && parent.classList.contains('termpp-hl')) return;
      var newHtml = node.textContent.replace(regex, function(m) {
        return '<mark class="termpp-hl" style="background:#e6b35a44;color:#e6b35a;border-radius:2px;">' + m + '</mark>';
      });
      if (newHtml !== node.textContent) {
        var span = document.createElement('span');
        span.innerHTML = newHtml;
        parent.replaceChild(span, node);
      }
    });

    /* Скролимо до першого */
    var first = termOutput.querySelector('.termpp-hl');
    if (first) first.scrollIntoView({ block: 'center' });
  }

  /* ════════════════════════════════════════
     ФУНКЦІЇ ЗАКЛАДОК
  ════════════════════════════════════════ */
  function renderBookmarks() {
    var bms = loadBookmarks();
    bookmarksPanel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
      '<span style="color:#e6b35a;font-weight:700;font-size:12px;">🔖 Закладки команд</span>' +
      '<button id="bm-add" style="background:#e6b35a;color:#082018;border:none;' +
      'padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;">+ Додати</button>' +
      '</div>' +
      (bms.length ? bms.map(function(bm, idx) {
        return '<div style="display:flex;align-items:center;gap:6px;background:#060d14;' +
          'border:1px solid #1c2a37;border-radius:4px;padding:6px 8px;margin-bottom:4px;">' +
          '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:11px;color:#e6b35a;font-weight:600;">' + bm.name + '</div>' +
          '<div style="font-size:10px;color:#4a6070;font-family:monospace;' +
          'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + bm.cmd + '</div>' +
          '</div>' +
          '<button data-bm-run="' + idx + '" style="background:#5fd0a5;color:#082018;border:none;' +
          'padding:3px 8px;border-radius:3px;cursor:pointer;font-size:10px;">▶</button>' +
          '<button data-bm-del="' + idx + '" style="background:transparent;border:1px solid #e0665a44;' +
          'color:#e0665a;padding:3px 6px;border-radius:3px;cursor:pointer;font-size:10px;">✕</button>' +
          '</div>';
      }).join('') : '<div style="color:#4a6070;font-size:11px;text-align:center;padding:12px;">Немає закладок</div>');

    document.getElementById('bm-add').addEventListener('click', function() {
      var name = prompt('Назва закладки:');
      if (!name) return;
      var cmd  = prompt('Команда RouterOS:', termInput.value);
      if (!cmd) return;
      var bms  = loadBookmarks();
      bms.push({ name: name, cmd: cmd });
      saveBookmarks(bms);
      renderBookmarks();
    });

    bookmarksPanel.querySelectorAll('[data-bm-run]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(this.getAttribute('data-bm-run'));
        var bm  = loadBookmarks()[idx];
        if (bm) {
          termInput.value = bm.cmd;
          termInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          bookmarksPanel.style.display = 'none';
        }
      });
    });

    bookmarksPanel.querySelectorAll('[data-bm-del]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(this.getAttribute('data-bm-del'));
        var bms = loadBookmarks();
        bms.splice(idx, 1);
        saveBookmarks(bms);
        renderBookmarks();
      });
    });
  }

  /* ════════════════════════════════════════
     ФУНКЦІЇ МАКРОСІВ
  ════════════════════════════════════════ */
  function renderMacros() {
    var macros = loadMacros();
    macrosPanel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
      '<span style="color:#9b87f5;font-weight:700;font-size:12px;">📝 Макроси</span>' +
      '<button id="mc-add" style="background:#9b87f5;color:#fff;border:none;' +
      'padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;">+ Новий</button>' +
      '</div>' +

      /* Готові макроси */
      '<div style="font-size:10px;color:#4a6070;margin-bottom:6px;">⚡ Швидкі макроси:</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:10px;">' +
      [
        { name: '📊 System Info', cmds: ['/system resource print', '/system identity print'] },
        { name: '🔌 Interfaces',  cmds: ['/interface print', '/interface ethernet print'] },
        { name: '👥 DHCP Leases', cmds: ['/ip dhcp-server lease print'] },
        { name: '🔥 Firewall',    cmds: ['/ip firewall filter print', '/ip firewall nat print'] },
        { name: '🌐 Routes',      cmds: ['/ip route print'] },
        { name: '📡 Wireless',    cmds: ['/interface wireless print', '/interface wireless registration-table print'] },
        { name: '🔑 VPN Users',   cmds: ['/ppp secret print', '/ppp active print'] },
        { name: '📋 Log',         cmds: ['/log print where topics~"error"'] },
      ].map(function(m) {
        return '<button class="mc-builtin" data-cmds="' + m.cmds.join('|||') + '" style="' +
          'background:#0d1a24;border:1px solid #2a3b48;color:#c9e8d8;' +
          'padding:5px 8px;border-radius:4px;cursor:pointer;font-size:10px;text-align:left;">' +
          m.name + '</button>';
      }).join('') + '</div>' +

      /* Власні макроси */
      '<div style="font-size:10px;color:#4a6070;margin-bottom:6px;">📝 Мої макроси:</div>' +
      (macros.length ? macros.map(function(m, idx) {
        return '<div style="background:#060d14;border:1px solid #1c2a37;border-radius:4px;' +
          'padding:8px;margin-bottom:6px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
          '<span style="color:#9b87f5;font-size:11px;font-weight:600;">' + m.name + '</span>' +
          '<div style="display:flex;gap:4px;">' +
          '<button data-mc-run="' + idx + '" style="background:#9b87f5;color:#fff;border:none;' +
          'padding:3px 8px;border-radius:3px;cursor:pointer;font-size:10px;">▶ Виконати</button>' +
          '<button data-mc-del="' + idx + '" style="background:transparent;border:1px solid #e0665a44;' +
          'color:#e0665a;padding:3px 6px;border-radius:3px;cursor:pointer;font-size:10px;">✕</button>' +
          '</div></div>' +
          '<div style="font-size:10px;color:#4a6070;font-family:monospace;">' +
          m.cmds.length + ' команд: ' + m.cmds[0].substring(0, 40) + '...</div>' +
          '</div>';
      }).join('') : '<div style="color:#4a6070;font-size:11px;text-align:center;padding:8px;">Немає власних макросів</div>');

    /* Обробники вбудованих макросів */
    macrosPanel.querySelectorAll('.mc-builtin').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var cmds = this.getAttribute('data-cmds').split('|||');
        runMacro(cmds);
        macrosPanel.style.display = 'none';
      });
    });

    /* Додати макрос */
    document.getElementById('mc-add').addEventListener('click', function() {
      var name = prompt('Назва макросу:');
      if (!name) return;
      var cmdsStr = prompt('Команди (по одній на рядок):');
      if (!cmdsStr) return;
      var cmds  = cmdsStr.split('\n').filter(function(c) { return c.trim(); });
      var macros = loadMacros();
      macros.push({ name: name, cmds: cmds });
      saveMacros(macros);
      renderMacros();
    });

    /* Запустити власний */
    macrosPanel.querySelectorAll('[data-mc-run]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx    = parseInt(this.getAttribute('data-mc-run'));
        var macros = loadMacros();
        if (macros[idx]) {
          runMacro(macros[idx].cmds);
          macrosPanel.style.display = 'none';
        }
      });
    });

    /* Видалити */
    macrosPanel.querySelectorAll('[data-mc-del]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx    = parseInt(this.getAttribute('data-mc-del'));
        var macros = loadMacros();
        macros.splice(idx, 1);
        saveMacros(macros);
        renderMacros();
      });
    });
  }

  function runMacro(cmds) {
    var idx = 0;
    function next() {
      if (idx >= cmds.length) return;
      var cmd = cmds[idx++];
      termInput.value = cmd;
      termInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      setTimeout(next, 800);
    }
    next();
  }

  /* ════════════════════════════════════════
     ФУНКЦІЇ ІСТОРІЇ
  ════════════════════════════════════════ */
  function renderHistory() {
    var h = loadHistory();
    historyPanel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
      '<span style="color:#5b9bd5;font-weight:700;font-size:12px;">📜 Історія команд</span>' +
      '<div style="display:flex;gap:6px;">' +
      '<input id="hist-search" type="text" placeholder="Пошук..." style="' +
      'background:#060d14;border:1px solid #1c2a37;color:#e6edf3;' +
      'padding:4px 8px;border-radius:4px;font-size:11px;width:120px;">' +
      '<button id="hist-clear" style="background:transparent;border:1px solid #e0665a44;' +
      'color:#e0665a;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:10px;">🗑️</button>' +
      '</div></div>' +
      '<div id="hist-list">' +
      (h.length ? h.slice().reverse().map(function(cmd, idx) {
        return '<div style="display:flex;align-items:center;gap:6px;padding:4px 0;' +
          'border-bottom:1px solid #1c2a37;">' +
          '<span style="font-size:11px;color:#c9e8d8;font-family:monospace;flex:1;' +
          'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + cmd + '</span>' +
          '<button data-hist="' + cmd.replace(/"/g, '&quot;') + '" style="' +
          'background:#5b9bd5;color:#fff;border:none;padding:2px 8px;' +
          'border-radius:3px;cursor:pointer;font-size:10px;flex-shrink:0;">▶</button>' +
          '</div>';
      }).join('') : '<div style="color:#4a6070;font-size:11px;text-align:center;padding:12px;">Порожня історія</div>') +
      '</div>';

    /* Пошук в історії */
    var histSearch = document.getElementById('hist-search');
    if (histSearch) {
      histSearch.addEventListener('input', function() {
        var q = this.value.toLowerCase();
        historyPanel.querySelectorAll('[data-hist]').forEach(function(btn) {
          var row = btn.parentNode;
          row.style.display = btn.getAttribute('data-hist').toLowerCase().includes(q) ? '' : 'none';
        });
      });
    }

    /* Очистити */
    var histClear = document.getElementById('hist-clear');
    if (histClear) {
      histClear.addEventListener('click', function() {
        if (confirm('Очистити всю історію?')) {
          saveHistory([]);
          historyList = [];
          renderHistory();
        }
      });
    }

    /* Клік по команді */
    historyPanel.querySelectorAll('[data-hist]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        termInput.value = this.getAttribute('data-hist');
        termInput.focus();
        historyPanel.style.display = 'none';
      });
    });
  }

  /* ════════════════════════════════════════
     LIVE МОНІТОРИНГ
  ════════════════════════════════════════ */
  var liveCommand = ':put [/system resource get cpu-load]; :put [/system resource get free-memory]; :put [/system resource get uptime]';

  document.getElementById('termpp-live-sel').addEventListener('change', function() {
    var interval = parseInt(this.value);
    clearInterval(liveTimer);
    liveActive = false;

    if (interval > 0) {
      liveActive = true;
      var statusEl = document.getElementById('termpp-live-status');
      statusEl.textContent = '🟢 Live';
      statusEl.style.color = '#5fd0a5';

      liveTimer = setInterval(function() {
        termInput.value = liveCommand;
        termInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      }, interval);
    } else {
      var statusEl = document.getElementById('termpp-live-status');
      statusEl.textContent = '';
    }
  });

  /* ════════════════════════════════════════
     ПЕРЕХОПЛЕННЯ ВВОДУ — ЗБЕРІГАЄМО ІСТОРІЮ
  ════════════════════════════════════════ */
  termInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      var cmd = this.value.trim();
      if (cmd) {
        /* Зберігаємо в localStorage */
        historyList = historyList.filter(function(c) { return c !== cmd; });
        historyList.push(cmd);
        if (historyList.length > MAX_HISTORY) historyList = historyList.slice(-MAX_HISTORY);
        saveHistory(historyList);
        historyIndex = -1;

        /* Оновлюємо лічильник */
        var info = document.getElementById('termpp-info');
        if (info) info.textContent = '📜 ' + historyList.length + ' команд';
      }
    }

    /* Стрілки вгору/вниз — навігація по історії */
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      var h = loadHistory();
      if (historyIndex === -1) historyIndex = h.length - 1;
      else if (historyIndex > 0) historyIndex--;
      if (h[historyIndex] !== undefined) this.value = h[historyIndex];
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      var h = loadHistory();
      if (historyIndex < h.length - 1) {
        historyIndex++;
        this.value = h[historyIndex];
      } else {
        historyIndex = -1;
        this.value   = '';
      }
    }
  });

  /* ════════════════════════════════════════
     КНОПКИ TOOLBAR
  ════════════════════════════════════════ */

  /* Пошук */
  document.getElementById('termpp-search-btn').addEventListener('click', function() {
    searchActive = !searchActive;
    searchBar.style.display = searchActive ? 'flex' : 'none';
    if (searchActive) document.getElementById('termpp-search-inp').focus();
  });

  document.getElementById('termpp-search-inp').addEventListener('input', function() {
    searchCurrent = 0;
    doSearch(this.value);
  });

  document.getElementById('termpp-search-prev').addEventListener('click', function() {
    var marks = termOutput.querySelectorAll('.termpp-hl');
    if (!marks.length) return;
    searchCurrent = (searchCurrent - 1 + marks.length) % marks.length;
    marks[searchCurrent].scrollIntoView({ block: 'center' });
    document.getElementById('termpp-search-count').textContent =
      (searchCurrent + 1) + ' / ' + marks.length;
  });

  document.getElementById('termpp-search-next').addEventListener('click', function() {
    var marks = termOutput.querySelectorAll('.termpp-hl');
    if (!marks.length) return;
    searchCurrent = (searchCurrent + 1) % marks.length;
    marks[searchCurrent].scrollIntoView({ block: 'center' });
    document.getElementById('termpp-search-count').textContent =
      (searchCurrent + 1) + ' / ' + marks.length;
  });

  document.getElementById('termpp-search-close').addEventListener('click', function() {
    searchActive = false;
    searchBar.style.display = 'none';
    doSearch('');
  });

  /* Копіювати */
  document.getElementById('termpp-copy-btn').addEventListener('click', function() {
    var text = termOutput.innerText;
    navigator.clipboard.writeText(text).then(function() {
      document.getElementById('termpp-copy-btn').textContent = '✅ Скопійовано';
      setTimeout(function() {
        document.getElementById('termpp-copy-btn').textContent = '📋 Копіювати';
      }, 1500);
    });
  });

  /* Очистити */
  document.getElementById('termpp-clear-btn').addEventListener('click', function() {
    termOutput.innerHTML = '';
  });

  /* Закладки */
  document.getElementById('termpp-bookmarks-btn').addEventListener('click', function() {
    var rect = this.getBoundingClientRect();
    bookmarksPanel.style.left = rect.left + 'px';
    bookmarksPanel.style.top  = (rect.bottom + 4) + 'px';
    var isOpen = bookmarksPanel.style.display !== 'none';
    closeAllPanels();
    if (!isOpen) { renderBookmarks(); bookmarksPanel.style.display = 'block'; }
  });

  /* Макроси */
  document.getElementById('termpp-macros-btn').addEventListener('click', function() {
    var rect = this.getBoundingClientRect();
    macrosPanel.style.left = rect.left + 'px';
    macrosPanel.style.top  = (rect.bottom + 4) + 'px';
    var isOpen = macrosPanel.style.display !== 'none';
    closeAllPanels();
    if (!isOpen) { renderMacros(); macrosPanel.style.display = 'block'; }
  });

  /* Історія */
  document.getElementById('termpp-history-btn').addEventListener('click', function() {
    var rect = this.getBoundingClientRect();
    historyPanel.style.left = rect.left + 'px';
    historyPanel.style.top  = (rect.bottom + 4) + 'px';
    var isOpen = historyPanel.style.display !== 'none';
    closeAllPanels();
    if (!isOpen) { renderHistory(); historyPanel.style.display = 'block'; }
  });

  function closeAllPanels() {
    bookmarksPanel.style.display = 'none';
    macrosPanel.style.display    = 'none';
    historyPanel.style.display   = 'none';
  }

  /* Клік поза панелями — закриваємо */
  document.addEventListener('click', function(e) {
    if (!bookmarksPanel.contains(e.target) && e.target.id !== 'termpp-bookmarks-btn') bookmarksPanel.style.display = 'none';
    if (!macrosPanel.contains(e.target)    && e.target.id !== 'termpp-macros-btn')    macrosPanel.style.display    = 'none';
    if (!historyPanel.contains(e.target)   && e.target.id !== 'termpp-history-btn')   historyPanel.style.display   = 'none';
  });

  /* ════════════════════════════════════════
     ГАРЯЧІ КЛАВІШІ
  ════════════════════════════════════════ */
  document.addEventListener('keydown', function(e) {
    /* Ctrl+F — пошук */
    if (e.ctrlKey && e.key === 'f' && termOutput.closest('#topo-modal') === null) {
      var termVisible = termOutput.offsetParent !== null;
      if (termVisible) {
        e.preventDefault();
        searchActive = !searchActive;
        searchBar.style.display = searchActive ? 'flex' : 'none';
        if (searchActive) document.getElementById('termpp-search-inp').focus();
      }
    }
    /* Escape — закрити пошук */
    if (e.key === 'Escape') {
      searchActive = false;
      searchBar.style.display = 'none';
      doSearch('');
      closeAllPanels();
    }
  });

  /* ════════════════════════════════════════
     ІНІЦІАЛІЗАЦІЯ
  ════════════════════════════════════════ */
  var info = document.getElementById('termpp-info');
  if (info) info.textContent = '📜 ' + historyList.length + ' команд';

  console.log('[terminal++] v1 ready | Історія: ' + historyList.length + ' команд');
}

})();