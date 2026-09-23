'use strict';
/* ═══════════════════════════════════════════════════════
   rm-torch.js — Real-time Traffic Monitor (Torch)
   Показує трафік per-interface в реальному часі
   ═══════════════════════════════════════════════════════ */

window.rmSectionTraffic = (function() {

  var _interval  = null;
  var _running   = false;
  var _iface     = 'all';
  var _history   = {};   /* { ifaceName: [{ tx, rx, time }] } */
  var _charts    = {};   /* canvas contexts */
  var MAX_POINTS = 60;   /* 60 точок = 60 секунд */

  /* ── Форматування байт/сек ── */
  function fmtRate(bps) {
    if (bps >= 1073741824) return (bps / 1073741824).toFixed(2) + ' Gbps';
    if (bps >= 1048576)    return (bps / 1048576).toFixed(2)    + ' Mbps';
    if (bps >= 1024)       return (bps / 1024).toFixed(1)       + ' Kbps';
    return (bps || 0) + ' bps';
  }

  function fmtBytes(b) {
    if (b >= 1073741824) return (b / 1073741824).toFixed(2) + ' GB';
    if (b >= 1048576)    return (b / 1048576).toFixed(2)    + ' MB';
    if (b >= 1024)       return (b / 1024).toFixed(1)       + ' KB';
    return b + ' B';
  }

  /* ── CSS ── */
  function injectCSS() {
    if (document.getElementById('torch-css')) return;
    var s = document.createElement('style');
    s.id = 'torch-css';
    s.textContent = [
      /* Header */
      '.torch-header { display:flex; align-items:center; gap:10px;',
      '  flex-wrap:wrap; margin-bottom:16px; }',
      '.torch-title { font-size:16px; font-weight:700; color:#c9d8e4;',
      '  display:flex; align-items:center; gap:8px; }',
      '.torch-badge { background:#1a3a2a; color:#5fd0a5;',
      '  border-radius:20px; padding:2px 10px; font-size:11px; }',
      '.torch-badge.red { background:#3a1a1a; color:#e08080; }',
      /* Controls */
      '.torch-controls { display:flex; gap:8px; align-items:center;',
      '  flex-wrap:wrap; margin-bottom:14px; }',
      '.torch-select {',
      '  background:#0d1821; border:1px solid #2a3b48;',
      '  color:#c9d8e4; border-radius:8px; padding:6px 12px;',
      '  font-size:12px; outline:none; cursor:pointer; }',
      '.torch-select:focus { border-color:#5fd0a5; }',
      '.torch-btn {',
      '  background:#1a2a3a; border:1px solid #2a3b48;',
      '  color:#c9d8e4; border-radius:8px; padding:6px 14px;',
      '  font-size:12px; cursor:pointer; transition:all .15s; }',
      '.torch-btn:hover { background:#1c3040; border-color:#5fd0a5; }',
      '.torch-btn.active { background:#1a3a2a; border-color:#5fd0a5;',
      '  color:#5fd0a5; }',
      '.torch-btn.danger { color:#e08080; border-color:#3a2020; }',
      '.torch-btn.danger:hover { background:#2a1010; }',
      /* Stats grid */
      '.torch-stats { display:grid;',
      '  grid-template-columns:repeat(auto-fill,minmax(200px,1fr));',
      '  gap:10px; margin-bottom:16px; }',
      '.torch-stat-card {',
      '  background:#060d14; border:1px solid #1c2a37;',
      '  border-radius:10px; padding:12px 16px; }',
      '.torch-stat-label { font-size:10px; color:#4a6070;',
      '  text-transform:uppercase; letter-spacing:.06em; margin-bottom:4px; }',
      '.torch-stat-val { font-size:18px; font-weight:700; color:#c9d8e4;',
      '  font-family:monospace; }',
      '.torch-stat-val.green { color:#5fd0a5; }',
      '.torch-stat-val.red   { color:#e08080; }',
      '.torch-stat-val.blue  { color:#5b9bd5; }',
      /* Chart */
      '.torch-chart-wrap {',
      '  background:#060d14; border:1px solid #1c2a37;',
      '  border-radius:10px; padding:14px; margin-bottom:14px; }',
      '.torch-chart-title {',
      '  font-size:12px; color:#8ea3b0; margin-bottom:8px;',
      '  display:flex; justify-content:space-between; align-items:center; }',
      '.torch-canvas { width:100%!important; height:140px!important; }',
      /* Interface table */
      '.torch-table-wrap {',
      '  background:#060d14; border:1px solid #1c2a37;',
      '  border-radius:10px; overflow:hidden; margin-bottom:14px; }',
      '.torch-table { width:100%; border-collapse:collapse; font-size:12px; }',
      '.torch-table th {',
      '  padding:8px 14px; background:#0a1520; color:#4a6070;',
      '  text-align:left; font-size:11px; font-weight:600;',
      '  text-transform:uppercase; letter-spacing:.05em;',
      '  border-bottom:1px solid #1c2a37; }',
      '.torch-table td {',
      '  padding:8px 14px; border-bottom:1px solid #0d1a28;',
      '  color:#c9d8e4; vertical-align:middle; }',
      '.torch-table tr:last-child td { border-bottom:none; }',
      '.torch-table tr:hover td { background:#0a1520; cursor:pointer; }',
      '.torch-table tr.selected td { background:#0e1e30; }',
      /* Rate bar */
      '.torch-rate-bar {',
      '  height:4px; border-radius:2px; margin-top:3px;',
      '  background:#1a2a3a; overflow:hidden; }',
      '.torch-rate-fill {',
      '  height:100%; border-radius:2px;',
      '  transition:width .5s ease; }',
      /* Pulse indicator */
      '@keyframes torch-pulse {',
      '  0%   { opacity:1; }',
      '  50%  { opacity:.4; }',
      '  100% { opacity:1; } }',
      '.torch-live { animation:torch-pulse 1.5s infinite;',
      '  color:#5fd0a5; font-size:11px; }',
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ── Отримуємо роутер ── */
  function getRouter() {
    if (window.__rmGetActiveRouter) return window.__rmGetActiveRouter();
    return null;
  }

  /* ── Отримуємо інтерфейси ── */
  function getInterfaces(router) {
    return window.restCall(router, 'GET', '/interface')
      .then(function(data) {
        if (!Array.isArray(data)) return [];
        return data.filter(function(i) {
          return i.type !== 'loopback' && i.running !== 'false';
        });
      })
      .catch(function() { return []; });
  }

  /* ── Отримуємо traffic stats ── */
  function getTraffic(router, ifaces) {
    /* /interface/monitor-traffic — batch запит */
    var names = ifaces.map(function(i) { return i.name; }).join(',');
    return window.restCall(
      router, 'POST',
      '/interface/monitor-traffic',
      { interface: names, once: '' }
    ).then(function(data) {
      return Array.isArray(data) ? data : [];
    }).catch(function() {
      /* Fallback: по одному */
      var promises = ifaces.slice(0, 8).map(function(iface) {
        return window.restCall(
          router, 'POST',
          '/interface/monitor-traffic',
          { interface: iface.name, once: '' }
        ).then(function(d) {
          return Array.isArray(d) ? d[0] : d;
        }).catch(function() { return null; });
      });
      return Promise.all(promises).then(function(res) {
        return res.filter(Boolean);
      });
    });
  }

  /* ── Малюємо міні-графік ── */
  function drawChart(canvas, history, color) {
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w   = canvas.width  = canvas.offsetWidth  || 600;
    var h   = canvas.height = canvas.offsetHeight || 140;

    ctx.clearRect(0, 0, w, h);

    if (!history || history.length < 2) return;

    var maxVal = Math.max.apply(null,
      history.map(function(p) { return Math.max(p.tx, p.rx); })
    ) || 1;

    function drawLine(key, col, fill) {
      ctx.beginPath();
      history.forEach(function(p, i) {
        var x = (i / (MAX_POINTS - 1)) * w;
        var y = h - (p[key] / maxVal) * (h - 10) - 5;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = col;
      ctx.lineWidth   = 2;
      ctx.stroke();

      /* Fill */
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    }

    /* Grid */
    ctx.strokeStyle = '#1c2a37';
    ctx.lineWidth   = 1;
    for (var i = 0; i < 4; i++) {
      var y = (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    /* TX (зелений) */
    drawLine('tx', '#5fd0a5', 'rgba(95,208,165,.1)');
    /* RX (синій) */
    drawLine('rx', '#5b9bd5', 'rgba(91,155,213,.1)');

    /* Легенда */
    ctx.font = '10px monospace';
    ctx.fillStyle = '#5fd0a5';
    ctx.fillText('▲ TX', 8, 14);
    ctx.fillStyle = '#5b9bd5';
    ctx.fillText('▼ RX', 50, 14);
    ctx.fillStyle = '#4a6070';
    ctx.fillText(fmtRate(maxVal) + ' max', w - 80, 14);
  }

  /* ── Головна функція ── */
  function render() {
    injectCSS();
    var cont = document.getElementById('rm-content');
    if (!cont) return;

    var router = getRouter();
    if (!router) {
      cont.innerHTML = '<div style="color:#e08080;padding:20px;">No router connected</div>';
      return;
    }

    stop(); /* Зупиняємо попередній моніторинг */

    cont.innerHTML =
      '<div class="torch-header">' +
        '<div class="torch-title">📈 Traffic Monitor' +
          '<span class="torch-badge torch-live" id="torch-live-badge">● LIVE</span>' +
        '</div>' +
      '</div>' +

      '<div class="torch-controls">' +
        '<select class="torch-select" id="torch-iface-sel">' +
          '<option value="all">All Interfaces</option>' +
        '</select>' +
        '<button class="torch-btn active" id="torch-btn-start">■ Stop</button>' +
        '<button class="torch-btn" id="torch-btn-clear">↺ Clear</button>' +
        '<select class="torch-select" id="torch-interval-sel">' +
          '<option value="1000">1s</option>' +
          '<option value="2000" selected>2s</option>' +
          '<option value="5000">5s</option>' +
        '</select>' +
        '<span style="font-size:11px;color:#4a6070;" id="torch-upd-time"></span>' +
      '</div>' +

      '<div class="torch-stats" id="torch-stats-grid"></div>' +

      '<div class="torch-chart-wrap">' +
        '<div class="torch-chart-title">' +
          '<span>Traffic Rate (bps)</span>' +
          '<span id="torch-chart-legend" style="font-size:10px;">' +
            '<span style="color:#5fd0a5;">▲ TX</span>' +
            '&nbsp;&nbsp;<span style="color:#5b9bd5;">▼ RX</span>' +
          '</span>' +
        '</div>' +
        '<canvas class="torch-canvas" id="torch-main-canvas"></canvas>' +
      '</div>' +

      '<div class="torch-table-wrap">' +
        '<table class="torch-table">' +
          '<thead><tr>' +
            '<th>Interface</th><th>Type</th><th>TX Rate</th>' +
            '<th>RX Rate</th><th>TX Total</th><th>RX Total</th><th>Status</th>' +
          '</tr></thead>' +
          '<tbody id="torch-iface-tbody"></tbody>' +
        '</table>' +
      '</div>';

    /* Завантажуємо інтерфейси */
    getInterfaces(router).then(function(ifaces) {
      if (!ifaces.length) {
        document.getElementById('torch-iface-tbody').innerHTML =
          '<tr><td colspan="7" style="text-align:center;color:#4a6070;padding:20px;">No interfaces found</td></tr>';
        return;
      }

      /* Заповнюємо select */
      var sel = document.getElementById('torch-iface-sel');
      if (sel) {
        ifaces.forEach(function(i) {
          var opt = document.createElement('option');
          opt.value = i.name;
          opt.textContent = i.name + ' (' + (i.type || '?') + ')';
          sel.appendChild(opt);
        });
        sel.onchange = function() {
          _iface = sel.value;
          _history = {};
        };
      }

      /* Ініціалізуємо history */
      ifaces.forEach(function(i) {
        _history[i.name] = [];
      });

      /* Start/Stop кнопка */
      var startBtn = document.getElementById('torch-btn-start');
      if (startBtn) {
        startBtn.onclick = function() {
          if (_running) {
            stop();
            startBtn.textContent = '▶ Start';
            startBtn.classList.remove('active');
            var badge = document.getElementById('torch-live-badge');
            if (badge) { badge.textContent = '● STOPPED'; badge.style.color = '#e08080'; }
          } else {
            startMonitor(router, ifaces);
            startBtn.textContent = '■ Stop';
            startBtn.classList.add('active');
            var badge2 = document.getElementById('torch-live-badge');
            if (badge2) { badge2.textContent = '● LIVE'; badge2.style.color = ''; }
          }
        };
      }

      /* Clear кнопка */
      var clearBtn = document.getElementById('torch-btn-clear');
      if (clearBtn) {
        clearBtn.onclick = function() {
          _history = {};
          ifaces.forEach(function(i) { _history[i.name] = []; });
          var canvas = document.getElementById('torch-main-canvas');
          if (canvas) {
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        };
      }

      /* Interval select */
      var intSel = document.getElementById('torch-interval-sel');

      /* Запускаємо моніторинг */
      startMonitor(router, ifaces, intSel);
    });
  }

  /* ── Запуск моніторингу ── */
  function startMonitor(router, ifaces, intSel) {
    _running = true;

    function tick() {
      if (!_running) return;
      var interval = intSel ? parseInt(intSel.value) || 2000 : 2000;

      getTraffic(router, ifaces).then(function(stats) {
        if (!_running) return;

        var now = Date.now();
        var updEl = document.getElementById('torch-upd-time');
        if (updEl) {
          var d = new Date();
          updEl.textContent = 'Updated: ' +
            d.getHours().toString().padStart(2,'0') + ':' +
            d.getMinutes().toString().padStart(2,'0') + ':' +
            d.getSeconds().toString().padStart(2,'0');
        }

        /* Агрегуємо stats */
        var totalTx = 0, totalRx = 0;
        var statMap = {};

        stats.forEach(function(s) {
          var name = s.name || s['interface'] || '?';
          var tx   = parseInt(s['tx-bits-per-second']  || s['tx-rate'] || 0);
          var rx   = parseInt(s['rx-bits-per-second']  || s['rx-rate'] || 0);
          var txB  = parseInt(s['tx-byte'] || 0);
          var rxB  = parseInt(s['rx-byte'] || 0);
          statMap[name] = { tx: tx, rx: rx, txB: txB, rxB: rxB };
          totalTx += tx;
          totalRx += rx;

          /* Додаємо в history */
          if (!_history[name]) _history[name] = [];
          _history[name].push({ tx: tx, rx: rx, time: now });
          if (_history[name].length > MAX_POINTS) {
            _history[name].shift();
          }
        });

        /* Stats grid */
        var grid = document.getElementById('torch-stats-grid');
        if (grid) {
          grid.innerHTML =
            statCard('Total TX', fmtRate(totalTx), 'green') +
            statCard('Total RX', fmtRate(totalRx), 'blue') +
            statCard('Interfaces', stats.length, '') +
            statCard('Peak TX', fmtRate(Math.max.apply(null,
              Object.values(statMap).map(function(s){return s.tx;})
            )), 'green');
        }

        /* Оновлюємо таблицю */
        var tbody = document.getElementById('torch-iface-tbody');
        if (tbody && ifaces.length) {
          var maxRate = Math.max(totalTx, totalRx, 1);
          tbody.innerHTML = ifaces.map(function(iface) {
            var s    = statMap[iface.name] || { tx:0, rx:0, txB:0, rxB:0 };
            var txPct = Math.min(100, (s.tx / maxRate) * 100).toFixed(1);
            var rxPct = Math.min(100, (s.rx / maxRate) * 100).toFixed(1);
            var running = iface.running === 'true' || iface.running === true;
            return '<tr>' +
              '<td><b>' + iface.name + '</b></td>' +
              '<td style="color:#4a6070;">' + (iface.type || '?') + '</td>' +
              '<td>' +
                '<div style="color:#5fd0a5;font-family:monospace;">' + fmtRate(s.tx) + '</div>' +
                '<div class="torch-rate-bar"><div class="torch-rate-fill" style="width:' + txPct + '%;background:#5fd0a5;"></div></div>' +
              '</td>' +
              '<td>' +
                '<div style="color:#5b9bd5;font-family:monospace;">' + fmtRate(s.rx) + '</div>' +
                '<div class="torch-rate-bar"><div class="torch-rate-fill" style="width:' + rxPct + '%;background:#5b9bd5;"></div></div>' +
              '</td>' +
              '<td style="color:#8ea3b0;font-family:monospace;">' + fmtBytes(s.txB) + '</td>' +
              '<td style="color:#8ea3b0;font-family:monospace;">' + fmtBytes(s.rxB) + '</td>' +
              '<td><span style="color:' + (running ? '#5fd0a5' : '#4a6070') + ';">' +
                (running ? '● Up' : '○ Down') + '</span></td>' +
              '</tr>';
          }).join('');
        }

        /* Малюємо графік */
        var canvas = document.getElementById('torch-main-canvas');
        if (canvas) {
          /* Агрегований history */
          var aggHistory = [];
          var histLen = Math.max.apply(null,
            Object.values(_history).map(function(h){return h.length;})
          ) || 0;
          for (var i = 0; i < histLen; i++) {
            var ptTx = 0, ptRx = 0;
            Object.values(_history).forEach(function(h) {
              var pt = h[i];
              if (pt) { ptTx += pt.tx; ptRx += pt.rx; }
            });
            aggHistory.push({ tx: ptTx, rx: ptRx });
          }
          drawChart(canvas, aggHistory);
        }

        /* Плануємо наступний тік */
        _interval = setTimeout(tick, interval);

      }).catch(function() {
        _interval = setTimeout(tick, 3000);
      });
    }

    tick();
  }

  /* ── Stat card ── */
  function statCard(label, val, cls) {
    return '<div class="torch-stat-card">' +
      '<div class="torch-stat-label">' + label + '</div>' +
      '<div class="torch-stat-val ' + cls + '">' + val + '</div>' +
    '</div>';
  }

  /* ── Stop ── */
  function stop() {
    _running = false;
    if (_interval) { clearTimeout(_interval); _interval = null; }
  }

  /* ── Public ── */
  return function() {
    render();
  };

})();

console.log('[Torch] rm-torch.js loaded');
