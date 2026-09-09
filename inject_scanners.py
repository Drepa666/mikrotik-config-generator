# -*- coding: utf-8 -*-
import subprocess

with open('plugins.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Перевіряємо чи вже є
if 'ip-scanner' in content:
    print('IP Scanner вже є!')
else:
    print('Додаємо IP Scanner + Port Scanner...')

# Знаходимо кінець масиву BUILTIN_PLUGINS — шукаємо останній }]; або ];\n
# Додаємо нові плагіни перед закриттям масиву

IP_SCANNER_PLUGIN = r"""
,
{
    id:          'ip-scanner',
    name:        '🔍 IP Scanner',
    description: 'Сканування мережі — знаходить активні хости (як Advanced IP Scanner)',
    version:     '1.0.0',
    author:      'MikroTik Generator',
    category:    'tools',
    builtin:     true,
    enabled:     false,
    icon:        '🔍',
    init: function(api) {
      /* Відкриваємо модальне вікно сканера */
      var modal = document.getElementById('plugin-ip-scanner-modal');
      if (modal) { modal.style.display = 'flex'; return; }

      modal = document.createElement('div');
      modal.id = 'plugin-ip-scanner-modal';
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:99999;display:flex;align-items:center;justify-content:center;';

      modal.innerHTML = [
        '<div style="background:#0d1821;border:1px solid #2a3b48;border-radius:12px;padding:20px;width:700px;max-width:95vw;max-height:85vh;display:flex;flex-direction:column;gap:12px;">',
          '<div style="display:flex;align-items:center;justify-content:space-between;">',
            '<div style="font-size:15px;font-weight:700;color:#e6edf3;">🔍 Advanced IP Scanner</div>',
            '<button id="ip-scan-close" style="background:none;border:none;color:#8ea3b0;font-size:20px;cursor:pointer;">✕</button>',
          '</div>',
          '<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;">',
            '<div><div style="font-size:11px;color:#8ea3b0;margin-bottom:4px;">IP від</div>',
              '<input id="ip-scan-from" value="192.168.88.1" style="width:100%;box-sizing:border-box;background:#111d27;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:6px 10px;font-size:12px;outline:none;"></div>',
            '<div><div style="font-size:11px;color:#8ea3b0;margin-bottom:4px;">IP до</div>',
              '<input id="ip-scan-to" value="192.168.88.254" style="width:100%;box-sizing:border-box;background:#111d27;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:6px 10px;font-size:12px;outline:none;"></div>',
            '<button id="ip-scan-start" style="background:#5fd0a5;color:#082018;border:none;border-radius:6px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;">🔍 Сканувати</button>',
          '</div>',
          '<div id="ip-scan-progress" style="display:none;">',
            '<div style="background:#1a2d3d;border-radius:4px;height:6px;overflow:hidden;">',
              '<div id="ip-scan-bar" style="height:100%;background:#5fd0a5;width:0%;transition:width .3s;border-radius:4px;"></div>',
            '</div>',
            '<div id="ip-scan-status" style="font-size:11px;color:#8ea3b0;margin-top:4px;"></div>',
          '</div>',
          '<div style="overflow-y:auto;flex:1;">',
            '<div id="ip-scan-results" style="font-size:12px;color:#4a6070;text-align:center;padding:20px;">',
              'Натисни "Сканувати" для пошуку хостів у мережі',
            '</div>',
          '</div>',
          '<div style="display:flex;justify-content:space-between;align-items:center;">',
            '<div id="ip-scan-count" style="font-size:11px;color:#8ea3b0;"></div>',
            '<button id="ip-scan-export" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;border-radius:6px;padding:5px 12px;font-size:11px;cursor:pointer;display:none;">📥 Експорт CSV</button>',
          '</div>',
        '</div>'
      ].join('');

      document.body.appendChild(modal);

      var scanResults = [];
      var scanning    = false;

      document.getElementById('ip-scan-close').onclick = function() {
        modal.style.display = 'none';
      };

      document.getElementById('ip-scan-start').onclick = function() {
        if (scanning) return;
        var from = document.getElementById('ip-scan-from').value.trim();
        var to   = document.getElementById('ip-scan-to').value.trim();
        var fp   = from.split('.').map(Number);
        var tp   = to.split('.').map(Number);
        if (fp.length !== 4 || tp.length !== 4) { alert('Невірний IP!'); return; }

        var prefix = fp.slice(0,3).join('.');
        var ips = [];
        for (var i = fp[3]; i <= tp[3]; i++) ips.push(prefix + '.' + i);

        scanResults = [];
        scanning    = true;
        var done    = 0;
        var found   = 0;
        var total   = ips.length;

        document.getElementById('ip-scan-progress').style.display = 'block';
        document.getElementById('ip-scan-results').innerHTML =
          '<div style="color:#8ea3b0;padding:20px;text-align:center;">⏳ Сканування ' + total + ' адрес...</div>';
        document.getElementById('ip-scan-export').style.display = 'none';
        document.getElementById('ip-scan-start').textContent = '⏳...';
        document.getElementById('ip-scan-start').disabled = true;

        var BATCH = 15;
        var idx   = 0;

        /* Vendor lookup — базовий */
        var VENDORS = {
          '00:50:7F':'MikroTik','2C:C8:1B':'MikroTik','4C:5E:0C':'MikroTik',
          '74:4D:28':'MikroTik','B8:69:F4':'MikroTik','D4:CA:6D':'MikroTik',
          'B8:27:EB':'Raspberry Pi','DC:A6:32':'Raspberry Pi',
          '00:50:56':'VMware','00:0C:29':'VMware','08:00:27':'VirtualBox',
          'CC:2D:E0':'Apple','3C:22:FB':'Apple','AC:DE:48':'Apple',
          '00:1A:11':'Google','F4:F5:D8':'Google',
        };
        function vendor(mac) {
          if (!mac) return '';
          return VENDORS[mac.toUpperCase().slice(0,8)] || '';
        }

        function renderTable() {
          if (!scanResults.length) return;
          var html = '<table style="width:100%;border-collapse:collapse;font-size:11px;">' +
            '<tr style="color:#4a6070;border-bottom:1px solid #1a2d3d;">' +
              '<th style="padding:4px 8px;text-align:left;">IP</th>' +
              '<th style="padding:4px 8px;text-align:left;">MAC</th>' +
              '<th style="padding:4px 8px;text-align:left;">Hostname</th>' +
              '<th style="padding:4px 8px;text-align:left;">Виробник</th>' +
            '</tr>';
          scanResults.forEach(function(h) {
            html += '<tr style="border-bottom:1px solid #0d1821;">' +
              '<td style="padding:4px 8px;color:#5fd0a5;font-weight:600;">' + h.ip + '</td>' +
              '<td style="padding:4px 8px;font-family:monospace;">' + (h.mac||'—') + '</td>' +
              '<td style="padding:4px 8px;color:#8ea3b0;">' + (h.hostname||'—') + '</td>' +
              '<td style="padding:4px 8px;color:#f0a840;">' + vendor(h.mac) + '</td>' +
            '</tr>';
          });
          html += '</table>';
          document.getElementById('ip-scan-results').innerHTML = html;
          document.getElementById('ip-scan-count').textContent = found + ' хостів знайдено';
          document.getElementById('ip-scan-export').style.display = 'inline-block';
        }

        function tryIP(ip) {
          var start = Date.now();
          fetch('http://' + ip + '/', { method:'HEAD', signal: AbortSignal.timeout(400) })
            .then(function() {
              scanResults.push({ ip:ip, mac:'', hostname:'' });
              found++;
              renderTable();
            })
            .catch(function(e) {
              /* connection refused = хост існує але порт закритий */
              if (e && (e.message||'').includes('Failed to fetch') === false) {
                /* ignore */
              }
            })
            .finally(function() {
              done++;
              var pct = Math.round(done/total*100);
              var bar = document.getElementById('ip-scan-bar');
              var st  = document.getElementById('ip-scan-status');
              if (bar) bar.style.width = pct + '%';
              if (st)  st.textContent  = done + '/' + total + ' — знайдено: ' + found;
              if (done >= total) {
                scanning = false;
                var btn = document.getElementById('ip-scan-start');
                if (btn) { btn.textContent = '🔍 Сканувати'; btn.disabled = false; }
                if (!scanResults.length) {
                  document.getElementById('ip-scan-results').innerHTML =
                    '<div style="color:#4a6070;padding:20px;text-align:center;">😕 Хостів не знайдено</div>';
                }
              }
            });
          if (idx < total && (idx - done) < BATCH) { idx++; tryIP(ips[idx-1]); }
        }

        for (var b = 0; b < Math.min(BATCH, total); b++) {
          tryIP(ips[idx]); idx++;
        }
      };

      document.getElementById('ip-scan-export').onclick = function() {
        var csv = 'IP,MAC,Hostname\n' + scanResults.map(function(h) {
          return h.ip + ',' + (h.mac||'') + ',' + (h.hostname||'');
        }).join('\n');
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
        a.download = 'ip-scan.csv'; a.click();
      };
    },
    destroy: function() {
      var m = document.getElementById('plugin-ip-scanner-modal');
      if (m) m.remove();
    }
  }
,
{
    id:          'port-scanner',
    name:        '🔌 Port Scanner',
    description: 'Сканування портів хоста — відкриті/закриті (як Advanced Port Scanner)',
    version:     '1.0.0',
    author:      'MikroTik Generator',
    category:    'tools',
    builtin:     true,
    enabled:     false,
    icon:        '🔌',
    init: function(api) {
      var modal = document.getElementById('plugin-port-scanner-modal');
      if (modal) { modal.style.display = 'flex'; return; }

      modal = document.createElement('div');
      modal.id = 'plugin-port-scanner-modal';
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:99999;display:flex;align-items:center;justify-content:center;';

      var SERVICES = {
        21:'FTP',22:'SSH',23:'Telnet',25:'SMTP',53:'DNS',
        80:'HTTP',110:'POP3',143:'IMAP',443:'HTTPS',445:'SMB',
        3306:'MySQL',3389:'RDP',5900:'VNC',8080:'HTTP-Alt',
        8291:'Winbox',8443:'HTTPS-Alt',8728:'API',8729:'API-SSL',51820:'WireGuard'
      };

      modal.innerHTML = [
        '<div style="background:#0d1821;border:1px solid #2a3b48;border-radius:12px;padding:20px;width:700px;max-width:95vw;max-height:85vh;display:flex;flex-direction:column;gap:12px;">',
          '<div style="display:flex;align-items:center;justify-content:space-between;">',
            '<div style="font-size:15px;font-weight:700;color:#e6edf3;">🔌 Advanced Port Scanner</div>',
            '<button id="ps-close" style="background:none;border:none;color:#8ea3b0;font-size:20px;cursor:pointer;">✕</button>',
          '</div>',
          '<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;">',
            '<div><div style="font-size:11px;color:#8ea3b0;margin-bottom:4px;">IP хоста</div>',
              '<input id="ps-host" value="192.168.88.1" style="width:100%;box-sizing:border-box;background:#111d27;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:6px 10px;font-size:12px;outline:none;"></div>',
            '<div><div style="font-size:11px;color:#8ea3b0;margin-bottom:4px;">Порти</div>',
              '<input id="ps-ports" value="21,22,23,80,443,3389,8080,8291,8728" style="width:100%;box-sizing:border-box;background:#111d27;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:6px 10px;font-size:12px;outline:none;"></div>',
            '<button id="ps-start" style="background:#5fd0a5;color:#082018;border:none;border-radius:6px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;">🔌 Сканувати</button>',
          '</div>',
          '<div style="display:flex;gap:6px;flex-wrap:wrap;">',
            '<span style="font-size:10px;color:#4a6070;margin-right:2px;">Пресети:</span>',
            '<button class="ps-preset" data-v="21,22,23,80,443,8291,8728,8729" style="background:#111d27;border:1px solid #2a3b48;color:#8ea3b0;border-radius:4px;padding:2px 8px;font-size:10px;cursor:pointer;">MikroTik</button>',
            '<button class="ps-preset" data-v="80,443,8080,8443" style="background:#111d27;border:1px solid #2a3b48;color:#8ea3b0;border-radius:4px;padding:2px 8px;font-size:10px;cursor:pointer;">HTTP</button>',
            '<button class="ps-preset" data-v="1-1024" style="background:#111d27;border:1px solid #2a3b48;color:#8ea3b0;border-radius:4px;padding:2px 8px;font-size:10px;cursor:pointer;">1-1024</button>',
            '<button class="ps-preset" data-v="1433,1521,3306,5432,6379,27017" style="background:#111d27;border:1px solid #2a3b48;color:#8ea3b0;border-radius:4px;padding:2px 8px;font-size:10px;cursor:pointer;">БД</button>',
          '</div>',
          '<div id="ps-progress" style="display:none;">',
            '<div style="background:#1a2d3d;border-radius:4px;height:6px;overflow:hidden;">',
              '<div id="ps-bar" style="height:100%;background:#5fd0a5;width:0%;transition:width .2s;border-radius:4px;"></div>',
            '</div>',
            '<div id="ps-status" style="font-size:11px;color:#8ea3b0;margin-top:4px;"></div>',
          '</div>',
          '<div style="overflow-y:auto;flex:1;"><div id="ps-results" style="font-size:12px;color:#4a6070;text-align:center;padding:20px;">Введи IP і натисни "Сканувати"</div></div>',
          '<div style="display:flex;justify-content:space-between;align-items:center;">',
            '<div id="ps-count" style="font-size:11px;color:#8ea3b0;"></div>',
            '<button id="ps-export" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;border-radius:6px;padding:5px 12px;font-size:11px;cursor:pointer;display:none;">📥 CSV</button>',
          '</div>',
        '</div>'
      ].join('');

      document.body.appendChild(modal);

      var openPorts = [];

      document.getElementById('ps-close').onclick = function() {
        modal.style.display = 'none';
      };

      modal.querySelectorAll('.ps-preset').forEach(function(btn) {
        btn.onclick = function() {
          document.getElementById('ps-ports').value = btn.dataset.v;
        };
      });

      document.getElementById('ps-start').onclick = function() {
        var host  = document.getElementById('ps-host').value.trim();
        var raw   = document.getElementById('ps-ports').value.trim();
        if (!host || !raw) return;

        /* Парсимо порти */
        var ports = [];
        raw.split(',').forEach(function(p) {
          p = p.trim();
          if (p.includes('-')) {
            var b = p.split('-').map(Number);
            for (var i = b[0]; i <= b[1] && ports.length < 5000; i++) ports.push(i);
          } else {
            var n = parseInt(p);
            if (n > 0 && n <= 65535) ports.push(n);
          }
        });

        if (!ports.length) return;
        openPorts = [];
        var done  = 0;
        var total = ports.length;
        var BATCH = 20;
        var idx   = 0;

        document.getElementById('ps-progress').style.display = 'block';
        document.getElementById('ps-results').innerHTML =
          '<div style="color:#8ea3b0;padding:20px;text-align:center;">⏳ Сканування ' + total + ' портів на ' + host + '...</div>';
        document.getElementById('ps-export').style.display = 'none';
        document.getElementById('ps-start').disabled = true;
        document.getElementById('ps-start').textContent = '⏳...';

        function renderPorts() {
          if (!openPorts.length) return;
          var html = '<table style="width:100%;border-collapse:collapse;font-size:11px;">' +
            '<tr style="color:#4a6070;border-bottom:1px solid #1a2d3d;">' +
              '<th style="padding:4px 8px;text-align:left;">Порт</th>' +
              '<th style="padding:4px 8px;text-align:left;">Сервіс</th>' +
              '<th style="padding:4px 8px;text-align:left;">Стан</th>' +
            '</tr>';
          openPorts.sort(function(a,b){return a-b;}).forEach(function(p) {
            html += '<tr style="border-bottom:1px solid #0d1821;">' +
              '<td style="padding:4px 8px;color:#5fd0a5;font-weight:700;">' + p + '</td>' +
              '<td style="padding:4px 8px;color:#f0a840;">' + (SERVICES[p]||'—') + '</td>' +
              '<td style="padding:4px 8px;"><span style="color:#5fd0a5;">🟢 Open</span></td>' +
            '</tr>';
          });
          html += '</table>';
          document.getElementById('ps-results').innerHTML = html;
          document.getElementById('ps-count').textContent = openPorts.length + ' відкритих портів';
          document.getElementById('ps-export').style.display = 'inline-block';
        }

        function tryPort(port) {
          fetch('http://' + host + ':' + port + '/', {
            method: 'HEAD',
            signal: AbortSignal.timeout(350)
          }).then(function() {
            openPorts.push(port);
            renderPorts();
          }).catch(function(e) {
            var msg = (e && e.message) || '';
            /* "Failed to fetch" з CORS/network = порт відкритий але відхиляє */
            if (msg.includes('Failed to fetch') && !msg.includes('timed out')) {
              openPorts.push(port);
              renderPorts();
            }
          }).finally(function() {
            done++;
            var pct = Math.round(done/total*100);
            var bar = document.getElementById('ps-bar');
            var st  = document.getElementById('ps-status');
            if (bar) bar.style.width = pct + '%';
            if (st)  st.textContent  = done + '/' + total + ' — відкритих: ' + openPorts.length;
            if (done >= total) {
              var btn = document.getElementById('ps-start');
              if (btn) { btn.disabled = false; btn.textContent = '🔌 Сканувати'; }
              if (!openPorts.length) {
                document.getElementById('ps-results').innerHTML =
                  '<div style="color:#4a6070;padding:20px;text-align:center;">Відкритих портів не знайдено</div>';
              }
            }
          });
          if (idx < total && (idx - done) < BATCH) { idx++; tryPort(ports[idx-1]); }
        }

        for (var b = 0; b < Math.min(BATCH, total); b++) {
          tryPort(ports[idx]); idx++;
        }
      };

      document.getElementById('ps-export').onclick = function() {
        var host = document.getElementById('ps-host').value.trim();
        var csv  = 'IP,Port,Service,State\n' + openPorts.map(function(p) {
          return host + ',' + p + ',' + (SERVICES[p]||'') + ',open';
        }).join('\n');
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
        a.download = 'ports-' + host + '.csv'; a.click();
      };
    },
    destroy: function() {
      var m = document.getElementById('plugin-port-scanner-modal');
      if (m) m.remove();
    }
  }
"""

# Знаходимо кінець масиву BUILTIN_PLUGINS
# Шукаємо ]; що закриває масив
import re

# Знаходимо де закінчується BUILTIN_PLUGINS
# Ідемо від кінця масиву — шукаємо закриття
if 'ip-scanner' in content:
    print('IP Scanner вже є в plugins.js!')
else:
    # Знаходимо закриття масиву BUILTIN_PLUGINS
    # Масив закривається на };  або }]; 
    idx = content.find('var BUILTIN_PLUGINS')
    if idx < 0:
        print('BUILTIN_PLUGINS не знайдено!')
    else:
        # Знаходимо відповідне закриття масиву
        start = content.find('[', idx)
        depth = 0
        pos   = start
        while pos < len(content):
            c = content[pos]
            if c == '[': depth += 1
            elif c == ']':
                depth -= 1
                if depth == 0:
                    # Вставляємо перед ]
                    content = content[:pos] + IP_SCANNER_PLUGIN + '\n' + content[pos:]
                    print(f'OK: IP Scanner + Port Scanner вставлено перед позицією {pos}')
                    break
            pos += 1

    with open('plugins.js', 'w', encoding='utf-8') as f:
        f.write(content)

# Перевіряємо синтаксис
r = subprocess.run(['node', '--check', 'plugins.js'], capture_output=True, text=True)
print('Синтаксис:', 'OK' if r.returncode == 0 else r.stderr[:300])

# Тепер додаємо кнопку Видалити в UI
print('\n=== Шукаємо UI рендер плагінів ===')
with open('plugins.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Шукаємо де рендериться картка плагіна
for kw in ['renderPlugin', 'plugin-card', 'Увімкнути', 'toggle-plugin', 'pluginCard']:
    if kw in content:
        idx = content.find(kw)
        print(f'Знайдено "{kw}": ...{content[max(0,idx-30):idx+80]}...')
        print()