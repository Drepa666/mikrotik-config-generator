with open('terminal.js', 'r', encoding='utf-8') as f:
    c = f.read()

# Замінюємо SSH підключення + runCommand
OLD = """  var PROXY = 'http://localhost:8888';"""

NEW = """  var PROXY   = 'http://localhost:8888';
  var sshConn = { host:'192.168.88.1', port:22, user:'admin', password:'' };
  var cmdHistory = [];
  var historyIdx = -1;"""

c = c.replace(OLD, NEW)

# Замінюємо блок термінала на повноцінний
OLD_TERM = """    /* ── TAB: ТЕРМІНАЛ ── */
    '<div id="tm-tab-terminal" style="display:none;">' +
    '<div style="background:#060d14;border:1px solid #1c2a37;border-radius:8px;padding:4px;">' +
    '<div id="tm-output" style="font-family:monospace;font-size:12px;color:#c9e8d8;padding:10px;min-height:300px;max-height:400px;overflow-y:auto;white-space:pre-wrap;word-break:break-all;">' +
    '<span style="color:#5fd0a5;">MikroTik Terminal Ready</span>\\n' +
    '<span style="color:#4a6070;">Введи команду нижче і натисни Enter або ▶️</span>\\n\\n' +
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
    '</div>' +"""

NEW_TERM = """    /* ── TAB: ТЕРМІНАЛ ── */
    '<div id="tm-tab-terminal" style="display:none;">' +

    /* SSH статус */
    '<div id="tm-ssh-banner" style="background:#0d2a1a;border:1px solid #5fd0a533;border-radius:8px;padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;">' +
    '<span id="tm-ssh-status-text" style="font-size:12px;color:#4a6070;">🔴 SSH не підключено</span>' +
    '<div style="display:flex;gap:6px;">' +
    '<input id="tm-ssh-port" type="number" value="22" placeholder="SSH Port" style="background:#0d1a24;border:1px solid #2a3b48;color:#e6edf3;padding:5px 8px;border-radius:6px;font-size:11px;width:70px;">' +
    '<button id="tm-ssh-connect" style="background:#5fd0a5;color:#082018;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:700;">SSH підключити</button>' +
    '</div>' +
    '</div>' +

    /* Термінал */
    '<div style="background:#060d14;border:1px solid #1c2a37;border-radius:8px;overflow:hidden;">' +

    /* Заголовок терміналу */
    '<div style="background:#0d1a24;border-bottom:1px solid #1c2a37;padding:6px 12px;display:flex;align-items:center;gap:8px;">' +
    '<span style="width:10px;height:10px;border-radius:50%;background:#e0665a;display:inline-block;"></span>' +
    '<span style="width:10px;height:10px;border-radius:50%;background:#e6b35a;display:inline-block;"></span>' +
    '<span style="width:10px;height:10px;border-radius:50%;background:#5fd0a5;display:inline-block;"></span>' +
    '<span style="font-size:11px;color:#4a6070;margin-left:8px;font-family:monospace;">MikroTik RouterOS Terminal</span>' +
    '<button id="tm-clear" style="margin-left:auto;background:transparent;border:1px solid #2a3b48;color:#4a6070;padding:2px 8px;border-radius:4px;cursor:pointer;font-size:10px;">Очистити</button>' +
    '</div>' +

    /* Вивід */
    '<div id="tm-output" style="font-family:\\'Cascadia Code\\',\\'Fira Code\\',\\'Consolas\\',monospace;font-size:12px;color:#c9e8d8;padding:14px;min-height:340px;max-height:420px;overflow-y:auto;white-space:pre-wrap;word-break:break-all;line-height:1.6;">' +
    '<span style="color:#5fd0a5;">  __  __ _ _         _____    _ _  __\\n' +
    ' |  \\\\/  (_) | __   |_   _|__| | |/ /\\n' +
    " | |\\\\/| | | |/ /     | |/ _ \\\\ | ' / \\n" +
    ' | |  | | |   <      | |  __/ | . \\ \\n' +
    ' |_|  |_|_|_|\\\\_\\\\     |_|\\\\___|_|_|\\\\_\\\\\\n\\n</span>' +
    '<span style="color:#4a6070;">RouterOS Web Terminal | Patch 41\\n' +
    'Підключись через SSH щоб виконувати команди\\n\\n</span>' +
    '</div>' +

    /* Рядок вводу */
    '<div style="border-top:1px solid #1c2a37;padding:8px 12px;display:flex;align-items:center;gap:8px;">' +
    '<span id="tm-prompt" style="color:#5fd0a5;font-family:monospace;font-size:12px;white-space:nowrap;">[admin@MikroTik] ></span>' +
    '<input id="tm-cmd" type="text" placeholder="введи команду RouterOS..." style="background:transparent;border:none;color:#e6edf3;font-family:monospace;font-size:12px;flex:1;outline:none;" autocomplete="off" spellcheck="false">' +
    '<button id="tm-run" style="background:#5fd0a5;color:#082018;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:700;font-size:12px;">▶</button>' +
    '</div>' +

    '</div>' +

    /* Швидкі команди */
    '<div style="margin-top:10px;">' +
    '<div style="font-size:11px;color:#4a6070;margin-bottom:6px;">⚡ Швидкі команди:</div>' +
    '<div style="display:flex;gap:5px;flex-wrap:wrap;">' +
    tmQuickBtn('/system identity print') +
    tmQuickBtn('/system resource print') +
    tmQuickBtn('/ip address print') +
    tmQuickBtn('/interface print') +
    tmQuickBtn('/ip route print') +
    tmQuickBtn('/log print') +
    tmQuickBtn('/ip firewall filter print') +
    tmQuickBtn('/ip dhcp-server lease print') +
    tmQuickBtn('/system script print') +
    tmQuickBtn('/system scheduler print') +
    tmQuickBtn('/user active print') +
    tmQuickBtn('/file print') +
    tmQuickBtn('/interface wireless registration-table print') +
    tmQuickBtn('/ip neighbor print') +
    tmQuickBtn('/system reboot') +
    '</div>' +
    '</div>' +

    '</div>' +"""

