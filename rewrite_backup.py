content = r"""/* ============================================================
   backup-scheduler.js — Patch 34C v2
   Генерує повний .rsc що імпортується через /import
   ============================================================ */
'use strict';

function generateBackupScript(opts) {
  var name      = opts.name      || 'auto-backup';
  var time      = opts.time      || '03:00:00';
  var days      = opts.days      || 'daily';
  var keepMax   = parseInt(opts.keepMax || '5', 10);
  var method    = opts.method    || 'local';
  var ftpHost   = opts.ftpHost   || '';
  var ftpUser   = opts.ftpUser   || '';
  var ftpPass   = opts.ftpPass   || '';
  var ftpDir    = opts.ftpDir    || '/backups';
  var email     = opts.email     || '';
  var prefix    = opts.prefix    || 'mt-backup';
  var gdriveUrl = opts.gdriveUrl || '';

  /* Інтервал */
  var intervalMap = {
    'hourly':      '1h',
    'daily':       '1d',
    'mon,wed,fri': '2d',
    'mon,fri':     '3d',
    'weekly':      '7d',
  };
  var interval = intervalMap[days] || '1d';

  /* ── Тіло скрипту (кожен рядок окремо) ── */
  var src = [];

  src.push(':local date [/system clock get date]');
  src.push(':local time [/system clock get time]');
  src.push(':set time [:pick $time 0 5]');
  src.push(':set time [:convert from=text to=text $time]');
  src.push(':local bname ("' + prefix + '-" . $date)');
  src.push(':local fname ($bname . ".backup")');
  src.push(':local rname ($bname . ".rsc")');
  src.push('');
  src.push('# Зберегти backup');
  src.push('/system backup save name=$bname dont-encrypt=yes');
  src.push(':delay 3s');
  src.push('');
  src.push('# Зберегти export .rsc');
  src.push('/export file=$bname');
  src.push(':delay 2s');

  /* FTP */
  if (method === 'ftp' && ftpHost) {
    src.push('');
    src.push('# Відправити на FTP');
    src.push('/tool fetch address="' + ftpHost + '" src-path=$fname \\');
    src.push('  dst-path="' + ftpDir + '/" user="' + ftpUser + '" \\');
    src.push('  password="' + ftpPass + '" upload=yes mode=ftp');
    src.push('/tool fetch address="' + ftpHost + '" src-path=$rname \\');
    src.push('  dst-path="' + ftpDir + '/" user="' + ftpUser + '" \\');
    src.push('  password="' + ftpPass + '" upload=yes mode=ftp');
    src.push(':log info ("FTP upload OK: " . $fname)');
  }

  /* Email */
  if (method === 'email' && email) {
    src.push('');
    src.push('# Відправити на Email');
    src.push('/tool e-mail send to="' + email + '" \\');
    src.push('  subject=("Backup " . [/system identity get name] . " " . $date) \\');
    src.push('  body=("RouterOS auto-backup\\n" . $date) \\');
    src.push('  file=$fname');
    src.push(':log info ("Email backup sent to: ' + email + '")');
  }

  /* Google Drive */
  if (method === 'gdrive' && gdriveUrl) {
    src.push('');
    src.push('# Відправити на Google Drive через Apps Script');
    src.push(':local gurl "' + gdriveUrl + '"');
    src.push(':local rcontent [/file get $rname contents]');
    src.push(':local b64 [:convert from=raw to=base64 $rcontent]');
    src.push('/tool fetch url=$gurl \\');
    src.push('  http-method=post \\');
    src.push('  http-header-field="Content-Type: application/x-www-form-urlencoded" \\');
    src.push('  http-data=("filename=" . $rname . "&content=" . $b64) \\');
    src.push('  output=none');
    src.push(':log info ("Google Drive upload OK: " . $rname)');
  }

  /* MikroTik Cloud */
  if (method === 'cloud') {
    src.push('');
    src.push('# MikroTik Cloud backup');
    src.push('/system backup cloud upload-file action=create-and-upload');
    src.push(':log info "Cloud backup uploaded"');
  }

  /* Видалення старих файлів */
  src.push('');
  src.push('# Видалити старі файли (зберігати ' + keepMax + ')');
  src.push(':local bfiles [/file find name~"' + prefix + '" name~".backup"]');
  src.push(':local bcnt [:len $bfiles]');
  src.push(':if ($bcnt > ' + keepMax + ') do={');
  src.push('  :local del ($bcnt - ' + keepMax + ')');
  src.push('  :for i from=0 to=($del - 1) do={');
  src.push('    /file remove [:pick $bfiles $i]');
  src.push('  }');
  src.push('}');
  src.push('');
  src.push(':log info ("Auto-backup completed: " . $fname)');

  /* ── Будуємо .rsc файл ── */
  var lines = [];
  lines.push('# ============================================================');
  lines.push('# MikroTik Auto-Backup Script');
  lines.push('# Згенеровано: MikroTik Config Generator');
  lines.push('# Метод: ' + method);
  lines.push('# Розклад: ' + interval + ' о ' + time);
  lines.push('# ============================================================');
  lines.push('');
  lines.push('# --- Видалити старий скрипт якщо є ---');
  lines.push('/system script remove [find name="' + name + '"]');
  lines.push('');
  lines.push('# --- Видалити старий scheduler якщо є ---');
  lines.push('/system scheduler remove [find name="' + name + '-sched"]');
  lines.push('');

  /* ── Скрипт через :execute або multiline source ── */
  /* Правильний спосіб для /import — використовуємо heredoc-стиль */
  lines.push('# --- Створити скрипт ---');
  lines.push('/system script add \\');
  lines.push('  name="' + name + '" \\');
  lines.push('  policy=ftp,reboot,read,write,policy,test,password,sniff,sensitive \\');
  lines.push('  comment="Auto backup - ' + method + '" \\');
  lines.push('  source="' + src.join('\\r\\n') + '"');
  lines.push('');

  /* Scheduler */
  lines.push('# --- Scheduler ---');
  lines.push('/system scheduler add \\');
  lines.push('  name="' + name + '-sched" \\');
  lines.push('  on-event="' + name + '" \\');
  lines.push('  start-time=' + time + ' \\');
  lines.push('  interval=' + interval + ' \\');
  lines.push('  policy=ftp,reboot,read,write,policy,test,password,sniff,sensitive \\');
  lines.push('  comment="Auto backup scheduler"');
  lines.push('');

  /* Email підказка */
  if (method === 'email' && email) {
    lines.push('# --- Email налаштування (якщо ще не налаштовано) ---');
    lines.push('# /tool e-mail set address=smtp.gmail.com port=587 \\');
    lines.push('#   from=router@gmail.com user=router@gmail.com \\');
    lines.push('#   password="APP_PASSWORD" tls=starttls');
    lines.push('');
  }

  /* Google Drive підказка */
  if (method === 'gdrive') {
    lines.push('# --- Google Drive Apps Script URL ---');
    lines.push('# Переконайся що URL правильний:');
    lines.push('# ' + (gdriveUrl || 'https://script.google.com/macros/s/YOUR_ID/exec'));
    lines.push('# RouterOS 7.1+ підтримує :convert from=raw to=base64');
    lines.push('');
  }

  /* Тест */
  lines.push('# --- Запустити для тесту ---');
  lines.push('/system script run ' + name);
  lines.push('');
  lines.push('# --- Перевірити файли ---');
  lines.push('/file print where name~"' + prefix + '"');
  lines.push('');
  lines.push('# --- Перевірити лог ---');
  lines.push('/log print where message~"backup"');

  return lines.join('\n');
}

/* ══════════════════════════════════════════════
   ОКРЕМИЙ СКРИПТ ДЛЯ РУЧНОГО ВВЕДЕННЯ В ТЕРМІНАЛ
   (без \ продовжень, один рядок source)
══════════════════════════════════════════════ */
function generateTerminalScript(opts) {
  var name   = opts.name   || 'auto-backup';
  var prefix = opts.prefix || 'mt-backup';
  var method = opts.method || 'local';
  var gdriveUrl = opts.gdriveUrl || '';
  var ftpHost   = opts.ftpHost   || '';
  var ftpUser   = opts.ftpUser   || '';
  var ftpPass   = opts.ftpPass   || '';
  var ftpDir    = opts.ftpDir    || '/backups';
  var email     = opts.email     || '';
  var time      = opts.time      || '03:00:00';
  var days      = opts.days      || 'daily';
  var keepMax   = parseInt(opts.keepMax || '5', 10);

  var intervalMap = {
    'hourly':'1h','daily':'1d','mon,wed,fri':'2d','mon,fri':'3d','weekly':'7d',
  };
  var interval = intervalMap[days] || '1d';

  var lines = [];
  lines.push('# Крок 1: Видалити старі якщо є');
  lines.push('/system script remove [find name="' + name + '"]');
  lines.push('/system scheduler remove [find name="' + name + '-sched"]');
  lines.push('');
  lines.push('# Крок 2: Створити скрипт');
  lines.push('/system script add name="' + name + '" policy=ftp,reboot,read,write,policy,test,password,sniff,sensitive comment="Auto backup" source=":local bname (\\"' + prefix + '-\\" . [/system clock get date]);/system backup save name=\\$bname dont-encrypt=yes;:delay 3s;/export file=\\$bname;:delay 2s' + (method === 'gdrive' && gdriveUrl ? ';:local rcontent [/file get (\\$bname . \\".rsc\\") contents];:local b64 [:convert from=raw to=base64 \\$rcontent];/tool fetch url=\\"' + gdriveUrl + '\\" http-method=post http-data=(\\"filename=\\" . \\$bname . \\".rsc&content=\\" . \\$b64) output=none' : '') + ';:log info (\\"Backup done: \\" . \\$bname)"');
  lines.push('');
  lines.push('# Крок 3: Scheduler');
  lines.push('/system scheduler add name="' + name + '-sched" on-event="' + name + '" start-time=' + time + ' interval=' + interval + ' policy=ftp,reboot,read,write,policy,test,password,sniff,sensitive comment="Auto backup scheduler"');
  lines.push('');
  lines.push('# Крок 4: Тест');
  lines.push('/system script run ' + name);
  lines.push(':delay 8s');
  lines.push('/file print where name~"' + prefix + '"');
  lines.push('/log print where message~"backup"');

  return lines.join('\n');
}

/* ══════════════════════════════════════════════
   UI
══════════════════════════════════════════════ */
function initBackupScheduler() {

  var modal = document.createElement('div');
  modal.id = 'backup-sched-modal';
  modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9999;align-items:center;justify-content:center;padding:20px;overflow-y:auto;';

  var inner = document.createElement('div');
  inner.style.cssText = 'background:#16212c;border:1px solid #2a3b48;border-radius:12px;padding:24px;max-width:680px;width:100%;margin:auto;';

  inner.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
    '<h3 style="margin:0;color:#5fd0a5;font-size:14px;">⏰ Backup Scheduler</h3>' +
    '<button id="bs-close" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:4px 12px;border-radius:6px;cursor:pointer;">✕</button>' +
    '</div>' +

    /* Таби */
    '<div style="display:flex;gap:6px;margin-bottom:16px;">' +
    '<button id="bs-tab-import" style="background:#5fd0a5;color:#082018;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">📥 Для /import (.rsc)</button>' +
    '<button id="bs-tab-terminal" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;">💻 Для термінала</button>' +
    '</div>' +

    '<div id="bs-tab-hint" style="background:#0d2a1a;border:1px solid #5fd0a533;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:11.5px;color:#5fd0a5;">' +
    '📥 <b>Для /import</b> — завантаж .rsc файл і виконай <code>/import file-name=backup-scheduler.rsc</code>' +
    '</div>' +

    '<div style="display:grid;gap:12px;">' +

    /* Назва */
    mkBSField('bs-name', 'Назва скрипту', 'text', 'auto-backup') +

    /* Метод */
    '<div><label style="font-size:11px;color:#8ea3b0;display:block;margin-bottom:6px;">Метод збереження</label>' +
    '<select id="bs-method" style="width:100%;background:#0d1a24;border:1px solid #2a3b48;color:#e6edf3;padding:8px 10px;border-radius:6px;font-size:12px;">' +
    '<option value="local">💾 Локально (на роутері)</option>' +
    '<option value="ftp">📤 FTP сервер</option>' +
    '<option value="email">📧 Email</option>' +
    '<option value="gdrive">🟢 Google Drive (Apps Script)</option>' +
    '<option value="cloud">☁️ MikroTik Cloud</option>' +
    '</select></div>' +

    /* FTP */
    '<div id="bs-ftp-block" style="display:none;background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;padding:14px;flex-direction:column;gap:10px;">' +
    mkBSField('bs-ftp-host','FTP хост','text','192.168.1.100') +
    mkBSField('bs-ftp-user','FTP логін','text','backup') +
    mkBSField('bs-ftp-pass','FTP пароль','password','') +
    mkBSField('bs-ftp-dir','FTP директорія','text','/backups') +
    '</div>' +

    /* Email */
    '<div id="bs-email-block" style="display:none;background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;padding:14px;">' +
    mkBSField('bs-email','Email адреса','email','admin@company.com') +
    '</div>' +

    /* Google Drive */
    '<div id="bs-gdrive-block" style="display:none;background:#0d2a0a;border:1px solid #5fd0a533;border-radius:8px;padding:14px;">' +
    mkBSField('bs-gdrive-url','Google Apps Script URL','text','https://script.google.com/macros/s/.../exec') +
    '<div style="font-size:11px;color:#5fd0a5;margin-top:8px;">ℹ️ RouterOS 7.1+ потрібен для :convert from=raw to=base64</div>' +
    '</div>' +

    /* Розклад */
    '<div><label style="font-size:11px;color:#8ea3b0;display:block;margin-bottom:6px;">Розклад</label>' +
    '<select id="bs-days" style="width:100%;background:#0d1a24;border:1px solid #2a3b48;color:#e6edf3;padding:8px 10px;border-radius:6px;font-size:12px;">' +
    '<option value="daily">Щодня</option>' +
    '<option value="mon,wed,fri" selected>Пн, Ср, Пт</option>' +
    '<option value="mon,fri">Пн, Пт</option>' +
    '<option value="weekly">Щотижня</option>' +
    '<option value="hourly">Щогодини</option>' +
    '</select></div>' +

    mkBSField('bs-time','Час запуску','text','03:00:00') +
    mkBSField('bs-prefix','Префікс файлів','text','mt-backup') +
    mkBSField('bs-keep','Зберігати останніх N backup','number','5') +

    '</div>' +

    /* Preview */
    '<div style="margin-top:18px;">' +
    '<div style="font-size:11px;color:#4a6070;margin-bottom:6px;">Попередній перегляд:</div>' +
    '<div id="bs-preview" style="background:#060d14;border-radius:8px;padding:14px;font-family:monospace;font-size:10.5px;color:#5fd0a5;white-space:pre-wrap;max-height:200px;overflow-y:auto;"></div>' +
    '</div>' +

    /* Кнопки */
    '<div style="display:flex;gap:10px;margin-top:16px;">' +
    '<button id="bs-copy" style="flex:1;background:#5fd0a5;color:#082018;border:none;padding:10px;border-radius:8px;cursor:pointer;font-weight:700;font-size:12px;">📋 Копіювати</button>' +
    '<button id="bs-dl" style="flex:1;background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:10px;border-radius:8px;cursor:pointer;font-size:12px;">⬇️ Завантажити .rsc</button>' +
    '</div>';

  modal.appendChild(inner);
  document.body.appendChild(modal);

  /* Закрити */
  document.getElementById('bs-close').addEventListener('click', function() {
    modal.style.display = 'none';
  });
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.style.display = 'none';
  });

  /* Стан */
  var currentTab = 'import';

  /* Таби */
  document.getElementById('bs-tab-import').addEventListener('click', function() {
    currentTab = 'import';
    this.style.background = '#5fd0a5';
    this.style.color = '#082018';
    document.getElementById('bs-tab-terminal').style.background = 'transparent';
    document.getElementById('bs-tab-terminal').style.color = '#8ea3b0';
    document.getElementById('bs-tab-hint').innerHTML =
      '📥 <b>Для /import</b> — завантаж .rsc файл і виконай <code style="color:#5fd0a5">/import file-name=backup-scheduler.rsc</code>';
    updatePreview();
  });

  document.getElementById('bs-tab-terminal').addEventListener('click', function() {
    currentTab = 'terminal';
    this.style.background = '#5fd0a5';
    this.style.color = '#082018';
    document.getElementById('bs-tab-import').style.background = 'transparent';
    document.getElementById('bs-tab-import').style.color = '#8ea3b0';
    document.getElementById('bs-tab-hint').innerHTML =
      '💻 <b>Для термінала</b> — копіюй і вставляй рядки по одному або блоками';
    updatePreview();
  });

  /* Метод */
  document.getElementById('bs-method').addEventListener('change', function() {
    var v = this.value;
    document.getElementById('bs-ftp-block').style.display   = v === 'ftp'    ? 'flex' : 'none';
    document.getElementById('bs-email-block').style.display = v === 'email'  ? 'block': 'none';
    document.getElementById('bs-gdrive-block').style.display= v === 'gdrive' ? 'block': 'none';
    updatePreview();
  });

  function getOpts() {
    return {
      name:      g('bs-name')      || 'auto-backup',
      time:      g('bs-time')      || '03:00:00',
      days:      g('bs-days')      || 'daily',
      keepMax:   g('bs-keep')      || '5',
      method:    g('bs-method')    || 'local',
      ftpHost:   g('bs-ftp-host')  || '',
      ftpUser:   g('bs-ftp-user')  || '',
      ftpPass:   g('bs-ftp-pass')  || '',
      ftpDir:    g('bs-ftp-dir')   || '/backups',
      email:     g('bs-email')     || '',
      prefix:    g('bs-prefix')    || 'mt-backup',
      gdriveUrl: g('bs-gdrive-url')|| '',
    };
  }

  function g(id) {
    var el = document.getElementById(id);
    return el ? el.value : '';
  }

  function updatePreview() {
    var opts = getOpts();
    var script = currentTab === 'import'
      ? generateBackupScript(opts)
      : generateTerminalScript(opts);
    document.getElementById('bs-preview').textContent = script;
  }

  /* Live update */
  inner.querySelectorAll('input, select').forEach(function(el) {
    el.addEventListener('input', updatePreview);
    el.addEventListener('change', updatePreview);
  });

  /* Копіювати */
  document.getElementById('bs-copy').addEventListener('click', function() {
    var script = currentTab === 'import'
      ? generateBackupScript(getOpts())
      : generateTerminalScript(getOpts());
    var btn = this;
    var orig = btn.textContent;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(script).then(function() {
        btn.textContent = '✓ Скопійовано!';
        setTimeout(function(){ btn.textContent = orig; }, 1500);
      });
    } else {
      var ta = document.createElement('textarea');
      ta.value = script;
      ta.style.cssText = 'position:fixed;left:-9999px;';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      btn.textContent = '✓ Скопійовано!';
      setTimeout(function(){ btn.textContent = orig; }, 1500);
    }
  });

  /* Завантажити */
  document.getElementById('bs-dl').addEventListener('click', function() {
    var script = currentTab === 'import'
      ? generateBackupScript(getOpts())
      : generateTerminalScript(getOpts());
    var blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'backup-scheduler.rsc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function(){ URL.revokeObjectURL(link.href); }, 1000);
  });

  /* Кнопка */
  var btn = document.createElement('button');
  btn.id = 'btn-backup-sched';
  btn.className = 'sec';
  btn.textContent = '⏰ Backup Scheduler';

  var btnbar = document.querySelector('.btnbar');
  if (btnbar) btnbar.appendChild(btn);

  btn.addEventListener('click', function() {
    updatePreview();
    modal.style.display = 'flex';
  });

  console.log('[backup-scheduler] v2 ready');
}

function mkBSField(id, label, type, placeholder) {
  return '<div>' +
    '<label for="' + id + '" style="font-size:11px;color:#8ea3b0;display:block;margin-bottom:6px;">' + label + '</label>' +
    '<input id="' + id + '" type="' + type + '" placeholder="' + placeholder + '" value="' + (type !== 'password' ? placeholder : '') + '" ' +
    'style="width:100%;background:#0d1a24;border:1px solid #2a3b48;color:#e6edf3;padding:8px 10px;border-radius:6px;font-size:12px;">' +
    '</div>';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBackupScheduler);
} else {
  initBackupScheduler();
}
"""

with open('backup-scheduler.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print('backup-scheduler.js v2 OK!')