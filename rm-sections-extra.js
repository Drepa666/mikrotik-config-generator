'use strict';

/* ============================================================
   RM Sections Extra — додаткові секції
   IPv6, SNMP, Certificates, Netwatch, Logging, VPN
   ============================================================ */

(function() {

  function S()  { return window.RMStore; }
  function esc(s) { return window.RMEsc ? window.RMEsc(s) : String(s||''); }
  function restCall(r, m, p, b) { return window.RMRestCall(r, m, p, b); }
  function sshCall(r, c) { return window.RMSshCall(r, c); }
  function router() { return S().getRouter(); }
  function cont()   { return document.getElementById('rm-content'); }

  function loading(title) {
    var c = cont();
    if (c) c.innerHTML =
      '<div style="display:flex;align-items:center;gap:12px;padding:20px;">' +
      '<div style="width:20px;height:20px;border:2px solid #2f7a5c;border-top-color:#5fd0a5;' +
      'border-radius:50%;animation:rm-spin 1s linear infinite;"></div>' +
      '<div style="color:#8ea3b0;">' + esc(title) + '</div></div>';
  }

  function tab(id, label, active) {
    return '<div class="rm-section-tab' + (active ? ' active' : '') + '" data-tab="' + id + '">' + label + '</div>';
  }

  function statItem(label, value, color) {
    return '<div class="rm-stat-item">' + esc(label) + ': <b style="' + (color ? 'color:' + color + ';' : '') + '">' + esc(String(value)) + '</b></div>';
  }

  function boolBadge(val) {
    var v = val === 'true' || val === true;
    return v ? '<span class="rm-badge">✓</span>' : '<span style="color:#4a6070;font-size:11px;">—</span>';
  }

  function sectionHeader(title, count, actions) {
    return '<div class="rm-section-title">' +
      title +
      (count !== undefined ? ' <span class="rm-badge" id="rm-count-badge">' + count + '</span>' : '') +
      '<div style="margin-left:auto;display:flex;gap:6px;align-items:center;">' +
        (actions || '') +
        '<button class="rm-btn rm-btn-secondary" style="font-size:11px;" onclick="window.__rmRefreshSection()">🔄</button>' +
      '</div>' +
    '</div>';
  }

  function openModal(title, fields, onSave, data) {
    var existing = document.getElementById('rm-crud-modal-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'rm-crud-modal-overlay';
    overlay.className = 'rm-modal-overlay';

    var html = '<div class="rm-modal"><h3>' + title + '</h3>';

    fields.forEach(function(f) {
      var val = (data && data[f.key] !== undefined) ? String(data[f.key]) : (f.value !== undefined ? String(f.value) : (f.default || ''));
      html += '<div class="rm-modal-field"><label>' + esc(f.label) + (f.required ? ' <span style="color:#e05252">*</span>' : '') + '</label>';

      if (f.type === 'select') {
        html += '<select id="rm-cf-' + esc(f.key) + '">';
        (f.options || []).forEach(function(opt) {
          var v = typeof opt === 'object' ? opt.value : opt;
          var l = typeof opt === 'object' ? opt.label : opt;
          var def = f.default || val;
          html += '<option value="' + esc(v) + '"' + (v === def ? ' selected' : '') + '>' + esc(l) + '</option>';
        });
        html += '</select>';
      } else if (f.type === 'checkbox') {
        var checked = val === 'true' || val === 'yes';
        html += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;">' +
          '<input type="checkbox" id="rm-cf-' + esc(f.key) + '"' + (checked ? ' checked' : '') + ' style="width:auto;">' +
          '<span style="font-size:12px;color:#e6edf3;">Увімкнено</span></label>';
      } else if (f.type === 'textarea') {
        html += '<textarea id="rm-cf-' + esc(f.key) + '" rows="3" style="width:100%;box-sizing:border-box;background:#0d1821;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:7px 10px;font-size:13px;">' + esc(val) + '</textarea>';
      } else {
        html += '<input type="' + (f.type || 'text') + '" id="rm-cf-' + esc(f.key) + '" value="' + esc(val) + '"' +
          (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') +
          ' style="width:100%;box-sizing:border-box;">';
      }
      if (f.hint) html += '<div style="font-size:11px;color:#4a6070;margin-top:3px;">' + esc(f.hint) + '</div>';
      html += '</div>';
    });

    html += '<div id="rm-cf-status" style="display:none;margin-top:10px;padding:8px 12px;border-radius:6px;font-size:12px;"></div>';
    html += '<div style="display:flex;gap:8px;margin-top:18px;justify-content:flex-end;">' +
      '<button class="rm-btn rm-btn-secondary" id="rm-cf-cancel">Скасувати</button>' +
      '<button class="rm-btn rm-btn-primary" id="rm-cf-save">💾 Зберегти</button>' +
    '</div></div>';

    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    document.getElementById('rm-cf-cancel').addEventListener('click', function() { overlay.remove(); });
    document.getElementById('rm-cf-save').addEventListener('click', function() {
      var formData = {};
      fields.forEach(function(f) {
        var el = document.getElementById('rm-cf-' + f.key);
        if (!el) return;
        formData[f.key] = f.type === 'checkbox' ? (el.checked ? 'yes' : 'no') : el.value.trim();
      });

      var missing = fields.filter(function(f) { return f.required && !formData[f.key]; }).map(function(f) { return f.label; });
      if (missing.length) {
        var st = document.getElementById('rm-cf-status');
        if (st) { st.style.display='block'; st.style.background='#3a1a1a'; st.style.color='#e05252'; st.textContent='⚠ Заповни: ' + missing.join(', '); }
        return;
      }

      var saveBtn = document.getElementById('rm-cf-save');
      if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = '⏳...'; }

      onSave(formData, function(ok, msg) {
        var st = document.getElementById('rm-cf-status');
        if (ok) {
          if (st) { st.style.display='block'; st.style.background='#0d2a1a'; st.style.color='#5fd0a5'; st.textContent='✅ ' + (msg||'Збережено!'); }
          setTimeout(function() { overlay.remove(); }, 1000);
        } else {
          if (st) { st.style.display='block'; st.style.background='#3a1a1a'; st.style.color='#e05252'; st.textContent='❌ ' + (msg||'Помилка'); }
          if (saveBtn) { saveBtn.disabled=false; saveBtn.textContent='💾 Зберегти'; }
        }
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     IPv6
     ══════════════════════════════════════════════════════════ */
  window.rmSectionIPv6 = function() {
    var r = router(); if (!r) return;
    loading('Завантаження IPv6...');

    Promise.all([
      S().get('ipv6Addresses'),
      S().get('ipv6Routes'),
    ]).then(function(results) {
      var addresses = results[0];
      var routes    = results[1];
      var c = cont(); if (!c) return;

      var html = sectionHeader('🌐 IPv6');

      html += '<div class="rm-section-tabs">' +
        tab('addresses', 'Addresses (' + addresses.length + ')', true) +
        tab('routes',    'Routes (' + routes.length + ')') +
        tab('settings',  'Settings') +
      '</div>';

      html += '<div id="rm-ipv6-content">' + renderIPv6Addresses(addresses) + '</div>';

      c.innerHTML = html;

      c.querySelectorAll('.rm-section-tab').forEach(function(t) {
        t.addEventListener('click', function() {
          c.querySelectorAll('.rm-section-tab').forEach(function(x) { x.classList.remove('active'); });
          t.classList.add('active');
          var wrap = document.getElementById('rm-ipv6-content');
          if (!wrap) return;
          var tt = t.dataset.tab;
          if (tt === 'addresses') wrap.innerHTML = renderIPv6Addresses(addresses);
          if (tt === 'routes')    wrap.innerHTML = renderIPv6Routes(routes);
          if (tt === 'settings')  wrap.innerHTML = renderIPv6Settings();
        });
      });

      window.__rmRefreshSection = function() {
        S().invalidate('ipv6Addresses');
        S().invalidate('ipv6Routes');
        window.rmSectionIPv6();
      };
    });
  };

  function renderIPv6Addresses(list) {
    var r = router();
    var html = '<div style="display:flex;justify-content:flex-end;margin-bottom:10px;">' +
      '<button class="rm-btn rm-btn-primary" style="font-size:11px;" onclick="window.__rmAddIPv6Addr()">＋ Додати</button>' +
    '</div>';

    if (!list.length) return html + '<div style="color:#8ea3b0;padding:20px;text-align:center;">IPv6 адрес немає</div>';

    html += '<table class="rm-table rm-table-compact"><tr><th>Address</th><th>Interface</th><th>Advertise</th><th>EUI64</th><th>Dynamic</th><th style="text-align:right;">Дії</th></tr>';
    list.forEach(function(a) {
      var id = a['.id'] || '';
      html += '<tr>' +
        '<td style="font-family:monospace;font-size:11px;"><b>' + esc(a.address||'') + '</b></td>' +
        '<td>' + esc(a.interface||'') + '</td>' +
        '<td>' + boolBadge(a.advertise) + '</td>' +
        '<td>' + boolBadge(a['eui-64']) + '</td>' +
        '<td>' + boolBadge(a.dynamic) + '</td>' +
        '<td style="text-align:right;">' +
          (a.dynamic !== 'true' ?
            '<button class="rm-act-btn rm-act-edit" onclick="window.__rmEditIPv6Addr(\'' + esc(id) + '\')">✏️</button>' +
            '<button class="rm-act-btn rm-act-del" onclick="window.__rmDelIPv6Addr(\'' + esc(id) + '\',\'' + esc(a.address) + '\')">🗑</button>' : '') +
        '</td></tr>';
    });
    html += '</table>';

    window.__rmAddIPv6Addr = function() {
      openModal('➕ IPv6 Address', [
        { key:'address',   label:'IPv6/prefix', required:true, placeholder:'2001:db8::1/64' },
        { key:'interface', label:'Interface',   required:true },
        { key:'advertise', label:'Advertise',   type:'checkbox' },
        { key:'eui-64',    label:'EUI-64',      type:'checkbox' },
        { key:'comment',   label:'Коментар' },
      ], function(data, done) {
        restCall(r, 'PUT', '/ipv6/address', data).then(function(res) {
          if (res && res.error) { done(false, res.error); return; }
          S().invalidate('ipv6Addresses'); done(true);
          setTimeout(window.rmSectionIPv6, 500);
        }).catch(function(e) { done(false, String(e)); });
      });
    };

    window.__rmEditIPv6Addr = function(id) {
      S().get('ipv6Addresses').then(function(list) {
        var a = list.find(function(x) { return x['.id'] === id; }) || {};
        openModal('✏️ IPv6 Address', [
          { key:'address',   label:'IPv6/prefix', value: a.address || '' },
          { key:'interface', label:'Interface',   value: a.interface || '' },
          { key:'advertise', label:'Advertise',   type:'checkbox', value: a.advertise },
          { key:'comment',   label:'Коментар',    value: a.comment || '' },
          { key:'disabled',  label:'Вимкнено',    type:'checkbox', value: a.disabled },
        ], function(data, done) {
          restCall(r, 'PATCH', '/ipv6/address/' + id, data).then(function(res) {
            if (res && res.error) { done(false, res.error); return; }
            S().invalidate('ipv6Addresses'); done(true);
            setTimeout(window.rmSectionIPv6, 500);
          }).catch(function(e) { done(false, String(e)); });
        });
      });
    };

    window.__rmDelIPv6Addr = function(id, addr) {
      if (!confirm('Видалити IPv6 "' + addr + '"?')) return;
      restCall(r, 'DELETE', '/ipv6/address/' + id, null).then(function() {
        S().invalidate('ipv6Addresses');
        window.rmSectionIPv6();
      });
    };

    return html;
  }

  function renderIPv6Routes(routes) {
    if (!routes.length) return '<div style="color:#8ea3b0;padding:20px;text-align:center;">IPv6 маршрутів немає</div>';
    var html = '<table class="rm-table rm-table-compact"><tr><th>Dst</th><th>Gateway</th><th>Distance</th><th>Active</th><th>Dynamic</th></tr>';
    routes.forEach(function(r) {
      html += '<tr>' +
        '<td style="font-family:monospace;font-size:11px;">' + esc(r['dst-address']||'') + '</td>' +
        '<td style="font-size:11px;">' + esc(r.gateway||'') + '</td>' +
        '<td>' + esc(r.distance||'') + '</td>' +
        '<td>' + boolBadge(r.active) + '</td>' +
        '<td>' + boolBadge(r.dynamic) + '</td>' +
      '</tr>';
    });
    html += '</table>';
    return html;
  }

  function renderIPv6Settings() {
    var r = router();
    var html = '<div class="rm-dash-card">' +
      '<h4>IPv6 Settings</h4>' +
      '<div style="display:flex;flex-direction:column;gap:10px;">' +
        '<button class="rm-btn rm-btn-secondary" onclick="window.__rmIPv6Enable(true)">✅ Увімкнути IPv6</button>' +
        '<button class="rm-btn rm-btn-danger" onclick="window.__rmIPv6Enable(false)">❌ Вимкнути IPv6</button>' +
      '</div>' +
    '</div>';

    window.__rmIPv6Enable = function(enable) {
      var cmd = enable ? '/ipv6 settings set disable-ipv6=no' : '/ipv6 settings set disable-ipv6=yes';
      sshCall(r, cmd).then(function(res) {
        alert(res.ok ? (enable ? '✅ IPv6 увімкнено' : '✅ IPv6 вимкнено') : '❌ ' + res.error);
      });
    };

    return html;
  }

  /* ══════════════════════════════════════════════════════════
     NETWATCH
     ══════════════════════════════════════════════════════════ */
  window.rmSectionNetwatch = function() {
    var r = router(); if (!r) return;
    loading('Завантаження Netwatch...');

    S().get('netwatch').then(function(entries) {
      var c = cont(); if (!c) return;

      var up   = entries.filter(function(e) { return e.status === 'up'; }).length;
      var down = entries.filter(function(e) { return e.status === 'down'; }).length;

      var html = sectionHeader('👁️ Netwatch', entries.length,
        '<button class="rm-btn rm-btn-primary" style="font-size:11px;" onclick="window.__rmAddNetwatch()">＋ Додати</button>'
      );

      html += '<div class="rm-stats-bar">' +
        statItem('Всього', entries.length) +
        statItem('UP', up, '#5fd0a5') +
        statItem('DOWN', down, '#e05252') +
      '</div>';

      if (!entries.length) {
        html += '<div style="color:#8ea3b0;padding:20px;text-align:center;">Записів немає</div>';
      } else {
        html += '<table class="rm-table rm-table-compact">' +
          '<tr><th>Host</th><th>Port</th><th>Type</th><th>Interval</th><th>Status</th><th>Since</th><th>Comment</th><th style="text-align:right;">Дії</th></tr>';

        entries.forEach(function(e) {
          var id = e['.id'] || '';
          var up = e.status === 'up';
          var disabled = e.disabled === 'true';

          html += '<tr style="' + (disabled ? 'opacity:.5;' : '') + '">' +
            '<td><b>' + esc(e.host||'') + '</b></td>' +
            '<td>' + esc(e.port||'—') + '</td>' +
            '<td style="font-size:11px;">' + esc(e.type||'icmp') + '</td>' +
            '<td>' + esc(e.interval||'') + '</td>' +
            '<td>' +
              '<span class="rm-badge' + (disabled ? '' : up ? '' : ' rm-badge-err') + '">' +
              (disabled ? '■ Disabled' : up ? '▲ UP' : '▼ DOWN') +
              '</span>' +
            '</td>' +
            '<td style="font-size:11px;color:#8ea3b0;">' + esc(e['since']||'') + '</td>' +
            '<td style="color:#8ea3b0;font-size:11px;">' + esc(e.comment||'') + '</td>' +
            '<td style="text-align:right;white-space:nowrap;">' +
              '<button class="rm-act-btn ' + (disabled ? 'rm-act-enable' : 'rm-act-disable') +
                '" onclick="window.__rmToggleNetwatch(\'' + esc(id) + '\',' + disabled + ')">' +
                (disabled ? '▶' : '‖') + '</button>' +
              '<button class="rm-act-btn rm-act-edit" onclick="window.__rmEditNetwatch(\'' + esc(id) + '\')">✏️</button>' +
              '<button class="rm-act-btn rm-act-del" onclick="window.__rmDelNetwatch(\'' + esc(id) + '\',\'' + esc(e.host) + '\')">🗑</button>' +
            '</td></tr>';
        });

        html += '</table>';
      }

      c.innerHTML = html;

      window.__rmRefreshSection = function() { S().invalidate('netwatch'); window.rmSectionNetwatch(); };

      window.__rmToggleNetwatch = function(id, disabled) {
        restCall(r, 'PATCH', '/tool/netwatch/' + id, { disabled: disabled ? 'no' : 'yes' }).then(function() {
          S().invalidate('netwatch');
          window.rmSectionNetwatch();
        });
      };

      window.__rmAddNetwatch = function() {
        openModal('➕ Netwatch', [
          { key:'host',        label:'Host/IP',   required:true, placeholder:'8.8.8.8 або google.com' },
          { key:'port',        label:'Port',      placeholder:'80 або порожньо для ICMP' },
          { key:'type',        label:'Type',      type:'select', options:['icmp','tcp-conn','http-get'] },
          { key:'interval',    label:'Interval',  default:'30s' },
          { key:'timeout',     label:'Timeout',   default:'3s' },
          { key:'up-script',   label:'Up Script', type:'textarea', placeholder:':log info "host up"' },
          { key:'down-script', label:'Down Script', type:'textarea', placeholder:':log warning "host down"' },
          { key:'comment',     label:'Коментар' },
        ], function(data, done) {
          restCall(r, 'PUT', '/tool/netwatch', data).then(function(res) {
            if (res && res.error) { done(false, res.error); return; }
            S().invalidate('netwatch'); done(true);
            setTimeout(window.rmSectionNetwatch, 500);
          }).catch(function(e) { done(false, String(e)); });
        });
      };

      window.__rmEditNetwatch = function(id) {
        S().get('netwatch').then(function(entries) {
          var e = entries.find(function(x) { return x['.id'] === id; }) || {};
          openModal('✏️ Netwatch — ' + e.host, [
            { key:'host',        label:'Host/IP',     value: e.host || '' },
            { key:'port',        label:'Port',        value: e.port || '' },
            { key:'type',        label:'Type',        type:'select', options:['icmp','tcp-conn','http-get'], default: e.type },
            { key:'interval',    label:'Interval',    value: e.interval || '30s' },
            { key:'timeout',     label:'Timeout',     value: e.timeout || '3s' },
            { key:'up-script',   label:'Up Script',   type:'textarea', value: e['up-script'] || '' },
            { key:'down-script', label:'Down Script', type:'textarea', value: e['down-script'] || '' },
            { key:'comment',     label:'Коментар',    value: e.comment || '' },
            { key:'disabled',    label:'Вимкнено',    type:'checkbox', value: e.disabled },
          ], function(data, done) {
            restCall(r, 'PATCH', '/tool/netwatch/' + id, data).then(function(res) {
              if (res && res.error) { done(false, res.error); return; }
              S().invalidate('netwatch'); done(true);
              setTimeout(window.rmSectionNetwatch, 500);
            }).catch(function(e) { done(false, String(e)); });
          });
        });
      };

      window.__rmDelNetwatch = function(id, host) {
        if (!confirm('Видалити Netwatch "' + host + '"?')) return;
        restCall(r, 'DELETE', '/tool/netwatch/' + id, null).then(function() {
          S().invalidate('netwatch');
          window.rmSectionNetwatch();
        });
      };
    });
  };

  /* ══════════════════════════════════════════════════════════
     SNMP
     ══════════════════════════════════════════════════════════ */
  window.rmSectionSNMP = function() {
    var r = router(); if (!r) return;
    loading('Завантаження SNMP...');

    Promise.all([
      S().get('snmp'),
    ]).then(function(results) {
      var snmp = results[0];
      var c = cont(); if (!c) return;

      /* SNMP повертає об'єкт, не масив */
      var cfg = Array.isArray(snmp) ? (snmp[0] || {}) : (snmp || {});

      var html = sectionHeader('📊 SNMP');

      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">';

      /* SNMP Settings */
      html += '<div class="rm-dash-card">' +
        '<h4>SNMP Settings</h4>' +
        '<div style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;">' +
          kv('Enabled',   cfg.enabled || '—') +
          kv('Contact',   cfg.contact  || '—') +
          kv('Location',  cfg.location || '—') +
          kv('Engine ID', cfg['engine-id'] || '—') +
        '</div>' +
        '<button class="rm-btn rm-btn-primary" style="margin-top:12px;" onclick="window.__rmEditSNMP()">✏️ Налаштувати</button>' +
      '</div>';

      /* SNMP Communities */
      html += '<div class="rm-dash-card">' +
        '<h4>Communities</h4>' +
        '<button class="rm-btn rm-btn-primary" style="font-size:11px;margin-bottom:10px;" onclick="window.__rmAddSNMPCommunity()">＋ Додати</button>' +
        '<div id="rm-snmp-communities">⏳ Завантаження...</div>' +
      '</div>';

      html += '</div>';
      c.innerHTML = html;

      /* Завантажуємо communities */
      restCall(r, 'GET', '/snmp/community').then(function(comms) {
        var el = document.getElementById('rm-snmp-communities');
        if (!el || !Array.isArray(comms)) return;
        if (!comms.length) { el.innerHTML = '<div style="color:#8ea3b0;font-size:12px;">Немає communities</div>'; return; }
        var t = '<table class="rm-table rm-table-compact"><tr><th>Назва</th><th>Security</th><th>Read Access</th><th style="text-align:right;">Дії</th></tr>';
        comms.forEach(function(comm) {
          var id = comm['.id'] || '';
          t += '<tr>' +
            '<td><b>' + esc(comm.name||'') + '</b></td>' +
            '<td style="font-size:11px;">' + esc(comm['security']||'none') + '</td>' +
            '<td>' + boolBadge(comm['read-access']) + '</td>' +
            '<td style="text-align:right;">' +
              '<button class="rm-act-btn rm-act-del" onclick="window.__rmDelSNMPCom(\'' + esc(id) + '\',\'' + esc(comm.name) + '\')">🗑</button>' +
            '</td></tr>';
        });
        t += '</table>';
        el.innerHTML = t;

        window.__rmDelSNMPCom = function(id, name) {
          if (!confirm('Видалити community "' + name + '"?')) return;
          restCall(r, 'DELETE', '/snmp/community/' + id, null).then(function() {
            window.rmSectionSNMP();
          });
        };
      });

      window.__rmRefreshSection = function() { S().invalidate('snmp'); window.rmSectionSNMP(); };

      window.__rmEditSNMP = function() {
        openModal('✏️ SNMP Settings', [
          { key:'enabled',  label:'Увімкнено', type:'checkbox', value: cfg.enabled },
          { key:'contact',  label:'Contact',   value: cfg.contact  || '' },
          { key:'location', label:'Location',  value: cfg.location || '' },
        ], function(data, done) {
          restCall(r, 'POST', '/snmp/set', data).then(function(res) {
            if (res && res.error) { done(false, res.error); return; }
            S().invalidate('snmp'); done(true);
            setTimeout(window.rmSectionSNMP, 500);
          }).catch(function(e) { done(false, String(e)); });
        });
      };

      window.__rmAddSNMPCommunity = function() {
        openModal('➕ SNMP Community', [
          { key:'name',         label:'Назва',    required:true, placeholder:'public' },
          { key:'addresses',    label:'Allowed IPs', placeholder:'0.0.0.0/0' },
          { key:'read-access',  label:'Read Access',  type:'checkbox' },
          { key:'write-access', label:'Write Access', type:'checkbox' },
        ], function(data, done) {
          restCall(r, 'PUT', '/snmp/community', data).then(function(res) {
            if (res && res.error) { done(false, res.error); return; }
            done(true);
            setTimeout(window.rmSectionSNMP, 500);
          }).catch(function(e) { done(false, String(e)); });
        });
      };
    });
  };

  /* ══════════════════════════════════════════════════════════
     LOGGING
     ══════════════════════════════════════════════════════════ */
  window.rmSectionLogging = function() {
    var r = router(); if (!r) return;
    loading('Завантаження Logging...');

    Promise.all([
      S().get('logging'),
      S().get('logActions'),
    ]).then(function(results) {
      var rules   = results[0];
      var actions = results[1];
      var c = cont(); if (!c) return;

      var html = sectionHeader('📋 Logging', rules.length,
        '<button class="rm-btn rm-btn-primary" style="font-size:11px;" onclick="window.__rmAddLogRule()">＋ Правило</button>'
      );

      html += '<div class="rm-section-tabs">' +
        tab('rules',   'Rules (' + rules.length + ')', true) +
        tab('actions', 'Actions (' + actions.length + ')') +
      '</div>';

      html += '<div id="rm-log-rules-content">' + renderLogRules(rules, actions) + '</div>';

      c.innerHTML = html;

      c.querySelectorAll('.rm-section-tab').forEach(function(t) {
        t.addEventListener('click', function() {
          c.querySelectorAll('.rm-section-tab').forEach(function(x) { x.classList.remove('active'); });
          t.classList.add('active');
          var wrap = document.getElementById('rm-log-rules-content');
          if (!wrap) return;
          if (t.dataset.tab === 'rules')   wrap.innerHTML = renderLogRules(rules, actions);
          if (t.dataset.tab === 'actions') wrap.innerHTML = renderLogActions(actions);
        });
      });

      window.__rmRefreshSection = function() {
        S().invalidate('logging');
        S().invalidate('logActions');
        window.rmSectionLogging();
      };

      window.__rmAddLogRule = function() {
        openModal('➕ Log Rule', [
          { key:'topics', label:'Topics', required:true, placeholder:'firewall,info,error...' },
          { key:'action', label:'Action', required:true, type:'select',
            options: actions.map(function(a) { return a.name; }) },
          { key:'prefix', label:'Prefix', placeholder:'[FW]' },
        ], function(data, done) {
          restCall(r, 'PUT', '/system/logging', data).then(function(res) {
            if (res && res.error) { done(false, res.error); return; }
            S().invalidate('logging'); done(true);
            setTimeout(window.rmSectionLogging, 500);
          }).catch(function(e) { done(false, String(e)); });
        });
      };
    });
  };

  function renderLogRules(rules, actions) {
    var r = router();
    if (!rules.length) return '<div style="color:#8ea3b0;padding:20px;text-align:center;">Правил немає</div>';
    var html = '<table class="rm-table rm-table-compact"><tr><th>Topics</th><th>Action</th><th>Prefix</th><th>Disabled</th><th style="text-align:right;">Дії</th></tr>';
    rules.forEach(function(rule) {
      var id = rule['.id'] || '';
      var disabled = rule.disabled === 'true';
      html += '<tr style="' + (disabled ? 'opacity:.5;' : '') + '">' +
        '<td><b>' + esc(rule.topics||'') + '</b></td>' +
        '<td><span class="rm-badge">' + esc(rule.action||'') + '</span></td>' +
        '<td style="font-size:11px;">' + esc(rule.prefix||'—') + '</td>' +
        '<td>' + boolBadge(rule.disabled) + '</td>' +
        '<td style="text-align:right;">' +
          '<button class="rm-act-btn ' + (disabled ? 'rm-act-enable' : 'rm-act-disable') +
            '" onclick="window.__rmToggleLogRule(\'' + esc(id) + '\',' + disabled + ')">' +
            (disabled ? '▶' : '‖') + '</button>' +
          '<button class="rm-act-btn rm-act-del" onclick="window.__rmDelLogRule(\'' + esc(id) + '\')">🗑</button>' +
        '</td></tr>';
    });
    html += '</table>';

    window.__rmToggleLogRule = function(id, disabled) {
      restCall(r, 'PATCH', '/system/logging/' + id, { disabled: disabled ? 'no' : 'yes' }).then(function() {
        S().invalidate('logging');
        window.rmSectionLogging();
      });
    };

    window.__rmDelLogRule = function(id) {
      if (!confirm('Видалити правило?')) return;
      restCall(r, 'DELETE', '/system/logging/' + id, null).then(function() {
        S().invalidate('logging');
        window.rmSectionLogging();
      });
    };

    return html;
  }

  function renderLogActions(actions) {
    var r = router();
    if (!actions.length) return '<div style="color:#8ea3b0;padding:20px;text-align:center;">Немає</div>';
    var html = '<table class="rm-table rm-table-compact"><tr><th>Назва</th><th>Type</th><th>Remote</th><th>Bsd-syslog</th><th style="text-align:right;">Дії</th></tr>';
    actions.forEach(function(a) {
      var id = a['.id'] || '';
      html += '<tr>' +
        '<td><b>' + esc(a.name||'') + '</b></td>' +
        '<td>' + esc(a.type||'') + '</td>' +
        '<td style="font-size:11px;">' + esc(a.remote||'') + '</td>' +
        '<td>' + boolBadge(a['bsd-syslog']) + '</td>' +
        '<td style="text-align:right;">' +
          '<button class="rm-act-btn rm-act-edit" onclick="window.__rmEditLogAction(\'' + esc(id) + '\')">✏️</button>' +
        '</td></tr>';
    });
    html += '</table>';

    window.__rmEditLogAction = function(id) {
      S().get('logActions').then(function(actions) {
        var a = actions.find(function(x) { return x['.id'] === id; }) || {};
        openModal('✏️ Log Action — ' + a.name, [
          { key:'remote',        label:'Remote IP',   value: a.remote || '' },
          { key:'remote-port',   label:'Remote Port', value: a['remote-port'] || '514' },
          { key:'bsd-syslog',    label:'BSD Syslog',  type:'checkbox', value: a['bsd-syslog'] },
          { key:'syslog-facility',label:'Syslog Facility', value: a['syslog-facility'] || 'daemon' },
        ], function(data, done) {
          restCall(r, 'PATCH', '/system/logging/action/' + id, data).then(function(res) {
            if (res && res.error) { done(false, res.error); return; }
            S().invalidate('logActions'); done(true);
            setTimeout(window.rmSectionLogging, 500);
          }).catch(function(e) { done(false, String(e)); });
        });
      });
    };

    return html;
  }

  /* ══════════════════════════════════════════════════════════
     CERTIFICATES
     ══════════════════════════════════════════════════════════ */
  window.rmSectionCertificates = function() {
    var r = router(); if (!r) return;
    loading('Завантаження Certificates...');

    S().get('certificates').then(function(certs) {
      var c = cont(); if (!c) return;

      var valid   = certs.filter(function(x) { return x.status && x.status.includes('KALT'); }).length;
      var expired = certs.filter(function(x) { return x.status && x.status.includes('REVO'); }).length;

      var html = sectionHeader('🔐 Certificates', certs.length,
        '<button class="rm-btn rm-btn-primary" style="font-size:11px;" onclick="window.__rmGenCert()">＋ Генерувати CA</button>'
      );

      html += '<div class="rm-stats-bar">' +
        statItem('Всього', certs.length) +
        statItem('Active', certs.length - expired, '#5fd0a5') +
      '</div>';

      if (!certs.length) {
        html += '<div style="color:#8ea3b0;padding:20px;text-align:center;">Сертифікатів немає</div>';
      } else {
        html += '<table class="rm-table rm-table-compact">' +
          '<tr><th>Назва</th><th>Common Name</th><th>Expires</th><th>Issuer</th><th>Key Size</th><th>Status</th><th style="text-align:right;">Дії</th></tr>';

        certs.forEach(function(cert) {
          var id = cert['.id'] || '';
          var expired = cert['invalid-after'] && new Date(cert['invalid-after']) < new Date();
          html += '<tr>' +
            '<td><b>' + esc(cert.name||'') + '</b></td>' +
            '<td style="font-size:11px;">' + esc(cert['common-name']||'') + '</td>' +
            '<td style="font-size:11px;' + (expired ? 'color:#e05252;' : '') + '">' + esc(cert['invalid-after']||'—') + '</td>' +
            '<td style="font-size:11px;">' + esc(cert.issuer||'') + '</td>' +
            '<td>' + esc(cert['key-size']||'') + '</td>' +
            '<td>' +
              '<span class="rm-badge' + (expired ? ' rm-badge-err' : '') + '">' +
              esc(cert.status||'valid') + '</span>' +
            '</td>' +
            '<td style="text-align:right;white-space:nowrap;">' +
              '<button class="rm-act-btn rm-act-edit" onclick="window.__rmExportCert(\'' + esc(cert.name) + '\')">📤 Export</button>' +
              '<button class="rm-act-btn rm-act-del" onclick="window.__rmDelCert(\'' + esc(id) + '\',\'' + esc(cert.name) + '\')">🗑</button>' +
            '</td></tr>';
        });

        html += '</table>';
      }

      c.innerHTML = html;

      window.__rmRefreshSection = function() { S().invalidate('certificates'); window.rmSectionCertificates(); };

      window.__rmGenCert = function() {
        openModal('➕ Генерувати CA Сертифікат', [
          { key:'name',        label:'Назва',       required:true, placeholder:'my-ca' },
          { key:'common-name', label:'Common Name', required:true, placeholder:'My CA' },
          { key:'key-size',    label:'Key Size',    type:'select', options:['1024','2048','4096'], default:'2048' },
          { key:'days-valid',  label:'Термін (днів)', default:'3650' },
          { key:'key-usage',   label:'Key Usage',   placeholder:'key-cert-sign,crl-sign' },
        ], function(data, done) {
          sshCall(r,
            '/certificate add name=' + data.name +
            ' common-name="' + data['common-name'] + '"' +
            ' key-size=' + (data['key-size'] || '2048') +
            ' days-valid=' + (data['days-valid'] || '3650') +
            (data['key-usage'] ? ' key-usage=' + data['key-usage'] : '')
          ).then(function(res) {
            if (!res.ok) { done(false, res.error); return; }
            /* Підписуємо CA */
            return sshCall(r, '/certificate sign ' + data.name + ' ca-crl-host=127.0.0.1');
          }).then(function(res) {
            if (!res || !res.ok) { done(false, (res && res.error) || 'Помилка підписання'); return; }
            S().invalidate('certificates'); done(true, 'CA сертифікат створено!');
            setTimeout(window.rmSectionCertificates, 1000);
          }).catch(function(e) { done(false, String(e)); });
        });
      };

      window.__rmExportCert = function(name) {
        sshCall(r, '/certificate export-certificate ' + name + ' export-passphrase=""').then(function(res) {
          if (res.ok) {
            alert('✅ Сертифікат експортовано в файл cert_export_' + name + '.crt на роутері');
          } else {
            alert('❌ ' + res.error);
          }
        });
      };

      window.__rmDelCert = function(id, name) {
        if (!confirm('Видалити сертифікат "' + name + '"?\n\nЦе може зламати VPN та інші сервіси!')) return;
        restCall(r, 'DELETE', '/certificate/' + id, null).then(function() {
          S().invalidate('certificates');
          window.rmSectionCertificates();
        });
      };
    });
  };

  /* ══════════════════════════════════════════════════════════
     WIREGUARD (окрема секція)
     ══════════════════════════════════════════════════════════ */
  window.rmSectionWireGuard = function() {
    var r = router(); if (!r) return;
    loading('Завантаження WireGuard...');

    Promise.all([
      S().get('wireguard'),
      S().get('wireguardPeers'),
    ]).then(function(results) {
      var interfaces = results[0];
      var peers      = results[1];
      var c = cont(); if (!c) return;

      var html = sectionHeader('🔐 WireGuard');

      html += '<div class="rm-section-tabs">' +
        tab('interfaces', 'Interfaces (' + interfaces.length + ')', true) +
        tab('peers',      'Peers (' + peers.length + ')') +
      '</div>';

      html += '<div id="rm-wg-content">' + renderWGInterfaces(interfaces) + '</div>';

      c.innerHTML = html;

      c.querySelectorAll('.rm-section-tab').forEach(function(t) {
        t.addEventListener('click', function() {
          c.querySelectorAll('.rm-section-tab').forEach(function(x) { x.classList.remove('active'); });
          t.classList.add('active');
          var wrap = document.getElementById('rm-wg-content');
          if (!wrap) return;
          if (t.dataset.tab === 'interfaces') wrap.innerHTML = renderWGInterfaces(interfaces);
          if (t.dataset.tab === 'peers')      wrap.innerHTML = renderWGPeers(peers);
        });
      });

      window.__rmRefreshSection = function() {
        S().invalidate('wireguard');
        S().invalidate('wireguardPeers');
        window.rmSectionWireGuard();
      };
    });
  };

  function renderWGInterfaces(ifaces) {
    var r = router();
    var html = '<div style="display:flex;justify-content:flex-end;margin-bottom:10px;">' +
      '<button class="rm-btn rm-btn-primary" style="font-size:11px;" onclick="window.__rmAddWGIface()">＋ Додати</button>' +
    '</div>';

    if (!ifaces.length) return html + '<div style="color:#8ea3b0;padding:20px;text-align:center;">WireGuard інтерфейсів немає</div>';

    html += '<table class="rm-table rm-table-compact"><tr><th>Назва</th><th>Listen Port</th><th>Public Key</th><th>MTU</th><th>Running</th><th style="text-align:right;">Дії</th></tr>';
    ifaces.forEach(function(iface) {
      var id = iface['.id'] || '';
      html += '<tr>' +
        '<td><b>' + esc(iface.name||'') + '</b></td>' +
        '<td>' + esc(iface['listen-port']||'') + '</td>' +
        '<td style="font-family:monospace;font-size:10px;max-width:150px;overflow:hidden;text-overflow:ellipsis;" title="' + esc(iface['public-key']||'') + '">' + esc((iface['public-key']||'').slice(0,20)) + '...</td>' +
        '<td>' + esc(iface.mtu||'1420') + '</td>' +
        '<td>' + boolBadge(iface.running) + '</td>' +
        '<td style="text-align:right;">' +
          '<button class="rm-act-btn rm-act-edit" onclick="window.__rmCopyWGPubKey(\'' + esc(iface['public-key']) + '\')">📋 Key</button>' +
          '<button class="rm-act-btn rm-act-del" onclick="window.__rmDelWGIface(\'' + esc(id) + '\',\'' + esc(iface.name) + '\')">🗑</button>' +
        '</td></tr>';
    });
    html += '</table>';

    window.__rmAddWGIface = function() {
      openModal('➕ WireGuard Interface', [
        { key:'name',        label:'Назва',       required:true, placeholder:'wg1' },
        { key:'listen-port', label:'Listen Port', default:'51820' },
        { key:'mtu',         label:'MTU',         default:'1420' },
        { key:'comment',     label:'Коментар' },
      ], function(data, done) {
        restCall(r, 'PUT', '/interface/wireguard', data).then(function(res) {
          if (res && res.error) { done(false, res.error); return; }
          S().invalidate('wireguard'); done(true);
          setTimeout(window.rmSectionWireGuard, 500);
        }).catch(function(e) { done(false, String(e)); });
      });
    };

    window.__rmCopyWGPubKey = function(key) {
      navigator.clipboard.writeText(key).then(function() {
        alert('✅ Public Key скопійовано: ' + key);
      }).catch(function() {
        prompt('Public Key:', key);
      });
    };

    window.__rmDelWGIface = function(id, name) {
      if (!confirm('Видалити WireGuard "' + name + '"?')) return;
      restCall(r, 'DELETE', '/interface/wireguard/' + id, null).then(function() {
        S().invalidate('wireguard');
        window.rmSectionWireGuard();
      });
    };

    return html;
  }

  function renderWGPeers(peers) {
    var r = router();
    var html = '<div style="display:flex;justify-content:flex-end;margin-bottom:10px;">' +
      '<button class="rm-btn rm-btn-primary" style="font-size:11px;" onclick="window.__rmAddWGPeer()">＋ Додати Peer</button>' +
    '</div>';

    if (!peers.length) return html + '<div style="color:#8ea3b0;padding:20px;text-align:center;">Peers немає</div>';

    html += '<table class="rm-table rm-table-compact"><tr><th>Interface</th><th>Public Key</th><th>Allowed IPs</th><th>Endpoint</th><th>Last Handshake</th><th style="text-align:right;">Дії</th></tr>';
    peers.forEach(function(peer) {
      var id = peer['.id'] || '';
      html += '<tr>' +
        '<td>' + esc(peer.interface||'') + '</td>' +
        '<td style="font-family:monospace;font-size:10px;max-width:120px;overflow:hidden;text-overflow:ellipsis;" title="' + esc(peer['public-key']||'') + '">' + esc((peer['public-key']||'').slice(0,16)) + '...</td>' +
        '<td style="font-size:11px;">' + esc(peer['allowed-address']||'') + '</td>' +
        '<td style="font-size:11px;">' + esc(peer['endpoint-address']||'') + (peer['endpoint-port'] ? ':' + peer['endpoint-port'] : '') + '</td>' +
        '<td style="font-size:11px;color:#8ea3b0;">' + esc(peer['last-handshake']||'—') + '</td>' +
        '<td style="text-align:right;">' +
          '<button class="rm-act-btn rm-act-edit" onclick="window.__rmEditWGPeer(\'' + esc(id) + '\')">✏️</button>' +
          '<button class="rm-act-btn rm-act-del" onclick="window.__rmDelWGPeer(\'' + esc(id) + '\')">🗑</button>' +
        '</td></tr>';
    });
    html += '</table>';

    window.__rmAddWGPeer = function() {
      S().get('wireguard').then(function(ifaces) {
        openModal('➕ WireGuard Peer', [
          { key:'interface',       label:'Interface',       required:true, type:'select', options: ifaces.map(function(i){return i.name;}) },
          { key:'public-key',      label:'Public Key',      required:true, placeholder:'base64...=' },
          { key:'allowed-address', label:'Allowed Address', required:true, placeholder:'10.20.30.2/32' },
          { key:'endpoint-address',label:'Endpoint Address',placeholder:'IP клієнта' },
          { key:'endpoint-port',   label:'Endpoint Port',   placeholder:'51820' },
          { key:'persistent-keepalive', label:'Keepalive',  placeholder:'25' },
          { key:'comment',         label:'Коментар' },
        ], function(data, done) {
          restCall(r, 'PUT', '/interface/wireguard/peers', data).then(function(res) {
            if (res && res.error) { done(false, res.error); return; }
            S().invalidate('wireguardPeers'); done(true);
            setTimeout(window.rmSectionWireGuard, 500);
          }).catch(function(e) { done(false, String(e)); });
        });
      });
    };

    window.__rmEditWGPeer = function(id) {
      S().get('wireguardPeers').then(function(peers) {
        var peer = peers.find(function(x) { return x['.id'] === id; }) || {};
        openModal('✏️ WireGuard Peer', [
          { key:'allowed-address',      label:'Allowed Address',  value: peer['allowed-address'] || '' },
          { key:'endpoint-address',     label:'Endpoint Address', value: peer['endpoint-address'] || '' },
          { key:'endpoint-port',        label:'Endpoint Port',    value: peer['endpoint-port'] || '' },
          { key:'persistent-keepalive', label:'Keepalive',        value: peer['persistent-keepalive'] || '' },
          { key:'comment',              label:'Коментар',         value: peer.comment || '' },
        ], function(data, done) {
          restCall(r, 'PATCH', '/interface/wireguard/peers/' + id, data).then(function(res) {
            if (res && res.error) { done(false, res.error); return; }
            S().invalidate('wireguardPeers'); done(true);
            setTimeout(window.rmSectionWireGuard, 500);
          }).catch(function(e) { done(false, String(e)); });
        });
      });
    };

    window.__rmDelWGPeer = function(id) {
      if (!confirm('Видалити Peer?')) return;
      restCall(r, 'DELETE', '/interface/wireguard/peers/' + id, null).then(function() {
        S().invalidate('wireguardPeers');
        window.rmSectionWireGuard();
      });
    };

    return html;
  }

  /* ══════════════════════════════════════════════════════════
     УТИЛІТИ
     ══════════════════════════════════════════════════════════ */
  function kv(key, val) {
    return '<div style="font-size:11px;color:#8ea3b0;">' + esc(key) + '</div>' +
           '<div style="font-size:13px;color:#e6edf3;">' + esc(String(val)) + '</div>';
  }

  console.log('[RM Sections Extra] завантажено');

})();