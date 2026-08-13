/* ============================================================
   pdf-report.js — Звіт PDF / Print
   Patch 34B | MikroTik Config Generator
   ============================================================ */
'use strict';

function generateReport() {
  var rscText = '';
  var ta = document.getElementById('rsc-input');
  if (ta && ta.value.trim()) rscText = ta.value.trim();
  if (!rscText) {
    var out = document.getElementById('output');
    if (out) rscText = (out.textContent || out.innerText || '').trim();
  }

  /* Статистика з конфігу */
  var model      = (rscText.match(/# model = (.+)/i) || [])[1] || '—';
  var ros        = (rscText.match(/RouterOS ([\d.]+)/i) || [])[1] || '—';
  var serial     = (rscText.match(/# serial number = (.+)/i) || [])[1] || '—';
  var identity   = (rscText.match(/\/system identity set name=["']?([^"'\r\n]+)/i) || [])[1] || '—';
  var exportDate = (rscText.match(/# ([\d-]+ [\d:]+) by RouterOS/i) || [])[1] || new Date().toLocaleString();

  /* Security Score якщо є analyzer */
  var score = '—';
  var critical = 0, warning = 0, ok = 0;
  if (window.analyzeRsc && rscText) {
    var res = window.analyzeRsc(rscText);
    score    = res.score;
    critical = res.critical.length;
    warning  = res.warning.length;
    ok       = res.ok.length;
  }

  var scoreColor = score >= 80 ? '#2ecc71' : score >= 50 ? '#f39c12' : '#e74c3c';

  /* Поточні налаштування форми */
  function val(id) {
    var el = document.getElementById(id);
    return el ? (el.value || '—') : '—';
  }
  function chk(id) {
    var el = document.getElementById(id);
    return el && el.checked ? '✅' : '❌';
  }

  var now = new Date().toLocaleString('uk-UA');

  var html = `<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<title>MikroTik Security Report — ${identity}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #fff;
    color: #1a1a2e;
    padding: 40px;
    font-size: 13px;
    line-height: 1.6;
  }
  @media print {
    body { padding: 20px; }
    .no-print { display: none !important; }
    .page-break { page-break-before: always; }
  }

  /* Кнопки */
  .btn-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 30px;
  }
  .btn {
    padding: 10px 20px;
    border-radius: 6px;
    border: none;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  .btn-print { background: #2ecc71; color: #fff; }
  .btn-close  { background: #e74c3c; color: #fff; }

  /* Заголовок */
  .header {
    border-bottom: 3px solid #5fd0a5;
    padding-bottom: 20px;
    margin-bottom: 30px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .header h1 {
    font-size: 22px;
    color: #0f1720;
    margin-bottom: 4px;
  }
  .header .sub {
    font-size: 12px;
    color: #666;
  }
  .header .logo {
    font-size: 36px;
  }

  /* Score */
  .score-block {
    display: flex;
    align-items: center;
    gap: 30px;
    background: #f8f9fa;
    border-radius: 10px;
    padding: 20px 24px;
    margin-bottom: 24px;
    border: 1px solid #e0e0e0;
  }
  .score-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 6px solid ${scoreColor};
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .score-num {
    font-size: 26px;
    font-weight: 700;
    color: ${scoreColor};
  }
  .score-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    flex: 1;
  }
  .stat-box {
    text-align: center;
    background: #fff;
    border-radius: 8px;
    padding: 12px;
    border: 1px solid #e0e0e0;
  }
  .stat-box .num {
    font-size: 22px;
    font-weight: 700;
  }
  .stat-box .lbl {
    font-size: 11px;
    color: #888;
    margin-top: 2px;
  }
  .stat-critical { color: #e74c3c; }
  .stat-warning  { color: #f39c12; }
  .stat-ok       { color: #2ecc71; }

  /* Секції */
  .section {
    margin-bottom: 24px;
  }
  .section h2 {
    font-size: 14px;
    font-weight: 700;
    color: #0f1720;
    border-left: 4px solid #5fd0a5;
    padding-left: 10px;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Таблиця */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12.5px;
  }
  th {
    background: #0f1720;
    color: #fff;
    padding: 8px 12px;
    text-align: left;
    font-weight: 600;
  }
  td {
    padding: 7px 12px;
    border-bottom: 1px solid #f0f0f0;
  }
  tr:nth-child(even) td {
    background: #f8f9fa;
  }
  .tag-crit { color: #e74c3c; font-weight: 600; }
  .tag-warn { color: #f39c12; font-weight: 600; }
  .tag-ok   { color: #2ecc71; font-weight: 600; }

  /* Проблеми */
  .issue {
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 10px;
    border: 1px solid;
  }
  .issue-critical {
    background: #fff5f5;
    border-color: #e74c3c;
  }
  .issue-warning {
    background: #fffbf0;
    border-color: #f39c12;
  }
  .issue-title {
    font-weight: 700;
    font-size: 13px;
    margin-bottom: 4px;
  }
  .issue-desc {
    font-size: 12px;
    color: #555;
    margin-bottom: 8px;
  }
  .issue-fix {
    background: #f0f0f0;
    border-radius: 4px;
    padding: 6px 10px;
    font-family: 'Courier New', monospace;
    font-size: 11px;
    color: #333;
    white-space: pre-wrap;
  }

  /* Конфіг */
  .config-box {
    background: #0a1017;
    color: #c9e8d8;
    border-radius: 8px;
    padding: 16px;
    font-family: 'Courier New', monospace;
    font-size: 11px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 400px;
    overflow-y: auto;
  }
  @media print {
    .config-box {
      max-height: none;
      overflow: visible;
      font-size: 9px;
    }
  }

  /* Футер */
  .footer {
    margin-top: 40px;
    padding-top: 16px;
    border-top: 1px solid #e0e0e0;
    font-size: 11px;
    color: #999;
    text-align: center;
  }

  /* OK список */
  .ok-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .ok-tag {
    background: #f0fff8;
    border: 1px solid #2ecc71;
    border-radius: 16px;
    padding: 3px 12px;
    font-size: 11.5px;
    color: #27ae60;
  }
</style>
</head>
<body>

<!-- Кнопки (тільки на екрані) -->
<div class="btn-bar no-print">
  <button class="btn btn-print" onclick="window.print()">🖨️ Друк / Зберегти PDF</button>
  <button class="btn btn-close" onclick="window.close()">✕ Закрити</button>
</div>

<!-- Заголовок -->
<div class="header">
  <div>
    <h1>📋 MikroTik Security Report</h1>
    <div class="sub">Згенеровано: ${now}</div>
    <div class="sub">MikroTik Config Generator · drepa666.github.io/mikrotik-config-generator/</div>
  </div>
  <div class="logo">📡</div>
</div>

<!-- Інфо про пристрій -->
<div class="section">
  <h2>🖥️ Інформація про пристрій</h2>
  <table>
    <tr><th>Параметр</th><th>Значення</th></tr>
    <tr><td>Назва роутера</td><td><b>${identity}</b></td></tr>
    <tr><td>Модель</td><td>${model}</td></tr>
    <tr><td>RouterOS</td><td>${ros}</td></tr>
    <tr><td>Серійний номер</td><td>${serial}</td></tr>
    <tr><td>Дата конфігурації</td><td>${exportDate}</td></tr>
  </table>
</div>

<!-- Security Score -->
<div class="section">
  <h2>🛡️ Оцінка безпеки</h2>
  <div class="score-block">
    <div class="score-circle">
      <div class="score-num">${score}</div>
    </div>
    <div class="score-stats">
      <div class="stat-box">
        <div class="num stat-critical">${critical}</div>
        <div class="lbl">🔴 Критичних</div>
      </div>
      <div class="stat-box">
        <div class="num stat-warning">${warning}</div>
        <div class="lbl">🟡 Попереджень</div>
      </div>
      <div class="stat-box">
        <div class="num stat-ok">${ok}</div>
        <div class="lbl">✅ OK</div>
      </div>
    </div>
  </div>
</div>`;

  /* Проблеми з analyzeRsc */
  if (window.analyzeRsc && rscText) {
    var res = window.analyzeRsc(rscText);

    if (res.critical.length) {
      html += `<div class="section">
  <h2>🔴 Критичні проблеми (${res.critical.length})</h2>`;
      res.critical.forEach(function(r) {
        html += `<div class="issue issue-critical">
    <div class="issue-title tag-crit">${r.title}</div>
    <div class="issue-desc">${r.desc}</div>
    ${r.fix ? '<div class="issue-fix">' + escHtmlR(r.fix) + '</div>' : ''}
  </div>`;
      });
      html += '</div>';
    }

    if (res.warning.length) {
      html += `<div class="section">
  <h2>🟡 Попередження (${res.warning.length})</h2>`;
      res.warning.forEach(function(r) {
        html += `<div class="issue issue-warning">
    <div class="issue-title tag-warn">${r.title}</div>
    <div class="issue-desc">${r.desc}</div>
    ${r.fix ? '<div class="issue-fix">' + escHtmlR(r.fix) + '</div>' : ''}
  </div>`;
      });
      html += '</div>';
    }

    if (res.ok.length) {
      html += `<div class="section">
  <h2>✅ Все добре (${res.ok.length})</h2>
  <div class="ok-list">`;
      res.ok.forEach(function(r) {
        html += `<div class="ok-tag">✓ ${r.title}</div>`;
      });
      html += '</div></div>';
    }
  }

  /* Налаштування форми */
  html += `<div class="section page-break">
  <h2>⚙️ Поточні налаштування</h2>
  <table>
    <tr><th>Параметр</th><th>Значення</th></tr>
    <tr><td>Ім'я роутера</td><td>${val('hostname')}</td></tr>
    <tr><td>WAN інтерфейс</td><td>${val('wanif')}</td></tr>
    <tr><td>Тип WAN</td><td>${val('wantype')}</td></tr>
    <tr><td>IP роутера</td><td>${val('lanip')}</td></tr>
    <tr><td>Часовий пояс</td><td>${val('timezone')}</td></tr>
    <tr><td>Базовий фаєрвол</td><td>${chk('basicfw')}</td></tr>
    <tr><td>FastTrack</td><td>${chk('fasttrack')}</td></tr>
    <tr><td>NAT masquerade</td><td>${chk('natenable')}</td></tr>
    <tr><td>NTP клієнт</td><td>${chk('ntpenable')}</td></tr>
    <tr><td>MAC захист</td><td>${chk('macprotect')}</td></tr>
    <tr><td>Вимкнути сервіси</td><td>${chk('disableservices')}</td></tr>
    <tr><td>Захист DNS WAN</td><td>${chk('dnsprotect')}</td></tr>
    <tr><td>IPv6 вимкнено</td><td>${chk('disableipv6')}</td></tr>
    <tr><td>Wi-Fi</td><td>${chk('wifienable')}</td></tr>
    <tr><td>WireGuard VPN</td><td>${chk('wgenable')}</td></tr>
    <tr><td>Резервний WAN</td><td>${chk('foenable')}</td></tr>
    <tr><td>Резервна копія</td><td>${chk('backupenable')}</td></tr>
    <tr><td>Netwatch</td><td>${chk('netwatchenable')}</td></tr>
  </table>
</div>`;

  /* Конфіг скрипт */
  if (rscText) {
    html += `<div class="section page-break">
  <h2>📄 Конфігурація .rsc</h2>
  <div class="config-box">${escHtmlR(rscText.slice(0, 8000))}${rscText.length > 8000 ? '\n\n... [скорочено для звіту] ...' : ''}</div>
</div>`;
  }

  /* Футер */
  html += `<div class="footer">
  Звіт згенеровано MikroTik Config Generator · ${now} ·
  <a href="https://drepa666.github.io/mikrotik-config-generator/" style="color:#5fd0a5;">
    drepa666.github.io/mikrotik-config-generator/
  </a>
</div>

</body>
</html>`;

  return html;
}

function escHtmlR(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ══════════════════════════════════════════════
   ІНІЦІАЛІЗАЦІЯ
══════════════════════════════════════════════ */
function initPdfReport() {
  /* Кнопка */
  var btn = document.createElement('button');
  btn.id = 'btn-pdf-report';
  btn.className = 'sec';
  btn.textContent = '📄 Звіт PDF';

  /* Додаємо в btnbar output панелі */
  var btnbar = document.querySelector('.btnbar');
  if (btnbar) btnbar.appendChild(btn);

  btn.addEventListener('click', function() {
    var html = generateReport();

    /* Відкриваємо в новому вікні */
    var win = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
    if (!win) {
      alert('Дозволь pop-up вікна для цього сайту!');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
  });

  console.log('[pdf-report] ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPdfReport);
} else {
  initPdfReport();
}