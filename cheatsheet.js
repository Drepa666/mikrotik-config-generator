/* ============================================================
   cheatsheet.js — RouterOS команди шпаргалка
   Patch 37 | MikroTik Config Generator
   ============================================================ */
'use strict';

var CHEATSHEET = [
  {
    category: '🔍 Діагностика',
    color: '#5b9bd5',
    commands: [
      { cmd: '/ping 8.8.8.8 count=4',                        desc: 'Пінг до Google DNS' },
      { cmd: '/tool traceroute 8.8.8.8',                     desc: 'Трасування маршруту' },
      { cmd: '/ip route print',                              desc: 'Таблиця маршрутизації' },
      { cmd: '/ip address print',                            desc: 'Всі IP адреси' },
      { cmd: '/interface print',                             desc: 'Всі інтерфейси' },
      { cmd: '/interface monitor-traffic ether1 once',       desc: 'Трафік на інтерфейсі' },
      { cmd: '/tool bandwidth-test address=192.168.88.2',    desc: 'Тест пропускної здатності' },
      { cmd: '/log print',                                   desc: 'Системний лог' },
      { cmd: '/log print follow',                            desc: 'Лог в реальному часі' },
      { cmd: '/system resource print',                       desc: 'CPU / RAM / uptime' },
      { cmd: '/ip neighbor print',                           desc: 'ARP таблиця сусідів' },
      { cmd: '/ip arp print',                                desc: 'ARP таблиця' },
      { cmd: '/interface wireless registration-table print', desc: 'Підключені Wi-Fi клієнти' },
      { cmd: '/ip dhcp-server lease print',                  desc: 'DHCP lease таблиця' },
      { cmd: '/ip firewall connection print',                desc: 'Активні з\'єднання' },
      { cmd: '/tool sniffer quick interface=ether1 count=20',desc: 'Сніфер пакетів (20 шт)' },
    ]
  },
  {
    category: '🛡️ Firewall',
    color: '#e0665a',
    commands: [
      { cmd: '/ip firewall filter print',                    desc: 'Всі правила filter' },
      { cmd: '/ip firewall nat print',                       desc: 'Всі правила NAT' },
      { cmd: '/ip firewall filter print stats',              desc: 'Правила + лічильники спрацювань' },
      { cmd: '/ip firewall filter remove [find]',            desc: '⚠️ Видалити ВСІ правила filter' },
      { cmd: '/ip firewall nat remove [find]',               desc: '⚠️ Видалити ВСІ правила NAT' },
      { cmd: '/ip firewall address-list print',              desc: 'Address-list записи' },
      { cmd: '/ip firewall connection tracking set enabled=yes', desc: 'Увімкнути connection tracking' },
      { cmd: '/ip firewall filter add chain=input action=drop src-address=1.2.3.4', desc: 'Заблокувати IP' },
      { cmd: '/ip firewall address-list add address=1.2.3.4 list=blocked', desc: 'Додати IP в чорний список' },
    ]
  },
  {
    category: '📡 Wi-Fi',
    color: '#5fd0a5',
    commands: [
      { cmd: '/interface wireless print',                    desc: 'Параметри Wi-Fi інтерфейсів' },
      { cmd: '/interface wireless registration-table print', desc: 'Підключені клієнти' },
      { cmd: '/interface wireless scan wlan1 duration=5',    desc: 'Сканування Wi-Fi мереж' },
      { cmd: '/interface wireless set wlan1 disabled=no',    desc: 'Увімкнути Wi-Fi' },
      { cmd: '/interface wireless set wlan1 ssid="MyWiFi"', desc: 'Змінити SSID' },
      { cmd: '/caps-man radio print',                        desc: 'CAPsMAN радіомодулі' },
      { cmd: '/caps-man registration-table print',           desc: 'CAPsMAN клієнти' },
    ]
  },
  {
    category: '🌐 IP та маршрути',
    color: '#e6b35a',
    commands: [
      { cmd: '/ip address add address=192.168.88.1/24 interface=bridge-lan', desc: 'Додати IP на інтерфейс' },
      { cmd: '/ip route add dst-address=0.0.0.0/0 gateway=192.168.1.1',     desc: 'Додати маршрут за замовчуванням' },
      { cmd: '/ip route add dst-address=10.0.0.0/8 gateway=192.168.1.254',  desc: 'Додати статичний маршрут' },
      { cmd: '/ip dhcp-client print',                                         desc: 'DHCP клієнти' },
      { cmd: '/ip dhcp-server lease print',                                   desc: 'DHCP leases' },
      { cmd: '/ip dhcp-server lease make-static [find]',                      desc: 'Зробити всі leases статичними' },
      { cmd: '/ip dns print',                                                 desc: 'DNS налаштування' },
      { cmd: '/ip dns cache print',                                           desc: 'DNS кеш' },
      { cmd: '/ip dns cache flush',                                           desc: 'Очистити DNS кеш' },
      { cmd: '/ip cloud print',                                               desc: 'Cloud DDNS статус' },
    ]
  },
  {
    category: '🔒 VPN',
    color: '#9b87f5',
    commands: [
      { cmd: '/interface wireguard print',                   desc: 'WireGuard інтерфейси' },
      { cmd: '/interface wireguard peers print',             desc: 'WireGuard peers' },
      { cmd: '/interface wireguard peers set 0 persistent-keepalive=25s', desc: 'Keepalive для peer' },
      { cmd: '/interface ovpn-server server print',          desc: 'OpenVPN сервер' },
      { cmd: '/ppp active print',                            desc: 'Активні PPP/VPN з\'єднання' },
      { cmd: '/ip ipsec policy print',                       desc: 'IPsec policies' },
      { cmd: '/ip ipsec sa print',                           desc: 'IPsec SA (активні тунелі)' },
      { cmd: '/ip ipsec peer print',                         desc: 'IPsec peers' },
    ]
  },
  {
    category: '⚙️ Система',
    color: '#8ea3b0',
    commands: [
      { cmd: '/system identity print',                       desc: 'Ім\'я роутера' },
      { cmd: '/system identity set name="MyRouter"',         desc: 'Змінити ім\'я роутера' },
      { cmd: '/system clock print',                          desc: 'Поточний час' },
      { cmd: '/system ntp client print',                     desc: 'NTP статус' },
      { cmd: '/system resource print',                       desc: 'Ресурси системи' },
      { cmd: '/system routerboard print',                    desc: 'Інформація про залізо' },
      { cmd: '/system health print',                         desc: 'Температура та напруга' },
      { cmd: '/system scheduler print',                      desc: 'Планувальник задач' },
      { cmd: '/system script print',                         desc: 'Список скриптів' },
      { cmd: '/system script run backup-script',             desc: 'Запустити скрипт вручну' },
      { cmd: '/system reboot',                               desc: 'Перезавантажити роутер' },
      { cmd: '/system shutdown',                             desc: 'Вимкнути роутер' },
      { cmd: '/system package update check-for-updates',     desc: 'Перевірити оновлення' },
      { cmd: '/system package update install',               desc: 'Встановити оновлення' },
    ]
  },
  {
    category: '💾 Backup та Export',
    color: '#5fd0a5',
    commands: [
      { cmd: '/system backup save name=my-backup',           desc: 'Зберегти backup (.backup)' },
      { cmd: '/system backup load name=my-backup',           desc: 'Відновити з backup' },
      { cmd: '/export file=my-config',                       desc: 'Експорт конфігу (.rsc)' },
      { cmd: '/export verbose file=my-config-full',          desc: 'Повний експорт з дефолтами' },
      { cmd: '/export compact file=my-config-compact',       desc: 'Компактний експорт' },
      { cmd: '/import file-name=my-config.rsc',              desc: 'Імпорт .rsc файлу' },
      { cmd: '/file print',                                  desc: 'Список файлів' },
      { cmd: '/file remove my-backup.backup',                desc: 'Видалити файл' },
    ]
  },
  {
    category: '👤 Користувачі',
    color: '#e6b35a',
    commands: [
      { cmd: '/user print',                                  desc: 'Список користувачів' },
      { cmd: '/user set admin password="NewPass123!"',       desc: 'Змінити пароль admin' },
      { cmd: '/user add name=viewer group=read password="pass"', desc: 'Додати користувача (read-only)' },
      { cmd: '/user active print',                           desc: 'Активні сесії' },
      { cmd: '/ip service print',                            desc: 'Активні сервіси (winbox/ssh/...)' },
      { cmd: '/ip service set telnet disabled=yes',          desc: 'Вимкнути telnet' },
      { cmd: '/ip service set ssh port=2222',                desc: 'Змінити порт SSH' },
      { cmd: '/tool mac-server print',                       desc: 'MAC сервер налаштування' },
    ]
  },
  {
    category: '🔀 Bridge та VLAN',
    color: '#5b9bd5',
    commands: [
      { cmd: '/interface bridge print',                      desc: 'Bridge інтерфейси' },
      { cmd: '/interface bridge port print',                 desc: 'Bridge порти' },
      { cmd: '/interface bridge port add bridge=bridge-lan interface=ether2', desc: 'Додати порт до bridge' },
      { cmd: '/interface vlan print',                        desc: 'VLAN інтерфейси' },
      { cmd: '/interface ethernet print',                    desc: 'Ethernet інтерфейси' },
      { cmd: '/interface print where type=ether',            desc: 'Тільки ethernet інтерфейси' },
      { cmd: '/interface ethernet set ether1 speed=1Gbps',   desc: 'Встановити швидкість порту' },
    ]
  },
  {
    category: '📊 Моніторинг',
    color: '#9b87f5',
    commands: [
      { cmd: '/tool netwatch print',                         desc: 'Netwatch записи' },
      { cmd: '/tool netwatch add host=8.8.8.8 interval=30s', desc: 'Додати Netwatch хост' },
      { cmd: '/queue simple print',                          desc: 'Черги QoS' },
      { cmd: '/queue tree print',                            desc: 'Tree черги' },
      { cmd: '/interface monitor-traffic [find] once',       desc: 'Трафік всіх інтерфейсів' },
      { cmd: '/ip firewall connection print count-only',     desc: 'Кількість з\'єднань' },
      { cmd: '/tool graphing interface add interface=all',   desc: 'Графіки трафіку (Winbox)' },
    ]
  },
];

