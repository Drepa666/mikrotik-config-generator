/* ============================================================
   wizard.js — Покроковий майстер налаштування MikroTik
   Крок 1: Сценарій → Крок 2: WAN → Крок 3: LAN+WiFi
   Крок 4: Безпека → Крок 5: Готово!
   ============================================================ */
'use strict';

/* ── Стилі ── */
var WIZARD_CSS = [
  '#wizard-btn{',
    'display:none !important;',
    'position:fixed;bottom:24px;left:24px;',
    'background:#5fd0a5;color:#082018;',
    'border:none;border-radius:50px;',
    'padding:10px 20px;font-size:13px;font-weight:700;',
    'cursor:pointer;z-index:9998;',
    'box-shadow:0 4px 16px rgba(95,208,165,.4);',
    'transition:all .2s',
  '}',
  '#wizard-btn:hover{background:#4db891;transform:translateY(-1px)}',
  '#wizard-overlay{',
    'position:fixed;inset:0;',
    'background:rgba(0,0,0,.7);',
    'z-index:9999;display:none;',
    'align-items:center;justify-content:center;',
  '}',
  '#wizard-modal{',
    'background:#16212c;',
    'border:1px solid #2a3b48;',
    'border-radius:14px;',
    'width:min(520px,95vw);',
    'max-height:90vh;',
    'overflow-y:auto;',
    'padding:28px;',
    'position:relative;',
  '}',
  '.wz-title{font-size:20px;font-weight:700;color:#5fd0a5;margin-bottom:4px}',
  '.wz-sub{font-size:13px;color:#8ea3b0;margin-bottom:20px}',
  '.wz-steps{display:flex;gap:6px;margin-bottom:24px}',
  '.wz-step{',
    'flex:1;height:4px;border-radius:2px;',
    'background:#2a3b48;transition:background .3s',
  '}',
  '.wz-step.done{background:#5fd0a5}',
  '.wz-step.active{background:#e6b35a}',
  '.wz-section{margin-bottom:16px}',
  '.wz-label{font-size:12px;color:#8ea3b0;margin-bottom:6px;display:block}',
  '.wz-input{',
    'width:100%;padding:8px 12px;',
    'background:#0f1720;border:1px solid #2a3b48;',
    'border-radius:6px;color:#e6edf3;font-size:13px;',
  '}',
  '.wz-input:focus{outline:none;border-color:#5fd0a5}',
  '.wz-select{',
    'width:100%;padding:8px 12px;',
    'background:#0f1720;border:1px solid #2a3b48;',
    'border-radius:6px;color:#e6edf3;font-size:13px;cursor:pointer;',
  '}',
  '.wz-scenarios{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px}',
  '.wz-scenario{',
    'background:#0f1720;border:2px solid #2a3b48;',
    'border-radius:10px;padding:14px;',
    'cursor:pointer;text-align:center;transition:all .2s;',
  '}',
  '.wz-scenario:hover{border-color:#5fd0a5;background:#16212c}',
  '.wz-scenario.selected{border-color:#5fd0a5;background:rgba(95,208,165,.1)}',
  '.wz-scenario-icon{font-size:28px;margin-bottom:6px}',
  '.wz-scenario-name{font-size:13px;font-weight:700;color:#e6edf3}',
  '.wz-scenario-desc{font-size:11px;color:#8ea3b0;margin-top:2px}',
  '.wz-chk{display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer}',
  '.wz-chk input{cursor:pointer}',
  '.wz-chk span{font-size:13px;color:#e6edf3}',
  '.wz-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
  '.wz-btns{',
    'display:flex;justify-content:space-between;',
    'margin-top:20px;gap:10px;',
  '}',
  '.wz-btn-back{',
    'padding:9px 20px;border-radius:6px;',
    'border:1px solid #2a3b48;',
    'background:transparent;color:#8ea3b0;',
    'font-size:13px;cursor:pointer;',
  '}',
  '.wz-btn-next{',
    'padding:9px 24px;border-radius:6px;',
    'border:none;background:#5fd0a5;',
    'color:#082018;font-size:13px;font-weight:700;',
    'cursor:pointer;margin-left:auto;',
  '}',
  '.wz-btn-next:hover{background:#4db891}',
  '.wz-score{',
    'text-align:center;padding:20px;',
    'background:#0f1720;border-radius:10px;margin-bottom:16px;',
  '}',
  '.wz-score-num{',
    'font-size:48px;font-weight:700;',
    'color:#5fd0a5;line-height:1;',
  '}',
  '.wz-score-label{font-size:14px;color:#8ea3b0;margin-top:4px}',
  '.wz-summary{',
    'background:#0f1720;border-radius:8px;',
    'padding:12px 16px;margin-bottom:12px;',
    'font-size:13px;',
  '}',
  '.wz-summary-row{',
    'display:flex;justify-content:space-between;',
    'padding:4px 0;border-bottom:1px solid #2a3b48;color:#8ea3b0;',
  '}',
  '.wz-summary-row:last-child{border-bottom:none}',
  '.wz-summary-val{color:#e6edf3;font-weight:600}',
  '.wz-hint{font-size:11px;color:#8ea3b0;margin-top:6px}',
  '.wz-success{color:#5fd0a5;font-size:13px;margin-bottom:12px;text-align:center}',
].join('\n');

