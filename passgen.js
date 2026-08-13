/* ============================================================
   passgen.js — Генератор паролів для WireGuard/PSK/Wi-Fi
   Patch 35A | MikroTik Config Generator
   ============================================================ */
'use strict';

var PASSGEN = {

  /* ── Генерація випадкових байт ── */
  randomBytes: function(n) {
    var arr = new Uint8Array(n);
    window.crypto.getRandomValues(arr);
    return arr;
  },

  /* ── Base64 для WireGuard ── */
  toBase64: function(bytes) {
    var binary = '';
    bytes.forEach(function(b) { binary += String.fromCharCode(b); });
    return btoa(binary);
  },

  /* ── WireGuard PSK (32 байти → base64) ── */
  generateWgPsk: function() {
    return this.toBase64(this.randomBytes(32));
  },

  /* ── IPsec PSK (випадковий hex) ── */
  generateIpsecPsk: function(len) {
    len = len || 32;
    var bytes = this.randomBytes(len);
    return Array.from(bytes).map(function(b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  },

  /* ── Wi-Fi пароль ── */
  generateWifiPass: function(len, complexity) {
    len = len || 16;
    var sets = {
      simple:  'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789',
      medium:  'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%',
      strong:  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+',
    };
    var chars = sets[complexity] || sets.medium;
    var bytes = this.randomBytes(len);
    return Array.from(bytes).map(function(b) {
      return chars[b % chars.length];
    }).join('');
  },

  /* ── Admin пароль ── */
  generateAdminPass: function(len) {
    len = len || 20;
    var chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    var bytes = this.randomBytes(len);
    return Array.from(bytes).map(function(b) {
      return chars[b % chars.length];
    }).join('');
  },

  /* ── Strength meter ── */
  strength: function(pass) {
    var score = 0;
    if (pass.length >= 8)  score++;
    if (pass.length >= 12) score++;
    if (pass.length >= 20) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^a-zA-Z0-9]/.test(pass)) score++;
    if (score <= 2) return { label: 'Слабкий',   color: '#e0665a', pct: 25  };
    if (score <= 4) return { label: 'Середній',  color: '#e6b35a', pct: 55  };
    if (score <= 5) return { label: 'Хороший',   color: '#5b9bd5', pct: 75  };
    return             { label: 'Відмінний', color: '#5fd0a5', pct: 100 };
  }
};

