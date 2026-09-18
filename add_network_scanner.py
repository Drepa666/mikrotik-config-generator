# -*- coding: utf-8 -*-
import subprocess

with open('router-manager.js', 'r', encoding='utf-8') as f:
    content = f.read()

# ── 1. Додаємо обробник в renderContent ──
old_neighbors = "if (menu === 'neighbors')"
if old_neighbors not in content:
    # Знаходимо останній if (menu === ...) і додаємо після
    old_romon = "if (menu === 'romon')"
    idx = content.find(old_romon)
    if idx > 0:
        end_line = content.find('\n', idx) + 1
        content = content[:end_line] + \
            "    if (menu === 'net-scanner') { renderNetworkScanner(); return; }\n" + \
            content[end_line:]
        print('OK: net-scanner handler додано після romon ✅')
    else:
        # Додаємо перед останнім renderTable
        old_tail = "if (menu === 'neighbors')"
        idx2 = content.rfind("{ renderTable(")
        line_start = content.rfind('\n', 0, idx2) + 1
        content = content[:line_start] + \
            "    if (menu === 'net-scanner') { renderNetworkScanner(); return; }\n" + \
            content[line_start:]
        print('OK: net-scanner handler додано ✅')
else:
    # Вже є neighbors — додаємо після нього
    idx = content.find(old_neighbors)
    end_line = content.find('\n', idx) + 1
    content = content[:end_line] + \
        "    if (menu === 'net-scanner') { renderNetworkScanner(); return; }\n" + \
        content[end_line:]
    print('OK: net-scanner handler додано після neighbors ✅')

