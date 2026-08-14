content = r"""/* ============================================================
   backup-scheduler.js — Повна версія v3
   Tabs: ⚙️ Налаштування | 🚀 Deploy | ▶️ Тест
   ============================================================ */
'use strict';

var PROXY_URL = 'http://localhost:8888';

/* ══════════════════════════════════════════════
   ГЕНЕРАТОР СКРИПТУ
══════════════════════════════════════════════ */
function generateSource(opts) {
  var prefix    = opts.prefix    || 'mt-bkp';
  var method    = opts.method    || 'local';
  var gdriveUrl = opts.gdriveUrl || '';
  var ftpHost   = opts.ftpHost   || '';
  var ftpUser   = opts.ftpUser   || '';
  var ftpPass   = opts.ftpPass   || '';
  var ftpDir    = opts.ftpDir    || '/backups';
  var email     = opts.email     || '';
  var keepMax   = parseInt(opts.keepMax || '5', 10);

  var s = [];
  s.push(':local bname "' + prefix + '"');
  s.push(':local fname ($bname . ".backup")');
  s.push(':local rname ($bname . ".rsc")');
  s.push('');
  s.push(':log info "Backup started..."');
  s.push('/system backup save name=$bname dont-encrypt=yes');
  s.push(':delay 5s');
  s.push('/export file=$bname');
  s.push(':delay 5s');
  s.push('');
  s.push(':local chk [/file find name=$rname]');
  s.push(':if ([:len $chk] = 0) do={');
  s.push('  :log error "Export FAILED!"');
  s.push('  :error "export failed"');
  s.push('}');
  s.push(':log info ("Export OK: " . $rname)');
  s.push('');

  /* Google Drive */
  if (method === 'gdrive' && gdriveUrl) {
    s.push('# --- Google Drive ---');
    s.push(':local gurl "' + gdriveUrl + '"');
    s.push(':local rcontent [/file get $rname contents]');
    s.push(':local b64 [:convert from=raw to=base64 $rcontent]');
    s.push('/tool fetch url=$gurl mode=https http-method=post http-data=("filename=" . $rname . "&content=" . $b64) output=none');
    s.push(':log info ("Google Drive OK: " . $rname)');
    s.push('');
  }

  /* FTP */
  if (method === 'ftp' && ftpHost) {
    s.push('# --- FTP ---');
    s.push('/tool fetch address="' + ftpHost + '" src-path=$fname dst-path="' + ftpDir + '/" user="' + ftpUser + '" password="' + ftpPass + '" upload=yes mode=ftp');
    s.push('/tool fetch address="' + ftpHost + '" src-path=$rname dst-path="' + ftpDir + '/" user="' + ftpUser + '" password="' + ftpPass + '" upload=yes mode=ftp');
    s.push(':log info ("FTP OK: " . $rname)');
    s.push('');
  }

  /* Email */
  if (method === 'email' && email) {
    s.push('# --- Email ---');
    s.push('/tool e-mail send to="' + email + '" subject=("Backup " . [/system identity get name]) body=("RouterOS auto-backup") file=$fname');
    s.push(':log info ("Email sent to: ' + email + '")');
    s.push('');
  }

  /* MikroTik Cloud */
  if (method === 'cloud') {
    s.push('# --- MikroTik Cloud ---');
    s.push('/system backup cloud upload-file action=create-and-upload');
    s.push(':log info "Cloud backup uploaded"');
    s.push('');
  }

  /* Cleanup */
  s.push('# --- Cleanup (keep ' + keepMax + ') ---');
  s.push(':local bfiles [/file find name~"' + prefix + '" name~".backup"]');
  s.push(':local bcnt [:len $bfiles]');
  s.push(':if ($bcnt > ' + keepMax + ') do={');
  s.push('  :local del ($bcnt - ' + keepMax + ')');
  s.push('  :for i from=0 to=($del - 1) do={');
  s.push('    /file remove [:pick $bfiles $i]');
  s.push('  }');
  s.push('}');
  s.push(':log info ("Auto-backup done: " . $fname)');

  return s.join('\n');
}

function generateRsc(opts) {
  var name     = opts.name     || 'auto-backup';
  var time     = opts.time     || '03:00:00';
  var interval = opts.interval || '1d';
  var source   = generateSource(opts);

  var lines = [];
  lines.push('# ============================================================');
  lines.push('# MikroTik Auto-Backup Script v3');
  lines.push('# Метод: ' + (opts.method || 'local'));
  lines.push('# Розклад: кожні ' + interval + ' о ' + time);
  lines.push('# Winbox → System → Scripts → Source:');
  lines.push('# ============================================================');
  lines.push('');
  lines.push('/system script remove [find name="' + name + '"]');
  lines.push('/system scheduler remove [find name="' + name + '-sched"]');
  lines.push('');
  lines.push('# --- Source (вставляй в Winbox → Scripts → Source) ---');
  lines.push('');
  lines.push(source);
  lines.push('');
  lines.push('# --- Scheduler ---');
  lines.push('/system scheduler add \\');
  lines.push('  name="' + name + '-sched" \\');
  lines.push('  on-event="' + name + '" \\');
  lines.push('  start-time=' + time + ' \\');
  lines.push('  interval=' + interval + ' \\');
  lines.push('  policy=ftp,reboot,read,write,policy,test,password,sniff,sensitive \\');
  lines.push('  comment="Auto backup scheduler"');

  return lines.join('\n');
}

/* ══════════════════════════════════════════════
   DEPLOY HELPERS
══════════════════════════════════════════════ */
function dpHeaders(ip, pass) {
  return {
    'Content-Type':   'application/json',
    'Authorization':  'Basic ' + btoa('admin:' + pass),
    'X-Router-Host':  ip,
    'X-Router-Port':  '80',
    'X-Router-Proto': 'http',
  };
}

function dpStatus(elId, msg, type) {
  var el = document.getElementById(elId);
  if (!el) return;
  var colors = { ok:'#5fd0a5', err:'#e0665a', info:'#5b9bd5', warn:'#e6b35a' };
  el.style.color   = colors[type] || '#8ea3b0';
  el.style.display = 'block';
  el.innerHTML     = msg;
}

/* ══════════════════════════════════════════════
   UI
══════════════════════════════════════════════ */
function iStyle() {
  return 'width:100%;background:#0d1a24;border:1px solid #2a3b48;color:#e6edf3;padding:8px 10px;border-radius:6px;font-size:12px;box-sizing:border-box;';
}

function mkField(id, label, type, placeholder, val) {
  var v = (val !== undefined) ? val : (type !== 'password' ? placeholder : '');
  return '<div>' +
    '<label style="font-size:11px;color:#8ea3b0;display:block;margin-bottom:5px;">' + label + '</label>' +
    '<input id="' + id + '" type="' + type + '" placeholder="' + placeholder + '" value="' + v + '" style="' + iStyle() + '">' +
    '</div>';
}

function mkSelect(id, label, options, selected) {
  var opts = options.map(function(o) {
    var sel = o.value === selected ? ' selected' : '';
    return '<option value="' + o.value + '"' + sel + '>' + o.label + '</option>';
  }).join('');
  return '<div>' +
    '<label style="font-size:11px;color:#8ea3b0;display:block;margin-bottom:5px;">' + label + '</label>' +
    '<select id="' + id + '" style="' + iStyle() + '">' + opts + '</select>' +
    '</div>';
}

function initBackupScheduler() {

  /* ── Модальне вікно ── */
  var modal = document.createElement('div');
  modal.id = 'backup-sched-modal';
  modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9999;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;';

  var inner = document.createElement('div');
  inner.style.cssText = 'background:#16212c;border:1px solid #2a3b48;border-radius:12px;padding:24px;max-width:700px;width:100%;margin:auto;';

  inner.innerHTML =

    /* Шапка */
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">' +
    '<div>' +
    '<h3 style="margin:0;color:#5fd0a5;font-size:15px;">⏰ Backup Scheduler</h3>' +
    '<div style="font-size:11px;color:#4a6070;margin-top:2px;">Автоматичне резервне копіювання MikroTik</div>' +
    '</div>' +
    '<button id="bs-close" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:4px 14px;border-radius:6px;cursor:pointer;">✕</button>' +
    '</div>' +

    /* Таби */
    '<div style="display:flex;gap:6px;margin-bottom:18px;border-bottom:1px solid #2a3b48;padding-bottom:12px;">' +
    '<button class="bs-tab-btn" data-tab="settings" style="background:#5fd0a5;color:#082018;border:none;padding:7px 16px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">⚙️ Налаштування</button>' +
    '<button class="bs-tab-btn" data-tab="deploy"   style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:7px 16px;border-radius:6px;cursor:pointer;font-size:12px;">🚀 Deploy</button>' +
    '<button class="bs-tab-btn" data-tab="test"     style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:7px 16px;border-radius:6px;cursor:pointer;font-size:12px;">▶️ Тест</button>' +
    '</div>' +

    /* ── TAB: SETTINGS ── */
    '<div id="bs-tab-settings">' +

    '<div style="display:grid;gap:12px;">' +

    mkField('bs-name', '📝 Назва скрипту', 'text', 'auto-backup', 'auto-backup') +

    mkSelect('bs-method', '💾 Метод збереження', [
      { value:'local',  label:'💾 Локально (на роутері)' },
      { value:'gdrive', label:'🟢 Google Drive (Apps Script)' },
      { value:'ftp',    label:'📤 FTP сервер' },
      { value:'email',  label:'📧 Email' },
      { value:'cloud',  label:'☁️ MikroTik Cloud' },
    ], 'local') +

    /* Google Drive */
    '<div id="bs-gdrive-block" style="display:none;background:#0d2a1a;border:1px solid #5fd0a533;border-radius:8px;padding:14px;gap:10px;flex-direction:column;">' +
    mkField('bs-gdrive-url', '🟢 Google Apps Script URL', 'text', 'https://script.google.com/macros/s/.../exec', '') +
    '<div style="font-size:11px;color:#5fd0a5;">ℹ️ RouterOS 7.1+ | Deployment: Все → Від мого імені</div>' +
    '</div>' +

    /* FTP */
    '<div id="bs-ftp-block" style="display:none;background:#0d1a2a;border:1px solid #5b9bd533;border-radius:8px;padding:14px;gap:10px;flex-direction:column;">' +
    mkField('bs-ftp-host', '🖥️ FTP хост', 'text', '192.168.1.100', '') +
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">' +
    mkField('bs-ftp-user', 'Логін', 'text', 'backup', '') +
    mkField('bs-ftp-pass', 'Пароль', 'password', '', '') +
    mkField('bs-ftp-dir',  'Директорія', 'text', '/backups', '/backups') +
    '</div>' +
    '</div>' +

    /* Email */
    '<div id="bs-email-block" style="display:none;background:#1a0d2a;border:1px solid #9b87f533;border-radius:8px;padding:14px;gap:10px;flex-direction:column;">' +
    mkField('bs-email', '📧 Email адреса', 'email', 'admin@company.com', '') +
    '<div style="font-size:11px;color:#9b87f5;">ℹ️ Потрібно налаштувати /tool e-mail на роутері</div>' +
    '</div>' +

    /* Cloud hint */
    '<div id="bs-cloud-block" style="display:none;background:#0d1a2a;border:1px solid #2a3b48;border-radius:8px;padding:12px;">' +
    '<div style="font-size:11px;color:#5b9bd5;">ℹ️ MikroTik Cloud — потрібен активний Cloud акаунт на роутері (/ip cloud)</div>' +
    '</div>' +

    /* Розклад */
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
    mkSelect('bs-interval', '📅 Інтервал', [
      { value:'1h',  label:'Щогодини (1h)' },
      { value:'12h', label:'Кожні 12 год (12h)' },
      { value:'1d',  label:'Щодня (1d)' },
      { value:'2d',  label:'Кожні 2 дні (2d)' },
      { value:'7d',  label:'Щотижня (7d)' },
    ], '1d') +
    mkField('bs-time', '⏰ Час запуску', 'text', '03:00:00', '03:00:00') +
    '</div>' +

    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
    mkField('bs-prefix',  '🏷️ Префікс файлів', 'text', 'mt-bkp', 'mt-bkp') +
    mkField('bs-keepmax', '🗑️ Зберігати останніх N', 'number', '5', '5') +
    '</div>' +

    '</div>' +

    /* Preview */
    '<div style="margin-top:16px;">' +
    '<div style="font-size:11px;color:#4a6070;margin-bottom:6px;">👁️ Попередній перегляд скрипту:</div>' +
    '<div id="bs-preview" style="background:#060d14;border:1px solid #1c2a37;border-radius:8px;padding:14px;font-family:monospace;font-size:10.5px;color:#5fd0a5;white-space:pre-wrap;max-height:180px;overflow-y:auto;"></div>' +
    '</div>' +

    /* Кнопки */
    '<div style="display:flex;gap:8px;margin-top:14px;">' +
    '<button id="bs-copy" style="flex:1;background:#5fd0a5;color:#082018;border:none;padding:10px;border-radius:8px;cursor:pointer;font-weight:700;font-size:12px;">📋 Копіювати Source</button>' +
    '<button id="bs-dl"   style="flex:1;background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:10px;border-radius:8px;cursor:pointer;font-size:12px;">⬇️ Завантажити .rsc</button>' +
    '</div>' +

    '</div>' + /* /tab-settings */

    /* ── TAB: DEPLOY ── */
    '<div id="bs-tab-deploy" style="display:none;">' +

    '<div style="background:#0d2a1a;border:1px solid #5fd0a533;border-radius:8px;padding:12px;margin-bottom:14px;font-size:11.5px;color:#5fd0a5;">' +
    '🚀 Deploy відправляє скрипт напряму на роутер через REST API.<br>' +
    '⚠️ Потрібен запущений <code>python proxy.py</code> і RouterOS 7.1+' +
    '</div>' +

    '<div style="display:grid;gap:10px;">' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
    mkField('bs-dp-ip',   '🌐 IP роутера', 'text',     '192.168.88.1', '192.168.88.1') +
    mkField('bs-dp-pass', '🔑 Пароль admin', 'password', '',             '') +
    '</div>' +
    '</div>' +

    '<div style="display:flex;gap:8px;margin-top:12px;">' +
    '<button id="bs-dp-test"   style="flex:1;background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:9px;border-radius:8px;cursor:pointer;font-size:12px;">🔍 Перевірити</button>' +
    '<button id="bs-dp-deploy" style="flex:2;background:#5b9bd5;color:#fff;border:none;padding:9px;border-radius:8px;cursor:pointer;font-weight:700;font-size:12px;">🚀 Deploy на роутер!</button>' +
    '</div>' +

    '<div id="bs-dp-status" style="margin-top:10px;font-size:12px;display:none;padding:10px;border-radius:8px;"></div>' +

    '</div>' + /* /tab-deploy */

    /* ── TAB: TEST ── */
    '<div id="bs-tab-test" style="display:none;">' +

    '<div style="background:#0d1a2a;border:1px solid #5b9bd533;border-radius:8px;padding:12px;margin-bottom:14px;font-size:11.5px;color:#5b9bd5;">' +
    '▶️ Миттєвий тест — запускає скрипт на роутері і показує результат.<br>' +
    '⚠️ Потрібен запущений <code>python proxy.py</code>' +
    '</div>' +

    '<div style="display:grid;gap:10px;">' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
    mkField('bs-ts-ip',   '🌐 IP роутера', 'text',     '192.168.88.1', '192.168.88.1') +
    mkField('bs-ts-pass', '🔑 Пароль admin', 'password', '',             '') +
    '</div>' +
    '</div>' +

    '<div style="display:flex;gap:8px;margin-top:12px;">' +
    '<button id="bs-ts-run"  style="flex:1;background:#5fd0a5;color:#082018;border:none;padding:9px;border-radius:8px;cursor:pointer;font-weight:700;font-size:12px;">▶️ Запустити зараз</button>' +
    '<button id="bs-ts-log"  style="flex:1;background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:9px;border-radius:8px;cursor:pointer;font-size:12px;">📋 Перевірити лог</button>' +
    '<button id="bs-ts-files" style="flex:1;background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:9px;border-radius:8px;cursor:pointer;font-size:12px;">📂 Файли</button>' +
    '</div>' +

    '<div id="bs-ts-status" style="margin-top:10px;font-size:11.5px;display:none;padding:10px;border-radius:8px;"></div>' +

    '<div id="bs-ts-output" style="margin-top:10px;background:#060d14;border:1px solid #1c2a37;border-radius:8px;padding:12px;font-family:monospace;font-size:11px;color:#c9e8d8;white-space:pre-wrap;max-height:220px;overflow-y:auto;display:none;"></div>' +

    '</div>'; /* /tab-test */

  modal.appendChild(inner);
  document.body.appendChild(modal);

  /* ── Закрити ── */
  document.getElementById('bs-close').addEventListener('click', function() {
    modal.style.display = 'none';
  });
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.style.display = 'none';
  });

  /* ── Таби ── */
  inner.querySelectorAll('.bs-tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var tab = this.getAttribute('data-tab');
      inner.querySelectorAll('.bs-tab-btn').forEach(function(b) {
        b.style.background = 'transparent';
        b.style.color      = '#8ea3b0';
        b.style.border     = '1px solid #2a3b48';
      });
      this.style.background = '#5fd0a5';
      this.style.color      = '#082018';
      this.style.border     = 'none';
      ['settings','deploy','test'].forEach(function(t) {
        var el = document.getElementById('bs-tab-' + t);
        if (el) el.style.display = t === tab ? 'block' : 'none';
      });
    });
  });

  /* ── Метод ── */
  function gv(id) { var e = document.getElementById(id); return e ? e.value : ''; }

  document.getElementById('bs-method').addEventListener('change', function() {
    var v = this.value;
    var blocks = { gdrive:'bs-gdrive-block', ftp:'bs-ftp-block', email:'bs-email-block', cloud:'bs-cloud-block' };
    Object.keys(blocks).forEach(function(key) {
      var el = document.getElementById(blocks[key]);
      if (el) el.style.display = v === key ? 'flex' : 'none';
    });
    updatePreview();
  });

  /* ── Отримати opts ── */
  function getOpts() {
    return {
      name:      gv('bs-name')      || 'auto-backup',
      method:    gv('bs-method')    || 'local',
      interval:  gv('bs-interval')  || '1d',
      time:      gv('bs-time')      || '03:00:00',
      prefix:    gv('bs-prefix')    || 'mt-bkp',
      keepMax:   gv('bs-keepmax')   || '5',
      gdriveUrl: gv('bs-gdrive-url')|| '',
      ftpHost:   gv('bs-ftp-host')  || '',
      ftpUser:   gv('bs-ftp-user')  || '',
      ftpPass:   gv('bs-ftp-pass')  || '',
      ftpDir:    gv('bs-ftp-dir')   || '/backups',
      email:     gv('bs-email')     || '',
    };
  }

  /* ── Preview ── */
  function updatePreview() {
    var el = document.getElementById('bs-preview');
    if (el) el.textContent = generateSource(getOpts());
  }

  inner.querySelectorAll('input,select').forEach(function(el) {
    el.addEventListener('input',  updatePreview);
    el.addEventListener('change', updatePreview);
  });

  /* ── Копіювати ── */
  document.getElementById('bs-copy').addEventListener('click', function() {
    var text = generateSource(getOpts());
    var btn  = this;
    var orig = btn.textContent;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function() {
        btn.textContent = '✓ Скопійовано!';
        setTimeout(function(){ btn.textContent = orig; }, 1500);
      });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      btn.textContent = '✓ Скопійовано!';
      setTimeout(function(){ btn.textContent = orig; }, 1500);
    }
  });

  /* ── Завантажити .rsc ── */
  document.getElementById('bs-dl').addEventListener('click', function() {
    var text = generateRsc(getOpts());
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var link = document.createElement('a');
    link.href     = URL.createObjectURL(blob);
    link.download = 'backup-scheduler.rsc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function(){ URL.revokeObjectURL(link.href); }, 1000);
  });

  /* ══════════════════════════════════════════════
     DEPLOY
  ══════════════════════════════════════════════ */
  function getDeployHdrs() {
    return dpHeaders(gv('bs-dp-ip') || '192.168.88.1', gv('bs-dp-pass') || '');
  }

  /* Тест з'єднання */
  document.getElementById('bs-dp-test').addEventListener('click', function() {
    var btn = this;
    btn.textContent = '⏳...';
    btn.disabled = true;
    dpStatus('bs-dp-status', '⏳ Підключаюсь...', 'info');

    fetch(PROXY_URL + '/rest/system/identity', { method:'GET', headers:getDeployHdrs() })
    .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function(d) {
      dpStatus('bs-dp-status', '✅ З\'єднання OK! Роутер: <b>' + (d.name||'?') + '</b>', 'ok');
    })
    .catch(function(e) {
      dpStatus('bs-dp-status', '❌ ' + e.message + '<br><small>Запусти <code>python proxy.py</code></small>', 'err');
    })
    .finally(function() { btn.textContent = '🔍 Перевірити'; btn.disabled = false; });
  });

  /* Deploy */
  document.getElementById('bs-dp-deploy').addEventListener('click', function() {
    var btn  = this;
    var opts = getOpts();
    var hdrs = getDeployHdrs();
    var sname = opts.name;
    var src   = generateSource(opts);

    btn.textContent = '⏳ Деплою...';
    btn.disabled = true;
    dpStatus('bs-dp-status', '⏳ Крок 1/4: Видаляю старий скрипт...', 'info');

    /* 1. Знайти і видалити старий скрипт */
    fetch(PROXY_URL + '/rest/system/script', { method:'GET', headers:hdrs })
    .then(function(r) { return r.json(); })
    .then(function(list) {
      var old = list.find(function(s) { return s.name === sname; });
      if (old) return fetch(PROXY_URL + '/rest/system/script/' + old['.id'], { method:'DELETE', headers:hdrs });
    })

    /* 2. Створити скрипт */
    .then(function() {
      dpStatus('bs-dp-status', '⏳ Крок 2/4: Створюю скрипт...', 'info');
      return fetch(PROXY_URL + '/rest/system/script', {
        method: 'PUT', headers: hdrs,
        body: JSON.stringify({
          name:    sname,
          source:  src,
          policy:  ['ftp','reboot','read','write','policy','test','password','sniff','sensitive'],
          comment: 'Auto backup — ' + opts.method,
        }),
      });
    })
    .then(function(r) { if (!r.ok) throw new Error('Скрипт: HTTP ' + r.status); return r.json(); })

    /* 3. Видалити старий scheduler */
    .then(function() {
      dpStatus('bs-dp-status', '⏳ Крок 3/4: Scheduler...', 'info');
      return fetch(PROXY_URL + '/rest/system/scheduler', { method:'GET', headers:hdrs });
    })
    .then(function(r) { return r.json(); })
    .then(function(list) {
      var old = list.find(function(s) { return s.name === sname + '-sched'; });
      if (old) return fetch(PROXY_URL + '/rest/system/scheduler/' + old['.id'], { method:'DELETE', headers:hdrs });
    })

    /* 4. Створити scheduler */
    .then(function() {
      return fetch(PROXY_URL + '/rest/system/scheduler', {
        method: 'PUT', headers: hdrs,
        body: JSON.stringify({
          name:       sname + '-sched',
          'on-event': sname,
          'start-time': opts.time,
          interval:   opts.interval,
          policy:     ['ftp','reboot','read','write','policy','test','password','sniff','sensitive'],
          comment:    'Auto backup scheduler',
        }),
      });
    })
    .then(function(r) { if (!r.ok) throw new Error('Scheduler: HTTP ' + r.status); })

    .then(function() {
      var statusEl = document.getElementById('bs-dp-status');
      statusEl.style.display  = 'block';
      statusEl.style.color    = '#5fd0a5';
      statusEl.style.background = '#0d2a1a';
      statusEl.style.border   = '1px solid #5fd0a533';
      statusEl.style.borderRadius = '8px';
      statusEl.style.padding  = '10px';
      statusEl.innerHTML =
        '✅ <b>Deploy успішний!</b><br>' +
        '📝 Скрипт <b>' + sname + '</b> створено ✅<br>' +
        '📅 Scheduler кожні <b>' + opts.interval + '</b> о <b>' + opts.time + '</b> ✅<br>' +
        (opts.method === 'gdrive' ? '🟢 Google Drive підключено ✅<br>' : '') +
        (opts.method === 'ftp'    ? '📤 FTP підключено ✅<br>' : '') +
        (opts.method === 'email'  ? '📧 Email підключено ✅<br>' : '') +
        '<small style="color:#4a6070;">Перейди на вкладку ▶️ Тест щоб перевірити</small>';
    })
    .catch(function(e) {
      dpStatus('bs-dp-status', '❌ ' + e.message, 'err');
    })
    .finally(function() {
      btn.textContent = '🚀 Deploy на роутер!';
      btn.disabled = false;
    });
  });

  /* ══════════════════════════════════════════════
     ТЕСТ
  ══════════════════════════════════════════════ */
  function getTestHdrs() {
    return dpHeaders(gv('bs-ts-ip') || '192.168.88.1', gv('bs-ts-pass') || '');
  }

  function tsStatus(msg, type) { dpStatus('bs-ts-status', msg, type); }

  function showOutput(text) {
    var el = document.getElementById('bs-ts-output');
    el.style.display = 'block';
    el.textContent   = text;
  }

  /* Запустити скрипт */
  document.getElementById('bs-ts-run').addEventListener('click', function() {
    var btn   = this;
    var sname = gv('bs-name') || 'auto-backup';
    var hdrs  = getTestHdrs();
    btn.textContent = '⏳ Запускаю...';
    btn.disabled = true;
    tsStatus('⏳ Шукаю скрипт ' + sname + '...', 'info');

    fetch(PROXY_URL + '/rest/system/script', { method:'GET', headers:hdrs })
    .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function(list) {
      var sc = list.find(function(s) { return s.name === sname; });
      if (!sc) throw new Error('Скрипт "' + sname + '" не знайдено! Спочатку зроби Deploy.');
      tsStatus('⏳ Запускаю скрипт... (~15 сек)', 'info');
      return fetch(PROXY_URL + '/rest/system/script/' + sc['.id'] + '/run', {
        method: 'POST', headers: hdrs,
      });
    })
    .then(function() {
      tsStatus('✅ Скрипт запущено! Зачекай 15 сек і натисни "Перевірити лог"', 'ok');
    })
    .catch(function(e) {
      tsStatus('❌ ' + e.message, 'err');
    })
    .finally(function() {
      btn.textContent = '▶️ Запустити зараз';
      btn.disabled = false;
    });
  });

  /* Перевірити лог */
  document.getElementById('bs-ts-log').addEventListener('click', function() {
    var btn  = this;
    var hdrs = getTestHdrs();
    btn.textContent = '⏳...';
    btn.disabled = true;

    fetch(PROXY_URL + '/rest/log', { method:'GET', headers:hdrs })
    .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function(logs) {
      var keywords = ['backup','Backup','Google Drive','FTP','Email','export','FAILED','done'];
      var filtered = logs.filter(function(l) {
        return keywords.some(function(k) { return (l.message||'').indexOf(k) !== -1; });
      }).slice(-20);

      if (!filtered.length) {
        tsStatus('ℹ️ Записів про backup не знайдено в логах', 'warn');
        return;
      }

      var text = filtered.map(function(l) {
        var icon = (l.message||'').indexOf('FAILED') !== -1 ? '❌' :
                   (l.message||'').indexOf('OK') !== -1 || (l.message||'').indexOf('done') !== -1 ? '✅' : 'ℹ️';
        return icon + ' [' + (l.time||'') + '] ' + (l.message||'');
      }).join('\n');

      tsStatus('✅ Знайдено ' + filtered.length + ' записів:', 'ok');
      showOutput(text);
    })
    .catch(function(e) {
      tsStatus('❌ ' + e.message, 'err');
    })
    .finally(function() {
      btn.textContent = '📋 Перевірити лог';
      btn.disabled = false;
    });
  });

  /* Перевірити файли */
  document.getElementById('bs-ts-files').addEventListener('click', function() {
    var btn    = this;
    var hdrs   = getTestHdrs();
    var prefix = gv('bs-prefix') || 'mt-bkp';
    btn.textContent = '⏳...';
    btn.disabled = true;

    fetch(PROXY_URL + '/rest/file', { method:'GET', headers:hdrs })
    .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function(files) {
      var bkps = files.filter(function(f) {
        return (f.name||'').indexOf(prefix) !== -1;
      });

      if (!bkps.length) {
        tsStatus('ℹ️ Файли "' + prefix + '*" не знайдено', 'warn');
        return;
      }

      var text = bkps.map(function(f) {
        var size = f.size ? Math.round(f.size/1024) + ' KiB' : '?';
        return '📄 ' + f.name + ' (' + size + ') — ' + (f['last-modified']||'?');
      }).join('\n');

      tsStatus('✅ Знайдено файлів: ' + bkps.length, 'ok');
      showOutput(text);
    })
    .catch(function(e) {
      tsStatus('❌ ' + e.message, 'err');
    })
    .finally(function() {
      btn.textContent = '📂 Файли';
      btn.disabled = false;
    });
  });

  /* ── Кнопка в btnbar ── */
  function addBtn() {
    if (document.getElementById('btn-backup-sched')) return;
    var btn = document.createElement('button');
    btn.id        = 'btn-backup-sched';
    btn.className = 'sec';
    btn.textContent = '⏰ Backup Scheduler';
    btn.addEventListener('click', function() {
      updatePreview();
      modal.style.display = 'flex';
    });
    var bar = document.querySelector('.btnbar');
    if (bar) { bar.appendChild(btn); return true; }
    return false;
  }

  if (!addBtn()) {
    var t = setInterval(function() { if (addBtn()) clearInterval(t); }, 300);
  }

  console.log('[backup-scheduler] v3 ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBackupScheduler);
} else {
  initBackupScheduler();
}
"""

with open('backup-scheduler.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print('backup-scheduler.js v3 OK!')