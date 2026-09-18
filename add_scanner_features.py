# -*- coding: utf-8 -*-
import subprocess

with open('network-scanner.js', 'r', encoding='utf-8') as f:
    content = f.read()

# ── 1. Додаємо UI кнопки (автооновлення + експорт) в renderNetworkScanner ──
old_btn = """        '<button id="ns-scan-btn" onclick="window.startNetScan()" ' +
            'style="margin-left:auto;background:linear-gradient(135deg,#5fd0a5,#4ab890);' +
            'color:#082018;border:none;border-radius:8px;padding:10px 24px;' +
            'font-size:14px;font-weight:700;cursor:pointer;">▶ Сканувати</button>' +"""

new_btn = """        '<div style="margin-left:auto;display:flex;gap:8px;align-items:center;">' +
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
        '</div>' +"""

if old_btn in content:
    content = content.replace(old_btn, new_btn)
    print('OK: кнопки додано ✅')
else:
    print('ERR: кнопка не знайдена')

# ── 2. Додаємо кнопку порт-скану в рядок таблиці ──
old_ping_btn = """            (d.ip ? '<button onclick="window.nsPing(\''+esc(d.ip)+'\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#5fd0a5;border-radius:4px;padding:3px 8px;cursor:pointer;font-size:11px;">🏓</button>' : '') +
            (d.ip ? '<button onclick="window.nsAddToRouter(\''+esc(d.ip)+'\',\''+esc(d.mac)+'\',\''+esc(d.hostname)+'\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#4a90d9;border-radius:4px;padding:3px 8px;cursor:pointer;font-size:11px;">➕</button>' : '') +"""

new_ping_btn = """            (d.ip ? '<button onclick="window.nsPing(\''+esc(d.ip)+'\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#5fd0a5;border-radius:4px;padding:3px 8px;cursor:pointer;font-size:11px;" title="Ping">🏓</button>' : '') +
            (d.ip ? '<button onclick="window.nsPortScan(\''+esc(d.ip)+'\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#f0a840;border-radius:4px;padding:3px 8px;cursor:pointer;font-size:11px;" title="Порт-скан">🔌</button>' : '') +
            (d.ip ? '<button onclick="window.nsAddToRouter(\''+esc(d.ip)+'\',\''+esc(d.mac)+'\',\''+esc(d.hostname)+'\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#4a90d9;border-radius:4px;padding:3px 8px;cursor:pointer;font-size:11px;" title="Додати роутер">➕</button>' : '') +"""

if old_ping_btn in content:
    content = content.replace(old_ping_btn, new_ping_btn)
    print('OK: кнопка порт-скану додана ✅')
else:
    print('ERR: ping кнопка не знайдена')

# ── 3. Додаємо нові функції перед window.* реєстрацією ──
old_register = "  /* ── Реєструємо глобально ── */"

