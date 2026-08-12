/* ============================================================
   templates.js — Бібліотека готових шаблонів конфігурації
   ============================================================ */
'use strict';

var TEMPLATES = [
  {
    id: 'cafe',
    icon: '🏪',
    name: 'Кафе з гостьовим Wi-Fi',
    desc: 'Ізольована гостьова мережа для клієнтів',
    tags: ['Wi-Fi', 'Guest', 'DHCP'],
    apply: function() {
      setField('hostname',        'Cafe-Router');
      setField('wanif',           'ether1');
      setField('wantype',         'dhcp');
      setField('lanip',           '192.168.1.1/24');
      setField('dhcprange',       '192.168.1.10-192.168.1.200');
      setCheck('dhcpenable',      true);
      setCheck('wifienable',      true);
      setField('ssid',            'Cafe-Staff');
      setCheck('band24',          true);
      setCheck('band5',           true);
      setCheck('guestenable',     true);
      setField('guestvlan',       '20');
      setField('guestip',         '192.168.20.1/24');
      setField('guestrange',      '192.168.20.10-192.168.20.200');
      setCheck('guestwifi',       true);
      setField('guestssid',       'Cafe-Guest');
      setCheck('basicfw',         true);
      setCheck('macprotect',      true);
      setCheck('ntpenable',       true);
      setCheck('natenable',       true);
      setCheck('dnsprotect',      true);
      setCheck('disableservices', true);
      setCheck('backupenable',    true);
    }
  },
  {
    id: 'office_vpn',
    icon: '🏢',
    name: 'Офіс з WireGuard VPN',
    desc: 'Корпоративна мережа з VPN для віддаленого доступу',
    tags: ['WireGuard', 'Firewall', 'VPN'],
    apply: function() {
      setField('hostname',        'Office-Router');
      setField('wanif',           'ether1');
      setField('wantype',         'dhcp');
      setField('lanip',           '192.168.1.1/24');
      setField('lanports',        'ether2,ether3,ether4,ether5');
      setField('dhcprange',       '192.168.1.10-192.168.1.200');
      setCheck('dhcpenable',      true);
      setCheck('wifienable',      true);
      setField('ssid',            'Office-WiFi');
      setCheck('band24',          true);
      setCheck('band5',           true);
      setCheck('wgenable',        true);
      setField('wgport',          '51820');
      setField('wgserverip',      '10.20.30.1/24');
      setCheck('basicfw',         true);
      setCheck('macprotect',      true);
      setCheck('disableservices', true);
      setCheck('ntpenable',       true);
      setCheck('natenable',       true);
      setCheck('dnsprotect',      true);
      setCheck('backupenable',    true);
      setCheck('disableipv6',     true);
      setCheck('safetynet',       true);
    }
  },
  {
    id: 'home_lte',
    icon: '📶',
    name: 'Дім з LTE резервом',
    desc: 'Основний DHCP + LTE Failover як резервний канал',
    tags: ['Failover', 'LTE', 'Home'],
    apply: function() {
      setField('hostname',        'Home-Router');
      setField('wanif',           'ether1');
      setField('wantype',         'dhcp');
      setField('lanip',           '192.168.88.1/24');
      setField('dhcprange',       '192.168.88.10-192.168.88.254');
      setCheck('dhcpenable',      true);
      setCheck('wifienable',      true);
      setField('ssid',            'HomeNetwork');
      setCheck('band24',          true);
      setCheck('band5',           true);
      setCheck('foenable',        true);
      setField('foif',            'lte1');
      setField('fotype',          'lte');
      setField('foapn',           'internet');
      setField('fohealthhost',    '1.1.1.1');
      setCheck('basicfw',         true);
      setCheck('macprotect',      true);
      setCheck('ntpenable',       true);
      setCheck('natenable',       true);
      setCheck('backupenable',    true);
    }
  },
  {
    id: 'industrial',
    icon: '🏭',
    name: 'Промережа з резервуванням',
    desc: 'Надійність, безпека, статична IP, без Wi-Fi',
    tags: ['Static IP', 'Firewall', 'Industrial'],
    apply: function() {
      setField('hostname',        'Industrial-Router');
      setField('wanif',           'ether1');
      setField('wantype',         'static');
      setField('lanip',           '10.0.0.1/24');
      setField('lanports',        'ether2,ether3,ether4,ether5');
      setField('dhcprange',       '10.0.0.10-10.0.0.200');
      setCheck('dhcpenable',      true);
      setCheck('wifienable',      false);
      setCheck('basicfw',         true);
      setCheck('macprotect',      true);
      setCheck('disableservices', true);
      setCheck('disablesvcports', true);
      setCheck('ntpenable',       true);
      setCheck('natenable',       true);
      setCheck('dnsprotect',      true);
      setCheck('disableipv6',     true);
      setCheck('backupenable',    true);
      setCheck('safetynet',       true);
      setCheck('logwandrops',     true);
    }
  },
  {
    id: 'isp_pppoe',
    icon: '📡',
    name: 'ISP точка з PPPoE',
    desc: 'PPPoE підключення від провайдера з FastTrack',
    tags: ['PPPoE', 'FastTrack', 'ISP'],
    apply: function() {
      setField('hostname',        'ISP-Router');
      setField('wanif',           'ether1');
      setField('wantype',         'pppoe');
      setField('lanip',           '192.168.88.1/24');
      setField('dhcprange',       '192.168.88.10-192.168.88.254');
      setCheck('dhcpenable',      true);
      setCheck('wifienable',      true);
      setField('ssid',            'MyNetwork');
      setCheck('band24',          true);
      setCheck('band5',           true);
      setCheck('basicfw',         true);
      setCheck('fasttrack',       true);
      setCheck('macprotect',      true);
      setCheck('ntpenable',       true);
      setCheck('natenable',       true);
      setCheck('dnsprotect',      true);
      setCheck('backupenable',    true);
    }
  },
  {
    id: 'max_security',
    icon: '🔒',
    name: 'Максимальна безпека',
    desc: 'Всі захисти увімкнено, IPv6 вимкнено',
    tags: ['Security', 'Firewall', 'Hardening'],
    apply: function() {
      setField('hostname',        'Secure-Router');
      setField('wanif',           'ether1');
      setField('wantype',         'dhcp');
      setField('lanip',           '192.168.88.1/24');
      setField('dhcprange',       '192.168.88.10-192.168.88.200');
      setCheck('dhcpenable',      true);
      setCheck('basicfw',         true);
      setCheck('fasttrack',       true);
      setCheck('macprotect',      true);
      setCheck('disableservices', true);
      setCheck('disablesvcports', true);
      setCheck('ntpenable',       true);
      setCheck('natenable',       true);
      setCheck('dnsprotect',      true);
      setCheck('disableipv6',     true);
      setCheck('backupenable',    true);
      setCheck('safetynet',       true);
      setCheck('logwandrops',     true);
      setField('upstreamdns',     '1.1.1.1,8.8.8.8');
    }
  },
  {
    id: 'smart_home',
    icon: '🏠',
    name: 'Розумний будинок',
    desc: 'IoT VLAN ізольований від основної мережі',
    tags: ['IoT', 'VLAN', 'Guest', 'Wi-Fi'],
    apply: function() {
      setField('hostname',        'SmartHome-Router');
      setField('wanif',           'ether1');
      setField('wantype',         'dhcp');
      setField('lanip',           '192.168.88.1/24');
      setField('dhcprange',       '192.168.88.10-192.168.88.200');
      setCheck('dhcpenable',      true);
      setCheck('wifienable',      true);
      setField('ssid',            'SmartHome');
      setCheck('band24',          true);
      setCheck('band5',           true);
      setCheck('guestenable',     true);
      setField('guestvlan',       '30');
      setField('guestip',         '192.168.30.1/24');
      setField('guestrange',      '192.168.30.10-192.168.30.200');
      setCheck('guestwifi',       true);
      setField('guestssid',       'SmartHome-IoT');
      setCheck('basicfw',         true);
      setCheck('macprotect',      true);
      setCheck('ntpenable',       true);
      setCheck('natenable',       true);
      setCheck('dnsprotect',      true);
      setCheck('backupenable',    true);
    }
  },
  {
    id: 'capsman',
    icon: '📻',
    name: 'CAPsMAN контролер',
    desc: 'Централізоване управління Wi-Fi точками доступу',
    tags: ['CAPsMAN', 'Wi-Fi', 'Enterprise'],
    apply: function() {
      setField('hostname',        'CAPsMAN-Controller');
      setField('wanif',           'ether1');
      setField('wantype',         'dhcp');
      setField('lanip',           '192.168.88.1/24');
      setField('lanports',        'ether2,ether3,ether4,ether5');
      setField('dhcprange',       '192.168.88.10-192.168.88.254');
      setCheck('dhcpenable',      true);
      setCheck('capsmanenable',   true);
      setField('capsmanssid',     'Enterprise-WiFi');
      setField('capsman24ch',     '2417/20/gn');
      setField('capsman5ch',      '5180/80/ac');
      setCheck('basicfw',         true);
      setCheck('macprotect',      true);
      setCheck('ntpenable',       true);
      setCheck('natenable',       true);
      setCheck('backupenable',    true);
    }
  },
];