/* ══════════════════════════════════════════════
   РЕНДЕР
══════════════════════════════════════════════ */
function renderCheatsheet(filter) {
  var html = '';
  var filterLow = (filter || '').toLowerCase();

  CHEATSHEET.forEach(function(section) {

    /* Фільтрація */
    var cmds = section.commands.filter(function(c) {
      if (!filterLow) return true;
      return c.cmd.toLowerCase().indexOf(filterLow) !== -1 ||
             c.desc.toLowerCase().indexOf(filterLow) !== -1;
    });

    if (!cmds.length) return;

    html += '<div style="margin-bottom:20px;">';

    /* Заголовок секції */
    html += '<div style="font-size:12px;font-weight:700;color:' + section.color + ';' +
            'margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid ' + section.color + '33;">' +
            section.category + ' <span style="color:#4a6070;font-weight:400;">(' + cmds.length + ')</span>' +
            '</div>';

    /* Команди */
    cmds.forEach(function(item) {
      var isWarn = item.cmd.indexOf('⚠️') !== -1 ||
                   item.cmd.indexOf('remove [find]') !== -1;

      html += '<div class="cs-row" style="display:grid;grid-template-columns:1fr auto;' +
              'gap:8px;align-items:center;padding:7px 10px;border-radius:6px;margin-bottom:4px;' +
              'background:' + (isWarn ? 'rgba(224,102,90,.08)' : '#060d14') + ';' +
              'border:1px solid ' + (isWarn ? '#e0665a33' : '#1c2a37') + ';">';

      /* Команда */
      html += '<div>';
      html += '<code style="font-family:monospace;font-size:11.5px;color:' +
              (isWarn ? '#e0665a' : section.color) + ';word-break:break-all;">' +
              escH(item.cmd) + '</code>';
      html += '<div style="font-size:11px;color:#4a6070;margin-top:2px;">' +
              escH(item.desc) + '</div>';
      html += '</div>';

      /* Кнопка копіювати */
      html += '<button onclick="csRun(this)" data-cmd="' + escA(item.cmd) + '" ' +
              'title="Копіювати команду" ' +
              'style="flex-shrink:0;background:transparent;border:1px solid #2a3b48;' +
              'color:#8ea3b0;padding:4px 10px;border-radius:5px;cursor:pointer;' +
              'font-size:11px;white-space:nowrap;">📋</button>';

      html += '</div>';
    });

    html += '</div>';
  });

  if (!html) {
    html = '<div style="text-align:center;color:#4a6070;padding:40px;font-size:13px;">' +
           '🔍 Нічого не знайдено за запитом «' + escH(filter) + '»</div>';
  }

  return html;
}

