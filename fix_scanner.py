# -*- coding: utf-8 -*-
import subprocess

# Пишемо switch-scanner.js через окремий файл — без проблем з лапками
SCANNER = """'use strict';
window.SwitchScanner = {
  _devices: [],
  _scanning: false,
  _PROXY: 'http://localhost:8888',

  scan: function() {
    if (SwitchScanner._scanning) return;
    SwitchScanner._scanning = true;
    SwitchScanner._devices  = [];

    var router = window.getActiveRouter ? window.getActiveRouter() : null;
    if (!router) {
      SwitchScanner.setStatus('Немає підключеного роутера', '#e08080');
      SwitchScanner._scanning = false;
      return;
    }

    SwitchScanner.setStatus('Збираємо дані з MikroTik...', '#f0a840');
    SwitchScanner.clearTable();

    var headers = {
      'x-router-ip':   router.ip,
      'x-router-port': String(router.port || 80),
      'x-router-user': router.user,
      'x-router-pass': router.pass,
    };

    Promise.allSettled([
      fetch(SwitchScanner._PROXY + '/rest/ip/arp',
        {headers: headers}).then(function(r){return r.json();}),
      fetch(SwitchScanner._PROXY + '/rest/ip/dhcp-server/lease',
        {headers: headers}).then(function(r){return r.json();}),
      fetch(SwitchScanner._PROXY + '/rest/ip/neighbor',
        {headers: headers}).then(function(r){return r.json();}),
      fetch(SwitchScanner._PROXY + '/rest/interface/wireless/registration-table',
        {headers: headers}).then(function(r){return r.json();}),
    ]).then(function(results) {
      var arpList      = Array.isArray(results[0].value) ? results[0].value : [];
      var dhcpList     = Array.isArray(results[1].value) ? results[1].value : [];
      var neighborList = Array.isArray(results[2].value) ? results[2].value : [];
      var wifiList     = Array.isArray(results[3].value) ? results[3].value : [];

      var devices = {};

      arpList.forEach(function(e) {
        var ip  = e['address'] || '';
        var mac = (e['mac-address'] || '').toUpperCase();
        if (!ip || ip === '0.0.0.0') return;
        var key = mac || ip;
        devices[key] = {
          ip: ip, mac: mac,
          iface:    e['interface'] || '',
          hostname: '', vendor: '', type: '', typeIcon: '',
          signal: '', dhcpName: '', comment: '',
          online: true, source: 'ARP',
        };
      });

      dhcpList.forEach(function(e) {
        var mac = (e['mac-address'] || '').toUpperCase();
        var ip  = e['address'] || '';
        var key = mac || ip;
        if (devices[key]) {
          devices[key].hostname = e['host-name'] || '';
          devices[key].dhcpName = e['host-name'] || '';
          devices[key].comment  = e['comment']   || '';
          if (!devices[key].source.includes('DHCP'))
            devices[key].source += '+DHCP';
        } else if (ip) {
          devices[key] = {
            ip: ip, mac: mac, iface: '',
            hostname: e['host-name'] || '',
            vendor: '', type: '', typeIcon: '',
            signal: '', dhcpName: e['host-name'] || '',
            comment: e['comment'] || '',
            online: true, source: 'DHCP',
          };
        }
      });

      neighborList.forEach(function(e) {
        var ip  = e['address'] || e['ip-address'] || '';
        var mac = (e['mac-address'] || '').toUpperCase();
        var key = mac || ip;
        if (!ip) return;
        if (devices[key]) {
          devices[key].hostname = devices[key].hostname || e['identity'] || '';
          devices[key].comment  = e['system-description'] || devices[key].comment;
          if (!devices[key].source.includes('LLDP'))
            devices[key].source += '+LLDP';
        } else {
          devices[key] = {
            ip: ip, mac: mac, iface: e['interface'] || '',
            hostname: e['identity'] || '',
            vendor: '', type: '', typeIcon: '',
            signal: '', dhcpName: '', comment: e['system-description'] || '',
            online: true, source: 'LLDP',
          };
        }
      });

      wifiList.forEach(function(e) {
        var mac = (e['mac-address'] || '').toUpperCase();
        if (devices[mac]) {
          devices[mac].signal = e['signal-strength'] || e['rx-signal'] || '';
          if (!devices[mac].source.includes('WiFi'))
            devices[mac].source += '+WiFi';
        }
      });

      Object.values(devices).forEach(function(d) {
        d.vendor = window.OUILookup ? OUILookup.lookup(d.mac) : 'Unknown';
        var dt   = window.OUILookup
          ? OUILookup.getDeviceType(d.vendor, d.openPorts || [], d.hostname)
          : {icon: '?', type: 'Unknown'};
        d.typeIcon = dt.icon;
        d.type     = dt.type;
      });

      SwitchScanner._devices = Object.values(devices);
      SwitchScanner._scanning = false;
      SwitchScanner.setStatus(
        'Знайдено: ' + SwitchScanner._devices.length + ' пристроїв',
        '#5fd0a5'
      );
      SwitchScanner.renderTable(SwitchScanner._devices);
      SwitchScanner.updateStats(arpList.length, dhcpList.length, neighborList.length, wifiList.length);
    }).catch(function(e) {
      SwitchScanner._scanning = false;
      SwitchScanner.setStatus('Помилка: ' + e, '#e08080');
    });
  },

  updateStats: function(arp, dhcp, nbr, wifi) {
    var total = SwitchScanner._devices.length;
    var ids = ['ss-stat-total','ss-stat-arp','ss-stat-dhcp','ss-stat-nbr','ss-stat-wifi'];
    var vals = [total, arp, dhcp, nbr, wifi];
    ids.forEach(function(id, i) {
      var el = document.getElementById(id);
      if (el) el.textContent = vals[i];
    });
  },

  renderTable: function(devices) {
    var tbody = document.getElementById('ss-tbody');
    if (!tbody) return;

    var textFilter = (document.getElementById('ss-search') || {}).value || '';
    var typeFilter = (document.getElementById('ss-type-filter') || {}).value || '';
    var ifaceFilter= (document.getElementById('ss-iface-filter') || {}).value || '';
    var onlineOnly = (document.getElementById('ss-online-only') || {}).checked;

    var filtered = devices.filter(function(d) {
      var txt = [d.ip, d.mac, d.vendor, d.hostname, d.type, d.comment]
        .join(' ').toLowerCase();
      if (textFilter  && !txt.includes(textFilter.toLowerCase())) return false;
      if (typeFilter  && d.type  !== typeFilter)  return false;
      if (ifaceFilter && d.iface !== ifaceFilter)  return false;
      if (onlineOnly  && !d.online) return false;
      return true;
    });

    filtered.sort(function(a, b) {
      var ao = (a.ip || '').split('.').map(Number);
      var bo = (b.ip || '').split('.').map(Number);
      for (var i = 0; i < 4; i++) if (ao[i] !== bo[i]) return ao[i] - bo[i];
      return 0;
    });

    if (filtered.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="9" style="text-align:center;color:#4a6070;padding:20px;">' +
        'Нічого не знайдено</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(function(d) {
      var dot = d.online === true
        ? '<span style="color:#5fd0a5;font-size:10px;">●</span>'
        : '<span style="color:#e08080;font-size:10px;">●</span>';

      var vendorHtml = d.vendor && d.vendor !== 'Unknown'
        ? '<div style="color:#5b9bd5;font-size:11px;">' + d.vendor + '</div>'
        : '<div style="color:#4a6070;font-size:11px;">Unknown</div>';

      var typeHtml = d.type
        ? '<span style="background:#1a2a1a;border:1px solid #2a4a2a;' +
          'border-radius:4px;padding:1px 6px;font-size:11px;color:#5fd0a5;">' +
          d.typeIcon + ' ' + d.type + '</span>'
        : '<span style="color:#4a6070;font-size:11px;">—</span>';

      var signalHtml = d.signal
        ? '<span style="color:#f0a840;font-size:11px;">📶 ' + d.signal + '</span>'
        : '—';

      var sourceHtml = d.source.split('+').map(function(s) {
        var colors = {ARP:'#2a5a2a',DHCP:'#2a2a5a',LLDP:'#5a4a2a',WiFi:'#4a2a5a'};
        var c = colors[s.trim()] || '#2a3a48';
        return '<span style="background:' + c + ';border-radius:3px;' +
          'padding:1px 5px;font-size:10px;margin:1px;display:inline-block;">' +
          s.trim() + '</span>';
      }).join('');

      return '<tr style="border-bottom:1px solid #0f1c26;"' +
        ' onmouseover="this.style.background=\'#0d1a28\'"' +
        ' onmouseout="this.style.background=\'\'">'+
        '<td style="padding:6px 10px;font-family:monospace;font-size:12px;">' +
          dot + ' <span style="color:#5b9bd5;">' + (d.ip || '—') + '</span>' +
        '</td>' +
        '<td style="padding:6px 10px;">' +
          '<div style="font-family:monospace;font-size:11px;color:#8ea3b0;">' +
            (d.mac || '—') +
          '</div>' +
          vendorHtml +
        '</td>' +
        '<td style="padding:6px 10px;">' + typeHtml + '</td>' +
        '<td style="padding:6px 10px;font-size:12px;color:#c9d8e4;">' +
          (d.hostname || d.dhcpName || '<span style="color:#4a6070;">—</span>') +
        '</td>' +
        '<td style="padding:6px 10px;font-size:11px;color:#4a6070;">' +
          (d.iface || '—') +
        '</td>' +
        '<td style="padding:6px 10px;">' + signalHtml + '</td>' +
        '<td style="padding:6px 10px;">' + sourceHtml + '</td>' +
        '<td style="padding:6px 8px;white-space:nowrap;">' +
          '<button onclick="SwitchScanner.showDetail(\\\'' + d.ip + '\\\')" ' +
          'style="background:#1a2a3a;border:1px solid #2a3b48;color:#5b9bd5;' +
          'border-radius:5px;padding:2px 6px;cursor:pointer;font-size:11px;' +
          'margin-right:3px;">🔍 Деталі</button>' +
          '<button onclick="window.open(\'http://' + d.ip + '\',\'_blank\')" ' +
          'style="background:#1a3a1a;border:1px solid #2a5a2a;color:#5fd0a5;' +
          'border-radius:5px;padding:2px 6px;cursor:pointer;font-size:11px;">🌐</button>' +
        '</td>' +
        '</tr>';
    }).join('');

    SwitchScanner.updateFilters(devices);
  },

  updateFilters: function(devices) {
    var types  = {};
    var ifaces = {};
    devices.forEach(function(d) {
      if (d.type)  types[d.type]   = true;
      if (d.iface) ifaces[d.iface] = true;
    });
    var tSel = document.getElementById('ss-type-filter');
    var iSel = document.getElementById('ss-iface-filter');
    if (tSel) {
      var tv = tSel.value;
      tSel.innerHTML = '<option value="">Всі типи</option>' +
        Object.keys(types).map(function(t) {
          return '<option value="' + t + '"' + (t===tv?' selected':'') + '>' + t + '</option>';
        }).join('');
    }
    if (iSel) {
      var iv = iSel.value;
      iSel.innerHTML = '<option value="">Всі інтерфейси</option>' +
        Object.keys(ifaces).map(function(i) {
          return '<option value="' + i + '"' + (i===iv?' selected':'') + '>' + i + '</option>';
        }).join('');
    }
  },

  showDetail: function(ip) {
    var d = SwitchScanner._devices.find(function(x) { return x.ip === ip; });
    if (!d) return;
    var info = [
      'IP: '        + d.ip,
      'MAC: '       + (d.mac      || '—'),
      'Vendor: '    + (d.vendor   || '—'),
      'Тип: '       + d.typeIcon + ' ' + (d.type || '—'),
      'Hostname: '  + (d.hostname || '—'),
      'Interface: ' + (d.iface   || '—'),
      'Signal: '    + (d.signal  || '—'),
      'Source: '    + (d.source  || '—'),
      'Comment: '   + (d.comment || '—'),
    ].join('\\n');
    /* Детальна панель */
    var old = document.getElementById('ss-detail-panel');
    if (old) old.remove();
    var panel = document.createElement('div');
    panel.id = 'ss-detail-panel';
    panel.style.cssText = [
      'position:fixed','top:50%','left:50%',
      'transform:translate(-50%,-50%)',
      'background:#0d1117','border:1px solid #2a3b48',
      'border-radius:12px','padding:20px 24px',
      'z-index:9999999','min-width:320px',
      'box-shadow:0 8px 40px rgba(0,0,0,.8)',
    ].join(';');
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;margin-bottom:14px;">' +
        '<span style="color:#5fd0a5;font-weight:700;font-size:14px;">' +
          d.typeIcon + ' ' + d.ip +
        '</span>' +
        '<button onclick="document.getElementById(\'ss-detail-panel\').remove()" ' +
        'style="background:transparent;border:1px solid #2a3b48;color:#4a6070;' +
        'border-radius:5px;padding:2px 8px;cursor:pointer;">✕</button>' +
      '</div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:12px;">' +
      [
        ['IP',        d.ip],
        ['MAC',       d.mac || '—'],
        ['Vendor',    d.vendor || '—'],
        ['Тип',       d.typeIcon + ' ' + (d.type || '—')],
        ['Hostname',  d.hostname || d.dhcpName || '—'],
        ['Interface', d.iface || '—'],
        ['Signal',    d.signal || '—'],
        ['Source',    d.source || '—'],
        ['Comment',   d.comment || '—'],
      ].map(function(row) {
        return '<tr><td style="color:#4a6070;padding:4px 0;padding-right:16px;">' +
          row[0] + '</td>' +
          '<td style="color:#c9d8e4;font-family:monospace;">' + row[1] + '</td></tr>';
      }).join('') +
      '</table>' +
      '<div style="margin-top:12px;display:flex;gap:8px;">' +
        '<button onclick="window.open(\'http://' + d.ip + '\',\'_blank\')" ' +
        'style="background:#1a3a1a;border:1px solid #2a5a2a;color:#5fd0a5;' +
        'border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;flex:1;">🌐 Відкрити Web UI</button>' +
        '<button onclick="navigator.clipboard.writeText(\\\'' + d.ip + '\\\')" ' +
        'style="background:#1a2a3a;border:1px solid #2a3b48;color:#5b9bd5;' +
        'border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;">📋 IP</button>' +
        '<button onclick="navigator.clipboard.writeText(\\\'' + d.mac + '\\\')" ' +
        'style="background:#1a2a3a;border:1px solid #2a3b48;color:#5b9bd5;' +
        'border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;">📋 MAC</button>' +
      '</div>';
    document.body.appendChild(panel);
  },

  exportCSV: function() {
    var rows = [['IP','MAC','Vendor','Type','Hostname','Interface','Signal','Source','Comment']];
    SwitchScanner._devices.forEach(function(d) {
      rows.push([d.ip,d.mac,d.vendor,d.type,d.hostname,d.iface,d.signal,d.source,d.comment]);
    });
    var csv = rows.map(function(r) {
      return r.map(function(c) { return '"'+(c||'').replace(/"/g,'""')+'"'; }).join(';');
    }).join('\\n');
    var blob = new Blob(['\\ufeff'+csv], {type:'text/csv;charset=utf-8'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'network-scan-' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  },

  setStatus: function(msg, color) {
    var el = document.getElementById('ss-status');
    if (el) { el.textContent = '⚡ ' + msg; el.style.color = color || '#5fd0a5'; }
  },

  clearTable: function() {
    var tbody = document.getElementById('ss-tbody');
    if (tbody) tbody.innerHTML =
      '<tr><td colspan="8" style="text-align:center;color:#4a6070;padding:30px;">' +
      '⏳ Сканування...</td></tr>';
  },
};
console.log('[SwitchScanner] Ready ✅');
"""

