'use strict';
(function() {

/* ════════════════════════════════════════
   NETWORK TOOLS v1
   - Сканування підмережі
   - Wake-on-LAN
   - Іменування за MAC
   - Ping монітор
════════════════════════════════════════ */

var PROXY      = 'http://localhost:8888';
var NAMES_KEY  = 'mt-mac-names';
var PING_KEY   = 'mt-ping-hosts';

/* ── Зберігання ── */
function loadNames() { try { return JSON.parse(localStorage.getItem(NAMES_KEY)||'{}'); } catch(e) { return {}; } }
function saveNames(n) { try { localStorage.setItem(NAMES_KEY, JSON.stringify(n)); } catch(e) {} }
function loadPingHosts() { try { return JSON.parse(localStorage.getItem(PING_KEY)||'[]'); } catch(e) { return []; } }
function savePingHosts(h) { try { localStorage.setItem(PING_KEY, JSON.stringify(h)); } catch(e) {} }

/* ════════════════════════════════════════
   МОДАЛЬНЕ ВІКНО
════════════════════════════════════════ */
var modal = document.createElement('div');
modal.id  = 'nettools-modal';
modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.92);' +
  'z-index:9998;overflow-y:auto;padding:20px;';

var box = document.createElement('div');
box.style.cssText = 'max-width:1000px;margin:auto;background:#16212c;' +
  'border:1px solid #2a3b48;border-radius:12px;padding:24px;';

box.innerHTML =
  /* Шапка */
  '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
  '<div><h3 style="margin:0;color:#5fd0a5;font-size:16px;">\uD83D\uDD27 Мережеві інструменти</h3>' +
  '<div style="font-size:11px;color:#4a6070;">Сканування · Wake-on-LAN · Ping монітор · Іменування MAC</div></div>' +
  '<button id="nt-close" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;' +
  'padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;">\u2715 Закрити</button>' +
  '</div>' +

  /* Підключення */
  '<div style="display:flex;gap:8px;align-items:center;margin-bottom:16px;flex-wrap:wrap;' +
  'background:#0d1a24;border:1px solid #1c2a37;border-radius:8px;padding:12px;">' +
  '<span style="font-size:11px;color:#4a6070;">Роутер:</span>' +
  '<input id="nt-ip"   type="text"     value="192.168.88.1" placeholder="IP роутера" ' +
  'style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:5px 8px;border-radius:5px;font-size:11px;width:130px;">' +
  '<input id="nt-user" type="text"     value="admin"        placeholder="логін" ' +
  'style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:5px 8px;border-radius:5px;font-size:11px;width:80px;">' +
  '<input id="nt-pass" type="password"                      placeholder="пароль" ' +
  'style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:5px 8px;border-radius:5px;font-size:11px;width:100px;">' +
  '<span id="nt-conn-status" style="font-size:11px;color:#4a6070;"></span>' +
  '</div>' +

  /* Таби */
  '<div style="display:flex;gap:4px;margin-bottom:16px;border-bottom:1px solid #1c2a37;padding-bottom:0;">' +
  '<button class="nt-tab active" data-tab="scan"  style="background:#5fd0a533;border:1px solid #5fd0a5;border-bottom:none;' +
  'color:#5fd0a5;padding:7px 16px;border-radius:6px 6px 0 0;cursor:pointer;font-size:12px;">\uD83D\uDD0D Сканування</button>' +
  '<button class="nt-tab" data-tab="wol" style="background:transparent;border:1px solid transparent;' +
  'color:#8ea3b0;padding:7px 16px;border-radius:6px 6px 0 0;cursor:pointer;font-size:12px;">\uD83D\uDCE1 Wake-on-LAN</button>' +
  '<button class="nt-tab" data-tab="ping" style="background:transparent;border:1px solid transparent;' +
  'color:#8ea3b0;padding:7px 16px;border-radius:6px 6px 0 0;cursor:pointer;font-size:12px;">\u26A1 Ping монітор</button>' +
  '<button class="nt-tab" data-tab="names" style="background:transparent;border:1px solid transparent;' +
  'color:#8ea3b0;padding:7px 16px;border-radius:6px 6px 0 0;cursor:pointer;font-size:12px;">\uD83C\uDFF7\uFE0F MAC імена</button>' +
  '</div>' +

  /* Контент табів */
  '<div id="nt-content"></div>';

modal.appendChild(box);
document.body.appendChild(modal);

/* ════════════════════════════════════════
   ДОПОМІЖНІ
════════════════════════════════════════ */
function getHeaders() {
  var ipEl   = document.getElementById('nt-ip');
  var userEl = document.getElementById('nt-user');
  var passEl = document.getElementById('nt-pass');

  /* Відновлюємо з localStorage якщо поля порожні */
  var ip   = (ipEl   && ipEl.value.trim())   || localStorage.getItem('nt-ip')   || '192.168.88.1';
  var user = (userEl && userEl.value.trim()) || localStorage.getItem('nt-user') || 'admin';
  var pass = (passEl && passEl.value)        || localStorage.getItem('nt-pass') || '';

  /* Зберігаємо */
  if (ip)   localStorage.setItem('nt-ip',   ip);
  if (user) localStorage.setItem('nt-user', user);
  if (pass) localStorage.setItem('nt-pass', pass);

  /* Заповнюємо поля якщо порожні */
  if (ipEl   && !ipEl.value)   ipEl.value   = ip;
  if (userEl && !userEl.value) userEl.value = user;
  if (passEl && !passEl.value) passEl.value = pass;

  console.log('[nt] getHeaders ip=' + ip + ' user=' + user + ' pass_len=' + pass.length);
  /* Зберігаємо credentials в localStorage */
  var ipEl   = document.getElementById('nt-ip');
  var userEl = document.getElementById('nt-user');
  var passEl = document.getElementById('nt-pass');
  if (ipEl && ipEl.value)   localStorage.setItem('nt-ip',   ipEl.value);
  if (userEl && userEl.value) localStorage.setItem('nt-user', userEl.value);
  if (passEl && passEl.value) localStorage.setItem('nt-pass', passEl.value);
  /* Відновлюємо збережені credentials */
  (function() {
    var fields = {
      'nt-ip':   '192.168.88.1',
      'nt-user': 'admin',
      'nt-pass': ''
    };
    Object.keys(fields).forEach(function(id) {
      var el = document.getElementById(id);
      if (!el) return;
      var saved = localStorage.getItem(id);
      if (saved !== null) el.value = saved;
      else if (fields[id]) el.value = fields[id];
      el.addEventListener('input', function() {
        localStorage.setItem(id, el.value);
      });
    });
  })();
  /* Відновлюємо збережені credentials */
  (function() {
    var fields = {
      'nt-ip':   '192.168.88.1',
      'nt-user': 'admin',
      'nt-pass': ''
    };
    Object.keys(fields).forEach(function(id) {
      var el = document.getElementById(id);
      if (!el) return;
      var saved = localStorage.getItem(id);
      if (saved !== null) el.value = saved;
      else if (fields[id]) el.value = fields[id];
      el.addEventListener('input', function() {
        localStorage.setItem(id, el.value);
      });
    });
  })();
  var ip   = document.getElementById('nt-ip').value.trim();
  var user = document.getElementById('nt-user').value.trim();
  var pass = document.getElementById('nt-pass').value;
  return {
    'Content-Type':   'application/json',
    'Authorization':  'Basic ' + btoa(user + ':' + pass),
    'X-Router-Host':  ip,
    'X-Router-Port':  '80',
    'X-Router-Proto': 'http',
  };
}

function apiGet(path) {
  return fetch(PROXY + '/rest' + path, { method: 'GET', headers: getHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(d) { return Array.isArray(d) ? d : (d ? [d] : []); });
}

function getIP() { return document.getElementById('nt-ip').value.trim(); }

/* ════════════════════════════════════════
   ТАБ 1 — СКАНУВАННЯ ПІДМЕРЕЖІ
════════════════════════════════════════ */
function renderScan() {
  var content = document.getElementById('nt-content');
  content.innerHTML =
    '<div style="display:flex;gap:8px;align-items:center;margin-bottom:14px;flex-wrap:wrap;">' +
    '<input id="scan-subnet" type="text" value="192.168.88.0/24" placeholder="підмережа/маска" ' +
    'style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:6px 10px;border-radius:6px;font-size:12px;width:160px;">' +
    '<button id="scan-btn" style="background:#5fd0a5;color:#082018;border:none;' +
    'padding:7px 18px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">\uD83D\uDD0D Сканувати</button>' +
    '<button id="scan-arp-btn" style="background:transparent;border:1px solid #5b9bd5;color:#5b9bd5;' +
    'padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;">\uD83D\uDCCB ARP таблиця</button>' +
    '<button id="scan-dhcp-btn" style="background:transparent;border:1px solid #9b87f5;color:#9b87f5;' +
    'padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;">\uD83D\uDCCB DHCP клієнти</button>' +
    '<span id="scan-status" style="font-size:11px;color:#4a6070;"></span>' +
    '</div>' +

    /* Фільтр */
    '<div style="display:flex;gap:8px;margin-bottom:10px;">' +
    '<input id="scan-filter" type="text" placeholder="\uD83D\uDD0D Фільтр по IP, MAC, імені..." ' +
    'style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:5px 10px;' +
    'border-radius:5px;font-size:11px;flex:1;">' +
    '<select id="scan-sort" style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;' +
    'padding:5px 8px;border-radius:5px;font-size:11px;">' +
    '<option value="ip">Сортувати: IP</option>' +
    '<option value="name">Сортувати: Ім\'я</option>' +
    '<option value="mac">Сортувати: MAC</option>' +
    '</select>' +
    '<span id="scan-count" style="font-size:11px;color:#4a6070;line-height:30px;"></span>' +
    '</div>' +

    /* Таблиця */
    '<div style="background:#0d1a24;border:1px solid #1c2a37;border-radius:8px;overflow:hidden;">' +
    '<div style="display:grid;grid-template-columns:30px 1fr 140px 120px 80px 120px;gap:0;' +
    'background:#060d14;padding:8px 12px;font-size:10px;color:#4a6070;font-weight:700;">' +
    '<span></span><span>IP адреса</span><span>MAC адреса</span>' +
    '<span>Ім\'я/hostname</span><span>Статус</span><span>Дії</span>' +
    '</div>' +
    '<div id="scan-results" style="max-height:400px;overflow-y:auto;"></div>' +
    '</div>';

  /* Беремо з глобального кешу якщо є */
  var scanData = window._ntScanCache || [];

  function renderResults(data) {
    scanData = data;
    window._ntScanCache = data; /* зберігаємо кеш */
    var filter = (document.getElementById('scan-filter')||{}).value || '';
    var sort   = (document.getElementById('scan-sort')||{}).value || 'ip';
    var names  = loadNames();

    var filtered = data.filter(function(d) {
      var q = filter.toLowerCase();
      return !q ||
        (d.ip  && d.ip.toLowerCase().includes(q)) ||
        (d.mac && d.mac.toLowerCase().includes(q)) ||
        (d.name && d.name.toLowerCase().includes(q)) ||
        (names[d.mac] && names[d.mac].toLowerCase().includes(q));
    });

    filtered.sort(function(a, b) {
      if (sort === 'ip') {
        var aP = (a.ip||'').split('.').map(Number);
        var bP = (b.ip||'').split('.').map(Number);
        for (var i = 0; i < 4; i++) if (aP[i] !== bP[i]) return aP[i] - bP[i];
        return 0;
      }
      if (sort === 'mac')  return (a.mac||'').localeCompare(b.mac||'');
      if (sort === 'name') return (a.name||'').localeCompare(b.name||'');
      return 0;
    });

    var el = document.getElementById('scan-results');
    var countEl = document.getElementById('scan-count');
    if (countEl) countEl.textContent = filtered.length + ' пристроїв';
    if (!el) return;

    if (!filtered.length) {
      el.innerHTML = '<div style="color:#4a6070;text-align:center;padding:20px;font-size:12px;">Немає пристроїв</div>';
      return;
    }

    el.innerHTML = filtered.map(function(d, idx) {
      var customName = names[d.mac] || '';
      var displayName = customName || d.name || '';
      var online = d.status !== 'inactive' && d.status !== false;

      return '<div style="display:grid;grid-template-columns:30px 1fr 140px 120px 80px 120px;' +
        'align-items:center;padding:8px 12px;border-bottom:1px solid #1c2a37;' +
        (idx % 2 === 0 ? 'background:#0a1520;' : '') + '">' +

        /* Індикатор */
        '<div style="width:8px;height:8px;border-radius:50%;background:' +
        (online ? '#5fd0a5' : '#e0665a') + ';"></div>' +

        /* IP */
        '<div style="font-size:12px;font-family:monospace;color:#e6edf3;">' + (d.ip||'—') + '</div>' +

        /* MAC */
        '<div style="font-size:11px;font-family:monospace;color:#8ea3b0;">' + (d.mac||'—') + '</div>' +

        /* Ім'я */
        '<div style="font-size:11px;color:' + (customName ? '#e6b35a' : '#c9e8d8') + ';">' +
        (displayName || '<span style="color:#4a6070;">невідомий</span>') + '</div>' +

        /* Статус */
        '<div style="font-size:10px;color:' + (online ? '#5fd0a5' : '#e0665a') + ';">' +
        (online ? '\u2705 Online' : '\u274C Offline') + '</div>' +

        /* Дії */
        '<div style="display:flex;gap:4px;">' +
        '<button data-wol="' + (d.mac||'') + '" title="Wake-on-LAN" style="background:transparent;' +
        'border:1px solid #e6b35a44;color:#e6b35a;padding:2px 6px;border-radius:3px;cursor:pointer;font-size:10px;">\uD83D\uDCE1</button>' +
        '<button data-name-ip="' + (d.ip||'') + '" data-name-mac="' + (d.mac||'') + '" ' +
        'title="Назвати пристрій" style="background:transparent;' +
        'border:1px solid #5b9bd544;color:#5b9bd5;padding:2px 6px;border-radius:3px;cursor:pointer;font-size:10px;">\uD83C\uDFF7\uFE0F</button>' +
        '<button data-ping-ip="' + (d.ip||'') + '" title="Ping" style="background:transparent;' +
        'border:1px solid #5fd0a544;color:#5fd0a5;padding:2px 6px;border-radius:3px;cursor:pointer;font-size:10px;">\uD83C\uDFD3</button>' +
        '</div>' +
        '</div>';
    }).join('');

    /* Обробники дій */
    el.querySelectorAll('[data-wol]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var mac = this.getAttribute('data-wol');
        if (mac) sendWoL(mac);
      });
    });

    el.querySelectorAll('[data-name-mac]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var mac = this.getAttribute('data-name-mac');
        var ip  = this.getAttribute('data-name-ip');
        var names = loadNames();
        var current = names[mac] || '';
        var name = prompt('Назва для ' + ip + ' (' + mac + '):', current);
        if (name !== null) {
          names[mac] = name;
          saveNames(names);
          renderResults(scanData);
        }
      });
    });

    el.querySelectorAll('[data-ping-ip]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var ip = this.getAttribute('data-ping-ip');
        addPingHost(ip);
        switchTab('ping');
      });
    });
  }

  /* Сканування через IP Scan */
  document.getElementById('scan-btn').addEventListener('click', function() {
    var btn = this;
    btn.textContent = '\u23F3 Сканую...';
    btn.disabled = true;
    document.getElementById('scan-status').textContent = '\uD83D\uDD04 Сканування підмережі...';

    var hdrs = getHeaders();
    /* Використовуємо ARP + DHCP + neighbor */
    Promise.all([
      fetch(PROXY + '/rest/ip/arp', { method:'GET', headers:hdrs }).then(function(r){return r.json();}).catch(function(){return [];}),
      fetch(PROXY + '/rest/ip/dhcp-server/lease', { method:'GET', headers:hdrs }).then(function(r){return r.json();}).catch(function(){return [];}),
      fetch(PROXY + '/rest/ip/neighbor', { method:'GET', headers:hdrs }).then(function(r){return r.json();}).catch(function(){return [];}),
    ]).then(function(results) {
      var arps     = Array.isArray(results[0]) ? results[0] : (results[0] ? [results[0]] : []);
      var leases   = Array.isArray(results[1]) ? results[1] : (results[1] ? [results[1]] : []);
      var neighbors= Array.isArray(results[2]) ? results[2] : (results[2] ? [results[2]] : []);
      var names    = loadNames();
      var devMap   = {};

      /* ARP */
      arps.forEach(function(a) {
        if (!a.address) return;
        devMap[a.address] = {
          ip:     a.address,
          mac:    a['mac-address'] || '',
          name:   names[a['mac-address']] || '',
          status: a.complete === 'true' || a.complete === true ? 'online' : 'inactive',
          source: 'arp',
        };
      });

      /* DHCP leases */
      leases.forEach(function(l) {
        if (!l.address) return;
        var existing = devMap[l.address] || {};
        devMap[l.address] = {
          ip:     l.address,
          mac:    l['mac-address'] || existing.mac || '',
          name:   names[l['mac-address']] || l['host-name'] || existing.name || '',
          status: l.status === 'bound' ? 'online' : (existing.status || 'inactive'),
          source: 'dhcp',
        };
      });

      /* Neighbors */
      neighbors.forEach(function(n) {
        if (!n.address) return;
        if (!devMap[n.address]) {
          devMap[n.address] = {
            ip:     n.address,
            mac:    n['mac-address'] || '',
            name:   n.identity || n['system-description'] || '',
            status: 'online',
            source: 'neighbor',
          };
        }
      });

      var devices = Object.values(devMap);
      renderResults(devices);
      btn.textContent = '\uD83D\uDD0D Сканувати';
      btn.disabled    = false;
      document.getElementById('scan-status').textContent = '\u2705 Знайдено: ' + devices.length + ' пристроїв';
    }).catch(function(e) {
      btn.textContent = '\uD83D\uDD0D Сканувати';
      btn.disabled    = false;
      document.getElementById('scan-status').textContent = '\u274C ' + e.message;
    });
  });

  /* ARP таблиця */
  document.getElementById('scan-arp-btn').addEventListener('click', function() {
    document.getElementById('scan-status').textContent = '\uD83D\uDD04 Завантажую ARP...';
    apiGet('/ip/arp').then(function(data) {
      var names = loadNames();
      var devices = data.map(function(a) {
        return {
          ip:     a.address || '',
          mac:    a['mac-address'] || '',
          name:   names[a['mac-address']] || '',
          status: a.complete === 'true' || a.complete === true ? 'online' : 'inactive',
        };
      });
      renderResults(devices);
      document.getElementById('scan-status').textContent = '\u2705 ARP: ' + devices.length + ' записів';
    }).catch(function(e) {
      document.getElementById('scan-status').textContent = '\u274C ' + e.message;
    });
  });

  /* DHCP клієнти */
  document.getElementById('scan-dhcp-btn').addEventListener('click', function() {
    document.getElementById('scan-status').textContent = '\uD83D\uDD04 Завантажую DHCP...';
    apiGet('/ip/dhcp-server/lease').then(function(data) {
      var names = loadNames();
      var devices = data.map(function(l) {
        return {
          ip:     l.address || '',
          mac:    l['mac-address'] || '',
          name:   names[l['mac-address']] || l['host-name'] || '',
          status: l.status === 'bound' ? 'online' : 'inactive',
        };
      });
      renderResults(devices);
      document.getElementById('scan-status').textContent = '\u2705 DHCP: ' + devices.length + ' клієнтів';
    }).catch(function(e) {
      document.getElementById('scan-status').textContent = '\u274C ' + e.message;
    });
  });

  /* Фільтр і сортування */
  var filterEl = document.getElementById('scan-filter');
  var sortEl   = document.getElementById('scan-sort');
  if (filterEl) filterEl.addEventListener('input',  function() { renderResults(scanData); });
  if (sortEl)   sortEl.addEventListener('change', function() { renderResults(scanData); });
}