# ── 2. Додаємо функцію renderNetworkScanner ──
SCANNER_FN = r"""
/* ══════════════════════════════════════════════════════
   NETWORK SCANNER — сканування мережі
   ══════════════════════════════════════════════════════ */
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
          '<div style="font-size:12px;color:#8ea3b0;">ARP · DHCP · Neighbors · WiFi клієнти</div>' +
        '</div>' +
        '<button id="ns-scan-btn" onclick="startNetScan()" ' +
          'style="margin-left:auto;background:linear-gradient(135deg,#5fd0a5,#4ab890);' +
          'color:#082018;border:none;border-radius:8px;padding:10px 24px;' +
          'font-size:14px;font-weight:700;cursor:pointer;">▶ Сканувати</button>' +
      '</div>' +

      /* Фільтр і пошук */
      '<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">' +
        '<input id="ns-search" type="text" placeholder="🔍 Пошук по IP, MAC, hostname..." ' +
          'oninput="nsFilter()" ' +
          'style="flex:1;min-width:200px;background:#060d14;border:1px solid #2a3b48;' +
          'border-radius:8px;color:#e6edf3;padding:8px 14px;font-size:13px;">' +
        '<select id="ns-type-filter" onchange="nsFilter()" ' +
          'style="background:#060d14;border:1px solid #2a3b48;border-radius:8px;' +
          'color:#e6edf3;padding:8px 14px;font-size:13px;">' +
          '<option value="">Всі типи</option>' +
          '<option value="arp">ARP</option>' +
          '<option value="dhcp">DHCP</option>' +
          '<option value="neighbor">Neighbor</option>' +
          '<option value="wifi">WiFi</option>' +
        '</select>' +
        '<select id="ns-iface-filter" onchange="nsFilter()" ' +
          'style="background:#060d14;border:1px solid #2a3b48;border-radius:8px;' +
          'color:#e6edf3;padding:8px 14px;font-size:13px;">' +
          '<option value="">Всі інтерфейси</option>' +
        '</select>' +
      '</div>' +

      /* Статистика */
      '<div id="ns-stats" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;"></div>' +

      /* Таблиця */
      '<div id="ns-table-wrap" style="background:#060d14;border:1px solid #2a3b48;' +
        'border-radius:10px;overflow:hidden;">' +
        '<div style="padding:40px;text-align:center;color:#4a6070;">' +
          '🔍 Натисни «Сканувати» щоб знайти всі пристрої в мережі' +
        '</div>' +
      '</div>' +

      /* Карта пристроїв */
      '<div id="ns-map" style="margin-top:16px;"></div>' +
    '</div>';

  /* Запускаємо автоматично */
  setTimeout(startNetScan, 300);
}

/* ── Сканування ── */
window.__nsDevices = [];

function startNetScan() {
  var btn = document.getElementById('ns-scan-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Сканую...'; }

  var wrap = document.getElementById('ns-table-wrap');
  if (wrap) wrap.innerHTML = '<div style="padding:20px;text-align:center;color:#4a6070;">⏳ Завантаження даних...</div>';

  var router = getActive();
  if (!router) return;

  var h = {
    'x-router-ip':   router.ip,
    'x-router-port': String(router.port || 80),
    'x-router-user': router.user || 'admin',
    'x-router-pass': router.pass || '',
  };

  /* Паралельно запитуємо всі джерела */
  Promise.allSettled([
    restCall(router, 'GET', '/ip/arp').catch(function(){ return []; }),
    restCall(router, 'GET', '/ip/dhcp-server/lease').catch(function(){ return []; }),
    restCall(router, 'GET', '/ip/neighbor').catch(function(){ return []; }),
    restCall(router, 'GET', '/interface/wireless/registration-table').catch(function(){ return []; }),
  ]).then(function(results) {
    var arpList      = (results[0].value || []);
    var dhcpList     = (results[1].value || []);
    var neighborList = (results[2].value || []);
    var wifiList     = (results[3].value || []);

    /* Зводимо в єдину таблицю */
    var devices = {};

    /* ARP */
    arpList.forEach(function(e) {
      var mac = (e['mac-address']||'').toUpperCase();
      var ip  = e['address'] || '';
      if (!ip || ip === '0.0.0.0') return;
      var key = mac || ip;
      if (!devices[key]) devices[key] = { ip:ip, mac:mac, hostname:'', iface:e['interface']||'', type:'arp', vendor:'', comment:'' };
      devices[key].iface = devices[key].iface || e['interface'] || '';
    });

    /* DHCP — додаємо hostname */
    dhcpList.forEach(function(e) {
      var mac = (e['mac-address']||'').toUpperCase();
      var ip  = e['address'] || '';
      var key = mac || ip;
      if (!devices[key]) devices[key] = { ip:ip, mac:mac, hostname:'', iface:'', type:'dhcp', vendor:'', comment:'' };
      devices[key].hostname = e['host-name'] || devices[key].hostname || '';
      devices[key].dhcpStatus = e['status'] || '';
      devices[key].expires    = e['expires-after'] || '';
      if (devices[key].type === 'arp') devices[key].type = 'arp+dhcp';
      else devices[key].type = 'dhcp';
    });

    /* Neighbors (LLDP/CDP/MNDP) */
    neighborList.forEach(function(e) {
      var mac = (e['mac-address']||e['address4']||'').toUpperCase();
      var ip  = e['address4'] || e['address6'] || '';
      var key = mac || ip;
      if (!devices[key]) devices[key] = { ip:ip, mac:mac, hostname:'', iface:'', type:'neighbor', vendor:'', comment:'' };
      devices[key].hostname   = e['identity'] || devices[key].hostname || '';
      devices[key].platform   = e['platform'] || e['system-description'] || '';
      devices[key].neighborIface = e['interface'] || '';
      devices[key].type = 'neighbor';
    });

    /* WiFi */
    wifiList.forEach(function(e) {
      var mac = (e['mac-address']||'').toUpperCase();
      var key = mac;
      if (!devices[key]) devices[key] = { ip:'', mac:mac, hostname:'', iface:e['interface']||'', type:'wifi', vendor:'', comment:'' };
      devices[key].signal  = e['signal-strength'] || '';
      devices[key].txRate  = e['tx-rate'] || '';
      devices[key].rxRate  = e['rx-rate'] || '';
      devices[key].uptime  = e['uptime'] || '';
      if (devices[key].type !== 'wifi') devices[key].type += '+wifi';
      else devices[key].type = 'wifi';
    });

    /* Визначаємо vendor по OUI */
    var OUI = {
      '00:0C:42':'MikroTik','D4:CA:6D':'MikroTik','B8:69:F4':'MikroTik',
      '4C:5E:0C':'MikroTik','CC:2D:E0':'MikroTik','2C:C8:1B':'MikroTik',
      'DC:2C:6E':'MikroTik','E4:8D:8C':'MikroTik','74:4D:28':'MikroTik',
      '00:50:56':'VMware','00:0C:29':'VMware','00:1A:11':'Google',
      'B8:27:EB':'Raspberry Pi','DC:A6:32':'Raspberry Pi',
      'F4:F5:D8':'Google Home','00:17:88':'Philips Hue',
      'AC:84:C6':'Xiaomi','50:64:2B':'Xiaomi','28:6C:07':'Xiaomi',
      '00:1B:17':'Panasonic','00:E0:4C':'Realtek',
      'FC:EC:DA':'Ubiquiti','00:15:6D':'Ubiquiti','44:D9:E7':'Ubiquiti',
      '00:09:5B':'Netgear','A0:40:A0':'Samsung','8C:79:F0':'Samsung',
      '00:25:00':'Apple','78:CA:39':'Apple','F0:18:98':'Apple',
      'B4:E6:2D':'Apple','3C:07:54':'Apple','58:55:CA':'Apple',
    };

    Object.values(devices).forEach(function(d) {
      if (!d.mac) return;
      var oui = d.mac.substring(0,8);
      d.vendor = OUI[oui] || '';
    });

    var arr = Object.values(devices);
    window.__nsDevices = arr;

    /* Наповнюємо фільтр інтерфейсів */
    var ifaces = [...new Set(arr.map(function(d){ return d.iface; }).filter(Boolean))];
    var ifSel = document.getElementById('ns-iface-filter');
    if (ifSel) {
      ifaces.forEach(function(i) {
        var opt = document.createElement('option');
        opt.value = i; opt.textContent = i;
        ifSel.appendChild(opt);
      });
    }

    nsRender(arr);

    if (btn) { btn.disabled = false; btn.textContent = '🔄 Оновити'; }
  });
}

function nsFilter() {
  var q    = (document.getElementById('ns-search')||{value:''}).value.toLowerCase();
  var type = (document.getElementById('ns-type-filter')||{value:''}).value;
  var iface= (document.getElementById('ns-iface-filter')||{value:''}).value;

  var filtered = window.__nsDevices.filter(function(d) {
    if (q && !( (d.ip||'').includes(q) || (d.mac||'').toLowerCase().includes(q) ||
                (d.hostname||'').toLowerCase().includes(q) || (d.vendor||'').toLowerCase().includes(q) ))
      return false;
    if (type && !d.type.includes(type)) return false;
    if (iface && d.iface !== iface) return false;
    return true;
  });
  nsRender(filtered);
}

function nsRender(devices) {
  /* Статистика */
  var stats = document.getElementById('ns-stats');
  if (stats) {
    var total    = devices.length;
    var arp      = devices.filter(function(d){ return d.type.includes('arp'); }).length;
    var dhcp     = devices.filter(function(d){ return d.type.includes('dhcp'); }).length;
    var neighbor = devices.filter(function(d){ return d.type.includes('neighbor'); }).length;
    var wifi     = devices.filter(function(d){ return d.type.includes('wifi'); }).length;
    stats.innerHTML =
      nsStat('📡 Всього', total,    '#4a90d9') +
      nsStat('🔗 ARP',   arp,      '#5fd0a5') +
      nsStat('📋 DHCP',  dhcp,     '#f0a840') +
      nsStat('🏘 Сусіди',neighbor, '#c084fc') +
      nsStat('📶 WiFi',  wifi,     '#60a5fa');
  }

  /* Таблиця */
  var wrap = document.getElementById('ns-table-wrap');
  if (!wrap) return;

  if (!devices.length) {
    wrap.innerHTML = '<div style="padding:40px;text-align:center;color:#4a6070;">Пристроїв не знайдено</div>';
    return;
  }

  var rows = devices.map(function(d, idx) {
    var typeBadge = nsTypeBadge(d.type);
    var signal    = d.signal ? ('<span style="color:' + nsSignalColor(d.signal) + ';">' + d.signal + ' dBm</span>') : '—';
    var vendor    = d.vendor ? ('<span style="color:#8ea3b0;font-size:11px;">' + esc(d.vendor) + '</span>') : '';
    return '<tr style="border-bottom:1px solid #1a2a38;transition:background .15s;" ' +
           'onmouseover="this.style.background=\'#0d1f2d\'" onmouseout="this.style.background=\'\'">' +
      '<td style="padding:10px 12px;font-weight:600;color:#4a90d9;font-family:monospace;">' + esc(d.ip||'—') + '</td>' +
      '<td style="padding:10px 12px;font-family:monospace;font-size:12px;color:#8ea3b0;">' + esc(d.mac||'—') + '<br>' + vendor + '</td>' +
      '<td style="padding:10px 12px;color:#e6edf3;">' + esc(d.hostname || d.platform || '—') + '</td>' +
      '<td style="padding:10px 12px;color:#8ea3b0;font-size:12px;">' + esc(d.iface||'—') + '</td>' +
      '<td style="padding:10px 12px;">' + typeBadge + '</td>' +
      '<td style="padding:10px 12px;font-size:12px;">' + signal + '</td>' +
      '<td style="padding:10px 12px;">' +
        '<div style="display:flex;gap:6px;">' +
          '<button onclick="nsPing(\'' + esc(d.ip) + '\')" title="Ping" ' +
            'style="background:#1a2a3a;border:1px solid #2a3b48;color:#5fd0a5;border-radius:4px;padding:3px 8px;cursor:pointer;font-size:11px;">🏓 Ping</button>' +
          (d.ip ? '<button onclick="nsAddToRouter(\'' + esc(d.ip) + '\',\'' + esc(d.mac) + '\',\'' + esc(d.hostname) + '\')" title="Додати роутер" ' +
            'style="background:#1a2a3a;border:1px solid #2a3b48;color:#4a90d9;border-radius:4px;padding:3px 8px;cursor:pointer;font-size:11px;">➕ Router</button>' : '') +
        '</div>' +
      '</td>' +
    '</tr>';
  }).join('');

  wrap.innerHTML =
    '<table style="width:100%;border-collapse:collapse;">' +
      '<thead>' +
        '<tr style="background:#080f17;border-bottom:2px solid #2a3b48;">' +
          '<th style="padding:10px 12px;text-align:left;color:#4a6070;font-size:12px;font-weight:600;">IP Адреса</th>' +
          '<th style="padding:10px 12px;text-align:left;color:#4a6070;font-size:12px;font-weight:600;">MAC / Vendor</th>' +
          '<th style="padding:10px 12px;text-align:left;color:#4a6070;font-size:12px;font-weight:600;">Hostname / Identity</th>' +
          '<th style="padding:10px 12px;text-align:left;color:#4a6070;font-size:12px;font-weight:600;">Інтерфейс</th>' +
          '<th style="padding:10px 12px;text-align:left;color:#4a6070;font-size:12px;font-weight:600;">Тип</th>' +
          '<th style="padding:10px 12px;text-align:left;color:#4a6070;font-size:12px;font-weight:600;">Signal</th>' +
          '<th style="padding:10px 12px;text-align:left;color:#4a6070;font-size:12px;font-weight:600;">Дії</th>' +
        '</tr>' +
      '</thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table>';
}

function nsStat(label, val, color) {
  return '<div style="background:#080f17;border:1px solid #2a3b48;border-radius:8px;padding:10px 16px;text-align:center;">' +
    '<div style="font-size:20px;font-weight:700;color:' + color + ';">' + val + '</div>' +
    '<div style="font-size:11px;color:#4a6070;">' + label + '</div>' +
  '</div>';
}

function nsTypeBadge(type) {
  var colors = {
    'arp':      '#0a2a1a:#5fd0a5',
    'dhcp':     '#1a1a0a:#f0a840',
    'neighbor': '#1a0a2a:#c084fc',
    'wifi':     '#0a1a2a:#60a5fa',
    'arp+dhcp': '#0a2a1a:#5fd0a5',
  };
  var c = colors[type] || '#1a2a3a:#8ea3b0';
  var parts = c.split(':');
  return '<span style="background:' + parts[0] + ';color:' + parts[1] + ';' +
    'padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">' + type + '</span>';
}

function nsSignalColor(sig) {
  var n = parseInt(sig);
  if (n >= -60) return '#5fd0a5';
  if (n >= -75) return '#f0a840';
  return '#e05252';
}

function nsPing(ip) {
  if (!ip) return;
  var router = getActive();
  if (!router) return;
  /* Ping через SSH */
  fetch('http://localhost:8888/ssh/exec', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      host: router.ip, port: router.sshPort || 22,
      username: router.user, password: router.pass,
      command: '/ping ' + ip + ' count=4'
    })
  }).then(function(r){ return r.json(); }).then(function(d) {
    alert('Ping ' + ip + ':\n' + (d.output || d.error || 'Немає відповіді'));
  }).catch(function(e){ alert('Помилка: ' + e); });
}

function nsAddToRouter(ip, mac, name) {
  /* Додаємо як новий роутер в менеджер */
  var id = 'rt-' + Date.now();
  var newRouter = {
    id: id, ip: ip, port: 80, user: 'admin', pass: '',
    sshPort: 22, name: name || ip, mac: mac, type: 'mikrotik', connected: false
  };
  state.routers.push(newRouter);
  saveRouters();
  renderTabs();
  alert('✅ ' + ip + ' додано в Router Manager!\nВведіть пароль і підключіться.');
}
/* ══════════════════════════ END NETWORK SCANNER ══════════════════════════ */
"""

# Вставляємо перед кінцем файлу
content = content.rstrip() + '\n' + SCANNER_FN

with open('router-manager.js', 'w', encoding='utf-8') as f:
    f.write(content)

r = subprocess.run(['node', '--check', 'router-manager.js'],
                   capture_output=True, text=True)
print('Синтаксис:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:300])