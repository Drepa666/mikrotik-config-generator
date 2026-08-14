with open('deploy.js', 'r', encoding='utf-8') as f:
    c = f.read()

MASS_DEPLOY = """
/* ============================================================
   МАСОВИЙ DEPLOY — вбудовано в deploy.js
   ============================================================ */
function initMassDeploy() {

  var PROXY = 'http://localhost:8888';
  var STORAGE_KEY = 'mt-routers-list';

  /* ── Завантажуємо список роутерів ── */
  function loadRouters() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch(e) { return []; }
  }

  function saveRouters(routers) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(routers)); }
    catch(e) {}
  }

  /* ── Модальне вікно ── */
  var modal = document.createElement('div');
  modal.id = 'mass-modal';
  modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9998;overflow-y:auto;padding:20px;';

  modal.innerHTML = `
  <div style="max-width:1000px;margin:auto;background:#16212c;border:1px solid #2a3b48;border-radius:12px;padding:24px;">

    <!-- Шапка -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div>
        <h3 style="margin:0;color:#5fd0a5;font-size:16px;">📤 Масовий Deploy</h3>
        <div style="font-size:11px;color:#4a6070;margin-top:2px;">Deploy конфігу на кілька роутерів одночасно</div>
      </div>
      <button id="md-close" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;">✕ Закрити</button>
    </div>

    <!-- Список роутерів -->
    <div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;padding:16px;margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="font-size:12px;color:#5fd0a5;font-weight:700;">📋 Список роутерів</div>
        <div style="display:flex;gap:6px;">
          <button id="md-add-router" style="background:#5fd0a533;border:1px solid #5fd0a5;color:#5fd0a5;padding:4px 12px;border-radius:4px;cursor:pointer;font-size:11px;">+ Додати роутер</button>
          <button id="md-import-csv" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;">📥 Імпорт CSV</button>
          <button id="md-export-csv" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;">📤 Експорт CSV</button>
        </div>
      </div>

      <!-- Заголовок таблиці -->
      <div style="display:grid;grid-template-columns:auto 1fr 100px 80px 120px auto;gap:6px;align-items:center;margin-bottom:6px;font-size:10px;color:#4a6070;padding:0 6px;">
        <span>☑</span>
        <span>IP роутера</span>
        <span>Логін</span>
        <span>SSH порт</span>
        <span>Назва/коментар</span>
        <span></span>
      </div>

      <!-- Список роутерів -->
      <div id="md-routers-list" style="display:grid;gap:4px;max-height:250px;overflow-y:auto;"></div>

      <!-- CSV підказка -->
      <div style="font-size:10px;color:#4a6070;margin-top:8px;">
        💡 CSV формат: IP,логін,пароль,порт,назва (один роутер на рядок)
      </div>
    </div>

    <!-- Конфіг для deploy -->
    <div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;padding:16px;margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="font-size:12px;color:#5fd0a5;font-weight:700;">📄 Конфіг для Deploy</div>
        <button id="md-from-generator" style="background:#5b9bd533;border:1px solid #5b9bd5;color:#5b9bd5;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;">← З генератора</button>
      </div>
      <textarea id="md-config" rows="6" placeholder="Вставте конфіг або завантажте з генератора..."
        style="width:100%;background:#060d14;border:1px solid #2a3b48;color:#c9e8d8;padding:10px;border-radius:6px;font-family:monospace;font-size:11px;resize:vertical;box-sizing:border-box;"></textarea>
      <div id="md-config-info" style="font-size:10px;color:#4a6070;margin-top:4px;">0 рядків · 0 команд</div>
    </div>

    <!-- Налаштування deploy -->
    <div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;padding:14px;margin-bottom:16px;display:flex;gap:16px;flex-wrap:wrap;align-items:center;">
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#c9e8d8;cursor:pointer;">
        <input type="checkbox" id="md-parallel" checked style="accent-color:#5fd0a5;">
        ⚡ Паралельно
      </label>
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#c9e8d8;cursor:pointer;">
        <input type="checkbox" id="md-stop-on-error" style="accent-color:#e0665a;">
        🛑 Зупинити при помилці
      </label>
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#c9e8d8;cursor:pointer;">
        <input type="checkbox" id="md-dry-run" style="accent-color:#e6b35a;">
        🧪 Dry Run (не виконувати)
      </label>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:11px;color:#8ea3b0;">Затримка між командами:</span>
        <select id="md-delay" style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:4px 8px;border-radius:4px;font-size:11px;">
          <option value="0">0ms</option>
          <option value="200" selected>200ms</option>
          <option value="500">500ms</option>
          <option value="1000">1s</option>
        </select>
      </div>
    </div>

    <!-- Кнопки запуску -->
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
      <button id="md-ping-all" style="background:transparent;border:1px solid #5b9bd5;color:#5b9bd5;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:12px;">🔍 Перевірити з'єднання</button>
      <button id="md-deploy-btn" style="background:#5fd0a5;color:#082018;border:none;padding:8px 24px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:700;">🚀 Deploy на всі</button>
      <button id="md-deploy-selected" style="background:transparent;border:1px solid #5fd0a5;color:#5fd0a5;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:12px;">🚀 Deploy на вибрані</button>
      <button id="md-stop-btn" style="background:#e0665a;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:12px;display:none;">⏹ Стоп</button>
      <div id="md-progress-info" style="font-size:12px;color:#4a6070;line-height:36px;"></div>
    </div>

    <!-- Прогрес-бар -->
    <div id="md-progress-wrap" style="display:none;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#8ea3b0;margin-bottom:4px;">
        <span id="md-progress-label">Виконується...</span>
        <span id="md-progress-pct">0%</span>
      </div>
      <div style="background:#1c2a37;border-radius:4px;height:8px;overflow:hidden;">
        <div id="md-progress-bar" style="height:100%;background:#5fd0a5;width:0%;transition:width .3s;border-radius:4px;"></div>
      </div>
    </div>

    <!-- Результати -->
    <div id="md-results" style="display:grid;gap:6px;"></div>

  </div>`;

  document.body.appendChild(modal);

  /* ── Стан ── */
  var routers = loadRouters();
  var stopFlag = false;

  /* ── Рендер списку роутерів ── */
  function renderRouters() {
    var list = document.getElementById('md-routers-list');
    if (!list) return;
    list.innerHTML = '';

    if (!routers.length) {
      list.innerHTML = '<div style="color:#4a6070;font-size:11px;text-align:center;padding:12px;">Немає роутерів — натисни "+ Додати роутер"</div>';
      return;
    }

    routers.forEach(function(router, idx) {
      var row = document.createElement('div');
      row.style.cssText = 'display:grid;grid-template-columns:auto 1fr 100px 80px 120px auto;gap:6px;align-items:center;background:#060d14;border:1px solid #1c2a37;border-radius:6px;padding:6px 8px;';

      /* Чекбокс */
      var chk = document.createElement('input');
      chk.type    = 'checkbox';
      chk.checked = router.selected !== false;
      chk.style.cssText = 'accent-color:#5fd0a5;cursor:pointer;';
      chk.addEventListener('change', function() {
        routers[idx].selected = chk.checked;
        saveRouters(routers);
      });

      /* IP */
      var ip = document.createElement('input');
      ip.type  = 'text';
      ip.value = router.ip || '';
      ip.placeholder = 'IP або домен';
      ip.style.cssText = 'background:transparent;border:none;color:#e6edf3;font-size:11px;outline:none;font-family:monospace;width:100%;';
      ip.addEventListener('change', function() { routers[idx].ip = ip.value.trim(); saveRouters(routers); });

      /* Логін */
      var user = document.createElement('input');
      user.type  = 'text';
      user.value = router.user || 'admin';
      user.style.cssText = 'background:transparent;border:none;color:#8ea3b0;font-size:11px;outline:none;width:100%;';
      user.addEventListener('change', function() { routers[idx].user = user.value.trim(); saveRouters(routers); });

      /* Порт */
      var port = document.createElement('input');
      port.type  = 'number';
      port.value = router.port || 22;
      port.style.cssText = 'background:transparent;border:none;color:#8ea3b0;font-size:11px;outline:none;width:100%;';
      port.addEventListener('change', function() { routers[idx].port = parseInt(port.value) || 22; saveRouters(routers); });

      /* Назва */
      var name = document.createElement('input');
      name.type  = 'text';
      name.value = router.name || '';
      name.placeholder = 'коментар';
      name.style.cssText = 'background:transparent;border:none;color:#4a6070;font-size:11px;outline:none;width:100%;';
      name.addEventListener('change', function() { routers[idx].name = name.value.trim(); saveRouters(routers); });

      /* Кнопки */
      var btns = document.createElement('div');
      btns.style.cssText = 'display:flex;gap:3px;';

      /* Пароль */
      var btnPass = document.createElement('button');
      btnPass.textContent = '🔑';
      btnPass.title = 'Встановити пароль';
      btnPass.style.cssText = 'background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:2px 6px;border-radius:3px;cursor:pointer;font-size:10px;';
      btnPass.addEventListener('click', function() {
        var pass = prompt('Пароль для ' + router.ip + ':', '');
        if (pass !== null) {
          routers[idx].password = pass;
          saveRouters(routers);
          btnPass.style.color = '#5fd0a5';
          setTimeout(function() { btnPass.style.color = '#8ea3b0'; }, 1000);
        }
      });

      /* Видалити */
      var btnDel = document.createElement('button');
      btnDel.textContent = '✕';
      btnDel.title = 'Видалити';
      btnDel.style.cssText = 'background:transparent;border:1px solid #e0665a44;color:#e0665a;padding:2px 6px;border-radius:3px;cursor:pointer;font-size:10px;';
      btnDel.addEventListener('click', function() {
        routers.splice(idx, 1);
        saveRouters(routers);
        renderRouters();
      });

      btns.appendChild(btnPass);
      btns.appendChild(btnDel);

      row.appendChild(chk);
      row.appendChild(ip);
      row.appendChild(user);
      row.appendChild(port);
      row.appendChild(name);
      row.appendChild(btns);
      list.appendChild(row);
    });
  }

  /* ── Додати роутер ── */
  document.getElementById('md-add-router').addEventListener('click', function() {
    routers.push({ ip: '', user: 'admin', password: '', port: 22, name: '', selected: true });
    saveRouters(routers);
    renderRouters();
    /* Фокус на останній IP */
    var inputs = document.getElementById('md-routers-list').querySelectorAll('input[type="text"]');
    if (inputs.length) inputs[inputs.length - 4].focus();
  });

  /* ── З генератора ── */
  document.getElementById('md-from-generator').addEventListener('click', function() {
    var output = document.getElementById('output');
    if (output && output.textContent.trim()) {
      document.getElementById('md-config').value = output.textContent.trim();
      updateConfigInfo();
    } else {
      alert('Спочатку згенеруй конфіг!');
    }
  });

  /* ── Оновити інфо конфігу ── */
  function updateConfigInfo() {
    var config = document.getElementById('md-config').value.trim();
    var lines  = config ? config.split('\n').length : 0;
    var cmds   = config ? config.split('\n').filter(function(l) {
      return l.trim() && !l.trim().startsWith('#');
    }).length : 0;
    document.getElementById('md-config-info').textContent = lines + ' рядків · ' + cmds + ' команд';
  }

  document.getElementById('md-config').addEventListener('input', updateConfigInfo);

  /* ── Експорт/Імпорт CSV ── */
  document.getElementById('md-export-csv').addEventListener('click', function() {
    var csv = 'ip,user,password,port,name\n';
    routers.forEach(function(r) {
      csv += [r.ip, r.user, r.password || '', r.port || 22, r.name || ''].join(',') + '\n';
    });
    var blob = new Blob([csv], { type: 'text/csv' });
    var a    = document.createElement('a');
    a.href   = URL.createObjectURL(blob);
    a.download = 'routers.csv';
    a.click();
  });

  document.getElementById('md-import-csv').addEventListener('click', function() {
    var input = document.createElement('input');
    input.type   = 'file';
    input.accept = '.csv,.txt';
    input.addEventListener('change', function() {
      var file = this.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(e) {
        var lines = e.target.result.split('\n').filter(function(l) { return l.trim(); });
        var added = 0;
        lines.forEach(function(line) {
          if (line.startsWith('ip,')) return; /* заголовок */
          var parts = line.split(',');
          if (parts.length >= 2 && parts[0].trim()) {
            routers.push({
              ip:       parts[0].trim(),
              user:     parts[1].trim() || 'admin',
              password: parts[2] ? parts[2].trim() : '',
              port:     parseInt(parts[3]) || 22,
              name:     parts[4] ? parts[4].trim() : '',
              selected: true,
            });
            added++;
          }
        });
        saveRouters(routers);
        renderRouters();
        alert('✅ Імпортовано ' + added + ' роутерів!');
      };
      reader.readAsText(file);
    });
    input.click();
  });

  /* ── Перевірити з'єднання ── */
  document.getElementById('md-ping-all').addEventListener('click', function() {
    var results = document.getElementById('md-results');
    results.innerHTML = '<div style="color:#5b9bd5;font-size:12px;margin-bottom:8px;">🔍 Перевіряю з\'єднання...</div>';

    var targets = routers.filter(function(r) { return r.ip && r.selected !== false; });
    if (!targets.length) { alert('Немає вибраних роутерів!'); return; }

    targets.forEach(function(router) {
      var row = createResultRow(router);
      results.appendChild(row.el);
      setStatus(row, 'pending', '⏳ Перевіряю...');

      fetch(PROXY + '/ssh/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: router.ip, port: router.port || 22,
          user: router.user || 'admin',
          password: router.password || '',
          command: ':put [/system identity get name]',
          timeout: 8,
        }),
      })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.ok) {
          setStatus(row, 'ok', '✅ OK — ' + (d.output || '').trim() + ' (' + (d.elapsed || 0) + 'ms)');
        } else {
          setStatus(row, 'error', '❌ ' + (d.error || 'помилка'));
        }
      })
      .catch(function(e) {
        setStatus(row, 'error', '❌ ' + e.message);
      });
    });
  });

  /* ── Deploy ── */
  document.getElementById('md-deploy-btn').addEventListener('click', function() {
    startDeploy(routers.filter(function(r) { return r.ip; }));
  });

  document.getElementById('md-deploy-selected').addEventListener('click', function() {
    startDeploy(routers.filter(function(r) { return r.ip && r.selected !== false; }));
  });

  document.getElementById('md-stop-btn').addEventListener('click', function() {
    stopFlag = true;
    document.getElementById('md-stop-btn').style.display = 'none';
    document.getElementById('md-deploy-btn').style.display = 'inline-block';
    document.getElementById('md-progress-info').textContent = '⏹ Зупинено';
  });

  function startDeploy(targets) {
    var config = document.getElementById('md-config').value.trim();
    if (!config) { alert('Заповни конфіг!'); return; }
    if (!targets.length) { alert('Немає роутерів для deploy!'); return; }

    var dryRun   = document.getElementById('md-dry-run').checked;
    var parallel = document.getElementById('md-parallel').checked;
    var delay    = parseInt(document.getElementById('md-delay').value) || 0;
    var results  = document.getElementById('md-results');

    stopFlag = false;
    results.innerHTML = '';

    /* Показуємо прогрес */
    document.getElementById('md-progress-wrap').style.display = 'block';
    document.getElementById('md-stop-btn').style.display      = 'inline-block';
    document.getElementById('md-deploy-btn').style.display    = 'none';

    var cmds = config.split('\n').filter(function(l) {
      return l.trim() && !l.trim().startsWith('#');
    });

    var done  = 0;
    var total = targets.length;

    function updateProgress() {
      var pct = Math.round(done / total * 100);
      document.getElementById('md-progress-bar').style.width  = pct + '%';
      document.getElementById('md-progress-pct').textContent  = pct + '%';
      document.getElementById('md-progress-label').textContent = done + ' / ' + total + ' роутерів';
      document.getElementById('md-progress-info').textContent  = done + ' / ' + total;
    }

    /* Рядок результату для роутера */
    var rows = {};
    targets.forEach(function(router) {
      var row = createResultRow(router);
      results.appendChild(row.el);
      rows[router.ip] = row;
      setStatus(row, 'pending', '⏳ Очікує...');
    });

    /* Deploy на один роутер */
    function deployToRouter(router) {
      var row = rows[router.ip];
      setStatus(row, 'running', '⚡ Виконується...');

      if (dryRun) {
        setTimeout(function() {
          setStatus(row, 'ok', '🧪 Dry Run — ' + cmds.length + ' команд (не виконано)');
          done++;
          updateProgress();
          if (done === total) onFinish();
        }, 300);
        return;
      }

      /* Виконуємо команди послідовно */
      var cmdIdx  = 0;
      var errors  = 0;
      var stopOnErr = document.getElementById('md-stop-on-error').checked;

      function nextCmd() {
        if (stopFlag || cmdIdx >= cmds.length) {
          setStatus(row, errors ? 'error' : 'ok',
            errors ? '❌ ' + errors + ' помилок з ' + cmds.length + ' команд'
                   : '✅ OK — ' + cmds.length + ' команд виконано');
          done++;
          updateProgress();
          if (done === total) onFinish();
          return;
        }

        var cmd = cmds[cmdIdx++];
        row.log(cmd);

        setTimeout(function() {
          fetch(PROXY + '/ssh/exec', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              host: router.ip, port: router.port || 22,
              user: router.user || 'admin',
              password: router.password || '',
              command: cmd, timeout: 15,
            }),
          })
          .then(function(r) { return r.json(); })
          .then(function(d) {
            if (!d.ok || (d.error && d.error.trim())) {
              errors++;
              row.log('❌ ' + (d.error || 'помилка'), '#e0665a');
              if (stopOnErr) {
                setStatus(row, 'error', '❌ Зупинено при помилці: ' + cmd);
                done++; updateProgress();
                if (done === total) onFinish();
                return;
              }
            } else {
              if (d.output && d.output.trim()) row.log('→ ' + d.output.trim(), '#5fd0a5');
            }
            nextCmd();
          })
          .catch(function(e) {
            errors++;
            row.log('❌ ' + e.message, '#e0665a');
            if (stopOnErr) {
              setStatus(row, 'error', '❌ SSH помилка');
              done++; updateProgress();
              if (done === total) onFinish();
              return;
            }
            nextCmd();
          });
        }, delay);
      }

      nextCmd();
    }

    /* Паралельно або послідовно */
    if (parallel) {
      targets.forEach(deployToRouter);
    } else {
      var idx = 0;
      function nextRouter() {
        if (idx >= targets.length || stopFlag) return;
        var router = targets[idx++];
        var origDone = done;
        deployToRouter(router);
        /* Чекаємо завершення через polling */
        var wait = setInterval(function() {
          if (done > origDone || stopFlag) {
            clearInterval(wait);
            nextRouter();
          }
        }, 500);
      }
      nextRouter();
    }

    updateProgress();
  }

  function onFinish() {
    document.getElementById('md-stop-btn').style.display   = 'none';
    document.getElementById('md-deploy-btn').style.display = 'inline-block';
    document.getElementById('md-progress-label').textContent = '✅ Deploy завершено!';
    document.getElementById('md-progress-bar').style.background = '#5fd0a5';
  }

  /* ── Допоміжні ── */
  function createResultRow(router) {
    var el = document.createElement('div');
    el.style.cssText = 'background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;overflow:hidden;';

    var header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;';

    var indicator = document.createElement('div');
    indicator.style.cssText = 'width:8px;height:8px;border-radius:50%;background:#4a6070;flex-shrink:0;';

    var label = document.createElement('span');
    label.style.cssText = 'font-size:12px;color:#e6edf3;font-family:monospace;';
    label.textContent = (router.name ? router.name + ' · ' : '') + router.ip;

    var status = document.createElement('span');
    status.style.cssText = 'font-size:11px;color:#4a6070;margin-left:auto;';

    var logEl = document.createElement('div');
    logEl.style.cssText = 'display:none;background:#060d14;padding:8px 12px;font-family:monospace;font-size:10px;max-height:120px;overflow-y:auto;border-top:1px solid #1c2a37;';

    header.addEventListener('click', function() {
      logEl.style.display = logEl.style.display === 'none' ? 'block' : 'none';
    });

    header.appendChild(indicator);
    header.appendChild(label);
    header.appendChild(status);
    el.appendChild(header);
    el.appendChild(logEl);

    return {
      el: el,
      indicator: indicator,
      status: status,
      logEl: logEl,
      log: function(msg, color) {
        var line = document.createElement('div');
        line.style.color = color || '#8ea3b0';
        line.textContent = msg;
        logEl.appendChild(line);
        logEl.scrollTop = logEl.scrollHeight;
        logEl.style.display = 'block';
      },
    };
  }

  function setStatus(row, type, text) {
    var colors = { pending: '#4a6070', running: '#e6b35a', ok: '#5fd0a5', error: '#e0665a' };
    row.indicator.style.background = colors[type] || '#4a6070';
    row.status.textContent = text;
    row.status.style.color = colors[type] || '#4a6070';
  }

  /* ── Закрити ── */
  document.getElementById('md-close').addEventListener('click', function() {
    modal.style.display = 'none';
  });
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.style.display = 'none';
  });

  /* ── Кнопка в панелі ── */
  function addBtn() {
    if (document.getElementById('btn-mass-deploy')) return true;
    var btn = document.createElement('button');
    btn.id        = 'btn-mass-deploy';
    btn.className = 'sec';
    btn.textContent = '📤 Масовий Deploy';
    btn.title = 'Deploy на кілька роутерів';
    btn.addEventListener('click', function() {
      modal.style.display = 'block';
      renderRouters();
    });
    var bar = document.querySelector('.btnbar');
    if (bar) { bar.appendChild(btn); return true; }
    return false;
  }

  if (!addBtn()) {
    var t = setInterval(function() { if (addBtn()) clearInterval(t); }, 300);
  }

  console.log('[mass-deploy] v1 ready');
}

/* Запускаємо */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMassDeploy);
} else {
  initMassDeploy();
}
"""

# Додаємо в кінець deploy.js
c = c + MASS_DEPLOY

with open('deploy.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
print('OK: Масовий Deploy додано в deploy.js!')