'use strict';
(function() {

  var PROXY = 'http://localhost:8888';

  /* ════════════════════════════════════════
     ДАНІ
  ════════════════════════════════════════ */
  var nodes    = [];   /* { id, type, label, x, y, ip, mac, iface } */
  var edges    = [];   /* { from, to, label, speed, active } */
  var selected = null;
  var dragging = null;
  var dragOffX = 0, dragOffY = 0;
  var scale    = 1;
  var panX     = 0, panY = 0;
  var isPanning = false;
  var panStartX = 0, panStartY = 0;
  var liveTimer = null;
  var liveActive = false;

  /* ════════════════════════════════════════
     ІКОНКИ ВУЗЛІВ
  ════════════════════════════════════════ */
  var NODE_TYPES = {
    router:   { icon: '\uD83D\uDCF6', color: '#5fd0a5', label: 'Router' },
    switch:   { icon: '\uD83D\uDD00', color: '#5b9bd5', label: 'Switch' },
    pc:       { icon: '\uD83D\uDCBB', color: '#8ea3b0', label: 'PC' },
    laptop:   { icon: '\uD83D\uDCBB', color: '#9b87f5', label: 'Laptop' },
    phone:    { icon: '\uD83D\uDCF1', color: '#e6b35a', label: 'Phone' },
    ap:       { icon: '\uD83D\uDCE1', color: '#5fd0a5', label: 'AP' },
    server:   { icon: '\uD83D\uDDA5\uFE0F', color: '#e0665a', label: 'Server' },
    cloud:    { icon: '\u2601\uFE0F',  color: '#4a6070', label: 'Internet' },
    unknown:  { icon: '\uD83D\uDD35', color: '#4a6070', label: 'Device' },
  };

  /* ════════════════════════════════════════
     МОДАЛЬНЕ ВІКНО
  ════════════════════════════════════════ */
  var modal = document.createElement('div');
  modal.id = 'topo-modal';
  modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.95);z-index:9998;flex-direction:column;';

  modal.innerHTML =
    /* ── Шапка ── */
    '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 20px;background:#0d1a24;border-bottom:1px solid #2a3b48;flex-shrink:0;">' +
    '<div style="display:flex;align-items:center;gap:12px;">' +
    '<span style="font-size:16px;font-weight:700;color:#5fd0a5;">\uD83D\uDDFA\uFE0F Візуальна топологія мережі</span>' +
    '<span id="topo-node-count" style="font-size:11px;color:#4a6070;"></span>' +
    '</div>' +

    '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">' +

    /* Підключення */
    '<input id="topo-ip" type="text" value="192.168.88.1" placeholder="IP роутера"' +
    ' style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:5px 8px;border-radius:5px;font-size:11px;width:120px;">' +
    '<input id="topo-user" type="text" value="admin" placeholder="логін"' +
    ' style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:5px 8px;border-radius:5px;font-size:11px;width:70px;">' +
    '<input id="topo-pass" type="password" placeholder="пароль"' +
    ' style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:5px 8px;border-radius:5px;font-size:11px;width:80px;">' +
    '<button id="topo-load-btn" style="background:#5fd0a5;color:#082018;border:none;padding:5px 12px;border-radius:5px;cursor:pointer;font-size:11px;font-weight:700;">\uD83D\uDD04 Завантажити</button>' +

    /* Live */
    '<select id="topo-live-interval" style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:5px 6px;border-radius:5px;font-size:11px;">' +
    '<option value="0">Live: вимк</option>' +
    '<option value="5000">Live: 5s</option>' +
    '<option value="10000">Live: 10s</option>' +
    '<option value="30000">Live: 30s</option>' +
    '</select>' +

    /* Інструменти */
    '<button id="topo-layout-btn" title="Авто-розміщення" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:5px 10px;border-radius:5px;cursor:pointer;font-size:11px;">\uD83D\uDD04 Авто</button>' +
    '<button id="topo-fit-btn" title="Вписати в екран" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:5px 10px;border-radius:5px;cursor:pointer;font-size:11px;">\u26F6 Fit</button>' +
    '<button id="topo-export-btn" title="Зберегти PNG" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:5px 10px;border-radius:5px;cursor:pointer;font-size:11px;">\uD83D\uDCF8 PNG</button>' +
    '<button id="topo-save-btn" title="Зберегти топологію" style="background:transparent;border:1px solid #5fd0a5;color:#5fd0a5;padding:5px 10px;border-radius:5px;cursor:pointer;font-size:11px;">\uD83D\uDCBE Зберегти</button>' +
    '<button id="topo-close" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:5px 10px;border-radius:5px;cursor:pointer;font-size:12px;">\u2715</button>' +
    '</div></div>' +

    /* ── Панель інструментів ── */
    '<div style="display:flex;gap:6px;align-items:center;padding:8px 20px;background:#0a1520;border-bottom:1px solid #1c2a37;flex-shrink:0;flex-wrap:wrap;">' +

    '<span style="font-size:11px;color:#4a6070;">Додати вузол:</span>' +
    Object.keys(NODE_TYPES).map(function(t) {
      return '<button class="topo-add-node" data-type="' + t + '" title="Додати ' + NODE_TYPES[t].label + '"' +
        ' style="background:transparent;border:1px solid #2a3b48;color:' + NODE_TYPES[t].color + ';' +
        'padding:4px 8px;border-radius:4px;cursor:pointer;font-size:12px;">' +
        NODE_TYPES[t].icon + ' ' + NODE_TYPES[t].label + '</button>';
    }).join('') +

    '<span style="color:#2a3b48;padding:0 4px;">|</span>' +
    '<button id="topo-del-node" title="Видалити вибраний" style="background:transparent;border:1px solid #e0665a44;color:#e0665a;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;">\uD83D\uDDD1\uFE0F Видалити</button>' +
    '<button id="topo-clear-btn" title="Очистити все" style="background:transparent;border:1px solid #e0665a44;color:#e0665a;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;">\uD83D\uDDD1\uFE0F Очистити все</button>' +

    '<span style="color:#2a3b48;padding:0 4px;">|</span>' +
    '<span style="font-size:11px;color:#4a6070;">\uD83D\uDD0D</span>' +
    '<input id="topo-zoom" type="range" min="30" max="200" value="100" style="width:80px;accent-color:#5fd0a5;">' +
    '<span id="topo-zoom-val" style="font-size:11px;color:#4a6070;min-width:35px;">100%</span>' +

    '<span id="topo-status" style="font-size:11px;color:#5fd0a5;margin-left:auto;"></span>' +
    '</div>' +

    /* ── Основна область ── */
    '<div style="display:flex;flex:1;overflow:hidden;">' +

    /* Canvas */
    '<div id="topo-canvas-wrap" style="flex:1;position:relative;overflow:hidden;background:#060d14;cursor:grab;">' +
    '<canvas id="topo-canvas"></canvas>' +
    '<div id="topo-tooltip" style="display:none;position:absolute;background:#0d1a24;border:1px solid #2a3b48;border-radius:6px;padding:8px 12px;font-size:11px;color:#c9e8d8;pointer-events:none;z-index:10;max-width:200px;"></div>' +
    '</div>' +

    /* Панель деталей */
    '<div id="topo-detail" style="width:260px;background:#0d1a24;border-left:1px solid #2a3b48;padding:16px;overflow-y:auto;flex-shrink:0;font-size:12px;">' +
    '<div style="color:#4a6070;text-align:center;padding:40px 0;">Клікни на вузол<br>для деталей</div>' +
    '</div>' +

    '</div>' +

    /* ── Статус бар ── */
    '<div style="display:flex;gap:16px;padding:6px 20px;background:#0d1a24;border-top:1px solid #1c2a37;flex-shrink:0;font-size:11px;color:#4a6070;">' +
    '<span>\uD83D\uDDA5\uFE0F ЛКМ — вибір/перетягування</span>' +
    '<span>\uD83D\uDDA5\uFE0F ПКМ+drag — панорама</span>' +
    '<span>\uD83D\uDDA5\uFE0F Scroll — масштаб</span>' +
    '<span>\uD83D\uDDA5\uFE0F Shift+клік — з\'єднати вузли</span>' +
    '<span id="topo-coords" style="margin-left:auto;"></span>' +
    '</div>';

  document.body.appendChild(modal);

  /* ════════════════════════════════════════
     CANVAS
  ════════════════════════════════════════ */
  var canvas = document.getElementById('topo-canvas');
  var ctx    = canvas.getContext('2d');
  var wrap   = document.getElementById('topo-canvas-wrap');

  function resizeCanvas() {
    canvas.width  = wrap.offsetWidth;
    canvas.height = wrap.offsetHeight;
    draw();
  }

  window.addEventListener('resize', resizeCanvas);

  /* ════════════════════════════════════════
     МАЛЮВАННЯ
  ════════════════════════════════════════ */
  var NODE_R = 32; /* радіус вузла */

  function worldToScreen(wx, wy) {
    return {
      x: wx * scale + panX,
      y: wy * scale + panY,
    };
  }

  function screenToWorld(sx, sy) {
    return {
      x: (sx - panX) / scale,
      y: (sy - panY) / scale,
    };
  }

  function draw() {
    var W = canvas.width;
    var H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    /* Фон сітка */
    ctx.save();
    ctx.strokeStyle = '#0d1a24';
    ctx.lineWidth   = 1;
    var gridSize = 40 * scale;
    var startX   = panX % gridSize;
    var startY   = panY % gridSize;
    for (var gx = startX; gx < W; gx += gridSize) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (var gy = startY; gy < H; gy += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }
    ctx.restore();

    /* Ребра */
    edges.forEach(function(e) {
      var from = nodes.find(function(n) { return n.id === e.from; });
      var to   = nodes.find(function(n) { return n.id === e.to; });
      if (!from || !to) return;

      var fs = worldToScreen(from.x, from.y);
      var ts = worldToScreen(to.x, to.y);

      ctx.save();
      ctx.strokeStyle = e.active === false ? '#2a3b48' : '#2a4a38';
      ctx.lineWidth   = (e.active === false ? 1 : 2) * scale;
      ctx.setLineDash(e.active === false ? [5, 5] : []);

      /* Анімована лінія для активних */
      if (e.active !== false) {
        ctx.shadowColor = '#5fd0a5';
        ctx.shadowBlur  = 4;
      }

      ctx.beginPath();
      ctx.moveTo(fs.x, fs.y);
      ctx.lineTo(ts.x, ts.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      /* Мітка на ребрі */
      if (e.label) {
        var mx = (fs.x + ts.x) / 2;
        var my = (fs.y + ts.y) / 2;
        ctx.fillStyle   = '#1c2a37';
        ctx.font        = Math.round(10 * scale) + 'px monospace';
        ctx.textAlign   = 'center';
        var tw = ctx.measureText(e.label).width;
        ctx.fillRect(mx - tw/2 - 3, my - 10*scale, tw + 6, 14*scale);
        ctx.fillStyle = '#5fd0a5';
        ctx.fillText(e.label, mx, my);
      }

      /* Стрілка */
      var angle = Math.atan2(ts.y - fs.y, ts.x - fs.x);
      var arrowX = ts.x - Math.cos(angle) * NODE_R * scale;
      var arrowY = ts.y - Math.sin(angle) * NODE_R * scale;
      ctx.fillStyle = e.active === false ? '#2a3b48' : '#5fd0a5';
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX - 8*scale * Math.cos(angle - 0.4), arrowY - 8*scale * Math.sin(angle - 0.4));
      ctx.lineTo(arrowX - 8*scale * Math.cos(angle + 0.4), arrowY - 8*scale * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });

    /* Вузли */
    nodes.forEach(function(node) {
      var s   = worldToScreen(node.x, node.y);
      var r   = NODE_R * scale;
      var nt  = NODE_TYPES[node.type] || NODE_TYPES.unknown;
      var isSel = selected && selected.id === node.id;

      ctx.save();

      /* Тінь */
      ctx.shadowColor = nt.color;
      ctx.shadowBlur  = isSel ? 20 : 8;

      /* Коло */
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fillStyle   = isSel ? '#1c2a37' : '#0d1a24';
      ctx.fill();
      ctx.strokeStyle = isSel ? nt.color : nt.color + '88';
      ctx.lineWidth   = (isSel ? 3 : 1.5) * scale;
      ctx.stroke();

      ctx.shadowBlur = 0;

      /* Іконка */
      ctx.font      = Math.round(r * 0.8) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(nt.icon, s.x, s.y - 4 * scale);

      /* Підпис */
      ctx.font      = 'bold ' + Math.round(10 * scale) + 'px sans-serif';
      ctx.fillStyle = '#e6edf3';
      ctx.textBaseline = 'top';
      var labelText = (node.label || nt.label).substring(0, 14);
      ctx.fillText(labelText, s.x, s.y + r + 4 * scale);

      /* IP під підписом */
      if (node.ip) {
        ctx.font      = Math.round(9 * scale) + 'px monospace';
        ctx.fillStyle = nt.color;
        ctx.fillText(node.ip, s.x, s.y + r + 16 * scale);
      }

      /* Статус індикатор */
      if (node.status !== undefined) {
        ctx.beginPath();
        ctx.arc(s.x + r * 0.7, s.y - r * 0.7, 5 * scale, 0, Math.PI * 2);
        ctx.fillStyle = node.status ? '#5fd0a5' : '#e0665a';
        ctx.fill();
      }

      ctx.restore();
    });
  }

  /* ════════════════════════════════════════
     ІНТЕРФЕЙС МИШІ
  ════════════════════════════════════════ */
  var shiftPressed = false;
  var connectFrom  = null;

  document.addEventListener('keydown', function(e) { if (e.key === 'Shift') shiftPressed = true; });
  document.addEventListener('keyup',   function(e) { if (e.key === 'Shift') shiftPressed = false; });

  function getNodeAt(sx, sy) {
    var r = NODE_R * scale;
    for (var i = nodes.length - 1; i >= 0; i--) {
      var s = worldToScreen(nodes[i].x, nodes[i].y);
      var dx = sx - s.x, dy = sy - s.y;
      if (dx*dx + dy*dy <= r*r) return nodes[i];
    }
    return null;
  }

  canvas.addEventListener('mousedown', function(e) {
    var rect = canvas.getBoundingClientRect();
    var sx   = e.clientX - rect.left;
    var sy   = e.clientY - rect.top;
    var node = getNodeAt(sx, sy);

    if (e.button === 2) {
      /* ПКМ — панорама */
      isPanning = true;
      panStartX = e.clientX - panX;
      panStartY = e.clientY - panY;
      canvas.style.cursor = 'grabbing';
      return;
    }

    if (node) {
      if (shiftPressed) {
        /* Shift + клік — з'єднати вузли */
        if (!connectFrom) {
          connectFrom = node;
          setStatus('\uD83D\uDD17 Вибрано: ' + node.label + ' — тепер клікни на другий вузол');
        } else if (connectFrom.id !== node.id) {
          /* Перевіряємо чи вже є ребро */
          var exists = edges.some(function(ed) {
            return (ed.from === connectFrom.id && ed.to === node.id) ||
                   (ed.from === node.id && ed.to === connectFrom.id);
          });
          if (!exists) {
            edges.push({ from: connectFrom.id, to: node.id, label: '', active: true });
            setStatus('\u2705 З\'єднано: ' + connectFrom.label + ' \u2192 ' + node.label);
          } else {
            /* Видаляємо ребро */
            edges = edges.filter(function(ed) {
              return !(
                (ed.from === connectFrom.id && ed.to === node.id) ||
                (ed.from === node.id && ed.to === connectFrom.id)
              );
            });
            setStatus('\uD83D\uDDD1\uFE0F Видалено з\'єднання');
          }
          connectFrom = null;
          draw();
        }
      } else {
        /* Звичайний клік — вибір */
        selected  = node;
        dragging  = node;
        var ws    = screenToWorld(sx, sy);
        dragOffX  = ws.x - node.x;
        dragOffY  = ws.y - node.y;
        connectFrom = null;
        showDetail(node);
        draw();
      }
    } else {
      selected    = null;
      connectFrom = null;
      showDetail(null);
      draw();
    }
  });

  canvas.addEventListener('mousemove', function(e) {
    var rect = canvas.getBoundingClientRect();
    var sx   = e.clientX - rect.left;
    var sy   = e.clientY - rect.top;
    var ws   = screenToWorld(sx, sy);

    document.getElementById('topo-coords').textContent =
      'X: ' + Math.round(ws.x) + ' Y: ' + Math.round(ws.y);

    if (isPanning) {
      panX = e.clientX - panStartX;
      panY = e.clientY - panStartY;
      draw();
      return;
    }

    if (dragging) {
      dragging.x = ws.x - dragOffX;
      dragging.y = ws.y - dragOffY;
      draw();
      return;
    }

    /* Tooltip */
    var node = getNodeAt(sx, sy);
    var tooltip = document.getElementById('topo-tooltip');
    if (node) {
      canvas.style.cursor = 'pointer';
      tooltip.style.display = 'block';
      tooltip.style.left    = (sx + 10) + 'px';
      tooltip.style.top     = (sy - 30) + 'px';
      tooltip.innerHTML =
        '<b style="color:#5fd0a5;">' + (NODE_TYPES[node.type]||NODE_TYPES.unknown).icon + ' ' + node.label + '</b><br>' +
        (node.ip    ? '\uD83C\uDF10 IP: ' + node.ip + '<br>'    : '') +
        (node.mac   ? '\uD83D\uDCCC MAC: ' + node.mac + '<br>'  : '') +
        (node.iface ? '\uD83D\uDD0C ' + node.iface + '<br>'     : '') +
        (node.speed ? '\u26A1 ' + node.speed + '<br>'           : '') +
        '<span style="color:#4a6070;font-size:10px;">Shift+клік для з\'єднання</span>';
    } else {
      canvas.style.cursor = isPanning ? 'grabbing' : 'grab';
      tooltip.style.display = 'none';
    }
  });

  canvas.addEventListener('mouseup', function(e) {
    dragging  = null;
    isPanning = false;
    canvas.style.cursor = 'grab';
  });

  canvas.addEventListener('contextmenu', function(e) { e.preventDefault(); });

  /* Zoom */
  canvas.addEventListener('wheel', function(e) {
    e.preventDefault();
    var rect  = canvas.getBoundingClientRect();
    var mx    = e.clientX - rect.left;
    var my    = e.clientY - rect.top;
    var delta = e.deltaY > 0 ? 0.9 : 1.1;

    panX  = mx - (mx - panX) * delta;
    panY  = my - (my - panY) * delta;
    scale = Math.min(Math.max(scale * delta, 0.3), 2.5);

    document.getElementById('topo-zoom').value    = Math.round(scale * 100);
    document.getElementById('topo-zoom-val').textContent = Math.round(scale * 100) + '%';
    draw();
  }, { passive: false });

  /* Zoom slider */
  document.getElementById('topo-zoom').addEventListener('input', function() {
    var newScale = parseInt(this.value) / 100;
    var cx = canvas.width  / 2;
    var cy = canvas.height / 2;
    panX   = cx - (cx - panX) * (newScale / scale);
    panY   = cy - (cy - panY) * (newScale / scale);
    scale  = newScale;
    document.getElementById('topo-zoom-val').textContent = this.value + '%';
    draw();
  });

  /* ════════════════════════════════════════
     ПАНЕЛЬ ДЕТАЛЕЙ
  ════════════════════════════════════════ */
  function showDetail(node) {
    var panel = document.getElementById('topo-detail');
    if (!node) {
      panel.innerHTML = '<div style="color:#4a6070;text-align:center;padding:40px 0;">Клікни на вузол<br>для деталей</div>';
      return;
    }

    var nt = NODE_TYPES[node.type] || NODE_TYPES.unknown;

    panel.innerHTML =
      '<div style="text-align:center;margin-bottom:16px;">' +
      '<div style="font-size:40px;">' + nt.icon + '</div>' +
      '<div style="font-size:13px;font-weight:700;color:#e6edf3;margin-top:6px;">' + node.label + '</div>' +
      '<div style="font-size:11px;color:' + nt.color + ';">' + nt.label + '</div>' +
      '</div>' +

      '<div style="display:grid;gap:8px;">' +

      /* Назва */
      '<div><div style="font-size:10px;color:#4a6070;margin-bottom:3px;">Назва</div>' +
      '<input id="detail-label" type="text" value="' + (node.label||'') + '"' +
      ' style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:5px 8px;border-radius:5px;font-size:12px;width:100%;"></div>' +

      /* Тип */
      '<div><div style="font-size:10px;color:#4a6070;margin-bottom:3px;">Тип</div>' +
      '<select id="detail-type" style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:5px 8px;border-radius:5px;font-size:12px;width:100%;">' +
      Object.keys(NODE_TYPES).map(function(t) {
        return '<option value="' + t + '"' + (node.type === t ? ' selected' : '') + '>' +
          NODE_TYPES[t].icon + ' ' + NODE_TYPES[t].label + '</option>';
      }).join('') +
      '</select></div>' +

      /* IP */
      '<div><div style="font-size:10px;color:#4a6070;margin-bottom:3px;">IP адреса</div>' +
      '<input id="detail-ip" type="text" value="' + (node.ip||'') + '" placeholder="192.168.88.x"' +
      ' style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:5px 8px;border-radius:5px;font-size:12px;width:100%;"></div>' +

      /* MAC */
      '<div><div style="font-size:10px;color:#4a6070;margin-bottom:3px;">MAC адреса</div>' +
      '<input id="detail-mac" type="text" value="' + (node.mac||'') + '" placeholder="AA:BB:CC:DD:EE:FF"' +
      ' style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:5px 8px;border-radius:5px;font-size:12px;width:100%;"></div>' +

      /* Інтерфейс */
      '<div><div style="font-size:10px;color:#4a6070;margin-bottom:3px;">Інтерфейс</div>' +
      '<input id="detail-iface" type="text" value="' + (node.iface||'') + '" placeholder="ether1, wlan1..."' +
      ' style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:5px 8px;border-radius:5px;font-size:12px;width:100%;"></div>' +

      /* Нотатка */
      '<div><div style="font-size:10px;color:#4a6070;margin-bottom:3px;">Нотатка</div>' +
      '<textarea id="detail-note" rows="3" placeholder="Додатковий опис..."' +
      ' style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:5px 8px;border-radius:5px;font-size:12px;width:100%;resize:vertical;">' + (node.note||'') + '</textarea></div>' +

      '<button id="detail-save" style="background:#5fd0a5;color:#082018;border:none;padding:7px;border-radius:5px;cursor:pointer;font-size:12px;font-weight:700;width:100%;">\u2705 Зберегти зміни</button>' +
      '<button id="detail-del" style="background:transparent;border:1px solid #e0665a44;color:#e0665a;padding:7px;border-radius:5px;cursor:pointer;font-size:12px;width:100%;">\uD83D\uDDD1\uFE0F Видалити вузол</button>' +

      '</div>' +

      /* Сусіди */
      '<div style="margin-top:16px;">' +
      '<div style="font-size:11px;color:#8ea3b0;margin-bottom:8px;">\uD83D\uDD17 З\'єднання:</div>' +
      '<div id="detail-edges" style="display:grid;gap:4px;"></div>' +
      '</div>';

    /* Сусіди */
    var edgesEl = document.getElementById('detail-edges');
    var nodeEdges = edges.filter(function(e) { return e.from === node.id || e.to === node.id; });
    if (nodeEdges.length) {
      nodeEdges.forEach(function(e) {
        var otherId = e.from === node.id ? e.to : e.from;
        var other   = nodes.find(function(n) { return n.id === otherId; });
        if (!other) return;
        var ot = NODE_TYPES[other.type] || NODE_TYPES.unknown;
        var div = document.createElement('div');
        div.style.cssText = 'display:flex;align-items:center;gap:6px;background:#060d14;border:1px solid #1c2a37;border-radius:4px;padding:4px 8px;font-size:11px;';
        div.innerHTML = ot.icon + ' <span style="color:#c9e8d8;">' + other.label + '</span>' +
          (e.label ? '<span style="color:#4a6070;margin-left:auto;">' + e.label + '</span>' : '') +
          '<span style="color:' + (e.active !== false ? '#5fd0a5' : '#e0665a') + ';">' + (e.active !== false ? '\u25CF' : '\u25CB') + '</span>';
        edgesEl.appendChild(div);
      });
    } else {
      edgesEl.innerHTML = '<div style="color:#4a6070;font-size:11px;">Немає з\'єднань</div>';
    }

    /* Зберегти зміни */
    document.getElementById('detail-save').addEventListener('click', function() {
      node.label = document.getElementById('detail-label').value.trim() || node.label;
      node.type  = document.getElementById('detail-type').value;
      node.ip    = document.getElementById('detail-ip').value.trim();
      node.mac   = document.getElementById('detail-mac').value.trim();
      node.iface = document.getElementById('detail-iface').value.trim();
      node.note  = document.getElementById('detail-note').value.trim();
      showDetail(node);
      draw();
      setStatus('\u2705 Збережено: ' + node.label);
    });

    /* Видалити */
    document.getElementById('detail-del').addEventListener('click', function() {
      if (confirm('Видалити "' + node.label + '"?')) {
        nodes  = nodes.filter(function(n) { return n.id !== node.id; });
        edges  = edges.filter(function(e) { return e.from !== node.id && e.to !== node.id; });
        selected = null;
        showDetail(null);
        updateCount();
        draw();
      }
    });
  }

  /* ════════════════════════════════════════
     ЗАВАНТАЖЕННЯ З РОУТЕРА
  ════════════════════════════════════════ */
  function loadFromRouter() {
    var ip   = document.getElementById('topo-ip').value.trim();
    var user = document.getElementById('topo-user').value.trim();
    var pass = document.getElementById('topo-pass').value;
    var btn  = document.getElementById('topo-load-btn');

    btn.textContent = '\u23F3 Завантаження...';
    btn.disabled = true;
    setStatus('\uD83D\uDD04 Завантажую дані з роутера...');

    var hdrs = {
      'Content-Type':   'application/json',
      'Authorization':  'Basic ' + btoa(user + ':' + pass),
      'X-Router-Host':  ip,
      'X-Router-Port':  '80',
      'X-Router-Proto': 'http',
    };

    /* Завантажуємо паралельно: інтерфейси + ARP + DHCP leases + neighbors */
    Promise.all([
      fetch(PROXY + '/rest/interface', { method:'GET', headers:hdrs }).then(function(r) { return r.json(); }),
      fetch(PROXY + '/rest/ip/address', { method:'GET', headers:hdrs }).then(function(r) { return r.json(); }),
      fetch(PROXY + '/rest/ip/arp', { method:'GET', headers:hdrs }).then(function(r) { return r.json(); }),
      fetch(PROXY + '/rest/ip/dhcp-server/lease', { method:'GET', headers:hdrs }).then(function(r) { return r.json(); }),
      fetch(PROXY + '/rest/ip/neighbor', { method:'GET', headers:hdrs }).then(function(r) { return r.json(); }).catch(function() { return []; }),
      fetch(PROXY + '/rest/system/identity', { method:'GET', headers:hdrs }).then(function(r) { return r.json(); }),
    ])
    .then(function(results) {
      var ifaces    = results[0];
      var addresses = results[1];
      var arps      = results[2];
      var leases    = results[3];
      var neighbors = results[4];
      var identity  = results[5];

      buildTopology(ifaces, addresses, arps, leases, neighbors, identity, ip);

      btn.textContent = '\uD83D\uDD04 Завантажити';
      btn.disabled    = false;
      setStatus('\u2705 Топологію завантажено! Вузлів: ' + nodes.length + ', з\'єднань: ' + edges.length);
    })
    .catch(function(err) {
      btn.textContent = '\uD83D\uDD04 Завантажити';
      btn.disabled    = false;
      setStatus('\u274C Помилка: ' + err.message);
    });
  }

  /* ════════════════════════════════════════
     ПОБУДОВА ТОПОЛОГІЇ
  ════════════════════════════════════════ */
  function buildTopology(ifaces, addresses, arps, leases, neighbors, identity, routerIp) {
    nodes = [];
    edges = [];

    var W = canvas.width;
    var H = canvas.height;

    /* Роутер — центр */
    var routerNode = {
      id:    'router',
      type:  'router',
      label: (identity && identity.name) ? identity.name : 'MikroTik',
      x:     W / 2 / scale - panX / scale,
      y:     H / 2 / scale - panY / scale,
      ip:    routerIp,
    };
    nodes.push(routerNode);

    /* Інтернет над роутером */
    var wanIface = ifaces.find(function(i) { return i.name === 'ether1' || i.type === 'ether' && (i.name.includes('wan') || i.name === 'ether1'); });
    var cloudNode = {
      id:    'internet',
      type:  'cloud',
      label: 'Internet',
      x:     routerNode.x,
      y:     routerNode.y - 200,
    };
    nodes.push(cloudNode);
    edges.push({
      from:   'internet',
      to:     'router',
      label:  wanIface ? wanIface.name : 'WAN',
      active: wanIface ? (wanIface.running === 'true' || wanIface.running === true) : true,
    });

    /* LAN інтерфейси */
    var lanIfaces = ifaces.filter(function(i) {
      return i.name !== 'ether1' && !i.name.includes('lo') && !i.name.includes('sit');
    });

    /* IP адреси по інтерфейсах */
    var ifaceIpMap = {};
    addresses.forEach(function(a) {
      ifaceIpMap[a.interface] = a.address ? a.address.split('/')[0] : '';
    });

    /* Клієнти з DHCP leases */
    var clients = leases.filter(function(l) { return l.status === 'bound'; });

    /* Розміщуємо клієнтів по колу навколо роутера */
    var radius  = 180;
    var count   = Math.max(clients.length + lanIfaces.length, 1);
    var angleStep = (Math.PI * 2) / count;
    var angleOffset = Math.PI / 2; /* починаємо знизу */

    /* Додаємо LAN bridge/switch вузол якщо є */
    var bridgeIface = ifaces.find(function(i) { return i.name === 'bridge' || i.name === 'bridge-lan'; });
    if (bridgeIface) {
      var switchNode = {
        id:    'bridge-switch',
        type:  'switch',
        label: bridgeIface.name,
        x:     routerNode.x,
        y:     routerNode.y + 140,
        iface: bridgeIface.name,
        ip:    ifaceIpMap[bridgeIface.name] || '',
        status: bridgeIface.running === 'true' || bridgeIface.running === true,
      };
      nodes.push(switchNode);
      edges.push({
        from: 'router',
        to:   'bridge-switch',
        label: 'LAN',
        active: switchNode.status,
      });
    }

    /* Клієнти */
    clients.slice(0, 20).forEach(function(lease, idx) {
      var angle = angleOffset + idx * angleStep;
      var cx    = routerNode.x + Math.cos(angle) * radius * 1.5;
      var cy    = routerNode.y + Math.sin(angle) * radius * 1.5 + 100;

      /* Визначаємо тип пристрою по hostname */
      var hostname = (lease['host-name'] || '').toLowerCase();
      var devType  = 'unknown';
      if (hostname.includes('phone') || hostname.includes('android') || hostname.includes('iphone')) devType = 'phone';
      else if (hostname.includes('laptop') || hostname.includes('macbook')) devType = 'laptop';
      else if (hostname.includes('pc') || hostname.includes('desktop') || hostname.includes('comp')) devType = 'pc';
      else if (hostname.includes('srv') || hostname.includes('server')) devType = 'server';
      else devType = 'pc';

      var clientNode = {
        id:    'client-' + idx,
        type:  devType,
        label: lease['host-name'] || 'Client ' + (idx+1),
        x:     cx,
        y:     cy,
        ip:    lease.address || '',
        mac:   lease['mac-address'] || '',
        status: true,
      };
      nodes.push(clientNode);

      edges.push({
        from:   bridgeIface ? 'bridge-switch' : 'router',
        to:     clientNode.id,
        active: true,
      });
    });

    /* Сусіди (IP Neighbor — інші MikroTik/свічі) */
    neighbors.slice(0, 5).forEach(function(nb, idx) {
      var exists = nodes.some(function(n) { return n.ip === nb.address; });
      if (exists) return;

      var angle = -Math.PI / 4 + idx * 0.5;
      var nx    = routerNode.x + Math.cos(angle) * 280;
      var ny    = routerNode.y + Math.sin(angle) * 280;

      var nbNode = {
        id:    'neighbor-' + idx,
        type:  nb['system-caps'] && nb['system-caps'].includes('bridge') ? 'switch' : 'router',
        label: nb.identity || nb['system-description'] || 'Neighbor',
        x:     nx,
        y:     ny,
        ip:    nb.address || '',
        iface: nb.interface || '',
      };
      nodes.push(nbNode);
      edges.push({ from:'router', to:nbNode.id, label: nb.interface||'', active:true });
    });

    updateCount();
    autoLayout(false);
    fitToScreen();
    draw();
  }

  /* ════════════════════════════════════════
     АВТО-РОЗМІЩЕННЯ
  ════════════════════════════════════════ */
  function autoLayout(animate) {
    var W = canvas.width;
    var H = canvas.height;
    var cx = W / 2 / scale;
    var cy = H / 2 / scale;

    /* Знаходимо роутер */
    var router = nodes.find(function(n) { return n.type === 'router'; }) || nodes[0];
    if (!router) return;

    router.x = cx;
    router.y = cy;

    /* Розміщуємо сусідів по колах */
    var levels = {};
    function getLevel(nodeId, visited, lvl) {
      if (!visited) visited = {};
      if (visited[nodeId]) return;
      visited[nodeId] = true;
      if (!levels[lvl]) levels[lvl] = [];
      levels[lvl].push(nodeId);
      edges.forEach(function(e) {
        if (e.from === nodeId) getLevel(e.to,   visited, lvl+1);
        if (e.to   === nodeId) getLevel(e.from, visited, lvl+1);
      });
    }
    getLevel(router.id, {}, 0);

    Object.keys(levels).forEach(function(lvl) {
      var levelNodes = levels[lvl];
      var r = parseInt(lvl) * 200;
      levelNodes.forEach(function(nodeId, idx) {
        var node  = nodes.find(function(n) { return n.id === nodeId; });
        if (!node || node.id === router.id) return;
        var angle = (idx / levelNodes.length) * Math.PI * 2 - Math.PI / 2;
        node.x    = cx + Math.cos(angle) * r;
        node.y    = cy + Math.sin(angle) * r;
      });
    });

    draw();
  }

  /* ════════════════════════════════════════
     FIT TO SCREEN
  ════════════════════════════════════════ */
  function fitToScreen() {
    if (!nodes.length) return;

    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(function(n) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x);
      maxY = Math.max(maxY, n.y);
    });

    var padding = 80;
    var W = canvas.width  - padding * 2;
    var H = canvas.height - padding * 2;
    var nW = maxX - minX || 1;
    var nH = maxY - minY || 1;

    scale = Math.min(W / nW, H / nH, 1.5);
    panX  = padding + (W - nW * scale) / 2 - minX * scale;
    panY  = padding + (H - nH * scale) / 2 - minY * scale;

    document.getElementById('topo-zoom').value    = Math.round(scale * 100);
    document.getElementById('topo-zoom-val').textContent = Math.round(scale * 100) + '%';
    draw();
  }

  /* ════════════════════════════════════════
     LIVE ОНОВЛЕННЯ
  ════════════════════════════════════════ */
  document.getElementById('topo-live-interval').addEventListener('change', function() {
    var interval = parseInt(this.value);
    clearInterval(liveTimer);
    liveActive = false;

    if (interval > 0) {
      liveActive = true;
      liveTimer  = setInterval(function() {
        var ip   = document.getElementById('topo-ip').value.trim();
        var user = document.getElementById('topo-user').value.trim();
        var pass = document.getElementById('topo-pass').value;
        if (!ip) return;

        var hdrs = {
          'Content-Type':   'application/json',
          'Authorization':  'Basic ' + btoa(user + ':' + pass),
          'X-Router-Host':  ip,
          'X-Router-Port':  '80',
          'X-Router-Proto': 'http',
        };

        /* Оновлюємо тільки статуси інтерфейсів */
        fetch(PROXY + '/rest/interface', { method:'GET', headers:hdrs })
        .then(function(r) { return r.json(); })
        .then(function(ifaces) {
          ifaces.forEach(function(iface) {
            var running = iface.running === 'true' || iface.running === true;
            edges.forEach(function(e) {
              if (e.label === iface.name) e.active = running;
            });
            nodes.forEach(function(n) {
              if (n.iface === iface.name) n.status = running;
            });
          });
          draw();
          setStatus('\uD83D\uDD04 Оновлено: ' + new Date().toLocaleTimeString());
        })
        .catch(function() {});
      }, interval);
      setStatus('\uD83D\uDFE2 Live активний (кожні ' + interval/1000 + 's)');
    }
  });

  /* ════════════════════════════════════════
     ДОДАВАННЯ ВУЗЛІВ ВРУЧНУ
  ════════════════════════════════════════ */
  modal.querySelectorAll('.topo-add-node').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var type = this.getAttribute('data-type');
      var nt   = NODE_TYPES[type] || NODE_TYPES.unknown;
      var cx   = canvas.width  / 2 / scale - panX / scale;
      var cy   = canvas.height / 2 / scale - panY / scale;

      var node = {
        id:    'node-' + Date.now(),
        type:  type,
        label: nt.label + ' ' + (nodes.filter(function(n) { return n.type === type; }).length + 1),
        x:     cx + (Math.random() - 0.5) * 100,
        y:     cy + (Math.random() - 0.5) * 100,
      };
      nodes.push(node);
      selected = node;
      showDetail(node);
      updateCount();
      draw();
    });
  });

  /* ════════════════════════════════════════
     ЗБЕРЕГТИ / ЗАВАНТАЖИТИ
  ════════════════════════════════════════ */
  document.getElementById('topo-save-btn').addEventListener('click', function() {
    var data = JSON.stringify({ nodes:nodes, edges:edges }, null, 2);
    try {
      localStorage.setItem('mt-topology', data);
      setStatus('\uD83D\uDCBE Збережено в localStorage!');
    } catch(e) {
      setStatus('\u274C Помилка збереження!');
    }
  });

  function loadSaved() {
    try {
      var saved = localStorage.getItem('mt-topology');
      if (saved) {
        var data = JSON.parse(saved);
        nodes = data.nodes || [];
        edges = data.edges || [];
        updateCount();
        fitToScreen();
        draw();
        setStatus('\uD83D\uDCBE Завантажено збережену топологію');
      }
    } catch(e) {}
  }

  /* ════════════════════════════════════════
     EXPORT PNG
  ════════════════════════════════════════ */
  document.getElementById('topo-export-btn').addEventListener('click', function() {
    var a     = document.createElement('a');
    a.href    = canvas.toDataURL('image/png');
    a.download = 'topology-' + Date.now() + '.png';
    a.click();
    setStatus('\uD83D\uDCF8 Збережено PNG!');
  });

  /* ════════════════════════════════════════
     ІНШІ КНОПКИ
  ════════════════════════════════════════ */
  document.getElementById('topo-load-btn').addEventListener('click', loadFromRouter);
  document.getElementById('topo-layout-btn').addEventListener('click', function() { autoLayout(true); });
  document.getElementById('topo-fit-btn').addEventListener('click', fitToScreen);

  document.getElementById('topo-del-node').addEventListener('click', function() {
    if (selected) {
      nodes  = nodes.filter(function(n) { return n.id !== selected.id; });
      edges  = edges.filter(function(e) { return e.from !== selected.id && e.to !== selected.id; });
      selected = null;
      showDetail(null);
      updateCount();
      draw();
    }
  });

  document.getElementById('topo-clear-btn').addEventListener('click', function() {
    if (confirm('Очистити всю топологію?')) {
      nodes = []; edges = []; selected = null;
      showDetail(null); updateCount(); draw();
    }
  });

  document.getElementById('topo-close').addEventListener('click', function() {
    modal.style.display = 'none';
    clearInterval(liveTimer);
  });

  /* ════════════════════════════════════════
     ДОПОМІЖНІ
  ════════════════════════════════════════ */
  function setStatus(msg) {
    var el = document.getElementById('topo-status');
    if (el) el.textContent = msg;
  }

  function updateCount() {
    var el = document.getElementById('topo-node-count');
    if (el) el.textContent = 'Вузлів: ' + nodes.length + ' | З\'єднань: ' + edges.length;
  }

  /* ════════════════════════════════════════
     FAB КНОПКА
  ════════════════════════════════════════ */
  var fab = document.createElement('button');
  fab.id    = 'btn-topo-fab';
  fab.title = 'Топологія мережі';
  fab.style.cssText = [
    'position:fixed','bottom:214px','right:16px',
    'background:#16212c','border:2px solid #5b9bd5',
    'color:#5b9bd5','border-radius:50%',
    'width:42px','height:42px',
    'font-size:18px','cursor:pointer',
    'z-index:10000','display:flex',
    'align-items:center','justify-content:center',
    'box-shadow:0 2px 8px rgba(91,155,213,.4)',
  ].join(';');
  fab.textContent = '\uD83D\uDDFA\uFE0F';
  fab.addEventListener('mouseenter', function() { fab.style.background = '#1c2a37'; });
  fab.addEventListener('mouseleave', function() { fab.style.background = '#16212c'; });
  fab.addEventListener('click', function() {
    modal.style.display = 'flex';
    setTimeout(function() {
      resizeCanvas();
      loadSaved();
    }, 50);
  });
  document.body.appendChild(fab);

  /* Синхронізація з терміналом */
  setTimeout(function() {
    var tmIp   = document.getElementById('tm-ip');
    var tmUser = document.getElementById('tm-user');
    var tmPass = document.getElementById('tm-pass');
    if (tmIp   && tmIp.value)   document.getElementById('topo-ip').value   = tmIp.value;
    if (tmUser && tmUser.value)  document.getElementById('topo-user').value = tmUser.value;
    if (tmPass && tmPass.value)  document.getElementById('topo-pass').value = tmPass.value;
  }, 1000);

  console.log('[topology-visual] v1 ready');
})();