/* ══════════════════════════════════════════════════════
   AI AGENT EXECUTOR v1.0
   Парсить команди з відповіді AI → показує → виконує
   ══════════════════════════════════════════════════════ */
'use strict';

window.AIExecutor = {

  /* ── Небезпечні команди — потребують підтвердження ── */
  DANGEROUS: [
    '/system reboot',
    '/system reset-configuration',
    '/ip firewall filter remove',
    '/ip firewall nat remove',
    '/user remove',
    '/interface disable',
    'action=drop',
    'action=reject',
  ],

  /* ── Чи є команда небезпечною ── */
  isDangerous: function(cmd) {
    return AIExecutor.DANGEROUS.some(function(d) {
      return cmd.toLowerCase().includes(d.toLowerCase());
    });
  },

  /* ── Виконати одну команду ── */
  /* Перевірка небезпечних firewall команд */
  validateFirewall: function(commands) {
    var warnings = [];
    commands.forEach(function(cmd) {
      var c = cmd.toLowerCase();
      /* Небезпечно: drop без умов в input chain */
      if (c.indexOf('chain=input') >= 0 &&
          c.indexOf('action=drop') >= 0 &&
          c.indexOf('in-interface') < 0 &&
          c.indexOf('src-address') < 0 &&
          c.indexOf('protocol') < 0 &&
          c.indexOf('connection-state') < 0) {
        warnings.push('⚠️ НЕБЕЗПЕЧНО: Голий DROP в input chain без умов!\n' +
          'Це заблокує весь трафік включно з LAN, DNS, DHCP, Winbox!\n' +
          'Додайте умову: in-interface-list=WAN');
      }
      /* Небезпечно: reset-configuration */
      if (c.indexOf('reset-configuration') >= 0) {
        warnings.push('⚠️ НЕБЕЗПЕЧНО: reset-configuration видалить ВСІ налаштування!');
      }
    });
    return warnings;
  },

  parseCommands: function(text) {
    var cmds = [];
    var lines = text.split('\n');
    var inBlock = false;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line.substring(0,3) === '```') { inBlock = !inBlock; continue; }
      if (inBlock && line && line.charAt(0) !== '#') cmds.push(line);
    }
    if (cmds.length === 0) {
      for (var j = 0; j < lines.length; j++) {
        var l = lines[j].trim();
        if (l.charAt(0) === '/') cmds.push(l);
      }
    }
    return cmds;
  },

  executeOne: function(cmd, onResult) {
    var router = window.getActiveRouter ? window.getActiveRouter() : null;
    if (!router) {
      onResult({ ok: false, error: 'Немає підключеного роутера' });
      return;
    }
    /* Очищаємо команду */
    var c = cmd
      .replace(/\\\s*\n\s*/g, ' ')  /* видаляємо \ продовження */
      .replace(/\s+/g, ' ')            /* нормалізуємо пробіли */
      .replace(/^\//,'/')              /* зберігаємо / на початку */
      .trim();
    console.log('[Executor] Running:', c);
    if (!window.sshCall) {
      onResult({ ok: false, error: 'sshCall не доступний' });
      return;
    }
    window.sshCall(router, c)
      .then(function(d) {
        console.log('[Executor] Result:', d);
        var out = typeof d === 'string' ? d
                : (d && d.text)   ? d.text
                : (d && d.output) ? d.output
                : (d && d.result) ? d.result
                : (d && d.error)  ? d.error
                : JSON.stringify(d);
        onResult({ ok: true, output: out || 'OK' });
      })
      .catch(function(e) {
        onResult({ ok: false, error: String(e) });
      });
  },

  /* ── Виконати список команд послідовно ── */
  executeAll: function(commands, onProgress) {
    var results = [];
    var i = 0;
    function next() {
      if (i >= commands.length) {
        onProgress({ done: true, results: results });
        return;
      }
      var cmd = commands[i++];
      onProgress({ done: false, current: cmd, index: i, total: commands.length });
      AIExecutor.executeOne(cmd, function(result) {
        results.push({ cmd: cmd, result: result });
        next();
      });
    }
    next();
  },

  /* ── Показати модал підтвердження і виконання ── */
  /* Розбиває текст AI на окремі команди RouterOS */

  showConfirmModal: function(title, commands, description) {
    var old = document.getElementById('ai-exec-modal');
    if (old) old.remove();

    /* Очищаємо команди від \ продовжень рядків */
    var cleanCmds = commands.map(function(cmd) {
      return cmd
        .replace(/\\\s*\n\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }).filter(function(cmd) {
      return cmd.length > 0 && !cmd.startsWith('#');
    });

    /* Адаптуємо команди під версію роутера */
    if (window.ROSAdapter && ROSAdapter._version) {
      cleanCmds = ROSAdapter.adaptCommands(cleanCmds);
    }

    var hasDangerous = cleanCmds.some(function(c) {
      var l = c.toLowerCase();
      return l.indexOf('reset') >= 0 || l.indexOf('remove') >= 0 ||
             l.indexOf('reboot') >= 0 || l.indexOf('shutdown') >= 0 ||
             l.indexOf('format') >= 0;
    });

    /* Валідація firewall правил */
    /* Використовуємо ROSValidator якщо є */
    var fwWarnings = [];
    if (window.ROSValidator) {
      var rosVersion = window.ROSAdapter
        ? ROSAdapter._version || '7'
        : ROSValidator.getRouterVersion();
      var validResults = ROSValidator.validate(cleanCmds, rosVersion);
      var validHtml = ROSValidator.renderResults(validResults);
      validResults.forEach(function(r) {
        r.errors.forEach(function(e) { fwWarnings.push('❌ ' + e); });
        r.warnings.forEach(function(w) { fwWarnings.push(w); });
      });
    } else {
      fwWarnings = AIExecutor.validateFirewall(cleanCmds);
    }
    if (fwWarnings.length > 0) {
      hasDangerous = true;
      console.warn('[Executor] Firewall warnings:', fwWarnings);
    }

    /* Рендеримо команди */
    /* Показуємо firewall попередження */
    var warningsHtml = '';
    if (window.ROSValidator && typeof validHtml !== 'undefined' && validHtml) {
      warningsHtml = validHtml;
    } else if (fwWarnings && fwWarnings.length > 0) {
      warningsHtml = fwWarnings.map(function(w) {
        return '<div style="background:#3a1010;border:1px solid #c03030;' +
          'border-radius:8px;padding:10px 14px;margin-bottom:10px;' +
          'color:#ff8080;font-size:12px;">' +
          w.replace(/\n/g,'<br>') + '</div>';
      }).join('');
    }

    var cmdsHtml = cleanCmds.map(function(cmd, i) {
      return '<div style="font-family:monospace;font-size:12px;padding:6px 10px;' +
        'background:#0a1a0a;border-left:3px solid #5fd0a5;border-radius:0 4px 4px 0;' +
        'margin-bottom:4px;color:#5fd0a5;word-break:break-all;">' +
        (i+1) + '. ' + cmd.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div>';
    }).join('');

    var modal = document.createElement('div');
    modal.id = 'ai-exec-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;' +
      'background:rgba(0,0,0,.85);z-index:9999999;display:flex;' +
      'align-items:center;justify-content:center;';

    var btnColor = hasDangerous
      ? 'linear-gradient(135deg,#c03030,#e05252)'
      : 'linear-gradient(135deg,#5fd0a5,#4ab890)';
    var btnText  = hasDangerous ? '#fff' : '#082018';

    modal.innerHTML =
      '<div style="background:#0d1117;border:1px solid #2a3b48;border-radius:14px;' +
        'width:540px;max-height:80vh;overflow-y:auto;margin:20px;">' +
        '<div style="padding:16px 20px;border-bottom:1px solid #1a2a38;' +
          'display:flex;align-items:center;justify-content:space-between;">' +
          '<div>' +
            '<div style="font-size:15px;font-weight:700;color:#e6edf3;">⚡ ' + title + '</div>' +
            '<div style="font-size:11px;color:#4a6070;margin-top:2px;">' +
              cleanCmds.length + ' команд' + (hasDangerous ? ' — ⚠️ небезпечні операції!' : '') +
            '</div>' +
          '</div>' +
          '<button id="exec-close-x" style="background:transparent;border:1px solid #2a3b48;' +
            'color:#4a6070;border-radius:6px;padding:4px 10px;cursor:pointer;">✕</button>' +
        '</div>' +
        '<div style="padding:16px 20px;">' +
          warningsHtml + cmdsHtml +
          '<div style="display:flex;gap:10px;margin-top:16px;">' +
            '<button id="exec-run-btn" style="background:' + btnColor + ';color:' + btnText + ';' +
              'border:none;border-radius:8px;padding:10px 24px;cursor:pointer;' +
              'font-size:13px;font-weight:700;flex:1;">▶ Виконати (' + cleanCmds.length + ')</button>' +
            '<button id="exec-cancel-btn" style="background:transparent;border:1px solid #2a3b48;' +
              'color:#8ea3b0;border-radius:8px;padding:10px 20px;cursor:pointer;font-size:13px;">Скасувати</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    /* Listeners */
    document.getElementById('exec-close-x').onclick = function() { modal.remove(); };
    document.getElementById('exec-cancel-btn').onclick = function() { modal.remove(); };
    document.getElementById('exec-run-btn').onclick = function() {
      modal.remove();
      AIExecutor.runAll(cleanCmds);
    };
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
  },

  /* ── Відкрити термінал і виконати команди ── */
  runInTerminal: function(commands) {
    var modal = document.getElementById('ai-exec-modal');
    if (modal) modal.remove();

    /* Переходимо в термінал */
    if (window.renderMenu) {
      window.renderMenu('terminal');
    } else if (window.rmNavigate) {
      window.rmNavigate('terminal');
    }

    /* Чекаємо поки термінал відкриється і виконуємо команди */
    var i = 0;
    function sendNext() {
      if (i >= commands.length) {
        if (window.AIAgentUI) {
          AIAgentUI.addMessage('system',
            '✅ Виконано ' + commands.length + ' команд в терміналі'
          );
        }
        return;
      }
      var cmd = commands[i++];
      setTimeout(function() {
        if (window.rmTerminalSendCmd) {
          window.rmTerminalSendCmd(cmd);
          sendNext();
        } else {
          /* Термінал ще не готовий — чекаємо */
          setTimeout(function() {
            if (window.rmTerminalSendCmd) {
              window.rmTerminalSendCmd(cmd);
            }
            sendNext();
          }, 1500);
        }
      }, i === 1 ? 800 : 600);
    }
    sendNext();
  },

  /* ── Запустити всі команди ── */
  runAll: function(commands) {
    var resultEl = document.getElementById('ai-exec-result');
    if (resultEl) resultEl.style.display = 'block';

    /* Приховуємо кнопки */
    var btns = document.querySelector('#ai-exec-modal > div > div:last-child');
    if (btns) btns.innerHTML =
      '<div style="color:#4a6070;font-size:12px;">⏳ Виконую команди...</div>';

    var results = [];
    AIExecutor.executeAll(commands, function(progress) {
      if (!resultEl) return;
      if (!progress.done) {
        resultEl.innerHTML =
          '<div style="font-size:12px;color:#4a6070;">⏳ [' + progress.index + '/' + progress.total + '] ' + progress.current + '</div>';
        return;
      }

      /* Показуємо результати */
      var html = progress.results.map(function(r) {
        return '<div style="margin-bottom:8px;padding:8px;background:#060d14;border-radius:6px;' +
          'border-left:3px solid ' + (r.result.ok ? '#5fd0a5' : '#e05252') + ';">' +
          '<code style="font-size:11px;color:#4a6070;">' + r.cmd + '</code><br>' +
          '<span style="font-size:12px;color:' + (r.result.ok ? '#5fd0a5' : '#e05252') + ';">' +
            (r.result.ok ? '✅ ' : '❌ ') + (r.result.output || r.result.error || 'OK') +
          '</span>' +
        '</div>';
      }).join('');

      var ok = progress.results.filter(function(r){ return r.result.ok; }).length;
      resultEl.innerHTML =
        '<div style="font-size:12px;font-weight:700;color:#5fd0a5;margin-bottom:8px;">' +
          '✅ Виконано: ' + ok + '/' + progress.results.length +
        '</div>' + html;

      /* Повідомляємо AI про результат */
      if (window.AIAgentUI) {
        AIAgentUI.addMessage('system',
          '⚡ Виконано ' + ok + ' з ' + progress.results.length + ' команд'
        );
      }

      /* Кнопка закрити */
      if (btns) btns.innerHTML =
        '<button onclick="document.getElementById(\'ai-exec-modal\').remove()" ' +
          'style="margin-left:auto;background:linear-gradient(135deg,#5fd0a5,#4ab890);' +
          'color:#082018;border:none;border-radius:8px;padding:10px 24px;cursor:pointer;' +
          'font-size:13px;font-weight:700;">✓ Готово</button>';
    });
  }
};

console.log('[AIExecutor] Ready ✅');
