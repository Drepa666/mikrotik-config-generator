/* ============================================================
   dashboard.js — Dashboard статистика всіх налаштувань
   Patch 35B | MikroTik Config Generator
   ============================================================ */
'use strict';

function collectDashboardData() {
  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }
  function chk(id) {
    var el = document.getElementById(id);
    return !!(el && el.checked);
  }

  return {
    /* Роутер */
    model:      val('model'),
    firmware:   val('firmware'),
    hostname:   val('hostname'),
    timezone:   val('timezone'),

    /* Безпека */
    changepass:       chk('changepass'),
    adminpass:        val('adminpass'),
    basicfw:          chk('basicfw'),
    fasttrack:        chk('fasttrack'),
    macprotect:       chk('macprotect'),
    disableservices:  chk('disableservices'),
    disablesvcports:  chk('disablesvcports'),
    disableipv6:      chk('disableipv6'),
    ipneighbor:       chk('ipneighbor'),
    dnsprotect:       chk('dnsprotect'),
    backupenable:     chk('backupenable'),
    safetynet:        chk('safetynet'),
    logwandrops:      chk('logwandrops'),

    /* Мережа */
    wanif:      val('wanif'),
    wantype:    val('wantype'),
    lanip:      val('lanip'),
    natenable:  chk('natenable'),
    dhcpenable: chk('dhcpenable'),
    dhcprange:  val('dhcprange'),
    foenable:   chk('foenable'),

    /* DNS */
    upstreamdns:    val('upstreamdns'),
    allowremote:    chk('allowremote'),
    ntpenable:      chk('ntpenable'),
    netwatchenable: chk('netwatchenable'),
    netwatchhost:   val('netwatchhost'),
    ddnsenable:     chk('ddnsenable'),

    /* Wi-Fi */
    wifienable:   chk('wifienable'),
    ssid:         val('ssid'),
    capsmanenable:chk('capsmanenable'),
    guestenable:  chk('guestenable'),

    /* VPN */
    wgenable:     chk('wgenable'),
    ovpnenable:   chk('ovpnenable'),
    ovpnclenable: chk('ovpnclenable'),
    ipsecenable:  chk('ipsecenable'),

    /* Додатково */
    pfwenable:       chk('pfwenable'),
    dnsstaticenable: chk('dnsstaticenable'),
    addrlistenable:  chk('addrlistenable'),
    routesenable:    chk('routesenable'),
    resetconfig:     chk('resetconfig'),
  };
}

function calcSecurityScore(d) {
  var score = 0;
  var max   = 0;

  function check(val, pts) {
    max += pts;
    if (val) score += pts;
  }

  check(d.changepass && d.adminpass.length >= 8, 20);
  check(d.basicfw,         20);
  check(d.macprotect,      10);
  check(d.disableservices, 10);
  check(d.dnsprotect,      10);
  check(d.ntpenable,        5);
  check(d.backupenable,     5);
  check(d.disableipv6,      5);
  check(d.ipneighbor,       5);
  check(d.disablesvcports,  5);
  check(d.fasttrack,        5);

  return Math.round((score / max) * 100);
}

