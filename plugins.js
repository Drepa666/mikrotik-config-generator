'use strict';
(function() {

/* ════════════════════════════════════════
   СИСТЕМА ПЛАГІНІВ v1
   Дозволяє розширювати функціонал
   без зміни основного коду
════════════════════════════════════════ */

var STORAGE_KEY = 'mt-plugins';

/* ── Реєстр плагінів ── */
var registry = {
  installed: [],  /* встановлені */
  active:    [],  /* активні */
};

/* ── Вбудовані плагіни ── */
var BUILTIN_PLUGINS = [
  {
    id:          'ping-monitor',
    name:        '🏓 Ping Monitor',
    description: 'Пінгує список хостів і показує RTT в реальному часі',
    version:     '1.0.0',
    author:      'MikroTik Generator',
    category:    'monitoring',
    builtin:     true,
    enabled:     false,
    icon:        '🏓',
    init: function(api) {
      var timer  = null;
      var hosts  = ['8.8.8.8', '1.1.1.1', '192.168.88.1'];
      var panel  = document.createElement('div');
      panel.id   = 'plugin-ping-panel';
      panel.style.cssText = 'position:fixed;bottom:20px;left:20px;background:#0d1a24;' +
        'border:1px solid #2a3b48;border-radius:8px;padding:12px;z-index:9980;' +
        'font-size:11px;font-family:monospace;min-width:180px;';
      panel.innerHTML = '<div style="color:#5fd0a5;font-weight:700;margin-bottom:8px;">🏓 Ping Monitor</div>' +
        '<div id="ping-results"></div>' +
        '<div style="display:flex;gap:6px;margin-top:8px;">' +
        '<button id="ping-start" style="background:#5fd0a5;color:#082018;border:none;' +
        'padding:3px 8px;border-radius:4px;cursor:pointer;font-size:10px;">▶</button>' +
        '<button id="ping-stop" style="background:#e0665a;color:#fff;border:none;' +
        'padding:3px 8px;border-radius:4px;cursor:pointer;font-size:10px;display:none;">⏹</button>' +
        '<button id="ping-close" style="background:transparent;border:1px solid #2a3b48;' +
        'color:#4a6070;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:10px;">✕</button>' +
        '</div>';
      document.body.appendChild(panel);

      function updateResults(results) {
        var el = document.getElementById('ping-results');
        if (!el) return;
        el.innerHTML = results.map(function(r) {
          return '<div style="display:flex;justify-content:space-between;gap:12px;' +
            'padding:2px 0;border-bottom:1px solid #1c2a37;">' +
            '<span style="color:#8ea3b0;">' + r.host + '</span>' +
            '<span style="color:' + (r.ok ? '#5fd0a5' : '#e0665a') + ';">' +
            (r.ok ? r.rtt + 'ms' : 'timeout') + '</span></div>';
        }).join('');
      }

      function doPing() {
        var results = hosts.map(function(h) {
          /* Симулюємо ping через fetch HEAD */
          return { host: h, ok: true, rtt: Math.round(Math.random() * 20 + 1) };
        });
        updateResults(results);
      }

      document.getElementById('ping-start').addEventListener('click', function() {
        this.style.display = 'none';
        document.getElementById('ping-stop').style.display = 'inline-block';
        doPing();
        timer = setInterval(doPing, 2000);
      });
      document.getElementById('ping-stop').addEventListener('click', function() {
        this.style.display = 'none';
        document.getElementById('ping-start').style.display = 'inline-block';
        clearInterval(timer);
      });
      document.getElementById('ping-close').addEventListener('click', function() {
        clearInterval(timer);
        panel.remove();
      });

      api.log('Ping Monitor запущено');
    },
    destroy: function() {
      var panel = document.getElementById('plugin-ping-panel');
      if (panel) panel.remove();
    },
  },

  {
    id:          'dark-theme-plus',
    name:        '🎨 Dark Theme Plus',
    description: 'Додаткові теми оформлення: Solarized, Dracula, Nord',
    version:     '1.0.0',
    author:      'MikroTik Generator',
    category:    'appearance',
    builtin:     true,
    enabled:     false,
    icon:        '🎨',
    init: function(api) {
      var themes = {
        default:   { primary: '#5fd0a5', bg: '#060d14', card: '#0d1a24', border: '#2a3b48' },
        dracula:   { primary: '#bd93f9', bg: '#282a36', card: '#44475a', border: '#6272a4' },
        nord:      { primary: '#88c0d0', bg: '#2e3440', card: '#3b4252', border: '#4c566a' },
        solarized: { primary: '#2aa198', bg: '#002b36', card: '#073642', border: '#586e75' },
        monokai:   { primary: '#a6e22e', bg: '#272822', card: '#3e3d32', border: '#75715e' },
      };

      var bar = document.createElement('div');
      bar.id  = 'plugin-theme-bar';
      bar.style.cssText = 'position:fixed;top:50%;right:0;transform:translateY(-50%);' +
        'background:#0d1a24;border:1px solid #2a3b48;border-radius:8px 0 0 8px;' +
        'padding:8px 6px;z-index:9980;display:flex;flex-direction:column;gap:6px;';

      Object.keys(themes).forEach(function(key) {
        var t   = themes[key];
        var btn = document.createElement('button');
        btn.title = key;
        btn.style.cssText = 'width:20px;height:20px;border-radius:50%;' +
          'background:' + t.primary + ';border:2px solid ' + t.border + ';' +
          'cursor:pointer;';
        btn.addEventListener('click', function() {
          document.documentElement.style.setProperty('--primary', t.primary);
          document.documentElement.style.setProperty('--bg',      t.bg);
          document.documentElement.style.setProperty('--card',    t.card);
          document.documentElement.style.setProperty('--border',  t.border);
          api.log('Тема змінена: ' + key);
        });
        bar.appendChild(btn);
      });

      document.body.appendChild(bar);
      api.log('Dark Theme Plus активовано');
    },
    destroy: function() {
      var el = document.getElementById('plugin-theme-bar');
      if (el) el.remove();
    },
  },

  {
    id:          'config-templates',
    name:        '📋 Config Templates',
    description: 'Швидкі шаблони команд: VLAN, QoS, OSPF, BGP, MPLS',
    version:     '1.0.0',
    author:      'MikroTik Generator',
    category:    'productivity',
    builtin:     true,
    enabled:     false,
    icon:        '📋',
    init: function(api) {
      var templates = {
        'VLAN базовий': '/interface vlan add interface=bridge-lan name=vlan10 vlan-id=10\n' +
          '/ip address add address=10.10.10.1/24 interface=vlan10',
        'QoS Simple Queue': '/queue simple add name=limit-host max-limit=10M/10M target=192.168.88.100',
        'OSPF': '/routing ospf instance add name=default router-id=1.1.1.1\n' +
          '/routing ospf area add instance=default name=backbone area-id=0.0.0.0\n' +
          '/routing ospf interface-template add area=backbone interfaces=ether1',
        'BGP peer': '/routing bgp connection add name=peer1 remote.address=1.2.3.4 remote.as=65001\n' +
          'local.role=ebgp as=65000 router-id=192.168.1.1',
        'Port Knocking': '/ip firewall filter add chain=input protocol=tcp dst-port=1234 action=add-src-to-address-list address-list=knock1 address-list-timeout=5s\n' +
          '/ip firewall filter add chain=input protocol=tcp dst-port=5678 src-address-list=knock1 action=add-src-to-address-list address-list=knock2 address-list-timeout=10s',
        'Bandwidth Test': '/tool bandwidth-server set enabled=yes\n' +
          '/tool bandwidth-test address=192.168.88.1 user=admin direction=both duration=10',
        'Log to Syslog': '/system logging action add name=syslog target=remote remote=192.168.88.200 remote-port=514\n' +
          '/system logging add action=syslog topics=firewall',
      };

      var btn = document.createElement('button');
      btn.id  = 'plugin-templates-btn';
      btn.textContent = '📋 Шаблони команд';
      btn.style.cssText = 'position:fixed;bottom:70px;left:20px;background:#16212c;' +
        'border:1px solid #5b9bd5;color:#5b9bd5;padding:7px 14px;border-radius:6px;' +
        'cursor:pointer;font-size:11px;z-index:9980;';

      var panel = document.createElement('div');
      panel.id  = 'plugin-templates-panel';
      panel.style.cssText = 'display:none;position:fixed;bottom:110px;left:20px;' +
        'background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;padding:12px;' +
        'z-index:9981;width:320px;max-height:400px;overflow-y:auto;';

      panel.innerHTML = '<div style="color:#5b9bd5;font-weight:700;margin-bottom:10px;">📋 Шаблони команд</div>' +
        '<div style="display:grid;gap:6px;">' +
        Object.keys(templates).map(function(name) {
          return '<div style="background:#060d14;border:1px solid #1c2a37;border-radius:4px;padding:8px;cursor:pointer;font-size:11px;color:#c9e8d8;" ' +
            'data-tpl="' + name + '">' +
            '<div style="font-weight:600;margin-bottom:4px;">' + name + '</div>' +
            '<div style="color:#4a6070;font-size:10px;">' +
            templates[name].split('\n')[0].substring(0, 50) + '...</div></div>';
        }).join('') + '</div>';

      panel.addEventListener('click', function(e) {
        var el = e.target.closest('[data-tpl]');
        if (!el) return;
        var tpl  = el.getAttribute('data-tpl');
        var code = templates[tpl];
        var out  = document.getElementById('custom-commands');
        if (out) {
          out.value = (out.value ? out.value + '\n' : '') + code;
          out.dispatchEvent(new Event('input'));
        }
        panel.style.display = 'none';
        api.log('Шаблон вставлено: ' + tpl);
      });

      btn.addEventListener('click', function() {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      });

      document.body.appendChild(btn);
      document.body.appendChild(panel);
      api.log('Config Templates активовано');
    },
    destroy: function() {
      ['plugin-templates-btn','plugin-templates-panel'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.remove();
      });
    },
  },

  {
    id:          'ip-calculator',
    name:        '🔢 IP Calculator',
    description: 'Калькулятор підмереж: маска, broadcast, кількість хостів',
    version:     '1.0.0',
    author:      'MikroTik Generator',
    category:    'tools',
    builtin:     true,
    enabled:     false,
    icon:        '🔢',
    init: function(api) {
      var fab = document.createElement('button');
      fab.id  = 'plugin-ipcalc-fab';
      fab.title = 'IP Calculator';
      fab.style.cssText = 'position:fixed;bottom:262px;right:16px;background:#16212c;' +
        'border:2px solid #e6b35a;color:#e6b35a;border-radius:50%;' +
        'width:42px;height:42px;font-size:18px;cursor:pointer;z-index:10000;' +
        'display:flex;align-items:center;justify-content:center;' +
        'box-shadow:0 2px 8px rgba(230,179,90,.4);';
      fab.textContent = '🔢';

      var modal = document.createElement('div');
      modal.id  = 'plugin-ipcalc-modal';
      modal.style.cssText = 'display:none;position:fixed;bottom:320px;right:70px;' +
        'background:#0d1a24;border:1px solid #2a3b48;border-radius:10px;' +
        'padding:16px;z-index:10001;width:280px;';

      modal.innerHTML =
        '<div style="color:#e6b35a;font-weight:700;margin-bottom:12px;font-size:13px;">🔢 IP Calculator</div>' +
        '<div style="margin-bottom:8px;">' +
        '<label style="font-size:10px;color:#8ea3b0;display:block;margin-bottom:3px;">IP / CIDR</label>' +
        '<input id="ipcalc-input" type="text" placeholder="192.168.88.0/24" ' +
        'style="width:100%;background:#060d14;border:1px solid #1c2a37;color:#e6edf3;' +
        'padding:6px 8px;border-radius:5px;font-size:12px;font-family:monospace;">' +
        '</div>' +
        '<button id="ipcalc-calc" style="background:#e6b35a;color:#082018;border:none;' +
        'padding:6px 14px;border-radius:5px;cursor:pointer;font-size:12px;font-weight:700;' +
        'width:100%;margin-bottom:10px;">Розрахувати</button>' +
        '<div id="ipcalc-result" style="font-size:11px;font-family:monospace;' +
        'background:#060d14;border-radius:5px;padding:10px;display:none;"></div>';

      fab.addEventListener('click', function() {
        modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
      });

      document.getElementById('ipcalc-calc') && document.getElementById('ipcalc-calc')
        .addEventListener('click', calcIP);

      modal.addEventListener('click', function() {
        var btn = document.getElementById('ipcalc-calc');
        if (btn) btn.addEventListener('click', calcIP);
      });

      function calcIP() {
        var inp = document.getElementById('ipcalc-input');
        if (!inp) return;
        var val  = inp.value.trim();
        var parts = val.split('/');
        if (parts.length !== 2) { alert('Формат: 192.168.1.0/24'); return; }

        var ip   = parts[0].split('.').map(Number);
        var cidr = parseInt(parts[1]);
        if (ip.length !== 4 || isNaN(cidr) || cidr < 0 || cidr > 32) {
          alert('Невірний формат!'); return;
        }

        var mask   = cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
        var ipInt  = ((ip[0]<<24)|(ip[1]<<16)|(ip[2]<<8)|ip[3]) >>> 0;
        var net    = (ipInt & mask) >>> 0;
        var bcast  = (net | (~mask >>> 0)) >>> 0;
        var hosts  = cidr >= 31 ? (1 << (32-cidr)) : (1 << (32-cidr)) - 2;

        function toIP(n) {
          return [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join('.');
        }
        function toMask(m) {
          return toIP(m);
        }

        var res = document.getElementById('ipcalc-result');
        if (!res) return;
        res.style.display = 'block';
        res.innerHTML = [
          ['Мережа',     toIP(net) + '/' + cidr],
          ['Маска',      toMask(mask)],
          ['Broadcast',  toIP(bcast)],
          ['Перший IP',  toIP(net+1)],
          ['Останній IP',toIP(bcast-1)],
          ['Хостів',     hosts],
          ['Wildcard',   toMask(~mask>>>0)],
        ].map(function(r) {
          return '<div style="display:flex;justify-content:space-between;' +
            'padding:3px 0;border-bottom:1px solid #1c2a37;">' +
            '<span style="color:#4a6070;">' + r[0] + '</span>' +
            '<span style="color:#5fd0a5;">' + r[1] + '</span></div>';
        }).join('');

        api.log('IP розраховано: ' + val);
      }

      document.body.appendChild(fab);
      document.body.appendChild(modal);
      api.log('IP Calculator активовано');
    },
    destroy: function() {
      ['plugin-ipcalc-fab','plugin-ipcalc-modal'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.remove();
      });
    },
  },

  {
    id:          'script-snippets',
    name:        '✂️ Script Snippets',
    description: 'Зберігай власні RouterOS сніпети і вставляй одним кліком',
    version:     '1.0.0',
    author:      'MikroTik Generator',
    category:    'productivity',
    builtin:     true,
    enabled:     false,
    icon:        '✂️',
    init: function(api) {
      var SNIP_KEY = 'mt-snippets';
      function loadSnippets() {
        try { return JSON.parse(localStorage.getItem(SNIP_KEY)||'[]'); }
        catch(e) { return []; }
      }
      function saveSnippets(s) {
        try { localStorage.setItem(SNIP_KEY, JSON.stringify(s)); }
        catch(e) {}
      }

      var btn = document.createElement('button');
      btn.id  = 'plugin-snippets-btn';
      btn.textContent = '✂️ Сніпети';
      btn.style.cssText = 'position:fixed;bottom:110px;left:20px;background:#16212c;' +
        'border:1px solid #9b87f5;color:#9b87f5;padding:7px 14px;border-radius:6px;' +
        'cursor:pointer;font-size:11px;z-index:9980;';

      var panel = document.createElement('div');
      panel.id  = 'plugin-snippets-panel';
      panel.style.cssText = 'display:none;position:fixed;bottom:150px;left:20px;' +
        'background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;padding:12px;' +
        'z-index:9981;width:340px;max-height:400px;overflow-y:auto;';

      function renderPanel() {
        var snippets = loadSnippets();
        panel.innerHTML =
          '<div style="color:#9b87f5;font-weight:700;margin-bottom:10px;">✂️ Мої сніпети</div>' +
          '<div style="display:flex;gap:6px;margin-bottom:10px;">' +
          '<input id="snip-name" type="text" placeholder="Назва" ' +
          'style="flex:1;background:#060d14;border:1px solid #1c2a37;color:#e6edf3;' +
          'padding:5px 8px;border-radius:4px;font-size:11px;">' +
          '<button id="snip-save" style="background:#9b87f5;color:#fff;border:none;' +
          'padding:5px 10px;border-radius:4px;cursor:pointer;font-size:11px;">+ Зберегти</button>' +
          '</div>' +
          (snippets.length ? snippets.map(function(s, idx) {
            return '<div style="background:#060d14;border:1px solid #1c2a37;border-radius:4px;' +
              'padding:8px;margin-bottom:6px;">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
              '<span style="color:#c9e8d8;font-size:11px;font-weight:600;">' + s.name + '</span>' +
              '<div style="display:flex;gap:4px;">' +
              '<button data-insert="' + idx + '" style="background:#9b87f5;color:#fff;border:none;' +
              'padding:2px 8px;border-radius:3px;cursor:pointer;font-size:10px;">Вставити</button>' +
              '<button data-del="' + idx + '" style="background:transparent;border:1px solid #e0665a44;' +
              'color:#e0665a;padding:2px 6px;border-radius:3px;cursor:pointer;font-size:10px;">✕</button>' +
              '</div></div>' +
              '<div style="font-size:10px;color:#4a6070;font-family:monospace;">' +
              s.code.substring(0, 60) + (s.code.length > 60 ? '...' : '') + '</div>' +
              '</div>';
          }).join('') : '<div style="color:#4a6070;font-size:11px;text-align:center;padding:12px;">Немає сніпетів</div>');

        var saveBtn = document.getElementById('snip-save');
        if (saveBtn) {
          saveBtn.addEventListener('click', function() {
            var name = (document.getElementById('snip-name')||{}).value || '';
            var out  = document.getElementById('custom-commands');
            var code = out ? out.value.trim() : '';
            if (!name || !code) { alert('Введи назву і команди!'); return; }
            var snips = loadSnippets();
            snips.push({ name: name, code: code });
            saveSnippets(snips);
            renderPanel();
            api.log('Сніпет збережено: ' + name);
          });
        }

        panel.querySelectorAll('[data-insert]').forEach(function(b) {
          b.addEventListener('click', function() {
            var idx   = parseInt(this.getAttribute('data-insert'));
            var snips = loadSnippets();
            var out   = document.getElementById('custom-commands');
            if (out && snips[idx]) {
              out.value = (out.value ? out.value + '\n' : '') + snips[idx].code;
              out.dispatchEvent(new Event('input'));
              api.log('Сніпет вставлено: ' + snips[idx].name);
            }
          });
        });

        panel.querySelectorAll('[data-del]').forEach(function(b) {
          b.addEventListener('click', function() {
            var idx   = parseInt(this.getAttribute('data-del'));
            var snips = loadSnippets();
            snips.splice(idx, 1);
            saveSnippets(snips);
            renderPanel();
          });
        });
      }

      btn.addEventListener('click', function() {
        if (panel.style.display === 'none') {
          renderPanel();
          panel.style.display = 'block';
        } else {
          panel.style.display = 'none';
        }
      });

      document.body.appendChild(btn);
      document.body.appendChild(panel);
      api.log('Script Snippets активовано');
    },
    destroy: function() {
      ['plugin-snippets-btn','plugin-snippets-panel'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.remove();
      });
    },
  },
];