c = c.replace(OLD_TERM, NEW_TERM)

# Замінюємо runCommand на SSH версію
OLD_RUN = """  document.getElementById('tm-run').addEventListener('click', function() {
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
    out.innerHTML = '<span style="color:#5fd0a5;">Terminal cleared\\n\\n</span>';
  });

  inner.addEventListener('click', function(e) {
    if (e.target.classList.contains('tm-quick')) {
      var cmd = e.target.getAttribute('data-cmd');
      document.getElementById('tm-cmd').value = cmd;
      runCommand(cmd);
    }
  });"""

NEW_RUN = """  /* ── SSH підключення ── */
  var sshConnected = false;

  document.getElementById('tm-ssh-connect').addEventListener('click', function() {
    var btn = this;
    btn.textContent = '⏳';
    btn.disabled = true;

    sshConn.host     = document.getElementById('tm-ip').value.trim()   || '192.168.88.1';
    sshConn.user     = document.getElementById('tm-user').value.trim() || 'admin';
    sshConn.password = document.getElementById('tm-pass').value        || '';
    sshConn.port     = parseInt(document.getElementById('tm-ssh-port').value) || 22;

    /* Тест SSH через proxy */
    fetch(PROXY + '/ssh/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host:     sshConn.host,
        port:     sshConn.port,
        user:     sshConn.user,
        password: sshConn.password,
        command:  ':put [/system identity get name]',
      }),
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (!d.ok) throw new Error(d.error);
      sshConnected = true;
      var routerName = (d.output || 'MikroTik').trim();
      document.getElementById('tm-ssh-status-text').innerHTML =
        '🟢 SSH підключено → <b>' + routerName + '</b> (' + sshConn.host + ':' + sshConn.port + ')';
      document.getElementById('tm-ssh-status-text').style.color = '#5fd0a5';
      document.getElementById('tm-prompt').textContent = '[' + sshConn.user + '@' + routerName + '] >';
      btn.textContent = '✅ Підключено';
      btn.style.background = '#0d2a1a';
      btn.style.color = '#5fd0a5';
      btn.style.border = '1px solid #5fd0a5';
      appendOutput('\\n✅ SSH підключено до ' + routerName + ' (' + sshConn.host + ')\\n', '#5fd0a5');
      document.getElementById('tm-cmd').focus();
    })
    .catch(function(e) {
      sshConnected = false;
      document.getElementById('tm-ssh-status-text').textContent = '🔴 Помилка: ' + e.message;
      document.getElementById('tm-ssh-status-text').style.color = '#e0665a';
      btn.textContent = '❌ Помилка';
      btn.style.background = '#2a0d0a';
      btn.style.color = '#e0665a';
      btn.style.border = '1px solid #e0665a';
      appendOutput('❌ SSH помилка: ' + e.message + '\\n', '#e0665a');
      setTimeout(function() {
        btn.textContent = 'SSH підключити';
        btn.style.cssText = 'background:#5fd0a5;color:#082018;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:700;';
        btn.disabled = false;
      }, 2000);
    });
  });

  /* ── Виконати через SSH ── */
  function runCommand(cmd) {
    if (!cmd || !cmd.trim()) return;

    /* Зберігаємо в історію */
    cmdHistory.unshift(cmd);
    if (cmdHistory.length > 100) cmdHistory.pop();
    historyIdx = -1;

    /* Небезпечні команди — підтвердження */
    var dangerous = ['reboot', 'shutdown', 'reset-configuration', 'format-drive'];
    var isDangerous = dangerous.some(function(d) { return cmd.indexOf(d) !== -1; });
    if (isDangerous && !confirm('⚠️ Небезпечна команда: "' + cmd + '"\\nПродовжити?')) {
      return;
    }

    appendOutput('[' + sshConn.user + '@MikroTik] > ' + cmd, '#8ea3b0');

    if (!sshConnected) {
      appendOutput('❌ Спочатку підключись через SSH!\\n', '#e0665a');
      return;
    }

    var runBtn = document.getElementById('tm-run');
    runBtn.textContent = '⏳';
    runBtn.disabled = true;

    fetch(PROXY + '/ssh/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host:     sshConn.host,
        port:     sshConn.port,
        user:     sshConn.user,
        password: sshConn.password,
        command:  cmd,
      }),
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (!d.ok) throw new Error(d.error);

      /* Виводимо результат */
      var output = d.output || '';
      var err    = d.error  || '';

      if (output) {
        /* Підсвічуємо рядки */
        var lines = output.split('\\n');
        lines.forEach(function(line) {
          var color = '#c9e8d8';
          if (/^Flags:|^Columns:|^\s*#/.test(line))   color = '#4a8070';
          if (/INVALID|FAILED|error/i.test(line))      color = '#e0665a';
          if (/warning/i.test(line))                   color = '#e6b35a';
          if (/yes|enabled|true/i.test(line) && !/no|disabled|false/i.test(line)) color = '#5fd0a5';
          appendOutput(line, color);
        });
      }

      if (err && err.trim()) {
        err.split('\\n').forEach(function(line) {
          if (line.trim()) appendOutput(line, '#e0665a');
        });
      }

      if (!output && !err) {
        appendOutput('(немає виводу)', '#4a6070');
      }

      appendOutput('', '#4a6070');
    })
    .catch(function(e) {
      appendOutput('❌ ' + e.message + '\\n', '#e0665a');
    })
    .finally(function() {
      runBtn.textContent = '▶';
      runBtn.disabled = false;
    });
  }

  document.getElementById('tm-run').addEventListener('click', function() {
    var input = document.getElementById('tm-cmd');
    var cmd = input.value.trim();
    if (cmd) {
      runCommand(cmd);
      input.value = '';
    }
  });

  /* Enter + стрілки для навігації по історії */
  document.getElementById('tm-cmd').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      var cmd = this.value.trim();
      if (cmd) {
        runCommand(cmd);
        this.value = '';
      }
    }
    /* Стрілка вгору — попередня команда */
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIdx < cmdHistory.length - 1) {
        historyIdx++;
        this.value = cmdHistory[historyIdx];
        this.setSelectionRange(this.value.length, this.value.length);
      }
    }
    /* Стрілка вниз — наступна команда */
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        historyIdx--;
        this.value = cmdHistory[historyIdx];
      } else {
        historyIdx = -1;
        this.value = '';
      }
    }
    /* Tab — автодоповнення швидких команд */
    if (e.key === 'Tab') {
      e.preventDefault();
      var val = this.value.toLowerCase();
      var quickCmds = [
        '/system identity print', '/system resource print',
        '/ip address print', '/interface print', '/ip route print',
        '/log print', '/ip firewall filter print',
        '/ip dhcp-server lease print', '/system script print',
        '/system scheduler print', '/user active print', '/file print',
        '/ip neighbor print', '/interface wireless print',
        '/ip firewall nat print', '/ppp active print',
        '/system reboot', '/system shutdown',
      ];
      var match = quickCmds.find(function(c) { return c.startsWith(val); });
      if (match) { this.value = match; }
    }
  });

  document.getElementById('tm-clear').addEventListener('click', function() {
    var out = document.getElementById('tm-output');
    out.innerHTML = '<span style="color:#5fd0a5;">Terminal cleared\\n\\n</span>';
  });

  inner.addEventListener('click', function(e) {
    if (e.target.classList.contains('tm-quick')) {
      var cmd = e.target.getAttribute('data-cmd');
      document.getElementById('tm-cmd').value = cmd;
      document.getElementById('tm-cmd').focus();
    }
  });

  /* Подвійний клік на швидку команду — одразу виконує */
  inner.addEventListener('dblclick', function(e) {
    if (e.target.classList.contains('tm-quick')) {
      var cmd = e.target.getAttribute('data-cmd');
      document.getElementById('tm-cmd').value = '';
      runCommand(cmd);
    }
  });"""

c = c.replace(OLD_RUN, NEW_RUN)

with open('terminal.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
print('terminal.js оновлено!')