'use strict';

/* ══════════════════════════════════════════
   Terminal Log — показує всі команди і відповіді
   Не чіпає існуючий код — тільки перехоплює
   ══════════════════════════════════════════ */

window.TermLog = {
  _entries: [],
  _visible: false,
  _el: null,
  _bodyEl: null,
  _maxEntries: 200,

  /* ── Ініціалізація ── */
  init: function() {
    if (document.getElementById('termlog-panel')) return;

    /* Кнопка-тоглер */
    var btn = document.createElement('div');
    btn.id = 'termlog-btn';
    btn.innerHTML = '⌨ Лог команд <span id="termlog-count" style="background:#c03030;color:#fff;border-radius:10px;padding:1px 6px;font-size:10px;margin-left:4px;display:none;">0</span>';
    btn.style.cssText = [
      'position:fixed', 'bottom:0', 'left:50%', 'transform:translateX(-50%)',
      'background:#0d1117', 'border:1px solid #2a3b48',
      'border-bottom:none', 'border-radius:8px 8px 0 0',
      'padding:5px 18px', 'cursor:pointer', 'z-index:888888',
      'color:#5fd0a5', 'font-size:12px', 'font-weight:600',
      'user-select:none', 'display:flex', 'align-items:center', 'gap:4px',
    ].join(';');
    document.body.appendChild(btn);
    btn.onclick = function() { TermLog.toggle(); };

    /* Панель термінала */
    var panel = document.createElement('div');
    panel.id = 'termlog-panel';
    panel.style.cssText = [
      'position:fixed', 'bottom:0', 'left:0', 'right:0',
      'height:320px', 'background:#060d10',
      'border-top:2px solid #1a3a2a',
      'z-index:888887', 'display:none',
      'flex-direction:column',
    ].join(';');

    panel.innerHTML =
      '<div id="termlog-header" style="display:flex;align-items:center;justify-content:space-between;' +
        'padding:6px 14px;background:#0d1117;border-bottom:1px solid #1a2a38;flex-shrink:0;">'+
        '<div style="display:flex;align-items:center;gap:10px;">'+
          '<span style="color:#5fd0a5;font-weight:700;font-size:13px;">⌨ Terminal Log</span>'+
          '<span id="termlog-router" style="color:#4a6070;font-size:11px;"></span>'+
        '</div>'+
        '<div style="display:flex;gap:8px;">'+
          '<button id="termlog-clear" style="background:transparent;border:1px solid #2a3b48;' +
            'color:#4a6070;border-radius:5px;padding:2px 10px;cursor:pointer;font-size:11px;">🗑 Очистити</button>'+
          '<button id="termlog-copy-all" style="background:transparent;border:1px solid #2a3b48;' +
            'color:#4a6070;border-radius:5px;padding:2px 10px;cursor:pointer;font-size:11px;">📋 Копіювати все</button>'+
          '<button id="termlog-close" style="background:transparent;border:1px solid #2a3b48;' +
            'color:#4a6070;border-radius:5px;padding:2px 10px;cursor:pointer;font-size:11px;">✕</button>'+
        '</div>'+
      '</div>'+
      '<div id="termlog-body" style="flex:1;overflow-y:auto;padding:8px 14px;' +
        'font-family:monospace;font-size:12px;line-height:1.6;"></div>'+
      '<div id="termlog-input-bar" style="display:flex;gap:8px;padding:6px 14px;' +
        'border-top:1px solid #1a2a38;background:#0a1218;flex-shrink:0;">'+
        '<span style="color:#5fd0a5;">❯</span>'+
        '<input id="termlog-cmd-input" type="text" placeholder="Виконати команду на роутері..." '+
          'style="flex:1;background:transparent;border:none;outline:none;' +
          'color:#e6edf3;font-family:monospace;font-size:12px;">'+
        '<button id="termlog-run" style="background:#1a3a2a;border:1px solid #2a5a3a;' +
          'color:#5fd0a5;border-radius:5px;padding:2px 12px;cursor:pointer;font-size:11px;">▶ Run</button>'+
        '<button id="termlog-export-read" style="background:#1a2a3a;border:1px solid #2a3a5a;' +
          'color:#5b9bd5;border-radius:5px;padding:2px 12px;cursor:pointer;font-size:11px;">📄 Читати export</button>'+
      '</div>';

    document.body.appendChild(panel);
    TermLog._el     = panel;
    TermLog._bodyEl = document.getElementById('termlog-body');

    /* Listeners */
    document.getElementById('termlog-close').onclick    = function() { TermLog.hide(); };
    document.getElementById('termlog-clear').onclick    = function() { TermLog.clear(); };
    document.getElementById('termlog-copy-all').onclick = function() { TermLog.copyAll(); };
    document.getElementById('termlog-run').onclick      = function() { TermLog.runManual(); };
    document.getElementById('termlog-export-read').onclick = function() { TermLog.readExport(); };

    /* Enter в input */
    document.getElementById('termlog-cmd-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') TermLog.runManual();
      /* Стрілки — історія команд */
      if (e.key === 'ArrowUp') {
        TermLog._histIdx = Math.max(0, (TermLog._histIdx || 0) - 1);
        this.value = TermLog._history[TermLog._histIdx] || '';
        e.preventDefault();
      }
      if (e.key === 'ArrowDown') {
        TermLog._histIdx = Math.min((TermLog._history||[]).length,
          (TermLog._histIdx || 0) + 1);
        this.value = TermLog._history[TermLog._histIdx] || '';
        e.preventDefault();
      }
    });

    /* Resize handle */
    var header = document.getElementById('termlog-header');
    var resizing = false, startY, startH;
    header.style.cursor = 'ns-resize';
    header.addEventListener('mousedown', function(e) {
      if (e.target.tagName === 'BUTTON') return;
      resizing = true;
      startY = e.clientY;
      startH = panel.offsetHeight;
      e.preventDefault();
    });
    document.addEventListener('mousemove', function(e) {
      if (!resizing) return;
      var newH = startH - (e.clientY - startY);
      panel.style.height = Math.max(120, Math.min(window.innerHeight * 0.8, newH)) + 'px';
    });
    document.addEventListener('mouseup', function() { resizing = false; });

    TermLog._history = [];
    TermLog._histIdx = 0;
    console.log('[TermLog] Ready ✅');
  },

  /* ── Показати/Сховати ── */
  toggle: function() {
    if (TermLog._visible) TermLog.hide();
    else TermLog.show();
  },
  show: function() {
    if (!TermLog._el) TermLog.init();
    TermLog._el.style.display = 'flex';
    TermLog._visible = true;
    /* Оновлюємо назву роутера */
    var r = window.getActiveRouter ? window.getActiveRouter() : null;
    var rEl = document.getElementById('termlog-router');
    if (rEl && r) rEl.textContent = '@ ' + (r.ip||r.host||'');
    TermLog.scrollBottom();
    setTimeout(function() {
      var inp = document.getElementById('termlog-cmd-input');
      if (inp) inp.focus();
    }, 100);
  },
  hide: function() {
    if (TermLog._el) TermLog._el.style.display = 'none';
    TermLog._visible = false;
  },

  /* ── Додати запис ── */
  log: function(type, text, extra) {
    if (!TermLog._bodyEl) TermLog.init();
    var ts = new Date().toLocaleTimeString('uk-UA');
    var colors = {
      cmd:     { bg: '#0a1a0a', border: '#2a5a3a', icon: '❯', color: '#5fd0a5' },
      ok:      { bg: '#0a1a10', border: '#1a4a2a', icon: '✅', color: '#4ab890' },
      error:   { bg: '#1a0a0a', border: '#5a2a2a', icon: '❌', color: '#e08080' },
      info:    { bg: '#0a0f1a', border: '#2a3a5a', icon: 'ℹ', color: '#5b9bd5' },
      warning: { bg: '#1a1200', border: '#4a3a00', icon: '⚠️', color: '#f0a840' },
    };
    var s = colors[type] || colors.info;
    var entry = document.createElement('div');
    entry.style.cssText = [
      'background:' + s.bg,
      'border-left:3px solid ' + s.border,
      'border-radius:0 4px 4px 0',
      'padding:4px 10px',
      'margin-bottom:3px',
      'word-break:break-all',
    ].join(';');
    var safeText = String(text)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\n/g,'<br>');
    var extraHtml = extra
      ? '<div style="color:#8ea3b0;margin-top:2px;font-size:11px;">' +
          String(extra).replace(/</g,'&lt;').replace(/\n/g,'<br>') + '</div>'
      : '';
    entry.innerHTML =
      '<span style="color:#2a4a38;font-size:10px;">[' + ts + ']</span> ' +
      '<span style="color:' + s.color + ';">' + s.icon + ' ' + safeText + '</span>' +
      extraHtml;
    TermLog._bodyEl.appendChild(entry);
    /* Обмежуємо кількість записів */
    while (TermLog._bodyEl.children.length > TermLog._maxEntries) {
      TermLog._bodyEl.removeChild(TermLog._bodyEl.firstChild);
    }
    TermLog.scrollBottom();
    /* Оновлюємо лічильник */
    if (type === 'error' || type === 'warning') {
      var cnt = document.getElementById('termlog-count');
      if (cnt) {
        cnt.style.display = 'inline';
        cnt.textContent = parseInt(cnt.textContent||0) + 1;
      }
    }
  },

  scrollBottom: function() {
    if (TermLog._bodyEl)
      TermLog._bodyEl.scrollTop = TermLog._bodyEl.scrollHeight;
  },

  clear: function() {
    if (TermLog._bodyEl) TermLog._bodyEl.innerHTML = '';
    var cnt = document.getElementById('termlog-count');
    if (cnt) { cnt.style.display='none'; cnt.textContent='0'; }
  },

  copyAll: function() {
    if (!TermLog._bodyEl) return;
    var text = TermLog._bodyEl.innerText || TermLog._bodyEl.textContent;
    navigator.clipboard.writeText(text).then(function() {
      TermLog.log('info', 'Лог скопійовано в буфер обміну');
    });
  },

  /* ── Ручне виконання команди ── */
  runManual: function() {
    var inp = document.getElementById('termlog-cmd-input');
    if (!inp || !inp.value.trim()) return;
    var cmd = inp.value.trim();
    inp.value = '';
    /* Додаємо в історію */
    TermLog._history = TermLog._history || [];
    TermLog._history.push(cmd);
    TermLog._histIdx = TermLog._history.length;
    /* Виконуємо */
    TermLog.execCmd(cmd);
  },

  /* ── Виконати команду через sshCall ── */
  execCmd: function(cmd) {
    var r = window.getActiveRouter ? window.getActiveRouter() : null;
    if (!r) {
      TermLog.log('error', 'Немає підключеного роутера');
      return;
    }
    TermLog.log('cmd', cmd);
    TermLog.show();
    if (window.sshCall) {
      window.sshCall(r, cmd)
        .then(function(d) {
          var out = typeof d === 'string' ? d
                  : (d && d.output) ? d.output
                  : (d && d.text)   ? d.text
                  : (d && d.result) ? d.result
                  : (d && d.error)  ? d.error
                  : JSON.stringify(d);
          TermLog.log('ok', out || '(OK — порожня відповідь)');
        })
        .catch(function(e) {
          TermLog.log('error', String(e));
        });
    } else {
      TermLog.log('error', 'sshCall недоступний');
    }
  },

  /* ── Читати останній export з роутера ── */
  readExport: function() {
    var r = window.getActiveRouter ? window.getActiveRouter() : null;
    if (!r) { TermLog.log('error', 'Немає роутера'); return; }
    TermLog.log('info', 'Читаємо router_config.rsc з роутера...');
    TermLog.show();
    /* Спочатку export compact, потім читаємо */
    var cmds = [
      '/export compact file=router_config',
      ':delay 2s',
      '/file print where name~".rsc"',
    ];
    if (window.sshCall) {
      window.sshCall(r, '/export compact')
        .then(function(d) {
          var out = typeof d === 'string' ? d
                  : (d && (d.output||d.text||d.result)) || '';
          if (out && out.length > 50) {
            TermLog.log('ok', '=== EXPORT (рядків: ' + out.split('\n').length + ') ===');
            /* Показуємо повний текст */
            var full = document.createElement('div');
            full.style.cssText = 'background:#050d08;border:1px solid #1a3a2a;border-radius:6px;' +
              'padding:8px 12px;margin:4px 0;max-height:200px;overflow-y:auto;' +
              'font-family:monospace;font-size:11px;color:#8ea3b0;white-space:pre;';
            full.textContent = out;
            TermLog._bodyEl.appendChild(full);
            /* Кнопка скопіювати */
            var copyBtn = document.createElement('button');
            copyBtn.textContent = '📋 Копіювати export';
            copyBtn.style.cssText = 'background:#1a2a3a;border:1px solid #2a3a5a;' +
              'color:#5b9bd5;border-radius:5px;padding:3px 10px;cursor:pointer;' +
              'font-size:11px;margin:4px 0;';
            copyBtn.onclick = function() {
              navigator.clipboard.writeText(out);
              copyBtn.textContent = '✅ Скопійовано!';
              setTimeout(function(){copyBtn.textContent='📋 Копіювати export';},2000);
            };
            TermLog._bodyEl.appendChild(copyBtn);
            /* Кнопка відкрити в Diff */
            var diffBtn = document.createElement('button');
            diffBtn.textContent = '🔄 Відкрити в Diff';
            diffBtn.style.cssText = 'background:#1a3a2a;border:1px solid #2a5a3a;' +
              'color:#5fd0a5;border-radius:5px;padding:3px 10px;cursor:pointer;' +
              'font-size:11px;margin:4px 4px;';
            diffBtn.onclick = function() {
              var ta = document.getElementById('da-text-a');
              if (ta) { ta.value = out; }
              TermLog.log('info', 'Export відкрито в Diff Конфіг A');
            };
            TermLog._bodyEl.appendChild(diffBtn);
            TermLog.scrollBottom();
          } else {
            TermLog.log('warning', 'Export порожній або занадто короткий: ' + out);
          }
        })
        .catch(function(e) {
          TermLog.log('error', 'Export failed: ' + e);
        });
    }
  },

  /* ── Перехоплення sshCall ── */
  interceptSSH: function() {
    var _orig = window.sshCall;
    if (!_orig || window.sshCall._intercepted) return;
    window.sshCall = function(router, cmd) {
      /* Логуємо команду */
      var routerName = router ? (router.ip||router.host||'?') : '?';
      TermLog.log('cmd', '[' + routerName + '] ' + cmd);
      /* Виконуємо оригінал */
      return _orig(router, cmd)
        .then(function(d) {
          var out = typeof d === 'string' ? d
                  : (d && d.output) ? d.output
                  : (d && d.text)   ? d.text
                  : (d && d.result) ? d.result
                  : (d && d.error)  ? ('ERROR: ' + d.error)
                  : JSON.stringify(d);
          var type = (d && d.error) ? 'error' : 'ok';
          TermLog.log(type, out || '(OK)');
          return d;
        })
        .catch(function(e) {
          TermLog.log('error', String(e));
          throw e;
        });
    };
    window.sshCall._intercepted = true;
    console.log('[TermLog] sshCall intercepted ✅');
  },

  /* ── Перехоплення restCall ── */
  interceptREST: function() {
    var _orig = window.restCall;
    if (!_orig || window.restCall._intercepted) return;
    window.restCall = function(router, method, path, body) {
      var routerName = router ? (router.ip||router.host||'?') : '?';
      TermLog.log('info', '[REST ' + routerName + '] ' + method + ' ' + path);
      return _orig(router, method, path, body)
        .then(function(d) {
          if (d && d.error) TermLog.log('error', 'REST error: ' + d.error);
          return d;
        })
        .catch(function(e) {
          TermLog.log('error', 'REST failed: ' + e);
          throw e;
        });
    };
    window.restCall._intercepted = true;
    console.log('[TermLog] restCall intercepted ✅');
  },
};

/* ── Запуск ── */
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    TermLog.init();
    /* Перехоплюємо після завантаження всіх скриптів */
    setTimeout(function() {
      TermLog.interceptSSH();
      TermLog.interceptREST();
      TermLog.log('info', 'Terminal Log готовий. Всі SSH/REST команди будуть відображатись тут.');
    }, 1500);
  }, 500);
});

console.log('[TermLog] Loaded ✅');
