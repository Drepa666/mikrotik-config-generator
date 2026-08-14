'use strict';
(function() {

  /* ── Зберігання ── */
  var KEY = 'mt-audit-log';
  function load() {
    try {
      var l = JSON.parse(localStorage.getItem(KEY)||'[]');
      /* Видаляємо старі записи з undefined категорією */
      l = l.filter(function(e) { return e.category && e.category !== 'undefined'; });
      return l;
    } catch(e){ return []; }
  }
  function save(l) { try { localStorage.setItem(KEY,JSON.stringify(l)); } catch(e){} }

  function addEntry(action, details, cat) {
    var l = load();
    l.unshift({ id:Date.now(), ts:new Date().toLocaleString('uk-UA'), action:action||'', details:details||'', category:cat||'general' });
    if (l.length > 500) l = l.slice(0,500);
    save(l);
    if (document.getElementById('audit-list')) renderLog();
  }

  window.auditLog = { add: addEntry };

  /* ── Кольори ── */
  var COLORS = { config:'#5fd0a5', security:'#e0665a', network:'#5b9bd5', deploy:'#5fd0a5', ssh:'#5fd0a5', ai:'#9b87f5', general:'#4a6070' };
  var ICONS  = { config:'\u2699\uFE0F', security:'\uD83D\uDD12', network:'\uD83C\uDF10', deploy:'\uD83D\uDE80', ssh:'\uD83D\uDCBB', ai:'\uD83E\uDD16', general:'\uD83D\uDCCB' };

  /* ── Модалка ── */
  var modal = document.createElement('div');
  modal.id = 'audit-modal';
  modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9998;overflow-y:auto;padding:20px;';

  var box = document.createElement('div');
  box.style.cssText = 'max-width:900px;margin:auto;background:#16212c;border:1px solid #2a3b48;border-radius:12px;padding:24px;';
  box.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
    '<div><h3 style="margin:0;color:#5fd0a5;font-size:16px;">\uD83D\uDD12 Audit Log</h3>' +
    '<div style="font-size:11px;color:#4a6070;">Журнал всіх дій</div></div>' +
    '<div style="display:flex;gap:8px;">' +
    '<button id="al-exp-json" style="background:transparent;border:1px solid #5b9bd5;color:#5b9bd5;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:11px;">\uD83D\uDCE4 JSON</button>' +
    '<button id="al-exp-csv" style="background:transparent;border:1px solid #5b9bd5;color:#5b9bd5;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:11px;">\uD83D\uDCE4 CSV</button>' +
    '<button id="al-clear" style="background:transparent;border:1px solid #e0665a;color:#e0665a;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:11px;">\uD83D\uDDD1\uFE0F Очистити</button>' +
    '<button id="al-close" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;">\u2715</button>' +
    '</div></div>' +
    '<div style="display:flex;gap:8px;margin-bottom:12px;">' +
    '<input id="al-search" type="text" placeholder="\uD83D\uDD0D Пошук..." style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:6px 10px;border-radius:6px;font-size:11px;flex:1;">' +
    '<select id="al-cat" style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:6px 8px;border-radius:6px;font-size:11px;">' +
    '<option value="">Всі категорії</option>' +
    '<option value="config">\u2699\uFE0F Config</option>' +
    '<option value="security">\uD83D\uDD12 Security</option>' +
    '<option value="network">\uD83C\uDF10 Network</option>' +
    '<option value="deploy">\uD83D\uDE80 Deploy</option>' +
    '<option value="ssh">\uD83D\uDCBB SSH</option>' +
    '<option value="ai">\uD83E\uDD16 AI</option>' +
    '</select></div>' +
    '<div id="audit-stats" style="font-size:11px;color:#4a6070;margin-bottom:10px;"></div>' +
    '<div id="audit-list" style="display:grid;gap:4px;max-height:500px;overflow-y:auto;"></div>';

  modal.appendChild(box);
  document.body.appendChild(modal);

  /* ── Рендер ── */
  function renderLog() {
    var l       = load();
    var search  = (document.getElementById('al-search')||{}).value||'';
    var cat     = (document.getElementById('al-cat')||{}).value||'';
    var list    = document.getElementById('audit-list');
    var stats   = document.getElementById('audit-stats');
    if (!list) return;

    var filtered = l.filter(function(e) {
      if (search && (e.action+e.details).toLowerCase().indexOf(search.toLowerCase()) === -1) return false;
      if (cat && e.cat !== cat) return false;
      return true;
    });

    stats.textContent = '\uD83D\uDCCB Всього: ' + l.length + ' | Показано: ' + filtered.length;
    list.innerHTML = '';

    if (!filtered.length) {
      list.innerHTML = '<div style="color:#4a6070;text-align:center;padding:20px;font-size:12px;">Журнал порожній</div>';
      return;
    }

    filtered.forEach(function(e) {
      var color = COLORS[e.category]||'#4a6070';
      var icon  = ICONS[e.category]||'\uD83D\uDCCB';
      var row   = document.createElement('div');
      row.style.cssText = 'display:grid;grid-template-columns:40px 1fr auto;gap:8px;align-items:center;background:#0d1a24;border:1px solid #1c2a37;border-radius:6px;padding:8px 12px;';
      row.innerHTML =
        '<div style="text-align:center;"><div style="font-size:16px;">'+icon+'</div><div style="font-size:9px;color:'+color+';">'+e.cat+'</div></div>' +
        '<div><div style="font-size:12px;color:#e6edf3;font-weight:600;">'+e.action+'</div>' +
        (e.details ? '<div style="font-size:11px;color:#4a6070;">'+e.details+'</div>' : '') + '</div>' +
        '<div style="font-size:10px;color:#4a6070;white-space:nowrap;">'+e.ts+'</div>';
      list.appendChild(row);
    });
  }

  /* ── Події фільтрів ── */
  box.addEventListener('input',  function(e) { if (e.target.id==='al-search') renderLog(); });
  box.addEventListener('change', function(e) { if (e.target.id==='al-cat')    renderLog(); });

  /* ── Кнопки ── */
  document.getElementById('al-close').addEventListener('click', function() { modal.style.display='none'; });
  modal.addEventListener('click', function(e) { if (e.target===modal) modal.style.display='none'; });

  document.getElementById('al-clear').addEventListener('click', function() {
    if (confirm('Очистити журнал?')) { save([]); renderLog(); }
  });

  document.getElementById('al-exp-json').addEventListener('click', function() {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(load(),null,2)],{type:'application/json'}));
    a.download = 'audit-'+Date.now()+'.json'; a.click();
  });

  document.getElementById('al-exp-csv').addEventListener('click', function() {
    var csv = 'id,date,action,details,category\n';
    load().forEach(function(e) { csv += [e.id,'"'+e.ts+'"','"'+e.action+'"','"'+(e.details||'')+'"',e.category].join(',')+'\n'; });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download = 'audit-'+Date.now()+'.csv'; a.click();
  });

  /* FAB — в index.html */

  /* ── Слідкуємо за подіями ── */
  setTimeout(function() {
    var watches = [
      { id:'btn-save',      label:'Збережено налаштування',  cat:'config' },
      { id:'btn-reset',     label:'Скинуто налаштування',     cat:'config' },
      { id:'btn-copy',      label:'Скопійовано скрипт',       cat:'export' },
      { id:'btn-dl',        label:'Завантажено .rsc',         cat:'export' },
      { id:'btn-validate',  label:'Перевірено конфіг',        cat:'config' },
      { id:'btn-strip',     label:'Мінімізовано',             cat:'config' },
      { id:'btn-parse',     label:'Розібрано .rsc',           cat:'import' },
      { id:'btn-fill',      label:'Заповнено форму з .rsc',   cat:'import' },
      { id:'btn-explain',   label:'AI аналіз',                cat:'ai' },
      { id:'btn-ai-gen',    label:'AI генерація команд',      cat:'ai' },
      { id:'btn-key-save',  label:'Збережено API ключ',       cat:'security' },
    ];
    watches.forEach(function(w) {
      var el = document.getElementById(w.id);
      if (el) el.addEventListener('click', function() { addEntry(w.label,'',w.cat); });
    });

    /* Поля форми */
    var fields = [
      { id:'hostname', label:'Ім\'я роутера', cat:'config' },
      { id:'adminpass',label:'Пароль admin',  cat:'security' },
      { id:'ssid',     label:'Wi-Fi SSID',    cat:'network' },
    ];
    fields.forEach(function(f) {
      var el = document.getElementById(f.id);
      if (!el) return;
      el.addEventListener('blur', function() {
        if (el.value) addEntry('Змінено: '+f.label, el.type==='password'?'***':el.value, f.cat);
      });
    });
  }, 1500);

  /* Перший запис — тільки якщо не було за останні 60с */
  (function() {
    var log = load();
    var now = Date.now();
    var last = log[0];
    if (!last || (now - last.id) > 300000) {
      addEntry('Сесію розпочато', '', 'general');
    }
  })();

  console.log('[audit] v2 ready');
})();