/* ── Дані майстра ── */
var wzData = {
  scenario: 'home',
  routerName: 'MikroTik-Router',
  timezone: 'Europe/Kyiv',
  wanType: 'dhcp',
  wanIf: 'ether1',
  pppoeUser: '',
  pppoePass: '',
  lteApn: '',
  lanIp: '192.168.88.1/24',
  dhcpRange: '192.168.88.10-192.168.88.254',
  wifi: false,
  ssid: 'MyNetwork',
  wifiPass: '',
  adminPass: '',
  firewall: true,
  disableServices: true,
  disableIpv6: false,
  backup: true,
};

var wzStep = 1;
var WZ_TOTAL = 5;

/* ── Сценарії ── */
var WZ_SCENARIOS = [
  {
    id: 'home',
    icon: '🏠',
    name: 'Дім',
    desc: 'Базовий роутер для дому',
    apply: function() {
      wzData.lanIp = '192.168.88.1/24';
      wzData.dhcpRange = '192.168.88.10-192.168.88.254';
      wzData.wifi = true;
      wzData.firewall = true;
    }
  },
  {
    id: 'office',
    icon: '🏢',
    name: 'Офіс',
    desc: 'Корпоративна мережа',
    apply: function() {
      wzData.lanIp = '192.168.1.1/24';
      wzData.dhcpRange = '192.168.1.10-192.168.1.254';
      wzData.wifi = true;
      wzData.firewall = true;
      wzData.disableServices = true;
    }
  },
  {
    id: 'lte',
    icon: '📶',
    name: 'LTE роутер',
    desc: 'Основний канал через LTE',
    apply: function() {
      wzData.wanType = 'lte';
      wzData.wanIf = 'lte1';
      wzData.lanIp = '192.168.88.1/24';
      wzData.wifi = true;
    }
  },
  {
    id: 'industrial',
    icon: '🏭',
    name: 'Промережа',
    desc: 'Надійність та безпека',
    apply: function() {
      wzData.lanIp = '10.0.0.1/24';
      wzData.dhcpRange = '10.0.0.10-10.0.0.254';
      wzData.firewall = true;
      wzData.disableServices = true;
      wzData.disableIpv6 = true;
      wzData.backup = true;
    }
  },
];

/* ── Рендер кроків ── */
function wzRenderSteps() {
  var html = '';
  for (var i = 1; i <= WZ_TOTAL; i++) {
    var cls = i < wzStep ? 'done' : (i === wzStep ? 'active' : '');
    html += '<div class="wz-step ' + cls + '"></div>';
  }
  return html;
}

function wzGetTitle() {
  var titles = {
    1: ['🎯 Крок 1 / 5 — Сценарій', 'Оберіть тип мережі'],
    2: ['🌐 Крок 2 / 5 — WAN', 'Налаштуйте підключення до інтернету'],
    3: ['🏠 Крок 3 / 5 — LAN та Wi-Fi', 'Налаштуйте локальну мережу'],
    4: ['🛡️ Крок 4 / 5 — Безпека', 'Захистіть ваш роутер'],
    5: ['✅ Крок 5 / 5 — Готово!', 'Конфігурацію згенеровано'],
  };
  return titles[wzStep] || ['', ''];
}

