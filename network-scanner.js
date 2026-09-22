/* ══════════════════════════════════════════════════════
   NETWORK SCANNER v2.0 — повністю переписано
   ══════════════════════════════════════════════════════ */
'use strict';

/* ── Helpers ── */
function nsGetRouter() {
  try {
    var routers  = JSON.parse(localStorage.getItem('rm-routers') || '[]');
    var activeId = localStorage.getItem('rm-active-router');
    return routers.find(function(r){ return r.id === activeId; }) || routers[0] || null;
  } catch(e) { return null; }
}

function nsEsc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function nsRestCall(path) {
  /* Використовуємо window.restCall з router-manager.js */
  if (window.restCall && window.getActiveRouter) {
    var r = window.getActiveRouter();
    if (!r) return Promise.reject('No router');
    return window.restCall(r, 'GET', path)
      .then(function(d) { return Array.isArray(d) ? d : (d ? [d] : []); });
  }
  /* Fallback */
  var r2 = window.getActiveRouter ? window.getActiveRouter() : null;
  if (!r2) return Promise.reject('No router');
  return fetch('http://localhost:8888/rest' + path, {
    headers: {
      'x-router-ip':   r2.ip,
      'x-router-port': String(r2.port || 80),
      'x-router-user': r2.user || 'admin',
      'x-router-pass': r2.pass || '',
      'Authorization': 'Basic ' + btoa((r2.user||'admin') + ':' + (r2.pass||'')),
    }
  }).then(function(r) {
    if (!r.ok) return [];
    return r.json().then(function(d) { return Array.isArray(d) ? d : []; });
  }).catch(function() { return []; });
}

function nsSSH(cmd) {
  var r = nsGetRouter();
  if (!r) return Promise.reject('No router');
  return fetch('http://localhost:8888/ssh/exec', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      host: r.ip, port: r.sshPort || 22,
      user: r.user, username: r.user, password: r.pass,
      command: cmd
    })
  }).then(function(res){ return res.json(); });
}

/* ── Головна функція ── */
window.renderNetworkScanner = function() {
  var cont = document.getElementById('rm-content');
  if (!cont) return;

  cont.innerHTML = [
    '<div style="padding:20px;">',
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">',
        '<span style="font-size:24px;">🔍</span>',
        '<div>',
          '<div style="font-size:18px;font-weight:700;color:#e6edf3;">Сканер мережі</div>',
          '<div style="font-size:12px;color:#8ea3b0;">ARP · DHCP · Neighbors · WiFi</div>',
        '</div>',
        '<div style="margin-left:auto;display:flex;gap:8px;">',
          '<button id="ns-scan-btn"',
            ' onclick="window.nsStartScan()"',
            ' style="background:linear-gradient(135deg,#5fd0a5,#4ab890);color:#082018;',
            'border:none;border-radius:8px;padding:10px 24px;font-size:14px;font-weight:700;cursor:pointer;">',
            '▶ Сканувати</button>',
          '<select id="ns-auto-interval" onchange="window.nsSetAutoRefresh()"',
            ' style="background:#060d14;border:1px solid #2a3b48;border-radius:8px;',
            'color:#e6edf3;padding:8px 12px;font-size:12px;">',
            '<option value="0">⏱ Авто: вимк</option>',
            '<option value="10">⏱ 10 сек</option>',
            '<option value="30">⏱ 30 сек</option>',
            '<option value="60">⏱ 1 хв</option>',
            '<option value="300">⏱ 5 хв</option>',
          '</select>',
          '<button onclick="window.nsExportCSV()"',
            ' style="background:#1a2a3a;border:1px solid #2a3b48;color:#5fd0a5;',
            'border-radius:8px;padding:10px 16px;font-size:13px;cursor:pointer;">📥 CSV</button>',
        '</div>',
      '</div>',

      '<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">',
        '<label style="display:flex;align-items:center;gap:6px;background:#060d14;',
          'border:1px solid #2a3b48;border-radius:8px;padding:8px 14px;cursor:pointer;',
          'font-size:13px;color:#c9d8e4;white-space:nowrap;">',
          '<input type="checkbox" id="ns-online-only" onchange="window.nsFilter()">',
          '<span style="color:#5fd0a5;">●</span> Тільки онлайн',
        '</label>',
        '<input id="ns-search" type="text" placeholder="🔍 IP, MAC, hostname..."',
          ' oninput="window.nsFilter()"',
          ' style="flex:1;min-width:200px;background:#060d14;border:1px solid #2a3b48;',
          'border-radius:8px;color:#e6edf3;padding:8px 14px;font-size:13px;">',
        '<select id="ns-type-filter" onchange="window.nsFilter()"',
          ' style="background:#060d14;border:1px solid #2a3b48;border-radius:8px;',
          'color:#e6edf3;padding:8px 14px;font-size:13px;">',
          '<option value="">Всі типи</option>',
          '<option value="arp">ARP</option>',
          '<option value="dhcp">DHCP</option>',
          '<option value="neighbor">Neighbor</option>',
          '<option value="wifi">WiFi</option>',
        '</select>',
        '<select id="ns-iface-filter" onchange="window.nsFilter()"',
          ' style="background:#060d14;border:1px solid #2a3b48;border-radius:8px;',
          'color:#e6edf3;padding:8px 14px;font-size:13px;">',
          '<option value="">Всі інтерфейси</option>',
        '</select>',
      '</div>',

      '<div id="ns-stats" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;"></div>',

      '<div id="ns-table-wrap" style="background:#060d14;border:1px solid #2a3b48;border-radius:10px;overflow:hidden;">',
        '<div style="padding:40px;text-align:center;color:#4a6070;">',
          '🔍 Натисни «Сканувати» щоб знайти всі пристрої',
        '</div>',
      '</div>',
    '</div>'
  ].join('');

  setTimeout(window.nsStartScan, 300);
};

