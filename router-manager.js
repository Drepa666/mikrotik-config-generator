window.sshCall = function sshCall(router, command) {
    /* ── IPC direct SSH (без proxy.py) ── */
    if (window.electronAPI && window.electronAPI.routerSsh) {
      return window.electronAPI.routerSsh({
        ip:      router.ip,
        sshPort: router.sshPort || 22,
        user:    router.user || 'admin',
        pass:    router.pass || '',
        command: command,
      }).then(function(res) {
        if (res && res.ok === false && res.error) {
          /* fallback на proxy */
          return sshCallProxy(router, command);
        }
        return res;
      }).catch(function() {
        return sshCallProxy(router, command);
      });
    }
    return sshCallProxy(router, command);
  };

  /* Оригінальний proxy SSH fallback */
  function sshCallProxy(router, command) {
    return fetch(PROXY + '/ssh/exec', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host:     router.ip,
        port:     router.sshPort,
        username: router.user,
        password: router.pass,
        command:  command,
      }),
    }).then(function(r) { return r.json(); });
  }/* ============================================================
   Router Manager — Multi-router Winbox-like panel
   Підтримує: кілька роутерів, RoMON, SSH, REST API
   ============================================================ */
'use strict';

(function() {

  var PROXY = 'http://localhost:8888';

  /* ══════════════════════════════════════════════════════════
     STATE
     ══════════════════════════════════════════════════════════ */
  var state = {
    routers:       [],   /* [{id, name, ip, port, user, pass, connected, session}] */
    activeRouter:  null, /* id */
    activeMenu:    'dashboard',
    activeSubmenu: null,
    logIntervals:  {},
    resIntervals:  {},
  };

  /* ══════════════════════════════════════════════════════════
     STYLES
     ══════════════════════════════════════════════════════════ */
  function injectStyles() {
    if (document.getElementById('rm-styles')) return;
    var s = document.createElement('style');
    s.id = 'rm-styles';
    s.textContent = `
      #rm-overlay {
        position:fixed; inset:0; background:rgba(0,0,0,.55);
        z-index:9000; display:none; align-items:center; justify-content:center;
      }
      #rm-overlay.open { display:flex; }
      #rm-panel {
        background:#0d1821; border:1px solid #2a3b48; border-radius:12px;
        width:92vw; max-width:1200px; height:85vh;
        display:flex; flex-direction:column; overflow:hidden;
        box-shadow:0 24px 80px rgba(0,0,0,.7);
      }
      /* ── Header ── */
      #rm-header {
        background:#111d27; border-bottom:1px solid #2a3b48;
        padding:0 16px; display:flex; align-items:center; gap:8px;
        min-height:48px; flex-shrink:0;
      }
      #rm-title { font-size:14px; font-weight:600; color:#5fd0a5; margin-right:8px; white-space:nowrap; }
      #rm-tabs  { display:flex; gap:4px; flex:1; overflow-x:auto; padding:8px 0; }
      #rm-tabs::-webkit-scrollbar { height:3px; }
      #rm-tabs::-webkit-scrollbar-thumb { background:#2a3b48; border-radius:2px; }
      .rm-tab {
        display:flex; align-items:center; gap:6px;
        padding:4px 12px; border-radius:6px; border:1px solid #2a3b48;
        background:#0d1821; color:#8ea3b0; font-size:12px; cursor:pointer;
        white-space:nowrap; transition:all .15s;
      }
      .rm-tab:hover   { background:#1a2d3d; color:#e6edf3; }
      .rm-tab.active  { background:#1a3a4a; border-color:#5fd0a5; color:#e6edf3; }
      .rm-tab .rm-dot { width:7px; height:7px; border-radius:50%; background:#e05252; flex-shrink:0; }
      .rm-tab .rm-dot.ok  { background:#2f7a5c; }
      .rm-tab .rm-dot.ok  { background:#5fd0a5; }
      .rm-tab .rm-close {
        opacity:.5; cursor:pointer; font-size:13px; margin-left:4px; line-height:1;
      }
      .rm-tab .rm-close:hover { opacity:1; color:#e05252; }
      #rm-add-btn {
        padding:4px 10px; border-radius:6px; border:1px dashed #2a3b48;
        background:transparent; color:#5fd0a5; font-size:18px; cursor:pointer; line-height:1;
      }
      #rm-add-btn:hover { background:#1a3a4a; }
      #rm-close-btn {
        padding:4px 10px; border-radius:6px; border:1px solid #2a3b48;
        background:transparent; color:#8ea3b0; font-size:13px; cursor:pointer; margin-left:4px;
      }
      #rm-close-btn:hover { background:#3a1a1a; color:#e05252; border-color:#e05252; }
      /* ── Body ── */
      #rm-body { display:flex; flex:1; overflow:hidden; }
      /* ── Sidebar ── */
      #rm-sidebar {
        width:180px; flex-shrink:0; background:#0a1520;
        border-right:1px solid #2a3b48; overflow-y:auto; padding:8px 0;
      }
      #rm-sidebar::-webkit-scrollbar { width:4px; }
      #rm-sidebar::-webkit-scrollbar-thumb { background:#2a3b48; border-radius:2px; }
      .rm-menu-group { margin-bottom:2px; }
      .rm-menu-item {
        display:flex; align-items:center; gap:8px;
        padding:7px 14px; cursor:pointer; font-size:12.5px;
        color:#8ea3b0; transition:all .12s; user-select:none;
      }
      .rm-menu-item:hover  { background:#1a2d3d; color:#e6edf3; }
      .rm-menu-item.active { background:#1a3a4a; color:#5fd0a5; border-left:2px solid #5fd0a5; }
      .rm-menu-item .rm-arrow { margin-left:auto; font-size:10px; transition:transform .15s; }
      .rm-menu-item.expanded .rm-arrow { transform:rotate(90deg); }
      .rm-submenu { display:none; }
      .rm-submenu.open { display:block; }
      .rm-submenu-item {
        display:flex; align-items:center; gap:6px;
        padding:5px 14px 5px 34px; cursor:pointer; font-size:12px;
        color:#7a8fa0; transition:all .12s;
      }
      .rm-submenu-item:hover  { background:#1a2d3d; color:#e6edf3; }
      .rm-submenu-item.active { color:#5fd0a5; }
      .rm-menu-sep {
        height:1px; background:#1a2d3d; margin:6px 10px;
      }
      /* ── Content ── */
      #rm-content { flex:1; overflow:auto; padding:20px; }
      #rm-content::-webkit-scrollbar { width:6px; }
      #rm-content::-webkit-scrollbar-thumb { background:#2a3b48; border-radius:3px; }
      /* ── Connect form ── */
      .rm-connect-form {
        max-width:480px; margin:40px auto;
        background:#111d27; border:1px solid #2a3b48; border-radius:10px; padding:24px;
      }
      .rm-connect-form h3 { margin:0 0 16px; color:#5fd0a5; font-size:15px; }
      .rm-field { margin-bottom:12px; }
      .rm-field label { display:block; font-size:12px; color:#8ea3b0; margin-bottom:4px; }
      .rm-field input, .rm-field select {
        width:100%; box-sizing:border-box;
        background:#0d1821; border:1px solid #2a3b48; border-radius:6px;
        color:#e6edf3; padding:7px 10px; font-size:13px;
      }
      .rm-field input:focus, .rm-field select:focus {
        outline:none; border-color:#5fd0a5;
      }
      .rm-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
      .rm-btn {
        padding:8px 18px; border-radius:6px; border:none; cursor:pointer;
        font-size:13px; font-weight:600; transition:all .15s;
      }
      .rm-btn-primary { background:#2f7a5c; color:#fff; }
      .rm-btn-primary:hover { background:#3a9a70; }
      .rm-btn-secondary { background:#1a2d3d; color:#8ea3b0; border:1px solid #2a3b48; }
      .rm-btn-secondary:hover { background:#2a3d50; color:#e6edf3; }
      .rm-btn-danger { background:#5a1a1a; color:#e05252; border:1px solid #b04040; }
      .rm-btn-danger:hover { background:#7a2020; }
      /* ── Dashboard ── */
      .rm-dash-grid {
        display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px;
        margin-bottom:16px;
      }
      .rm-dash-card {
        background:#111d27; border:1px solid #2a3b48; border-radius:8px; padding:14px;
      }
      .rm-dash-card h4 { margin:0 0 8px; font-size:11px; color:#8ea3b0; text-transform:uppercase; letter-spacing:.05em; }
      .rm-dash-val { font-size:22px; font-weight:700; color:#5fd0a5; }
      .rm-dash-sub { font-size:11px; color:#8ea3b0; margin-top:2px; }
      /* ── Table ── */
      .rm-table { width:100%; border-collapse:collapse; font-size:12.5px; }
      .rm-table th {
        text-align:left; padding:8px 10px; color:#8ea3b0; font-weight:600;
        border-bottom:1px solid #2a3b48; font-size:11px; text-transform:uppercase;
      }
      .rm-table td { padding:7px 10px; border-bottom:1px solid #1a2d3d; color:#e6edf3; }
      .rm-table tr:hover td { background:#1a2d3d; }
      /* ── Terminal ── */
      .rm-terminal {
        background:#060e14; border:1px solid #1a2d3d; border-radius:8px;
        height:380px; overflow-y:auto; padding:12px; font-family:monospace;
        font-size:12.5px; color:#b0d0b0; line-height:1.5;
      }
      .rm-terminal::-webkit-scrollbar { width:4px; }
      .rm-terminal::-webkit-scrollbar-thumb { background:#2a3b48; border-radius:2px; }
      .rm-term-input-row { display:flex; gap:8px; margin-top:10px; align-items:center; }
      .rm-term-prompt { color:#5fd0a5; font-family:monospace; font-size:13px; white-space:nowrap; }
      .rm-term-input {
        flex:1; background:#060e14; border:1px solid #2a3b48; border-radius:6px;
        color:#e6edf3; padding:7px 10px; font-family:monospace; font-size:13px;
      }
      .rm-term-input:focus { outline:none; border-color:#5fd0a5; }
      .rm-term-line-err  { color:#e05252; }
      .rm-term-line-ok   { color:#5fd0a5; }
      .rm-term-line-info { color:#8ea3b0; }
      /* ── Log ── */
      .rm-log {
        background:#060e14; border:1px solid #1a2d3d; border-radius:8px;
        height:420px; overflow-y:auto; padding:10px; font-family:monospace;
        font-size:11.5px; color:#a0c0a0; line-height:1.55;
      }
      .rm-log::-webkit-scrollbar { width:4px; }
      .rm-log::-webkit-scrollbar-thumb { background:#2a3b48; border-radius:2px; }
      .rm-log-critical  { color:#e05252; }
      .rm-log-warning   { color:#f0a840; }
      .rm-log-info      { color:#8ea3b0; }
      /* ── RoMON ── */
      .rm-romon-card {
        background:#111d27; border:1px solid #2a3b48; border-radius:8px;
        padding:14px; margin-bottom:10px; display:flex; align-items:center; gap:14px;
        cursor:pointer; transition:all .15s;
      }
      .rm-romon-card:hover { background:#1a2d3d; border-color:#5fd0a5; }
      .rm-romon-icon { font-size:28px; }
      .rm-romon-info { flex:1; }
      .rm-romon-name { font-size:14px; font-weight:600; color:#e6edf3; }
      .rm-romon-meta { font-size:12px; color:#8ea3b0; margin-top:2px; }
      /* ── Misc ── */
      .rm-section-title {
        font-size:14px; font-weight:600; color:#e6edf3; margin-bottom:14px;
        padding-bottom:8px; border-bottom:1px solid #2a3b48;
        display:flex; align-items:center; gap:8px;
      }
      .rm-badge {
        font-size:10px; padding:2px 7px; border-radius:10px;
        background:#1a3a4a; color:#5fd0a5; border:1px solid #2f7a5c;
      }
      .rm-badge-warn { background:#3a2a10; color:#f0a840; border-color:#b87a20; }
      .rm-badge-err  { background:#3a1a1a; color:#e05252; border-color:#b04040; }
      .rm-actions { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; }
      .rm-no-router {
        display:flex; flex-direction:column; align-items:center; justify-content:center;
        height:100%; color:#8ea3b0; text-align:center; gap:12px;
      }
      .rm-no-router .rm-no-icon { font-size:48px; opacity:.4; }
      .rm-progress { height:6px; background:#1a2d3d; border-radius:3px; overflow:hidden; margin-top:6px; }
      .rm-progress-bar { height:100%; border-radius:3px; transition:width .5s; }
      .rm-resource-row { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
      .rm-resource-label { width:100px; font-size:12px; color:#8ea3b0; flex-shrink:0; }
      .rm-resource-val { width:60px; font-size:12px; color:#e6edf3; text-align:right; }
    `;
    document.head.appendChild(s);
  }

  /* ══════════════════════════════════════════════════════════
     BUILD HTML SKELETON
     ══════════════════════════════════════════════════════════ */
  function buildSkeleton() {
    if (document.getElementById('rm-overlay')) return;

    var overlay = document.createElement('div');
    overlay.id  = 'rm-overlay';
    overlay.innerHTML = `
      <div id="rm-panel">
        <div id="rm-header">
          <span id="rm-title">🖥️ Router Manager</span>
          <div style="display:flex;gap:4px;margin-left:12px;">
            <button id="rm-tab-routers" onclick="window.SwitchScanner && SwitchScanner._showTab('routers')" style="background:#1a3a2a;border:1px solid #3a6a2a;color:#5fd0a5;border-radius:6px;padding:3px 12px;cursor:pointer;font-size:12px;font-weight:600;">🖥 Роутери</button>
            <button id="rm-tab-scanner" onclick="window.SwitchScanner && SwitchScanner._showTab('scanner')" style="background:transparent;border:1px solid #2a3b48;color:#4a6070;border-radius:6px;padding:3px 12px;cursor:pointer;font-size:12px;">🔍 Мережевий сканер</button>
          </div>
          <div id="rm-tabs"></div>
          <button id="rm-add-btn" title="Додати роутер">＋</button>
          <button id="rm-close-btn">✕ Закрити</button>
        </div>
        <div id="rm-body">
          <div id="rm-sidebar"></div>
          <div id="rm-content"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeManager();
    });

    document.getElementById('rm-close-btn').addEventListener('click', closeManager);
    document.getElementById('rm-add-btn').addEventListener('click', function() {
      showAddRouterForm();
    });
  }

  /* ══════════════════════════════════════════════════════════
     OPEN / CLOSE
     ══════════════════════════════════════════════════════════ */
  function openManager() {
    injectStyles();
    buildSkeleton();
    renderTabs();
    renderSidebar();
    renderContent();
    document.getElementById('rm-overlay').classList.add('open');
  }

  function closeManager() {
    var ov = document.getElementById('rm-overlay');
    if (ov) ov.classList.remove('open');
    /* Зупиняємо всі live інтервали */
    Object.values(state.logIntervals).forEach(clearInterval);
    Object.values(state.resIntervals).forEach(clearInterval);
    state.logIntervals = {};
    state.resIntervals = {};
  }

  /* ══════════════════════════════════════════════════════════
     ROUTER MANAGEMENT
     ══════════════════════════════════════════════════════════ */
  function genId() {
    return 'r_' + Math.random().toString(36).slice(2, 9);
  }

  function addRouter(cfg) {
    var router = {
      id:        genId(),
      name:      cfg.name || cfg.ip,
      ip:        cfg.ip,
      port:      cfg.port || 80,
      sshPort:   cfg.sshPort || 22,
      user:      cfg.user || '',
      pass:      cfg.pass || '',
      connected: false,
      info:      null,
      romon:     cfg.romon || false,
      romonId:   cfg.romonId || null,
    };
    state.routers.push(router);
    state.activeRouter = router.id;
    state.activeMenu   = 'dashboard';
    renderTabs();
    renderSidebar();
    connectRouter(router.id);
    return router;
  }

  function removeRouter(id) {
    clearInterval(state.logIntervals[id]);
    clearInterval(state.resIntervals[id]);
    delete state.logIntervals[id];
    delete state.resIntervals[id];
    state.routers = state.routers.filter(function(r) { return r.id !== id; });
    if (state.activeRouter === id) {
      state.activeRouter = state.routers.length ? state.routers[0].id : null;
    }
    renderTabs();
    renderSidebar();
    renderContent();
  }

  function getRouter(id) {
    return state.routers.find(function(r) { return r.id === id; }) || null;
  }

  function getActive() {
    return getRouter(state.activeRouter);
  }

  /* ══════════════════════════════════════════════════════════
     REST API CALLS
     ══════════════════════════════════════════════════════════ */
  window.restCall = function restCall(router, method, path, body) {
    /* ── IPC direct (без proxy.py) ── */
    if (window.electronAPI && window.electronAPI.routerRest) {
      return window.electronAPI.routerRest({
        ip:       router.ip,
        port:     router.port || 80,
        user:     router.user || 'admin',
        pass:     router.pass || '',
        useHttps: router.useHttps || false,
        method:   method,
        path:     path,
        body:     body || null,
      }).then(function(res) {
        if (res && res.error && !res.length) {
          /* Якщо IPC повернув помилку — fallback на proxy */
          return restCallProxy(router, method, path, body);
        }
        return res;
      }).catch(function() {
        return restCallProxy(router, method, path, body);
      });
    }
    /* ── Fallback: proxy.py ── */
    return restCallProxy(router, method, path, body);
  };

  /* Оригінальний proxy fallback */
  function restCallProxy(router, method, path, body) {
    var url  = PROXY + '/rest' + path;
    var opts = {
      method:  method,
      headers: {
        'Content-Type':  'application/json',
        'x-router-ip':   router.ip,
        'x-router-port': String(router.port || 80),
        'x-router-user': router.user || 'admin',
        'x-router-pass': router.pass || '',
      },
    };
    if (body && method !== 'GET') opts.body = JSON.stringify(body);
    return fetch(url, opts).then(function(r) { return r.json(); });
  }

  window.__rmGetState = function() { return state; };

  
  /* ── Switch Scanner Tab ── */
  function buildScannerPanel() {
    var existing = document.getElementById('ss-panel');
    if (existing) return;
    var panel = document.getElementById('rm-panel');
    if (!panel) return;

    var ss = document.createElement('div');
    ss.id = 'ss-panel';
    ss.style.cssText = 'display:none;flex-direction:column;height:100%;overflow:hidden;';
    ss.innerHTML = [
      /* Toolbar */
      '<div style="padding:10px 16px;border-bottom:1px solid #1a2a38;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">',
        '<button id="ss-scan-btn" onclick="SwitchScanner.scan()" ',
          'style="background:linear-gradient(135deg,#1a3a2a,#2a5a3a);border:1px solid #3a7a4a;',
          'color:#5fd0a5;border-radius:8px;padding:7px 18px;cursor:pointer;font-size:13px;font-weight:700;">',
          '🔍 Сканувати мережу</button>',
        '<span id="ss-status" style="font-size:12px;color:#4a6070;flex:1;"></span>',
        '<button onclick="SwitchScanner.exportCSV()" ',
          'style="background:#1a2a3a;border:1px solid #2a3b48;color:#5b9bd5;',
          'border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;">📥 CSV</button>',
      '</div>',
      /* Stats */
      '<div style="display:flex;gap:8px;padding:10px 16px;border-bottom:1px solid #1a2a38;">',
        '<div style="background:#0a0f1a;border:1px solid #1a2a38;border-radius:8px;padding:8px 14px;text-align:center;flex:1;">',
          '<div id="ss-stat-total" style="color:#5fd0a5;font-size:20px;font-weight:700;">0</div>',
          '<div style="color:#4a6070;font-size:10px;">Всього</div>',
        '</div>',
        '<div style="background:#0a0f1a;border:1px solid #1a2a38;border-radius:8px;padding:8px 14px;text-align:center;flex:1;">',
          '<div id="ss-stat-arp" style="color:#5b9bd5;font-size:20px;font-weight:700;">0</div>',
          '<div style="color:#4a6070;font-size:10px;">ARP</div>',
        '</div>',
        '<div style="background:#0a0f1a;border:1px solid #1a2a38;border-radius:8px;padding:8px 14px;text-align:center;flex:1;">',
          '<div id="ss-stat-dhcp" style="color:#c084fc;font-size:20px;font-weight:700;">0</div>',
          '<div style="color:#4a6070;font-size:10px;">DHCP</div>',
        '</div>',
        '<div style="background:#0a0f1a;border:1px solid #1a2a38;border-radius:8px;padding:8px 14px;text-align:center;flex:1;">',
          '<div id="ss-stat-nbr" style="color:#f0a840;font-size:20px;font-weight:700;">0</div>',
          '<div style="color:#4a6070;font-size:10px;">Сусіди</div>',
        '</div>',
        '<div style="background:#0a0f1a;border:1px solid #1a2a38;border-radius:8px;padding:8px 14px;text-align:center;flex:1;">',
          '<div id="ss-stat-wifi" style="color:#90c060;font-size:20px;font-weight:700;">0</div>',
          '<div style="color:#4a6070;font-size:10px;">WiFi</div>',
        '</div>',
      '</div>',
      /* Filters */
      '<div style="display:flex;gap:8px;padding:8px 16px;border-bottom:1px solid #1a2a38;flex-wrap:wrap;">',
        '<input id="ss-search" type="text" placeholder="🔍 IP, MAC, hostname, vendor..." ',
          'oninput="SwitchScanner.renderTable(SwitchScanner._devices)" ',
          'style="flex:2;min-width:180px;background:#060d14;border:1px solid #1c2a37;',
          'color:#e6edf3;padding:5px 10px;border-radius:6px;font-size:12px;">',
        '<select id="ss-type-filter" onchange="SwitchScanner.renderTable(SwitchScanner._devices)" ',
          'style="flex:1;min-width:120px;background:#060d14;border:1px solid #1c2a37;',
          'color:#e6edf3;padding:5px;border-radius:6px;font-size:12px;">',
          '<option value="">Всі типи</option>',
        '</select>',
        '<select id="ss-iface-filter" onchange="SwitchScanner.renderTable(SwitchScanner._devices)" ',
          'style="flex:1;min-width:120px;background:#060d14;border:1px solid #1c2a37;',
          'color:#e6edf3;padding:5px;border-radius:6px;font-size:12px;">',
          '<option value="">Всі інтерфейси</option>',
        '</select>',
        '<label style="display:flex;align-items:center;gap:6px;color:#5fd0a5;font-size:12px;cursor:pointer;">',
          '<input id="ss-online-only" type="checkbox" ',
            'onchange="SwitchScanner.renderTable(SwitchScanner._devices)" ',
            'style="accent-color:#5fd0a5;">',
          'Тільки онлайн',
        '</label>',
      '</div>',
      /* Table */
      '<div style="flex:1;overflow-y:auto;">',
        '<table style="width:100%;border-collapse:collapse;">',
          '<thead>',
            '<tr style="background:#0a0f1a;border-bottom:2px solid #1a2a38;">',
              '<th style="padding:8px 10px;text-align:left;font-size:11px;color:#4a6070;font-weight:600;">IP</th>',
              '<th style="padding:8px 10px;text-align:left;font-size:11px;color:#4a6070;font-weight:600;">MAC / Vendor</th>',
              '<th style="padding:8px 10px;text-align:left;font-size:11px;color:#4a6070;font-weight:600;">Тип</th>',
              '<th style="padding:8px 10px;text-align:left;font-size:11px;color:#4a6070;font-weight:600;">Hostname</th>',
              '<th style="padding:8px 10px;text-align:left;font-size:11px;color:#4a6070;font-weight:600;">Iface</th>',
              '<th style="padding:8px 10px;text-align:left;font-size:11px;color:#4a6070;font-weight:600;">Signal</th>',
              '<th style="padding:8px 10px;text-align:left;font-size:11px;color:#4a6070;font-weight:600;">Source</th>',
              '<th style="padding:8px 10px;text-align:left;font-size:11px;color:#4a6070;font-weight:600;">Дії</th>',
            '</tr>',
          '</thead>',
          '<tbody id="ss-tbody">',
            '<tr><td colspan="8" style="text-align:center;color:#4a6070;padding:40px;">',
              'Натисніть "Сканувати мережу"',
            '</td></tr>',
          '</tbody>',
        '</table>',
      '</div>',
    ].join('');

    panel.appendChild(ss);
  }

  /* Захист якщо SwitchScanner ще не завантажений */
  if (!window.SwitchScanner) {
    console.warn('[RM] SwitchScanner not loaded yet');
    return;
  }

  SwitchScanner._showTab = function(tab) {
    buildScannerPanel();
    var routersContent = document.getElementById('rm-content');
    var routersTabs    = document.getElementById('rm-tabs');
    var ssPanel        = document.getElementById('ss-panel');
    var btnR = document.getElementById('rm-tab-routers');
    var btnS = document.getElementById('rm-tab-scanner');

    if (tab === 'scanner') {
      if (routersContent) routersContent.style.display = 'none';
      if (routersTabs)    routersTabs.style.display    = 'none';
      if (ssPanel)        ssPanel.style.display        = 'flex';
      if (btnR) { btnR.style.background='transparent'; btnR.style.color='#4a6070'; }
      if (btnS) { btnS.style.background='#1a2a3a'; btnS.style.color='#5b9bd5'; }
    } else {
      if (routersContent) routersContent.style.display = '';
      if (routersTabs)    routersTabs.style.display    = '';
      if (ssPanel)        ssPanel.style.display        = 'none';
      if (btnR) { btnR.style.background='#1a3a2a'; btnR.style.color='#5fd0a5'; }
      if (btnS) { btnS.style.background='transparent'; btnS.style.color='#4a6070'; }
    }
  };


  window.RouterManager = {
    open:      openManager,
    close:     closeManager,
    addRouter: addRouter,
    _state:    state,
    /* Повертає активний роутер */
    _getActiveRouter: function() {
      return state.routers.find(function(r) { return r.id === state.activeRouter; }) || null;
    },
    /* Повертає ВСІ роутери */
    _getAllRouters: function() {
      return state.routers || [];
    },
    /* Повертає кількість роутерів */
    _getCount: function() {
      return (state.routers || []).length;
    },
  };

  /* Кнопка в головному UI */
  function addTriggerButton() {
    var existing = document.getElementById('btn-router-manager');
    if (existing) return;

    /* Шукаємо підходяще місце — поруч з існуючими кнопками */
    var targets = [
      document.getElementById('btn-validate'),
      document.getElementById('btn-validate-networks'),
      document.querySelector('.fab-group'),
      document.querySelector('[id*="fab"]'),
    ];

    var btn = document.createElement('button');
    btn.id        = 'btn-router-manager';
    btn.innerHTML = '🖥️ Router Manager';

    /* Пробуємо додати в fab або toolbar */
    var added = false;
    for (var i = 0; i < targets.length; i++) {
      if (targets[i] && targets[i].parentNode) {
        targets[i].parentNode.insertBefore(btn, targets[i].nextSibling);
        added = true;
        break;
      }
    }

    if (!added) {
      /* Запасний варіант — floating button */
      btn.style.cssText =
        'position:fixed;bottom:24px;left:24px;z-index:8000;' +
        'padding:10px 18px;border-radius:8px;border:1px solid #2f7a5c;' +
        'background:#1a3a2a;color:#5fd0a5;font-size:13px;font-weight:600;' +
        'cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.4);';
      document.body.appendChild(btn);
    }

    btn.addEventListener('click', openManager);
    console.log('[RouterManager] Кнопка додана!');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addTriggerButton);
  } else {
    addTriggerButton();
  }

  console.log('[RouterManager] завантажено — window.RouterManager.open()');


/* ═══════════════════════════════════════════════════════════
   RUIJIE / REYEE MODULE
   API: POST /cgi-bin/luci/api/cmd?auth=TOKEN
   Робочі методи: devSta.get(port_status), devSta.get(arp)
   ═══════════════════════════════════════════════════════════ */

var RuijieAPI = (function() {

  /* ── SSL-tolerant fetch через наш proxy ── */
  function ruijieRpc(router, method, params) {
    var url = PROXY + '/ruijie-rpc';
    return fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host:   router.ip,
        port:   router.port || 443,
        token:  router.ruijieToken || '',
        method: method,
        params: params || {},
      }),
    }).then(function(r) { return r.json(); });
  }

  /* ── Тест підключення ── */
  function testConnection(router) {
    return ruijieRpc(router, 'devSta.get', {
      module: 'port_status', noParse: false,
      async: null, remoteIp: false, device: 'pc',
    }).then(function(r) {
      return r && r.code === 0 && r.data && r.data.List;
    }).catch(function() { return false; });
  }

  /* ── Порти ── */
  function getPorts(router) {
    return ruijieRpc(router, 'devSta.get', {
      module: 'port_status', noParse: false,
      async: null, remoteIp: false, device: 'pc',
    }).then(function(r) {
      return (r && r.data && r.data.List) ? r.data.List : [];
    });
  }

  /* ── ARP таблиця (клієнти) ── */
  function getArp(router) {
    return ruijieRpc(router, 'devSta.get', {
      module: 'arp', noParse: false,
      async: null, remoteIp: false, device: 'pc',
    }).then(function(r) {
      return (r && r.data && r.data.arpList) ? r.data.arpList : [];
    });
  }

  return { testConnection: testConnection, getPorts: getPorts, getArp: getArp, rpc: ruijieRpc };
})();

/* ── Форма підключення Ruijie ── */
function showRuijieConnectForm() {
  var cont = document.getElementById('rm-content');
  if (!cont) return;

  cont.innerHTML = `
    <div class="rm-connect-form">
      <h3>🔴 Підключити Ruijie / Reyee</h3>

      <div style="background:#0a1a2a;border:1px solid #2a4a6a;border-radius:8px;
                  padding:12px 16px;margin-bottom:16px;font-size:12px;color:#8ea3b0;">
        <b style="color:#4a90d9;">ℹ Як отримати токен:</b><br>
        1. Відкрий <b>https://${router && router.ip ? router.ip : '192.168.110.1'}</b> в браузері<br>
        2. Залогінься → <b>F12</b> → Console<br>
        3. Введи: <code style="color:#5fd0a5;background:#060d14;padding:2px 6px;border-radius:3px;">document.cookie</code><br>
        4. Скопіюй значення після <code style="color:#5fd0a5;">G1U08Z4031462=</code>
      </div>

      <div class="rm-field">
        <label>IP адреса роутера</label>
        <input id="rj-ip" type="text" value="192.168.110.1" style="font-family:monospace;">
      </div>
      <div class="rm-field">
        <label>Auth Token (з браузера)</label>
        <input id="rj-token" type="text" placeholder="fe0e193ee2b44b7a8a3eb423e03ca20e"
          style="font-family:monospace;font-size:12px;">
        <div style="font-size:11px;color:#4a6070;margin-top:3px;">
          Токен дійсний поки відкрита сесія в браузері
        </div>
      </div>
      <div class="rm-row">
        <div class="rm-field">
          <label>Назва</label>
          <input id="rj-name" type="text" placeholder="Ruijie офіс">
        </div>
        <div class="rm-field">
          <label>Порт (зазвичай 443)</label>
          <input id="rj-port" type="number" value="443">
        </div>
      </div>

      <div style="display:flex;gap:8px;margin-top:16px;">
        <button class="rm-btn rm-btn-primary" id="rj-connect">🔌 Підключити</button>
        <button class="rm-btn rm-btn-secondary" id="rj-test">🔍 Тест</button>
      </div>
      <div id="rj-status" style="margin-top:10px;font-size:12px;color:#8ea3b0;min-height:18px;"></div>
    </div>
  `;

  var st = document.getElementById('rj-status');

  document.getElementById('rj-test').addEventListener('click', function() {
    var ip    = document.getElementById('rj-ip').value.trim();
    var token = document.getElementById('rj-token').value.trim();
    var port  = parseInt(document.getElementById('rj-port').value) || 443;
    if (!ip || !token) { st.textContent = '⚠ Введи IP і токен'; return; }
    st.textContent = '⏳ Перевіряю...';
    RuijieAPI.testConnection({ ip:ip, port:port, ruijieToken:token })
      .then(function(ok) {
        st.style.color = ok ? '#5fd0a5' : '#e05252';
        st.textContent = ok ? '✅ Підключення успішне!' : '❌ Не вдалось. Перевір токен.';
      });
  });

  document.getElementById('rj-connect').addEventListener('click', function() {
    var ip    = document.getElementById('rj-ip').value.trim();
    var token = document.getElementById('rj-token').value.trim();
    var name  = document.getElementById('rj-name').value.trim() || 'Ruijie';
    var port  = parseInt(document.getElementById('rj-port').value) || 443;
    if (!ip || !token) { st.textContent = '⚠ Введи IP і токен'; return; }
    st.textContent = '⏳ Підключення...';
    RuijieAPI.testConnection({ ip:ip, port:port, ruijieToken:token })
      .then(function(ok) {
        if (!ok) {
          st.style.color  = '#e05252';
          st.textContent  = '❌ Токен невірний або роутер недоступний';
          return;
        }
        addRouter({
          ip: ip, port: port, user: '', pass: '',
          name: name, ruijieToken: token,
          type: 'ruijie',
        });
        st.style.color = '#5fd0a5';
        st.textContent = '✅ Ruijie додано!';
      });
  });
}

/* ── Дашборд Ruijie ── */
function renderRuijieDashboard(router) {
  var cont = document.getElementById('rm-content');
  if (!cont) return;

  cont.innerHTML =
    '<div class="rm-section-title">🔴 Ruijie ' + esc(router.name) +
    '  <button class="rm-btn rm-btn-secondary" style="margin-left:auto;font-size:11px;" ' +
    'onclick="renderRuijieDashboard(getActive())">🔄 Оновити</button></div>' +
    '<div id="rj-ports-wrap"></div>' +
    '<div id="rj-clients-wrap" style="margin-top:16px;"></div>';

  /* Порти */
  RuijieAPI.getPorts(router).then(function(ports) {
    var wrap = document.getElementById('rj-ports-wrap');
    if (!wrap) return;

    var html = '<div class="rm-section-title" style="font-size:13px;margin-bottom:8px;">🔌 Порти</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">';

    ports.forEach(function(p) {
      var isOn   = p.status === 'on';
      var color  = isOn ? '#5fd0a5' : '#4a6070';
      var bg     = isOn ? '#0a2a1a' : '#0a0f14';
      var border = isOn ? '#1a5a3a' : '#2a3b48';
      html +=
        '<div style="background:' + bg + ';border:1px solid ' + border + ';border-radius:8px;' +
        'padding:12px 16px;min-width:120px;text-align:center;">' +
          '<div style="color:' + color + ';font-size:20px;margin-bottom:6px;">' +
            (isOn ? '🟢' : '⚫') +
          '</div>' +
          '<div style="color:#e6edf3;font-size:13px;font-weight:600;">' + esc(p.panel_name) + '</div>' +
          '<div style="color:' + color + ';font-size:11px;margin-top:2px;">' +
            (isOn ? '● Online' : '● Offline') +
          '</div>' +
          (isOn && p.speed ? '<div style="color:#f0a840;font-size:11px;">' + p.speed + ' Mbps</div>' : '') +
          (isOn && p.duplex && p.duplex !== 'NULL' ?
            '<div style="color:#8ea3b0;font-size:10px;">' + p.duplex + '</div>' : '') +
          '<div style="color:#4a6070;font-size:10px;margin-top:4px;font-family:monospace;">' +
            esc(p.ipaddr) +
          '</div>' +
        '</div>';
    });

    html += '</div>';
    wrap.innerHTML = html;
  }).catch(function() {
    var wrap = document.getElementById('rj-ports-wrap');
    if (wrap) wrap.innerHTML = '<div style="color:#e05252">❌ Помилка отримання портів</div>';
  });

  /* ARP клієнти */
  RuijieAPI.getArp(router).then(function(arps) {
    var wrap = document.getElementById('rj-clients-wrap');
    if (!wrap) return;

    /* Фільтруємо WAN */
    var lanClients = arps.filter(function(a) {
      return a.intf === 'br-lan';
    });
    var wanGw = arps.filter(function(a) {
      return a.intf === 'br-wan';
    });

    var html =
      '<div class="rm-section-title" style="font-size:13px;margin-bottom:8px;">' +
        '👥 LAN Клієнти <span class="rm-badge">' + lanClients.length + '</span>' +
      '</div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:12px;">' +
        '<thead>' +
          '<tr style="background:#080f17;color:#4a6070;">' +
            '<th style="padding:8px 12px;text-align:left;border-bottom:1px solid #2a3b48;">MAC</th>' +
            '<th style="padding:8px 12px;text-align:left;border-bottom:1px solid #2a3b48;">IP</th>' +
            '<th style="padding:8px 12px;text-align:left;border-bottom:1px solid #2a3b48;">Interface</th>' +
            '<th style="padding:8px 12px;text-align:left;border-bottom:1px solid #2a3b48;">Status</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>';

    lanClients.forEach(function(a, i) {
      var bg = i % 2 === 0 ? '#060d14' : '#080f17';
      html +=
        '<tr style="background:' + bg + ';">' +
          '<td style="padding:8px 12px;color:#4a90d9;font-family:monospace;">' + esc(a.hardware) + '</td>' +
          '<td style="padding:8px 12px;color:#5fd0a5;font-family:monospace;">' + esc(a.address) + '</td>' +
          '<td style="padding:8px 12px;color:#8ea3b0;">' + esc(a.intf) + '</td>' +
          '<td style="padding:8px 12px;"><span style="color:#5fd0a5;font-size:11px;font-weight:600;">● Online</span></td>' +
        '</tr>';
    });

    html += '</tbody></table>';

    if (wanGw.length > 0) {
      html += '<div style="margin-top:8px;font-size:11px;color:#4a6070;">' +
        '🌐 WAN Gateway: ' + wanGw.map(function(a){
          return '<span style="font-family:monospace;color:#8ea3b0;">' + esc(a.address) + ' (' + esc(a.hardware) + ')</span>';
        }).join(', ') + '</div>';
    }

    wrap.innerHTML = html;
  }).catch(function() {
    var wrap = document.getElementById('rj-clients-wrap');
    if (wrap) wrap.innerHTML = '<div style="color:#e05252">❌ Помилка отримання клієнтів</div>';
  });
}
/* ═══════════════════════════════════════════ END RUIJIE ═══ */

  /* ── Глобальний доступ для AI агента ── */
  window.restCall = restCall;
  window.sshCall  = sshCall;
  window.getActiveRouter = function() {
    return state.routers.find(function(r) { return r.id === state.activeRouter; }) || null;
  };

})();