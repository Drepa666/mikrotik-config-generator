/* ============================================================
   changelog.js — Changelog / Версійність
   Patch 34D | MikroTik Config Generator
   ============================================================ */
'use strict';

var CHANGELOG = [
  {
    version: '2.34',
    date:    '2026-08-13',
    label:   'latest',
    changes: [
      { type: 'feat', text: '⏰ Backup Scheduler — автоматичний backup FTP/Email/Cloud' },
      { type: 'feat', text: '📄 Звіт PDF — Security Score + проблеми + конфіг' },
      { type: 'feat', text: '🔲 QR-код для Wi-Fi — швидке підключення телефону' },
      { type: 'feat', text: '🛡️ Аналіз безпеки — перевірка .rsc з командами виправлення' },
    ]
  },
  {
    version: '2.33',
    date:    '2026-08-13',
    label:   '',
    changes: [
      { type: 'feat', text: '🗺️ Топологія з .rsc файлу — парсер реального конфігу' },
      { type: 'fix',  text: '🔧 Контекстний парсер bridge/ports/wifi' },
    ]
  },
  {
    version: '2.31',
    date:    '2026-08-12',
    label:   '',
    changes: [
      { type: 'feat', text: '📤 Export форматів — .rsc, .txt, JSON, Ansible, Terraform' },
      { type: 'feat', text: '🌍 Мультимовність UA/EN/PL/DE' },
      { type: 'feat', text: '📚 Бібліотека шаблонів — 8 готових конфігурацій' },
    ]
  },
  {
    version: '2.28',
    date:    '2026-08-11',
    label:   '',
    changes: [
      { type: 'feat', text: '🗺️ Топологія мережі — SVG візуалізація' },
      { type: 'feat', text: '🧙 Wizard Mode — покроковий майстер налаштування' },
      { type: 'feat', text: '🛡️ Security Score — оцінка безпеки конфігурації' },
    ]
  },
  {
    version: '2.20',
    date:    '2026-08-10',
    label:   '',
    changes: [
      { type: 'feat', text: '🔍 Diff .rsc файлів — порівняння конфігурацій' },
      { type: 'feat', text: '🤖 AI-генерація команд — 6 провайдерів' },
      { type: 'feat', text: '📱 PWA — встановлення як додаток' },
    ]
  },
  {
    version: '1.0',
    date:    '2026-08-01',
    label:   '',
    changes: [
      { type: 'feat', text: '🚀 Перший реліз генератора конфігурації' },
      { type: 'feat', text: '⚙️ WAN/LAN/Wi-Fi/VPN/Firewall генератор' },
      { type: 'feat', text: '💾 Збереження/завантаження профілів' },
    ]
  },
];

function renderChangelog() {
  var typeColors = {
    'feat': { bg: 'rgba(95,208,165,.12)', border: '#5fd0a5', color: '#5fd0a5', label: 'FEAT' },
    'fix':  { bg: 'rgba(230,179,90,.12)', border: '#e6b35a', color: '#e6b35a', label: 'FIX'  },
    'perf': { bg: 'rgba(91,155,213,.12)', border: '#5b9bd5', color: '#5b9bd5', label: 'PERF' },
    'sec':  { bg: 'rgba(224,102,90,.12)', border: '#e0665a', color: '#e0665a', label: 'SEC'  },
  };

  var html = '';

  CHANGELOG.forEach(function(release) {
    html += '<div style="margin-bottom:24px;">';

    /* Заголовок версії */
    html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">';
    html += '<div style="font-size:16px;font-weight:700;color:#e6edf3;">v' + release.version + '</div>';
    if (release.label) {
      html += '<div style="background:#5fd0a5;color:#082018;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;">' + release.label.toUpperCase() + '</div>';
    }
    html += '<div style="font-size:11px;color:#4a6070;margin-left:auto;">📅 ' + release.date + '</div>';
    html += '</div>';

    /* Зміни */
    release.changes.forEach(function(ch) {
      var style = typeColors[ch.type] || typeColors['feat'];
      html += '<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:7px;">';
      html += '<div style="flex-shrink:0;background:' + style.bg + ';border:1px solid ' + style.border + ';';
      html += 'color:' + style.color + ';font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;margin-top:1px;">';
      html += style.label + '</div>';
      html += '<div style="font-size:12px;color:#c9d8e4;">' + ch.text + '</div>';
      html += '</div>';
    });

    html += '</div>';

    /* Роздільник */
    html += '<div style="border-top:1px solid #1c2a37;margin-bottom:20px;"></div>';
  });

  return html;
}

