'use strict';

/* ══════════════════════════════════════════════════════
   RouterOS Command Validator v1.0
   Перевіряє синтаксис, версію, безпеку команд
   ══════════════════════════════════════════════════════ */

window.ROSValidator = {

  /* ── Команди які НЕ існують в RouterOS ── */
  _invalidCommands: [
    { pattern: '/tool traffic-monitor', fix: '/interface monitor-traffic IFACE once' },
    { pattern: '/interface monitor start', fix: '/interface monitor-traffic IFACE once' },
    { pattern: '/ip firewall enable', fix: '/ip firewall filter enable [find]' },
    { pattern: '/system update', fix: '/system package update install' },
    { pattern: '/interface wifi enable all', fix: '/interface wifi enable [find]' },
    { pattern: '/ip route add default', fix: '/ip route add dst-address=0.0.0.0/0 gateway=GW' },
    { pattern: '/tool ping', fix: '/ping address=IP count=4' },
    { pattern: 'service=any', fix: 'service=l2tp (вказати конкретно)' },
    { pattern: '/caps-man interface add', fix: '/interface wifi configuration add (v7)' },
  ],

  /* ── Команди тільки для v7 ── */
  _v7only: [
    '/interface wireguard',
    '/interface wifi',
    '/container',
    '/zerotier',
    '/routing bgp connection',
    '/routing ospf instance',
    '/routing filter rule',
    '/interface wifi capsman',
    '/interface wifi security',
    '/interface wifi channel',
    '/interface wifi configuration',
    '/interface wifi provisioning',
  ],

  /* ── Команди тільки для v6 ── */
  _v6only: [
    '/caps-man',
    '/interface wireless security-profiles',
    '/routing bgp instance',
    '/routing ospf network',
    '/routing filter',
  ],

  /* ── Небезпечні паттерни ── */
  _dangerous: [
    {
      check: function(c) {
        return c.indexOf('chain=input') >= 0 &&
               c.indexOf('action=drop') >= 0 &&
               c.indexOf('in-interface') < 0 &&
               c.indexOf('src-address') < 0 &&
               c.indexOf('protocol') < 0 &&
               c.indexOf('connection-state') < 0;
      },
      msg: '⚠️ НЕБЕЗПЕЧНО: Голий DROP в input chain!\nБлокує LAN, DNS, DHCP, Winbox.\nДодайте: in-interface-list=WAN',
      fix: function(c) { return c.replace('action=drop', 'action=drop in-interface-list=WAN'); }
    },
    {
      check: function(c) { return c.indexOf('reset-configuration') >= 0; },
      msg: '⚠️ НЕБЕЗПЕЧНО: Скидання всіх налаштувань!',
      fix: null
    },
    {
      check: function(c) { return c.indexOf('format') >= 0 && c.indexOf('disk') >= 0; },
      msg: '⚠️ НЕБЕЗПЕЧНО: Форматування диску!',
      fix: null
    },
    {
      check: function(c) {
        return c.indexOf('chain=forward') >= 0 &&
               c.indexOf('action=drop') >= 0 &&
               c.indexOf('in-interface') < 0 &&
               c.indexOf('src-address') < 0;
      },
      msg: '⚠️ ОБЕРЕЖНО: DROP в forward chain без умов — блокує весь трафік між мережами!',
      fix: null
    },
  ],

  /* ── Правила синтаксису ── */
  _syntaxRules: [
    {
      check: function(c) { return c.indexOf('\\') >= 0 && c.indexOf('\n') >= 0; },
      msg: 'Команда містить продовження рядка (\\) — розбийте на окремі команди'
    },
    {
      check: function(c) { return /\bX\.X\.X\.X\b/.test(c) || /\bY\.Y\.Y\.Y\b/.test(c); },
      msg: 'Команда містить placeholder IP (X.X.X.X) — замініть на реальний IP'
    },
    {
      check: function(c) { return c.indexOf('YOUR_') >= 0 || c.indexOf('NEWPASSWORD') >= 0; },
      msg: 'Команда містить placeholder — замініть на реальне значення'
    },
    {
      check: function(c) {
        return c.indexOf('/ip firewall filter add') >= 0 &&
               c.indexOf('comment=') < 0;
      },
      msg: 'Рекомендація: додайте comment= до firewall правила для ідентифікації'
    },
  ],

  /* ── Головна функція валідації ── */
  validate: function(commands, rosVersion) {
    var results = [];
    var version = rosVersion || '7';
    var isV7 = version.charAt(0) === '7';

    commands.forEach(function(cmd) {
      var c = cmd.trim().toLowerCase();
      var cmdResult = { cmd: cmd, errors: [], warnings: [], fixes: [], ok: true };

      /* 1. Невалідні команди */
      ROSValidator._invalidCommands.forEach(function(rule) {
        if (c.indexOf(rule.pattern.toLowerCase()) >= 0) {
          cmdResult.errors.push('Команда не існує: ' + rule.pattern);
          cmdResult.fixes.push('Правильно: ' + rule.fix);
          cmdResult.ok = false;
        }
      });

      /* 2. Версія RouterOS */
      if (!isV7) {
        ROSValidator._v7only.forEach(function(v7cmd) {
          if (c.indexOf(v7cmd.toLowerCase()) >= 0) {
            cmdResult.errors.push('Команда тільки для RouterOS v7: ' + v7cmd);
            cmdResult.ok = false;
          }
        });
      }
      if (isV7) {
        ROSValidator._v6only.forEach(function(v6cmd) {
          if (c.indexOf(v6cmd.toLowerCase()) >= 0) {
            cmdResult.warnings.push('Команда від v6, може не працювати в v7: ' + v6cmd);
          }
        });
      }

      /* 3. Небезпечні паттерни */
      ROSValidator._dangerous.forEach(function(rule) {
        if (rule.check(c)) {
          cmdResult.warnings.push(rule.msg);
          if (rule.fix) cmdResult.fixes.push('Автовиправлення: ' + rule.fix(cmd));
          cmdResult.ok = false;
        }
      });

      /* 4. Синтаксис */
      ROSValidator._syntaxRules.forEach(function(rule) {
        if (rule.check(cmd)) {
          cmdResult.warnings.push(rule.msg);
        }
      });

      results.push(cmdResult);
    });

    return results;
  },

  /* ── Отримати версію з контексту роутера ── */
  getRouterVersion: function() {
    if (!window.getActiveRouter) return '7';
    var r = window.getActiveRouter();
    if (!r || !r.info) return '7';
    var ver = r.info.version || r.version || '7';
    return String(ver).charAt(0);
  },

  /* ── HTML для відображення результатів ── */
  renderResults: function(results) {
    var html = '';
    var hasIssues = results.some(function(r) {
      return r.errors.length > 0 || r.warnings.length > 0;
    });
    if (!hasIssues) return '';

    results.forEach(function(r) {
      if (r.errors.length === 0 && r.warnings.length === 0) return;
      html += '<div style="background:#1a0a0a;border:1px solid #c03030;border-radius:8px;padding:10px 14px;margin-bottom:8px;">';
      html += '<div style="color:#ff6060;font-family:monospace;font-size:11px;margin-bottom:6px;">' + r.cmd + '</div>';
      r.errors.forEach(function(e) {
        html += '<div style="color:#ff4040;font-size:12px;">❌ ' + e + '</div>';
      });
      r.warnings.forEach(function(w) {
        html += '<div style="color:#ffaa40;font-size:12px;">' + w.replace(/\n/g,'<br>') + '</div>';
      });
      r.fixes.forEach(function(f) {
        html += '<div style="color:#5fd0a5;font-size:12px;">✅ ' + f + '</div>';
      });
      html += '</div>';
    });
    return html;
  }
};

console.log('[ROSValidator] Ready ✅');
