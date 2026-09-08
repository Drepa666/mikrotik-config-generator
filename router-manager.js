/* ============================================================
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
      user:      cfg.user || 'admin',
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
  function restCall(router, method, path, body) {
    var url  = PROXY + '/rest' + path;
    var opts = {
      method:  method,
      headers: {
        'Content-Type': 'application/json',
        'x-router-ip':   router.ip,
        'x-router-port': String(router.port),
        'Authorization': 'Basic ' + btoa(router.user + ':' + router.pass),
      },
    };
    if (body) opts.body = JSON.stringify(body);
    return fetch(url, opts).then(function(r) { return r.json(); });
  }

  function sshCall(router, command) {
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
  }

  /* ══════════════════════════════════════════════════════════
     CONNECT
     ══════════════════════════════════════════════════════════ */
  function connectRouter(id) {
    var router = getRouter(id);
    if (!router) return;

    router.connected = false;
    router.info      = null;
    renderTabs();
    renderContent();

    restCall(router, 'GET', '/system/identity').then(function(data) {
      if (data && data.name) {
        router.connected = true;
        router.name      = data.name;
        router.info      = {};
        renderTabs();
        loadDashboard(id);
      } else {
        router.connected = false;
        renderTabs();
        renderContent();
      }
    }).catch(function() {
      router.connected = false;
      renderTabs();
      renderContent();
    });
  }

  /* ══════════════════════════════════════════════════════════
     RENDER TABS
     ══════════════════════════════════════════════════════════ */
  function renderTabs() {
    var cont = document.getElementById('rm-tabs');
    if (!cont) return;

    cont.innerHTML = '';
    state.routers.forEach(function(r) {
      var tab = document.createElement('div');
      tab.className = 'rm-tab' + (r.id === state.activeRouter ? ' active' : '');
      tab.innerHTML =
        '<span class="rm-dot' + (r.connected ? ' ok' : '') + '"></span>' +
        '<span>' + esc(r.name) + '</span>' +
        '<span class="rm-close" data-id="' + r.id + '">×</span>';

      tab.addEventListener('click', function(e) {
        if (e.target.classList.contains('rm-close')) {
          removeRouter(e.target.dataset.id);
          return;
        }
        state.activeRouter = r.id;
        state.activeMenu   = 'dashboard';
        renderTabs();
        renderSidebar();
        renderContent();
      });
      cont.appendChild(tab);
    });
  }

  /* ══════════════════════════════════════════════════════════
     RENDER SIDEBAR
     ══════════════════════════════════════════════════════════ */
  var MENU = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'traffic',   icon: '📈', label: 'Traffic Monitor' },
    { id: 'terminal',  icon: '🖥️', label: 'Terminal (SSH)' },
    { id: 'sep1' },
    { id: 'interfaces', icon: '🌐', label: 'Interfaces' },
    {
      id: 'ip', icon: '📋', label: 'IP', children: [
        { id: 'ip-addresses', label: 'Addresses' },
        { id: 'ip-routes',    label: 'Routes' },
        { id: 'ip-dhcp',      label: 'DHCP Leases' },
        { id: 'ip-dns',       label: 'DNS' },
        { id: 'ip-arp',       label: 'ARP' },
      ],
    },
    {
      id: 'firewall', icon: '🔥', label: 'Firewall', children: [
        { id: 'fw-filter',  label: 'Filter Rules' },
        { id: 'fw-nat',     label: 'NAT' },
        { id: 'fw-mangle',  label: 'Mangle' },
        { id: 'fw-conntrack', label: 'Connections' },
      ],
    },
    {
      id: 'wireless', icon: '📡', label: 'Wireless', children: [
        { id: 'wl-interfaces', label: 'Interfaces' },
        { id: 'wl-clients',    label: 'Clients' },
      ],
    },
    {
      id: 'system', icon: '⚙️', label: 'System', children: [
        { id: 'sys-resources', label: 'Resources' },
        { id: 'sys-scheduler', label: 'Scheduler' },
        { id: 'sys-scripts',   label: 'Scripts' },
        { id: 'sys-logs',      label: 'Logs (Live)' },
        { id: 'sys-users',     label: 'Users' },
        { id: 'sys-backup',    label: 'Backup/Restore' },
        { id: 'sys-reboot',    label: 'Reboot' },
      ],
    },
    { id: 'sep2' },
    { id: 'romon', icon: '🔗', label: 'RoMON' },
    { id: 'neighbors', icon: '🏘️', label: 'Neighbors' },
    { id: 'sep3' },
    {
      id: 'queues', icon: '📊', label: 'Queues', children: [
        { id: 'queues-simple', label: 'Simple Queues' },
        { id: 'queues-tree',   label: 'Queue Tree' },
      ],
    },
    {
      id: 'ppp', icon: '🔑', label: 'PPP', children: [
        { id: 'ppp-secrets', label: 'Secrets' },
        { id: 'ppp-active',  label: 'Active' },
      ],
    },
    {
      id: 'vlans', icon: '🔀', label: 'VLANs', children: [
        { id: 'vlan-list',   label: 'VLAN Interfaces' },
        { id: 'bridge-ports',label: 'Bridge Ports' },
      ],
    },
    { id: 'wg-peers', icon: '🔐', label: 'WireGuard Peers' },
    { id: 'ip-pool',  icon: '📦', label: 'IP Pools' },
    { id: 'addr-list',icon: '🚫', label: 'Address Lists' },
    { id: 'dhcp-srv', icon: '📡', label: 'DHCP Server' },
    { id: 'dns-static',icon: '📋', label: 'DNS Static' },
  ];

  function renderSidebar() {
    var sb = document.getElementById('rm-sidebar');
    if (!sb) return;

    if (!state.activeRouter) {
      sb.innerHTML = '';
      return;
    }

    var html = '';
    MENU.forEach(function(item) {
      if (item.id.startsWith('sep')) {
        html += '<div class="rm-menu-sep"></div>';
        return;
      }
      var hasChildren = item.children && item.children.length;
      var isExpanded  = hasChildren && item.children.some(function(c) {
        return c.id === state.activeMenu || c.id === state.activeSubmenu;
      });
      var isActive = item.id === state.activeMenu;

      html += '<div class="rm-menu-group">';
      html += '<div class="rm-menu-item' +
        (isActive ? ' active' : '') +
        (isExpanded ? ' expanded' : '') +
        '" data-id="' + item.id + '">' +
        '<span>' + item.icon + '</span>' +
        '<span>' + item.label + '</span>' +
        (hasChildren ? '<span class="rm-arrow">▶</span>' : '') +
      '</div>';

      if (hasChildren) {
        html += '<div class="rm-submenu' + (isExpanded ? ' open' : '') + '" data-parent="' + item.id + '">';
        item.children.forEach(function(child) {
          html += '<div class="rm-submenu-item' +
            (child.id === state.activeMenu ? ' active' : '') +
            '" data-id="' + child.id + '">· ' + child.label + '</div>';
        });
        html += '</div>';
      }
      html += '</div>';
    });

    sb.innerHTML = html;

    sb.querySelectorAll('.rm-menu-item').forEach(function(el) {
      el.addEventListener('click', function() {
        var id     = el.dataset.id;
        var parent = MENU.find(function(m) { return m.id === id; });
        if (parent && parent.children) {
          var sub = sb.querySelector('[data-parent="' + id + '"]');
          if (sub) sub.classList.toggle('open');
          el.classList.toggle('expanded');
        } else {
          state.activeMenu = id;
          renderSidebar();
          renderContent();
        }
      });
    });

    sb.querySelectorAll('.rm-submenu-item').forEach(function(el) {
      el.addEventListener('click', function() {
        state.activeMenu = el.dataset.id;
        renderSidebar();
        renderContent();
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     RENDER CONTENT
     ══════════════════════════════════════════════════════════ */
  function renderContent() {
    var cont = document.getElementById('rm-content');
    if (!cont) return;

    /* Зупиняємо старі інтервали поточного роутера */
    var id = state.activeRouter;
    if (state.logIntervals[id]) { clearInterval(state.logIntervals[id]); delete state.logIntervals[id]; }
    if (state.resIntervals[id]) { clearInterval(state.resIntervals[id]); delete state.resIntervals[id]; }

    if (!state.activeRouter) {
      cont.innerHTML = showAddRouterFormHTML();
      bindAddRouterForm();
      return;
    }

    var router = getActive();
    if (!router) return;

    if (!router.connected) {
      cont.innerHTML =
        '<div class="rm-no-router">' +
        '<div class="rm-no-icon">⚡</div>' +
        '<div style="font-size:15px;color:#e6edf3;">Підключення до <b>' + esc(router.name) + '</b>...</div>' +
        '<div style="font-size:12px;color:#8ea3b0;">' + esc(router.ip) + ':' + router.port + '</div>' +
        '<button class="rm-btn rm-btn-primary" onclick="window.__rmRetry(\'' + router.id + '\')">🔄 Повторити</button>' +
        '</div>';
      window.__rmRetry = function(rid) { connectRouter(rid); renderContent(); };
      return;
    }

    var menu = state.activeMenu;
    console.log('[RM] renderContent menu:', menu, 'router:', state.activeRouter);

    if (menu === 'dashboard') {
      if (window.rmSectionDashboard) { window.rmSectionDashboard(); return; }
      renderDashboard(); return;
    }
    if (menu === 'terminal')      { renderTerminal();   return; }
    if (menu === 'interfaces')    { if(window.rmCrudInterfaces) window.rmCrudInterfaces(); else renderInterfaces(); return; }
    if (menu === 'ip-addresses')  { if(window.rmCrudIPAddresses) window.rmCrudIPAddresses(); else renderTable('IP Addresses','/ip/address',['address','network','interface','dynamic']); return; }
    if (menu === 'ip-routes')     { if(window.rmCrudRoutes) window.rmCrudRoutes(); else renderTable('Routes','/ip/route',['dst-address','gateway','distance','active']); return; }
    if (menu === 'ip-dhcp')       { if(window.rmCrudDHCP) window.rmCrudDHCP(); else renderTable('DHCP Leases','/ip/dhcp-server/lease',['address','mac-address','host-name','status','expires-after']); return; }
    if (menu === 'ip-dns')        { renderDNS(); return; }
    if (menu === 'ip-arp')        { if(window.rmCrudARP) window.rmCrudARP(); else renderTable('ARP Table','/ip/arp',['address','mac-address','interface','dynamic']); return; }
    if (menu === 'fw-filter')     { if(window.rmCrudFWFilter) window.rmCrudFWFilter(); else renderTable('Firewall Filter','/ip/firewall/filter',['chain','action','src-address','dst-address','protocol','comment']); return; }
    if (menu === 'fw-nat')        { if(window.rmCrudFWNAT) window.rmCrudFWNAT(); else renderTable('NAT Rules','/ip/firewall/nat',['chain','action','src-address','dst-port','comment']); return; }
    if (menu === 'fw-mangle')     { if(window.rmCrudFWMangle) window.rmCrudFWMangle(); else renderTable('Mangle','/ip/firewall/mangle',['chain','action','passthrough','comment']); return; }
    if (menu === 'fw-conntrack')  { renderTable('Connections', '/ip/firewall/connection', ['src-address','dst-address','protocol','state']); return; }
    if (menu === 'wl-interfaces') { if(window.rmCrudWireless) window.rmCrudWireless(); else renderTable('Wireless Interfaces','/interface/wireless',['name','ssid','band','frequency','running']); return; }
    if (menu === 'wl-clients')    { renderTable('Wireless Clients', '/interface/wireless/registration-table', ['interface','mac-address','signal-strength','tx-rate','rx-rate','uptime']); return; }
    if (menu === 'sys-resources') { renderResources(); return; }
    if (menu === 'sys-scheduler') { if(window.rmCrudScheduler) window.rmCrudScheduler(); else renderTable('Scheduler','/system/scheduler',['name','interval','on-event','next-run']); return; }
    if (menu === 'sys-scripts')   { renderScripts(); return; }
    if (menu === 'sys-logs')      { renderLogs(); return; }
    if (menu === 'sys-users')     { if(window.rmCrudUsers) window.rmCrudUsers(); else renderTable('Users','/user',['name','group','last-logged-in']); return; }
    if (menu === 'sys-backup')    { renderBackup(); return; }
    if (menu === 'sys-reboot')    { renderReboot(); return; }
    if (menu === 'romon')         { renderRoMON(); return; }
    if (menu === 'queues-simple') { if(window.rmCrudQueues)    window.rmCrudQueues();    else cont.innerHTML='<div style="color:#8ea3b0;padding:20px;">Queues Simple</div>'; return; }
    if (menu === 'ppp-secrets')   { if(window.rmCrudPPP)       window.rmCrudPPP();       else cont.innerHTML='<div style="color:#8ea3b0;padding:20px;">PPP Secrets</div>'; return; }
    if (menu === 'vlan-list')     { if(window.rmCrudVLAN)      window.rmCrudVLAN();      else cont.innerHTML='<div style="color:#8ea3b0;padding:20px;">VLANs</div>'; return; }
    if (menu === 'bridge-ports')  { if(window.rmCrudBridge)    window.rmCrudBridge();    else cont.innerHTML='<div style="color:#8ea3b0;padding:20px;">Bridge Ports</div>'; return; }
    if (menu === 'wg-peers')      { if(window.rmCrudWGPeers)   window.rmCrudWGPeers();   else cont.innerHTML='<div style="color:#8ea3b0;padding:20px;">WG Peers</div>'; return; }
    if (menu === 'ip-pool')       { if(window.rmCrudIPPool)    window.rmCrudIPPool();    else cont.innerHTML='<div style="color:#8ea3b0;padding:20px;">IP Pools</div>'; return; }
    if (menu === 'addr-list')     { if(window.rmCrudAddressList) window.rmCrudAddressList(); else cont.innerHTML='<div style="color:#8ea3b0;padding:20px;">Address Lists</div>'; return; }
    if (menu === 'dhcp-srv')      { if(window.rmCrudDHCPServer) window.rmCrudDHCPServer(); else cont.innerHTML='<div style="color:#8ea3b0;padding:20px;">DHCP Server</div>'; return; }
    if (menu === 'dns-static')    { if(window.rmCrudDNSStatic) window.rmCrudDNSStatic(); else cont.innerHTML='<div style="color:#8ea3b0;padding:20px;">DNS Static</div>'; return; }
    if (menu === 'neighbors')     { renderNeighbors(); return; }

    if (menu === 'traffic') {
      if (window.rmSectionTraffic) { window.rmSectionTraffic(); return; }
    }
    cont.innerHTML = '<div class="rm-no-router"><div class="rm-no-icon">🚧</div><div>Секція в розробці</div></div>';
  }

  /* ══════════════════════════════════════════════════════════
     ADD ROUTER FORM
     ══════════════════════════════════════════════════════════ */
  function showAddRouterFormHTML() {
    return `
      <div class="rm-connect-form">
        <h3>➕ Додати роутер</h3>
        <div class="rm-field">
          <label>Назва (необов'язково)</label>
          <input id="rm-f-name" type="text" placeholder="Home Router">
        </div>
        <div class="rm-row">
          <div class="rm-field">
            <label>IP адреса роутера</label>
            <input id="rm-f-ip" type="text" value="192.168.88.1">
          </div>
          <div class="rm-field">
            <label>REST API порт</label>
            <input id="rm-f-port" type="number" value="80">
          </div>
        </div>
        <div class="rm-row">
          <div class="rm-field">
            <label>Логін</label>
            <input id="rm-f-user" type="text" value="admin">
          </div>
          <div class="rm-field">
            <label>Пароль</label>
            <input id="rm-f-pass" type="password" placeholder="">
          </div>
        </div>
        <div class="rm-field">
          <label>SSH порт (для термінала)</label>
          <input id="rm-f-ssh" type="number" value="22">
        </div>
        <div style="display:flex;gap:8px;margin-top:16px;">
          <button class="rm-btn rm-btn-primary" id="rm-f-connect">🔌 Підключити</button>
        </div>
        <div id="rm-f-status" style="margin-top:10px;font-size:12px;color:#8ea3b0;"></div>
      </div>
    `;
  }

  function showAddRouterForm() {
    state.activeRouter = null;
    renderTabs();
    renderSidebar();
    var cont = document.getElementById('rm-content');
    if (cont) { cont.innerHTML = showAddRouterFormHTML(); bindAddRouterForm(); }
  }

  function bindAddRouterForm() {
    var btn = document.getElementById('rm-f-connect');
    if (!btn) return;
    btn.addEventListener('click', function() {
      var ip   = (document.getElementById('rm-f-ip').value   || '').trim();
      var port = (document.getElementById('rm-f-port').value  || '80').trim();
      var user = (document.getElementById('rm-f-user').value  || 'admin').trim();
      var pass =  document.getElementById('rm-f-pass').value  || '';
      var ssh  = (document.getElementById('rm-f-ssh').value   || '22').trim();
      var name = (document.getElementById('rm-f-name').value  || '').trim();
      var st   = document.getElementById('rm-f-status');

      if (!ip) { st.textContent = '⚠ Введи IP адресу!'; return; }
      st.textContent = '⏳ Підключення...';
      btn.disabled   = true;

      addRouter({ ip: ip, port: parseInt(port), user: user, pass: pass, sshPort: parseInt(ssh), name: name || ip });
    });
  }

  /* ══════════════════════════════════════════════════════════
     DASHBOARD
     ══════════════════════════════════════════════════════════ */
  function loadDashboard(id) {
    var router = getRouter(id);
    if (!router) return;
    Promise.all([
      restCall(router, 'GET', '/system/resource'),
      restCall(router, 'GET', '/system/identity'),
      restCall(router, 'GET', '/ip/address'),
      restCall(router, 'GET', '/interface'),
    ]).then(function(results) {
      router.info = {
        resource:  results[0],
        identity:  results[1],
        addresses: results[2],
        ifaces:    results[3],
      };
      if (state.activeRouter === id && state.activeMenu === 'dashboard') {
        renderDashboard();
      }
    }).catch(function() {
      if (state.activeRouter === id && state.activeMenu === 'dashboard') {
        renderDashboard();
      }
    });
  }

  function renderDashboard() {
    var cont = document.getElementById('rm-content');
    var router = getActive();
    if (!cont || !router) return;

    var res = (router.info && router.info.resource) || {};
    var ifaces = (router.info && router.info.ifaces) || [];
    var addrs  = (router.info && router.info.addresses) || [];

    var cpuPct  = parseInt(res['cpu-load'] || 0);
    var memFree = parseInt(res['free-memory'] || 0);
    var memTot  = parseInt(res['total-memory'] || 1);
    var memPct  = Math.round((1 - memFree / memTot) * 100);
    var hddFree = parseInt(res['free-hdd-space'] || 0);
    var hddTot  = parseInt(res['total-hdd-space'] || 1);
    var hddPct  = Math.round((1 - hddFree / hddTot) * 100);

    var upTime  = res['uptime'] || '—';
    var version = res['version'] || '—';
    var board   = res['board-name'] || '—';

    var html = '<div class="rm-section-title">📊 Dashboard — <b>' + esc(router.name) + '</b>' +
      ' <span class="rm-badge">' + esc(router.ip) + '</span></div>';

    html += '<div class="rm-dash-grid">' +
      dashCard('🖥️ Пристрій',  board, version) +
      dashCard('⏱️ Uptime',    upTime, '') +
      dashCard('📡 Інтерфейсів', ifaces.length, 'всього') +
      dashCard('🌐 IP адрес', addrs.length, 'налаштовано') +
    '</div>';

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">';

    /* CPU */
    html += '<div class="rm-dash-card"><h4>CPU Load</h4>' +
      '<div class="rm-resource-row">' +
      '<div class="rm-resource-label">Навантаження</div>' +
      '<div style="flex:1"><div class="rm-progress"><div class="rm-progress-bar" style="width:' + cpuPct + '%;background:' + pctColor(cpuPct) + '"></div></div></div>' +
      '<div class="rm-resource-val">' + cpuPct + '%</div></div></div>';

    /* RAM */
    html += '<div class="rm-dash-card"><h4>Memory</h4>' +
      '<div class="rm-resource-row">' +
      '<div class="rm-resource-label">Використано</div>' +
      '<div style="flex:1"><div class="rm-progress"><div class="rm-progress-bar" style="width:' + memPct + '%;background:' + pctColor(memPct) + '"></div></div></div>' +
      '<div class="rm-resource-val">' + memPct + '%</div></div>' +
      '<div style="font-size:11px;color:#8ea3b0;">' + fmt(memTot - memFree) + ' / ' + fmt(memTot) + '</div></div>';

    html += '</div>';

    /* Interfaces table */
    if (ifaces.length) {
      html += '<div class="rm-section-title" style="font-size:13px;">🌐 Інтерфейси</div>';
      html += '<table class="rm-table"><tr><th>Назва</th><th>Тип</th><th>MAC</th><th>Статус</th><th>Коментар</th></tr>';
      ifaces.slice(0, 10).forEach(function(iface) {
        var running = iface.running === 'true' || iface.running === true;
        html += '<tr>' +
          '<td><b>' + esc(iface.name || '') + '</b></td>' +
          '<td>' + esc(iface.type || '') + '</td>' +
          '<td style="font-family:monospace;font-size:11px;">' + esc(iface['mac-address'] || '') + '</td>' +
          '<td><span class="rm-badge' + (running ? '' : ' rm-badge-err') + '">' + (running ? '▶ Running' : '■ Down') + '</span></td>' +
          '<td style="color:#8ea3b0;">' + esc(iface.comment || '') + '</td>' +
          '</tr>';
      });
      html += '</table>';
    }

    html += '<div style="margin-top:12px;display:flex;gap:8px;">' +
      '<button class="rm-btn rm-btn-secondary" onclick="window.__rmRefreshDash()">🔄 Оновити</button>' +
      '</div>';

    cont.innerHTML = html;

    window.__rmRefreshDash = function() {
      loadDashboard(state.activeRouter);
      setTimeout(renderDashboard, 800);
    };
  }

  function dashCard(title, val, sub) {
    return '<div class="rm-dash-card"><h4>' + title + '</h4>' +
      '<div class="rm-dash-val">' + esc(String(val)) + '</div>' +
      (sub ? '<div class="rm-dash-sub">' + esc(String(sub)) + '</div>' : '') +
      '</div>';
  }

  function pctColor(pct) {
    if (pct > 80) return '#e05252';
    if (pct > 60) return '#f0a840';
    return '#5fd0a5';
  }

  function fmt(bytes) {
    if (bytes > 1048576) return (bytes / 1048576).toFixed(1) + 'MB';
    if (bytes > 1024)    return (bytes / 1024).toFixed(0) + 'KB';
    return bytes + 'B';
  }

  /* ══════════════════════════════════════════════════════════
     GENERIC TABLE
     ══════════════════════════════════════════════════════════ */
  function renderTable(title, apiPath, cols) {
    var cont = document.getElementById('rm-content');
    var router = getActive();
    if (!cont || !router) return;

    cont.innerHTML = '<div class="rm-section-title">' + title + ' <span class="rm-badge rm-badge-warn">⏳ Завантаження...</span></div>';

    restCall(router, 'GET', apiPath).then(function(data) {
      if (!Array.isArray(data)) {
        cont.innerHTML = '<div style="color:#e05252;padding:20px;">Помилка: ' + esc(JSON.stringify(data)) + '</div>';
        return;
      }

      var html = '<div class="rm-section-title">' + title +
        ' <span class="rm-badge">' + data.length + ' записів</span>' +
        '<button class="rm-btn rm-btn-secondary" style="margin-left:auto;font-size:11px;" onclick="window.__rmRefreshTable()">🔄</button>' +
        '</div>';

      html += '<div style="overflow-x:auto;"><table class="rm-table"><tr>';
      cols.forEach(function(c) { html += '<th>' + esc(c) + '</th>'; });
      html += '</tr>';

      data.forEach(function(row) {
        html += '<tr>';
        cols.forEach(function(c) {
          var val = row[c];
          if (val === undefined || val === null) val = '';
          var display = String(val);
          if (display === 'true')  display = '<span class="rm-badge">✓</span>';
          if (display === 'false') display = '<span style="color:#8ea3b0">—</span>';
          html += '<td>' + esc(display).replace('&lt;span', '<span').replace('&gt;', '>').replace('&lt;/span&gt;', '</span>') + '</td>';
        });
        html += '</tr>';
      });
      html += '</table></div>';

      cont.innerHTML = html;
      window.__rmRefreshTable = function() { renderTable(title, apiPath, cols); };

    }).catch(function(e) {
      cont.innerHTML = '<div style="color:#e05252;padding:20px;">Помилка запиту: ' + esc(String(e)) + '</div>';
    });
  }

  /* ══════════════════════════════════════════════════════════
     TERMINAL (SSH)
     ══════════════════════════════════════════════════════════ */
  function renderTerminal() {
    var cont = document.getElementById('rm-content');
    var router = getActive();
    if (!cont || !router) return;

    var history = [];
    var histIdx = -1;

    cont.innerHTML =
      '<div class="rm-section-title">🖥️ Terminal SSH — ' + esc(router.name) + '</div>' +
      '<div class="rm-terminal" id="rm-term-out"></div>' +
      '<div class="rm-term-input-row">' +
        '<span class="rm-term-prompt">[' + esc(router.user) + '@' + esc(router.name) + '] &gt;</span>' +
        '<input class="rm-term-input" id="rm-term-in" type="text" placeholder="Введи команду RouterOS..." autocomplete="off" spellcheck="false">' +
        '<button class="rm-btn rm-btn-primary" id="rm-term-run">▶ Run</button>' +
        '<button class="rm-btn rm-btn-secondary" id="rm-term-clear">✕</button>' +
      '</div>' +
      '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;" id="rm-term-quick"></div>';

    var out = document.getElementById('rm-term-out');
    var inp = document.getElementById('rm-term-in');

    /* Швидкі команди */
    var quickCmds = [
      '/system resource print',
      '/ip address print',
      '/interface print',
      '/ip route print',
      '/system identity print',
      '/log print count=20',
      '/ip dhcp-server lease print',
      '/ip firewall filter print',
    ];
    var qc = document.getElementById('rm-term-quick');
    quickCmds.forEach(function(cmd) {
      var b = document.createElement('button');
      b.className   = 'rm-btn rm-btn-secondary';
      b.style.fontSize = '11px';
      b.textContent = cmd;
      b.addEventListener('click', function() { inp.value = cmd; runCommand(); });
      qc.appendChild(b);
    });

    termLog(out, '🖥️ SSH Terminal — ' + router.ip + ':' + router.sshPort, 'info');
    termLog(out, 'Введи команду або вибери з швидких кнопок нижче', 'info');
    termLog(out, '──────────────────────────────────────────', 'info');

    function runCommand() {
      var cmd = inp.value.trim();
      if (!cmd) return;

      history.unshift(cmd);
      histIdx = -1;

      termLog(out, '[' + router.user + '@' + router.name + '] > ' + cmd, 'ok');
      inp.value = '';
      inp.disabled = true;

      sshCall(router, cmd).then(function(res) {
        if (res.ok) {
          if (res.output) {
            res.output.split('\n').forEach(function(line) {
              if (line.trim()) termLog(out, line, 'normal');
            });
          }
          if (res.error && res.error.trim()) {
            termLog(out, '⚠ ' + res.error, 'err');
          }
        } else {
          termLog(out, '❌ ' + (res.error || 'Помилка'), 'err');
        }
        inp.disabled = false;
        inp.focus();
      }).catch(function(e) {
        termLog(out, '❌ ' + String(e), 'err');
        inp.disabled = false;
        inp.focus();
      });
    }

    document.getElementById('rm-term-run').addEventListener('click', runCommand);
    inp.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { runCommand(); return; }
      if (e.key === 'ArrowUp') {
        histIdx = Math.min(histIdx + 1, history.length - 1);
        if (history[histIdx]) inp.value = history[histIdx];
        e.preventDefault();
      }
      if (e.key === 'ArrowDown') {
        histIdx = Math.max(histIdx - 1, -1);
        inp.value = histIdx >= 0 ? history[histIdx] : '';
        e.preventDefault();
      }
    });
    document.getElementById('rm-term-clear').addEventListener('click', function() {
      out.innerHTML = '';
    });

    inp.focus();
  }

  function termLog(el, msg, type) {
    var line = document.createElement('div');
    line.className = type === 'err' ? 'rm-term-line-err' : type === 'ok' ? 'rm-term-line-ok' : type === 'info' ? 'rm-term-line-info' : '';
    line.textContent = msg;
    el.appendChild(line);
    el.scrollTop = el.scrollHeight;
  }

  /* ══════════════════════════════════════════════════════════
     INTERFACES
     ══════════════════════════════════════════════════════════ */
  function renderInterfaces() {
    renderTable('🌐 Interfaces', '/interface', ['name','type','mac-address','mtu','running','disabled','comment']);
  }

  /* ══════════════════════════════════════════════════════════
     DNS
     ══════════════════════════════════════════════════════════ */
  function renderDNS() {
    var cont = document.getElementById('rm-content');
    var router = getActive();
    if (!cont || !router) return;

    cont.innerHTML = '<div class="rm-section-title">📋 DNS <span class="rm-badge rm-badge-warn">⏳ Завантаження...</span></div>';

    Promise.all([
      restCall(router, 'GET', '/ip/dns'),
      restCall(router, 'GET', '/ip/dns/static'),
    ]).then(function(results) {
      var dns = results[0] || {};
      var staticDns = Array.isArray(results[1]) ? results[1] : [];

      var html = '<div class="rm-section-title">📋 DNS Settings</div>';
      html += '<div class="rm-dash-card" style="margin-bottom:16px;">';
      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">';
      html += kv('Servers', dns.servers || '—');
      html += kv('Allow remote requests', dns['allow-remote-requests'] || '—');
      html += kv('Cache size', dns['cache-size'] || '—');
      html += kv('Cache used', dns['cache-used'] || '—');
      html += '</div></div>';

      if (staticDns.length) {
        html += '<div class="rm-section-title" style="font-size:13px;">Static DNS Records (' + staticDns.length + ')</div>';
        html += '<table class="rm-table"><tr><th>Name</th><th>Address</th><th>TTL</th><th>Regexp</th></tr>';
        staticDns.forEach(function(r) {
          html += '<tr><td>' + esc(r.name || '') + '</td><td>' + esc(r.address || '') + '</td><td>' + esc(r.ttl || '') + '</td><td>' + esc(r.regexp || '') + '</td></tr>';
        });
        html += '</table>';
      }

      cont.innerHTML = html;
    });
  }

  function kv(key, val) {
    return '<div><div style="font-size:11px;color:#8ea3b0;">' + esc(key) + '</div>' +
      '<div style="font-size:13px;color:#e6edf3;margin-top:2px;">' + esc(String(val)) + '</div></div>';
  }

  /* ══════════════════════════════════════════════════════════
     RESOURCES (live)
     ══════════════════════════════════════════════════════════ */
  function renderResources() {
    var cont = document.getElementById('rm-content');
    var router = getActive();
    if (!cont || !router) return;

    cont.innerHTML =
      '<div class="rm-section-title">⚙️ System Resources — <span class="rm-badge" id="rm-res-uptime">⏳</span></div>' +
      '<div id="rm-res-body"></div>' +
      '<div style="margin-top:10px;">' +
        '<button class="rm-btn rm-btn-secondary" id="rm-res-stop">■ Зупинити live</button>' +
        '<span style="font-size:11px;color:#8ea3b0;margin-left:10px;">Оновлення кожні 3с</span>' +
      '</div>';

    function update() {
      var rid = state.activeRouter;
      var r2  = getRouter(rid);
      if (!r2) return;

      restCall(r2, 'GET', '/system/resource').then(function(res) {
        var upEl = document.getElementById('rm-res-uptime');
        var body = document.getElementById('rm-res-body');
        if (!upEl || !body) return;

        upEl.textContent = res.uptime || '—';

        var cpu  = parseInt(res['cpu-load'] || 0);
        var memF = parseInt(res['free-memory'] || 0);
        var memT = parseInt(res['total-memory'] || 1);
        var memP = Math.round((1 - memF / memT) * 100);
        var hddF = parseInt(res['free-hdd-space'] || 0);
        var hddT = parseInt(res['total-hdd-space'] || 1);
        var hddP = Math.round((1 - hddF / hddT) * 100);

        body.innerHTML =
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">' +
          resCard('CPU', cpu, res['cpu-count'] + ' cores @ ' + res['cpu-frequency'] + ' MHz') +
          resCard('RAM', memP, fmt(memT - memF) + ' використано / ' + fmt(memT)) +
          resCard('Storage', hddP, fmt(hddT - hddF) + ' використано / ' + fmt(hddT)) +
          '</div>' +
          '<div class="rm-dash-grid">' +
          dashCard('🖥️ Board', res['board-name'] || '—', '') +
          dashCard('📦 RouterOS', res['version'] || '—', '') +
          dashCard('🔨 Platform', res['platform'] || '—', '') +
          dashCard('📊 Processes', res['processes'] || '—', '') +
          '</div>';
      }).catch(function() {});
    }

    update();
    var intervalId = setInterval(update, 3000);
    state.resIntervals[state.activeRouter] = intervalId;

    setTimeout(function() {
      var btn = document.getElementById('rm-res-stop');
      if (btn) {
        btn.addEventListener('click', function() {
          clearInterval(intervalId);
          delete state.resIntervals[state.activeRouter];
          btn.textContent = '⬤ Зупинено';
          btn.disabled = true;
        });
      }
    }, 100);
  }

  function resCard(title, pct, sub) {
    return '<div class="rm-dash-card"><h4>' + title + '</h4>' +
      '<div class="rm-resource-row">' +
      '<div style="flex:1"><div class="rm-progress"><div class="rm-progress-bar" style="width:' + pct + '%;background:' + pctColor(pct) + '"></div></div></div>' +
      '<div class="rm-resource-val">' + pct + '%</div></div>' +
      '<div style="font-size:11px;color:#8ea3b0;margin-top:4px;">' + esc(sub) + '</div></div>';
  }

  /* ══════════════════════════════════════════════════════════
     LOGS (live)
     ══════════════════════════════════════════════════════════ */
  function renderLogs() {
    var cont = document.getElementById('rm-content');
    var router = getActive();
    if (!cont || !router) return;

    cont.innerHTML =
      '<div class="rm-section-title">📋 System Logs' +
        '<button class="rm-btn rm-btn-secondary" style="margin-left:auto;font-size:11px;" id="rm-log-clear">✕ Очистити</button>' +
        '<button class="rm-btn rm-btn-secondary" style="font-size:11px;" id="rm-log-stop">■ Зупинити live</button>' +
      '</div>' +
      '<div style="display:flex;gap:6px;margin-bottom:10px;">' +
        '<select id="rm-log-filter" style="background:#0d1821;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:5px 8px;font-size:12px;">' +
          '<option value="">Всі типи</option>' +
          '<option value="error">Errors</option>' +
          '<option value="warning">Warnings</option>' +
          '<option value="info">Info</option>' +
          '<option value="firewall">Firewall</option>' +
        '</select>' +
        '<span style="font-size:11px;color:#8ea3b0;align-self:center;">Оновлення кожні 5с</span>' +
      '</div>' +
      '<div class="rm-log" id="rm-log-out"></div>';

    var seenIds = new Set();

    function fetchLogs() {
      var r2 = getRouter(state.activeRouter);
      if (!r2) return;
      var filter = document.getElementById('rm-log-filter');
      var topic  = filter ? filter.value : '';
      var path   = '/log' + (topic ? '?topics=' + topic : '');

      restCall(r2, 'GET', path).then(function(data) {
        var logEl = document.getElementById('rm-log-out');
        if (!logEl || !Array.isArray(data)) return;

        var newItems = data.filter(function(item) { return item['.id'] && !seenIds.has(item['.id']); });
        newItems.forEach(function(item) {
          seenIds.add(item['.id']);
          var topics  = String(item.topics || '');
          var message = String(item.message || '');
          var time    = String(item.time || '');

          var cls = '';
          if (topics.includes('critical') || topics.includes('error')) cls = 'rm-log-critical';
          else if (topics.includes('warning')) cls = 'rm-log-warning';
          else if (topics.includes('info'))    cls = 'rm-log-info';

          var line = document.createElement('div');
          line.className = cls;
          line.textContent = time + '  [' + topics + ']  ' + message;
          logEl.appendChild(line);
        });

        if (newItems.length) logEl.scrollTop = logEl.scrollHeight;
      }).catch(function() {});
    }

    fetchLogs();
    var intervalId = setInterval(fetchLogs, 5000);
    state.logIntervals[state.activeRouter] = intervalId;

    setTimeout(function() {
      var stopBtn = document.getElementById('rm-log-stop');
      var clearBtn = document.getElementById('rm-log-clear');
      if (stopBtn) stopBtn.addEventListener('click', function() {
        clearInterval(intervalId);
        delete state.logIntervals[state.activeRouter];
        stopBtn.textContent = '⬤ Зупинено'; stopBtn.disabled = true;
      });
      if (clearBtn) clearBtn.addEventListener('click', function() {
        var logEl = document.getElementById('rm-log-out');
        if (logEl) { logEl.innerHTML = ''; seenIds.clear(); }
      });
    }, 100);
  }

  /* ══════════════════════════════════════════════════════════
     SCRIPTS
     ══════════════════════════════════════════════════════════ */
  function renderScripts() {
    var cont = document.getElementById('rm-content');
    var router = getActive();
    if (!cont || !router) return;

    cont.innerHTML = '<div class="rm-section-title">📜 Scripts <span class="rm-badge rm-badge-warn">⏳</span></div>';

    restCall(router, 'GET', '/system/script').then(function(data) {
      if (!Array.isArray(data)) { cont.innerHTML = '<div style="color:#e05252">Помилка</div>'; return; }

      var html = '<div class="rm-section-title">📜 Scripts <span class="rm-badge">' + data.length + '</span></div>';
      if (!data.length) { html += '<div style="color:#8ea3b0">Скриптів немає</div>'; cont.innerHTML = html; return; }

      html += '<table class="rm-table"><tr><th>Назва</th><th>Run count</th><th>Last started</th><th>Дії</th></tr>';
      data.forEach(function(s) {
        html += '<tr>' +
          '<td><b>' + esc(s.name || '') + '</b></td>' +
          '<td>' + esc(s['run-count'] || '0') + '</td>' +
          '<td style="font-size:11px;">' + esc(s['last-started'] || '—') + '</td>' +
          '<td>' +
            '<button class="rm-btn rm-btn-primary" style="font-size:11px;" ' +
            'onclick="window.__rmRunScript(\'' + esc(s['.id']) + '\',\'' + esc(s.name) + '\')">▶ Run</button>' +
          '</td></tr>';
      });
      html += '</table>';
      cont.innerHTML = html;

      window.__rmRunScript = function(id, name) {
        if (!confirm('Запустити скрипт "' + name + '"?')) return;
        restCall(router, 'POST', '/system/script/' + id + '/run', {}).then(function() {
          alert('Скрипт "' + name + '" запущено!');
        }).catch(function(e) { alert('Помилка: ' + e); });
      };
    });
  }

  /* ══════════════════════════════════════════════════════════
     BACKUP
     ══════════════════════════════════════════════════════════ */
  function renderBackup() {
    var cont = document.getElementById('rm-content');
    var router = getActive();
    if (!cont || !router) return;

    cont.innerHTML =
      '<div class="rm-section-title">💾 Backup & Restore</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">' +

      '<div class="rm-dash-card">' +
        '<h4>Створити резервну копію</h4>' +
        '<div class="rm-field"><label>Назва файлу (без .backup)</label>' +
          '<input id="rm-bk-name" type="text" placeholder="backup-' + new Date().toISOString().slice(0,10) + '"></div>' +
        '<div class="rm-field"><label>Пароль (необов\'язково)</label>' +
          '<input id="rm-bk-pass" type="password" placeholder=""></div>' +
        '<button class="rm-btn rm-btn-primary" id="rm-bk-create">💾 Створити backup</button>' +
        '<div id="rm-bk-status" style="margin-top:8px;font-size:12px;color:#8ea3b0;"></div>' +
      '</div>' +

      '<div class="rm-dash-card">' +
        '<h4>Export конфігурації</h4>' +
        '<p style="font-size:12px;color:#8ea3b0;">Генерує .rsc файл з поточною конфігурацією роутера</p>' +
        '<button class="rm-btn rm-btn-secondary" id="rm-bk-export">📄 Export .rsc</button>' +
        '<div id="rm-exp-status" style="margin-top:8px;font-size:12px;color:#8ea3b0;"></div>' +
      '</div>' +

      '</div>' +

      '<div style="margin-top:16px;" class="rm-dash-card">' +
        '<h4>Список backup файлів</h4>' +
        '<div id="rm-bk-list"><button class="rm-btn rm-btn-secondary" id="rm-bk-listbtn">📋 Показати файли</button></div>' +
      '</div>';

    setTimeout(function() {
      var createBtn = document.getElementById('rm-bk-create');
      var exportBtn = document.getElementById('rm-bk-export');
      var listBtn   = document.getElementById('rm-bk-listbtn');

      if (createBtn) createBtn.addEventListener('click', function() {
        var name = (document.getElementById('rm-bk-name').value || ('backup-' + new Date().toISOString().slice(0,10))).trim();
        var pass = document.getElementById('rm-bk-pass').value;
        var st   = document.getElementById('rm-bk-status');
        st.textContent = '⏳ Створення backup...';
        var body = { name: name };
        if (pass) body.password = pass;
        sshCall(router, '/system backup save name=' + name + (pass ? ' password="' + pass + '"' : '')).then(function(res) {
          st.textContent = res.ok ? '✅ Backup створено: ' + name + '.backup' : '❌ ' + res.error;
        });
      });

      if (exportBtn) exportBtn.addEventListener('click', function() {
        var st = document.getElementById('rm-exp-status');
        st.textContent = '⏳ Export...';
        sshCall(router, '/export').then(function(res) {
          if (res.ok && res.output) {
            var blob = new Blob([res.output], { type: 'text/plain' });
            var a    = document.createElement('a');
            a.href   = URL.createObjectURL(blob);
            a.download = router.name + '-export.rsc';
            a.click();
            st.textContent = '✅ Export завантажено!';
          } else {
            st.textContent = '❌ ' + (res.error || 'Помилка');
          }
        });
      });

      if (listBtn) listBtn.addEventListener('click', function() {
        sshCall(router, '/file print where type=backup').then(function(res) {
          var listEl = document.getElementById('rm-bk-list');
          if (res.ok && res.output) {
            listEl.innerHTML = '<pre style="font-family:monospace;font-size:11px;color:#a0c0a0;">' + esc(res.output) + '</pre>';
          } else {
            listEl.innerHTML = '<div style="color:#e05252">' + esc(res.error || 'Помилка') + '</div>';
          }
        });
      });
    }, 100);
  }

  /* ══════════════════════════════════════════════════════════
     REBOOT
     ══════════════════════════════════════════════════════════ */
  function renderReboot() {
    var cont = document.getElementById('rm-content');
    var router = getActive();
    if (!cont || !router) return;

    cont.innerHTML =
      '<div class="rm-section-title">🔄 System Control</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">' +

      '<div class="rm-dash-card" style="text-align:center;">' +
        '<div style="font-size:32px;margin-bottom:8px;">🔄</div>' +
        '<div style="font-size:14px;font-weight:600;color:#e6edf3;margin-bottom:6px;">Reboot</div>' +
        '<div style="font-size:12px;color:#8ea3b0;margin-bottom:12px;">Перезавантажити роутер</div>' +
        '<button class="rm-btn rm-btn-danger" onclick="window.__rmSysCtrl(\'reboot\')">🔄 Reboot</button>' +
      '</div>' +

      '<div class="rm-dash-card" style="text-align:center;">' +
        '<div style="font-size:32px;margin-bottom:8px;">⏹️</div>' +
        '<div style="font-size:14px;font-weight:600;color:#e6edf3;margin-bottom:6px;">Shutdown</div>' +
        '<div style="font-size:12px;color:#8ea3b0;margin-bottom:12px;">Вимкнути роутер</div>' +
        '<button class="rm-btn rm-btn-danger" onclick="window.__rmSysCtrl(\'shutdown\')">⏹️ Shutdown</button>' +
      '</div>' +

      '<div class="rm-dash-card" style="text-align:center;">' +
        '<div style="font-size:32px;margin-bottom:8px;">🔃</div>' +
        '<div style="font-size:14px;font-weight:600;color:#e6edf3;margin-bottom:6px;">Скинути конфіг</div>' +
        '<div style="font-size:12px;color:#8ea3b0;margin-bottom:12px;">⚠️ Небезпечно!</div>' +
        '<button class="rm-btn rm-btn-danger" onclick="window.__rmSysCtrl(\'reset\')">⚠️ Reset Config</button>' +
      '</div>' +

      '</div>';

    window.__rmSysCtrl = function(action) {
      var msgs = {
        reboot:   'Перезавантажити роутер ' + router.name + '?',
        shutdown: 'ВИМКНУТИ роутер ' + router.name + '?',
        reset:    '⚠️ СКИНУТИ КОНФІГ роутера ' + router.name + '? Всі налаштування будуть видалені!',
      };
      if (!confirm(msgs[action])) return;

      var cmds = {
        reboot:   '/system reboot',
        shutdown: '/system shutdown',
        reset:    '/system reset-configuration no-defaults=yes skip-backup=yes',
      };

      sshCall(router, cmds[action]).then(function(res) {
        if (action === 'reboot' || action === 'shutdown') {
          alert('Команда відправлена! Роутер буде ' + (action === 'reboot' ? 'перезавантажено' : 'вимкнено') + '.');
          router.connected = false;
          renderTabs();
          renderContent();
        } else {
          alert(res.ok ? '✅ Конфіг скинуто' : '❌ ' + res.error);
        }
      }).catch(function(e) { alert('Помилка: ' + e); });
    };
  }

  /* ══════════════════════════════════════════════════════════
     RoMON
     ══════════════════════════════════════════════════════════ */
  function renderRoMON() {
    var cont = document.getElementById('rm-content');
    var router = getActive();
    if (!cont || !router) return;

    cont.innerHTML =
      '<div class="rm-section-title">🔗 RoMON — Router Management Overlay Network</div>' +
      '<div class="rm-dash-card" style="margin-bottom:16px;">' +
        '<p style="font-size:13px;color:#8ea3b0;margin:0 0 12px;">RoMON дозволяє підключатись до роутерів через інші роутери (Layer 2). Сканує сусідів через MPLS-based overlay.</p>' +
        '<button class="rm-btn rm-btn-primary" id="rm-romon-scan">🔍 Сканувати RoMON сусідів</button>' +
        '<button class="rm-btn rm-btn-secondary" id="rm-romon-enable" style="margin-left:8px;">⚙️ Увімкнути RoMON</button>' +
      '</div>' +
      '<div id="rm-romon-list"><div style="color:#8ea3b0;font-size:13px;">Натисни "Сканувати" щоб знайти сусідів</div></div>';

    setTimeout(function() {
      var scanBtn   = document.getElementById('rm-romon-scan');
      var enableBtn = document.getElementById('rm-romon-enable');

      if (enableBtn) enableBtn.addEventListener('click', function() {
        sshCall(router, '/tool romon set enabled=yes').then(function(res) {
          alert(res.ok ? '✅ RoMON увімкнено!' : '❌ ' + res.error);
        });
      });

      if (scanBtn) scanBtn.addEventListener('click', function() {
        scanBtn.textContent = '⏳ Сканування...';
        scanBtn.disabled    = true;

        /* Спочатку через REST API */
        restCall(router, 'GET', '/tool/romon/neighbor').then(function(data) {
          scanBtn.textContent = '🔍 Сканувати RoMON сусідів';
          scanBtn.disabled    = false;
          renderRoMONList(Array.isArray(data) ? data : [], router);
        }).catch(function() {
          /* Якщо REST не підтримує — пробуємо SSH */
          sshCall(router, '/tool romon neighbor print').then(function(res) {
            scanBtn.textContent = '🔍 Сканувати RoMON сусідів';
            scanBtn.disabled    = false;
            var listEl = document.getElementById('rm-romon-list');
            if (listEl) {
              listEl.innerHTML = res.ok && res.output
                ? '<pre style="font-family:monospace;font-size:12px;color:#a0c0a0;background:#060e14;padding:12px;border-radius:8px;overflow:auto;">' + esc(res.output) + '</pre>'
                : '<div style="color:#e05252">' + esc(res.error || 'Помилка') + '</div>';
            }
          });
        });
      });
    }, 100);
  }

  function renderRoMONList(neighbors, parentRouter) {
    var listEl = document.getElementById('rm-romon-list');
    if (!listEl) return;

    if (!neighbors.length) {
      listEl.innerHTML = '<div style="color:#8ea3b0;font-size:13px;">Сусідів не знайдено. Перевір чи увімкнено RoMON на сусідніх роутерах.</div>';
      return;
    }

    var html = '<div style="font-size:12px;color:#8ea3b0;margin-bottom:10px;">Знайдено ' + neighbors.length + ' RoMON сусідів:</div>';

    neighbors.forEach(function(n) {
      var mac    = n['mac-address'] || n.address || '—';
      var name   = n.identity || n.name || mac;
      var iface  = n.interface || '—';
      var cost   = n.cost || '—';

      html +=
        '<div class="rm-romon-card">' +
          '<div class="rm-romon-icon">🖥️</div>' +
          '<div class="rm-romon-info">' +
            '<div class="rm-romon-name">' + esc(name) + '</div>' +
            '<div class="rm-romon-meta">MAC: ' + esc(mac) + ' | Interface: ' + esc(iface) + ' | Cost: ' + esc(String(cost)) + '</div>' +
          '</div>' +
          '<button class="rm-btn rm-btn-primary" style="font-size:11px;" ' +
          'onclick="window.__rmConnectRomon(' + JSON.stringify({ mac: mac, name: name }) + ')">🔌 Підключити</button>' +
        '</div>';
    });

    listEl.innerHTML = html;

    window.__rmConnectRomon = function(info) {
      var ip   = prompt('IP адреса роутера через RoMON:', '192.168.88.1');
      if (!ip) return;
      var pass = prompt('Пароль (admin):', '');
      addRouter({
        name:   info.name + ' (RoMON)',
        ip:     ip,
        port:   80,
        user:   'admin',
        pass:   pass || '',
        romon:  true,
        romonId: info.mac,
      });
    };
  }

  /* ══════════════════════════════════════════════════════════
     NEIGHBORS (IP Neighbor Discovery)
     ══════════════════════════════════════════════════════════ */
  function renderNeighbors() {
    var cont = document.getElementById('rm-content');
    var router = getActive();
    if (!cont || !router) return;

    cont.innerHTML = '<div class="rm-section-title">🏘️ IP Neighbors <span class="rm-badge rm-badge-warn">⏳</span></div>';

    restCall(router, 'GET', '/ip/neighbor').then(function(data) {
      if (!Array.isArray(data)) { cont.innerHTML = '<div style="color:#e05252">Помилка</div>'; return; }

      var html = '<div class="rm-section-title">🏘️ IP Neighbors <span class="rm-badge">' + data.length + '</span>' +
        '<button class="rm-btn rm-btn-secondary" style="margin-left:auto;font-size:11px;" onclick="window.__rmRefNeigh()">🔄</button></div>';

      data.forEach(function(n) {
        var name    = n.identity || n['system-description'] || '—';
        var ip      = n.address || n['ip-address'] || '—';
        var mac     = n['mac-address'] || '—';
        var iface   = n.interface || '—';
        var board   = n['board'] || n['platform'] || '—';
        var version = n.version || '—';

        html +=
          '<div class="rm-romon-card">' +
            '<div class="rm-romon-icon">🏘️</div>' +
            '<div class="rm-romon-info">' +
              '<div class="rm-romon-name">' + esc(name) + '</div>' +
              '<div class="rm-romon-meta">' +
                'IP: <b>' + esc(ip) + '</b> | MAC: ' + esc(mac) + ' | IF: ' + esc(iface) +
                ' | Board: ' + esc(board) + ' | OS: ' + esc(version) +
              '</div>' +
            '</div>' +
            (ip !== '—' ?
              '<button class="rm-btn rm-btn-primary" style="font-size:11px;" ' +
              'onclick="window.__rmAddNeigh(\'' + esc(ip) + '\',\'' + esc(name) + '\')">🔌 Підключити</button>'
            : '') +
          '</div>';
      });

      if (!data.length) html += '<div style="color:#8ea3b0">Сусідів не знайдено</div>';
      cont.innerHTML = html;

      window.__rmRefNeigh = function() { renderNeighbors(); };
      window.__rmAddNeigh = function(ip, name) {
        var pass = prompt('Пароль для ' + name + ' (' + ip + '):', '');
        addRouter({ name: name, ip: ip, port: 80, user: 'admin', pass: pass || '' });
      };
    }).catch(function() {
      cont.innerHTML = '<div style="color:#e05252">Помилка запиту до /ip/neighbor</div>';
    });
  }

  /* ══════════════════════════════════════════════════════════
     UTILS
     ══════════════════════════════════════════════════════════ */
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ══════════════════════════════════════════════════════════
     PUBLIC API + TRIGGER BUTTON
     ══════════════════════════════════════════════════════════ */
  /* Експортуємо state для CRUD модуля */
  window.__rmGetActiveRouter = function() {
    if (!state.activeRouter) return null;
    return state.routers.find(function(r) { return r.id === state.activeRouter; }) || null;
  };

  window.__rmGetState = function() { return state; };

  window.RouterManager = {
    open:      openManager,
    close:     closeManager,
    addRouter: addRouter,
    _state:    state,
    _getActiveRouter: function() {
      return state.routers.find(function(r) { return r.id === state.activeRouter; }) || null;
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

})();