/* ── Сканування ── */
window.__nsDevices = [];
window.__nsAutoTimer = null;

window.nsSetAutoRefresh = function() {
  var sel = document.getElementById('ns-auto-interval');
  var sec = sel ? parseInt(sel.value) : 0;
  if (window.__nsAutoTimer) { clearInterval(window.__nsAutoTimer); window.__nsAutoTimer = null; }
  if (sec > 0) {
    window.__nsAutoTimer = setInterval(function() {
      if (document.getElementById('ns-scan-btn')) window.nsStartScan();
      else { clearInterval(window.__nsAutoTimer); window.__nsAutoTimer = null; }
    }, sec * 1000);
  }
};

window.nsStartScan = function() {
  var btn = document.getElementById('ns-scan-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Сканую...'; }
  var wrap = document.getElementById('ns-table-wrap');
  if (wrap) wrap.innerHTML = '<div style="padding:20px;text-align:center;color:#4a6070;">⏳ Завантаження...</div>';

  var OUI = {
    '00:0C:42':'MikroTik','D4:CA:6D':'MikroTik','B8:69:F4':'MikroTik',
    '4C:5E:0C':'MikroTik','CC:2D:E0':'MikroTik','2C:C8:1B':'MikroTik',
    '00:50:56':'VMware','00:0C:29':'VMware','B8:27:EB':'Raspberry Pi',
    'DC:A6:32':'Raspberry Pi','AC:84:C6':'Xiaomi','FC:EC:DA':'Ubiquiti',
    '44:D9:E7':'Ubiquiti','A0:40:A0':'Samsung','78:CA:39':'Apple',
    'F0:18:98':'Apple','B4:E6:2D':'Apple',
  };

  Promise.allSettled([
    nsRestCall('/ip/arp').catch(function(){ return []; }),
    nsRestCall('/ip/dhcp-server/lease').catch(function(){ return []; }),
    nsRestCall('/ip/neighbor').catch(function(){ return []; }),
    nsRestCall('/interface/wireless/registration-table').catch(function(){ return []; }),
  ]).then(function(results) {
    function safeList(r) { return (r && r.status==='fulfilled' && Array.isArray(r.value)) ? r.value : []; }
    var arpList      = safeList(results[0]);
    var dhcpList     = safeList(results[1]);
    var neighborList = safeList(results[2]);
    var wifiList     = safeList(results[3]);
    var devices = {};

    arpList.forEach(function(e) {
      var mac = (e['mac-address']||'').toUpperCase();
      var ip  = e['address']||'';
      if (!ip || ip === '0.0.0.0') return;
      var key = mac || ip;
      devices[key] = {ip:ip, mac:mac, hostname:'', iface:e['interface']||'',
                      type:'arp', vendor:'', signal:'', online:true};
    });

    dhcpList.forEach(function(e) {
      var mac = (e['mac-address']||'').toUpperCase();
      var ip  = e['address']||'';
      var key = mac || ip;
      if (!devices[key]) devices[key] = {ip:ip, mac:mac, hostname:'', iface:'',
                                          type:'dhcp', vendor:'', signal:'', online:true};
      devices[key].hostname = e['host-name'] || devices[key].hostname || '';
      devices[key].online   = e['status'] === 'bound' ? true :
                              (e['status'] === 'waiting' || e['status'] === 'expired') ? false : null;
      devices[key].type = devices[key].type === 'arp' ? 'arp+dhcp' : 'dhcp';
    });

    neighborList.forEach(function(e) {
      var mac = (e['mac-address']||'').toUpperCase();
      var ip  = e['address4']||e['address6']||'';
      var key = mac || ip;
      if (!devices[key]) devices[key] = {ip:ip, mac:mac, hostname:'', iface:'',
                                          type:'neighbor', vendor:'', signal:'', online:true};
      devices[key].hostname = e['identity'] || devices[key].hostname || '';
      devices[key].platform = e['platform'] || '';
      devices[key].type = 'neighbor';
    });

    wifiList.forEach(function(e) {
      var mac = (e['mac-address']||'').toUpperCase();
      if (!devices[mac]) devices[mac] = {ip:'', mac:mac, hostname:'', iface:e['interface']||'',
                                           type:'wifi', vendor:'', signal:'', online:null};
      devices[mac].signal = e['signal-strength'] || '';
      devices[mac].txRate = e['tx-rate'] || '';
      devices[mac].online = true;
      devices[mac].type   = devices[mac].type !== 'wifi' ? devices[mac].type+'+wifi' : 'wifi';
    });

    Object.values(devices).forEach(function(d) {
      if (d.mac) d.vendor = OUI[d.mac.substring(0,8)] || '';
    });

    var arr = Object.values(devices);

    /* Наповнюємо фільтр інтерфейсів */
    var ifSel = document.getElementById('ns-iface-filter');
    if (ifSel) {
      var ifaces = arr.map(function(d){ return d.iface; }).filter(Boolean)
                      .filter(function(v,i,a){ return a.indexOf(v)===i; });
      ifaces.forEach(function(iface) {
        var opt = document.createElement('option');
        opt.value = iface; opt.textContent = iface;
        ifSel.appendChild(opt);
      });
    }

    window.__nsDevices = arr;
    window.nsRender(arr);
    if (btn) { btn.textContent = '🏓 Перевірка...'; }

    /* Перевіряємо реальний статус пінгом для ВСІХ пристроїв з IP */
    var toCheck = arr.filter(function(d){ return d.ip; });
    var checked = 0;

    if (!toCheck.length) {
      if (btn) { btn.disabled = false; btn.textContent = '🔄 Оновити'; }
      return;
    }

    /* Пінгуємо по 3 паралельно */
    var idx = 0;
    function pingNext() {
      if (idx >= toCheck.length) return;
      var d = toCheck[idx++];
      nsSSH('/ping ' + d.ip + ' count=1 interval=200ms')
        .then(function(res) {
          var out = res.output || '';
          /* received=1 або ttl= означає онлайн */
          /* RouterOS ping output: sent=1 received=1 або host unreachable */
          var received = out.match(/received=(\d+)/);
          var rcvNum   = received ? parseInt(received[1]) : 0;
          d.online = (rcvNum > 0 ||
                      out.includes('ttl=') ||
                      out.includes('time=')) ? true : false;
        })
        .catch(function() { d.online = null; })
        .finally(function() {
          checked++;
          /* Оновлюємо рядок в таблиці */
          window.nsRender(window.__nsDevices);
          if (checked >= toCheck.length) {
            if (btn) { btn.disabled = false; btn.textContent = '🔄 Оновити'; }
          } else {
            pingNext();
          }
        });
    }
    /* 3 паралельних потоки */
    pingNext(); pingNext(); pingNext();
  });
};

