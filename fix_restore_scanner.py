# -*- coding: utf-8 -*-
import subprocess, os, re

# ════════════════════════════════════
# 1. Знаходимо робочий commit switch-scanner.js
# ════════════════════════════════════
print('Шукаємо робочий commit для switch-scanner.js...')
log = subprocess.run(
    ['git','log','--oneline','-20','--','ai-agent/switch-scanner.js'],
    capture_output=True, text=True
).stdout
print(log)

# Перебираємо commits — знаходимо перший з непустим файлом
restored = False
for line in log.strip().split('\n'):
    if not line.strip(): continue
    sha = line.split()[0]
    # Перевіряємо розмір файлу в цьому commit
    size_out = subprocess.run(
        ['git','show', sha + ':ai-agent/switch-scanner.js'],
        capture_output=True
    )
    size = len(size_out.stdout)
    print(f'  {sha}: {size} bytes')
    if size > 1000:
        # Відновлюємо
        subprocess.run(
            ['git','checkout', sha,'--','ai-agent/switch-scanner.js'],
            capture_output=True
        )
        print(f'OK: відновлено з {sha} ({size} bytes)')
        restored = True
        break

if not restored:
    print('WARN: не знайдено в git — пишемо заново')

# ════════════════════════════════════
# 2. Перевіряємо відновлений файл
# ════════════════════════════════════
size = os.path.getsize('ai-agent/switch-scanner.js')
print(f'switch-scanner.js: {size} bytes')

r = subprocess.run(['node','--check','ai-agent/switch-scanner.js'],
                   capture_output=True, text=True)
print('Синтаксис:', 'OK' if r.returncode==0 else '❌\n'+r.stderr[:200])

if r.returncode != 0 or size < 100:
    print('Файл зламаний або порожній — пишемо з нуля')
    # Далі буде написано новий файл
    write_new = True
else:
    write_new = False

