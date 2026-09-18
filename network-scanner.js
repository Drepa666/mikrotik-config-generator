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
          '<button id="ns-scan-btn" onclick="window.startNetScan()" ' +
            'style="margin-left:auto;background:linear-gradient(135deg,#5fd0a5,#4ab890);' +
            'color:#082018;border:none;border-radius:8px;padding:10px 24px;' +
            'font-size:14px;font-weight:700;cursor:pointer;">▶ Сканувати</button>' +
        '</div>' +

        '<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">' +
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
        devices[key].hostname = e['host-name']||devices[key].hostname||'';
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
    var q     = (document.getElementById('ns-search')||{value:''}).value.toLowerCase();
    var type  = (document.getElementById('ns-type-filter')||{value:''}).value;
    var iface = (document.getElementById('ns-iface-filter')||{value:''}).value;
    var filtered = (window.__nsDevices||[]).filter(function(d) {
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
        '<td style="padding:10px 12px;font-weight:600;color:#4a90d9;font-family:monospace;">' + esc(d.ip||'—') + '</td>' +
        '<td style="padding:10px 12px;font-family:monospace;font-size:12px;color:#8ea3b0;">' + esc(d.mac||'—') +
          (d.vendor ? '<br><span style="color:#4a6070;font-size:10px;">'+esc(d.vendor)+'</span>' : '') + '</td>' +
        '<td style="padding:10px 12px;color:#e6edf3;">' + esc(d.hostname||d.platform||'—') + '</td>' +
        '<td style="padding:10px 12px;color:#8ea3b0;font-size:12px;">' + esc(d.iface||'—') + '</td>' +
        '<td style="padding:10px 12px;">' + nsTypeBadge(d.type) + '</td>' +
        '<td style="padding:10px 12px;">' + sig + '</td>' +
        '<td style="padding:10px 12px;">' +
          '<div style="display:flex;gap:4px;">' +
            (d.ip ? '<button onclick="window.nsPing(\''+esc(d.ip)+'\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#5fd0a5;border-radius:4px;padding:3px 8px;cursor:pointer;font-size:11px;">🏓</button>' : '') +
            (d.ip ? '<button onclick="window.nsAddToRouter(\''+esc(d.ip)+'\',\''+esc(d.mac)+'\',\''+esc(d.hostname)+'\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#4a90d9;border-radius:4px;padding:3px 8px;cursor:pointer;font-size:11px;">➕</button>' : '') +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');

    wrap.innerHTML =
      '<table style="width:100%;border-collapse:collapse;">' +
        '<thead><tr style="background:#080f17;border-bottom:2px solid #2a3b48;">' +
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

  /* ── Реєструємо глобально ── */
  window.renderNetworkScanner = renderNetworkScanner;
  window.startNetScan         = startNetScan;
  window.nsFilter             = nsFilter;
  window.nsRender             = nsRender;
  window.nsPing               = nsPing;
  window.nsAddToRouter        = nsAddToRouter;

  console.log('[NetworkScanner] завантажено ✅');
})();