window.nsFilter = function() {
  var q          = (document.getElementById('ns-search')       ||{value:''}).value.toLowerCase();
  var type       = (document.getElementById('ns-type-filter')  ||{value:''}).value;
  var iface      = (document.getElementById('ns-iface-filter') ||{value:''}).value;
  var onlineOnly = (document.getElementById('ns-online-only')  ||{checked:false}).checked;

  var filtered = (window.__nsDevices||[]).filter(function(d) {
    if (onlineOnly && !d.online) return false;
    if (q && !((d.ip||'').includes(q)||(d.mac||'').toLowerCase().includes(q)||
               (d.hostname||'').toLowerCase().includes(q)||(d.vendor||'').toLowerCase().includes(q))) return false;
    if (type  && !d.type.includes(type))  return false;
    if (iface && d.iface !== iface)        return false;
    return true;
  });
  window.nsRender(filtered);
};

window.nsRender = function(devices) {
  var stats = document.getElementById('ns-stats');
  if (stats) {
    stats.innerHTML =
      nsStat('📡 Всього',  devices.length, '#4a90d9') +
      nsStat('🔗 ARP',    devices.filter(function(d){return d.type.includes('arp');}).length,      '#5fd0a5') +
      nsStat('📋 DHCP',   devices.filter(function(d){return d.type.includes('dhcp');}).length,     '#f0a840') +
      nsStat('🏘 Сусіди', devices.filter(function(d){return d.type.includes('neighbor');}).length, '#c084fc') +
      nsStat('📶 WiFi',   devices.filter(function(d){return d.type.includes('wifi');}).length,     '#60a5fa');
  }

  var wrap = document.getElementById('ns-table-wrap');
  if (!wrap) return;
  if (!devices.length) {
    wrap.innerHTML = '<div style="padding:40px;text-align:center;color:#4a6070;">Пристроїв не знайдено</div>';
    return;
  }

  var rows = devices.map(function(d) {
    var statusDot = d.online === true
      ? '<span title="Онлайн" style="color:#5fd0a5;font-size:14px;">●</span>'
      : d.online === false
        ? '<span title="Офлайн" style="color:#e05252;font-size:14px;">●</span>'
        : '<span title="ARP cache" style="color:#f0a840;font-size:14px;">●</span>';

    var sig = d.signal
      ? '<span style="color:' + (parseInt(d.signal) >= -60 ? '#5fd0a5' : parseInt(d.signal) >= -75 ? '#f0a840' : '#e05252') + ';">' + d.signal + ' dBm</span>'
      : '—';

    var ip  = nsEsc(d.ip  || '—');
    var mac = nsEsc(d.mac || '—');
    var hn  = nsEsc(d.hostname || d.platform || '—');
    var ifc = nsEsc(d.iface || '—');
    var vnd = d.vendor ? '<br><span style="color:#4a6070;font-size:10px;">' + nsEsc(d.vendor) + '</span>' : '';

    var typeBadge = (function(t) {
      var map = {
        'arp':'#0a2a1a:#5fd0a5','dhcp':'#1a1a0a:#f0a840',
        'neighbor':'#1a0a2a:#c084fc','wifi':'#0a1a2a:#60a5fa','arp+dhcp':'#0a2a1a:#5fd0a5'
      };
      var c = (map[t]||'#1a2a3a:#8ea3b0').split(':');
      return '<span style="background:'+c[0]+';color:'+c[1]+';padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">'+t+'</span>';
    })(d.type);

    var dip = nsEsc(d.ip); var dmac = nsEsc(d.mac); var dhn = nsEsc(d.hostname||d.platform||'');

    return '<tr onmouseover="this.style.background=\'#0d1f2d\'" onmouseout="this.style.background=\'\'" style="border-bottom:1px solid #1a2a38;">' +
      '<td style="padding:6px 8px;text-align:center;width:20px;">' + statusDot + '</td>' +
      '<td style="padding:10px 12px;font-weight:600;color:#4a90d9;font-family:monospace;">' + ip + '</td>' +
      '<td style="padding:10px 12px;font-family:monospace;font-size:12px;color:#8ea3b0;">' + mac + vnd + '</td>' +
      '<td style="padding:10px 12px;color:#e6edf3;">' + hn + '</td>' +
      '<td style="padding:10px 12px;color:#8ea3b0;font-size:12px;">' + ifc + '</td>' +
      '<td style="padding:10px 12px;">' + typeBadge + '</td>' +
      '<td style="padding:10px 12px;">' + sig + '</td>' +
      '<td style="padding:10px 12px;">' +
        '<div style="display:flex;gap:4px;">' +
          (d.ip ? '<button onclick="window.nsShowPingMenu(event,\'' + dip + '\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#5fd0a5;border-radius:4px;padding:3px 10px;cursor:pointer;font-size:11px;">🏓 ▾</button>' : '') +
          (d.ip ? '<button onclick="window.nsShowPortMenu(event,\'' + dip + '\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#f0a840;border-radius:4px;padding:3px 10px;cursor:pointer;font-size:11px;">🔌 ▾</button>' : '') +
          (d.ip ? '<button onclick="window.nsAddToRouter(\'' + dip + '\',\'' + dmac + '\',\'' + dhn + '\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#4a90d9;border-radius:4px;padding:3px 8px;cursor:pointer;font-size:11px;">➕</button>' : '') +
        '</div>' +
      '</td>' +
    '</tr>';
  }).join('');

  wrap.innerHTML =
    '<table style="width:100%;border-collapse:collapse;">' +
      '<thead><tr style="background:#080f17;border-bottom:2px solid #2a3b48;">' +
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
};

