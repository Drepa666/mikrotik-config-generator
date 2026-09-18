/* ══════════════════════════════════════════════════════
   TOOL: SSH Executor
   ══════════════════════════════════════════════════════ */
'use strict';

(function() {
  if (!window.AIAgent) return;

  AIAgent.tools.register({
    name:        'ssh_exec',
    icon:        '⚡',
    description: 'Виконання команд на роутері через SSH',

    run: function(params) {
      if (!params || !params.command) return Promise.reject('Немає команди');
      return AIAgent.ssh(params.command);
    }
  });

  console.log('[Tool] SSH Executor registered ✅');
})();
