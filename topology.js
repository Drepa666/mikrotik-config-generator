/* ============================================================
   topology.js — Візуальна топологія мережі (SVG)
   Малює діаграму в реальному часі на основі форми
   ============================================================ */
'use strict';

/* ── Створити панель топології ── */
function topoInit() {
  if (typeof window.render !== 'function') {
    setTimeout(topoInit, 200);
    return;
  }

  /* Кнопка відкриття */
  var btn = document.createElement('button');
  btn.id = 'topo-btn';
  btn.textContent = '🗺️ Топологія';
  btn.title = 'Показати топологію мережі';
  btn.style.cssText = [
    'position:fixed',
    'bottom:24px',
    'left:140px',
    'background:#2a3b48',
    'color:#e6edf3',
    'border:1px solid #3a5060',
    'border-radius:50px',
    'padding:10px 20px',
    'font-size:13px',
    'font-weight:700',
    'cursor:pointer',
    'z-index:9998',
    'transition:all .2s'
  ].join(';');

  btn.onmouseover = function() {
    btn.style.background = '#3a5060';
  };
  btn.onmouseout = function() {
    btn.style.background = '#2a3b48';
  };
  btn.addEventListener('click', topoOpen);
  document.body.appendChild(btn);

  /* Overlay */
  var overlay = document.createElement('div');
  overlay.id = 'topo-overlay';
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'background:rgba(0,0,0,.75)',
    'z-index:9999',
    'display:none',
    'align-items:center',
    'justify-content:center'
  ].join(';');

  overlay.innerHTML =
    '<div id="topo-modal" style="' +
      'background:#16212c;' +
      'border:1px solid #2a3b48;' +
      'border-radius:14px;' +
      'width:min(900px,95vw);' +
      'max-height:90vh;' +
      'overflow:auto;' +
      'padding:24px;' +
    '">' +
      '<div style="display:flex;align-items:center;margin-bottom:16px">' +
        '<div style="font-size:18px;font-weight:700;color:#5fd0a5">🗺️ Топологія мережі</div>' +
        '<button id="topo-close" style="' +
          'margin-left:auto;background:transparent;border:1px solid #2a3b48;' +
          'color:#8ea3b0;padding:4px 12px;border-radius:6px;cursor:pointer;font-size:13px' +
        '">✕ Закрити</button>' +
      '</div>' +
      '<div id="topo-svg-wrap"></div>' +
      '<div id="topo-legend" style="' +
        'margin-top:16px;display:flex;flex-wrap:wrap;gap:12px;font-size:11px;color:#8ea3b0' +
      '"></div>' +
    '</div>';

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) topoClose();
  });
  document.body.appendChild(overlay);

  document.getElementById('topo-close')
    .addEventListener('click', topoClose);

  /* Патч render() */
  var _orig = window.render;
  window.render = function() {
    _orig.apply(this, arguments);
    /* Оновлюємо топологію якщо відкрита */
    if (document.getElementById('topo-overlay').style.display !== 'none') {
      setTimeout(topoRender, 200);
    }
  };

  console.log('[topology.js] ✅ ready');
}

/* ── Читаємо дані з форми ── */
function topoGetData() {
  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }
  function chk(id) {
    var el = document.getElementById(id);
    return el ? el.checked : false;
  }

  return {
    /* WAN */
    wanIf:    val('wanif')    || 'ether1',
    wanType:  val('wantype')  || 'dhcp',

    /* LAN */
    lanIp:    val('lanip')    || '192.168.88.1/24',
    lanPorts: val('lanports') || 'ether2,ether3,ether4,ether5',

    /* Wi-Fi */
    wifi:     chk('wifienable'),
    ssid:     val('ssid')     || 'MyNetwork',

    /* Guest */
    guest:    chk('guestenable'),
    guestSsid: val('guestssid') || 'Guest',
    guestIp:  val('guestip')  || '192.168.99.1/24',

    /* VPN */
    wg:       chk('wgenable'),
    wgIp:     val('wgip')     || '10.20.30.1/24',
    ovpn:     chk('ovpnenable'),
    ovpnIp:   val('ovpnip')   || '10.0.0.1',

    /* Failover */
    fo:       chk('foenable'),
    foIf:     val('foif')     || 'ether2',

    /* Firewall */
    fw:       chk('basicfw'),

    /* CAPsMAN */
    capsman:  chk('capsmanenable'),

    /* IPsec */
    ipsec:    chk('ipsecenable'),

    /* RouterOS версія */
    firmware: val('firmware') || '7.13+',
  };
}