function initChangelog() {

  /* Кнопка в шапці */
  var btn = document.createElement('button');
  btn.id = 'btn-changelog';
  btn.title = 'Що нового?';
  btn.style.cssText = [
    'position:fixed','bottom:16px','right:16px',
    'background:#16212c','border:1px solid #2a3b48',
    'color:#5fd0a5','border-radius:50%',
    'width:42px','height:42px',
    'font-size:18px','cursor:pointer',
    'z-index:9990','display:flex',
    'align-items:center','justify-content:center',
    'box-shadow:0 4px 12px rgba(0,0,0,.4)',
    'transition:all .2s',
  ].join(';');
  btn.textContent = '📋';
  btn.addEventListener('mouseenter', function() {
    btn.style.transform = 'scale(1.1)';
  });
  btn.addEventListener('mouseleave', function() {
    btn.style.transform = 'scale(1)';
  });
  document.body.appendChild(btn);

  /* Модальне вікно */
  var modal = document.createElement('div');
  modal.id = 'changelog-modal';
  modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9999;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;';

  var inner = document.createElement('div');
  inner.style.cssText = 'background:#16212c;border:1px solid #2a3b48;border-radius:12px;padding:24px;max-width:580px;width:100%;margin:auto;';

  inner.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
    '<div>' +
    '<h3 style="margin:0;color:#5fd0a5;font-size:15px;">📋 Changelog</h3>' +
    '<div style="font-size:11px;color:#4a6070;margin-top:2px;">MikroTik Config Generator — Історія оновлень</div>' +
    '</div>' +
    '<button id="cl-close" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:4px 14px;border-radius:6px;cursor:pointer;">✕</button>' +
    '</div>' +
    '<div id="cl-body">' + renderChangelog() + '</div>' +
    '<div style="text-align:center;margin-top:16px;">' +
    '<a href="https://github.com/Drepa666/mikrotik-config-generator" target="_blank" ' +
    'style="color:#5fd0a5;font-size:12px;text-decoration:none;">🔗 GitHub Repository</a>' +
    '</div>';

  modal.appendChild(inner);
  document.body.appendChild(modal);

  /* Закрити */
  document.getElementById('cl-close').addEventListener('click', function() {
    modal.style.display = 'none';
  });
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.style.display = 'none';
  });

  /* Відкрити */
  btn.addEventListener('click', function() {
    modal.style.display = 'flex';
  });

  /* Показати badge якщо нова версія */
  var lastSeen = localStorage.getItem('mt-last-version');
  var currentVersion = CHANGELOG[0].version;
  if (lastSeen !== currentVersion) {
    var badge = document.createElement('div');
    badge.style.cssText = [
      'position:absolute','top:-4px','right:-4px',
      'background:#e0665a','color:#fff',
      'width:14px','height:14px','border-radius:50%',
      'font-size:9px','font-weight:700',
      'display:flex','align-items:center','justify-content:center',
    ].join(';');
    badge.textContent = '!';
    btn.style.position = 'relative';
    btn.appendChild(badge);

    modal.addEventListener('click', function() {
      localStorage.setItem('mt-last-version', currentVersion);
      if (badge.parentNode) badge.parentNode.removeChild(badge);
    });
  }

  console.log('[changelog] ready | v' + currentVersion);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChangelog);
} else {
  initChangelog();
}