/* ══════════════════════════════════════════════
   РЕНДЕР
══════════════════════════════════════════════ */
function renderDashboard(d) {
  var score      = calcSecurityScore(d);
  var scoreColor = score >= 80 ? '#5fd0a5' : score >= 50 ? '#e6b35a' : '#e0665a';
  var scoreLabel = score >= 80 ? 'Відмінно' : score >= 50 ? 'Потребує уваги' : 'Небезпечно';

  function badge(ok, label) {
    var bg  = ok ? 'rgba(95,208,165,.15)'  : 'rgba(224,102,90,.15)';
    var col = ok ? '#5fd0a5' : '#e0665a';
    var ico = ok ? '✅' : '❌';
    return '<span style="background:' + bg + ';color:' + col + ';border:1px solid ' + col + '44;' +
           'padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">' + ico + ' ' + label + '</span>';
  }

  function card(title, icon, content) {
    return '<div style="background:#0d1a24;border:1px solid #1c2a37;border-radius:10px;padding:16px;display:flex;flex-direction:column;gap:10px;">' +
           '<div style="font-size:12px;font-weight:700;color:#8ea3b0;text-transform:uppercase;letter-spacing:.05em;">' + icon + ' ' + title + '</div>' +
           content +
           '</div>';
  }

  function row(label, value, color) {
    return '<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;">' +
           '<span style="color:#4a6070;">' + label + '</span>' +
           '<span style="color:' + (color || '#e6edf3') + ';font-weight:600;">' + value + '</span>' +
           '</div>';
  }

  function progressBar(pct, color) {
    return '<div style="height:5px;background:#1c2a37;border-radius:3px;overflow:hidden;">' +
           '<div style="height:5px;width:' + pct + '%;background:' + (color || '#5fd0a5') + ';border-radius:3px;transition:width .5s;"></div>' +
           '</div>';
  }

  var html = '';

  /* ── Рядок 1: Score + Загальне + Мережа ── */
  html += '<div style="display:grid;grid-template-columns:200px 1fr 1fr;gap:12px;margin-bottom:12px;">';

  /* Score */
  var circ  = 2 * Math.PI * 52;
  var dash  = (score / 100) * circ;
  html += '<div style="background:#0d1a24;border:1px solid #1c2a37;border-radius:10px;padding:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;">';
  html += '<svg width="110" height="110" viewBox="0 0 110 110">';
  html += '<circle cx="55" cy="55" r="52" fill="none" stroke="#1c2a37" stroke-width="8"/>';
  html += '<circle cx="55" cy="55" r="52" fill="none" stroke="' + scoreColor + '" stroke-width="8" ';
  html += 'stroke-dasharray="' + dash.toFixed(1) + ' ' + circ.toFixed(1) + '" stroke-linecap="round" transform="rotate(-90 55 55)"/>';
  html += '<text x="55" y="50" text-anchor="middle" font-size="22" font-weight="700" fill="' + scoreColor + '">' + score + '</text>';
  html += '<text x="55" y="68" text-anchor="middle" font-size="11" fill="#8ea3b0">/ 100</text>';
  html += '</svg>';
  html += '<div style="font-size:12px;font-weight:700;color:' + scoreColor + ';">' + scoreLabel + '</div>';
  html += '<div style="font-size:10px;color:#4a6070;">Security Score</div>';
  html += '</div>';

  /* Загальне */
  html += card('Загальне', '🖥️',
    row('Hostname', d.hostname || '—') +
    row('Модель', d.model || '—') +
    row('RouterOS', d.firmware || '—') +
    row('Timezone', d.timezone || '—') +
    row('DDNS', d.ddnsenable ? 'Увімкнено' : 'Вимкнено', d.ddnsenable ? '#e6b35a' : '#4a6070')
  );

  /* Мережа */
  html += card('Мережа', '🌐',
    row('WAN інтерфейс', d.wanif || 'ether1') +
    row('WAN тип', d.wantype || 'DHCP') +
    row('LAN IP', d.lanip || '192.168.88.1') +
    row('DHCP', d.dhcpenable ? (d.dhcprange || 'увімкнено') : 'вимкнено', d.dhcpenable ? '#5fd0a5' : '#4a6070') +
    row('NAT', d.natenable ? 'увімкнено' : '❌ вимкнено', d.natenable ? '#5fd0a5' : '#e0665a') +
    row('Failover', d.foenable ? 'увімкнено' : 'вимкнено', d.foenable ? '#5fd0a5' : '#4a6070')
  );

  html += '</div>';

  /* ── Рядок 2: Безпека деталі ── */
  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px;">';

  /* Безпека */
  html += card('Безпека', '🛡️',
    '<div style="display:flex;flex-wrap:wrap;gap:6px;">' +
    badge(d.changepass && d.adminpass.length >= 8, 'Пароль admin') +
    badge(d.basicfw,         'Firewall') +
    badge(d.macprotect,      'MAC захист') +
    badge(d.disableservices, 'Сервіси вимкнено') +
    badge(d.dnsprotect,      'DNS захист') +
    badge(d.disableipv6,     'IPv6 вимкнено') +
    badge(d.ipneighbor,      'Neighbor вимкнено') +
    badge(d.disablesvcports, 'Svc-ports вимкнено') +
    badge(d.fasttrack,       'FastTrack') +
    badge(d.backupenable,    'Backup') +
    badge(d.safetynet,       'Safety net') +
    badge(d.logwandrops,     'Лог WAN drops') +
    '</div>' +
    '<div style="margin-top:10px;">' +
    progressBar(score, scoreColor) +
    '<div style="font-size:10px;color:#4a6070;margin-top:4px;text-align:right;">' + score + '% безпека</div>' +
    '</div>'
  );

  /* DNS + NTP */
  html += card('DNS та моніторинг', '🔍',
    row('Upstream DNS', d.upstreamdns || '8.8.8.8,8.8.4.4') +
    row('allow-remote-requests', d.allowremote ? '⚠️ Так' : 'Ні', d.allowremote ? '#e6b35a' : '#5fd0a5') +
    row('DNS захист WAN', d.dnsprotect ? '✅ Так' : '❌ Ні', d.dnsprotect ? '#5fd0a5' : '#e0665a') +
    row('NTP', d.ntpenable ? 'pool.ntp.org' : '❌ Вимкнено', d.ntpenable ? '#5fd0a5' : '#e0665a') +
    row('Netwatch', d.netwatchenable ? (d.netwatchhost || 'увімкнено') : 'вимкнено', d.netwatchenable ? '#5fd0a5' : '#4a6070')
  );

  /* VPN */
  var vpnCount = [d.wgenable, d.ovpnenable, d.ovpnclenable, d.ipsecenable].filter(Boolean).length;
  html += card('VPN та розширені', '🔒',
    row('WireGuard',    d.wgenable     ? '✅ сервер' : '—', d.wgenable ? '#5fd0a5' : '#4a6070') +
    row('OpenVPN srv',  d.ovpnenable   ? '✅ сервер' : '—', d.ovpnenable ? '#5fd0a5' : '#4a6070') +
    row('OpenVPN cli',  d.ovpnclenable ? '✅ клієнт' : '—', d.ovpnclenable ? '#5fd0a5' : '#4a6070') +
    row('IPsec',        d.ipsecenable  ? '✅ тунелі' : '—', d.ipsecenable ? '#5fd0a5' : '#4a6070') +
    row('Port Forward', d.pfwenable    ? '✅ увімкнено' : '—', d.pfwenable ? '#e6b35a' : '#4a6070') +
    row('Address-List', d.addrlistenable ? '✅' : '—', d.addrlistenable ? '#5fd0a5' : '#4a6070') +
    row('Static Routes',d.routesenable ? '✅' : '—', d.routesenable ? '#5fd0a5' : '#4a6070') +
    '<div style="margin-top:8px;font-size:11px;color:#4a6070;">Активних VPN: <span style="color:#5fd0a5;font-weight:700;">' + vpnCount + '</span></div>'
  );

  html += '</div>';

  /* ── Рядок 3: Wi-Fi + Рекомендації ── */
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">';

  /* Wi-Fi */
  html += card('Wi-Fi та VLAN', '📶',
    row('Wi-Fi', d.wifienable ? '✅ увімкнено' : 'вимкнено', d.wifienable ? '#5fd0a5' : '#4a6070') +
    row('SSID', d.ssid || '—') +
    row('CAPsMAN', d.capsmanenable ? '✅ сервер' : 'вимкнено', d.capsmanenable ? '#5fd0a5' : '#4a6070') +
    row('Guest VLAN', d.guestenable ? '✅ ізольована' : 'вимкнено', d.guestenable ? '#5fd0a5' : '#4a6070') +
    row('DNS Static', d.dnsstaticenable ? '✅' : '—', d.dnsstaticenable ? '#5fd0a5' : '#4a6070')
  );

  /* Рекомендації */
  var recs = [];
  if (!d.changepass || !d.adminpass)  recs.push({ t: '🔴 Встанови пароль admin',          c: '#e0665a' });
  if (!d.basicfw)                     recs.push({ t: '🔴 Увімкни базовий firewall',        c: '#e0665a' });
  if (!d.natenable)                   recs.push({ t: '🔴 Увімкни NAT masquerade',          c: '#e0665a' });
  if (!d.ntpenable)                   recs.push({ t: '🟡 Налаштуй NTP клієнт',            c: '#e6b35a' });
  if (!d.fasttrack)                   recs.push({ t: '🟡 Додай FastTrack для швидкості',  c: '#e6b35a' });
  if (!d.backupenable)                recs.push({ t: '🟡 Увімкни резервну копію',         c: '#e6b35a' });
  if (!d.disableservices)             recs.push({ t: '🟡 Вимкни небезпечні сервіси',      c: '#e6b35a' });
  if (!d.macprotect)                  recs.push({ t: '🟡 Увімкни MAC захист',             c: '#e6b35a' });
  if (d.allowremote && !d.dnsprotect) recs.push({ t: '🟡 Захисти DNS від WAN',            c: '#e6b35a' });
  if (!d.disableipv6)                 recs.push({ t: '🔵 Розглянь вимкнення IPv6',        c: '#5b9bd5' });
  if (!d.foenable)                    recs.push({ t: '🔵 Розглянь Failover WAN',          c: '#5b9bd5' });
  if (recs.length === 0)              recs.push({ t: '✅ Конфігурація виглядає відмінно!', c: '#5fd0a5' });

  var recsHtml = recs.slice(0, 8).map(function(r) {
    return '<div style="font-size:11.5px;color:' + r.c + ';padding:4px 0;border-bottom:1px solid #1c2a37;">' + r.t + '</div>';
  }).join('');

  html += card('💡 Рекомендації', '💡', recsHtml);
  html += '</div>';

  /* ── Підсумок ── */
  html += '<div style="margin-top:12px;background:#060d14;border:1px solid #1c2a37;border-radius:8px;padding:12px 16px;' +
          'display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">';
  html += '<div style="font-size:11px;color:#4a6070;">';
  html += '🖥️ ' + (d.hostname || 'MikroTik') + ' &nbsp;·&nbsp; ';
  html += '🌐 WAN: ' + (d.wantype || 'DHCP') + ' &nbsp;·&nbsp; ';
  html += '📶 Wi-Fi: ' + (d.wifienable ? d.ssid || 'увімкнено' : 'вимкнено') + ' &nbsp;·&nbsp; ';
  html += '🔒 VPN: ' + vpnCount + ' &nbsp;·&nbsp; ';
  html += '🛡️ Score: <span style="color:' + scoreColor + ';font-weight:700;">' + score + '/100</span>';
  html += '</div>';
  html += '<div style="font-size:10px;color:#2a3b48;">MikroTik Config Generator · Patch 35B</div>';
  html += '</div>';

  return html;
}