/* ════════════════════════════════════════
   ТАБ 2 — WAKE-ON-LAN
════════════════════════════════════════ */
function sendWoL(mac) {
  var hdrs = Object.assign({}, getHeaders());
  hdrs['Content-Type'] = 'application/json';

  fetch(PROXY + '/rest/tool/wol', {
    method: 'POST',
    headers: hdrs,
    body: JSON.stringify({ mac: mac, interface: 'bridge-lan' }),
  })
  .then(function() {
    showNotify('\uD83D\uDCE1 WoL надіслано: ' + mac, 'ok');
  })
  .catch(function(e) {
    showNotify('\u274C WoL помилка: ' + e.message, 'error');
  });
}

function renderWoL() {
  var content = document.getElementById('nt-content');
  var names   = loadNames();

  content.innerHTML =
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">' +

    /* Ручний WoL */
    '<div style="background:#0d1a24;border:1px solid #1c2a37;border-radius:8px;padding:16px;">' +
    '<div style="font-size:12px;color:#e6b35a;font-weight:700;margin-bottom:12px;">\uD83D\uDCE1 Wake-on-LAN</div>' +
    '<div style="margin-bottom:8px;">' +
    '<label style="font-size:10px;color:#8ea3b0;display:block;margin-bottom:3px;">MAC адреса</label>' +
    '<input id="wol-mac" type="text" placeholder="AA:BB:CC:DD:EE:FF" ' +
    'style="width:100%;background:#060d14;border:1px solid #1c2a37;color:#e6edf3;' +
    'padding:6px 8px;border-radius:5px;font-size:12px;font-family:monospace;box-sizing:border-box;">' +
    '</div>' +
    '<div style="margin-bottom:8px;">' +
    '<label style="font-size:10px;color:#8ea3b0;display:block;margin-bottom:3px;">Інтерфейс</label>' +
    '<input id="wol-iface" type="text" value="bridge-lan" ' +
    'style="width:100%;background:#060d14;border:1px solid #1c2a37;color:#e6edf3;' +
    'padding:6px 8px;border-radius:5px;font-size:12px;box-sizing:border-box;">' +
    '</div>' +
    '<button id="wol-send-btn" style="background:#e6b35a;color:#082018;border:none;' +
    'padding:8px 20px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;width:100%;">' +
    '\uD83D\uDCE1 Надіслати WoL пакет</button>' +
    '<div id="wol-status" style="font-size:11px;color:#4a6070;margin-top:8px;text-align:center;"></div>' +
    '</div>' +

    /* Збережені пристрої */
    '<div style="background:#0d1a24;border:1px solid #1c2a37;border-radius:8px;padding:16px;">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
    '<span style="font-size:12px;color:#e6b35a;font-weight:700;">\uD83D\uDCCB Збережені пристрої</span>' +
    '</div>' +
    '<div id="wol-saved-list">' +
    (Object.keys(names).length ? Object.keys(names).map(function(mac) {
      return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1c2a37;">' +
        '<div style="flex:1;">' +
        '<div style="font-size:12px;color:#c9e8d8;">' + names[mac] + '</div>' +
        '<div style="font-size:10px;color:#4a6070;font-family:monospace;">' + mac + '</div>' +
        '</div>' +
        '<button data-wol-mac="' + mac + '" style="background:#e6b35a;color:#082018;border:none;' +
        'padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;">\uD83D\uDCE1 Wake</button>' +
        '</div>';
    }).join('') : '<div style="color:#4a6070;font-size:11px;text-align:center;padding:20px;">Немає збережених пристроїв<br>Скануй мережу і назви пристрої</div>') +
    '</div>' +
    '</div>' +
    '</div>' +

    /* Як налаштувати WoL */
    '<div style="background:#0a1e14;border:1px solid #1a3a28;border-radius:8px;padding:14px;margin-top:14px;">' +
    '<div style="font-size:11px;color:#5fd0a5;font-weight:700;margin-bottom:8px;">\uD83D\uDCA1 Як налаштувати Wake-on-LAN на пристрої</div>' +
    '<div style="font-size:11px;color:#4a6070;line-height:1.8;">' +
    '1. В BIOS/UEFI увімкни <b style="color:#c9e8d8;">Wake on LAN</b><br>' +
    '2. В Windows: Диспетчер пристроїв → Мережевий адаптер → Властивості → Електроживлення → дозволити пробудження<br>' +
    '3. Переконайся що пристрій <b style="color:#c9e8d8;">вимкнено але підключено до мережі</b><br>' +
    '4. Натисни Wake після введення MAC адреси' +
    '</div></div>';

  /* WoL кнопка */
  document.getElementById('wol-send-btn').addEventListener('click', function() {
    var mac   = (document.getElementById('wol-mac')||{}).value.trim();
    var iface = (document.getElementById('wol-iface')||{}).value.trim() || 'bridge-lan';
    var status = document.getElementById('wol-status');

    if (!mac) { if (status) status.textContent = '\u274C Введи MAC адресу!'; return; }
    if (status) status.textContent = '\uD83D\uDCE1 Надсилаю...';

    fetch(PROXY + '/rest/tool/wol', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ mac: mac, interface: iface }),
    })
    .then(function() {
      if (status) status.textContent = '\u2705 WoL пакет надіслано на ' + mac;
      if (status) status.style.color = '#5fd0a5';
    })
    .catch(function(e) {
      if (status) status.textContent = '\u274C Помилка: ' + e.message;
      if (status) status.style.color = '#e0665a';
    });
  });

  /* Wake збережений */
  content.querySelectorAll('[data-wol-mac]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      sendWoL(this.getAttribute('data-wol-mac'));
    });
  });
}

