/* ══════════════════════════════════════════════════════
   NETWORK SCANNER — окремий модуль
   Використовує window.__rm* з router-manager.js
   ══════════════════════════════════════════════════════ */
(function() {
  'use strict';

  function getActive() {
    /* Пряме читання з localStorage — незалежно від IIFE */
    try {
      var routers = JSON.parse(localStorage.getItem('rm-routers') || '[]');
      var activeId = localStorage.getItem('rm-active-router');
      var router = routers.find(function(r){ return r.id === activeId; }) || routers[0];
      return router || null;
    } catch(e) { return null; }
  }
  function restCall(router, method, path) {
    return fetch('http://localhost:8888/rest' + path, {
      method: method,
      headers: {
        'x-router-ip':   router.ip,
        'x-router-port': String(router.port || 80),
        'x-router-user': router.user || 'admin',
        'x-router-pass': router.pass || '',
      }
    }).then(function(r){ return r.json(); });
  }
  function esc(s) {
    return String(s||'')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── Головна функція ── */
  function renderNetworkScanner() {
    var cont   = document.getElementById('rm-content');
    var router = getActive();
    if (!cont || !router) return;

    cont.innerHTML =
      '<div style="padding:20px;">' +
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">' +
          '<span style="font-size:24px;">🔍</span>' +
          '<div>' +
            '<div style="font-size:18px;font-weight:700;color:#e6edf3;">Сканер мережі</div>' +
            '<div style="font-size:12px;color:#8ea3b0;">ARP · DHCP · Neighbors · WiFi</div>' +
          '</div>' +
          '<div style="margin-left:auto;display:flex;gap:8px;align-items:center;">' +
          '<button id="ns-scan-btn" onclick="window.startNetScan()" ' +
            'style="background:linear-gradient(135deg,#5fd0a5,#4ab890);' +
            'color:#082018;border:none;border-radius:8px;padding:10px 24px;' +
            'font-size:14px;font-weight:700;cursor:pointer;">▶ Сканувати</button>' +
          '<select id="ns-auto-interval" onchange="window.nsSetAutoRefresh()" ' +
            'style="background:#060d14;border:1px solid #2a3b48;border-radius:8px;' +
            'color:#e6edf3;padding:8px 12px;font-size:12px;cursor:pointer;" title="Автооновлення">' +
            '<option value="0">⏱ Авто: вимк</option>' +
            '<option value="10">⏱ 10 сек</option>' +
            '<option value="30">⏱ 30 сек</option>' +
            '<option value="60">⏱ 1 хв</option>' +
            '<option value="300">⏱ 5 хв</option>' +
          '</select>' +
          '<button onclick="window.nsExportCSV()" ' +
            'style="background:#1a2a3a;border:1px solid #2a3b48;color:#5fd0a5;' +
            'border-radius:8px;padding:10px 16px;font-size:13px;cursor:pointer;" title="Експорт CSV">' +
            '📥 CSV</button>' +
          '<button onclick="window.nsExportExcel()" ' +
            'style="background:#1a2a3a;border:1px solid #1a4a2a;color:#5fd0a5;' +
            'border-radius:8px;padding:10px 16px;font-size:13px;cursor:pointer;" title="Експорт Excel">' +
            '📊 Excel</button>' +
        '</div>' +
        '</div>' +

        '<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">' +
          '<label style="display:flex;align-items:center;gap:6px;background:#060d14;border:1px solid #2a3b48;border-radius:8px;padding:8px 14px;cursor:pointer;font-size:13px;color:#c9d8e4;">' +
          '<input type="checkbox" id="ns-online-only" onchange="window.nsFilter()" style="cursor:pointer;">' +
          '● Тільки онлайн' +
        '</label>' +
        
        '<input id="ns-search" type="text" placeholder="🔍 Пошук по IP, MAC, hostname..." ' +
            'oninput="window.nsFilter()" ' +
            'style="flex:1;min-width:200px;background:#060d14;border:1px solid #2a3b48;' +
            'border-radius:8px;color:#e6edf3;padding:8px 14px;font-size:13px;">' +
          '<select id="ns-type-filter" onchange="window.nsFilter()" ' +
            'style="background:#060d14;border:1px solid #2a3b48;border-radius:8px;' +
            'color:#e6edf3;padding:8px 14px;font-size:13px;">' +
            '<option value="">Всі типи</option>' +
            '<option value="arp">ARP</option>' +
            '<option value="dhcp">DHCP</option>' +
            '<option value="neighbor">Neighbor</option>' +
            '<option value="wifi">WiFi</option>' +
          '</select>' +
          '<select id="ns-iface-filter" onchange="window.nsFilter()" ' +
            'style="background:#060d14;border:1px solid #2a3b48;border-radius:8px;' +
            'color:#e6edf3;padding:8px 14px;font-size:13px;">' +
            '<option value="">Всі інтерфейси</option>' +
          '</select>' +
        '</div>' +

        '<div id="ns-stats" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;"></div>' +

        '<div id="ns-table-wrap" style="background:#060d14;border:1px solid #2a3b48;' +
          'border-radius:10px;overflow:hidden;">' +
          '<div style="padding:40px;text-align:center;color:#4a6070;">' +
            '🔍 Натисни «Сканувати» щоб знайти всі пристрої' +
          '</div>' +
        '</div>' +
      '</div>';

    setTimeout(window.startNetScan, 300);
  }

  /* ── Сканування ── */
  window.__nsDevices = [];

  function startNetScan() {
    var btn = document.getElementById('ns-scan-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Сканую...'; }
    var wrap = document.getElementById('ns-table-wrap');
    if (wrap) wrap.innerHTML = '<div style="padding:20px;text-align:center;color:#4a6070;">⏳ Завантаження...</div>';

    var router = getActive();
    if (!router) return;

    Promise.allSettled([
      restCall(router,'GET','/ip/arp').catch(function(){ return []; }),
      restCall(router,'GET','/ip/dhcp-server/lease').catch(function(){ return []; }),
      restCall(router,'GET','/ip/neighbor').catch(function(){ return []; }),
      restCall(router,'GET','/interface/wireless/registration-table').catch(function(){ return []; }),
    ]).then(function(results) {
      var arpList      = results[0].value || [];
      var dhcpList     = results[1].value || [];
      var neighborList = results[2].value || [];
      var wifiList     = results[3].value || [];
      var devices = {};

      arpList.forEach(function(e) {
        var mac = (e['mac-address']||'').toUpperCase();
        var ip  = e['address']||'';
        if (!ip || ip==='0.0.0.0') return;
        var key = mac||ip;
        if (!devices[key]) devices[key] = {ip:ip,mac:mac,hostname:'',iface:e['interface']||'',type:'arp',vendor:'',signal:''};
      });

      dhcpList.forEach(function(e) {
        var mac = (e['mac-address']||'').toUpperCase();
        var ip  = e['address']||'';
        var key = mac||ip;
        if (!devices[key]) devices[key] = {ip:ip,mac:mac,hostname:'',iface:'',type:'dhcp',vendor:'',signal:''};
        devices[key].hostname    = e['host-name']||devices[key].hostname||'';
        devices[key].dhcpStatus  = e['status']||'';
        devices[key].expiresAfter= e['expires-after']||'';
        /* bound = онлайн, waiting/expired = офлайн */
        devices[key].online = e['status'] === 'bound' ? true :
          (e['status'] === 'waiting' || e['status'] === 'expired') ? false : null;
        devices[key].type = devices[key].type==='arp' ? 'arp+dhcp' : 'dhcp';
      });

      neighborList.forEach(function(e) {
        var mac = (e['mac-address']||'').toUpperCase();
        var ip  = e['address4']||e['address6']||'';
        var key = mac||ip;
        if (!devices[key]) devices[key] = {ip:ip,mac:mac,hostname:'',iface:'',type:'neighbor',vendor:'',signal:''};
        devices[key].hostname = e['identity']||devices[key].hostname||'';
        devices[key].platform = e['platform']||'';
        devices[key].type = 'neighbor';
      });

      wifiList.forEach(function(e) {
        var mac = (e['mac-address']||'').toUpperCase();
        var key = mac;
        if (!devices[key]) devices[key] = {ip:'',mac:mac,hostname:'',iface:e['interface']||'',type:'wifi',vendor:'',signal:''};
        devices[key].signal = e['signal-strength']||'';
        devices[key].txRate = e['tx-rate']||'';
        devices[key].type   = devices[key].type!=='wifi' ? devices[key].type+'+wifi' : 'wifi';
      });

      var OUI = {
        '00:0C:42':'MikroTik','D4:CA:6D':'MikroTik','B8:69:F4':'MikroTik',
        '4C:5E:0C':'MikroTik','CC:2D:E0':'MikroTik','2C:C8:1B':'MikroTik',
        '00:50:56':'VMware','00:0C:29':'VMware','B8:27:EB':'Raspberry Pi',
        'DC:A6:32':'Raspberry Pi','F4:F5:D8':'Google','AC:84:C6':'Xiaomi',
        'FC:EC:DA':'Ubiquiti','44:D9:E7':'Ubiquiti','00:15:6D':'Ubiquiti',
        'A0:40:A0':'Samsung','8C:79:F0':'Samsung','78:CA:39':'Apple',
        'F0:18:98':'Apple','B4:E6:2D':'Apple','3C:07:54':'Apple',
      };
      Object.values(devices).forEach(function(d) {
        if (!d.mac) return;
        d.vendor = OUI[d.mac.substring(0,8)] || '';
      });

      var arr = Object.values(devices);
      /* Ping перевірка для ARP пристроїв без DHCP статусу */
      var pingPromises = arr.filter(function(d){ return d.online === null || d.online === undefined; })
        .slice(0, 10) /* максимум 10 пінгів */
        .map(function(d) {
          return fetch('http://localhost:8888/ssh/exec', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({
              host: router.ip, port: router.sshPort||22,
              username: router.user, password: router.pass,
              command: '/ping ' + d.ip + ' count=1 interval=100ms'
            })
          }).then(function(r){ return r.json(); }).then(function(res) {
            var out = (res.output||'');
            d.online = out.includes('received=1') || out.includes('ttl=') ? true : false;
          }).catch(function(){ d.online = null; });
        });
      Promise.allSettled(pingPromises).then(function() {
        window.__nsDevices = arr;
        nsRender(arr);
      });
      window.__nsDevices = arr;

      /* Інтерфейси */
      var ifSel = document.getElementById('ns-iface-filter');
      if (ifSel) {
        var ifaces = arr.map(function(d){ return d.iface; }).filter(Boolean);
        ifaces = ifaces.filter(function(v,i,a){ return a.indexOf(v)===i; });
        ifaces.forEach(function(iface) {
          var opt = document.createElement('option');
          opt.value = iface; opt.textContent = iface;
          ifSel.appendChild(opt);
        });
      }

      nsRender(arr);
      if (btn) { btn.disabled=false; btn.textContent='🔄 Оновити'; }
    });
  }

  function nsFilter() {
    var q          = (document.getElementById('ns-search')||{value:''}).value.toLowerCase();
    var type       = (document.getElementById('ns-type-filter')||{value:''}).value;
    var iface      = (document.getElementById('ns-iface-filter')||{value:''}).value;
    var onlineOnly = (document.getElementById('ns-online-only')||{checked:false}).checked;
    var filtered = (window.__nsDevices||[]).filter(function(d) {
      if (onlineOnly && d.online !== true) return false;
      if (q && !((d.ip||'').includes(q)||(d.mac||'').toLowerCase().includes(q)||
                 (d.hostname||'').toLowerCase().includes(q)||(d.vendor||'').toLowerCase().includes(q))) return false;
      if (type  && !d.type.includes(type))   return false;
      if (iface && d.iface !== iface)         return false;
      return true;
    });
    nsRender(filtered);
  }

  function nsRender(devices) {
    var stats = document.getElementById('ns-stats');
    if (stats) {
      var total = devices.length;
      stats.innerHTML =
        nsStat('📡 Всього',  total, '#4a90d9') +
        nsStat('🔗 ARP',    devices.filter(function(d){return d.type.includes('arp');}).length,      '#5fd0a5') +
        nsStat('📋 DHCP',   devices.filter(function(d){return d.type.includes('dhcp');}).length,     '#f0a840') +
        nsStat('🏘 Сусіди', devices.filter(function(d){return d.type.includes('neighbor');}).length, '#c084fc') +
        nsStat('📶 WiFi',   devices.filter(function(d){return d.type.includes('wifi');}).length,      '#60a5fa');
    }

    var wrap = document.getElementById('ns-table-wrap');
    if (!wrap) return;
    if (!devices.length) {
      wrap.innerHTML = '<div style="padding:40px;text-align:center;color:#4a6070;">Пристроїв не знайдено</div>';
      return;
    }

    var rows = devices.map(function(d) {
      var sig = d.signal ? '<span style="color:' + nsSignalColor(d.signal) + ';">' + d.signal + ' dBm</span>' : '—';
      return '<tr onmouseover="this.style.background=\'#0d1f2d\'" onmouseout="this.style.background=\'\'"' +
             ' style="border-bottom:1px solid #1a2a38;">' +
        '<td style="padding:10px 12px;text-align:center;width:20px;">' +
          (d.online===true  ? '<span title="Онлайн" style="color:#5fd0a5;font-size:14px;">●</span>' :
           d.online===false ? '<span title="Офлайн" style="color:#e05252;font-size:14px;">●</span>' :
           '<span title="ARP cache" style="color:#f0a840;font-size:14px;">●</span>') +
        '</td>' +
        '<td style="padding:10px 12px;font-weight:600;color:#4a90d9;font-family:monospace;">' + esc(d.ip||'—') + '</td>' +
        '<td style="padding:10px 12px;font-family:monospace;font-size:12px;color:#8ea3b0;">' + esc(d.mac||'—') +
          (d.vendor ? '<br><span style="color:#4a6070;font-size:10px;">'+esc(d.vendor)+'</span>' : '') + '</td>' +
        '<td style="padding:10px 12px;color:#e6edf3;">' + esc(d.hostname||d.platform||'—') + '</td>' +
        '<td style="padding:10px 12px;color:#8ea3b0;font-size:12px;">' + esc(d.iface||'—') + '</td>' +
        '<td style="padding:10px 12px;">' + nsTypeBadge(d.type) + '</td>' +
        '<td style="padding:10px 12px;">' + sig + '</td>' +
        '<td style="padding:10px 12px;">' +
          '<div style="display:flex;gap:4px;">' +
            (d.ip ? '<button onclick="window.nsShowPingMenu(event,\''+esc(d.ip)+'\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#5fd0a5;border-radius:4px;padding:3px 10px;cursor:pointer;font-size:11px;" title="Ping">🏓 ▾</button>' : '') +
            (d.ip ? '<button onclick="window.nsShowPortMenu(event,\''+esc(d.ip)+'\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#f0a840;border-radius:4px;padding:3px 10px;cursor:pointer;font-size:11px;" title="Інструменти">🔌 ▾</button>' : '') +
            (d.ip ? '<button onclick="window.nsAddToRouter(\''+esc(d.ip)+'\',\''+esc(d.mac)+'\',\''+esc(d.hostname)+'\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#4a90d9;border-radius:4px;padding:3px 8px;cursor:pointer;font-size:11px;" title="Додати роутер">➕</button>' : '') +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');

    wrap.innerHTML =
      '<table style="width:100%;border-collapse:collapse;">' +
        '<thead><tr style="background:#080f17;border-bottom:2px solid #2a3b48;">' +
          '<th style="padding:10px 12px;text-align:left;color:#4a6070;font-size:12px;width:16px;"></th>' +
          '<th style="padding:10px 12px;text-align:left;color:#4a6070;font-size:12px;width:16px;"></th>' +
          '<th style="padding:6px 8px;width:20px;"></th>' +
          '<th style="padding:10px 12px;text-align:left;color:#4a6070;font-size:12px;">IP</th>' +
          '<th style="padding:10px 12px;text-align:left;color:#4a6070;font-size:12px;">MAC / Vendor</th>' +
          '<th style="padding:10px 12px;text-align:left;color:#4a6070;font-size:12px;">Hostname</th>' +
          '<th style="padding:10px 12px;text-align:left;color:#4a6070;font-size:12px;">Інтерфейс</th>' +
          '<th style="padding:10px 12px;text-align:left;color:#4a6070;font-size:12px;">Тип</th>' +
          '<th style="padding:10px 12px;text-align:left;color:#4a6070;font-size:12px;">Signal</th>' +
          '<th style="padding:10px 12px;text-align:left;color:#4a6070;font-size:12px;">Дії</th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>';
  }

  function nsStat(label, val, color) {
    return '<div style="background:#080f17;border:1px solid #2a3b48;border-radius:8px;padding:10px 16px;text-align:center;min-width:80px;">' +
      '<div style="font-size:20px;font-weight:700;color:'+color+';">'+val+'</div>' +
      '<div style="font-size:11px;color:#4a6070;">'+label+'</div>' +
    '</div>';
  }

  function nsTypeBadge(type) {
    var map = {'arp':'#0a2a1a:#5fd0a5','dhcp':'#1a1a0a:#f0a840','neighbor':'#1a0a2a:#c084fc','wifi':'#0a1a2a:#60a5fa','arp+dhcp':'#0a2a1a:#5fd0a5'};
    var c = (map[type]||'#1a2a3a:#8ea3b0').split(':');
    return '<span style="background:'+c[0]+';color:'+c[1]+';padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">'+type+'</span>';
  }

  function nsSignalColor(sig) {
    var n = parseInt(sig||'0');
    return n >= -60 ? '#5fd0a5' : n >= -75 ? '#f0a840' : '#e05252';
  }

  function nsPing(ip) {
    if (!ip) return;
    var router = getActive();
    if (!router) return;
    fetch('http://localhost:8888/ssh/exec', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({host:router.ip, port:router.sshPort||22,
        username:router.user, password:router.pass, command:'/ping '+ip+' count=4'})
    }).then(function(r){return r.json();}).then(function(d){
      alert('Ping '+ip+':\n'+(d.output||d.error||'Немає відповіді'));
    }).catch(function(e){ alert('Помилка: '+e); });
  }

  function nsAddToRouter(ip, mac, name) {
    try {
      var routers = JSON.parse(localStorage.getItem('rm-routers') || '[]');
      var id = 'rt-'+Date.now();
      routers.push({id:id,ip:ip,port:80,user:'admin',pass:'',sshPort:22,name:name||ip,mac:mac,type:'mikrotik',connected:false});
      localStorage.setItem('rm-routers', JSON.stringify(routers));
    } catch(e) {}
    if (window.__rmSaveRouters) window.__rmSaveRouters();
    if (window.__rmRenderTabs) window.__rmRenderTabs();
    alert('✅ '+ip+' додано! Введіть пароль і підключіться.');
  }


  /* ── Автооновлення ── */
  var nsAutoTimer = null;

  function nsSetAutoRefresh() {
    var sel = document.getElementById('ns-auto-interval');
    var sec = sel ? parseInt(sel.value) : 0;
    if (nsAutoTimer) { clearInterval(nsAutoTimer); nsAutoTimer = null; }
    if (sec > 0) {
      nsAutoTimer = setInterval(function() {
        if (document.getElementById('ns-scan-btn')) {
          startNetScan();
        } else {
          clearInterval(nsAutoTimer); nsAutoTimer = null;
        }
      }, sec * 1000);
      console.log('[Scanner] Автооновлення: ' + sec + ' сек');
    }
  }

  /* ── Експорт CSV ── */
  function nsExportCSV() {
    var devices = window.__nsDevices || [];
    if (!devices.length) { alert('Немає даних для експорту!'); return; }

    var rows = [['IP', 'MAC', 'Vendor', 'Hostname', 'Interface', 'Type', 'Signal', 'TX Rate']];
    devices.forEach(function(d) {
      rows.push([
        d.ip || '', d.mac || '', d.vendor || '',
        d.hostname || d.platform || '', d.iface || '',
        d.type || '', d.signal || '', d.txRate || ''
      ]);
    });

    var csv = rows.map(function(r) {
      return r.map(function(c) {
        return '"' + String(c).replace(/"/g, '""') + '"';
      }).join(',');
    }).join('\n');

    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = 'network-scan-' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    console.log('[Scanner] CSV exported: ' + devices.length + ' devices');
  }

  /* ── Експорт Excel (HTML table → .xls) ── */
  function nsExportExcel() {
    var devices = window.__nsDevices || [];
    if (!devices.length) { alert('Немає даних для експорту!'); return; }

    var rows = devices.map(function(d) {
      return '<tr>' +
        '<td>' + (d.ip||'') + '</td>' +
        '<td>' + (d.mac||'') + '</td>' +
        '<td>' + (d.vendor||'') + '</td>' +
        '<td>' + (d.hostname||d.platform||'') + '</td>' +
        '<td>' + (d.iface||'') + '</td>' +
        '<td>' + (d.type||'') + '</td>' +
        '<td>' + (d.signal||'') + '</td>' +
        '<td>' + (d.txRate||'') + '</td>' +
      '</tr>';
    }).join('');

    var html = '<html><head><meta charset="utf-8"></head><body>' +
      '<table border="1">' +
        '<thead><tr>' +
          '<th>IP</th><th>MAC</th><th>Vendor</th><th>Hostname</th>' +
          '<th>Interface</th><th>Type</th><th>Signal</th><th>TX Rate</th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table></body></html>';

    var blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = 'network-scan-' + new Date().toISOString().slice(0,10) + '.xls';
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ── Порт-скан через MikroTik ── */
  function nsShowPingMenu(e, ip) {
    e.stopPropagation();
    nsCloseMenus();
    var existing = document.getElementById('ns-result-modal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'ns-result-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);z-index:99998;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML =
      '<div style="background:#0d1117;border:1px solid #2a3b48;border-radius:12px;width:480px;">' +
        '<div style="display:flex;align-items:center;padding:14px 18px;border-bottom:1px solid #1a2a38;">' +
          '<span style="font-size:16px;margin-right:8px;">🏓</span>' +
          '<span style="font-weight:700;color:#e6edf3;font-size:14px;">Ping: ' + ip + '</span>' +
          '<button onclick="document.getElementById(\'ns-result-modal\').remove()" style="margin-left:auto;background:transparent;border:1px solid #2a3b48;color:#8ea3b0;border-radius:6px;padding:4px 10px;cursor:pointer;">✕</button>' +
        '</div>' +
        '<div style="padding:18px;">' +
          /* Пресети */
          '<div style="margin-bottom:14px;">' +
            '<div style="color:#4a6070;font-size:11px;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;">Швидкий вибір</div>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
              '<button onclick="window.nsPingFill(4,56,100)" style="background:#1a2a3a;border:1px solid #2a3b48;color:#5fd0a5;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;">Стандарт</button>' +
              '<button onclick="window.nsPingFill(10,56,100)" style="background:#1a2a3a;border:1px solid #2a3b48;color:#5fd0a5;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;">Швидкий</button>' +
              '<button onclick="window.nsPingFill(100,56,10)" style="background:#1a2a3a;border:1px solid #2a3b48;color:#5fd0a5;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;">Тест 100</button>' +
              '<button onclick="window.nsPingFill(4,1472,100)" style="background:#1a2a3a;border:1px solid #2a3b48;color:#f0a840;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;">Великі (1472b)</button>' +
              '<button onclick="window.nsPingFill(4,32,100)" style="background:#1a2a3a;border:1px solid #2a3b48;color:#f0a840;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;">Малі (32b)</button>' +
              '<button onclick="window.nsPingFill(300,56,10)" style="background:#1a2a3a;border:1px solid #2a3b48;color:#c084fc;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;">Flood 300</button>' +
            '</div>' +
          '</div>' +
          /* Параметри */
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px;">' +
            '<div>' +
              '<label style="color:#4a6070;font-size:11px;display:block;margin-bottom:4px;">Кількість пінгів</label>' +
              '<input id="ping-count" type="number" value="4" min="1" max="9999" ' +
                'style="width:100%;background:#060d14;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:7px 10px;font-size:13px;box-sizing:border-box;">' +
            '</div>' +
            '<div>' +
              '<label style="color:#4a6070;font-size:11px;display:block;margin-bottom:4px;">Розмір пакету (b)</label>' +
              '<input id="ping-size" type="number" value="56" min="28" max="9000" ' +
                'style="width:100%;background:#060d14;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:7px 10px;font-size:13px;box-sizing:border-box;">' +
            '</div>' +
            '<div>' +
              '<label style="color:#4a6070;font-size:11px;display:block;margin-bottom:4px;">Інтервал (мс)</label>' +
              '<input id="ping-interval" type="number" value="1000" min="10" max="5000" ' +
                'style="width:100%;background:#060d14;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:7px 10px;font-size:13px;box-sizing:border-box;">' +
            '</div>' +
          '</div>' +
          /* Traceroute */
          '<div style="background:#080f17;border:1px solid #1a2a38;border-radius:8px;padding:10px 14px;margin-bottom:14px;">' +
            '<div style="color:#4a6070;font-size:11px;margin-bottom:8px;">Traceroute</div>' +
            '<div style="display:flex;gap:8px;align-items:center;">' +
              '<input id="trace-count" type="number" value="3" min="1" max="10" ' +
                'style="width:80px;background:#060d14;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:6px 8px;font-size:12px;">' +
              '<span style="color:#4a6070;font-size:12px;">пакетів</span>' +
              '<button onclick="window.nsRunSSHCmd(\'/tool traceroute ' + ip + ' count=\'+document.getElementById(\'trace-count\').value,\'📡 Traceroute ' + ip + '\')" ' +
                'style="background:#1a2a3a;border:1px solid #2a3b48;color:#c084fc;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:12px;">📡 Запустити</button>' +
            '</div>' +
          '</div>' +
          /* Кнопки */
          '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
            '<button onclick="document.getElementById(\'ns-result-modal\').remove()" ' +
              'style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;border-radius:6px;padding:8px 18px;cursor:pointer;font-size:13px;">Скасувати</button>' +
            '<button onclick="window.nsDoPing(\'' + ip + '\')" ' +
              'style="background:linear-gradient(135deg,#5fd0a5,#4ab890);color:#082018;border:none;border-radius:6px;padding:8px 24px;cursor:pointer;font-size:13px;font-weight:700;">🏓 Ping!</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
  }

  

  

  function nsShowPortMenu(e, ip) {
    e.stopPropagation();
    nsCloseMenus();
    var existing = document.getElementById('ns-result-modal');
    if (existing) existing.remove();

    var COMMON_PORTS = [
      {port:21,name:'FTP',checked:false},{port:22,name:'SSH',checked:true},
      {port:23,name:'Telnet',checked:false},{port:25,name:'SMTP',checked:false},
      {port:53,name:'DNS',checked:true},{port:80,name:'HTTP',checked:true},
      {port:443,name:'HTTPS',checked:true},{port:445,name:'SMB',checked:false},
      {port:1194,name:'OpenVPN',checked:false},{port:1723,name:'PPTP',checked:false},
      {port:3306,name:'MySQL',checked:false},{port:3389,name:'RDP',checked:true},
      {port:5432,name:'PostgreSQL',checked:false},{port:5900,name:'VNC',checked:false},
      {port:8080,name:'HTTP-Alt',checked:true},{port:8291,name:'Winbox',checked:true},
      {port:8443,name:'HTTPS-Alt',checked:false},{port:8728,name:'API',checked:true},
      {port:8729,name:'API-SSL',checked:false},{port:161,name:'SNMP',checked:false},
    ];

    var portCheckboxes = COMMON_PORTS.map(function(p) {
      return '<label style="display:flex;align-items:center;gap:6px;padding:3px 0;cursor:pointer;font-size:12px;color:#c9d8e4;">' +
        '<input type="checkbox" id="port-'+p.port+'" '+(p.checked?'checked':'')+' style="cursor:pointer;">' +
        '<span style="color:#4a90d9;font-family:monospace;width:40px;">:'+p.port+'</span>' +
        '<span>'+p.name+'</span>' +
      '</label>';
    }).join('');

    var modal = document.createElement('div');
    modal.id = 'ns-result-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);z-index:99998;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML =
      '<div style="background:#0d1117;border:1px solid #2a3b48;border-radius:12px;width:560px;max-height:90vh;overflow-y:auto;">' +
        '<div style="display:flex;align-items:center;padding:14px 18px;border-bottom:1px solid #1a2a38;position:sticky;top:0;background:#0d1117;z-index:1;">' +
          '<span style="font-size:16px;margin-right:8px;">🔌</span>' +
          '<span style="font-weight:700;color:#e6edf3;font-size:14px;">Інструменти: ' + ip + '</span>' +
          '<button onclick="document.getElementById(\'ns-result-modal\').remove()" style="margin-left:auto;background:transparent;border:1px solid #2a3b48;color:#8ea3b0;border-radius:6px;padding:4px 10px;cursor:pointer;">✕</button>' +
        '</div>' +
        '<div style="padding:18px;">' +

          /* Порт-скан */
          '<div style="background:#080f17;border:1px solid #2a3b48;border-radius:8px;padding:14px;margin-bottom:14px;">' +
            '<div style="display:flex;align-items:center;margin-bottom:10px;">' +
              '<span style="color:#e6edf3;font-weight:600;font-size:13px;">🔍 Порт-скан</span>' +
              '<button onclick="event.stopPropagation();window.nsSelectAllPorts(true)" style="margin-left:auto;background:transparent;border:none;color:#4a90d9;cursor:pointer;font-size:11px;">Всі</button>' +
              '<button onclick="event.stopPropagation();window.nsSelectAllPorts(false)" style="background:transparent;border:none;color:#4a6070;cursor:pointer;font-size:11px;">Жодного</button>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;max-height:200px;overflow-y:auto;margin-bottom:10px;">' +
              portCheckboxes +
            '</div>' +
            '<div style="display:flex;gap:8px;align-items:center;">' +
              '<input id="custom-ports" type="text" placeholder="Додати порти: 8888,9090,..." ' +
                'onclick="event.stopPropagation()" ' +
                'onkeydown="event.stopPropagation()" ' +
                'style="flex:1;background:#060d14;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:6px 10px;font-size:12px;">' +
              '<button onclick="window.nsDoPortScan(\'' + ip + '\')" ' +
                'style="background:linear-gradient(135deg,#f0a840,#e07820);color:#000;border:none;border-radius:6px;padding:7px 18px;cursor:pointer;font-size:12px;font-weight:700;">🔍 Сканувати</button>' +
            '</div>' +
          '</div>' +

          /* Інструменти */
          '<div style="background:#080f17;border:1px solid #2a3b48;border-radius:8px;padding:14px;margin-bottom:14px;">' +
            '<div style="color:#e6edf3;font-weight:600;font-size:13px;margin-bottom:10px;">🛠 Інструменти</div>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
              '<button onclick="window.nsRunSSHCmd(\'/ip arp print where address=' + ip + '\',\'📋 ARP ' + ip + '\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#c9d8e4;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px;">📋 ARP</button>' +
              '<button onclick="window.nsRunSSHCmd(\'/resolve ' + ip + '\',\'🔗 DNS ' + ip + '\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#c9d8e4;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px;">🔗 DNS</button>' +
              '<button onclick="window.nsRunSSHCmd(\'/tool bandwidth-test address=' + ip + ' direction=both duration=5\',\'📊 Bandwidth ' + ip + '\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#c9d8e4;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px;">📊 Bandwidth</button>' +
              '<button onclick="window.nsRunSSHCmd(\'/ip dhcp-server lease print where address=' + ip + '\',\'📋 DHCP lease ' + ip + '\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#c9d8e4;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px;">📋 DHCP lease</button>' +
            '</div>' +
          '</div>' +

          /* Firewall */
          '<div style="background:#080f17;border:1px solid #2a3b48;border-radius:8px;padding:14px;">' +
            '<div style="color:#e6edf3;font-weight:600;font-size:13px;margin-bottom:10px;">🔥 Firewall</div>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
              '<button onclick="window.nsBlockIP(\'' + ip + '\')" style="background:#2a0808;border:1px solid #4a1a1a;color:#e05252;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:12px;">🚫 Заблокувати</button>' +
              '<button onclick="window.nsUnblockIP(\'' + ip + '\')" style="background:#0a2a0a;border:1px solid #1a4a1a;color:#5fd0a5;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:12px;">✅ Розблокувати</button>' +
              '<button onclick="window.nsRunSSHCmd(\'/ip firewall filter print where src-address=' + ip + '\',\'🔥 Firewall rules ' + ip + '\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#c9d8e4;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:12px;">📋 Правила</button>' +
            '</div>' +
          '</div>' +

        '</div>' +
      '</div>';
    document.body.appendChild(modal);
  }

  

  

  function nsCloseMenus() {
    ['ns-ping-menu','ns-port-menu'].forEach(function(id){ var m=document.getElementById(id); if(m) m.remove(); });
  }

  function nsRunSSHCmd(cmd, title) {
    var router = getActive();
    if (!router) { alert('Немає роутера'); return; }
    var existing = document.getElementById('ns-result-modal');
    if (existing) existing.remove();
    var modal = document.createElement('div');
    modal.id = 'ns-result-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);z-index:99998;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML =
      '<div style="background:#0d1117;border:1px solid #2a3b48;border-radius:12px;width:620px;max-height:80vh;overflow-y:auto;">' +
        '<div style="display:flex;align-items:center;padding:14px 18px;border-bottom:1px solid #1a2a38;position:sticky;top:0;background:#0d1117;">' +
          '<span style="font-weight:700;color:#e6edf3;font-size:14px;">'+title+'</span>' +
          '<code style="margin-left:10px;font-size:10px;color:#4a6070;flex:1;overflow:hidden;text-overflow:ellipsis;">'+cmd+'</code>' +
          '<button onclick="document.getElementById(\'ns-result-modal\').remove()" style="margin-left:8px;background:transparent;border:1px solid #2a3b48;color:#8ea3b0;border-radius:6px;padding:4px 10px;cursor:pointer;">✕</button>' +
        '</div>' +
        '<div id="ns-result-body" style="padding:16px;font-family:monospace;font-size:12px;color:#4a6070;">⏳ Виконую...</div>' +
      '</div>';
    document.body.appendChild(modal);
    fetch('http://localhost:8888/ssh/exec',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({host:router.ip,port:router.sshPort||22,username:router.user,password:router.pass,command:cmd})
    }).then(function(r){return r.json();}).then(function(d){
      var body=document.getElementById('ns-result-body');
      if(!body) return;
      var out=d.output||d.error||'Немає відповіді';
      body.style.color=d.ok?'#5fd0a5':'#e05252';
      body.innerHTML='<pre style="margin:0;white-space:pre-wrap;word-break:break-all;">'+out.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</pre>';
    }).catch(function(e){
      var body=document.getElementById('ns-result-body');
      if(body) body.innerHTML='<span style="color:#e05252;">❌ '+e+'</span>';
    });
  }

  function nsPortScan(ip) {
    var router = getActive();
    if (!router) { alert('Немає роутера'); return; }
    var ports = [21,22,23,25,53,80,443,1194,1723,3306,3389,5432,5900,8080,8291,8443,8728,8729];
    var cmds  = ports.map(function(p){ return '/tool fetch address='+ip+' port='+p+' mode=tcp dst-path=/null as-value'; });
    nsRunSSHCmd(cmds.join('\n'), '🔌 Port Scan '+ip);
  }

  function nsBlockIP(ip) {
    if(!confirm('Заблокувати '+ip+'?')) return;
    nsRunSSHCmd('/ip firewall filter add chain=forward src-address='+ip+' action=drop comment="Blocked by Scanner"','🚫 Block '+ip);
  }

  function nsUnblockIP(ip) {
    nsRunSSHCmd('/ip firewall filter remove [find where src-address='+ip+' comment="Blocked by Scanner"]','✅ Unblock '+ip);
  }

  function nsPing(ip) {
    nsShowPingMenu({target:{getBoundingClientRect:function(){return {bottom:300,left:300};}},stopPropagation:function(){}},ip);
  }

  /* ── Реєструємо глобально ── */
  window.renderNetworkScanner = renderNetworkScanner;
  window.startNetScan         = startNetScan;
  window.nsFilter             = nsFilter;
  window.nsRender             = nsRender;
  window.nsPing               = nsPing;
  window.nsAddToRouter        = nsAddToRouter;
  window.nsPortScan           = nsPortScan;
  window.nsExportCSV          = nsExportCSV;
  window.nsExportExcel        = nsExportExcel;
  window.nsSetAutoRefresh     = nsSetAutoRefresh;
  window.nsShowPingMenu       = nsShowPingMenu;
  window.nsShowPortMenu       = nsShowPortMenu;
  window.nsCloseMenus         = nsCloseMenus;
  window.nsRunSSHCmd          = nsRunSSHCmd;
  window.nsBlockIP            = nsBlockIP;
  window.nsUnblockIP          = nsUnblockIP;

  console.log('[NetworkScanner] завантажено ✅');

  /* ── Ping форма ── */
  function nsPingFill(count, size, interval) {
    var c = document.getElementById('ping-count');
    var s = document.getElementById('ping-size');
    var i = document.getElementById('ping-interval');
    if (c) c.value = count;
    if (s) s.value = size;
    if (i) i.value = interval;
  }

  function nsDoPing(ip) {
    var count    = (document.getElementById('ping-count')    || {value:'4'}).value    || '4';
    var size     = (document.getElementById('ping-size')     || {value:'56'}).value   || '56';
    var interval = (document.getElementById('ping-interval') || {value:'1000'}).value || '1000';
    var cmd = '/ping ' + ip + ' count=' + count + ' size=' + size + ' interval=' + interval + 'ms';
    document.getElementById('ns-result-modal').remove();
    nsRunSSHCmd(cmd, '🏓 Ping ' + ip + ' ×' + count);
  }

  /* ── Port scan форма ── */
  function nsSelectAllPorts(val) {
    var inputs = document.querySelectorAll('[id^="port-"]');
    inputs.forEach(function(inp) { inp.checked = val; });
  }

  function nsDoPortScan(ip) {
    var selected = [];
    document.querySelectorAll('[id^="port-"]').forEach(function(inp) {
      if (inp.checked) selected.push(inp.id.replace('port-', ''));
    });
    var custom = (document.getElementById('custom-ports') || {value:''}).value;
    if (custom) {
      custom.split(',').forEach(function(p) {
        var t = p.trim();
        if (t && !isNaN(t)) selected.push(t);
      });
    }
    if (!selected.length) { alert('Виберіть хоча б один порт!'); return; }

    var router = getActive();
    if (!router) return;

    /* Закриваємо форму */
    var oldModal = document.getElementById('ns-result-modal');
    if (oldModal) oldModal.remove();

    /* Результат модал */
    var res = document.createElement('div');
    res.id = 'ns-result-modal';
    res.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);' +
      'z-index:99998;display:flex;align-items:center;justify-content:center;';
    res.innerHTML =
      '<div style="background:#0d1117;border:1px solid #2a3b48;border-radius:12px;' +
        'width:460px;max-height:80vh;overflow-y:auto;">' +
        '<div style="display:flex;align-items:center;padding:14px 18px;' +
          'border-bottom:1px solid #1a2a38;position:sticky;top:0;background:#0d1117;">' +
          '<span style="font-weight:700;color:#e6edf3;">🔌 Порт-скан: ' + ip + '</span>' +
          '<span style="margin-left:8px;font-size:11px;color:#4a6070;">(' + selected.length + ' портів)</span>' +
          '<button onclick="document.getElementById(\'ns-result-modal\').remove()" ' +
            'style="margin-left:auto;background:transparent;border:1px solid #2a3b48;' +
            'color:#8ea3b0;border-radius:6px;padding:4px 10px;cursor:pointer;">✕</button>' +
        '</div>' +
        '<div id="ns-portscan-rows" style="padding:14px;">' +
          selected.map(function(p) {
            return '<div id="ps-row-' + p + '" ' +
              'style="display:flex;gap:10px;padding:5px 0;border-bottom:1px solid #0a1a28;' +
              'align-items:center;">' +
              '<span style="color:#4a90d9;font-family:monospace;width:50px;">:' + p + '</span>' +
              '<span style="color:#4a6070;font-size:12px;">⏳ scanning...</span>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';
    document.body.appendChild(res);

    /* Скануємо по одному */
    var i = 0;
    function scanNext() {
      if (i >= selected.length) return;
      var port = selected[i++];
      fetch('http://localhost:8888/ssh/exec', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          host: router.ip, port: router.sshPort || 22,
          username: router.user, password: router.pass,
          command: '/tool fetch address=' + ip + ' port=' + port +
                   ' mode=tcp dst-path=/null as-value'
        })
      }).then(function(r) { return r.json(); }).then(function(d) {
        var row = document.getElementById('ps-row-' + port);
        if (!row) return;
        var out    = d.output || '';
        var isOpen = out.includes('status=finished') || out.includes('downloaded');
        row.innerHTML =
          '<span style="color:#4a90d9;font-family:monospace;width:50px;">:' + port + '</span>' +
          '<span style="color:' + (isOpen ? '#5fd0a5' : '#4a6070') + ';font-weight:' +
            (isOpen ? '700' : '400') + ';">' +
            (isOpen ? '● OPEN' : '○ closed') +
          '</span>';
        scanNext();
      }).catch(function() {
        var row = document.getElementById('ps-row-' + port);
        if (row) row.innerHTML =
          '<span style="color:#4a90d9;font-family:monospace;width:50px;">:' + port + '</span>' +
          '<span style="color:#e05252;">✗ error</span>';
        scanNext();
      });
    }
    /* 3 паралельних потоки */
    scanNext(); scanNext(); scanNext();
  }

})();
  window.nsPingFill = nsPingFill;
  window.nsDoPing = nsDoPing;
  window.nsSelectAllPorts = nsSelectAllPorts;
  window.nsDoPortScan = nsDoPortScan;