/* ── HTML кроків ── */
function wzStep1Html() {
  return '<div class="wz-scenarios">' +
    WZ_SCENARIOS.map(function(s) {
      var sel = wzData.scenario === s.id ? ' selected' : '';
      return '<div class="wz-scenario' + sel + '" data-scenario="' + s.id + '">' +
        '<div class="wz-scenario-icon">' + s.icon + '</div>' +
        '<div class="wz-scenario-name">' + s.name + '</div>' +
        '<div class="wz-scenario-desc">' + s.desc + '</div>' +
      '</div>';
    }).join('') +
  '</div>';
}

function wzStep2Html() {
  var wanTypes = [
    { v: 'dhcp',   l: 'DHCP (автоматично)' },
    { v: 'pppoe',  l: 'PPPoE (логін/пароль)' },
    { v: 'static', l: 'Статична IP' },
    { v: 'lte',    l: 'LTE (APN)' },
  ];

  var html =
    '<div class="wz-row">' +
      '<div class="wz-section">' +
        '<label class="wz-label">WAN інтерфейс</label>' +
        '<input class="wz-input" id="wz-wanif" value="' + wzData.wanIf + '">' +
      '</div>' +
      '<div class="wz-section">' +
        '<label class="wz-label">Тип підключення</label>' +
        '<select class="wz-select" id="wz-wantype">' +
          wanTypes.map(function(t) {
            return '<option value="' + t.v + '"' +
              (wzData.wanType === t.v ? ' selected' : '') +
              '>' + t.l + '</option>';
          }).join('') +
        '</select>' +
      '</div>' +
    '</div>';

  /* PPPoE */
  var ppDisp = wzData.wanType === 'pppoe' ? '' : 'display:none';
  html +=
    '<div id="wz-pppoe-block" style="' + ppDisp + '">' +
      '<div class="wz-row">' +
        '<div class="wz-section">' +
          '<label class="wz-label">Логін PPPoE</label>' +
          '<input class="wz-input" id="wz-pppoe-user" value="' + wzData.pppoeUser + '" placeholder="login@isp">' +
        '</div>' +
        '<div class="wz-section">' +
          '<label class="wz-label">Пароль PPPoE</label>' +
          '<input class="wz-input" type="password" id="wz-pppoe-pass" value="' + wzData.pppoePass + '">' +
        '</div>' +
      '</div>' +
    '</div>';

  /* LTE */
  var lteDisp = wzData.wanType === 'lte' ? '' : 'display:none';
  html +=
    '<div id="wz-lte-block" style="' + lteDisp + '">' +
      '<div class="wz-section">' +
        '<label class="wz-label">APN</label>' +
        '<input class="wz-input" id="wz-lte-apn" value="' + wzData.lteApn + '" placeholder="internet">' +
      '</div>' +
    '</div>';

  return html;
}

function wzStep3Html() {
  return '<div class="wz-row">' +
      '<div class="wz-section">' +
        '<label class="wz-label">IP роутера</label>' +
        '<input class="wz-input" id="wz-lanip" value="' + wzData.lanIp + '">' +
      '</div>' +
      '<div class="wz-section">' +
        '<label class="wz-label">Діапазон DHCP</label>' +
        '<input class="wz-input" id="wz-dhcp" value="' + wzData.dhcpRange + '">' +
      '</div>' +
    '</div>' +
    '<label class="wz-chk">' +
      '<input type="checkbox" id="wz-wifi"' + (wzData.wifi ? ' checked' : '') + '>' +
      '<span>Налаштувати Wi-Fi</span>' +
    '</label>' +
    '<div id="wz-wifi-block" style="' + (wzData.wifi ? '' : 'display:none') + '">' +
      '<div class="wz-row">' +
        '<div class="wz-section">' +
          '<label class="wz-label">SSID (назва мережі)</label>' +
          '<input class="wz-input" id="wz-ssid" value="' + wzData.ssid + '">' +
        '</div>' +
        '<div class="wz-section">' +
          '<label class="wz-label">Пароль Wi-Fi</label>' +
          '<input class="wz-input" type="password" id="wz-wifipass" value="' + wzData.wifiPass + '" placeholder="мін. 8 символів">' +
        '</div>' +
      '</div>' +
    '</div>';
}

