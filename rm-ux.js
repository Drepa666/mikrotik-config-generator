'use strict';

/* ============================================================
   RM UX v2 — БЕЗПЕЧНА версія
   НЕ чіпає sidebar, НЕ вставляє елементи до openManager
   ============================================================ */

(function() {

  var _ready = false;

  function esc(s) {
    return String(s||'')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* ══════════════════════════════════════════════════════════
     STYLES
     ══════════════════════════════════════════════════════════ */
  function injectStyles() {
    if (document.getElementById('rm-ux-styles')) return;
    var el = document.createElement('style');
    el.id  = 'rm-ux-styles';
    el.textContent =
      /* Quick bar */
      '#rm-quick-bar{display:flex;align-items:center;gap:4px;flex-wrap:wrap;' +
        'padding:5px 10px;background:#0a1520;border-bottom:1px solid #1a2d3d;' +
        'position:sticky;top:0;z-index:100;}' +
      '.rm-qb-btn{padding:3px 8px;border-radius:5px;border:1px solid #2a3b48;' +
        'background:#111d27;color:#8ea3b0;font-size:10px;cursor:pointer;' +
        'white-space:nowrap;transition:all .15s;}' +
      '.rm-qb-btn:hover{border-color:#5fd0a5;color:#5fd0a5;background:#0d2a1a;}' +
      /* Search */
      '#rm-search-wrap{padding:4px 8px 0;position:relative;}' +
      '#rm-search-input{width:100%;box-sizing:border-box;background:#0d1821;' +
        'border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;' +
        'padding:6px 10px 6px 26px;font-size:11px;outline:none;}' +
      '#rm-search-input:focus{border-color:#5fd0a5;}' +
      '#rm-search-icon{position:absolute;left:16px;top:50%;' +
        'transform:translateY(-50%);font-size:11px;color:#4a6070;pointer-events:none;}' +
      '#rm-search-drop{position:absolute;top:100%;left:8px;right:8px;' +
        'background:#111d27;border:1px solid #2a3b48;border-radius:8px;' +
        'z-index:999999;max-height:320px;overflow-y:auto;' +
        'box-shadow:0 8px 24px rgba(0,0,0,.6);display:none;}' +
      '#rm-search-drop.open{display:block;}' +
      '.rm-sd-grp{padding:4px 10px 2px;font-size:10px;color:#4a6070;' +
        'text-transform:uppercase;border-top:1px solid #1a2d3d;}' +
      '.rm-sd-grp:first-child{border-top:none;}' +
      '.rm-sd-row{padding:6px 10px;display:flex;align-items:center;gap:8px;' +
        'cursor:pointer;font-size:11px;color:#e6edf3;}' +
      '.rm-sd-row:hover,.rm-sd-row.sel{background:#1a2d3d;}' +
      '.rm-sd-hl{color:#5fd0a5;font-weight:700;}' +
      '.rm-sd-sub{font-size:10px;color:#8ea3b0;}' +
      '.rm-sd-empty{padding:14px;text-align:center;color:#4a6070;font-size:11px;}' +
      /* Kbd modal */
      '#rm-kbd-modal{position:fixed;inset:0;background:rgba(0,0,0,.7);' +
        'z-index:9999999;display:none;align-items:center;justify-content:center;}' +
      '#rm-kbd-modal.open{display:flex;}' +
      '#rm-kbd-box{background:#111d27;border:1px solid #2a3b48;border-radius:12px;' +
        'padding:20px 24px;min-width:320px;box-shadow:0 16px 64px rgba(0,0,0,.7);}' +
      '.rm-kbd-row{display:flex;align-items:center;justify-content:space-between;' +
        'padding:6px 0;border-bottom:1px solid #1a2d3d;font-size:12px;color:#e6edf3;}' +
      '.rm-kbd-row:last-child{border-bottom:none;}' +
      '.rm-kbd-key{display:inline-block;background:#0d1821;border:1px solid #2a3b48;' +
        'border-radius:4px;padding:1px 6px;font-size:11px;font-family:monospace;' +
        'color:#5fd0a5;}' +
      /* Bulk */
      '.rm-bulk-bar{display:none;align-items:center;gap:8px;padding:6px 12px;' +
        'background:#0d2a1a;border:1px solid #2f7a5c;border-radius:7px;' +
        'margin-bottom:10px;font-size:12px;}' +
      '.rm-bulk-bar.on{display:flex;}' +
      '.rm-bulk-cnt{color:#5fd0a5;font-weight:600;}' +
      '.rm-bb{padding:3px 8px;border-radius:5px;border:1px solid;' +
        'cursor:pointer;font-size:11px;font-weight:600;transition:all .15s;}' +
      '.rm-bb-del{color:#e05252;border-color:#b04040;background:#1a0a0a;}' +
      '.rm-bb-del:hover{background:#e05252;color:#fff;}' +
      '.rm-bb-off{color:#f0a840;border-color:#a06020;background:#1a1200;}' +
      '.rm-bb-off:hover{background:#f0a840;color:#fff;}' +
      '.rm-bb-on{color:#5fd0a5;border-color:#2f7a5c;background:#0d1a10;}' +
      '.rm-bb-on:hover{background:#5fd0a5;color:#fff;}' +
      '.rm-bb-clr{color:#8ea3b0;border-color:#2a3b48;background:#0d1821;}' +
      'tr.rm-sel td{background:rgba(95,208,165,.06)!important;}' +
      '.rm-dh{color:#2a3b48;cursor:grab;padding:0 3px;user-select:none;}' +
      '.rm-dh:hover{color:#5fd0a5;}' +
      'tr.rm-drag-over td{border-top:2px solid #5fd0a5!important;}' +
      'tr.rm-dragging{opacity:.35;}' +
      '@keyframes rm-ux-fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}' +
      '.rm-ux-fade{animation:rm-ux-fade .2s ease;}';
    document.head.appendChild(el);
  }

  /* ══════════════════════════════════════════════════════════
     INIT — викликається з openManager()
     ══════════════════════════════════════════════════════════ */
  window._rmUXInit = function() {
    if (_ready) return;
    injectStyles();

    var overlay = document.getElementById('rm-overlay');
    if (!overlay) return;

    var content = document.getElementById('rm-content');
    if (!content) return;

    /* ── Quick Bar — вставляємо ПЕРЕД rm-content ── */
    if (!document.getElementById('rm-quick-bar')) {
      var bar = document.createElement('div');
      bar.id  = 'rm-quick-bar';
      bar.innerHTML =
        qbBtn('📊','Dash',    'dashboard')   +
        qbBtn('🌐','Ifaces',  'interfaces')  +
        qbBtn('📋','IP',      'ip-addresses')+
        qbBtn('📡','DHCP',    'ip-dhcp')     +
        qbBtn('🔥','FW',      'fw-filter')   +
        qbBtn('📈','Traffic', 'traffic')     +
        qbBtn('🔑','PPP',     'ppp-secrets') +
        qbBtn('⚙️','Sys',     'sys-resources')+
        '<span style="margin-left:auto;">' +
          '<button class="rm-qb-btn" onclick="window._rmShowKbd()" title="Shortcuts ?">⌨️</button>' +
        '</span>';
      content.parentNode.insertBefore(bar, content);
    }

    /* ── Search — шукаємо nav div з [data-id] що НЕ є content ── */
    if (!document.getElementById('rm-search-input')) {
      var nav = findNav(overlay, content);
      if (nav) {
        var wrap = document.createElement('div');
        wrap.id = 'rm-search-wrap';
        wrap.innerHTML =
          '<span id="rm-search-icon">🔍</span>' +
          '<input id="rm-search-input" type="text" placeholder="Ctrl+K — пошук..." autocomplete="off">' +
          '<div id="rm-search-drop"></div>';
        nav.insertBefore(wrap, nav.firstChild);
        bindSearch();
      }
    }

    /* ── Kbd modal ── */
    if (!document.getElementById('rm-kbd-modal')) buildKbdModal();

    /* ── Patch __rmSetMenu ── */
    patchSetMenu();

    /* ── Fade animation ── */
    initFade(content);

    _ready = true;
    console.log('[RM UX v2] ініціалізовано!');
  };

  /* ══════════════════════════════════════════════════════════
     FIND NAV — знаходимо sidebar безпечно
     ══════════════════════════════════════════════════════════ */
  function findNav(overlay, content) {
    /* Шукаємо прямий батько пунктів [data-id] */
    var items = overlay.querySelectorAll('[data-id]');
    if (!items.length) return null;

    /* Беремо батька першого пункту меню */
    var parent = items[0].parentNode;

    /* Перевіряємо що це не content і не overlay */
    if (!parent ||
        parent === overlay ||
        parent === content ||
        parent.id === 'rm-content') return null;

    /* Перевіряємо що містить мінімум 3 пункти меню */
    var count = parent.querySelectorAll('[data-id]').length;
    if (count < 3) return null;

    return parent;
  }

  /* ══════════════════════════════════════════════════════════
     SEARCH
     ══════════════════════════════════════════════════════════ */
  var _searchTimer = null;
  var _searchIdx   = -1;

  function bindSearch() {
    var input = document.getElementById('rm-search-input');
    var drop  = document.getElementById('rm-search-drop');
    if (!input || !drop) return;

    input.addEventListener('input', function() {
      clearTimeout(_searchTimer);
      _searchTimer = setTimeout(function() { runSearch(input.value.trim()); }, 200);
    });

    input.addEventListener('keydown', function(e) {
      var rows = drop.querySelectorAll('.rm-sd-row');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        _searchIdx = Math.min(_searchIdx + 1, rows.length - 1);
        markSel(rows);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        _searchIdx = Math.max(_searchIdx - 1, 0);
        markSel(rows);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        var sel = drop.querySelector('.rm-sd-row.sel');
        if (sel) sel.click();
      } else if (e.key === 'Escape') {
        closeDrop(); input.blur();
      }
    });

    document.addEventListener('click', function(e) {
      var wrap = document.getElementById('rm-search-wrap');
      if (wrap && !wrap.contains(e.target)) closeDrop();
    });
  }

  function closeDrop() {
    var d = document.getElementById('rm-search-drop');
    if (d) d.classList.remove('open');
    _searchIdx = -1;
  }

  function markSel(rows) {
    rows.forEach(function(r, i) {
      r.classList.toggle('sel', i === _searchIdx);
      if (i === _searchIdx) r.scrollIntoView({block:'nearest'});
    });
  }

  function runSearch(q) {
    var drop = document.getElementById('rm-search-drop');
    if (!drop) return;
    if (!q) { closeDrop(); return; }

    var ql  = q.toLowerCase();
    var out = '';
    var cnt = 0;

    /* Меню */
    var mhits = MENUS.filter(function(m) {
      return m.label.toLowerCase().includes(ql);
    });
    if (mhits.length) {
      out += '<div class="rm-sd-grp">📋 Меню</div>';
      mhits.forEach(function(m) {
        out += sdRow(m.icon, m.label, '', m.id, ql); cnt++;
      });
    }

    /* DataStore кеш */
    if (window.RMStore && window.RMStore._cache) {
      var r = window.RMStore.getRouter ? window.RMStore.getRouter() : null;
      var cache = r ? (window.RMStore._cache[r.id] || {}) : {};

      [
        {key:'interfaces', icon:'🔌', lbl:'name',    sub:'mac-address', menu:'interfaces'},
        {key:'addresses',  icon:'📍', lbl:'address', sub:'interface',   menu:'ip-addresses'},
        {key:'dhcpLeases', icon:'💻', lbl:'address', sub:'host-name',   menu:'ip-dhcp'},
        {key:'fwFilter',   icon:'🔥', lbl:'chain',   sub:'comment',     menu:'fw-filter'},
        {key:'pppSecrets', icon:'🔑', lbl:'name',    sub:'service',     menu:'ppp-secrets'},
      ].forEach(function(cfg) {
        if (!cache[cfg.key]) return;
        var hits = cache[cfg.key].filter(function(o) {
          return JSON.stringify(o).toLowerCase().includes(ql);
        }).slice(0, 4);
        if (!hits.length) return;
        out += '<div class="rm-sd-grp">' + cfg.icon + ' ' + cfg.key + '</div>';
        hits.forEach(function(o) {
          out += sdRow(cfg.icon, o[cfg.lbl]||'', o[cfg.sub]||'', cfg.menu, ql);
          cnt++;
        });
      });
    }

    if (!cnt) out = '<div class="rm-sd-empty">😕 Нічого не знайдено</div>';

    drop.innerHTML = out;
    drop.classList.add('open');
    _searchIdx = -1;

    drop.querySelectorAll('.rm-sd-row').forEach(function(row) {
      row.addEventListener('click', function() {
        var menu = row.dataset.menu;
        if (menu && window.__rmSetMenu) window.__rmSetMenu(menu);
        closeDrop();
        var inp = document.getElementById('rm-search-input');
        if (inp) inp.value = '';
      });
    });
  }

  function sdRow(icon, title, sub, menu, q) {
    function hl(t) {
      if (!q || !t) return esc(t);
      var lo = t.toLowerCase(), idx = lo.indexOf(q.toLowerCase());
      if (idx < 0) return esc(t);
      return esc(t.slice(0,idx)) +
        '<span class="rm-sd-hl">' + esc(t.slice(idx, idx+q.length)) + '</span>' +
        esc(t.slice(idx+q.length));
    }
    return '<div class="rm-sd-row" data-menu="' + esc(menu) + '">' +
      '<span>' + icon + '</span>' +
      '<div style="flex:1"><div>' + hl(title) + '</div>' +
        (sub ? '<div class="rm-sd-sub">' + hl(sub) + '</div>' : '') +
      '</div>' +
      '<span style="font-size:10px;color:#4a6070;">→ ' + esc(menu) + '</span>' +
    '</div>';
  }

  /* ══════════════════════════════════════════════════════════
     BULK ОПЕРАЦІЇ
     ══════════════════════════════════════════════════════════ */
  window.rmEnableBulk = function(tableEl, apiPath, onDone) {
    if (!tableEl || !window.RMRestCall) return;
    var r = window.RMStore ? window.RMStore.getRouter() : null;
    if (!r) return;

    var bar = document.createElement('div');
    bar.className = 'rm-bulk-bar';
    bar.id = 'rm-bulk-' + Date.now();
    bar.innerHTML =
      '<span class="rm-bulk-cnt">0 вибрано</span>' +
      '<div style="display:flex;gap:5px;margin-left:auto;">' +
        '<button class="rm-bb rm-bb-on"  onclick="_rmBulkAct(\'enable\')">▶ Увімкнути</button>' +
        '<button class="rm-bb rm-bb-off" onclick="_rmBulkAct(\'disable\')">‖ Вимкнути</button>' +
        '<button class="rm-bb rm-bb-del" onclick="_rmBulkAct(\'delete\')">🗑 Видалити</button>' +
        '<button class="rm-bb rm-bb-clr" onclick="_rmBulkClr()">✕</button>' +
      '</div>';
    tableEl.parentNode.insertBefore(bar, tableEl);

    var hdr = tableEl.querySelector('tr');
    if (hdr) {
      var th = document.createElement('th');
      th.style.width = '26px';
      th.innerHTML = '<input type="checkbox" style="width:16px;height:16px;accent-color:#5fd0a5;" onchange="_rmBulkAll(this)">';
      hdr.insertBefore(th, hdr.firstChild);
    }

    tableEl.querySelectorAll('tr:not(:first-child)').forEach(function(row) {
      var td = document.createElement('td');
      td.innerHTML = '<input type="checkbox" class="rm-row-ck" style="width:16px;height:16px;accent-color:#5fd0a5;" value="' + esc(row.dataset.id||'') + '" onchange="_rmBulkUpd()">';
      row.insertBefore(td, row.firstChild);
    });

    function checked() {
      return Array.from(tableEl.querySelectorAll('.rm-row-ck:checked'));
    }

    window._rmBulkUpd = function() {
      var cnt = checked().length;
      bar.querySelector('.rm-bulk-cnt').textContent = cnt + ' вибрано';
      bar.classList.toggle('on', cnt > 0);
      tableEl.querySelectorAll('.rm-row-ck').forEach(function(cb) {
        var row = cb.closest('tr');
        if (row) row.classList.toggle('rm-sel', cb.checked);
      });
    };

    window._rmBulkAll = function(cb) {
      tableEl.querySelectorAll('.rm-row-ck').forEach(function(c) { c.checked = cb.checked; });
      window._rmBulkUpd();
    };

    window._rmBulkClr = function() {
      tableEl.querySelectorAll('.rm-row-ck').forEach(function(c) { c.checked = false; });
      var all = tableEl.querySelector('input[type=checkbox]:not(.rm-row-ck)');
      if (all) all.checked = false;
      window._rmBulkUpd();
    };

    window._rmBulkAct = function(action) {
      var ids = checked().map(function(cb) { return cb.value; }).filter(Boolean);
      if (!ids.length) return;
      if (action === 'delete' && !confirm('Видалити ' + ids.length + ' записів?')) return;
      Promise.all(ids.map(function(id) {
        if (action === 'delete')  return window.RMRestCall(r,'DELETE',apiPath+'/'+id,null);
        if (action === 'disable') return window.RMRestCall(r,'PATCH', apiPath+'/'+id,{disabled:'yes'});
        if (action === 'enable')  return window.RMRestCall(r,'PATCH', apiPath+'/'+id,{disabled:'no'});
        return Promise.resolve();
      })).then(function() {
        window._rmBulkClr();
        if (typeof onDone === 'function') onDone();
      });
    };
  };

  /* ══════════════════════════════════════════════════════════
     DRAG & DROP
     ══════════════════════════════════════════════════════════ */
  window.rmEnableDragDrop = function(tableEl, apiPath, onReorder) {
    if (!tableEl) return;
    var r = window.RMStore ? window.RMStore.getRouter() : null;
    var src = null;

    tableEl.querySelectorAll('tr:not(:first-child)').forEach(function(row) {
      var td = document.createElement('td');
      td.innerHTML = '<span class="rm-dh" title="Перетягни">⠿</span>';
      row.insertBefore(td, row.firstChild);
      row.draggable = true;

      row.addEventListener('dragstart', function(e) {
        src = row; row.classList.add('rm-dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      row.addEventListener('dragend', function() {
        row.classList.remove('rm-dragging');
        tableEl.querySelectorAll('tr').forEach(function(tr) { tr.classList.remove('rm-drag-over'); });
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
        var si = rows.indexOf(src), di = rows.indexOf(row);
        if (si < di) row.parentNode.insertBefore(src, row.nextSibling);
        else         row.parentNode.insertBefore(src, row);
        if (r && apiPath && src.dataset.id) {
          window.RMRestCall(r,'POST',apiPath+'/move',{
            numbers: src.dataset.id,
            destination: row.dataset.id || ''
          }).catch(function(){});
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
    modal.id = 'rm-kbd-modal';
    var shortcuts = [
      ['Ctrl+K','Глобальний пошук'],['Ctrl+R','Оновити секцію'],
      ['Ctrl+D','Dashboard'],['Ctrl+T','Traffic'],
      ['Ctrl+F','Firewall'],['Ctrl+I','Interfaces'],
      ['Ctrl+H','DHCP'],['Esc','Закрити пошук'],['?','Ця довідка'],
    ];
    var rows = shortcuts.map(function(s) {
      var keys = s[0].split('+').map(function(k) {
        return '<span class="rm-kbd-key">'+k+'</span>';
      }).join('+');
      return '<div class="rm-kbd-row"><span>'+s[1]+'</span><span>'+keys+'</span></div>';
    }).join('');
    modal.innerHTML =
      '<div id="rm-kbd-box">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">' +
          '<div style="font-size:14px;font-weight:700;color:#e6edf3;">⌨️ Shortcuts</div>' +
          '<button onclick="window._rmHideKbd()" style="background:none;border:none;color:#8ea3b0;font-size:18px;cursor:pointer;">✕</button>' +
        '</div>' + rows + '</div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e) {
      if (e.target === modal) window._rmHideKbd();
    });
  }

  window._rmShowKbd = function() {
    var m = document.getElementById('rm-kbd-modal');
    if (m) m.classList.add('open');
  };
  window._rmHideKbd = function() {
    var m = document.getElementById('rm-kbd-modal');
    if (m) m.classList.remove('open');
  };

  /* Keyboard listeners */
  document.addEventListener('keydown', function(e) {
    var tag = ((document.activeElement||{}).tagName||'').toUpperCase();
    var inInput = tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT';

    if (e.ctrlKey && e.key==='k') {
      e.preventDefault();
      var inp = document.getElementById('rm-search-input');
      if (inp) { inp.focus(); inp.select(); }
      return;
    }
    if (e.ctrlKey && e.key==='r') {
      e.preventDefault();
      if (window.__rmRefreshSection) window.__rmRefreshSection();
      return;
    }
    if (inInput) return;

    var nav = {d:'dashboard',t:'traffic',f:'fw-filter',i:'interfaces',h:'ip-dhcp'};
    if (e.ctrlKey && nav[e.key]) {
      e.preventDefault();
      if (window.__rmSetMenu) window.__rmSetMenu(nav[e.key]);
      return;
    }
    if (e.key==='?') { window._rmShowKbd(); return; }
    if (e.key==='Escape') { closeDrop(); window._rmHideKbd(); }
  });

  /* ══════════════════════════════════════════════════════════
     PATCH __rmSetMenu
     ══════════════════════════════════════════════════════════ */
  function patchSetMenu() {
    var orig = window.__rmSetMenu;
    if (!orig || orig._uxOk) return;
    window.__rmSetMenu = function(menu) {
      orig(menu);
    };
    window.__rmSetMenu._uxOk = true;
  }

  /* ══════════════════════════════════════════════════════════
     FADE ANIMATION
     ══════════════════════════════════════════════════════════ */
  function initFade(content) {
    if (!content || content._rmFadeObs) return;
    var obs = new MutationObserver(function(muts) {
      muts.forEach(function(m) {
        m.addedNodes.forEach(function(node) {
          if (node.nodeType===1) node.classList.add('rm-ux-fade');
        });
      });
    });
    obs.observe(content, {childList:true});
    content._rmFadeObs = obs;
  }

  /* ══════════════════════════════════════════════════════════
     QUICK BAR HELPER
     ══════════════════════════════════════════════════════════ */
  function qbBtn(icon, label, menu) {
    return '<button class="rm-qb-btn" onclick="window.__rmSetMenu(\''+menu+'\')">' +
      icon+' '+label+'</button>';
  }

  /* ══════════════════════════════════════════════════════════
     MENU LIST для пошуку
     ══════════════════════════════════════════════════════════ */
  var MENUS = [
    {id:'dashboard',      icon:'📊', label:'Dashboard'},
    {id:'traffic',        icon:'📈', label:'Traffic Monitor'},
    {id:'interfaces',     icon:'🌐', label:'Interfaces'},
    {id:'ip-addresses',   icon:'📋', label:'IP Addresses'},
    {id:'ip-routes',      icon:'🛣️', label:'Routes'},
    {id:'ip-dhcp',        icon:'📡', label:'DHCP'},
    {id:'fw-filter',      icon:'🔥', label:'Firewall Filter'},
    {id:'fw-nat',         icon:'🔀', label:'NAT'},
    {id:'fw-mangle',      icon:'⚡', label:'Mangle'},
    {id:'fw-address-list',icon:'📋', label:'Address Lists'},
    {id:'queues-simple',  icon:'📊', label:'Queues'},
    {id:'ppp-secrets',    icon:'🔑', label:'PPP Secrets'},
    {id:'wl-interfaces',  icon:'📶', label:'Wireless'},
    {id:'wireguard',      icon:'🔐', label:'WireGuard'},
    {id:'ipv6',           icon:'🌐', label:'IPv6'},
    {id:'certificates',   icon:'🏅', label:'Certificates'},
    {id:'netwatch',       icon:'👁', label:'Netwatch'},
    {id:'snmp',           icon:'📊', label:'SNMP'},
    {id:'logging',        icon:'📋', label:'Logging'},
    {id:'capsman',        icon:'📡', label:'CAPsMAN'},
    {id:'notifications',  icon:'🔔', label:'Notifications'},
    {id:'sys-resources',  icon:'⚙️', label:'System'},
    {id:'terminal',       icon:'💻', label:'Terminal'},
  ];

  /* Reset при закритті */
  document.addEventListener('click', function(e) {
    if (