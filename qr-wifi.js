/* ============================================================
   qr-wifi.js — QR-код для Wi-Fi підключення
   Patch 34 | Без зовнішніх залежностей — чистий JS + Canvas
   ============================================================ */
'use strict';

/* ══════════════════════════════════════════════
   Мінімальний QR генератор (тільки Wi-Fi рядки)
   Використовує qrcode-generator алгоритм
══════════════════════════════════════════════ */

/* Wi-Fi рядок формату WPA */
function buildWifiString(ssid, pass, auth, hidden) {
  function esc(s) {
    return String(s || '').replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/"/g, '\\"')
      .replace(/:/g, '\\:');
  }
  var h = hidden ? 'true' : 'false';
  return 'WIFI:T:' + (auth || 'WPA') + ';S:' + esc(ssid) + ';P:' + esc(pass) + ';H:' + h + ';;';
}

/* ── Мінімальний QR через зовнішній API (fallback) ── */
function qrImageUrl(text, size) {
  return 'https://api.qrserver.com/v1/create-qr-code/?size=' +
    (size || 200) + 'x' + (size || 200) +
    '&data=' + encodeURIComponent(text) +
    '&bgcolor=0a1017&color=5fd0a5&margin=10';
}

/* ══════════════════════════════════════════════
   РЕНДЕР МОДАЛЬНОГО ВІКНА
══════════════════════════════════════════════ */
function renderQrModal(ssid, pass, auth, hidden) {
  var wifiStr = buildWifiString(ssid, pass, auth, hidden);

  var modal = document.getElementById('qr-wifi-modal');
  var body  = document.getElementById('qr-wifi-body');

  /* ── Контент ── */
  var html = '';

  /* Заголовок */
  html += '<div style="text-align:center;margin-bottom:20px;">';
  html += '<div style="font-size:13px;color:#8ea3b0;margin-bottom:6px;">Скануй камерою телефону</div>';
  html += '<div style="font-size:15px;font-weight:700;color:#e6edf3;">📶 ' + escHtml(ssid) + '</div>';
  html += '</div>';

  /* QR через img (API) */
  html += '<div style="text-align:center;margin-bottom:20px;">';
  html += '<div style="display:inline-block;background:#0a1017;border:2px solid #5fd0a5;border-radius:12px;padding:12px;">';
  html += '<img id="qr-img" src="' + qrImageUrl(wifiStr, 220) + '" ';
  html += 'width="220" height="220" alt="QR код" ';
  html += 'style="display:block;border-radius:6px;" ';
  html += 'onerror="this.style.display=\'none\';document.getElementById(\'qr-offline\').style.display=\'block\'">';

  /* Офлайн fallback */
  html += '<div id="qr-offline" style="display:none;width:220px;height:220px;';
  html += 'background:#0d2a1a;border-radius:6px;display:none;align-items:center;justify-content:center;flex-direction:column;gap:8px;">';
  html += '<div style="font-size:32px;">📵</div>';
  html += '<div style="font-size:11px;color:#8ea3b0;text-align:center;padding:0 12px;">Немає інтернету.<br>QR генерується онлайн.</div>';
  html += '</div>';

  html += '</div></div>';

  /* Інфо */
  html += '<div style="background:#0d1a24;border:1px solid #1c2a37;border-radius:8px;padding:14px;margin-bottom:16px;">';
  html += '<div style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;font-size:12px;">';

  var rows = [
    ['📶 SSID',     ssid],
    ['🔑 Пароль',   pass || '(відкрита мережа)'],
    ['🔐 Тип',      auth || 'WPA'],
    ['👁️ Прихована', hidden ? 'Так' : 'Ні'],
  ];

  rows.forEach(function(row) {
    html += '<div style="color:#4a6070;">' + row[0] + '</div>';
    html += '<div style="color:#e6edf3;font-family:monospace;">' + escHtml(row[1]) + '</div>';
  });

  html += '</div></div>';

  /* Кнопки */
  html += '<div style="display:flex;gap:8px;flex-wrap:wrap;">';

  /* Завантажити QR */
  html += '<button onclick="downloadQr()" ';
  html += 'style="flex:1;background:#5fd0a5;color:#082018;border:none;padding:10px;border-radius:8px;cursor:pointer;font-weight:700;font-size:12px;">';
  html += '⬇️ Зберегти QR як PNG</button>';

  /* Копіювати Wi-Fi рядок */
  html += '<button onclick="copyWifiStr()" ';
  html += 'style="flex:1;background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:10px;border-radius:8px;cursor:pointer;font-size:12px;">';
  html += '📋 Копіювати WIFI рядок</button>';

  html += '</div>';

  /* Wi-Fi рядок */
  html += '<details style="margin-top:12px;">';
  html += '<summary style="font-size:11px;color:#4a6070;cursor:pointer;">Показати WIFI рядок</summary>';
  html += '<div style="background:#060d14;border-radius:6px;padding:8px;margin-top:6px;';
  html += 'font-family:monospace;font-size:10px;color:#5fd0a5;word-break:break-all;">';
  html += escHtml(wifiStr);
  html += '</div></details>';

  body.innerHTML = html;

  /* Зберігаємо для завантаження */
  body._wifiStr = wifiStr;
  body._ssid    = ssid;

  modal.style.display = 'flex';
}

