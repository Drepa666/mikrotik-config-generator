'use strict';
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

      /* ARP — пристрій є в ARP таблиці = нещодавно активний = online */
      arpList.forEach(function(e) {
        var ip  = e['address'] || '';
        var mac = (e['mac-address'] || '').toUpperCase();
        if (!ip || ip === '0.0.0.0') return;
        /* Пропускаємо dynamic=false (статичні записи роутера) */
        var key = mac || ip;
        devices[key] = {
          ip:       ip,
          mac:      mac,
          iface:    e['interface'] || '',
          hostname: '',
          vendor:   '',
          type:     '',
          typeIcon: '',
          signal:   '',
          dhcpName: '',
          comment:  '',
          /* ARP є = нещодавно активний */
          online:   true,
          source:   'ARP',
        };
      });

      /* DHCP */
      dhcpList.forEach(function(e) {
        var mac = (e['mac-address'] || '').toUpperCase();
        var ip  = e['address'] || '';
        var key = mac || ip;
        /* Статус DHCP lease */
        var dhcpOnline = e['status'] === 'bound' || e['dynamic'] !== 'false';
        if (devices[key]) {
          devices[key].hostname = e['host-name'] || '';
          devices[key].dhcpName = e['host-name'] || '';
          devices[key].comment  = e['comment']   || '';
          /* Якщо DHCP каже bound — точно онлайн */
          if (dhcpOnline) devices[key].online = true;
          if (!devices[key].source.includes('DHCP'))
            devices[key].source += '+DHCP';
        } else if (ip) {
          devices[key] = {
            ip: ip, mac: mac, iface: '',
            hostname: e['host-name'] || '',
            vendor: '', type: '', typeIcon: '',
            signal: '', dhcpName: e['host-name'] || '',
            comment: e['comment'] || '',
            online: dhcpOnline,
            source: 'DHCP',
          };
        }
      });

      /* Neighbors — LLDP/CDP/MNDP */
      neighborList.forEach(function(e) {
        var ip  = e['address'] || e['ip-address'] || '';
        var mac = (e['mac-address'] || '').toUpperCase();
        var key = mac || ip;
        if (!ip) return;
        if (devices[key]) {
          devices[key].hostname = devices[key].hostname || e['identity'] || '';
          devices[key].comment  = e['system-description'] || devices[key].comment;
          /* Neighbor є = точно онлайн */
          devices[key].online = true;
          if (!devices[key].source.includes('LLDP'))
            devices[key].source += '+LLDP';
        } else {
          devices[key] = {
            ip: ip, mac: mac, iface: e['interface'] || '',
            hostname: e['identity'] || '',
            vendor: '', type: '', typeIcon: '',
            signal: '', dhcpName: '', comment: e['system-description'] || '',
            /* Neighbor є = онлайн */
            online: true,
            source: 'LLDP',
          };
        }
      });

      /* WiFi */
      wifiList.forEach(function(e) {
        var mac = (e['mac-address'] || '').toUpperCase();
        if (devices[mac]) {
          devices[mac].signal = e['signal-strength'] || e['rx-signal'] || '';
          /* WiFi registration = точно онлайн */
          devices[mac].online = true;
          if (!devices[mac].source.includes('WiFi'))
            devices[mac].source += '+WiFi';
        }
      });

      /* Vendor — спочатку з локальної бази, потім онлайн */
      var devList = Object.values(devices);
      devList.forEach(function(d) {
        /* Локальний lookup одразу */
        d.vendor = window.OUILookup ? OUILookup.lookup(d.mac) : 'Unknown';
        var dt = window.OUILookup
          ? OUILookup.getDeviceType(d.vendor, [], d.hostname)
          : {icon: '❓', type: 'Unknown'};
        d.typeIcon = dt.icon;
        d.type     = dt.type;
      });

      SwitchScanner._devices = devList;

      /* Онлайн lookup для Unknown — з затримкою між запитами */
      if (window.OUILookup && OUILookup.lookupOnline) {
        var unknownDevs = devList.filter(function(d) {
          return d.mac && d.vendor === 'Unknown';
        });
        console.log('[Scanner] Онлайн lookup для', unknownDevs.length, 'пристроїв');
        unknownDevs.forEach(function(d, i) {
          /* Затримка 600мс між запитами (API rate limit) */
          setTimeout(function() {
            OUILookup.lookupOnline(d.mac, function(vendor) {
              if (vendor && vendor !== 'Unknown') {
                d.vendor = vendor;
                var dt2 = OUILookup.getDeviceType(vendor, [], d.hostname);
                d.typeIcon = dt2.icon;
                d.type     = dt2.type;
                /* Оновлюємо таблицю */
                SwitchScanner.renderTable(SwitchScanner._devices);
              }
            });
          }, i * 600);
        });
      }
      SwitchScanner._scanning = false;

      var onlineCount = SwitchScanner._devices.filter(function(d){return d.online;}).length;
      var confirmedCount = SwitchScanner._devices.filter(function(d){
        return d.online && (d.source.includes('DHCP') ||
               d.source.includes('LLDP') || d.source.includes('WiFi'));
      }).length;
      var arpOnlyCount = SwitchScanner._devices.filter(function(d){
        return d.online && d.source === 'ARP';
      }).length;
      var _total   = SwitchScanner._devices.length;
      var _green   = SwitchScanner._devices.filter(function(d){
        return d.online && d.source && 
          (d.source.includes('DHCP')||d.source.includes('LLDP')||d.source.includes('WiFi'));
      }).length;
      var _yellow  = SwitchScanner._devices.filter(function(d){
        return d.online && d.source === 'ARP';
      }).length;
      SwitchScanner.setStatus(
        'Всього: ' + _total +
        '  🟢 ' + _green + ' онлайн' +
        '  🟡 ' + _yellow + ' ARP only',
        '#5fd0a5'
      );
      SwitchScanner.renderTable(SwitchScanner._devices);
      SwitchScanner.updateStats(
        SwitchScanner._devices.length,
        arpList.length,
        dhcpList.length,
        neighborList.length,
        wifiList.length
      );

      /* Ping перевірка для уточнення статусу */
      SwitchScanner.pingCheck(SwitchScanner._devices, router);

    }).catch(function(e) {
      SwitchScanner._scanning = false;
      SwitchScanner.setStatus('Помилка: ' + e, '#e08080');
    });
  },

  /* Ping перевірка через SSH */
  pingCheck: function(devices, router) {
    if (!window.sshCall) return;
    var idx = 0;
    var list = devices.filter(function(d){ return d.ip; });

    SwitchScanner.setStatus(
      'Ping перевірка (' + list.length + ' пристроїв)...', '#5b9bd5'
    );

    function next() {
      if (idx >= list.length) {
        var onlineCount = SwitchScanner._devices.filter(function(d){return d.online;}).length;
        SwitchScanner.setStatus(
          'Готово: ' + list.length + ' пристроїв, ' + onlineCount + ' онлайн',
          '#5fd0a5'
        );
        SwitchScanner.renderTable(SwitchScanner._devices);
        return;
      }
      var d = list[idx++];
      window.sshCall(router, '/ping address=' + d.ip + ' count=2 interval=100ms')
        .then(function(res) {
          var out = typeof res === 'string' ? res
                  : (res && res.output) ? res.output : '';
          /* RouterOS ping повертає received=N [1] */
          var m = out.match(/received=(\d+)/);
          var rcv = m ? parseInt(m[1]) : 0;
          d.online = rcv > 0 ||
                     out.includes('time=') ||
                     out.toLowerCase().includes('ttl=');
        })
        .catch(function() {
          /* Якщо SSH помилка — залишаємо поточний статус */
        })
        .finally(function() {
          SwitchScanner.renderTable(SwitchScanner._devices);
          /* Невелика затримка між пінгами */
          setTimeout(next, 200);
        });
    }
    next();
  },

  updateStats: function(total, arp, dhcp, nbr, wifi) {
    var map = {
      'ss-stat-total': total,
      'ss-stat-arp':   arp,
      'ss-stat-dhcp':  dhcp,
      'ss-stat-nbr':   nbr,
      'ss-stat-wifi':  wifi,
    };
    Object.keys(map).forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.textContent = map[id];
    });
  },

  renderTable: function(devices) {
    var tbody = document.getElementById('ss-tbody');
    if (!tbody) return;
    /* Легенда */
    var legendEl = document.getElementById('ss-legend');
    if (legendEl) {
      var total    = devices.length;
      var confirm  = devices.filter(function(d){ return d.online && 
        (d.source.includes('DHCP')||d.source.includes('LLDP')||d.source.includes('WiFi')); }).length;
      var arpOnly  = devices.filter(function(d){ return d.online && d.source==='ARP'; }).length;
      var offline  = devices.filter(function(d){ return !d.online; }).length;
      legendEl.innerHTML =
        '<span style="color:#5fd0a5;">🟢 ' + confirm + ' онлайн</span>' +
        '<span style="color:#f0a840;margin-left:10px;">🟡 ' + arpOnly + ' ARP</span>' +
        '<span style="color:#e08080;margin-left:10px;">🔴 ' + offline + ' офлайн</span>' +
        '<span style="color:#4a6070;margin-left:10px;">Всього: ' + total + '</span>';
    }

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

    /* Сортування по IP */
    filtered.sort(function(a, b) {
      var ao = (a.ip || '0.0.0.0').split('.').map(Number);
      var bo = (b.ip || '0.0.0.0').split('.').map(Number);
      for (var i = 0; i < 4; i++) if (ao[i] !== bo[i]) return ao[i] - bo[i];
      return 0;
    });

    if (filtered.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="8" style="text-align:center;color:#4a6070;padding:30px;">' +
        'Нічого не знайдено</td></tr>';
      return;
    }

    /* Рендеримо без одинарних лапок в атрибутах */
    var rows = filtered.map(function(d) {
      /* 🟢 ARP+DHCP/LLDP = онлайн, 🟡 тільки ARP = можливо онлайн, 🔴 офлайн */
      var confirmed = d.source && (
        d.source.includes('DHCP') ||
        d.source.includes('LLDP') ||
        d.source.includes('WiFi')
      );
      var dotColor = !d.online   ? '#e08080'
                   : confirmed   ? '#5fd0a5'
                   : '#f0a840';
      var dotTitle = !d.online   ? 'Offline'
                   : confirmed   ? 'Online'
                   : 'ARP only';

      var vendorHtml = (d.vendor && d.vendor !== 'Unknown')
        ? '<div style="color:#5b9bd5;font-size:11px;">' + esc(d.vendor) + '</div>'
        : '<div style="color:#3a5060;font-size:11px;">Unknown</div>';

      var typeHtml = d.type
        ? '<span style="background:#1a2a1a;border:1px solid #2a4a2a;border-radius:4px;' +
          'padding:1px 6px;font-size:11px;color:#5fd0a5;">' +
          d.typeIcon + ' ' + esc(d.type) + '</span>'
        : '<span style="color:#4a6070;">—</span>';

      var signalHtml = d.signal
        ? '<span style="color:#f0a840;font-size:11px;">📶 ' + esc(d.signal) + '</span>'
        : '<span style="color:#3a5060;">—</span>';

      var sourceParts = d.source.split('+');
      var sourceColors = {ARP:'#1a3a1a',DHCP:'#1a1a3a',LLDP:'#3a2a1a',WiFi:'#2a1a3a'};
      var sourceHtml = sourceParts.map(function(s) {
        var c = sourceColors[s.trim()] || '#1a2a38';
        return '<span style="background:' + c + ';border-radius:3px;' +
          'padding:1px 5px;font-size:10px;margin:1px;display:inline-block;">' +
          esc(s.trim()) + '</span>';
      }).join('');

      var ipEsc  = esc(d.ip  || '');
      var macEsc = esc(d.mac || '');

      return '<tr class="ss-row" data-ip="' + ipEsc + '">' +
        '<td style="padding:6px 10px;">' +
          '<span style="color:' + dotColor + ';font-size:12px;" title="' + dotTitle + '">●</span> ' +
          '<span style="font-family:monospace;font-size:12px;color:#5b9bd5;">' + ipEsc + '</span>' +
        '</td>' +
        '<td style="padding:6px 10px;">' +
          '<div style="font-family:monospace;font-size:11px;color:#8ea3b0;">' + macEsc + '</div>' +
          vendorHtml +
        '</td>' +
        '<td style="padding:6px 10px;">' + typeHtml + '</td>' +
        '<td style="padding:6px 10px;font-size:12px;color:#c9d8e4;">' +
          esc(d.hostname || d.dhcpName || '') +
        '</td>' +
        '<td style="padding:6px 10px;font-size:11px;color:#4a6070;">' +
          esc(d.iface || '—') +
        '</td>' +
        '<td style="padding:6px 10px;">' + signalHtml + '</td>' +
        '<td style="padding:6px 10px;">' + sourceHtml + '</td>' +
        '<td style="padding:6px 8px;white-space:nowrap;">' +
          '<button class="ss-detail-btn" data-ip="' + ipEsc + '" ' +
          'style="background:#1a2a3a;border:1px solid #2a3b48;color:#5b9bd5;' +
          'border-radius:5px;padding:2px 6px;cursor:pointer;font-size:11px;margin-right:3px;">' +
          '🔍</button>' +
          '<button class="ss-web-btn" data-ip="' + ipEsc + '" ' +
          'style="background:#1a3a1a;border:1px solid #2a5a2a;color:#5fd0a5;' +
          'border-radius:5px;padding:2px 6px;cursor:pointer;font-size:11px;">' +
          '🌐</button>' +
        '</td>' +
        '</tr>';
    }).join('');

    tbody.innerHTML = rows;

    /* Event delegation — без inline onclick */
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
    tbody.querySelectorAll('.ss-row').forEach(function(row) {
      row.addEventListener('mouseover', function() {
        this.style.background = '#0d1a28';
      });
      row.addEventListener('mouseout', function() {
        this.style.background = '';
      });
    });

    SwitchScanner.updateFilters(devices);
  },

  updateFilters: function(devices) {
    var tSel = document.getElementById('ss-type-filter');
    var iSel = document.getElementById('ss-iface-filter');
    var types  = {};
    var ifaces = {};
    devices.forEach(function(d) {
      if (d.type)  types[d.type]   = true;
      if (d.iface) ifaces[d.iface] = true;
    });
    if (tSel) {
      var tv = tSel.value;
      tSel.innerHTML = '<option value="">Всі типи</option>' +
        Object.keys(types).map(function(t) {
          return '<option value="' + esc(t) + '"' + (t===tv?' selected':'') +
            '>' + esc(t) + '</option>';
        }).join('');
    }
    if (iSel) {
      var iv = iSel.value;
      iSel.innerHTML = '<option value="">Всі інтерфейси</option>' +
        Object.keys(ifaces).map(function(i) {
          return '<option value="' + esc(i) + '"' + (i===iv?' selected':'') +
            '>' + esc(i) + '</option>';
        }).join('');
    }
  },

  showDetail: function(ip) {
    var d = SwitchScanner._devices.find(function(x) { return x.ip === ip; });
    if (!d) return;
    var old = document.getElementById('ss-detail-panel');
    if (old) old.remove();

    var panel = document.createElement('div');
    panel.id = 'ss-detail-panel';
    panel.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'background:#0d1117', 'border:1px solid #2a3b48',
      'border-radius:12px', 'padding:20px 24px',
      'z-index:9999999', 'min-width:340px',
      'box-shadow:0 8px 40px rgba(0,0,0,.8)',
    ].join(';');

    var fields = [
      ['IP',         d.ip        || '—'],
      ['MAC',        d.mac       || '—'],
      ['Vendor',     d.vendor    || '—'],
      ['Тип',        d.typeIcon + ' ' + (d.type || '—')],
      ['Hostname',   d.hostname  || d.dhcpName || '—'],
      ['Interface',  d.iface     || '—'],
      ['Signal',     d.signal    || '—'],
      ['Статус',     d.online ? '🟢 Онлайн' : '🔴 Офлайн'],
      ['Source',     d.source    || '—'],
      ['Comment',    d.comment   || '—'],
    ];

    var tableRows = fields.map(function(f) {
      return '<tr>' +
        '<td style="color:#4a6070;padding:4px 0;padding-right:16px;font-size:12px;">' +
          esc(f[0]) +
        '</td>' +
        '<td style="color:#c9d8e4;font-family:monospace;font-size:12px;">' +
          esc(f[1]) +
        '</td>' +
        '</tr>';
    }).join('');

    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;' +
        'align-items:center;margin-bottom:14px;">' +
        '<span style="color:#5fd0a5;font-weight:700;font-size:14px;">' +
          d.typeIcon + ' ' + esc(d.ip) +
        '</span>' +
        '<button id="ss-detail-close" style="background:transparent;' +
          'border:1px solid #2a3b48;color:#4a6070;border-radius:5px;' +
          'padding:2px 8px;cursor:pointer;">✕</button>' +
      '</div>' +
      '<table style="width:100%;border-collapse:collapse;">' +
        tableRows +
      '</table>' +
      '<div style="margin-top:14px;display:flex;gap:8px;">' +
        '<button id="ss-open-web" style="background:#1a3a1a;border:1px solid #2a5a2a;' +
          'color:#5fd0a5;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px;flex:1;">' +
          '🌐 Відкрити Web UI' +
        '</button>' +
        '<button id="ss-copy-ip" style="background:#1a2a3a;border:1px solid #2a3b48;' +
          'color:#5b9bd5;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px;">' +
          '📋 IP' +
        '</button>' +
        '<button id="ss-copy-mac" style="background:#1a2a3a;border:1px solid #2a3b48;' +
          'color:#5b9bd5;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px;">' +
          '📋 MAC' +
        '</button>' +
      '</div>';

    document.body.appendChild(panel);

    document.getElementById('ss-detail-close').onclick = function() { panel.remove(); };
    document.getElementById('ss-open-web').onclick     = function() {
      window.open('http://' + d.ip, '_blank');
    };
    document.getElementById('ss-copy-ip').onclick  = function() {
      navigator.clipboard.writeText(d.ip);
      this.textContent = '✅ IP';
      var btn = this;
      setTimeout(function(){ btn.textContent = '📋 IP'; }, 1500);
    };
    document.getElementById('ss-copy-mac').onclick = function() {
      navigator.clipboard.writeText(d.mac || '');
      this.textContent = '✅ MAC';
      var btn = this;
      setTimeout(function(){ btn.textContent = '📋 MAC'; }, 1500);
    };
  },

  exportCSV: function() {
    var rows = [['IP','MAC','Vendor','Type','Hostname','Interface','Signal','Online','Source','Comment']];
    SwitchScanner._devices.forEach(function(d) {
      rows.push([
        d.ip, d.mac, d.vendor, d.type, d.hostname,
        d.iface, d.signal, d.online ? 'yes' : 'no',
        d.source, d.comment,
      ]);
    });
    var csv = rows.map(function(r) {
      return r.map(function(c) {
        return '"' + (c || '').toString().replace(/"/g, '""') + '"';
      }).join(';');
    }).join('\n');
    var blob = new Blob(['\ufeff' + csv], {type: 'text/csv;charset=utf-8'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'network-scan-' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  },

  setStatus: function(msg, color) {
    var el = document.getElementById('ss-status');
    if (el) { el.textContent = msg; el.style.color = color || '#5fd0a5'; }
  },


  /* ── Діалог прямого сканування свіча ── */
  showDirectScanDialog: function() {
    var old = document.getElementById('ss-direct-dialog');
    if (old) { old.remove(); return; }

    var dlg = document.createElement('div');
    dlg.id = 'ss-direct-dialog';
    dlg.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'background:#0d1117', 'border:1px solid #3a2a5a',
      'border-radius:12px', 'padding:24px 28px',
      'z-index:9999999', 'min-width:360px',
      'box-shadow:0 8px 40px rgba(0,0,0,.8)',
    ].join(';');

    dlg.innerHTML =
      '<div style="color:#c084fc;font-weight:700;font-size:15px;margin-bottom:16px;">' +
        '🔌 Пряме сканування мережі' +
      '</div>' +
      '<div style="color:#8ea3b0;font-size:12px;margin-bottom:16px;line-height:1.6;">' +
        'Підключіться кабелем до свіча або мережі.<br>' +
        'Сканер знайде всі пристрої без MikroTik.' +
      '</div>' +
      /* Підмережа */
      '<div style="margin-bottom:12px;">' +
        '<label style="color:#4a6070;font-size:11px;">Підмережа для сканування:</label>' +
        '<div style="display:flex;gap:8px;margin-top:4px;">' +
          '<input id="ss-direct-subnet" type="text" value="192.168.1" ' +
            'style="flex:1;background:#060d14;border:1px solid #1c2a37;' +
            'color:#e6edf3;padding:6px 10px;border-radius:6px;font-size:13px;">' +
          '<span style="color:#4a6070;line-height:32px;font-size:13px;">.0/24</span>' +
        '</div>' +
      '</div>' +
      /* SNMP */
      '<div style="margin-bottom:16px;">' +
        '<label style="color:#4a6070;font-size:11px;">' +
          'SNMP Community (для керованих свічів):' +
        '</label>' +
        '<input id="ss-direct-snmp" type="text" value="public" ' +
          'style="width:100%;box-sizing:border-box;background:#060d14;' +
          'border:1px solid #1c2a37;color:#e6edf3;padding:6px 10px;' +
          'border-radius:6px;font-size:13px;margin-top:4px;">' +
      '</div>' +
      /* Що сканувати */
      '<div style="margin-bottom:16px;">' +
        '<label style="color:#4a6070;font-size:11px;">Що шукаємо:</label>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">' +
          ['🔌 Свічі', '📷 Камери', '☀️ Інвертори',
           '⚙️ Контролери', '💡 Smart Home', '❓ Всі пристрої'].map(function(t) {
            return '<label style="display:flex;align-items:center;gap:4px;' +
              'color:#c9d8e4;font-size:12px;cursor:pointer;">' +
              '<input type="checkbox" checked style="accent-color:#c084fc;"> ' + t + '</label>';
          }).join('') +
        '</div>' +
      '</div>' +
      /* Кнопки */
      '<div style="display:flex;gap:8px;">' +
        '<button id="ss-direct-scan-btn" ' +
          'style="background:linear-gradient(135deg,#2a1a4a,#3a2a6a);' +
          'border:1px solid #5a3a9a;color:#c084fc;border-radius:8px;' +
          'padding:8px 20px;cursor:pointer;font-size:13px;font-weight:700;flex:1;">' +
          '🔍 Сканувати' +
        '</button>' +
        '<button id="ss-direct-cancel" ' +
          'style="background:transparent;border:1px solid #2a3b48;' +
          'color:#4a6070;border-radius:8px;padding:8px 16px;cursor:pointer;font-size:12px;">' +
          '✕ Скасувати' +
        '</button>' +
      '</div>';

    document.body.appendChild(dlg);

    document.getElementById('ss-direct-cancel').onclick = function() { dlg.remove(); };
    document.getElementById('ss-direct-scan-btn').onclick = function() {
      var subnet = document.getElementById('ss-direct-subnet').value.trim();
      var snmp   = document.getElementById('ss-direct-snmp').value.trim();
      dlg.remove();
      SwitchScanner.scanDirect(subnet, snmp);
    };
  },

  /* ── Пряме сканування без роутера ── */
  scanDirect: function(subnet, snmpCommunity) {
    if (!subnet) subnet = '192.168.1';
    snmpCommunity = snmpCommunity || 'public';
    SwitchScanner._scanning = true;
    SwitchScanner._devices  = [];
    SwitchScanner.setStatus('⏳ Сканування ' + subnet + '.0/24...', '#c084fc');
    SwitchScanner.clearTable();

    /* Electron IPC — прямий ARP/ping scan */
    var _ipc = window.electronAPI || (window.require && window.require('electron').ipcRenderer);
    if (!_ipc || !_ipc.invoke) {
      SwitchScanner.setStatus('❌ IPC недоступний', '#e08080');
      SwitchScanner._scanning = false;
      return;
    }
    _ipc.invoke('direct-scan', { subnet: subnet, timeout: 2000 })
    .then(function(data) {
      if (data && data.ok === false) {
        SwitchScanner.setStatus('❌ ' + (data.error||'Помилка сканування'), '#e08080');
        SwitchScanner._scanning = false;
        return;
      }
      var devs = Array.isArray(data) ? data
               : Array.isArray(data.devices) ? data.devices : [];

      devs.forEach(function(d) {
        d.vendor   = window.OUILookup ? OUILookup.lookup(d.mac||'') : 'Unknown';
        var dt     = window.OUILookup
          ? OUILookup.getDeviceType(d.vendor, d.openPorts||[], d.hostname||'')
          : {icon:'❓', type:'Unknown'};
        d.typeIcon = dt.icon;
        d.type     = dt.type;
        d.online   = true;
        d.source   = d.source || 'Direct';
      });

      /* OUI онлайн lookup для Unknown */
      if (window.OUILookup && OUILookup.lookupOnline) {
        devs.filter(function(d){return d.vendor==='Unknown';})
            .forEach(function(d, i) {
          setTimeout(function() {
            OUILookup.lookupOnline(d.mac, function(v) {
              if (v && v !== 'Unknown') {
                d.vendor = v;
                var dt2 = OUILookup.getDeviceType(v, [], d.hostname||'');
                d.typeIcon = dt2.icon;
                d.type     = dt2.type;
                SwitchScanner.renderTable(SwitchScanner._devices);
              }
            });
          }, i * 600);
        });
      }

      SwitchScanner._devices  = devs;
      SwitchScanner._scanning = false;
      SwitchScanner.setStatus(
        '✅ Знайдено: ' + devs.length + ' пристроїв (пряме сканування)',
        '#c084fc'
      );
      SwitchScanner.renderTable(devs);
      SwitchScanner.updateStats(devs.length, devs.length, 0, 0, 0);
    })
    .catch(function(e) {
      SwitchScanner._scanning = false;
      /* Fallback — якщо backend не підтримує /direct-scan */
      SwitchScanner.setStatus(
        '⚠️ Backend не підтримує прямий скан. Додайте /direct-scan endpoint. ' + e,
        '#f0a840'
      );
      console.error('[DirectScan]', e);
    });
  },

  clearTable: function() {
    var tbody = document.getElementById('ss-tbody');
    if (tbody) tbody.innerHTML =
      '<tr><td colspan="8" style="text-align:center;color:#4a6070;padding:30px;">' +
      '⏳ Сканування...</td></tr>';
  },
};

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

console.log('[SwitchScanner] Ready ✅');
