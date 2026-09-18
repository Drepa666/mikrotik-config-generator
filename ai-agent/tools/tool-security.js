/* ══════════════════════════════════════════════════════
   TOOL: Security Audit
   Реєструється в AIAgent.tools автоматично
   ══════════════════════════════════════════════════════ */
'use strict';

(function() {
  if (!window.AIAgent) return;

  AIAgent.tools.register({
    name:        'security_audit',
    icon:        '🔒',
    description: 'Повний аудит безпеки MikroTik роутера',

    run: function() {
      var router = AIAgent.getRouter();
      if (!router) return Promise.reject('Немає роутера');

      var checks = [
        '/ip/service',
        '/ip/firewall/filter',
        '/user',
        '/interface/wireless',
        '/ip/neighbor/discovery-settings',
        '/tool/mac-server',
        '/ip/firewall/filter',
      ];

      return Promise.allSettled(
        checks.map(function(ep) {
          return fetch('http://localhost:8888/rest' + ep, {
            headers: {
              'x-router-ip':   router.ip,
              'x-router-port': String(router.port||80),
              'x-router-user': router.user||'admin',
              'x-router-pass': router.pass||'',
            }
          }).then(function(r){ return r.json(); })
            .then(function(d){ return { ep:ep, data:d }; })
            .catch(function(){ return { ep:ep, data:null }; });
        })
      ).then(function(results) {
        var data = {};
        results.forEach(function(r) {
          if (r.value) data[r.value.ep] = r.value.data;
        });

        var issues   = [];
        var warnings = [];
        var good     = [];
        var score    = 100;

        /* Перевірка сервісів */
        var services = data['/ip/service'] || [];
        services.forEach(function(s) {
          if (s.disabled === 'true') return;
          if (s.name === 'telnet') {
            issues.push({ text: 'Telnet увімкнений — небезпечний протокол!', cmd: '/ip service disable telnet', severity: 'high' });
            score -= 15;
          }
          if (s.name === 'ftp') {
            warnings.push({ text: 'FTP увімкнений — незашифрований протокол', cmd: '/ip service disable ftp', severity: 'medium' });
            score -= 5;
          }
          if (s.name === 'api' && !s['tls-certificate']) {
            warnings.push({ text: 'API без SSL — небезпечна передача даних', cmd: '/ip service disable api', severity: 'medium' });
            score -= 5;
          }
          if (s.name === 'www') {
            warnings.push({ text: 'HTTP (порт 80) увімкнений — використовуй HTTPS', cmd: '/ip service disable www', severity: 'low' });
            score -= 3;
          }
        });

        /* Перевірка firewall */
        var fw = data['/ip/firewall/filter'] || [];
        var hasInputDrop  = fw.some(function(r){ return r.chain==='input'   && r.action==='drop'; });
        var hasForwardDrop= fw.some(function(r){ return r.chain==='forward' && r.action==='drop'; });
        var hasInvalid    = fw.some(function(r){ return r['connection-state'] && r['connection-state'].includes('invalid'); });
        var hasBruteForce = fw.some(function(r){ return r.comment && (r.comment.toLowerCase().includes('brute') || r.comment.toLowerCase().includes('blacklist')); });

        if (!hasInputDrop) {
          issues.push({ text: 'Немає правила DROP для input chain!', cmd: '/ip firewall filter add chain=input action=drop comment="Drop all input" place-before=0', severity: 'high' });
          score -= 20;
        } else { good.push('✅ Input chain має DROP правило'); }

        if (!hasInvalid) {
          warnings.push({ text: 'Немає захисту від invalid пакетів', cmd: '/ip firewall filter add chain=input connection-state=invalid action=drop comment="Drop invalid"', severity: 'medium' });
          score -= 10;
        } else { good.push('✅ Invalid пакети блокуються'); }

        if (!hasBruteForce) {
          warnings.push({ text: 'Немає захисту від brute-force атак', cmd: '/ip firewall filter add chain=input protocol=tcp dst-port=22,8291 src-address-list=blacklist action=drop comment="Brute-force protection"', severity: 'medium' });
          score -= 10;
        } else { good.push('✅ Захист від brute-force є'); }

        /* Перевірка users */
        var users = data['/user'] || [];
        var adminUser = users.find(function(u){ return u.name==='admin'; });
        if (adminUser && (!adminUser.password || adminUser.password === '')) {
          issues.push({ text: 'Порожній пароль адміна!', cmd: '/user set admin password="ВАШ_НОВИЙ_ПАРОЛЬ"', severity: 'critical' });
          score -= 30;
        }

        /* WiFi перевірка */
        var wifi = data['/interface/wireless'] || [];
        wifi.forEach(function(w) {
          if (w['security-profile'] === 'default' || !w['security-profile']) {
            warnings.push({ text: 'WiFi ' + w.name + ' без профілю безпеки!', severity: 'high' });
            score -= 15;
          }
        });

        score = Math.max(0, Math.min(100, score));

        return {
          score:    score,
          issues:   issues,
          warnings: warnings,
          good:     good,
        };
      });
    }
  });

  console.log('[Tool] Security Audit registered ✅');
})();