/* ════════════════════════════════════════
   ТАБ 3 — PING МОНІТОР
════════════════════════════════════════ */
var pingTimer   = null;
var pingResults = {};

function addPingHost(ip) {
  var hosts = loadPingHosts();
  if (!hosts.includes(ip)) {
    hosts.push(ip);
    savePingHosts(hosts);
  }
}

function renderPing() {
  var content = document.getElementById('nt-content');
  content.innerHTML =
    '<div style="display:flex;gap:8px;align-items:center;margin-bottom:14px;flex-wrap:wrap;">' +
    '<input id="ping-add-ip" type="text" placeholder="IP або хост..." ' +
    'style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:6px 10px;border-radius:6px;font-size:12px;width:160px;">' +
    '<button id="ping-add-btn" style="background:#5fd0a5;color:#082018;border:none;' +
    'padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;">+ Додати хост</button>' +
    '<span style="color:#2a3b48;padding:0 4px;">|</span>' +
    '<span style="font-size:11px;color:#4a6070;">Інтервал:</span>' +
    '<select id="ping-interval" style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;' +
    'padding:5px 6px;border-radius:5px;font-size:11px;">' +
    '<option value="0">Стоп</option>' +
    '<option value="2000" selected>2s</option>' +
    '<option value="5000">5s</option>' +
    '<option value="10000">10s</option>' +
    '<option value="30000">30s</option>' +
    '</select>' +
    '<span id="ping-live-indicator" style="font-size:11px;color:#4a6070;"></span>' +
    '</div>' +

    /* Швидке додавання */
    '<div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;">' +
    '<span style="font-size:10px;color:#4a6070;line-height:26px;">Швидко:</span>' +
    ['8.8.8.8','1.1.1.1','192.168.88.1'].map(function(ip) {
      return '<button data-quick-ping="' + ip + '" style="background:#0d1a24;border:1px solid #2a3b48;' +
        'color:#8ea3b0;padding:3px 10px;border-radius:4px;cursor:pointer;font-size:10px;">+ ' + ip + '</button>';
    }).join('') +
    '</div>' +

    /* Статистика */
    '<div id="ping-stats-bar" style="display:none;background:#0d1a24;border:1px solid #1c2a37;' +
    'border-radius:6px;padding:10px 14px;margin-bottom:10px;display:flex;gap:20px;">' +
    '<span style="font-size:11px;color:#4a6070;">Онлайн: <b id="ping-stat-online" style="color:#5fd0a5;">0</b></span>' +
    '<span style="font-size:11px;color:#4a6070;">Офлайн: <b id="ping-stat-offline" style="color:#e0665a;">0</b></span>' +
    '<span style="font-size:11px;color:#4a6070;">Серед. RTT: <b id="ping-stat-avg" style="color:#e6b35a;">—</b></span>' +
    '</div>' +

    /* Список хостів */
    '<div id="ping-hosts-list" style="display:grid;gap:6px;"></div>';

  /* Ініціалізуємо хости */
  var hosts = loadPingHosts();
  if (!hosts.length) {
    hosts = ['192.168.88.1', '8.8.8.8', '1.1.1.1'];
    savePingHosts(hosts);
  }

  function renderHosts() {
    var hosts  = loadPingHosts();
    var list   = document.getElementById('ping-hosts-list');
    var names  = loadNames();
    if (!list) return;

    if (!hosts.length) {
      list.innerHTML = '<div style="color:#4a6070;text-align:center;padding:20px;font-size:12px;">Додай хости для моніторингу</div>';
      return;
    }

    list.innerHTML = hosts.map(function(ip) {
      var res  = pingResults[ip] || {};
      var name = names[ip] || '';

      return '<div style="display:grid;grid-template-columns:12px 1fr auto auto auto;' +
        'gap:10px;align-items:center;background:#0d1a24;border:1px solid #1c2a37;' +
        'border-radius:6px;padding:10px 14px;" data-ping-row="' + ip + '">' +

        /* Індикатор */
        '<div style="width:10px;height:10px;border-radius:50%;background:' +
        (res.status === 'ok' ? '#5fd0a5' : res.status === 'error' ? '#e0665a' : '#4a6070') + ';' +
        (res.status === 'ok' ? 'box-shadow:0 0 6px #5fd0a5;' : '') + '"></div>' +

        /* IP + Ім'я */
        '<div>' +
        '<div style="font-size:12px;font-family:monospace;color:#e6edf3;">' + ip +
        (name ? ' <span style="color:#e6b35a;font-size:10px;">(' + name + ')</span>' : '') + '</div>' +
        '<div style="font-size:10px;color:#4a6070;">' +
        (res.status === 'ok' ? '\u2705 Online · RTT: ' + res.rtt + 'ms · Втрати: ' + (res.loss||0) + '%' :
         res.status === 'error' ? '\u274C Offline · ' + (res.error||'timeout') :
         '\u23F3 Очікування...') +
        '</div></div>' +

        /* RTT графік */
        '<div style="font-size:18px;font-weight:700;color:' +
        (res.rtt < 10 ? '#5fd0a5' : res.rtt < 50 ? '#e6b35a' : '#e0665a') + ';min-width:60px;text-align:right;">' +
        (res.rtt ? res.rtt + 'ms' : '—') + '</div>' +

        /* Мінігraf */
        '<canvas data-sparkline="' + ip + '" width="60" height="30" style="border-radius:3px;"></canvas>' +

        /* Видалити */
        '<button data-del-ping="' + ip + '" style="background:transparent;border:1px solid #e0665a44;' +
        'color:#e0665a;padding:3px 7px;border-radius:4px;cursor:pointer;font-size:11px;">\u2715</button>' +
        '</div>';
    }).join('');

    /* Спарклайни */
    hosts.forEach(function(ip) {
      var canvas = list.querySelector('[data-sparkline="' + ip + '"]');
      var res    = pingResults[ip] || {};
      if (canvas && res.history) drawSparkline(canvas, res.history);
    });

    /* Видалити */
    list.querySelectorAll('[data-del-ping]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var ip = this.getAttribute('data-del-ping');
        var h  = loadPingHosts().filter(function(x) { return x !== ip; });
        savePingHosts(h);
        delete pingResults[ip];
        renderHosts();
      });
    });

    /* Статистика */
    var online  = hosts.filter(function(ip) { return (pingResults[ip]||{}).status === 'ok'; }).length;
    var offline = hosts.filter(function(ip) { return (pingResults[ip]||{}).status === 'error'; }).length;
    var rtts    = hosts.map(function(ip) { return (pingResults[ip]||{}).rtt||0; }).filter(Boolean);
    var avg     = rtts.length ? Math.round(rtts.reduce(function(a,b){return a+b;},0)/rtts.length) : null;

    var onlineEl  = document.getElementById('ping-stat-online');
    var offlineEl = document.getElementById('ping-stat-offline');
    var avgEl     = document.getElementById('ping-stat-avg');
    if (onlineEl)  onlineEl.textContent  = online;
    if (offlineEl) offlineEl.textContent = offline;
    if (avgEl)     avgEl.textContent     = avg ? avg + 'ms' : '—';
  }

  /* Спарклайн */
  function drawSparkline(canvas, history) {
    var ctx = canvas.getContext('2d');
    var W   = canvas.width;
    var H   = canvas.height;
    ctx.clearRect(0, 0, W, H);
    if (!history || history.length < 2) return;
    var max = Math.max.apply(null, history) || 1;
    ctx.strokeStyle = '#5fd0a5';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    history.forEach(function(v, i) {
      var x = (i / (history.length - 1)) * W;
      var y = H - (v / max) * (H - 4) - 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  /* Пінгуємо через proxy SSH */
  function doPing() {
    var hosts = loadPingHosts();
    var hdrs  = getHeaders();

    hosts.forEach(function(ip) {
      if (!pingResults[ip]) pingResults[ip] = { history: [] };

      /* Ping через MikroTik REST API /tool/ping */
      var hdrs = getHeaders();
      var startTime = Date.now();

      fetch(PROXY + '/rest/tool/ping', {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({
          address: ip,
          count:   '3',
          interval: '00:00:00.5',
        }),
      })
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function(data) {
        data = Array.isArray(data) ? data : (data ? [data] : []);
        /* Знаходимо успішні відповіді */
        var success = data.filter(function(d) {
          return d.status === 'echo-reply' || d['status'] === 'echo reply' || d.time !== undefined;
        });
        var rtt = null;
        if (success.length > 0) {
          /* Парсимо RTT з відповіді */
          var times = success.map(function(d) {
            var t = d.time || d['avg-rtt'] || '0';
            /* Формат: "1ms" або "1.5ms" або число мс */
            var match = String(t).match(/([\d.]+)/);
            return match ? parseFloat(match[1]) : 0;
          }).filter(function(t) { return t > 0; });
          rtt = times.length ? Math.round(times.reduce(function(a,b){return a+b;},0)/times.length) : 1;
        }
        var sent     = data.length || 3;
        var received = success.length;
        var loss     = Math.round((sent - received) / sent * 100);

        pingResults[ip].status  = rtt !== null && received > 0 ? 'ok' : 'error';
        pingResults[ip].rtt     = rtt || 0;
        pingResults[ip].loss    = loss;
        pingResults[ip].history = (pingResults[ip].history || []).slice(-20).concat(rtt || 0);
        renderHosts();
      })
      .catch(function(e) {
        pingResults[ip].status = 'error';
        pingResults[ip].error  = e.message.includes('502') ? 'proxy недоступний' :
                                  e.message.includes('401') ? 'невірний пароль' :
                                  'timeout';
        pingResults[ip].rtt   = 0;
        pingResults[ip].history = (pingResults[ip].history || []).slice(-20).concat(0);
        renderHosts();
      });
    });
  }

  /* Інтервал */
  var pingIntervalEl = document.getElementById('ping-interval');
  if (pingIntervalEl) {
    pingIntervalEl.addEventListener('change', function() {
      clearInterval(pingTimer);
      var interval = parseInt(this.value);
      var indicator = document.getElementById('ping-live-indicator');
      if (interval > 0) {
        if (indicator) { indicator.textContent = '\uD83D\uDFE2 Live'; indicator.style.color = '#5fd0a5'; }
        doPing();
        pingTimer = setInterval(doPing, interval);
      } else {
        if (indicator) { indicator.textContent = ''; }
      }
    });
    /* Автозапуск */
    pingTimer = setInterval(doPing, 2000);
    doPing();
    var ind = document.getElementById('ping-live-indicator');
    if (ind) { ind.textContent = '\uD83D\uDFE2 Live'; ind.style.color = '#5fd0a5'; }
  }

  /* Додати хост */
  document.getElementById('ping-add-btn').addEventListener('click', function() {
    var ip = (document.getElementById('ping-add-ip')||{}).value.trim();
    if (!ip) return;
    addPingHost(ip);
    document.getElementById('ping-add-ip').value = '';
    renderHosts();
  });

  document.getElementById('ping-add-ip').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') document.getElementById('ping-add-btn').click();
  });

  /* Швидке додавання */
  content.querySelectorAll('[data-quick-ping]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      addPingHost(this.getAttribute('data-quick-ping'));
      renderHosts();
    });
  });

  renderHosts();
}