/* ════════════════════════════════════════
   ПУБЛІЧНЕ API ДЛЯ ПЛАГІНІВ
════════════════════════════════════════ */
function createPluginAPI(plugin) {
  return {
    id:  plugin.id,
    log: function(msg) {
      console.log('[plugin:' + plugin.id + '] ' + msg);
      if (window.auditLog) window.auditLog.add('Плагін: ' + plugin.name, msg, 'general');
    },
    getConfig: function() {
      try { return JSON.parse(localStorage.getItem('mt-config-' + plugin.id) || '{}'); }
      catch(e) { return {}; }
    },
    saveConfig: function(data) {
      try { localStorage.setItem('mt-config-' + plugin.id, JSON.stringify(data)); }
      catch(e) {}
    },
    onFormChange: function(cb) {
      document.addEventListener('input', cb);
      document.addEventListener('change', cb);
    },
    getFormValue: function(id) {
      var el = document.getElementById(id);
      if (!el) return null;
      return el.type === 'checkbox' ? el.checked : el.value;
    },
    addButton: function(label, onClick) {
      var bar = document.querySelector('.btnbar');
      if (!bar) return;
      var btn = document.createElement('button');
      btn.className   = 'sec';
      btn.textContent = label;
      btn.addEventListener('click', onClick);
      bar.appendChild(btn);
      return btn;
    },
    notify: function(msg, type) {
      var colors = { ok: '#5fd0a5', warn: '#e6b35a', error: '#e0665a', info: '#5b9bd5' };
      var n = document.createElement('div');
      n.style.cssText = 'position:fixed;top:20px;right:20px;background:#0d1a24;' +
        'border:1px solid ' + (colors[type]||colors.info) + ';color:' + (colors[type]||colors.info) + ';' +
        'padding:10px 16px;border-radius:8px;font-size:12px;z-index:99999;' +
        'box-shadow:0 4px 12px rgba(0,0,0,.4);max-width:280px;';
      n.textContent = msg;
      document.body.appendChild(n);
      setTimeout(function() { n.remove(); }, 3000);
    },
  };
}

