# -*- coding: utf-8 -*-
import subprocess

# ════════════════════════════════════════════════════════
# ai-agent/ai-agent-executor.js
# Виконує команди від AI з підтвердженням
# ════════════════════════════════════════════════════════
EXECUTOR_JS = r"""/* ══════════════════════════════════════════════════════
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
  executeOne: function(cmd, onResult) {
    var router = AIAgent.getRouter();
    if (!router) {
      onResult({ ok: false, error: 'Немає підключеного роутера' });
      return;
    }
    AIAgent.ssh(cmd).then(function(d) {
      onResult({ ok: d.ok !== false, output: d.output || d.error || 'OK' });
    }).catch(function(e) {
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
            (hasDangerous ? '⚠️ Виконати все одно' : '▶ Виконати') +
          '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
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
"""

with open('ai-agent/ai-agent-executor.js', 'w', encoding='utf-8') as f:
    f.write(EXECUTOR_JS)
print('OK: ai-agent-executor.js ✅')

# ════════════════════════════════════════════════════════
# tools/tool-security.js — повна версія аудиту
# ════════════════════════════════════════════════════════
SECURITY_JS = r"""/* ══════════════════════════════════════════════════════
   TOOL: Security Audit v2.0
   Повний аудит MikroTik + звіт + автовиправлення
   ══════════════════════════════════════════════════════ */
'use strict';

window.AISecurityAudit = {

  /* ── Запустити повний аудит ── */
  run: function() {
    var router = AIAgent.getRouter();
    if (!router) {
      AIAgentUI.addMessage('error', 'Немає підключеного роутера!');
      return;
    }

    AIAgentUI.addMessage('system', '🔒 Запускаю аудит безпеки...');

    var h = {
      'x-router-ip':   router.ip,
      'x-router-port': String(router.port || 80),
      'x-router-user': router.user || 'admin',
      'x-router-pass': router.pass || '',
    };

    var endpoints = [
      '/ip/service',
      '/ip/firewall/filter',
      '/ip/firewall/nat',
      '/user',
      '/interface/wireless',
      '/ip/neighbor/discovery-settings',
      '/tool/mac-server',
      '/ip/ssh',
      '/system/package',
    ];

    Promise.allSettled(endpoints.map(function(ep) {
      return fetch('http://localhost:8888/rest' + ep, { headers: h })
        .then(function(r){ return r.json(); })
        .then(function(d){ return { ep: ep, data: d }; })
        .catch(function(){ return { ep: ep, data: null }; });
    })).then(function(results) {
      var data = {};
      results.forEach(function(r) {
        if (r.value) data[r.value.ep] = r.value.data;
      });
      AISecurityAudit.analyze(data, router);
    });
  },

  /* ── Аналіз даних ── */
  analyze: function(data, router) {
    var issues   = [];  /* Критичні */
    var warnings = [];  /* Попередження */
    var good     = [];  /* Добре */
    var fixes    = [];  /* Команди для виправлення */
    var score    = 100;

    var services  = data['/ip/service']               || [];
    var fw        = data['/ip/firewall/filter']        || [];
    var nat       = data['/ip/firewall/nat']           || [];
    var users     = data['/user']                      || [];
    var wifi      = data['/interface/wireless']        || [];

    /* ════════ СЕРВІСИ ════════ */
    services.forEach(function(s) {
      if (s.disabled === 'true') return;
      if (s.name === 'telnet') {
        issues.push({ icon:'🔴', text:'Telnet увімкнено — передає дані відкритим текстом!', severity:'critical' });
        fixes.push('/ip service disable telnet');
        score -= 20;
      } else if (s.name === 'ftp') {
        warnings.push({ icon:'🟡', text:'FTP увімкнено — незашифрований протокол', severity:'high' });
        fixes.push('/ip service disable ftp');
        score -= 10;
      } else if (s.name === 'api' && s['tls-certificate'] === 'none') {
        warnings.push({ icon:'🟡', text:'API без SSL (порт ' + s.port + ') — небезпечно', severity:'medium' });
        fixes.push('/ip service disable api');
        score -= 5;
      } else if (s.name === 'www') {
        warnings.push({ icon:'🟡', text:'HTTP (порт 80) увімкнено — використовуй HTTPS', severity:'medium' });
        fixes.push('/ip service disable www');
        score -= 5;
      }
    });

    /* SSH порт */
    var sshSvc = services.find(function(s){ return s.name === 'ssh' && s.disabled !== 'true'; });
    if (sshSvc && sshSvc.port === '22') {
      warnings.push({ icon:'🟡', text:'SSH на стандартному порту 22 — легша ціль для атак', severity:'low' });
      score -= 3;
    } else if (sshSvc) {
      good.push('✅ SSH на нестандартному порту ' + sshSvc.port);
    }

    /* Winbox */
    var winbox = services.find(function(s){ return s.name === 'winbox' && s.disabled !== 'true'; });
    if (winbox) {
      if (!winbox['allowed-from'] || winbox['allowed-from'] === '') {
        warnings.push({ icon:'🟡', text:'Winbox відкритий для всіх IP — обмеж доступ', severity:'medium' });
        score -= 5;
      } else {
        good.push('✅ Winbox обмежений IP: ' + winbox['allowed-from']);
      }
    }

    /* ════════ FIREWALL ════════ */
    var inputRules   = fw.filter(function(r){ return r.chain === 'input'; });
    var forwardRules = fw.filter(function(r){ return r.chain === 'forward'; });

    var hasInputDrop    = inputRules.some(function(r){ return r.action === 'drop' || r.action === 'reject'; });
    var hasForwardDrop  = forwardRules.some(function(r){ return r.action === 'drop' || r.action === 'reject'; });
    var hasEstablished  = fw.some(function(r){ return r['connection-state'] && r['connection-state'].includes('established'); });
    var hasInvalid      = fw.some(function(r){ return r['connection-state'] && r['connection-state'].includes('invalid') && r.action === 'drop'; });
    var hasBruteForce   = fw.some(function(r){ return r.comment && r.comment.toLowerCase().includes('brute'); });
    var hasPortKnocking = fw.some(function(r){ return r.comment && r.comment.toLowerCase().includes('knock'); });

    if (!hasInputDrop) {
      issues.push({ icon:'🔴', text:'Немає DROP правила в input chain — роутер відкритий!', severity:'critical' });
      fixes.push('/ip firewall filter add chain=input connection-state=invalid action=drop comment="Drop invalid"');
      fixes.push('/ip firewall filter add chain=input connection-state=established,related action=accept comment="Accept established"');
      fixes.push('/ip firewall filter add chain=input in-interface-list=WAN action=drop comment="Drop all WAN input"');
      score -= 25;
    } else {
      good.push('✅ Input chain захищено DROP правилом');
    }

    if (!hasForwardDrop) {
      warnings.push({ icon:'🟡', text:'Немає DROP правила в forward chain', severity:'high' });
      fixes.push('/ip firewall filter add chain=forward connection-state=invalid action=drop comment="Drop invalid forward"');
      score -= 10;
    } else {
      good.push('✅ Forward chain захищено');
    }

    if (!hasInvalid) {
      warnings.push({ icon:'🟡', text:'Немає захисту від invalid пакетів', severity:'medium' });
      score -= 5;
    } else {
      good.push('✅ Invalid пакети блокуються');
    }

    if (!hasBruteForce) {
      warnings.push({ icon:'🟡', text:'Немає захисту від brute-force атак на SSH/Winbox', severity:'high' });
      fixes.push('/ip firewall filter add chain=input protocol=tcp dst-port=22,8291 src-address-list=blacklist action=drop comment="Brute-force block"');
      fixes.push('/ip firewall filter add chain=input protocol=tcp dst-port=22,8291 connection-limit=3,32 action=add-src-to-address-list address-list=blacklist address-list-timeout=1d comment="Brute-force detect"');
      score -= 10;
    } else {
      good.push('✅ Brute-force захист є');
    }

    /* ════════ КОРИСТУВАЧІ ════════ */
    if (Array.isArray(users)) {
      var adminUser = users.find(function(u){ return u.name === 'admin'; });
      if (adminUser) {
        if (!adminUser.password || adminUser.password === '') {
          issues.push({ icon:'🔴', text:'Порожній пароль адміністратора — критична вразливість!', severity:'critical' });
          score -= 30;
        } else {
          good.push('✅ Пароль адміністратора встановлено');
        }
      }

      /* Зайві users */
      var extraAdmins = users.filter(function(u){
        return u.group === 'full' && u.name !== 'admin' && u.disabled !== 'true';
      });
      if (extraAdmins.length > 0) {
        warnings.push({ icon:'🟡', text:'Знайдено ' + extraAdmins.length + ' додаткових адмін-акаунтів: ' +
          extraAdmins.map(function(u){ return u.name; }).join(', '), severity:'medium' });
        score -= 5;
      }
    }

    /* ════════ WiFi ════════ */
    if (Array.isArray(wifi) && wifi.length > 0) {
      wifi.forEach(function(w) {
        if (w.disabled === 'true') return;
        var sec = w['security-profile'] || '';
        if (!sec || sec === 'default') {
          issues.push({ icon:'🔴', text:'WiFi "' + w.name + '" без профілю безпеки!', severity:'critical' });
          score -= 15;
        } else {
          good.push('✅ WiFi "' + w.name + '" має профіль безпеки: ' + sec);
        }
      });
    }

    /* ════════ ПІДСУМОК ════════ */
    score = Math.max(0, Math.min(100, score));
    AISecurityAudit.showReport({ score, issues, warnings, good, fixes });
  },

  /* ── Показати звіт ── */
  showReport: function(result) {
    var score    = result.score;
    var issues   = result.issues;
    var warnings = result.warnings;
    var good     = result.good;
    var fixes    = result.fixes;

    var scoreColor = score >= 80 ? '#5fd0a5' :
                     score >= 60 ? '#f0a840' :
                     score >= 40 ? '#e07820' : '#e05252';

    var scoreLabel = score >= 80 ? 'Добре' :
                     score >= 60 ? 'Задовільно' :
                     score >= 40 ? 'Небезпечно' : 'Критично';

    /* Видаляємо старий звіт */
    var old = document.getElementById('ai-security-report');
    if (old) old.remove();

    var report = document.createElement('div');
    report.id  = 'ai-security-report';
    report.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.8);' +
      'z-index:99999;display:flex;align-items:center;justify-content:center;overflow-y:auto;';

    var issuesHtml   = issues.map(function(i) {
      return '<div style="display:flex;gap:8px;padding:8px 12px;background:#1a0808;' +
        'border-left:3px solid #e05252;border-radius:0 6px 6px 0;margin-bottom:6px;">' +
        '<span>' + i.icon + '</span>' +
        '<span style="font-size:12px;color:#e05252;">' + i.text + '</span>' +
      '</div>';
    }).join('') || '<div style="color:#4a6070;font-size:12px;">Критичних проблем не знайдено</div>';

    var warningsHtml = warnings.map(function(w) {
      return '<div style="display:flex;gap:8px;padding:8px 12px;background:#1a1a08;' +
        'border-left:3px solid #f0a840;border-radius:0 6px 6px 0;margin-bottom:6px;">' +
        '<span>' + w.icon + '</span>' +
        '<span style="font-size:12px;color:#f0a840;">' + w.text + '</span>' +
      '</div>';
    }).join('') || '<div style="color:#4a6070;font-size:12px;">Попереджень немає</div>';

    var goodHtml = good.map(function(g) {
      return '<div style="font-size:12px;color:#5fd0a5;padding:3px 0;">' + g + '</div>';
    }).join('') || '<div style="color:#4a6070;font-size:12px;">—</div>';

    var fixesCount = fixes.length;

    report.innerHTML =
      '<div style="background:#0d1117;border:1px solid #2a3b48;border-radius:14px;' +
        'width:640px;max-height:90vh;overflow-y:auto;margin:20px;">' +

        /* Header */
        '<div style="padding:20px 24px;border-bottom:1px solid #1a2a38;' +
          'background:linear-gradient(135deg,#080f17,#0d1117);display:flex;align-items:center;gap:16px;">' +
          '<div style="text-align:center;">' +
            '<div style="font-size:42px;font-weight:900;color:' + scoreColor + ';line-height:1;">' + score + '</div>' +
            '<div style="font-size:11px;color:' + scoreColor + ';font-weight:600;">' + scoreLabel + '</div>' +
          '</div>' +
          '<div style="flex:1;">' +
            /* Score bar */
            '<div style="background:#1a2a38;border-radius:10px;height:12px;overflow:hidden;margin-bottom:8px;">' +
              '<div style="background:' + scoreColor + ';width:' + score + '%;height:100%;' +
                'border-radius:10px;transition:width .5s;"></div>' +
            '</div>' +
            '<div style="font-size:14px;font-weight:700;color:#e6edf3;">🔒 Аудит безпеки MikroTik</div>' +
            '<div style="font-size:11px;color:#4a6070;margin-top:2px;">' +
              issues.length + ' критичних · ' + warnings.length + ' попереджень · ' + good.length + ' в порядку' +
            '</div>' +
          '</div>' +
          '<button onclick="document.getElementById(\'ai-security-report\').remove()" ' +
            'style="background:transparent;border:1px solid #2a3b48;color:#4a6070;' +
            'border-radius:6px;padding:4px 10px;cursor:pointer;align-self:flex-start;">✕</button>' +
        '</div>' +

        '<div style="padding:20px 24px;">' +

          /* Критичні */
          '<div style="margin-bottom:16px;">' +
            '<div style="font-size:11px;color:#e05252;font-weight:700;text-transform:uppercase;' +
              'letter-spacing:.5px;margin-bottom:8px;">🔴 Критичні проблеми (' + issues.length + ')</div>' +
            issuesHtml +
          '</div>' +

          /* Попередження */
          '<div style="margin-bottom:16px;">' +
            '<div style="font-size:11px;color:#f0a840;font-weight:700;text-transform:uppercase;' +
              'letter-spacing:.5px;margin-bottom:8px;">🟡 Попередження (' + warnings.length + ')</div>' +
            warningsHtml +
          '</div>' +

          /* Добре */
          '<div style="margin-bottom:20px;background:#080f17;border:1px solid #1a2a38;' +
            'border-radius:8px;padding:12px 16px;">' +
            '<div style="font-size:11px;color:#5fd0a5;font-weight:700;text-transform:uppercase;' +
              'letter-spacing:.5px;margin-bottom:8px;">✅ В порядку (' + good.length + ')</div>' +
            goodHtml +
          '</div>' +

          /* Кнопки */
          (fixesCount > 0 ?
            '<div style="background:#0a1a0a;border:1px solid #1a3a1a;border-radius:10px;padding:14px 16px;margin-bottom:12px;">' +
              '<div style="font-size:12px;color:#5fd0a5;margin-bottom:10px;">' +
                '🛠 AI підготував ' + fixesCount + ' команд для виправлення проблем:' +
              '</div>' +
              '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                '<button onclick="window.AISecurityAudit.applyFixes(' + JSON.stringify(fixes).replace(/'/g, "\\'") + ')" ' +
                  'style="background:linear-gradient(135deg,#5fd0a5,#4ab890);color:#082018;border:none;' +
                  'border-radius:8px;padding:10px 20px;cursor:pointer;font-size:13px;font-weight:700;">✅ Виправити все</button>' +
                '<button onclick="window.AISecurityAudit.askAI()" ' +
                  'style="background:#1a2a3a;border:1px solid #2a3b48;color:#c9d8e4;' +
                  'border-radius:8px;padding:10px 20px;cursor:pointer;font-size:13px;">🤖 Запитати AI</button>' +
              '</div>' +
            '</div>'
          : '') +

          '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
            '<button onclick="document.getElementById(\'ai-security-report\').remove()" ' +
              'style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;' +
              'border-radius:8px;padding:8px 20px;cursor:pointer;font-size:13px;">Закрити</button>' +
          '</div>' +

        '</div>' +
      '</div>';

    document.body.appendChild(report);

    /* Також показуємо в чаті */
    var scoreEmoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : score >= 40 ? '🟠' : '🔴';
    AIAgentUI.addMessage('system',
      scoreEmoji + ' Аудит завершено! Оцінка безпеки: **' + score + '/100** — ' + scoreLabel + '. ' +
      'Знайдено: ' + issues.length + ' критичних, ' + warnings.length + ' попереджень.'
    );
  },

  /* ── Застосувати всі виправлення ── */
  applyFixes: function(fixes) {
    document.getElementById('ai-security-report').remove();
    AIExecutor.showConfirmModal(
      '🔒 Виправлення безпеки',
      fixes,
      'AI підготував ці команди на основі аудиту. Вони виправлять знайдені вразливості.'
    );
  },

  /* ── Запитати AI детальніше ── */
  askAI: function() {
    document.getElementById('ai-security-report').remove();
    if (!AIAgentUI.state.isOpen) AIAgentUI.toggle();
    AIAgentUI.quickAsk(
      'Детально поясни знайдені проблеми безпеки і дай покрокові інструкції для виправлення кожної з них.'
    );
  }
};

/* ── Реєструємо tool ── */
if (window.AIAgent && window.AIAgent.tools) {
  AIAgent.tools.register({
    name:        'security_audit',
    icon:        '🔒',
    description: 'Повний аудит безпеки MikroTik роутера з оцінкою та виправленнями',
    run:         function() { return AISecurityAudit.run(); }
  });
}

console.log('[Security Audit v2.0] Ready ✅');
"""