/* ════════════════════════════════════════
   ТАБ 4 — ІМЕНУВАННЯ MAC
════════════════════════════════════════ */
function renderNames() {
  var content = document.getElementById('nt-content');
  var names   = loadNames();

  function render() {
    names = loadNames();
    content.innerHTML =
      '<div style="display:flex;gap:8px;align-items:center;margin-bottom:14px;">' +
      '<div style="font-size:12px;color:#5fd0a5;font-weight:700;">\uD83C\uDFF7\uFE0F Іменування пристроїв за MAC</div>' +
      '<button id="names-add-btn" style="background:#5fd0a5;color:#082018;border:none;' +
      'padding:6px 14px;border-radius:5px;cursor:pointer;font-size:12px;margin-left:auto;">+ Додати</button>' +
      '<button id="names-import-btn" style="background:transparent;border:1px solid #5b9bd5;color:#5b9bd5;' +
      'padding:6px 10px;border-radius:5px;cursor:pointer;font-size:11px;">\uD83D\uDCE5 Імпорт CSV</button>' +
      '<button id="names-export-btn" style="background:transparent;border:1px solid #5b9bd5;color:#5b9bd5;' +
      'padding:6px 10px;border-radius:5px;cursor:pointer;font-size:11px;">\uD83D\uDCE4 Експорт CSV</button>' +
      '</div>' +

      '<div style="font-size:11px;color:#4a6070;margin-bottom:10px;">' +
      '\uD83D\uDCA1 Імена прив\'язані до MAC — з\'являються у скануванні, Ping моніторі та топології</div>' +

      '<div style="background:#0d1a24;border:1px solid #1c2a37;border-radius:8px;overflow:hidden;">' +
      '<div style="display:grid;grid-template-columns:140px 1fr 1fr auto;gap:0;' +
      'background:#060d14;padding:8px 12px;font-size:10px;color:#4a6070;font-weight:700;">' +
      '<span>MAC адреса</span><span>Ім\'я пристрою</span><span>Остання IP</span><span>Дії</span>' +
      '</div>' +
      '<div style="max-height:400px;overflow-y:auto;">' +
      (Object.keys(names).length ? Object.keys(names).map(function(mac, idx) {
        return '<div style="display:grid;grid-template-columns:140px 1fr 1fr auto;' +
          'align-items:center;padding:8px 12px;border-bottom:1px solid #1c2a37;' +
          (idx % 2 === 0 ? 'background:#0a1520;' : '') + '">' +
          '<div style="font-size:11px;font-family:monospace;color:#8ea3b0;">' + mac + '</div>' +
          '<input data-name-mac="' + mac + '" type="text" value="' + (names[mac]||'') + '" ' +
          'style="background:transparent;border:none;color:#e6b35a;font-size:12px;outline:none;width:100%;">' +
          '<div style="font-size:11px;color:#4a6070;">—</div>' +
          '<button data-del-name="' + mac + '" style="background:transparent;border:1px solid #e0665a44;' +
          'color:#e0665a;padding:2px 8px;border-radius:3px;cursor:pointer;font-size:11px;">\u2715</button>' +
          '</div>';
      }).join('') : '<div style="color:#4a6070;text-align:center;padding:30px;font-size:12px;">Немає збережених імен<br>Скануй мережу щоб знайти пристрої</div>') +
      '</div></div>';

    /* Зміна імені */
    content.querySelectorAll('[data-name-mac]').forEach(function(inp) {
      inp.addEventListener('blur', function() {
        var mac = this.getAttribute('data-name-mac');
        var ns  = loadNames();
        ns[mac] = this.value.trim();
        saveNames(ns);
      });
    });

    /* Видалити */
    content.querySelectorAll('[data-del-name]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var mac = this.getAttribute('data-del-name');
        var ns  = loadNames();
        delete ns[mac];
        saveNames(ns);
        render();
      });
    });

    /* Додати */
    var addBtn = document.getElementById('names-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        var mac  = prompt('MAC адреса (AA:BB:CC:DD:EE:FF):');
        if (!mac) return;
        var name = prompt('Ім\'я пристрою:');
        if (!name) return;
        var ns   = loadNames();
        ns[mac.toUpperCase()] = name;
        saveNames(ns);
        render();
      });
    }

    /* Експорт CSV */
    var expBtn = document.getElementById('names-export-btn');
    if (expBtn) {
      expBtn.addEventListener('click', function() {
        var ns  = loadNames();
        var csv = 'mac,name\n' + Object.keys(ns).map(function(mac) {
          return mac + ',' + ns[mac];
        }).join('\n');
        var a  = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
        a.download = 'mac-names.csv';
        a.click();
      });
    }

    /* Імпорт CSV */
    var impBtn = document.getElementById('names-import-btn');
    if (impBtn) {
      impBtn.addEventListener('click', function() {
        var inp  = document.createElement('input');
        inp.type = 'file'; inp.accept = '.csv,.txt';
        inp.addEventListener('change', function() {
          var reader = new FileReader();
          reader.onload = function(e) {
            var lines = e.target.result.split('\n').filter(function(l){return l.trim();});
            var ns    = loadNames();
            var added = 0;
            lines.forEach(function(line) {
              if (line.startsWith('mac,')) return;
              var parts = line.split(',');
              if (parts.length >= 2 && parts[0].trim()) {
                ns[parts[0].trim().toUpperCase()] = parts[1].trim();
                added++;
              }
            });
            saveNames(ns);
            render();
            showNotify('\u2705 Імпортовано: ' + added + ' імен', 'ok');
          };
          reader.readAsText(this.files[0]);
        });
        inp.click();
      });
    }
  }

  render();
}

