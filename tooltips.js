/* ============================================================
   tooltips.js — Підказки при наведенні мишки
   Patch 36 | MikroTik Config Generator
   ============================================================ */
'use strict';

/* ══════════════════════════════════════════════
   База підказок
══════════════════════════════════════════════ */
var TIPS = {

  /* ── Кнопки панелі ── */
  'btn-save':        'Зберегти всі поточні налаштування у браузері (localStorage)',
  'btn-reset':       'Скинути всі поля до стандартних значень',
  'btn-copy':        'Скопіювати згенерований .rsc скрипт у буфер обміну',
  'btn-dl':          'Завантажити скрипт як файл .rsc для імпорту в MikroTik',
  'btn-validate':    'Перевірити скрипт на помилки та небезпечні команди',
  'btn-strip':       'Видалити коментарі та порожні рядки — зменшити розмір файлу',
  'btn-ai-gen':      'Генерувати команди RouterOS за допомогою AI (потрібен API ключ)',
  'btn-parse':       'Розібрати завантажений .rsc файл без підключення до інтернету',
  'btn-fill':        'Заповнити форму значеннями з проаналізованого .rsc файлу',
  'btn-explain':     'Пояснити конфігурацію за допомогою AI',
  'btn-diff':        'Порівняти два .rsc файли та показати відмінності',
  'btn-diff-clear':  'Очистити поля для порівняння файлів',
  'btn-analyze':     'Перевірити конфігурацію на вразливості та дати рекомендації',
  'btn-rsc-topo':    'Побудувати топологію мережі з реального .rsc конфігу',
  'btn-qr-output':   'Згенерувати QR-код для швидкого підключення до Wi-Fi',
  'btn-pdf-report':  'Створити PDF звіт з Security Score та списком проблем',
  'btn-backup-sched':'Згенерувати скрипт автоматичного backup за розкладом',
  'btn-passgen':     'Генератор надійних паролів для WireGuard PSK, Wi-Fi, Admin',
  'btn-dashboard':   'Огляд всіх налаштувань та Security Score в реальному часі',
  'btn-qr-wifi':     'Згенерувати QR-код для підключення до Wi-Fi',
  'wizard-btn':      'Покроковий майстер налаштування роутера для початківців',
  'topo-btn':        'Візуальна карта мережі на основі поточних налаштувань',
  'tmpl-btn':        'Готові шаблони конфігурацій: дім, офіс, VPN-сервер тощо',
  'pwa-install-btn': 'Встановити генератор як додаток на робочий стіл',
  'pre-home':        'Шаблон домашнього роутера: DHCP WAN + LAN + Wi-Fi + захист',
  'pre-office':      'Шаблон офісного роутера: статична IP + VPN + firewall',
  'pre-lte':         'Шаблон LTE роутера: мобільний інтернет через SIM-карту',
  'sec-score-toggle':'Показати детальний список перевірок безпеки',
  'btn-key-save':    'Зберегти API ключ у пам\'яті браузера для поточної сесії',
  'btn-key-show':    'Показати або приховати введений API ключ',
  'btn-key-test':    'Перевірити чи працює введений API ключ',
  'exp-rsc':         'Завантажити конфіг у форматі RouterOS Script (.rsc)',
  'exp-txt':         'Завантажити конфіг у текстовому форматі з поясненнями',
  'exp-json':        'Зберегти профіль налаштувань у форматі JSON',
  'exp-ansible':     'Експортувати як Ansible Playbook для автоматизації',
  'exp-terraform':   'Експортувати як Terraform конфігурацію',
  'f-load':          'Завантажити раніше збережений JSON профіль налаштувань',

  /* ── Чекбокси ── */
  'backupenable':    'Генерує команду /system backup save перед основними змінами — страховка від помилок',
  'safetynet':       'Створює scheduler що через N хвилин відкатить зміни — якщо щось пішло не так та ти заблокував сам себе',
  'ddnsenable':      'MikroTik Cloud DDNS — роутер отримує постійне DNS ім\'я навіть при динамічній IP від провайдера',
  'resetconfig':     'Скидає поточний конфіг перед застосуванням. УВАГА: роутер стане недоступним! Запускай лише вручну',
  'changepass':      'Замінити стандартний пароль admin — ОБОВ\'ЯЗКОВО для безпеки!',
  'disableipv6':     'Вимкнути IPv6 якщо не використовується — зменшує поверхню атаки',
  'ipneighbor':      'Вимкнути IP Neighbor Discovery — захист від атак переповнення таблиці ARP',
  'basicfw':         'Базовий firewall defconf — блокує непотрібний трафік з WAN, дозволяє встановлені з\'єднання',
  'fasttrack':       'FastTrack з\'єднання — збільшує пропускну здатність до ~10 Гбіт/с на підтримуваних пристроях',
  'fasttrackhw':     'hw-offload — апаратне прискорення FastTrack. Тільки для роутерів з switch-chip (CRS, hEX S тощо)',
  'macprotect':      'Winbox та MAC-Telnet доступні лише з LAN — захист від атак через WAN',
  'disableservices': 'Вимкнути telnet (незашифрований), ftp, http веб-інтерфейс та api без SSL',
  'disablesvcports': 'Вимкнути pptp, l2tp та інші застарілі service-ports якщо не використовуються',
  'ntpenable':       'Синхронізація часу з pool.ntp.org — потрібна для коректних логів, сертифікатів, планувальника',
  'logwandrops':     'Записувати в лог всі заблоковані пакети з WAN — корисно для діагностики але навантажує диск',
  'netwatchenable':  'Netwatch — моніторинг доступності хоста. При втраті зв\'язку виконає скрипт або надішле лог',
  'natenable':       'NAT masquerade — клієнти LAN отримують доступ до інтернету через IP роутера',
  'dhcpenable':      'DHCP сервер — автоматична видача IP адрес клієнтам LAN',
  'dnsprotect':      'Блокує DNS запити на порт 53 з WAN — захист від використання роутера як DNS ампліфікатор',
  'allowremote':     'allow-remote-requests — роутер відповідає на DNS запити з мережі. Потрібно для клієнтів LAN',
  'dnsstaticenable': 'Статичні DNS записи — локальні імена для пристроїв мережі (router.lan, nas.lan тощо)',
  'pfwenable':       'DST-NAT Port Forwarding — перенаправлення портів з WAN до внутрішніх пристроїв',
  'wifienable':      'Налаштувати Wi-Fi радіомодулі wlan1 (2.4 ГГц) та wlan2 (5 ГГц)',
  'band24':          '2.4 ГГц — більше покриття, нижча швидкість, краще проникає через стіни',
  'band5':           '5 ГГц — менше покриття, вища швидкість, менше перешкод від сусідів',
  'capsmanenable':   'CAPsMAN — централізоване управління точками доступу MikroTik через один контролер',
  'guestenable':     'Ізольована гостьова мережа через VLAN — гості не мають доступу до основної LAN',
  'guestwifi':       'Окремий SSID для гостей — різні паролі для основної та гостьової мережі',
  'wgenable':        'WireGuard VPN — сучасний швидкий VPN протокол. Тільки RouterOS 7+',
  'ovpnenable':      'OpenVPN сервер — сумісний з більшістю клієнтів, підтримує сертифікати',
  'ovpnclenable':    'OpenVPN клієнт — підключення роутера до зовнішнього OpenVPN сервера',
  'ovpnreqcert':     'Вимагати клієнтський сертифікат — додатковий рівень безпеки крім логіну/пароля',
  'ipsecenable':     'IPsec тунелі — сумісний з багатьма пристроями включно з iOS, Android, Cisco',
  'addrlistenable':  'Firewall Address-List — групи IP адрес для зручного використання в правилах firewall',
  'routesenable':    'Статичні маршрути — вручну вказати через який шлюз йти до певних мереж',
  'foenable':        'Failover — резервний WAN канал. При падінні основного — автоматично переключиться',

  /* ── Поля введення ── */
  'hostname':        'Ім\'я роутера в мережі. Відображається в Winbox та /system identity',
  'timezone':        'Часовий пояс роутера — важливо для NTP та коректних логів',
  'adminpass':       'Новий пароль для облікового запису admin. Мінімум 8 символів, рекомендовано 16+',
  'safetymin':       'Через скільки хвилин scheduler скине зміни якщо не видалити його вручну',
  'maxneighbor':     'Ліміт записів в таблиці ARP/Neighbor. 0 = не змінювати. Рекомендовано: 8192',
  'wanif':           'Інтерфейс підключеного до провайдера (зазвичай ether1 або sfp1)',
  'wantype':         'DHCP — автоматична IP від провайдера. Static — фіксована. PPPoE — для ADSL/FTTH з логіном',
  'wanip':           'Статична IP адреса з маскою (приклад: 203.0.113.10/24)',
  'wangw':           'IP шлюзу провайдера — через нього йде трафік в інтернет',
  'pppoeuser':       'Логін для PPPoE підключення (надає провайдер)',
  'pppoepass':       'Пароль для PPPoE підключення (надає провайдер)',
  'lteapn':          'APN — назва точки доступу мобільного оператора (наприклад: internet або wap)',
  'ltepin':          'PIN-код SIM карти. Залиш порожнім якщо PIN вимкнено',
  'lteuser':         'Логін для APN (зазвичай порожній для більшості операторів)',
  'ltepass':         'Пароль для APN (зазвичай порожній для більшості операторів)',
  'lanip':           'IP адреса роутера в LAN мережі з маскою (наприклад: 192.168.88.1/24)',
  'lanports':        'Порти що входять до LAN bridge через кому (наприклад: ether2,ether3,ether4,ether5)',
  'dhcprange':       'Діапазон IP для видачі клієнтам (наприклад: 192.168.88.10-192.168.88.254)',
  'landns':          'DNS сервер для клієнтів DHCP. Зазвичай IP роутера (наприклад: 192.168.88.1)',
  'upstreamdns':     'Зовнішні DNS сервери через кому. 8.8.8.8 = Google, 1.1.1.1 = Cloudflare',
  'ssid':            'Назва Wi-Fi мережі (SSID). Буде видна в списку мереж на пристроях',
  'wifipass':        'Пароль Wi-Fi мережі. Мінімум 8 символів для WPA2',
  'wgport':          'UDP порт WireGuard сервера. За замовчуванням 51820. Відкрий на файєрволі провайдера',
  'wgserverip':      'IP адреса WireGuard інтерфейсу роутера в VPN мережі (наприклад: 10.20.30.1/24)',
  'wgpeers':         'Клієнти WireGuard — кожен з нового рядка: ім\'я:публічний_ключ:IP/32',
  'ovpnport':        'TCP порт OpenVPN сервера. За замовчуванням 1194',
  'ovpnlocal':       'IP OpenVPN сервера у VPN мережі (наприклад: 10.10.10.1)',
  'ovpnrange':       'Пул IP для клієнтів OpenVPN (наприклад: 10.10.10.2-10.10.10.254)',
  'ovpnusers':       'Користувачі OpenVPN — кожен з нового рядка: логін:пароль',
  'netwatchhost':    'IP або домен для перевірки доступності (наприклад: 8.8.8.8)',
  'netwatchinterval':'Інтервал перевірки (наприклад: 30s, 1m, 5m)',
  'customdesc':      'Опишіть що потрібно зробити — AI згенерує RouterOS команди',
  'guestvlan':       'VLAN ID для гостьової мережі (наприклад: 20). Має бути унікальним',
  'guestip':         'IP роутера в гостьовій мережі (наприклад: 192.168.20.1/24)',
  'guestssid':       'Назва Wi-Fi мережі для гостей (наприклад: Guest-WiFi)',
  'ipsecpeers':      'IPsec peers — кожен з нового рядка: ім\'я:IP:PSK:режим (ike1 або ike2)',
  'ipsecpolicies':   'IPsec policies — кожен з нового рядка: peer:локальна_мережа:віддалена_мережа',
  'addrlistentries': 'Записи Address-List — кожен з нового рядка: список=IP або список=CIDR',
  'routesentries':   'Маршрути — кожен з нового рядка: мережа=шлюз:distance:коментар',
  'pfwrules':        'Правила Port Forwarding — кожен з нового рядка: proto:зовн_порт:внутр_IP:внутр_порт:коментар',
  'dnsstaticentries':'Статичні DNS записи — кожен з нового рядка: ім\'я=IP (наприклад: router.lan=192.168.88.1)',
  'fo-health':       'IP або домен для перевірки чи працює основний WAN канал (наприклад: 8.8.8.8)',
  'model':           'Вибери модель роутера — впливає на доступні функції та генерований код',
  'firmware':        'Версія RouterOS — деякі функції доступні лише в нових версіях (WireGuard = 7+)',
  'custommodel':     'Введи назву моделі вручну якщо її немає в списку',
  'rsc-input':       'Вставте сюди вміст /export з реального роутера для аналізу або порівняння',
  'aiprovider':      'Вибери AI провайдера. Потрібен API ключ від обраного сервісу',
  'aimodel':         'Конкретна модель AI (наприклад: gpt-4o, claude-3-5-sonnet). Залиш порожнім для дефолтної',
  'apikey':          'API ключ від AI провайдера. Зберігається лише в пам\'яті браузера',
};

