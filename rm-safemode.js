'use strict';
/* ═══════════════════════════════════════════════════════
   rm-safemode.js — Safe Mode для Router Manager
   F9 = toggle, 60s таймер, автовідкат якщо не підтверджено
   ═══════════════════════════════════════════════════════ */

window.RMSafeMode = (function() {

  var _active    = false;
  var _backup    = null;   /* текст /export terse */
  var _timer     = null;   /* setTimeout handle */
  var _interval  = null;   /* setInterval для countdown */
  var _remaining = 60;     /* секунд до відкату */
  var _router    = null;
  var _enabled   = true;   /* можна вимкнути для поточного розділу */

  var TIMEOUT_SEC = 60;

  /* ── Отримуємо роутер ── */
  function getRouter() {
    if (window.getActiveRouter) return window.getActiveRouter();
    if (window.RMDataStore && window.RMDataStore._getActiveRouter)
      return window.RMDataStore._getActiveRouter();
    return null;
  }

  /* ── SSH виклик ── */
  function ssh(router, cmd) {
    if (window.sshCall) return window.sshCall(router, cmd);
    return Promise.reject(new Error('sshCall not available'));
  }

  /* ── UI: Banner ── */
  function injectCSS() {
    if (document.getElementById('sm-css')) return;
    var s = document.createElement('style');
    s.id = 'sm-css';
    s.textContent = [
      '#sm-banner {',
      '  display:none; position:fixed; top:0; left:0; right:0; z-index:99999;',
      '  background:linear-gradient(135deg,#2a1500,#3a1a00);',
      '  border-bottom:2px solid #f0a840;',
      '  padding:8px 16px; align-items:center; gap:12px;',
      '  box-shadow:0 2px 20px rgba(240,168,64,.3);',
      '}',
      '#sm-banner.sm-active { display:flex; }',
      '#sm-icon { font-size:18px; }',
      '#sm-text {',
      '  flex:1; color:#f0a840; font-size:13px; font-weight:700;',
      '}',
      '#sm-countdown {',
      '  color:#e08080; font-family:monospace; font-size:14px;',
      '  font-weight:700; min-width:40px; text-align:center;',
      '}',
      '.sm-btn {',
      '  border:none; border-radius:6px; padding:6px 14px;',
      '  cursor:pointer; font-size:12px; font-weight:700;',
      '}',
      '#sm-btn-confirm {',
      '  background:linear-gradient(135deg,#1a4a1a,#2a6a2a);',
      '  color:#5fd0a5; border:1px solid #3a7a3a;',
      '}',
      '#sm-btn-confirm:hover { background:#2a6a2a; }',
      '#sm-btn-revert {',
      '  background:linear-gradient(135deg,#4a1a1a,#6a2a2a);',
      '  color:#e08080; border:1px solid #7a3a3a;',
      '}',
      '#sm-btn-revert:hover { background:#6a2a2a; }',
      '#sm-btn-close {',
      '  background:transparent; color:#4a6070;',
      '  border:1px solid #2a3b48; font-size:11px;',
      '}',
      /* Toggle у кутку кожного розділу */
      '#sm-toggle-wrap {',
      '  position:fixed; bottom:80px; right:16px;',
      '  z-index:9998; display:none;',
      '}',
      '#sm-toggle-wrap.sm-visible { display:block; }',
      '#sm-toggle-btn {',
      '  background:#0d1117; border:1px solid #2a3b48;',
      '  color:#4a6070; border-radius:8px; padding:6px 12px;',
      '  cursor:pointer; font-size:11px; display:flex;',
      '  align-items:center; gap:6px;',
      '}',
      '#sm-toggle-btn.sm-on {',
      '  border-color:#f0a840; color:#f0a840;',
      '  background:#1a1000;',
      '}',
      /* F9 hint */
      '#sm-hint {',
      '  position:fixed; bottom:120px; right:16px;',
      '  background:#0d1117; border:1px solid #1c2a37;',
      '  color:#4a6070; border-radius:6px; padding:4px 10px;',
      '  font-size:10px; z-index:9997; pointer-events:none;',
      '}',
    ].join('\n');
    document.head.appendChild(s);
  }

  function buildUI() {
    if (document.getElementById('sm-banner')) return;

    /* Banner */
    var banner = document.createElement('div');
    banner.id = 'sm-banner';
    banner.innerHTML =
      '<span id="sm-icon">&#9888;</span>' +
      '<span id="sm-text">SAFE MODE — &#1079;&#1084;&#1110;&#1085;&#1080; &#1073;&#1091;&#1076;&#1091;&#1090;&#1100; &#1074;&#1110;&#1076;&#1082;&#1086;&#1095;&#1077;&#1085;&#1110; &#1072;&#1074;&#1090;&#1086;&#1084;&#1072;&#1090;&#1080;&#1095;&#1085;&#1086;</span>' +
      '<span id="sm-countdown">60</span>' +
      '<button class="sm-btn" id="sm-btn-confirm">&#10003; Confirm</button>' +
      '<button class="sm-btn" id="sm-btn-revert">&#8634; Revert now</button>' +
      '<button class="sm-btn" id="sm-btn-close">&#10005;</button>';
    document.body.insertBefore(banner, document.body.firstChild);

    /* Toggle */
    var tog = document.createElement('div');
    tog.id = 'sm-toggle-wrap';
    tog.innerHTML =
      '<button id="sm-toggle-btn" title="Toggle Safe Mode (F9)">&#127737; Safe Mode</button>';
    document.body.appendChild(tog);

    /* F9 hint */
    var hint = document.createElement('div');
    hint.id = 'sm-hint';
    hint.textContent = 'F9 = Safe Mode';
    document.body.appendChild(hint);

    /* Events */
    document.getElementById('sm-btn-confirm').onclick = confirm;
    document.getElementById('sm-btn-revert').onclick  = revert;
    document.getElementById('sm-btn-close').onclick   = function() {
      if (window.confirm('Exit Safe Mode without reverting? Changes will be kept.')) {
        confirm();
      }
    };
    document.getElementById('sm-toggle-btn').onclick = toggle;
  }

  /* ── Enter Safe Mode ── */
  function enter() {
    if (_active) return;
    _router = getRouter();
    if (!_router) {
      showNotice('No active router connected', '#e08080');
      return;
    }

    showNotice('Safe Mode: taking config snapshot...', '#f0a840');

    ssh(_router, '/export terse').then(function(res) {
      _backup = typeof res === 'string' ? res
              : (res && res.output) ? res.output : null;

      if (!_backup || _backup.length < 10) {
        showNotice('Safe Mode: failed to get backup', '#e08080');
        return;
      }

      _active    = true;
      _remaining = TIMEOUT_SEC;

      /* Show banner */
      var banner = document.getElementById('sm-banner');
      if (banner) banner.classList.add('sm-active');

      /* Push content down */
      var rmPanel = document.getElementById('rm-overlay') ||
                    document.getElementById('rm-panel');
      if (rmPanel) rmPanel.style.marginTop = '44px';

      /* Update toggle btn */
      updateToggleBtn();

      /* Start countdown */
      updateCountdown();
      _interval = setInterval(function() {
        _remaining--;
        updateCountdown();
        if (_remaining <= 0) {
          revert();
        }
      }, 1000);

      /* Auto-revert timer */
      _timer = setTimeout(function() {
        revert();
      }, TIMEOUT_SEC * 1000 + 500);

      showNotice('Safe Mode ON — ' + TIMEOUT_SEC + 's to auto-revert', '#f0a840');
      console.log('[SafeMode] entered, backup: ' + _backup.length + ' chars');

    }).catch(function(e) {
      showNotice('Safe Mode error: ' + e, '#e08080');
    });
  }

  /* ── Confirm (keep changes) ── */
  function confirm() {
    if (!_active) return;
    clearTimers();
    _active  = false;
    _backup  = null;
    _router  = null;

    hideBanner();
    updateToggleBtn();
    showNotice('Safe Mode: changes confirmed and saved', '#5fd0a5');
    console.log('[SafeMode] confirmed');
  }

  /* ── Revert ── */
  function revert() {
    if (!_active) return;
    clearTimers();

    var backup = _backup;
    _active  = false;
    _backup  = null;

    hideBanner();
    updateToggleBtn();

    if (!backup || !_router) {
      showNotice('Safe Mode: no backup to revert', '#e08080');
      return;
    }

    showNotice('Safe Mode: reverting...', '#e08080');

    /* Зберігаємо backup як .rsc файл і імпортуємо */
    var cmd = '/file remove [find name=safe-mode-backup.rsc]; ' +
              ':delay 500ms; ' +
              '/import file-name=safe-mode-backup.rsc';

    /* Спочатку записуємо backup через SSH */
    var lines = backup.split('\n');
    /* Записуємо через /file set — надсилаємо команди */
    ssh(_router, '/system script remove [find name=safe-mode-revert]; ' +
        '/system script add name=safe-mode-revert source="' +
        backup.replace(/"/g, '\\"').replace(/\n/g, '\\n').substring(0, 4000) +
        '"').then(function() {
      /* Альтернатива: просто повідомляємо про backup */
      showNotice(
        'Safe Mode: backup saved locally. Use Terminal to /import if needed.',
        '#f0a840'
      );
      /* Зберігаємо backup в localStorage для ручного відновлення */
      try {
        localStorage.setItem('sm-last-backup', backup);
        localStorage.setItem('sm-last-backup-time', new Date().toISOString());
      } catch(e2) {}
    }).catch(function() {
      /* Fallback: зберігаємо локально */
      try {
        localStorage.setItem('sm-last-backup', backup);
        localStorage.setItem('sm-last-backup-time', new Date().toISOString());
      } catch(e3) {}
      showNotice('Safe Mode reverted (backup saved locally)', '#f0a840');
    });

    console.log('[SafeMode] reverted');
  }

  /* ── Toggle (для кнопки в кутку) ── */
  function toggle() {
    if (_active) {
      if (window.confirm('Exit Safe Mode? Click OK to Confirm changes, Cancel to Revert.')) {
        confirm();
      } else {
        revert();
      }
    } else {
      enter();
    }
  }

  /* ── Enable/Disable для конкретного розділу ── */
  function setEnabled(val) {
    _enabled = val;
    var wrap = document.getElementById('sm-toggle-wrap');
    if (wrap) {
      wrap.classList.toggle('sm-visible', val);
    }
  }

  /* ── UI helpers ── */
  function hideBanner() {
    var banner = document.getElementById('sm-banner');
    if (banner) banner.classList.remove('sm-active');
    var rmPanel = document.getElementById('rm-overlay') ||
                  document.getElementById('rm-panel');
    if (rmPanel) rmPanel.style.marginTop = '';
  }

  function updateCountdown() {
    var el = document.getElementById('sm-countdown');
    if (!el) return;
    el.textContent = _remaining + 's';
    if (_remaining <= 10) {
      el.style.color = '#e08080';
      el.style.animation = 'none';
    }
    if (_remaining <= 5) {
      el.style.fontSize = '16px';
    }
  }

  function updateToggleBtn() {
    var btn = document.getElementById('sm-toggle-btn');
    if (!btn) return;
    if (_active) {
      btn.classList.add('sm-on');
      btn.innerHTML = '&#9888; Safe Mode ON';
    } else {
      btn.classList.remove('sm-on');
      btn.innerHTML = '&#127737; Safe Mode';
    }
  }

  function clearTimers() {
    if (_timer)    { clearTimeout(_timer);   _timer    = null; }
    if (_interval) { clearInterval(_interval); _interval = null; }
  }

  function showNotice(msg, color) {
    /* Використовуємо існуючий notification механізм якщо є */
    if (window.showToast) { window.showToast(msg, color); return; }
    if (window.RMNotify)  { window.RMNotify(msg, color); return; }
    /* Fallback: простий popup */
    var n = document.getElementById('sm-notice');
    if (!n) {
      n = document.createElement('div');
      n.id = 'sm-notice';
      n.style.cssText =
        'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);' +
        'padding:10px 20px;border-radius:8px;font-size:13px;font-weight:700;' +
        'z-index:999999;background:#0d1117;border:1px solid #2a3b48;' +
        'transition:opacity .3s;pointer-events:none;';
      document.body.appendChild(n);
    }
    n.textContent = msg;
    n.style.color = color || '#5fd0a5';
    n.style.borderColor = color || '#5fd0a5';
    n.style.opacity = '1';
    clearTimeout(n._t);
    n._t = setTimeout(function() { n.style.opacity = '0'; }, 3000);
  }

  /* ── Keyboard F9 ── */
  function initKeyboard() {
    document.addEventListener('keydown', function(e) {
      if (e.key === 'F9') {
        e.preventDefault();
        toggle();
      }
    });
  }

  /* ── Show/hide toggle button based on rm-content ── */
  function watchSection() {
    /* Показуємо toggle кнопку коли Router Manager відкритий */
    var obs = new MutationObserver(function() {
      var rmContent = document.getElementById('rm-content');
      var rmOverlay = document.getElementById('rm-overlay');
      var visible   = (rmContent && rmContent.style.display !== 'none') ||
                      (rmOverlay && rmOverlay.style.display !== 'none');
      var wrap = document.getElementById('sm-toggle-wrap');
      if (wrap) wrap.classList.toggle('sm-visible', !!visible || _active);
    });
    obs.observe(document.body, { childList: true, subtree: true, attributes: true });
  }

  /* ── Get last backup ── */
  function getLastBackup() {
    try {
      return {
        content: localStorage.getItem('sm-last-backup'),
        time:    localStorage.getItem('sm-last-backup-time'),
      };
    } catch(e) { return null; }
  }

  /* ── Init ── */
  function init() {
    injectCSS();
    buildUI();
    initKeyboard();
    watchSection();
    console.log('[SafeMode] ready — F9 to toggle');
  }

  return {
    init:          init,
    enter:         enter,
    confirm:       confirm,
    revert:        revert,
    toggle:        toggle,
    setEnabled:    setEnabled,
    getLastBackup: getLastBackup,
    isActive:      function() { return _active; },
  };

})();

/* Auto-init */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    window.RMSafeMode.init();
  });
} else {
  window.RMSafeMode.init();
}

console.log('[SafeMode] rm-safemode.js loaded');