with open('ai-agent/tools/tool-security.js', 'w', encoding='utf-8') as f:
    f.write(SECURITY_JS)
print('OK: tool-security.js ✅')

# ── Оновлюємо UI — кнопка 🔒 запускає audit ──
with open('ai-agent/ai-agent-ui.js', 'r', encoding='utf-8') as f:
    ui = f.read()

# Фіксуємо runSecurityAudit
old_audit = """AIAgentUI.runSecurityAudit = function() {
  if (!AIAgentUI.state.isOpen) AIAgentUI.toggle();
  AIAgentUI.quickAsk(
    'Проведи повний аудит безпеки мого MikroTik роутера. ' +
    'Перевір: firewall правила, відкриті сервіси, паролі, WiFi шифрування, ' +
    'захист від brute-force, небезпечні налаштування. ' +
    'Дай оцінку безпеки від 0 до 100 і список конкретних рекомендацій з командами для виправлення.'
  );
};"""

new_audit = """AIAgentUI.runSecurityAudit = function() {
  if (!AIAgentUI.state.isOpen) AIAgentUI.toggle();
  if (window.AISecurityAudit) {
    AISecurityAudit.run();
  } else {
    AIAgentUI.quickAsk(
      'Проведи повний аудит безпеки MikroTik. Перевір firewall, сервіси, паролі, WiFi. ' +
      'Дай оцінку 0-100 і команди для виправлення.'
    );
  }
};"""

