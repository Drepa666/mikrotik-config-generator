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
        'border-top:1px solid #1a2a38;background:#0a1218;flex-shrink:0;position:relative;">'+
        '<span style="color:#5fd0a5;font-family:monospace;font-size:13px;">❯</span>'+
        '<div style="flex:1;position:relative;">'+
          /* Шар підсвітки — під текстом */
          '<div id="termlog-highlight" style="position:absolute;top:0;left:0;right:0;bottom:0;' +
            'font-family:monospace;font-size:12px;line-height:1.5;pointer-events:none;' +
            'white-space:pre;overflow:hidden;padding:0;"></div>'+
          /* Прозорий input поверх */
          '<input id="termlog-cmd-input" type="text" '+
            'placeholder="Команда... (Tab = autocomplete, ↑↓ = історія)" '+
            'style="width:100%;background:transparent;border:none;outline:none;' +
            'color:#e6edf3;font-family:monospace;font-size:12px;position:relative;' +
            'z-index:1;caret-color:#5fd0a5;">'+
          /* Inline autocomplete hint */
          '<div id="termlog-hint" style="position:absolute;top:0;left:0;right:0;' +
            'font-family:monospace;font-size:12px;pointer-events:none;' +
            'color:#2a4a38;white-space:pre;overflow:hidden;"></div>'+
        '</div>'+
        '<button id="termlog-run" style="background:#1a3a2a;border:1px solid #2a5a3a;' +
          'color:#5fd0a5;border-radius:5px;padding:2px 12px;cursor:pointer;font-size:11px;">▶ Run</button>'+
        '<button id="termlog-export-read" style="background:#1a2a3a;border:1px solid #2a3a5a;' +
          'color:#5b9bd5;border-radius:5px;padding:2px 12px;cursor:pointer;font-size:11px;">📄 Export</button>'+
        '<button id="termlog-analyze-logs" style="background:#1a1a3a;border:1px solid #3a2a5a;' +
          'color:#c084fc;border-radius:5px;padding:2px 12px;cursor:pointer;font-size:11px;">🤖 Аналіз логів</button>'+
        '<button id="termlog-multi-router" style="background:#1a2a1a;border:1px solid #3a5a2a;' +
          'color:#90c060;border-radius:5px;padding:2px 12px;cursor:pointer;font-size:11px;">🔀 Multi-router</button>'+
      '</div>';

    document.body.appendChild(panel);
    TermLog._el     = panel;
    TermLog._bodyEl = document.getElementById('termlog-body');

    /* Listeners */
    document.getElementById('termlog-close').onclick    = function() { TermLog.hide(); };
    document.getElementById('termlog-clear').onclick    = function() { TermLog.clear(); };
    document.getElementById('termlog-copy-all').onclick = function() { TermLog.copyAll(); };
    document.getElementById('termlog-run').onclick      = function() { TermLog.runManual(); };
    document.getElementById('termlog-export-read').onclick  = function() { TermLog.readExport(); };
    document.getElementById('termlog-analyze-logs').onclick = function() { TermLog.analyzeLogs(); };
    document.getElementById('termlog-multi-router').onclick = function() { TermLog.showMultiRouter(); };

    /* ── Enter/Tab/Arrow listeners ── */
    var cmdInput = document.getElementById('termlog-cmd-input');
    cmdInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        TermLog.runManual();
        document.getElementById('termlog-hint').textContent = '';
        document.getElementById('termlog-highlight').innerHTML = '';
        return;
      }
      /* Tab — Winbox-стиль autocomplete */
      if (e.key === 'Tab') {
        e.preventDefault();
        var cur = this.value;
        /* Знаходимо всі варіанти */
        var variants = TermLog.getAllCompletions(cur);
        if (variants.length === 0) return;
        if (variants.length === 1) {
          /* Єдиний варіант — одразу вставляємо + пробіл */
          this.value = variants[0] + ' ';
          TermLog._currentHint = '';
          TermLog._tabVariants = [];
          TermLog._tabIdx = 0;
          TermLog.updateHighlight(this.value);
          TermLog.updateHint(this.value);
          TermLog.hideDropdown();
        } else {
          /* Кілька варіантів — показуємо dropdown */
          /* Спершу знаходимо спільний префікс */
          var common = variants.reduce(function(a, b) {
            var i = 0;
            while (i < a.length && i < b.length && a[i] === b[i]) i++;
            return a.slice(0, i);
          });
          if (common.length > cur.length) {
            /* Є спільний префікс — доповнюємо до нього */
            this.value = common;
            TermLog.updateHighlight(this.value);
          }
          TermLog._tabVariants = variants;
          TermLog._tabIdx = -1;
          TermLog.showDropdown(variants, this);
        }
        return;
      }
      /* Escape — ховаємо dropdown */
      if (e.key === 'Escape') {
        TermLog.hideDropdown();
        return;
      }
      /* Стрілки — історія */
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        TermLog._histIdx = Math.max(0, (TermLog._histIdx || 0) - 1);
        this.value = (TermLog._history || [])[TermLog._histIdx] || '';
        TermLog.updateHighlight(this.value);
        TermLog.updateHint(this.value);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        TermLog._histIdx = Math.min(
          (TermLog._history||[]).length,
          (TermLog._histIdx||0) + 1);
        this.value = (TermLog._history||[])[TermLog._histIdx] || '';
        TermLog.updateHighlight(this.value);
        TermLog.updateHint(this.value);
      }
    });
    /* Input — оновлюємо підсвітку і hint в реальному часі */
    cmdInput.addEventListener('input', function() {
      TermLog.updateHighlight(this.value);
      TermLog.updateHint(this.value);
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
    /* Ховаємо dropdown при кліку поза */
    document.addEventListener('click', function(e) {
      var dd = document.getElementById('termlog-dropdown');
      if (dd && !dd.contains(e.target) &&
          e.target.id !== 'termlog-cmd-input') {
        TermLog.hideDropdown();
      }
    });
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

  /* ── База команд RouterOS для autocomplete ── */
  _rosCommands: [
    /* Головні меню */
    '/ip address', '/ip route', '/ip firewall filter', '/ip firewall nat',
    '/ip firewall mangle', '/ip firewall address-list',
    '/ip dns', '/ip dhcp-server', '/ip dhcp-client',
    '/ip service', '/ip neighbor', '/ip arp', '/ip pool',
    '/interface ethernet', '/interface bridge', '/interface vlan',
    '/interface wireless', '/interface wifi', '/interface wireguard',
    '/interface list', '/interface monitor-traffic',
    '/system identity', '/system resource', '/system clock',
    '/system backup', '/system reboot', '/system shutdown',
    '/system package', '/system scheduler', '/system script',
    '/system logging', '/system health',
    '/tool ping', '/tool traceroute', '/tool bandwidth-test',
    '/tool torch', '/tool sniffer', '/tool netwatch',
    '/tool profile', '/tool flood-ping',
    '/routing ospf', '/routing bgp', '/routing filter',
    '/caps-man', '/certificate', '/container',
    '/export', '/export terse', '/export compact',
    '/import', '/file print', '/file remove',
    '/log print', '/ping', '/traceroute',
    /* Дії */
    '/ip address add', '/ip address remove', '/ip address print',
    '/ip route add', '/ip route print',
    '/ip firewall filter add', '/ip firewall filter print',
    '/ip firewall filter remove', '/ip firewall filter disable',
    '/ip firewall nat add', '/ip firewall nat print',
    '/interface print', '/interface enable', '/interface disable',
    '/ip dhcp-server lease print', '/ip arp print',
    '/user print', '/user add', '/user set',
    '/certificate add', '/certificate sign', '/certificate print',
  ],

  /* ── Словник параметрів по команді ── */
  _rosParams: {
    '/ip firewall filter add': 'chain= action= protocol= src-address= dst-address= in-interface= out-interface= comment=',
    '/ip firewall nat add':    'chain= action= src-address= dst-address= to-addresses= to-ports= protocol= comment=',
    '/ip address add':         'address= interface= comment=',
    '/ip route add':           'dst-address= gateway= distance= comment=',
    '/ip dns set':             'servers= allow-remote-requests=',
    '/ip service set':         'port= address= disabled=',
    '/interface bridge add':   'name= vlan-filtering= comment=',
    '/user add':               'name= group= password= comment=',
    '/tool ping':              'address= count= interval= size=',
    '/tool torch':             'interface= src-address= dst-address= duration=',
    '/ping':                   'address= count= interval= src-address=',
  },

  /* ── Токени підсвітки ── */
  _tokenize: function(cmd) {
    /* Розбиваємо команду на токени з кольорами */
    var tokens = [];
    var c = cmd || '';

    /* 1. Шлях /ip/firewall/... */
    var pathMatch = c.match(/^(\/[a-z][a-z0-9\-\/]*)/);
    if (pathMatch) {
      tokens.push({ text: pathMatch[1], color: '#5b9bd5' }); /* синій */
      c = c.slice(pathMatch[1].length);
    }

    /* 2. Дія (add/remove/set/print/enable/disable/...) */
    var actionMatch = c.match(/^\s*(add|remove|set|print|get|find|enable|disable|reset|export|import|monitor|move|copy|comment|unset|edit)\b/);
    if (actionMatch) {
      tokens.push({ text: actionMatch[0], color: '#5fd0a5' }); /* зелений */
      c = c.slice(actionMatch[0].length);
    }

    /* 3. Параметри key=value */
    var paramRe = /(\s*)(\w[\w\-]*)=("[^"]*"|[^\s]*)/g;
    var lastIdx  = 0;
    var match;
    while ((match = paramRe.exec(c)) !== null) {
      /* Текст між параметрами */
      if (match.index > lastIdx) {
        tokens.push({ text: c.slice(lastIdx, match.index), color: '#8ea3b0' });
      }
      tokens.push({ text: match[2], color: '#f0a840' }); /* ключ — жовтий */
      tokens.push({ text: '=',      color: '#4a6070' });
      /* Значення — різний колір */
      var val = match[3];
      var valColor = '#e6edf3'; /* білий за замовч */
      if (val === 'yes' || val === 'no' || val === 'true' || val === 'false')
        valColor = '#c084fc'; /* фіолетовий для bool */
      else if (/^\d+(\.\d+)*(\/\d+)?$/.test(val))
        valColor = '#60a5fa'; /* блакитний для IP/числа */
      else if (val === 'accept' || val === 'drop' || val === 'reject')
        valColor = (val === 'accept') ? '#5fd0a5' : '#e08080'; /* зелений/червоний */
      else if (val === 'input' || val === 'output' || val === 'forward')
        valColor = '#f0c060'; /* жовтий для chain */
      tokens.push({ text: val, color: valColor });
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < c.length) {
      tokens.push({ text: c.slice(lastIdx), color: '#8ea3b0' });
    }
    return tokens;
  },

  /* ── Оновити шар підсвітки ── */
  updateHighlight: function(val) {
    var el = document.getElementById('termlog-highlight');
    if (!el) return;
    if (!val) { el.innerHTML = ''; return; }
    var tokens = TermLog._tokenize(val);
    el.innerHTML = tokens.map(function(t) {
      var safe = t.text
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      return '<span style="color:' + t.color + ';">' + safe + '</span>';
    }).join('');
  },

  /* ── Знайти найкращий autocomplete ── */
  getNextCompletion: function(val) {
    if (!val || val.length < 2) return null;
    var v = val.toLowerCase();
    /* 1. Шукаємо в базі команд */
    var match = TermLog._rosCommands.find(function(c) {
      return c.toLowerCase().startsWith(v) && c.length > v.length;
    });
    if (match) return match;
    /* 2. Шукаємо в параметрах якщо команда вже введена */
    var parts = val.split(' ');
    if (parts.length >= 2) {
      var base = parts.slice(0, -1).join(' ');
      var last = parts[parts.length - 1];
      /* Параметри для цієї команди */
      var params = TermLog._rosParams[base] || '';
      var paramList = params.split(' ').filter(Boolean);
      var pm = paramList.find(function(p) {
        return p.toLowerCase().startsWith(last.toLowerCase()) && p.length > last.length;
      });
      if (pm) return base + ' ' + pm;
    }
    /* 3. Шукаємо в історії */
    var hist = (TermLog._history || []).slice().reverse();
    return hist.find(function(h) {
      return h.toLowerCase().startsWith(v) && h.length > v.length;
    }) || null;
  },

  /* ── Всі варіанти autocomplete ── */
  getAllCompletions: function(val) {
    if (!val || val.length < 1) return [];
    var v = val.toLowerCase();
    var results = [];
    /* Шукаємо в командах */
    TermLog._rosCommands.forEach(function(c) {
      if (c.toLowerCase().startsWith(v) && c !== val) results.push(c);
    });
    /* Якщо є пробіл — шукаємо параметри */
    var parts = val.split(' ');
    if (parts.length >= 2) {
      /* Базова команда (без останнього слова) */
      var base = parts.slice(0,-1).join(' ');
      var last = parts[parts.length-1].toLowerCase();
      /* Шукаємо в параметрах */
      var paramStr = '';
      /* Перебираємо від довгої до короткої */
      Object.keys(TermLog._rosParams).forEach(function(key) {
        if (base.toLowerCase().startsWith(key.toLowerCase())) {
          paramStr = TermLog._rosParams[key];
        }
      });
      if (paramStr) {
        paramStr.split(' ').filter(Boolean).forEach(function(p) {
          if (p.toLowerCase().startsWith(last) && p !== last) {
            results.push(base + ' ' + p);
          }
        });
      }
      /* Популярні значення для відомих параметрів */
      var lastLow = last.toLowerCase();
      var knownValues = {
        'chain=':   ['input','forward','output'],
        'action=':  ['accept','drop','reject','masquerade','dst-nat','src-nat','log','passthrough'],
        'protocol=':['tcp','udp','icmp','icmpv6'],
        'disabled=':['yes','no'],
      };
      Object.keys(knownValues).forEach(function(key) {
        if (lastLow.startsWith(key)) {
          var typed = last.slice(key.length).toLowerCase();
          knownValues[key].forEach(function(v) {
            if (v.startsWith(typed)) {
              results.push(base + ' ' + key + v);
            }
          });
        }
      });
    }
    /* Додаємо з історії */
    (TermLog._history||[]).slice().reverse().forEach(function(h) {
      if (h.toLowerCase().startsWith(v) && h !== val &&
          results.indexOf(h) < 0) {
        results.push(h);
      }
    });
    return results.slice(0, 10); /* макс 10 варіантів */
  },

  /* ── Dropdown список варіантів ── */
  showDropdown: function(variants, inputEl) {
    TermLog.hideDropdown();
    var bar  = document.getElementById('termlog-input-bar');
    if (!bar) return;
    var drop = document.createElement('div');
    drop.id  = 'termlog-dropdown';
    drop.style.cssText = [
      'position:absolute', 'bottom:100%', 'left:0', 'right:0',
      'background:#0d1117', 'border:1px solid #2a3b48',
      'border-radius:8px 8px 0 0', 'z-index:999999',
      'max-height:220px', 'overflow-y:auto',
      'box-shadow:0 -4px 20px rgba(0,0,0,.5)',
    ].join(';');
    var activeIdx = -1;
    variants.forEach(function(v, i) {
      var item = document.createElement('div');
      item.style.cssText = [
        'padding:5px 14px', 'cursor:pointer',
        'font-family:monospace', 'font-size:12px',
        'color:#c9d8e4', 'border-bottom:1px solid #1a2a38',
        'display:flex', 'align-items:center', 'gap:8px',
      ].join(';');
      /* Підсвічуємо введену частину */
      var cur  = inputEl.value;
      var safe = v.replace(/&/g,'&amp;').replace(/</g,'&lt;');
      var safeC = cur.replace(/&/g,'&amp;').replace(/</g,'&lt;');
      if (safe.toLowerCase().startsWith(safeC.toLowerCase())) {
        item.innerHTML =
          '<span style="color:#5b9bd5;">' + safe.slice(0, cur.length) + '</span>' +
          '<span style="color:#5fd0a5;">' + safe.slice(cur.length) + '</span>';
      } else {
        item.innerHTML = safe;
      }
      /* Клік — вставляємо */
      item.onclick = function() {
        inputEl.value = v + ' ';
        TermLog.hideDropdown();
        TermLog.updateHighlight(inputEl.value);
        TermLog.updateHint(inputEl.value);
        inputEl.focus();
      };
      item.onmouseenter = function() {
        this.style.background = '#1a2a38';
        activeIdx = i;
      };
      item.onmouseleave = function() {
        this.style.background = '';
      };
      drop.appendChild(item);
    });
    bar.style.position = 'relative';
    bar.appendChild(drop);
    /* Стрілки в dropdown */
    TermLog._dropdownActive = true;
    TermLog._dropdownEl = drop;
    TermLog._dropdownItems = Array.from(drop.children);
    TermLog._dropdownVariants = variants;
    TermLog._dropdownInput = inputEl;
    TermLog._dropdownIdx = -1;

    /* Навігація стрілками коли dropdown відкритий */
    TermLog._dropdownKeyFn = function(e) {
      if (!TermLog._dropdownActive) return;
      var items = TermLog._dropdownItems;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (TermLog._dropdownIdx >= 0)
          items[TermLog._dropdownIdx].style.background = '';
        TermLog._dropdownIdx = Math.min(TermLog._dropdownIdx+1, items.length-1);
        items[TermLog._dropdownIdx].style.background = '#1a3a2a';
        items[TermLog._dropdownIdx].style.color = '#5fd0a5';
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (TermLog._dropdownIdx >= 0)
          items[TermLog._dropdownIdx].style.background = '';
        TermLog._dropdownIdx = Math.max(TermLog._dropdownIdx-1, 0);
        items[TermLog._dropdownIdx].style.background = '#1a3a2a';
        items[TermLog._dropdownIdx].style.color = '#5fd0a5';
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (TermLog._dropdownIdx >= 0) {
          var chosen = TermLog._dropdownVariants[TermLog._dropdownIdx];
          TermLog._dropdownInput.value = chosen + ' ';
          TermLog.updateHighlight(chosen + ' ');
          TermLog.updateHint(chosen + ' ');
        }
        TermLog.hideDropdown();
        TermLog._dropdownInput.focus();
      } else if (e.key === 'Escape') {
        TermLog.hideDropdown();
      }
    };
    document.addEventListener('keydown', TermLog._dropdownKeyFn, true);
  },

  hideDropdown: function() {
    var old = document.getElementById('termlog-dropdown');
    if (old) old.remove();
    TermLog._dropdownActive = false;
    if (TermLog._dropdownKeyFn) {
      document.removeEventListener('keydown', TermLog._dropdownKeyFn, true);
      TermLog._dropdownKeyFn = null;
    }
  },

  /* ── Оновити inline hint (ghost text) ── */
  updateHint: function(val) {
    var hintEl = document.getElementById('termlog-hint');
    if (!hintEl) return;
    if (!val || val.length < 2) {
      hintEl.textContent = '';
      TermLog._currentHint = '';
      return;
    }
    var completion = TermLog.getNextCompletion(val);
    if (completion && completion.startsWith(val)) {
      /* Показуємо тільки ту частину що ще не введена */
      hintEl.textContent = completion;
      TermLog._currentHint = completion;
    } else {
      hintEl.textContent = '';
      TermLog._currentHint = '';
    }
  },

  /* ── AI аналіз логів ── */
  analyzeLogs: function() {
    var r = window.getActiveRouter ? window.getActiveRouter() : null;
    if (!r) { TermLog.log('error', 'Немає підключеного роутера'); return; }
    TermLog.log('info', '🤖 Читаємо логи з роутера...');
    TermLog.show();
    /* Читаємо останні 50 рядків логу */
    window.sshCall(r, '/log print')
      .then(function(d) {
        var logText = typeof d === 'string' ? d
                    : (d && d.output) ? d.output
                    : JSON.stringify(d);
        if (!logText || logText.length < 10) {
          TermLog.log('warning', 'Лог порожній');
          return;
        }
        /* Показуємо лог в терміналі */
        TermLog.log('ok', '=== LOG (' + logText.split('\n').length + ' рядків) ===');
        var logDiv = document.createElement('div');
        logDiv.style.cssText = 'background:#050d05;border:1px solid #1a3a1a;border-radius:6px;'+
          'padding:8px 12px;margin:4px 0;max-height:160px;overflow-y:auto;'+
          'font-family:monospace;font-size:11px;color:#8ea3b0;white-space:pre-wrap;';
        /* Підсвічуємо error/warning рядки */
        logDiv.innerHTML = logText
          .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
          .replace(/(.*error.*)/gi, '<span style="color:#e08080;">$1</span>')
          .replace(/(.*warning.*)/gi, '<span style="color:#f0a840;">$1</span>')
          .replace(/(.*critical.*)/gi, '<span style="color:#ff4040;font-weight:bold;">$1</span>')
          .replace(/(.*logged in.*)/gi, '<span style="color:#5fd0a5;">$1</span>')
          .replace(/(.*logged out.*)/gi, '<span style="color:#4a6070;">$1</span>');
        TermLog._bodyEl.appendChild(logDiv);
        TermLog.scrollBottom();
        /* Відправляємо AI */
        if (!window.AIAgent || !AIAgent.send) {
          TermLog.log('error', 'AI агент недоступний');
          return;
        }
        TermLog.log('info', '🤖 AI аналізує логи...');
        var routerInfo = window.ROSAdapter ? ROSAdapter.getAIContext() : '';
        var prompt =
          'Проаналізуй логи MikroTik RouterOS і поясни що відбувається:\n\n' +
          '```\n' + logText.slice(-3000) + '\n```\n\n' +
          (routerInfo ? 'Роутер: ' + routerInfo + '\n\n' : '') +
          'Відповідай українською. Поясни:\n' +
          '1) Що відбувається в цих логах?\n' +
          '2) Чи є помилки або підозрілі події?\n' +
          '3) Що треба перевірити або виправити?\n' +
          '4) Чи є ознаки злому або проблем з безпекою?';
        AIAgent.send(prompt, { includeContext: false })
          .then(function(resp) {
            var txt = resp && resp.content ? resp.content
                    : resp && resp.text    ? resp.text
                    : String(resp || '');
            /* Рендеримо відповідь AI */
            var aiEl = document.createElement('div');
            aiEl.style.cssText = 'background:#0d1a0d;border:1px solid #2a4a2a;border-radius:8px;'+
              'padding:12px 16px;margin:8px 0;color:#c9d8e4;font-size:12px;line-height:1.6;';
            aiEl.innerHTML =
              '<div style="color:#c084fc;font-weight:700;margin-bottom:8px;">🤖 AI Аналіз логів</div>'+
              '<div>' + txt
                .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                .replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')
                .replace(/\n/g,'<br>') +
              '</div>';
            TermLog._bodyEl.appendChild(aiEl);
            TermLog.scrollBottom();
          })
          .catch(function(e) {
            TermLog.log('error', 'AI помилка: ' + e);
          });
      })
      .catch(function(e) {
        TermLog.log('error', 'Не вдалось прочитати лог: ' + e);
      });
  },

  /* ── Multi-router термінал ── */
  showMultiRouter: function() {
    var old = document.getElementById('termlog-multi-panel');
    if (old) { old.remove(); return; }

    /* ── Отримуємо роутери через _getAllRouters ── */
    var routers = [];
    try {
      /* 1. Найкращий спосіб — через closure метод */
      if (window.RouterManager && RouterManager._getAllRouters) {
        routers = RouterManager._getAllRouters();
        console.log('[MultiRouter] _getAllRouters:', routers.length);
      }
      /* 2. Якщо порожньо — активний роутер */
      if (routers.length === 0 && window.RouterManager && RouterManager._getActiveRouter) {
        var ar = RouterManager._getActiveRouter();
        if (ar) routers = [ar];
        console.log('[MultiRouter] _getActiveRouter:', ar && ar.ip);
      }
      /* 3. Fallback — window.getActiveRouter */
      if (routers.length === 0 && window.getActiveRouter) {
        var ar2 = window.getActiveRouter();
        if (ar2) routers = [ar2];
        console.log('[MultiRouter] getActiveRouter:', ar2 && ar2.ip);
      }
    } catch(e) {
      console.error('[MultiRouter] error:', e);
    }

    if (routers.length === 0) {
      TermLog.log('error', 'Немає роутерів. Підключіться до роутера в Router Manager');
      return;
    }
    console.log('[MultiRouter] Знайдено роутерів:', routers.length,
      routers.map(function(r){return r.ip;}));

    /* ── Завантажуємо збережені групи ── */
    var groups = {};
    try { groups = JSON.parse(localStorage.getItem('mr-groups') || '{}'); } catch(e) {}

    /* ── HTML чекбоксів ── */
    var checkboxes = routers.map(function(r) {
      return '<label style="display:flex;align-items:center;gap:8px;padding:4px 0;'+
        'color:#c9d8e4;font-size:12px;cursor:pointer;">'+
        '<input type="checkbox" class="mr-check"'+
          ' data-id="' + (r.id||r.ip) + '"'+
          ' data-ip="' + r.ip + '"'+
          ' checked style="accent-color:#5fd0a5;">'+
        '<span style="color:#5fd0a5;">◉</span> '+
        (r.name||r.ip) +
        ' <span style="color:#4a6070;font-size:10px;">' + r.ip + '</span>'+
        '</label>';
    }).join('');

    /* ── Кнопки груп ── */
    var groupBtns = Object.keys(groups).map(function(gname) {
      return '<button class="mr-group-btn" data-group="' + gname + '"'+
        ' style="background:#1a1a2a;border:1px solid #3a2a5a;color:#c084fc;'+
        'border-radius:5px;padding:2px 8px;cursor:pointer;font-size:11px;">'+
        '📁 ' + gname + ' (' + (groups[gname]||[]).length + ')</button>';
    }).join(' ');

    /* ── Панель ── */
    var panel = document.createElement('div');
    panel.id = 'termlog-multi-panel';
    panel.style.cssText = [
      'position:absolute', 'bottom:100%', 'right:0',
      'background:#0d1117', 'border:1px solid #2a3b48',
      'border-radius:8px 8px 0 0', 'padding:12px 16px',
      'min-width:320px', 'max-width:420px', 'z-index:999999',
      'box-shadow:0 -4px 20px rgba(0,0,0,.5)',
    ].join(';');

    panel.innerHTML =
      '<div style="color:#90c060;font-weight:700;margin-bottom:8px;">'+
        '🔀 Multi-Router — ' + routers.length + ' роутерів'+
      '</div>'+
      (Object.keys(groups).length > 0
        ? '<div style="margin-bottom:8px;display:flex;flex-wrap:wrap;gap:4px;">'+
            '<span style="color:#4a6070;font-size:11px;">Групи: </span>' + groupBtns +
          '</div>'
        : '') +
      '<div id="mr-router-list" style="max-height:200px;overflow-y:auto;margin-bottom:8px;">'+
        checkboxes +
      '</div>'+
      '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">'+
        '<button id="mr-select-all" style="background:transparent;border:1px solid #2a3b48;'+
          'color:#4a6070;border-radius:5px;padding:2px 8px;cursor:pointer;font-size:11px;">✓ Всі</button>'+
        '<button id="mr-select-none" style="background:transparent;border:1px solid #2a3b48;'+
          'color:#4a6070;border-radius:5px;padding:2px 8px;cursor:pointer;font-size:11px;">✗ Жодного</button>'+
        '<button id="mr-save-group" style="background:#1a1a2a;border:1px solid #3a2a5a;'+
          'color:#c084fc;border-radius:5px;padding:2px 8px;cursor:pointer;font-size:11px;">💾 Зберегти групу</button>'+
      '</div>'+
      '<div style="display:flex;gap:8px;">'+
        '<button id="mr-run-all" style="background:#1a3a1a;border:1px solid #3a6a2a;'+
          'color:#90c060;border-radius:6px;padding:5px 14px;cursor:pointer;font-size:12px;flex:1;">'+
          '▶ Виконати на вибраних</button>'+
        '<button id="mr-cancel" style="background:transparent;border:1px solid #2a3b48;'+
          'color:#4a6070;border-radius:6px;padding:5px 10px;cursor:pointer;font-size:12px;">✕</button>'+
      '</div>';

    var bar = document.getElementById('termlog-input-bar');
    if (bar) { bar.style.position='relative'; bar.appendChild(panel); }

    /* ── Хелпери ── */
    function getChecked() {
      var checks = panel.querySelectorAll('.mr-check:checked');
      var ids = Array.from(checks).map(function(c){return c.dataset.id;});
      return routers.filter(function(r){return ids.indexOf(r.id||r.ip)>=0;});
    }

    /* Кнопки вибору */
    document.getElementById('mr-select-all').onclick = function() {
      panel.querySelectorAll('.mr-check').forEach(function(c){c.checked=true;});
    };
    document.getElementById('mr-select-none').onclick = function() {
      panel.querySelectorAll('.mr-check').forEach(function(c){c.checked=false;});
    };

    /* Зберегти групу */
    document.getElementById('mr-save-group').onclick = function() {
      var sel = getChecked();
      if (sel.length === 0) { TermLog.log('warning','Виберіть роутери'); return; }
      var gname = prompt('Назва групи (Офіси, Склади...):');
      if (!gname || !gname.trim()) return;
      try {
        var gs = JSON.parse(localStorage.getItem('mr-groups')||'{}');
        gs[gname.trim()] = sel.map(function(r){return r.id||r.ip;});
        localStorage.setItem('mr-groups', JSON.stringify(gs));
        TermLog.log('ok','💾 Групу "'+gname.trim()+'" збережено ('+sel.length+' роутерів)');
        panel.remove();
        setTimeout(function(){TermLog.showMultiRouter();},100);
      } catch(e) { TermLog.log('error','Помилка: '+e); }
    };

    /* Кнопки груп */
    panel.querySelectorAll('.mr-group-btn').forEach(function(btn) {
      btn.onclick = function() {
        var gs = JSON.parse(localStorage.getItem('mr-groups')||'{}');
        var gids = gs[this.dataset.group] || [];
        panel.querySelectorAll('.mr-check').forEach(function(c) {
          c.checked = gids.indexOf(c.dataset.id) >= 0;
        });
        panel.querySelectorAll('.mr-group-btn').forEach(function(b){
          b.style.background='#1a1a2a'; b.style.color='#c084fc';
        });
        this.style.background='#3a1a5a'; this.style.color='#e0a0ff';
      };
      btn.oncontextmenu = function(e) {
        e.preventDefault();
        if (!confirm('Видалити групу "'+this.dataset.group+'"?')) return;
        var gs = JSON.parse(localStorage.getItem('mr-groups')||'{}');
        delete gs[this.dataset.group];
        localStorage.setItem('mr-groups', JSON.stringify(gs));
        panel.remove();
        setTimeout(function(){TermLog.showMultiRouter();},100);
      };
    });

    /* Виконати */
    document.getElementById('mr-run-all').onclick = function() {
      var cmd = (document.getElementById('termlog-cmd-input')||{}).value;
      cmd = cmd ? cmd.trim() : '';
      if (!cmd) { TermLog.log('error','Введіть команду в поле вводу!'); return; }
      var sel = getChecked();
      if (sel.length === 0) { TermLog.log('warning','Виберіть хоча б один роутер'); return; }
      panel.remove();
      TermLog.runOnMultiple(cmd, sel);
    };
    document.getElementById('mr-cancel').onclick = function() { panel.remove(); };
  },

  /* ── Виконати команду на кількох роутерах ── */
  runOnMultiple: function(cmd, routers) {
    if (!routers || routers.length === 0) return;
    TermLog.log('info', '🔀 Виконую "' + cmd + '" на ' + routers.length + ' роутерах...');
    TermLog.show();
    /* Паралельно на всіх роутерах */
    var promises = routers.map(function(r) {
      return fetch('http://localhost:8888/ssh/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: r.ip, port: r.sshPort || 22,
          user: r.user, username: r.user, password: r.pass,
          command: cmd, timeout: 15,
        }),
      })
      .then(function(res) { return res.json(); })
      .then(function(d) { return { router: r, ok: d.ok, output: d.output||d.result||'', error: d.error }; })
      .catch(function(e) { return { router: r, ok: false, output: '', error: String(e) }; });
    });
    Promise.all(promises).then(function(results) {
      /* Показуємо результати */
      var resDiv = document.createElement('div');
      resDiv.style.cssText = 'background:#080d10;border:1px solid #1a2a38;border-radius:8px;'+
        'padding:10px 14px;margin:6px 0;';
      resDiv.innerHTML = '<div style="color:#90c060;font-weight:700;margin-bottom:8px;">'+
        '🔀 Результати: ' + cmd + '</div>';
      results.forEach(function(r) {
        var color  = r.ok ? '#5fd0a5' : '#e08080';
        var icon   = r.ok ? '✅' : '❌';
        var output = r.output || r.error || '(порожньо)';
        var block  = document.createElement('div');
        block.style.cssText = 'margin-bottom:8px;border-left:3px solid '+color+';padding-left:10px;';
        block.innerHTML =
          '<div style="color:'+color+';font-size:11px;font-weight:600;">'+
            icon+' '+r.router.name+' ('+r.router.ip+')</div>'+
          '<div style="color:#8ea3b0;font-family:monospace;font-size:11px;'+
            'white-space:pre-wrap;max-height:100px;overflow-y:auto;">'+
            output.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+
          '</div>';
        resDiv.appendChild(block);
      });
      TermLog._bodyEl.appendChild(resDiv);
      TermLog.scrollBottom();
    });
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