function wzStep4Html() {
  return '<div class="wz-section">' +
      '<label class="wz-label">Пароль admin</label>' +
      '<input class="wz-input" type="password" id="wz-adminpass" ' +
        'value="' + wzData.adminPass + '" placeholder="Залиш порожнім щоб не змінювати">' +
      '<div class="wz-hint">⚠️ Рекомендуємо змінити стандартний пароль!</div>' +
    '</div>' +
    '<label class="wz-chk">' +
      '<input type="checkbox" id="wz-firewall"' + (wzData.firewall ? ' checked' : '') + '>' +
      '<span>🔥 Базовий Firewall (defconf)</span>' +
    '</label>' +
    '<label class="wz-chk">' +
      '<input type="checkbox" id="wz-services"' + (wzData.disableServices ? ' checked' : '') + '>' +
      '<span>🔒 Вимкнути telnet, ftp, www, api</span>' +
    '</label>' +
    '<label class="wz-chk">' +
      '<input type="checkbox" id="wz-ipv6"' + (wzData.disableIpv6 ? ' checked' : '') + '>' +
      '<span>🚫 Вимкнути IPv6</span>' +
    '</label>' +
    '<label class="wz-chk">' +
      '<input type="checkbox" id="wz-backup"' + (wzData.backup ? ' checked' : '') + '>' +
      '<span>💾 Резервна копія перед змінами</span>' +
    '</label>';
}

function wzStep5Html() {
  /* Рахуємо Security Score */
  var score = 0;
  if (wzData.adminPass) score += 20;
  if (wzData.firewall) score += 20;
  if (wzData.disableServices) score += 15;
  if (wzData.backup) score += 15;
  if (wzData.disableIpv6) score += 5;
  score = Math.min(score, 100);

  var color = score >= 80 ? '#5fd0a5' : (score >= 50 ? '#e6b35a' : '#e0665a');
  var label = score >= 80 ? 'Добре' : (score >= 50 ? 'Задовільно' : 'Небезпечно');

  var wanLabel = {
    dhcp: 'DHCP', pppoe: 'PPPoE', static: 'Статична', lte: 'LTE'
  }[wzData.wanType] || wzData.wanType;

  return '<div class="wz-success">🎉 Конфігурацію налаштовано!</div>' +
    '<div class="wz-score">' +
      '<div class="wz-score-num" style="color:' + color + '">' + score + '</div>' +
      '<div class="wz-score-label">Security Score — ' + label + '</div>' +
    '</div>' +
    '<div class="wz-summary">' +
      '<div class="wz-summary-row">' +
        '<span>Сценарій</span>' +
        '<span class="wz-summary-val">' +
          (WZ_SCENARIOS.find(function(s){ return s.id === wzData.scenario; }) || {}).icon + ' ' +
          (WZ_SCENARIOS.find(function(s){ return s.id === wzData.scenario; }) || {}).name +
        '</span>' +
      '</div>' +
      '<div class="wz-summary-row">' +
        '<span>WAN</span>' +
        '<span class="wz-summary-val">' + wzData.wanIf + ' / ' + wanLabel + '</span>' +
      '</div>' +
      '<div class="wz-summary-row">' +
        '<span>LAN IP</span>' +
        '<span class="wz-summary-val">' + wzData.lanIp + '</span>' +
      '</div>' +
      (wzData.wifi ?
        '<div class="wz-summary-row">' +
          '<span>Wi-Fi SSID</span>' +
          '<span class="wz-summary-val">' + wzData.ssid + '</span>' +
        '</div>' : '') +
      '<div class="wz-summary-row">' +
        '<span>Firewall</span>' +
        '<span class="wz-summary-val">' + (wzData.firewall ? '✅ Так' : '❌ Ні') + '</span>' +
      '</div>' +
      '<div class="wz-summary-row">' +
        '<span>Пароль admin</span>' +
        '<span class="wz-summary-val">' + (wzData.adminPass ? '✅ Встановлено' : '⚠️ Не змінено') + '</span>' +
      '</div>' +
    '</div>' +
    '<button class="wz-btn-next" id="wz-apply" style="width:100%;padding:12px;font-size:14px">' +
      '⚡ Застосувати до форми та згенерувати скрипт' +
    '</button>';
}

