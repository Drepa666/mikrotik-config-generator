'use strict';
(function() {

  function init() {

    /* ── Ховаємо оригінальні кнопки ── */
    ['wizard-btn', 'tmpl-btn'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.style.setProperty('display', 'none', 'important');
    });

    /* ── Видаляємо старе ── */
    ['merged-fab', 'merged-modal', 'merged-menu', 'btn-nettools-fab'].forEach(function(id) {
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
      'z-index:9999',
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

    /* ── Шапка ── */
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
      '<div style="font-size:16px;font-weight:700;color:#5fd0a5;">\uD83E\uDDD9 \u041c\u0430\u0439\u0441\u0442\u0435\u0440 \u043d\u0430\u043b\u0430\u0448\u0442\u0443\u0432\u0430\u043d\u043d\u044f</div>' +
      '<div style="font-size:11px;color:#4a6070;margin-top:2px;">\u0428\u0430\u0431\u043b\u043e\u043d\u0438 \u0448\u0432\u0438\u0434\u043a\u043e\u0433\u043e \u0441\u0442\u0430\u0440\u0442\u0443 + \u043f\u043e\u043a\u0440\u043e\u043a\u043e\u0432\u0438\u0439 \u043c\u0430\u0439\u0441\u0442\u0435\u0440</div>' +
      '</div>' +
      '<button id="master-close" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;">\u2715 \u0417\u0430\u043a\u0440\u0438\u0442\u0438</button>'
    );
    box.appendChild(header);

    /* ── Контент ── */
    var content = document.createElement('div');
    content.style.cssText = 'padding:20px;';

    /* ── Секція 1: Швидкі шаблони ── */
    var templSection = document.createElement('div');
    templSection.style.cssText = 'margin-bottom:24px;';
    templSection.innerHTML = (
      '<div style="font-size:12px;font-weight:700;color:#5fd0a5;text-transform:uppercase;' +
      'letter-spacing:.06em;margin-bottom:12px;">' +
      '\u26A1 \u0428\u0432\u0438\u0434\u043a\u0456 \u0448\u0430\u0431\u043b\u043e\u043d\u0438</div>' +

      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;">' +

      /* Дім */
      '<div class="master-preset" data-preset="home" style="background:#0d1a24;border:1px solid #2a3b48;' +
      'border-radius:10px;padding:16px;cursor:pointer;transition:border-color .2s;">' +
      '<div style="font-size:28px;margin-bottom:8px;">\uD83C\uDFE0</div>' +
      '<div style="font-size:13px;font-weight:700;color:#e6edf3;margin-bottom:4px;">\u0414\u0456\u043c</div>' +
      '<div style="font-size:11px;color:#4a6070;">\u0414\u043e\u043c\u0430\u0448\u043d\u044f \u043c\u0435\u0440\u0435\u0436\u0430, DHCP, NAT, \u0444\u0430\u0454\u0440\u0432\u043e\u043b</div>' +
      '</div>' +

      /* Офіс */
      '<div class="master-preset" data-preset="office" style="background:#0d1a24;border:1px solid #2a3b48;' +
      'border-radius:10px;padding:16px;cursor:pointer;transition:border-color .2s;">' +
      '<div style="font-size:28px;margin-bottom:8px;">\uD83C\uDFE2</div>' +
      '<div style="font-size:13px;font-weight:700;color:#e6edf3;margin-bottom:4px;">\u041e\u0444\u0456\u0441</div>' +
      '<div style="font-size:11px;color:#4a6070;">\u041c\u0435\u0440\u0435\u0436\u0430 \u043e\u0444\u0456\u0441\u0443, VPN, \u0444\u0430\u0454\u0440\u0432\u043e\u043b, \u0433\u043e\u0441\u0442\u044c\u043e\u0432\u0430</div>' +
      '</div>' +

      /* LTE */
      '<div class="master-preset" data-preset="lte" style="background:#0d1a24;border:1px solid #2a3b48;' +
      'border-radius:10px;padding:16px;cursor:pointer;transition:border-color .2s;">' +
      '<div style="font-size:28px;margin-bottom:8px;">\uD83D\uDCF6</div>' +
      '<div style="font-size:13px;font-weight:700;color:#e6edf3;margin-bottom:4px;">LTE / 4G</div>' +
      '<div style="font-size:11px;color:#4a6070;">LTE \u043f\u0456\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u043d\u044f, failover, APN</div>' +
      '</div>' +

      '</div>' +

      /* Попередження */
      '<div style="font-size:11px;color:#4a6070;background:#060d14;border:1px solid #1c2a37;' +
      'border-radius:6px;padding:8px 12px;">' +
      '\u26A0\uFE0F \u0428\u0430\u0431\u043b\u043e\u043d \u043f\u0435\u0440\u0435\u0437\u0430\u043f\u0438\u0448\u0435 \u043f\u043e\u0442\u043e\u0447\u043d\u0456 \u0434\u0430\u043d\u0456 \u0444\u043e\u0440\u043c\u0438' +
      '</div>'
    );
    content.appendChild(templSection);

    /* ── Розділювач ── */
    var divider = document.createElement('div');
    divider.style.cssText = [
      'display:flex',
      'align-items:center',
      'gap:12px',
      'margin-bottom:20px',
    ].join(';');
    divider.innerHTML = (
      '<div style="flex:1;height:1px;background:#1c2a37;"></div>' +
      '<div style="font-size:11px;color:#4a6070;white-space:nowrap;">\u0430\u0431\u043e \u0437\u0430\u043f\u0443\u0441\u0442\u0438 \u043f\u043e\u043a\u0440\u043e\u043a\u043e\u0432\u0438\u0439 \u043c\u0430\u0439\u0441\u0442\u0435\u0440</div>' +
      '<div style="flex:1;height:1px;background:#1c2a37;"></div>'
    );
    content.appendChild(divider);

    /* ── Секція 2: Майстер ── */
    var wizSection = document.createElement('div');
    wizSection.innerHTML = (
      '<div style="font-size:12px;font-weight:700;color:#5b9bd5;text-transform:uppercase;' +
      'letter-spacing:.06em;margin-bottom:12px;">' +
      '\uD83E\uDDD9 \u041f\u043e\u043a\u0440\u043e\u043a\u043e\u0432\u0438\u0439 \u043c\u0430\u0439\u0441\u0442\u0435\u0440</div>' +

      '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">' +

      /* Запустити майстер */
      '<div id="master-launch-wz" style="background:#0a1e14;border:2px solid #5fd0a5;' +
      'border-radius:10px;padding:16px;cursor:pointer;display:flex;align-items:center;gap:14px;">' +
      '<div style="font-size:36px;">\uD83E\uDDD9</div>' +
      '<div>' +
      '<div style="font-size:13px;font-weight:700;color:#5fd0a5;margin-bottom:4px;">' +
      '\u0417\u0430\u043f\u0443\u0441\u0442\u0438\u0442\u0438 \u043c\u0430\u0439\u0441\u0442\u0435\u0440</div>' +
      '<div style="font-size:11px;color:#4a6070;">' +
      '\u041f\u043e\u043a\u0440\u043e\u043a\u043e\u0432\u0435 \u043d\u0430\u043b\u0430\u0448\u0442\u0443\u0432\u0430\u043d\u043d\u044f \u0437 \u043f\u0456\u0434\u043a\u0430\u0437\u043a\u0430\u043c\u0438</div>' +
      '</div>' +
      '</div>' +

      /* Завантажити профіль */
      '<div id="master-launch-load" style="background:#0d1a24;border:1px solid #2a3b48;' +
      'border-radius:10px;padding:16px;cursor:pointer;display:flex;align-items:center;gap:14px;">' +
      '<div style="font-size:36px;">\uD83D\uDCC2</div>' +
      '<div>' +
      '<div style="font-size:13px;font-weight:700;color:#e6edf3;margin-bottom:4px;">' +
      '\u0417\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0438\u0442\u0438 \u043f\u0440\u043e\u0444\u0456\u043b\u044c</div>' +
      '<div style="font-size:11px;color:#4a6070;">' +
      '\u0412\u0456\u0434\u043d\u043e\u0432\u0438\u0442\u0438 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u0456 \u043d\u0430\u043b\u0430\u0448\u0442\u0443\u0432\u0430\u043d\u043d\u044f</div>' +
      '</div>' +
      '</div>' +

      '</div>'
    );
    content.appendChild(wizSection);

    /* ── Бібліотека шаблонів з templates.js ── */
    var tmplLibSection = document.createElement('div');
    tmplLibSection.id = 'master-tmpl-library';
    tmplLibSection.style.cssText = 'margin-top:20px;';
    content.appendChild(tmplLibSection);

    box.appendChild(content);
    modal.appendChild(box);
    document.body.appendChild(modal);

    /* ── Закрити ── */
    document.getElementById('master-close').addEventListener('click', function() {
      modal.style.display = 'none';
    });
    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.style.display = 'none';
    });

    /* ── Hover ефект на пресетах ── */
    modal.querySelectorAll('.master-preset').forEach(function(card) {
      card.addEventListener('mouseenter', function() {
        this.style.borderColor = '#5fd0a5';
      });
      card.addEventListener('mouseleave', function() {
        this.style.borderColor = '#2a3b48';
      });

      /* Клік — завантажуємо пресет ── */
      card.addEventListener('click', function() {
        var key = this.getAttribute('data-preset');
        var btn = document.getElementById('pre-' + key);
        if (btn) {
          modal.style.display = 'none';
          btn.click();
        } else {
          /* Fallback — скролимо до форми */
          modal.style.display = 'none';
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });

    /* ── Запустити майстер ── */
    document.getElementById('master-launch-wz').addEventListener('click', function() {
      var wzBtn = document.getElementById('wizard-btn');
      if (wzBtn) {
        modal.style.display = 'none';
        wzBtn.style.removeProperty('display');
        wzBtn.click();
        setTimeout(function() {
          wzBtn.style.setProperty('display', 'none', 'important');
        }, 300);
      } else {
        modal.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    /* ── Завантажити профіль ── */
    document.getElementById('master-launch-load').addEventListener('click', function() {
      var loadBtn = document.getElementById('f-load');
      if (loadBtn) {
        modal.style.display = 'none';
        loadBtn.click();
      }
    });

    /* ── Вантажимо бібліотеку шаблонів з tmpl-btn ── */
    setTimeout(function() {
  var lib = document.getElementById('master-tmpl-library');
  if (!lib) return;

  /* Шаблони з index.html — беремо напряму [7] */
  var presets = [
    { id:'pre-home',   icon:'\uD83C\uDFE0', name:'\u0414\u0456\u043c',   desc:'DHCP, NAT, \u0444\u0430\u0454\u0440\u0432\u043e\u043b' },
    { id:'pre-office', icon:'\uD83C\uDFE2', name:'\u041e\u0444\u0456\u0441',  desc:'VPN, \u0444\u0430\u0454\u0440\u0432\u043e\u043b, \u0433\u043e\u0441\u0442\u044c\u043e\u0432\u0430' },
    { id:'pre-lte',    icon:'\uD83D\uDCF6', name:'LTE / 4G', desc:'LTE, failover, APN' },
  ];

  lib.innerHTML = (
    '<div style="font-size:12px;font-weight:700;color:#9b87f5;text-transform:uppercase;' +
    'letter-spacing:.06em;margin-bottom:12px;">' +
    '\uD83D\uDCDA \u0411\u0456\u0431\u043b\u0456\u043e\u0442\u0435\u043a\u0430 \u0448\u0430\u0431\u043b\u043e\u043d\u0456\u0432</div>' +
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">' +
    presets.map(function(p) {
      return (
        '<div style="background:#060d14;border:1px solid #2a3b48;border-radius:10px;' +
        'padding:16px;cursor:pointer;" ' +
        'onclick="document.getElementById(\'' + p.id + '\').click();' +
        'document.getElementById(\'merged-modal\').style.display=\'none\';">' +
        '<div style="font-size:28px;margin-bottom:8px;">' + p.icon + '</div>' +
        '<div style="font-size:13px;font-weight:700;color:#e6edf3;margin-bottom:4px;">' + p.name + '</div>' +
        '<div style="font-size:11px;color:#4a6070;">' + p.desc + '</div>' +
        '</div>'
      );
    }).join('') +
    '</div>'
  );

      /* Клікаємо щоб tmpl модаль відкрилась */
      tmplBtn.style.removeProperty('display');
      tmplBtn.click();
      setTimeout(function() {
        tmplBtn.style.setProperty('display', 'none', 'important');

        /* Знаходимо модаль шаблонів */
        var tmplModal = document.getElementById('tmpl-modal') ||
                        document.querySelector('[id*="tmpl-modal"]') ||
                        document.querySelector('[class*="tmpl-modal"]');

        if (tmplModal) {
          /* Переміщуємо вміст */
          var inner = tmplModal.querySelector('[class*="box"]') ||
                      tmplModal.querySelector('[style*="background"]') ||
                      tmplModal.firstElementChild;
          if (inner) {
            lib.innerHTML = '<div style="font-size:12px;font-weight:700;color:#9b87f5;' +
              'text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;">' +
              '\uD83D\uDCDA \u0411\u0456\u0431\u043b\u0456\u043e\u0442\u0435\u043a\u0430 \u0448\u0430\u0431\u043b\u043e\u043d\u0456\u0432</div>';
            var clone = inner.cloneNode(true);
            lib.appendChild(clone);
          }
          tmplModal.style.display = 'none';
        }
      }, 400);
    }, 1000);

    /* ════════════════════════════════════════
       FAB КНОПКА — ТІЛЬКИ "МАЙСТЕР"
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
    ].join(';');
    fab.innerHTML = '\uD83E\uDDD9 \u041c\u0430\u0439\u0441\u0442\u0435\u0440';

    fab.addEventListener('mouseenter', function() {
      fab.style.background = '#1c2a37';
      fab.style.boxShadow  = '0 4px 20px rgba(95,208,165,.35)';
    });
    fab.addEventListener('mouseleave', function() {
      fab.style.background = '#16212c';
      fab.style.boxShadow  = '0 2px 14px rgba(95,208,165,.25)';
    });

    fab.addEventListener('click', function() {
      modal.style.display = 'flex';
    });

    document.body.appendChild(fab);

    /* ════════════════════════════════════════
       NETTOOLS FAB
    ════════════════════════════════════════ */
    var ntFab = document.createElement('button');
    ntFab.id    = 'btn-nettools-fab';
    ntFab.title = '\u041c\u0435\u0440\u0435\u0436\u0435\u0432\u0456 \u0456\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u0438';
    ntFab.style.cssText = [
      'position:fixed','bottom:358px','right:16px',
      'background:#16212c','border:2px solid #5fd0a5',
      'color:#5fd0a5','border-radius:50%',
      'width:42px','height:42px','font-size:20px',
      'cursor:pointer','z-index:10000',
      'display:flex','align-items:center','justify-content:center',
      'box-shadow:0 2px 8px rgba(95,208,165,.35)',
    ].join(';');
    ntFab.textContent = '\uD83D\uDD27';
    ntFab.addEventListener('click', function() {
      var m = document.getElementById('nettools-modal');
      if (!m) return;
      m.style.display = 'block';
      setTimeout(function() {
        var tab = m.querySelector('.nt-tab[data-tab="scan"]');
        if (tab) tab.click();
      }, 100);
    });
    document.body.appendChild(ntFab);

    console.log('[ui-overrides] ready — Майстер + Шаблони об\'єднано');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 800); });
  } else {
    setTimeout(init, 800);
  }

})();