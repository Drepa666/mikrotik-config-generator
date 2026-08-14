with open('terminal.js', 'r', encoding='utf-8') as f:
    c = f.read()

# Замінюємо блок підключення — додаємо протокол + порт
OLD = """'<div style="display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:8px;align-items:end;">' +
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
    '<button id="tm-connect" style="background:#5fd0a5;color:#082018;border:none;padding:9px 16px;border-radius:6px;cursor:pointer;font-weight:700;font-size:12px;white-space:nowrap;">🔌 Підключити</button>' +
    '</div>' +"""

NEW = """'<div style="display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:8px;margin-bottom:8px;">' +
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
    '<select id="tm-ssh-proto" style="' + tmInputSm() + 'flex:1;" onchange="tmUpdatePort(this,\'tm-ssh-port\')">' +
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
    '<select id="tm-winbox-proto" style="' + tmInputSm() + 'flex:1;" onchange="tmUpdatePort(this,\'tm-winbox-port\')">' +
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
    '<select id="tm-api-proto" style="' + tmInputSm() + 'flex:1;" onchange="tmUpdatePort(this,\'tm-api-port\')">' +
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
    '<select id="tm-ftp-proto" style="' + tmInputSm() + 'flex:1;" onchange="tmUpdatePort(this,\'tm-ftp-port\')">' +
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
    '<select id="tm-telnet-proto" style="' + tmInputSm() + 'flex:1;" onchange="tmUpdatePort(this,\'tm-telnet-port\')">' +
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
    '<select id="tm-www-proto" style="' + tmInputSm() + 'flex:1;" onchange="tmUpdatePort(this,\'tm-www-port\')">' +
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
    '</div>' +"""

if OLD in c:
    c = c.replace(OLD, NEW)
    print('OK: порти додані!')
else:
    print('WARN: блок не знайдено точно')

# Додаємо tmInputSm() helper
OLD_HELPER = """  function tmInput() {
    return 'background:#0d1a24;border:1px solid #2a3b48;color:#e6edf3;padding:8px 10px;border-radius:6px;font-size:12px;width:100%;box-sizing:border-box;';
  }"""

NEW_HELPER = """  function tmInput() {
    return 'background:#0d1a24;border:1px solid #2a3b48;color:#e6edf3;padding:8px 10px;border-radius:6px;font-size:12px;width:100%;box-sizing:border-box;';
  }

  function tmInputSm() {
    return 'background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:5px 7px;border-radius:5px;font-size:11px;box-sizing:border-box;';
  }

  /* Глобальна функція для onchange в select */
  window.tmUpdatePort = function(selectEl, portId) {
    var portEl = document.getElementById(portId);
    if (portEl) portEl.value = selectEl.value;
  };"""

if OLD_HELPER in c:
    c = c.replace(OLD_HELPER, NEW_HELPER)
    print('OK: tmInputSm + tmUpdatePort додані!')

# Додаємо логіку кнопок після initTerminal або перед закриттям
OLD_CLOSE = """  document.getElementById('tm-close').addEventListener('click', function() {
    modal.style.display = 'none';
  });"""

NEW_CLOSE = """  document.getElementById('tm-close').addEventListener('click', function() {
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
  }"""

if OLD_CLOSE in c:
    c = c.replace(OLD_CLOSE, NEW_CLOSE)
    print('OK: логіка портів додана!')

# Оновлюємо loadServices щоб викликав updatePortIndicators
OLD_LOAD = """      .catch(function(e) {
      document.getElementById('tm-services-list').innerHTML =
        '<div style="color:#e0665a;font-size:12px;">❌ ' + e.message + '</div>';
    });
  }

  document.getElementById('tm-refresh-services').addEventListener('click', loadServices);"""

NEW_LOAD = """      .catch(function(e) {
      document.getElementById('tm-services-list').innerHTML =
        '<div style="color:#e0665a;font-size:12px;">❌ ' + e.message + '</div>';
    });
  }

  document.getElementById('tm-refresh-services').addEventListener('click', loadServices);

  /* Перехоплюємо loadServices щоб оновлювати індикатори */
  var _origLoadServices = loadServices;
  loadServices = function() {
    fetch(PROXY + '/rest/ip/service', { method:'GET', headers:getHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(services) {
      updatePortIndicators(services);
    })
    .catch(function() {});
    _origLoadServices();
  };"""

if OLD_LOAD in c:
    c = c.replace(OLD_LOAD, NEW_LOAD)
    print('OK: loadServices оновлено!')

with open('terminal.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
print('terminal.js збережено!')