/* ============================================================
   backup-scheduler.js — Генератор автоматичного backup
   Patch 34C | MikroTik Config Generator
   ============================================================ */
'use strict';

function generateBackupScript(opts) {
  var lines = [];
  var name    = opts.name    || 'auto-backup';
  var time    = opts.time    || '03:00:00';
  var days    = opts.days    || 'mon,wed,fri';
  var keepMax = opts.keepMax || 5;
  var method  = opts.method  || 'local';
  var ftpHost = opts.ftpHost || '';
  var ftpUser = opts.ftpUser || '';
  var ftpPass = opts.ftpPass || '';
  var ftpDir  = opts.ftpDir  || '/backups';
  var email   = opts.email   || '';
  var prefix  = opts.prefix  || 'mt-backup';

  lines.push('# ============================================================');
  lines.push('# MikroTik Auto-Backup Script');
  lines.push('# Згенеровано: MikroTik Config Generator');
  lines.push('# Метод: ' + method);
  lines.push('# Розклад: ' + days + ' о ' + time);
  lines.push('# ============================================================');
  lines.push('');

  /* ── Скрипт backup ── */
  lines.push('# --- Крок 1: Створити скрипт backup ---');
  lines.push('/system script remove [find name="' + name + '"]');
  lines.push('');

  var scriptBody = [];
  scriptBody.push(':local date [/system clock get date]');
  scriptBody.push(':local time [/system clock get time]');
  scriptBody.push(':local fname ("' + prefix + '-" . $date . "-" . $time)');
  scriptBody.push(':set fname [:pick $fname 0 [:len $fname]]');
  scriptBody.push(':local fname ($fname . ".backup")');
  scriptBody.push('');
  scriptBody.push('# Створити backup файл');
  scriptBody.push('/system backup save name=$fname dont-encrypt=yes');
  scriptBody.push(':delay 3s');
  scriptBody.push('');
  scriptBody.push('# Створити export .rsc');
  scriptBody.push(':local rscname ("' + prefix + '-" . $date . ".rsc")');
  scriptBody.push('/export file=$rscname');
  scriptBody.push(':delay 2s');

  if (method === 'ftp' && ftpHost) {
    scriptBody.push('');
    scriptBody.push('# Відправити на FTP');
    scriptBody.push('/tool fetch address="' + ftpHost + '" src-path=$fname \\');
    scriptBody.push('  dst-path="' + ftpDir + '/" user="' + ftpUser + '" \\');
    scriptBody.push('  password="' + ftpPass + '" upload=yes mode=ftp');
    scriptBody.push('/tool fetch address="' + ftpHost + '" src-path=$rscname \\');
    scriptBody.push('  dst-path="' + ftpDir + '/" user="' + ftpUser + '" \\');
    scriptBody.push('  password="' + ftpPass + '" upload=yes mode=ftp');
  }

  if (method === 'email' && email) {
    scriptBody.push('');
    scriptBody.push('# Відправити на Email');
    scriptBody.push('/tool e-mail send to="' + email + '" \\');
    scriptBody.push('  subject=("MikroTik Backup " . $date) \\');
    scriptBody.push('  body=("Auto backup from " . [/system identity get name]) \\');
    scriptBody.push('  file=$fname');
  }

  if (method === 'cloud') {
    scriptBody.push('');
    scriptBody.push('# Cloud backup (MikroTik Cloud)');
    scriptBody.push('/system backup cloud upload-file action=create-and-upload \\');
    scriptBody.push('  secret-download-key=yes');
  }

  if (method === 'gdrive' && opts.gdriveUrl) {
    scriptBody.push('');
    scriptBody.push('# --- Google Drive через Apps Script ---');
    scriptBody.push(':local gdurl "' + opts.gdriveUrl + '"');
    scriptBody.push('');
    scriptBody.push('# Відправляємо .rsc файл (base64 encode)');
    scriptBody.push(':local rscdata [/file get $rscname contents]');
    scriptBody.push(':local b64data [:convert from=raw to=base64 $rscdata]');
    scriptBody.push('');
    scriptBody.push('/tool fetch url=$gdurl \\');
    scriptBody.push('  http-method=post \\');
    scriptBody.push('  http-data=("filename=" . $rscname . "&content=" . $b64data) \\');
    scriptBody.push('  output=none');
    scriptBody.push('');
    scriptBody.push(':log info "Google Drive backup uploaded: $rscname"');
  }

  /* Видалення старих backup */
  scriptBody.push('');
  scriptBody.push('# Видалити старі backup файли (зберігати лише ' + keepMax + ')');
  scriptBody.push(':local bfiles [/file find name~"' + prefix + '" name~".backup"]');
  scriptBody.push(':local bcount [:len $bfiles]');
  scriptBody.push(':if ($bcount > ' + keepMax + ') do={');
  scriptBody.push('  :local toDelete ($bcount - ' + keepMax + ')');
  scriptBody.push('  :for i from=0 to=($toDelete - 1) do={');
  scriptBody.push('    /file remove [:pick $bfiles $i]');
  scriptBody.push('  }');
  scriptBody.push('}');
  scriptBody.push('');
  scriptBody.push(':log info "Auto-backup completed: $fname"');

  /* Записуємо скрипт */
  lines.push('/system script add name="' + name + '" \\');
  lines.push('  policy=ftp,reboot,read,write,policy,test,password,sniff,sensitive \\');
  lines.push('  comment="Auto backup script" \\');
  lines.push('  source="' + scriptBody.join('\\n') + '"');
  lines.push('');

  /* ── Scheduler ── */
  lines.push('# --- Крок 2: Налаштувати scheduler ---');
  lines.push('/system scheduler remove [find name="' + name + '-sched"]');
  lines.push('/system scheduler add \\');
  lines.push('  name="' + name + '-sched" \\');
  lines.push('  on-event="' + name + '" \\');
  lines.push('  start-time=' + time + ' \\');
  lines.push('  interval=' + buildInterval(days) + ' \\');
  lines.push('  policy=ftp,reboot,read,write,policy,test,password,sniff,sensitive \\');
  lines.push('  comment="Auto backup scheduler"');
  lines.push('');

  /* FTP налаштування email */
  if (method === 'email' && email) {
    lines.push('# --- Крок 3: Налаштувати Email (якщо ще не налаштовано) ---');
    lines.push('# /tool e-mail set address=smtp.gmail.com port=587 \\');
    lines.push('#   from=router@gmail.com user=router@gmail.com \\');
    lines.push('#   password="APP_PASSWORD" tls=starttls');
    lines.push('');
  }

  /* Тест */
  lines.push('# --- Крок 4: Запустити вручну для тесту ---');
  lines.push('/system script run ' + name);
  lines.push('');
  lines.push('# --- Перевірити scheduler ---');
  lines.push('/system scheduler print');
  lines.push('');
  lines.push('# --- Перевірити файли ---');
  lines.push('/file print where name~"' + prefix + '"');

  return lines.join('\n');
}

