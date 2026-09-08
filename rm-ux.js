'use strict';

/* ============================================================
   RM UX — Пріоритет 4
   Global Search + Bulk + DragDrop + Shortcuts + Breadcrumbs
   
   БЕЗПЕКА: жоден код не виконується до виклику _rmUXInit()
   _rmUXInit() викликається з openManager() в router-manager.js
   ============================================================ */

(function() {

  /* ── Стан ── */
  var _initialized   = false;
  var _searchTimer   = null;
  var _searchIdx     = -1;
  var _breadHistory  = [];

  /* ── Хелпери ── */
  function esc(s) {
    return window.RMEsc ? window.RMEsc(s) : String(s||'')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function $(id)  { return document.getElementById(id); }
  function S()    { return window.RMStore; }
  function router(){ return S() ? S().getRouter() : null; }

  /* ══════════════════════════════════════════════════════════
     STYLES — вставляємо один раз
     ══════════════════════════════════════════════════════════ */
  function injectStyles() {
    if ($('rm-ux-styles')) return;
    var el = document.createElement('style');
    el.id  = 'rm-ux-styles';
    el.textContent = [

      /* ── Пошук ── */
      '#rm-search-wrap{padding:6px 8px 2px;position:relative;}',
      '#rm-search-input{width:100%;box-sizing:border-box;background:#0d1821;',
        'border:1px solid #2a3b48;border-radius:7px;color:#e6edf3;',
        'padding:7px 10px 7px 28px;font-size:11px;outline:none;',
        'transition:border-color .2s;}',
      '#rm-search-input:focus{border-color:#5fd0a5;}',
      '#rm-search-icon{position:absolute;left:18px;top:50%;',
        'transform:translateY(-50%);font-size:12px;color:#4a6070;',
        'pointer-events:none;}',
      '#rm-search-results{position:absolute;top:calc(100% - 2px);left:8px;right:8px;',
        'background:#111d27;border:1px solid #2a3b48;border-radius:8px;',
        'z-index:999999;max-height:360px;overflow-y:auto;',
        'box-shadow:0 8px 32px rgba(0,0,0,.6);display:none;}',
      '#rm-search-results.open{display:block;}',
      '.rm-sr-group{padding:5px 12px 3px;font-size:10px;color:#4a6070;',
        'text-transform:uppercase;letter-spacing:.08em;',
        'border-top:1px solid #1a2d3d;}',
      '.rm-sr-group:first-child{border-top:none;}',
      '.rm-sr-item{padding:7px 12px;display:flex;align-items:center;gap:8px;',
        'cursor:pointer;font-size:12px;color:#e6edf3;transition:background .1s;}',
      '.rm-sr-item:hover,.rm-sr-item.sel{background:#1a2d3d;}',
      '.rm-sr-icon{font-size:13px;flex-shrink:0;}',
      '.rm-sr-title{font-weight:600;font-size:12px;}',
      '.rm-sr-sub{font-size:10px;color:#8ea3b0;margin-top:1px;}',
      '.rm-sr-nav{font-size:10px;color:#4a6070;margin-left:auto;flex-shrink:0;}',
      '.rm-sr-hl{color:#5fd0a5;font-weight:700;}',
      '.rm-sr-empty{padding:16px;text-align:center;color:#4a6070;font-size:12px;}',

      /* ── Quick Toolbar ── */
      '#rm-quick-bar{display:flex;align-items:center;gap:4px;flex-wrap:wrap;',
        'padding:5px 10px;background:#0a1520;border-bottom:1px solid #1a2d3d;}',
      '.rm-qb-btn{padding:3px 8px;border-radius:5px;border:1px solid #2a3b48;',
        'background:#111d27;color:#8ea3b0;font-size:10px;cursor:pointer;',
        'white-space:nowrap;transition:all .15s;}',
      '.rm-qb-btn:hover{border-color:#5fd0a5;color:#5fd0a5;background:#0d2a1a;}',

      /* ── Breadcrumbs ── */
      '#rm-breadcrumbs{display:flex;align-items:center;gap:5px;',
        'padding:4px 12px;font-size:10px;color:#4a6070;',
        'border-bottom:1px solid #1a2d3d;flex-wrap:wrap;min-height:24px;}',
      '.rm-bc-item{color:#8ea3b0;cursor:pointer;padding:1px 3px;',
        'border-radius:3px;transition:color .15s;}',
      '.rm-bc-item:hover{color:#5fd0a5;}',
      '.rm-bc-item.cur{color:#e6edf3;font-weight:600;cursor:default;}',
      '.rm-bc-sep{color:#2a3b48;}',

      /* ── Bulk bar ── */
      '.rm-bulk-bar{display:none;align-items:center;gap:8px;',
        'padding:7px 12px;background:#0d2a1a;border:1px solid #2f7a5c;',
        'border-radius:7px;margin-bottom:10px;font-size:12px;}',
      '.rm-bulk-bar.on{display:flex;}',
      '.rm-bulk-cnt{color:#5fd0a5;font-weight:600;}',
      '.rm-bulk-acts{display:flex;gap:5px;margin-left:auto;}',
      '.rm-bb{padding:3px 9px;border-radius:5px;border:1px solid;',
        'cursor:pointer;font-size:11px;font-weight:600;transition:all .15s;}',
      '.rm-bb-del{color:#e05252;border-color:#b04040;background:#1a0a0a;}',
      '.rm-bb-del:hover{background:#e05252;color:#fff;}',
      '.rm-bb-off{color:#f0a840;border-color:#a06020;background:#1a1200;}',
      '.rm-bb-off:hover{background:#f0a840;color:#fff;}',
      '.rm-bb-on{color:#5fd0a5;border-color:#2f7a5c;background:#0d1a10;}',
      '.rm-bb-on:hover{background:#5fd0a5;color:#fff;}',
      '.rm-bb-clr{color:#8ea3b0;border-color:#2a3b48;background:#0d1821;}',
      '.rm-row-ck{width:16px;height:16px;cursor:pointer;accent-color:#5fd0a5;}',
      '.rm-all-ck{width:16px;height:16px;cursor:pointer;accent-color:#5fd0a5;}',
      'tr.rm-sel td{background:rgba(95,208,165,.06)!important;}',

      /* ── Drag & Drop ── */
      '.rm-dh{color:#2a3b48;font-size:14px;cursor:grab;padding:0 3px;',
        'user-select:none;transition:color .15s;}',
      '.rm-dh:hover{color:#5fd0a5;}',
      'tr.rm-drag-over td{border-top:2px solid #5fd0a5!important;}',
      'tr.rm-dragging{opacity:.35;}',

      /* ── Shortcuts modal ── */
      '#rm-kbd-modal{position:fixed;inset:0;background:rgba(0,0,0,.7);',
        'z-index:9999999;display:none;align-items:center;justify-content:center;}',
      '#rm-kbd-modal.open{display:flex;}',
      '#rm-kbd-box{background:#111d27;border:1px solid #2a3b48;border-radius:12px;',
        'padding:22px 26px;min-width:340px;box-shadow:0 16px 64px rgba(0,0,0,.7);}',
      '.rm-kbd-row{display:flex;align-items:center;justify-content:space-between;',
        'padding:6px 0;border-bottom:1px solid #1a2d3d;font-size:12px;}',
      '.rm-kbd-row:last-child{border-bottom:none;}',
      '.rm-kbd-key{display:inline-block;background:#0d1821;border:1px solid #2a3b48;',
        'border-radius:4px;padding:1px 6px;font-size:11px;font-family:monospace;',
        'color:#5fd0a5;min-width:24px;text-align:center;}',

      /* ── Fade animation ── */
      '@keyframes rm-ux-fade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}',
      '.rm-ux-fade{animation:rm-ux-fade .2s ease;}',

    ].join('');
    document.head.appendChild(el);
  }

  /* ══════════════════════════════════════════════════════════
     ГОЛОВНА ІНІЦІАЛІЗАЦІЯ — викликається з openManager()
     ══════════════════════════════════════════════════════════ */
  window._rmUXInit = function() {
    if (_initialized) return;

    injectStyles();

    var overlay = $('rm-overlay');
    if (!overlay) return;

    /* ── Знаходимо sidebar і content ── */
    var sidebar = findSidebar(overlay);
    var content = $('rm-content');

    /* ── Пошук ── */
    if (sidebar && !$('rm-search-wrap')) {
      var wrap = document.createElement('div');
      wrap.id  = 'rm-search-wrap';
      wrap.innerHTML =
        '<span id="rm-search-icon">🔍</span>' +
        '<input id="rm-search-input" type="text" placeholder="Пошук... (Ctrl+K)" autocomplete="off">' +
        '<div id="rm-search-results"></div>';
      /* Вставляємо як ПЕРШИЙ дочірній елемент sidebar */
      sidebar.insertBefore(wrap, sidebar.firstChild);
      bindSearch();
    }

    /* ── Breadcrumbs ── */
    if (content && !$('rm-breadcrumbs')) {
      var bread = document.createElement('div');
      bread.id  = 'rm-breadcrumbs';
      content.parentNode.insertBefore(bread, content);
    }

    /* ── Quick Toolbar ── */
    if (content && !$('rm-quick-bar')) {
      var bar = document.createElement('div');
      bar.id  = 'rm-quick-bar';
      bar.innerHTML =
        qbBtn('📊','Dash',   'dashboard')   +
        qbBtn('🌐','Ifaces', 'interfaces')  +
        qbBtn('📋','IP',     'ip-addresses')+
        qbBtn('📡','DHCP',   'ip-dhcp')     +
        qbBtn('🔥','FW',     'fw-filter')   +
        qbBtn('📈','Traffic','traffic')     +
        qbBtn('🔑','PPP',    'ppp-secrets') +
        qbBtn('⚙️','Sys',    'sys-resources')+
        '<span style="margin-left:auto;">' +
          '<button class="rm-qb-btn" onclick="window._rmShowKbd()" title="Shortcuts">⌨️</button>' +
        '</span>';
      content.parentNode.insertBefore(bar, content);
    }

    /* ── Shortcuts modal ── */
    if (!$('rm-kbd-modal')) {
      buildKbdModal();
    }

    /* ── Patch __rmSetMenu ── */
    patchSetMenu();

    /* ── Section fade ── */
    initFade();

    _initialized = true;
    console.log('[RM UX] ініціалізовано!');
  };

  /* ══════════════════════════════════════════════════════════
     ПОШУК
     ══════════════════════════════════════════════════════════ */
  function bindSearch() {
    var input   = $('rm-search-input');
    var results = $('rm-search-results');
    if (!input || !results) return;

    input.addEventListener('input', function() {
      clearTimeout(_searchTimer);
      _searchTimer = setTimeout(function() { runSearch(input.value.trim()); }, 220);
    });

    input.addEventListener('keydown', function(e) {
      var items = results.querySelectorAll('.rm-sr-item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        _searchIdx = Math.min(_searchIdx + 1, items.length - 1);
        markActive(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        _searchIdx = Math.max(_searchIdx - 1, 0);
        markActive(items);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        var sel = results.querySelector('.rm-sr-item.sel');
        if (sel) sel.click();
      } else if (e.key === 'Escape') {
        closeResults();
        input.blur();
      }
    });

    document.addEventListener('click', function(e) {
      var wrap = $('rm-search-wrap');
      if (wrap && !wrap.contains(e.target)) closeResults();
    });
  }

  function closeResults() {
    var r = $('rm-search-results');
    if (r) r.classList.remove('open');
    _searchIdx = -1;
  }

  function markActive(items) {
    items.forEach(function(item, i) {
      item.classList.toggle('sel', i === _searchIdx);
      if (i === _searchIdx) item.scrollIntoView({ block: 'nearest' });
    });
  }

  function runSearch(q) {
    var results = $('rm-search-results');
    if (!results) return;
    if (!q) { closeResults(); return; }

    var ql  = q.toLowerCase();
    var out = '';
    var cnt = 0;

    /* Меню */
    var menuHits = MENUS.filter(function(m) {
      return m.label.toLowerCase().includes(ql);
    });
    if (menuHits.length) {
      out += '<div class="rm-sr-group">📋 Меню</div>';
      menuHits.forEach(function(m) {
        out += srItem(m.icon, m.label, '', m.id, ql);
        cnt++;
      });
    }

    /* DataStore кеш */
    var r = router();
    if (r && S() && S()._cache) {
      var cache = S()._cache[r.id] || {};

      [
        { key: 'interfaces',  icon: '🔌', label: 'name',    sub: 'mac-address', menu: 'interfaces' },
        { key: 'addresses',   icon: '📍', label: 'address', sub: 'interface',   menu: 'ip-addresses' },
        { key: 'dhcpLeases',  icon: '💻', label: 'address', sub: 'host-name',   menu: 'ip-dhcp' },
        { key: 'fwFilter',    icon: '🔥', label: 'chain',   sub: 'comment',     menu: 'fw-filter' },
        { key: 'pppSecrets',  icon: '🔑', label: 'name',    sub: 'service',     menu: 'ppp-secrets' },
      ].forEach(function(cfg) {
        if (!cache[cfg.key]) return;
        var hits = cache[cfg.key].filter(function(obj) {
          return JSON.stringify(obj).toLowerCase().includes(ql);
        }).slice(0, 4);
        if (!hits.length) return;
        out += '<div class="rm-sr-group">' + cfg.icon + ' ' + cfg.key + '</div>';
        hits.forEach(function(obj) {
          out += srItem(cfg.icon, obj[cfg.label]||'', obj[cfg.sub]||'', cfg.menu, ql);
          cnt++;
        });
      });
    }

    if (!cnt) {
      out = '<div class="rm-sr-empty">😕 Нічого не знайдено для «' + esc(q) + '»</div>';
    }

    results.innerHTML = out;
    results.classList.add('open');
    _searchIdx = -1;

    results.querySelectorAll('.rm-sr-item').forEach(function(item) {
      item.addEventListener('click', function() {
        var menu = item.dataset.menu;
        if (menu && window.__rmSetMenu) window.__rmSetMenu(menu);
        closeResults();
        var inp = $('rm-search-input');
        if (inp) inp.value = '';
      });
    });
  }

  function srItem(icon, title, sub, menu, q) {
    return '<div class="rm-sr-item" data-menu="' + esc(menu) + '">' +
      '<span class="rm-sr-icon">' + icon + '</span>' +
      '<div style="flex:1;">' +
        '<div class="rm-sr-title">' + hl(title, q) + '</div>' +
        (sub ? '<div class="rm-sr-sub">' + hl(sub, q) + '</div>' : '') +
      '</div>' +
      '<span class="rm-sr-nav">→ ' + esc(menu) + '</span>' +
    '</div>';
  }

  function hl(text, q) {
    if (!q || !text) return esc(text);
    var lo  = text.toLowerCase();
    var idx = lo.indexOf(q.toLowerCase());
    if (idx < 0) return esc(text);
    return esc(text.slice(0, idx)) +
      '<span class="rm-sr-hl">' + esc(text.slice(idx, idx + q.length)) + '</span>' +
      esc(text.slice(idx + q.length));
  }

  /* ══════════════════════════════════════════════════════════
     BREADCRUMBS
     ══════════════════════════════════════════════════════════ */
  function updateBreadcrumbs(menu) {
    var el = $('rm-breadcrumbs');
    if (!el) return;

    if (_breadHistory[_breadHistory.length - 1] !== menu) {
      _breadHistory.push(menu);
      if (_breadHistory.length > 6) _breadHistory.shift();
    }

    var label = (MENUS.find(function(m) { return m.id === menu; }) || {}).label || menu;
    var html  = '';

    if (_breadHistory.length > 1) {
      var prev = _breadHistory[_breadHistory.length - 2];
      var prevLabel = (MENUS.find(function(m) { return m.id === prev; }) || {}).label || prev;
      html += '<span class="rm-bc-item" onclick="window.__rmSetMenu(\'' + esc(prev) + '\')">← ' + esc(prevLabel) + '</span>';
      html += '<span class="rm-bc-sep">›</span>';
    }

    html += '<span class="rm-bc-item cur">' + esc(label) + '</span>';

    el.innerHTML = html;
  }

  /* ══════════════════════════════════════════════════════════
     BULK ОПЕРАЦІЇ
     ══════════════════════════════════════════════════════════ */
  window.rmEnableBulk = function(tableEl, apiPath, onDone) {
    if (!tableEl) return;
    var r = router();
    if (!r) return;

    /* Bulk bar */
    var bar = document.createElement('div');
    bar.className = 'rm-bulk-bar';
    bar.innerHTML =
      '<span class="rm-bulk-cnt" id="rm-bcnt">0 вибрано</span>' +
      '<div class="rm-bulk-acts">' +
        '<button class="rm-bb rm-bb-on"  onclick="_rmBulkDo(\'enable\')">▶ Увімкнути</button>' +
        '<button class="rm-bb rm-bb-off" onclick="_rmBulkDo(\'disable\')">‖ Вимкнути</button>' +
        '<button class="rm-bb rm-bb-del" onclick="_rmBulkDo(\'delete\')">🗑 Видалити</button>' +
        '<button class="rm-bb rm-bb-clr" onclick="_rmBulkClear()">✕</button>' +
      '</div>';
    tableEl.parentNode.insertBefore(bar, tableEl);

    /* Check-all в header */
    var hdr = tableEl.querySelector('tr');
    if (hdr) {
      var th = document.createElement('th');
      th.style.width = '26px';
      th.innerHTML = '<input type="checkbox" class="rm-all-ck" onchange="_rmBulkAll(this,tbl)">';
      hdr.insertBefore(th, hdr.firstChild);
    }

    /* Чекбокси в рядках */
    var tbl = tableEl;
    tableEl.querySelectorAll('tr:not(:first-child)').forEach(function(row) {
      var td = document.createElement('td');
      td.innerHTML = '<input type="checkbox" class="rm-row-ck" value="' + esc(row.dataset.id||'') + '" onchange="_rmBulkUpd()">';
      row.insertBefore(td, row.firstChild);
    });

    function checked() {
      return Array.from(tbl.querySelectorAll('.rm-row-ck:checked'));
    }

    window._rmBulkUpd = function() {
      var cnt = checked().length;
      var cntEl = $('rm-bcnt');
      if (cntEl) cntEl.textContent = cnt + ' вибрано';
      bar.classList.toggle('on', cnt > 0);
      tbl.querySelectorAll('.rm-row-ck').forEach(function(cb) {
        var row = cb.closest('tr');
        if (row) row.classList.toggle('rm-sel', cb.checked);
      });
    };

    window._rmBulkAll = function(cb) {
      tbl.querySelectorAll('.rm-row-ck').forEach(function(c) { c.checked = cb.checked; });
      window._rmBulkUpd();
    };

    window._rmBulkClear = function() {
      tbl.querySelectorAll('.rm-row-ck').forEach(function(c) { c.checked = false; });
      var allCk = tbl.querySelector('.rm-all-ck');
      if (allCk) allCk.checked = false;
      window._rmBulkUpd();
    };

    window._rmBulkDo = function(action) {
      var ids = checked().map(function(cb) { return cb.value; }).filter(Boolean);
      if (!ids.length) return;
      if (action === 'delete' && !confirm('Видалити ' + ids.length + ' записів?')) return;

      Promise.all(ids.map(function(id) {
        if (action === 'delete')  return window.RMRestCall(r, 'DELETE', apiPath + '/' + id, null);
        if (action === 'disable') return window.RMRestCall(r, 'PATCH',  apiPath + '/' + id, { disabled: 'yes' });
        if (action === 'enable')  return window.RMRestCall(r, 'PATCH',  apiPath + '/' + id, { disabled: 'no' });
        return Promise.resolve();
      })).then(function() {
        window._rmBulkClear();
        if (typeof onDone === 'function') onDone();
      });
    };
  };

  /* ══════════════════════════════════════════════════════════
     DRAG & DROP
     ══════════════════════════════════════════════════════════ */
  window.rmEnableDragDrop = function(tableEl, apiPath, onReorder) {
    if (!tableEl) return;
    var r   = router();
    var src = null;

    tableEl.querySelectorAll('tr:not(:first-child)').forEach(function(row) {
      /* Handle */
      var td = document.createElement('td');
      td.innerHTML = '<span class="rm-dh" title="Перетягни">⠿</span>';
      row.insertBefore(td, row.firstChild);

      row.draggable = true;

      row.addEventListener('dragstart', function(e) {
        src = row;
        row.classList.add('rm-dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      row.addEventListener('dragend', function() {
        row.classList.remove('rm-dragging');
        tableEl.querySelectorAll('tr').forEach(function(tr) {
          tr.classList.remove('rm-drag-over');
        });
      });

      row.addEventListener('dragover', function(e) {
        e.preventDefault();
        if (src && src !== row) {
          tableEl.querySelectorAll('tr').forEach(function(tr) { tr.classList.remove('rm-drag-over'); });
          row.classList.add('rm-drag-over');
        }
      });

      row.addEventListener('drop', function(e) {
        e.preventDefault();
        if (!src || src === row) return;
        row.classList.remove('rm-drag-over');

        var rows = Array.from(tableEl.querySelectorAll('tr:not(:first-child)'));
        var si   = rows.indexOf(src);
        var di   = rows.indexOf(row);

        if (si < di) row.parentNode.insertBefore(src, row.nextSibling);
        else         row.parentNode.insertBefore(src, row);

        /* API move */
        if (r && apiPath && src.dataset.id) {
          var body = { destination: row.dataset.id || '' };
          window.RMRestCall(r, 'POST', apiPath + '/move', {
            numbers: src.dataset.id,
            destination: row.dataset.id
          }).catch(function() {});
        }

        if (typeof onReorder === 'function') onReorder(src, row, si, di);
        src = null;
      });
    });
  };

  /* ══════════════════════════════════════════════════════════
     KEYBOARD SHORTCUTS
     ══════════════════════════════════════════════════════════ */
  function buildKbdModal() {
    var modal = document.createElement('div');
    modal.id  = 'rm-kbd-modal';

    var shortcuts = [
      ['Ctrl+K',  'Глобальний пошук'],
      ['Ctrl+R',  'Оновити секцію'],
      ['Ctrl+D',  'Dashboard'],
      ['Ctrl+T',  'Traffic Monitor'],
      ['Ctrl+F',  'Firewall'],
      ['Ctrl+I',  'Interfaces'],
      ['Ctrl+H',  'DHCP'],
      ['Esc',     'Закрити пошук'],
      ['?',       'Ця довідка'],
    ];

    var rows = shortcuts.map(function(s) {
      var keys = s[0].split('+').map(function(k) {
        return '<span class="rm-kbd-key">' + k + '</span>';
      }).join(' + ');
      return '<div class="rm-kbd-row"><span>' + s[1] + '</span><span>' + keys + '</span></div>';
    }).join('');

    modal.innerHTML =
      '<div id="rm-kbd-box">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">' +
          '<div style="font-size:14px;font-weight:700;color:#e6edf3;">⌨️ Shortcuts</div>' +
          '<button onclick="window._rmHideKbd()" style="background:none;border:none;color:#8ea3b0;font-size:18px;cursor:pointer;">✕</button>' +
        '</div>' +
        rows +
      '</div>';

    document.body.appendChild(modal);
    modal.addEventListener('click', function(e) {
      if (e.target === modal) window._rmHideKbd();
    });
  }

  window._rmShowKbd = function() {
    var m = $('rm-kbd-modal');
    if (m) m.classList.add('open');
  };
  window._rmHideKbd = function() {
    var m = $('rm-kbd-modal');
    if (m) m.classList.remove('open');
  };

  /* ── Keyboard listeners — завжди активні ── */
  document.addEventListener('keydown', function(e) {
    var tag = ((document.activeElement || {}).tagName || '').toUpperCase();
    var inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

    /* Ctrl+K — пошук */
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      var inp = $('rm-search-input');
      if (inp) { inp.focus(); inp.select(); }
      return;
    }

    /* Ctrl+R — оновити */
    if (e.ctrlKey && e.key === 'r') {
      e.preventDefault();
      if (window.__rmRefreshSection) window.__rmRefreshSection();
      return;
    }

    if (inInput) return;

    /* Навігація */
    var nav = { d:'dashboard', t:'traffic', f:'fw-filter', i:'interfaces', h:'ip-dhcp' };
    if (e.ctrlKey && nav[e.key]) {
      e.preventDefault();
      if (window.__rmSetMenu) window.__rmSetMenu(nav[e.key]);
      return;
    }

    /* ? — shortcuts */
    if (e.key === '?') { window._rmShowKbd(); return; }

    /* Esc — закрити пошук і modal */
    if (e.key === 'Escape') {
      closeResults();
      window._rmHideKbd();
    }
  });

  /* ══════════════════════════════════════════════════════════
     PATCH __rmSetMenu
     ══════════════════════════════════════════════════════════ */
  function patchSetMenu() {
    var orig = window.__rmSetMenu;
    if (!orig || orig._uxOk) return;

    window.__rmSetMenu = function(menu) {
      orig(menu);
      /* Breadcrumbs з невеликою затримкою */
      setTimeout(function() { updateBreadcrumbs(menu); }, 80);
    };
    window.__rmSetMenu._uxOk = true;
  }

  /* ══════════════════════════════════════════════════════════
     FADE для rm-content
     ══════════════════════════════════════════════════════════ */
  function initFade() {
    var content = $('rm-content');
    if (!content || content._rmFadeObs) return;

    var obs = new MutationObserver(function(muts) {
      muts.forEach(function(m) {
        m.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) {
            node.classList.add('rm-ux-fade');
          }
        });
      });
    });
    obs.observe(content, { childList: true });
    content._rmFadeObs = obs;
  }

  /* ══════════════════════════════════════════════════════════
     УТИЛІТИ
     ══════════════════════════════════════════════════════════ */
  function findSidebar(overlay) {
    /* Шукаємо div що містить [data-id] елементи */
    var divs = overlay.querySelectorAll('div');
    for (var i = 0; i < divs.length; i++) {
      if (divs[i].querySelector('[data-id]')) return divs[i];
    }
    return null;
  }

  function qbBtn(icon, label, menu) {
    return '<button class="rm-qb-btn" onclick="window.__rmSetMenu(\'' + menu + '\')">' +
      icon + ' ' + label + '</button>';
  }

  /* ── Список меню для пошуку ── */
  var MENUS = [
    { id:'dashboard',      icon:'📊', label:'Dashboard' },
    { id:'traffic',        icon:'📈', label:'Traffic Monitor' },
    { id:'interfaces',     icon:'🌐', label:'Interfaces' },
    { id:'ip-addresses',   icon:'📋', label:'IP Addresses' },
    { id:'ip-routes',      icon:'🛣️', label:'Routes' },
    { id:'ip-dhcp',        icon:'📡', label:'DHCP' },
    { id:'fw-filter',      icon:'🔥', label:'Firewall Filter' },
    { id:'fw-nat',         icon:'🔀', label:'NAT' },
    { id:'fw-mangle',      icon:'⚡', label:'Mangle' },
    { id:'fw-address-list',icon:'📋', label:'Address Lists' },
    { id:'queues-simple',  icon:'📊', label:'Queues Simple' },
    { id:'ppp-secrets',    icon:'🔑', label:'PPP Secrets' },
    { id:'wl-interfaces',  icon:'📶', label:'Wireless' },
    { id:'wireguard',      icon:'🔐', label:'WireGuard' },
    { id:'ipv6',           icon:'🌐', label:'IPv6' },
    { id:'certificates',   icon:'🏅', label:'Certificates' },
    { id:'netwatch',       icon:'👁', label:'Netwatch' },
    { id:'snmp',           icon:'📊', label:'SNMP' },
    { id:'logging',        icon:'📋', label:'Logging' },
    { id:'capsman',        icon:'📡', label:'CAPsMAN' },
    { id:'notifications',  icon:'🔔', label:'Notifications' },
    { id:'sys-resources',  icon:'⚙️', label:'System' },
    { id:'terminal',       icon:'💻', label:'Terminal SSH' },
    { id:'neighbors',      icon:'🔭', label:'Neighbors' },
  ];

  /* ── Скидаємо _initialized при закритті менеджера ── */
  document.addEventListener('click', function(e) {
    var closeBtn = e.target.closest('[onclick*="closeManager"], .rm-close-btn');
    if (closeBtn) {
      _initialized = false;
      _breadHistory = [];
    }
  });

  console.log('[RM UX] завантажено — очікуємо openManager()');

})();