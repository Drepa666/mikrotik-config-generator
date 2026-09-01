'use strict';

(function() {
  'use strict';

  if (!window.electronAPI) {
    console.log('[Electron Bridge] не в Electron — пропускаємо');
    return;
  }

  console.log('[Electron Bridge] активовано — AI через main process (без CORS!)');

  /* ══════════════════════════════════════════════════════
     Замінюємо callAI — тепер через main process
     Немає CORS, немає обмежень браузера
     ══════════════════════════════════════════════════════ */
  window.callAI = function(prompt, maxTok) {
    var provEl  = document.getElementById('ai-prov');
    var keyEl   = document.getElementById('ai-key');
    var modelEl = document.getElementById('ai-model');

    var prov  = provEl  ? provEl.value         : 'groq';
    var key   = keyEl   ? keyEl.value.trim()   : '';
    var model = modelEl ? modelEl.value.trim()  : '';

    console.log('[Electron Bridge] callAI -> main process | provider:', prov, '| model:', model || '(default)');

    return window.electronAPI.aiRequest({
      provider: prov,
      key:      key,
      model:    model,
      prompt:   prompt,
      maxTok:   maxTok || 1024,
    }).then(function(result) {
      if (!result.ok) {
        throw new Error(result.error || 'AI помилка');
      }
      return result.text;
    });
  };

  /* ══════════════════════════════════════════════════════
     Нативне збереження .rsc через діалог Windows
     ══════════════════════════════════════════════════════ */
  window.downloadRsc = function(content, filename) {
    window.electronAPI.saveFile({
      title:    'Зберегти конфігурацію MikroTik',
      filename: filename || 'mikrotik-config.rsc',
      content:  content,
    }).then(function(result) {
      if (result.success) {
        console.log('[Electron] Збережено: ' + result.path);
      }
    }).catch(function(err) {
      console.error('[Electron] Помилка збереження:', err);
    });
  };

  /* ══════════════════════════════════════════════════════
     Версія додатку в заголовку вікна
     ══════════════════════════════════════════════════════ */
  window.electronAPI.getVersion().then(function(ver) {
    document.title = 'MikroTik Config Generator v' + ver;
    console.log('[Electron Bridge] версія:', ver);
  });

  /* ══════════════════════════════════════════════════════
     Нативний scrollbar стиль для Windows
     ══════════════════════════════════════════════════════ */
  var style = document.createElement('style');
  style.textContent = [
    '::-webkit-scrollbar { width: 6px; height: 6px; }',
    '::-webkit-scrollbar-track { background: #0d1821; }',
    '::-webkit-scrollbar-thumb { background: #2a3b48; border-radius: 3px; }',
    '::-webkit-scrollbar-thumb:hover { background: #5fd0a5; }',
  ].join('');
  document.head.appendChild(style);

  console.log('[Electron Bridge] готово — callAI без CORS, downloadRsc нативний');

})();