function buildInterval(days) {
  /* Конвертуємо дні тижня в інтервал */
  var dayMap = {
    'daily':   '1d',
    'mon':     '7d',
    'tue':     '7d',
    'wed':     '7d',
    'thu':     '7d',
    'fri':     '7d',
    'sat':     '7d',
    'sun':     '7d',
    'mon,wed,fri': '2d',
    'mon,fri': '3d',
    'weekly':  '7d',
    'hourly':  '1h',
  };
  return dayMap[days] || '1d';
}

/* ══════════════════════════════════════════════
   UI
══════════════════════════════════════════════ */
function initBackupScheduler() {

  /* Модальне вікно */
  var modal = document.createElement('div');
  modal.id = 'backup-sched-modal';
  modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9999;align-items:center;justify-content:center;padding:20px;overflow-y:auto;';

  var inner = document.createElement('div');
  inner.style.cssText = 'background:#16212c;border:1px solid #2a3b48;border-radius:12px;padding:24px;max-width:640px;width:100%;margin:auto;';

  inner.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
    '<h3 style="margin:0;color:#5fd0a5;font-size:14px;">⏰ Генератор Backup Scheduler</h3>' +
    '<button id="bs-close" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:4px 12px;border-radius:6px;cursor:pointer;">✕</button>' +
    '</div>' +

    /* Форма */
    '<div style="display:grid;gap:14px;">' +

    /* Назва */
    mkField('bs-name', 'Назва скрипту', 'text', 'auto-backup') +

    /* Метод */
    '<div>' +
    '<label style="font-size:11px;color:#8ea3b0;display:block;margin-bottom:6px;">Метод збереження</label>' +
    '<select id="bs-method" style="width:100%;background:#0d1a24;border:1px solid #2a3b48;color:#e6edf3;padding:8px 10px;border-radius:6px;font-size:12px;">' +
    '<option value="local">💾 Локально (на роутері)</option>' +
    '<option value="ftp">📤 FTP сервер</option>' +
    '<option value="email">📧 Email</option>' +
    '<option value="cloud">☁️ MikroTik Cloud</option>' +
    '<option value="gdrive">🟢 Google Drive (Apps Script)</option>' +
    '</select>' +
    '</div>' +

    /* FTP блок */
    '<div id="bs-ftp-block" style="display:none;background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;padding:14px;gap:10px;display:none;flex-direction:column;">' +
    mkField('bs-ftp-host', 'FTP хост', 'text', '192.168.1.100') +
    mkField('bs-ftp-user', 'FTP логін', 'text', 'backup') +
    mkField('bs-ftp-pass', 'FTP пароль', 'password', '') +
    mkField('bs-ftp-dir',  'FTP директорія', 'text', '/backups') +
    '</div>' +

    /* Google Drive блок */
    '<div id="bs-gdrive-block" style="display:none;background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;padding:14px;gap:10px;display:none;flex-direction:column;">' +
    mkField('bs-gdrive-url', '🟢 Google Apps Script URL', 'text', 'https://script.google.com/macros/s/.../exec') +
    '</div>' +

    /* Email блок */
    '<div id="bs-email-block" style="display:none;background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;padding:14px;">' +
    mkField('bs-email', 'Email адреса', 'email', 'admin@company.com') +
    '</div>' +

    /* Розклад */
    '<div>' +
    '<label style="font-size:11px;color:#8ea3b0;display:block;margin-bottom:6px;">Розклад</label>' +
    '<select id="bs-days" style="width:100%;background:#0d1a24;border:1px solid #2a3b48;color:#e6edf3;padding:8px 10px;border-radius:6px;font-size:12px;">' +
    '<option value="daily">Щодня</option>' +
    '<option value="mon,wed,fri" selected>Пн, Ср, Пт</option>' +
    '<option value="mon,fri">Пн, Пт</option>' +
    '<option value="weekly">Щотижня (Пн)</option>' +
    '<option value="hourly">Щогодини</option>' +
    '</select>' +
    '</div>' +

    /* Час */
    mkField('bs-time', 'Час запуску', 'text', '03:00:00') +

    /* Prefix */
    mkField('bs-prefix', 'Префікс файлів', 'text', 'mt-backup') +

    /* Keep */
    mkField('bs-keep', 'Зберігати останніх N backup', 'number', '5') +

    '</div>' + /* end grid */

    /* Preview */
    '<div style="margin-top:18px;">' +
    '<div style="font-size:11px;color:#4a6070;margin-bottom:8px;">Попередній перегляд скрипту:</div>' +
    '<div id="bs-preview" style="background:#060d14;border-radius:8px;padding:14px;font-family:monospace;font-size:10.5px;color:#5fd0a5;white-space:pre-wrap;max-height:220px;overflow-y:auto;"></div>' +
    '</div>' +

    /* Кнопки */
    '<div style="display:flex;gap:10px;margin-top:16px;">' +
    '<button id="bs-copy" style="flex:1;background:#5fd0a5;color:#082018;border:none;padding:10px;border-radius:8px;cursor:pointer;font-weight:700;font-size:12px;">📋 Копіювати скрипт</button>' +
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

  /* Метод → показуємо блок */
  document.getElementById('bs-method').addEventListener('change', function() {
    var v = this.value;
    var ftpBlock   = document.getElementById('bs-ftp-block');
    var emailBlock = document.getElementById('bs-email-block');
    ftpBlock.style.display   = v === 'ftp'   ? 'flex' : 'none';
    emailBlock.style.display = v === 'email' ? 'block' : 'none';
    var gdriveBlock = document.getElementById('bs-gdrive-block');
    if (gdriveBlock) gdriveBlock.style.display = v === 'gdrive' ? 'flex' : 'none';
    updatePreview();
  });

  /* Live preview */
  function getOpts() {
    return {
      name:    document.getElementById('bs-name').value    || 'auto-backup',
      time:    document.getElementById('bs-time').value    || '03:00:00',
      days:    document.getElementById('bs-days').value    || 'daily',
      keepMax: document.getElementById('bs-keep').value    || 5,
      method:  document.getElementById('bs-method').value  || 'local',
      ftpHost: document.getElementById('bs-ftp-host') ? document.getElementById('bs-ftp-host').value : '',
      ftpUser: document.getElementById('bs-ftp-user') ? document.getElementById('bs-ftp-user').value : '',
      ftpPass: document.getElementById('bs-ftp-pass') ? document.getElementById('bs-ftp-pass').value : '',
      ftpDir:  document.getElementById('bs-ftp-dir')  ? document.getElementById('bs-ftp-dir').value  : '/backups',
      email:   document.getElementById('bs-email')    ? document.getElementById('bs-email').value    : '',
      gdriveUrl: document.getElementById('bs-gdrive-url') ? document.getElementById('bs-gdrive-url').value : '',
      prefix:  document.getElementById('bs-prefix').value || 'mt-backup',
    };
  }

  function updatePreview() {
    var script = generateBackupScript(getOpts());
    document.getElementById('bs-preview').textContent = script;
  }

  /* Всі поля → оновлення preview */
  inner.querySelectorAll('input, select').forEach(function(el) {
    el.addEventListener('input', updatePreview);
    el.addEventListener('change', updatePreview);
  });

  /* Копіювати */
  document.getElementById('bs-copy').addEventListener('click', function() {
    var script = generateBackupScript(getOpts());
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
    var script = generateBackupScript(getOpts());
    var blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'backup-scheduler.rsc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function(){ URL.revokeObjectURL(link.href); }, 1000);
  });

  /* Кнопка в UI */
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

  console.log('[backup-scheduler] ready');
}

function mkField(id, label, type, placeholder) {
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