/* ════════════════════════════════════════
   ТАБИ — ПЕРЕМИКАННЯ
════════════════════════════════════════ */
function switchTab(tabId) {
  /* Зупиняємо ping якщо виходимо */
  if (tabId !== 'ping') {
    clearInterval(pingTimer);
    pingTimer = null;
  }

  box.querySelectorAll('.nt-tab').forEach(function(btn) {
    var isActive = btn.getAttribute('data-tab') === tabId;
    btn.style.background   = isActive ? '#5fd0a533' : 'transparent';
    btn.style.borderColor  = isActive ? '#5fd0a5' : 'transparent';
    btn.style.color        = isActive ? '#5fd0a5' : '#8ea3b0';
    btn.style.borderBottom = isActive ? 'none' : 'none';
  });

  if (tabId === 'scan')  renderScan();
  if (tabId === 'wol')   renderWoL();
  if (tabId === 'ping')  renderPing();
  if (tabId === 'names') renderNames();
}

box.querySelectorAll('.nt-tab').forEach(function(btn) {
  btn.addEventListener('click', function() {
    switchTab(this.getAttribute('data-tab'));
  });
});

/* ════════════════════════════════════════
   ЗАКРИТИ
════════════════════════════════════════ */
document.getElementById('nt-close').addEventListener('click', function() {
  modal.style.display = 'none';
  clearInterval(pingTimer);
  pingTimer = null;
});
modal.addEventListener('click', function(e) {
  if (e.target === modal) {
    modal.style.display = 'none';
    clearInterval(pingTimer);
  }
});

