# -*- coding: utf-8 -*-
import subprocess, os

# ════════════════════════════════════
# 1. OUI база вендорів (топ пристрої)
# ════════════════════════════════════
OUI_JS = """'use strict';
/* MAC OUI Vendor Database — локальна база */
window.OUILookup = {
  _db: {
    /* MikroTik */
    '4C:5E:0C':'MikroTik','2C:C8:1B':'MikroTik','B8:69:F4':'MikroTik',
    'D4:CA:6D':'MikroTik','DC:2C:6E':'MikroTik','E4:8D:8C':'MikroTik',
    '18:FD:74':'MikroTik','48:8F:5A':'MikroTik','74:4D:28':'MikroTik',
    /* Cisco */
    '00:1A:A1':'Cisco','00:1B:54':'Cisco','00:23:EA':'Cisco',
    '58:AC:78':'Cisco','70:DB:98':'Cisco','A4:4C:11':'Cisco',
    /* TP-Link */
    '50:C7:BF':'TP-Link','54:AF:97':'TP-Link','14:CC:20':'TP-Link',
    'B0:95:75':'TP-Link','AC:84:C9':'TP-Link','E8:48:B8':'TP-Link',
    /* Huawei */
    '00:46:4B':'Huawei','04:C0:6F':'Huawei','04:F9:38':'Huawei',
    '28:31:52':'Huawei','4C:54:99':'Huawei','54:89:98':'Huawei',
    /* Hikvision */
    'C0:56:E3':'Hikvision','44:19:B6':'Hikvision','8C:E7:48':'Hikvision',
    'BC:AD:28':'Hikvision','D0:C5:D3':'Hikvision','18:68:CB':'Hikvision',
    /* Dahua */
    '3C:EF:8C':'Dahua','90:02:A9':'Dahua','4C:11:BF':'Dahua',
    'E0:50:8B':'Dahua','BC:32:B2':'Dahua',
    /* Sofar Solar (інвертори) */
    'B8:27:EB':'Sofar Solar','DC:A6:32':'Sofar Solar',
    /* Growatt */
    'C4:4F:33':'Growatt','58:BF:25':'Growatt',
    /* SMA Solar */
    '00:80:25':'SMA Solar','00:15:BB':'SMA Solar',
    /* Fronius */
    '00:03:AC':'Fronius Intl',
    /* Siemens */
    '00:0E:8C':'Siemens','00:1B:1B':'Siemens','20:87:56':'Siemens',
    /* Schneider */
    '00:80:F4':'Schneider','00:60:34':'Schneider','00:0B:AB':'Schneider',
    /* AXIS (камери) */
    '00:40:8C':'AXIS','AC:CC:8E':'AXIS',
    /* Samsung */
    '00:16:32':'Samsung','2C:FD:A1':'Samsung','8C:77:12':'Samsung',
    /* Apple */
    '00:03:93':'Apple','00:0A:27':'Apple','3C:22:FB':'Apple',
    'A4:CF:99':'Apple','F0:18:98':'Apple',
    /* Dell */
    '00:14:22':'Dell','18:DB:F2':'Dell','F8:BC:12':'Dell',
    /* HP */
    '00:0F:61':'HP','3C:D9:2B':'HP','94:57:A5':'HP',
    /* Ubiquiti */
    '04:18:D6':'Ubiquiti','24:A4:3C':'Ubiquiti','68:72:51':'Ubiquiti',
    '78:8A:20':'Ubiquiti','B4:FB:E4':'Ubiquiti','DC:9F:DB':'Ubiquiti',
    /* D-Link */
    '00:1C:F0':'D-Link','14:D6:4D':'D-Link','84:C9:B2':'D-Link',
    /* Netgear */
    '00:14:6C':'Netgear','20:4E:7F':'Netgear','A0:04:60':'Netgear',
    /* Zyxel */
    '00:13:49':'Zyxel','50:67:F0':'Zyxel','BC:99:11':'Zyxel',
    /* Raspberry Pi */
    'B8:27:EB':'Raspberry Pi','DC:A6:32':'Raspberry Pi','E4:5F:01':'Raspberry Pi',
    /* Arduino/ESP */
    '24:62:AB':'Espressif (ESP)','30:AE:A4':'Espressif (ESP)',
    'A4:CF:12':'Espressif (ESP)','CC:50:E3':'Espressif (ESP)',
    /* Advantech (промислові) */
    '00:D0:C9':'Advantech','00:1A:AA':'Advantech',
    /* Honeywell */
    '00:04:F2':'Polycom','00:90:7A':'Honeywell',
    /* ABB */
    '00:0A:DC':'ABB','00:30:11':'ABB',
  },

  lookup: function(mac) {
    if (!mac) return 'Unknown';
    var norm = mac.toUpperCase().replace(/-/g,':');
    /* Спробуємо prefix 8, 6, потім 5 символів */
    var p8 = norm.slice(0,11);
    var p6 = norm.slice(0,8);
    return this._db[p8] || this._db[p6] || 'Unknown';
  },

  /* Визначаємо тип пристрою */
  getDeviceType: function(vendor, openPorts, hostname) {
    var v = (vendor||'').toLowerCase();
    var h = (hostname||'').toLowerCase();
    var ports = openPorts || [];

    if (v.includes('mikrotik') || v.includes('routerboard'))
      return { icon:'🔴', type:'MikroTik Router' };
    if (v.includes('ubiquiti') || v.includes('unifi'))
      return { icon:'🔵', type:'Ubiquiti' };
    if (v.includes('cisco') && (v.includes('switch')||ports.includes(23)))
      return { icon:'🔌', type:'Cisco Switch' };
    if (v.includes('cisco'))
      return { icon:'🔌', type:'Cisco' };
    if (v.includes('hp') || v.includes('aruba'))
      return { icon:'🔌', type:'HP/Aruba Switch' };
    if (v.includes('tp-link'))
      return { icon:'🔌', type:'TP-Link Switch' };
    if (v.includes('d-link') || v.includes('netgear') || v.includes('zyxel'))
      return { icon:'🔌', type:'Switch' };
    if (v.includes('hikvision') || v.includes('dahua') || v.includes('axis'))
      return { icon:'📷', type:'IP Camera' };
    if (v.includes('sofar') || v.includes('growatt') || v.includes('sma solar') || v.includes('fronius'))
      return { icon:'☀️', type:'Інвертор' };
    if (v.includes('siemens') || v.includes('schneider') || v.includes('abb') || v.includes('advantech'))
      return { icon:'⚙️', type:'Промисловий контролер' };
    if (ports.includes(502))
      return { icon:'⚙️', type:'Modbus пристрій' };
    if (v.includes('honeywell') || h.includes('plc') || h.includes('controller'))
      return { icon:'⚙️', type:'Контролер' };
    if (v.includes('raspberry') || v.includes('espressif'))
      return { icon:'🖥', type:'SBC/IoT' };
    if (v.includes('apple'))
      return { icon:'🍎', type:'Apple' };
    if (v.includes('samsung') || v.includes('huawei'))
      return { icon:'📱', type:'Mobile/PC' };
    if (v.includes('dell') || v.includes('hp'))
      return { icon:'💻', type:'PC/Server' };
    if (ports.includes(80) || ports.includes(443) || ports.includes(8080))
      return { icon:'🌐', type:'Web пристрій' };
    return { icon:'❓', type:'Unknown' };
  }
};
console.log('[OUILookup] Ready ✅');
"""

