JS = r"""'use strict';

function initMassDeploy() {
  var PROXY = 'http://localhost:8888';
  var STORAGE_KEY = 'mt-routers-list';
  var stopFlag = false;

  function loadRouters() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch(e) { return []; }
  }

  function saveRouters(r) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); }
    catch(e) {}
  }

  /* Modal */
  var modal = document.createElement('div');
  modal.id = 'mass-modal';
  modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9998;overflow-y:auto;padding:20px;';

  var box = document.createElement('div');
  box.style.cssText = 'max-width:1000px;margin:auto;background:#16212c;border:1px solid #2a3b48;border-radius:12px;padding:24px;';

  box.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
    '<div><h3 style="margin:0;color:#5fd0a5;font-size:16px;">📤 Масовий Deploy</h3>' +
    '<div style="font-size:11px;color:#4a6070;margin-top:2px;">Deploy конфігу на кілька роутерів одночасно</div></div>' +
    '<button id="md-close" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;">&#10005; Закрити</button>' +
    '</div>' +

    /* Список роутерів */
    '<div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;padding:16px;margin-bottom:16px;">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
    '<div style="font-size:12px;color:#5fd0a5;font-weight:700;">&#128203; Список роутерів</div>' +
    '<div style="display:flex;gap:6px;">' +
    '<button id="md-add" style="background:#5fd0a533;border:1px solid #5fd0a5;color:#5fd0a5;padding:4px 12px;border-radius:4px;cursor:pointer;font-size:11px;">+ Додати</button>' +
    '<button id="md-export-csv" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;">&#128228; CSV</button>' +
    '<button id="md-import-csv" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;">&#128229; CSV</button>' +
    '</div></div>' +
    '<div style="display:grid;grid-template-columns:auto 1fr 90px 70px 110px auto;gap:6px;font-size:10px;color:#4a6070;padding:0 6px;margin-bottom:4px;">' +
    '<span>&#9745;</span><span>IP роутера</span><span>Логін</span><span>Порт</span><span>Назва</span><span></span>' +
    '</div>' +
    '<div id="md-list" style="display:grid;gap:4px;max-height:220px;overflow-y:auto;"></div>' +
    '</div>' +

    /* Конфіг */
    '<div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;padding:16px;margin-bottom:16px;">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
    '<div style="font-size:12px;color:#5fd0a5;font-weight:700;">&#128196; Конфіг для Deploy</div>' +
    '<button id="md-from-gen" style="background:#5b9bd533;border:1px solid #5b9bd5;color:#5b9bd5;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;">&#8592; З генератора</button>' +
    '</div>' +
    '<textarea id="md-config" rows="5" placeholder="Вставте конфіг або завантажте з генератора..." style="width:100%;background:#060d14;border:1px solid #2a3b48;color:#c9e8d8;padding:10px;border-radius:6px;font-family:monospace;font-size:11px;resize:vertical;box-sizing:border-box;"></textarea>' +
    '<div id="md-config-info" style="font-size:10px;color:#4a6070;margin-top:4px;">0 рядків</div>' +
    '</div>' +

    /* Опції */
    '<div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;padding:12px;margin-bottom:16px;display:flex;gap:16px;flex-wrap:wrap;align-items:center;">' +
    '<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#c9e8d8;cursor:pointer;">' +
    '<input type="checkbox" id="md-parallel" checked style="accent-color:#5fd0a5;"> &#9889; Паралельно</label>' +
    '<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#c9e8d8;cursor:pointer;">' +
    '<input type="checkbox" id="md-dry" style="accent-color:#e6b35a;"> &#129514; Dry Run</label>' +
    '<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#c9e8d8;cursor:pointer;">' +
    '<input type="checkbox" id="md-stop-err" style="accent-color:#e0665a;"> &#128721; Стоп при помилці</label>' +
    '<div style="display:flex;align-items:center;gap:6px;">' +
    '<span style="font-size:11px;color:#8ea3b0;">Затримка:</span>' +
    '<select id="md-delay" style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:4px 8px;border-radius:4px;font-size:11px;">' +
    '<option value="0">0ms</option><option value="200" selected>200ms</option>' +
    '<option value="500">500ms</option><option value="1000">1s</option>' +
    '</select></div>' +
    '</div>' +

    /* Кнопки */
    '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">' +
    '<button id="md-ping" style="background:transparent;border:1px solid #5b9bd5;color:#5b9bd5;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:12px;">&#128269; Перевірити</button>' +
    '<button id="md-deploy-all" style="background:#5fd0a5;color:#082018;border:none;padding:8px 24px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:700;">&#128640; Deploy на всі</button>' +
    '<button id="md-deploy-sel" style="background:transparent;border:1px solid #5fd0a5;color:#5fd0a5;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:12px;">&#128640; Deploy на вибрані</button>' +
    '<button id="md-stop" style="background:#e0665a;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:12px;display:none;">&#9209; Стоп</button>' +
    '<span id="md-prog-info" style="font-size:12px;color:#4a6070;line-height:36px;"></span>' +
    '</div>' +

    /* Прогрес */
    '<div id="md-prog-wrap" style="display:none;margin-bottom:12px;">' +
    '<div style="display:flex;justify-content:space-between;font-size:11px;color:#8ea3b0;margin-bottom:4px;">' +
    '<span id="md-prog-label">Виконується...</span>' +
    '<span id="md-prog-pct">0%</span>' +
    '</div>' +
    '<div style="background:#1c2a37;border-radius:4px;height:8px;overflow:hidden;">' +
    '<div id="md-prog-bar" style="height:100%;background:#5fd0a5;width:0%;transition:width .3s;border-radius:4px;"></div>' +
    '</div>' +
    '</div>' +

    /* Результати */
    '<div id="md-results" style="display:grid;gap:6px;"></div>';

  modal.appendChild(box);
  document.body.appendChild(modal);

  var routers = loadRouters();

  /* Рендер роутерів */
  function renderRouters() {
    var list = document.getElementById('md-list');
    if (!list) return;
    list.innerHTML = '';

    if (!routers.length) {
      list.innerHTML = '<div style="color:#4a6070;font-size:11px;text-align:center;padding:12px;">Немає роутерів — натисни + Додати</div>';
      return;
    }

    routers.forEach(function(r, idx) {
      var row = document.createElement('div');
      row.style.cssText = 'display:grid;grid-template-columns:auto 1fr 90px 70px 110px auto;gap:6px;align-items:center;background:#060d14;border:1px solid #1c2a37;border-radius:6px;padding:6px 8px;';

      function inp(val, ph, w) {
        var el = document.createElement('input');
        el.type = 'text'; el.value = val || ''; el.placeholder = ph || '';
        el.style.cssText = 'background:transparent;border:none;color:#e6edf3;font-size:11px;outline:none;width:100%;font-family:monospace;';
        return el;
      }

      var chk = document.createElement('input');
      chk.type = 'checkbox'; chk.checked = r.selected !== false;
      chk.style.cssText = 'accent-color:#5fd0a5;cursor:pointer;';
      chk.addEventListener('change', function() { routers[idx].selected = chk.checked; saveRouters(routers); });

      var ip   = inp(r.ip,   'IP роутера');
      var user = inp(r.user || 'admin', 'логін');
      var port = inp(r.port || '22', 'порт');
      var name = inp(r.name, 'назва');
      user.style.color = '#8ea3b0';
      port.style.color = '#8ea3b0';
      name.style.color = '#4a6070';

      ip.addEventListener('change',   function() { routers[idx].ip   = ip.value.trim();   saveRouters(routers); });
      user.addEventListener('change', function() { routers[idx].user = user.value.trim(); saveRouters(routers); });
      port.addEventListener('change', function() { routers[idx].port = parseInt(port.value) || 22; saveRouters(routers); });
      name.addEventListener('change', function() { routers[idx].name = name.value.trim(); saveRouters(routers); });

      var btns = document.createElement('div');
      btns.style.cssText = 'display:flex;gap:3px;';

      var btnP = document.createElement('button');
      btnP.textContent = '\uD83D\uDD11'; btnP.title = 'Пароль';
      btnP.style.cssText = 'background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:2px 6px;border-radius:3px;cursor:pointer;font-size:10px;';
      btnP.addEventListener('click', function() {
        var p = prompt('Пароль для ' + (r.ip || '?') + ':', '');
        if (p !== null) { routers[idx].password = p; saveRouters(routers); btnP.style.color = '#5fd0a5'; setTimeout(function() { btnP.style.color = '#8ea3b0'; }, 1000); }
      });

      var btnD = document.createElement('button');
      btnD.textContent = '\u2715'; btnD.title = 'Видалити';
      btnD.style.cssText = 'background:transparent;border:1px solid #e0665a44;color:#e0665a;padding:2px 6px;border-radius:3px;cursor:pointer;font-size:10px;';
      btnD.addEventListener('click', function() { routers.splice(idx, 1); saveRouters(routers); renderRouters(); });

      btns.appendChild(btnP); btns.appendChild(btnD);
      row.appendChild(chk); row.appendChild(ip); row.appendChild(user);
      row.appendChild(port); row.appendChild(name); row.appendChild(btns);
      list.appendChild(row);
    });
  }

  /* Додати роутер */
  document.getElementById('md-add').addEventListener('click', function() {
    routers.push({ ip: '', user: 'admin', password: '', port: 22, name: '', selected: true });
    saveRouters(routers); renderRouters();
  });

  /* З генератора */
  document.getElementById('md-from-gen').addEventListener('click', function() {
    var out = document.getElementById('output');
    if (out && out.textContent.trim()) {
      document.getElementById('md-config').value = out.textContent.trim();
      updateInfo();
    } else { alert('Спочатку згенеруй конфіг!'); }
  });

  function updateInfo() {
    var v = document.getElementById('md-config').value;
    var n = v ? v.split('\n').filter(function(l) { return l.trim() && !l.trim().startsWith('#'); }).length : 0;
    document.getElementById('md-config-info').textContent = n + ' команд';
  }
  document.getElementById('md-config').addEventListener('input', updateInfo);

  /* CSV Експорт */
  document.getElementById('md-export-csv').addEventListener('click', function() {
    var csv = 'ip,user,password,port,name\n';
    routers.forEach(function(r) { csv += [r.ip,r.user,r.password||'',r.port||22,r.name||''].join(',') + '\n'; });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
    a.download = 'routers.csv'; a.click();
  });

  /* CSV Імпорт */
  document.getElementById('md-import-csv').addEventListener('click', function() {
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.csv,.txt';
    inp.addEventListener('change', function() {
      var reader = new FileReader();
      reader.onload = function(e) {
        var lines = e.target.result.split('\n').filter(function(l) { return l.trim(); });
        var added = 0;
        lines.forEach(function(line) {
          if (line.startsWith('ip,')) return;
          var p = line.split(',');
          if (p.length >= 2 && p[0].trim()) {
            routers.push({ ip:p[0].trim(), user:p[1]||'admin', password:p[2]||'', port:parseInt(p[3])||22, name:p[4]||'', selected:true });
            added++;
          }
        });
        saveRouters(routers); renderRouters();
        alert('Імпортовано: ' + added);
      };
      reader.readAsText(this.files[0]);
    });
    inp.click();
  });

  /* Результат-рядок */
  function makeRow(r) {
    var el = document.createElement('div');
    el.style.cssText = 'background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;overflow:hidden;';

    var hdr = document.createElement('div');
    hdr.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;';

    var dot = document.createElement('div');
    dot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:#4a6070;flex-shrink:0;';

    var lbl = document.createElement('span');
    lbl.style.cssText = 'font-size:12px;color:#e6edf3;font-family:monospace;';
    lbl.textContent = (r.name ? r.name + ' \u00B7 ' : '') + r.ip;

    var st = document.createElement('span');
    st.style.cssText = 'font-size:11px;color:#4a6070;margin-left:auto;';

    var log = document.createElement('div');
    log.style.cssText = 'display:none;background:#060d14;padding:8px 12px;font-family:monospace;font-size:10px;max-height:120px;overflow-y:auto;border-top:1px solid #1c2a37;';

    hdr.addEventListener('click', function() {
      log.style.display = log.style.display === 'none' ? 'block' : 'none';
    });

    hdr.appendChild(dot); hdr.appendChild(lbl); hdr.appendChild(st);
    el.appendChild(hdr); el.appendChild(log);

    return {
      el: el, dot: dot, st: st, log: log,
      setStatus: function(type, text) {
        var c = { pending:'#4a6070', running:'#e6b35a', ok:'#5fd0a5', error:'#e0665a' }[type] || '#4a6070';
        dot.style.background = c; st.textContent = text; st.style.color = c;
      },
      addLog: function(msg, color) {
        var d = document.createElement('div');
        d.style.color = color || '#8ea3b0'; d.textContent = msg;
        log.appendChild(d); log.scrollTop = log.scrollHeight;
        log.style.display = 'block';
      },
    };
  }

  /* Перевірити з'єднання */
  document.getElementById('md-ping').addEventListener('click', function() {
    var res = document.getElementById('md-results');
    res.innerHTML = '';
    var targets = routers.filter(function(r) { return r.ip && r.selected !== false; });
    if (!targets.length) { alert('Немає вибраних роутерів!'); return; }

    targets.forEach(function(r) {
      var row = makeRow(r);
      res.appendChild(row.el);
      row.setStatus('pending', '\u23F3 Перевіряю...');

      fetch(PROXY + '/ssh/exec', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ host:r.ip, port:r.port||22, user:r.user||'admin', password:r.password||'', command:':put [/system identity get name]', timeout:8 }),
      })
      .then(function(x) { return x.json(); })
      .then(function(d) {
        if (d.ok) row.setStatus('ok', '\u2705 OK \u2014 ' + (d.output||'').trim() + ' (' + (d.elapsed||0) + 'ms)');
        else      row.setStatus('error', '\u274C ' + (d.error||'помилка'));
      })
      .catch(function(e) { row.setStatus('error', '\u274C ' + e.message); });
    });
  });

  /* Deploy */
  function startDeploy(targets) {
    var config = document.getElementById('md-config').value.trim();
    if (!config) { alert('Заповни конфіг!'); return; }
    if (!targets.length) { alert('Немає роутерів!'); return; }

    var dry      = document.getElementById('md-dry').checked;
    var parallel = document.getElementById('md-parallel').checked;
    var delay    = parseInt(document.getElementById('md-delay').value) || 0;
    var stopOnErr= document.getElementById('md-stop-err').checked;
    var cmds     = config.split('\n').filter(function(l) { return l.trim() && !l.trim().startsWith('#'); });
    var res      = document.getElementById('md-results');

    stopFlag = false;
    res.innerHTML = '';

    document.getElementById('md-prog-wrap').style.display = 'block';
    document.getElementById('md-stop').style.display       = 'inline-block';
    document.getElementById('md-deploy-all').style.display = 'none';

    var done = 0; var total = targets.length;

    function upd() {
      var pct = Math.round(done/total*100);
      document.getElementById('md-prog-bar').style.width  = pct + '%';
      document.getElementById('md-prog-pct').textContent  = pct + '%';
      document.getElementById('md-prog-label').textContent = done + ' / ' + total;
    }

    var rows = {};
    targets.forEach(function(r) {
      var row = makeRow(r); res.appendChild(row.el);
      rows[r.ip] = row; row.setStatus('pending', '\u23F3 Очікує...');
    });

    function deployOne(r) {
      var row = rows[r.ip];
      row.setStatus('running', '\u26A1 Виконується...');

      if (dry) {
        setTimeout(function() {
          row.setStatus('ok', '\uD83E\uDDEA Dry Run \u2014 ' + cmds.length + ' команд');
          done++; upd(); if (done === total) finish();
        }, 200);
        return;
      }

      var idx = 0; var errs = 0;

      function next() {
        if (stopFlag || idx >= cmds.length) {
          row.setStatus(errs ? 'error' : 'ok', errs ? '\u274C ' + errs + ' помилок' : '\u2705 OK \u2014 ' + cmds.length + ' команд');
          done++; upd(); if (done === total) finish();
          return;
        }
        var cmd = cmds[idx++];
        row.addLog(cmd);

        setTimeout(function() {
          fetch(PROXY + '/ssh/exec', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ host:r.ip, port:r.port||22, user:r.user||'admin', password:r.password||'', command:cmd, timeout:15 }),
          })
          .then(function(x) { return x.json(); })
          .then(function(d) {
            if (!d.ok || (d.error && d.error.trim())) {
              errs++;
              row.addLog('\u274C ' + (d.error||'помилка'), '#e0665a');
              if (stopOnErr) { row.setStatus('error', '\u274C Зупинено'); done++; upd(); if (done===total) finish(); return; }
            } else if (d.output && d.output.trim()) {
              row.addLog('\u2192 ' + d.output.trim(), '#5fd0a5');
            }
            next();
          })
          .catch(function(e) { errs++; row.addLog('\u274C ' + e.message, '#e0665a'); next(); });
        }, delay);
      }
      next();
    }

    if (parallel) {
      targets.forEach(deployOne);
    } else {
      var qi = 0;
      function nextR() {
        if (qi >= targets.length || stopFlag) return;
        var r = targets[qi++];
        var prev = done;
        deployOne(r);
        var t = setInterval(function() { if (done > prev || stopFlag) { clearInterval(t); nextR(); } }, 300);
      }
      nextR();
    }
    upd();
  }

  function finish() {
    document.getElementById('md-stop').style.display       = 'none';
    document.getElementById('md-deploy-all').style.display = 'inline-block';
    document.getElementById('md-prog-label').textContent   = '\u2705 Deploy завершено!';
    document.getElementById('md-prog-bar').style.background = '#5fd0a5';
  }

  document.getElementById('md-deploy-all').addEventListener('click', function() {
    startDeploy(routers.filter(function(r) { return r.ip; }));
  });
  document.getElementById('md-deploy-sel').addEventListener('click', function() {
    startDeploy(routers.filter(function(r) { return r.ip && r.selected !== false; }));
  });
  document.getElementById('md-stop').addEventListener('click', function() {
    stopFlag = true;
    document.getElementById('md-stop').style.display       = 'none';
    document.getElementById('md-deploy-all').style.display = 'inline-block';
  });
  document.getElementById('md-close').addEventListener('click', function() { modal.style.display = 'none'; });
  modal.addEventListener('click', function(e) { if (e.target === modal) modal.style.display = 'none'; });

  /* Кнопка в панелі */
  function addBtn() {
    if (document.getElementById('btn-mass-deploy')) return true;
    var btn = document.createElement('button');
    btn.id = 'btn-mass-deploy'; btn.className = 'sec';
    btn.textContent = '\uD83D\uDCE4 Масовий Deploy';
    btn.title = 'Deploy на кілька роутерів';
    btn.addEventListener('click', function() { modal.style.display = 'block'; renderRouters(); });
    var bar = document.querySelector('.btnbar');
    if (bar) { bar.appendChild(btn); return true; }
    return false;
  }

  if (!addBtn()) {
    var t = setInterval(function() { if (addBtn()) clearInterval(t); }, 300);
  }

  console.log('[mass-deploy] v2 ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMassDeploy);
} else {
  initMassDeploy();
}
"""

with open('mass-deploy.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(JS)
print('OK: mass-deploy.js створено!')

# Підключаємо до index.html
with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

if 'mass-deploy.js' not in c:
    c = c.replace('</body>', '<script src="mass-deploy.js"></script>\n</body>')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK: mass-deploy.js підключено до index.html!')
else:
    print('вже є!')