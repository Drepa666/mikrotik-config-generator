/* ============================================================
   terminal.js — Керування роутером + Термінал v1
   Patch 41 | MikroTik Config Generator
   ============================================================ */
'use strict';

var PROXY = 'http://localhost:8888';
  var sshConnected = false;
  var sshConn = { host:'192.168.88.1', port:22, user:'admin', password:'' };
  var cmdHistory = [];
  var historyIdx = -1;

function initTerminal() {

  /* ── Модальне вікно ── */
  var modal = document.createElement('div');
  modal.id = 'terminal-modal';
  modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9999;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;';

  var inner = document.createElement('div');
  inner.style.cssText = 'background:#16212c;border:1px solid #2a3b48;border-radius:12px;padding:24px;max-width:900px;width:100%;margin:auto;';

  inner.innerHTML =

    /* Шапка */
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">' +
    '<div>' +
    '<h3 style="margin:0;color:#5fd0a5;font-size:15px;">🖥️ Керування роутером</h3>' +
    '<div style="font-size:11px;color:#4a6070;margin-top:2px;">Підключення, термінал, керування сервісами</div>' +
    '</div>' +
    '<button id="tm-close" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:4px 14px;border-radius:6px;cursor:pointer;">✕</button>' +
    '</div>' +

    /* Підключення */
    '<div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;padding:14px;margin-bottom:16px;">' +
    '<div style="font-size:11px;color:#8ea3b0;margin-bottom:10px;font-weight:700;">🔌 Підключення</div>' +
    '<div style="display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:8px;margin-bottom:8px;">' +
    '<div>' +
    '<label style="font-size:11px;color:#8ea3b0;display:block;margin-bottom:4px;">IP роутера</label>' +
    '<input id="tm-ip" type="text" value="192.168.88.1" style="' + tmInput() + '">' +
    '</div>' +
    '<div>' +
    '<label style="font-size:11px;color:#8ea3b0;display:block;margin-bottom:4px;">Логін</label>' +
    '<input id="tm-user" type="text" value="admin" style="' + tmInput() + '">' +
    '</div>' +
    '<div>' +
    '<label style="font-size:11px;color:#8ea3b0;display:block;margin-bottom:4px;">Пароль</label>' +
    '<input id="tm-pass" type="password" placeholder="пароль" style="' + tmInput() + '">' +
    '</div>' +
    '<button id="tm-connect" style="background:#5fd0a5;color:#082018;border:none;padding:9px 16px;border-radius:6px;cursor:pointer;font-weight:700;font-size:12px;white-space:nowrap;align-self:end;">🔌 Підключити</button>' +
    '</div>' +

    /* Рядок протокол + порти */
    '<div style="background:#0a1520;border:1px solid #1c2a37;border-radius:8px;padding:12px;margin-top:8px;">' +
    '<div style="font-size:11px;color:#8ea3b0;margin-bottom:10px;font-weight:700;">🔌 Протоколи та порти</div>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;" id="tm-ports-grid">' +

    /* SSH */
    '<div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:6px;padding:8px;">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
    '<label style="font-size:11px;color:#5fd0a5;font-weight:700;">🔒 SSH</label>' +
    '<div id="tm-ssh-indicator" style="width:8px;height:8px;border-radius:50%;background:#4a6070;"></div>' +
    '</div>' +
    '<div style="display:flex;gap:4px;">' +
    '<select id="tm-ssh-proto" style="' + tmInputSm() + 'flex:1;" onchange="tmUpdatePort(this,&apos;tm-ssh-port&apos;)">' +
    '<option value="22">ssh</option>' +
    '</select>' +
    '<input id="tm-ssh-port" type="number" value="22" min="1" max="65535" style="' + tmInputSm() + 'width:70px;" title="SSH порт">' +
    '</div>' +
    '</div>' +

    /* Winbox */
    '<div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:6px;padding:8px;">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
    '<label style="font-size:11px;color:#5b9bd5;font-weight:700;">📦 Winbox</label>' +
    '<div id="tm-winbox-indicator" style="width:8px;height:8px;border-radius:50%;background:#4a6070;"></div>' +
    '</div>' +
    '<div style="display:flex;gap:4px;">' +
    '<select id="tm-winbox-proto" style="' + tmInputSm() + 'flex:1;" onchange="tmUpdatePort(this,&apos;tm-winbox-port&apos;)">' +
    '<option value="8291">winbox</option>' +
    '</select>' +
    '<input id="tm-winbox-port" type="number" value="8291" min="1" max="65535" style="' + tmInputSm() + 'width:70px;">' +
    '</div>' +
    '</div>' +

    /* HTTP API */
    '<div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:6px;padding:8px;">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
    '<label style="font-size:11px;color:#e6b35a;font-weight:700;">🌐 REST API</label>' +
    '<div id="tm-api-indicator" style="width:8px;height:8px;border-radius:50%;background:#4a6070;"></div>' +
    '</div>' +
    '<div style="display:flex;gap:4px;">' +
    '<select id="tm-api-proto" style="' + tmInputSm() + 'flex:1;" onchange="tmUpdatePort(this,&apos;tm-api-port&apos;)">' +
    '<option value="80">http</option>' +
    '<option value="443">https</option>' +
    '</select>' +
    '<input id="tm-api-port" type="number" value="80" min="1" max="65535" style="' + tmInputSm() + 'width:70px;">' +
    '</div>' +
    '</div>' +

    /* FTP */
    '<div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:6px;padding:8px;">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
    '<label style="font-size:11px;color:#9b87f5;font-weight:700;">📁 FTP</label>' +
    '<div id="tm-ftp-indicator" style="width:8px;height:8px;border-radius:50%;background:#4a6070;"></div>' +
    '</div>' +
    '<div style="display:flex;gap:4px;">' +
    '<select id="tm-ftp-proto" style="' + tmInputSm() + 'flex:1;" onchange="tmUpdatePort(this,&apos;tm-ftp-port&apos;)">' +
    '<option value="21">ftp</option>' +
    '</select>' +
    '<input id="tm-ftp-port" type="number" value="21" min="1" max="65535" style="' + tmInputSm() + 'width:70px;">' +
    '</div>' +
    '</div>' +

    /* Telnet */
    '<div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:6px;padding:8px;">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
    '<label style="font-size:11px;color:#e0665a;font-weight:700;">📟 Telnet</label>' +
    '<div id="tm-telnet-indicator" style="width:8px;height:8px;border-radius:50%;background:#4a6070;"></div>' +
    '</div>' +
    '<div style="display:flex;gap:4px;">' +
    '<select id="tm-telnet-proto" style="' + tmInputSm() + 'flex:1;" onchange="tmUpdatePort(this,&apos;tm-telnet-port&apos;)">' +
    '<option value="23">telnet</option>' +
    '</select>' +
    '<input id="tm-telnet-port" type="number" value="23" min="1" max="65535" style="' + tmInputSm() + 'width:70px;">' +
    '</div>' +
    '</div>' +

    /* WWW */
    '<div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:6px;padding:8px;">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
    '<label style="font-size:11px;color:#5fd0a5;font-weight:700;">🌍 WWW</label>' +
    '<div id="tm-www-indicator" style="width:8px;height:8px;border-radius:50%;background:#4a6070;"></div>' +
    '</div>' +
    '<div style="display:flex;gap:4px;">' +
    '<select id="tm-www-proto" style="' + tmInputSm() + 'flex:1;" onchange="tmUpdatePort(this,&apos;tm-www-port&apos;)">' +
    '<option value="80">http</option>' +
    '<option value="443">https</option>' +
    '</select>' +
    '<input id="tm-www-port" type="number" value="80" min="1" max="65535" style="' + tmInputSm() + 'width:70px;">' +
    '</div>' +
    '</div>' +

    '</div>' +

    /* Кнопки дій */
    '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">' +
    '<button id="tm-apply-ports" style="background:#5b9bd5;color:#fff;border:none;padding:7px 16px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">✅ Застосувати порти</button>' +
    '<button id="tm-reset-ports" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;">🔄 Скинути до стандартних</button>' +
    '<div id="tm-ports-status" style="font-size:11.5px;line-height:32px;color:#4a6070;"></div>' +
    '</div>' +
    '</div>' +
    '<div id="tm-conn-status" style="margin-top:8px;font-size:11.5px;color:#4a6070;"></div>' +
    '</div>' +

    /* Таби */
    '<div style="display:flex;gap:6px;margin-bottom:16px;border-bottom:1px solid #2a3b48;padding-bottom:12px;">' +
    '<button class="tm-tab-btn" data-tab="services" style="background:#5fd0a5;color:#082018;border:none;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">⚙️ Сервіси</button>' +
    '<button class="tm-tab-btn" data-tab="terminal" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;">💻 Термінал</button>' +
    '<button class="tm-tab-btn" data-tab="scheduler" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;">📅 Scheduler</button>' +
    '<button class="tm-tab-btn" data-tab="scripts" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;">📜 Скрипти</button>' +
    '</div>' +

    /* ── TAB: СЕРВІСИ ── */
    '<div id="tm-tab-services">' +
    '<div style="font-size:11px;color:#4a6070;margin-bottom:12px;">Вмикай/вимикай сервіси роутера одним кліком</div>' +
    '<div id="tm-services-list" style="display:grid;gap:8px;">' +
    '<div style="color:#4a6070;font-size:12px;">🔌 Підключись до роутера щоб побачити сервіси</div>' +
    '</div>' +
    '<div style="margin-top:14px;display:flex;gap:8px;">' +
    '<button id="tm-refresh-services" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:8px 14px;border-radius:6px;cursor:pointer;font-size:12px;">🔄 Оновити</button>' +
    '</div>' +
    '</div>' +

    /* ── TAB: ТЕРМІНАЛ ── */
    '<div id="tm-tab-terminal" style="display:none;">' +
    '<div style="background:#060d14;border:1px solid #1c2a37;border-radius:8px;padding:4px;">' +
    '<div id="tm-output" style="font-family:monospace;font-size:12px;color:#c9e8d8;padding:10px;min-height:300px;max-height:400px;overflow-y:auto;white-space:pre-wrap;word-break:break-all;">' +
    '<span style="color:#5fd0a5;">MikroTik Terminal Ready</span>\n' +
    '<span style="color:#4a6070;">Введи команду нижче і натисни Enter або ▶️</span>\n\n' +
    '</div>' +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-top:10px;">' +
    '<span style="color:#5fd0a5;font-family:monospace;font-size:13px;line-height:36px;">[admin@MikroTik] ></span>' +
    '<input id="tm-cmd" type="text" placeholder="введи команду RouterOS..." style="' + tmInput() + 'flex:1;font-family:monospace;" autocomplete="off">' +
    '<button id="tm-run" style="background:#5fd0a5;color:#082018;border:none;padding:9px 16px;border-radius:6px;cursor:pointer;font-weight:700;font-size:13px;">▶️</button>' +
    '<button id="tm-clear" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:9px 12px;border-radius:6px;cursor:pointer;font-size:12px;">🗑️</button>' +
    '</div>' +
    '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">' +
    '<span style="font-size:11px;color:#4a6070;line-height:24px;">Швидкі:</span>' +
    tmQuickBtn('/system identity print') +
    tmQuickBtn('/system resource print') +
    tmQuickBtn('/ip address print') +
    tmQuickBtn('/interface print') +
    tmQuickBtn('/log print') +
    tmQuickBtn('/system script print') +
    tmQuickBtn('/system scheduler print') +
    '</div>' +
    '</div>' +

    /* ── TAB: SCHEDULER ── */
    '<div id="tm-tab-scheduler" style="display:none;">' +
    '<div style="font-size:11px;color:#4a6070;margin-bottom:12px;">Керуй розкладом автоматичних задач</div>' +
    '<div id="tm-sched-list" style="display:grid;gap:8px;">' +
    '<div style="color:#4a6070;font-size:12px;">🔌 Підключись до роутера</div>' +
    '</div>' +
    '<div style="margin-top:12px;display:flex;gap:8px;">' +
    '<button id="tm-refresh-sched" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:8px 14px;border-radius:6px;cursor:pointer;font-size:12px;">🔄 Оновити</button>' +
    '</div>' +
    '</div>' +

    /* ── TAB: СКРИПТИ ── */
    '<div id="tm-tab-scripts" style="display:none;">' +
    '<div style="font-size:11px;color:#4a6070;margin-bottom:12px;">Керуй скриптами на роутері</div>' +
    '<div id="tm-scripts-list" style="display:grid;gap:8px;">' +
    '<div style="color:#4a6070;font-size:12px;">🔌 Підключись до роутера</div>' +
    '</div>' +
    '<div style="margin-top:12px;display:flex;gap:8px;">' +
    '<button id="tm-refresh-scripts" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:8px 14px;border-radius:6px;cursor:pointer;font-size:12px;">🔄 Оновити</button>' +
    '</div>' +
    '</div>';

  modal.appendChild(inner);
  document.body.appendChild(modal);

  /* ── Helpers ── */
  function tmInput() {
    return 'background:#0d1a24;border:1px solid #2a3b48;color:#e6edf3;padding:8px 10px;border-radius:6px;font-size:12px;width:100%;box-sizing:border-box;';
  }

  function tmInputSm() {
    return 'background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:5px 7px;border-radius:5px;font-size:11px;box-sizing:border-box;';
  }

  /* Глобальна функція для onchange в select */
  window.tmUpdatePort = function(selectEl, portId) {
    var portEl = document.getElementById(portId);
    if (portEl) portEl.value = selectEl.value;
  };

  function tmQuickBtn(cmd) {
    return '<button class="tm-quick" data-cmd="' + cmd + '" style="background:#0d1a24;border:1px solid #2a3b48;color:#5b9bd5;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:10.5px;font-family:monospace;">' + cmd + '</button>';
  }

  function getHeaders() {
    var user = document.getElementById('tm-user').value.trim() || 'admin';
    var pass = document.getElementById('tm-pass').value || '';
    var ip   = document.getElementById('tm-ip').value.trim() || '192.168.88.1';
    return {
      'Content-Type':   'application/json',
      'Authorization':  'Basic ' + btoa(user + ':' + pass),
      'X-Router-Host':  ip,
      'X-Router-Port':  '80',
      'X-Router-Proto': 'http',
    };
  }

  function setConnStatus(msg, color) {
    var el = document.getElementById('tm-conn-status');
    el.textContent = msg;
    el.style.color = color || '#8ea3b0';
  }

  function appendOutput(text, color) {
    var out = document.getElementById('tm-output');
    var span = document.createElement('span');
    span.style.color = color || '#c9e8d8';
    span.textContent = text + '\n';
    out.appendChild(span);
    out.scrollTop = out.scrollHeight;
  }

  /* ── Закрити ── */
  document.getElementById('tm-close').addEventListener('click', function() {
    modal.style.display = 'none';
  });

  /* ── Порти дефолти ── */
  var DEFAULT_PORTS = {
    ssh:    22,
    winbox: 8291,
    api:    80,
    ftp:    21,
    telnet: 23,
    www:    80,
  };

  /* Скинути до стандартних */
  document.getElementById('tm-reset-ports').addEventListener('click', function() {
    document.getElementById('tm-ssh-port').value    = DEFAULT_PORTS.ssh;
    document.getElementById('tm-winbox-port').value = DEFAULT_PORTS.winbox;
    document.getElementById('tm-api-port').value    = DEFAULT_PORTS.api;
    document.getElementById('tm-ftp-port').value    = DEFAULT_PORTS.ftp;
    document.getElementById('tm-telnet-port').value = DEFAULT_PORTS.telnet;
    document.getElementById('tm-www-port').value    = DEFAULT_PORTS.www;
    document.getElementById('tm-api-proto').value   = '80';
    document.getElementById('tm-www-proto').value   = '80';
    document.getElementById('tm-ports-status').textContent = '✅ Скинуто до стандартних';
    setTimeout(function() {
      document.getElementById('tm-ports-status').textContent = '';
    }, 2000);
  });

  /* Застосувати порти — відправляє на роутер */
  document.getElementById('tm-apply-ports').addEventListener('click', function() {
    if (!connected) {
      document.getElementById('tm-ports-status').style.color = '#e0665a';
      document.getElementById('tm-ports-status').textContent = '❌ Спочатку підключись!';
      return;
    }

    var ports = [
      { svc:'ssh',    port: document.getElementById('tm-ssh-port').value },
      { svc:'winbox', port: document.getElementById('tm-winbox-port').value },
      { svc:'www',    port: document.getElementById('tm-www-port').value },
      { svc:'ftp',    port: document.getElementById('tm-ftp-port').value },
      { svc:'telnet', port: document.getElementById('tm-telnet-port').value },
      { svc:'api',    port: document.getElementById('tm-api-port').value },
    ];

    var statusEl = document.getElementById('tm-ports-status');
    statusEl.style.color = '#5b9bd5';
    statusEl.textContent = '⏳ Застосовую...';

    var hdrs = getHeaders();

    /* Отримуємо список сервісів щоб знайти їх ID */
    fetch(PROXY + '/rest/ip/service', { method:'GET', headers:hdrs })
    .then(function(r) { return r.json(); })
    .then(function(services) {
      var promises = ports.map(function(item) {
        var svc = services.find(function(s) { return s.name === item.svc; });
        if (!svc) return Promise.resolve();

        return fetch(PROXY + '/rest/ip/service/' + svc['.id'], {
          method: 'PATCH',
          headers: hdrs,
          body: JSON.stringify({ port: parseInt(item.port) }),
        })
        .then(function(r) {
          /* Оновлюємо індикатор */
          var ind = document.getElementById('tm-' + item.svc + '-indicator');
          if (ind) {
            ind.style.background = r.ok ? '#5fd0a5' : '#e0665a';
            ind.title = r.ok ? 'Порт змінено: ' + item.port : 'Помилка';
          }
          appendOutput(
            (r.ok ? '✅ ' : '❌ ') + item.svc + ' → порт: ' + item.port,
            r.ok ? '#5fd0a5' : '#e0665a'
          );
          return r;
        });
      });

      return Promise.all(promises);
    })
    .then(function() {
      statusEl.style.color = '#5fd0a5';
      statusEl.textContent = '✅ Порти оновлено!';
      /* Оновлюємо список сервісів */
      loadServices();
      /* Оновлюємо SSH порт в conn */
      sshConn.port = parseInt(document.getElementById('tm-ssh-port').value) || 22;
      setTimeout(function() { statusEl.textContent = ''; }, 3000);
    })
    .catch(function(e) {
      statusEl.style.color = '#e0665a';
      statusEl.textContent = '❌ ' + e.message;
    });
  });

  /* Синхронізуємо SSH порт для терміналу при зміні */
  var sshPortInput = document.getElementById('tm-ssh-port');
  if (sshPortInput) {
    sshPortInput.addEventListener('change', function() {
      sshConn.port = parseInt(this.value) || 22;
      var sshPortInTerminal = document.getElementById('tm-ssh-port');
      if (sshPortInTerminal) sshPortInTerminal.value = this.value;
    });
  }

  /* Після підключення — оновлюємо індикатори реальними портами */
  function updatePortIndicators(services) {
    var map = {
      ssh:    'tm-ssh-indicator',
      winbox: 'tm-winbox-indicator',
      www:    'tm-www-indicator',
      ftp:    'tm-ftp-indicator',
      telnet: 'tm-telnet-indicator',
      api:    'tm-api-indicator',
    };
    var portMap = {
      ssh:    'tm-ssh-port',
      winbox: 'tm-winbox-port',
      www:    'tm-www-port',
      ftp:    'tm-ftp-port',
      telnet: 'tm-telnet-port',
      api:    'tm-api-port',
    };

    services.forEach(function(svc) {
      var indId  = map[svc.name];
      var portId = portMap[svc.name];
      var isDisabled = svc.disabled === 'true' || svc.disabled === true;

      if (indId) {
        var el = document.getElementById(indId);
        if (el) {
          el.style.background = isDisabled ? '#e0665a' : '#5fd0a5';
          el.title = isDisabled ? 'Вимкнено' : 'Порт: ' + (svc.port || '—');
        }
      }
      if (portId && svc.port) {
        var portEl = document.getElementById(portId);
        if (portEl) portEl.value = svc.port;
      }
    });
  }
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.style.display = 'none';
  });

  /* ── Таби ── */
  inner.querySelectorAll('.tm-tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      inner.querySelectorAll('.tm-tab-btn').forEach(function(b) {
        b.style.background = 'transparent';
        b.style.color      = '#8ea3b0';
        b.style.border     = '1px solid #2a3b48';
      });
      this.style.background = '#5fd0a5';
      this.style.color      = '#082018';
      this.style.border     = 'none';
      ['services','terminal','scheduler','scripts'].forEach(function(t) {
        var el = document.getElementById('tm-tab-' + t);
        if (el) el.style.display = t === btn.getAttribute('data-tab') ? 'block' : 'none';
      });
    });
  });

  /* ══════════════════════════════════════════════
     ПІДКЛЮЧЕННЯ
  ══════════════════════════════════════════════ */
  var connected = false;

  document.getElementById('tm-connect').addEventListener('click', function() {
    var btn = this;
    btn.textContent = '⏳';
    btn.disabled = true;
    setConnStatus('Підключаюсь...', '#5b9bd5');

    fetch(PROXY + '/rest/system/identity', { method:'GET', headers:getHeaders() })
    .then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function(d) {
      connected = true;
      btn.textContent   = '✅ ' + (d.name || 'MikroTik');
      btn.style.background = '#0d2a1a';
      btn.style.color   = '#5fd0a5';
      btn.style.border  = '1px solid #5fd0a5';
      setConnStatus('✅ Підключено до: ' + (d.name || 'MikroTik') + ' (' + document.getElementById('tm-ip').value + ')', '#5fd0a5');
      appendOutput('[' + new Date().toLocaleTimeString() + '] Підключено до ' + (d.name || 'MikroTik'), '#5fd0a5');
      
      /* SSH auto-connect */
      sshConn.host     = document.getElementById('tm-ip').value.trim()   || '192.168.88.1';
      sshConn.user     = document.getElementById('tm-user').value.trim() || 'admin';
      sshConn.password = document.getElementById('tm-pass').value        || '';
      sshConn.port     = 22;

      fetch('http://localhost:8888/ssh/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: sshConn.host, port: sshConn.port,
          user: sshConn.user, password: sshConn.password,
          command: ':put [/system identity get name]',
        }),
      })
      .then(function(r) { return r.json(); })
      .then(function(sd) {
        if (sd.ok) {
          sshConnected = true;
          appendOutput('\n✅ SSH підключено! Термінал готовий!\n', '#5fd0a5');
          var prompt = document.getElementById('tm-prompt');
          if (prompt) prompt.textContent = '[' + sshConn.user + '@MikroTik] >';
          var sshBtn = document.getElementById('tm-ssh-connect');
          if (sshBtn) { sshBtn.textContent = '✅ SSH OK'; sshBtn.style.background = '#0d2a1a'; sshBtn.style.color = '#5fd0a5'; }
          var banner = document.getElementById('tm-ssh-status-text');
          if (banner) { banner.textContent = '🟢 SSH: ' + sshConn.host; banner.style.color = '#5fd0a5'; }
        } else {
          appendOutput('\n⚠️ SSH: ' + (sd.error||'помилка') + '\n', '#e6b35a');
        }
      })
      .catch(function(e) {
        appendOutput('\n⚠️ SSH: ' + e.message + '\n', '#e6b35a');
      });

      
      /* SSH auto-connect */
      sshConn.host     = document.getElementById('tm-ip').value.trim()   || '192.168.88.1';
      sshConn.user     = document.getElementById('tm-user').value.trim() || 'admin';
      sshConn.password = document.getElementById('tm-pass').value        || '';
      sshConn.port     = 22;

      fetch('http://localhost:8888/ssh/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: sshConn.host, port: sshConn.port,
          user: sshConn.user, password: sshConn.password,
          command: ':put [/system identity get name]',
        }),
      })
      .then(function(r) { return r.json(); })
      .then(function(sd) {
        if (sd.ok) {
          sshConnected = true;
          appendOutput('\n✅ SSH підключено! Термінал готовий!\n', '#5fd0a5');
          var prompt = document.getElementById('tm-prompt');
          if (prompt) prompt.textContent = '[' + sshConn.user + '@MikroTik] >';
          var sshBtn = document.getElementById('tm-ssh-connect');
          if (sshBtn) { sshBtn.textContent = '✅ SSH OK'; sshBtn.style.background = '#0d2a1a'; sshBtn.style.color = '#5fd0a5'; }
          var banner = document.getElementById('tm-ssh-status-text');
          if (banner) { banner.textContent = '🟢 SSH: ' + sshConn.host; banner.style.color = '#5fd0a5'; }
        } else {
          appendOutput('\n⚠️ SSH: ' + (sd.error||'помилка') + '\n', '#e6b35a');
        }
      })
      .catch(function(e) {
        appendOutput('\n⚠️ SSH: ' + e.message + '\n', '#e6b35a');
      });

      loadServices();
      loadScheduler();
      loadScripts();
    })
    .catch(function(e) {
      connected = false;
      btn.textContent   = '❌ Помилка';
      btn.style.background = '#2a0d0a';
      btn.style.color   = '#e0665a';
      btn.style.border  = '1px solid #e0665a';
      setConnStatus('❌ ' + e.message + ' — Запусти proxy.py', '#e0665a');
    })
    .finally(function() {
      btn.disabled = false;
    });
  });

  /* ══════════════════════════════════════════════
     СЕРВІСИ — вмикати/вимикати
  ══════════════════════════════════════════════ */
  function loadServices() {
    fetch(PROXY + '/rest/ip/service', { method:'GET', headers:getHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(services) {
      var list = document.getElementById('tm-services-list');
      list.innerHTML = '';

      services.forEach(function(svc) {
        var isDisabled = svc.disabled === 'true' || svc.disabled === true;
        var color = isDisabled ? '#e0665a' : '#5fd0a5';
        var icon  = isDisabled ? '🔴' : '🟢';

        var row = document.createElement('div');
        row.style.cssText = 'display:grid;grid-template-columns:1fr auto auto auto;gap:8px;align-items:center;background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;padding:10px 14px;';

        row.innerHTML =
          '<div>' +
          '<span style="color:#e6edf3;font-size:12px;font-weight:700;">' + icon + ' ' + svc.name + '</span>' +
          '<span style="color:#4a6070;font-size:11px;margin-left:10px;">порт: ' + (svc.port || '—') + '</span>' +
          '</div>' +
          '<span style="font-size:11px;color:' + color + ';">' + (isDisabled ? 'Вимкнено' : 'Увімкнено') + '</span>' +
          '<button class="svc-toggle" data-id="' + svc['.id'] + '" data-disabled="' + isDisabled + '" data-name="' + svc.name + '" style="background:' + (isDisabled ? '#1a2a0d' : '#2a0d0a') + ';border:1px solid ' + (isDisabled ? '#5fd0a5' : '#e0665a') + ';color:' + (isDisabled ? '#5fd0a5' : '#e0665a') + ';padding:5px 12px;border-radius:6px;cursor:pointer;font-size:11px;">' +
          (isDisabled ? '▶️ Увімкнути' : '⏸️ Вимкнути') + '</button>';

        list.appendChild(row);
      });

      /* Кнопки toggle */
      list.querySelectorAll('.svc-toggle').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var id       = this.getAttribute('data-id');
          var disabled = this.getAttribute('data-disabled') === 'true';
          var name     = this.getAttribute('data-name');
          var b        = this;
          b.textContent = '⏳';
          b.disabled = true;

          fetch(PROXY + '/rest/ip/service/' + id, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ disabled: !disabled }),
          })
          .then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            appendOutput('[' + new Date().toLocaleTimeString() + '] ' + name + ' → ' + (disabled ? 'увімкнено' : 'вимкнено'), '#5fd0a5');
            loadServices();
          })
          .catch(function(e) {
            appendOutput('❌ Помилка: ' + e.message, '#e0665a');
            b.disabled = false;
          });
        });
      });
    })
    .catch(function(e) {
      document.getElementById('tm-services-list').innerHTML =
        '<div style="color:#e0665a;font-size:12px;">❌ ' + e.message + '</div>';
    });
  }

  document.getElementById('tm-refresh-services').addEventListener('click', loadServices);

  /* ══════════════════════════════════════════════
     ТЕРМІНАЛ — виконання команд
  ══════════════════════════════════════════════ */
    function runCommand(cmd) {
    if (!cmd || !cmd.trim()) return;

    cmdHistory.unshift(cmd);
    if (cmdHistory.length > 100) cmdHistory.pop();
    historyIdx = -1;

    appendOutput('[admin@MikroTik] > ' + cmd, '#8ea3b0');

    if (!sshConnected) {
      appendOutput('\u274c SSH не пiдключено! Натисни кнопку SSH пiдключити\n', '#e0665a');
      return;
    }

    var runBtn = document.getElementById('tm-run');
    if (runBtn) { runBtn.textContent = '\u23f3'; runBtn.disabled = true; }

    /* Таймаут залежно від команди */
    var cmdTimeout = 10000;
    var longCmds = ['ip-scan', 'flood-ping', 'bandwidth-test', 'torch', 'packet-sniffer'];
    longCmds.forEach(function(lc) {
      if (cmd.indexOf(lc) !== -1) cmdTimeout = 15000;
    });

    /* AbortController для скасування */
    var controller = new AbortController();
    var timeoutId  = setTimeout(function() {
      controller.abort();
      appendOutput('\n⚠️ Таймаут — команда перервана після ' + (cmdTimeout/1000) + 's', '#e6b35a');
    }, cmdTimeout + 2000);

    /* Показуємо Stop кнопку */
    var stopBtn = document.getElementById('tm-stop');
    if (stopBtn) {
      stopBtn.style.display = 'inline-block';
      stopBtn.onclick = function() {
        controller.abort();
        clearTimeout(timeoutId);
        appendOutput('\n⏹ Команду зупинено вручну', '#e6b35a');
        if (runBtn) { runBtn.textContent = '\u25b6'; runBtn.disabled = false; }
        if (stopBtn) stopBtn.style.display = 'none';
      };
    }

    fetch('http://localhost:8888/ssh/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host:     sshConn.host,
        port:     sshConn.port,
        user:     sshConn.user,
        password: sshConn.password,
        command:  cmd.trim(),
        timeout:  Math.floor(cmdTimeout / 1000),
      }),
      signal: controller.signal,
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      clearTimeout(timeoutId);
      if (!d.ok) throw new Error(d.error || 'SSH помилка');

      var output = (d.output || '').trimEnd();
      var err    = (d.error  || '').trimEnd();

      if (output) {
        output.split('\n').forEach(function(line) {
          var color = '#c9e8d8';
          if (/^Flags:|^Columns:/i.test(line))     color = '#4a8070';
          if (/invalid|failed|error/i.test(line))  color = '#e0665a';
          if (/warning/i.test(line))               color = '#e6b35a';
          if (/timeout|перервана/i.test(line))     color = '#e6b35a';
          appendOutput(line, color);
        });
      }

      if (err && err.trim()) {
        err.split('\n').forEach(function(line) {
          if (line.trim()) appendOutput(line, '#e0665a');
        });
      }

      if (!output && !err) appendOutput('(немає виводу)', '#4a6070');
      appendOutput('', '#4a6070');
    })
    .catch(function(e) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        appendOutput('⏹ Запит скасовано\n', '#e6b35a');
      } else {
        appendOutput('\u274c ' + e.message + '\n', '#e0665a');
      }
    })
    .finally(function() {
      clearTimeout(timeoutId);
      if (runBtn)  { runBtn.textContent = '\u25b6'; runBtn.disabled = false; }
      if (stopBtn) stopBtn.style.display = 'none';
    });
  }

  document.getElementById('tm-run').addEventListener('click', function() {
    var input = document.getElementById('tm-cmd');
    runCommand(input.value.trim());
    input.value = '';
  });

  document.getElementById('tm-cmd').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      runCommand(this.value.trim());
      this.value = '';
    }
  });

  document.getElementById('tm-clear').addEventListener('click', function() {
    var out = document.getElementById('tm-output');
    out.innerHTML = '<span style="color:#5fd0a5;">Terminal cleared\n\n</span>';
  });

  inner.addEventListener('click', function(e) {
    if (e.target.classList.contains('tm-quick')) {
      var cmd = e.target.getAttribute('data-cmd');
      document.getElementById('tm-cmd').value = cmd;
      runCommand(cmd);
    }
  });

  /* ══════════════════════════════════════════════
     SCHEDULER — вмикати/вимикати
  ══════════════════════════════════════════════ */
  function loadScheduler() {
    fetch(PROXY + '/rest/system/scheduler', { method:'GET', headers:getHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(scheds) {
      var list = document.getElementById('tm-sched-list');
      list.innerHTML = '';

      if (!scheds.length) {
        list.innerHTML = '<div style="color:#4a6070;font-size:12px;">📭 Немає schedulers</div>';
        return;
      }

      scheds.forEach(function(sched) {
        var isDisabled = sched.disabled === 'true' || sched.disabled === true;
        var color = isDisabled ? '#e0665a' : '#5fd0a5';
        var icon  = isDisabled ? '🔴' : '🟢';

        var row = document.createElement('div');
        row.style.cssText = 'background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;padding:12px 14px;';

        row.innerHTML =
          '<div style="display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center;">' +
          '<div>' +
          '<div style="color:#e6edf3;font-size:12px;font-weight:700;">' + icon + ' ' + sched.name + '</div>' +
          '<div style="color:#4a6070;font-size:11px;margin-top:3px;">' +
          '⏰ ' + (sched['start-time'] || '—') +
          ' | 📅 ' + (sched.interval || '—') +
          ' | ▶️ ' + (sched['on-event'] || '—') +
          '</div>' +
          '</div>' +
          '<span style="font-size:11px;color:' + color + ';">' + (isDisabled ? 'Вимкнено' : 'Увімкнено') + '</span>' +
          '<div style="display:flex;gap:6px;">' +
          '<button class="sched-toggle" data-id="' + sched['.id'] + '" data-disabled="' + isDisabled + '" data-name="' + sched.name + '" style="background:' + (isDisabled ? '#1a2a0d' : '#2a0d0a') + ';border:1px solid ' + (isDisabled ? '#5fd0a5' : '#e0665a') + ';color:' + (isDisabled ? '#5fd0a5' : '#e0665a') + ';padding:5px 10px;border-radius:6px;cursor:pointer;font-size:11px;">' +
          (isDisabled ? '▶️ Увімкнути' : '⏸️ Вимкнути') + '</button>' +
          '<button class="sched-run" data-event="' + (sched['on-event'] || '') + '" style="background:transparent;border:1px solid #5b9bd5;color:#5b9bd5;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:11px;">▶️ Run</button>' +
          '<button class="sched-delete" data-id="' + sched['.id'] + '" data-name="' + sched.name + '" style="background:transparent;border:1px solid #4a3030;color:#8a5050;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:11px;">🗑️</button>' +
          '</div>' +
          '</div>';

        list.appendChild(row);
      });

      /* Toggle scheduler */
      list.querySelectorAll('.sched-toggle').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var id       = this.getAttribute('data-id');
          var disabled = this.getAttribute('data-disabled') === 'true';
          var name     = this.getAttribute('data-name');
          this.textContent = '⏳';
          this.disabled = true;
          var b = this;

          fetch(PROXY + '/rest/system/scheduler/' + id, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ disabled: !disabled }),
          })
          .then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            appendOutput('[' + new Date().toLocaleTimeString() + '] Scheduler "' + name + '" → ' + (disabled ? 'увімкнено' : 'вимкнено'), '#5fd0a5');
            loadScheduler();
          })
          .catch(function(e) {
            appendOutput('❌ ' + e.message, '#e0665a');
            b.disabled = false;
          });
        });
      });

      /* Run script */
      list.querySelectorAll('.sched-run').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var scriptName = this.getAttribute('data-event');
          var b = this;
          b.textContent = '⏳';
          b.disabled = true;

          fetch(PROXY + '/rest/system/script', { method:'GET', headers:getHeaders() })
          .then(function(r) { return r.json(); })
          .then(function(scripts) {
            var sc = scripts.find(function(s) { return s.name === scriptName; });
            if (!sc) throw new Error('Скрипт "' + scriptName + '" не знайдено');
            return fetch(PROXY + '/rest/system/script/' + sc['.id'] + '/run', {
              method: 'POST', headers: getHeaders(),
            });
          })
          .then(function() {
            appendOutput('[' + new Date().toLocaleTimeString() + '] ▶️ Запущено: ' + scriptName, '#5fd0a5');
            b.textContent = '▶️ Run';
            b.disabled = false;
          })
          .catch(function(e) {
            appendOutput('❌ ' + e.message, '#e0665a');
            b.textContent = '▶️ Run';
            b.disabled = false;
          });
        });
      });

      /* Delete scheduler */
      list.querySelectorAll('.sched-delete').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var id   = this.getAttribute('data-id');
          var name = this.getAttribute('data-name');
          if (!confirm('Видалити scheduler "' + name + '"?')) return;
          var b = this;
          b.disabled = true;

          fetch(PROXY + '/rest/system/scheduler/' + id, {
            method: 'DELETE', headers: getHeaders(),
          })
          .then(function() {
            appendOutput('[' + new Date().toLocaleTimeString() + '] 🗑️ Видалено scheduler: ' + name, '#e6b35a');
            loadScheduler();
          })
          .catch(function(e) {
            appendOutput('❌ ' + e.message, '#e0665a');
            b.disabled = false;
          });
        });
      });
    })
    .catch(function(e) {
      document.getElementById('tm-sched-list').innerHTML =
        '<div style="color:#e0665a;font-size:12px;">❌ ' + e.message + '</div>';
    });
  }

  document.getElementById('tm-refresh-sched').addEventListener('click', loadScheduler);

  /* ══════════════════════════════════════════════
     СКРИПТИ
  ══════════════════════════════════════════════ */
  function loadScripts() {
    fetch(PROXY + '/rest/system/script', { method:'GET', headers:getHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(scripts) {
      var list = document.getElementById('tm-scripts-list');
      list.innerHTML = '';

      if (!scripts.length) {
        list.innerHTML = '<div style="color:#4a6070;font-size:12px;">📭 Немає скриптів</div>';
        return;
      }

      scripts.forEach(function(sc) {
        var row = document.createElement('div');
        row.style.cssText = 'background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;padding:12px 14px;';

        row.innerHTML =
          '<div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;">' +
          '<div>' +
          '<div style="color:#e6edf3;font-size:12px;font-weight:700;">📜 ' + sc.name + '</div>' +
          '<div style="color:#4a6070;font-size:11px;margin-top:3px;">' +
          (sc.comment ? '💬 ' + sc.comment + ' | ' : '') +
          'Запусків: ' + (sc['run-count'] || 0) +
          '</div>' +
          '</div>' +
          '<div style="display:flex;gap:6px;">' +
          '<button class="sc-run" data-id="' + sc['.id'] + '" data-name="' + sc.name + '" style="background:#1a2a0d;border:1px solid #5fd0a5;color:#5fd0a5;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:11px;">▶️ Run</button>' +
          '<button class="sc-delete" data-id="' + sc['.id'] + '" data-name="' + sc.name + '" style="background:transparent;border:1px solid #4a3030;color:#8a5050;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:11px;">🗑️</button>' +
          '</div>' +
          '</div>';

        list.appendChild(row);
      });

      list.querySelectorAll('.sc-run').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var id   = this.getAttribute('data-id');
          var name = this.getAttribute('data-name');
          var b = this;
          b.textContent = '⏳';
          b.disabled = true;

          fetch(PROXY + '/rest/system/script/' + id + '/run', {
            method: 'POST', headers: getHeaders(),
          })
          .then(function() {
            appendOutput('[' + new Date().toLocaleTimeString() + '] ▶️ Запущено: ' + name, '#5fd0a5');
          })
          .catch(function(e) {
            appendOutput('❌ ' + e.message, '#e0665a');
          })
          .finally(function() {
            b.textContent = '▶️ Run';
            b.disabled = false;
          });
        });
      });

      list.querySelectorAll('.sc-delete').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var id   = this.getAttribute('data-id');
          var name = this.getAttribute('data-name');
          if (!confirm('Видалити скрипт "' + name + '"?')) return;

          fetch(PROXY + '/rest/system/script/' + id, {
            method: 'DELETE', headers: getHeaders(),
          })
          .then(function() {
            appendOutput('🗑️ Видалено скрипт: ' + name, '#e6b35a');
            loadScripts();
          })
          .catch(function(e) {
            appendOutput('❌ ' + e.message, '#e0665a');
          });
        });
      });
    })
    .catch(function(e) {
      document.getElementById('tm-scripts-list').innerHTML =
        '<div style="color:#e0665a;font-size:12px;">❌ ' + e.message + '</div>';
    });
  }

  document.getElementById('tm-refresh-scripts').addEventListener('click', loadScripts);

  /* ── Кнопка в btnbar ── */
  function addBtn() {
    if (document.getElementById('btn-terminal')) return true;
    var btn = document.createElement('button');
    btn.id        = 'btn-terminal';
    btn.className = 'sec';
    btn.textContent = '🖥️ Роутер';
    btn.title = 'Керування роутером — сервіси, термінал, scheduler';
    btn.addEventListener('click', function() {
      modal.style.display = 'flex';
    });
    var bar = document.querySelector('.btnbar');
    if (bar) { bar.appendChild(btn); return true; }
    return false;
  }

  if (!addBtn()) {
    var t = setInterval(function() { if (addBtn()) clearInterval(t); }, 300);
  }

  console.log('[terminal] v1 ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTerminal);
} else {
  initTerminal();
}