os.makedirs('ai-agent', exist_ok=True)
with open('ai-agent/oui-lookup.js', 'w', encoding='utf-8') as f:
    f.write(OUI_JS)

r = subprocess.run(['node','--check','ai-agent/oui-lookup.js'],
                   capture_output=True, text=True)
print('oui-lookup.js:', 'OK ✅' if r.returncode==0 else '❌\n'+r.stderr[:200])

# ════════════════════════════════════
# 2. switch-scanner.js — повний сканер
# ════════════════════════════════════
SCANNER_JS = """'use strict';
/* ═══════════════════════════════════════════════════
   Switch Scanner — мережевий сканер без авторизації
   Читає ARP/DHCP/Neighbor з MikroTik
   ═══════════════════════════════════════════════════ */

window.SwitchScanner = {
  _devices: [],
  _scanning: false,
  _PROXY: 'http://localhost:8888',

  /* ── Головна функція сканування ── */
  scan: function(subnet) {
    if (SwitchScanner._scanning) return;
    SwitchScanner._scanning = true;
    SwitchScanner._devices  = [];

    var router = window.getActiveRouter ? window.getActiveRouter() : null;
    if (!router) {
      SwitchScanner.showError('Немає підключеного роутера MikroTik');
      SwitchScanner._scanning = false;
      return;
    }

    SwitchScanner.setStatus('⏳ Збираємо дані з MikroTik...', '#f0a840');
    SwitchScanner.clearTable();

    /* Паралельно читаємо ARP + DHCP + Neighbors */
    var headers = {
      'x-router-ip':   router.ip,
      'x-router-port': String(router.port || 80),
      'x-router-user': router.user,
      'x-router-pass': router.pass,
    };

    Promise.allSettled([
      fetch(SwitchScanner._PROXY + '/rest/ip/arp',          { headers: headers }).then(function(r){return r.json();}),
      fetch(SwitchScanner._PROXY + '/rest/ip/dhcp-server/lease', { headers: headers }).then(function(r){return r.json();}),
      fetch(SwitchScanner._PROXY + '/rest/ip/neighbor',     { headers: headers }).then(function(r){return r.json();}),
      fetch(SwitchScanner._PROXY + '/rest/interface/wireless/registration-table', { headers: headers }).then(function(r){return r.json();}),
    ]).then(function(results) {
      var arpList      = Array.isArray(results[0].value) ? results[0].value : [];
      var dhcpList     = Array.isArray(results[1].value) ? results[1].value : [];
      var neighborList = Array.isArray(results[2].value) ? results[2].value : [];
      var wifiList     = Array.isArray(results[3].value) ? results[3].value : [];

      /* Будуємо map пристроїв */
      var devices = {};

      /* 1. ARP */
      arpList.forEach(function(e) {
        if (!e['address'] || e['address'] === '0.0.0.0') return;
        var mac = (e['mac-address']||'').toUpperCase();
        var ip  = e['address'];
        var key = mac || ip;
        devices[key] = {
          ip:        ip,
          mac:       mac,
          iface:     e['interface'] || '',
          hostname:  '',
          vendor:    '',
          type:      '',
          typeIcon:  '',
          signal:    '',
          dhcpName:  '',
          comment:   '',
          openPorts: [],
          online:    true,
          source:    'ARP',
        };
      });

      /* 2. DHCP — додаємо hostname */
      dhcpList.forEach(function(e) {
        var mac = (e['mac-address']||'').toUpperCase();
        var ip  = e['address']||'';
        var key = mac || ip;
        if (devices[key]) {
          devices[key].hostname = e['host-name'] || e['comment'] || '';
          devices[key].dhcpName = e['host-name'] || '';
          devices[key].comment  = e['comment'] || '';
        } else if (ip) {
          devices[key] = {
            ip: ip, mac: mac, iface: '', hostname: e['host-name']||'',
            vendor:'', type:'', typeIcon:'', signal:'', dhcpName: e['host-name']||'',
            comment: e['comment']||'', openPorts:[], online: true, source:'DHCP',
          };
        }
      });

      /* 3. Neighbors (CDP/LLDP/MNDP) */
      neighborList.forEach(function(e) {
        var ip  = e['address']||e['ip-address']||'';
        var mac = (e['mac-address']||'').toUpperCase();
        var key = mac || ip;
        if (!ip) return;
        if (devices[key]) {
          devices[key].hostname = devices[key].hostname || e['identity'] || e['host-name'] || '';
          devices[key].comment  = e['system-description'] || devices[key].comment;
          devices[key].source  += '+LLDP';
        } else {
          devices[key] = {
            ip: ip, mac: mac, iface: e['interface']||'',
            hostname: e['identity']||e['host-name']||'',
            vendor:'', type:'', typeIcon:'', signal:'',
            dhcpName:'', comment: e['system-description']||'',
            openPorts:[], online: true, source:'LLDP/CDP',
          };
        }
      });

      /* 4. WiFi — додаємо signal */
      wifiList.forEach(function(e) {
        var mac = (e['mac-address']||'').toUpperCase();
        if (devices[mac]) {
          devices[mac].signal = e['signal-strength'] || e['rx-signal']||'';
          devices[mac].source += '+WiFi';
        }
      });

      /* Розрахунок vendor і типу */
      Object.values(devices).forEach(function(d) {
        d.vendor    = window.OUILookup ? OUILookup.lookup(d.mac) : '?';
        var devType = window.OUILookup ? OUILookup.getDeviceType(d.vendor, d.openPorts, d.hostname) : {icon:'?',type:'?'};
        d.typeIcon = devType.icon;
        d.type     = devType.type;
      });

      SwitchScanner._devices = Object.values(devices);
      SwitchScanner.setStatus(
        '✅ Знайдено: ' + SwitchScanner._devices.length + ' пристроїв',
        '#5fd0a5'
      );
      SwitchScanner.renderTable(SwitchScanner._devices);

      /* Запускаємо port scan паралельно */
      SwitchScanner.portScanAll(SwitchScanner._devices, router);
      SwitchScanner._scanning = false;
    });
  },

  /* ── Port scan через SSH ── */
  portScanAll: function(devices, router) {
    var PORTS = [80, 443, 22, 23, 8080, 8443, 502, 102, 21, 161];
    var toScan = devices.filter(function(d) { return d.ip; });
    if (!toScan.length) return;

    SwitchScanner.setStatus(
      '🔍 Сканування портів (' + toScan.length + ' пристроїв)...', '#5b9bd5'
    );

    /* Сканування по одному через SSH */
    var idx = 0;
    function scanNext() {
      if (idx >= toScan.length) {
        SwitchScanner.setStatus('✅ Сканування завершено. Знайдено: ' + toScan.length, '#5fd0a5');
        return;
      }
      var d = toScan[idx++];
      /* Перевіряємо доступність через ping */
      if (window.sshCall) {
        window.sshCall(router, '/ping address=' + d.ip + ' count=1 interval=100ms')
          .then(function(res) {
            var out = typeof res === 'string' ? res : (res&&res.output)||'';
            d.online = out.includes('received=1') || out.includes('time=');
            SwitchScanner.updateRow(d);
          })
          .catch(function() { d.online = false; SwitchScanner.updateRow(d); })
          .finally(function() { scanNext(); });
      } else {
        scanNext();
      }
    }
    scanNext();
  },

  /* ── Рендер таблиці ── */
  renderTable: function(devices) {
    var tbody = document.getElementById('ss-tbody');
    if (!tbody) return;

    /* Фільтр */
    var filter   = (document.getElementById('ss-filter')||{}).value || '';
    var typeFilter = (document.getElementById('ss-type-filter')||{}).value || '';
    var filtered = devices.filter(function(d) {
      var txt = [d.ip,d.mac,d.vendor,d.hostname,d.type,d.comment].join(' ').toLowerCase();
      var matchText = !filter || txt.includes(filter.toLowerCase());
      var matchType = !typeFilter || d.type === typeFilter;
      return matchText && matchType;
    });

    /* Сортування по IP */
    filtered.sort(function(a,b) {
      var aOcts = (a.ip||'').split('.').map(Number);
      var bOcts = (b.ip||'').split('.').map(Number);
      for (var i=0;i<4;i++) if(aOcts[i]!==bOcts[i]) return aOcts[i]-bOcts[i];
      return 0;
    });

    tbody.innerHTML = filtered.map(function(d) {
      var statusDot = d.online === true
        ? '<span style="color:#5fd0a5;">●</span>'
        : d.online === false
          ? '<span style="color:#e08080;">●</span>'
          : '<span style="color:#4a6070;">●</span>';

      var signalHtml = d.signal
        ? '<span style="color:#f0a840;font-size:11px;">📶 ' + d.signal + '</span>'
        : '';

      return '<tr class="ss-row" data-ip="' + d.ip + '" style="border-bottom:1px solid #1a2a38;cursor:pointer;" '+
        'onmouseover="this.style.background=\'#0d1a28\'" onmouseout="this.style.background=\'\'">' +
        '<td style="padding:6px 10px;font-family:monospace;font-size:12px;color:#5b9bd5;">' +
          statusDot + ' ' + (d.ip||'—') +
        '</td>' +
        '<td style="padding:6px 10px;font-family:monospace;font-size:11px;color:#8ea3b0;">' +
          (d.mac||'—') +
        '</td>' +
        '<td style="padding:6px 10px;font-size:12px;color:#c9d8e4;">' +
          (d.vendor||'Unknown') +
        '</td>' +
        '<td style="padding:6px 10px;font-size:12px;color:#5fd0a5;">' +
          d.typeIcon + ' ' + (d.type||'—') +
        '</td>' +
        '<td style="padding:6px 10px;font-size:12px;color:#c9d8e4;">' +
          (d.hostname||d.dhcpName||'—') +
        '</td>' +
        '<td style="padding:6px 10px;font-size:11px;color:#4a6070;">' +
          (d.iface||'—') +
        '</td>' +
        '<td style="padding:6px 10px;font-size:11px;">' +
          signalHtml +
        '</td>' +
        '<td style="padding:6px 10px;font-size:11px;color:#4a6070;">' +
          (d.source||'') +
        '</td>' +
        '<td style="padding:6px 6px;">' +
          '<button onclick="SwitchScanner.showDetail(\'' + d.ip + '\')" '+
          'style="background:#1a2a3a;border:1px solid #2a3b48;color:#5b9bd5;'+
          'border-radius:5px;padding:2px 8px;cursor:pointer;font-size:11px;">🔍</button>'+
          (d.ip ? '<button onclick="SwitchScanner.openWeb(\'' + d.ip + '\')" '+
          'style="background:#1a3a1a;border:1px solid #2a5a2a;color:#5fd0a5;'+
          'border-radius:5px;padding:2px 8px;cursor:pointer;font-size:11px;margin-left:3px;">🌐</button>' : '') +
        '</td>' +
        '</tr>';
    }).join('');

    /* Оновлюємо фільтр типів */
    SwitchScanner.updateTypeFilter(devices);
  },

  /* ── Оновити рядок по IP ── */
  updateRow: function(d) {
    SwitchScanner.renderTable(SwitchScanner._devices);
  },

  /* ── Деталі пристрою ── */
  showDetail: function(ip) {
    var d = SwitchScanner._devices.find(function(x){return x.ip===ip;});
    if (!d) return;
    var vendor  = d.vendor  || 'Unknown';
    var devType = d.typeIcon + ' ' + d.type;
    alert(
      '=== ' + ip + ' ===\\n' +
      'MAC: '      + (d.mac||'—') + '\\n' +
      'Vendor: '   + vendor + '\\n' +
      'Тип: '      + devType + '\\n' +
      'Hostname: ' + (d.hostname||'—') + '\\n' +
      'Interface: ' + (d.iface||'—') + '\\n' +
      'Signal: '   + (d.signal||'—') + '\\n' +
      'Source: '   + (d.source||'—') + '\\n' +
      'Comment: '  + (d.comment||'—')
    );
  },

  /* ── Відкрити Web UI пристрою ── */
  openWeb: function(ip) {
    window.open('http://' + ip, '_blank');
  },

  /* ── Оновлення статусу ── */
  setStatus: function(msg, color) {
    var el = document.getElementById('ss-status');
    if (el) { el.textContent = msg; el.style.color = color || '#5fd0a5'; }
  },

  clearTable: function() {
    var tbody = document.getElementById('ss-tbody');
    if (tbody) tbody.innerHTML =
      '<tr><td colspan="9" style="text-align:center;color:#4a6070;padding:20px;">Сканування...</td></tr>';
  },

  /* ── Фільтр типів ── */
  updateTypeFilter: function(devices) {
    var sel = document.getElementById('ss-type-filter');
    if (!sel) return;
    var types = {};
    devices.forEach(function(d) { if(d.type) types[d.type] = true; });
    var cur = sel.value;
    sel.innerHTML = '<option value="">Всі типи</option>' +
      Object.keys(types).map(function(t) {
        return '<option value="'+t+'"'+(t===cur?' selected':'')+'>'+t+'</option>';
      }).join('');
  },

  /* ── Export CSV ── */
  exportCSV: function() {
    var rows = [['IP','MAC','Vendor','Type','Hostname','Interface','Signal','Source']];
    SwitchScanner._devices.forEach(function(d) {
      rows.push([d.ip,d.mac,d.vendor,d.type,d.hostname,d.iface,d.signal,d.source]);
    });
    var csv = rows.map(function(r){return r.join(';');}).join('\\n');
    var blob = new Blob([csv], {type:'text/csv'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'network-scan-' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
  },

  showError: function(msg) {
    var el = document.getElementById('ss-status');
    if (el) { el.textContent = '❌ ' + msg; el.style.color = '#e08080'; }
  },
};
console.log('[SwitchScanner] Ready ✅');
"""

with open('ai-agent/switch-scanner.js', 'w', encoding='utf-8') as f:
    f.write(SCANNER_JS)

r2 = subprocess.run(['node','--check','ai-agent/switch-scanner.js'],
                    capture_output=True, text=True)
print('switch-scanner.js:', 'OK ✅' if r2.returncode==0 else '❌\n'+r2.stderr[:200])

# ════════════════════════════════════
# 3. Додаємо вкладку в router-manager.js
# ════════════════════════════════════
with open('router-manager.js', 'r', encoding='utf-8') as f:
    rm = f.read()

# Знаходимо де рендериться форма логіну
for kw in ['buildSkeleton','rm-login','rm-form','renderLogin']:
    idx = rm.find(kw)
    if idx > 0:
        print(f'\\n"{kw}" @ {idx}:')
        print(repr(rm[idx:idx+300]))
        break