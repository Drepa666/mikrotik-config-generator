'use strict';
(function() {

var KEY = 'mt-scan-cache';

function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch(e) {}
}
function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch(e) { return []; }
}

/* Чекаємо document.body */
function ready(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

ready(function() {

  /* Слідкуємо за кліками по кнопках сканування */
  document.addEventListener('click', function(e) {

    /* Кнопки сканування — зберігаємо результати через 3 секунди */
    var scanBtn = e.target.closest('#scan-btn, #scan-arp-btn, #scan-dhcp-btn');
    if (scanBtn) {
      var attempts = 0;
      var t = setInterval(function() {
        attempts++;
        var results = document.getElementById('scan-results');
        if (!results) { if (attempts > 20) clearInterval(t); return; }

        var rows = results.querySelectorAll('div[style*="border-bottom"]');
        if (rows.length === 0) { if (attempts > 20) clearInterval(t); return; }

        clearInterval(t);
        var cache = [];
        rows.forEach(function(row) {
          var d = row.querySelectorAll(':scope > div');
          if (d.length >= 5) {
            cache.push({
              online: (d[0].style.background || '').includes('5fd0a5'),
              ip:     d[1].textContent.trim(),
              mac:    d[2].textContent.trim(),
              name:   d[3].textContent.trim(),
            });
          }
        });

        if (cache.length > 0) {
          save(cache);
          window._scanCache = cache;
          console.log('[scan-cache] збережено:', cache.length);
        }
      }, 500);
      return;
    }

    /* Вкладка Сканування — відновлюємо кеш */
    var tab = e.target.closest('.nt-tab[data-tab="scan"]');
    if (tab) {
      setTimeout(function() {
        var cache = window._scanCache || load();
        if (!cache.length) return;

        var results = document.getElementById('scan-results');
        if (!results || results.innerHTML.trim() !== '') return;

        var names = {};
        try { names = JSON.parse(localStorage.getItem('mt-mac-names') || '{}'); } catch(e) {}

        var st = document.getElementById('scan-status');
        var ct = document.getElementById('scan-count');
        if (st) st.textContent = '\uD83D\uDDC2\uFE0F ' + cache.length + ' пристроїв (кеш)';
        if (ct) ct.textContent = cache.length + ' пристроїв';

        results.innerHTML = cache.map(function(d, i) {
          var nm = names[d.mac] || d.name || '';
          return '<div style="display:grid;grid-template-columns:30px 1fr 140px 120px 80px 120px;' +
            'align-items:center;padding:8px 12px;border-bottom:1px solid #1c2a37;' +
            (i%2===0?'background:#0a1520;':'') + '">' +
            '<div style="width:8px;height:8px;border-radius:50%;margin:auto;background:' +
            (d.online?'#5fd0a5':'#e0665a') + ';"></div>' +
            '<div style="font-size:12px;font-family:monospace;color:#e6edf3;">' + (d.ip||'—') + '</div>' +
            '<div style="font-size:11px;font-family:monospace;color:#8ea3b0;">' + (d.mac||'—') + '</div>' +
            '<div style="font-size:11px;color:' + (names[d.mac]?'#e6b35a':'#c9e8d8') + ';">' +
            (nm || '<span style="color:#4a6070;">невідомий</span>') + '</div>' +
            '<div style="font-size:10px;color:' + (d.online?'#5fd0a5':'#e0665a') + ';">' +
            (d.online?'\u2705 Online':'\u274C Offline') + '</div>' +
            '<div></div></div>';
        }).join('');

        console.log('[scan-cache] відновлено:', cache.length);
      }, 200);
    }

  });

  /* Завантажуємо кеш в пам\'ять */
  window._scanCache = load();
  console.log('[scan-cache] ready, кеш:', window._scanCache.length);

});

})();