/* ── SVG константи ── */
var C = {
  W: 820,
  H: 480,
  NODE_W: 110,
  NODE_H: 44,
  R: 8,
  COLORS: {
    internet:  { fill: '#0f2a3a', stroke: '#2a7a9a', text: '#7ad0f0' },
    router:    { fill: '#0f2a1a', stroke: '#2a8a5a', text: '#5fd0a5' },
    wan:       { fill: '#2a2a0f', stroke: '#8a7a2a', text: '#e6b35a' },
    lan:       { fill: '#1a1a2a', stroke: '#4a4a8a', text: '#9090e0' },
    wifi:      { fill: '#1a2a1a', stroke: '#3a7a3a', text: '#80d080' },
    guest:     { fill: '#2a1a1a', stroke: '#7a3a3a', text: '#e08080' },
    vpn:       { fill: '#1a1a3a', stroke: '#3a3a9a', text: '#8080f0' },
    firewall:  { fill: '#2a1a0f', stroke: '#8a4a2a', text: '#f0a060' },
    fo:        { fill: '#2a2a2a', stroke: '#6a6a6a', text: '#b0b0b0' },
  }
};

/* ── Рисуємо SVG вузол ── */
function svgNode(x, y, label, sub, colorKey) {
  var c = C.COLORS[colorKey] || C.COLORS.lan;
  var nx = x - C.NODE_W / 2;
  var ny = y - C.NODE_H / 2;

  return '<g>' +
    '<rect x="' + nx + '" y="' + ny + '"' +
      ' width="' + C.NODE_W + '" height="' + C.NODE_H + '"' +
      ' rx="' + C.R + '"' +
      ' fill="' + c.fill + '"' +
      ' stroke="' + c.stroke + '"' +
      ' stroke-width="1.5"/>' +
    '<text x="' + x + '" y="' + (y - 5) + '"' +
      ' text-anchor="middle"' +
      ' font-family="system-ui,sans-serif"' +
      ' font-size="12"' +
      ' font-weight="600"' +
      ' fill="' + c.text + '">' +
      escSvg(label) +
    '</text>' +
    (sub ?
      '<text x="' + x + '" y="' + (y + 10) + '"' +
        ' text-anchor="middle"' +
        ' font-family="monospace"' +
        ' font-size="10"' +
        ' fill="' + c.text + '"' +
        ' opacity=".7">' +
        escSvg(sub) +
      '</text>'
      : '') +
  '</g>';
}

/* ── Рисуємо лінію з міткою ── */
function svgLine(x1, y1, x2, y2, label, color, dashed) {
  color = color || '#3a5060';
  var dash = dashed ? 'stroke-dasharray="6,3"' : '';
  var mx = (x1 + x2) / 2;
  var my = (y1 + y2) / 2;

  return '<g>' +
    '<line x1="' + x1 + '" y1="' + y1 + '"' +
      ' x2="' + x2 + '" y2="' + y2 + '"' +
      ' stroke="' + color + '"' +
      ' stroke-width="1.5"' +
      ' ' + dash + '/>' +
    (label ?
      '<text x="' + mx + '" y="' + (my - 4) + '"' +
        ' text-anchor="middle"' +
        ' font-family="system-ui,sans-serif"' +
        ' font-size="10"' +
        ' fill="' + color + '"' +
        ' opacity=".8">' +
        escSvg(label) +
      '</text>'
      : '') +
  '</g>';
}

/* ── Arrow marker ── */
function svgDefs() {
  return '<defs>' +
    '<marker id="arr" markerWidth="8" markerHeight="8"' +
      ' refX="6" refY="3" orient="auto">' +
      '<path d="M0,0 L0,6 L8,3 z" fill="#3a5060"/>' +
    '</marker>' +
    '<marker id="arr-green" markerWidth="8" markerHeight="8"' +
      ' refX="6" refY="3" orient="auto">' +
      '<path d="M0,0 L0,6 L8,3 z" fill="#5fd0a5"/>' +
    '</marker>' +
    '<marker id="arr-yellow" markerWidth="8" markerHeight="8"' +
      ' refX="6" refY="3" orient="auto">' +
      '<path d="M0,0 L0,6 L8,3 z" fill="#e6b35a"/>' +
    '</marker>' +
  '</defs>';
}

