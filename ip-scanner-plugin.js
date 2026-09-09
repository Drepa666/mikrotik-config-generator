'use strict';

/* ============================================================
   IP Scanner + Port Scanner — реєструємо в BUILTIN_PLUGINS
   Викликається з plugins.js: _addScannerPlugins(BUILTIN_PLUGINS)
   ============================================================ */

window._addScannerPlugins = function(BUILTIN_PLUGINS) {

  /* Перевіряємо чи вже додані */
  var ids = BUILTIN_PLUGINS.map(function(p) { return p.id; });
  if (ids.indexOf('ip-scanner') >= 0) return;

  /* ─────────────────────────────────────────────
     PLUGIN: IP Scanner
  ───────────────────────────────────────────── */
  BUILTIN_PLUGINS.push({
    id:          'ip-scanner',
    name:        '\uD83D\uDD0D IP Scanner',
    description: 'Сканує мережу і знаходить активні хости (як Advanced IP Scanner)',
    version:     '1.0.0',
    author:      'MikroTik Generator',
    category:    'tools',
    builtin:     true,
    enabled:     false,
    icon:        '\uD83D\uDD0D',
    init: function() {
      /* Якщо modal вже є — показуємо */
      var m = document.getElementById('plg-ip-scan');
      if (m) { m.style.display = 'flex'; return; }

      /* Створюємо modal через DOM (без рядкових HTML шаблонів) */
      m = document.createElement('div');
      m.id = 'plg-ip-scan';
      m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:99999;display:flex;align-items:center;justify-content:center;';

      var box = document.createElement('div');
      box.style.cssText = 'background:#0d1821;border:1px solid #2a3b48;border-radius:12px;padding:20px;width:660px;max-width:95vw;display:flex;flex-direction:column;gap:10px;max-height:85vh;';

      /* Header */
      var h = document.createElement('div');
      h.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';
      var t = document.createElement('b');
      t.style.cssText = 'font-size:14px;color:#e6edf3;';
      t.textContent = '\uD83D\uDD0D Advanced IP Scanner';
      var x = document.createElement('button');
      x.textContent = '\u2715';
      x.style.cssText = 'background:none;border:none;color:#8ea3b0;font-size:18px;cursor:pointer;';
      x.onclick = function() { m.style.display = 'none'; };
      h.appendChild(t); h.appendChild(x);

      /* Inputs row */
      var row = document.createElement('div');
      row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;';

      function inp(id, lbl, val) {
        var w = document.createElement('div');
        var l = document.createElement('div');
        l.style.cssText = 'font-size:11px;color:#8ea3b0;margin-bottom:3px;';
        l.textContent = lbl;
        var i = document.createElement('input');
        i.id = id; i.value = val;
        i.style.cssText = 'width:100%;box-sizing:border-box;background:#111d27;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:6px 10px;font-size:12px;outline:none;';
        w.appendChild(l); w.appendChild(i); return w;
      }

      row.appendChild(inp('ips-from', 'IP від', '192.168.88.1'));
      row.appendChild(inp('ips-to',   'IP до',  '192.168.88.254'));

      var btn = document.createElement('button');
      btn.textContent = '\uD83D\uDD0D Сканувати';
      btn.style.cssText = 'background:#5fd0a5;color:#082018;border:none;border-radius:6px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;';

      row.appendChild(btn);

      /* Progress */
      var prog = document.createElement('div');
      prog.id = 'ips-prog';
      prog.style.display = 'none';
      prog.innerHTML = '<div style="background:#1a2d3d;border-radius:4px;height:4px;"><div id="ips-bar" style="height:100%;background:#5fd0a5;width:0%;border-radius:4px;transition:width .3s;"></div></div><div id="ips-st" style="font-size:11px;color:#8ea3b0;margin-top:3px;"></div>';

      /* Results */
      var res = document.createElement('div');
      res.id = 'ips-res';
      res.style.cssText = 'overflow-y:auto;flex:1;min-height:60px;font-size:12px;color:#4a6070;text-align:center;padding:16px;';
      res.textContent = 'Натисни "Сканувати" для пошуку хостів у мережі';

      box.appendChild(h); box.appendChild(row); box.appendChild(prog); box.appendChild(res);
      m.appendChild(box);
      document.body.appendChild(m);

      /* Scan logic */
      var found = [], scanning = false;

      btn.onclick = function() {
        if (scanning) return;
        var fromEl = document.getElementById('ips-from');
        var toEl   = document.getElementById('ips-to');
        var fp = (fromEl ? fromEl.value.trim() : '').split('.').map(Number);
        var tp = (toEl   ? toEl.value.trim()   : '').split('.').map(Number);
        if (fp.length !== 4 || tp.length !== 4 || fp.some(isNaN) || tp.some(isNaN)) {
          alert('Невірний IP діапазон!'); return;
        }

        var pfx = fp.slice(0,3).join('.');
        var ips = [];
        for (var i = fp[3]; i <= tp[3]; i++) ips.push(pfx + '.' + i);

        found = []; scanning = true;
        var done = 0, total = ips.length, idx = 0, BATCH = 20;

        prog.style.display = 'block';
        res.innerHTML = '<div style="color:#8ea3b0;padding:16px;text-align:center;">\u23F3 Сканування ' + total + ' адрес...</div>';
        btn.textContent = '\u23F3 Сканування...';
        btn.disabled = true;

        function render() {
          if (!found.length) return;
          var h2 = '<table style="width:100%;border-collapse:collapse;font-size:11px;">';
          h2 += '<tr style="color:#4a6070;border-bottom:1px solid #1a2d3d;"><th style="padding:4px 8px;text-align:left;">IP</th><th style="padding:4px 8px;text-align:left;">Статус</th></tr>';
          found.forEach(function(ip) {
            h2 += '<tr style="border-bottom:1px solid #0d1821;"><td style="padding:4px 8px;color:#5fd0a5;font-weight:600;">' + ip + '</td><td style="padding:4px 8px;color:#5fd0a5;">\uD83D\uDFE2 Online</td></tr>';
          });
          h2 += '</table>';
          res.innerHTML = h2;
        }

        function tryIP(ip) {
          fetch('http://' + ip + '/', { method: 'HEAD', signal: AbortSignal.timeout(500) })
          .then(function() { found.push(ip); render(); })
          .catch(function(e) {
            /* "Load failed" або "NetworkError" = порт є але CORS відхиляє = хост живий */
            var msg = (e && e.message) || '';
            if (msg && msg !== 'Failed to fetch' && !msg.includes('abort') && !msg.includes('timed out')) {
              found.push(ip); render();
            }
          })
          .finally(function() {
            done++;
            var bar = document.getElementById('ips-bar');
            var st  = document.getElementById('ips-st');
            if (bar) bar.style.width = Math.round(done/total*100) + '%';
            if (st)  st.textContent  = done + '/' + total + ' — знайдено: ' + found.length;
            if (done >= total) {
              scanning = false;
              btn.textContent = '\uD83D\uDD0D Сканувати';
              btn.disabled = false;
              if (!found.length) res.innerHTML = '<div style="color:#4a6070;padding:16px;text-align:center;">\uD83D\uDE15 Хостів не знайдено</div>';
            }
            if (idx < total && (idx - done) < BATCH) { tryIP(ips[idx]); idx++; }
          });
        }

        for (var b = 0; b < Math.min(BATCH, total); b++) { tryIP(ips[idx]); idx++; }
      };
    },
    destroy: function() {
      var m = document.getElementById('plg-ip-scan');
      if (m) m.remove();
    }
  });

  /* ─────────────────────────────────────────────
     PLUGIN: Port Scanner
  ───────────────────────────────────────────── */
  BUILTIN_PLUGINS.push({
    id:          'port-scanner',
    name:        '\uD83D\uDD0C Port Scanner',
    description: 'Сканує порти хоста — знаходить відкриті (як Advanced Port Scanner)',
    version:     '1.0.0',
    author:      'MikroTik Generator',
    category:    'tools',
    builtin:     true,
    enabled:     false,
    icon:        '\uD83D\uDD0C',
    init: function() {
      var m = document.getElementById('plg-port-scan');
      if (m) { m.style.display = 'flex'; return; }

      var SVC = {21:'FTP',22:'SSH',23:'Telnet',25:'SMTP',53:'DNS',80:'HTTP',443:'HTTPS',445:'SMB',3306:'MySQL',3389:'RDP',5900:'VNC',8080:'HTTP-Alt',8291:'Winbox',8728:'API',8729:'API-SSL',51820:'WireGuard'};

      m = document.createElement('div');
      m.id = 'plg-port-scan';
      m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:99999;display:flex;align-items:center;justify-content:center;';

      var box = document.createElement('div');
      box.style.cssText = 'background:#0d1821;border:1px solid #2a3b48;border-radius:12px;padding:20px;width:660px;max-width:95vw;display:flex;flex-direction:column;gap:10px;max-height:85vh;';

      /* Header */
      var h = document.createElement('div');
      h.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';
      var t = document.createElement('b');
      t.style.cssText = 'font-size:14px;color:#e6edf3;';
      t.textContent = '\uD83D\uDD0C Advanced Port Scanner';
      var x = document.createElement('button');
      x.textContent = '\u2715';
      x.style.cssText = 'background:none;border:none;color:#8ea3b0;font-size:18px;cursor:pointer;';
      x.onclick = function() { m.style.display = 'none'; };
      h.appendChild(t); h.appendChild(x);

      /* Inputs */
      var row = document.createElement('div');
      row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;';

      function inp(id, lbl, val) {
        var w = document.createElement('div');
        var l = document.createElement('div');
        l.style.cssText = 'font-size:11px;color:#8ea3b0;margin-bottom:3px;';
        l.textContent = lbl;
        var i = document.createElement('input');
        i.id = id; i.value = val;
        i.style.cssText = 'width:100%;box-sizing:border-box;background:#111d27;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:6px 10px;font-size:12px;outline:none;';
        w.appendChild(l); w.appendChild(i); return w;
      }

      row.appendChild(inp('ps-host',  'IP хоста', '192.168.88.1'));
      row.appendChild(inp('ps-ports', 'Порти',    '21,22,80,443,8291,8728'));

      var btn = document.createElement('button');
      btn.textContent = '\uD83D\uDD0C Сканувати';
      btn.style.cssText = 'background:#5fd0a5;color:#082018;border:none;border-radius:6px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;';
      row.appendChild(btn);

      /* Presets */
      var presets = document.createElement('div');
      presets.style.cssText = 'display:flex;gap:5px;flex-wrap:wrap;align-items:center;';
      [
        ['MikroTik', '21,22,23,80,443,8291,8728,8729'],
        ['HTTP',     '80,443,8080,8443'],
        ['1-1024',   '1-1024'],
        ['БД',       '1433,1521,3306,5432,27017'],
      ].forEach(function(p) {
        var b = document.createElement('button');
        b.textContent = p[0];
        b.style.cssText = 'background:#111d27;border:1px solid #2a3b48;color:#8ea3b0;border-radius:4px;padding:2px 8px;font-size:10px;cursor:pointer;';
        b.onclick = function() { var el = document.getElementById('ps-ports'); if (el) el.value = p[1]; };
        presets.appendChild(b);
      });

      /* Progress */
      var prog = document.createElement('div');
      prog.id = 'ps-prog';
      prog.style.display = 'none';
      prog.innerHTML = '<div style="background:#1a2d3d;border-radius:4px;height:4px;"><div id="ps-bar" style="height:100%;background:#5fd0a5;width:0%;border-radius:4px;transition:width .2s;"></div></div><div id="ps-st" style="font-size:11px;color:#8ea3b0;margin-top:3px;"></div>';

      /* Results */
      var res = document.createElement('div');
      res.id = 'ps-res';
      res.style.cssText = 'overflow-y:auto;flex:1;min-height:60px;font-size:12px;color:#4a6070;text-align:center;padding:16px;';
      res.textContent = 'Введи IP і натисни "Сканувати"';

      box.appendChild(h); box.appendChild(row); box.appendChild(presets); box.appendChild(prog); box.appendChild(res);
      m.appendChild(box);
      document.body.appendChild(m);

      /* Scan logic */
      var open = [], scanning = false;

      btn.onclick = function() {
        if (scanning) return;
        var hostEl  = document.getElementById('ps-host');
        var portsEl = document.getElementById('ps-ports');
        var host = hostEl ? hostEl.value.trim() : '';
        var raw  = portsEl ? portsEl.value.trim() : '';
        if (!host || !raw) return;

        var ports = [];
        raw.split(',').forEach(function(p) {
          p = p.trim();
          if (p.indexOf('-') >= 0) {
            var b = p.split('-').map(Number);
            for (var i = b[0]; i <= b[1] && ports.length < 2000; i++) ports.push(i);
          } else {
            var n = parseInt(p, 10);
            if (n > 0 && n <= 65535) ports.push(n);
          }
        });
        if (!ports.length) return;

        open = []; scanning = true;
        var done = 0, total = ports.length, idx = 0, BATCH = 25;

        prog.style.display = 'block';
        res.innerHTML = '<div style="color:#8ea3b0;padding:16px;text-align:center;">\u23F3 ' + total + ' портів на ' + host + '...</div>';
        btn.textContent = '\u23F3 Сканування...';
        btn.disabled = true;

        function render() {
          if (!open.length) return;
          var h2 = '<table style="width:100%;border-collapse:collapse;font-size:11px;">';
          h2 += '<tr style="color:#4a6070;border-bottom:1px solid #1a2d3d;"><th style="padding:4px 8px;text-align:left;">Порт</th><th style="padding:4px 8px;text-align:left;">Сервіс</th><th style="padding:4px 8px;text-align:left;">Стан</th></tr>';
          open.slice().sort(function(a,b){return a-b;}).forEach(function(p) {
            h2 += '<tr style="border-bottom:1px solid #0d1821;"><td style="padding:4px 8px;color:#5fd0a5;font-weight:700;">' + p + '</td><td style="padding:4px 8px;color:#f0a840;">' + (SVC[p]||'\u2014') + '</td><td style="padding:4px 8px;color:#5fd0a5;">\uD83D\uDFE2 Open</td></tr>';
          });
          h2 += '</table>';
          res.innerHTML = h2;
        }

        function tryPort(port) {
          fetch('http://' + host + ':' + port + '/', { method: 'HEAD', signal: AbortSignal.timeout(400) })
          .then(function() { open.push(port); render(); })
          .catch(function(e) {
            var msg = (e && e.message) || '';
            if (msg && msg !== 'Failed to fetch' && !msg.includes('abort') && !msg.includes('timed out')) {
              open.push(port); render();
            }
          })
          .finally(function() {
            done++;
            var bar = document.getElementById('ps-bar');
            var st  = document.getElementById('ps-st');
            if (bar) bar.style.width = Math.round(done/total*100) + '%';
            if (st)  st.textContent  = done + '/' + total + ' — відкритих: ' + open.length;
            if (done >= total) {
              scanning = false;
              btn.textContent = '\uD83D\uDD0C Сканувати';
              btn.disabled = false;
              if (!open.length) res.innerHTML = '<div style="color:#4a6070;padding:16px;text-align:center;">Відкритих портів не знайдено</div>';
            }
            if (idx < total && (idx - done) < BATCH) { tryPort(ports[idx]); idx++; }
          });
        }

        for (var b = 0; b < Math.min(BATCH, total); b++) { tryPort(ports[idx]); idx++; }
      };
    },
    destroy: function() {
      var m = document.getElementById('plg-port-scan');
      if (m) m.remove();
    }
  });

  console.log('[Plugins] IP Scanner + Port Scanner зареєстровано');
};