/* ── Зберегти дані кроку ── */
function wzSaveStep() {
  if (wzStep === 2) {
    var wanif = document.getElementById('wz-wanif');
    var wantype = document.getElementById('wz-wantype');
    var ppUser = document.getElementById('wz-pppoe-user');
    var ppPass = document.getElementById('wz-pppoe-pass');
    var lteApn = document.getElementById('wz-lte-apn');
    if (wanif)   wzData.wanIf   = wanif.value;
    if (wantype) wzData.wanType = wantype.value;
    if (ppUser)  wzData.pppoeUser = ppUser.value;
    if (ppPass)  wzData.pppoePass = ppPass.value;
    if (lteApn)  wzData.lteApn  = lteApn.value;
  }
  if (wzStep === 3) {
    var lanip = document.getElementById('wz-lanip');
    var dhcp  = document.getElementById('wz-dhcp');
    var wifi  = document.getElementById('wz-wifi');
    var ssid  = document.getElementById('wz-ssid');
    var wpass = document.getElementById('wz-wifipass');
    if (lanip) wzData.lanIp    = lanip.value;
    if (dhcp)  wzData.dhcpRange = dhcp.value;
    if (wifi)  wzData.wifi     = wifi.checked;
    if (ssid)  wzData.ssid     = ssid.value;
    if (wpass) wzData.wifiPass  = wpass.value;
  }
  if (wzStep === 4) {
    var ap  = document.getElementById('wz-adminpass');
    var fw  = document.getElementById('wz-firewall');
    var svc = document.getElementById('wz-services');
    var ip6 = document.getElementById('wz-ipv6');
    var bk  = document.getElementById('wz-backup');
    if (ap)  wzData.adminPass       = ap.value;
    if (fw)  wzData.firewall        = fw.checked;
    if (svc) wzData.disableServices = svc.checked;
    if (ip6) wzData.disableIpv6     = ip6.checked;
    if (bk)  wzData.backup          = bk.checked;
  }
}

/* ── Застосувати до форми ── */
function wzApplyToForm() {
  function setVal(id, val) {
    var el = document.getElementById(id);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = !!val;
    else el.value = val;
    el.dispatchEvent(new Event('change'));
    el.dispatchEvent(new Event('input'));
  }

  /* Загальне */
  setVal('hostname',       wzData.routerName);
  setVal('timezone',       wzData.timezone);
  setVal('backupenable',   wzData.backup);
  if (wzData.adminPass) {
    setVal('changepass',   true);
    setVal('adminpass',    wzData.adminPass);
  }
  setVal('disableipv6',    wzData.disableIpv6);

  /* WAN */
  setVal('wanif',          wzData.wanIf);
  setVal('wantype',        wzData.wanType);
  if (wzData.wanType === 'pppoe') {
    setVal('pppoeuser',    wzData.pppoeUser);
    setVal('pppoepass',    wzData.pppoePass);
  }
  if (wzData.wanType === 'lte') {
    setVal('lteapn',       wzData.lteApn);
  }

  /* LAN */
  setVal('lanip',          wzData.lanIp);
  setVal('dhcprange',      wzData.dhcpRange);
  setVal('dhcpenable',     true);

  /* Wi-Fi */
  setVal('wifienable',     wzData.wifi);
  if (wzData.wifi) {
    setVal('ssid',         wzData.ssid);
    setVal('wifipass',     wzData.wifiPass);
  }

  /* Безпека */
  setVal('basicfw',        wzData.firewall);
  setVal('macprotect',     wzData.firewall);
  setVal('disableservices',wzData.disableServices);
  setVal('ntpenable',      true);
  setVal('natenable',      true);
  setVal('dnsprotect',     true);

  /* Оновлюємо форму */
  if (typeof window.render === 'function') {
    setTimeout(window.render, 100);
  }
  if (typeof window.updateButtons === 'function') {
    setTimeout(window.updateButtons, 300);
  }
  if (typeof window.updateSecurityScore === 'function') {
    setTimeout(window.updateSecurityScore, 400);
  }
}