function escH(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escA(s) {
  return String(s||'').replace(/"/g,'&quot;');
}

/* Копіювати команду */
window.csRun = function(btn) {
  var cmd = btn.getAttribute('data-cmd');
  if (!cmd) return;
  var orig = btn.textContent;

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(cmd).then(function() {
      btn.textContent = '✓';
      btn.style.color = '#5fd0a5';
      setTimeout(function(){
        btn.textContent = orig;
        btn.style.color = '#8ea3b0';
      }, 1200);
    });
  } else {
    var ta = document.createElement('textarea');
    ta.value = cmd;
    ta.style.cssText = 'position:fixed;left:-9999px;';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.textContent = '✓';
    btn.style.color = '#5fd0a5';
    setTimeout(function(){
      btn.textContent = orig;
      btn.style.color = '#8ea3b0';
    }, 1200);
  }
};

/* ══════════════════════════════════════════════
   ІНІЦІАЛІЗАЦІЯ
══════════════════════════════════════════════ */
function initCheatsheet() {

  /* Модальне вікно */
  var modal = document.createElement('div');
  modal.id = 'cs-modal';
  modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.88);' +
                        'z-index:9999;align-items:flex-start;justify-content:center;' +
                        'padding:20px;overflow-y:auto;';

  var inner = document.createElement('div');
  inner.style.cssText = 'background:#16212c;border:1px solid #2a3b48;border-radius:12px;' +
                        'padding:24px;max-width:760px;width:100%;margin:auto;';

  inner.innerHTML =
    /* Шапка */
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
    '<div>' +
    '<h3 style="margin:0;color:#5fd0a5;font-size:15px;">📖 RouterOS Шпаргалка</h3>' +
    '<div style="font-size:11px;color:#4a6070;margin-top:2px;">' +
    countCmds() + ' команд · натисни 📋 щоб скопіювати</div>' +
    '</div>' +
    '<button id="cs-close" style="background:transparent;border:1px solid #2a3b48;' +
    'color:#8ea3b0;padding:4px 14px;border-radius:6px;cursor:pointer;">✕</button>' +
    '</div>' +

    /* Пошук */
    '<div style="position:relative;margin-bottom:16px;">' +
    '<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);' +
    'font-size:14px;pointer-events:none;">🔍</span>' +
    '<input id="cs-search" type="text" placeholder="Пошук команди або опису..." ' +
    'style="width:100%;background:#0d1a24;border:1px solid #2a3b48;color:#e6edf3;' +
    'padding:9px 10px 9px 34px;border-radius:8px;font-size:13px;">' +
    '</div>' +

    /* Фільтр категорій */
    '<div id="cs-cats" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;">' +
    buildCatBtns() +
    '</div>' +

    /* Контент */
    '<div id="cs-body" style="max-height:60vh;overflow-y:auto;padding-right:4px;"></div>';

  modal.appendChild(inner);
  document.body.appendChild(modal);

  /* Закрити */
  document.getElementById('cs-close').addEventListener('click', function() {
    modal.style.display = 'none';
  });
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.style.display = 'none';
  });

  /* Пошук */
  var searchTimer;
  document.getElementById('cs-search').addEventListener('input', function() {
    clearTimeout(searchTimer);
    var val = this.value;
    searchTimer = setTimeout(function() {
      document.getElementById('cs-body').innerHTML = renderCheatsheet(val);
    }, 200);
  });

  /* Фільтр категорій */
  document.getElementById('cs-cats').addEventListener('click', function(e) {
    var btn = e.target.closest('[data-cat]');
    if (!btn) return;

    document.querySelectorAll('#cs-cats [data-cat]').forEach(function(b) {
      b.style.background = 'transparent';
      b.style.color = '#8ea3b0';
    });

    var cat = btn.getAttribute('data-cat');
    btn.style.background = btn.getAttribute('data-color');
    btn.style.color = '#082018';

    var search = cat === 'all' ? '' : btn.textContent.trim();
    document.getElementById('cs-search').value = cat === 'all' ? '' : '';
    document.getElementById('cs-body').innerHTML =
      cat === 'all' ? renderCheatsheet('') : renderCheatByCat(cat);
  });

  /* Keyboard shortcut Ctrl+K */
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (modal.style.display === 'flex') {
        modal.style.display = 'none';
      } else {
        openCheatsheet();
      }
    }
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      modal.style.display = 'none';
    }
  });

  /* Кнопка в UI */
  var btn = document.createElement('button');
  btn.id = 'btn-cheatsheet';
  btn.className = 'sec';
  btn.textContent = '📖 Шпаргалка';
  btn.title = 'RouterOS команди шпаргалка (Ctrl+K)';

  /* Кнопка Шпаргалка прихована з верхньої панелі */
  // if (btnbar) btnbar.appendChild(btn);

  btn.addEventListener('click', openCheatsheet);

  /* Floating кнопка */
  var fab = document.createElement('button');
  fab.id = 'btn-cs-fab';
  fab.title = 'RouterOS Шпаргалка (Ctrl+K)';
  fab.style.cssText = [
    'position:fixed','bottom:116px','right:16px',
    'background:#16212c','border:1px solid #2a3b48',
    'color:#e6b35a','border-radius:50%',
    'width:42px','height:42px',
    'font-size:18px','cursor:pointer',
    'z-index:9990','display:flex',
    'align-items:center','justify-content:center',
    'box-shadow:0 4px 12px rgba(0,0,0,.4)',
    'transition:all .2s',
  ].join(';');
  fab.textContent = '📖';
  fab.addEventListener('mouseenter', function() { fab.style.transform = 'scale(1.1)'; });
  fab.addEventListener('mouseleave', function() { fab.style.transform = 'scale(1)'; });
  fab.addEventListener('click', openCheatsheet);
  document.body.appendChild(fab);

  function openCheatsheet() {
    document.getElementById('cs-body').innerHTML = renderCheatsheet('');
    document.getElementById('cs-search').value = '';

    /* Скидаємо активну категорію */
    document.querySelectorAll('#cs-cats [data-cat]').forEach(function(b) {
      var isAll = b.getAttribute('data-cat') === 'all';
      b.style.background = isAll ? '#5fd0a5' : 'transparent';
      b.style.color      = isAll ? '#082018'  : '#8ea3b0';
    });

    modal.style.display = 'flex';
    setTimeout(function() {
      document.getElementById('cs-search').focus();
    }, 100);
  }

  console.log('[cheatsheet] ready | commands:', countCmds());
}