/* ════════════════════════════════════════
   NOTIFY
════════════════════════════════════════ */
function showNotify(msg, type) {
  var colors = { ok:'#5fd0a5', error:'#e0665a', warn:'#e6b35a', info:'#5b9bd5' };
  var n = document.createElement('div');
  n.style.cssText = 'position:fixed;top:20px;right:20px;background:#0d1a24;' +
    'border:1px solid ' + (colors[type]||colors.info) + ';' +
    'color:' + (colors[type]||colors.info) + ';' +
    'padding:10px 16px;border-radius:8px;font-size:12px;z-index:99999;' +
    'box-shadow:0 4px 12px rgba(0,0,0,.4);';
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(function() { n.remove(); }, 3000);
}

/* ════════════════════════════════════════
   FAB КНОПКА
════════════════════════════════════════ */
var fab = document.createElement('button');
fab.id    = 'btn-nettools-fab';
fab.title = 'Мережеві інструменти';
fab.style.cssText = [
  'position:fixed','bottom:358px','right:16px',
  'background:#16212c','border:2px solid #5fd0a5',
  'color:#5fd0a5','border-radius:50%',
  'width:42px','height:42px',
  'font-size:18px','cursor:pointer',
  'z-index:10000','display:flex',
  'align-items:center','justify-content:center',
  'box-shadow:0 2px 8px rgba(95,208,165,.4)',
].join(';');
fab.textContent = '\uD83D\uDD27';
fab.addEventListener('mouseenter', function() { fab.style.background = '#1c2a37'; });
fab.addEventListener('mouseleave', function() { fab.style.background = '#16212c'; });
fab.addEventListener('click', function() {
  /* Синхронізуємо дані з терміналу */
  var tmIp   = document.getElementById('tm-ip');
  var tmUser = document.getElementById('tm-user');
  var tmPass = document.getElementById('tm-pass');
  if (tmIp   && tmIp.value)   document.getElementById('nt-ip').value   = tmIp.value;
  if (tmUser && tmUser.value) document.getElementById('nt-user').value = tmUser.value;
  if (tmPass && tmPass.value) document.getElementById('nt-pass').value = tmPass.value;

  modal.style.display = 'block';
  switchTab('scan');
});
document.body.appendChild(fab);

console.log('[network-tools] v1 ready');
})();