function nsStat(label, val, color) {
  return '<div style="background:#080f17;border:1px solid #2a3b48;border-radius:8px;padding:10px 16px;text-align:center;min-width:80px;">' +
    '<div style="font-size:20px;font-weight:700;color:'+color+';">'+val+'</div>' +
    '<div style="font-size:11px;color:#4a6070;">'+label+'</div>' +
  '</div>';
}

/* ── Модал результату ── */
window.nsShowResult = function(title, content) {
  var old = document.getElementById('ns-modal');
  if (old) old.remove();
  var modal = document.createElement('div');
  modal.id = 'ns-modal';
  modal.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);' +
    'z-index:99998;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML =
    '<div style="background:#0d1117;border:1px solid #2a3b48;border-radius:12px;width:600px;max-height:85vh;overflow-y:auto;display:flex;flex-direction:column;">' +
      '<div style="display:flex;align-items:center;padding:14px 18px;border-bottom:1px solid #1a2a38;position:sticky;top:0;background:#0d1117;z-index:1;">' +
        '<span style="font-weight:700;color:#e6edf3;font-size:14px;">' + title + '</span>' +
        '<button onclick="document.getElementById(\'ns-modal\').remove()" ' +
          'style="margin-left:auto;background:transparent;border:1px solid #2a3b48;color:#8ea3b0;border-radius:6px;padding:4px 10px;cursor:pointer;">✕</button>' +
      '</div>' +
      '<div id="ns-modal-body" style="padding:18px;flex:1;">' + content + '</div>' +
    '</div>';
  /* Закриття по кліку на фон */
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.remove();
  });
  document.body.appendChild(modal);
};

