with open('backup-scheduler.js', 'r', encoding='utf-8') as f:
    c = f.read()

# Додаємо обробники після ініціалізації кнопок copy/dl
OLD = """  /* Кнопка */
  var btn = document.createElement('button');
  btn.id = 'btn-backup-sched';"""

NEW = """  /* ── Deploy логіка ── */
  var PROXY = 'http://localhost:8888';

  function bsDeployHeaders() {
    var ip   = document.getElementById('bs-router-ip')   ? document.getElementById('bs-router-ip').value.trim()   : '192.168.88.1';
    var pass = document.getElementById('bs-router-pass') ? document.getElementById('bs-router-pass').value         : '';
    return {
      'Content-Type':    'application/json',
      'Authorization':   'Basic ' + btoa('admin:' + pass),
      'X-Router-Host':  ip,
      'X-Router-Port':  '80',
      'X-Router-Proto': 'http',
    };
  }

  function bsSetStatus(msg, type) {
    var el = document.getElementById('bs-deploy-status');
    if (!el) return;
    var colors = {
      ok:   '#5fd0a5',
      err:  '#e0665a',
      info: '#5b9bd5',
    };
    el.style.color = colors[type] || '#8ea3b0';
    el.innerHTML   = msg;
  }

  /* Тест з'єднання */
  document.getElementById('bs-deploy-test').addEventListener('click', function() {
    var btn = this;
    btn.textContent = '⏳...';
    btn.disabled = true;
    bsSetStatus('Підключаюсь...', 'info');

    fetch(PROXY + '/rest/system/identity', {
      method: 'GET',
      headers: bsDeployHeaders(),
    })
    .then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function(data) {
      bsSetStatus('✅ З\'єднання OK! Роутер: <b>' + (data.name || '?') + '</b>', 'ok');
    })
    .catch(function(e) {
      bsSetStatus('❌ ' + e.message + ' — запусти <code>python proxy.py</code>', 'err');
    })
    .finally(function() {
      btn.textContent = '🔍 Перевірити';
      btn.disabled = false;
    });
  });

  /* Deploy */
  document.getElementById('bs-deploy-btn').addEventListener('click', function() {
    var btn    = this;
    var opts   = getOpts();
    var source = currentTab === 'import'
      ? generateBackupScript(opts)
      : generateTerminalScript(opts);
    var sname  = opts.name || 'auto-backup';
    var time   = opts.time || '03:00:00';
    var interval = opts.days === 'daily' ? '1d' :
                   opts.days === 'weekly' ? '7d' :
                   opts.days === 'hourly' ? '1h' : '2d';
    var hdrs = bsDeployHeaders();

    btn.textContent = '⏳ Деплою...';
    btn.disabled = true;
    bsSetStatus('⏳ Крок 1/4: Видаляю старий скрипт...', 'info');

    /* Крок 1: Видалити старий скрипт */
    fetch(PROXY + '/rest/system/script', { method: 'GET', headers: hdrs })
    .then(function(r) { return r.json(); })
    .then(function(scripts) {
      var old = scripts.find(function(s) { return s.name === sname; });
      if (old) {
        return fetch(PROXY + '/rest/system/script/' + old['.id'], {
          method: 'DELETE', headers: hdrs,
        });
      }
    })

    /* Крок 2: Створити скрипт */
    .then(function() {
      bsSetStatus('⏳ Крок 2/4: Створюю скрипт...', 'info');

      /* Генеруємо правильний source */
      var src = [
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

      if (opts.method === 'gdrive' && opts.gdriveUrl) {
        src.push(':local gurl "' + opts.gdriveUrl + '"');
        src.push(':local rcontent [/file get $rname contents]');
        src.push(':local b64 [:convert from=raw to=base64 $rcontent]');
        src.push('/tool fetch url=$gurl mode=https http-method=post http-data=("filename=" . $rname . "&content=" . $b64) output=none');
        src.push(':log info ("Google Drive OK: " . $rname)');
      }

      if (opts.method === 'ftp' && opts.ftpHost) {
        src.push('/tool fetch address="' + opts.ftpHost + '" src-path=$rname dst-path="' + (opts.ftpDir||'/backups') + '/" user="' + (opts.ftpUser||'') + '" password="' + (opts.ftpPass||'') + '" upload=yes mode=ftp');
        src.push(':log info ("FTP OK: " . $rname)');
      }

      src.push(':log info ("Auto-backup done: " . $fname)');

      return fetch(PROXY + '/rest/system/script', {
        method: 'PUT',
        headers: hdrs,
        body: JSON.stringify({
          name:    sname,
          source:  src.join('\n'),
          policy:  ['ftp','reboot','read','write','policy','test','password','sniff','sensitive'],
          comment: 'Auto backup — MikroTik Config Generator',
        }),
      });
    })
    .then(function(r) {
      if (!r.ok) throw new Error('Скрипт: HTTP ' + r.status);
      return r.json();
    })

    /* Крок 3: Видалити старий scheduler */
    .then(function() {
      bsSetStatus('⏳ Крок 3/4: Scheduler...', 'info');
      return fetch(PROXY + '/rest/system/scheduler', { method: 'GET', headers: hdrs });
    })
    .then(function(r) { return r.json(); })
    .then(function(scheds) {
      var old = scheds.find(function(s) { return s.name === sname + '-sched'; });
      if (old) {
        return fetch(PROXY + '/rest/system/scheduler/' + old['.id'], {
          method: 'DELETE', headers: hdrs,
        });
      }
    })

    /* Крок 4: Створити scheduler */
    .then(function() {
      return fetch(PROXY + '/rest/system/scheduler', {
        method: 'PUT',
        headers: hdrs,
        body: JSON.stringify({
          name:       sname + '-sched',
          'on-event': sname,
          'start-time': time,
          interval:   interval,
          policy:     ['ftp','reboot','read','write','policy','test','password','sniff','sensitive'],
          comment:    'Auto backup scheduler',
        }),
      });
    })
    .then(function(r) {
      if (!r.ok) throw new Error('Scheduler: HTTP ' + r.status);
      bsSetStatus(
        '✅ <b>Deploy успішний!</b> Скрипт <b>' + sname + '</b> ✅ ' +
        'Scheduler о <b>' + time + '</b> кожні <b>' + interval + '</b> ✅' +
        (opts.method === 'gdrive' ? ' Google Drive ✅' : ''),
        'ok'
      );

      /* Кнопка "Запустити зараз" */
      var runBtn = document.createElement('button');
      runBtn.style.cssText = 'margin-top:8px;width:100%;background:#5fd0a5;color:#082018;border:none;padding:8px;border-radius:6px;cursor:pointer;font-weight:700;font-size:12px;';
      runBtn.textContent = '▶️ Запустити зараз для тесту';
      runBtn.addEventListener('click', function() {
        runBtn.textContent = '⏳ Запускаю...';
        runBtn.disabled = true;
        fetch(PROXY + '/rest/system/script', { method: 'GET', headers: hdrs })
        .then(function(r) { return r.json(); })
        .then(function(scripts) {
          var sc = scripts.find(function(s) { return s.name === sname; });
          if (!sc) throw new Error('Скрипт не знайдено');
          return fetch(PROXY + '/rest/system/script/' + sc['.id'] + '/run', {
            method: 'POST', headers: hdrs,
          });
        })
        .then(function() {
          runBtn.textContent = '✅ Запущено! Перевір /log print where message~"backup"';
          runBtn.style.background = '#1c2a37';
          runBtn.style.color = '#5fd0a5';
        })
        .catch(function(e) {
          runBtn.textContent = '❌ ' + e.message;
          runBtn.disabled = false;
        });
      });
      document.getElementById('bs-deploy-status').appendChild(runBtn);
    })
    .catch(function(e) {
      bsSetStatus('❌ ' + e.message, 'err');
    })
    .finally(function() {
      btn.textContent = '🚀 Deploy на роутер!';
      btn.disabled = false;
    });
  });

  /* ── Кнопка ── */
  var btn = document.createElement('button');
  btn.id = 'btn-backup-sched';"""

if OLD in c:
    c = c.replace(OLD, NEW)
    print('OK: Deploy логіка додана!')
else:
    print('WARN: не знайдено!')

with open('backup-scheduler.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
print('backup-scheduler.js готовий!')