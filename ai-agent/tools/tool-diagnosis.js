/* ══════════════════════════════════════════════════════
   TOOL: Network Diagnosis
   ══════════════════════════════════════════════════════ */
'use strict';

(function() {
  if (!window.AIAgent) return;

  AIAgent.tools.register({
    name:        'diagnosis',
    icon:        '🔍',
    description: 'Діагностика проблем мережі та роутера',

    run: function(params) {
      var router = AIAgent.getRouter();
      if (!router) return Promise.reject('Немає роутера');

      /* Збираємо діагностичні дані */
      var cmds = [
        '/system resource print',
        '/ip firewall connection print count-only',
        '/log print where topics~"error" limit=20',
        '/interface print stats',
      ];

      return Promise.allSettled(
        cmds.map(function(cmd) { return AIAgent.ssh(cmd); })
      ).then(function(results) {
        var diag = {};
        cmds.forEach(function(cmd, i) {
          diag[cmd] = results[i].value ? results[i].value.output : 'error';
        });
        return diag;
      });
    }
  });

  console.log('[Tool] Diagnosis registered ✅');
})();