window.nsRunSSHCmd = function(cmd, title) {
  window.nsShowResult(title,
    '<div style="color:#4a6070;font-size:12px;margin-bottom:8px;font-family:monospace;">' + nsEsc(cmd) + '</div>' +
    '<div id="ns-ssh-out" style="color:#4a6070;font-family:monospace;font-size:12px;">⏳ Виконую...</div>'
  );
  nsSSH(cmd).then(function(d) {
    var el = document.getElementById('ns-ssh-out');
    if (!el) return;
    var out = d.output || d.error || 'Немає відповіді';
    el.style.color = '#c9d8e4';
    el.innerHTML = '<pre style="margin:0;white-space:pre-wrap;word-break:break-all;">' + nsEsc(out) + '</pre>';
  }).catch(function(e) {
    var el = document.getElementById('ns-ssh-out');
    if (el) el.innerHTML = '<span style="color:#e05252;">❌ ' + nsEsc(String(e)) + '</span>';
  });
};

/* ── Ping меню ── */
window.nsShowPingMenu = function(e, ip) {
  e.stopPropagation();
  window.nsShowResult('🏓 Ping: ' + ip,
    '<div style="margin-bottom:14px;">' +
      '<div style="color:#4a6070;font-size:11px;margin-bottom:8px;text-transform:uppercase;">Швидкий вибір</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
        '<button onclick="window.nsPingFill(4,56,1000)"   style="background:#1a2a3a;border:1px solid #2a3b48;color:#5fd0a5;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;">Стандарт</button>' +
        '<button onclick="window.nsPingFill(10,56,1000)"  style="background:#1a2a3a;border:1px solid #2a3b48;color:#5fd0a5;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;">Швидкий</button>' +
        '<button onclick="window.nsPingFill(100,56,100)"  style="background:#1a2a3a;border:1px solid #2a3b48;color:#5fd0a5;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;">Тест 100</button>' +
        '<button onclick="window.nsPingFill(300,56,10)"   style="background:#1a2a3a;border:1px solid #2a3b48;color:#c084fc;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;">Flood 300</button>' +
        '<button onclick="window.nsPingFill(4,1472,1000)" style="background:#1a2a3a;border:1px solid #2a3b48;color:#f0a840;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;">Великі (1472b)</button>' +
        '<button onclick="window.nsPingFill(4,32,1000)"   style="background:#1a2a3a;border:1px solid #2a3b48;color:#f0a840;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;">Малі (32b)</button>' +
      '</div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px;">' +
      '<div>' +
        '<label style="color:#4a6070;font-size:11px;display:block;margin-bottom:4px;">Кількість пінгів</label>' +
        '<input id="ping-count" type="number" value="4" min="1" max="9999"' +
          ' style="width:100%;background:#060d14;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:7px 10px;font-size:14px;box-sizing:border-box;">' +
      '</div>' +
      '<div>' +
        '<label style="color:#4a6070;font-size:11px;display:block;margin-bottom:4px;">Розмір пакету (b)</label>' +
        '<input id="ping-size" type="number" value="56" min="28" max="9000"' +
          ' style="width:100%;background:#060d14;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:7px 10px;font-size:14px;box-sizing:border-box;">' +
      '</div>' +
      '<div>' +
        '<label style="color:#4a6070;font-size:11px;display:block;margin-bottom:4px;">Інтервал (мс)</label>' +
        '<input id="ping-interval" type="number" value="1000" min="10" max="5000"' +
          ' style="width:100%;background:#060d14;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:7px 10px;font-size:14px;box-sizing:border-box;">' +
      '</div>' +
    '</div>' +
    '<div style="background:#080f17;border:1px solid #1a2a38;border-radius:8px;padding:10px 14px;margin-bottom:14px;">' +
      '<div style="color:#4a6070;font-size:11px;margin-bottom:8px;">Traceroute</div>' +
      '<div style="display:flex;gap:8px;align-items:center;">' +
        '<input id="trace-count" type="number" value="3" min="1" max="10"' +
          ' style="width:80px;background:#060d14;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:6px 8px;font-size:13px;">' +
        '<span style="color:#4a6070;font-size:12px;">пакетів</span>' +
        '<button onclick="window.nsRunSSHCmd(\'/tool traceroute ' + ip + ' count=\'+(document.getElementById(\'trace-count\')||{value:3}).value,\'📡 Traceroute ' + ip + '\')"' +
          ' style="background:#1a2a3a;border:1px solid #2a3b48;color:#c084fc;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:12px;">📡 Запустити</button>' +
      '</div>' +
    '</div>' +
    '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
      '<button onclick="document.getElementById(\'ns-modal\').remove()"' +
        ' style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;border-radius:6px;padding:8px 18px;cursor:pointer;font-size:13px;">Скасувати</button>' +
      '<button onclick="window.nsDoPing(\'' + ip + '\')"' +
        ' style="background:linear-gradient(135deg,#5fd0a5,#4ab890);color:#082018;border:none;border-radius:6px;padding:8px 24px;cursor:pointer;font-size:13px;font-weight:700;">🏓 Ping!</button>' +
    '</div>'
  );
};

