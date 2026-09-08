'use strict';

/* ============================================================
   CAPsMAN — керування точками доступу
   + Notifications — сповіщення про події
   ============================================================ */

(function() {

  function S()  { return window.RMStore; }
  function esc(s) { return window.RMEsc ? window.RMEsc(s) : String(s||''); }
  function restCall(r,m,p,b) { return window.RMRestCall(r,m,p,b); }
  function sshCall(r,c) { return window.RMSshCall(r,c); }
  function router() { return S().getRouter(); }
  function cont()   { return document.getElementById('rm-content'); }

  function loading(title) {
    var c = cont();
    if (c) c.innerHTML =
      '<div style="display:flex;align-items:center;gap:12px;padding:20px;">' +
      '<div style="width:20px;height:20px;border:2px solid #2f7a5c;' +
      'border-top-color:#5fd0a5;border-radius:50%;animation:rm-spin 1s linear infinite;"></div>' +
      '<div style="color:#8ea3b0;">' + esc(title) + '</div></div>';
  }

  function tab(id, label, active) {
    return '<div class="rm-section-tab' + (active?' active':'') + '" data-tab="' + id + '">' + label + '</div>';
  }

  function statItem(label, value, color) {
    return '<div class="rm-stat-item">' + esc(label) + ': <b style="' + (color?'color:'+color+';':'') + '">' + esc(String(value)) + '</b></div>';
  }

  function boolBadge(val) {
    var v = val === 'true' || val === true;
    return v ? '<span class="rm-badge">✓</span>' : '<span style="color:#4a6070;">—</span>';
  }

  function sectionHeader(title, count, actions) {
    return '<div class="rm-section-title">' + title +
      (count !== undefined ? ' <span class="rm-badge">' + count + '</span>' : '') +
      '<div style="margin-left:auto;display:flex;gap:6px;align-items:center;">' +
        (actions||'') +
        '<button class="rm-btn rm-btn-secondary" style="font-size:11px;" onclick="window.__rmRefreshSection()">🔄</button>' +
      '</div></div>';
  }

  function openModal(title, fields, onSave, data) {
    var existing = document.getElementById('rm-crud-modal-overlay');
    if (existing) existing.remove();
    var overlay = document.createElement('div');
    overlay.id = 'rm-crud-modal-overlay';
    overlay.className = 'rm-modal-overlay';
    var html = '<div class="rm-modal"><h3>' + title + '</h3>';
    fields.forEach(function(f) {
      var val = (data&&data[f.key]!==undefined)?String(data[f.key]):(f.value!==undefined?String(f.value):(f.default||''));
      html += '<div class="rm-modal-field"><label>' + esc(f.label) + (f.required?' <span style="color:#e05252">*</span>':'') + '</label>';
      if (f.type==='select') {
        html += '<select id="rm-cf-'+esc(f.key)+'">';
        (f.options||[]).forEach(function(opt) {
          var v=typeof opt==='object'?opt.value:opt, l=typeof opt==='object'?opt.label:opt;
          html += '<option value="'+esc(v)+'"'+(v===(f.default||val)?' selected':'')+'>'+esc(l)+'</option>';
        });
        html += '</select>';
      } else if (f.type==='checkbox') {
        var checked = val==='true'||val==='yes';
        html += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;">' +
          '<input type="checkbox" id="rm-cf-'+esc(f.key)+'"'+(checked?' checked':'')+' style="width:auto;">' +
          '<span style="font-size:12px;color:#e6edf3;">Увімкнено</span></label>';
      } else if (f.type==='textarea') {
        html += '<textarea id="rm-cf-'+esc(f.key)+'" rows="3" style="width:100%;box-sizing:border-box;background:#0d1821;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:7px 10px;font-size:13px;">'+esc(val)+'</textarea>';
      } else {
        html += '<input type="'+(f.type||'text')+'" id="rm-cf-'+esc(f.key)+'" value="'+esc(val)+'"'+(f.placeholder?' placeholder="'+esc(f.placeholder)+'"':'')+' style="width:100%;box-sizing:border-box;">';
      }
      if (f.hint) html += '<div style="font-size:11px;color:#4a6070;margin-top:3px;">'+esc(f.hint)+'</div>';
      html += '</div>';
    });
    html += '<div id="rm-cf-status" style="display:none;margin-top:10px;padding:8px 12px;border-radius:6px;font-size:12px;"></div>';
    html += '<div style="display:flex;gap:8px;margin-top:18px;justify-content:flex-end;">' +
      '<button class="rm-btn rm-btn-secondary" id="rm-cf-cancel">Скасувати</button>' +
      '<button class="rm-btn rm-btn-primary" id="rm-cf-save">💾 Зберегти</button></div></div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if(e.target===overlay) overlay.remove(); });
    document.getElementById('rm-cf-cancel').addEventListener('click', function() { overlay.remove(); });
    document.getElementById('rm-cf-save').addEventListener('click', function() {
      var formData = {};
      fields.forEach(function(f) {
        var el = document.getElementById('rm-cf-'+f.key);
        if (!el) return;
        formData[f.key] = f.type==='checkbox'?(el.checked?'yes':'no'):el.value.trim();
      });
      var missing = fields.filter(function(f){return f.required&&!formData[f.key];}).map(function(f){return f.label;});
      if (missing.length) {
        var st=document.getElementById('rm-cf-status');
        if(st){st.style.display='block';st.style.background='#3a1a1a';st.style.color='#e05252';st.textContent='⚠ Заповни: '+missing.join(', ');}
        return;
      }
      var saveBtn=document.getElementById('rm-cf-save');
      if(saveBtn){saveBtn.disabled=true;saveBtn.textContent='⏳...';}
      onSave(formData, function(ok, msg) {
        var st=document.getElementById('rm-cf-status');
        if(ok){
          if(st){st.style.display='block';st.style.background='#0d2a1a';st.style.color='#5fd0a5';st.textContent='✅ '+(msg||'Збережено!');}
          setTimeout(function(){overlay.remove();},1000);
        } else {
          if(st){st.style.display='block';st.style.background='#3a1a1a';st.style.color='#e05252';st.textContent='❌ '+(msg||'Помилка');}
          if(saveBtn){saveBtn.disabled=false;saveBtn.textContent='💾 Зберегти';}
        }
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     CAPsMAN
     ══════════════════════════════════════════════════════════ */
  window.rmSectionCAPsMAN = function() {
    var r = router(); if (!r) return;
    loading('Завантаження CAPsMAN...');

    Promise.all([
      restCall(r,'GET','/caps-man/manager').catch(function(){return{};}),
      restCall(r,'GET','/caps-man/cap').catch(function(){return[];}),
      restCall(r,'GET','/caps-man/configuration').catch(function(){return[];}),
      restCall(r,'GET','/caps-man/datapath').catch(function(){return[];}),
      restCall(r,'GET','/caps-man/channel').catch(function(){return[];}),
      restCall(r,'GET','/caps-man/registration-table').catch(function(){return[];}),
    ]).then(function(results) {
      var manager  = results[0] || {};
      var caps     = Array.isArray(results[1]) ? results[1] : [];
      var configs  = Array.isArray(results[2]) ? results[2] : [];
      var datapaths= Array.isArray(results[3]) ? results[3] : [];
      var channels = Array.isArray(results[4]) ? results[4] : [];
      var clients  = Array.isArray(results[5]) ? results[5] : [];

      var c = cont(); if (!c) return;

      /* Перевіряємо чи CAPsMAN взагалі є */
      if (manager && manager.error && manager.error.includes('not supported')) {
        c.innerHTML = sectionHeader('📡 CAPsMAN') +
          '<div class="rm-dash-card" style="text-align:center;padding:40px;">' +
          '<div style="font-size:40px;margin-bottom:12px;">📡</div>' +
          '<div style="font-size:15px;color:#e6edf3;margin-bottom:8px;">CAPsMAN недоступний</div>' +
          '<div style="font-size:12px;color:#8ea3b0;">Цей роутер не підтримує CAPsMAN або пакет не встановлено</div>' +
          '<button class="rm-btn rm-btn-primary" style="margin-top:16px;" onclick="window.__rmInstallCAPsMAN()">📦 Встановити пакет</button>' +
          '</div>';

        window.__rmInstallCAPsMAN = function() {
          sshCall(r, '/system package install wireless').then(function() {
            alert('Встановлення розпочато. Роутер потрібно перезавантажити.');
          });
        };
        return;
      }

      var enabled  = manager.enabled === 'true';
      var runningCaps = caps.filter(function(c){return c.state==='running';}).length;

      var html = sectionHeader('📡 CAPsMAN',
        caps.length,
        '<button class="rm-btn rm-btn-primary" style="font-size:11px;" onclick="window.__rmToggleCAPsMAN('+ enabled +')">'+
          (enabled ? '■ Вимкнути' : '▶ Увімкнути') +' CAPsMAN</button>'
      );

      /* Статус менеджера */
      html += '<div class="rm-stats-bar">' +
        statItem('CAPsMAN', enabled?'✅ Active':'■ Disabled', enabled?'#5fd0a5':'#e05252') +
        statItem('CAPs',         caps.length) +
        statItem('Running',      runningCaps, '#5fd0a5') +
        statItem('Clients',      clients.length, '#5fd0a5') +
        statItem('Configurations', configs.length) +
        statItem('Channels',     channels.length) +
      '</div>';

      html += '<div class="rm-section-tabs">' +
        tab('caps',       'CAPs ('     + caps.length      + ')', true) +
        tab('clients',    'Clients ('  + clients.length   + ')') +
        tab('configs',    'Configs ('  + configs.length   + ')') +
        tab('datapaths',  'Datapaths ('+ datapaths.length + ')') +
        tab('channels',   'Channels (' + channels.length  + ')') +
        tab('manager',    'Manager Settings') +
      '</div>';

      html += '<div id="rm-caps-content">' + renderCAPs(caps) + '</div>';

      c.innerHTML = html;

      /* Tab switching */
      c.querySelectorAll('.rm-section-tab').forEach(function(t) {
        t.addEventListener('click', function() {
          c.querySelectorAll('.rm-section-tab').forEach(function(x){x.classList.remove('active');});
          t.classList.add('active');
          var wrap = document.getElementById('rm-caps-content');
          if (!wrap) return;
          var tt = t.dataset.tab;
          if (tt==='caps')      wrap.innerHTML = renderCAPs(caps);
          if (tt==='clients')   wrap.innerHTML = renderCAPsClients(clients);
          if (tt==='configs')   wrap.innerHTML = renderCAPsConfigs(configs);
          if (tt==='datapaths') wrap.innerHTML = renderCAPsDatapaths(datapaths);
          if (tt==='channels')  wrap.innerHTML = renderCAPsChannels(channels);
          if (tt==='manager')   wrap.innerHTML = renderCAPsManager(manager);
        });
      });

      window.__rmRefreshSection = function() { window.rmSectionCAPsMAN(); };

      window.__rmToggleCAPsMAN = function(enabled) {
        restCall(r,'PATCH','/caps-man/manager',{enabled: enabled?'no':'yes'}).then(function() {
          window.rmSectionCAPsMAN();
        });
      };
    });
  };

  /* ── CAPs список ── */
  function renderCAPs(caps) {
    var r = router();
    var html = '<div style="display:flex;justify-content:flex-end;margin-bottom:10px;">' +
      '<button class="rm-btn rm-btn-secondary" style="font-size:11px;" onclick="window.__rmProvisionAll()">🔄 Provision All</button>' +
    '</div>';

    if (!caps.length) return html + '<div style="color:#8ea3b0;padding:20px;text-align:center;">CAP пристроїв не знайдено</div>';

    html += '<table class="rm-table rm-table-compact">' +
      '<tr><th>Назва</th><th>MAC</th><th>IP</th><th>Board</th><th>State</th><th>Радіо</th><th>Clients</th><th style="text-align:right;">Дії</th></tr>';

    caps.forEach(function(cap) {
      var id      = cap['.id'] || '';
      var running = cap.state === 'running';

      html += '<tr>' +
        '<td><b style="color:' + (running?'#5fd0a5':'#8ea3b0') + ';">' + esc(cap.name||cap.identity||'') + '</b></td>' +
        '<td style="font-family:monospace;font-size:11px;">' + esc(cap['mac-address']||'') + '</td>' +
        '<td style="font-size:11px;">' + esc(cap['address']||'') + '</td>' +
        '<td style="font-size:11px;color:#8ea3b0;">' + esc(cap.board||'') + '</td>' +
        '<td>' +
          '<span class="rm-badge' + (running?'':' rm-badge-err') + '">' +
          esc(cap.state||'unknown') + '</span>' +
        '</td>' +
        '<td>' + esc(cap['radio-count']||'0') + '</td>' +
        '<td>' + esc(cap['client-count']||'0') + '</td>' +
        '<td style="text-align:right;white-space:nowrap;">' +
          '<button class="rm-act-btn rm-act-edit" onclick="window.__rmProvisionCAP(\'' + esc(id) + '\')">🔄</button>' +
          '<button class="rm-act-btn rm-act-del" onclick="window.__rmRemoveCAP(\'' + esc(id) + '\',\'' + esc(cap.name||cap.identity) + '\')">🗑</button>' +
        '</td></tr>';
    });
    html += '</table>';

    window.__rmProvisionAll = function() {
      sshCall(r, '/caps-man cap provision').then(function() {
        setTimeout(window.rmSectionCAPsMAN, 1000);
      });
    };

    window.__rmProvisionCAP = function(id) {
      sshCall(r, '/caps-man cap provision [find where .id="' + id + '"]').then(function() {
        setTimeout(window.rmSectionCAPsMAN, 1000);
      });
    };

    window.__rmRemoveCAP = function(id, name) {
      if (!confirm('Видалити CAP "' + name + '"?')) return;
      restCall(r,'DELETE','/caps-man/cap/' + id, null).then(function() {
        window.rmSectionCAPsMAN();
      });
    };

    return html;
  }

  /* ── CAPsMAN Clients ── */
  function renderCAPsClients(clients) {
    if (!clients.length) return '<div style="color:#8ea3b0;padding:20px;text-align:center;">Клієнтів немає</div>';

    var html = '<div style="font-size:11px;color:#8ea3b0;margin-bottom:8px;">' +
      '<span class="rm-live-dot"></span> ' + clients.length + ' клієнтів</div>';

    html += '<table class="rm-table rm-table-compact">' +
      '<tr><th>MAC</th><th>Interface</th><th>CAP</th><th>SSID</th><th>Signal</th><th>TX Rate</th><th>RX Rate</th><th>Uptime</th></tr>';

    clients.forEach(function(c) {
      var signal = parseInt(c['signal-strength']||'-100');
      var sigColor = signal>-65?'#5fd0a5':signal>-80?'#f0a840':'#e05252';

      html += '<tr>' +
        '<td style="font-family:monospace;font-size:11px;">' + esc(c['mac-address']||'') + '</td>' +
        '<td>' + esc(c.interface||'') + '</td>' +
        '<td style="font-size:11px;">' + esc(c.cap||'') + '</td>' +
        '<td>' + esc(c.ssid||'') + '</td>' +
        '<td style="color:' + sigColor + ';font-weight:600;">' + esc(c['signal-strength']||'') + ' dBm</td>' +
        '<td style="font-size:11px;">' + esc(c['tx-rate']||'') + '</td>' +
        '<td style="font-size:11px;">' + esc(c['rx-rate']||'') + '</td>' +
        '<td>' + esc(c.uptime||'') + '</td>' +
      '</tr>';
    });
    html += '</table>';
    return html;
  }

  /* ── CAPsMAN Configurations ── */
  function renderCAPsConfigs(configs) {
    var r = router();
    var html = '<div style="display:flex;justify-content:flex-end;margin-bottom:10px;">' +
      '<button class="rm-btn rm-btn-primary" style="font-size:11px;" onclick="window.__rmAddCAPsConfig()">＋ Додати</button>' +
    '</div>';

    if (!configs.length) return html + '<div style="color:#8ea3b0;padding:20px;text-align:center;">Конфігурацій немає</div>';

    html += '<table class="rm-table rm-table-compact">' +
      '<tr><th>Назва</th><th>SSID</th><th>Mode</th><th>Band</th><th>Channel</th><th>Datapath</th><th style="text-align:right;">Дії</th></tr>';

    configs.forEach(function(cfg) {
      var id = cfg['.id'] || '';
      html += '<tr>' +
        '<td><b>' + esc(cfg.name||'') + '</b></td>' +
        '<td>' + esc(cfg.ssid||'') + '</td>' +
        '<td style="font-size:11px;">' + esc(cfg.mode||'') + '</td>' +
        '<td style="font-size:11px;">' + esc(cfg.band||'') + '</td>' +
        '<td>' + esc(cfg.channel||'') + '</td>' +
        '<td>' + esc(cfg.datapath||'') + '</td>' +
        '<td style="text-align:right;">' +
          '<button class="rm-act-btn rm-act-edit" onclick="window.__rmEditCAPsConfig(\'' + esc(id) + '\')">✏️</button>' +
          '<button class="rm-act-btn rm-act-del" onclick="window.__rmDelCAPsConfig(\'' + esc(id) + '\',\'' + esc(cfg.name) + '\')">🗑</button>' +
        '</td></tr>';
    });
    html += '</table>';

    window.__rmAddCAPsConfig = function() {
      openModal('➕ CAPsMAN Configuration', [
        { key:'name',     label:'Назва',     required:true },
        { key:'ssid',     label:'SSID',      required:true, placeholder:'MyNetwork' },
        { key:'mode',     label:'Mode',      type:'select', options:['ap','station','bridge'] },
        { key:'band',     label:'Band',      type:'select', options:['2ghz-b/g/n','5ghz-a/n/ac','2ghz-g/n'] },
        { key:'channel',  label:'Channel',   placeholder:'channel config name' },
        { key:'datapath', label:'Datapath',  placeholder:'datapath config name' },
        { key:'security', label:'Security',  placeholder:'security config name' },
        { key:'comment',  label:'Коментар' },
      ], function(data, done) {
        restCall(r,'PUT','/caps-man/configuration',data).then(function(res) {
          if(res&&res.error){done(false,res.error);return;}
          done(true); setTimeout(window.rmSectionCAPsMAN,500);
        }).catch(function(e){done(false,String(e));});
      });
    };

    window.__rmEditCAPsConfig = function(id) {
      restCall(r,'GET','/caps-man/configuration/'+id).then(function(cfg) {
        openModal('✏️ Configuration — '+(cfg.name||''), [
          { key:'name',     label:'Назва',    value: cfg.name||'' },
          { key:'ssid',     label:'SSID',     value: cfg.ssid||'' },
          { key:'mode',     label:'Mode',     type:'select', options:['ap','station','bridge'], default: cfg.mode },
          { key:'band',     label:'Band',     type:'select', options:['2ghz-b/g/n','5ghz-a/n/ac','2ghz-g/n'], default: cfg.band },
          { key:'channel',  label:'Channel',  value: cfg.channel||'' },
          { key:'datapath', label:'Datapath', value: cfg.datapath||'' },
          { key:'comment',  label:'Коментар', value: cfg.comment||'' },
        ], function(data, done) {
          restCall(r,'PATCH','/caps-man/configuration/'+id,data).then(function(res) {
            if(res&&res.error){done(false,res.error);return;}
            done(true); setTimeout(window.rmSectionCAPsMAN,500);
          }).catch(function(e){done(false,String(e));});
        });
      });
    };

    window.__rmDelCAPsConfig = function(id, name) {
      if (!confirm('Видалити конфігурацію "'+name+'"?')) return;
      restCall(r,'DELETE','/caps-man/configuration/'+id,null).then(function() {
        window.rmSectionCAPsMAN();
      });
    };

    return html;
  }

  /* ── Datapaths ── */
  function renderCAPsDatapaths(datapaths) {
    var r = router();
    var html = '<div style="display:flex;justify-content:flex-end;margin-bottom:10px;">' +
      '<button class="rm-btn rm-btn-primary" style="font-size:11px;" onclick="window.__rmAddDatapath()">＋ Додати</button>' +
    '</div>';

    if (!datapaths.length) return html + '<div style="color:#8ea3b0;padding:20px;text-align:center;">Datapaths немає</div>';

    html += '<table class="rm-table rm-table-compact">' +
      '<tr><th>Назва</th><th>Bridge</th><th>VLAN Mode</th><th>VLAN ID</th><th>Local Forwarding</th><th style="text-align:right;">Дії</th></tr>';

    datapaths.forEach(function(dp) {
      var id = dp['.id'] || '';
      html += '<tr>' +
        '<td><b>' + esc(dp.name||'') + '</b></td>' +
        '<td>' + esc(dp.bridge||'') + '</td>' +
        '<td>' + esc(dp['vlan-mode']||'') + '</td>' +
        '<td>' + esc(dp['vlan-id']||'') + '</td>' +
        '<td>' + boolBadge(dp['local-forwarding']) + '</td>' +
        '<td style="text-align:right;">' +
          '<button class="rm-act-btn rm-act-edit" onclick="window.__rmEditDatapath(\'' + esc(id) + '\')">✏️</button>' +
          '<button class="rm-act-btn rm-act-del" onclick="window.__rmDelDatapath(\'' + esc(id) + '\',\'' + esc(dp.name) + '\')">🗑</button>' +
        '</td></tr>';
    });
    html += '</table>';

    window.__rmAddDatapath = function() {
      openModal('➕ Datapath', [
        { key:'name',              label:'Назва',           required:true },
        { key:'bridge',            label:'Bridge',          placeholder:'bridge-lan' },
        { key:'vlan-mode',         label:'VLAN Mode',       type:'select', options:['','use-service-tag','use-customer-tag'] },
        { key:'vlan-id',           label:'VLAN ID',         placeholder:'1-4094' },
        { key:'local-forwarding',  label:'Local Forwarding',type:'checkbox' },
        { key:'client-to-client-forwarding', label:'Client-to-Client', type:'checkbox' },
      ], function(data, done) {
        restCall(r,'PUT','/caps-man/datapath',data).then(function(res) {
          if(res&&res.error){done(false,res.error);return;}
          done(true); setTimeout(window.rmSectionCAPsMAN,500);
        }).catch(function(e){done(false,String(e));});
      });
    };

    window.__rmEditDatapath = function(id) {
      restCall(r,'GET','/caps-man/datapath/'+id).then(function(dp) {
        openModal('✏️ Datapath — '+(dp.name||''), [
          { key:'name',              label:'Назва',           value: dp.name||'' },
          { key:'bridge',            label:'Bridge',          value: dp.bridge||'' },
          { key:'vlan-mode',         label:'VLAN Mode',       type:'select', options:['','use-service-tag','use-customer-tag'], default: dp['vlan-mode'] },
          { key:'vlan-id',           label:'VLAN ID',         value: dp['vlan-id']||'' },
          { key:'local-forwarding',  label:'Local Forwarding',type:'checkbox', value: dp['local-forwarding'] },
        ], function(data, done) {
          restCall(r,'PATCH','/caps-man/datapath/'+id,data).then(function(res) {
            if(res&&res.error){done(false,res.error);return;}
            done(true); setTimeout(window.rmSectionCAPsMAN,500);
          }).catch(function(e){done(false,String(e));});
        });
      });
    };

    window.__rmDelDatapath = function(id, name) {
      if (!confirm('Видалити datapath "'+name+'"?')) return;
      restCall(r,'DELETE','/caps-man/datapath/'+id,null).then(function() { window.rmSectionCAPsMAN(); });
    };

    return html;
  }

  /* ── Channels ── */
  function renderCAPsChannels(channels) {
    var r = router();
    var html = '<div style="display:flex;justify-content:flex-end;margin-bottom:10px;">' +
      '<button class="rm-btn rm-btn-primary" style="font-size:11px;" onclick="window.__rmAddChannel()">＋ Додати</button>' +
    '</div>';

    if (!channels.length) return html + '<div style="color:#8ea3b0;padding:20px;text-align:center;">Channel конфігурацій немає</div>';

    html += '<table class="rm-table rm-table-compact">' +
      '<tr><th>Назва</th><th>Band</th><th>Frequency</th><th>Width</th><th>TX Power</th><th style="text-align:right;">Дії</th></tr>';

    channels.forEach(function(ch) {
      var id = ch['.id'] || '';
      html += '<tr>' +
        '<td><b>' + esc(ch.name||'') + '</b></td>' +
        '<td>' + esc(ch.band||'') + '</td>' +
        '<td>' + esc(ch.frequency||'auto') + '</td>' +
        '<td>' + esc(ch.width||'') + '</td>' +
        '<td>' + esc(ch['tx-power']||'auto') + '</td>' +
        '<td style="text-align:right;">' +
          '<button class="rm-act-btn rm-act-edit" onclick="window.__rmEditChannel(\'' + esc(id) + '\')">✏️</button>' +
          '<button class="rm-act-btn rm-act-del" onclick="window.__rmDelChannel(\'' + esc(id) + '\',\'' + esc(ch.name) + '\')">🗑</button>' +
        '</td></tr>';
    });
    html += '</table>';

    window.__rmAddChannel = function() {
      openModal('➕ Channel', [
        { key:'name',      label:'Назва',    required:true },
        { key:'band',      label:'Band',     type:'select', options:['2ghz-b/g/n','5ghz-a/n/ac','2ghz-g/n','5ghz-n/ac'] },
        { key:'frequency', label:'Frequency',placeholder:'auto або 2412, 5180...' },
        { key:'width',     label:'Width',    type:'select', options:['20mhz','20/40mhz','20/40/80mhz','80mhz'] },
        { key:'tx-power',  label:'TX Power', placeholder:'auto або 0-40' },
        { key:'save-selected', label:'Save Selected', type:'checkbox' },
      ], function(data, done) {
        restCall(r,'PUT','/caps-man/channel',data).then(function(res) {
          if(res&&res.error){done(false,res.error);return;}
          done(true); setTimeout(window.rmSectionCAPsMAN,500);
        }).catch(function(e){done(false,String(e));});
      });
    };

    window.__rmEditChannel = function(id) {
      restCall(r,'GET','/caps-man/channel/'+id).then(function(ch) {
        openModal('✏️ Channel — '+(ch.name||''), [
          { key:'name',      label:'Назва',    value: ch.name||'' },
          { key:'band',      label:'Band',     type:'select', options:['2ghz-b/g/n','5ghz-a/n/ac','2ghz-g/n','5ghz-n/ac'], default: ch.band },
          { key:'frequency', label:'Frequency',value: ch.frequency||'auto' },
          { key:'width',     label:'Width',    type:'select', options:['20mhz','20/40mhz','20/40/80mhz','80mhz'], default: ch.width },
          { key:'tx-power',  label:'TX Power', value: ch['tx-power']||'auto' },
        ], function(data, done) {
          restCall(r,'PATCH','/caps-man/channel/'+id,data).then(function(res) {
            if(res&&res.error){done(false,res.error);return;}
            done(true); setTimeout(window.rmSectionCAPsMAN,500);
          }).catch(function(e){done(false,String(e));});
        });
      });
    };

    window.__rmDelChannel = function(id, name) {
      if (!confirm('Видалити channel "'+name+'"?')) return;
      restCall(r,'DELETE','/caps-man/channel/'+id,null).then(function() { window.rmSectionCAPsMAN(); });
    };

    return html;
  }

  /* ── Manager Settings ── */
  function renderCAPsManager(manager) {
    var r = router();
    var html = '<div class="rm-dash-card">' +
      '<h4>⚙️ CAPsMAN Manager Settings</h4>' +
      '<div style="display:grid;grid-template-columns:auto 1fr;gap:8px 16px;margin-bottom:16px;">';

    var fields = [
      ['Enabled',       manager.enabled],
      ['Package Path',  manager['package-path']],
      ['CA Certificate',manager['ca-certificate']],
      ['Certificate',   manager.certificate],
      ['Require Peer Certificate', manager['require-peer-certificate']],
      ['Generated Certificate', manager['generated-certificate']],
    ];

    fields.forEach(function(f) {
      html += '<div style="font-size:11px;color:#8ea3b0;">'+esc(f[0])+'</div>' +
              '<div style="font-size:13px;">'+esc(f[1]||'—')+'</div>';
    });

    html += '</div>' +
      '<button class="rm-btn rm-btn-primary" onclick="window.__rmEditCAPsManager()">✏️ Змінити налаштування</button>' +
    '</div>';

    window.__rmEditCAPsManager = function() {
      openModal('✏️ CAPsMAN Manager', [
        { key:'enabled',                  label:'Увімкнено',          type:'checkbox', value: manager.enabled },
        { key:'package-path',             label:'Package Path',        value: manager['package-path']||'' },
        { key:'require-peer-certificate', label:'Require Certificate', type:'checkbox', value: manager['require-peer-certificate'] },
        { key:'upgrade-policy',           label:'Upgrade Policy',      type:'select', options:['none','require-same-version','suggest-same-upgrade'] },
      ], function(data, done) {
        restCall(r,'PATCH','/caps-man/manager',data).then(function(res) {
          if(res&&res.error){done(false,res.error);return;}
          done(true); setTimeout(window.rmSectionCAPsMAN,500);
        }).catch(function(e){done(false,String(e));});
      });
    };

    return html;
  }

  /* ══════════════════════════════════════════════════════════
     NOTIFICATIONS — сповіщення про події
     ══════════════════════════════════════════════════════════ */

  var _notifTimer    = null;
  var _notifHistory  = [];
  var _notifRules    = [];
  var _prevState     = {};
  var _notifEnabled  = true;

  /* ── Стилі нотифікацій ── */
  function injectNotifStyles() {
    if (document.getElementById('rm-notif-styles')) return;
    var s = document.createElement('style');
    s.id = 'rm-notif-styles';
    s.textContent = `
      #rm-notif-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        display: flex;
        flex-direction: column-reverse;
        gap: 8px;
        max-width: 340px;
        pointer-events: none;
      }
      .rm-notif {
        background: #111d27;
        border: 1px solid #2a3b48;
        border-radius: 10px;
        padding: 12px 16px;
        display: flex;
        align-items: flex-start;
        gap: 10px;
        box-shadow: 0 8px 32px rgba(0,0,0,.5);
        pointer-events: all;
        animation: rm-notif-in .3s ease;
        cursor: pointer;
      }
      .rm-notif:hover { border-color: #5fd0a5; }
      .rm-notif.ok    { border-left: 3px solid #5fd0a5; }
      .rm-notif.warn  { border-left: 3px solid #f0a840; }
      .rm-notif.err   { border-left: 3px solid #e05252; }
      .rm-notif.info  { border-left: 3px solid #60b8f0; }
      .rm-notif-icon  { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
      .rm-notif-body  { flex: 1; }
      .rm-notif-title { font-size: 13px; font-weight: 600; color: #e6edf3; margin-bottom: 3px; }
      .rm-notif-msg   { font-size: 12px; color: #8ea3b0; }
      .rm-notif-time  { font-size: 10px; color: #4a6070; margin-top: 4px; }
      .rm-notif-close { font-size: 14px; color: #4a6070; cursor: pointer; flex-shrink: 0; padding: 0 2px; }
      .rm-notif-close:hover { color: #e05252; }
      @keyframes rm-notif-in {
        from { opacity: 0; transform: translateX(40px); }
        to   { opacity: 1; transform: translateX(0); }
      }

      /* Bell button */
      #rm-notif-bell {
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #111d27;
        border: 1px solid #2a3b48;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 99998;
        font-size: 20px;
        transition: all .2s;
        box-shadow: 0 4px 16px rgba(0,0,0,.4);
      }
      #rm-notif-bell:hover { border-color: #5fd0a5; transform: scale(1.1); }
      #rm-notif-count {
        position: absolute;
        top: -4px;
        right: -4px;
        background: #e05252;
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        width: 18px;
        height: 18px;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        display: none;
      }

      /* History panel */
      #rm-notif-panel {
        position: fixed;
        bottom: 70px;
        left: 20px;
        width: 320px;
        max-height: 400px;
        background: #111d27;
        border: 1px solid #2a3b48;
        border-radius: 12px;
        z-index: 99997;
        overflow-y: auto;
        display: none;
        box-shadow: 0 8px 32px rgba(0,0,0,.5);
      }
      .rm-notif-panel-header {
        padding: 12px 16px;
        border-bottom: 1px solid #2a3b48;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 13px;
        font-weight: 600;
        color: #e6edf3;
        position: sticky;
        top: 0;
        background: #111d27;
      }
    `;
    document.head.appendChild(s);
  }

  /* ── Показати нотифікацію ── */
  function showNotif(type, title, msg, duration) {
    if (!_notifEnabled) return;
    injectNotifStyles();

    var container = document.getElementById('rm-notif-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'rm-notif-container';
      document.body.appendChild(container);
    }

    var icons = { ok:'✅', warn:'⚠️', err:'❌', info:'ℹ️' };
    var now   = new Date().toLocaleTimeString('uk-UA');

    var notif = document.createElement('div');
    notif.className = 'rm-notif ' + (type||'info');
    notif.innerHTML =
      '<div class="rm-notif-icon">' + (icons[type]||'ℹ️') + '</div>' +
      '<div class="rm-notif-body">' +
        '<div class="rm-notif-title">' + esc(title) + '</div>' +
        '<div class="rm-notif-msg">'   + esc(msg)   + '</div>' +
        '<div class="rm-notif-time">'  + now         + '</div>' +
      '</div>' +
      '<div class="rm-notif-close" onclick="this.parentElement.remove()">✕</div>';

    notif.addEventListener('click', function() { notif.remove(); });
    container.appendChild(notif);

    /* Зберігаємо в history */
    _notifHistory.unshift({ type: type, title: title, msg: msg, time: now });
    if (_notifHistory.length > 50) _notifHistory.pop();
    updateNotifBell();

    /* Авто-видалення */
    setTimeout(function() {
      if (notif.parentElement) {
        notif.style.opacity = '0';
        notif.style.transform = 'translateX(40px)';
        notif.style.transition = 'all .3s';
        setTimeout(function() { notif.remove(); }, 300);
      }
    }, duration || 5000);
  }

  /* ── Bell і панель ── */
  function updateNotifBell() {
    var bell  = document.getElementById('rm-notif-bell');
    var count = document.getElementById('rm-notif-count');
    if (!bell) return;
    if (count) {
      var unread = _notifHistory.length;
      count.textContent = unread > 9 ? '9+' : unread;
      count.style.display = unread > 0 ? 'flex' : 'none';
    }
  }

  function createNotifBell() {
    if (document.getElementById('rm-notif-bell')) return;
    injectNotifStyles();

    var bell = document.createElement('div');
    bell.id  = 'rm-notif-bell';
    bell.innerHTML = '🔔<div id="rm-notif-count"></div>';
    bell.title = 'Сповіщення';
    document.body.appendChild(bell);

    var panel = document.createElement('div');
    panel.id  = 'rm-notif-panel';
    document.body.appendChild(panel);

    bell.addEventListener('click', function() {
      var p = document.getElementById('rm-notif-panel');
      if (!p) return;
      var visible = p.style.display === 'block';
      p.style.display = visible ? 'none' : 'block';
      if (!visible) renderNotifPanel();
    });
  }

  function renderNotifPanel() {
    var panel = document.getElementById('rm-notif-panel');
    if (!panel) return;

    var html = '<div class="rm-notif-panel-header">🔔 Сповіщення' +
      '<button class="rm-btn rm-btn-secondary" style="font-size:10px;padding:3px 8px;" onclick="window._notifHistory=[];window.renderNotifPanel&&renderNotifPanel();">Очистити</button>' +
    '</div>';

    if (!_notifHistory.length) {
      html += '<div style="padding:20px;text-align:center;color:#8ea3b0;font-size:12px;">Сповіщень немає</div>';
    } else {
      var icons = { ok:'✅', warn:'⚠️', err:'❌', info:'ℹ️' };
      _notifHistory.forEach(function(n) {
        html += '<div style="padding:10px 16px;border-bottom:1px solid #1a2d3d;">' +
          '<div style="display:flex;gap:8px;align-items:flex-start;">' +
            '<span>' + (icons[n.type]||'ℹ️') + '</span>' +
            '<div>' +
              '<div style="font-size:12px;font-weight:600;color:#e6edf3;">' + esc(n.title) + '</div>' +
              '<div style="font-size:11px;color:#8ea3b0;">' + esc(n.msg) + '</div>' +
              '<div style="font-size:10px;color:#4a6070;">' + esc(n.time) + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      });
    }

    panel.innerHTML = html;
    window.renderNotifPanel = renderNotifPanel;
  }

  /* ── Монітор стану роутера (авто-нотифікації) ── */
  function startNotifMonitor() {
    if (_notifTimer) return;
    var r = router();
    if (!r) return;

    _notifTimer = setInterval(function() {
      var currentRouter = router();
      if (!currentRouter) { stopNotifMonitor(); return; }

      /* Перевіряємо інтерфейси */
      restCall(currentRouter,'GET','/interface').then(function(ifaces) {
        if (!Array.isArray(ifaces)) return;

        ifaces.forEach(function(iface) {
          var name    = iface.name;
          var running = iface.running === 'true';
          var prev    = _prevState[name];

          if (prev !== undefined && prev !== running) {
            if (running) {
              showNotif('ok', '🌐 Interface UP', name + ' — з\'єднання відновлено', 6000);
            } else {
              showNotif('err', '🌐 Interface DOWN', name + ' — з\'єднання втрачено', 8000);
            }
          }
          _prevState[name] = running;
        });
      }).catch(function(){});

      /* Перевіряємо CPU */
      restCall(currentRouter,'GET','/system/resource').then(function(res) {
        var cpu = parseInt(res['cpu-load']||0);
        var ram = parseInt(res['free-memory']||0);
        var tot = parseInt(res['total-memory']||1);
        var ramUsed = Math.round((1 - ram/tot) * 100);

        if (cpu > 90 && !_prevState._cpuWarn) {
          showNotif('warn', '🖥️ Висока загрузка CPU', 'CPU: ' + cpu + '% — перевір процеси', 10000);
          _prevState._cpuWarn = true;
        }
        if (cpu < 70) _prevState._cpuWarn = false;

        if (ramUsed > 90 && !_prevState._ramWarn) {
          showNotif('warn', '💾 Мало пам\'яті', 'RAM використано: ' + ramUsed + '%', 10000);
          _prevState._ramWarn = true;
        }
        if (ramUsed < 80) _prevState._ramWarn = false;
      }).catch(function(){});

    }, 10000); /* перевіряємо кожні 10 секунд */

    console.log('[Notifications] Monitor started');
  }

  function stopNotifMonitor() {
    if (_notifTimer) { clearInterval(_notifTimer); _notifTimer = null; }
  }

  /* ── Секція налаштувань нотифікацій ── */
  window.rmSectionNotifications = function() {
    var c = cont(); if (!c) return;

    var html = '<div class="rm-section-title">🔔 Notifications</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +

      /* Налаштування */
      '<div class="rm-dash-card">' +
        '<h4>⚙️ Налаштування</h4>' +
        '<div style="display:flex;flex-direction:column;gap:12px;">' +
          toggleRow('notif-enabled',  'Сповіщення увімкнені', _notifEnabled) +
          toggleRow('notif-iface',    'Interface UP/DOWN',     true) +
          toggleRow('notif-cpu',      'Висока загрузка CPU (>90%)', true) +
          toggleRow('notif-ram',      'Мало пам\'яті RAM (>90%)',   true) +
          toggleRow('notif-neighbor', 'Нові сусіди (Neighbors)',    false) +
        '</div>' +
        '<button class="rm-btn rm-btn-primary" style="margin-top:14px;" onclick="window.__rmSaveNotifSettings()">💾 Зберегти</button>' +
      '</div>' +

      /* Тест і історія */
      '<div class="rm-dash-card">' +
        '<h4>🧪 Тест сповіщень</h4>' +
        '<div style="display:flex;flex-direction:column;gap:8px;">' +
          '<button class="rm-btn rm-btn-secondary" onclick="window.showNotif(\'ok\',\'✅ Тест OK\',\'Сповіщення працюють!\')">✅ Тест OK</button>' +
          '<button class="rm-btn rm-btn-secondary" onclick="window.showNotif(\'warn\',\'⚠️ Тест Warning\',\'Попередження!\')">⚠️ Тест Warning</button>' +
          '<button class="rm-btn rm-btn-secondary" onclick="window.showNotif(\'err\',\'❌ Тест Error\',\'Помилка!\')">❌ Тест Error</button>' +
          '<button class="rm-btn rm-btn-secondary" onclick="window.showNotif(\'info\',\'ℹ️ Тест Info\',\'Інформація!\')">ℹ️ Тест Info</button>' +
        '</div>' +
        '<h4 style="margin-top:16px;">📋 Остання активність</h4>' +
        '<div id="rm-notif-history-list" style="max-height:200px;overflow-y:auto;">' + renderNotifHistoryList() + '</div>' +
      '</div>' +
    '</div>';

    c.innerHTML = html;

    window.__rmSaveNotifSettings = function() {
      _notifEnabled = document.getElementById('notif-enabled').checked;
      showNotif('ok', '✅ Збережено', 'Налаштування сповіщень оновлено');
    };

    window.__rmRefreshSection = function() { window.rmSectionNotifications(); };
  };

  function toggleRow(id, label, checked) {
    return '<label style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;padding:6px 0;border-bottom:1px solid #1a2d3d;">' +
      '<span style="font-size:12px;color:#e6edf3;">' + esc(label) + '</span>' +
      '<label style="position:relative;display:inline-block;width:36px;height:20px;">' +
        '<input type="checkbox" id="' + id + '"' + (checked?' checked':'') + ' style="opacity:0;width:0;height:0;">' +
        '<span style="position:absolute;cursor:pointer;inset:0;background:' + (checked?'#2f7a5c':'#1a2d3d') + ';border-radius:10px;transition:.2s;">' +
          '<span style="position:absolute;width:14px;height:14px;background:#fff;border-radius:50%;top:3px;left:' + (checked?'18':'3') + 'px;transition:.2s;"></span>' +
        '</span>' +
      '</label>' +
    '</label>';
  }

  function renderNotifHistoryList() {
    if (!_notifHistory.length) return '<div style="color:#8ea3b0;font-size:12px;padding:10px 0;">Немає сповіщень</div>';
    var icons = { ok:'✅', warn:'⚠️', err:'❌', info:'ℹ️' };
    return _notifHistory.slice(0, 20).map(function(n) {
      return '<div style="padding:6px 0;border-bottom:1px solid #1a2d3d;display:flex;gap:6px;">' +
        '<span style="font-size:11px;">' + (icons[n.type]||'ℹ️') + '</span>' +
        '<div>' +
          '<div style="font-size:11px;color:#e6edf3;">' + esc(n.title) + '</div>' +
          '<div style="font-size:10px;color:#4a6070;">' + esc(n.time) + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  /* ══════════════════════════════════════════════════════════
     ІНІЦІАЛІЗАЦІЯ
     ══════════════════════════════════════════════════════════ */
  window.showNotif = showNotif;

  /* Запускаємо bell і монітор коли є активний роутер */
  function initNotifications() {
    createNotifBell();
    var r = router();
    if (r) {
      startNotifMonitor();
      showNotif('info', '🔔 Моніторинг активний', 'Сповіщення про зміни стану роутера увімкнено', 4000);
    }
  }

  /* Запускаємо через 2 секунди після завантаження */
  setTimeout(initNotifications, 2000);

  /* Перезапускаємо монітор при зміні активного роутера */
  document.addEventListener('click', function(e) {
    var menuItem = e.target.closest('[data-id]');
    if (!menuItem) return;
    setTimeout(function() {
      var r = router();
      if (r && !_notifTimer) startNotifMonitor();
    }, 500);
  });

  console.log('[CAPsMAN + Notifications] завантажено');

})();