# ════════════════════════════════════
# 3. Якщо треба — пишемо новий switch-scanner.js
# ════════════════════════════════════
if write_new:
    SCANNER = r"""'use strict';
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
      SwitchScanner.setStatus('No router connected', '#e08080');
      SwitchScanner._scanning = false;
      return;
    }
    SwitchScanner.setStatus('Reading MikroTik data...', '#f0a840');
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
        devices[mac || ip] = {
          ip: ip, mac: mac, iface: e['interface'] || '',
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
          if (e['status'] === 'bound') devices[key].online = true;
          if (!devices[key].source.includes('DHCP'))
            devices[key].source += '+DHCP';
        } else if (ip) {
          devices[key] = {
            ip: ip, mac: mac, iface: '',
            hostname: e['host-name'] || '',
            vendor: '', type: '', typeIcon: '',
            signal: '', dhcpName: e['host-name'] || '',
            comment: e['comment'] || '',
            online: e['status'] === 'bound',
            source: 'DHCP',
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
          devices[key].online   = true;
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
          devices[mac].online = true;
          if (!devices[mac].source.includes('WiFi'))
            devices[mac].source += '+WiFi';
        }
      });

      Object.values(devices).forEach(function(d) {
        d.vendor = window.OUILookup ? OUILookup.lookup(d.mac) : 'Unknown';
        var dt   = window.OUILookup
          ? OUILookup.getDeviceType(d.vendor, [], d.hostname)
          : {icon: '?', type: 'Unknown'};
        d.typeIcon = dt.icon;
        d.type     = dt.type;
      });

      SwitchScanner._devices = Object.values(devices);
      SwitchScanner._scanning = false;

      /* Online OUI lookup */
      if (window.OUILookup && OUILookup.lookupOnline) {
        SwitchScanner._devices
          .filter(function(d){ return d.mac && d.vendor === 'Unknown'; })
          .forEach(function(d, i) {
            setTimeout(function() {
              OUILookup.lookupOnline(d.mac, function(v) {
                if (v && v !== 'Unknown') {
                  d.vendor = v;
                  var dt2 = OUILookup.getDeviceType(v, [], d.hostname);
                  d.typeIcon = dt2.icon;
                  d.type     = dt2.type;
                  SwitchScanner.renderTable(SwitchScanner._devices);
                }
              });
            }, i * 600);
          });
      }

      var green  = SwitchScanner._devices.filter(function(d) {
        return d.online && d.source &&
          (d.source.includes('DHCP') ||
           d.source.includes('LLDP') ||
           d.source.includes('WiFi'));
      }).length;
      var yellow = SwitchScanner._devices.filter(function(d) {
        return d.online && d.source === 'ARP';
      }).length;

      SwitchScanner.setStatus(
        'Found: ' + SwitchScanner._devices.length +
        ' | Online: ' + green +
        ' | ARP: ' + yellow,
        '#5fd0a5'
      );
      SwitchScanner.renderTable(SwitchScanner._devices);
      SwitchScanner.updateStats(
        SwitchScanner._devices.length,
        arpList.length, dhcpList.length,
        neighborList.length, wifiList.length
      );
    }).catch(function(e) {
      SwitchScanner._scanning = false;
      SwitchScanner.setStatus('Error: ' + e, '#e08080');
    });
  },

  renderTable: function(devices) {
    var tbody = document.getElementById('ss-tbody');
    if (!tbody) return;

    var textFilter  = (document.getElementById('ss-search')      || {}).value   || '';
    var typeFilter  = (document.getElementById('ss-type-filter') || {}).value   || '';
    var ifaceFilter = (document.getElementById('ss-iface-filter')|| {}).value   || '';
    var onlineOnly  = (document.getElementById('ss-online-only') || {}).checked || false;

    var filtered = devices.filter(function(d) {
      var txt = [d.ip, d.mac, d.vendor, d.hostname, d.type, d.comment]
        .join(' ').toLowerCase();
      if (textFilter  && !txt.includes(textFilter.toLowerCase())) return false;
      if (typeFilter  && d.type  !== typeFilter)  return false;
      if (ifaceFilter && d.iface !== ifaceFilter) return false;
      if (onlineOnly  && !d.online) return false;
      return true;
    });

    filtered.sort(function(a, b) {
      var ao = (a.ip||'0.0.0.0').split('.').map(Number);
      var bo = (b.ip||'0.0.0.0').split('.').map(Number);
      for (var i = 0; i < 4; i++) if (ao[i] !== bo[i]) return ao[i] - bo[i];
      return 0;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;'
        + 'color:#4a6070;padding:30px;">No devices found</td></tr>';
      return;
    }

    var rows = filtered.map(function(d) {
      /* GREEN = DHCP/LLDP/WiFi confirmed, YELLOW = ARP only, RED = offline */
      var confirmed = d.source && (
        d.source.includes('DHCP') ||
        d.source.includes('LLDP') ||
        d.source.includes('WiFi')
      );
      var dotColor = !d.online  ? '#e08080'
                   : confirmed  ? '#5fd0a5'
                   : '#f0a840';
      var dotTitle = !d.online  ? 'Offline'
                   : confirmed  ? 'Online (confirmed)'
                   : 'ARP only';

      var vendorHtml = (d.vendor && d.vendor !== 'Unknown')
        ? '<div style="color:#5b9bd5;font-size:11px;">' + esc(d.vendor) + '</div>'
        : '<div style="color:#3a5060;font-size:11px;">Unknown</div>';

      var typeHtml = d.type
        ? '<span style="background:#1a2a1a;border:1px solid #2a4a2a;border-radius:4px;'
          + 'padding:1px 6px;font-size:11px;color:#5fd0a5;">'
          + esc(d.typeIcon) + ' ' + esc(d.type) + '</span>'
        : '<span style="color:#4a6070;">—</span>';

      var sourceParts = (d.source||'').split('+');
      var srcColors = {ARP:'#1a3a1a',DHCP:'#1a1a3a',LLDP:'#3a2a1a',WiFi:'#2a1a3a'};
      var sourceHtml = sourceParts.map(function(s) {
        return '<span style="background:'+(srcColors[s.trim()]||'#1a2a38')
          + ';border-radius:3px;padding:1px 5px;font-size:10px;margin:1px;'
          + 'display:inline-block;">' + esc(s.trim()) + '</span>';
      }).join('');

      return '<tr data-ip="' + esc(d.ip) + '">'
        + '<td style="padding:6px 10px;">'
          + '<span style="color:' + dotColor + ';font-size:12px;" title="'
          + dotTitle + '">&#9679;</span> '
          + '<span style="font-family:monospace;font-size:12px;color:#5b9bd5;">'
          + esc(d.ip) + '</span></td>'
        + '<td style="padding:6px 10px;">'
          + '<div style="font-family:monospace;font-size:11px;color:#8ea3b0;">'
          + esc(d.mac||'—') + '</div>' + vendorHtml + '</td>'
        + '<td style="padding:6px 10px;">' + typeHtml + '</td>'
        + '<td style="padding:6px 10px;font-size:12px;color:#c9d8e4;">'
          + esc(d.hostname||d.dhcpName||'—') + '</td>'
        + '<td style="padding:6px 10px;font-size:11px;color:#4a6070;">'
          + esc(d.iface||'—') + '</td>'
        + '<td style="padding:6px 10px;font-size:11px;color:#f0a840;">'
          + (d.signal ? '&#128246; ' + esc(d.signal) : '—') + '</td>'
        + '<td style="padding:6px 10px;">' + sourceHtml + '</td>'
        + '<td style="padding:6px 8px;white-space:nowrap;">'
          + '<button class="ss-detail-btn" data-ip="' + esc(d.ip) + '" '
          + 'style="background:#1a2a3a;border:1px solid #2a3b48;color:#5b9bd5;'
          + 'border-radius:5px;padding:2px 6px;cursor:pointer;font-size:11px;'
          + 'margin-right:3px;">&#128269;</button>'
          + '<button class="ss-web-btn" data-ip="' + esc(d.ip) + '" '
          + 'style="background:#1a3a1a;border:1px solid #2a5a2a;color:#5fd0a5;'
          + 'border-radius:5px;padding:2px 6px;cursor:pointer;font-size:11px;">'
          + '&#127760;</button>'
        + '</td></tr>';
    }).join('');

    tbody.innerHTML = rows;

    tbody.querySelectorAll('.ss-detail-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        SwitchScanner.showDetail(this.dataset.ip);
      });
    });
    tbody.querySelectorAll('.ss-web-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        window.open('http://' + this.dataset.ip, '_blank');
      });
    });
    tbody.querySelectorAll('tr[data-ip]').forEach(function(row) {
      row.addEventListener('mouseover', function() { this.style.background='#0d1a28'; });
      row.addEventListener('mouseout',  function() { this.style.background=''; });
    });

    SwitchScanner.updateFilters(devices);
  },

  updateFilters: function(devices) {
    var tSel = document.getElementById('ss-type-filter');
    var iSel = document.getElementById('ss-iface-filter');
    var types = {}, ifaces = {};
    devices.forEach(function(d) {
      if (d.type)  types[d.type]   = true;
      if (d.iface) ifaces[d.iface] = true;
    });
    if (tSel) {
      var tv = tSel.value;
      tSel.innerHTML = '<option value="">All types</option>'
        + Object.keys(types).map(function(t) {
          return '<option value="' + esc(t) + '"'
            + (t===tv?' selected':'') + '>' + esc(t) + '</option>';
        }).join('');
    }
    if (iSel) {
      var iv = iSel.value;
      iSel.innerHTML = '<option value="">All interfaces</option>'
        + Object.keys(ifaces).map(function(i) {
          return '<option value="' + esc(i) + '"'
            + (i===iv?' selected':'') + '>' + esc(i) + '</option>';
        }).join('');
    }
  },

  updateStats: function(total, arp, dhcp, nbr, wifi) {
    var map = {
      'ss-stat-total': total, 'ss-stat-arp': arp,
      'ss-stat-dhcp': dhcp, 'ss-stat-nbr': nbr, 'ss-stat-wifi': wifi,
    };
    Object.keys(map).forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.textContent = map[id];
    });
  },

  showDetail: function(ip) {
    var d = SwitchScanner._devices.find(function(x) { return x.ip === ip; });
    if (!d) return;
    var old = document.getElementById('ss-detail-panel');
    if (old) old.remove();
    var panel = document.createElement('div');
    panel.id = 'ss-detail-panel';
    panel.style.cssText = 'position:fixed;top:50%;left:50%;'
      + 'transform:translate(-50%,-50%);background:#0d1117;'
      + 'border:1px solid #2a3b48;border-radius:12px;padding:20px 24px;'
      + 'z-index:9999999;min-width:340px;box-shadow:0 8px 40px rgba(0,0,0,.8);';
    var fields = [
      ['IP',        d.ip        || '—'],
      ['MAC',       d.mac       || '—'],
      ['Vendor',    d.vendor    || '—'],
      ['Type',      d.typeIcon + ' ' + (d.type || '—')],
      ['Hostname',  d.hostname  || d.dhcpName || '—'],
      ['Interface', d.iface     || '—'],
      ['Signal',    d.signal    || '—'],
      ['Status',    d.online ? 'Online' : 'Offline'],
      ['Source',    d.source    || '—'],
    ];
    var rows = fields.map(function(f) {
      return '<tr><td style="color:#4a6070;padding:4px 0;padding-right:16px;'
        + 'font-size:12px;">' + esc(f[0]) + '</td>'
        + '<td style="color:#c9d8e4;font-family:monospace;font-size:12px;">'
        + esc(f[1]) + '</td></tr>';
    }).join('');
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;'
        + 'align-items:center;margin-bottom:14px;">'
        + '<span style="color:#5fd0a5;font-weight:700;font-size:14px;">'
        + esc(d.typeIcon) + ' ' + esc(d.ip) + '</span>'
        + '<button id="ss-dp-close" style="background:transparent;'
        + 'border:1px solid #2a3b48;color:#4a6070;border-radius:5px;'
        + 'padding:2px 8px;cursor:pointer;">&#10005;</button></div>'
      + '<table style="width:100%;border-collapse:collapse;">' + rows + '</table>'
      + '<div style="margin-top:14px;display:flex;gap:8px;">'
        + '<button id="ss-dp-web" style="background:#1a3a1a;border:1px solid #2a5a2a;'
        + 'color:#5fd0a5;border-radius:6px;padding:6px 12px;cursor:pointer;'
        + 'font-size:12px;flex:1;">&#127760; Open Web UI</button>'
        + '<button id="ss-dp-cpip" style="background:#1a2a3a;border:1px solid #2a3b48;'
        + 'color:#5b9bd5;border-radius:6px;padding:6px 12px;cursor:pointer;'
        + 'font-size:12px;">&#128203; IP</button>'
        + '<button id="ss-dp-cpmac" style="background:#1a2a3a;border:1px solid #2a3b48;'
        + 'color:#5b9bd5;border-radius:6px;padding:6px 12px;cursor:pointer;'
        + 'font-size:12px;">&#128203; MAC</button>'
      + '</div>';
    document.body.appendChild(panel);
    document.getElementById('ss-dp-close').onclick = function() { panel.remove(); };
    document.getElementById('ss-dp-web').onclick = function() {
      window.open('http://' + d.ip, '_blank');
    };
    document.getElementById('ss-dp-cpip').onclick = function() {
      navigator.clipboard.writeText(d.ip);
      this.textContent = 'Copied!';
      var b = this; setTimeout(function(){ b.innerHTML = '&#128203; IP'; }, 1500);
    };
    document.getElementById('ss-dp-cpmac').onclick = function() {
      navigator.clipboard.writeText(d.mac||'');
      this.textContent = 'Copied!';
      var b = this; setTimeout(function(){ b.innerHTML = '&#128203; MAC'; }, 1500);
    };
  },

  showDirectScanDialog: function() {
    var old = document.getElementById('ss-direct-dialog');
    if (old) { old.remove(); return; }
    var dlg = document.createElement('div');
    dlg.id = 'ss-direct-dialog';
    dlg.style.cssText = 'position:fixed;top:50%;left:50%;'
      + 'transform:translate(-50%,-50%);background:#0d1117;'
      + 'border:1px solid #3a2a5a;border-radius:12px;padding:24px 28px;'
      + 'z-index:9999999;min-width:360px;box-shadow:0 8px 40px rgba(0,0,0,.8);';
    dlg.innerHTML =
      '<div style="color:#c084fc;font-weight:700;font-size:15px;margin-bottom:16px;">'
        + '&#128268; Direct Network Scan</div>'
      + '<div style="color:#8ea3b0;font-size:12px;margin-bottom:16px;line-height:1.6;">'
        + 'Connect cable to switch/network.<br>Scans without MikroTik router.</div>'
      + '<div style="margin-bottom:12px;">'
        + '<label style="color:#4a6070;font-size:11px;">Subnet:</label>'
        + '<div style="display:flex;gap:8px;margin-top:4px;">'
          + '<input id="ss-direct-subnet" type="text" value="192.168.88" '
          + 'style="flex:1;background:#060d14;border:1px solid #1c2a37;'
          + 'color:#e6edf3;padding:6px 10px;border-radius:6px;font-size:13px;">'
          + '<span style="color:#4a6070;line-height:32px;">.0/24</span>'
        + '</div></div>'
      + '<div style="display:flex;gap:8px;margin-top:16px;">'
        + '<button id="ss-direct-scan-btn" style="background:linear-gradient('
        + '135deg,#2a1a4a,#3a2a6a);border:1px solid #5a3a9a;color:#c084fc;'
        + 'border-radius:8px;padding:8px 20px;cursor:pointer;font-size:13px;'
        + 'font-weight:700;flex:1;">&#128269; Scan</button>'
        + '<button id="ss-direct-cancel" style="background:transparent;'
        + 'border:1px solid #2a3b48;color:#4a6070;border-radius:8px;'
        + 'padding:8px 16px;cursor:pointer;font-size:12px;">&#10005;</button>'
      + '</div>';
    document.body.appendChild(dlg);
    document.getElementById('ss-direct-cancel').onclick = function() { dlg.remove(); };
    document.getElementById('ss-direct-scan-btn').onclick = function() {
      var subnet = document.getElementById('ss-direct-subnet').value.trim();
      dlg.remove();
      SwitchScanner.scanDirect(subnet);
    };
  },

  scanDirect: function(subnet) {
    if (!subnet) subnet = '192.168.88';
    SwitchScanner._scanning = true;
    SwitchScanner._devices  = [];
    SwitchScanner.setStatus('Scanning ' + subnet + '.0/24...', '#c084fc');
    SwitchScanner.clearTable();
    if (!window.electronAPI || !window.electronAPI.directScan) {
      SwitchScanner.setStatus('electronAPI.directScan not available', '#e08080');
      SwitchScanner._scanning = false;
      return;
    }
    window.electronAPI.directScan({ subnet: subnet, timeout: 2000 })
      .then(function(data) {
        if (data && data.ok === false) {
          SwitchScanner.setStatus('Error: ' + (data.error||'unknown'), '#e08080');
          SwitchScanner._scanning = false;
          return;
        }
        var devs = Array.isArray(data) ? data
                 : Array.isArray(data.devices) ? data.devices : [];
        devs.forEach(function(d) {
          d.vendor = window.OUILookup ? OUILookup.lookup(d.mac||'') : 'Unknown';
          var dt   = window.OUILookup
            ? OUILookup.getDeviceType(d.vendor, [], d.hostname||'')
            : {icon:'?', type:'Unknown'};
          d.typeIcon = dt.icon;
          d.type     = dt.type;
          d.online   = true;
          d.source   = d.source || 'Direct';
        });
        SwitchScanner._devices  = devs;
        SwitchScanner._scanning = false;
        SwitchScanner.setStatus('Found: ' + devs.length + ' devices (direct scan)', '#c084fc');
        SwitchScanner.renderTable(devs);
        SwitchScanner.updateStats(devs.length, devs.length, 0, 0, 0);
      })
      .catch(function(e) {
        SwitchScanner._scanning = false;
        SwitchScanner.setStatus('Error: ' + e, '#e08080');
      });
  },

  exportCSV: function() {
    var rows = [['IP','MAC','Vendor','Type','Hostname','Interface','Signal','Online','Source']];
    SwitchScanner._devices.forEach(function(d) {
      rows.push([d.ip,d.mac,d.vendor,d.type,d.hostname,d.iface,d.signal,
                 d.online?'yes':'no',d.source]);
    });
    var csv = rows.map(function(r) {
      return r.map(function(c) {
        return '"' + (c||'').toString().replace(/"/g,'""') + '"';
      }).join(';');
    }).join('\n');
    var blob = new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'scan-' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  },

  setStatus: function(msg, color) {
    var el = document.getElementById('ss-status');
    if (el) { el.textContent = msg; el.style.color = color || '#5fd0a5'; }
  },

  clearTable: function() {
    var tbody = document.getElementById('ss-tbody');
    if (tbody) tbody.innerHTML =
      '<tr><td colspan="8" style="text-align:center;color:#4a6070;padding:30px;">'
      + '&#9203; Scanning...</td></tr>';
  },

  _showTab: function(tab) {
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
  },
};

function esc(s) {
  return String(s||'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

console.log('[SwitchScanner] Ready');
"""
    with open('ai-agent/switch-scanner.js', 'w', encoding='utf-8') as f:
        f.write(SCANNER)
    print('OK: switch-scanner.js написано заново')

# ════════════════════════════════════
# 4. Фінальна перевірка
# ════════════════════════════════════
import os
for fname in ['ai-agent/switch-scanner.js', 'router-manager.js',
              'topology-visual.js', 'preload.js']:
    size = os.path.getsize(fname)
    r = subprocess.run(['node','--check', fname], capture_output=True, text=True)
    print(f'{"OK" if r.returncode==0 else "❌"} {fname} ({size}b)')

# Git
subprocess.run(['git','add','-A'], capture_output=True)
subprocess.run(['git','commit','-m',
    'fix: restore switch-scanner.js (was 0 bytes), green/yellow/red dots'],
    capture_output=True)
r_p = subprocess.run(['git','push','origin','main'], capture_output=True, text=True)
print('push:', r_p.stdout.strip() or r_p.stderr.strip()[-60:])
print('\nDone! npm start')