window.nsPingFill = function(count, size, interval) {
  var c = document.getElementById('ping-count');
  var s = document.getElementById('ping-size');
  var i = document.getElementById('ping-interval');
  if (c) c.value = count;
  if (s) s.value = size;
  if (i) i.value = interval;
};

window.nsDoPing = function(ip) {
  var count    = (document.getElementById('ping-count')    ||{value:'4'}).value    || '4';
  var size     = (document.getElementById('ping-size')     ||{value:'56'}).value   || '56';
  var interval = (document.getElementById('ping-interval') ||{value:'1000'}).value || '1000';
  var cmd = '/ping ' + ip + ' count=' + count + ' size=' + size + ' interval=' + interval + 'ms';
  window.nsRunSSHCmd(cmd, '🏓 Ping ' + ip + ' ×' + count);
};

/* ── Port меню ── */
window.nsShowPortMenu = function(e, ip) {
  e.stopPropagation();

  var PORTS = [
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

  var portList = PORTS.map(function(p) {
    return '<label style="display:flex;align-items:center;gap:6px;padding:3px 0;cursor:pointer;font-size:12px;color:#c9d8e4;">' +
      '<input type="checkbox" id="port-' + p.port + '"' + (p.checked ? ' checked' : '') + '>' +
      '<span style="color:#4a90d9;font-family:monospace;width:40px;">:' + p.port + '</span>' +
      '<span>' + p.name + '</span>' +
    '</label>';
  }).join('');

  window.nsShowResult('🔌 Інструменти: ' + ip,
    /* Порт-скан */
    '<div style="background:#080f17;border:1px solid #2a3b48;border-radius:8px;padding:14px;margin-bottom:12px;">' +
      '<div style="display:flex;align-items:center;margin-bottom:10px;">' +
        '<span style="color:#e6edf3;font-weight:600;font-size:13px;">🔍 Порт-скан</span>' +
        '<button onclick="window.nsSelectAllPorts(true)"  style="margin-left:auto;background:transparent;border:none;color:#4a90d9;cursor:pointer;font-size:11px;padding:2px 8px;">Всі</button>' +
        '<button onclick="window.nsSelectAllPorts(false)" style="background:transparent;border:none;color:#4a6070;cursor:pointer;font-size:11px;padding:2px 8px;">Жодного</button>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;max-height:180px;overflow-y:auto;margin-bottom:10px;">' +
        portList +
      '</div>' +
      '<div style="display:flex;gap:8px;">' +
        '<input id="custom-ports" type="text" placeholder="Додати порти: 8888,9090,..."' +
          ' style="flex:1;background:#060d14;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:7px 10px;font-size:13px;">' +
        '<button onclick="window.nsDoPortScan(\'' + ip + '\')"' +
          ' style="background:linear-gradient(135deg,#f0a840,#e07820);color:#000;border:none;border-radius:6px;padding:7px 18px;cursor:pointer;font-size:13px;font-weight:700;">🔍 Сканувати</button>' +
      '</div>' +
    '</div>' +
    /* Інструменти */
    '<div style="background:#080f17;border:1px solid #2a3b48;border-radius:8px;padding:14px;margin-bottom:12px;">' +
      '<div style="color:#e6edf3;font-weight:600;font-size:13px;margin-bottom:10px;">🛠 Інструменти</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
        '<button onclick="window.nsRunSSHCmd(\'/ip arp print where address=' + ip + '\',\'📋 ARP ' + ip + '\')"' +
          ' style="background:#1a2a3a;border:1px solid #2a3b48;color:#c9d8e4;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px;">📋 ARP</button>' +
        '<button onclick="window.nsRunSSHCmd(\'/resolve ' + ip + '\',\'🔗 DNS ' + ip + '\')"' +
          ' style="background:#1a2a3a;border:1px solid #2a3b48;color:#c9d8e4;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px;">🔗 DNS</button>' +
        '<button onclick="window.nsRunSSHCmd(\'/tool bandwidth-test address=' + ip + ' direction=both duration=5\',\'📊 Bandwidth ' + ip + '\')"' +
          ' style="background:#1a2a3a;border:1px solid #2a3b48;color:#c9d8e4;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px;">📊 Bandwidth</button>' +
        '<button onclick="window.nsRunSSHCmd(\'/ip dhcp-server lease print where address=' + ip + '\',\'📋 DHCP ' + ip + '\')"' +
          ' style="background:#1a2a3a;border:1px solid #2a3b48;color:#c9d8e4;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px;">📋 DHCP lease</button>' +
      '</div>' +
    '</div>' +
    /* Firewall */
    '<div style="background:#080f17;border:1px solid #2a3b48;border-radius:8px;padding:14px;">' +
      '<div style="color:#e6edf3;font-weight:600;font-size:13px;margin-bottom:10px;">🔥 Firewall</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
        '<button onclick="window.nsBlockIP(\'' + ip + '\')"' +
          ' style="background:#2a0808;border:1px solid #4a1a1a;color:#e05252;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:12px;">🚫 Заблокувати</button>' +
        '<button onclick="window.nsUnblockIP(\'' + ip + '\')"' +
          ' style="background:#0a2a0a;border:1px solid #1a4a1a;color:#5fd0a5;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:12px;">✅ Розблокувати</button>' +
        '<button onclick="window.nsRunSSHCmd(\'/ip firewall filter print where src-address=' + ip + '\',\'🔥 Rules ' + ip + '\')"' +
          ' style="background:#1a2a3a;border:1px solid #2a3b48;color:#c9d8e4;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:12px;">📋 Правила</button>' +
      '</div>' +
    '</div>'
  );
};

window.nsSelectAllPorts = function(val) {
  document.querySelectorAll('[id^="port-"]').forEach(function(inp){ inp.checked = val; });
};

window.nsDoPortScan = function(ip) {
  var selected = [];
  document.querySelectorAll('[id^="port-"]').forEach(function(inp) {
    if (inp.checked) selected.push(inp.id.replace('port-',''));
  });
  var custom = (document.getElementById('custom-ports')||{value:''}).value;
  if (custom) custom.split(',').forEach(function(p){ var t=p.trim(); if(t&&!isNaN(t)) selected.push(t); });
  if (!selected.length) { alert('Виберіть хоча б один порт!'); return; }

  var rows = selected.map(function(p) {
    return '<div id="ps-' + p + '" style="display:flex;gap:10px;padding:5px 0;border-bottom:1px solid #0a1a28;align-items:center;">' +
      '<span style="color:#4a90d9;font-family:monospace;width:50px;">:' + p + '</span>' +
      '<span style="color:#4a6070;font-size:12px;">⏳ scanning...</span>' +
    '</div>';
  }).join('');

  window.nsShowResult('🔌 Порт-скан: ' + ip + ' (' + selected.length + ' портів)',
    '<div id="ns-portscan-rows">' + rows + '</div>'
  );

  var i = 0;
  function scanNext() {
    if (i >= selected.length) return;
    var port = selected[i++];
    nsSSH('/tool fetch address=' + ip + ' port=' + port + ' mode=tcp dst-path=/null as-value')
      .then(function(d) {
        var row = document.getElementById('ps-' + port);
        if (!row) return;
        var out    = d.output || '';
        var isOpen = out.includes('status=finished') || out.includes('downloaded');
        row.innerHTML =
          '<span style="color:#4a90d9;font-family:monospace;width:50px;">:' + port + '</span>' +
          '<span style="color:' + (isOpen?'#5fd0a5':'#4a6070') + ';font-weight:' + (isOpen?'700':'400') + ';">' +
            (isOpen ? '● OPEN' : '○ closed') + '</span>';
        scanNext();
      }).catch(function() {
        var row = document.getElementById('ps-' + port);
        if (row) row.innerHTML =
          '<span style="color:#4a90d9;font-family:monospace;width:50px;">:' + port + '</span>' +
          '<span style="color:#e05252;">✗ error</span>';
        scanNext();
      });
  }
  scanNext(); scanNext(); scanNext();
};

window.nsBlockIP = function(ip) {
  if (!confirm('Заблокувати ' + ip + '?')) return;
  window.nsRunSSHCmd('/ip firewall filter add chain=forward src-address=' + ip + ' action=drop comment="Blocked"', '🚫 Block ' + ip);
};

window.nsUnblockIP = function(ip) {
  window.nsRunSSHCmd('/ip firewall filter remove [find where src-address=' + ip + ' comment="Blocked"]', '✅ Unblock ' + ip);
};

window.nsAddToRouter = function(ip, mac, name) {
  try {
    var routers = JSON.parse(localStorage.getItem('rm-routers') || '[]');
    routers.push({id:'rt-'+Date.now(), ip:ip, port:80, user:'admin', pass:'',
                  sshPort:22, name:name||ip, mac:mac, type:'mikrotik', connected:false});
    localStorage.setItem('rm-routers', JSON.stringify(routers));
    if (window.__rmSaveRouters) window.__rmSaveRouters();
    if (window.__rmRenderTabs)  window.__rmRenderTabs();
    alert('✅ ' + ip + ' додано! Введіть пароль і підключіться.');
  } catch(e) { alert('Помилка: ' + e); }
};

window.nsExportCSV = function() {
  var devices = window.__nsDevices || [];
  if (!devices.length) { alert('Немає даних!'); return; }
  var rows = [['IP','MAC','Vendor','Hostname','Interface','Type','Signal','Online']];
  devices.forEach(function(d) {
    rows.push([d.ip||'',d.mac||'',d.vendor||'',d.hostname||d.platform||'',
               d.iface||'',d.type||'',d.signal||'',
               d.online===true?'Online':d.online===false?'Offline':'Unknown']);
  });
  var csv = rows.map(function(r){ return r.map(function(c){ return '"'+String(c).replace(/"/g,'""')+'"'; }).join(','); }).join('\n');
  var a = document.createElement('a');
  a.href     = URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}));
  a.download = 'network-scan-' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
};

console.log('[NetworkScanner v2.0] завантажено ✅');