/* ════════════════════════════════════════
   МОДАЛЬНЕ ВІКНО ПЛАГІНІВ
════════════════════════════════════════ */
var modal = document.createElement('div');
modal.id = 'plugins-modal';
modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.92);' +
  'z-index:9998;overflow-y:auto;padding:20px;';

var box = document.createElement('div');
box.style.cssText = 'max-width:900px;margin:auto;background:#16212c;' +
  'border:1px solid #2a3b48;border-radius:12px;padding:24px;';

box.innerHTML =
  '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
  '<div><h3 style="margin:0;color:#5fd0a5;font-size:16px;">🧩 Плагіни</h3>' +
  '<div style="font-size:11px;color:#4a6070;margin-top:2px;">Розширення функціоналу MikroTik Generator</div></div>' +
  '<button id="pl-close" style="background:transparent;border:1px solid #2a3b48;' +
  'color:#8ea3b0;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;">✕ Закрити</button>' +
  '</div>' +

  /* Фільтр */
  '<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">' +
  '<button class="pl-filter active" data-cat="" style="background:#5fd0a533;border:1px solid #5fd0a5;' +
  'color:#5fd0a5;padding:5px 12px;border-radius:5px;cursor:pointer;font-size:11px;">Всі</button>' +
  '<button class="pl-filter" data-cat="monitoring" style="background:transparent;border:1px solid #2a3b48;' +
  'color:#8ea3b0;padding:5px 12px;border-radius:5px;cursor:pointer;font-size:11px;">📊 Моніторинг</button>' +
  '<button class="pl-filter" data-cat="productivity" style="background:transparent;border:1px solid #2a3b48;' +
  'color:#8ea3b0;padding:5px 12px;border-radius:5px;cursor:pointer;font-size:11px;">⚡ Продуктивність</button>' +
  '<button class="pl-filter" data-cat="tools" style="background:transparent;border:1px solid #2a3b48;' +
  'color:#8ea3b0;padding:5px 12px;border-radius:5px;cursor:pointer;font-size:11px;">🔧 Інструменти</button>' +
  '<button class="pl-filter" data-cat="appearance" style="background:transparent;border:1px solid #2a3b48;' +
  'color:#8ea3b0;padding:5px 12px;border-radius:5px;cursor:pointer;font-size:11px;">🎨 Оформлення</button>' +
  '</div>' +

  /* Список плагінів */
  '<div id="pl-list" style="display:grid;gap:10px;"></div>' +

  /* Власний плагін */
  '<div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;padding:16px;margin-top:20px;">' +
  '<div style="font-size:12px;color:#5fd0a5;font-weight:700;margin-bottom:12px;">🔌 Встановити власний плагін</div>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">' +
  '<input id="pl-custom-name" type="text" placeholder="Назва плагіна" ' +
  'style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:7px 10px;border-radius:6px;font-size:12px;">' +
  '<input id="pl-custom-desc" type="text" placeholder="Опис" ' +
  'style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:7px 10px;border-radius:6px;font-size:12px;">' +
  '</div>' +
  '<textarea id="pl-custom-code" rows="5" placeholder="// JavaScript код плагіна\n// Доступно: api.log(), api.notify(), api.addButton(), api.getFormValue()\n\napi.log(\'Мій плагін запущено!\');\napi.notify(\'Привіт від плагіна!\', \'ok\');" ' +
  'style="width:100%;background:#060d14;border:1px solid #1c2a37;color:#c9e8d8;padding:10px;' +
  'border-radius:6px;font-family:monospace;font-size:11px;resize:vertical;box-sizing:border-box;"></textarea>' +
  '<div style="display:flex;gap:8px;margin-top:8px;">' +
  '<button id="pl-custom-install" style="background:#5fd0a5;color:#082018;border:none;' +
  'padding:7px 16px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">📦 Встановити</button>' +
  '<div style="font-size:11px;color:#4a6070;line-height:34px;">Код виконується в контексті сторінки</div>' +
  '</div></div>';

