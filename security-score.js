/* ============================================================
   security-score.js — Security Score для MikroTik Config
   Читає напряму з форми + слухає всі зміни
   ============================================================ */
'use strict';

var SEC_RULES = [
  {
    id: 'password',
    label: 'Пароль admin змінено',
    points: 20,
    check: function() {
      var cb = document.getElementById('changepass');
      var pw = document.getElementById('adminpass');
      if (cb && pw) return cb.checked && pw.value.trim().length > 0;
      return false;
    },
    tip: 'Увімкніть "Змінити пароль admin" і введіть пароль у розділі "Загальне"'
  },
  {
    id: 'firewall',
    label: 'Базовий Firewall увімкнено',
    points: 20,
    check: function() {
      var cb = document.getElementById('basicfw');
      if (cb) return cb.checked;
      return false;
    },
    tip: 'Увімкніть "Базовий фаєрвол (defconf)" у розділі "Фаєрвол та сервіси"'
  },
  {
    id: 'services',
    label: 'Небезпечні сервіси вимкнено',
    points: 15,
    check: function() {
      var cb = document.getElementById('disableservices');
      if (cb) return cb.checked;
      return false;
    },
    tip: 'Увімкніть "Вимкнути telnet, ftp, www, api"'
  },
  {
    id: 'mac_protect',
    label: 'MAC-доступ обмежено до LAN',
    points: 15,
    check: function() {
      var cb = document.getElementById('macprotect');
      if (cb) return cb.checked;
      return false;
    },
    tip: 'Увімкніть "Захист MAC (Winbox/Telnet тільки з LAN)"'
  },
  {
    id: 'ntp',
    label: 'NTP налаштовано',
    points: 10,
    check: function() {
      var cb = document.getElementById('ntpenable');
      if (cb) return cb.checked;
      return false;
    },
    tip: 'Увімкніть "NTP-клієнт" у розділі "NTP та моніторинг"'
  },
  {
    id: 'dns_protect',
    label: 'DNS захищено від WAN',
    points: 10,
    check: function() {
      var cb = document.getElementById('dnsprotect');
      if (cb) return cb.checked;
      var out = document.getElementById('output');
      if (out) return (out.textContent || '').indexOf('block DNS UDP from WAN') !== -1;
      return false;
    },
    tip: 'Увімкніть "Захист DNS від WAN (блок порту 53)"'
  },
  {
    id: 'backup',
    label: 'Резервна копія перед змінами',
    points: 5,
    check: function() {
      var cb = document.getElementById('backupenable');
      if (cb) return cb.checked;
      return false;
    },
    tip: 'Увімкніть "Резервна копія перед змінами" у розділі "Загальне"'
  },
  {
    id: 'ipv6',
    label: 'IPv6 вимкнено (якщо не потрібен)',
    points: 5,
    check: function() {
      var cb = document.getElementById('disableipv6');
      if (cb) return cb.checked;
      return false;
    },
    tip: 'Увімкніть "Вимкнути IPv6" якщо не використовуєте'
  },
];

/* ── Кольори та мітки ── */
function scoreColor(score) {
  if (score >= 80) return '#5fd0a5';
  if (score >= 50) return '#e6b35a';
  return '#e0665a';
}

function scoreLabel(score) {
  if (score >= 80) return 'Добре';
  if (score >= 50) return 'Задовільно';
  return 'Небезпечно';
}

/* ── Створити панель ── */
function createScorePanel() {
  if (document.getElementById('sec-score-panel')) return;

  var out = document.getElementById('output');
  if (!out || !out.parentNode) return;

  var panel = document.createElement('div');
  panel.id = 'sec-score-panel';
  panel.style.cssText = [
    'background:#16212c',
    'border:1px solid #2a3b48',
    'border-radius:10px',
    'padding:14px 16px',
    'margin-bottom:12px',
    'display:none'
  ].join(';');

  panel.innerHTML =
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">' +
      '<div id="sec-score-circle" style="' +
        'width:56px;height:56px;border-radius:50%;' +
        'border:3px solid #2a3b48;flex-shrink:0;' +
        'display:flex;align-items:center;justify-content:center;' +
        'font-size:18px;font-weight:700;transition:all .3s' +
      '">—</div>' +
      '<div style="flex:1">' +
        '<div id="sec-score-label" style="font-weight:700;font-size:14px">' +
          'Security Score' +
        '</div>' +
        '<div id="sec-score-sublabel" style="color:#8ea3b0;font-size:12px">' +
          'заповніть форму' +
        '</div>' +
      '</div>' +
      '<button id="sec-score-toggle" style="' +
        'font-size:11px;padding:3px 10px;border-radius:4px;' +
        'cursor:pointer;background:#16212c;color:#8ea3b0;' +
        'border:1px solid #2a3b48' +
      '">Деталі</button>' +
    '</div>' +
    '<div style="height:6px;background:#2a3b48;border-radius:3px;margin-bottom:10px">' +
      '<div id="sec-score-bar" style="' +
        'height:100%;width:0%;border-radius:3px;' +
        'transition:width .5s,background .3s' +
      '"></div>' +
    '</div>' +
    '<div id="sec-score-details" style="display:none"></div>';

  out.parentNode.insertBefore(panel, out);

  document.getElementById('sec-score-toggle')
    .addEventListener('click', function() {
      var det = document.getElementById('sec-score-details');
      var btn = document.getElementById('sec-score-toggle');
      if (det.style.display === 'none') {
        det.style.display = 'block';
        btn.textContent = 'Згорнути';
      } else {
        det.style.display = 'none';
        btn.textContent = 'Деталі';
      }
    });
}

