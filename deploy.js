/* ============================================================
   deploy.js — Відправка скрипту напряму на роутер через REST API
   Patch 39 | MikroTik Config Generator
   ============================================================ */
'use strict';

function initDeploy() {

  /* Модальне вікно */
  var modal = document.createElement('div');
  modal.id = 'deploy-modal';
  modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9999;align-items:center;justify-content:center;padding:20px;';

  var inner = document.createElement('div');
  inner.style.cssText = 'background:#16212c;border:1px solid #2a3b48;border-radius:12px;padding:24px;max-width:480px;width:100%;';

  inner.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
    '<h3 style="margin:0;color:#5fd0a5;font-size:14px;">🚀 One-Click Deploy на роутер</h3>' +
    '<button id="dp-close" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:4px 12px;border-radius:6px;cursor:pointer;">✕</button>' +
    '</div>' +

    '<div style="background:#0d2a1a;border:1px solid #5fd0a533;border-radius:8px;padding:12px;margin-bottom:16px;font-size:11.5px;color:#5fd0a5;">' +
    '⚠️ Потрібен локальний проксі! Запусти в CMD:<br>' +
    '<code style="color:#5fd0a5">python proxy.py</code><br>' +
    'Потім натискай Deploy. Порт 8888.' +
    '</div>' +

    '<div style="display:grid;gap:12px;">' +

    /* IP роутера */
    '<div>' +
    '<label style="font-size:11px;color:#8ea3b0;display:block;margin-bottom:5px;">IP роутера (LAN)</label>' +
    '<input id="dp-host" type="text" value="192.168.88.1" placeholder="192.168.88.1" ' +
    'style="width:100%;background:#0d1a24;border:1px solid #2a3b48;color:#e6edf3;padding:8px 10px;border-radius:6px;font-size:12px;">' +
    '</div>' +

    /* Порт */
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
    '<div>' +
    '<label style="font-size:11px;color:#8ea3b0;display:block;margin-bottom:5px;">Порт</label>' +
    '<input id="dp-port" type="text" value="80" ' +
    'style="width:100%;background:#0d1a24;border:1px solid #2a3b48;color:#e6edf3;padding:8px 10px;border-radius:6px;font-size:12px;">' +
    '</div>' +
    '<div>' +
    '<label style="font-size:11px;color:#8ea3b0;display:block;margin-bottom:5px;">HTTPS</label>' +
    '<select id="dp-https" style="width:100%;background:#0d1a24;border:1px solid #2a3b48;color:#e6edf3;padding:8px 10px;border-radius:6px;font-size:12px;">' +
    '<option value="http">HTTP (порт 80)</option>' +
    '<option value="https">HTTPS (порт 443)</option>' +
    '</select>' +
    '</div>' +
    '</div>' +

    /* Логін */
    '<div>' +
    '<label style="font-size:11px;color:#8ea3b0;display:block;margin-bottom:5px;">Логін</label>' +
    '<input id="dp-user" type="text" value="admin" ' +
    'style="width:100%;background:#0d1a24;border:1px solid #2a3b48;color:#e6edf3;padding:8px 10px;border-radius:6px;font-size:12px;">' +
    '</div>' +

    /* Пароль */
    '<div>' +
    '<label style="font-size:11px;color:#8ea3b0;display:block;margin-bottom:5px;">Пароль admin</label>' +
    '<input id="dp-pass" type="password" placeholder="пароль роутера" ' +
    'style="width:100%;background:#0d1a24;border:1px solid #2a3b48;color:#e6edf3;padding:8px 10px;border-radius:6px;font-size:12px;">' +
    '</div>' +

    /* Назва скрипту */
    '<div>' +
    '<label style="font-size:11px;color:#8ea3b0;display:block;margin-bottom:5px;">Назва скрипту на роутері</label>' +
    '<input id="dp-scriptname" type="text" value="auto-backup" ' +
    'style="width:100%;background:#0d1a24;border:1px solid #2a3b48;color:#e6edf3;padding:8px 10px;border-radius:6px;font-size:12px;">' +
    '</div>' +

    /* Час та інтервал */
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
    '<div>' +
    '<label style="font-size:11px;color:#8ea3b0;display:block;margin-bottom:5px;">⏰ Час запуску</label>' +
    '<input id="dp-time" type="text" value="03:00:00" placeholder="03:00:00" ' +
    'style="width:100%;background:#0d1a24;border:1px solid #2a3b48;color:#e6edf3;padding:8px 10px;border-radius:6px;font-size:12px;">' +
    '</div>' +
    '<div>' +
    '<label style="font-size:11px;color:#8ea3b0;display:block;margin-bottom:5px;">📅 Інтервал</label>' +
    '<select id="dp-interval" style="width:100%;background:#0d1a24;border:1px solid #2a3b48;color:#e6edf3;padding:8px 10px;border-radius:6px;font-size:12px;">' +
    '<option value="1h">Щогодини (1h)</option>' +
    '<option value="12h">Кожні 12 год (12h)</option>' +
    '<option value="1d">Щодня (1d)</option>' +
    '<option value="2d" selected>Кожні 2 дні (2d)</option>' +
    '<option value="7d">Щотижня (7d)</option>' +
    '</select>' +
    '</div>' +
    '</div>' +

    /* Google Drive URL */
    '<div>' +
    '<label style="font-size:11px;color:#8ea3b0;display:block;margin-bottom:5px;">Google Apps Script URL</label>' +
    '<input id="dp-gdrive" type="text" placeholder="https://script.google.com/macros/s/.../exec" ' +
    'style="width:100%;background:#0d1a24;border:1px solid #2a3b48;color:#e6edf3;padding:8px 10px;border-radius:6px;font-size:12px;">' +
    '</div>' +

    '</div>' +

    /* Статус */
    '<div id="dp-status" style="margin-top:14px;min-height:36px;font-size:12px;border-radius:8px;padding:10px;display:none;"></div>' +

    /* Кнопки */
    '<div style="display:flex;gap:10px;margin-top:16px;">' +
    '<button id="dp-test" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:10px;border-radius:8px;cursor:pointer;font-size:12px;flex:1;">🔍 Перевірити з\'єднання</button>' +
    '<button id="dp-deploy" style="background:#5fd0a5;color:#082018;border:none;padding:10px;border-radius:8px;cursor:pointer;font-weight:700;font-size:12px;flex:1;">🚀 Deploy на роутер!</button>' +
    '</div>' +

    '<div style="margin-top:12px;font-size:10.5px;color:#4a6070;text-align:center;">' +
    '⚠️ Пароль не зберігається — тільки для поточного сеансу' +
    '</div>';

  modal.appendChild(inner);
  document.body.appendChild(modal);

  /* Закрити */
  document.getElementById('dp-close').addEventListener('click', function() {
    modal.style.display = 'none';
  });
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.style.display = 'none';
  });

  /* ── Helpers ── */
  var PROXY_URL = 'http://localhost:8888';

  function getBaseUrl() {
    /* Завжди через локальний проксі */
    return PROXY_URL;
  }

  function getHeaders() {
    var proto = document.getElementById('dp-https').value;
    var host  = document.getElementById('dp-host').value.trim();
    var port  = document.getElementById('dp-port').value.trim();
    var user  = document.getElementById('dp-user').value.trim();
    var pass  = document.getElementById('dp-pass').value;
    return {
      'Content-Type':    'application/json',
      'Authorization':   'Basic ' + btoa(user + ':' + pass),
      'X-Router-Host':  host,
      'X-Router-Port':  port,
      'X-Router-Proto': proto,
    };
  }

  function setStatus(msg, type) {
    var el = document.getElementById('dp-status');
    el.style.display = 'block';
    var colors = {
      ok:   { bg: '#0d2a1a', border: '#5fd0a5', color: '#5fd0a5' },
      err:  { bg: '#2a0d0a', border: '#e0665a', color: '#e0665a' },
      info: { bg: '#0d1a2a', border: '#5b9bd5', color: '#5b9bd5' },
      warn: { bg: '#2a1a0a', border: '#e6b35a', color: '#e6b35a' },
    };
    var c = colors[type] || colors.info;
    el.style.background   = c.bg;
    el.style.border       = '1px solid ' + c.border;
    el.style.color        = c.color;
    el.innerHTML = msg;
  }

  function buildScriptSource(gdrive) {
    var lines = [
      ':local bname "mt-bkp"',
      ':local fname ($bname . ".backup")',
      ':local rname ($bname . ".rsc")',
      ':log info "Backup started..."',
      '/system backup save name=$bname dont-encrypt=yes',
      ':delay 5s',
      '/export file=$bname',
      ':delay 5s',
      ':local chk [/file find name=$rname]',
      ':if ([:len $chk] = 0) do={',
      '  :log error "Export FAILED!"',
      '  :error "export failed"',
      '}',
      ':log info ("Export OK: " . $rname)',
    ];

    if (gdrive) {
      lines.push(':local gurl "' + gdrive + '"');
      lines.push(':local rcontent [/file get $rname contents]');
      lines.push(':local b64 [:convert from=raw to=base64 $rcontent]');
      lines.push('/tool fetch url=$gurl mode=https http-method=post http-data=("filename=" . $rname . "&content=" . $b64) output=none');
      lines.push(':log info ("Google Drive OK: " . $rname)');
    }

    lines.push(':log info ("Auto-backup done: " . $fname)');
    return lines.join('\n');
  }

  /* ── Тест з'єднання ── */
  document.getElementById('dp-test').addEventListener('click', function() {
    var btn = this;
    btn.textContent = '⏳ Перевіряю...';
    btn.disabled = true;
    setStatus('⏳ Підключаюсь до роутера...', 'info');

    fetch(getBaseUrl() + '/rest/system/identity', {
      method: 'GET',
      headers: getHeaders(),
    })
    .then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function(data) {
      setStatus('✅ З\'єднання OK! Роутер: <b>' + (data.name || '?') + '</b>', 'ok');
    })
    .catch(function(err) {
      setStatus(
        '❌ Помилка: ' + err.message + '<br>' +
        '<small>Перевір IP, порт, пароль. Можливо потрібно увімкнути REST API:<br>' +
        '<code>/ip service set www disabled=no</code></small>',
        'err'
      );
    })
    .finally(function() {
      btn.textContent = '🔍 Перевірити з\'єднання';
      btn.disabled = false;
    });
  });

  /* ── Deploy ── */
  document.getElementById('dp-deploy').addEventListener('click', function() {
    var btn = this;
    var scriptName = document.getElementById('dp-scriptname').value.trim() || 'auto-backup';
    var gdrive     = document.getElementById('dp-gdrive').value.trim();
    var source     = buildScriptSource(gdrive);

    btn.textContent = '⏳ Деплою...';
    btn.disabled = true;
    setStatus('⏳ Крок 1/4: Видаляю старий скрипт...', 'info');

    var base    = getBaseUrl();
    var headers = getHeaders();

    /* Крок 1: Знайти і видалити старий скрипт */
    fetch(base + '/rest/system/script', {
      method: 'GET',
      headers: headers,
    })
    .then(function(r) { return r.json(); })
    .then(function(scripts) {
      var old = scripts.find(function(s) { return s.name === scriptName; });
      if (old) {
        return fetch(base + '/rest/system/script/' + old['.id'], {
          method: 'DELETE',
          headers: headers,
        });
      }
      return Promise.resolve();
    })

    /* Крок 2: Створити новий скрипт */
    .then(function() {
      setStatus('⏳ Крок 2/4: Створюю скрипт <b>' + scriptName + '</b>...', 'info');
      return fetch(base + '/rest/system/script', {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({
          name:    scriptName,
          source:  source,
          policy:  ['ftp','reboot','read','write','policy','test','password','sniff','sensitive'],
          comment: 'Auto backup — MikroTik Config Generator',
        }),
      });
    })
    .then(function(r) {
      if (!r.ok) throw new Error('Не вдалось створити скрипт: HTTP ' + r.status);
      return r.json();
    })

    /* Крок 3: Видалити старий scheduler */
    .then(function() {
      setStatus('⏳ Крок 3/4: Налаштовую scheduler...', 'info');
      return fetch(base + '/rest/system/scheduler', {
        method: 'GET',
        headers: headers,
      });
    })
    .then(function(r) { return r.json(); })
    .then(function(scheds) {
      var old = scheds.find(function(s) { return s.name === scriptName + '-sched'; });
      if (old) {
        return fetch(base + '/rest/system/scheduler/' + old['.id'], {
          method: 'DELETE',
          headers: headers,
        });
      }
      return Promise.resolve();
    })

    /* Крок 4: Створити scheduler */
    .then(function() {
      return fetch(base + '/rest/system/scheduler', {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({
          name:      scriptName + '-sched',
          'on-event': scriptName,
          'start-time': document.getElementById('dp-time') ? document.getElementById('dp-time').value : '03:00:00',
          interval:  document.getElementById('dp-interval') ? document.getElementById('dp-interval').value : '2d',
          policy:    ['ftp','reboot','read','write','policy','test','password','sniff','sensitive'],
          comment:   'Auto backup scheduler',
        }),
      });
    })
    .then(function(r) {
      if (!r.ok) throw new Error('Scheduler помилка: HTTP ' + r.status);
      setStatus(
        '✅ <b>Deploy успішний!</b><br>' +
        'Скрипт <b>' + scriptName + '</b> створено ✅<br>' +
        ('Scheduler кожні ' + (document.getElementById('dp-interval') ? document.getElementById('dp-interval').value : '2d') + ' о ' + (document.getElementById('dp-time') ? document.getElementById('dp-time').value : '03:00:00') + ' ✅<br>') +
        (gdrive ? 'Google Drive підключено ✅' : '') +
        '<br><small>Тепер скрипт запуститься автоматично о 03:00</small>',
        'ok'
      );

      /* Запропонувати одразу запустити */
      var runBtn = document.createElement('button');
      runBtn.style.cssText = 'margin-top:10px;width:100%;background:#5fd0a5;color:#082018;border:none;padding:9px;border-radius:6px;cursor:pointer;font-weight:700;font-size:12px;';
      runBtn.textContent = '▶️ Запустити зараз для тесту';
      runBtn.addEventListener('click', function() {
        runBtn.textContent = '⏳ Запускаю...';
        runBtn.disabled = true;

        /* Знайти ID скрипту */
        fetch(base + '/rest/system/script', { method: 'GET', headers: headers })
        .then(function(r) { return r.json(); })
        .then(function(scripts) {
          var sc = scripts.find(function(s) { return s.name === scriptName; });
          if (!sc) throw new Error('Скрипт не знайдено');
          return fetch(base + '/rest/system/script/' + sc['.id'] + '/run', {
            method: 'POST',
            headers: headers,
          });
        })
        .then(function() {
          runBtn.textContent = '✅ Запущено! Перевір /log print';
          runBtn.style.background = '#2a3b48';
          runBtn.style.color = '#5fd0a5';
        })
        .catch(function(e) {
          runBtn.textContent = '❌ ' + e.message;
          runBtn.disabled = false;
        });
      });

      document.getElementById('dp-status').appendChild(runBtn);
    })
    .catch(function(err) {
      setStatus('❌ Помилка deploy: ' + err.message, 'err');
    })
    .finally(function() {
      btn.textContent = '🚀 Deploy на роутер!';
      btn.disabled = false;
    });
  });

  /* Кнопка Deploy прихована — функціонал перенесено в Backup Scheduler */
  console.log('[deploy] ready (hidden — use Backup Scheduler instead)');

  console.log('[deploy] ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDeploy);
} else {
  initDeploy();
}