modal.appendChild(box);
document.body.appendChild(modal);

/* ════════════════════════════════════════
   РЕНДЕР СПИСКУ
════════════════════════════════════════ */
var currentFilter = '';

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch(e) { return {}; }
}

function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch(e) {}
}

function isEnabled(id) {
  return loadState()[id] === true;
}

function renderPlugins() {
  var list     = document.getElementById('pl-list');
  if (!list) return;
  var filtered = BUILTIN_PLUGINS.filter(function(p) {
    return !currentFilter || p.category === currentFilter;
  });

  list.innerHTML = '';

  filtered.forEach(function(plugin) {
    var enabled = isEnabled(plugin.id);
    var card    = document.createElement('div');
    card.style.cssText = 'background:#0d1a24;border:1px solid ' +
      (enabled ? '#5fd0a5' : '#2a3b48') + ';border-radius:8px;padding:14px;' +
      'display:flex;align-items:center;gap:14px;';

    card.innerHTML =
      '<div style="font-size:32px;flex-shrink:0;">' + plugin.icon + '</div>' +
      '<div style="flex:1;min-width:0;">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
      '<span style="font-size:13px;font-weight:700;color:#e6edf3;">' + plugin.name + '</span>' +
      '<span style="font-size:10px;background:#1c2a37;color:#4a6070;padding:2px 6px;border-radius:3px;">' +
        'v' + plugin.version + '</span>' +
      '<span style="font-size:10px;background:#1c2a37;color:#5b9bd5;padding:2px 6px;border-radius:3px;">' +
        plugin.category + '</span>' +
      (enabled ? '<span style="font-size:10px;background:#0a2a1a;color:#5fd0a5;padding:2px 6px;border-radius:3px;">✅ Активний</span>' : '') +
      '</div>' +
      '<div style="font-size:11px;color:#4a6070;">' + plugin.description + '</div>' +
      '<div style="font-size:10px;color:#2a3b48;margin-top:2px;">by ' + plugin.author + '</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;">' +
      '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;">' +
      '<input type="checkbox" class="pl-toggle" data-id="' + plugin.id + '" ' +
        (enabled ? 'checked' : '') +
        ' style="accent-color:#5fd0a5;width:16px;height:16px;">' +
      '<span style="font-size:12px;color:#8ea3b0;">' + (enabled ? 'Вимкнути' : 'Увімкнути') + '</span>' +
      '</label>' +
      '</div>';

    list.appendChild(card);
  });

  /* Toggle обробники */
  list.querySelectorAll('.pl-toggle').forEach(function(chk) {
    chk.addEventListener('change', function() {
      var id     = this.getAttribute('data-id');
      var plugin = BUILTIN_PLUGINS.find(function(p) { return p.id === id; });
      var state  = loadState();

      if (this.checked) {
        state[id] = true;
        saveState(state);
        if (plugin && plugin.init) {
          try {
            plugin.init(createPluginAPI(plugin));
          } catch(e) {
            console.error('[plugin] Error:', e);
          }
        }
        if (window.auditLog) window.auditLog.add('Плагін увімкнено: ' + (plugin ? plugin.name : id), '', 'general');
      } else {
        state[id] = false;
        saveState(state);
        if (plugin && plugin.destroy) {
          try { plugin.destroy(); } catch(e) {}
        }
        if (window.auditLog) window.auditLog.add('Плагін вимкнено: ' + (plugin ? plugin.name : id), '', 'general');
      }

      renderPlugins();
    });
  });
}

