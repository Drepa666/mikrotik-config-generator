/* ══════════════════════════════════════════════════════
   AI AGENT KEYSTORE v1.0
   Зберігає API ключ зашифрованим в localStorage
   Шифрування: AES-GCM через Web Crypto API
   ══════════════════════════════════════════════════════ */
'use strict';

window.AIKeystore = {

  STORAGE_KEY: 'ai-agent-apikey-v2',

  /* Підставляємо ключ в DOM елементи які читає electron-bridge.js */
  _fillDOM: function(apiKey) {
    var keyEl  = document.getElementById('ai-key');
    var provEl = document.getElementById('ai-prov');
    if (keyEl)  keyEl.value  = apiKey;
    if (provEl) {
      /* Ставимо Groq */
      for (var i = 0; i < provEl.options.length; i++) {
        if (provEl.options[i].value === 'groq' ||
            provEl.options[i].text.toLowerCase().includes('groq')) {
          provEl.selectedIndex = i;
          break;
        }
      }
    }
    console.log('[Keystore] DOM заповнено ✅');
  },
  _sessionKey: null, /* Розшифрований ключ в пам'яті сесії */

  /* ── Хешування пароля ── */
  hashPassword: async function(password) {
    var enc  = new TextEncoder();
    var data = enc.encode(password + ':ai-agent-salt-mikrotik');
    var hash = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hash);
  },

  /* ── Шифрування ── */
  encrypt: async function(text, password) {
    var keyMaterial = await AIKeystore.hashPassword(password);
    var key = await crypto.subtle.importKey(
      'raw', keyMaterial, { name: 'AES-GCM' }, false, ['encrypt']
    );
    var iv  = crypto.getRandomValues(new Uint8Array(12));
    var enc = new TextEncoder();
    var encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      enc.encode(text)
    );
    /* Зберігаємо iv + encrypted як base64 */
    var combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    return btoa(String.fromCharCode(...combined));
  },

  /* ── Дешифрування ── */
  decrypt: async function(encoded, password) {
    try {
      var combined    = Uint8Array.from(atob(encoded), function(c){ return c.charCodeAt(0); });
      var iv          = combined.slice(0, 12);
      var encrypted   = combined.slice(12);
      var keyMaterial = await AIKeystore.hashPassword(password);
      var key = await crypto.subtle.importKey(
        'raw', keyMaterial, { name: 'AES-GCM' }, false, ['decrypt']
      );
      var decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encrypted
      );
      return new TextDecoder().decode(decrypted);
    } catch(e) {
      return null; /* Невірний пароль */
    }
  },

  /* ── Зберегти ключ ── */
  saveKey: async function(apiKey, password) {
    var encrypted = await AIKeystore.encrypt(apiKey, password);
    localStorage.setItem(AIKeystore.STORAGE_KEY, encrypted);
    AIKeystore._sessionKey = apiKey; /* Кешуємо в сесії */
    /* Підставляємо в DOM елементи провайдера */
    var keyEl  = document.getElementById('ai-key');
    var provEl = document.getElementById('ai-prov');
    if (keyEl)  keyEl.value  = apiKey;
    if (provEl) provEl.value = 'groq';
    console.log('[Keystore] API key saved ✅');
    return true;
  },

  /* ── Отримати ключ (з сесії або дешифрувати) ── */
  getKey: async function(password) {
    /* Якщо є в сесії — повертаємо */
    if (AIKeystore._sessionKey) return AIKeystore._sessionKey;
    var encrypted = localStorage.getItem(AIKeystore.STORAGE_KEY);
    if (!encrypted) return null;
    if (!password) return null;
    var key = await AIKeystore.decrypt(encrypted, password);
    if (key) {
      AIKeystore._sessionKey = key;
      /* Підставляємо в DOM */
      var keyEl  = document.getElementById('ai-key');
      var provEl = document.getElementById('ai-prov');
      if (keyEl)  keyEl.value  = key;
      if (provEl) provEl.value = 'groq';
    }
    return key;
  },

  /* ── Чи є збережений ключ ── */
  hasKey: function() {
    return !!localStorage.getItem(AIKeystore.STORAGE_KEY);
  },

  /* ── Очистити ── */
  clear: function() {
    localStorage.removeItem(AIKeystore.STORAGE_KEY);
    AIKeystore._sessionKey = null;
    console.log('[Keystore] Cleared');
  },

  /* ── Перевірити пароль ── */
  verifyPassword: async function(password) {
    var encrypted = localStorage.getItem(AIKeystore.STORAGE_KEY);
    if (!encrypted) return false;
    var result = await AIKeystore.decrypt(encrypted, password);
    return result !== null;
  },

  /* ── Показати модал ── */
  showModal: function(onSuccess) {
    var existing = document.getElementById('keystore-modal');
    if (existing) existing.remove();

    var hasKey = AIKeystore.hasKey();
    var modal  = document.createElement('div');
    modal.id   = 'keystore-modal';
    modal.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;' +
      'background:rgba(0,0,0,.8);z-index:99999;display:flex;' +
      'align-items:center;justify-content:center;';

    modal.innerHTML =
      '<div style="background:#0d1117;border:1px solid #2a3b48;border-radius:14px;' +
        'width:440px;padding:0;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.7);">' +

        /* Header */
        '<div style="background:linear-gradient(135deg,#1a1a3a,#0d1117);' +
          'padding:20px 24px;border-bottom:1px solid #1a2a38;">' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<div style="width:36px;height:36px;background:linear-gradient(135deg,#5b4efc,#8b5efc);' +
              'border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;">🔑</div>' +
            '<div>' +
              '<div style="font-weight:700;color:#e6edf3;font-size:15px;">Groq API Ключ</div>' +
              '<div style="font-size:11px;color:#4a6070;">' +
                (hasKey ? '🔒 Ключ збережено — введи пароль' : '➕ Додай ключ і захисти паролем') +
              '</div>' +
            '</div>' +
            '<button onclick="document.getElementById(\'keystore-modal\').remove()" ' +
              'style="margin-left:auto;background:transparent;border:1px solid #2a3b48;' +
              'color:#4a6070;border-radius:6px;padding:4px 10px;cursor:pointer;">✕</button>' +
          '</div>' +
        '</div>' +

        '<div style="padding:24px;">' +

          /* Groq API Key input — тільки якщо немає або змінюємо */
          '<div id="ks-key-section">' +
            (hasKey ? '' :
              '<div style="margin-bottom:16px;">' +
                '<label style="color:#8ea3b0;font-size:12px;display:block;margin-bottom:6px;">' +
                  '🔑 Groq API Key ' +
                  '<a href="https://console.groq.com/keys" target="_blank" ' +
                    'style="color:#5b4efc;font-size:11px;text-decoration:none;">Отримати ключ ↗</a>' +
                '</label>' +
                '<input id="ks-api-key" type="password" ' +
                  'placeholder="gsk_..." ' +
                  'style="width:100%;background:#060d14;border:1px solid #2a3b48;border-radius:8px;' +
                  'color:#e6edf3;padding:10px 14px;font-size:13px;box-sizing:border-box;' +
                  'font-family:monospace;">' +
                '<div style="font-size:10px;color:#4a6070;margin-top:4px;">Починається з gsk_...</div>' +
              '</div>'
            ) +
          '</div>' +

          /* Password */
          '<div style="margin-bottom:16px;">' +
            '<label style="color:#8ea3b0;font-size:12px;display:block;margin-bottom:6px;">' +
              (hasKey ? '🔐 Пароль для розблокування' : '🔐 Придумай пароль захисту') +
            '</label>' +
            '<input id="ks-password" type="password" ' +
              'placeholder="Твій секретний пароль..." ' +
              'style="width:100%;background:#060d14;border:1px solid #2a3b48;border-radius:8px;' +
              'color:#e6edf3;padding:10px 14px;font-size:13px;box-sizing:border-box;">' +
          '</div>' +

          /* Error */
          '<div id="ks-error" style="display:none;background:#1a0808;border:1px solid #3a1a1a;' +
            'border-radius:6px;padding:8px 12px;color:#e05252;font-size:12px;margin-bottom:12px;"></div>' +

          /* Buttons */
          '<div style="display:flex;gap:8px;">' +
            (hasKey ?
              '<button onclick="window.AIKeystore.changeKeyFlow()" ' +
                'style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;' +
                'border-radius:8px;padding:10px 16px;cursor:pointer;font-size:13px;flex:1;">🔄 Змінити ключ</button>' +
              '<button onclick="window.AIKeystore.unlockFlow()" ' +
                'style="background:linear-gradient(135deg,#5b4efc,#8b5efc);color:#fff;border:none;' +
                'border-radius:8px;padding:10px 20px;cursor:pointer;font-size:13px;font-weight:700;flex:2;">' +
                '🔓 Розблокувати</button>'
            :
              '<button onclick="document.getElementById(\'keystore-modal\').remove()" ' +
                'style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;' +
                'border-radius:8px;padding:10px 16px;cursor:pointer;font-size:13px;">Скасувати</button>' +
              '<button onclick="window.AIKeystore.saveFlow()" ' +
                'style="background:linear-gradient(135deg,#5b4efc,#8b5efc);color:#fff;border:none;' +
                'border-radius:8px;padding:10px 20px;cursor:pointer;font-size:13px;font-weight:700;flex:1;">' +
                '💾 Зберегти ключ</button>'
            ) +
          '</div>' +

          /* Info */
          '<div style="margin-top:16px;background:#080f17;border:1px solid #1a2a38;' +
            'border-radius:8px;padding:10px 14px;">' +
            '<div style="font-size:11px;color:#4a6070;line-height:1.6;">' +
              '🔒 Ключ шифрується AES-256 і зберігається локально<br>' +
              '🚫 Нікуди не відправляється крім api.groq.com<br>' +
              '💡 Пароль потрібен тільки при перезапуску' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    /* Enter для підтвердження */
    setTimeout(function() {
      var pwdInput = document.getElementById('ks-password');
      if (pwdInput) {
        pwdInput.focus();
        pwdInput.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            if (AIKeystore.hasKey()) AIKeystore.unlockFlow();
            else AIKeystore.saveFlow();
          }
        });
      }
    }, 100);

    AIKeystore._onSuccess = onSuccess || null;
  },

  /* ── Зберегти новий ключ ── */
  saveFlow: async function() {
    var apiKey   = (document.getElementById('ks-api-key')  ||{value:''}).value.trim();
    var password = (document.getElementById('ks-password') ||{value:''}).value;
    var errEl    = document.getElementById('ks-error');

    if (!apiKey || !apiKey.startsWith('gsk_')) {
      if (errEl) { errEl.style.display='block'; errEl.textContent='❌ Невірний формат ключа (має починатись з gsk_)'; }
      return;
    }
    if (!password || password.length < 4) {
      if (errEl) { errEl.style.display='block'; errEl.textContent='❌ Пароль має бути мінімум 4 символи'; }
      return;
    }

    await AIKeystore.saveKey(apiKey, password);

    var modal = document.getElementById('keystore-modal');
    if (modal) modal.remove();

    /* Показуємо успіх */
    AIKeystore.showToast('✅ API ключ збережено і захищено паролем!', 'success');

    if (AIKeystore._onSuccess) AIKeystore._onSuccess(apiKey);
  },

  /* ── Розблокувати існуючий ключ ── */
  unlockFlow: async function() {
    var password = (document.getElementById('ks-password')||{value:''}).value;
    var errEl    = document.getElementById('ks-error');

    if (!password) {
      if (errEl) { errEl.style.display='block'; errEl.textContent='❌ Введи пароль'; }
      return;
    }

    var key = await AIKeystore.getKey(password);
    if (!key) {
      if (errEl) { errEl.style.display='block'; errEl.textContent='❌ Невірний пароль!'; }
      /* Анімація помилки */
      var input = document.getElementById('ks-password');
      if (input) {
        input.style.borderColor = '#e05252';
        input.value = '';
        input.focus();
        setTimeout(function(){ input.style.borderColor = '#2a3b48'; }, 1000);
      }
      return;
    }

    var modal = document.getElementById('keystore-modal');
    if (modal) modal.remove();

    AIKeystore.showToast('🔓 Ключ розблоковано!', 'success');
    if (AIKeystore._onSuccess) AIKeystore._onSuccess(key);
  },

  /* ── Змінити ключ ── */
  changeKeyFlow: function() {
    AIKeystore.clear();
    AIKeystore.showModal();
  },

  /* ── Toast повідомлення ── */
  showToast: function(msg, type) {
    var toast = document.createElement('div');
    toast.style.cssText =
      'position:fixed;bottom:90px;right:24px;z-index:99999;' +
      'background:' + (type==='success' ? 'linear-gradient(135deg,#0a2a1a,#0d3520)' : 'linear-gradient(135deg,#2a0808,#3a0d0d)') + ';' +
      'border:1px solid ' + (type==='success' ? '#2a5a3a' : '#5a2a2a') + ';' +
      'color:' + (type==='success' ? '#5fd0a5' : '#e05252') + ';' +
      'border-radius:10px;padding:10px 18px;font-size:13px;' +
      'box-shadow:0 4px 20px rgba(0,0,0,.4);' +
      'animation:slideUp .3s ease;';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function(){ toast.style.opacity='0'; toast.style.transition='opacity .3s'; }, 2500);
    setTimeout(function(){ toast.remove(); }, 3000);
  },

  /* ── Ініціалізація: розблокування при старті ── */
  initSession: function() {
    if (!AIKeystore.hasKey()) {
      console.log('[Keystore] No key saved');
      return;
    }
    /* Автоматично показуємо пароль при старті */
    console.log('[Keystore] Key found, requesting password...');
    setTimeout(function() {
      /* Показуємо тільки якщо AI sidebar відкритий або через 2 сек */
      AIKeystore.showModal(function(key) {
        console.log('[Keystore] Unlocked at startup ✅');
      });
    }, 1500);
  },

  /* ── Отримати ключ для API запиту ── */
  getKeyForRequest: async function() {
    /* Якщо є в сесії — повертаємо */
    if (AIKeystore._sessionKey) return AIKeystore._sessionKey;

    /* Якщо немає збереженого ключа */
    if (!AIKeystore.hasKey()) {
      return new Promise(function(resolve) {
        AIKeystore.showModal(function(key) { resolve(key); });
      });
    }

    /* Є ключ але не розблокований — просимо пароль */
    return new Promise(function(resolve) {
      AIKeystore._onSuccess = function(key) { resolve(key); };
      AIKeystore.showModal(function(key) { resolve(key); });
    });
  }
};

/* ── Ініціалізація ── */
AIKeystore.initSession();
console.log('[Keystore] Ready. Key saved:', AIKeystore.hasKey());