/* ── Рендер майстра ── */
function wzRender() {
  var modal = document.getElementById('wizard-modal');
  if (!modal) return;

  var title = wzGetTitle();
  var stepsHtml = wzRenderSteps();
  var bodyHtml = '';

  if (wzStep === 1) bodyHtml = wzStep1Html();
  if (wzStep === 2) bodyHtml = wzStep2Html();
  if (wzStep === 3) bodyHtml = wzStep3Html();
  if (wzStep === 4) bodyHtml = wzStep4Html();
  if (wzStep === 5) bodyHtml = wzStep5Html();

  var backBtn = wzStep > 1
    ? '<button class="wz-btn-back" id="wz-back">← Назад</button>'
    : '<span></span>';

  var nextBtn = wzStep < 5
    ? '<button class="wz-btn-next" id="wz-next">Далі →</button>'
    : '';

  modal.innerHTML =
    '<div class="wz-title">' + title[0] + '</div>' +
    '<div class="wz-sub">' + title[1] + '</div>' +
    '<div class="wz-steps">' + stepsHtml + '</div>' +
    bodyHtml +
    (wzStep < 5 ?
      '<div class="wz-btns">' + backBtn + nextBtn + '</div>' : '');

  /* Bind events */
  wzBindEvents();
}

function wzBindEvents() {
  /* Крок 1 — сценарії */
  document.querySelectorAll('.wz-scenario').forEach(function(el) {
    el.addEventListener('click', function() {
      document.querySelectorAll('.wz-scenario').forEach(function(e) {
        e.classList.remove('selected');
      });
      el.classList.add('selected');
      wzData.scenario = el.dataset.scenario;
    });
  });

  /* Крок 2 — тип WAN */
  var wanType = document.getElementById('wz-wantype');
  if (wanType) {
    wanType.addEventListener('change', function() {
      var pp  = document.getElementById('wz-pppoe-block');
      var lte = document.getElementById('wz-lte-block');
      if (pp)  pp.style.display  = this.value === 'pppoe' ? '' : 'none';
      if (lte) lte.style.display = this.value === 'lte'   ? '' : 'none';
    });
  }

  /* Крок 3 — Wi-Fi toggle */
  var wifiCb = document.getElementById('wz-wifi');
  if (wifiCb) {
    wifiCb.addEventListener('change', function() {
      var block = document.getElementById('wz-wifi-block');
      if (block) block.style.display = this.checked ? '' : 'none';
    });
  }

  /* Кнопка Назад */
  var back = document.getElementById('wz-back');
  if (back) {
    back.addEventListener('click', function() {
      wzStep--;
      wzRender();
    });
  }

  /* Кнопка Далі */
  var next = document.getElementById('wz-next');
  if (next) {
    next.addEventListener('click', function() {
      wzSaveStep();
      if (wzStep === 1) {
        /* Застосуємо сценарій */
        var sc = WZ_SCENARIOS.find(function(s) { return s.id === wzData.scenario; });
        if (sc) sc.apply();
      }
      wzStep++;
      wzRender();
    });
  }

  /* Кнопка Застосувати */
  var apply = document.getElementById('wz-apply');
  if (apply) {
    apply.addEventListener('click', function() {
      wzApplyToForm();
      wzClose();
      /* Toast */
      if (typeof window.secShowToast === 'function') {
        window.secShowToast('Wizard застосовано!');
      }
    });
  }
}

/* ── Відкрити / закрити ── */
function wzOpen() {
  wzStep = 1;
  var overlay = document.getElementById('wizard-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
    wzRender();
  }
}

function wzClose() {
  var overlay = document.getElementById('wizard-overlay');
  if (overlay) overlay.style.display = 'none';
}

/* ── Ін'єкція CSS + HTML ── */
function wizardInit() {
  /* CSS */
  var style = document.createElement('style');
  style.textContent = WIZARD_CSS;
  document.head.appendChild(style);

  /* Кнопка відкриття */
  /* wizard-btn об'єднано в меню */
  var btn = document.createElement('button');
  btn.id = 'wizard-btn';
  btn.textContent = '🧙 Майстер';
  btn.title = 'Покроковий майстер налаштування';
  btn.style.display = 'none';
  btn.addEventListener('click', wzOpen);
  document.body.appendChild(btn);
  window.wzOpen = wzOpen;

  /* Overlay */
  var overlay = document.createElement('div');
  overlay.id = 'wizard-overlay';
  overlay.innerHTML = '<div id="wizard-modal"></div>';
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) wzClose();
  });
  document.body.appendChild(overlay);

  console.log('[wizard.js] ✅ ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wizardInit);
} else {
  wizardInit();
}