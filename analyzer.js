/* ============================================================
   analyzer.js — Живий аналізатор .rsc конфігурації
   Patch 33 | MikroTik Config Generator
   ============================================================ */
'use strict';

/* ══════════════════════════════════════════════
   ПРАВИЛА АНАЛІЗУ
══════════════════════════════════════════════ */
var RULES = [

  /* ── КРИТИЧНІ (🔴) ── */
  {
    id:       'default-admin-pass',
    severity: 'critical',
    title:    'Пароль admin не змінено',
    desc:     'Стандартний пароль admin — критична вразливість. Роутер доступний будь-кому в мережі.',
    fix:      '/user set admin password="НОВИЙ_ПАРОЛЬ"',
    check: function(t) {
      return !/\/user set [^\n]*password=/i.test(t) &&
             !/\/user set [^\n]*admin[^\n]*password=/i.test(t);
    }
  },
  {
    id:       'no-firewall',
    severity: 'critical',
    title:    'Відсутній базовий firewall',
    desc:     'Без firewall роутер повністю відкритий з WAN.',
    fix:      '# Увімкни "Базовий фаєрвол (defconf)" в генераторі',
    check: function(t) {
      return !/\/ip firewall filter add/i.test(t);
    }
  },
  {
    id:       'telnet-enabled',
    severity: 'critical',
    title:    'Telnet увімкнено (небезпечний протокол)',
    desc:     'Telnet передає дані у відкритому вигляді включно з паролями.',
    fix:      '/ip service set telnet disabled=yes',
    check: function(t) {
      return !/ip service set telnet disabled=yes/i.test(t);
    }
  },
  {
    id:       'www-enabled',
    severity: 'critical',
    title:    'HTTP веб-інтерфейс увімкнено',
    desc:     'HTTP не шифрує трафік. Використовуй HTTPS або вимкни.',
    fix:      '/ip service set www disabled=yes',
    check: function(t) {
      return !/ip service set www disabled=yes/i.test(t);
    }
  },
  {
    id:       'api-enabled',
    severity: 'critical',
    title:    'API увімкнено',
    desc:     'API без шифрування — потенційна точка атаки.',
    fix:      '/ip service set api disabled=yes\n/ip service set api-ssl disabled=yes',
    check: function(t) {
      return !/ip service set api disabled=yes/i.test(t);
    }
  },
  {
    id:       'no-nat',
    severity: 'critical',
    title:    'NAT відсутній',
    desc:     'Без NAT клієнти LAN не матимуть доступу до інтернету.',
    fix:      '/ip firewall nat add action=masquerade chain=srcnat out-interface-list=WAN',
    check: function(t) {
      return !/action=masquerade/i.test(t);
    }
  },
  {
    id:       'duplicate-fw-rules',
    severity: 'critical',
    title:    'Задублювані firewall правила!',
    desc:     'Знайдено дублікати firewall правил. Це спричиняє плутанину та навантаження.',
    fix:      '# Очисти firewall:\n/ip firewall filter remove [find]\n# І додай правила заново через генератор',
    check: function(t) {
      var rules = t.match(/add action=drop chain=input comment="defconf: drop all not coming from LAN"/gi);
      return rules && rules.length > 1;
    }
  },
  {
    id:       'duplicate-nat',
    severity: 'critical',
    title:    'Задублювані NAT правила!',
    desc:     'NAT masquerade додано кілька разів — зайве навантаження.',
    fix:      '/ip firewall nat remove [find action=masquerade]\n/ip firewall nat add action=masquerade chain=srcnat comment="defconf: masquerade" ipsec-policy=out,none out-interface-list=WAN',
    check: function(t) {
      var rules = t.match(/action=masquerade/gi);
      return rules && rules.length > 1;
    }
  },

  /* ── ПОПЕРЕДЖЕННЯ (🟡) ── */
  {
    id:       'no-ntp',
    severity: 'warning',
    title:    'NTP не налаштовано',
    desc:     'Без NTP час роутера може бути некоректним — це впливає на логи, сертифікати, Netwatch.',
    fix:      '/system ntp client set enabled=yes\n/system ntp client servers add address=pool.ntp.org',
    check: function(t) {
      return !/ntp client set enabled=yes/i.test(t);
    }
  },
  {
    id:       'no-dns-protect',
    severity: 'warning',
    title:    'DNS-сервер відкритий з WAN',
    desc:     'allow-remote-requests=yes без блокування порту 53 з WAN — роутер може стати DNS-ампліфікатором.',
    fix:      '/ip firewall filter add action=drop chain=input dst-port=53 in-interface-list=WAN protocol=udp\n/ip firewall filter add action=drop chain=input dst-port=53 in-interface-list=WAN protocol=tcp',
    check: function(t) {
      return /allow-remote-requests=yes/i.test(t) &&
             !/dst-port=53[^\n]*in-interface-list=WAN/i.test(t);
    }
  },
  {
    id:       'no-mac-protect',
    severity: 'warning',
    title:    'MAC-сервер доступний з WAN',
    desc:     'Winbox/MAC-Telnet мають бути доступні лише з LAN.',
    fix:      '/tool mac-server set allowed-interface-list=LAN\n/tool mac-server mac-winbox set allowed-interface-list=LAN',
    check: function(t) {
      return !/mac-server set allowed-interface-list=LAN/i.test(t);
    }
  },
  {
    id:       'no-backup',
    severity: 'warning',
    title:    'Резервна копія не налаштована',
    desc:     'Перед змінами рекомендується робити backup конфігурації.',
    fix:      '/system backup save name=backup-before-changes',
    check: function(t) {
      return !/system backup save/i.test(t);
    }
  },
  {
    id:       'ftp-enabled',
    severity: 'warning',
    title:    'FTP увімкнено',
    desc:     'FTP передає дані без шифрування.',
    fix:      '/ip service set ftp disabled=yes',
    check: function(t) {
      return !/ip service set ftp disabled=yes/i.test(t);
    }
  },
  {
    id:       'no-fasttrack',
    severity: 'warning',
    title:    'FastTrack не налаштовано',
    desc:     'FastTrack значно збільшує пропускну здатність на більшості роутерів.',
    fix:      '/ip firewall filter add action=fasttrack-connection chain=forward comment="FastTrack" connection-state=established,related hw-offload=yes',
    check: function(t) {
      return !/action=fasttrack-connection/i.test(t);
    }
  },
  {
    id:       'ipv6-enabled',
    severity: 'warning',
    title:    'IPv6 не вимкнено',
    desc:     'Якщо IPv6 не використовується — краще вимкнути щоб зменшити поверхню атаки.',
    fix:      '/ipv6 settings set disable-ipv6=yes\n/ipv6 firewall address-list add address=::/0 comment=RFC4291 list=bad_ipv6',
    check: function(t) {
      return !/disable-ipv6=yes/i.test(t);
    }
  },
  {
    id:       'no-neighbor-limit',
    severity: 'warning',
    title:    'IP Neighbor Discovery не обмежено',
    desc:     'Необмежена таблиця сусідів може призвести до вичерпання памяті при атаці.',
    fix:      '/ip settings set max-neighbor-entries=8192',
    check: function(t) {
      return !/max-neighbor-entries=/i.test(t);
    }
  },
  {
    id:       'ddns-enabled',
    severity: 'info',
    title:    'Cloud DDNS увімкнено',
    desc:     'DDNS передає дані на сервери MikroTik. Переконайся що це потрібно.',
    fix:      '# Якщо не потрібно: /ip cloud set ddns-enabled=no',
    check: function(t) {
      return /ddns-enabled=yes/i.test(t);
    }
  },

  /* ── РЕКОМЕНДАЦІЇ (🟢) ── */
  {
    id:       'no-svc-ports',
    severity: 'info',
    title:    'Service-ports не вимкнені',
    desc:     'Небезпечні service-ports (pptp, l2tp тощо) краще вимкнути якщо не використовуються.',
    fix:      '/ip firewall service-port set pptp disabled=yes\n/ip firewall service-port set ftp disabled=yes',
    check: function(t) {
      return !/firewall service-port set[^\n]+disabled=yes/i.test(t);
    }
  },
  {
    id:       'auto-upgrade',
    severity: 'info',
    title:    'Авто-оновлення прошивки увімкнено',
    desc:     'auto-upgrade=yes може оновити прошивку в неочікуваний момент.',
    fix:      '/system routerboard settings set auto-upgrade=no',
    check: function(t) {
      return /auto-upgrade=yes/i.test(t);
    }
  },
  {
    id:       'mac-ping-disabled',
    severity: 'info',
    title:    'MAC-ping вимкнено ✅',
    desc:     'Хороша практика — MAC ping вимкнено.',
    fix:      '',
    check: function(t) { return false; }, /* Позитивне — не показуємо */
    positive: function(t) {
      return /mac-server ping set enabled=no/i.test(t);
    }
  },
];