function countCmds() {
  return CHEATSHEET.reduce(function(sum, s) { return sum + s.commands.length; }, 0);
}

function buildCatBtns() {
  var html = '<button data-cat="all" data-color="#5fd0a5" ' +
             'style="background:#5fd0a5;color:#082018;border:none;padding:4px 12px;' +
             'border-radius:12px;cursor:pointer;font-size:11px;font-weight:600;">Всі</button>';

  CHEATSHEET.forEach(function(s, i) {
    html += '<button data-cat="' + i + '" data-color="' + s.color + '" ' +
            'style="background:transparent;color:#8ea3b0;border:1px solid #2a3b48;' +
            'padding:4px 12px;border-radius:12px;cursor:pointer;font-size:11px;">' +
            s.category + '</button>';
  });

  return html;
}

function renderCheatByCat(catIndex) {
  var idx = parseInt(catIndex, 10);
  var section = CHEATSHEET[idx];
  if (!section) return renderCheatsheet('');

  var html = '';
  var cmds = section.commands;

  html += '<div style="margin-bottom:20px;">';
  html += '<div style="font-size:12px;font-weight:700;color:' + section.color + ';' +
          'margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid ' + section.color + '33;">' +
          section.category +
          ' <span style=\'color:#4a6070;font-weight:400;\'>(' + cmds.length + ')</span>' +
          '</div>';

  cmds.forEach(function(item) {
    var isWarn = item.cmd.indexOf('remove [find]') !== -1;
    html += '<div style="display:grid;grid-template-columns:1fr auto;' +
            'gap:8px;align-items:center;padding:7px 10px;border-radius:6px;margin-bottom:4px;' +
            'background:' + (isWarn ? 'rgba(224,102,90,.08)' : '#060d14') + ';' +
            'border:1px solid ' + (isWarn ? '#e0665a33' : '#1c2a37') + ';">';
    html += '<div>';
    html += '<code style="font-family:monospace;font-size:11.5px;color:' +
            (isWarn ? '#e0665a' : section.color) + ';word-break:break-all;">' +
            escH(item.cmd) + '</code>';
    html += '<div style="font-size:11px;color:#4a6070;margin-top:2px;">' +
            escH(item.desc) + '</div>';
    html += '</div>';
    html += '<button onclick="csRun(this)" data-cmd="' + escA(item.cmd) + '" ' +
            'style="flex-shrink:0;background:transparent;border:1px solid #2a3b48;' +
            'color:#8ea3b0;padding:4px 10px;border-radius:5px;cursor:pointer;' +
            'font-size:11px;white-space:nowrap;">\uD83D\uDCCB</button>';
    html += '</div>';
  });

  html += '</div>';
  return html;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCheatsheet);
} else {
  initCheatsheet();
}