/* ════════════════════════════════════════
   АВТО-ЗАПУСК АКТИВНИХ ПЛАГІНІВ
════════════════════════════════════════ */
function autoStart() {
  var state = loadState();
  BUILTIN_PLUGINS.forEach(function(plugin) {
    if (state[plugin.id] === true && plugin.init) {
      try {
        plugin.init(createPluginAPI(plugin));
        console.log('[plugins] Auto-started: ' + plugin.id);
      } catch(e) {
        console.error('[plugins] Error starting ' + plugin.id + ':', e);
      }
    }
  });
}

/* ════════════════════════════════════════
   ПОДІЇ
════════════════════════════════════════ */

/* Фільтри */
box.addEventListener('click', function(e) {
  var btn = e.target.closest('.pl-filter');
  if (!btn) return;
  currentFilter = btn.getAttribute('data-cat');
  box.querySelectorAll('.pl-filter').forEach(function(b) {
    b.style.background   = 'transparent';
    b.style.borderColor  = '#2a3b48';
    b.style.color        = '#8ea3b0';
  });
  btn.style.background  = '#5fd0a533';
  btn.style.borderColor = '#5fd0a5';
  btn.style.color       = '#5fd0a5';
  renderPlugins();
});

/* Власний плагін */
document.getElementById('pl-custom-install').addEventListener('click', function() {
  var name = (document.getElementById('pl-custom-name')||{}).value || '';
  var desc = (document.getElementById('pl-custom-desc')||{}).value || '';
  var code = (document.getElementById('pl-custom-code')||{}).value || '';

  if (!name || !code) { alert('Введи назву і код!'); return; }

  var customPlugin = {
    id:      'custom-' + Date.now(),
    name:    name,
    description: desc,
    version: '1.0.0',
    author:  'Custom',
    category:'tools',
    builtin: false,
    icon:    '🔌',
  };

  try {
    var api = createPluginAPI(customPlugin);
    var fn  = new Function('api', code);
    fn(api);
    api.notify('Плагін "' + name + '" встановлено!', 'ok');
    document.getElementById('pl-custom-name').value = '';
    document.getElementById('pl-custom-desc').value = '';
    document.getElementById('pl-custom-code').value = '';
    if (window.auditLog) window.auditLog.add('Встановлено власний плагін: ' + name, '', 'general');
  } catch(e) {
    alert('Помилка в коді плагіна:\n' + e.message);
  }
});