/* ══════════════════════════════════════════════
   АНАЛІЗ
══════════════════════════════════════════════ */
function analyzeRsc(text) {
  var results = {
    critical: [],
    warning:  [],
    info:     [],
    ok:       [],
    score:    100,
  };

  RULES.forEach(function(rule) {
    /* Позитивні правила */
    if (rule.positive) {
      if (rule.positive(text)) {
        results.ok.push(rule);
      }
      return;
    }

    if (rule.check(text)) {
      results[rule.severity].push(rule);
      if (rule.severity === 'critical') results.score -= 20;
      if (rule.severity === 'warning')  results.score -= 8;
      if (rule.severity === 'info')     results.score -= 3;
    } else {
      results.ok.push(rule);
    }
  });

  /* Додаткова статистика */
  results.stats = collectStats(text);
  results.score = Math.max(0, Math.min(100, results.score));
  return results;
}

function collectStats(text) {
  var stats = {};

  /* Модель та версія */
  var model = text.match(/# model = (.+)/i);
  stats.model = model ? model[1].trim() : '—';

  var ros = text.match(/RouterOS ([\d.]+)/i);
  stats.ros = ros ? ros[1] : '—';

  var serial = text.match(/# serial number = (.+)/i);
  stats.serial = serial ? serial[1].trim() : '—';

  var identity = text.match(/\/system identity set name=["']?([^"'\r\n]+)/i);
  stats.identity = identity ? identity[1].trim() : '—';

  /* Підрахунок правил */
  var fwRules = text.match(/\/ip firewall filter add/gi);
  stats.fwRules = fwRules ? fwRules.length : 0;

  var natRules = text.match(/\/ip firewall nat add/gi);
  stats.natRules = natRules ? natRules.length : 0;

  var bridgePorts = text.match(/\/interface bridge port add/gi);
  stats.bridgePorts = bridgePorts ? bridgePorts.length : 0;

  /* Мережі */
  var ips = text.match(/address=[\d.]+\/[\d]+/gi);
  stats.ipCount = ips ? ips.length : 0;

  /* Wi-Fi */
  stats.hasWifi = /\/interface wireless/i.test(text) ||
                  /\/interface wifi/i.test(text);

  /* VPN */
  stats.hasWg   = /\/interface wireguard/i.test(text);
  stats.hasOvpn = /\/interface ovpn/i.test(text);
  stats.hasIpsec = /\/ip ipsec/i.test(text);

  /* Дата конфігу */
  var date = text.match(/# ([\d-]+ [\d:]+) by RouterOS/i);
  stats.exportDate = date ? date[1] : '—';

  return stats;
}

/* ══════════════════════════════════════════════
   РЕНДЕР UI
══════════════════════════════════════════════ */
function renderAnalyzer(results) {
  var s = results.stats;

  /* Колір score */
  var scoreColor = results.score >= 80 ? '#5fd0a5' :
                   results.score >= 50 ? '#e6b35a' : '#e0665a';

  var html = '';

  /* ── Заголовок з оцінкою ── */
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">';
  html += '<div>';
  html += '<div style="font-size:13px;color:#8ea3b0;margin-bottom:4px;">Аналіз конфігурації MikroTik</div>';
  html += '<div style="font-size:11px;color:#4a6070;">🖥️ ' + s.model + ' &nbsp;|&nbsp; RouterOS ' + s.ros + ' &nbsp;|&nbsp; 📅 ' + s.exportDate + '</div>';
  html += '</div>';

  /* Score circle */
  html += '<div style="text-align:center;">';
  html += '<svg width="80" height="80" viewBox="0 0 80 80">';
  html += '<circle cx="40" cy="40" r="34" fill="none" stroke="#1c2a37" stroke-width="8"/>';
  var circ = 2 * Math.PI * 34;
  var dash = (results.score / 100) * circ;
  html += '<circle cx="40" cy="40" r="34" fill="none" stroke="' + scoreColor + '" stroke-width="8" stroke-dasharray="' + dash.toFixed(1) + ' ' + circ.toFixed(1) + '" stroke-linecap="round" transform="rotate(-90 40 40)"/>';
  html += '<text x="40" y="45" text-anchor="middle" font-size="18" font-weight="700" fill="' + scoreColor + '">' + results.score + '</text>';
  html += '</svg>';
  html += '<div style="font-size:10px;color:#8ea3b0;margin-top:-4px;">Security Score</div>';
  html += '</div>';
  html += '</div>';

  /* ── Статистика ── */
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-bottom:20px;">';
  var statItems = [
    ['🔥 Firewall rules', s.fwRules],
    ['🔄 NAT rules', s.natRules],
    ['🔌 Bridge ports', s.bridgePorts],
    ['🌐 IP адрес', s.ipCount],
    ['📶 Wi-Fi', s.hasWifi ? '✅' : '—'],
    ['🔒 WireGuard', s.hasWg ? '✅' : '—'],
    ['🔐 OpenVPN', s.hasOvpn ? '✅' : '—'],
    ['🛡️ IPsec', s.hasIpsec ? '✅' : '—'],
  ];
  statItems.forEach(function(item) {
    html += '<div style="background:#0d1a24;border:1px solid #1c2a37;border-radius:8px;padding:10px 12px;">';
    html += '<div style="font-size:11px;color:#4a6070;">' + item[0] + '</div>';
    html += '<div style="font-size:18px;font-weight:700;color:#e6edf3;margin-top:2px;">' + item[1] + '</div>';
    html += '</div>';
  });
  html += '</div>';

  /* ── Проблеми ── */
  function renderSection(items, icon, color, bg, label) {
    if (!items.length) return '';
    var out = '<div style="margin-bottom:16px;">';
    out += '<div style="font-size:12px;font-weight:700;color:' + color + ';margin-bottom:8px;">' + icon + ' ' + label + ' (' + items.length + ')</div>';
    items.forEach(function(rule) {
      out += '<div style="background:' + bg + ';border:1px solid ' + color + '33;border-radius:8px;padding:12px 14px;margin-bottom:8px;">';

      /* Заголовок */
      out += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">';
      out += '<div style="font-size:12.5px;font-weight:600;color:' + color + ';">' + rule.title + '</div>';
      out += '</div>';

      /* Опис */
      out += '<div style="font-size:11.5px;color:#8ea3b0;margin-bottom:8px;">' + rule.desc + '</div>';

      /* Команда виправлення */
      if (rule.fix) {
        out += '<div style="background:#060d14;border-radius:6px;padding:8px 10px;margin-bottom:6px;">';
        out += '<div style="font-size:10px;color:#4a6070;margin-bottom:4px;">Виправлення:</div>';
        out += '<code style="font-family:monospace;font-size:11px;color:#5fd0a5;white-space:pre-wrap;">' + escHtml(rule.fix) + '</code>';
        out += '</div>';

        /* Кнопка копіювати */
        out += '<button onclick="copyFix(this)" data-fix="' + escAttr(rule.fix) + '" ';
        out += 'style="background:transparent;border:1px solid ' + color + '55;color:' + color + ';';
        out += 'font-size:10px;padding:3px 10px;border-radius:4px;cursor:pointer;">';
        out += '📋 Копіювати команду</button>';
      }

      out += '</div>';
    });
    out += '</div>';
    return out;
  }

  html += renderSection(results.critical, '🔴', '#e0665a', 'rgba(224,102,90,.08)',  'Критичні проблеми');
  html += renderSection(results.warning,  '🟡', '#e6b35a', 'rgba(230,179,90,.08)', 'Попередження');
  html += renderSection(results.info,     '🔵', '#5b9bd5', 'rgba(91,155,213,.08)', 'Рекомендації');

  /* ── OK список ── */
  if (results.ok.length) {
    html += '<div style="margin-bottom:16px;">';
    html += '<div style="font-size:12px;font-weight:700;color:#5fd0a5;margin-bottom:8px;">✅ Все добре (' + results.ok.length + ')</div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
    results.ok.forEach(function(rule) {
      html += '<div style="background:rgba(95,208,165,.08);border:1px solid #5fd0a533;';
      html += 'border-radius:6px;padding:4px 10px;font-size:11px;color:#5fd0a5;">✓ ' + rule.title + '</div>';
    });
    html += '</div></div>';
  }

  /* ── Підсумок ── */
  html += '<div style="background:#060d14;border:1px solid #1c2a37;border-radius:8px;padding:12px 14px;font-size:11px;color:#4a6070;text-align:center;">';
  html += '🔍 Знайдено: <span style="color:#e0665a;">' + results.critical.length + ' критичних</span> · ';
  html += '<span style="color:#e6b35a;">' + results.warning.length + ' попереджень</span> · ';
  html += '<span style="color:#5b9bd5;">' + results.info.length + ' рекомендацій</span> · ';
  html += '<span style="color:#5fd0a5;">' + results.ok.length + ' OK</span>';
  html += '</div>';

  return html;
}

/* ── Хелпери ── */
function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escAttr(s) {
  return String(s||'').replace(/"/g,'&quot;').replace(/\n/g,'&#10;');
}

/* Копіювати команду виправлення */
window.copyFix = function(btn) {
  var fix = btn.getAttribute('data-fix');
  if (!fix) return;
  fix = fix.replace(/&#10;/g, '\n').replace(/&quot;/g, '"');
  var orig = btn.textContent;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(fix).then(function() {
      btn.textContent = '✓ Скопійовано!';
      setTimeout(function(){ btn.textContent = orig; }, 1500);
    });
  } else {
    var ta = document.createElement('textarea');
    ta.value = fix;
    ta.style.cssText = 'position:fixed;left:-9999px;';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.textContent = '✓ Скопійовано!';
    setTimeout(function(){ btn.textContent = orig; }, 1500);
  }
};

/* ══════════════════════════════════════════════
   ІНІЦІАЛІЗАЦІЯ
══════════════════════════════════════════════ */
function initAnalyzer() {

  /* Додаємо кнопку "🔍 Аналіз" в секцію rsc */
  var btnbar = document.querySelector('#rsc-status');
  if (!btnbar) { console.warn('[analyzer] rsc-status not found'); return; }

  var analyzeBtn = document.createElement('button');
  analyzeBtn.id = 'btn-analyze';
  analyzeBtn.className = 'sec';
  analyzeBtn.textContent = '🛡️ Аналіз безпеки';
  analyzeBtn.style.marginTop = '10px';

  btnbar.parentNode.insertBefore(analyzeBtn, btnbar);

  /* Модальне вікно */
  var modal = document.createElement('div');
  modal.id = 'analyzer-modal';
  modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9999;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;';

  var inner = document.createElement('div');
  inner.style.cssText = 'background:#16212c;border:1px solid #2a3b48;border-radius:12px;padding:24px;max-width:860px;width:100%;margin:auto;position:relative;';

  inner.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
    '<h3 style="margin:0;color:#5fd0a5;font-size:15px;">🛡️ Аналіз безпеки конфігурації</h3>' +
    '<button id="analyzer-close" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:4px 14px;border-radius:6px;cursor:pointer;font-size:12px;">✕ Закрити</button>' +
    '</div>' +
    '<div id="analyzer-body"></div>';

  modal.appendChild(inner);
  document.body.appendChild(modal);

  /* Закрити */
  document.getElementById('analyzer-close').addEventListener('click', function() {
    modal.style.display = 'none';
  });
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.style.display = 'none';
  });

  /* Клік на кнопку */
  analyzeBtn.addEventListener('click', function() {
    var rscText = '';

    var ta = document.getElementById('rsc-input');
    if (ta && ta.value.trim()) rscText = ta.value.trim();

    if (!rscText) {
      var out = document.getElementById('output');
      if (out) rscText = (out.textContent || out.innerText || '').trim();
    }

    if (!rscText) {
      alert('Вставте .rsc конфіг у поле аналізу або спочатку згенеруйте конфігурацію!');
      return;
    }

    var results = analyzeRsc(rscText);
    document.getElementById('analyzer-body').innerHTML = renderAnalyzer(results);
    modal.style.display = 'flex';

    console.log('[analyzer] score:', results.score,
      '| critical:', results.critical.length,
      '| warning:', results.warning.length);
  });

  /* Також додаємо кнопку в btnbar аналізатора */
  var rscBtnbar = document.querySelector('.btnbar + .hint') ||
                  document.getElementById('btn-parse');

  if (rscBtnbar && rscBtnbar.parentNode) {
    var btnbarEl = rscBtnbar.closest ? rscBtnbar.closest('.btnbar') : null;
    if (btnbarEl && !btnbarEl.contains(analyzeBtn)) {
      btnbarEl.appendChild(analyzeBtn);
    }
  }

  console.log('[analyzer] ready | rules:', RULES.length);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAnalyzer);
} else {
  initAnalyzer();
}