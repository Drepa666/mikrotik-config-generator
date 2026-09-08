'use strict';

/* ============================================================
   RM Sections — всі секції Router Manager
   Winbox-like з cross-linking між секціями
   ============================================================ */

(function() {

  var PROXY = 'http://localhost:8888';

  function S()  { return window.RMStore; }
  function EB() { return window.RMEventBus; }
  function esc(s) { return window.RMEsc ? window.RMEsc(s) : String(s||''); }

  function restCall(router, method, path, body) {
    return window.RMRestCall(router, method, path, body);
  }

  function sshCall(router, command) {
    return window.RMSshCall(router, command);
  }

  function router() {
    return S().getRouter();
  }

  function cont() {
    return document.getElementById('rm-content');
  }

  /* ══════════════════════════════════════════════════════════
     PROGRESS / STATUS HELPERS
     ══════════════════════════════════════════════════════════ */
  function loading(title) {
    var c = cont();
    if (c) c.innerHTML =
      '<div style="display:flex;align-items:center;gap:12px;padding:20px;">' +
      '<div style="width:20px;height:20px;border:2px solid #2f7a5c;border-top-color:#5fd0a5;border-radius:50%;animation:rm-spin 1s linear infinite;"></div>' +
      '<div style="color:#8ea3b0;font-size:14px;">' + esc(title) + '</div></div>' +
      '<style>@keyframes rm-spin{to{transform:rotate(360deg)}}</style>';
  }

  function showStatus(msg, type) {
    var el = document.getElementById('rm-section-status');
    if (!el) return;
    el.textContent = msg;
    el.className = 'rm-status-' + (type || 'ok');
    el.style.display = 'block';
    setTimeout(function() { if(el) el.style.display='none'; }, 3000);
  }

  /* ══════════════════════════════════════════════════════════
     NAV HELPER — перехід між секціями (cross-link)
     ══════════════════════════════════════════════════════════ */
  function navTo(menu) {
    if (window.__rmSetMenu) window.__rmSetMenu(menu);
  }

  /* ══════════════════════════════════════════════════════════
     СТИЛІ СЕКЦІЙ
     ══════════════════════════════════════════════════════════ */
  function injectSectionStyles() {
    if (document.getElementById('rm-section-styles')) return;
    var s = document.createElement('style');
    s.id = 'rm-section-styles';
    s.textContent = `
      .rm-status-ok   { color:#5fd0a5; background:#0d2a1a; border:1px solid #2f7a5c; padding:6px 12px; border-radius:6px; font-size:12px; }
      .rm-status-err  { color:#e05252; background:#3a1a1a; border:1px solid #b04040; padding:6px 12px; border-radius:6px; font-size:12px; }
      .rm-status-warn { color:#f0a840; background:#3a2a10; border:1px solid #b87a20; padding:6px 12px; border-radius:6px; font-size:12px; }
      #rm-section-status { display:none; margin-bottom:12px; }

      /* Cross-link кнопки */
      .rm-xlink {
        color:#5fd0a5; cursor:pointer; text-decoration:underline dotted;
        font-size:11.5px; background:none; border:none; padding:0;
      }
      .rm-xlink:hover { color:#a0f0d0; }

      /* Inline edit */
      .rm-inline-edit {
        display:inline-flex; align-items:center; gap:4px;
      }
      .rm-inline-input {
        background:#0d1821; border:1px solid #2f7a5c; border-radius:4px;
        color:#e6edf3; padding:3px 6px; font-size:12px; width:140px;
      }
      .rm-inline-save {
        padding:3px 8px; background:#2f7a5c; color:#fff; border:none;
        border-radius:4px; cursor:pointer; font-size:11px;
      }
      .rm-inline-cancel {
        padding:3px 8px; background:#1a2d3d; color:#8ea3b0; border:1px solid #2a3b48;
        border-radius:4px; cursor:pointer; font-size:11px;
      }

      /* Stats bar */
      .rm-stats-bar {
        display:flex; gap:12px; flex-wrap:wrap; margin-bottom:16px;
      }
      .rm-stat-item {
        background:#111d27; border:1px solid #2a3b48; border-radius:8px;
        padding:8px 14px; font-size:12px; color:#8ea3b0;
      }
      .rm-stat-item b { color:#5fd0a5; font-size:15px; }

      /* Tabs в секції */
      .rm-section-tabs {
        display:flex; gap:2px; margin-bottom:16px; border-bottom:1px solid #2a3b48; padding-bottom:0;
      }
      .rm-section-tab {
        padding:7px 14px; cursor:pointer; font-size:12.5px; color:#8ea3b0;
        border-radius:6px 6px 0 0; border:1px solid transparent; border-bottom:none;
        transition:all .12s;
      }
      .rm-section-tab:hover { background:#1a2d3d; color:#e6edf3; }
      .rm-section-tab.active {
        background:#111d27; border-color:#2a3b48; color:#5fd0a5;
        margin-bottom:-1px; padding-bottom:8px;
      }

      /* Live indicator */
      .rm-live-dot {
        display:inline-block; width:7px; height:7px; border-radius:50%;
        background:#5fd0a5; animation:rm-pulse 1.5s ease-in-out infinite;
      }
      @keyframes rm-pulse {
        0%,100% { opacity:1; } 50% { opacity:.3; }
      }

      /* Compact table */
      .rm-table-compact td, .rm-table-compact th { padding:5px 8px; font-size:12px; }
    `;
    document.head.appendChild(s);
  }

  injectSectionStyles();

  /* ══════════════════════════════════════════════════════════
     SECTION HEADER
     ══════════════════════════════════════════════════════════ */
  function sectionHeader(title, count, actions) {
    return '<div class="rm-section-title">' +
      title +
      (count !== undefined ? ' <span class="rm-badge" id="rm-count-badge">' + count + '</span>' : '') +
      '<div style="margin-left:auto;display:flex;gap:6px;align-items:center;">' +
        '<div id="rm-section-status"></div>' +
        (actions || '') +
        '<button class="rm-btn rm-btn-secondary" style="font-size:11px;" onclick="window.__rmRefreshSection()">🔄</button>' +
      '</div>' +
    '</div>';
  }

  /* ══════════════════════════════════════════════════════════
     INTERFACES — повна секція з tabs
     ══════════════════════════════════════════════════════════ */
  window.rmSectionInterfaces = function() {
    var r = router(); if (!r) return;
    loading('Завантаження інтерфейсів...');

    Promise.all([
      S().get('interfaces'),
      S().get('bridge'),
      S().get('vlan'),
      S().get('wireguard'),
      S().get('pppoeClient'),
      S().get('lte'),
      S().get('bonding'),
    ]).then(function(results) {
      var ifaces    = results[0];
      var bridges   = results[1];
      var vlans     = results[2];
      var wg        = results[3];
      var pppoe     = results[4];
      var lteIf     = results[5];
      var bonding   = results[6];

      var running   = ifaces.filter(function(i) { return i.running === 'true'; }).length;
      var disabled  = ifaces.filter(function(i) { return i.disabled === 'true'; }).length;

      var c = cont();
      if (!c) return;

      var html = sectionHeader('🌐 Interfaces',
        ifaces.length,
        '<button class="rm-btn rm-btn-primary" style="font-size:11px;" onclick="window.__rmAddInterface()">＋ Додати</button>'
      );

      /* Stats */
      html += '<div class="rm-stats-bar">' +
        statItem('Всього', ifaces.length) +
        statItem('▶ Running', running, '#5fd0a5') +
        statItem('■ Disabled', disabled, '#e05252') +
        statItem('Bridge', bridges.length) +
        statItem('VLAN', vlans.length) +
        statItem('WireGuard', wg.length) +
      '</div>';

      /* Tabs */
      html += '<div class="rm-section-tabs">' +
        tab('all',     'Всі (' + ifaces.length + ')', true) +
        tab('ether',   'Ethernet') +
        tab('bridge',  'Bridge (' + bridges.length + ')') +
        tab('vlan',    'VLAN (' + vlans.length + ')') +
        tab('wireless','Wireless') +
        tab('wg',      'WireGuard') +
        tab('pppoe',   'PPPoE') +
        tab('lte',     'LTE') +
      '</div>';

      /* Таблиця */
      html += '<div id="rm-if-table">' + renderIfTable(ifaces, 'all') + '</div>';

      c.innerHTML = html;

      /* Tab events */
      c.querySelectorAll('.rm-section-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
          c.querySelectorAll('.rm-section-tab').forEach(function(t) { t.classList.remove('active'); });
          tab.classList.add('active');
          var filter = tab.dataset.tab;
          var wrap = document.getElementById('rm-if-table');
          if (wrap) wrap.innerHTML = renderIfTable(ifaces, filter, bridges, vlans, wg, pppoe, lteIf);
        });
      });

      window.__rmRefreshSection = function() {
        S().invalidateRelated('interfaces');
        window.rmSectionInterfaces();
      };

      window.__rmAddInterface = function() {
        openInterfaceAddDialog();
      };
    });
  };

  function renderIfTable(ifaces, filter, bridges, vlans, wg, pppoe, lteIf) {
    var filtered = ifaces;
    if (filter === 'ether')   filtered = ifaces.filter(function(i) { return i.type === 'ether'; });
    if (filter === 'bridge')  filtered = ifaces.filter(function(i) { return i.type === 'bridge'; });
    if (filter === 'vlan')    filtered = ifaces.filter(function(i) { return i.type === 'vlan'; });
    if (filter === 'wireless')filtered = ifaces.filter(function(i) { return i.type === 'wlan' || (i.type||'').includes('wireless'); });
    if (filter === 'wg')      filtered = ifaces.filter(function(i) { return i.type === 'wireguard'; });
    if (filter === 'pppoe')   filtered = ifaces.filter(function(i) { return i.type === 'pppoe-out'; });
    if (filter === 'lte')     filtered = ifaces.filter(function(i) { return i.type === 'lte'; });

    if (!filtered.length) return '<div style="color:#8ea3b0;padding:20px;text-align:center;">Немає інтерфейсів цього типу</div>';

    var html = '<div style="overflow-x:auto;"><table class="rm-table rm-table-compact">' +
      '<tr>' +
        '<th style="width:32px;"></th>' +
        '<th>Назва</th><th>Тип</th><th>MAC</th><th>MTU</th>' +
        '<th>TX Rate</th><th>RX Rate</th><th>Статус</th>' +
        '<th>Коментар</th><th style="width:120px;text-align:right;">Дії</th>' +
      '</tr>';

    filtered.forEach(function(iface) {
      var running  = iface.running === 'true';
      var disabled = iface.disabled === 'true';
      var id = iface['.id'] || '';

      html += '<tr>' +
        '<td>' + ifIcon(iface.type) + '</td>' +
        '<td><b style="cursor:pointer;color:#5fd0a5;" onclick="window.__rmIfDetail(\'' + esc(id) + '\',\'' + esc(iface.name) + '\')">' + esc(iface.name) + '</b></td>' +
        '<td><span style="font-size:11px;color:#8ea3b0;">' + esc(iface.type||'') + '</span></td>' +
        '<td style="font-family:monospace;font-size:11px;">' + esc(iface['mac-address']||'') + '</td>' +
        '<td>' + esc(iface.mtu||'') + '</td>' +
        '<td style="font-size:11px;">' + esc(iface['tx-byte']||'') + '</td>' +
        '<td style="font-size:11px;">' + esc(iface['rx-byte']||'') + '</td>' +
        '<td>' +
          '<span class="rm-badge' + (running && !disabled ? '' : ' rm-badge-err') + '">' +
          (disabled ? '■ Disabled' : running ? '▶ Running' : '○ Down') +
          '</span>' +
        '</td>' +
        '<td style="color:#8ea3b0;font-size:11px;">' + esc(iface.comment||'') + '</td>' +
        '<td style="text-align:right;white-space:nowrap;">' +
          '<button class="rm-act-btn ' + (disabled ? 'rm-act-enable' : 'rm-act-disable') +
            '" onclick="window.__rmIfToggle(\'' + esc(id) + '\',\'' + esc(iface.name) + '\',' + disabled + ')">' +
            (disabled ? '▶' : '‖') + '</button>' +
          '<button class="rm-act-btn rm-act-edit" onclick="window.__rmIfEdit(\'' + esc(id) + '\',\'' + esc(iface.name) + '\')">✏️</button>' +
          /* Cross-link: показати IP адреси цього інтерфейсу */
          '<button class="rm-xlink" onclick="window.__rmIfShowIP(\'' + esc(iface.name) + '\')" title="Показати IP адреси">IP</button>' +
        '</td>' +
      '</tr>';
    });

    html += '</table></div>';

    /* Bind actions */
    setTimeout(function() {
      var r = router();
      if (!r) return;

      window.__rmIfToggle = function(id, name, disabled) {
        var path = '/interface/' + id + (disabled ? '/enable' : '/disable');
        restCall(r, 'POST', path, {}).then(function() {
          S().invalidateRelated('interfaces');
          window.rmSectionInterfaces();
        }).catch(function() {
          sshCall(r, '/interface ' + (disabled ? 'enable' : 'disable') + ' "' + name + '"').then(function() {
            S().invalidateRelated('interfaces');
            window.rmSectionInterfaces();
          });
        });
      };

      window.__rmIfEdit = function(id, name) {
        S().get('interfaces').then(function(ifaces) {
          var iface = ifaces.find(function(i) { return i['.id'] === id; }) || {};
          openCRUDModal('✏️ Interface — ' + name, [
            { key: 'name',    label: 'Назва',    value: iface.name },
            { key: 'mtu',     label: 'MTU',      value: iface.mtu     || '1500' },
            { key: 'comment', label: 'Коментар', value: iface.comment || '' },
            { key: 'disabled',label: 'Вимкнено', type:'checkbox', value: iface.disabled },
          ], function(data, done) {
            restCall(r, 'PATCH', '/interface/' + id, data).then(function(res) {
              if (res && res.error) { done(false, res.error); return; }
              S().invalidateRelated('interfaces');
              done(true);
              setTimeout(window.rmSectionInterfaces, 500);
            }).catch(function(e) { done(false, String(e)); });
          });
        });
      };

      /* Cross-link: перехід до IP Addresses з фільтром */
      window.__rmIfShowIP = function(ifaceName) {
        window.__rmIfFilter = ifaceName;
        navTo('ip-addresses');
      };

      window.__rmIfDetail = function(id, name) {
        window.__rmIfEdit(id, name);
      };
    }, 100);

    return html;
  }

  function ifIcon(type) {
    var icons = {
      ether:      '🔌', bridge: '🌉', vlan: '🔀',
      wlan:       '📡', wireguard: '🔐', 'pppoe-out': '🔗',
      lte:        '📶', bonding: '🔗', loopback: '↩️',
    };
    return icons[type] || '🌐';
  }

  function openInterfaceAddDialog() {
    openCRUDModal('➕ Додати VLAN інтерфейс', [
      { key: 'name',      label: 'Назва',   required: true, placeholder: 'vlan20' },
      { key: 'vlan-id',   label: 'VLAN ID', required: true, placeholder: '20' },
      { key: 'interface', label: 'Батьківський інтерфейс', required: true, placeholder: 'ether1' },
      { key: 'comment',   label: 'Коментар' },
    ], function(data, done) {
      restCall(router(), 'PUT', '/interface/vlan', data).then(function(res) {
        if (res && res.error) { done(false, res.error); return; }
        S().invalidateRelated('interfaces');
        done(true, 'VLAN додано!');
        setTimeout(window.rmSectionInterfaces, 500);
      }).catch(function(e) { done(false, String(e)); });
    });
  }

  /* ══════════════════════════════════════════════════════════
     IP ADDRESSES — з cross-links до Interfaces та Routes
     ══════════════════════════════════════════════════════════ */
  window.rmSectionIPAddresses = function() {
    var r = router(); if (!r) return;
    loading('Завантаження IP адрес...');

    Promise.all([
      S().get('addresses'),
      S().get('interfaces'),
    ]).then(function(results) {
      var addrs  = results[0];
      var ifaces = results[1];
      var ifFilter = window.__rmIfFilter;
      window.__rmIfFilter = null;

      if (ifFilter) {
        addrs = addrs.filter(function(a) { return a.interface === ifFilter; });
      }

      var c = cont(); if (!c) return;

      var html = sectionHeader('📋 IP Addresses', addrs.length,
        '<button class="rm-btn rm-btn-primary" style="font-size:11px;" onclick="window.__rmAddAddr()">＋ Додати</button>'
      );

      if (ifFilter) {
        html += '<div class="rm-badge rm-badge-warn" style="margin-bottom:12px;">Фільтр: ' + esc(ifFilter) +
          ' <button onclick="window.rmSectionIPAddresses()" style="background:none;border:none;color:#f0a840;cursor:pointer;padding:0 4px;">✕</button></div>';
      }

      html += '<div style="overflow-x:auto;"><table class="rm-table rm-table-compact">' +
        '<tr><th>Адреса</th><th>Мережа</th><th>Інтерфейс</th><th>Динамічна</th><th>Коментар</th><th style="text-align:right;">Дії</th></tr>';

      addrs.forEach(function(a) {
        var id = a['.id'] || '';
        html += '<tr>' +
          '<td><b>' + esc(a.address||'') + '</b></td>' +
          '<td style="font-size:11px;color:#8ea3b0;">' + esc(a.network||'') + '</td>' +
          '<td>' +
            /* Cross-link до Interfaces */
            '<button class="rm-xlink" onclick="window.__rmGoToIf(\'' + esc(a.interface) + '\')">' + esc(a.interface||'') + '</button>' +
          '</td>' +
          '<td>' + boolBadge(a.dynamic) + '</td>' +
          '<td style="color:#8ea3b0;font-size:11px;">' + esc(a.comment||'') + '</td>' +
          '<td style="text-align:right;white-space:nowrap;">' +
            (a.dynamic !== 'true' ? '<button class="rm-act-btn rm-act-edit" onclick="window.__rmEditAddr(\'' + esc(id) + '\')">✏️</button>' +
            '<button class="rm-act-btn rm-act-del" onclick="window.__rmDelAddr(\'' + esc(id) + '\',\'' + esc(a.address) + '\')">🗑</button>' : '') +
          '</td>' +
        '</tr>';
      });

      html += '</table></div>';

      /* Cross-link: Переглянути маршрути для цієї мережі */
      html += '<div style="margin-top:12px;">' +
        '<button class="rm-btn rm-btn-secondary" style="font-size:11px;" onclick="navTo(\'ip-routes\')">→ Переглянути маршрути</button>' +
        '<button class="rm-btn rm-btn-secondary" style="font-size:11px;margin-left:8px;" onclick="navTo(\'ip-arp\')">→ ARP таблиця</button>' +
      '</div>';

      c.innerHTML = html;

      window.__rmRefreshSection = function() { S().invalidateRelated('addresses'); window.rmSectionIPAddresses(); };
      window.__rmGoToIf = function(name) { window.__rmIfFilter = name; navTo('interfaces'); };

      window.__rmAddAddr = function() {
        openCRUDModal('➕ IP Адреса', [
          { key: 'address',   label: 'IP/маска',    required: true, placeholder: '192.168.1.1/24' },
          { key: 'interface', label: 'Інтерфейс',   required: true, placeholder: ifaces.map(function(i){return i.name;}).join(', ') },
          { key: 'comment',   label: 'Коментар' },
        ], function(data, done) {
          restCall(r, 'PUT', '/ip/address', data).then(function(res) {
            if (res && res.error) { done(false, res.error); return; }
            S().invalidateRelated('addresses'); done(true);
            setTimeout(window.rmSectionIPAddresses, 500);
          }).catch(function(e) { done(false, String(e)); });
        });
      };

      window.__rmEditAddr = function(id) {
        S().get('addresses').then(function(addrs) {
          var a = addrs.find(function(x) { return x['.id'] === id; }) || {};
          openCRUDModal('✏️ IP Адреса', [
            { key: 'address',   label: 'IP/маска',  value: a.address   || '' },
            { key: 'interface', label: 'Інтерфейс', value: a.interface  || '' },
            { key: 'comment',   label: 'Коментар',  value: a.comment   || '' },
            { key: 'disabled',  label: 'Вимкнено',  type:'checkbox', value: a.disabled },
          ], function(data, done) {
            restCall(r, 'PATCH', '/ip/address/' + id, data).then(function(res) {
              if (res && res.error) { done(false, res.error); return; }
              S().invalidateRelated('addresses'); done(true);
              setTimeout(window.rmSectionIPAddresses, 500);
            }).catch(function(e) { done(false, String(e)); });
          });
        });
      };

      window.__rmDelAddr = function(id, addr) {
        if (!confirm('Видалити адресу "' + addr + '"?')) return;
        restCall(r, 'DELETE', '/ip/address/' + id, null).then(function() {
          S().invalidateRelated('addresses');
          window.rmSectionIPAddresses();
        });
      };
    });
  };

  /* ══════════════════════════════════════════════════════════
     ROUTES — з cross-links
     ══════════════════════════════════════════════════════════ */
  window.rmSectionRoutes = function() {
    var r = router(); if (!r) return;
    loading('Завантаження маршрутів...');

    S().get('routes').then(function(routes) {
      var active   = routes.filter(function(r) { return r.active === 'true'; }).length;
      var dynamic  = routes.filter(function(r) { return r.dynamic === 'true'; }).length;
      var c = cont(); if (!c) return;

      var html = sectionHeader('🛣️ Routes', routes.length,
        '<button class="rm-btn rm-btn-primary" style="font-size:11px;" onclick="window.__rmAddRoute()">＋ Додати</button>'
      );

      html += '<div class="rm-stats-bar">' +
        statItem('Всього', routes.length) +
        statItem('Active', active, '#5fd0a5') +
        statItem('Dynamic', dynamic, '#f0a840') +
      '</div>';

      /* Фільтр */
      html += '<div style="display:flex;gap:8px;margin-bottom:12px;">' +
        '<input class="rm-search-input" id="rm-route-search" placeholder="🔍 Пошук..." style="max-width:240px;">' +
        '<select id="rm-route-filter" style="background:#0d1821;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:5px 8px;font-size:12px;">' +
          '<option value="">Всі</option>' +
          '<option value="active">Active</option>' +
          '<option value="static">Static</option>' +
          '<option value="dynamic">Dynamic</option>' +
        '</select>' +
      '</div>';

      html += '<div id="rm-routes-table">' + renderRoutesTable(routes) + '</div>';

      c.innerHTML = html;

      /* Search / filter */
      setTimeout(function() {
        var search = document.getElementById('rm-route-search');
        var filter = document.getElementById('rm-route-filter');
        function update() {
          var q = search ? search.value.toLowerCase() : '';
          var f = filter ? filter.value : '';
          var filtered = routes.filter(function(r) {
            var textOk = !q || JSON.stringify(r).toLowerCase().includes(q);
            var fOk    = !f ||
              (f === 'active'  && r.active  === 'true') ||
              (f === 'static'  && r.static  === 'true') ||
              (f === 'dynamic' && r.dynamic === 'true');
            return textOk && fOk;
          });
          var wrap = document.getElementById('rm-routes-table');
          if (wrap) wrap.innerHTML = renderRoutesTable(filtered);
        }
        if (search) search.addEventListener('input', update);
        if (filter) filter.addEventListener('change', update);
      }, 100);

      window.__rmRefreshSection = function() { S().invalidateRelated('routes'); window.rmSectionRoutes(); };

      window.__rmAddRoute = function() {
        openCRUDModal('➕ Маршрут', [
          { key: 'dst-address', label: 'Мережа призначення', required: true, placeholder: '0.0.0.0/0' },
          { key: 'gateway',     label: 'Шлюз / Інтерфейс', required: true, placeholder: '192.168.88.254 або ether1' },
          { key: 'distance',    label: 'Distance', default: '1' },
          { key: 'routing-table', label: 'Routing Table', placeholder: 'main або порожньо' },
          { key: 'comment',     label: 'Коментар' },
        ], function(data, done) {
          restCall(r, 'PUT', '/ip/route', data).then(function(res) {
            if (res && res.error) { done(false, res.error); return; }
            S().invalidateRelated('routes'); done(true);
            setTimeout(window.rmSectionRoutes, 500);
          }).catch(function(e) { done(false, String(e)); });
        });
      };
    });
  };

  function renderRoutesTable(routes) {
    if (!routes.length) return '<div style="color:#8ea3b0;padding:20px;text-align:center;">Маршрутів немає</div>';
    var r = router();
    var html = '<div style="overflow-x:auto;"><table class="rm-table rm-table-compact">' +
      '<tr><th>Dst Address</th><th>Gateway</th><th>Interface</th><th>Distance</th><th>Active</th><th>Dynamic</th><th>Коментар</th><th style="text-align:right;">Дії</th></tr>';

    routes.forEach(function(route) {
      var id = route['.id'] || '';
      html += '<tr>' +
        '<td><b>' + esc(route['dst-address']||'') + '</b></td>' +
        '<td>' + esc(route.gateway||'') + '</td>' +
        '<td>' +
          (route.interface ?
            '<button class="rm-xlink" onclick="window.__rmGoToIf(\'' + esc(route.interface) + '\')">' + esc(route.interface) + '</button>' :
            '<span style="color:#8ea3b0">—</span>') +
        '</td>' +
        '<td>' + esc(route.distance||'') + '</td>' +
        '<td>' + boolBadge(route.active) + '</td>' +
        '<td>' + boolBadge(route.dynamic) + '</td>' +
        '<td style="color:#8ea3b0;font-size:11px;">' + esc(route.comment||'') + '</td>' +
        '<td style="text-align:right;white-space:nowrap;">' +
          (route.dynamic !== 'true' ?
            '<button class="rm-act-btn rm-act-edit" onclick="window.__rmEditRoute(\'' + esc(id) + '\')">✏️</button>' +
            '<button class="rm-act-btn rm-act-del" onclick="window.__rmDelRoute(\'' + esc(id) + '\',\'' + esc(route['dst-address']) + '\')">🗑</button>'
          : '') +
        '</td>' +
      '</tr>';
    });

    html += '</table></div>';

    window.__rmEditRoute = function(id) {
      S().get('routes').then(function(routes) {
        var route = routes.find(function(x) { return x['.id'] === id; }) || {};
        openCRUDModal('✏️ Маршрут', [
          { key: 'dst-address', label: 'Мережа', value: route['dst-address'] || '' },
          { key: 'gateway',     label: 'Шлюз',   value: route.gateway || '' },
          { key: 'distance',    label: 'Distance', value: route.distance || '1' },
          { key: 'comment',     label: 'Коментар', value: route.comment || '' },
          { key: 'disabled',    label: 'Вимкнено', type:'checkbox', value: route.disabled },
        ], function(data, done) {
          restCall(r, 'PATCH', '/ip/route/' + id, data).then(function(res) {
            if (res && res.error) { done(false, res.error); return; }
            S().invalidateRelated('routes'); done(true);
            setTimeout(window.rmSectionRoutes, 500);
          }).catch(function(e) { done(false, String(e)); });
        });
      });
    };

    window.__rmDelRoute = function(id, dst) {
      if (!confirm('Видалити маршрут "' + dst + '"?')) return;
      restCall(r, 'DELETE', '/ip/route/' + id, null).then(function() {
        S().invalidateRelated('routes');
        window.rmSectionRoutes();
      });
    };

    return html;
  }

  /* ══════════════════════════════════════════════════════════
     DHCP — Servers + Leases + Networks + Pools в tabs
     ══════════════════════════════════════════════════════════ */
  window.rmSectionDHCP = function() {
    var r = router(); if (!r) return;
    loading('Завантаження DHCP...');

    Promise.all([
      S().get('dhcpServers'),
      S().get('dhcpLeases'),
      S().get('dhcpNetworks'),
      S().get('ipPools'),
    ]).then(function(results) {
      var servers  = results[0];
      var leases   = results[1];
      var networks = results[2];
      var pools    = results[3];

      var active = leases.filter(function(l) { return l.status === 'bound'; }).length;
      var c = cont(); if (!c) return;

      var html = sectionHeader('📡 DHCP', null);

      html += '<div class="rm-stats-bar">' +
        statItem('Servers', servers.length) +
        statItem('Leases', leases.length) +
        statItem('Bound', active, '#5fd0a5') +
        statItem('Pools', pools.length) +
      '</div>';

      html += '<div class="rm-section-tabs">' +
        tab('servers',  'Servers (' + servers.length + ')', true) +
        tab('leases',   'Leases (' + leases.length + ')') +
        tab('networks', 'Networks (' + networks.length + ')') +
        tab('pools',    'IP Pools (' + pools.length + ')') +
      '</div>';

      html += '<div id="rm-dhcp-content">' + renderDHCPServers(servers, pools) + '</div>';

      c.innerHTML = html;

      c.querySelectorAll('.rm-section-tab').forEach(function(t) {
        t.addEventListener('click', function() {
          c.querySelectorAll('.rm-section-tab').forEach(function(x) { x.classList.remove('active'); });
          t.classList.add('active');
          var wrap = document.getElementById('rm-dhcp-content');
          if (!wrap) return;
          var tab = t.dataset.tab;
          if (tab === 'servers')  wrap.innerHTML = renderDHCPServers(servers, pools);
          if (tab === 'leases')   wrap.innerHTML = renderDHCPLeases(leases);
          if (tab === 'networks') wrap.innerHTML = renderDHCPNetworks(networks);
          if (tab === 'pools')    wrap.innerHTML = renderIPPools(pools);
        });
      });

      window.__rmRefreshSection = function() {
        S().invalidateRelated('dhcpServers');
        window.rmSectionDHCP();
      };
    });
  };

  function renderDHCPServers(servers, pools) {
    var r = router();
    var html = '<div style="display:flex;justify-content:flex-end;margin-bottom:10px;">' +
      '<button class="rm-btn rm-btn-primary" style="font-size:11px;" onclick="window.__rmAddDHCPServer()">＋ Додати сервер</button>' +
    '</div>';

    if (!servers.length) return html + '<div style="color:#8ea3b0;padding:20px;text-align:center;">DHCP серверів немає</div>';

    html += '<table class="rm-table rm-table-compact"><tr><th>Назва</th><th>Інтерфейс</th><th>Pool</th><th>Lease Time</th><th>Статус</th><th style="text-align:right;">Дії</th></tr>';

    servers.forEach(function(s) {
      var id = s['.id'] || '';
      var disabled = s.disabled === 'true';
      html += '<tr>' +
        '<td><b>' + esc(s.name||'') + '</b></td>' +
        '<td><button class="rm-xlink" onclick="window.__rmGoToIf(\'' + esc(s.interface) + '\')">' + esc(s.interface||'') + '</button></td>' +
        '<td>' +
          '<button class="rm-xlink" onclick="window.__rmDHCPGoPool()">' + esc(s['address-pool']||'') + '</button>' +
        '</td>' +
        '<td>' + esc(s['lease-time']||'') + '</td>' +
        '<td>' + statusBadge(!disabled) + '</td>' +
        '<td style="text-align:right;white-space:nowrap;">' +
          '<button class="rm-act-btn ' + (disabled ? 'rm-act-enable' : 'rm-act-disable') +
            '" onclick="window.__rmToggleDHCP(\'' + esc(id) + '\',' + disabled + ')">' + (disabled ? '▶' : '‖') + '</button>' +
          '<button class="rm-act-btn rm-act-edit" onclick="window.__rmEditDHCPServer(\'' + esc(id) + '\')">✏️</button>' +
        '</td></tr>';
    });

    html += '</table>';

    window.__rmDHCPGoPool = function() {
      /* Переключаємо на tab Pools */
      var tabs = document.querySelectorAll('.rm-section-tab');
      tabs.forEach(function(t) {
        if (t.dataset.tab === 'pools') {
          t.click();
        }
      });
    };

    window.__rmToggleDHCP = function(id, disabled) {
      restCall(r, 'PATCH', '/ip/dhcp-server/' + id, { disabled: disabled ? 'no' : 'yes' }).then(function() {
        S().invalidateRelated('dhcpServers');
        window.rmSectionDHCP();
      });
    };

    window.__rmAddDHCPServer = function() {
      var poolNames = (pools || []).map(function(p) { return p.name; });
      openCRUDModal('➕ DHCP Server', [
        { key: 'name',         label: 'Назва', required: true, placeholder: 'dhcp-lan' },
        { key: 'interface',    label: 'Інтерфейс', required: true, placeholder: 'bridge-lan' },
        { key: 'address-pool', label: 'Address Pool', placeholder: poolNames.join(' або ') },
        { key: 'lease-time',   label: 'Lease Time', default: '1d' },
      ], function(data, done) {
        restCall(r, 'PUT', '/ip/dhcp-server', data).then(function(res) {
          if (res && res.error) { done(false, res.error); return; }
          S().invalidateRelated('dhcpServers'); done(true);
          setTimeout(window.rmSectionDHCP, 500);
        }).catch(function(e) { done(false, String(e)); });
      });
    };

    window.__rmEditDHCPServer = function(id) {
      S().get('dhcpServers').then(function(servers) {
        var s = servers.find(function(x) { return x['.id'] === id; }) || {};
        openCRUDModal('✏️ DHCP Server', [
          { key: 'name',         label: 'Назва',        value: s.name || '' },
          { key: 'interface',    label: 'Інтерфейс',    value: s.interface || '' },
          { key: 'address-pool', label: 'Address Pool', value: s['address-pool'] || '' },
          { key: 'lease-time',   label: 'Lease Time',   value: s['lease-time'] || '1d' },
          { key: 'disabled',     label: 'Вимкнено',     type:'checkbox', value: s.disabled },
        ], function(data, done) {
          restCall(r, 'PATCH', '/ip/dhcp-server/' + id, data).then(function(res) {
            if (res && res.error) { done(false, res.error); return; }
            S().invalidateRelated('dhcpServers'); done(true);
            setTimeout(window.rmSectionDHCP, 500);
          }).catch(function(e) { done(false, String(e)); });
        });
      });
    };

    return html;
  }

  function renderDHCPLeases(leases) {
    var r = router();
    var html = '<div style="display:flex;gap:8px;margin-bottom:10px;">' +
      '<input class="rm-search-input" id="rm-lease-search" placeholder="🔍 MAC, IP, Hostname...">' +
      '<button class="rm-btn rm-btn-primary" style="font-size:11px;" onclick="window.__rmAddLease()">＋ Статична оренда</button>' +
    '</div>';

    html += '<table class="rm-table rm-table-compact"><tr><th>IP</th><th>MAC</th><th>Hostname</th><th>Server</th><th>Status</th><th>Expires</th><th style="text-align:right;">Дії</th></tr>';

    leases.forEach(function(l) {
      var id = l['.id'] || '';
      var bound = l.status === 'bound';
      html += '<tr>' +
        '<td><b>' + esc(l.address||'') + '</b></td>' +
        '<td style="font-family:monospace;font-size:11px;">' + esc(l['mac-address']||'') + '</td>' +
        '<td>' + esc(l['host-name']||'') + '</td>' +
        '<td>' + esc(l.server||'') + '</td>' +
        '<td><span class="rm-badge' + (bound ? '' : ' rm-badge-warn') + '">' + esc(l.status||'') + '</span></td>' +
        '<td style="font-size:11px;color:#8ea3b0;">' + esc(l['expires-after']||'') + '</td>' +
        '<td style="text-align:right;white-space:nowrap;">' +
          (l.dynamic === 'true' ?
            '<button class="rm-act-btn rm-act-enable" onclick="window.__rmMakeStatic(\'' + esc(id) + '\')">📌 Static</button>' :
            '<button class="rm-act-btn rm-act-edit" onclick="window.__rmEditLease(\'' + esc(id) + '\')">✏️</button>' +
            '<button class="rm-act-btn rm-act-del" onclick="window.__rmDelLease(\'' + esc(id) + '\',\'' + esc(l.address) + '\')">🗑</button>') +
        '</td></tr>';
    });

    html += '</table>';

    setTimeout(function() {
      var search = document.getElementById('rm-lease-search');
      if (search) search.addEventListener('input', function() {
        var q = search.value.toLowerCase();
        var rows = document.querySelectorAll('#rm-dhcp-content table tr:not(:first-child)');
        rows.forEach(function(row) {
          row.style.display = !q || row.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
      });

      window.__rmMakeStatic = function(id) {
        restCall(r, 'POST', '/ip/dhcp-server/lease/' + id + '/make-static', {}).then(function() {
          S().invalidateRelated('dhcpLeases');
          window.rmSectionDHCP();
        });
      };

      window.__rmAddLease = function() {
        openCRUDModal('➕ Статична оренда', [
          { key: 'address',     label: 'IP адреса',   required: true },
          { key: 'mac-address', label: 'MAC адреса',  required: true, placeholder: 'AA:BB:CC:DD:EE:FF' },
          { key: 'host-name',   label: 'Hostname' },
          { key: 'comment',     label: 'Коментар' },
        ], function(data, done) {
          restCall(r, 'PUT', '/ip/dhcp-server/lease', data).then(function(res) {
            if (res && res.error) { done(false, res.error); return; }
            S().invalidateRelated('dhcpLeases'); done(true);
            setTimeout(window.rmSectionDHCP, 500);
          }).catch(function(e) { done(false, String(e)); });
        });
      };

      window.__rmEditLease = function(id) {
        S().get('dhcpLeases').then(function(leases) {
          var l = leases.find(function(x) { return x['.id'] === id; }) || {};
          openCRUDModal('✏️ DHCP Lease', [
            { key: 'address',     label: 'IP',       value: l.address || '' },
            { key: 'mac-address', label: 'MAC',      value: l['mac-address'] || '' },
            { key: 'host-name',   label: 'Hostname', value: l['host-name'] || '' },
            { key: 'comment',     label: 'Коментар', value: l.comment || '' },
          ], function(data, done) {
            restCall(r, 'PATCH', '/ip/dhcp-server/lease/' + id, data).then(function(res) {
              if (res && res.error) { done(false, res.error); return; }
              S().invalidateRelated('dhcpLeases'); done(true);
              setTimeout(window.rmSectionDHCP, 500);
            }).catch(function(e) { done(false, String(e)); });
          });
        });
      };

      window.__rmDelLease = function(id, addr) {
        if (!confirm('Видалити lease "' + addr + '"?')) return;
        restCall(r, 'DELETE', '/ip/dhcp-server/lease/' + id, null).then(function() {
          S().invalidateRelated('dhcpLeases');
          window.rmSectionDHCP();
        });
      };
    }, 100);

    return html;
  }

  function renderDHCPNetworks(networks) {
    var r = router();
    var html = '<div style="display:flex;justify-content:flex-end;margin-bottom:10px;">' +
      '<button class="rm-btn rm-btn-primary" style="font-size:11px;" onclick="window.__rmAddDHCPNet()">＋ Додати мережу</button>' +
    '</div>';
    html += '<table class="rm-table rm-table-compact"><tr><th>Address</th><th>Gateway</th><th>DNS Servers</th><th>Domain</th><th style="text-align:right;">Дії</th></tr>';
    networks.forEach(function(n) {
      var id = n['.id'] || '';
      html += '<tr>' +
        '<td><b>' + esc(n.address||'') + '</b></td>' +
        '<td>' + esc(n.gateway||'') + '</td>' +
        '<td>' + esc(n['dns-server']||'') + '</td>' +
        '<td>' + esc(n.domain||'') + '</td>' +
        '<td style="text-align:right;">' +
          '<button class="rm-act-btn rm-act-edit" onclick="window.__rmEditDHCPNet(\'' + esc(id) + '\')">✏️</button>' +
          '<button class="rm-act-btn rm-act-del" onclick="window.__rmDelDHCPNet(\'' + esc(id) + '\',\'' + esc(n.address) + '\')">🗑</button>' +
        '</td></tr>';
    });
    html += '</table>';

    window.__rmAddDHCPNet = function() {
      openCRUDModal('➕ DHCP Network', [
        { key: 'address',    label: 'Мережа', required: true, placeholder: '192.168.88.0/24' },
        { key: 'gateway',    label: 'Gateway', required: true, placeholder: '192.168.88.1' },
        { key: 'dns-server', label: 'DNS Servers', placeholder: '192.168.88.1,8.8.8.8' },
        { key: 'domain',     label: 'Domain', placeholder: 'lan' },
      ], function(data, done) {
        restCall(r, 'PUT', '/ip/dhcp-server/network', data).then(function(res) {
          if (res && res.error) { done(false, res.error); return; }
          S().invalidateRelated('dhcpNetworks'); done(true);
          setTimeout(window.rmSectionDHCP, 500);
        }).catch(function(e) { done(false, String(e)); });
      });
    };

    window.__rmEditDHCPNet = function(id) {
      S().get('dhcpNetworks').then(function(nets) {
        var n = nets.find(function(x) { return x['.id'] === id; }) || {};
        openCRUDModal('✏️ DHCP Network', [
          { key: 'address',    label: 'Мережа',   value: n.address || '' },
          { key: 'gateway',    label: 'Gateway',  value: n.gateway || '' },
          { key: 'dns-server', label: 'DNS',      value: n['dns-server'] || '' },
          { key: 'domain',     label: 'Domain',   value: n.domain || '' },
        ], function(data, done) {
          restCall(r, 'PATCH', '/ip/dhcp-server/network/' + id, data).then(function(res) {
            if (res && res.error) { done(false, res.error); return; }
            S().invalidateRelated('dhcpNetworks'); done(true);
            setTimeout(window.rmSectionDHCP, 500);
          }).catch(function(e) { done(false, String(e)); });
        });
      });
    };

    window.__rmDelDHCPNet = function(id, addr) {
      if (!confirm('Видалити мережу "' + addr + '"?')) return;
      restCall(r, 'DELETE', '/ip/dhcp-server/network/' + id, null).then(function() {
        S().invalidateRelated('dhcpNetworks');
        window.rmSectionDHCP();
      });
    };

    return html;
  }

  function renderIPPools(pools) {
    var r = router();
    var html = '<div style="display:flex;justify-content:flex-end;margin-bottom:10px;">' +
      '<button class="rm-btn rm-btn-primary" style="font-size:11px;" onclick="window.__rmAddPool()">＋ Додати Pool</button>' +
    '</div>';
    html += '<table class="rm-table rm-table-compact"><tr><th>Назва</th><th>Ranges</th><th>Next Pool</th><th>Used</th><th style="text-align:right;">Дії</th></tr>';
    pools.forEach(function(p) {
      var id = p['.id'] || '';
      html += '<tr>' +
        '<td><b>' + esc(p.name||'') + '</b></td>' +
        '<td style="font-family:monospace;font-size:11px;">' + esc(p.ranges||'') + '</td>' +
        '<td>' + esc(p['next-pool']||'—') + '</td>' +
        '<td>' + esc(p.used||'') + '</td>' +
        '<td style="text-align:right;">' +
          '<button class="rm-act-btn rm-act-edit" onclick="window.__rmEditPool(\'' + esc(id) + '\')">✏️</button>' +
          '<button class="rm-act-btn rm-act-del" onclick="window.__rmDelPool(\'' + esc(id) + '\',\'' + esc(p.name) + '\')">🗑</button>' +
        '</td></tr>';
    });
    html += '</table>';

    window.__rmAddPool = function() {
      openCRUDModal('➕ IP Pool', [
        { key: 'name',      label: 'Назва',    required: true },
        { key: 'ranges',    label: 'Ranges',   required: true, placeholder: '192.168.88.10-192.168.88.254' },
        { key: 'next-pool', label: 'Next Pool' },
      ], function(data, done) {
        restCall(r, 'PUT', '/ip/pool', data).then(function(res) {
          if (res && res.error) { done(false, res.error); return; }
          S().invalidateRelated('ipPools'); done(true);
          setTimeout(window.rmSectionDHCP, 500);
        }).catch(function(e) { done(false, String(e)); });
      });
    };

    window.__rmEditPool = function(id) {
      S().get('ipPools').then(function(pools) {
        var p = pools.find(function(x) { return x['.id'] === id; }) || {};
        openCRUDModal('✏️ IP Pool', [
          { key: 'name',      label: 'Назва',    value: p.name || '' },
          { key: 'ranges',    label: 'Ranges',   value: p.ranges || '' },
          { key: 'next-pool', label: 'Next Pool',value: p['next-pool'] || '' },
        ], function(data, done) {
          restCall(r, 'PATCH', '/ip/pool/' + id, data).then(function(res) {
            if (res && res.error) { done(false, res.error); return; }
            S().invalidateRelated('ipPools'); done(true);
            setTimeout(window.rmSectionDHCP, 500);
          }).catch(function(e) { done(false, String(e)); });
        });
      });
    };

    window.__rmDelPool = function(id, name) {
      if (!confirm('Видалити pool "' + name + '"?')) return;
      restCall(r, 'DELETE', '/ip/pool/' + id, null).then(function() {
        S().invalidateRelated('ipPools');
        window.rmSectionDHCP();
      });
    };

    return html;
  }

  /* ══════════════════════════════════════════════════════════
     FIREWALL — tabs Filter/NAT/Mangle/AddressList/Connections
     ══════════════════════════════════════════════════════════ */
  window.rmSectionFirewall = function(subTab) {
    var r = router(); if (!r) return;
    loading('Завантаження Firewall...');

    Promise.all([
      S().get('fwFilter'),
      S().get('fwNat'),
      S().get('fwMangle'),
      S().get('fwAddressList'),
    ]).then(function(results) {
      var filter  = results[0];
      var nat     = results[1];
      var mangle  = results[2];
      var addrList= results[3];
      var activeTab = subTab || 'filter';

      var c = cont(); if (!c) return;

      var html = sectionHeader('🔥 Firewall');

      html += '<div class="rm-section-tabs">' +
        tab('filter',   'Filter (' + filter.length + ')',   activeTab==='filter') +
        tab('nat',      'NAT (' + nat.length + ')',         activeTab==='nat') +
        tab('mangle',   'Mangle (' + mangle.length + ')',   activeTab==='mangle') +
        tab('addrlist', 'Address Lists (' + addrList.length + ')', activeTab==='addrlist') +
        tab('conntrack','Connections',                       activeTab==='conntrack') +
      '</div>';

      html += '<div id="rm-fw-content">';
      if (activeTab === 'filter')   html += renderFWFilter(filter);
      if (activeTab === 'nat')      html += renderFWNAT(nat);
      if (activeTab === 'mangle')   html += renderFWMangle(mangle);
      if (activeTab === 'addrlist') html += renderFWAddressList(addrList);
      if (activeTab === 'conntrack')html += '<div style="color:#8ea3b0;padding:20px;">Connections — live дані</div>';
      html += '</div>';

      c.innerHTML = html;

      c.querySelectorAll('.rm-section-tab').forEach(function(t) {
        t.addEventListener('click', function() {
          c.querySelectorAll('.rm-section-tab').forEach(function(x) { x.classList.remove('active'); });
          t.classList.add('active');
          var wrap = document.getElementById('rm-fw-content');
          if (!wrap) return;
          var tab = t.dataset.tab;
          if (tab === 'filter')   wrap.innerHTML = renderFWFilter(filter);
          if (tab === 'nat')      wrap.innerHTML = renderFWNAT(nat);
          if (tab === 'mangle')   wrap.innerHTML = renderFWMangle(mangle);
          if (tab === 'addrlist') wrap.innerHTML = renderFWAddressList(addrList);
          if (tab === 'conntrack') {
            wrap.innerHTML = '<div style="color:#8ea3b0;padding:10px;">⏳ Завантаження...</div>';
            S().get('fwConnections', true).then(function(conns) {
              wrap.innerHTML = renderFWConnections(conns);
            });
          }
        });
      });

      window.__rmRefreshSection = function() {
        S().invalidateRelated('fwFilter');
        window.rmSectionFirewall(activeTab);
      };
    });
  };

  function renderFWRuleTable(rules, apiPath, fields, addTitle) {
    var r = router();
    var html = '<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">' +
      '<input class="rm-search-input" id="rm-fw-search" placeholder="🔍 Пошук...">' +
      '<button class="rm-btn rm-btn-primary" style="font-size:11px;" onclick="window.__rmAddFWRule()">＋ Додати</button>' +
    '</div>';

    if (!rules.length) return html + '<div style="color:#8ea3b0;padding:20px;text-align:center;">Правил немає</div>';

    html += '<div style="overflow-x:auto;"><table class="rm-table rm-table-compact">' +
      '<tr><th>#</th><th>Chain</th><th>Action</th><th>Protocol</th>' +
      '<th>Src</th><th>Dst</th><th>Port</th><th>In/Out</th>' +
      '<th>State</th><th>Comment</th><th style="text-align:right;">Дії</th></tr>';

    rules.forEach(function(rule, idx) {
      var id = rule['.id'] || '';
      var disabled = rule.disabled === 'true';
      var actionColor = rule.action === 'drop' ? '#e05252' : rule.action === 'accept' ? '#5fd0a5' : '#f0a840';

      html += '<tr style="' + (disabled ? 'opacity:.5;' : '') + '">' +
        '<td style="color:#8ea3b0;font-size:11px;">' + (idx+1) + '</td>' +
        '<td>' + esc(rule.chain||'') + '</td>' +
        '<td><b style="color:' + actionColor + ';">' + esc(rule.action||'') + '</b></td>' +
        '<td>' + esc(rule.protocol||'any') + '</td>' +
        '<td style="font-size:11px;">' + esc(rule['src-address']||rule['src-address-list']||'any') + '</td>' +
        '<td style="font-size:11px;">' + esc(rule['dst-address']||rule['dst-address-list']||'any') + '</td>' +
        '<td style="font-size:11px;">' + esc(rule['dst-port']||rule['src-port']||'') + '</td>' +
        '<td style="font-size:11px;">' + esc(rule['in-interface']||rule['out-interface']||'') + '</td>' +
        '<td style="font-size:11px;">' + esc(rule['connection-state']||'') + '</td>' +
        '<td style="color:#8ea3b0;font-size:11px;max-width:100px;overflow:hidden;text-overflow:ellipsis;">' + esc(rule.comment||'') + '</td>' +
        '<td style="text-align:right;white-space:nowrap;">' +
          '<button class="rm-act-btn ' + (disabled ? 'rm-act-enable' : 'rm-act-disable') +
            '" onclick="window.__rmFWToggle(\'' + esc(id) + '\',\'' + esc(apiPath) + '\',' + disabled + ')">' +
            (disabled ? '▶' : '‖') + '</button>' +
          '<button class="rm-act-btn rm-act-edit" onclick="window.__rmFWEdit(\'' + esc(id) + '\',\'' + esc(apiPath) + '\')">✏️</button>' +
          '<button class="rm-act-btn rm-act-del" onclick="window.__rmFWDel(\'' + esc(id) + '\',\'' + esc(apiPath) + '\')">🗑</button>' +
        '</td></tr>';
    });

    html += '</table></div>';

    setTimeout(function() {
      var search = document.getElementById('rm-fw-search');
      if (search) search.addEventListener('input', function() {
        var q = search.value.toLowerCase();
        var rows = document.querySelectorAll('#rm-fw-content table tr:not(:first-child)');
        rows.forEach(function(row) {
          row.style.display = !q || row.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
      });

      window.__rmFWToggle = function(id, path, disabled) {
        restCall(r, 'PATCH', path + '/' + id, { disabled: disabled ? 'no' : 'yes' }).then(function() {
          S().invalidateRelated('fwFilter');
          window.rmSectionFirewall();
        });
      };

      window.__rmFWEdit = function(id, path) {
        restCall(r, 'GET', path + '/' + id).then(function(rule) {
          openCRUDModal('✏️ Правило', fields, function(data, done) {
            restCall(r, 'PATCH', path + '/' + id, data).then(function(res) {
              if (res && res.error) { done(false, res.error); return; }
              S().invalidateRelated('fwFilter'); done(true);
              setTimeout(window.rmSectionFirewall, 500);
            }).catch(function(e) { done(false, String(e)); });
          }, rule);
        });
      };

      window.__rmFWDel = function(id, path) {
        if (!confirm('Видалити правило?')) return;
        restCall(r, 'DELETE', path + '/' + id, null).then(function() {
          S().invalidateRelated('fwFilter');
          window.rmSectionFirewall();
        });
      };

      window.__rmAddFWRule = function() {
        openCRUDModal(addTitle || '➕ Правило', fields, function(data, done) {
          restCall(r, 'PUT', apiPath, data).then(function(res) {
            if (res && res.error) { done(false, res.error); return; }
            S().invalidateRelated('fwFilter'); done(true);
            setTimeout(window.rmSectionFirewall, 500);
          }).catch(function(e) { done(false, String(e)); });
        });
      };
    }, 100);

    return html;
  }

  var FW_FILTER_FIELDS = [
    { key:'chain',    label:'Chain',    required:true, type:'select', options:['input','forward','output'] },
    { key:'action',   label:'Action',   required:true, type:'select', options:['accept','drop','reject','jump','log','passthrough','tarpit'] },
    { key:'protocol', label:'Protocol', type:'select', options:['','tcp','udp','icmp','gre','esp','ah','ospf'] },
    { key:'src-address', label:'Src Address',      placeholder:'192.168.88.0/24' },
    { key:'src-address-list', label:'Src Addr List', placeholder:'TRUSTED' },
    { key:'dst-address', label:'Dst Address',      placeholder:'0.0.0.0/0' },
    { key:'dst-address-list', label:'Dst Addr List' },
    { key:'dst-port', label:'Dst Port',    placeholder:'80,443 або 8080-8090' },
    { key:'src-port', label:'Src Port' },
    { key:'in-interface',  label:'In Interface',  placeholder:'ether1' },
    { key:'out-interface', label:'Out Interface' },
    { key:'in-interface-list',  label:'In IF List',  placeholder:'WAN' },
    { key:'out-interface-list', label:'Out IF List', placeholder:'WAN' },
    { key:'connection-state', label:'Connection State', placeholder:'established,related' },
    { key:'jump-target', label:'Jump Target', placeholder:'custom-chain' },
    { key:'log-prefix', label:'Log Prefix' },
    { key:'comment',    label:'Коментар' },
    { key:'disabled',   label:'Вимкнено', type:'checkbox' },
  ];

  var FW_NAT_FIELDS = [
    { key:'chain',   label:'Chain',  required:true, type:'select', options:['srcnat','dstnat'] },
    { key:'action',  label:'Action', required:true, type:'select', options:['masquerade','src-nat','dst-nat','redirect','accept','netmap'] },
    { key:'protocol',label:'Protocol', type:'select', options:['','tcp','udp','icmp'] },
    { key:'src-address',  label:'Src Address' },
    { key:'dst-address',  label:'Dst Address' },
    { key:'dst-port',     label:'Dst Port',      placeholder:'80' },
    { key:'to-addresses', label:'To Addresses',  placeholder:'192.168.88.100' },
    { key:'to-ports',     label:'To Ports',      placeholder:'8080' },
    { key:'out-interface-list', label:'Out IF List', placeholder:'WAN' },
    { key:'in-interface',  label:'In Interface' },
    { key:'ipsec-policy',  label:'IPsec Policy', placeholder:'out,none' },
    { key:'comment',       label:'Коментар' },
    { key:'disabled',      label:'Вимкнено', type:'checkbox' },
  ];

  function renderFWFilter(rules)  { return renderFWRuleTable(rules, '/ip/firewall/filter', FW_FILTER_FIELDS, '➕ Filter Rule'); }
  function renderFWNAT(rules)     { return renderFWRuleTable(rules, '/ip/firewall/nat',    FW_NAT_FIELDS,    '➕ NAT Rule'); }
  function renderFWMangle(rules)  { return renderFWRuleTable(rules, '/ip/firewall/mangle', FW_FILTER_FIELDS, '➕ Mangle Rule'); }

  function renderFWAddressList(list) {
    var r = router();
    var html = '<div style="display:flex;gap:8px;margin-bottom:10px;">' +
      '<input class="rm-search-input" id="rm-al-search" placeholder="🔍 Список, IP...">' +
      '<button class="rm-btn rm-btn-primary" style="font-size:11px;" onclick="window.__rmAddAL()">＋ Додати</button>' +
    '</div>';

    /* Групуємо по списках */
    var groups = {};
    list.forEach(function(item) {
      var name = item.list || 'default';
      if (!groups[name]) groups[name] = [];
      groups[name].push(item);
    });

    Object.keys(groups).sort().forEach(function(listName) {
      html += '<div style="margin-bottom:12px;">' +
        '<div style="font-size:12px;color:#5fd0a5;font-weight:600;margin-bottom:6px;padding:4px 8px;background:#0d2a1a;border-radius:4px;">' +
        '📋 ' + esc(listName) + ' (' + groups[listName].length + ' записів)</div>';
      html += '<table class="rm-table rm-table-compact"><tr><th>Address/CIDR</th><th>Timeout</th><th>Dynamic</th><th>Коментар</th><th style="text-align:right;">Дії</th></tr>';
      groups[listName].forEach(function(item) {
        var id = item['.id'] || '';
        html += '<tr>' +
          '<td><b>' + esc(item.address||'') + '</b></td>' +
          '<td style="font-size:11px;">' + esc(item.timeout||'—') + '</td>' +
          '<td>' + boolBadge(item.dynamic) + '</td>' +
          '<td style="color:#8ea3b0;font-size:11px;">' + esc(item.comment||'') + '</td>' +
          '<td style="text-align:right;">' +
            (item.dynamic !== 'true' ?
              '<button class="rm-act-btn rm-act-edit" onclick="window.__rmEditAL(\'' + esc(id) + '\')">✏️</button>' +
              '<button class="rm-act-btn rm-act-del" onclick="window.__rmDelAL(\'' + esc(id) + '\',\'' + esc(item.address) + '\')">🗑</button>'
            : '') +
          '</td></tr>';
      });
      html += '</table></div>';
    });

    if (!list.length) html += '<div style="color:#8ea3b0;padding:20px;text-align:center;">Address Lists порожні</div>';

    setTimeout(function() {
      var search = document.getElementById('rm-al-search');
      if (search) search.addEventListener('input', function() {
        var q = search.value.toLowerCase();
        document.querySelectorAll('#rm-fw-content table tr:not(:first-child)').forEach(function(row) {
          row.style.display = !q || row.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
      });

      window.__rmAddAL = function() {
        openCRUDModal('➕ Address List', [
          { key: 'list',     label: 'Список',   required: true, placeholder: 'TRUSTED, BLOCKED...' },
          { key: 'address',  label: 'IP/CIDR',  required: true, placeholder: '192.168.88.100 або 10.0.0.0/8' },
          { key: 'timeout',  label: 'Timeout',  placeholder: '1h або порожньо' },
          { key: 'comment',  label: 'Коментар' },
        ], function(data, done) {
          restCall(r, 'PUT', '/ip/firewall/address-list', data).then(function(res) {
            if (res && res.error) { done(false, res.error); return; }
            S().invalidateRelated('fwAddressList'); done(true);
            setTimeout(function() { window.rmSectionFirewall('addrlist'); }, 500);
          }).catch(function(e) { done(false, String(e)); });
        });
      };

      window.__rmEditAL = function(id) {
        S().get('fwAddressList').then(function(list) {
          var item = list.find(function(x) { return x['.id'] === id; }) || {};
          openCRUDModal('✏️ Address List', [
            { key: 'list',    label: 'Список',  value: item.list || '' },
            { key: 'address', label: 'IP/CIDR', value: item.address || '' },
            { key: 'comment', label: 'Коментар',value: item.comment || '' },
          ], function(data, done) {
            restCall(r, 'PATCH', '/ip/firewall/address-list/' + id, data).then(function(res) {
              if (res && res.error) { done(false, res.error); return; }
              S().invalidateRelated('fwAddressList'); done(true);
              setTimeout(function() { window.rmSectionFirewall('addrlist'); }, 500);
            }).catch(function(e) { done(false, String(e)); });
          });
        });
      };

      window.__rmDelAL = function(id, addr) {
        if (!confirm('Видалити "' + addr + '" зі списку?')) return;
        restCall(r, 'DELETE', '/ip/firewall/address-list/' + id, null).then(function() {
          S().invalidateRelated('fwAddressList');
          window.rmSectionFirewall('addrlist');
        });
      };
    }, 100);

    return html;
  }

  function renderFWConnections(conns) {
    if (!conns.length) return '<div style="color:#8ea3b0;padding:20px;text-align:center;">Активних з\'єднань немає</div>';
    var html = '<div style="font-size:11px;color:#8ea3b0;margin-bottom:8px;"><span class="rm-live-dot"></span> Live — ' + conns.length + ' з\'єднань</div>';
    html += '<table class="rm-table rm-table-compact"><tr><th>Src</th><th>Dst</th><th>Protocol</th><th>State</th><th>Bytes</th></tr>';
    conns.slice(0, 100).forEach(function(c) {
      html += '<tr>' +
        '<td style="font-size:11px;">' + esc(c['src-address']||'') + '</td>' +
        '<td style="font-size:11px;">' + esc(c['dst-address']||'') + '</td>' +
        '<td>' + esc(c.protocol||'') + '</td>' +
        '<td><span class="rm-badge">' + esc(c['tcp-state']||c.state||'') + '</span></td>' +
        '<td style="font-size:11px;">' + esc(c['orig-bytes']||'') + '</td>' +
      '</tr>';
    });
    html += '</table>';
    return html;
  }

  /* ══════════════════════════════════════════════════════════
     QUEUES — Simple + Tree
     ══════════════════════════════════════════════════════════ */
  window.rmSectionQueues = function() {
    var r = router(); if (!r) return;
    loading('Завантаження Queues...');

    Promise.all([
      S().get('queuesSimple'),
      S().get('queuesTree'),
    ]).then(function(results) {
      var simple = results[0];
      var tree   = results[1];
      var c = cont(); if (!c) return;

      var html = sectionHeader('📊 Queues');
      html += '<div class="rm-section-tabs">' +
        tab('simple', 'Simple (' + simple.length + ')', true) +
        tab('tree',   'Tree (' + tree.length + ')') +
      '</div>';
      html += '<div id="rm-q-content">' + renderSimpleQueues(simple) + '</div>';

      c.innerHTML = html;

      c.querySelectorAll('.rm-section-tab').forEach(function(t) {
        t.addEventListener('click', function() {
          c.querySelectorAll('.rm-section-tab').forEach(function(x) { x.classList.remove('active'); });
          t.classList.add('active');
          var wrap = document.getElementById('rm-q-content');
          if (!wrap) return;
          if (t.dataset.tab === 'simple') wrap.innerHTML = renderSimpleQueues(simple);
          if (t.dataset.tab === 'tree')   wrap.innerHTML = renderTreeQueues(tree);
        });
      });

      window.__rmRefreshSection = function() {
        S().invalidateRelated('queuesSimple');
        window.rmSectionQueues();
      };
    });
  };

  function renderSimpleQueues(queues) {
    var r = router();
    var html = '<div style="display:flex;justify-content:flex-end;margin-bottom:10px;">' +
      '<button class="rm-btn rm-btn-primary" style="font-size:11px;" onclick="window.__rmAddSQueue()">＋ Додати Queue</button>' +
    '</div>';
    if (!queues.length) return html + '<div style="color:#8ea3b0;padding:20px;text-align:center;">Черг немає</div>';

    html += '<table class="rm-table rm-table-compact"><tr><th>Назва</th><th>Target</th><th>Max Limit ↑/↓</th><th>Burst</th><th>Priority</th><th>Bytes ↑/↓</th><th>Статус</th><th style="text-align:right;">Дії</th></tr>';
    queues.forEach(function(q) {
      var id = q['.id'] || '';
      var disabled = q.disabled === 'true';
      html += '<tr style="' + (disabled ? 'opacity:.5;' : '') + '">' +
        '<td><b>' + esc(q.name||'') + '</b></td>' +
        '<td style="font-size:11px;">' + esc(q.target||'') + '</td>' +
        '<td style="font-size:11px;">' + esc(q['max-limit']||'') + '</td>' +
        '<td style="font-size:11px;">' + esc(q['burst-limit']||'—') + '</td>' +
        '<td>' + esc(q.priority||'8') + '</td>' +
        '<td style="font-size:11px;">' + esc(q['bytes']||q['tx-byte']||'') + '</td>' +
        '<td>' + statusBadge(!disabled) + '</td>' +
        '<td style="text-align:right;white-space:nowrap;">' +
          '<button class="rm-act-btn ' + (disabled ? 'rm-act-enable' : 'rm-act-disable') +
            '" onclick="window.__rmToggleSQueue(\'' + esc(id) + '\',' + disabled + ')">' + (disabled ? '▶' : '‖') + '</button>' +
          '<button class="rm-act-btn rm-act-edit" onclick="window.__rmEditSQueue(\'' + esc(id) + '\')">✏️</button>' +
          '<button class="rm-act-btn rm-act-del" onclick="window.__rmDelSQueue(\'' + esc(id) + '\',\'' + esc(q.name) + '\')">🗑</button>' +
        '</td></tr>';
    });
    html += '</table>';

    window.__rmToggleSQueue = function(id, disabled) {
      restCall(r, 'PATCH', '/queue/simple/' + id, { disabled: disabled ? 'no' : 'yes' }).then(function() {
        S().invalidateRelated('queuesSimple');
        window.rmSectionQueues();
      });
    };

    window.__rmAddSQueue = function() {
      openCRUDModal('➕ Simple Queue', [
        { key:'name',        label:'Назва',    required:true },
        { key:'target',      label:'Target',   required:true, placeholder:'192.168.88.100/32 або 192.168.88.0/24' },
        { key:'max-limit',   label:'Max Limit (upload/download)', placeholder:'10M/50M' },
        { key:'burst-limit', label:'Burst Limit', placeholder:'20M/100M або порожньо' },
        { key:'burst-time',  label:'Burst Time',  placeholder:'10s' },
        { key:'priority',    label:'Priority',    default:'8' },
        { key:'comment',     label:'Коментар' },
        { key:'disabled',    label:'Вимкнено',    type:'checkbox' },
      ], function(data, done) {
        restCall(r, 'PUT', '/queue/simple', data).then(function(res) {
          if (res && res.error) { done(false, res.error); return; }
          S().invalidateRelated('queuesSimple'); done(true);
          setTimeout(window.rmSectionQueues, 500);
        }).catch(function(e) { done(false, String(e)); });
      });
    };

    window.__rmEditSQueue = function(id) {
      S().get('queuesSimple').then(function(queues) {
        var q = queues.find(function(x) { return x['.id'] === id; }) || {};
        openCRUDModal('✏️ Simple Queue', [
          { key:'name',        label:'Назва',    value: q.name || '' },
          { key:'target',      label:'Target',   value: q.target || '' },
          { key:'max-limit',   label:'Max Limit', value: q['max-limit'] || '' },
          { key:'burst-limit', label:'Burst Limit', value: q['burst-limit'] || '' },
          { key:'burst-time',  label:'Burst Time',  value: q['burst-time'] || '' },
          { key:'priority',    label:'Priority',    value: q.priority || '8' },
          { key:'comment',     label:'Коментар',    value: q.comment || '' },
          { key:'disabled',    label:'Вимкнено',    type:'checkbox', value: q.disabled },
        ], function(data, done) {
          restCall(r, 'PATCH', '/queue/simple/' + id, data).then(function(res) {
            if (res && res.error) { done(false, res.error); return; }
            S().invalidateRelated('queuesSimple'); done(true);
            setTimeout(window.rmSectionQueues, 500);
          }).catch(function(e) { done(false, String(e)); });
        });
      });
    };

    window.__rmDelSQueue = function(id, name) {
      if (!confirm('Видалити queue "' + name + '"?')) return;
      restCall(r, 'DELETE', '/queue/simple/' + id, null).then(function() {
        S().invalidateRelated('queuesSimple');
        window.rmSectionQueues();
      });
    };

    return html;
  }

  function renderTreeQueues(queues) {
    if (!queues.length) return '<div style="color:#8ea3b0;padding:20px;text-align:center;">Queue Tree порожній</div>';
    var r = router();
    var html = '<div style="display:flex;justify-content:flex-end;margin-bottom:10px;">' +
      '<button class="rm-btn rm-btn-primary" style="font-size:11px;" onclick="window.__rmAddTQueue()">＋ Додати</button>' +
    '</div>';
    html += '<table class="rm-table rm-table-compact"><tr><th>Назва</th><th>Parent</th><th>Packet Mark</th><th>Max Limit</th><th>Priority</th><th style="text-align:right;">Дії</th></tr>';
    queues.forEach(function(q) {
      var id = q['.id'] || '';
      html += '<tr>' +
        '<td><b>' + esc(q.name||'') + '</b></td>' +
        '<td>' + esc(q.parent||'global') + '</td>' +
        '<td>' + esc(q['packet-mark']||'') + '</td>' +
        '<td>' + esc(q['max-limit']||'') + '</td>' +
        '<td>' + esc(q.priority||'8') + '</td>' +
        '<td style="text-align:right;">' +
          '<button class="rm-act-btn rm-act-edit" onclick="window.__rmEditTQueue(\'' + esc(id) + '\')">✏️</button>' +
          '<button class="rm-act-btn rm-act-del" onclick="window.__rmDelTQueue(\'' + esc(id) + '\',\'' + esc(q.name) + '\')">🗑</button>' +
        '</td></tr>';
    });
    html += '</table>';

    window.__rmAddTQueue = function() {
      openCRUDModal('➕ Queue Tree', [
        { key:'name',        label:'Назва',    required:true },
        { key:'parent',      label:'Parent',   default:'global' },
        { key:'packet-mark', label:'Packet Mark' },
        { key:'max-limit',   label:'Max Limit', placeholder:'10M' },
        { key:'priority',    label:'Priority',  default:'8' },
        { key:'comment',     label:'Коментар' },
      ], function(data, done) {
        restCall(r, 'PUT', '/queue/tree', data).then(function(res) {
          if (res && res.error) { done(false, res.error); return; }
          S().invalidateRelated('queuesTree'); done(true);
          setTimeout(window.rmSectionQueues, 500);
        }).catch(function(e) { done(false, String(e)); });
      });
    };

    window.__rmEditTQueue = function(id) {
      S().get('queuesTree').then(function(queues) {
        var q = queues.find(function(x) { return x['.id'] === id; }) || {};
        openCRUDModal('✏️ Queue Tree', [
          { key:'name',        label:'Назва',    value: q.name || '' },
          { key:'parent',      label:'Parent',   value: q.parent || 'global' },
          { key:'packet-mark', label:'Packet Mark', value: q['packet-mark'] || '' },
          { key:'max-limit',   label:'Max Limit', value: q['max-limit'] || '' },
          { key:'priority',    label:'Priority',  value: q.priority || '8' },
          { key:'comment',     label:'Коментар',  value: q.comment || '' },
        ], function(data, done) {
          restCall(r, 'PATCH', '/queue/tree/' + id, data).then(function(res) {
            if (res && res.error) { done(false, res.error); return; }
            S().invalidateRelated('queuesTree'); done(true);
            setTimeout(window.rmSectionQueues, 500);
          }).catch(function(e) { done(false, String(e)); });
        });
      });
    };

    window.__rmDelTQueue = function(id, name) {
      if (!confirm('Видалити "' + name + '"?')) return;
      restCall(r, 'DELETE', '/queue/tree/' + id, null).then(function() {
        S().invalidateRelated('queuesTree');
        window.rmSectionQueues();
      });
    };

    return html;
  }

  /* ══════════════════════════════════════════════════════════
     PPP — Secrets + Active + Profiles
     ══════════════════════════════════════════════════════════ */
  window.rmSectionPPP = function() {
    var r = router(); if (!r) return;
    loading('Завантаження PPP...');

    Promise.all([
      S().get('pppSecrets'),
      S().get('pppActive'),
      S().get('pppProfiles'),
    ]).then(function(results) {
      var secrets  = results[0];
      var active   = results[1];
      var profiles = results[2];
      var c = cont(); if (!c) return;

      var html = sectionHeader('🔑 PPP');
      html += '<div class="rm-stats-bar">' +
        statItem('Secrets', secrets.length) +
        statItem('Active Sessions', active.length, '#5fd0a5') +
        statItem('Profiles', profiles.length) +
      '</div>';

      html += '<div class="rm-section-tabs">' +
        tab('secrets',  'Secrets (' + secrets.length + ')',  true) +
        tab('active',   'Active (' + active.length + ')') +
        tab('profiles', 'Profiles (' + profiles.length + ')') +
      '</div>';

      html += '<div id="rm-ppp-content">' + renderPPPSecrets(secrets, profiles) + '</div>';

      c.innerHTML = html;

      c.querySelectorAll('.rm-section-tab').forEach(function(t) {
        t.addEventListener('click', function() {
          c.querySelectorAll('.rm-section-tab').forEach(function(x) { x.classList.remove('active'); });
          t.classList.add('active');
          var wrap = document.getElementById('rm-ppp-content');
          if (!wrap) return;
          var tt = t.dataset.tab;
          if (tt === 'secrets')  wrap.innerHTML = renderPPPSecrets(secrets, profiles);
          if (tt === 'active')   wrap.innerHTML = renderPPPActive(active);
          if (tt === 'profiles') wrap.innerHTML = renderPPPProfiles(profiles);
        });
      });

      window.__rmRefreshSection = function() {
        S().invalidateRelated('pppSecrets');
        window.rmSectionPPP();
      };
    });
  };

  function renderPPPSecrets(secrets, profiles) {
    var r = router();
    var profileNames = (profiles || []).map(function(p) { return p.name; });
    var html = '<div style="display:flex;justify-content:flex-end;margin-bottom:10px;">' +
      '<button class="rm-btn rm-btn-primary" style="font-size:11px;" onclick="window.__rmAddSecret()">＋ Додати</button>' +
    '</div>';
    if (!secrets.length) return html + '<div style="color:#8ea3b0;padding:20px;text-align:center;">Секретів немає</div>';

    html += '<table class="rm-table rm-table-compact"><tr><th>Логін</th><th>Service</th><th>Profile</th><th>IP</th><th>Caller ID</th><th>Статус</th><th style="text-align:right;">Дії</th></tr>';
    secrets.forEach(function(s) {
      var id = s['.id'] || '';
      var disabled = s.disabled === 'true';
      html += '<tr style="' + (disabled ? 'opacity:.5;' : '') + '">' +
        '<td><b>' + esc(s.name||'') + '</b></td>' +
        '<td>' + esc(s.service||'any') + '</td>' +
        '<td>' + esc(s.profile||'default') + '</td>' +
        '<td style="font-size:11px;">' + esc(s['remote-address']||'') + '</td>' +
        '<td style="font-size:11px;">' + esc(s['caller-id']||'') + '</td>' +
        '<td>' + statusBadge(!disabled) + '</td>' +
        '<td style="text-align:right;white-space:nowrap;">' +
          '<button class="rm-act-btn ' + (disabled ? 'rm-act-enable' : 'rm-act-disable') +
            '" onclick="window.__rmToggleSecret(\'' + esc(id) + '\',' + disabled + ')">' + (disabled ? '▶' : '‖') + '</button>' +
          '<button class="rm-act-btn rm-act-edit" onclick="window.__rmEditSecret(\'' + esc(id) + '\')">✏️</button>' +
          '<button class="rm-act-btn rm-act-del" onclick="window.__rmDelSecret(\'' + esc(id) + '\',\'' + esc(s.name) + '\')">🗑</button>' +
        '</td></tr>';
    });
    html += '</table>';

    window.__rmToggleSecret = function(id, disabled) {
      restCall(r, 'PATCH', '/ppp/secret/' + id, { disabled: disabled ? 'no' : 'yes' }).then(function() {
        S().invalidateRelated('pppSecrets');
        window.rmSectionPPP();
      });
    };

    window.__rmAddSecret = function() {
      openCRUDModal('➕ PPP Secret', [
        { key:'name',           label:'Логін',    required:true },
        { key:'password',       label:'Пароль',   type:'password' },
        { key:'service',        label:'Сервіс',   type:'select', options:['any','ppp','l2tp','pptp','sstp','ovpn'] },
        { key:'profile',        label:'Profile',  default:'default' },
        { key:'local-address',  label:'Local IP' },
        { key:'remote-address', label:'Remote IP' },
        { key:'caller-id',      label:'Caller ID' },
        { key:'comment',        label:'Коментар' },
        { key:'disabled',       label:'Вимкнено', type:'checkbox' },
      ], function(data, done) {
        restCall(r, 'PUT', '/ppp/secret', data).then(function(res) {
          if (res && res.error) { done(false, res.error); return; }
          S().invalidateRelated('pppSecrets'); done(true);
          setTimeout(window.rmSectionPPP, 500);
        }).catch(function(e) { done(false, String(e)); });
      });
    };

    window.__rmEditSecret = function(id) {
      S().get('pppSecrets').then(function(secrets) {
        var s = secrets.find(function(x) { return x['.id'] === id; }) || {};
        openCRUDModal('✏️ PPP Secret — ' + s.name, [
          { key:'name',           label:'Логін',    value: s.name || '' },
          { key:'password',       label:'Пароль',   type:'password' },
          { key:'service',        label:'Сервіс',   type:'select', options:['any','ppp','l2tp','pptp','sstp','ovpn'], default: s.service },
          { key:'profile',        label:'Profile',  value: s.profile || 'default' },
          { key:'local-address',  label:'Local IP', value: s['local-address'] || '' },
          { key:'remote-address', label:'Remote IP',value: s['remote-address'] || '' },
          { key:'comment',        label:'Коментар', value: s.comment || '' },
          { key:'disabled',       label:'Вимкнено', type:'checkbox', value: s.disabled },
        ], function(data, done) {
          if (!data.password) delete data.password;
          restCall(r, 'PATCH', '/ppp/secret/' + id, data).then(function(res) {
            if (res && res.error) { done(false, res.error); return; }
            S().invalidateRelated('pppSecrets'); done(true);
            setTimeout(window.rmSectionPPP, 500);
          }).catch(function(e) { done(false, String(e)); });
        });
      });
    };

    window.__rmDelSecret = function(id, name) {
      if (!confirm('Видалити secret "' + name + '"?')) return;
      restCall(r, 'DELETE', '/ppp/secret/' + id, null).then(function() {
        S().invalidateRelated('pppSecrets');
        window.rmSectionPPP();
      });
    };

    return html;
  }

    function renderPPPActive(active) {
    if (!active.length) return '<div style="color:#8ea3b0;padding:20px;text-align:center;">Активних сесій немає</div>';
    var r = router();
    var html = '<div style="font-size:11px;color:#8ea3b0;margin-bottom:8px;"><span class="rm-live-dot"></span> ' + active.length + ' активних сесій</div>';
    html += '<table class="rm-table rm-table-compact"><tr><th>Логін</th><th>Service</th><th>IP</th><th>Uptime</th><th>Encoding</th><th style="text-align:right;">Дії</th></tr>';
    active.forEach(function(s) {
      var id = s['.id'] || '';
      html += '<tr>' +
        '<td><b>' + esc(s.name||'') + '</b></td>' +
        '<td>' + esc(s.service||'') + '</td>' +
        '<td style="font-family:monospace;font-size:11px;">' + esc(s.address||s['caller-id']||'') + '</td>' +
        '<td>' + esc(s.uptime||'') + '</td>' +
        '<td style="font-size:11px;">' + esc(s.encoding||'') + '</td>' +
        '<td style="text-align:right;">' +
          '<button class="rm-act-btn rm-act-del" onclick="window.__rmKillSession(\'' + esc(id) + '\',\'' + esc(s.name) + '\')">✕ Відключити</button>' +
        '</td></tr>';
    });
    html += '</table>';

    window.__rmKillSession = function(id, name) {
      if (!confirm('Відключити сесію "' + name + '"?')) return;
      restCall(r, 'DELETE', '/ppp/active/' + id, null).then(function() {
        S().invalidateRelated('pppActive');
        window.rmSectionPPP();
      });
    };

    return html;
  }

  function renderPPPProfiles(profiles) {
    var r = router();
    var html = '<div style="display:flex;justify-content:flex-end;margin-bottom:10px;">' +
      '<button class="rm-btn rm-btn-primary" style="font-size:11px;" onclick="window.__rmAddPPPProfile()">＋ Додати Profile</button>' +
    '</div>';
    if (!profiles.length) return html + '<div style="color:#8ea3b0;padding:20px;text-align:center;">Профілів немає</div>';
    html += '<table class="rm-table rm-table-compact"><tr><th>Назва</th><th>Local IP</th><th>Remote Pool</th><th>Rate Limit</th><th>DNS</th><th style="text-align:right;">Дії</th></tr>';
    profiles.forEach(function(p) {
      var id = p['.id'] || '';
      html += '<tr>' +
        '<td><b>' + esc(p.name||'') + '</b></td>' +
        '<td style="font-size:11px;">' + esc(p['local-address']||'') + '</td>' +
        '<td>' + esc(p['remote-address']||'') + '</td>' +
        '<td style="font-size:11px;">' + esc(p['rate-limit']||'') + '</td>' +
        '<td style="font-size:11px;">' + esc(p['dns-server']||'') + '</td>' +
        '<td style="text-align:right;">' +
          '<button class="rm-act-btn rm-act-edit" onclick="window.__rmEditPPPProfile(\'' + esc(id) + '\')">✏️</button>' +
          (p.name !== 'default' && p.name !== 'default-encryption' ?
            '<button class="rm-act-btn rm-act-del" onclick="window.__rmDelPPPProfile(\'' + esc(id) + '\',\'' + esc(p.name) + '\')">🗑</button>' : '') +
        '</td></tr>';
    });
    html += '</table>';

    window.__rmAddPPPProfile = function() {
      openCRUDModal('➕ PPP Profile', [
        { key:'name',           label:'Назва',        required:true },
        { key:'local-address',  label:'Local IP',     placeholder:'192.168.99.1' },
        { key:'remote-address', label:'Remote Pool',  placeholder:'vpn-pool' },
        { key:'rate-limit',     label:'Rate Limit',   placeholder:'10M/20M' },
        { key:'dns-server',     label:'DNS',          placeholder:'192.168.88.1' },
        { key:'comment',        label:'Коментар' },
      ], function(data, done) {
        restCall(r, 'PUT', '/ppp/profile', data).then(function(res) {
          if (res && res.error) { done(false, res.error); return; }
          S().invalidateRelated('pppProfiles'); done(true);
          setTimeout(window.rmSectionPPP, 500);
        }).catch(function(e) { done(false, String(e)); });
      });
    };

    window.__rmEditPPPProfile = function(id) {
      S().get('pppProfiles').then(function(profiles) {
        var p = profiles.find(function(x) { return x['.id'] === id; }) || {};
        openCRUDModal('✏️ PPP Profile — ' + p.name, [
          { key:'name',           label:'Назва',       value: p.name || '' },
          { key:'local-address',  label:'Local IP',    value: p['local-address'] || '' },
          { key:'remote-address', label:'Remote Pool', value: p['remote-address'] || '' },
          { key:'rate-limit',     label:'Rate Limit',  value: p['rate-limit'] || '' },
          { key:'dns-server',     label:'DNS',         value: p['dns-server'] || '' },
          { key:'comment',        label:'Коментар',    value: p.comment || '' },
        ], function(data, done) {
          restCall(r, 'PATCH', '/ppp/profile/' + id, data).then(function(res) {
            if (res && res.error) { done(false, res.error); return; }
            S().invalidateRelated('pppProfiles'); done(true);
            setTimeout(window.rmSectionPPP, 500);
          }).catch(function(e) { done(false, String(e)); });
        });
      });
    };

    window.__rmDelPPPProfile = function(id, name) {
      if (!confirm('Видалити profile "' + name + '"?')) return;
      restCall(r, 'DELETE', '/ppp/profile/' + id, null).then(function() {
        S().invalidateRelated('pppProfiles');
        window.rmSectionPPP();
      });
    };

    return html;
  }

  /* ══════════════════════════════════════════════════════════
     WIRELESS — Interfaces + Clients + Access List
     ══════════════════════════════════════════════════════════ */
  window.rmSectionWireless = function() {
    var r = router(); if (!r) return;
    loading('Завантаження Wireless...');

    Promise.all([
      S().get('wireless'),
      S().get('wirelessClients'),
    ]).then(function(results) {
      var ifaces  = results[0];
      var clients = results[1];
      var c = cont(); if (!c) return;

      var running = ifaces.filter(function(i) { return i.running === 'true'; }).length;

      var html = sectionHeader('📡 Wireless');

      html += '<div class="rm-stats-bar">' +
        statItem('Interfaces', ifaces.length) +
        statItem('Running', running, '#5fd0a5') +
        statItem('Clients', clients.length, '#5fd0a5') +
      '</div>';

      html += '<div class="rm-section-tabs">' +
        tab('interfaces', 'Interfaces (' + ifaces.length + ')', true) +
        tab('clients',    'Clients (' + clients.length + ')') +
      '</div>';

      html += '<div id="rm-wl-content">' + renderWLInterfaces(ifaces) + '</div>';

      c.innerHTML = html;

      c.querySelectorAll('.rm-section-tab').forEach(function(t) {
        t.addEventListener('click', function() {
          c.querySelectorAll('.rm-section-tab').forEach(function(x) { x.classList.remove('active'); });
          t.classList.add('active');
          var wrap = document.getElementById('rm-wl-content');
          if (!wrap) return;
          if (t.dataset.tab === 'interfaces') wrap.innerHTML = renderWLInterfaces(ifaces);
          if (t.dataset.tab === 'clients')    wrap.innerHTML = renderWLClients(clients);
        });
      });

      window.__rmRefreshSection = function() {
        S().invalidateRelated('wireless');
        window.rmSectionWireless();
      };
    });
  };

  function renderWLInterfaces(ifaces) {
    var r = router();
    if (!ifaces.length) return '<div style="color:#8ea3b0;padding:20px;text-align:center;">Wireless інтерфейсів немає</div>';

    var html = '<table class="rm-table rm-table-compact">' +
      '<tr><th>Назва</th><th>SSID</th><th>Band</th><th>Frequency</th><th>Mode</th><th>Clients</th><th>Status</th><th style="text-align:right;">Дії</th></tr>';

    ifaces.forEach(function(iface) {
      var id = iface['.id'] || '';
      var disabled = iface.disabled === 'true';
      var running  = iface.running === 'true';

      html += '<tr style="' + (disabled ? 'opacity:.5;' : '') + '">' +
        '<td><b>' + esc(iface.name||'') + '</b></td>' +
        '<td>' + esc(iface.ssid||'') + '</td>' +
        '<td style="font-size:11px;">' + esc(iface.band||'') + '</td>' +
        '<td>' + esc(iface.frequency||'auto') + '</td>' +
        '<td style="font-size:11px;">' + esc(iface.mode||'') + '</td>' +
        '<td>' + esc(iface['registered-clients']||'0') + '</td>' +
        '<td>' +
          '<span class="rm-badge' + (running && !disabled ? '' : ' rm-badge-err') + '">' +
          (disabled ? '■ Disabled' : running ? '▶ Running' : '○ Down') +
          '</span>' +
        '</td>' +
        '<td style="text-align:right;white-space:nowrap;">' +
          '<button class="rm-act-btn ' + (disabled ? 'rm-act-enable' : 'rm-act-disable') +
            '" onclick="window.__rmWLToggle(\'' + esc(id) + '\',\'' + esc(iface.name) + '\',' + disabled + ')">' +
            (disabled ? '▶' : '‖') + '</button>' +
          '<button class="rm-act-btn rm-act-edit" onclick="window.__rmWLEdit(\'' + esc(id) + '\')">✏️</button>' +
        '</td></tr>';
    });
    html += '</table>';

    window.__rmWLToggle = function(id, name, disabled) {
      restCall(r, 'POST', '/interface/wireless/' + id + (disabled ? '/enable' : '/disable'), {})
        .then(function() {
          S().invalidateRelated('wireless');
          window.rmSectionWireless();
        }).catch(function() {
          sshCall(r, '/interface wireless ' + (disabled ? 'enable' : 'disable') + ' "' + name + '"')
            .then(function() {
              S().invalidateRelated('wireless');
              window.rmSectionWireless();
            });
        });
    };

    window.__rmWLEdit = function(id) {
      S().get('wireless').then(function(ifaces) {
        var iface = ifaces.find(function(x) { return x['.id'] === id; }) || {};
        openCRUDModal('✏️ Wireless — ' + iface.name, [
          { key:'ssid',          label:'SSID',     value: iface.ssid || '' },
          { key:'mode',          label:'Mode',     type:'select', options:['ap-bridge','station','bridge','wds-slave'], default: iface.mode },
          { key:'band',          label:'Band',     type:'select', options:['2ghz-b/g/n','5ghz-a/n/ac','2ghz-g/n','5ghz-n/ac'], default: iface.band },
          { key:'frequency',     label:'Frequency', value: iface.frequency || 'auto' },
          { key:'channel-width', label:'Channel Width', value: iface['channel-width'] || '' },
          { key:'tx-power',      label:'TX Power',  value: iface['tx-power'] || '' },
          { key:'comment',       label:'Коментар',  value: iface.comment || '' },
          { key:'disabled',      label:'Вимкнено',  type:'checkbox', value: iface.disabled },
        ], function(data, done) {
          restCall(r, 'PATCH', '/interface/wireless/' + id, data).then(function(res) {
            if (res && res.error) { done(false, res.error); return; }
            S().invalidateRelated('wireless'); done(true);
            setTimeout(window.rmSectionWireless, 500);
          }).catch(function(e) { done(false, String(e)); });
        });
      });
    };

    return html;
  }

  function renderWLClients(clients) {
    if (!clients.length) return '<div style="color:#8ea3b0;padding:20px;text-align:center;">Клієнтів немає</div>';

    var html = '<div style="font-size:11px;color:#8ea3b0;margin-bottom:8px;"><span class="rm-live-dot"></span> ' + clients.length + ' клієнтів</div>';
    html += '<table class="rm-table rm-table-compact">' +
      '<tr><th>MAC</th><th>Interface</th><th>Signal</th><th>TX Rate</th><th>RX Rate</th><th>Uptime</th><th>Comment</th></tr>';

    clients.forEach(function(c) {
      var signal = parseInt(c['signal-strength'] || '-100');
      var signalColor = signal > -65 ? '#5fd0a5' : signal > -80 ? '#f0a840' : '#e05252';
      html += '<tr>' +
        '<td style="font-family:monospace;font-size:11px;">' + esc(c['mac-address']||'') + '</td>' +
        '<td>' + esc(c.interface||'') + '</td>' +
        '<td style="color:' + signalColor + ';font-weight:600;">' + esc(c['signal-strength']||'') + ' dBm</td>' +
        '<td style="font-size:11px;">' + esc(c['tx-rate']||'') + '</td>' +
        '<td style="font-size:11px;">' + esc(c['rx-rate']||'') + '</td>' +
        '<td>' + esc(c.uptime||'') + '</td>' +
        '<td style="color:#8ea3b0;font-size:11px;">' + esc(c.comment||'') + '</td>' +
      '</tr>';
    });
    html += '</table>';
    return html;
  }

  /* ══════════════════════════════════════════════════════════
     SYSTEM — Identity, Clock, NTP, Services, Health
     ══════════════════════════════════════════════════════════ */
  window.rmSectionSystem = function() {
    var r = router(); if (!r) return;
    loading('Завантаження System...');

    Promise.all([
      S().get('identity'),
      S().get('clock'),
      S().get('resource'),
      S().get('services'),
      S().get('health'),
    ]).then(function(results) {
      var identity = results[0];
      var clock    = results[1];
      var res      = results[2];
      var services = results[3];
      var health   = results[4];
      var c = cont(); if (!c) return;

      var html = sectionHeader('⚙️ System — ' + esc((identity && identity.name) || ''));

      html += '<div class="rm-section-tabs">' +
        tab('identity', 'Identity', true) +
        tab('services', 'Services') +
        tab('clock',    'Clock/NTP') +
        tab('health',   'Health') +
        tab('packages', 'Packages') +
      '</div>';

      html += '<div id="rm-sys-content">' + renderIdentity(identity, res) + '</div>';

      c.innerHTML = html;

      c.querySelectorAll('.rm-section-tab').forEach(function(t) {
        t.addEventListener('click', function() {
          c.querySelectorAll('.rm-section-tab').forEach(function(x) { x.classList.remove('active'); });
          t.classList.add('active');
          var wrap = document.getElementById('rm-sys-content');
          if (!wrap) return;
          var tt = t.dataset.tab;
          if (tt === 'identity') wrap.innerHTML = renderIdentity(identity, res);
          if (tt === 'services') wrap.innerHTML = renderServices(services);
          if (tt === 'clock')    wrap.innerHTML = renderClock(clock);
          if (tt === 'health')   wrap.innerHTML = renderHealth(health);
          if (tt === 'packages') {
            wrap.innerHTML = '<div style="color:#8ea3b0;padding:10px;">⏳ Завантаження пакетів...</div>';
            S().get('packages', true).then(function(pkgs) {
              wrap.innerHTML = renderPackages(pkgs);
            });
          }
        });
      });

      window.__rmRefreshSection = function() {
        S().invalidate('identity');
        S().invalidate('resource');
        window.rmSectionSystem();
      };
    });
  };

  function renderIdentity(identity, res) {
    var r = router();
    var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">' +
      '<div class="rm-dash-card">' +
        '<h4>Роутер</h4>' +
        '<div style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;align-items:center;">' +
          kv2('Ім\'я',    (identity && identity.name) || '—') +
          kv2('Board',   res['board-name'] || '—') +
          kv2('RouterOS', res.version || '—') +
          kv2('Platform', res.platform || '—') +
          kv2('Uptime',   res.uptime || '—') +
          kv2('CPU Load', (res['cpu-load'] || '0') + '%') +
          kv2('RAM Free', fmt(parseInt(res['free-memory']||0)) + ' / ' + fmt(parseInt(res['total-memory']||0))) +
        '</div>' +
      '</div>' +
      '<div class="rm-dash-card">' +
        '<h4>Змінити ім\'я</h4>' +
        '<div class="rm-modal-field"><label>Ім\'я роутера</label>' +
          '<input id="rm-sys-name" class="rm-inline-input" style="width:100%;" value="' + esc((identity && identity.name) || '') + '">' +
        '</div>' +
        '<div class="rm-modal-field"><label>Новий пароль admin (залиш порожнім якщо не змінювати)</label>' +
          '<input id="rm-sys-pass" type="password" class="rm-inline-input" style="width:100%;" placeholder="••••••••">' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-top:10px;">' +
          '<button class="rm-btn rm-btn-primary" onclick="window.__rmSaveIdentity()">💾 Зберегти</button>' +
        '</div>' +
        '<div id="rm-sys-status" style="margin-top:8px;font-size:12px;"></div>' +
      '</div>' +
    '</div>';

    window.__rmSaveIdentity = function() {
      var name = (document.getElementById('rm-sys-name') || {}).value || '';
      var pass = (document.getElementById('rm-sys-pass') || {}).value || '';
      var st   = document.getElementById('rm-sys-status');
      var promises = [];

      if (name) {
        promises.push(restCall(r, 'POST', '/system/identity/set', { name: name }));
      }
      if (pass) {
        promises.push(sshCall(r, '/user set admin password="' + pass + '"'));
      }

      if (!promises.length) { if(st) st.textContent = '⚠ Нічого не змінено'; return; }
      if(st) st.textContent = '⏳ Збереження...';

      Promise.all(promises).then(function() {
        if(st) { st.style.color='#5fd0a5'; st.textContent = '✅ Збережено!'; }
        S().invalidate('identity');
        setTimeout(function() { window.rmSectionSystem(); }, 1000);
      }).catch(function(e) {
        if(st) { st.style.color='#e05252'; st.textContent = '❌ ' + e; }
      });
    };

    return html;
  }

  function renderServices(services) {
    var r = router();
    if (!services.length) return '<div style="color:#8ea3b0;padding:20px;">Сервіси недоступні через REST API — використай SSH Terminal</div>';

    var html = '<table class="rm-table rm-table-compact">' +
      '<tr><th>Сервіс</th><th>Порт</th><th>Protocol</th><th>Max Sessions</th><th>Статус</th><th style="text-align:right;">Дії</th></tr>';

    services.forEach(function(s) {
      var id = s['.id'] || '';
      var disabled = s.disabled === 'true';
      var invalid  = s.invalid === 'true';
      var dynamic  = s.dynamic === 'true';

      html += '<tr style="' + (disabled || invalid ? 'opacity:.5;' : '') + '">' +
        '<td><b>' + esc(s.name||'') + '</b>' + (dynamic ? ' <span style="font-size:10px;color:#8ea3b0;">(dynamic)</span>' : '') + '</td>' +
        '<td>' + esc(s.port||'') + '</td>' +
        '<td style="font-size:11px;">' + esc(s.proto||'tcp') + '</td>' +
        '<td>' + esc(s['max-sessions']||'') + '</td>' +
        '<td>' +
          '<span class="rm-badge' + (disabled || invalid ? ' rm-badge-err' : '') + '">' +
          (invalid ? 'I Invalid' : disabled ? '■ Disabled' : '▶ Active') +
          '</span>' +
        '</td>' +
        '<td style="text-align:right;">' +
          (!dynamic && !invalid ?
            '<button class="rm-act-btn ' + (disabled ? 'rm-act-enable' : 'rm-act-disable') +
              '" onclick="window.__rmToggleService(\'' + esc(id) + '\',' + disabled + ')">' +
              (disabled ? '▶' : '‖') + '</button>' +
            '<button class="rm-act-btn rm-act-edit" onclick="window.__rmEditService(\'' + esc(id) + '\')">✏️</button>'
          : '') +
        '</td></tr>';
    });
    html += '</table>';

    window.__rmToggleService = function(id, disabled) {
      restCall(r, 'POST', '/ip/service/' + id + (disabled ? '/enable' : '/disable'), {}).then(function() {
        S().invalidate('services');
        window.rmSectionSystem();
      });
    };

    window.__rmEditService = function(id) {
      S().get('services').then(function(services) {
        var s = services.find(function(x) { return x['.id'] === id; }) || {};
        openCRUDModal('✏️ Service — ' + s.name, [
          { key:'port',         label:'Порт',     value: s.port || '' },
          { key:'address',      label:'Allowed from (IP/CIDR)', value: s.address || '', hint: 'Порожньо = всі' },
          { key:'max-sessions', label:'Max Sessions', value: s['max-sessions'] || '' },
          { key:'disabled',     label:'Вимкнено', type:'checkbox', value: s.disabled },
        ], function(data, done) {
          restCall(r, 'PATCH', '/ip/service/' + id, data).then(function(res) {
            if (res && res.error) { done(false, res.error); return; }
            S().invalidate('services'); done(true);
            setTimeout(window.rmSectionSystem, 500);
          }).catch(function(e) { done(false, String(e)); });
        });
      });
    };

    return html;
  }

  function renderClock(clock) {
    var r = router();
    var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
      '<div class="rm-dash-card">' +
        '<h4>🕐 Поточний час</h4>' +
        '<div style="font-size:22px;font-weight:700;color:#5fd0a5;" id="rm-clock-val">' + esc((clock && clock.time) || '—') + '</div>' +
        '<div style="font-size:12px;color:#8ea3b0;margin-top:4px;">' + esc((clock && clock.date) || '—') + '</div>' +
        '<div style="font-size:11px;color:#4a6070;margin-top:4px;">' + esc((clock && clock['time-zone-name']) || '') + '</div>' +
      '</div>' +
      '<div class="rm-dash-card">' +
        '<h4>⚙️ Змінити часовий пояс</h4>' +
        '<div class="rm-modal-field"><label>Timezone</label>' +
          '<input id="rm-tz-input" class="rm-inline-input" style="width:100%;" value="' + esc((clock && clock['time-zone-name']) || 'UTC') + '" placeholder="Europe/Kyiv">' +
        '</div>' +
        '<div class="rm-modal-field"><label>NTP Server</label>' +
          '<input id="rm-ntp-input" class="rm-inline-input" style="width:100%;" value="pool.ntp.org" placeholder="pool.ntp.org">' +
        '</div>' +
        '<button class="rm-btn rm-btn-primary" style="margin-top:8px;" onclick="window.__rmSetClock()">💾 Зберегти</button>' +
        '<div id="rm-clock-status" style="margin-top:8px;font-size:12px;"></div>' +
      '</div>' +
    '</div>';

    window.__rmSetClock = function() {
      var tz  = (document.getElementById('rm-tz-input')  || {}).value || '';
      var ntp = (document.getElementById('rm-ntp-input') || {}).value || '';
      var st  = document.getElementById('rm-clock-status');
      if(st) st.textContent = '⏳ Збереження...';

      var promises = [];
      if (tz)  promises.push(sshCall(r, '/system clock set time-zone-name=' + tz));
      if (ntp) promises.push(sshCall(r, '/system ntp client set enabled=yes servers=' + ntp));

      Promise.all(promises).then(function() {
        if(st) { st.style.color='#5fd0a5'; st.textContent = '✅ Збережено!'; }
        S().invalidate('clock');
      }).catch(function(e) {
        if(st) { st.style.color='#e05252'; st.textContent = '❌ ' + e; }
      });
    };

    return html;
  }

  function renderHealth(health) {
    if (!health || !health.length) {
      return '<div style="color:#8ea3b0;padding:20px;">Health дані недоступні для цього пристрою</div>';
    }
    var html = '<div class="rm-dash-grid">';
    health.forEach(function(item) {
      var val  = item.value || '—';
      var unit = item.type || '';
      var color = '#5fd0a5';
      if (unit === 'C' && parseFloat(val) > 70) color = '#e05252';
      if (unit === 'C' && parseFloat(val) > 55) color = '#f0a840';
      html += '<div class="rm-dash-card">' +
        '<h4>' + esc(item.name||'') + '</h4>' +
        '<div class="rm-dash-val" style="color:' + color + ';">' + esc(val) + ' ' + esc(unit) + '</div>' +
      '</div>';
    });
    html += '</div>';
    return html;
  }

  function renderPackages(packages) {
    if (!packages.length) return '<div style="color:#8ea3b0;padding:20px;">Пакети недоступні</div>';
    var html = '<table class="rm-table rm-table-compact"><tr><th>Пакет</th><th>Версія</th><th>Збірка</th><th>Статус</th></tr>';
    packages.forEach(function(p) {
      var disabled = p.disabled === 'true';
      html += '<tr>' +
        '<td><b>' + esc(p.name||'') + '</b></td>' +
        '<td>' + esc(p.version||'') + '</td>' +
        '<td style="font-size:11px;color:#8ea3b0;">' + esc(p['build-time']||'') + '</td>' +
        '<td><span class="rm-badge' + (disabled ? ' rm-badge-err' : '') + '">' + (disabled ? '■ Disabled' : '✓ Active') + '</span></td>' +
      '</tr>';
    });
    html += '</table>';
    return html;
  }

  /* ══════════════════════════════════════════════════════════
     ЗАГАЛЬНИЙ CRUD MODAL
     ══════════════════════════════════════════════════════════ */
  function openCRUDModal(title, fields, onSave, data) {
    var existing = document.getElementById('rm-crud-modal-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'rm-crud-modal-overlay';
    overlay.className = 'rm-modal-overlay';

    var html = '<div class="rm-modal">';
    html += '<h3>' + title + '</h3>';

    fields.forEach(function(f) {
      var val = (data && data[f.key] !== undefined) ? String(data[f.key]) : (f.value !== undefined ? String(f.value) : (f.default || ''));
      html += '<div class="rm-modal-field">';
      html += '<label>' + esc(f.label) + (f.required ? ' <span style="color:#e05252">*</span>' : '') + '</label>';

      if (f.type === 'select') {
        html += '<select id="rm-cf-' + esc(f.key) + '">';
        (f.options || []).forEach(function(opt) {
          var v = typeof opt === 'object' ? opt.value : opt;
          var l = typeof opt === 'object' ? opt.label : opt;
          var def = f.default || val;
          html += '<option value="' + esc(v) + '"' + (v === def ? ' selected' : '') + '>' + esc(l) + '</option>';
        });
        html += '</select>';
      } else if (f.type === 'checkbox') {
        var checked = val === 'true' || val === 'yes';
        html += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;">' +
          '<input type="checkbox" id="rm-cf-' + esc(f.key) + '"' + (checked ? ' checked' : '') + ' style="width:auto;">' +
          '<span style="font-size:12px;color:#e6edf3;">Увімкнути</span>' +
          '</label>';
      } else if (f.type === 'textarea') {
        html += '<textarea id="rm-cf-' + esc(f.key) + '" rows="3" style="width:100%;box-sizing:border-box;background:#0d1821;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:7px 10px;font-size:13px;">' + esc(val) + '</textarea>';
      } else {
        html += '<input type="' + (f.type || 'text') + '" id="rm-cf-' + esc(f.key) + '" value="' + esc(val) + '"' +
          (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') +
          ' style="width:100%;box-sizing:border-box;">';
      }

      if (f.hint) html += '<div style="font-size:11px;color:#4a6070;margin-top:3px;">' + esc(f.hint) + '</div>';
      html += '</div>';
    });

    html += '<div id="rm-cf-status" style="display:none;margin-top:10px;padding:8px 12px;border-radius:6px;font-size:12px;"></div>';
    html += '<div style="display:flex;gap:8px;margin-top:18px;justify-content:flex-end;">' +
      '<button class="rm-btn rm-btn-secondary" id="rm-cf-cancel">Скасувати</button>' +
      '<button class="rm-btn rm-btn-primary" id="rm-cf-save">💾 Зберегти</button>' +
    '</div></div>';

    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.remove();
    });
    document.getElementById('rm-cf-cancel').addEventListener('click', function() { overlay.remove(); });

    document.getElementById('rm-cf-save').addEventListener('click', function() {
      var formData = {};
      fields.forEach(function(f) {
        var el = document.getElementById('rm-cf-' + f.key);
        if (!el) return;
        if (f.type === 'checkbox') {
          formData[f.key] = el.checked ? 'yes' : 'no';
        } else {
          formData[f.key] = el.value.trim();
        }
      });

      var missing = fields.filter(function(f) {
        return f.required && !formData[f.key];
      }).map(function(f) { return f.label; });

      if (missing.length) {
        var st = document.getElementById('rm-cf-status');
        if (st) { st.style.display='block'; st.style.background='#3a1a1a'; st.style.color='#e05252'; st.textContent='⚠ Заповни: ' + missing.join(', '); }
        return;
      }

      var saveBtn = document.getElementById('rm-cf-save');
      if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = '⏳...'; }

      onSave(formData, function(ok, msg) {
        if (ok) {
          var st = document.getElementById('rm-cf-status');
          if (st) { st.style.display='block'; st.style.background='#0d2a1a'; st.style.color='#5fd0a5'; st.textContent='✅ ' + (msg || 'Збережено!'); }
          setTimeout(function() { overlay.remove(); }, 1000);
        } else {
          var st = document.getElementById('rm-cf-status');
          if (st) { st.style.display='block'; st.style.background='#3a1a1a'; st.style.color='#e05252'; st.textContent='❌ ' + (msg || 'Помилка'); }
          if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '💾 Зберегти'; }
        }
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     УТИЛІТИ
     ══════════════════════════════════════════════════════════ */
  function tab(id, label, active) {
    return '<div class="rm-section-tab' + (active ? ' active' : '') + '" data-tab="' + id + '">' + label + '</div>';
  }

  function statItem(label, value, color) {
    return '<div class="rm-stat-item">' + esc(label) + ': <b style="' + (color ? 'color:' + color + ';' : '') + '">' + esc(String(value)) + '</b></div>';
  }

  function boolBadge(val) {
    var v = val === 'true' || val === true;
    return v ? '<span class="rm-badge">✓</span>' : '<span style="color:#4a6070;font-size:11px;">—</span>';
  }

  function statusBadge(active) {
    return active
      ? '<span class="rm-badge">▶ Active</span>'
      : '<span class="rm-badge rm-badge-err">■ Disabled</span>';
  }

  function kv2(key, val) {
    return '<div style="font-size:11px;color:#8ea3b0;">' + esc(key) + '</div>' +
           '<div style="font-size:13px;color:#e6edf3;">' + esc(String(val)) + '</div>';
  }

  function fmt(bytes) {
    if (!bytes || isNaN(bytes)) return '—';
    if (bytes > 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
    if (bytes > 1048576)    return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes > 1024)       return (bytes / 1024).toFixed(0) + ' KB';
    return bytes + ' B';
  }

  /* ══════════════════════════════════════════════════════════
     ПАТЧ router-manager.js — підключаємо нові секції
     ══════════════════════════════════════════════════════════ */
  function patchRMNavigation() {
    if (!window.__rmSetMenu) {
      /* Чекаємо поки router-manager.js завантажиться */
      setTimeout(patchRMNavigation, 300);
      return;
    }

    /* DataStore оновлення при зміні роутера */
    var origSetMenu = window.__rmSetMenu;
    window.__rmSetMenu = function(menu) {
      var router = window.__rmGetActiveRouter ? window.__rmGetActiveRouter() : null;
      if (router) S().setRouter(router);
      origSetMenu(menu);
    };

    console.log('[Sections] Navigation patched!');
  }

  /* Автоматичне оновлення DataStore при відкритті секцій */
  document.addEventListener('click', function(e) {
    var menuItem = e.target.closest('[data-id]');
    if (!menuItem) return;
    var router = window.__rmGetActiveRouter ? window.__rmGetActiveRouter() : null;
    if (router) S().setRouter(router);
  });

  patchRMNavigation();

  console.log('[RM Sections] завантажено — повний Winbox-like функціонал');

})();