/* ══════════════════════════════════════════════
   UI
══════════════════════════════════════════════ */
function initPassGen() {

  /* Модальне вікно */
  var modal = document.createElement('div');
  modal.id = 'passgen-modal';
  modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9999;align-items:center;justify-content:center;padding:20px;overflow-y:auto;';

  var inner = document.createElement('div');
  inner.style.cssText = 'background:#16212c;border:1px solid #2a3b48;border-radius:12px;padding:24px;max-width:560px;width:100%;margin:auto;';

  inner.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
    '<h3 style="margin:0;color:#5fd0a5;font-size:14px;">🔐 Генератор паролів</h3>' +
    '<button id="pg-close" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:4px 12px;border-radius:6px;cursor:pointer;">✕</button>' +
    '</div>' +

    /* Таби */
    '<div style="display:flex;gap:6px;margin-bottom:18px;flex-wrap:wrap;" id="pg-tabs">' +
    pgTab('wg',    '🔒 WireGuard PSK',  true) +
    pgTab('ipsec', '🔐 IPsec PSK',      false) +
    pgTab('wifi',  '📶 Wi-Fi',          false) +
    pgTab('admin', '👤 Admin пароль',   false) +
    '</div>' +

    /* Контент */
    '<div id="pg-content"></div>' +

    /* Результат */
    '<div style="margin-top:16px;">' +
    '<div style="font-size:11px;color:#4a6070;margin-bottom:6px;">Згенерований пароль:</div>' +
    '<div style="display:flex;gap:8px;align-items:center;">' +
    '<div id="pg-result" style="flex:1;background:#060d14;border:1px solid #2a3b48;border-radius:8px;' +
    'padding:12px 14px;font-family:monospace;font-size:13px;color:#5fd0a5;' +
    'word-break:break-all;min-height:46px;"></div>' +
    '<button id="pg-copy" style="background:#5fd0a5;color:#082018;border:none;padding:10px 14px;' +
    'border-radius:8px;cursor:pointer;font-weight:700;font-size:12px;white-space:nowrap;">📋 Копіювати</button>' +
    '</div>' +

    /* Strength */
    '<div style="margin-top:10px;">' +
    '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">' +
    '<span style="font-size:11px;color:#4a6070;">Надійність:</span>' +
    '<span id="pg-strength-label" style="font-size:11px;font-weight:600;"></span>' +
    '</div>' +
    '<div style="height:4px;background:#1c2a37;border-radius:2px;">' +
    '<div id="pg-strength-bar" style="height:4px;border-radius:2px;transition:all .3s;width:0;"></div>' +
    '</div>' +
    '</div>' +

    /* Кнопка вставити в форму */
    '<button id="pg-apply" style="margin-top:12px;width:100%;background:transparent;' +
    'border:1px solid #5fd0a555;color:#5fd0a5;padding:9px;border-radius:8px;' +
    'cursor:pointer;font-size:12px;">⬆️ Вставити у відповідне поле форми</button>' +

    '</div>';

  modal.appendChild(inner);
  document.body.appendChild(modal);

  /* Закрити */
  document.getElementById('pg-close').addEventListener('click', function() {
    modal.style.display = 'none';
  });
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.style.display = 'none';
  });

  /* Стан */
  var currentTab = 'wg';
  var currentPass = '';

  /* Рендер таба */
  function renderTab(tab) {
    var content = document.getElementById('pg-content');
    var html = '';

    if (tab === 'wg') {
      html =
        '<div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;padding:14px;">' +
        '<div style="font-size:12px;color:#8ea3b0;margin-bottom:10px;">WireGuard Pre-Shared Key (256-bit, base64)</div>' +
        '<button id="pg-gen" style="' + genBtnStyle() + '">🔄 Згенерувати PSK</button>' +
        '</div>';
    } else if (tab === 'ipsec') {
      html =
        '<div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;padding:14px;display:grid;gap:10px;">' +
        '<div style="font-size:12px;color:#8ea3b0;">IPsec Pre-Shared Key (hex)</div>' +
        mkSelect('pg-ipsec-len', 'Довжина', [['16','16 байт (128-bit)'],['32','32 байти (256-bit)'],['64','64 байти (512-bit)']]) +
        '<button id="pg-gen" style="' + genBtnStyle() + '">🔄 Згенерувати PSK</button>' +
        '</div>';
    } else if (tab === 'wifi') {
      html =
        '<div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;padding:14px;display:grid;gap:10px;">' +
        '<div style="font-size:12px;color:#8ea3b0;">Wi-Fi WPA2 пароль (мін. 8 символів)</div>' +
        mkSelect('pg-wifi-complexity', 'Складність', [['simple','Простий (без спецсимволів)'],['medium','Середній (+ ! @ # $)'],['strong','Складний (всі символи)']]) +
        mkSelect('pg-wifi-len', 'Довжина', [['8','8'],['12','12'],['16','16 ✅'],['20','20'],['24','24']]) +
        '<button id="pg-gen" style="' + genBtnStyle() + '">🔄 Згенерувати пароль</button>' +
        '</div>';
    } else if (tab === 'admin') {
      html =
        '<div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;padding:14px;display:grid;gap:10px;">' +
        '<div style="font-size:12px;color:#8ea3b0;">Надійний пароль для admin (без схожих символів)</div>' +
        mkSelect('pg-admin-len', 'Довжина', [['12','12'],['16','16'],['20','20 ✅'],['24','24'],['32','32']]) +
        '<button id="pg-gen" style="' + genBtnStyle() + '">🔄 Згенерувати пароль</button>' +
        '</div>';
    }

    content.innerHTML = html;

    /* Генерація */
    document.getElementById('pg-gen').addEventListener('click', function() {
      var pass = '';

      if (tab === 'wg') {
        pass = PASSGEN.generateWgPsk();
      } else if (tab === 'ipsec') {
        var len = parseInt((document.getElementById('pg-ipsec-len') || {}).value || '32', 10);
        pass = PASSGEN.generateIpsecPsk(len);
      } else if (tab === 'wifi') {
        var len = parseInt((document.getElementById('pg-wifi-len') || {}).value || '16', 10);
        var complexity = (document.getElementById('pg-wifi-complexity') || {}).value || 'medium';
        pass = PASSGEN.generateWifiPass(len, complexity);
      } else if (tab === 'admin') {
        var len = parseInt((document.getElementById('pg-admin-len') || {}).value || '20', 10);
        pass = PASSGEN.generateAdminPass(len);
      }

      currentPass = pass;
      document.getElementById('pg-result').textContent = pass;

      /* Strength */
      var str = PASSGEN.strength(pass);
      document.getElementById('pg-strength-label').textContent = str.label;
      document.getElementById('pg-strength-label').style.color = str.color;
      document.getElementById('pg-strength-bar').style.width = str.pct + '%';
      document.getElementById('pg-strength-bar').style.background = str.color;
    });

    /* Авто-генерація */
    document.getElementById('pg-gen').click();
  }

  /* Таби */
  document.getElementById('pg-tabs').addEventListener('click', function(e) {
    var btn = e.target.closest('[data-tab]');
    if (!btn) return;
    currentTab = btn.getAttribute('data-tab');

    document.querySelectorAll('#pg-tabs [data-tab]').forEach(function(b) {
      b.style.background = b === btn ? '#5fd0a5' : 'transparent';
      b.style.color      = b === btn ? '#082018' : '#8ea3b0';
    });

    renderTab(currentTab);
  });

  /* Копіювати */
  document.getElementById('pg-copy').addEventListener('click', function() {
    if (!currentPass) return;
    var btn = this;
    var orig = btn.textContent;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(currentPass).then(function() {
        btn.textContent = '✓ Скопійовано!';
        setTimeout(function(){ btn.textContent = orig; }, 1500);
      });
    } else {
      var ta = document.createElement('textarea');
      ta.value = currentPass;
      ta.style.cssText = 'position:fixed;left:-9999px;';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      btn.textContent = '✓ Скопійовано!';
      setTimeout(function(){ btn.textContent = orig; }, 1500);
    }
  });

  /* Вставити у форму */
  document.getElementById('pg-apply').addEventListener('click', function() {
    if (!currentPass) return;
    var fieldMap = {
      'wg':    'wgpsk',
      'ipsec': 'ipsecpsk',
      'wifi':  'wifipass',
      'admin': 'adminpass',
    };
    var fieldId = fieldMap[currentTab];
    var field = document.getElementById(fieldId);
    if (field) {
      field.value = currentPass;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      this.textContent = '✓ Вставлено у поле!';
      setTimeout(function(){
        document.getElementById('pg-apply').textContent = '⬆️ Вставити у відповідне поле форми';
      }, 1500);
    } else {
      alert('Поле форми не знайдено.\nСкопіюй пароль і встав вручну.');
    }
  });

  /* Перший рендер */
  renderTab('wg');

  /* ── Кнопка в UI ── */
  var btn = document.createElement('button');
  btn.id = 'btn-passgen';
  btn.className = 'sec';
  btn.textContent = '🔐 Генератор паролів';

  var btnbar = document.querySelector('.btnbar');
  if (btnbar) btnbar.appendChild(btn);

  btn.addEventListener('click', function() {
    modal.style.display = 'flex';
  });

  /* Кнопки 🔐 біля полів паролів */
  var passFields = [
    { id: 'wifipass',  tab: 'wifi'  },
    { id: 'adminpass', tab: 'admin' },
    { id: 'wgpsk',     tab: 'wg'    },
  ];

  passFields.forEach(function(pf) {
    var field = document.getElementById(pf.id);
    if (!field) return;

    var genBtn = document.createElement('button');
    genBtn.type = 'button';
    genBtn.textContent = '🔐';
    genBtn.title = 'Згенерувати пароль';
    genBtn.style.cssText = 'margin-left:6px;background:transparent;border:1px solid #2a3b48;color:#5fd0a5;padding:4px 8px;border-radius:5px;cursor:pointer;font-size:12px;vertical-align:middle;';

    field.parentNode.insertBefore(genBtn, field.nextSibling);

    genBtn.addEventListener('click', function() {
      /* Перемикаємо на потрібний таб */
      currentTab = pf.tab;
      document.querySelectorAll('#pg-tabs [data-tab]').forEach(function(b) {
        var isActive = b.getAttribute('data-tab') === pf.tab;
        b.style.background = isActive ? '#5fd0a5' : 'transparent';
        b.style.color      = isActive ? '#082018' : '#8ea3b0';
      });
      renderTab(pf.tab);
      modal.style.display = 'flex';
    });
  });

  console.log('[passgen] ready');
}

/* Хелпери */
function pgTab(id, label, active) {
  return '<button data-tab="' + id + '" style="' +
    'background:' + (active ? '#5fd0a5' : 'transparent') + ';' +
    'color:' + (active ? '#082018' : '#8ea3b0') + ';' +
    'border:1px solid ' + (active ? '#5fd0a5' : '#2a3b48') + ';' +
    'padding:5px 12px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;">' +
    label + '</button>';
}
function genBtnStyle() {
  return 'width:100%;background:#5fd0a5;color:#082018;border:none;padding:10px;border-radius:8px;cursor:pointer;font-weight:700;font-size:12px;';
}
function mkSelect(id, label, options) {
  var html = '<div><label style="font-size:11px;color:#8ea3b0;display:block;margin-bottom:4px;">' + label + '</label>';
  html += '<select id="' + id + '" style="width:100%;background:#16212c;border:1px solid #2a3b48;color:#e6edf3;padding:7px 10px;border-radius:6px;font-size:12px;">';
  options.forEach(function(o) {
    html += '<option value="' + o[0] + '">' + o[1] + '</option>';
  });
  html += '</select></div>';
  return html;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPassGen);
} else {
  initPassGen();
}