/* ══════════════════════════════════════════════
   Tooltip елемент
══════════════════════════════════════════════ */
var tooltipEl = null;
var tooltipTimer = null;

function createTooltipEl() {
  var el = document.createElement('div');
  el.id = 'mt-tooltip';
  el.style.cssText = [
    'position:fixed',
    'z-index:99999',
    'max-width:280px',
    'background:#1c2a37',
    'border:1px solid #5fd0a5',
    'border-radius:8px',
    'padding:8px 12px',
    'font-size:11.5px',
    'line-height:1.5',
    'color:#c9d8e4',
    'pointer-events:none',
    'opacity:0',
    'transition:opacity .15s ease',
    'box-shadow:0 4px 16px rgba(0,0,0,.5)',
    'word-break:break-word',
  ].join(';');
  document.body.appendChild(el);
  return el;
}

function showTooltip(text, x, y) {
  if (!tooltipEl) tooltipEl = createTooltipEl();
  tooltipEl.textContent = text;
  tooltipEl.style.opacity = '0';
  tooltipEl.style.display = 'block';

  /* Позиціонування */
  var tw = tooltipEl.offsetWidth || 280;
  var th = tooltipEl.offsetHeight || 60;
  var vw = window.innerWidth;
  var vh = window.innerHeight;

  var left = x + 14;
  var top  = y + 14;

  if (left + tw > vw - 10) left = x - tw - 10;
  if (top  + th > vh - 10) top  = y - th - 10;

  tooltipEl.style.left = Math.max(8, left) + 'px';
  tooltipEl.style.top  = Math.max(8, top)  + 'px';
  tooltipEl.style.opacity = '1';
}

