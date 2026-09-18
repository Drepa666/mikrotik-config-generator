/* ══════════════════════════════════════════════════════
   TOOL: Script Generator
   ══════════════════════════════════════════════════════ */
'use strict';

(function() {
  if (!window.AIAgent) return;

  AIAgent.tools.register({
    name:        'script_generator',
    icon:        '📝',
    description: 'Генерація RouterOS скриптів і команд',

    run: function(params) {
      if (!params || !params.description) return Promise.reject('Немає опису');
      return AIAgent.send(
        'Згенеруй RouterOS скрипт для: ' + params.description +
        '\nПоверни тільки код без пояснень.'
      );
    }
  });

  console.log('[Tool] Script Generator registered ✅');
})();
