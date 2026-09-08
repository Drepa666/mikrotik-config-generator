'use strict';

/* ============================================================
   RM Dashboard — Live графіки CPU/RAM/трафік
   Traffic Monitor — Torch-like хто скільки споживає
   ============================================================ */

(function() {

  var PROXY    = 'http://localhost:8888';
  var INTERVAL = 2000; /* оновлення кожні 2 сек */
  var _timer   = null;
  var _history = { cpu: [], ram: [], tx: [], rx: [] };
  var MAX_PTS  = 60; /* точок на графіку */

  function S()  { return window.RMStore; }
  function esc(s) { return window.RMEsc ? window.RMEsc(s) : String(s||''); }
  function restCall(r,m,p,b) { return window.RMRestCall(r,m,p,b); }
  function router() { return S().getRouter(); }
  function cont()   { return document.getElementById('rm-content'); }

  /* ── Зупиняємо таймер при переключенні секцій ── */
  document.addEventListener('click', function(e) {
    var menuItem = e.target.closest('[data-id]');
    if (menuItem && menuItem.dataset.id !== 'dashboard') {
      stopDashboard();
    }
  });

  function stopDashboard() {
    if (_timer) { clearInterval(_timer); _timer = null; }
  }

  /* ══════════════════════════════════════════════════════════
     STYLES
     ══════════════════════════════════════════════════════════ */
  function injectStyles() {
    if (document.getElementById('rm-dash-styles')) return;
    var s = document.createElement('style');
    s.id = 'rm-dash-styles';
    s.textContent = `
      .rm-dash-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
        margin-bottom: 16px;
      }
      .rm-dash-card {
        background: #111d27;
        border: 1px solid #2a3b48;
        border-radius: 10px;
        padding: 14px 16px;
      }
      .rm-dash-card h4 {
        margin: 0 0 10px;
        font-size: 11px;
        color: #8ea3b0;
        text-transform: uppercase;
        letter-spacing: .06em;
      }
      .rm-dash-val {
        font-size: 26px;
        font-weight: 700;
        color: #5fd0a5;
        font-variant-numeric: tabular-nums;
      }
      .rm-dash-sub {
        font-size: 11px;
        color: #4a6070;
        margin-top: 2px;
      }
      .rm-chart-wrap {
        position: relative;
        height: 60px;
        margin-top: 8px;
      }
      .rm-chart {
        width: 100%;
        height: 100%;
        display: block;
      }
      /* Gauge */
      .rm-gauge {
        position: relative;
        width: 80px;
        height: 80px;
        margin: 0 auto;
      }
      .rm-gauge svg { width: 80px; height: 80px; }
      .rm-gauge-val {
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        font-size: 15px;
        font-weight: 700;
        color: #5fd0a5;
      }
      /* Traffic table */
      .rm-torch-wrap {
        margin-top: 16px;
      }
      .rm-torch-bar {
        height: 6px;
        background: #1a2d3d;
        border-radius: 3px;
        overflow: hidden;
        margin-top: 3px;
      }
      .rm-torch-fill {
        height: 100%;
        border-radius: 3px;
        transition: width .5s;
      }
      /* Live badge */
      .rm-live-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        color: #5fd0a5;
        padding: 2px 8px;
        background: #0d2a1a;
        border: 1px solid #2f7a5c;
        border-radius: 10px;
      }
      /* Spark line */
      .rm-sparkline { margin-top: 6px; }
    `;
    document.head.appendChild(s);
  }

  /* ══════════════════════════════════════════════════════════
     MAIN DASHBOARD
     ══════════════════════════════════════════════════════════ */
  window.rmSectionDashboard = function() {
    var r = router(); if (!r) return;
    injectStyles();
    stopDashboard();
    _history = { cpu: [], ram: [], tx: [], rx: [] };

    var c = cont(); if (!c) return;

    c.innerHTML =
      '<div class="rm-section-title">📊 Dashboard — ' + esc(r.name || r.ip) +
        '<div style="margin-left:auto;display:flex;gap:8px;align-items:center;">' +
          '<span class="rm-live-badge"><span class="rm-live-dot"></span> Live</span>' +
          '<button class="rm-btn rm-btn-secondary" style="font-size:11px;" onclick="window.rmSectionDashboard()">🔄</button>' +
        '</div>' +
      '</div>' +
      '<div id="rm-dash-top" class="rm-dash-grid"></div>' +
      '<div id="rm-dash-charts" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;"></div>' +
      '<div id="rm-dash-ifaces"></div>' +
      '<div id="rm-dash-torch" class="rm-torch-wrap"></div>';

    /* Перше завантаження */
    updateDashboard(r);

    /* Потім кожні 2 секунди */
    _timer = setInterval(function() {
      if (!document.getElementById('rm-dash-top')) {
        stopDashboard();
        return;
      }
      updateDashboard(r);
    }, INTERVAL);

    window.__rmRefreshSection = function() {
      stopDashboard();
      window.rmSectionDashboard();
    };
  };

  function updateDashboard(r) {
    Promise.all([
      restCall(r, 'GET', '/system/resource'),
      restCall(r, 'GET', '/interface'),
      restCall(r, 'GET', '/system/health').catch(function() { return []; }),
      restCall(r, 'GET', '/ip/dhcp-server/lease').catch(function() { return []; }),
    ]).then(function(results) {
      var res    = results[0] || {};
      var ifaces = results[1] || [];
      var health = results[2] || [];
      var leases = results[3] || [];

      /* ── Метрики ── */
      var cpu     = parseInt(res['cpu-load']      || 0);
      var ramFree = parseInt(res['free-memory']   || 0);
      var ramTot  = parseInt(res['total-memory']  || 1);
      var ramUsed = Math.round((1 - ramFree / ramTot) * 100);
      var hddFree = parseInt(res['free-hdd-space']|| 0);
      var hddTot  = parseInt(res['total-hdd-space']|| 1);
      var hddUsed = Math.round((1 - hddFree / hddTot) * 100);

      /* Підраховуємо TX/RX з інтерфейсів */
      var totalTx = 0, totalRx = 0;
      var runningIfaces = ifaces.filter(function(i) { return i.running === 'true' && i.disabled !== 'true'; });

      runningIfaces.forEach(function(i) {
        totalTx += parseInt(i['tx-byte'] || 0);
        totalRx += parseInt(i['rx-byte'] || 0);
      });

      /* Зберігаємо в history */
      push(_history.cpu, cpu);
      push(_history.ram, ramUsed);
      push(_history.tx,  totalTx);
      push(_history.rx,  totalRx);

      /* TX/RX швидкість (різниця між двома останніми) */
      var txRate = calcRate(_history.tx);
      var rxRate = calcRate(_history.rx);

      /* Температура */
      var temp = null;
      if (Array.isArray(health)) {
        var tempItem = health.find(function(h) { return h.name === 'temperature' || h.type === 'C'; });
        if (tempItem) temp = tempItem.value + '°C';
      }

      /* Клієнти DHCP */
      var boundLeases = leases.filter(function(l) { return l.status === 'bound'; }).length;

      /* Рендеримо Top Stats */
      renderTopStats({
        cpu, ramUsed, hddUsed, temp,
        uptime:   res.uptime  || '—',
        version:  res.version || '—',
        board:    res['board-name'] || '—',
        txRate, rxRate, boundLeases,
        running:  runningIfaces.length,
        total:    ifaces.length,
      });

      /* Рендеримо Charts */
      renderCharts();

      /* Рендеримо інтерфейси */
      renderIfaceTraffic(ifaces);

    }).catch(function(e) {
      console.warn('[Dashboard] Помилка:', e);
    });
  }

  /* ── Top Stats Cards ── */
  function renderTopStats(d) {
    var el = document.getElementById('rm-dash-top');
    if (!el) return;

    var cpuColor  = d.cpu  > 80 ? '#e05252' : d.cpu  > 50 ? '#f0a840' : '#5fd0a5';
    var ramColor  = d.ramUsed > 85 ? '#e05252' : d.ramUsed > 65 ? '#f0a840' : '#5fd0a5';
    var hddColor  = d.hddUsed > 85 ? '#e05252' : d.hddUsed > 70 ? '#f0a840' : '#5fd0a5';
    var tempColor = d.temp && parseInt(d.temp) > 70 ? '#e05252' : d.temp && parseInt(d.temp) > 55 ? '#f0a840' : '#5fd0a5';

    el.innerHTML =
      statCard('🖥️ CPU', '<span style="color:' + cpuColor + ';">' + d.cpu + '%</span>',
        gauge(d.cpu, cpuColor), 'Load') +
      statCard('💾 RAM', '<span style="color:' + ramColor + ';">' + d.ramUsed + '%</span>',
        gauge(d.ramUsed, ramColor), 'Used') +
      statCard('💿 Disk', '<span style="color:' + hddColor + ';">' + d.hddUsed + '%</span>',
        gauge(d.hddUsed, hddColor), 'Used') +
      (d.temp ?
        statCard('🌡️ Temp', '<span style="color:' + tempColor + ';">' + d.temp + '</span>', '', '') : '') +
      statCard('⬆️ TX', '<span style="color:#5fd0a5;">' + fmtSpeed(d.txRate) + '</span>', '', 'Upload') +
      statCard('⬇️ RX', '<span style="color:#60b8f0;">' + fmtSpeed(d.rxRate) + '</span>', '', 'Download') +
      statCard('🕐 Uptime', '<span style="font-size:14px;">' + esc(d.uptime) + '</span>', '', '') +
      statCard('🌐 Interfaces', '<span style="color:#5fd0a5;">' + d.running + '</span><span style="color:#4a6070;font-size:14px;">/' + d.total + '</span>', '', 'Running') +
      statCard('💻 DHCP', '<span style="color:#5fd0a5;">' + d.boundLeases + '</span>', '', 'Clients') +
      statCard('📦 RouterOS', '<span style="font-size:13px;">' + esc(d.version) + '</span>', '', esc(d.board));
  }

  function statCard(title, val, extra, sub) {
    return '<div class="rm-dash-card">' +
      '<h4>' + title + '</h4>' +
      '<div class="rm-dash-val">' + val + '</div>' +
      (extra ? extra : '') +
      (sub ? '<div class="rm-dash-sub">' + sub + '</div>' : '') +
    '</div>';
  }

  /* ── SVG Gauge ── */
  function gauge(pct, color) {
    var r  = 28;
    var cx = 40; var cy = 40;
    var circ = 2 * Math.PI * r;
    var dash = (pct / 100) * circ;
    return '<div class="rm-gauge" style="width:80px;height:80px;margin-top:8px;">' +
      '<svg viewBox="0 0 80 80">' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#1a2d3d" stroke-width="8"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="8"' +
          ' stroke-dasharray="' + dash + ' ' + circ + '"' +
          ' stroke-linecap="round"' +
          ' transform="rotate(-90 ' + cx + ' ' + cy + ')"' +
          ' style="transition:stroke-dasharray .5s;"/>' +
      '</svg>' +
      '<div class="rm-gauge-val" style="color:' + color + ';">' + pct + '%</div>' +
    '</div>';
  }

  /* ── Charts ── */
  function renderCharts() {
    var el = document.getElementById('rm-dash-charts');
    if (!el) return;

    el.innerHTML =
      '<div class="rm-dash-card">' +
        '<h4>CPU % — остання хвилина</h4>' +
        sparkline(_history.cpu, '#5fd0a5', 0, 100) +
      '</div>' +
      '<div class="rm-dash-card">' +
        '<h4>RAM % — остання хвилина</h4>' +
        sparkline(_history.ram, '#60b8f0', 0, 100) +
      '</div>';
  }

  /* ── SVG Sparkline ── */
  function sparkline(data, color, min, max) {
    if (data.length < 2) return '<div style="height:60px;color:#4a6070;font-size:11px;padding-top:20px;text-align:center;">Збір даних...</div>';

    var W = 400; var H = 60;
    var pts = data.slice(-MAX_PTS);
    var lo  = min !== undefined ? min : Math.min.apply(null, pts);
    var hi  = max !== undefined ? max : Math.max.apply(null, pts) || 1;
    var step = W / (pts.length - 1);

    var coords = pts.map(function(v, i) {
      var x = i * step;
      var y = H - ((v - lo) / (hi - lo || 1)) * (H - 8) - 4;
      return x + ',' + y;
    });

    var polyline = coords.join(' ');

    /* Area fill */
    var areaCoords = '0,' + H + ' ' + coords[0] + ' ' + polyline + ' ' + (W) + ',' + H;

    /* Поточне значення */
    var last = pts[pts.length - 1];
    var lastX = (pts.length - 1) * step;
    var lastY = H - ((last - lo) / (hi - lo || 1)) * (H - 8) - 4;

    return '<svg class="rm-chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" style="height:60px;">' +
      '<defs>' +
        '<linearGradient id="sg-' + color.replace('#','') + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="' + color + '" stop-opacity=".3"/>' +
          '<stop offset="100%" stop-color="' + color + '" stop-opacity=".02"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<polygon points="' + areaCoords + '" fill="url(#sg-' + color.replace('#','') + ')"/>' +
      '<polyline points="' + polyline + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<circle cx="' + lastX + '" cy="' + lastY + '" r="3" fill="' + color + '"/>' +
      '<text x="' + (lastX - 2) + '" y="' + (lastY - 6) + '" font-size="9" fill="' + color + '" text-anchor="middle">' + last + '</text>' +
    '</svg>';
  }

  /* ── Interface Traffic Table ── */
  function renderIfaceTraffic(ifaces) {
    var el = document.getElementById('rm-dash-ifaces');
    if (!el) return;

    var active = ifaces.filter(function(i) { return i.running === 'true' && i.disabled !== 'true'; });
    if (!active.length) { el.innerHTML = ''; return; }

    /* Знаходимо максимальний трафік для нормалізації bar */
    var maxTx = Math.max.apply(null, active.map(function(i) { return parseInt(i['tx-byte']||0); })) || 1;
    var maxRx = Math.max.apply(null, active.map(function(i) { return parseInt(i['rx-byte']||0); })) || 1;

    var html = '<div class="rm-dash-card">' +
      '<h4>🌐 Interface Traffic</h4>' +
      '<table class="rm-table rm-table-compact" style="margin-top:8px;">' +
        '<tr><th>Interface</th><th>Type</th><th>TX Bytes</th><th>RX Bytes</th><th style="width:200px;">Traffic</th></tr>';

    active.forEach(function(iface) {
      var tx    = parseInt(iface['tx-byte'] || 0);
      var rx    = parseInt(iface['rx-byte'] || 0);
      var txPct = Math.round((tx / maxTx) * 100);
      var rxPct = Math.round((rx / maxRx) * 100);

      html += '<tr>' +
        '<td><b>' + esc(iface.name||'') + '</b></td>' +
        '<td style="font-size:11px;color:#8ea3b0;">' + esc(iface.type||'') + '</td>' +
        '<td style="font-family:monospace;font-size:11px;">' + fmtBytes(tx) + '</td>' +
        '<td style="font-family:monospace;font-size:11px;">' + fmtBytes(rx) + '</td>' +
        '<td>' +
          '<div style="font-size:9px;color:#5fd0a5;margin-bottom:2px;">TX</div>' +
          '<div class="rm-torch-bar"><div class="rm-torch-fill" style="width:' + txPct + '%;background:#5fd0a5;"></div></div>' +
          '<div style="font-size:9px;color:#60b8f0;margin-top:3px;margin-bottom:2px;">RX</div>' +
          '<div class="rm-torch-bar"><div class="rm-torch-fill" style="width:' + rxPct + '%;background:#60b8f0;"></div></div>' +
        '</td>' +
      '</tr>';
    });

    html += '</table></div>';
    el.innerHTML = html;
  }

  /* ══════════════════════════════════════════════════════════
     TRAFFIC MONITOR (Torch-like)
     ══════════════════════════════════════════════════════════ */
  window.rmSectionTraffic = function() {
    var r = router(); if (!r) return;
    injectStyles();
    stopDashboard();

    var c = cont(); if (!c) return;
    var selectedIface = 'all';

    c.innerHTML =
      '<div class="rm-section-title">📈 Traffic Monitor' +
        '<div style="margin-left:auto;display:flex;gap:8px;align-items:center;">' +
          '<span class="rm-live-badge"><span class="rm-live-dot"></span> Live 2s</span>' +
          '<button class="rm-btn rm-btn-secondary" style="font-size:11px;" onclick="stopDashboard();window.rmSectionTraffic()">🔄</button>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">' +
        '<select id="rm-torch-iface" style="background:#0d1821;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:6px 10px;font-size:12px;">' +
          '<option value="all">Всі інтерфейси</option>' +
        '</select>' +
        '<select id="rm-torch-sort" style="background:#0d1821;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:6px 10px;font-size:12px;">' +
          '<option value="tx">Сортувати: TX ↓</option>' +
          '<option value="rx">Сортувати: RX ↓</option>' +
          '<option value="name">Сортувати: Name</option>' +
        '</select>' +
      '</div>' +
      '<div id="rm-torch-content" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div id="rm-torch-table"></div>' +
        '<div id="rm-torch-chart" class="rm-dash-card"><h4>TX/RX швидкість</h4><div id="rm-torch-spark"></div></div>' +
      '</div>';

    /* Завантажуємо інтерфейси в dropdown */
    restCall(r, 'GET', '/interface').then(function(ifaces) {
      var sel = document.getElementById('rm-torch-iface');
      if (sel && Array.isArray(ifaces)) {
        ifaces.forEach(function(iface) {
          var opt = document.createElement('option');
          opt.value = iface.name;
          opt.textContent = iface.name + ' (' + (iface.type||'') + ')';
          sel.appendChild(opt);
        });
        sel.addEventListener('change', function() {
          selectedIface = sel.value;
        });
      }
    });

    var prevStats = {};
    var txHistory = [];
    var rxHistory = [];

    function tick() {
      if (!document.getElementById('rm-torch-table')) { stopDashboard(); return; }

      restCall(r, 'GET', '/interface').then(function(ifaces) {
        if (!Array.isArray(ifaces)) return;

        var sort = (document.getElementById('rm-torch-sort') || {}).value || 'tx';

        /* Рахуємо швидкість */
        var rows = ifaces.map(function(iface) {
          var name = iface.name;
          var tx   = parseInt(iface['tx-byte'] || 0);
          var rx   = parseInt(iface['rx-byte'] || 0);
          var prev = prevStats[name] || { tx: tx, rx: rx };
          var txS  = Math.max(0, tx - prev.tx) / (INTERVAL / 1000);
          var rxS  = Math.max(0, rx - prev.rx) / (INTERVAL / 1000);
          prevStats[name] = { tx: tx, rx: rx };
          return {
            name:    name,
            type:    iface.type || '',
            running: iface.running === 'true',
            disabled:iface.disabled === 'true',
            txTotal: tx,
            rxTotal: rx,
            txSpeed: txS,
            rxSpeed: rxS,
          };
        });

        /* Фільтрація */
        var selIface = (document.getElementById('rm-torch-iface') || {}).value || 'all';
        if (selIface !== 'all') {
          rows = rows.filter(function(r) { return r.name === selIface; });
        }

        /* Сортування */
        rows.sort(function(a, b) {
          if (sort === 'tx')   return b.txSpeed - a.txSpeed;
          if (sort === 'rx')   return b.rxSpeed - a.rxSpeed;
          if (sort === 'name') return a.name.localeCompare(b.name);
          return 0;
        });

        /* Загальна швидкість */
        var totalTx = rows.reduce(function(s, r) { return s + r.txSpeed; }, 0);
        var totalRx = rows.reduce(function(s, r) { return s + r.rxSpeed; }, 0);
        push(txHistory, Math.round(totalTx));
        push(rxHistory, Math.round(totalRx));

        /* Максимальна швидкість для bar */
        var maxSpeed = Math.max(
          Math.max.apply(null, rows.map(function(r) { return r.txSpeed; })) || 1,
          Math.max.apply(null, rows.map(function(r) { return r.rxSpeed; })) || 1
        );

        /* Рендеримо таблицю */
        var tableEl = document.getElementById('rm-torch-table');
        if (!tableEl) return;

        var html = '<div class="rm-dash-card">' +
          '<h4>Interface Traffic — ' +
            '<span style="color:#5fd0a5;">TX ' + fmtSpeed(totalTx) + '</span> / ' +
            '<span style="color:#60b8f0;">RX ' + fmtSpeed(totalRx) + '</span>' +
          '</h4>' +
          '<table class="rm-table rm-table-compact">' +
            '<tr><th>Interface</th><th>TX/s</th><th>RX/s</th><th>TX Total</th><th>RX Total</th><th style="width:120px;">Bar</th></tr>';

        rows.forEach(function(row) {
          if (row.disabled) return;
          var txPct = Math.round((row.txSpeed / maxSpeed) * 100);
          var rxPct = Math.round((row.rxSpeed / maxSpeed) * 100);
          var color = row.running ? '#5fd0a5' : '#4a6070';

          html += '<tr style="' + (!row.running ? 'opacity:.4;' : '') + '">' +
            '<td><b style="color:' + color + ';">' + esc(row.name) + '</b>' +
              '<div style="font-size:10px;color:#4a6070;">' + esc(row.type) + '</div></td>' +
            '<td style="font-family:monospace;color:#5fd0a5;font-size:12px;">' + fmtSpeed(row.txSpeed) + '</td>' +
            '<td style="font-family:monospace;color:#60b8f0;font-size:12px;">' + fmtSpeed(row.rxSpeed) + '</td>' +
            '<td style="font-family:monospace;font-size:11px;color:#8ea3b0;">' + fmtBytes(row.txTotal) + '</td>' +
            '<td style="font-family:monospace;font-size:11px;color:#8ea3b0;">' + fmtBytes(row.rxTotal) + '</td>' +
            '<td>' +
              '<div class="rm-torch-bar"><div class="rm-torch-fill" style="width:' + txPct + '%;background:#5fd0a5;"></div></div>' +
              '<div class="rm-torch-bar" style="margin-top:3px;"><div class="rm-torch-fill" style="width:' + rxPct + '%;background:#60b8f0;"></div></div>' +
            '</td>' +
          '</tr>';
        });

        html += '</table></div>';
        tableEl.innerHTML = html;

        /* Рендеримо sparkline */
        var sparkEl = document.getElementById('rm-torch-spark');
        if (sparkEl) {
          sparkEl.innerHTML =
            '<div style="font-size:11px;color:#5fd0a5;margin-bottom:4px;">TX</div>' +
            sparkline(txHistory, '#5fd0a5') +
            '<div style="font-size:11px;color:#60b8f0;margin-top:8px;margin-bottom:4px;">RX</div>' +
            sparkline(rxHistory, '#60b8f0');
        }
      });
    }

    tick();
    _timer = setInterval(tick, INTERVAL);

    window.__rmRefreshSection = function() {
      stopDashboard();
      window.rmSectionTraffic();
    };
  };

  /* ══════════════════════════════════════════════════════════
     УТИЛІТИ
     ══════════════════════════════════════════════════════════ */
  function push(arr, val) {
    arr.push(val);
    if (arr.length > MAX_PTS) arr.shift();
  }

  function calcRate(history) {
    if (history.length < 2) return 0;
    var diff = history[history.length - 1] - history[history.length - 2];
    return Math.max(0, diff / (INTERVAL / 1000));
  }

  function fmtBytes(b) {
    b = parseInt(b) || 0;
    if (b > 1073741824) return (b/1073741824).toFixed(2) + ' GB';
    if (b > 1048576)    return (b/1048576).toFixed(1) + ' MB';
    if (b > 1024)       return (b/1024).toFixed(0) + ' KB';
    return b + ' B';
  }

  function fmtSpeed(bps) {
    bps = parseInt(bps) || 0;
    if (bps > 125000000) return (bps/125000000).toFixed(1) + ' Gbps';
    if (bps > 125000)    return (bps/125000).toFixed(1) + ' Mbps';
    if (bps > 125)       return (bps/125).toFixed(0) + ' Kbps';
    return (bps * 8) + ' bps';
  }

  /* Зупиняємо таймер — глобальна функція */
  window.stopDashboard = stopDashboard;

  console.log('[Dashboard] завантажено — Live графіки активні');

})();