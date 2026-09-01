/* ══════════════════════════════════════════════════════
   Security Core v1.0 — єдина логіка розрахунку балів
   Використовується dashboard.js і security-score.js
   ══════════════════════════════════════════════════════ */
(function() {
  'use strict';

  /* ── Хелпер — читає елемент форми ── */
  function el(id) {
    return document.getElementById(id);
  }
  function val(id) {
    var e = el(id);
    if (!e) return '';
    return e.type === 'checkbox' ? e.checked : (e.value || '');
  }
  function checked(id) {
    var e = el(id);
    return e ? e.checked : false;
  }

  /* ══════════════════════════════════════════════════════
     ЄДИНІ ПРАВИЛА БЕЗПЕКИ
     ══════════════════════════════════════════════════════ */
  var SECURITY_RULES = [
    {
      id:     'password',
      points: 20,
      label:  'Пароль адміністратора',
      tip:    'Встановіть складний пароль адміністратора (мін. 12 символів)',
      check:  function() {
        var p = val('adminpass') || val('admin-pass') || val('password') || '';
        if (!p || p.length < 8)  return 0;
        if (p.length < 12)       return 10;
        /* Перевіряємо складність */
        var hasUpper  = /[A-Z]/.test(p);
        var hasLower  = /[a-z]/.test(p);
        var hasDigit  = /[0-9]/.test(p);
        var hasSymbol = /[^A-Za-z0-9]/.test(p);
        var complexity = [hasUpper, hasLower, hasDigit, hasSymbol]
          .filter(Boolean).length;
        return complexity >= 3 ? 20 : 15;
      },
    },
    {
      id:     'firewall',
      points: 20,
      label:  'Firewall увімкнено',
      tip:    'Увімкніть Firewall для захисту від зовнішніх атак',
      check:  function() {
        /* Перевіряємо чи є firewall в конфігурації */
        var fw = checked('firewallenable') || checked('fw-enable') ||
                 checked('fwenable');
        if (fw) return 20;
        /* Перевіряємо поле генерації */
        var out = el('output') || el('config-output') || el('result');
        if (out && out.value && out.value.includes('/ip firewall filter add')) {
          return 20;
        }
        return 0;
      },
    },
    {
      id:     'mac',
      points: 10,
      label:  'MAC-фільтрація',
      tip:    'Вимкніть MAC-сервери на WAN інтерфейсі',
      check:  function() {
        var mac = checked('macenable') || checked('mac-enable');
        return mac ? 0 : 10;
      },
    },
    {
      id:     'services',
      points: 10,
      label:  'Небезпечні сервіси вимкнені',
      tip:    'Вимкніть Telnet, FTP, API на WAN',
      check:  function() {
        var telnet = checked('telnet-disable') || checked('telnetdisable');
        var ftp    = checked('ftp-disable')    || checked('ftpdisable');
        var api    = checked('api-disable')    || checked('apidisable');
        var score  = 0;
        if (telnet) score += 4;
        if (ftp)    score += 3;
        if (api)    score += 3;
        /* Якщо є SSH — вважаємо що сервіси налаштовані */
        var ssh = checked('sshenable') || checked('ssh-enable');
        if (ssh && score === 0) score = 5;
        return Math.min(score, 10);
      },
    },
    {
      id:     'dns',
      points: 10,
      label:  'Безпечний DNS',
      tip:    'Використовуйте захищений DNS (1.1.1.1, 8.8.8.8, DoH)',
      check:  function() {
        var dns = val('dns') || val('dnsserver') || val('dns-server') || '';
        var safe = ['1.1.1.1', '8.8.8.8', '9.9.9.9', '208.67.222.222',
                    '1.0.0.1', '8.8.4.4', '94.140.14.14'];
        if (!dns) return 5;
        var parts = dns.split(/[,;\s]+/);
        var safeCnt = parts.filter(function(d) {
          return safe.some(function(s) { return d.trim() === s; });
        }).length;
        return safeCnt >= 2 ? 10 : safeCnt >= 1 ? 7 : 3;
      },
    },
    {
      id:     'ntp',
      points: 5,
      label:  'NTP синхронізація',
      tip:    'Налаштуйте синхронізацію часу для коректних логів',
      check:  function() {
        var ntp = checked('ntpenable') || checked('ntp-enable') ||
                  val('ntpserver') !== '';
        return ntp ? 5 : 0;
      },
    },
    {
      id:     'backup',
      points: 5,
      label:  'Резервне копіювання',
      tip:    'Налаштуйте автоматичне резервне копіювання',
      check:  function() {
        var backup = checked('backupenable') || checked('backup-enable');
        return backup ? 5 : 0;
      },
    },
    {
      id:     'ipv6',
      points: 5,
      label:  'IPv6 налаштовано',
      tip:    'Якщо IPv6 не використовується — вимкніть його',
      check:  function() {
        var ipv6 = checked('ipv6enable') || checked('ipv6-enable');
        /* Якщо явно вимкнено — теж добре */
        var ipv6off = checked('ipv6disable') || checked('ipv6-disable');
        return (ipv6 || ipv6off) ? 5 : 2;
      },
    },
    {
      id:     'neighbor',
      points: 5,
      label:  'Discovery протоколи',
      tip:    'Вимкніть MNDP/CDP/LLDP на WAN для приховування топології',
      check:  function() {
        var nd = checked('neighbordisable') || checked('neighbor-disable') ||
                 checked('mndpdisable');
        return nd ? 5 : 0;
      },
    },
    {
      id:     'svcports',
      points: 5,
      label:  'Нестандартні порти сервісів',
      tip:    'Змініть порт SSH зі стандартного 22 на інший',
      check:  function() {
        var sshport = val('sshport') || val('ssh-port') || '22';
        return (sshport && sshport !== '22') ? 5 : 0;
      },
    },
    {
      id:     'fasttrack',
      points: 5,
      label:  'FastTrack увімкнено',
      tip:    'FastTrack прискорює forwarding але обходить деякі правила',
      check:  function() {
        var ft = checked('fasttrackenable') || checked('fasttrack-enable') ||
                 checked('fasttrack');
        return ft ? 5 : 2;
      },
    },
  ];

  /* ══════════════════════════════════════════════════════
     ЄДИНА ФУНКЦІЯ РОЗРАХУНКУ
     ══════════════════════════════════════════════════════ */
  window.calcSecurityScore = function() {
    var total   = 0;
    var max     = 0;
    var results = [];

    SECURITY_RULES.forEach(function(rule) {
      max += rule.points;
      var earned = 0;
      try {
        earned = rule.check() || 0;
        earned = Math.min(earned, rule.points);
      } catch(e) {
        earned = 0;
      }
      total += earned;
      results.push({
        id:      rule.id,
        label:   rule.label,
        tip:     rule.tip,
        points:  rule.points,
        earned:  earned,
        passed:  earned >= rule.points,
        partial: earned > 0 && earned < rule.points,
      });
    });

    var pct   = max > 0 ? Math.round(total / max * 100) : 0;
    var grade = pct >= 90 ? 'Відмінно'   :
                pct >= 70 ? 'Добре'      :
                pct >= 50 ? 'Задовільно' :
                pct >= 30 ? 'Слабко'     : 'Небезпечно';
    var color = pct >= 90 ? '#5fd0a5' :
                pct >= 70 ? '#7eb8e0' :
                pct >= 50 ? '#e6b35a' :
                pct >= 30 ? '#e0853a' : '#e05252';

    return {
      total:   total,
      max:     max,
      pct:     pct,
      grade:   grade,
      color:   color,
      results: results,
    };
  };

  /* ── Експортуємо правила для розширення ── */
  window.SECURITY_RULES = SECURITY_RULES;

  console.log('[security-core] ready | rules: ' + SECURITY_RULES.length);
})();