with open('ai-agent/switch-scanner.js', 'w', encoding='utf-8') as f:
    f.write(SCANNER)

r = subprocess.run(['node','--check','ai-agent/switch-scanner.js'],
                   capture_output=True, text=True)
print('switch-scanner.js:', 'OK ✅' if r.returncode==0 else '❌\n'+r.stderr[:300])

# ════════════════════════════════════
# 2. Додаємо вкладку Switch у Router Manager
# ════════════════════════════════════
with open('router-manager.js', 'r', encoding='utf-8') as f:
    rm = f.read()

# Знаходимо buildSkeleton і додаємо вкладку
idx = rm.find('buildSkeleton()')
depth = 0; found = False; end = idx
for i, ch in enumerate(rm[idx:], idx):
    if ch == '{': depth += 1; found = True
    elif ch == '}': depth -= 1
    if found and depth == 0: end = i + 1; break

skeleton_block = rm[idx:end]
print('buildSkeleton знайдено ✅')
print(repr(skeleton_block[:200]))

# Знаходимо rm-title і додаємо вкладки після нього
old_header = '<span id="rm-title">🖥️ Router Manager</span>'
if old_header in rm:
    new_header = (
        '<span id="rm-title">🖥️ Router Manager</span>\n'
        '          <div style="display:flex;gap:4px;margin-left:12px;">\n'
        '            <button id="rm-tab-routers" onclick="SwitchScanner._showTab(\'routers\')" '
        'style="background:#1a3a2a;border:1px solid #3a6a2a;color:#5fd0a5;'
        'border-radius:6px;padding:3px 12px;cursor:pointer;font-size:12px;font-weight:600;">'
        '🖥 Роутери</button>\n'
        '            <button id="rm-tab-scanner" onclick="SwitchScanner._showTab(\'scanner\')" '
        'style="background:transparent;border:1px solid #2a3b48;color:#4a6070;'
        'border-radius:6px;padding:3px 12px;cursor:pointer;font-size:12px;">'
        '🔍 Мережевий сканер</button>\n'
        '          </div>'
    )
    rm = rm.replace(old_header, new_header)
    print('OK: вкладки в header ✅')