if old_audit in ui:
    ui = ui.replace(old_audit, new_audit)
    print('OK: runSecurityAudit ✅')
else:
    print('WARN: runSecurityAudit не знайдено — додаємо')
    ui = ui.replace(
        "console.log('[AIAgentUI] Ready ✅');",
        new_audit + "\n\nconsole.log('[AIAgentUI] Ready ✅');"
    )

# Оновлюємо addMessage — відображення **bold**
old_format = "AIAgentUI.formatResponse = function(text) {"
if old_format in ui:
    print('OK: formatResponse є ✅')

with open('ai-agent/ai-agent-ui.js', 'w', encoding='utf-8') as f:
    f.write(ui)

# ── Підключаємо executor в index.html ──
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

if 'ai-agent-executor.js' not in html:
    html = html.replace(
        '<script src="ai-agent/ai-agent-core.js"></script>',
        '<script src="ai-agent/ai-agent-executor.js"></script>\n  <script src="ai-agent/ai-agent-core.js"></script>'
    )
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print('OK: executor в index.html ✅')

# ── Перевірка синтаксису ──
errors = 0
for fn in [
    'ai-agent/ai-agent-executor.js',
    'ai-agent/tools/tool-security.js',
    'ai-agent/ai-agent-ui.js',
]:
    r = subprocess.run(['node', '--check', fn], capture_output=True, text=True)
    status = 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:150]
    print(f'{fn}: {status}')
    if r.returncode != 0: errors += 1

print(f'\n{"Все OK! ✅" if errors==0 else f"Помилок: {errors} ❌"}')