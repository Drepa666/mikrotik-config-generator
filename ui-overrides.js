'use strict';
(function() {
  function init() {
    /* Ховаємо окремі кнопки */
    ['wizard-btn','tmpl-btn'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.style.cssText += ';display:none!important';
    });

    /* Об'єднана кнопка */
    var fab = document.createElement('button');
    fab.id = 'merged-fab';
    fab.style.cssText = [
      'position:fixed','bottom:24px','left:50%',
      'transform:translateX(-50%)',
      'background:#16212c','border:2px solid #5fd0a5',
      'color:#5fd0a5','border-radius:24px',
      'padding:8px 20px','font-size:13px','font-weight:700',
      'cursor:pointer','z-index:10000',
      'display:flex','align-items:center','gap:10px',
      'box-shadow:0 2px 12px rgba(95,208,165,.3)',
      'white-space:nowrap',
    ].join(';');
    fab.innerHTML = (
      '<span>\uD83E\uDDD9 \u041c\u0430\u0439\u0441\u0442\u0435\u0440</span>' +
      '<span style="color:#2a3b48">|</span>' +
      '<span style="color:#5b9bd5">\uD83D\uDCDA \u0428\u0430\u0431\u043b\u043e\u043d\u0438</span>' +
      '<span style="color:#2a3b48">|</span>' +
      '<span style="color:#9b87f5">\uD83D\uDDFA\uFE0F \u0422\u043e\u043f\u043e\u043b\u043e\u0433\u0456\u044f</span>'
    );

    /* Меню */
    var menu = document.createElement('div');
    menu.id = 'merged-menu';
    menu.style.cssText = [
      'display:none','position:fixed','bottom:80px',
      'left:50%','transform:translateX(-50%)',
      'background:#16212c','border:1px solid #2a3b48',
      'border-radius:12px','padding:10px','z-index:9999',
      'box-shadow:0 4px 20px rgba(0,0,0,.5)',
      'flex-direction:row','gap:8px',
    ].join(';');

    var items = [
      {
        label: '\uD83E\uDDD9 \u041c\u0430\u0439\u0441\u0442\u0435\u0440',
        color: '#5fd0a5',
        action: function() {
          var b = document.getElementById('wizard-btn');
          if (b) { b.style.display=''; b.click(); b.style.display='none'; }
        }
      },
      {
        label: '\uD83D\uDCDA \u0428\u0430\u0431\u043b\u043e\u043d\u0438',
        color: '#5b9bd5',
        action: function() {
          var b = document.getElementById('tmpl-btn');
          if (b) { b.style.display=''; b.click(); b.style.display='none'; }
        }
      },
      {
        label: '\uD83D\uDDFA\uFE0F \u0422\u043e\u043f\u043e\u043b\u043e\u0433\u0456\u044f',
        color: '#9b87f5',
        action: function() {
          var m = document.getElementById('topo-modal');
          if (m) m.style.display = 'flex';
        }
      },
    ];

    items.forEach(function(item) {
      var btn = document.createElement('button');
      btn.textContent = item.label;
      btn.style.cssText = [
        'background:transparent',
        'border:1px solid ' + item.color,
        'color:' + item.color,
        'padding:10px 20px','border-radius:8px',
        'cursor:pointer','font-size:13px','font-weight:700',
      ].join(';');
      btn.addEventListener('click', function() {
        menu.style.display = 'none';
        item.action();
      });
      menu.appendChild(btn);
    });

    fab.addEventListener('click', function(e) {
      e.stopPropagation();
      menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
    });

    document.addEventListener('click', function(e) {
      if (!menu.contains(e.target) && e.target !== fab) {
        menu.style.display = 'none';
      }
    });

    document.body.appendChild(menu);
    document.body.appendChild(fab);

    /* Nettools FAB */
    if (!document.getElementById('btn-nettools-fab')) {
      var ntFab = document.createElement('button');
      ntFab.id = 'btn-nettools-fab';
      ntFab.title = '\u041c\u0435\u0440\u0435\u0436\u0435\u0432\u0456 \u0456\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u0438';
      ntFab.style.cssText = [
        'position:fixed','bottom:358px','right:16px',
        'background:#16212c','border:2px solid #5fd0a5',
        'color:#5fd0a5','border-radius:50%',
        'width:42px','height:42px','font-size:18px',
        'cursor:pointer','z-index:10000',
        'display:flex','align-items:center','justify-content:center',
        'box-shadow:0 2px 8px rgba(95,208,165,.4)',
      ].join(';');
      ntFab.textContent = '\uD83D\uDD27';
      ntFab.addEventListener('click', function() {
        var m = document.getElementById('nettools-modal');
        if (!m) return;
        m.style.display = 'block';
        setTimeout(function() {
          var t = m.querySelector('.nt-tab[data-tab="scan"]');
          if (t) t.click();
        }, 80);
      });
      document.body.appendChild(ntFab);
    }

    console.log('[ui-overrides] ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 800); });
  } else {
    setTimeout(init, 800);
  }
})();