/* ══════════════════════════════════════════════
   ІНІЦІАЛІЗАЦІЯ
══════════════════════════════════════════════ */
function initDashboard() {

  /* Модальне вікно */
  var modal = document.createElement('div');
  modal.id = 'dashboard-modal';
  modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9999;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;';

  var inner = document.createElement('div');
  inner.style.cssText = 'background:#16212c;border:1px solid #2a3b48;border-radius:12px;padding:24px;max-width:980px;width:100%;margin:auto;';

  inner.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
    '<div>' +
    '<h3 style="margin:0;color:#5fd0a5;font-size:15px;">📊 Dashboard</h3>' +
    '<div style="font-size:11px;color:#4a6070;margin-top:2px;">Огляд поточної конфігурації в реальному часі</div>' +
    '</div>' +
    '<div style="display:flex;gap:8px;align-items:center;">' +
    '<button id="db-refresh" style="background:transparent;border:1px solid #2a3b48;color:#5fd0a5;padding:4px 12px;border-radius:6px;cursor:pointer;font-size:12px;">🔄 Оновити</button>' +
    '<button id="db-close" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:4px 12px;border-radius:6px;cursor:pointer;font-size:12px;">✕ Закрити</button>' +
    '</div>' +
    '</div>' +
    '<div id="db-body"></div>';

  modal.appendChild(inner);
  document.body.appendChild(modal);

  /* Закрити */
  document.getElementById('db-close').addEventListener('click', function() {
    modal.style.display = 'none';
  });
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.style.display = 'none';
  });

  /* Оновити */
  document.getElementById('db-refresh').addEventListener('click', function() {
    document.getElementById('db-body').innerHTML = renderDashboard(collectDashboardData());
  });

  /* Кнопка */
  var btn = document.createElement('button');
  btn.id = 'btn-dashboard';
  btn.className = 'sec';
  btn.textContent = '📊 Dashboard';

  var btnbar = document.querySelector('.btnbar');
  if (btnbar) btnbar.appendChild(btn);

  btn.addEventListener('click', function() {
    document.getElementById('db-body').innerHTML = renderDashboard(collectDashboardData());
    modal.style.display = 'flex';
  });

  /* Floating кнопка */
  var fab = document.createElement('button');
  fab.id = 'btn-dashboard-fab';
  fab.title = 'Dashboard';
  fab.style.cssText = [
    'position:fixed','bottom:66px','right:16px',
    'background:#16212c','border:1px solid #2a3b48',
    'color:#5fd0a5','border-radius:50%',
    'width:42px','height:42px',
    'font-size:18px','cursor:pointer',
    'z-index:9990','display:flex',
    'align-items:center','justify-content:center',
    'box-shadow:0 4px 12px rgba(0,0,0,.4)',
    'transition:all .2s',
  ].join(';');
  fab.textContent = '📊';
  fab.addEventListener('mouseenter', function() { fab.style.transform = 'scale(1.1)'; });
  fab.addEventListener('mouseleave', function() { fab.style.transform = 'scale(1)'; });
  fab.addEventListener('click', function() {
    document.getElementById('db-body').innerHTML = renderDashboard(collectDashboardData());
    modal.style.display = 'flex';
  });
  document.body.appendChild(fab);

  console.log('[dashboard] ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}