else:
    print('WARN: rm-title не знайдено')
    idx2 = rm.find('rm-title')
    print(repr(rm[max(0,idx2-50):idx2+100]))

# Додаємо панель сканера після rm-panel відкриваючого тегу
# Шукаємо де закінчується форма роутера і додаємо ss-panel
old_close = "window.RouterManager = {"
idx3 = rm.find(old_close)

SCANNER_PANEL_JS = """
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

"""

if old_close in rm:
    rm = rm.replace(old_close, SCANNER_PANEL_JS + '\n  ' + old_close)
    print('OK: buildScannerPanel + _showTab додано ✅')

with open('router-manager.js', 'w', encoding='utf-8') as f:
    f.write(rm)

r2 = subprocess.run(['node','--check','router-manager.js'],
                    capture_output=True, text=True)
print('router-manager:', 'OK ✅' if r2.returncode==0 else '❌\n'+r2.stderr[:200])

# ════════════════════════════════════
# 3. Підключаємо скрипти в index.html
# ════════════════════════════════════
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

changed = False
for script in ['ai-agent/oui-lookup.js', 'ai-agent/switch-scanner.js']:
    if script not in html:
        html = html.replace(
            '</body>',
            '  <script src="' + script + '"></script>\n</body>'
        )
        print('OK: ' + script + ' додано в index.html ✅')
        changed = True
    else:
        print('OK: ' + script + ' вже є ✅')

if changed:
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)

print('\nВсе готово! npm start')