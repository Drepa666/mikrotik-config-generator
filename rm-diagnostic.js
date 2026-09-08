'use strict';

/* ============================================================
   Router Manager Diagnostic — перевіряє всі секції і cross-links
   Запускати в DevTools Console після відкриття Router Manager
   ============================================================ */

(function() {

  var results = { ok: [], warn: [], err: [] };

  function ok(msg)   { results.ok.push(msg);   console.log('%c✅ ' + msg, 'color:#5fd0a5'); }
  function warn(msg) { results.warn.push(msg);  console.warn('⚠️ ' + msg); }
  function err(msg)  { results.err.push(msg);   console.error('❌ ' + msg); }

  console.log('%c=== Router Manager Diagnostic ===', 'color:#5fd0a5;font-size:14px;font-weight:bold;');

  /* ── 1. Перевірка модулів ── */
  console.log('%c\n[1] Модулі', 'color:#f0a840;font-weight:bold;');

  var modules = {
    'RMStore':              window.RMStore,
    'RMEventBus':           window.RMEventBus,
    'RMRestCall':           window.RMRestCall,
    'RMSshCall':            window.RMSshCall,
    'RMEsc':                window.RMEsc,
    'RouterManager':        window.RouterManager,
    '__rmGetActiveRouter':  window.__rmGetActiveRouter,
    '__rmSetMenu':          window.__rmSetMenu,
  };

  Object.keys(modules).forEach(function(name) {
    if (modules[name]) ok(name + ' — завантажено');
    else err(name + ' — ВІДСУТНІЙ!');
  });

  /* ── 2. Перевірка секцій ── */
  console.log('%c\n[2] Секції', 'color:#f0a840;font-weight:bold;');

  var sections = [
    'rmSectionInterfaces',
    'rmSectionIPAddresses',
    'rmSectionRoutes',
    'rmSectionDHCP',
    'rmSectionFirewall',
    'rmSectionQueues',
    'rmSectionPPP',
    'rmSectionWireless',
    'rmSectionSystem',
    'rmSectionIPv6',
    'rmSectionNetwatch',
    'rmSectionSNMP',
    'rmSectionLogging',
    'rmSectionCertificates',
    'rmSectionWireGuard',
  ];

  sections.forEach(function(name) {
    if (typeof window[name] === 'function') ok(name);
    else err(name + ' — функція відсутня!');
  });

  /* ── 3. Перевірка активного роутера ── */
  console.log('%c\n[3] Активний роутер', 'color:#f0a840;font-weight:bold;');

  var router = window.__rmGetActiveRouter ? window.__rmGetActiveRouter() : null;
  if (router) {
    ok('Активний роутер: ' + router.name + ' (' + router.ip + ')');
    ok('Credentials: ' + router.user + ' / ' + (router.pass ? '***' : 'ПОРОЖНІЙ!'));
    if (!router.pass) err('Пароль роутера порожній — REST API не працюватиме!');
  } else {
    err('Активний роутер не знайдено! Додай роутер в Router Manager.');
  }

  /* ── 4. Перевірка proxy ── */
  console.log('%c\n[4] Proxy сервер', 'color:#f0a840;font-weight:bold;');

  fetch('http://localhost:8888/health')
    .then(function(r) {
      if (r.ok || r.status === 404) {
        ok('Proxy localhost:8888 — доступний');
      } else {
        warn('Proxy відповідає зі статусом: ' + r.status);
      }
    })
    .catch(function() {
      err('Proxy localhost:8888 — НЕДОСТУПНИЙ! Запусти npm start');
    });

  /* ── 5. REST API тест ── */
  console.log('%c\n[5] REST API тест', 'color:#f0a840;font-weight:bold;');

  if (router && window.RMRestCall) {
    window.RMRestCall(router, 'GET', '/system/identity')
      .then(function(res) {
        if (res && res.name) {
          ok('REST API: /system/identity → ' + res.name);
        } else if (res && res.detail) {
          err('REST API помилка: ' + res.detail);
        } else {
          warn('REST API відповів: ' + JSON.stringify(res).slice(0, 80));
        }
      })
      .catch(function(e) {
        err('REST API exception: ' + e);
      });

    /* Тест ще кількох ендпоінтів */
    var endpoints = [
      '/interface',
      '/ip/address',
      '/ip/firewall/filter',
      '/ip/route',
    ];

    endpoints.forEach(function(path) {
      window.RMRestCall(router, 'GET', path)
        .then(function(res) {
          if (Array.isArray(res)) {
            ok('REST ' + path + ' → ' + res.length + ' записів');
          } else if (res && res.detail) {
            warn('REST ' + path + ' → ' + res.detail);
          } else {
            warn('REST ' + path + ' → ' + JSON.stringify(res).slice(0, 60));
          }
        })
        .catch(function(e) {
          err('REST ' + path + ' → ' + e);
        });
    });
  } else {
    warn('REST API тест пропущено — немає роутера або RMRestCall');
  }

  /* ── 6. Перевірка DataStore ── */
  console.log('%c\n[6] DataStore', 'color:#f0a840;font-weight:bold;');

  if (window.RMStore) {
    var store = window.RMStore;
    if (router) {
      store.setRouter(router);
      ok('DataStore.setRouter() — OK');

      store.get('interfaces').then(function(data) {
        if (Array.isArray(data)) ok('DataStore interfaces → ' + data.length + ' записів');
        else warn('DataStore interfaces → ' + JSON.stringify(data).slice(0, 60));
      }).catch(function(e) { err('DataStore interfaces → ' + e); });
    }
  }

  /* ── 7. Перевірка меню ── */
  console.log('%c\n[7] Меню і навігація', 'color:#f0a840;font-weight:bold;');

  if (window.__rmSetMenu) {
    ok('__rmSetMenu — доступний');
  } else {
    err('__rmSetMenu — ВІДСУТНІЙ! Cross-links не працюватимуть');
  }

  var rmPanel = document.getElementById('rm-panel') || document.getElementById('rm-overlay');
  if (rmPanel) {
    ok('Router Manager панель знайдена в DOM');
    var menuItems = rmPanel.querySelectorAll('[data-id]');
    ok('Пунктів меню: ' + menuItems.length);
  } else {
    warn('Router Manager панель не знайдена — відкрий його спочатку');
  }

  /* ── 8. Підсумок ── */
  setTimeout(function() {
    console.log('%c\n=== ПІДСУМОК ===', 'color:#5fd0a5;font-size:14px;font-weight:bold;');
    console.log('%c✅ OK: ' + results.ok.length, 'color:#5fd0a5;font-weight:bold;');
    console.log('%c⚠️ WARN: ' + results.warn.length, 'color:#f0a840;font-weight:bold;');
    console.log('%c❌ ERR: ' + results.err.length, 'color:#e05252;font-weight:bold;');

    if (results.err.length === 0) {
      console.log('%c\n🎉 Всі перевірки пройдено!', 'color:#5fd0a5;font-size:16px;font-weight:bold;');
    } else {
      console.log('%c\nПомилки:\n' + results.err.join('\n'), 'color:#e05252;');
    }

    /* Зберігаємо результат для аналізу */
    window.__rmDiagResult = results;
    console.log('\nДетальний результат: window.__rmDiagResult');
  }, 3000);

  console.log('\n⏳ Очікуємо відповіді від API (3 сек)...');

})();