'use strict';
(function () {

  /* ════════════════════════════════════════
     ГЛОБАЛЬНІ HELPER-ФУНКЦІЇ
  ════════════════════════════════════════ */
  window._tplSetVal = function (id, val) {
    var e = document.getElementById(id);
    if (!e || val === undefined) return;
    e.value = val;
    e.dispatchEvent(new Event('input'));
    e.dispatchEvent(new Event('change'));
  };

  window._tplSetChk = function (id, val) {
    var e = document.getElementById(id);
    if (!e) return;
    e.checked = !!val;
    e.dispatchEvent(new Event('change'));
  };

  /* ════════════════════════════════════════
     10 ШАБЛОНІВ
  ════════════════════════════════════════ */
  window._TEMPLATES = [
    {
      icon: '🏠', name: 'Дім базовий', color: '#5fd0a5',
      desc: 'Для домашнього роутера. DHCP, NAT, базовий фаєрвол. Мінімум налаштувань — максимум надійності.',
      apply: function () {
        _tplSetVal('hostname', 'Home-Router');
        _tplSetChk('backupenable', true);
        _tplSetChk('basicfw', true);
        _tplSetChk('natenable', true);
        _tplSetChk('ntpenable', true);
        _tplSetChk('wifienable', true);
        _tplSetVal('ssid', 'HomeNetwork');
        _tplSetChk('band24', true);
        _tplSetChk('band5', true);
        _tplSetVal('upstreamdns', '8.8.8.8,1.1.1.1');
        _tplSetChk('dnsprotect', true);
        _tplSetChk('macprotect', true);
        _tplSetChk('disableipv6', true);
        _tplSetChk('safetynet', false);
        _tplSetChk('guestenable', false);
        _tplSetChk('foenable', false);
        _tplSetChk('wgenable', false);
      }
    },
    {
      icon: '🏢', name: 'Офіс стандарт', color: '#5b9bd5',
      desc: 'Офісна мережа 10-50 ПК. Гостьовий Wi-Fi, логування, захист, NTP.',
      apply: function () {
        _tplSetVal('hostname', 'Office-Router');
        _tplSetChk('backupenable', true);
        _tplSetChk('safetynet', true);
        _tplSetVal('safetyminutes', '10');
        _tplSetChk('basicfw', true);
        _tplSetChk('natenable', true);
        _tplSetChk('ntpenable', true);
        _tplSetChk('logwandrops', true);
        _tplSetChk('macprotect', true);
        _tplSetChk('disableservices', true);
        _tplSetChk('disableserviceports', true);
        _tplSetChk('guestenable', true);
        _tplSetVal('guestvlan', '20');
        _tplSetVal('guestip', '192.168.20.1/24');
        _tplSetVal('guestrange', '192.168.20.10-192.168.20.200');
        _tplSetChk('guestwifienable', true);
        _tplSetVal('guestssid', 'Office-Guest');
        _tplSetChk('wifienable', true);
        _tplSetVal('ssid', 'Office-WiFi');
        _tplSetVal('upstreamdns', '8.8.8.8,8.8.4.4');
        _tplSetChk('dnsprotect', true);
        _tplSetChk('ipneighbordiscovery', true);
        _tplSetVal('maxneighbor', '8192');
        _tplSetChk('disableipv6', true);
      }
    },
    {
      icon: '📶', name: 'LTE / 4G роутер', color: '#9b87f5',
      desc: 'Підключення через LTE модем або SIM-карту. Автоматичний failover при падінні каналу.',
      apply: function () {
        _tplSetVal('hostname', 'LTE-Router');
        _tplSetChk('backupenable', true);
        _tplSetChk('basicfw', true);
        _tplSetChk('natenable', true);
        _tplSetChk('ntpenable', true);
        _tplSetChk('macprotect', true);
        _tplSetChk('disableservices', true);
        _tplSetVal('upstreamdns', '8.8.8.8,1.1.1.1');
        _tplSetChk('netwatchenable', true);
        _tplSetVal('netwatchhost', '8.8.8.8');
        _tplSetVal('netwatchinterval', '30s');
        _tplSetChk('ddnsenable', true);
        _tplSetChk('disableipv6', true);
        _tplSetChk('dnsprotect', true);
      }
    },
    {
      icon: '🔒', name: 'Максимальна безпека', color: '#e0665a',
      desc: 'Сервер або критична інфраструктура. Всі захисти увімкнені, логування, відкат.',
      apply: function () {
        _tplSetVal('hostname', 'Secure-Router');
        _tplSetChk('backupenable', true);
        _tplSetChk('safetynet', true);
        _tplSetVal('safetyminutes', '5');
        _tplSetChk('basicfw', true);
        _tplSetChk('natenable', true);
        _tplSetChk('ntpenable', true);
        _tplSetChk('logwandrops', true);
        _tplSetChk('macprotect', true);
        _tplSetChk('disableservices', true);
        _tplSetChk('disableserviceports', true);
        _tplSetChk('dnsprotect', true);
        _tplSetChk('disableipv6', true);
        _tplSetChk('ipneighbordiscovery', true);
        _tplSetVal('upstreamdns', '1.1.1.1,9.9.9.9');
        _tplSetChk('changepass', true);
      }
    },
    {
      icon: '🌐', name: 'VPN WireGuard сервер', color: '#e6b35a',
      desc: 'RouterOS 7+. WireGuard VPN для безпечного доступу до мережі ззовні.',
      apply: function () {
        _tplSetVal('hostname', 'VPN-Router');
        _tplSetChk('backupenable', true);
        _tplSetChk('basicfw', true);
        _tplSetChk('natenable', true);
        _tplSetChk('ntpenable', true);
        _tplSetChk('macprotect', true);
        _tplSetChk('disableservices', true);
        _tplSetChk('dnsprotect', true);
        _tplSetChk('wgenable', true);
        _tplSetVal('wgport', '51820');
        _tplSetVal('wgserverip', '10.20.30.1/24');
        _tplSetVal('upstreamdns', '1.1.1.1,8.8.8.8');
        _tplSetChk('disableipv6', true);
        _tplSetChk('logwandrops', true);
      }
    },
    {
      icon: '📡', name: 'CAPsMAN контролер', color: '#5fd0a5',
      desc: 'Централізоване управління кількома точками доступу MikroTik в офісі.',
      apply: function () {
        _tplSetVal('hostname', 'CAPsMAN-Controller');
        _tplSetChk('backupenable', true);
        _tplSetChk('basicfw', true);
        _tplSetChk('natenable', true);
        _tplSetChk('ntpenable', true);
        _tplSetChk('capsmanenable', true);
        _tplSetVal('capsmanssid', 'Corporate-WiFi');
        _tplSetVal('capsman24ch', '2417/20/gn');
        _tplSetVal('capsman5ch', '5180/80/ac');
        _tplSetChk('guestenable', true);
        _tplSetVal('guestvlan', '30');
        _tplSetVal('guestip', '192.168.30.1/24');
        _tplSetChk('macprotect', true);
        _tplSetChk('disableservices', true);
        _tplSetVal('upstreamdns', '8.8.8.8,8.8.4.4');
      }
    },
    {
      icon: '🔁', name: 'Failover подвійний WAN', color: '#5b9bd5',
      desc: 'Два провайдери — основний і резервний. Автоматичне перемикання при падінні.',
      apply: function () {
        _tplSetVal('hostname', 'Failover-Router');
        _tplSetChk('backupenable', true);
        _tplSetChk('safetynet', true);
        _tplSetVal('safetyminutes', '10');
        _tplSetChk('basicfw', true);
        _tplSetChk('natenable', true);
        _tplSetChk('ntpenable', true);
        _tplSetChk('macprotect', true);
        _tplSetChk('disableservices', true);
        _tplSetChk('foenable', true);
        _tplSetVal('foif', 'lte1');
        _tplSetVal('fohealthhost', '8.8.4.4');
        _tplSetChk('netwatchenable', true);
        _tplSetVal('netwatchhost', '8.8.8.8');
        _tplSetVal('netwatchinterval', '10s');
        _tplSetVal('upstreamdns', '8.8.8.8,1.1.1.1');
        _tplSetChk('logwandrops', true);
      }
    },
    {
      icon: '🏪', name: 'Магазин / кафе', color: '#9b87f5',
      desc: 'Публічна точка доступу. Гостьова мережа ізольована від основної, вільний Wi-Fi.',
      apply: function () {
        _tplSetVal('hostname', 'Shop-Router');
        _tplSetChk('backupenable', true);
        _tplSetChk('basicfw', true);
        _tplSetChk('natenable', true);
        _tplSetChk('ntpenable', true);
        _tplSetChk('macprotect', true);
        _tplSetChk('disableservices', true);
        _tplSetChk('disableserviceports', true);
        _tplSetChk('wifienable', true);
        _tplSetVal('ssid', 'Staff-WiFi');
        _tplSetChk('guestenable', true);
        _tplSetVal('guestvlan', '50');
        _tplSetVal('guestip', '192.168.50.1/24');
        _tplSetVal('guestrange', '192.168.50.10-192.168.50.250');
        _tplSetChk('guestwifienable', true);
        _tplSetVal('guestssid', 'Free-WiFi');
        _tplSetChk('dnsprotect', true);
        _tplSetChk('ipneighbordiscovery', true);
        _tplSetVal('upstreamdns', '1.1.1.1,8.8.8.8');
        _tplSetChk('logwandrops', true);
      }
    },
    {
      icon: '🖥️', name: 'Сервер / Data Center', color: '#e0665a',
      desc: 'Роутер перед сервером. Port forwarding, максимальний захист, мінімум сервісів.',
      apply: function () {
        _tplSetVal('hostname', 'DC-Router');
        _tplSetChk('backupenable', true);
        _tplSetChk('safetynet', true);
        _tplSetVal('safetyminutes', '5');
        _tplSetChk('basicfw', true);
        _tplSetChk('fasttrack', true);
        _tplSetChk('natenable', true);
        _tplSetChk('ntpenable', true);
        _tplSetChk('logwandrops', true);
        _tplSetChk('macprotect', true);
        _tplSetChk('disableservices', true);
        _tplSetChk('disableserviceports', true);
        _tplSetChk('dnsprotect', true);
        _tplSetChk('disableipv6', true);
        _tplSetChk('ipneighbordiscovery', true);
        _tplSetChk('pfwenable', true);
        _tplSetVal('pfwrules',
          'tcp:80:192.168.88.10:80:WebServer\n' +
          'tcp:443:192.168.88.10:443:HTTPS\n' +
          'tcp:22:192.168.88.10:22:SSH'
        );
        _tplSetVal('upstreamdns', '1.1.1.1,9.9.9.9');
      }
    },
    {
      icon: '🚗', name: 'Мобільний / авто', color: '#e6b35a',
      desc: 'LTE роутер в авто або мобільному офісі. Нестабільне зʼєднання, DDNS.',
      apply: function () {
        _tplSetVal('hostname', 'Mobile-Router');
        _tplSetChk('backupenable', true);
        _tplSetChk('basicfw', true);
        _tplSetChk('natenable', true);
        _tplSetChk('ntpenable', true);
        _tplSetChk('macprotect', true);
        _tplSetChk('disableservices', true);
        _tplSetChk('wifienable', true);
        _tplSetVal('ssid', 'Mobile-Net');
        _tplSetChk('band24', true);
        _tplSetChk('band5', false);
        _tplSetChk('ddnsenable', true);
        _tplSetChk('netwatchenable', true);
        _tplSetVal('netwatchhost', '8.8.8.8');
        _tplSetVal('netwatchinterval', '15s');
        _tplSetVal('upstreamdns', '1.1.1.1,8.8.8.8');
        _tplSetChk('disableipv6', true);
      }
    }
  ];

  /* ════════════════════════════════════════
     ЗАСТОСУВАННЯ ШАБЛОНУ
  ════════════════════════════════════════ */
  window.applyMasterTemplate = function (idx) {
    var tpl = window._TEMPLATES[idx];
    if (!tpl) return;
    if (!confirm('Застосувати шаблон "' + tpl.name + '"?\nПоточні дані форми будуть змінені.')) return;

    tpl.apply();

    var modal = document.getElementById('merged-modal');
    if (modal) modal.style.display = 'none';

    var n = document.createElement('div');
    n.style.cssText = [
      'position:fixed', 'top:20px', 'right:20px',
      'background:#0d1a24', 'border:1px solid #5fd0a5',
      'color:#5fd0a5', 'padding:12px 20px',
      'border-radius:8px', 'font-size:13px', 'font-weight:600',
      'z-index:99999', 'box-shadow:0 4px 12px rgba(0,0,0,.5)',
      'transition:opacity .3s',
    ].join(';');
    n.textContent = '\u2705 \u0428\u0430\u0431\u043b\u043e\u043d "' + tpl.name + '" \u0437\u0430\u0441\u0442\u043e\u0441\u043e\u0432\u0430\u043d\u043e!';
    document.body.appendChild(n);
    setTimeout(function () {
      n.style.opacity = '0';
      setTimeout(function () { n.remove(); }, 300);
    }, 2500);
  };

  /* ════════════════════════════════════════
     ГОЛОВНА ФУНКЦІЯ ІНІЦІАЛІЗАЦІЇ
  ════════════════════════════════════════ */
  function init() {

    /* Ховаємо оригінальні окремі кнопки */
    ['wizard-btn', 'tmpl-btn'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.setProperty('display', 'none', 'important');
    });

    /* Видаляємо старі елементи якщо є */
    ['merged-fab', 'merged-modal', 'merged-menu', 'btn-nettools-fab'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.remove();
    });

    /* ════════════════════════════════════════
       МОДАЛЬНЕ ВІКНО МАЙСТРА
    ════════════════════════════════════════ */
    var modal = document.createElement('div');
    modal.id = 'merged-modal';
    modal.style.cssText = [
      'display:none',
      'position:fixed',
      'inset:0',
      'background:rgba(0,0,0,.88)',
      'z-index:9998',
      'align-items:flex-start',
      'justify-content:center',
      'padding:24px 16px',
      'overflow-y:auto',
    ].join(';');

    var box = document.createElement('div');
    box.style.cssText = [
      'background:#16212c',
      'border:1px solid #2a3b48',
      'border-radius:14px',
      'width:100%',
      'max-width:960px',
      'margin:auto',
      'overflow:hidden',
    ].join(';');

    /* Шапка */
    var header = document.createElement('div');
    header.style.cssText = [
      'display:flex',
      'align-items:center',
      'justify-content:space-between',
      'padding:16px 20px',
      'border-bottom:1px solid #2a3b48',
      'background:#0d1a24',
    ].join(';');
    header.innerHTML = (
      '<div>' +
      '<div style="font-size:16px;font-weight:700;color:#5fd0a5;">' +
      '\uD83E\uDDD9 \u041c\u0430\u0439\u0441\u0442\u0435\u0440 \u043d\u0430\u043b\u0430\u0448\u0442\u0443\u0432\u0430\u043d\u043d\u044f</div>' +
      '<div style="font-size:11px;color:#4a6070;margin-top:2px;">' +
      '\u0428\u0430\u0431\u043b\u043e\u043d\u0438 \u0448\u0432\u0438\u0434\u043a\u043e\u0433\u043e \u0441\u0442\u0430\u0440\u0442\u0443 + \u043f\u043e\u043a\u0440\u043e\u043a\u043e\u0432\u0438\u0439 \u043c\u0430\u0439\u0441\u0442\u0435\u0440</div>' +
      '</div>' +
      '<button id="master-close-btn" style="background:transparent;border:1px solid #2a3b48;' +
      'color:#8ea3b0;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;">' +
      '\u2715 \u0417\u0430\u043a\u0440\u0438\u0442\u0438</button>'
    );
    box.appendChild(header);

    /* Контент */
    var content = document.createElement('div');
    content.style.cssText = 'padding:20px;';

    /* ── Секція 1: Швидкі шаблони ── */
    var quickSection = document.createElement('div');
    quickSection.style.cssText = 'margin-bottom:20px;';
    quickSection.innerHTML = (
      '<div style="font-size:12px;font-weight:700;color:#5fd0a5;text-transform:uppercase;' +
      'letter-spacing:.06em;margin-bottom:12px;">' +
      '\u26A1 \u0428\u0432\u0438\u0434\u043a\u0456 \u0448\u0430\u0431\u043b\u043e\u043d\u0438</div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px;">' +

      /* Дім */
      '<div ' +
      'style="background:#0d1a24;border:1px solid #2a3b48;border-radius:10px;padding:16px;cursor:pointer;" ' +
      'onmouseenter="this.style.borderColor=\'#5fd0a5\'" ' +
      'onmouseleave="this.style.borderColor=\'#2a3b48\'">' +
      '<div style="font-size:28px;margin-bottom:8px;">\uD83C\uDFE0</div>' +
      '<div style="font-size:13px;font-weight:700;color:#e6edf3;margin-bottom:4px;">\u0414\u0456\u043c</div>' +
      '<div style="font-size:11px;color:#4a6070;">\u0414\u043e\u043c\u0430\u0448\u043d\u044f \u043c\u0435\u0440\u0435\u0436\u0430, DHCP, NAT, \u0444\u0430\u0454\u0440\u0432\u043e\u043b</div>' +
      '</div>' +

      /* Офіс */
      '<div ' +
      'style="background:#0d1a24;border:1px solid #2a3b48;border-radius:10px;padding:16px;cursor:pointer;" ' +
      'onmouseenter="this.style.borderColor=\'#5b9bd5\'" ' +
      'onmouseleave="this.style.borderColor=\'#2a3b48\'">' +
      '<div style="font-size:28px;margin-bottom:8px;">\uD83C\uDFE2</div>' +
      '<div style="font-size:13px;font-weight:700;color:#e6edf3;margin-bottom:4px;">\u041e\u0444\u0456\u0441</div>' +
      '<div style="font-size:11px;color:#4a6070;">\u041c\u0435\u0440\u0435\u0436\u0430 \u043e\u0444\u0456\u0441\u0443, VPN, \u0444\u0430\u0454\u0440\u0432\u043e\u043b, \u0433\u043e\u0441\u0442\u044c\u043e\u0432\u0430</div>' +
      '</div>' +

      /* LTE */
      '<div ' +
      'style="background:#0d1a24;border:1px solid #2a3b48;border-radius:10px;padding:16px;cursor:pointer;" ' +
      'onmouseenter="this.style.borderColor=\'#9b87f5\'" ' +
      'onmouseleave="this.style.borderColor=\'#2a3b48\'">' +
      '<div style="font-size:28px;margin-bottom:8px;">\uD83D\uDCF6</div>' +
      '<div style="font-size:13px;font-weight:700;color:#e6edf3;margin-bottom:4px;">LTE / 4G</div>' +
      '<div style="font-size:11px;color:#4a6070;">LTE \u043f\u0456\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u043d\u044f, failover, APN</div>' +
      '</div>' +
      '</div>' +

      '<div style="font-size:11px;color:#4a6070;background:#060d14;border:1px solid #1c2a37;' +
      'border-radius:6px;padding:8px 12px;">' +
      '\u26A0\uFE0F \u0428\u0430\u0431\u043b\u043e\u043d \u043f\u0435\u0440\u0435\u0437\u0430\u043f\u0438\u0448\u0435 \u043f\u043e\u0442\u043e\u0447\u043d\u0456 \u0434\u0430\u043d\u0456 \u0444\u043e\u0440\u043c\u0438' +
      '</div>'
    );
    content.appendChild(quickSection);

    /* Розділювач */
    var divider = document.createElement('div');
    divider.style.cssText = 'display:flex;align-items:center;gap:12px;margin-bottom:20px;';
    divider.innerHTML = (
      '<div style="flex:1;height:1px;background:#1c2a37;"></div>' +
      '<div style="font-size:11px;color:#4a6070;white-space:nowrap;">' +
      '\u0430\u0431\u043e \u0437\u0430\u043f\u0443\u0441\u0442\u0438 \u043f\u043e\u043a\u0440\u043e\u043a\u043e\u0432\u0438\u0439 \u043c\u0430\u0439\u0441\u0442\u0435\u0440</div>' +
      '<div style="flex:1;height:1px;background:#1c2a37;"></div>'
    );
    content.appendChild(divider);

    /* ── Секція 2: Покроковий майстер ── */
    var wizSection = document.createElement('div');
    wizSection.style.cssText = 'margin-bottom:20px;';
    wizSection.innerHTML = (
      '<div style="font-size:12px;font-weight:700;color:#5b9bd5;text-transform:uppercase;' +
      'letter-spacing:.06em;margin-bottom:12px;">' +
      '\uD83E\uDDD9 \u041f\u043e\u043a\u0440\u043e\u043a\u043e\u0432\u0438\u0439 \u043c\u0430\u0439\u0441\u0442\u0435\u0440</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +

      '<div id="master-wz-btn" style="background:#0a1e14;border:2px solid #5fd0a5;border-radius:10px;' +
      'padding:16px;cursor:pointer;display:flex;align-items:center;gap:14px;">' +
      '<div style="font-size:36px;">\uD83E\uDDD9</div>' +
      '<div>' +
      '<div style="font-size:13px;font-weight:700;color:#5fd0a5;margin-bottom:4px;">' +
      '\u0417\u0430\u043f\u0443\u0441\u0442\u0438\u0442\u0438 \u043c\u0430\u0439\u0441\u0442\u0435\u0440</div>' +
      '<div style="font-size:11px;color:#4a6070;">' +
      '\u041f\u043e\u043a\u0440\u043e\u043a\u043e\u0432\u0435 \u043d\u0430\u043b\u0430\u0448\u0442\u0443\u0432\u0430\u043d\u043d\u044f \u0437 \u043f\u0456\u0434\u043a\u0430\u0437\u043a\u0430\u043c\u0438</div>' +
      '</div></div>' +

      '<div id="master-load-btn" style="background:#0d1a24;border:1px solid #2a3b48;border-radius:10px;' +
      'padding:16px;cursor:pointer;display:flex;align-items:center;gap:14px;">' +
      '<div style="font-size:36px;">\uD83D\uDCC2</div>' +
      '<div>' +
      '<div style="font-size:13px;font-weight:700;color:#e6edf3;margin-bottom:4px;">' +
      '\u0417\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0438\u0442\u0438 \u043f\u0440\u043e\u0444\u0456\u043b\u044c</div>' +
      '<div style="font-size:11px;color:#4a6070;">' +
      '\u0412\u0456\u0434\u043d\u043e\u0432\u0438\u0442\u0438 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u0456 \u043d\u0430\u043b\u0430\u0448\u0442\u0443\u0432\u0430\u043d\u043d\u044f</div>' +
      '</div></div>' +
      '</div>'
    );
    content.appendChild(wizSection);

    /* ── Секція 3: Бібліотека 10 шаблонів ── */
    var libSection = document.createElement('div');
    libSection.innerHTML = (
      '<div style="font-size:12px;font-weight:700;color:#9b87f5;text-transform:uppercase;' +
      'letter-spacing:.06em;margin-bottom:14px;">' +
      '\uD83D\uDCDA \u0411\u0456\u0431\u043b\u0456\u043e\u0442\u0435\u043a\u0430 \u2014 10 \u0448\u0430\u0431\u043b\u043e\u043d\u0456\u0432</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:10px;">' +
      window._TEMPLATES.map(function (t, i) {
        return (
          '<div ' +
          'style="background:#060d14;border:1px solid #2a3b48;border-left:3px solid ' + t.color + ';' +
          'border-radius:10px;padding:14px;cursor:pointer;transition:all .2s;" ' +
          'onmouseenter="this.style.background=\'#0d1a24\';this.style.transform=\'translateY(-2px)\'" ' +
          'onmouseleave="this.style.background=\'#060d14\';this.style.transform=\'none\'">' +
          '<div style="font-size:24px;margin-bottom:8px;">' + t.icon + '</div>' +
          '<div style="font-size:12px;font-weight:700;color:#e6edf3;margin-bottom:5px;">' + t.name + '</div>' +
          '<div style="font-size:11px;color:#4a6070;line-height:1.5;margin-bottom:10px;">' + t.desc + '</div>' +
          '<span style="font-size:10px;background:' + t.color + '22;color:' + t.color + ';' +
          'padding:3px 8px;border-radius:4px;">\u0417\u0430\u0441\u0442\u043e\u0441\u0443\u0432\u0430\u0442\u0438 \u2192</span>' +
          '</div>'
        );
      }).join('') +
      '</div>'
    );
    content.appendChild(libSection);

    box.appendChild(content);
    modal.appendChild(box);
    document.body.appendChild(modal);

    /* Закрити вікно — event delegation */
    modal.addEventListener('click', function (e) {
      var t = e.target;
      /* Клік на кнопку Закрити або її дочірній елемент */
      if (t.id === 'master-close-btn' ||
          t.closest('#master-close-btn')) {
        modal.style.display = 'none';
        return;
      }
      /* Клік на фон (сам modal) */
      if (t === modal) {
        modal.style.display = 'none';
      }
    });

    /* Запустити майстер */
    document.getElementById('master-wz-btn').addEventListener('click', function () {
      var wzBtn = document.getElementById('wizard-btn');
      if (wzBtn) {
        modal.style.display = 'none';
        wzBtn.style.removeProperty('display');
        wzBtn.click();
        setTimeout(function () {
          wzBtn.style.setProperty('display', 'none', 'important');
        }, 300);
      }
    });

    /* Завантажити профіль */
    document.getElementById('master-load-btn').addEventListener('click', function () {
      modal.style.display = 'none';
      var loadBtn = document.getElementById('f-load') ||
                    document.querySelector('label[for="profile-file"]');
      if (loadBtn) loadBtn.click();
    });

    /* ════════════════════════════════════════
       FAB КНОПКА — МАЙСТЕР (знизу по центру)
    ════════════════════════════════════════ */
    var fab = document.createElement('button');
    fab.id = 'merged-fab';
    fab.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:#16212c',
      'border:2px solid #5fd0a5',
      'color:#5fd0a5',
      'border-radius:24px',
      'padding:10px 32px',
      'font-size:14px',
      'font-weight:700',
      'cursor:pointer',
      'z-index:100',
      'display:flex',
      'align-items:center',
      'gap:10px',
      'box-shadow:0 2px 14px rgba(95,208,165,.25)',
      'white-space:nowrap',
      'letter-spacing:.02em',
      'transition:all .2s',
    ].join(';');
    fab.innerHTML = '\uD83E\uDDD9 \u041c\u0430\u0439\u0441\u0442\u0435\u0440';

    fab.addEventListener('mouseenter', function () {
      fab.style.background = '#1c2a37';
      fab.style.boxShadow = '0 4px 20px rgba(95,208,165,.4)';
    });
    fab.addEventListener('mouseleave', function () {
      fab.style.background = '#16212c';
      fab.style.boxShadow = '0 2px 14px rgba(95,208,165,.25)';
    });
    fab.addEventListener('click', function () {
      modal.style.display = 'flex';
    });

    document.body.appendChild(fab);

    /* ════════════════════════════════════════
       NETTOOLS FAB (кругла кнопка справа)
    ════════════════════════════════════════ */
    var ntFab = document.createElement('button');
    ntFab.id = 'btn-nettools-fab';
    ntFab.title = '\u041c\u0435\u0440\u0435\u0436\u0435\u0432\u0456 \u0456\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u0438';
    ntFab.style.cssText = [
      'position:fixed',
      'bottom:358px',
      'right:16px',
      'background:#16212c',
      'border:2px solid #5fd0a5',
      'color:#5fd0a5',
      'border-radius:50%',
      'width:42px',
      'height:42px',
      'font-size:20px',
      'cursor:pointer',
      'z-index:100',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'box-shadow:0 2px 8px rgba(95,208,165,.35)',
      'transition:all .2s',
    ].join(';');
    ntFab.textContent = '\uD83D\uDD27';

    ntFab.addEventListener('mouseenter', function () {
      ntFab.style.background = '#1c2a37';
    });
    ntFab.addEventListener('mouseleave', function () {
      ntFab.style.background = '#16212c';
    });
    ntFab.addEventListener('click', function () {
      var m = document.getElementById('nettools-modal');
      if (!m) { console.warn('nettools-modal не знайдено'); return; }
      m.style.display = 'block';
      setTimeout(function () {
        var tab = m.querySelector('.nt-tab[data-tab="scan"]');
        if (tab) tab.click();
        else if (window.ntSwitchTab) window.ntSwitchTab('scan');
      }, 100);
    });

    document.body.appendChild(ntFab);

    console.log('[ui-overrides] ready — Майстер + 10 шаблонів + Nettools FAB');
  }

  /* ════════════════════════════════════════
     ЗАПУСК
  ════════════════════════════════════════ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(init, 800);
    });
  } else {
    setTimeout(init, 800);
  }

})();

/* ══ Close button ══ */
(function() {
  var _obs = new MutationObserver(function() {
    var btn = document.getElementById('master-close-btn');
    if (!btn || btn._ok) return;
    btn._ok = true;
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var all = document.querySelectorAll(
        '#merged-modal,#topo-modal,#nettools-modal,#audit-modal,' +
        '#plugins-modal,#analyzer-modal,#deploy-modal,' +
        '#terminal-modal,#mass-modal,#backup-sched-modal,' +
        '#passgen-modal,#ver-modal,#qr-wifi-modal,' +
        '#changelog-modal,#dashboard-modal,#cs-modal,' +
        '#diffapply-modal,#stats-modal'
      );
      all.forEach(function(m) { m.style.display = 'none'; });
    });
  });
  _obs.observe(document.body, { childList: true, subtree: true });
})();