function hideTooltip() {
  if (tooltipEl) {
    tooltipEl.style.opacity = '0';
    setTimeout(function() {
      if (tooltipEl) tooltipEl.style.display = 'none';
    }, 150);
  }
  clearTimeout(tooltipTimer);
}

/* ══════════════════════════════════════════════
   Прив'язка до елементів
══════════════════════════════════════════════ */
function bindTip(el, text) {
  if (!el || el._tipBound) return;
  el._tipBound = true;

  el.addEventListener('mouseenter', function(e) {
    clearTimeout(tooltipTimer);
    tooltipTimer = setTimeout(function() {
      showTooltip(text, e.clientX, e.clientY);
    }, 400); /* затримка 400ms */
  });

  el.addEventListener('mousemove', function(e) {
    if (tooltipEl && tooltipEl.style.opacity === '1') {
      var tw = tooltipEl.offsetWidth || 280;
      var th = tooltipEl.offsetHeight || 60;
      var vw = window.innerWidth;
      var vh = window.innerHeight;

      var left = e.clientX + 14;
      var top  = e.clientY + 14;

      if (left + tw > vw - 10) left = e.clientX - tw - 10;
      if (top  + th > vh - 10) top  = e.clientY - th - 10;

      tooltipEl.style.left = Math.max(8, left) + 'px';
      tooltipEl.style.top  = Math.max(8, top)  + 'px';
    }
  });

  el.addEventListener('mouseleave', function() {
    clearTimeout(tooltipTimer);
    hideTooltip();
  });

  el.addEventListener('click', function() {
    hideTooltip();
  });
}

