'use strict';

/* ============================================================
   Router Manager CRUD — повноцінне редагування як у Winbox
   Підключається після router-manager.js
   ============================================================ */

(function() {

  var PROXY = 'http://localhost:8888';

  /* ══════════════════════════════════════════════════════════
     СТИЛІ
     ══════════════════════════════════════════════════════════ */
  function injectCrudStyles() {
    if (document.getElementById('rm-crud-styles')) return;
    var s = document.createElement('style');
    s.id = 'rm-crud-styles';
    s.textContent = `
      /* Modal */
      .rm-modal-overlay {
        position:fixed; inset:0; background:rgba(0,0,0,.7);
        z-index:99999; display:flex; align-items:center; justify-content:center;
      }
      .rm-modal {
        background:#111d27; border:1px solid #2a3b48; border-radius:12px;
        width:560px; max-width:95vw; max-height:85vh; overflow-y:auto;
        padding:24px; box-shadow:0 24px 80px rgba(0,0,0,.8);
      }
      .rm-modal h3 {
        margin:0 0 18px; font-size:16px; color:#5fd0a5;
        display:flex; align-items:center; gap:8px;
      }
      .rm-modal-field { margin-bottom:12px; }
      .rm-modal-field label {
        display:block; font-size:12px; color:#8ea3b0; margin-bottom:4px;
      }
      .rm-modal-field input,
      .rm-modal-field select,
      .rm-modal-field textarea {
        width:100%; box-sizing:border-box;
        background:#0d1821; border:1px solid #2a3b48; border-radius:6px;
        color:#e6edf3; padding:8px 10px; font-size:13px;
      }
      .rm-modal-field input:focus,
      .rm-modal-field select:focus,
      .rm-modal-field textarea:focus {
        outline:none; border-color:#5fd0a5;
      }
      .rm-modal-field .rm-hint {
        font-size:11px; color:#4a6070; margin-top:3px;
      }
      .rm-modal-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
      .rm-modal-actions {
        display:flex; gap:8px; margin-top:20px; justify-content:flex-end;
      }
      .rm-modal-status {
        font-size:12px; padding:8px 12px; border-radius:6px; margin-top:10px;
        display:none;
      }
      .rm-modal-status.ok  { display:block; background:#0d2a1a; border:1px solid #2f7a5c; color:#5fd0a5; }
      .rm-modal-status.err { display:block; background:#3a1a1a; border:1px solid #b04040; color:#e05252; }

      /* Action buttons in table */
      .rm-act-btn {
        padding:3px 8px; border-radius:4px; border:none; cursor:pointer;
        font-size:11px; font-weight:600; transition:all .12s; margin-left:4px;
      }
      .rm-act-edit   { background:#1a3a4a; color:#5fd0a5; border:1px solid #2f7a5c; }
      .rm-act-edit:hover { background:#2a4a5a; }
      .rm-act-del    { background:#3a1a1a; color:#e05252; border:1px solid #b04040; }
      .rm-act-del:hover { background:#5a2a2a; }
      .rm-act-enable { background:#1a3a2a; color:#5fd0a5; border:1px solid #2f7a5c; }
      .rm-act-disable{ background:#3a2a10; color:#f0a840; border:1px solid #b87a20; }

      /* Table toolbar */
      .rm-table-toolbar {
        display:flex; gap:8px; margin-bottom:12px; align-items:center;
        flex-wrap:wrap;
      }
      .rm-search-input {
        flex:1; min-width:160px;
        background:#0d1821; border:1px solid #2a3b48; border-radius:6px;
        color:#e6edf3; padding:6px 10px; font-size:12px;
      }
      .rm-search-input:focus { outline:none; border-color:#5fd0a5; }

      /* Toggle switch */
      .rm-toggle {
        display:inline-flex; align-items:center; gap:6px; cursor:pointer;
      }
      .rm-toggle input { display:none; }
      .rm-toggle-track {
        width:32px; height:18px; border-radius:9px; background:#2a3b48;
        position:relative; transition:background .2s;
      }
      .rm-toggle input:checked + .rm-toggle-track { background:#2f7a5c; }
      .rm-toggle-thumb {
        position:absolute; top:2px; left:2px;
        width:14px; height:14px; border-radius:7px; background:#fff;
        transition:transform .2s;
      }
      .rm-toggle input:checked ~ .rm-toggle-track .rm-toggle-thumb {
        transform:translateX(14px);
      }
    `;
    document.head.appendChild(s);
  }

  /* ══════════════════════════════════════════════════════════
     МОДАЛЬНЕ ВІКНО
     ══════════════════════════════════════════════════════════ */
  function openModal(title, fields, onSave, data) {
    closeModal();

    var overlay = document.createElement('div');
    overlay.className = 'rm-modal-overlay';
    overlay.id = 'rm-crud-modal';

    var html = '<div class="rm-modal">';
    html += '<h3>' + title + '</h3>';

    fields.forEach(function(f) {
      html += '<div class="rm-modal-field">';
      html += '<label>' + esc(f.label) + (f.required ? ' <span style="color:#e05252">*</span>' : '') + '</label>';

      var val = (data && data[f.key] !== undefined) ? String(data[f.key]) : (f.default || '');

      if (f.type === 'select') {
        html += '<select id="rm-f-' + f.key + '">';
        (f.options || []).forEach(function(opt) {
          var v = typeof opt === 'object' ? opt.value : opt;
          var l = typeof opt === 'object' ? opt.label : opt;
          html += '<option value="' + esc(v) + '"' + (val === v ? ' selected' : '') + '>' + esc(l) + '</option>';
        });
        html += '</select>';
      } else if (f.type === 'checkbox') {
        var checked = val === 'true' || val === 'yes' || val === true;
        html += '<label class="rm-toggle"><input type="checkbox" id="rm-f-' + f.key + '"' + (checked ? ' checked' : '') + '>' +
          '<div class="rm-toggle-track"><div class="rm-toggle-thumb"></div></div>' +
          '<span style="font-size:12px;color:#e6edf3;">' + (f.trueLabel || 'Так') + '</span></label>';
      } else if (f.type === 'textarea') {
        html += '<textarea id="rm-f-' + f.key + '" rows="3">' + esc(val) + '</textarea>';
      } else {
        html += '<input type="' + (f.type || 'text') + '" id="rm-f-' + f.key + '" value="' + esc(val) + '"' +
          (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') + '>';
      }

      if (f.hint) html += '<div class="rm-hint">' + esc(f.hint) + '</div>';
      html += '</div>';
    });

    html += '<div class="rm-modal-status" id="rm-crud-status"></div>';
    html += '<div class="rm-modal-actions">';
    html += '<button class="rm-btn rm-btn-secondary" id="rm-crud-cancel">Скасувати</button>';
    html += '<button class="rm-btn rm-btn-primary" id="rm-crud-save">💾 Зберегти</button>';
    html += '</div></div>';

    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeModal();
    });

    document.getElementById('rm-crud-cancel').addEventListener('click', closeModal);

    document.getElementById('rm-crud-save').addEventListener('click', function() {
      var formData = {};
      fields.forEach(function(f) {
        var el = document.getElementById('rm-f-' + f.key);
        if (!el) return;
        if (f.type === 'checkbox') {
          formData[f.key] = el.checked ? 'yes' : 'no';
        } else {
          formData[f.key] = el.value.trim();
        }
      });

      /* Валідація required полів */
      var missing = fields.filter(function(f) {
        return f.required && !formData[f.key];
      });

      if (missing.length) {
        showModalStatus('err', '⚠ Заповни обов\'язкові поля: ' + missing.map(function(f) { return f.label; }).join(', '));
        return;
      }

      var saveBtn = document.getElementById('rm-crud-save');
      saveBtn.disabled = true;
      saveBtn.textContent = '⏳ Збереження...';

      onSave(formData, function(ok, msg) {
        if (ok) {
          showModalStatus('ok', '✅ ' + (msg || 'Збережено!'));
          setTimeout(closeModal, 1200);
        } else {
          showModalStatus('err', '❌ ' + (msg || 'Помилка'));
          saveBtn.disabled = false;
          saveBtn.textContent = '💾 Зберегти';
        }
      });
    });
  }

  function closeModal() {
    var m = document.getElementById('rm-crud-modal');
    if (m) m.remove();
  }

  function showModalStatus(type, msg) {
    var el = document.getElementById('rm-crud-status');
    if (!el) return;
    el.className = 'rm-modal-status ' + type;
    el.textContent = msg;
  }

  /* ══════════════════════════════════════════════════════════
     REST HELPERS
     ══════════════════════════════════════════════════════════ */
  function getActiveRouter() {
    /* Спробуємо всі можливі способи отримати активний роутер */
    if (window.__rmGetActiveRouter) {
      return window.__rmGetActiveRouter();
    }
    if (window.RouterManager && window.RouterManager._getActiveRouter) {
      return window.RouterManager._getActiveRouter();
    }
    if (window.RouterManager && window.RouterManager._state) {
      var st = window.RouterManager._state;
      return st.routers.find(function(r) { return r.id === st.activeRouter; }) || null;
    }
    return null;
  }

  function restCall(router, method, path, body) {
    var url  = PROXY + '/rest' + path;
    var opts = {
      method: method,
      headers: {
        'Content-Type':  'application/json',
        'x-router-ip':   router.ip,
        'x-router-port': String(router.port),
        'Authorization': 'Basic ' + btoa(router.user + ':' + router.pass),
      },
    };
    if (body) opts.body = JSON.stringify(body);
    return fetch(url, opts).then(function(r) {
      return r.json().catch(function() { return {}; });
    });
  }

  function sshCall(router, command) {
    return fetch(PROXY + '/ssh/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: router.ip, port: router.sshPort || 22,
        username: router.user, password: router.pass,
        command: command,
      }),
    }).then(function(r) { return r.json(); });
  }

  /* ══════════════════════════════════════════════════════════
     ENHANCED renderTable — з кнопками Edit/Delete/Add
     ══════════════════════════════════════════════════════════ */
  window.renderTableCRUD = function(opts) {
    /*
      opts: {
        title, icon, apiPath, cols, fields,
        addTitle, editTitle,
        canEdit, canDelete, canToggle,
        extraActions
      }
    */
    var cont = document.getElementById('rm-content');
    var router = getActiveRouter();
    if (!cont || !router) return;

    cont.innerHTML =
      '<div class="rm-section-title">' + (opts.icon || '') + ' ' + esc(opts.title) +
      ' <span class="rm-badge rm-badge-warn" id="rm-table-badge">⏳ Завантаження...</span></div>' +
      '<div class="rm-table-toolbar">' +
        '<input class="rm-search-input" id="rm-table-search" placeholder="🔍 Пошук...">' +
        (opts.fields ? '<button class="rm-btn rm-btn-primary" id="rm-table-add" style="font-size:12px;">＋ Додати</button>' : '') +
        '<button class="rm-btn rm-btn-secondary" id="rm-table-refresh" style="font-size:12px;">🔄 Оновити</button>' +
      '</div>' +
      '<div id="rm-table-wrap"></div>';

    function load() {
      restCall(router, 'GET', opts.apiPath).then(function(data) {
        if (!Array.isArray(data)) {
          document.getElementById('rm-table-wrap').innerHTML =
            '<div style="color:#e05252;padding:12px;">Помилка: ' + esc(JSON.stringify(data).slice(0, 100)) + '</div>';
          return;
        }

        var badge = document.getElementById('rm-table-badge');
        if (badge) badge.textContent = data.length + ' записів';
        if (badge) badge.className = 'rm-badge';

        renderRows(data);
      }).catch(function(e) {
        var wrap = document.getElementById('rm-table-wrap');
        if (wrap) wrap.innerHTML = '<div style="color:#e05252;">Помилка: ' + esc(String(e)) + '</div>';
      });
    }

    function renderRows(data) {
      var search = (document.getElementById('rm-table-search') || {}).value || '';
      var filtered = data;
      if (search) {
        var lo = search.toLowerCase();
        filtered = data.filter(function(row) {
          return opts.cols.some(function(c) {
            return String(row[c] || '').toLowerCase().includes(lo);
          });
        });
      }

      var html = '<div style="overflow-x:auto;"><table class="rm-table">';
      html += '<tr>';
      opts.cols.forEach(function(c) { html += '<th>' + esc(c) + '</th>'; });
      html += '<th style="width:130px;text-align:right;">Дії</th></tr>';

      filtered.forEach(function(row, idx) {
        var rowId  = row['.id'] || '';
        var disabled = row.disabled === 'true' || row.disabled === true;
        var rowStyle = disabled ? 'opacity:.55;' : '';

        html += '<tr style="' + rowStyle + '" data-idx="' + idx + '">';
        opts.cols.forEach(function(c) {
          var val = String(row[c] !== undefined ? row[c] : '');
          var display = val;
          if (val === 'true')  display = '<span class="rm-badge">✓</span>';
          if (val === 'false') display = '<span style="color:#4a6070">—</span>';
          html += '<td>' + display + '</td>';
        });

        /* Кнопки дій */
        html += '<td style="text-align:right;white-space:nowrap;">';
        if (opts.canToggle !== false && rowId) {
          html += '<button class="rm-act-btn ' + (disabled ? 'rm-act-enable' : 'rm-act-disable') +
            '" data-id="' + esc(rowId) + '" data-disabled="' + disabled + '" data-action="toggle">' +
            (disabled ? '▶' : '‖') + '</button>';
        }
        if (opts.canEdit !== false && rowId && opts.fields) {
          html += '<button class="rm-act-btn rm-act-edit" data-id="' + esc(rowId) + '" data-idx="' + idx + '" data-action="edit">✏️</button>';
        }
        if (opts.canDelete !== false && rowId) {
          html += '<button class="rm-act-btn rm-act-del" data-id="' + esc(rowId) + '" data-action="del">🗑</button>';
        }
        html += '</td></tr>';
      });

      if (!filtered.length) {
        html += '<tr><td colspan="' + (opts.cols.length + 1) + '" style="color:#8ea3b0;text-align:center;padding:20px;">Нічого не знайдено</td></tr>';
      }

      html += '</table></div>';

      var wrap = document.getElementById('rm-table-wrap');
      if (wrap) {
        wrap.innerHTML = html;
        wrap._data = data;
        bindActions(wrap, data, load);
      }
    }

    function bindActions(wrap, data, reload) {
      wrap.addEventListener('click', function(e) {
        var btn = e.target.closest('[data-action]');
        if (!btn) return;

        var action  = btn.dataset.action;
        var rowId   = btn.dataset.id;
        var rowIdx  = parseInt(btn.dataset.idx || '-1');
        var rowData = rowIdx >= 0 ? data[rowIdx] : {};

        /* ── Toggle enable/disable ── */
        if (action === 'toggle') {
          var disabled = btn.dataset.disabled === 'true';
          var method   = disabled ? 'POST' : 'POST';
          var path     = opts.apiPath + '/' + rowId + (disabled ? '/enable' : '/disable');

          /* Спробуємо через REST, якщо не підтримується — через SSH */
          restCall(router, 'POST', path, {}).then(function(res) {
            if (res.error) throw new Error(res.error);
            reload();
          }).catch(function() {
            /* Fallback через SSH */
            var name = rowData.name || rowId;
            var cmd  = '/interface ' + (disabled ? 'enable' : 'disable') + ' "' + name + '"';
            sshCall(router, cmd).then(function() { reload(); });
          });
          return;
        }

        /* ── Edit ── */
        if (action === 'edit' && opts.fields) {
          openModal(
            (opts.editTitle || '✏️ Редагувати') + ' — ' + (rowData.name || rowId),
            opts.fields,
            function(formData, done) {
              restCall(router, 'PATCH', opts.apiPath + '/' + rowId, formData).then(function(res) {
                if (res.error) { done(false, res.error); return; }
                reload();
                done(true);
              }).catch(function(e) { done(false, String(e)); });
            },
            rowData
          );
          return;
        }

        /* ── Delete ── */
        if (action === 'del') {
          var name = rowData.name || rowData.address || rowId;
          if (!confirm('Видалити "' + name + '"?\n\nЦю дію неможливо скасувати!')) return;

          restCall(router, 'DELETE', opts.apiPath + '/' + rowId, null).then(function(res) {
            if (res && res.error) {
              alert('Помилка: ' + res.error);
              return;
            }
            reload();
          }).catch(function(e) { alert('Помилка: ' + e); });
          return;
        }
      });
    }

    /* ── Add ── */
    setTimeout(function() {
      var addBtn = document.getElementById('rm-table-add');
      if (addBtn && opts.fields) {
        addBtn.addEventListener('click', function() {
          openModal(
            opts.addTitle || '➕ Додати',
            opts.fields,
            function(formData, done) {
              restCall(router, 'PUT', opts.apiPath, formData).then(function(res) {
                if (res.error) { done(false, res.error); return; }
                load();
                done(true, 'Додано!');
              }).catch(function(e) { done(false, String(e)); });
            },
            {}
          );
        });
      }

      var refBtn = document.getElementById('rm-table-refresh');
      if (refBtn) refBtn.addEventListener('click', load);

      var searchEl = document.getElementById('rm-table-search');
      if (searchEl) {
        searchEl.addEventListener('input', function() {
          var wrap = document.getElementById('rm-table-wrap');
          if (wrap && wrap._data) renderRows(wrap._data);
        });
      }
    }, 100);

    load();
  };

  /* ══════════════════════════════════════════════════════════
     КОНФІГУРАЦІЇ СЕКЦІЙ — повний Winbox-like CRUD
     ══════════════════════════════════════════════════════════ */

  /* ── Interfaces ── */
  window.rmCrudInterfaces = function() {
    window.renderTableCRUD({
      title:   'Interfaces',
      icon:    '🌐',
      apiPath: '/interface',
      cols:    ['name','type','mac-address','mtu','running','disabled','comment'],
      canToggle: true,
      canDelete: false,  /* інтерфейси не видаляємо напряму */
      fields: [
        { key: 'name',     label: 'Назва',     required: true },
        { key: 'mtu',      label: 'MTU',       default: '1500', hint: '1-65535' },
        { key: 'comment',  label: 'Коментар' },
        { key: 'disabled', label: 'Вимкнено',  type: 'checkbox', trueLabel: 'Disabled' },
      ],
      addTitle:  '➕ Додати інтерфейс',
      editTitle: '✏️ Інтерфейс',
    });
  };

  /* ── IP Addresses ── */
  window.rmCrudIPAddresses = function() {
    window.renderTableCRUD({
      title:   'IP Addresses',
      icon:    '📋',
      apiPath: '/ip/address',
      cols:    ['address','network','interface','disabled','comment'],
      fields: [
        { key: 'address',   label: 'IP/маска', required: true, placeholder: '192.168.88.1/24' },
        { key: 'interface', label: 'Інтерфейс', required: true, placeholder: 'ether1, bridge-lan...' },
        { key: 'comment',   label: 'Коментар' },
        { key: 'disabled',  label: 'Вимкнено', type: 'checkbox' },
      ],
      addTitle:  '➕ Додати IP адресу',
      editTitle: '✏️ IP Адреса',
    });
  };

  /* ── IP Routes ── */
  window.rmCrudRoutes = function() {
    window.renderTableCRUD({
      title:   'Routes',
      icon:    '🛣️',
      apiPath: '/ip/route',
      cols:    ['dst-address','gateway','distance','active','disabled','comment'],
      fields: [
        { key: 'dst-address', label: 'Мережа призначення', required: true, placeholder: '0.0.0.0/0' },
        { key: 'gateway',     label: 'Шлюз', required: true, placeholder: '192.168.88.254 або ether1' },
        { key: 'distance',    label: 'Distance', default: '1', hint: '1-255' },
        { key: 'comment',     label: 'Коментар' },
        { key: 'disabled',    label: 'Вимкнено', type: 'checkbox' },
      ],
      addTitle:  '➕ Додати маршрут',
      editTitle: '✏️ Маршрут',
    });
  };

  /* ── DHCP Leases ── */
  window.rmCrudDHCP = function() {
    window.renderTableCRUD({
      title:   'DHCP Leases',
      icon:    '📡',
      apiPath: '/ip/dhcp-server/lease',
      cols:    ['address','mac-address','host-name','status','expires-after','comment'],
      fields: [
        { key: 'address',     label: 'IP адреса', required: true },
        { key: 'mac-address', label: 'MAC адреса', required: true, placeholder: 'AA:BB:CC:DD:EE:FF' },
        { key: 'host-name',   label: 'Hostname' },
        { key: 'comment',     label: 'Коментар' },
      ],
      addTitle:  '➕ Додати статичну оренду',
      editTitle: '✏️ DHCP Lease',
    });
  };

  /* ── DNS Static ── */
  window.rmCrudDNSStatic = function() {
    window.renderTableCRUD({
      title:   'DNS Static Records',
      icon:    '📋',
      apiPath: '/ip/dns/static',
      cols:    ['name','address','ttl','regexp','disabled'],
      fields: [
        { key: 'name',     label: 'Hostname', required: true, placeholder: 'router.lan' },
        { key: 'address',  label: 'IP адреса', required: true, placeholder: '192.168.88.1' },
        { key: 'ttl',      label: 'TTL', default: '1d' },
        { key: 'comment',  label: 'Коментар' },
        { key: 'disabled', label: 'Вимкнено', type: 'checkbox' },
      ],
      addTitle:  '➕ Додати DNS запис',
      editTitle: '✏️ DNS Record',
    });
  };

  /* ── ARP ── */
  window.rmCrudARP = function() {
    window.renderTableCRUD({
      title:   'ARP Table',
      icon:    '📋',
      apiPath: '/ip/arp',
      cols:    ['address','mac-address','interface','dynamic','published'],
      fields: [
        { key: 'address',     label: 'IP адреса', required: true },
        { key: 'mac-address', label: 'MAC адреса', required: true },
        { key: 'interface',   label: 'Інтерфейс', required: true },
        { key: 'published',   label: 'Published', type: 'checkbox' },
      ],
      addTitle:  '➕ Додати ARP запис',
      editTitle: '✏️ ARP',
    });
  };

  /* ── Firewall Filter ── */
  window.rmCrudFWFilter = function() {
    window.renderTableCRUD({
      title:   'Firewall Filter',
      icon:    '🔥',
      apiPath: '/ip/firewall/filter',
      cols:    ['chain','action','protocol','src-address','dst-address','dst-port','disabled','comment'],
      canToggle: true,
      fields: [
        {
          key: 'chain', label: 'Chain', required: true, type: 'select',
          options: ['input','forward','output'],
        },
        {
          key: 'action', label: 'Action', required: true, type: 'select',
          options: ['accept','drop','reject','jump','log','passthrough'],
        },
        {
          key: 'protocol', label: 'Protocol', type: 'select',
          options: ['', 'tcp', 'udp', 'icmp', 'gre', 'esp', 'ah'],
        },
        { key: 'src-address',  label: 'Src Address',  placeholder: '192.168.88.0/24 або порожньо' },
        { key: 'dst-address',  label: 'Dst Address',  placeholder: '0.0.0.0/0 або порожньо' },
        { key: 'dst-port',     label: 'Dst Port',     placeholder: '80,443 або 8080-8090' },
        { key: 'src-port',     label: 'Src Port',     placeholder: 'або порожньо' },
        { key: 'in-interface', label: 'In Interface', placeholder: 'ether1 або порожньо' },
        { key: 'connection-state', label: 'Connection State', placeholder: 'established,related' },
        { key: 'comment',      label: 'Коментар' },
        { key: 'disabled',     label: 'Вимкнено', type: 'checkbox' },
      ],
      addTitle:  '➕ Додати правило',
      editTitle: '✏️ Filter Rule',
    });
  };

  /* ── Firewall NAT ── */
  window.rmCrudFWNAT = function() {
    window.renderTableCRUD({
      title:   'NAT Rules',
      icon:    '🔥',
      apiPath: '/ip/firewall/nat',
      cols:    ['chain','action','protocol','src-address','dst-port','to-addresses','to-ports','disabled','comment'],
      canToggle: true,
      fields: [
        {
          key: 'chain', label: 'Chain', required: true, type: 'select',
          options: ['srcnat','dstnat'],
        },
        {
          key: 'action', label: 'Action', required: true, type: 'select',
          options: ['masquerade','src-nat','dst-nat','redirect','accept'],
        },
        {
          key: 'protocol', label: 'Protocol', type: 'select',
          options: ['', 'tcp', 'udp', 'icmp'],
        },
        { key: 'src-address',  label: 'Src Address' },
        { key: 'dst-address',  label: 'Dst Address' },
        { key: 'dst-port',     label: 'Dst Port',      placeholder: '80 або 8080-8090' },
        { key: 'to-addresses', label: 'To Addresses',  placeholder: '192.168.88.100' },
        { key: 'to-ports',     label: 'To Ports',      placeholder: '80' },
        { key: 'out-interface-list', label: 'Out Interface List', placeholder: 'WAN' },
        { key: 'comment',      label: 'Коментар' },
        { key: 'disabled',     label: 'Вимкнено', type: 'checkbox' },
      ],
      addTitle:  '➕ Додати NAT правило',
      editTitle: '✏️ NAT Rule',
    });
  };

  /* ── Firewall Mangle ── */
  window.rmCrudFWMangle = function() {
    window.renderTableCRUD({
      title:   'Mangle Rules',
      icon:    '🔥',
      apiPath: '/ip/firewall/mangle',
      cols:    ['chain','action','protocol','src-address','disabled','comment'],
      canToggle: true,
      fields: [
        { key: 'chain',   label: 'Chain',   required: true },
        { key: 'action',  label: 'Action',  required: true },
        { key: 'protocol',label: 'Protocol' },
        { key: 'comment', label: 'Коментар' },
        { key: 'disabled',label: 'Вимкнено', type: 'checkbox' },
      ],
      addTitle:  '➕ Mangle правило',
      editTitle: '✏️ Mangle',
    });
  };

  /* ── Address List ── */
  window.rmCrudAddressList = function() {
    window.renderTableCRUD({
      title:   'Address Lists',
      icon:    '📋',
      apiPath: '/ip/firewall/address-list',
      cols:    ['list','address','timeout','dynamic','disabled','comment'],
      fields: [
        { key: 'list',     label: 'Список', required: true, placeholder: 'TRUSTED, BLOCKED...' },
        { key: 'address',  label: 'IP / CIDR', required: true, placeholder: '192.168.88.100 або 10.0.0.0/8' },
        { key: 'timeout',  label: 'Timeout',   placeholder: '1h або порожньо' },
        { key: 'comment',  label: 'Коментар' },
        { key: 'disabled', label: 'Вимкнено',  type: 'checkbox' },
      ],
      addTitle:  '➕ Додати в список',
      editTitle: '✏️ Address List',
    });
  };

  /* ── Wireless Interfaces ── */
  window.rmCrudWireless = function() {
    window.renderTableCRUD({
      title:   'Wireless Interfaces',
      icon:    '📡',
      apiPath: '/interface/wireless',
      cols:    ['name','ssid','band','frequency','mode','running','disabled'],
      canToggle: true,
      fields: [
        { key: 'name',      label: 'Назва' },
        { key: 'ssid',      label: 'SSID', placeholder: 'MyNetwork' },
        {
          key: 'mode', label: 'Mode', type: 'select',
          options: ['ap-bridge','station','bridge','wds-slave'],
        },
        {
          key: 'band', label: 'Band', type: 'select',
          options: ['2ghz-b/g/n','5ghz-a/n/ac','2ghz-g/n','5ghz-n/ac'],
        },
        { key: 'frequency', label: 'Frequency', placeholder: 'auto або 2412, 5180...' },
        { key: 'channel-width', label: 'Channel Width', placeholder: '20/40mhz-XX або 80mhz' },
        { key: 'tx-power',  label: 'TX Power', placeholder: 'auto або 0-40' },
        { key: 'comment',   label: 'Коментар' },
        { key: 'disabled',  label: 'Вимкнено', type: 'checkbox' },
      ],
      editTitle: '✏️ Wireless Interface',
    });
  };

  /* ── WireGuard Peers ── */
  window.rmCrudWGPeers = function() {
    window.renderTableCRUD({
      title:   'WireGuard Peers',
      icon:    '🔐',
      apiPath: '/interface/wireguard/peers',
      cols:    ['interface','public-key','allowed-address','endpoint-address','endpoint-port','comment'],
      fields: [
        { key: 'interface',       label: 'WG Interface', required: true, placeholder: 'wg1' },
        { key: 'public-key',      label: 'Public Key', required: true, placeholder: 'base64...' },
        { key: 'allowed-address', label: 'Allowed Address', required: true, placeholder: '10.20.30.2/32' },
        { key: 'endpoint-address',label: 'Endpoint Address', placeholder: 'IP клієнта або порожньо' },
        { key: 'endpoint-port',   label: 'Endpoint Port', placeholder: '51820' },
        { key: 'persistent-keepalive', label: 'Keepalive', placeholder: '25' },
        { key: 'comment',         label: 'Коментар' },
      ],
      addTitle:  '➕ Додати Peer',
      editTitle: '✏️ WG Peer',
    });
  };

  /* ── IP Pool ── */
  window.rmCrudIPPool = function() {
    window.renderTableCRUD({
      title:   'IP Pools',
      icon:    '📦',
      apiPath: '/ip/pool',
      cols:    ['name','ranges','next-pool'],
      fields: [
        { key: 'name',   label: 'Назва', required: true },
        { key: 'ranges', label: 'Діапазон', required: true, placeholder: '192.168.88.10-192.168.88.254' },
        { key: 'next-pool', label: 'Next Pool', placeholder: 'або порожньо' },
      ],
      addTitle:  '➕ Додати Pool',
      editTitle: '✏️ IP Pool',
    });
  };

  /* ── DHCP Server ── */
  window.rmCrudDHCPServer = function() {
    window.renderTableCRUD({
      title:   'DHCP Server',
      icon:    '📡',
      apiPath: '/ip/dhcp-server',
      cols:    ['name','interface','address-pool','lease-time','disabled'],
      canToggle: true,
      fields: [
        { key: 'name',         label: 'Назва', required: true },
        { key: 'interface',    label: 'Інтерфейс', required: true },
        { key: 'address-pool', label: 'Address Pool' },
        { key: 'lease-time',   label: 'Lease Time', default: '1d' },
        { key: 'disabled',     label: 'Вимкнено', type: 'checkbox' },
      ],
      addTitle:  '➕ DHCP Server',
      editTitle: '✏️ DHCP Server',
    });
  };

  /* ── Queues Simple ── */
  window.rmCrudQueues = function() {
    window.renderTableCRUD({
      title:   'Simple Queues',
      icon:    '📊',
      apiPath: '/queue/simple',
      cols:    ['name','target','max-limit','burst-limit','disabled','comment'],
      canToggle: true,
      fields: [
        { key: 'name',        label: 'Назва', required: true },
        { key: 'target',      label: 'Target IP/мережа', required: true, placeholder: '192.168.88.100/32' },
        { key: 'max-limit',   label: 'Max Limit (upload/download)', placeholder: '10M/50M' },
        { key: 'burst-limit', label: 'Burst Limit', placeholder: '20M/100M або порожньо' },
        { key: 'burst-time',  label: 'Burst Time', placeholder: '10s або порожньо' },
        { key: 'priority',    label: 'Priority', placeholder: '1-8' },
        { key: 'comment',     label: 'Коментар' },
        { key: 'disabled',    label: 'Вимкнено', type: 'checkbox' },
      ],
      addTitle:  '➕ Додати Queue',
      editTitle: '✏️ Simple Queue',
    });
  };

  /* ── PPP Secrets ── */
  window.rmCrudPPP = function() {
    window.renderTableCRUD({
      title:   'PPP Secrets',
      icon:    '🔑',
      apiPath: '/ppp/secret',
      cols:    ['name','service','profile','local-address','remote-address','disabled'],
      canToggle: true,
      fields: [
        { key: 'name',     label: 'Логін', required: true },
        { key: 'password', label: 'Пароль', type: 'password' },
        {
          key: 'service', label: 'Сервіс', type: 'select',
          options: ['any','ppp','l2tp','pptp','sstp','ovpn'],
        },
        { key: 'profile',        label: 'Profile', placeholder: 'default' },
        { key: 'local-address',  label: 'Local Address' },
        { key: 'remote-address', label: 'Remote Address' },
        { key: 'comment',        label: 'Коментар' },
        { key: 'disabled',       label: 'Вимкнено', type: 'checkbox' },
      ],
      addTitle:  '➕ Додати Secret',
      editTitle: '✏️ PPP Secret',
    });
  };

  /* ── Users ── */
  window.rmCrudUsers = function() {
    window.renderTableCRUD({
      title:   'Users',
      icon:    '👤',
      apiPath: '/user',
      cols:    ['name','group','last-logged-in','disabled'],
      canToggle: true,
      fields: [
        { key: 'name',     label: 'Логін', required: true },
        { key: 'password', label: 'Пароль', type: 'password', hint: 'Залиш порожнім щоб не змінювати' },
        {
          key: 'group', label: 'Група', type: 'select',
          options: ['full','read','write'],
        },
        { key: 'comment',  label: 'Коментар' },
        { key: 'disabled', label: 'Вимкнено', type: 'checkbox' },
      ],
      addTitle:  '➕ Додати користувача',
      editTitle: '✏️ User',
    });
  };

  /* ── Scheduler ── */
  window.rmCrudScheduler = function() {
    window.renderTableCRUD({
      title:   'Scheduler',
      icon:    '⏰',
      apiPath: '/system/scheduler',
      cols:    ['name','start-date','start-time','interval','on-event','disabled'],
      canToggle: true,
      fields: [
        { key: 'name',       label: 'Назва', required: true },
        { key: 'start-date', label: 'Start Date', placeholder: 'jan/01/2024 або startup' },
        { key: 'start-time', label: 'Start Time', placeholder: '00:00:00 або startup' },
        { key: 'interval',   label: 'Інтервал', placeholder: '1d, 1h, 30m або 00:00:00' },
        { key: 'on-event',   label: 'Script / Command', type: 'textarea', required: true },
        { key: 'comment',    label: 'Коментар' },
        { key: 'disabled',   label: 'Вимкнено', type: 'checkbox' },
      ],
      addTitle:  '➕ Додати задачу',
      editTitle: '✏️ Scheduler',
    });
  };

  /* ── VLAN Interfaces ── */
  window.rmCrudVLAN = function() {
    window.renderTableCRUD({
      title:   'VLAN Interfaces',
      icon:    '🔀',
      apiPath: '/interface/vlan',
      cols:    ['name','vlan-id','interface','mtu','disabled','comment'],
      canToggle: true,
      fields: [
        { key: 'name',      label: 'Назва', required: true, placeholder: 'vlan20' },
        { key: 'vlan-id',   label: 'VLAN ID', required: true, placeholder: '20' },
        { key: 'interface', label: 'Батьківський інтерфейс', required: true, placeholder: 'ether1, bridge-lan' },
        { key: 'mtu',       label: 'MTU', default: '1500' },
        { key: 'comment',   label: 'Коментар' },
        { key: 'disabled',  label: 'Вимкнено', type: 'checkbox' },
      ],
      addTitle:  '➕ Додати VLAN',
      editTitle: '✏️ VLAN',
    });
  };

  /* ── Bridge ── */
  window.rmCrudBridge = function() {
    window.renderTableCRUD({
      title:   'Bridge Ports',
      icon:    '🌉',
      apiPath: '/interface/bridge/port',
      cols:    ['bridge','interface','pvid','horizon','disabled'],
      canToggle: true,
      fields: [
        { key: 'bridge',    label: 'Bridge', required: true, placeholder: 'bridge-lan' },
        { key: 'interface', label: 'Інтерфейс', required: true, placeholder: 'ether2' },
        { key: 'pvid',      label: 'PVID (для VLAN)', placeholder: '1' },
        { key: 'disabled',  label: 'Вимкнено', type: 'checkbox' },
      ],
      addTitle:  '➕ Додати Bridge Port',
      editTitle: '✏️ Bridge Port',
    });
  };

  /* ══════════════════════════════════════════════════════════
     ОНОВЛЕНИЙ MENU з CRUD — патчимо router-manager.js MENU
     ══════════════════════════════════════════════════════════ */
  function patchRouterManagerMenu() {
    if (!window.RouterManager) {
      setTimeout(patchRouterManagerMenu, 500);
      return;
    }

    /* Експозуємо state */
    window.RouterManager._state = window.__rmState;

    /* Перехоплюємо renderContent */
    var origRender = window.RouterManager._renderContent;

    /* Патчимо через глобальний renderContent */
    var origWindow = window.renderTableCRUD;

    console.log('[CRUD] Патч Router Manager застосовано!');
  }

  /* ══════════════════════════════════════════════════════════
     УТИЛІТИ
     ══════════════════════════════════════════════════════════ */
  function esc(s) {
    return String(s || '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  /* ══════════════════════════════════════════════════════════
     ІНІЦІАЛІЗАЦІЯ
     ══════════════════════════════════════════════════════════ */
  injectCrudStyles();
  patchRouterManagerMenu();

  console.log('[RouterManager CRUD] завантажено — повне редагування активовано');

})();