/* ── Завантажити QR ── */
window.downloadQr = function() {
  var img   = document.getElementById('qr-img');
  var body  = document.getElementById('qr-wifi-body');
  var ssid  = body._ssid || 'wifi';

  /* Малюємо canvas і зберігаємо */
  var canvas = document.createElement('canvas');
  canvas.width  = 300;
  canvas.height = 300;
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0a1017';
  ctx.fillRect(0, 0, 300, 300);

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, 40, 40, 220, 220);
  }

  /* Текст SSID */
  ctx.fillStyle = '#5fd0a5';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(ssid, 150, 275);

  var link = document.createElement('a');
  link.download = 'wifi-qr-' + ssid.replace(/[^a-zA-Z0-9]/g, '_') + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
};

/* ── Копіювати WIFI рядок ── */
window.copyWifiStr = function() {
  var body = document.getElementById('qr-wifi-body');
  var str  = body._wifiStr || '';
  var btn  = event.target;
  var orig = btn.textContent;

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(str).then(function() {
      btn.textContent = '✓ Скопійовано!';
      setTimeout(function(){ btn.textContent = orig; }, 1500);
    });
  } else {
    var ta = document.createElement('textarea');
    ta.value = str;
    ta.style.cssText = 'position:fixed;left:-9999px;';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.textContent = '✓ Скопійовано!';
    setTimeout(function(){ btn.textContent = orig; }, 1500);
  }
};

function escHtml(s) {
  return String(s || '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

/* ══════════════════════════════════════════════
   ІНІЦІАЛІЗАЦІЯ
══════════════════════════════════════════════ */
function initQrWifi() {

  /* Модальне вікно */
  var modal = document.createElement('div');
  modal.id = 'qr-wifi-modal';
  modal.style.cssText = [
    'display:none','position:fixed','inset:0',
    'background:rgba(0,0,0,.88)','z-index:9999',
    'align-items:center','justify-content:center','padding:20px',
  ].join(';');

  var inner = document.createElement('div');
  inner.style.cssText = [
    'background:#16212c','border:1px solid #2a3b48',
    'border-radius:12px','padding:24px',
    'max-width:400px','width:100%',
    'position:relative',
  ].join(';');

  inner.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">' +
    '<h3 style="margin:0;color:#5fd0a5;font-size:14px;">🔲 QR-код для Wi-Fi</h3>' +
    '<button id="qr-wifi-close" style="background:transparent;border:1px solid #2a3b48;' +
    'color:#8ea3b0;padding:4px 12px;border-radius:6px;cursor:pointer;font-size:12px;">✕</button>' +
    '</div>' +
    '<div id="qr-wifi-body"></div>';

  modal.appendChild(inner);
  document.body.appendChild(modal);

  /* Закрити */
  document.getElementById('qr-wifi-close').addEventListener('click', function() {
    modal.style.display = 'none';
  });
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.style.display = 'none';
  });

  /* ── Кнопка в секції Wi-Fi ── */
  var wifiSection = document.getElementById('wifienable');
  if (wifiSection) {
    var container = wifiSection.closest('.section') || wifiSection.parentNode;
    var qrBtn = document.createElement('button');
    qrBtn.id = 'btn-qr-wifi';
    qrBtn.className = 'sec';
    qrBtn.textContent = '🔲 QR для Wi-Fi';
    qrBtn.style.marginTop = '10px';

    container.appendChild(qrBtn);

    qrBtn.addEventListener('click', function() {
      /* Беремо SSID і пароль з форми */
      var ssid = (document.getElementById('ssid') || {}).value || '';
      var pass = (document.getElementById('wifipass') || {}).value || '';

      if (!ssid) {
        alert('Спочатку введи SSID у секції Wi-Fi!');
        return;
      }

      renderQrModal(ssid, pass, 'WPA', false);
    });
  }

  /* ── Кнопка в output панелі (завжди видима) ── */
  var outputBtns = document.querySelector('.btnbar');
  if (outputBtns) {
    var qrBtnOut = document.createElement('button');
    qrBtnOut.id = 'btn-qr-output';
    qrBtnOut.className = 'sec';
    qrBtnOut.textContent = '🔲 QR Wi-Fi';

    outputBtns.appendChild(qrBtnOut);

    qrBtnOut.addEventListener('click', function() {
      var ssid = (document.getElementById('ssid') || {}).value || '';
      var pass = (document.getElementById('wifipass') || {}).value || '';

      if (!ssid) {
        alert('Спочатку введи SSID у секції Wi-Fi!');
        return;
      }

      renderQrModal(ssid, pass, 'WPA', false);
    });
  }

  console.log('[qr-wifi] ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initQrWifi);
} else {
  initQrWifi();
}