/* ══════════════════════════════════════════════
   Додаємо ? іконку до label
══════════════════════════════════════════════ */
function addHintIcon(label, text) {
  if (!label || label.querySelector('.tip-icon')) return;

  var icon = document.createElement('span');
  icon.className = 'tip-icon';
  icon.textContent = ' ⓘ';
  icon.style.cssText = [
    'color:#4a6070',
    'cursor:help',
    'font-size:11px',
    'font-style:normal',
    'transition:color .15s',
    'user-select:none',
  ].join(';');

  icon.addEventListener('mouseenter', function(e) {
    icon.style.color = '#5fd0a5';
    clearTimeout(tooltipTimer);
    tooltipTimer = setTimeout(function() {
      showTooltip(text, e.clientX, e.clientY);
    }, 200);
  });

  icon.addEventListener('mousemove', function(e) {
    if (tooltipEl && tooltipEl.style.opacity === '1') {
      tooltipEl.style.left = (e.clientX + 14) + 'px';
      tooltipEl.style.top  = (e.clientY + 14) + 'px';
    }
  });

  icon.addEventListener('mouseleave', function() {
    icon.style.color = '#4a6070';
    clearTimeout(tooltipTimer);
    hideTooltip();
  });

  label.appendChild(icon);
}

/* ══════════════════════════════════════════════
   ІНІЦІАЛІЗАЦІЯ
══════════════════════════════════════════════ */
function initTooltips() {

  /* 1. Кнопки за ID */
  Object.keys(TIPS).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) {
      bindTip(el, TIPS[id]);
      /* Додаємо title як fallback */
      if (!el.title) el.title = '';
    }
  });

  /* 2. Чекбокси — шукаємо label з for="id" */
  Object.keys(TIPS).forEach(function(id) {
    var label = document.querySelector('label[for="' + id + '"]');
    if (label) {
      addHintIcon(label, TIPS[id]);
    }
  });

  /* 3. Input/textarea — шукаємо label перед полем */
  Object.keys(TIPS).forEach(function(id) {
    var field = document.getElementById(id);
    if (!field) return;

    /* Шукаємо попередній label */
    var label = null;
    var prev  = field.previousElementSibling;
    while (prev) {
      if (prev.tagName === 'LABEL') { label = prev; break; }
      prev = prev.previousElementSibling;
    }

    /* Або label що є батьком */
    if (!label && field.parentNode) {
      var parent = field.parentNode;
      var labels = parent.querySelectorAll('label');
      if (labels.length === 1) label = labels[0];
    }

    if (label) {
      addHintIcon(label, TIPS[id]);
    }

    /* Також bind на саме поле */
    bindTip(field, TIPS[id]);
  });

  /* 4. h2 секції — спеціальні підказки */
  var H2_TIPS = {
    'Загальне':              'Базові параметри роутера: ім\'я, часовий пояс, пароль admin, безпека',
    'WAN':                   'Налаштування підключення до провайдера: DHCP, Static, PPPoE або LTE',
    'Резервний WAN (Failover)': 'Другий інтернет-канал — автоматичне перемикання при падінні основного',
    'LAN':                   'Локальна мережа: порти, IP роутера, DHCP сервер для клієнтів',
    'DNS та NAT':            'DNS сервер, NAT masquerade для доступу до інтернету, захист від WAN',
    'Static DNS':            'Локальні DNS записи — зручні імена замість IP для пристроїв мережі',
    'Port Forwarding':       'DST-NAT — перенаправлення портів з WAN до внутрішніх серверів/камер',
    'Wi-Fi':                 'Налаштування бездротової мережі 2.4 ГГц та 5 ГГц',
    'CAPsMAN':               'Централізоване управління кількома точками доступу MikroTik',
    'Гостьова мережа (VLAN)':'Ізольована мережа для гостей — окремий SSID та підмережа',
    'WireGuard VPN':         'Сучасний швидкий VPN. Тільки RouterOS 7+. Менше налаштувань ніж OpenVPN',
    'OpenVPN сервер':        'Класичний VPN — сумісний з усіма платформами, підтримує сертифікати',
    'OpenVPN клієнт':        'Підключення роутера до зовнішнього OpenVPN сервера',
    'IPsec':                 'Стандарт VPN сумісний з iOS, Android, Windows, Cisco, pfSense',
    'Address-List':          'Іменовані списки IP/CIDR для зручного використання в firewall правилах',
    'Статичні маршрути':     'Вручну вказати маршрути для доступу до певних мереж через конкретний шлюз',
    'Фаєрвол та сервіси':   'Захист роутера: defconf firewall, FastTrack, вимкнення небезпечних сервісів',
    'NTP та моніторинг':     'Синхронізація часу + Netwatch для моніторингу доступності хостів',
    'Власні команди (AI або вручну)': 'Додати будь-які RouterOS команди вручну або через AI генерацію',
    'Аналіз .rsc файлу':     'Завантаж або вставте /export з реального роутера для аналізу та порівняння',
    'Diff .rsc файлів':      'Порівняти два конфіги — знайти що змінилось між версіями',
  };

  document.querySelectorAll('.card h2').forEach(function(h2) {
    var text = h2.textContent.replace(/\s+/g,' ').trim();
    /* Видаляємо badge текст */
    text = text.replace(/wlan1\/wlan2|RouterOS 7\+/g,'').trim();

    Object.keys(H2_TIPS).forEach(function(key) {
      if (text.indexOf(key) !== -1) {
        addHintIcon(h2, H2_TIPS[key]);
      }
    });
  });

  /* 5. Попередження hint → підказка при наведенні */
  document.querySelectorAll('.hint').forEach(function(hint) {
    hint.style.cursor = 'help';
    bindTip(hint, hint.textContent.replace(/^⚠️\s*/,'').trim());
  });

  /* 6. Export кнопки */
  ['exp-rsc','exp-txt','exp-json','exp-ansible','exp-terraform'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el && TIPS[id]) bindTip(el, TIPS[id]);
  });

  /* 7. MutationObserver — для динамічно доданих елементів (wizard, templates тощо) */
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      m.addedNodes.forEach(function(node) {
        if (node.nodeType !== 1) return;

        /* Перевіряємо нові кнопки */
        Object.keys(TIPS).forEach(function(id) {
          var el = node.id === id ? node : node.querySelector && node.querySelector('#' + id);
          if (el && !el._tipBound) bindTip(el, TIPS[id]);
        });
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  console.log('[tooltips] ready | tips:', Object.keys(TIPS).length);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTooltips);
} else {
  initTooltips();
}