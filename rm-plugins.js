'use strict';

/* ============================================================
   RM Plugins — Plugin System
   - Advanced IP Scanner
   - Advanced Port Scanner
   - Install / Uninstall система
   ============================================================ */

(function() {

  function esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function restCall(r,m,p,b) { return window.RMRestCall(r,m,p,b); }
  function sshCall(r,c)      { return window.RMSshCall(r,c); }
  function router()  { return window.RMStore ? window.RMStore.getRouter() : null; }
  function cont()    { return document.getElementById('rm-content'); }

  /* ══════════════════════════════════════════════════════════
     PLUGIN REGISTRY — реєстр плагінів
     ══════════════════════════════════════════════════════════ */
  var PLUGIN_REGISTRY = {
    'ip-scanner': {
      id:      'ip-scanner',
      icon:    '🔍',
      label:   'IP Scanner',
      desc:    'Сканування мережі — знаходить всі активні хости (як Advanced IP Scanner)',
      version: '1.0',
      author:  'RM Built-in',
      fn:      'rmPluginIPScanner',
    },
    'port-scanner': {
      id:      'port-scanner',
      icon:    '🔌',
      label:   'Port Scanner',
      desc:    'Сканування портів хоста — відкриті/закриті (як Advanced Port Scanner)',
      version: '1.0',
      author:  'RM Built-in',
      fn:      'rmPluginPortScanner',
    },
    'arp-table': {
      id:      'arp-table',
      icon:    '📋',
      label:   'ARP Table',
      desc:    'Перегляд ARP таблиці роутера з пошуком по MAC та IP',
      version: '1.0',
      author:  'RM Built-in',
      fn:      'rmPluginARPTable',
    },
    'mac-vendor': {
      id:      'mac-vendor',
      icon:    '🏷️',
      label:   'MAC Vendor Lookup',
      desc:    'Визначення виробника пристрою по MAC адресі',
      version: '1.0',
      author:  'RM Built-in',
      fn:      'rmPluginMACVendor',
    },
    'bandwidth-test': {
      id:      'bandwidth-test',
      icon:    '📶',
      label:   'Bandwidth Test',
      desc:    'Тест пропускної здатності між роутером і клієнтом',
      version: '1.0',
      author:  'RM Built-in',
      fn:      'rmPluginBandwidthTest',
    },
    'ping-tool': {
      id:      'ping-tool',
      icon:    '📡',
      label:   'Ping Tool',
      desc:    'Ping і Traceroute прямо з роутера',
      version: '1.0',
      author:  'RM Built-in',
      fn:      'rmPluginPingTool',
    },
  };

  /* ── Зберігаємо встановлені плагіни в localStorage ── */
  var STORAGE_KEY = 'rm_plugins_installed';

  function getInstalled() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : ['ip-scanner','port-scanner'];
    } catch(e) {
      return ['ip-scanner','port-scanner'];
    }
  }

  function saveInstalled(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch(e) {}
  }

  function isInstalled(id) {
    return getInstalled().indexOf(id) >= 0;
  }

  function installPlugin(id) {
    var list = getInstalled();
    if (list.indexOf(id) < 0) { list.push(id); saveInstalled(list); }
    rebuildPluginMenu();
  }

  function uninstallPlugin(id) {
    var list = getInstalled().filter(function(x) { return x !== id; });
    saveInstalled(list);
    rebuildPluginMenu();
  }

  /* ── Rebuild menu після install/uninstall ── */
  function rebuildPluginMenu() {
    /* Шукаємо separator плагінів і перебудовуємо */
    var overlay = document.getElementById('rm-overlay');
    if (!overlay) return;

    var installed = getInstalled();

    /* Видаляємо старі пункти плагінів */
    overlay.querySelectorAll('[data-plugin-item]').forEach(function(el) {
      el.remove();
    });

    /* Знаходимо пункт "Plugins" в меню */
    var pluginsItem = null;
    overlay.querySelectorAll('[data-id]').forEach(function(el) {
      if (el.dataset.id === 'plugins') pluginsItem = el;
    });

    if (!pluginsItem) return;

    /* Вставляємо пункти встановлених плагінів після "Plugins" */
    var after = pluginsItem.nextSibling;
    installed.forEach(function(id) {
      var plugin = PLUGIN_REGISTRY[id];
      if (!plugin) return;

      var item = document.createElement('div');
      item.dataset.id = 'plugin-' + id;
      item.dataset.pluginItem = '1';
      item.className = pluginsItem.className.replace('active','');
      item.style.paddingLeft = '28px';
      item.style.fontSize = '12px';
      item.innerHTML = plugin.icon + ' ' + plugin.label;
      item.addEventListener('click', function() {
        if (window[plugin.fn]) window[plugin.fn]();
      });

      pluginsItem.parentNode.insertBefore(item, after);
    });
  }

  /* ══════════════════════════════════════════════════════════
     PLUGINS MENU — головна сторінка плагінів
     ══════════════════════════════════════════════════════════ */
  window.rmSectionPlugins = function() {
    var c = cont(); if (!c) return;

    injectStyles();

    var installed = getInstalled();

    var html = '<div class="rm-section-title">🧩 Plugins' +
      '<div style="margin-left:auto;">' +
        '<button class="rm-btn rm-btn-secondary" style="font-size:11px;" onclick="window.rmSectionPlugins()">🔄</button>' +
      '</div>' +
    '</div>';

    /* Встановлені плагіни */
    html += '<div style="margin-bottom:6px;font-size:11px;color:#8ea3b0;text-transform:uppercase;letter-spacing:.06em;">✅ Встановлені (' + installed.length + ')</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;margin-bottom:20px;">';

    installed.forEach(function(id) {
      var p = PLUGIN_REGISTRY[id];
      if (!p) return;
      html += pluginCard(p, true);
    });

    if (!installed.length) {
      html += '<div style="color:#4a6070;padding:20px;grid-column:1/-1;">Немає встановлених плагінів</div>';
    }

    html += '</div>';

    /* Доступні плагіни */
    var available = Object.keys(PLUGIN_REGISTRY).filter(function(id) {
      return installed.indexOf(id) < 0;
    });

    if (available.length) {
      html += '<div style="margin-bottom:6px;font-size:11px;color:#8ea3b0;text-transform:uppercase;letter-spacing:.06em;">📦 Доступні (' + available.length + ')</div>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;">';
      available.forEach(function(id) {
        var p = PLUGIN_REGISTRY[id];
        if (!p) return;
        html += pluginCard(p, false);
      });
      html += '</div>';
    }

    c.innerHTML = html;

    window.__rmRefreshSection = function() { window.rmSectionPlugins(); };
  };

  function pluginCard(p, installed) {
    return '<div class="rm-plugin-card">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">' +
        '<span style="font-size:24px;">' + p.icon + '</span>' +
        '<div>' +
          '<div style="font-weight:600;font-size:13px;color:#e6edf3;">' + esc(p.label) + '</div>' +
          '<div style="font-size:10px;color:#4a6070;">v' + esc(p.version) + ' · ' + esc(p.author) + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="font-size:11px;color:#8ea3b0;margin-bottom:10px;line-height:1.5;">' + esc(p.desc) + '</div>' +
      '<div style="display:flex;gap:6px;">' +
        (installed ?
          '<button class="rm-btn rm-btn-primary" style="font-size:11px;flex:1;" onclick="window[' + "'" + p.fn + "'" + '] && window[' + "'" + p.fn + "'" + ']()">' +
            '▶ Відкрити</button>' +
          '<button class="rm-btn rm-btn-danger" style="font-size:11px;" onclick="window._rmUninstallPlugin(' + "'" + p.id + "'" + ')" title="Видалити плагін">' +
            '🗑 Видалити</button>' :
          '<button class="rm-btn rm-btn-secondary" style="font-size:11px;flex:1;" onclick="window._rmInstallPlugin(' + "'" + p.id + "'" + ')">' +
            '📦 Встановити</button>'
        ) +
      '</div>' +
    '</div>';
  }

  window._rmInstallPlugin = function(id) {
    installPlugin(id);
    if (window.showNotif) window.showNotif('ok', '✅ Плагін встановлено', PLUGIN_REGISTRY[id].label);
    window.rmSectionPlugins();
  };

  window._rmUninstallPlugin = function(id) {
    var p = PLUGIN_REGISTRY[id];
    if (!p) return;
    if (!confirm('Видалити плагін "' + p.label + '" з меню?')) return;
    uninstallPlugin(id);
    if (window.showNotif) window.showNotif('warn', '🗑 Плагін видалено', p.label + ' видалено з меню');
    window.rmSectionPlugins();
  };

  /* ══════════════════════════════════════════════════════════
     PLUGIN 1: ADVANCED IP SCANNER
     ══════════════════════════════════════════════════════════ */
  window.rmPluginIPScanner = function() {
    var r = router(); if (!r) return;
    var c = cont(); if (!c) return;
    injectStyles();

    c.innerHTML =
      '<div class="rm-section-title">🔍 Advanced IP Scanner' +
        '<div style="margin-left:auto;display:flex;gap:6px;">' +
          '<button class="rm-btn rm-btn-secondary" style="font-size:11px;" onclick="window.rmSectionPlugins()">← Плагіни</button>' +
        '</div>' +
      '</div>' +
      '<div class="rm-plugin-scanner-wrap">' +

        /* Налаштування */
        '<div class="rm-dash-card" style="margin-bottom:12px;">' +
          '<h4>⚙️ Параметри сканування</h4>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:end;">' +
            '<div>' +
              '<label style="font-size:11px;color:#8ea3b0;">IP діапазон (початок)</label>' +
              '<input id="rm-scan-from" type="text" value="192.168.88.1" style="width:100%;box-sizing:border-box;">' +
            '</div>' +
            '<div>' +
              '<label style="font-size:11px;color:#8ea3b0;">IP діапазон (кінець)</label>' +
              '<input id="rm-scan-to" type="text" value="192.168.88.254" style="width:100%;box-sizing:border-box;">' +
            '</div>' +
            '<div>' +
              '<label style="font-size:11px;color:#8ea3b0;">Timeout (мс)</label>' +
              '<input id="rm-scan-timeout" type="number" value="500" min="100" max="5000" style="width:100px;box-sizing:border-box;">' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;margin-top:12px;align-items:center;">' +
            '<button class="rm-btn rm-btn-primary" id="rm-scan-btn" onclick="window._rmStartIPScan()">🔍 Сканувати</button>' +
            '<button class="rm-btn rm-btn-secondary" id="rm-scan-stop" style="display:none;" onclick="window._rmStopIPScan()">■ Стоп</button>' +
            '<div id="rm-scan-progress" style="flex:1;"></div>' +
          '</div>' +
          '<div id="rm-scan-pbar-wrap" style="display:none;margin-top:8px;">' +
            '<div style="background:#1a2d3d;border-radius:4px;height:6px;overflow:hidden;">' +
              '<div id="rm-scan-pbar" style="height:100%;background:#5fd0a5;width:0%;transition:width .3s;border-radius:4px;"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* Результати */
        '<div class="rm-dash-card">' +
          '<h4>📊 Результати <span id="rm-scan-count" style="color:#5fd0a5;"></span></h4>' +
          '<div style="display:flex;gap:8px;margin-bottom:10px;">' +
            '<input id="rm-scan-filter" type="text" placeholder="Фільтр по IP або MAC..." ' +
              'style="flex:1;background:#0d1821;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:6px 10px;font-size:11px;outline:none;" ' +
              'oninput="window._rmFilterScanResults(this.value)">' +
            '<button class="rm-btn rm-btn-secondary" style="font-size:11px;" onclick="window._rmExportScanCSV()">📥 CSV</button>' +
          '</div>' +
          '<div id="rm-scan-results">' +
            '<div style="color:#4a6070;padding:20px;text-align:center;font-size:12px;">Запусти сканування для отримання результатів</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    /* Стан сканування */
    window._rmScanResults = [];
    window._rmScanRunning = false;
    window._rmScanAbort   = false;

    window._rmStartIPScan = function() {
      var fromIP   = document.getElementById('rm-scan-from').value.trim();
      var toIP     = document.getElementById('rm-scan-to').value.trim();
      var timeout  = parseInt(document.getElementById('rm-scan-timeout').value) || 500;

      var fromParts = fromIP.split('.').map(Number);
      var toParts   = toIP.split('.').map(Number);

      if (fromParts.length !== 4 || toParts.length !== 4) {
        alert('Невірний формат IP!'); return;
      }

      /* Генеруємо список IP для сканування */
      var ips = [];
      var prefix = fromParts.slice(0,3).join('.');
      var startOctet = fromParts[3];
      var endOctet   = toParts[3];

      for (var i = startOctet; i <= endOctet; i++) {
        ips.push(prefix + '.' + i);
      }

      window._rmScanResults = [];
      window._rmScanAbort   = false;
      window._rmScanRunning = true;

      document.getElementById('rm-scan-btn').style.display  = 'none';
      document.getElementById('rm-scan-stop').style.display = 'inline-block';
      document.getElementById('rm-scan-pbar-wrap').style.display = 'block';
      document.getElementById('rm-scan-results').innerHTML =
        '<div style="color:#8ea3b0;padding:20px;text-align:center;font-size:12px;">⏳ Сканування...</div>';

      /* Спочатку отримуємо ARP таблицю роутера для MAC адрес */
      restCall(r, 'GET', '/ip/arp').then(function(arpTable) {
        var arpMap = {};
        if (Array.isArray(arpTable)) {
          arpTable.forEach(function(entry) {
            if (entry.address && entry['mac-address']) {
              arpMap[entry.address] = entry['mac-address'];
            }
          });
        }

        /* Отримуємо DHCP leases для hostname */
        return restCall(r, 'GET', '/ip/dhcp-server/lease').then(function(leases) {
          var hostnameMap = {};
          var ifaceMap    = {};
          if (Array.isArray(leases)) {
            leases.forEach(function(l) {
              if (l.address) {
                hostnameMap[l.address] = l['host-name'] || '';
                ifaceMap[l.address]    = l['active-mac-address'] || l['mac-address'] || '';
              }
            });
          }
          return { arpMap: arpMap, hostnameMap: hostnameMap, ifaceMap: ifaceMap };
        }).catch(function() {
          return { arpMap: arpMap, hostnameMap: {}, ifaceMap: {} };
        });
      }).then(function(maps) {

        /* Сканування через ping з роутера */
        var total   = ips.length;
        var done    = 0;
        var active  = 0;

        /* Паралельне сканування — по 20 IP одночасно */
        var BATCH = 20;
        var idx   = 0;

        function scanNext() {
          if (window._rmScanAbort) {
            finishScan();
            return;
          }

          if (idx >= total) {
            /* Чекаємо поки всі завершаться */
            if (done >= total) finishScan();
            return;
          }

          var ip = ips[idx++];

          /* Ping через роутер */
          sshCall(r, '/ping ' + ip + ' count=1 interval=100ms').then(function(res) {
            done++;
            var pct = Math.round((done / total) * 100);
            var pbar = document.getElementById('rm-scan-pbar');
            if (pbar) pbar.style.width = pct + '%';
            var prog = document.getElementById('rm-scan-progress');
            if (prog) prog.innerHTML =
              '<span style="font-size:11px;color:#8ea3b0;">' + done + '/' + total + ' — ' +
              '<span style="color:#5fd0a5;">' + active + ' знайдено</span></span>';

            var isAlive = res && res.ok && (
              res.output && (
                res.output.includes('received=1') ||
                res.output.includes('host is alive') ||
                !res.output.includes('received=0')
              )
            );

            if (isAlive) {
              active++;
              var mac      = maps.arpMap[ip] || maps.ifaceMap[ip] || '—';
              var hostname = maps.hostnameMap[ip] || '';
              window._rmScanResults.push({
                ip: ip, mac: mac, hostname: hostname, status: 'online'
              });
              renderScanResults(window._rmScanResults);
            }

            if (done >= total && !window._rmScanAbort) finishScan();
          }).catch(function() {
            done++;
            if (done >= total && !window._rmScanAbort) finishScan();
          });

          /* Якщо не досягли ліміту — запускаємо наступний */
          if (idx < total && (idx - done) < BATCH) scanNext();
        }

        /* Запускаємо BATCH паралельних сканувань */
        for (var b = 0; b < Math.min(BATCH, total); b++) scanNext();

      }).catch(function(e) {
        alert('Помилка: ' + e);
        finishScan();
      });

      function finishScan() {
        window._rmScanRunning = false;
        var btn  = document.getElementById('rm-scan-btn');
        var stop = document.getElementById('rm-scan-stop');
        if (btn)  btn.style.display  = 'inline-block';
        if (stop) stop.style.display = 'none';
        var prog = document.getElementById('rm-scan-progress');
        if (prog) prog.innerHTML =
          '<span style="font-size:11px;color:#5fd0a5;">✅ Сканування завершено</span>';
        renderScanResults(window._rmScanResults);
      }
    };

    window._rmStopIPScan = function() {
      window._rmScanAbort = true;
    };

    window._rmFilterScanResults = function(q) {
      var filtered = window._rmScanResults.filter(function(r) {
        return r.ip.includes(q) || r.mac.toLowerCase().includes(q.toLowerCase()) ||
               r.hostname.toLowerCase().includes(q.toLowerCase());
      });
      renderScanResults(filtered, true);
    };

    window._rmExportScanCSV = function() {
      var csv = 'IP,MAC,Hostname,Status\n';
      window._rmScanResults.forEach(function(r) {
        csv += r.ip + ',' + r.mac + ',' + r.hostname + ',' + r.status + '\n';
      });
      var blob = new Blob([csv], { type: 'text/csv' });
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a');
      a.href   = url;
      a.download = 'ip-scan-' + new Date().toISOString().slice(0,10) + '.csv';
      a.click();
      URL.revokeObjectURL(url);
    };

    function renderScanResults(results, filtered) {
      var el = document.getElementById('rm-scan-results');
      var cnt = document.getElementById('rm-scan-count');
      if (!el) return;
      if (cnt) cnt.textContent = results.length + ' хостів' + (filtered ? ' (фільтр)' : '');

      if (!results.length) {
        el.innerHTML = '<div style="color:#4a6070;padding:20px;text-align:center;font-size:12px;">' +
          (window._rmScanRunning ? '⏳ Шукаємо...' : '😕 Нічого не знайдено') + '</div>';
        return;
      }

      var html = '<table class="rm-table rm-table-compact">' +
        '<tr><th>IP адреса</th><th>MAC адреса</th><th>Hostname</th><th>Виробник</th><th style="text-align:right;">Дії</th></tr>';

      results.forEach(function(host) {
        var vendor = getMACVendor(host.mac);
        html += '<tr>' +
          '<td><b style="color:#5fd0a5;">' + esc(host.ip) + '</b></td>' +
          '<td style="font-family:monospace;font-size:11px;">' + esc(host.mac) + '</td>' +
          '<td style="font-size:11px;">' + esc(host.hostname || '—') + '</td>' +
          '<td style="font-size:11px;color:#8ea3b0;">' + esc(vendor) + '</td>' +
          '<td style="text-align:right;white-space:nowrap;">' +
            '<button class="rm-act-btn rm-act-edit" style="font-size:10px;" ' +
              'onclick="document.getElementById(\'rm-portscan-ip\')&&(document.getElementById(\'rm-portscan-ip\').value=\'' + esc(host.ip) + '\');window.rmPluginPortScanner()"' +
              ' title="Сканувати порти">🔌</button>' +
            '<button class="rm-act-btn rm-act-edit" style="font-size:10px;" ' +
              'onclick="window.rmPluginPingTool&&window.rmPluginPingTool(\'' + esc(host.ip) + '\')"' +
              ' title="Ping">📡</button>' +
          '</td></tr>';
      });

      html += '</table>';
      el.innerHTML = html;
    }
  };

  /* ══════════════════════════════════════════════════════════
     PLUGIN 2: ADVANCED PORT SCANNER
     ══════════════════════════════════════════════════════════ */
  window.rmPluginPortScanner = function(targetIP) {
    var r = router(); if (!r) return;
    var c = cont(); if (!c) return;
    injectStyles();

    var COMMON_PORTS = [
      { port: 21,   proto:'tcp', name:'FTP' },
      { port: 22,   proto:'tcp', name:'SSH' },
      { port: 23,   proto:'tcp', name:'Telnet' },
      { port: 25,   proto:'tcp', name:'SMTP' },
      { port: 53,   proto:'tcp', name:'DNS' },
      { port: 80,   proto:'tcp', name:'HTTP' },
      { port: 110,  proto:'tcp', name:'POP3' },
      { port: 143,  proto:'tcp', name:'IMAP' },
      { port: 443,  proto:'tcp', name:'HTTPS' },
      { port: 445,  proto:'tcp', name:'SMB' },
      { port: 3306, proto:'tcp', name:'MySQL' },
      { port: 3389, proto:'tcp', name:'RDP' },
      { port: 5900, proto:'tcp', name:'VNC' },
      { port: 8080, proto:'tcp', name:'HTTP Alt' },
      { port: 8443, proto:'tcp', name:'HTTPS Alt' },
      { port: 8728, proto:'tcp', name:'MikroTik API' },
      { port: 8729, proto:'tcp', name:'MikroTik API-SSL' },
      { port: 51820,proto:'udp', name:'WireGuard' },
    ];

    c.innerHTML =
      '<div class="rm-section-title">🔌 Advanced Port Scanner' +
        '<div style="margin-left:auto;display:flex;gap:6px;">' +
          '<button class="rm-btn rm-btn-secondary" style="font-size:11px;" onclick="window.rmSectionPlugins()">← Плагіни</button>' +
        '</div>' +
      '</div>' +
      '<div class="rm-dash-card" style="margin-bottom:12px;">' +
        '<h4>⚙️ Параметри сканування</h4>' +
        '<div style="display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:end;margin-bottom:12px;">' +
          '<div>' +
            '<label style="font-size:11px;color:#8ea3b0;">IP адреса хоста</label>' +
            '<input id="rm-portscan-ip" type="text" value="' + esc(targetIP || '192.168.88.1') + '" style="width:100%;box-sizing:border-box;">' +
          '</div>' +
          '<div>' +
            '<label style="font-size:11px;color:#8ea3b0;">Порти (напр. 1-1024 або 80,443,22)</label>' +
            '<input id="rm-portscan-range" type="text" value="1-1024" style="width:200px;box-sizing:border-box;">' +
          '</div>' +
          '<div>' +
            '<label style="font-size:11px;color:#8ea3b0;">Timeout (мс)</label>' +
            '<input id="rm-portscan-timeout" type="number" value="300" min="100" max="3000" style="width:90px;box-sizing:border-box;">' +
          '</div>' +
        '</div>' +

        /* Швидкі пресети */
        '<div style="margin-bottom:12px;">' +
          '<span style="font-size:11px;color:#8ea3b0;margin-right:6px;">Пресети:</span>' +
          presetBtn('Загальні (18)', '21,22,23,25,53,80,110,143,443,445,3306,3389,5900,8080,8443,8728,8729,51820') +
          presetBtn('HTTP/HTTPS', '80,443,8080,8443,8888') +
          presetBtn('MikroTik', '21,22,23,80,443,8291,8728,8729') +
          presetBtn('Бази даних', '1433,1521,3306,5432,6379,27017') +
          presetBtn('1-1024', '1-1024') +
          presetBtn('1-65535', '1-65535') +
        '</div>' +

        '<div style="display:flex;gap:8px;align-items:center;">' +
          '<button class="rm-btn rm-btn-primary" id="rm-portscan-btn" onclick="window._rmStartPortScan()">🔌 Сканувати</button>' +
          '<button class="rm-btn rm-btn-secondary" id="rm-portscan-stop" style="display:none;" onclick="window._rmStopPortScan()">■ Стоп</button>' +
          '<div id="rm-portscan-progress" style="flex:1;font-size:11px;color:#8ea3b0;"></div>' +
        '</div>' +
        '<div id="rm-portscan-pbar-wrap" style="display:none;margin-top:8px;">' +
          '<div style="background:#1a2d3d;border-radius:4px;height:6px;overflow:hidden;">' +
            '<div id="rm-portscan-pbar" style="height:100%;background:#5fd0a5;width:0%;transition:width .2s;border-radius:4px;"></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      /* Результати */
      '<div class="rm-dash-card">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
          '<h4 style="margin:0;">📊 Результати</h4>' +
          '<span id="rm-portscan-stats" style="font-size:11px;color:#8ea3b0;"></span>' +
          '<button class="rm-btn rm-btn-secondary" style="font-size:11px;margin-left:auto;" onclick="window._rmExportPortCSV()">📥 CSV</button>' +
        '</div>' +
        '<div id="rm-portscan-results">' +
          '<div style="color:#4a6070;padding:20px;text-align:center;font-size:12px;">Запусти сканування для отримання результатів</div>' +
        '</div>' +
      '</div>';

    window._rmPortScanResults = [];
    window._rmPortScanAbort   = false;

    window._rmStartPortScan = function() {
      var ip      = document.getElementById('rm-portscan-ip').value.trim();
      var range   = document.getElementById('rm-portscan-range').value.trim();
      var timeout = parseInt(document.getElementById('rm-portscan-timeout').value) || 300;

      if (!ip) { alert('Введи IP!'); return; }

      /* Парсимо порти */
      var ports = [];
      var parts = range.split(',');
      parts.forEach(function(part) {
        part = part.trim();
        if (part.includes('-')) {
          var bounds = part.split('-').map(Number);
          for (var p = bounds[0]; p <= bounds[1]; p++) ports.push(p);
        } else {
          var n = parseInt(part);
          if (n > 0 && n <= 65535) ports.push(n);
        }
      });

      if (!ports.length) { alert('Неправильний діапазон портів!'); return; }
      if (ports.length > 10000) {
        if (!confirm('Сканування ' + ports.length + ' портів може зайняти довго. Продовжити?')) return;
      }

      window._rmPortScanResults = [];
      window._rmPortScanAbort   = false;

      document.getElementById('rm-portscan-btn').style.display  = 'none';
      document.getElementById('rm-portscan-stop').style.display = 'inline-block';
      document.getElementById('rm-portscan-pbar-wrap').style.display = 'block';
      document.getElementById('rm-portscan-results').innerHTML =
        '<div style="color:#8ea3b0;padding:20px;text-align:center;font-size:12px;">⏳ Сканування ' + ports.length + ' портів...</div>';

      var total = ports.length;
      var done  = 0;
      var open  = 0;
      var BATCH = 10; /* паралельних запитів */
      var idx   = 0;

      function scanPort() {
        if (window._rmPortScanAbort) { finishPortScan(); return; }
        if (idx >= total)            { if (done >= total) finishPortScan(); return; }

        var port = ports[idx++];

        /* Використовуємо fetch-tcp через proxy або SSH ping з роутера */
        var cmd = '/tool fetch url="http://' + ip + ':' + port + '/" duration=0.3s as-value output=none';

        sshCall(r, cmd).then(function(res) {
          done++;
          updateProgress();
          /* Якщо fetch досяг порту — він відкритий */
          var isOpen = res && res.output && (
            res.output.includes('status=finished') ||
            res.output.includes('downloaded') ||
            !res.output.includes('CONNECTION REFUSED') &&
            !res.output.includes('connection refused') &&
            !res.output.includes('timed out') &&
            !res.output.includes('error')
          );

          /* Альтернативний метод — через /tool fetch тільки TCP connect */
          if (isOpen) {
            open++;
            var portInfo = COMMON_PORTS.find(function(p) { return p.port === port; });
            window._rmPortScanResults.push({
              port:    port,
              proto:   'tcp',
              state:   'open',
              service: portInfo ? portInfo.name : '',
            });
            renderPortResults(window._rmPortScanResults);
          }
          if (done >= total) finishPortScan();
          else scanPort();
        }).catch(function() {
          done++;
          updateProgress();
          if (done >= total) finishPortScan();
          else scanPort();
        });
      }

      function updateProgress() {
        var pct  = Math.round((done / total) * 100);
        var pbar = document.getElementById('rm-portscan-pbar');
        if (pbar) pbar.style.width = pct + '%';
        var prog = document.getElementById('rm-portscan-progress');
        if (prog) prog.innerHTML = done + '/' + total + ' портів — ' +
          '<span style="color:#5fd0a5;">' + open + ' відкритих</span>';
      }

      function finishPortScan() {
        window._rmPortScanAbort = false;
        var btn  = document.getElementById('rm-portscan-btn');
        var stop = document.getElementById('rm-portscan-stop');
        if (btn)  btn.style.display  = 'inline-block';
        if (stop) stop.style.display = 'none';
        var prog = document.getElementById('rm-portscan-progress');
        if (prog) prog.innerHTML =
          '<span style="color:#5fd0a5;">✅ Завершено — ' + open + ' відкритих портів з ' + total + '</span>';
        renderPortResults(window._rmPortScanResults);
      }

      /* Запускаємо BATCH паралельних */
      for (var b = 0; b < Math.min(BATCH, total); b++) scanPort();
    };

    window._rmStopPortScan = function() {
      window._rmPortScanAbort = true;
    };

    window._rmExportPortCSV = function() {
      var ip = document.getElementById('rm-portscan-ip').value.trim();
      var csv = 'IP,Port,Protocol,State,Service\n';
      window._rmPortScanResults.forEach(function(p) {
        csv += ip + ',' + p.port + ',' + p.proto + ',' + p.state + ',' + p.service + '\n';
      });
      var blob = new Blob([csv], { type: 'text/csv' });
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a'); a.href = url;
      a.download = 'port-scan-' + ip + '-' + new Date().toISOString().slice(0,10) + '.csv';
      a.click(); URL.revokeObjectURL(url);
    };

    function renderPortResults(results) {
      var el   = document.getElementById('rm-portscan-results');
      var stat = document.getElementById('rm-portscan-stats');
      if (!el) return;
      if (stat) stat.textContent = results.length + ' відкритих портів';

      if (!results.length) {
        el.innerHTML = '<div style="color:#4a6070;padding:20px;text-align:center;font-size:12px;">Відкритих портів не знайдено</div>';
        return;
      }

      var html = '<table class="rm-table rm-table-compact">' +
        '<tr><th>Порт</th><th>Протокол</th><th>Сервіс</th><th>Стан</th></tr>';

      results.sort(function(a,b) { return a.port - b.port; }).forEach(function(p) {
        html += '<tr>' +
          '<td><b style="color:#5fd0a5;">' + p.port + '</b></td>' +
          '<td style="font-size:11px;">' + esc(p.proto) + '</td>' +
          '<td style="font-size:11px;color:#f0a840;">' + esc(p.service || '—') + '</td>' +
          '<td><span class="rm-badge">🟢 Open</span></td>' +
        '</tr>';
      });
      html += '</table>';
      el.innerHTML = html;
    }
  };

  /* ══════════════════════════════════════════════════════════
     PLUGIN 3: ARP TABLE
     ══════════════════════════════════════════════════════════ */
  window.rmPluginARPTable = function() {
    var r = router(); if (!r) return;
    var c = cont(); if (!c) return;

    c.innerHTML = '<div style="display:flex;align-items:center;gap:12px;padding:20px;"><div style="width:20px;height:20px;border:2px solid #2f7a5c;border-top-color:#5fd0a5;border-radius:50%;animation:rm-spin 1s linear infinite;"></div><div style="color:#8ea3b0;">Завантаження ARP таблиці...</div></div>';

    restCall(r, 'GET', '/ip/arp').then(function(arp) {
      var html = '<div class="rm-section-title">📋 ARP Table' +
        '<div style="margin-left:auto;"><button class="rm-btn rm-btn-secondary" style="font-size:11px;" onclick="window.rmSectionPlugins()">← Плагіни</button></div>' +
      '</div>';

      if (!Array.isArray(arp) || !arp.length) {
        c.innerHTML = html + '<div style="color:#4a6070;padding:20px;text-align:center;">ARP таблиця порожня</div>';
        return;
      }

      html += '<div style="margin-bottom:10px;">' +
        '<input type="text" placeholder="Фільтр по IP або MAC..." ' +
          'style="width:100%;box-sizing:border-box;background:#0d1821;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:7px 10px;font-size:11px;outline:none;" ' +
          'oninput="window._rmFilterARP(this.value)">' +
      '</div>';

      html += '<table class="rm-table rm-table-compact" id="rm-arp-table">' +
        '<tr><th>IP адреса</th><th>MAC адреса</th><th>Interface</th><th>Виробник</th><th>Dynamic</th></tr>';

      arp.forEach(function(entry) {
        var vendor = getMACVendor(entry['mac-address'] || '');
        html += '<tr data-ip="' + esc(entry.address||'') + '" data-mac="' + esc(entry['mac-address']||'') + '">' +
          '<td><b>' + esc(entry.address||'') + '</b></td>' +
          '<td style="font-family:monospace;font-size:11px;">' + esc(entry['mac-address']||'—') + '</td>' +
          '<td style="font-size:11px;">' + esc(entry.interface||'') + '</td>' +
          '<td style="font-size:11px;color:#8ea3b0;">' + esc(vendor) + '</td>' +
          '<td>' + (entry.dynamic === 'true' ? '<span class="rm-badge">Dynamic</span>' : '<span style="color:#4a6070;font-size:11px;">Static</span>') + '</td>' +
        '</tr>';
      });

      html += '</table>';
      c.innerHTML = html;

      window._rmFilterARP = function(q) {
        var rows = document.querySelectorAll('#rm-arp-table tr:not(:first-child)');
        rows.forEach(function(row) {
          var ip  = row.dataset.ip  || '';
          var mac = row.dataset.mac || '';
          row.style.display = (ip.includes(q) || mac.toLowerCase().includes(q.toLowerCase())) ? '' : 'none';
        });
      };
    });
  };

  /* ══════════════════════════════════════════════════════════
     PLUGIN 4: PING TOOL
     ══════════════════════════════════════════════════════════ */
  window.rmPluginPingTool = function(prefilledIP) {
    var r = router(); if (!r) return;
    var c = cont(); if (!c) return;

    c.innerHTML =
      '<div class="rm-section-title">📡 Ping Tool' +
        '<div style="margin-left:auto;"><button class="rm-btn rm-btn-secondary" style="font-size:11px;" onclick="window.rmSectionPlugins()">← Плагіни</button></div>' +
      '</div>' +
      '<div class="rm-dash-card" style="margin-bottom:12px;">' +
        '<div style="display:grid;grid-template-columns:1fr auto auto auto;gap:10px;align-items:end;margin-bottom:12px;">' +
          '<div><label style="font-size:11px;color:#8ea3b0;">Хост або IP</label>' +
            '<input id="rm-ping-host" type="text" value="' + esc(prefilledIP || '8.8.8.8') + '" style="width:100%;box-sizing:border-box;"></div>' +
          '<div><label style="font-size:11px;color:#8ea3b0;">Count</label>' +
            '<input id="rm-ping-count" type="number" value="4" min="1" max="100" style="width:70px;box-sizing:border-box;"></div>' +
          '<div><label style="font-size:11px;color:#8ea3b0;">&nbsp;</label>' +
            '<button class="rm-btn rm-btn-primary" onclick="window._rmDoPing()">📡 Ping</button></div>' +
          '<div><label style="font-size:11px;color:#8ea3b0;">&nbsp;</label>' +
            '<button class="rm-btn rm-btn-secondary" onclick="window._rmDoTraceroute()">🛣 Trace</button></div>' +
        '</div>' +
      '</div>' +
      '<div class="rm-dash-card">' +
        '<h4>📊 Результат</h4>' +
        '<pre id="rm-ping-output" style="background:#0d1821;border:1px solid #2a3b48;border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#5fd0a5;min-height:100px;max-height:400px;overflow-y:auto;white-space:pre-wrap;"></pre>' +
      '</div>';

    window._rmDoPing = function() {
      var host  = document.getElementById('rm-ping-host').value.trim();
      var count = document.getElementById('rm-ping-count').value || '4';
      var out   = document.getElementById('rm-ping-output');
      if (!host) return;
      out.textContent = '⏳ Ping ' + host + '...';
      sshCall(r, '/ping ' + host + ' count=' + count).then(function(res) {
        out.textContent = res.output || res.error || 'Немає відповіді';
      }).catch(function(e) {
        out.textContent = 'Помилка: ' + e;
      });
    };

    window._rmDoTraceroute = function() {
      var host = document.getElementById('rm-ping-host').value.trim();
      var out  = document.getElementById('rm-ping-output');
      if (!host) return;
      out.textContent = '⏳ Traceroute ' + host + ' (може зайняти 30-60 сек)...';
      sshCall(r, '/tool traceroute ' + host + ' count=3').then(function(res) {
        out.textContent = res.output || res.error || 'Немає відповіді';
      }).catch(function(e) {
        out.textContent = 'Помилка: ' + e;
      });
    };
  };

  /* ══════════════════════════════════════════════════════════
     UTILITIES
     ══════════════════════════════════════════════════════════ */

  /* Базовий MAC vendor lookup */
  var MAC_VENDORS = {
    'B8:27:EB': 'Raspberry Pi',
    'DC:A6:32': 'Raspberry Pi',
    'E4:5F:01': 'Raspberry Pi',
    '00:50:56': 'VMware',
    '00:0C:29': 'VMware',
    '08:00:27': 'VirtualBox',
    '00:1A:11': 'Google',
    'F4:F5:D8': 'Google',
    '74:DA:38': 'Edimax',
    '00:E0:4C': 'Realtek',
    'CC:2D:E0': 'Apple',
    '3C:22:FB': 'Apple',
    'AC:DE:48': 'Apple',
    '00:11:22': 'Cisco',
    '00:1B:54': 'Cisco',
    '00:50:7F': 'MikroTik',
    '2C:C8:1B': 'MikroTik',
    '4C:5E:0C': 'MikroTik',
    '74:4D:28': 'MikroTik',
    'B8:69:F4': 'MikroTik',
    'D4:CA:6D': 'MikroTik',
    'DC:2C:6E': 'MikroTik',
    'E4:8D:8C': 'MikroTik',
  };

  function getMACVendor(mac) {
    if (!mac || mac === '—') return '';
    var prefix = mac.toUpperCase().slice(0, 8);
    return MAC_VENDORS[prefix] || '';
  }

  function presetBtn(label, value) {
    return '<button class="rm-btn rm-btn-secondary" style="font-size:10px;padding:3px 8px;margin-right:4px;" ' +
      'onclick="document.getElementById(\'rm-portscan-range\').value=\'' + esc(value) + '\'">' +
      esc(label) + '</button>';
  }

  /* ══════════════════════════════════════════════════════════
     STYLES
     ══════════════════════════════════════════════════════════ */
  function injectStyles() {
    if (document.getElementById('rm-plugins-styles')) return;
    var el = document.createElement('style');
    el.id  = 'rm-plugins-styles';
    el.textContent =
      '.rm-plugin-card{background:#111d27;border:1px solid #2a3b48;border-radius:10px;padding:14px 16px;transition:border-color .2s;}' +
      '.rm-plugin-card:hover{border-color:#5fd0a5;}' +
      '.rm-plugin-scanner-wrap{}' +
      '.rm-btn-danger{background:transparent;border:1px solid #b04040;color:#e05252;}' +
      '.rm-btn-danger:hover{background:#e05252;color:#fff;border-color:#e05252;}';
    document.head.appendChild(el);
  }

  console.log('[RM Plugins] завантажено — IP Scanner + Port Scanner + ARP + Ping');

})();