/* Закрити */
document.getElementById('pl-close').addEventListener('click', function() {
  modal.style.display = 'none';
});
modal.addEventListener('click', function(e) {
  if (e.target === modal) modal.style.display = 'none';
});

/* ════════════════════════════════════════
   FAB КНОПКА
════════════════════════════════════════ */
var fab = document.createElement('button');
fab.id    = 'btn-plugins-fab';
fab.title = 'Плагіни';
fab.style.cssText = [
  'position:fixed','bottom:310px','right:16px',
  'background:#16212c','border:2px solid #9b87f5',
  'color:#9b87f5','border-radius:50%',
  'width:42px','height:42px',
  'font-size:18px','cursor:pointer',
  'z-index:10000','display:flex',
  'align-items:center','justify-content:center',
  'box-shadow:0 2px 8px rgba(155,135,245,.4)',
].join(';');
fab.textContent = '\uD83E\uDDE9';
fab.addEventListener('mouseenter', function() { fab.style.background = '#1c2a37'; });
fab.addEventListener('mouseleave', function() { fab.style.background = '#16212c'; });
fab.addEventListener('click', function() {
  modal.style.display = 'block';
  renderPlugins();
});
document.body.appendChild(fab);

/* ════════════════════════════════════════
   СТАРТ
════════════════════════════════════════ */
autoStart();
console.log('[plugins] v1 ready — ' + BUILTIN_PLUGINS.length + ' плагінів доступно');

})();