/* ── Допоміжні функції ── */
function setField(id, value) {
  var el = document.getElementById(id);
  if (!el) return;
  el.value = value;
  el.dispatchEvent(new Event('change'));
  el.dispatchEvent(new Event('input'));
}

function setCheck(id, checked) {
  var el = document.getElementById(id);
  if (!el) return;
  if (el.checked === checked) return;
  el.checked = checked;
  el.dispatchEvent(new Event('change'));
}

/* ── Показати тег ── */
function tmplTag(tag) {
  return '<span style="' +
    'font-size:10px;padding:2px 6px;border-radius:3px;' +
    'background:#1c2a37;color:#8ea3b0;border:1px solid #2a3b48' +
  '">' + tag + '</span>';
}

/* ── Рендер модалки ── */
function tmplRender() {
  var list = document.getElementById('tmpl-list');
  if (!list) return;

  list.innerHTML = TEMPLATES.map(function(t) {
    return '<div class="tmpl-card" data-id="' + t.id + '">' +
      '<div style="display:flex;align-items:flex-start;gap:12px">' +
        '<div style="font-size:28px;line-height:1">' + t.icon + '</div>' +
        '<div style="flex:1">' +
          '<div style="font-size:14px;font-weight:700;color:#e6edf3;margin-bottom:3px">' +
            t.name +
          '</div>' +
          '<div style="font-size:12px;color:#8ea3b0;margin-bottom:8px">' +
            t.desc +
          '</div>' +
          '<div style="display:flex;gap:4px;flex-wrap:wrap">' +
            t.tags.map(tmplTag).join('') +
          '</div>' +
        '</div>' +
        '<button class="tmpl-apply-btn" data-id="' + t.id + '" style="' +
          'font-size:12px;padding:6px 14px;border-radius:6px;' +
          'background:#5fd0a5;color:#082018;border:none;' +
          'cursor:pointer;white-space:nowrap;font-weight:700' +
        '">Застосувати</button>' +
      '</div>' +
    '</div>';
  }).join('');

  /* Bind events */
  list.querySelectorAll('.tmpl-apply-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var id = btn.dataset.id;
      var tmpl = TEMPLATES.find(function(t) { return t.id === id; });
      if (!tmpl) return;

      tmpl.apply();

      /* Оновлюємо форму */
      setTimeout(function() {
        if (typeof window.render === 'function') window.render();
        if (typeof window.updateButtons === 'function') window.updateButtons();
        if (typeof window.updateSecurityScore === 'function') window.updateSecurityScore();
        if (typeof window.createSectionButtons === 'function') window.createSectionButtons();
      }, 150);

      tmplClose();

      /* Toast */
      tmplToast(tmpl.icon + ' ' + tmpl.name + ' застосовано!');
    });
  });
}

