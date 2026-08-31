/* ══ FAB Manager v3 ══ */
(function() {
  'use strict';

  var PLUGIN_FABS = ['wg-fab', 'portmap-fab'];
  var BASE = 418;  /* вище найвищого системного FAB */
  var SIZE = 48;
  var GAP  = 8;

  function getHighestSystemFab() {
    /* Знаходимо найвищу системну FAB кнопку */
    var maxBottom = 358;
    document.querySelectorAll('button[style*="position:fixed"], button[style*="position: fixed"]').forEach(function(btn) {
      if (PLUGIN_FABS.indexOf(btn.id) >= 0) return; /* пропускаємо наші */
      var b = parseInt(btn.style.bottom) || 0;
      if (b > maxBottom) maxBottom = b;
    });
    return maxBottom;
  }

  function reposition() {
    var highest = getHighestSystemFab();
    var bottom  = highest + SIZE + GAP + 10;

    PLUGIN_FABS.forEach(function(id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (el.style.display === 'none' || el.style.display === '') return;
      el.style.bottom = bottom + 'px';
      el.style.right  = '16px';
      bottom += SIZE + GAP;
    });
  }

  var obs = new MutationObserver(function() {
    clearTimeout(obs._t);
    obs._t = setTimeout(reposition, 200);
  });
  obs.observe(document.body, {
    childList: true, subtree: true,
    attributes: true, attributeFilter: ['style'],
  });

  window.addEventListener('load', function() {
    setTimeout(reposition, 800);
  });

  window.FabManager = {
    reposition: reposition,
    register: function(id) {
      if (PLUGIN_FABS.indexOf(id) < 0) {
        PLUGIN_FABS.push(id);
        setTimeout(reposition, 100);
      }
    },
  };
  console.log('[FAB Manager] v3 ready, BASE=' + BASE + 'px');
})();
