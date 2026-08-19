'use strict';
/* ════════════════════════════════════════
   SCAN CACHE — окремий файл
   Не чіпаємо network-tools.js взагалі!
════════════════════════════════════════ */
(function() {
  /* Чекаємо поки network-tools завантажиться */
  var attempts = 0;
  /* ── Обробник FAB кнопки ── */
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('#btn-nettools-fab');
    if (!btn) return;

    var modal = document.getElementById('nettools-modal');
    if (!modal) return;

    /* Синхронізуємо дані з терміналу */
    var tmIp   = document.getElementById('tm-ip');
    var tmUser = document.getElementById('tm-user');
    var tmPass = document.getElementById('tm-pass');
    var ntIp   = document.getElementById('nt-ip');
    var ntUser = document.getElementById('nt-user');
    var ntPass = document.getElementById('nt-pass');
    if (tmIp   && tmIp.value   && ntIp)   ntIp.value   = tmIp.value;
    if (tmUser && tmUser.value && ntUser)  ntUser.value = tmUser.value;
    if (tmPass && tmPass.value && ntPass)  ntPass.value = tmPass.value;

    modal.style.display = 'block';

    /* Клікаємо напряму по кнопці вкладки */
    setTimeout(function() {
      /* Спочатку пробуємо ntSwitchTab */
      if (window.ntSwitchTab) {
        window.ntSwitchTab('scan');
      }
      /* Потім клікаємо по кнопці вкладки напряму */
      var scanTab = document.querySelector('.nt-tab[data-tab="scan"]');
      if (scanTab) {
        scanTab.click();
        console.log('[scan-cache] tab clicked!');
      } else {
        console.warn('[scan-cache] .nt-tab не знайдено!');
      }
    }, 100);
  });

  var timer = setInterval(function() {
    attempts++;
    if (attempts > 100) { clearInterval(timer); return; }

    /* Перевіряємо що модаль існує */
    var modal = document.getElementById('nettools-modal');
    if (!modal) return;

    clearInterval(timer);
    console.log('[scan-cache] підключено!');

    /* ── Перехоплюємо switchTab ── */
    var origSwitchTab = window.ntSwitchTab;
    if (!origSwitchTab) return;

    window.ntSwitchTab = function(tab) {
      origSwitchTab(tab);

      /* Після рендеру вкладки сканування — відновлюємо кеш */
      if (tab === 'scan') {
        setTimeout(function() {
          var cache = window._scanCache || [];
          if (!cache.length) return;

          var results = document.getElementById('scan-results');
          var status  = document.getElementById('scan-status');
          var count   = document.getElementById('scan-count');

          if (!results || results.innerHTML.trim() !== '') return;

          /* Рендеримо кешовані дані */
          if (status) status.textContent = '\uD83D\uDDC2\uFE0F ' + cache.length + ' пристроїв (кеш)';
          if (count)  count.textContent  = cache.length + ' пристроїв';

          var names = {};
          try { names = JSON.parse(localStorage.getItem('mt-mac-names') || '{}'); } catch(e) {}

          results.innerHTML = cache.map(function(d, idx) {
            var customName  = names[d.mac] || '';
            var displayName = customName || d.name || '';
            var online      = d.status !== 'inactive' && d.status !== false;

            return '<div style="display:grid;grid-template-columns:30px 1fr 140px 120px 80px 120px;' +
              'align-items:center;padding:8px 12px;border-bottom:1px solid #1c2a37;' +
              (idx % 2 === 0 ? 'background:#0a1520;' : '') + '">' +
              '<div style="width:8px;height:8px;border-radius:50%;background:' +
              (online ? '#5fd0a5' : '#e0665a') + ';margin:auto;"></div>' +
              '<div style="font-size:12px;font-family:monospace;color:#e6edf3;">' + (d.ip||'—') + '</div>' +
              '<div style="font-size:11px;font-family:monospace;color:#8ea3b0;">' + (d.mac||'—') + '</div>' +
              '<div style="font-size:11px;color:' + (customName ? '#e6b35a' : '#c9e8d8') + ';">' +
              (displayName || '<span style="color:#4a6070;">невідомий</span>') + '</div>' +
              '<div style="font-size:10px;color:' + (online ? '#5fd0a5' : '#e0665a') + ';">' +
              (online ? '\u2705 Online' : '\u274C Offline') + '</div>' +
              '<div style="display:flex;gap:4px;">' +
              '<button onclick="if(window.ntWoL)window.ntWoL(\'' + (d.mac||'') + '\')" ' +
              'style="background:transparent;border:1px solid #e6b35a44;color:#e6b35a;' +
              'padding:2px 6px;border-radius:3px;cursor:pointer;font-size:10px;">\uD83D\uDCE1</button>' +
              '</div></div>';
          }).join('');

        }, 100);
      }
    };

    /* ── Перехоплюємо результати сканування ── */
    var content = document.getElementById('nt-content');
    if (!content) return;

    /* MutationObserver — слідкуємо за scan-results */
    var observer = new MutationObserver(function() {
      var results = document.getElementById('scan-results');
      if (!results) return;

      /* Якщо з'явилися дані — зберігаємо в кеш */
      var rows = results.querySelectorAll('[style*="border-bottom"]');
      if (rows.length > 0 && !results._observed) {
        results._observed = true;

        /* Парсимо дані з DOM */
        var cache = [];
        rows.forEach(function(row) {
          var cells = row.querySelectorAll('div');
          if (cells.length >= 4) {
            cache.push({
              ip:     (cells[1] && cells[1].textContent.trim()) || '',
              mac:    (cells[2] && cells[2].textContent.trim()) || '',
              name:   (cells[3] && cells[3].textContent.trim()) || '',
              status: row.querySelector('[style*="#5fd0a5"]') ? 'online' : 'inactive',
            });
          }
        });

        if (cache.length > 0) {
          window._scanCache = cache;
          console.log('[scan-cache] збережено:', cache.length, 'пристроїв');
        }
      }
    });

    observer.observe(document.getElementById('nt-content'), {
      childList: true,
      subtree:   true,
    });

    /* ── Відкриваємо WoL глобально ── */
    window.ntWoL = function(mac) {
      var hdrs = {
        'Content-Type':   'application/json',
        'Authorization':  'Basic ' + btoa(
          (document.getElementById('nt-user')||{}).value + ':' +
          (document.getElementById('nt-pass')||{}).value
        ),
        'X-Router-Host':  (document.getElementById('nt-ip')||{}).value || '192.168.88.1',
        'X-Router-Port':  '80',
        'X-Router-Proto': 'http',
      };
      fetch('http://localhost:8888/rest/tool/wol', {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({ mac: mac, interface: 'bridge-lan' }),
      }).then(function() {
        alert('\uD83D\uDCE1 WoL надіслано: ' + mac);
      }).catch(function(e) {
        alert('\u274C ' + e.message);
      });
    };

  }, 100);
})();