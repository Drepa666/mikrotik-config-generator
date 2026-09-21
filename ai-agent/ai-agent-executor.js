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
    if (!router) { onResult({ ok: false, error: 'Немає роутера' }); return; }
    var c = cmd.replace(/\\\\/g, ' ').replace(/\s+/g, ' ').trim();
    console.log('[Executor] cmd:', c);
    window.sshCall(router, c)
      .then(function(d) {
        var out = typeof d === 'string' ? d
                : (d && d.text)   ? d.text
                : (d && d.output) ? d.output
                : (d && d.result) ? d.result
                : (d && d.error)  ? d.error
                : JSON.stringify(d);
        onResult({ ok: true, output: out || 'OK' });
      })
      .catch(function(e) { onResult({ ok: false, error: String(e) }); });
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

    var hasDangerous = commands.some(function(c) { return AIExecutor.isDangerous(c); });

    var cmdList = commands.map(function(cmd, i) {
      var danger = AIExecutor.isDangerous(cmd);
      return '<div style="display:flex;align-items:flex-start;gap:8px;padding:8px;' +
        'background:' + (danger ? '#1a0808' : '#060d14') + ';' +
        'border:1px solid ' + (danger ? '#3a1a1a' : '#1a2a38') + ';' +
        'border-radius:6px;margin-bottom:6px;">' +
        '<span style="font-size:14px;flex-shrink:0;">' + (danger ? '⚠️' : '▶') + '</span>' +
        '<code style="font-size:12px;color:' + (danger ? '#e05252' : '#5fd0a5') + ';' +
          'white-space:pre-wrap;word-break:break-all;flex:1;">' + cmd + '</code>' +
      '</div>';
    }).join('');

    var modal = document.createElement('div');
    modal.id = 'ai-exec-modal';
    modal.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.8);' +
      'z-index:99999;display:flex;align-items:center;justify-content:center;';

    modal.innerHTML =
      '<div style="background:#0d1117;border:1px solid ' + (hasDangerous ? '#3a1a1a' : '#2a3b48') + ';' +
        'border-radius:14px;width:580px;max-height:85vh;display:flex;flex-direction:column;' +
        'box-shadow:0 20px 60px rgba(0,0,0,.7);">' +

        /* Header */
        '<div style="padding:16px 20px;border-bottom:1px solid #1a2a38;display:flex;align-items:center;gap:10px;">' +
          '<span style="font-size:20px;">' + (hasDangerous ? '⚠️' : '⚡') + '</span>' +
          '<div>' +
            '<div style="font-weight:700;color:#e6edf3;font-size:15px;">' + title + '</div>' +
            '<div style="font-size:11px;color:#4a6070;">' + commands.length + ' команд' +
              (hasDangerous ? ' · <span style="color:#e05252;">Містить небезпечні операції</span>' : '') +
            '</div>' +
          '</div>' +
          '<button onclick="document.getElementById(\'ai-exec-modal\').remove()" ' +
            'style="margin-left:auto;background:transparent;border:1px solid #2a3b48;' +
            'color:#4a6070;border-radius:6px;padding:4px 10px;cursor:pointer;">✕</button>' +
        '</div>' +

        /* Description */
        (description ?
          '<div style="padding:12px 20px;background:#080f17;border-bottom:1px solid #1a2a38;' +
            'font-size:12px;color:#8ea3b0;line-height:1.6;">' + description + '</div>'
        : '') +

        /* Commands */
        '<div style="padding:16px 20px;overflow-y:auto;flex:1;">' +
          '<div style="font-size:11px;color:#4a6070;margin-bottom:8px;text-transform:uppercase;">Команди для виконання:</div>' +
          cmdList +
        '</div>' +

        /* Result area */
        '<div id="ai-exec-result" style="display:none;padding:12px 20px;' +
          'border-top:1px solid #1a2a38;max-height:200px;overflow-y:auto;"></div>' +

        /* Buttons */
        '<div style="padding:14px 20px;border-top:1px solid #1a2a38;display:flex;gap:8px;">' +
          '<button onclick="document.getElementById(\'ai-exec-modal\').remove()" ' +
            'style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;' +
            'border-radius:8px;padding:10px 20px;cursor:pointer;font-size:13px;">Скасувати</button>' +
          (hasDangerous ?
            '<div style="flex:1;background:#1a0808;border:1px solid #3a1a1a;border-radius:8px;' +
              'padding:8px 12px;font-size:11px;color:#e05252;display:flex;align-items:center;">' +
              '⚠️ Ці команди можуть вплинути на роботу мережі!' +
            '</div>' : '<div style="flex:1;"></div>') +
          '<button onclick="window.AIExecutor.runAll(' + JSON.stringify(commands).replace(/'/g, "\\'") + ')" ' +
            'style="background:' + (hasDangerous ? 'linear-gradient(135deg,#c03030,#e05252)' : 'linear-gradient(135deg,#5fd0a5,#4ab890)') + ';' +
            'color:' + (hasDangerous ? '#fff' : '#082018') + ';border:none;' +
            'border-radius:8px;padding:10px 24px;cursor:pointer;font-size:13px;font-weight:700;">' +
            (hasDangerous ? '⚠️ Відкрити термінал' : '▶ Відкрити термінал') +
          '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
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