function escSvg(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Головна функція рендеру топології ── */
function topoRender() {
  var wrap = document.getElementById('topo-svg-wrap');
  var legend = document.getElementById('topo-legend');
  if (!wrap) return;

  var d = topoGetData();
  var elements = [];
  var legendItems = [];

  elements.push(svgDefs());

  /* ─── Позиції вузлів ─── */
  /* Internet — зверху по центру */
  var inet = { x: C.W / 2, y: 60 };

  /* Firewall — якщо є */
  var fwY = d.fw ? 140 : 0;

  /* Router — посередині */
  var router = { x: C.W / 2, y: d.fw ? 220 : 160 };

  /* WAN зліва від роутера */
  var wan = { x: router.x - 160, y: router.y };

  /* Failover ще лівіше */
  var fo = { x: router.x - 310, y: router.y };

  /* ─── Internet ─── */
  elements.push(svgNode(inet.x, inet.y, '🌐 Internet', '', 'internet'));

  /* ─── Firewall ─── */
  if (d.fw) {
    var fwNode = { x: C.W / 2, y: fwY };
    elements.push(svgNode(fwNode.x, fwNode.y, '🔥 Firewall', 'defconf', 'firewall'));
    elements.push(svgLine(inet.x, inet.y + C.NODE_H/2,
      fwNode.x, fwNode.y - C.NODE_H/2, '', '#e6b35a'));
    elements.push(svgLine(fwNode.x, fwNode.y + C.NODE_H/2,
      router.x, router.y - C.NODE_H/2, '', '#e6b35a'));
    legendItems.push({ color: '#e6b35a', label: '🔥 Firewall увімкнено (defconf)' });
  } else {
    elements.push(svgLine(inet.x, inet.y + C.NODE_H/2,
      router.x, router.y - C.NODE_H/2, '', '#3a5060'));
  }

  /* ─── WAN ─── */
  var wanLabel = {
    dhcp: 'DHCP', pppoe: 'PPPoE', static: 'Static', lte: 'LTE'
  }[d.wanType] || d.wanType;

  elements.push(svgNode(wan.x, wan.y, '📡 WAN', d.wanIf + ' / ' + wanLabel, 'wan'));
  elements.push(svgLine(wan.x + C.NODE_W/2, wan.y,
    router.x - C.NODE_W/2, router.y, wanLabel, '#e6b35a'));
  legendItems.push({ color: '#e6b35a', label: 'WAN: ' + d.wanIf + ' (' + wanLabel + ')' });

  /* ─── Failover ─── */
  if (d.fo) {
    elements.push(svgNode(fo.x, fo.y, '🔄 Failover', d.foIf, 'fo'));
    elements.push(svgLine(fo.x + C.NODE_W/2, fo.y,
      wan.x - C.NODE_W/2, wan.y, '', '#6a6a6a', true));
    legendItems.push({ color: '#6a6a6a', label: 'Failover: ' + d.foIf });
  }

  /* ─── Router (головний вузол) ─── */
  var lanIpShort = d.lanIp.split('/')[0];
  elements.push(svgNode(router.x, router.y, '🛰️ Router', lanIpShort, 'router'));

  /* ─── LAN ─── */
  var lanY = router.y + 120;
  var lanX = router.x;
  elements.push(svgNode(lanX, lanY, '🖥️ LAN', d.lanPorts.split(',').slice(0,3).join(','), 'lan'));
  elements.push(svgLine(router.x, router.y + C.NODE_H/2,
    lanX, lanY - C.NODE_H/2, d.lanIp, '#9090e0'));
  legendItems.push({ color: '#9090e0', label: 'LAN: ' + d.lanIp });

  /* ─── Wi-Fi ─── */
  if (d.wifi) {
    var wifiX = router.x + 180;
    var wifiY = router.y + 120;
    elements.push(svgNode(wifiX, wifiY, '📶 Wi-Fi', d.ssid, 'wifi'));
    elements.push(svgLine(router.x + C.NODE_W/2, router.y,
      wifiX - C.NODE_W/2, wifiY, d.ssid, '#80d080'));
    legendItems.push({ color: '#80d080', label: 'Wi-Fi: ' + d.ssid });
  }

  /* ─── Guest ─── */
  if (d.guest) {
    var guestX = router.x + (d.wifi ? 360 : 200);
    var guestY = router.y + 120;
    elements.push(svgNode(guestX, guestY, '👥 Guest', d.guestSsid, 'guest'));
    elements.push(svgLine(
      d.wifi ? router.x + 180 + C.NODE_W/2 : router.x + C.NODE_W/2,
      d.wifi ? router.y + 120 : router.y,
      guestX - C.NODE_W/2, guestY,
      'VLAN', '#e08080', true));
    legendItems.push({ color: '#e08080', label: 'Guest VLAN: ' + d.guestSsid });
  }

  /* ─── WireGuard ─── */
  if (d.wg) {
    var wgX = router.x - 200;
    var wgY = router.y + 120;
    elements.push(svgNode(wgX, wgY, '🔒 WireGuard', d.wgIp.split('/')[0], 'vpn'));
    elements.push(svgLine(router.x - C.NODE_W/2, router.y,
      wgX + C.NODE_W/2, wgY, d.wgIp, '#8080f0', true));
    legendItems.push({ color: '#8080f0', label: 'WireGuard: ' + d.wgIp });
  }

  /* ─── OpenVPN ─── */
  if (d.ovpn) {
    var ovpnX = router.x - (d.wg ? 360 : 200);
    var ovpnY = router.y + 120;
    elements.push(svgNode(ovpnX, ovpnY, '🔐 OpenVPN', d.ovpnIp, 'vpn'));
    elements.push(svgLine(
      d.wg ? router.x - 200 - C.NODE_W/2 : router.x - C.NODE_W/2,
      d.wg ? router.y + 120 : router.y,
      ovpnX + C.NODE_W/2, ovpnY,
      'VPN', '#8080f0', true));
    legendItems.push({ color: '#8080f0', label: 'OpenVPN: ' + d.ovpnIp });
  }

  /* ─── IPsec ─── */
  if (d.ipsec) {
    elements.push(svgNode(inet.x + 180, inet.y, '🔑 IPsec', 'tunnel', 'vpn'));
    elements.push(svgLine(inet.x + C.NODE_W/2, inet.y,
      inet.x + 180 - C.NODE_W/2, inet.y, '', '#8080f0', true));
    legendItems.push({ color: '#8080f0', label: 'IPsec тунель' });
  }

  /* ─── CAPsMAN ─── */
  if (d.capsman) {
    var capsX = lanX;
    var capsY = lanY + 100;
    elements.push(svgNode(capsX, capsY, '📡 CAPsMAN', 'AP точки', 'wifi'));
    elements.push(svgLine(lanX, lanY + C.NODE_H/2,
      capsX, capsY - C.NODE_H/2, 'L2', '#80d080'));
    legendItems.push({ color: '#80d080', label: 'CAPsMAN контролер' });
  }

  /* ─── RouterOS версія ─── */
  elements.push(
    '<text x="10" y="' + (C.H - 10) + '"' +
      ' font-family="monospace" font-size="10"' +
      ' fill="#2a3b48">RouterOS ' + escSvg(d.firmware) + '</text>'
  );

  /* ─── Збираємо SVG ─── */
  var svgH = d.capsman ? C.H + 100 : C.H;

  var svg =
    '<svg width="100%" viewBox="0 0 ' + C.W + ' ' + svgH + '"' +
      ' xmlns="http://www.w3.org/2000/svg"' +
      ' style="background:#0a1017;border-radius:10px;border:1px solid #2a3b48">' +
      elements.join('') +
    '</svg>';

  wrap.innerHTML = svg;

  /* ─── Легенда ─── */
  legend.innerHTML = legendItems.map(function(item) {
    return '<span style="display:flex;align-items:center;gap:4px">' +
      '<span style="width:12px;height:12px;border-radius:50%;' +
        'background:' + item.color + ';display:inline-block"></span>' +
      '<span>' + escSvg(item.label) + '</span>' +
    '</span>';
  }).join('');
}

/* ── Відкрити / закрити ── */
function topoOpen() {
  var overlay = document.getElementById('topo-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
    topoRender();
  }
}

function topoClose() {
  var overlay = document.getElementById('topo-overlay');
  if (overlay) overlay.style.display = 'none';
}

/* ── Ініціалізація ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', topoInit);
} else {
  topoInit();
}