/* ── Toast ── */
function tmplToast(msg) {
  var t = document.getElementById('tmpl-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'tmpl-toast';
    t.style.cssText = [
      'position:fixed', 'bottom:68px', 'left:24px',
      'background:#5fd0a5', 'color:#082018',
      'padding:8px 18px', 'border-radius:8px',
      'font-size:13px', 'font-weight:700',
      'z-index:99999', 'opacity:0',
      'transition:opacity .25s'
    ].join(';');
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._h);
  t._h = setTimeout(function() { t.style.opacity = '0'; }, 3000);
}

/* ── Відкрити / закрити ── */
function tmplOpen() {
  var overlay = document.getElementById('tmpl-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
    tmplRender();
  }
}

function tmplClose() {
  var overlay = document.getElementById('tmpl-overlay');
  if (overlay) overlay.style.display = 'none';
}

/* ── Ініціалізація ── */
function tmplInit() {
  /* CSS */
  var style = document.createElement('style');
  style.textContent = [
    '.tmpl-card{',
      'background:#0f1720;',
      'border:1px solid #2a3b48;',
      'border-radius:10px;',
      'padding:14px 16px;',
      'margin-bottom:10px;',
      'transition:border-color .2s;',
    '}',
    '.tmpl-card:hover{border-color:#5fd0a5}',
  ].join('\n');
  document.head.appendChild(style);

  /* Кнопка */
  var btn = document.createElement('button');
  btn.id = 'tmpl-btn';
  btn.textContent = '📚 Шаблони';
  btn.title = 'Бібліотека готових конфігурацій';
  btn.style.cssText = [
    'position:fixed', 'bottom:24px', 'left:264px',
    'background:#2a3b48', 'color:#e6edf3',
    'border:1px solid #3a5060', 'border-radius:50px',
    'padding:10px 20px', 'font-size:13px', 'font-weight:700',
    'cursor:pointer', 'z-index:9998', 'transition:all .2s'
  ].join(';');
  btn.onmouseover = function() { btn.style.background = '#3a5060'; };
  btn.onmouseout  = function() { btn.style.background = '#2a3b48'; };
  btn.addEventListener('click', tmplOpen);
  document.body.appendChild(btn);

  /* Overlay */
  var overlay = document.createElement('div');
  overlay.id = 'tmpl-overlay';
  overlay.style.cssText = [
    'position:fixed', 'inset:0',
    'background:rgba(0,0,0,.75)',
    'z-index:9999', 'display:none',
    'align-items:center', 'justify-content:center'
  ].join(';');

  overlay.innerHTML =
    '<div id="tmpl-modal" style="' +
      'background:#16212c;' +
      'border:1px solid #2a3b48;' +
      'border-radius:14px;' +
      'width:min(620px,95vw);' +
      'max-height:85vh;' +
      'overflow-y:auto;' +
      'padding:24px;' +
    '">' +
      '<div style="display:flex;align-items:center;margin-bottom:16px">' +
        '<div style="font-size:18px;font-weight:700;color:#5fd0a5">' +
          '📚 Бібліотека шаблонів' +
        '</div>' +
        '<button id="tmpl-close" style="' +
          'margin-left:auto;background:transparent;' +
          'border:1px solid #2a3b48;color:#8ea3b0;' +
          'padding:4px 12px;border-radius:6px;cursor:pointer;font-size:13px' +
        '">✕ Закрити</button>' +
      '</div>' +
      '<div style="color:#8ea3b0;font-size:12px;margin-bottom:16px">' +
        'Оберіть шаблон — форма заповниться автоматично' +
      '</div>' +
      '<div id="tmpl-list"></div>' +
    '</div>';

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) tmplClose();
  });
  document.body.appendChild(overlay);

  document.getElementById('tmpl-close')
    .addEventListener('click', tmplClose);

  console.log('[templates.js] ✅ ready | ' + TEMPLATES.length + ' шаблонів');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', tmplInit);
} else {
  tmplInit();
}