NEW_FUNCTIONS = r"""
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
  function nsPortScan(ip) {
    if (!ip) return;
    var router = getActive();
    if (!router) { alert('Немає активного роутера'); return; }

    /* Показуємо модал */
    var modal = document.createElement('div');
    modal.id  = 'ns-portscan-modal';
    modal.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);' +
      'z-index:99999;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML =
      '<div style="background:#0d1117;border:1px solid #2a3b48;border-radius:12px;' +
        'width:500px;max-height:80vh;overflow-y:auto;padding:20px;">' +
        '<div style="display:flex;align-items:center;margin-bottom:16px;">' +
          '<span style="font-size:16px;font-weight:700;color:#e6edf3;">🔌 Порт-скан: ' + ip + '</span>' +
          '<button onclick="document.getElementById(\'ns-portscan-modal\').remove()" ' +
            'style="margin-left:auto;background:transparent;border:1px solid #2a3b48;' +
            'color:#8ea3b0;border-radius:6px;padding:4px 10px;cursor:pointer;">✕</button>' +
        '</div>' +
        '<div id="ns-ps-result" style="font-family:monospace;font-size:12px;color:#c9d8e4;">' +
          '<div style="color:#4a6070;">⏳ Скануємо порти...</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    /* Стандартні порти для перевірки */
    var commonPorts = [
      {port:21,name:'FTP'},{port:22,name:'SSH'},{port:23,name:'Telnet'},
      {port:25,name:'SMTP'},{port:53,name:'DNS'},{port:80,name:'HTTP'},
      {port:443,name:'HTTPS'},{port:8080,name:'HTTP-Alt'},{port:8443,name:'HTTPS-Alt'},
      {port:3306,name:'MySQL'},{port:5432,name:'PostgreSQL'},{port:3389,name:'RDP'},
      {port:5900,name:'VNC'},{port:1194,name:'OpenVPN'},{port:1723,name:'PPTP'},
      {port:8291,name:'Winbox'},{port:8728,name:'RouterOS API'},{port:8729,name:'RouterOS API-SSL'},
      {port:179,name:'BGP'},{port:161,name:'SNMP'},
    ];

    /* Скануємо через TCP connect з MikroTik */
    var cmd = '/tool fetch mode=tcp';
    var results = [];
    var checked = 0;

    /* Використовуємо /ip/service для відомих портів MikroTik */
    fetch('http://localhost:8888/rest/ip/service', {
      headers: {
        'x-router-ip':   router.ip,
        'x-router-port': String(router.port||80),
        'x-router-user': router.user||'admin',
        'x-router-pass': router.pass||'',
      }
    }).then(function(r){ return r.json(); }).then(function(services) {
      /* Якщо сканується сам роутер */
      var isSelf = (ip === router.ip);
      var resultEl = document.getElementById('ns-ps-result');
      if (!resultEl) return;

      if (isSelf && Array.isArray(services)) {
        var open = services.filter(function(s){ return s.disabled !== 'true' && s.disabled !== true; });
        var html = '<div style="color:#5fd0a5;margin-bottom:10px;">✅ Відкриті сервіси MikroTik:</div>';
        html += open.map(function(s) {
          return '<div style="display:flex;gap:12px;padding:4px 0;border-bottom:1px solid #1a2a38;">' +
            '<span style="color:#4a90d9;width:60px;">:' + (s.port||'—') + '</span>' +
            '<span style="color:#5fd0a5;width:80px;">' + (s.name||'').toUpperCase() + '</span>' +
            '<span style="color:#5fd0a5;">OPEN</span>' +
          '</div>';
        }).join('');
        resultEl.innerHTML = html;
        return;
      }

      /* Для інших пристроїв — SSH ping через MikroTik */
      fetch('http://localhost:8888/ssh/exec', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          host: router.ip, port: router.sshPort||22,
          username: router.user, password: router.pass,
          command: commonPorts.slice(0,10).map(function(p){
            return '/tool fetch address=' + ip + ' port=' + p.port +
                   ' mode=tcp dst-path=/null as-value';
          }).join('\n')
        })
      }).then(function(r){ return r.json(); }).then(function(d) {
        var resultEl2 = document.getElementById('ns-ps-result');
        if (!resultEl2) return;
        var output = (d.output || d.error || 'Немає відповіді');
        var html2 = '<div style="color:#8ea3b0;margin-bottom:8px;">Результат сканування ' + ip + ':</div>';

        commonPorts.forEach(function(p) {
          var isOpen = output.includes('port=' + p.port) ||
                       output.includes(':' + p.port) ||
                       (output.includes('status=finished') && !output.includes('error'));
          html2 += '<div style="display:flex;gap:12px;padding:3px 0;">' +
            '<span style="color:#4a90d9;width:60px;">:' + p.port + '</span>' +
            '<span style="color:#8ea3b0;width:80px;">' + p.name + '</span>' +
            '<span style="color:' + (isOpen ? '#5fd0a5' : '#4a6070') + ';">' +
              (isOpen ? '● OPEN' : '○ closed') +
            '</span>' +
          '</div>';
        });
        resultEl2.innerHTML = html2;
      }).catch(function(e) {
        var resultEl3 = document.getElementById('ns-ps-result');
        if (resultEl3) resultEl3.innerHTML = '<div style="color:#e05252;">❌ Помилка: ' + e + '</div>';
      });

    }).catch(function(e) {
      var resultEl4 = document.getElementById('ns-ps-result');
      if (resultEl4) resultEl4.innerHTML = '<div style="color:#e05252;">❌ ' + e + '</div>';
    });
  }

  /* ── Реєструємо глобально ── */"""

if old_register in content:
    content = content.replace(old_register, NEW_FUNCTIONS)
    print('OK: нові функції додано ✅')
else:
    print('ERR: маркер не знайдено')

# Додаємо нові функції в window реєстрацію
old_reg_end = """  window.renderNetworkScanner = renderNetworkScanner;
  window.startNetScan         = startNetScan;
  window.nsFilter             = nsFilter;
  window.nsRender             = nsRender;
  window.nsPing               = nsPing;
  window.nsAddToRouter        = nsAddToRouter;"""

new_reg_end = """  window.renderNetworkScanner = renderNetworkScanner;
  window.startNetScan         = startNetScan;
  window.nsFilter             = nsFilter;
  window.nsRender             = nsRender;
  window.nsPing               = nsPing;
  window.nsAddToRouter        = nsAddToRouter;
  window.nsPortScan           = nsPortScan;
  window.nsExportCSV          = nsExportCSV;
  window.nsExportExcel        = nsExportExcel;
  window.nsSetAutoRefresh     = nsSetAutoRefresh;"""

if old_reg_end in content:
    content = content.replace(old_reg_end, new_reg_end)
    print('OK: window реєстрація оновлена ✅')

with open('network-scanner.js', 'w', encoding='utf-8') as f:
    f.write(content)

r = subprocess.run(['node', '--check', 'network-scanner.js'],
                   capture_output=True, text=True)
print('Синтаксис:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:300])