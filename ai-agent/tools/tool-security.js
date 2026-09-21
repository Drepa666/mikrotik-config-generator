'use strict';

window.AISecurityAudit = {

  run: function() {
    var router = window.AIAgent ? AIAgent.getRouter() : null;
    if (!router) {
      if (window.AIAgentUI) AIAgentUI.addMessage('error', 'Роутер не підключений!');
      alert('Підключи роутер в Router Manager!');
      return;
    }

    if (window.AIAgentUI) AIAgentUI.addMessage('system', '🔒 Запускаю аудит безпеки...');

    var h = {
      'x-router-ip':   router.ip,
      'x-router-port': String(router.port || 80),
      'x-router-user': router.user || 'admin',
      'x-router-pass': router.pass || '',
    };

    var endpoints = [
      '/ip/service',
      '/ip/firewall/filter',
      '/user',
      '/interface/wireless',
    ];

    Promise.allSettled(endpoints.map(function(ep) {
      return fetch('http://localhost:8888/rest' + ep, { headers: h })
        .then(function(r) {
          if (!r.ok) return [];
          return r.json();
        })
        .then(function(d) { return { ep: ep, data: d }; })
        .catch(function() { return { ep: ep, data: [] }; });
    })).then(function(results) {
      var data = {};
      results.forEach(function(r) {
        if (r.status === 'fulfilled' && r.value) {
          /* Завжди масив */
          data[r.value.ep] = Array.isArray(r.value.data) ? r.value.data : [];
        }
      });
      AISecurityAudit.analyze(data);
    }).catch(function(e) {
      if (window.AIAgentUI) AIAgentUI.addMessage('error', 'Помилка аудиту: ' + e);
    });
  },

  analyze: function(data) {
    var issues   = [];
    var warnings = [];
    var good     = [];
    var fixes    = [];
    var score    = 100;

    var services = data['/ip/service']            || [];
    var fw       = data['/ip/firewall/filter']    || [];
    var users    = data['/user']                  || [];
    var wifi     = data['/interface/wireless']    || [];

    /* ── Сервіси ── */
    services.forEach(function(s) {
      if (!s || s.disabled === 'true') return;
      if (s.name === 'telnet') {
        issues.push('🔴 Telnet увімкнено — небезпечно!');
        fixes.push('/ip service disable telnet');
        score -= 20;
      }
      if (s.name === 'ftp') {
        warnings.push('🟡 FTP увімкнено — незашифрований');
        fixes.push('/ip service disable ftp');
        score -= 10;
      }
      if (s.name === 'www') {
        warnings.push('🟡 HTTP (порт 80) увімкнено');
        fixes.push('/ip service disable www');
        score -= 5;
      }
      if (s.name === 'api' && s['tls-certificate'] === 'none') {
        warnings.push('🟡 API без SSL');
        fixes.push('/ip service disable api');
        score -= 5;
      }
    });

    /* ── Firewall ── */
    var hasInputDrop = fw.some(function(r) {
      return r && r.chain === 'input' && (r.action === 'drop' || r.action === 'reject');
    });
    var hasInvalid = fw.some(function(r) {
      return r && r['connection-state'] && r['connection-state'].includes('invalid') && r.action === 'drop';
    });
    var hasBrute = fw.some(function(r) {
      return r && r.comment && r.comment.toLowerCase().includes('brute');
    });

    if (!hasInputDrop) {
      issues.push('🔴 Немає DROP в input chain — роутер відкритий!');
      fixes.push('/ip firewall filter add chain=input connection-state=invalid action=drop comment="Drop invalid"');
      fixes.push('/ip firewall filter add chain=input in-interface-list=WAN action=drop comment="Drop WAN input"');
      score -= 25;
    } else { good.push('✅ Input chain захищено'); }

    if (!hasInvalid) {
      warnings.push('🟡 Немає захисту від invalid пакетів');
      score -= 5;
    } else { good.push('✅ Invalid пакети блокуються'); }

    if (!hasBrute) {
      warnings.push('🟡 Немає захисту від brute-force');
      fixes.push('/ip firewall filter add chain=input protocol=tcp dst-port=22,8291 src-address-list=blacklist action=drop comment="Brute-force block"');
      score -= 10;
    } else { good.push('✅ Brute-force захист є'); }

    /* ── Користувачі ── */
    var adminUser = users.find(function(u) { return u && u.name === 'admin'; });
    if (adminUser && (!adminUser.password || adminUser.password === '')) {
      issues.push('🔴 Порожній пароль адміна!');
      score -= 30;
    } else if (adminUser) {
      good.push('✅ Пароль адміна встановлено');
    }

    /* ── WiFi ── */
    wifi.forEach(function(w) {
      if (!w || w.disabled === 'true') return;
      if (!w['security-profile'] || w['security-profile'] === 'default') {
        warnings.push('🟡 WiFi "' + w.name + '" без профілю безпеки!');
        score -= 10;
      } else {
        good.push('✅ WiFi "' + w.name + '" захищено');
      }
    });

    score = Math.max(0, Math.min(100, score));
    AISecurityAudit.showReport({ score: score, issues: issues, warnings: warnings, good: good, fixes: fixes });
  },

  showReport: function(r) {
    var score = r.score;
    var color = score >= 80 ? '#5fd0a5' : score >= 60 ? '#f0a840' : score >= 40 ? '#e07820' : '#e05252';
    var label = score >= 80 ? 'Добре' : score >= 60 ? 'Задовільно' : score >= 40 ? 'Небезпечно' : 'Критично';

    var old = document.getElementById('ai-security-report');
    if (old) old.remove();

    var issHtml = r.issues.map(function(i) {
      return '<div style="padding:6px 10px;background:#1a0808;border-left:3px solid #e05252;' +
        'border-radius:0 4px 4px 0;margin-bottom:4px;font-size:12px;color:#e05252;">' + i + '</div>';
    }).join('') || '<div style="color:#4a6070;font-size:12px;">Критичних проблем немає</div>';

    var warnHtml = r.warnings.map(function(w) {
      return '<div style="padding:6px 10px;background:#1a1a08;border-left:3px solid #f0a840;' +
        'border-radius:0 4px 4px 0;margin-bottom:4px;font-size:12px;color:#f0a840;">' + w + '</div>';
    }).join('') || '<div style="color:#4a6070;font-size:12px;">Попереджень немає</div>';

    var goodHtml = r.good.map(function(g) {
      return '<div style="font-size:12px;color:#5fd0a5;padding:2px 0;">' + g + '</div>';
    }).join('') || '<div style="color:#4a6070;font-size:12px;">—</div>';

    var modal = document.createElement('div');
    modal.id = 'ai-security-report';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;' +
      'background:rgba(0,0,0,.8);z-index:9999999;display:flex;align-items:center;justify-content:center;';

    modal.innerHTML =
      '<div style="background:#0d1117;border:1px solid #2a3b48;border-radius:14px;' +
        'width:600px;max-height:88vh;overflow-y:auto;margin:20px;">' +

        '<div style="padding:20px;border-bottom:1px solid #1a2a38;display:flex;align-items:center;gap:16px;">' +
          '<div style="text-align:center;min-width:70px;">' +
            '<div style="font-size:40px;font-weight:900;color:' + color + ';">' + score + '</div>' +
            '<div style="font-size:11px;color:' + color + ';font-weight:600;">' + label + '</div>' +
          '</div>' +
          '<div style="flex:1;">' +
            '<div style="background:#1a2a38;border-radius:8px;height:10px;overflow:hidden;margin-bottom:8px;">' +
              '<div style="background:' + color + ';width:' + score + '%;height:100%;border-radius:8px;"></div>' +
            '</div>' +
            '<div style="font-size:14px;font-weight:700;color:#e6edf3;">🔒 Аудит безпеки MikroTik</div>' +
            '<div style="font-size:11px;color:#4a6070;">' +
              r.issues.length + ' критичних · ' + r.warnings.length + ' попереджень · ' + r.good.length + ' ОК' +
            '</div>' +
          '</div>' +
          '<button onclick="document.getElementById(\'ai-security-report\').remove()" ' +
            'style="background:transparent;border:1px solid #2a3b48;color:#4a6070;' +
            'border-radius:6px;padding:4px 10px;cursor:pointer;align-self:flex-start;">✕</button>' +
        '</div>' +

        '<div style="padding:20px;">' +
          '<div style="font-size:11px;color:#e05252;font-weight:700;margin-bottom:6px;">🔴 КРИТИЧНІ (' + r.issues.length + ')</div>' +
          issHtml +
          '<div style="font-size:11px;color:#f0a840;font-weight:700;margin:12px 0 6px;">🟡 ПОПЕРЕДЖЕННЯ (' + r.warnings.length + ')</div>' +
          warnHtml +
          '<div style="font-size:11px;color:#5fd0a5;font-weight:700;margin:12px 0 6px;">✅ В ПОРЯДКУ (' + r.good.length + ')</div>' +
          goodHtml +
          (r.fixes.length > 0 ?
            '<div style="margin-top:16px;background:#0a1a0a;border:1px solid #1a3a1a;border-radius:8px;padding:14px;">' +
              '<div style="font-size:12px;color:#5fd0a5;margin-bottom:10px;">🛠 ' + r.fixes.length + ' команд для виправлення:</div>' +
              '<div style="display:flex;gap:8px;">' +
                '<button onclick="window.AISecurityAudit.applyFixes(' + JSON.stringify(r.fixes) + ')" ' +
                  'style="background:linear-gradient(135deg,#5fd0a5,#4ab890);color:#082018;border:none;' +
                  'border-radius:8px;padding:10px 20px;cursor:pointer;font-size:13px;font-weight:700;">✅ Виправити</button>' +
                '<button onclick="document.getElementById(\'ai-security-report\').remove()" ' +
                  'style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;' +
                  'border-radius:8px;padding:10px 20px;cursor:pointer;font-size:13px;">Закрити</button>' +
              '</div>' +
            '</div>'
          : '<div style="margin-top:12px;text-align:right;">' +
              '<button onclick="document.getElementById(\'ai-security-report\').remove()" ' +
                'style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;' +
                'border-radius:8px;padding:8px 20px;cursor:pointer;">Закрити</button>' +
            '</div>') +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    var emoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : score >= 40 ? '🟠' : '🔴';
    if (window.AIAgentUI) {
      AIAgentUI.addMessage('system',
        emoji + ' Аудит завершено! Оцінка: ' + score + '/100 — ' + label +
        '. Критичних: ' + r.issues.length + ', попереджень: ' + r.warnings.length
      );
    }
  },

  applyFixes: function(fixes) {
    var rep = document.getElementById('ai-security-report');
    if (rep) rep.remove();
    if (window.AIExecutor) {
      AIExecutor.showConfirmModal('🔒 Виправлення безпеки', fixes,
        'Команди виправлять знайдені вразливості. Натисни "Відкрити термінал".');
    }
  }
};

if (window.AIAgent && window.AIAgent.tools) {
  AIAgent.tools.register({
    name: 'security_audit', icon: '🔒',
    description: 'Аудит безпеки MikroTik',
    run: function() { AISecurityAudit.run(); }
  });
}
console.log('[Security Audit] Ready ✅');
