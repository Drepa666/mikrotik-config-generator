/* ============================================================
   stats.js — Realtime статистика роутера v1
   CPU, RAM, трафік, uptime — живі дані через REST API
   ============================================================ */
'use strict';

function initStats() {

  var PROXY      = 'http://localhost:8888';
  var statsTimer = null;
  var statsActive = false;
  var charts     = {};

  /* ── Модальне вікно ── */
  var modal = document.createElement('div');
  modal.id = 'stats-modal';
  modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9998;overflow-y:auto;padding:20px;';

  modal.innerHTML = `
  <div style="max-width:960px;margin:auto;background:#16212c;border:1px solid #2a3b48;border-radius:12px;padding:24px;">

    <!-- Шапка -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div>
        <h3 style="margin:0;color:#5fd0a5;font-size:16px;">📊 Realtime статистика</h3>
        <div id="stats-router-name" style="font-size:11px;color:#4a6070;margin-top:2px;">Підключись до роутера</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <span id="stats-uptime" style="font-size:11px;color:#8ea3b0;"></span>
        <select id="stats-interval" style="background:#0d1a24;border:1px solid #2a3b48;color:#e6edf3;padding:5px 8px;border-radius:6px;font-size:11px;">
          <option value="2000">2s</option>
          <option value="5000" selected>5s</option>
          <option value="10000">10s</option>
        </select>
        <button id="stats-start" style="background:#5fd0a5;color:#082018;border:none;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">▶ Старт</button>
        <button id="stats-stop" style="background:#e0665a;color:#fff;border:none;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;display:none;">⏹ Стоп</button>
        <button id="stats-close" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;">✕</button>
      </div>
    </div>

    <!-- Картки статистики -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">

      <!-- CPU -->
      <div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:11px;color:#8ea3b0;margin-bottom:8px;">⚡ CPU</div>
        <div id="stats-cpu-val" style="font-size:32px;font-weight:700;color:#5fd0a5;">—</div>
        <div style="font-size:11px;color:#4a6070;">%</div>
        <div style="background:#1c2a37;border-radius:4px;height:6px;margin-top:10px;overflow:hidden;">
          <div id="stats-cpu-bar" style="height:100%;background:#5fd0a5;width:0%;transition:width .5s;border-radius:4px;"></div>
        </div>
      </div>

      <!-- RAM -->
      <div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:11px;color:#8ea3b0;margin-bottom:8px;">💾 RAM</div>
        <div id="stats-ram-val" style="font-size:32px;font-weight:700;color:#5b9bd5;">—</div>
        <div style="font-size:11px;color:#4a6070;">%</div>
        <div style="background:#1c2a37;border-radius:4px;height:6px;margin-top:10px;overflow:hidden;">
          <div id="stats-ram-bar" style="height:100%;background:#5b9bd5;width:0%;transition:width .5s;border-radius:4px;"></div>
        </div>
        <div id="stats-ram-detail" style="font-size:10px;color:#4a6070;margin-top:4px;"></div>
      </div>

      <!-- HDD/Flash -->
      <div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:11px;color:#8ea3b0;margin-bottom:8px;">💿 Flash</div>
        <div id="stats-hdd-val" style="font-size:32px;font-weight:700;color:#e6b35a;">—</div>
        <div style="font-size:11px;color:#4a6070;">%</div>
        <div style="background:#1c2a37;border-radius:4px;height:6px;margin-top:10px;overflow:hidden;">
          <div id="stats-hdd-bar" style="height:100%;background:#e6b35a;width:0%;transition:width .5s;border-radius:4px;"></div>
        </div>
        <div id="stats-hdd-detail" style="font-size:10px;color:#4a6070;margin-top:4px;"></div>
      </div>

      <!-- Температура -->
      <div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:11px;color:#8ea3b0;margin-bottom:8px;">🌡️ Температура</div>
        <div id="stats-temp-val" style="font-size:32px;font-weight:700;color:#9b87f5;">—</div>
        <div style="font-size:11px;color:#4a6070;">°C</div>
        <div style="background:#1c2a37;border-radius:4px;height:6px;margin-top:10px;overflow:hidden;">
          <div id="stats-temp-bar" style="height:100%;background:#9b87f5;width:0%;transition:width .5s;border-radius:4px;"></div>
        </div>
      </div>

    </div>

    <!-- Графік CPU/RAM (canvas) -->
    <div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:10px;padding:16px;margin-bottom:16px;">
      <div style="font-size:11px;color:#8ea3b0;margin-bottom:10px;">📈 Графік навантаження (останні 60 точок)</div>
      <canvas id="stats-chart" width="900" height="120" style="width:100%;height:120px;"></canvas>
      <div style="display:flex;gap:16px;margin-top:6px;">
        <span style="font-size:10px;color:#5fd0a5;">— CPU</span>
        <span style="font-size:10px;color:#5b9bd5;">— RAM</span>
        <span style="font-size:10px;color:#9b87f5;">— Temp</span>
      </div>
    </div>

    <!-- Інтерфейси трафік -->
    <div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:10px;padding:16px;margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="font-size:11px;color:#8ea3b0;">📡 Трафік інтерфейсів</div>
        <div style="font-size:10px;color:#4a6070;">TX / RX</div>
      </div>
      <div id="stats-ifaces" style="display:grid;gap:6px;"></div>
    </div>

    <!-- DHCP клієнти + активні сесії -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">

      <div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:10px;padding:16px;">
        <div style="font-size:11px;color:#8ea3b0;margin-bottom:10px;">👥 DHCP клієнти</div>
        <div id="stats-dhcp" style="font-size:11px;color:#c9e8d8;max-height:150px;overflow-y:auto;"></div>
      </div>

      <div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:10px;padding:16px;">
        <div style="font-size:11px;color:#8ea3b0;margin-bottom:10px;">🔐 Активні сесії</div>
        <div id="stats-sessions" style="font-size:11px;color:#c9e8d8;max-height:150px;overflow-y:auto;"></div>
      </div>

    </div>

  </div>`;

  document.body.appendChild(modal);

  /* ── Дані для графіку ── */
  var chartData = { cpu: [], ram: [], temp: [] };
  var MAX_POINTS = 60;

  /* ── Canvas графік ── */
  function drawChart() {
    var canvas = document.getElementById('stats-chart');
    if (!canvas) return;
    var ctx    = canvas.getContext('2d');
    var W      = canvas.offsetWidth;
    var H      = 120;
    canvas.width  = W;
    canvas.height = H;

    ctx.clearRect(0, 0, W, H);

    /* Фон сітка */
    ctx.strokeStyle = '#1c2a37';
    ctx.lineWidth   = 1;
    [25, 50, 75].forEach(function(pct) {
      var y = H - (pct / 100) * H;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
      ctx.fillStyle = '#2a3b48';
      ctx.font = '9px monospace';
      ctx.fillText(pct + '%', 2, y - 2);
    });

    function drawLine(data, color) {
      if (data.length < 2) return;
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      data.forEach(function(val, i) {
        var x = (i / (MAX_POINTS - 1)) * W;
        var y = H - (val / 100) * H;
        if (i === 0) ctx.moveTo(x, y);
        else         ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    drawLine(chartData.cpu,  '#5fd0a5');
    drawLine(chartData.ram,  '#5b9bd5');
    drawLine(chartData.temp, '#9b87f5');
  }

  /* ── Форматування байт ── */
  function fmtBytes(bytes) {
    bytes = parseInt(bytes) || 0;
    if (bytes > 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
    if (bytes > 1048576)    return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes > 1024)       return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
  }

  function fmtSpeed(bps) {
    bps = parseInt(bps) || 0;
    if (bps > 1000000) return (bps / 1000000).toFixed(1) + ' Mbps';
    if (bps > 1000)    return (bps / 1000).toFixed(0) + ' Kbps';
    return bps + ' bps';
  }

  /* ── Попередні значення для розрахунку швидкості ── */
  var prevIface = {};
  var prevTime  = 0;

  /* ── Отримуємо дані ── */
  function getHeaders() {
    var authEl = document.getElementById('tm-user');
    var passEl = document.getElementById('tm-pass');
    var ipEl   = document.getElementById('tm-ip');
    var user   = authEl ? authEl.value.trim() : 'admin';
    var pass   = passEl ? passEl.value : '';
    var ip     = ipEl   ? ipEl.value.trim() : '192.168.88.1';
    return {
      'Content-Type':   'application/json',
      'Authorization':  'Basic ' + btoa(user + ':' + pass),
      'X-Router-Host':  ip,
      'X-Router-Port':  '80',
      'X-Router-Proto': 'http',
    };
  }

  function fetchStats() {
    var hdrs = getHeaders();

    /* Resource — CPU, RAM, temp, uptime */
    fetch(PROXY + '/rest/system/resource', { method: 'GET', headers: hdrs })
    .then(function(r) { return r.json(); })
    .then(function(res) {
      res = Array.isArray(res) ? res : (res ? [res] : []);
      var cpu  = parseInt(res['cpu-load']) || 0;
      var free = parseInt(res['free-memory']) || 0;
      var total= parseInt(res['total-memory']) || 1;
      var ram  = Math.round((1 - free / total) * 100);
      var fHdd = parseInt(res['free-hdd-space']) || 0;
      var tHdd = parseInt(res['total-hdd-space']) || 1;
      var hdd  = Math.round((1 - fHdd / tHdd) * 100);
      var temp = parseInt(res['cpu-temperature']) || 0;
      var uptime = res['uptime'] || '';

      /* Оновлюємо картки */
      var cpuEl = document.getElementById('stats-cpu-val');
      var ramEl = document.getElementById('stats-ram-val');
      var hddEl = document.getElementById('stats-hdd-val');
      var tmpEl = document.getElementById('stats-temp-val');

      if (cpuEl) cpuEl.textContent = cpu;
      if (ramEl) ramEl.textContent = ram;
      if (hddEl) hddEl.textContent = hdd;
      if (tmpEl) tmpEl.textContent = temp || '—';

      /* Прогрес-бари */
      var setBar = function(id, pct, dangerAt) {
        var el = document.getElementById(id);
        if (!el) return;
        el.style.width = pct + '%';
        el.style.background = pct > dangerAt ? '#e0665a' : el.style.background;
      };
      setBar('stats-cpu-bar', cpu, 80);
      setBar('stats-ram-bar', ram, 85);
      setBar('stats-hdd-bar', hdd, 90);
      setBar('stats-temp-bar', Math.min(temp / 80 * 100, 100), 80);

      /* Деталі RAM */
      var ramDetail = document.getElementById('stats-ram-detail');
      if (ramDetail) ramDetail.textContent = fmtBytes(total - free) + ' / ' + fmtBytes(total);

      /* Деталі HDD */
      var hddDetail = document.getElementById('stats-hdd-detail');
      if (hddDetail) hddDetail.textContent = fmtBytes(tHdd - fHdd) + ' / ' + fmtBytes(tHdd);

      /* Uptime */
      var uptEl = document.getElementById('stats-uptime');
      if (uptEl) uptEl.textContent = '⏱️ ' + uptime;

      /* Назва роутера */
      var nameEl = document.getElementById('stats-router-name');
      if (nameEl && res.board) nameEl.textContent = res['platform'] + ' | ' + res.board + ' | RouterOS ' + res.version;

      /* Графік */
      chartData.cpu.push(cpu);
      chartData.ram.push(ram);
      chartData.temp.push(temp ? Math.min(temp / 80 * 100, 100) : 0);
      if (chartData.cpu.length  > MAX_POINTS) chartData.cpu.shift();
      if (chartData.ram.length  > MAX_POINTS) chartData.ram.shift();
      if (chartData.temp.length > MAX_POINTS) chartData.temp.shift();
      drawChart();

      /* Кольор CPU картки */
      if (cpuEl) cpuEl.style.color = cpu > 80 ? '#e0665a' : cpu > 50 ? '#e6b35a' : '#5fd0a5';
    })
    .catch(function() {});

    /* Інтерфейси */
    fetch(PROXY + '/rest/interface', { method: 'GET', headers: hdrs })
    .then(function(r) { return r.json(); })
    .then(function(ifaces) {
      ifaces = Array.isArray(ifaces) ? ifaces : (ifaces ? [ifaces] : []);
      var now    = Date.now();
      var dt     = (now - prevTime) / 1000 || 1;
      prevTime   = now;

      var ifaceEl = document.getElementById('stats-ifaces');
      if (!ifaceEl) return;
      ifaceEl.innerHTML = '';

      ifaces.filter(function(i) {
        return i.running === 'true' || i.running === true;
      }).slice(0, 8).forEach(function(iface) {
        var name  = iface.name;
        var txB   = parseInt(iface['tx-byte']) || 0;
        var rxB   = parseInt(iface['rx-byte']) || 0;
        var prev  = prevIface[name] || { tx: txB, rx: rxB };
        var txSpd = Math.max(0, (txB - prev.tx) / dt * 8);
        var rxSpd = Math.max(0, (rxB - prev.rx) / dt * 8);
        prevIface[name] = { tx: txB, rx: rxB };

        var txMax = 100000000; /* 100 Mbps */
        var txPct = Math.min(txSpd / txMax * 100, 100);
        var rxPct = Math.min(rxSpd / txMax * 100, 100);

        var row = document.createElement('div');
        row.style.cssText = 'display:grid;grid-template-columns:80px 1fr 80px;gap:8px;align-items:center;';
        row.innerHTML =
          '<span style="font-size:11px;color:#e6edf3;font-family:monospace;">' + name + '</span>' +
          '<div>' +
          '<div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;">' +
          '<span style="font-size:9px;color:#5fd0a5;width:20px;">TX</span>' +
          '<div style="flex:1;background:#1c2a37;border-radius:2px;height:4px;">' +
          '<div style="height:100%;background:#5fd0a5;width:' + txPct + '%;border-radius:2px;"></div>' +
          '</div>' +
          '<span style="font-size:9px;color:#4a6070;width:60px;text-align:right;">' + fmtSpeed(txSpd) + '</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:4px;">' +
          '<span style="font-size:9px;color:#5b9bd5;width:20px;">RX</span>' +
          '<div style="flex:1;background:#1c2a37;border-radius:2px;height:4px;">' +
          '<div style="height:100%;background:#5b9bd5;width:' + rxPct + '%;border-radius:2px;"></div>' +
          '</div>' +
          '<span style="font-size:9px;color:#4a6070;width:60px;text-align:right;">' + fmtSpeed(rxSpd) + '</span>' +
          '</div>' +
          '</div>' +
          '<span style="font-size:9px;color:#4a6070;text-align:right;">↑' + fmtBytes(txB) + '<br>↓' + fmtBytes(rxB) + '</span>';

        ifaceEl.appendChild(row);
      });
    })
    .catch(function() {});

    /* DHCP клієнти */
    fetch(PROXY + '/rest/ip/dhcp-server/lease', { method: 'GET', headers: hdrs })
    .then(function(r) { return r.json(); })
    .then(function(leases) {
      leases = Array.isArray(leases) ? leases : (leases ? [leases] : []);
      var el = document.getElementById('stats-dhcp');
      if (!el) return;
      var active = leases.filter(function(l) { return l.status === 'bound'; });
      el.innerHTML = '<div style="color:#4a6070;margin-bottom:6px;">Активних: ' + active.length + ' / ' + leases.length + '</div>';
      active.slice(0, 10).forEach(function(l) {
        el.innerHTML +=
          '<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #1c2a37;">' +
          '<span style="color:#c9e8d8;">' + (l['host-name'] || '—') + '</span>' +
          '<span style="color:#4a6070;">' + l.address + '</span>' +
          '</div>';
      });
    })
    .catch(function() {});

    /* Активні сесії */
    fetch(PROXY + '/rest/user/active', { method: 'GET', headers: hdrs })
    .then(function(r) { return r.json(); })
    .then(function(sessions) {
      sessions = Array.isArray(sessions) ? sessions : (sessions ? [sessions] : []);
      var el = document.getElementById('stats-sessions');
      if (!el) return;
      el.innerHTML = '<div style="color:#4a6070;margin-bottom:6px;">Сесій: ' + sessions.length + '</div>';
      sessions.forEach(function(s) {
        el.innerHTML +=
          '<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #1c2a37;">' +
          '<span style="color:#c9e8d8;">' + (s.name || '—') + '</span>' +
          '<span style="color:#4a6070;">' + (s.address || '') + ' ' + (s.via || '') + '</span>' +
          '</div>';
      });
    })
    .catch(function() {});
  }

  /* ── Старт/Стоп ── */
  document.getElementById('stats-start').addEventListener('click', function() {
    statsActive = true;
    var interval = parseInt(document.getElementById('stats-interval').value) || 5000;
    document.getElementById('stats-start').style.display = 'none';
    document.getElementById('stats-stop').style.display  = 'inline-block';

    fetchStats();
    statsTimer = setInterval(fetchStats, interval);
  });

  document.getElementById('stats-stop').addEventListener('click', function() {
    statsActive = false;
    clearInterval(statsTimer);
    document.getElementById('stats-start').style.display = 'inline-block';
    document.getElementById('stats-stop').style.display  = 'none';
  });

  document.getElementById('stats-interval').addEventListener('change', function() {
    if (statsActive) {
      clearInterval(statsTimer);
      statsTimer = setInterval(fetchStats, parseInt(this.value));
    }
  });

  document.getElementById('stats-close').addEventListener('click', function() {
    modal.style.display = 'none';
    clearInterval(statsTimer);
    statsActive = false;
    document.getElementById('stats-start').style.display = 'inline-block';
    document.getElementById('stats-stop').style.display  = 'none';
  });

  modal.addEventListener('click', function(e) {
    if (e.target === modal) document.getElementById('stats-close').click();
  });

  /* ── Кнопка в панелі ── */
  function addBtn() {
    if (document.getElementById('btn-stats')) return true;
    var btn = document.createElement('button');
    btn.id        = 'btn-stats';
    btn.className = 'sec';
    btn.textContent = '📊 Статистика';
    btn.title = 'Realtime статистика роутера';
    btn.addEventListener('click', function() {
      modal.style.display = 'block';
      /* Авто-старт якщо роутер підключений */
      var connectBtn = document.getElementById('tm-connect');
      if (connectBtn && connectBtn.textContent.indexOf('✅') !== -1) {
        document.getElementById('stats-start').click();
      }
    });
    var bar = document.querySelector('.btnbar');
    if (bar) { bar.appendChild(btn); return true; }
    return false;
  }

  if (!addBtn()) {
    var t = setInterval(function() { if (addBtn()) clearInterval(t); }, 300);
  }

  console.log('[stats] v1 ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStats);
} else {
  initStats();
}