/* ── Оновити Security Score ── */
function updateSecurityScore() {
  createScorePanel();

  var panel = document.getElementById('sec-score-panel');
  if (!panel) return;

  /* Рахуємо бали */
  var totalPoints  = SEC_RULES.reduce(function(s, r) { return s + r.points; }, 0);
  var earnedPoints = 0;
  var totalPoints  = 0;
  var failed  = [];
  var passed  = [];
  var partial = [];

  RULES.forEach(function(rule) {
    totalPoints += rule.points;
    var earned = 0;
    try { earned = Math.min(rule.check() || 0, rule.points); } catch(e) {}
    earnedPoints += earned;
    var item = {
      id:      rule.id,
      label:   rule.label,
      tip:     rule.tip,
      points:  rule.points,
      earned:  earned,
      passed:  earned >= rule.points,
      partial: earned > 0 && earned < rule.points,
    };
    if (item.passed)       passed.push(item);
    else if (item.partial) partial.push(item);
    else                   failed.push(item);
  });

  var score = totalPoints > 0 ? Math.round(earnedPoints / totalPoints * 100) : 0;;

  var color = scoreColor(score);
  var label = scoreLabel(score);

  panel.style.display = 'block';

  /* Оновлюємо UI елементи */
  var circle  = document.getElementById('sec-score-circle');
  var bar     = document.getElementById('sec-score-bar');
  var lbl     = document.getElementById('sec-score-label');
  var sublbl  = document.getElementById('sec-score-sublabel');
  var details = document.getElementById('sec-score-details');

  if (circle) {
    circle.textContent   = score;
    circle.style.borderColor = color;
    circle.style.color       = color;
  }
  if (bar) {
    bar.style.width      = score + '%';
    bar.style.background = color;
  }
  if (lbl) {
    lbl.textContent  = 'Security Score — ' + label;
    lbl.style.color  = color;
  }
  if (sublbl) {
    sublbl.textContent = earnedPoints + ' / ' + totalPoints + ' балів';
  }

  /* Деталі */
  if (details) {
    var html = '';

    if (failed.length) {
      html += '<div style="margin-bottom:8px;color:#8ea3b0;font-size:11px;' +
              'text-transform:uppercase;letter-spacing:.05em">Покращити:</div>';
      failed.forEach(function(r) {
        html +=
          '<div style="display:flex;align-items:flex-start;gap:8px;' +
          'margin-bottom:6px;padding:6px 8px;' +
          'background:rgba(224,102,90,.08);border-radius:6px;' +
          'border-left:3px solid #e0665a">' +
            '<span style="color:#e0665a;line-height:1.4">⚠</span>' +
            '<div style="flex:1">' +
              '<div style="font-size:12px;color:#e6edf3">' + r.label + '</div>' +
              '<div style="font-size:11px;color:#8ea3b0;margin-top:2px">' + r.tip + '</div>' +
            '</div>' +
            '<span style="margin-left:auto;color:#e0665a;font-size:11px;' +
            'white-space:nowrap;padding-left:8px">-' + r.points + ' балів</span>' +
          '</div>';
      });
    }

    if (passed.length) {
      html += '<div style="margin-top:10px;margin-bottom:6px;color:#8ea3b0;' +
              'font-size:11px;text-transform:uppercase;letter-spacing:.05em">' +
              'Виконано:</div>';
      passed.forEach(function(r) {
        html +=
          '<div style="display:flex;align-items:center;gap:8px;' +
          'margin-bottom:4px;padding:4px 8px;' +
          'background:rgba(95,208,165,.06);border-radius:6px">' +
            '<span style="color:#5fd0a5">✓</span>' +
            '<span style="font-size:12px;color:#8ea3b0;flex:1">' + r.label + '</span>' +
            '<span style="color:#5fd0a5;font-size:11px">+' + r.points + '</span>' +
          '</div>';
      });
    }

    details.innerHTML = html;
  }

/* ── Ініціалізація ── */
function secScoreInit() {
  if (typeof window.render !== 'function') {
    setTimeout(secScoreInit, 200);
    return;
  }

  /* Патч render() */
  var _orig = window.render;
  window.render = function() {
    _orig.apply(this, arguments);
    setTimeout(updateSecurityScore, 250);
  };

  /* Слухаємо чекбокси та поля напряму */
  var watchIds = [
    'changepass', 'adminpass',
    'basicfw', 'disableservices',
    'macprotect', 'ntpenable',
    'dnsprotect', 'backupenable',
    'disableipv6', 'fasttrack',
    'safetynet', 'ddnsenable'
  ];

  watchIds.forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', function() {
      setTimeout(updateSecurityScore, 50);
    });
    el.addEventListener('input', function() {
      setTimeout(updateSecurityScore, 50);
    });
  });

  /* Перший запуск */
  setTimeout(updateSecurityScore, 600);
  console.log('[security-score.js] ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', secScoreInit);
} else {
  secScoreInit();
}