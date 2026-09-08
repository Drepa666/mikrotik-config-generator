'use strict';

/* ============================================================
   RouterOS TAB Completion — як у Winbox/CLI
   ============================================================ */

(function() {

  /* ── Повне дерево команд RouterOS ── */
  var ROS_TREE = {
    '/ip': {
      'address':  ['print','add','remove','set','get','export'],
      'route':    ['print','add','remove','set','check-gateway','export'],
      'dns':      ['print','set','flush-cache','static print','static add','static remove','export'],
      'dhcp-server': ['print','add','remove','set','enable','disable',
        'lease print','lease add','lease remove','lease make-static','export'],
      'dhcp-client': ['print','add','remove','release','renew','export'],
      'firewall': {
        'filter':  ['print','add','remove','set','move','enable','disable','export'],
        'nat':     ['print','add','remove','set','move','enable','disable','export'],
        'mangle':  ['print','add','remove','set','move','enable','disable','export'],
        'address-list': ['print','add','remove','set','export'],
        'connection': ['print','tracking print'],
        'service-port': ['print','set','enable','disable'],
      },
      'neighbor':    ['print','discover'],
      'pool':        ['print','add','remove','set','used','export'],
      'service':     ['print','set','enable','disable','export'],
      'settings':    ['print','set','export'],
      'arp':         ['print','add','remove','set','export'],
      'hotspot':     ['print','add','remove','host print','user print','active print'],
      'proxy':       ['print','set','access print','access add','export'],
      'upnp':        ['print','set','interfaces print','interfaces add','export'],
      'vrf':         ['print','add','remove','set','export'],
      'cloud':       ['print','set','force-update','export'],
    },
    '/interface': {
      'print':     [],
      'set':       [],
      'enable':    [],
      'disable':   [],
      'monitor-traffic': [],
      'bridge':    ['print','add','remove','set','port print','port add','port remove','filter print','host print','export'],
      'vlan':      ['print','add','remove','set','export'],
      'wireless':  ['print','set','enable','disable','scan','registration-table print','access-list print','export'],
      'ethernet':  ['print','set','export'],
      'pppoe-client': ['print','add','remove','set','enable','disable','export'],
      'lte':       ['print','set','info','cell-monitor','apn print','apn add','export'],
      'wireguard': ['print','add','remove','set','peers print','peers add','peers remove','export'],
      'ovpn-client': ['print','add','remove','set','enable','disable','export'],
      'ovpn-server': ['print','set','enable','disable','export'],
      'eoip':      ['print','add','remove','set','export'],
      'gre':       ['print','add','remove','set','export'],
      'ipip':      ['print','add','remove','set','export'],
      'sstp-client': ['print','add','remove','set','export'],
      'l2tp-client': ['print','add','remove','set','export'],
      'bonding':   ['print','add','remove','set','export'],
    },
    '/system': {
      'identity':  ['print','set'],
      'resource':  ['print','cpu print','irq print'],
      'clock':     ['print','set'],
      'ntp':       ['client print','client set','server print'],
      'scheduler': ['print','add','remove','set','enable','disable','export'],
      'script':    ['print','add','remove','set','run','export'],
      'logging':   ['print','add','remove','set','action print','export'],
      'package':   ['print','update','install','uninstall'],
      'backup':    ['save','load','print'],
      'reboot':    [],
      'shutdown':  [],
      'reset-configuration': [],
      'watchdog':  ['print','set'],
      'health':    ['print','set'],
      'history':   ['print'],
      'users':     ['print'],
      'note':      ['print','set'],
    },
    '/tool': {
      'bandwidth-test': [],
      'torch':          [],
      'ping':           [],
      'traceroute':     [],
      'netwatch':       ['print','add','remove','set','enable','disable','export'],
      'graphing':       ['interface print','resource print','queue print'],
      'romon':          ['print','set','neighbor print'],
      'traffic-generator': [],
      'profile':        ['print'],
      'mac-server':     ['print','set','mac-winbox print'],
      'sniffer':        ['start','stop','print','packet print'],
      'e-mail':         ['print','set','send'],
      'sms':            ['set','send'],
    },
    '/routing': {
      'ospf':      ['instance print','area print','neighbor print','route print'],
      'bgp':       ['instance print','peer print','vpls print','advertisement print'],
      'rip':       ['instance print','neighbor print'],
      'filter':    ['print','add','remove','set','export'],
      'table':     ['print','add','remove'],
      'rule':      ['print','add','remove','set','export'],
    },
    '/queue': {
      'simple':    ['print','add','remove','set','enable','disable','export'],
      'tree':      ['print','add','remove','set','enable','disable','export'],
      'type':      ['print','add','remove','set','export'],
    },
    '/user': {
      'print':  [],
      'add':    [],
      'remove': [],
      'set':    [],
      'group':  ['print','add','remove','set'],
      'active': ['print'],
      'export': [],
    },
    '/certificate': {
      'print':   [],
      'add':     [],
      'remove':  [],
      'import':  [],
      'export-certificate': [],
      'sign':    [],
      'scep-server': ['print','set'],
    },
    '/ppp': {
      'profile':  ['print','add','remove','set','export'],
      'secret':   ['print','add','remove','set','export'],
      'active':   ['print'],
    },
    '/mpls': {
      'ldp':     ['print','set','interface print','neighbor print'],
      'traffic-eng': ['print','set','tunnel print'],
      'forwarding-table': ['print'],
    },
    '/ipv6': {
      'address':  ['print','add','remove','set','export'],
      'route':    ['print','add','remove','set','export'],
      'firewall': {
        'filter': ['print','add','remove','set','export'],
        'nat':    ['print','add','remove','set','export'],
        'mangle': ['print','add','remove','set','export'],
      },
      'dhcp-client': ['print','add','remove','set','export'],
      'dhcp-server': ['print','add','remove','set','export'],
      'neighbor':    ['print'],
      'settings':    ['print','set'],
    },
    '/log':    ['print','action print'],
    '/radius': ['print','add','remove','set','incoming print','export'],
    '/snmp':   ['print','set','community print','community add','export'],
    '/caps-man': {
      'print':          [],
      'configuration':  ['print','add','remove','set','export'],
      'datapath':       ['print','add','remove','set','export'],
      'interface':      ['print','add','remove','set','enable','disable','export'],
      'registration-table': ['print'],
      'access-list':    ['print','add','remove','set','export'],
      'channel':        ['print','add','remove','set','export'],
    },
    '/export': [],
    '/import': [],
  };

  /* ── Плоский список для швидкого пошуку ── */
  var FLAT_CMDS = [];

  function flatten(obj, prefix) {
    if (Array.isArray(obj)) {
      obj.forEach(function(sub) {
        FLAT_CMDS.push(prefix + (sub ? ' ' + sub : ''));
      });
      FLAT_CMDS.push(prefix);
      return;
    }
    Object.keys(obj).forEach(function(key) {
      var full = prefix ? prefix + ' ' + key : key;
      flatten(obj[key], full);
    });
  }

  flatten(ROS_TREE, '');

  /* Сортуємо і видаляємо дублікати */
  FLAT_CMDS = FLAT_CMDS
    .filter(function(c, i, a) { return c && a.indexOf(c) === i; })
    .sort();

  /* ── Функція пошуку варіантів ── */
  function getCompletions(input) {
    var val = input.trim().toLowerCase();
    if (!val) return [];

    var exact    = [];
    var startsWith = [];
    var contains   = [];

    FLAT_CMDS.forEach(function(cmd) {
      var lower = cmd.toLowerCase();
      if (lower === val) {
        exact.push(cmd);
      } else if (lower.startsWith(val)) {
        startsWith.push(cmd);
      } else if (lower.includes(val)) {
        contains.push(cmd);
      }
    });

    return exact.concat(startsWith, contains).slice(0, 30);
  }

  /* ── Спільний префікс для автодоповнення ── */
  function commonPrefix(strings) {
    if (!strings.length) return '';
    var first = strings[0];
    var len   = first.length;
    for (var i = 1; i < strings.length; i++) {
      while (len > 0 && strings[i].slice(0, len) !== first.slice(0, len)) {
        len--;
      }
    }
    return first.slice(0, len);
  }

  /* ══════════════════════════════════════════════════════════
     STYLES
     ══════════════════════════════════════════════════════════ */
  function injectTabStyles() {
    if (document.getElementById('tab-completion-styles')) return;
    var s = document.createElement('style');
    s.id = 'tab-completion-styles';
    s.textContent = `
      .tc-dropdown {
        position: absolute;
        background: #0a1520;
        border: 1px solid #2f7a5c;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0,0,0,.6);
        z-index: 99999;
        min-width: 320px;
        max-width: 600px;
        max-height: 280px;
        overflow-y: auto;
        padding: 4px 0;
        font-family: 'SF Mono','Consolas','Menlo',monospace;
        font-size: 12.5px;
      }
      .tc-dropdown::-webkit-scrollbar { width: 4px; }
      .tc-dropdown::-webkit-scrollbar-thumb { background: #2a3b48; border-radius: 2px; }
      .tc-item {
        padding: 5px 12px;
        cursor: pointer;
        color: #a0d8b0;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background .1s;
      }
      .tc-item:hover, .tc-item.tc-selected {
        background: #1a3a2a;
        color: #5fd0a5;
      }
      .tc-item .tc-match {
        color: #5fd0a5;
        font-weight: 700;
      }
      .tc-item .tc-rest { color: #7aa090; }
      .tc-header {
        padding: 4px 12px 2px;
        font-size: 10px;
        color: #4a6070;
        text-transform: uppercase;
        letter-spacing: .06em;
        border-bottom: 1px solid #1a2d3d;
        margin-bottom: 2px;
      }
      .tc-count {
        padding: 3px 12px;
        font-size: 10px;
        color: #4a6070;
        border-top: 1px solid #1a2d3d;
        margin-top: 2px;
      }
    `;
    document.head.appendChild(s);
  }

  /* ══════════════════════════════════════════════════════════
     ATTACH TAB COMPLETION TO INPUT
     ══════════════════════════════════════════════════════════ */
  function attachTabCompletion(input) {
    if (!input || input._tabAttached) return;
    input._tabAttached = true;

    var dropdown   = null;
    var items      = [];
    var selIdx     = -1;
    var lastVal    = '';

    function removeDropdown() {
      if (dropdown) { dropdown.remove(); dropdown = null; }
      items  = [];
      selIdx = -1;
    }

    function highlight(text, query) {
      var idx = text.toLowerCase().indexOf(query.toLowerCase());
      if (idx < 0) return '<span class="tc-rest">' + esc(text) + '</span>';
      return '<span class="tc-rest">' + esc(text.slice(0, idx)) + '</span>' +
             '<span class="tc-match">' + esc(text.slice(idx, idx + query.length)) + '</span>' +
             '<span class="tc-rest">' + esc(text.slice(idx + query.length)) + '</span>';
    }

    function esc(s) {
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function showDropdown(completions, query) {
      removeDropdown();
      if (!completions.length) return;

      var rect = input.getBoundingClientRect();
      dropdown  = document.createElement('div');
      dropdown.className = 'tc-dropdown';
      dropdown.style.left   = rect.left + 'px';
      dropdown.style.top    = (rect.bottom + window.scrollY + 4) + 'px';
      dropdown.style.width  = Math.max(rect.width, 320) + 'px';
      dropdown.style.position = 'fixed';
      dropdown.style.top    = (rect.bottom + 4) + 'px';

      var header = document.createElement('div');
      header.className = 'tc-header';
      header.textContent = 'TAB — автодоповнення RouterOS';
      dropdown.appendChild(header);

      completions.slice(0, 25).forEach(function(cmd, i) {
        var item = document.createElement('div');
        item.className = 'tc-item';
        item.innerHTML = highlight(cmd, query);
        item.dataset.cmd = cmd;
        item.addEventListener('mousedown', function(e) {
          e.preventDefault();
          applyCompletion(cmd);
        });
        dropdown.appendChild(item);
        items.push(item);
      });

      if (completions.length > 25) {
        var count = document.createElement('div');
        count.className = 'tc-count';
        count.textContent = '... ще ' + (completions.length - 25) + ' варіантів — уточни запит';
        dropdown.appendChild(count);
      }

      document.body.appendChild(dropdown);
      selIdx = -1;
    }

    function updateSelection() {
      items.forEach(function(item, i) {
        item.classList.toggle('tc-selected', i === selIdx);
        if (i === selIdx) item.scrollIntoView({ block: 'nearest' });
      });
    }

    function applyCompletion(cmd) {
      input.value = cmd;
      /* Ставимо курсор в кінець */
      input.setSelectionRange(cmd.length, cmd.length);
      removeDropdown();
      input.focus();
    }

    /* ── Keydown handler ── */
    input.addEventListener('keydown', function(e) {

      /* TAB — головна логіка */
      if (e.key === 'Tab') {
        e.preventDefault();
        var val = input.value.trim();

        if (!val) return;

        /* Якщо dropdown вже відкритий — переходимо до наступного */
        if (dropdown && items.length) {
          selIdx = (selIdx + 1) % items.length;
          updateSelection();
          return;
        }

        var completions = getCompletions(val);

        if (!completions.length) {
          /* Нічого не знайдено */
          return;
        }

        if (completions.length === 1) {
          /* Єдиний варіант — одразу застосовуємо */
          applyCompletion(completions[0]);
          return;
        }

        /* Спільний префікс */
        var prefix = commonPrefix(completions);
        if (prefix.length > val.length) {
          input.value = prefix;
          lastVal = prefix;
        }

        showDropdown(completions, val);
        return;
      }

      /* Arrow Down */
      if (e.key === 'ArrowDown' && dropdown) {
        e.preventDefault();
        selIdx = Math.min(selIdx + 1, items.length - 1);
        updateSelection();
        if (items[selIdx]) input.value = items[selIdx].dataset.cmd;
        return;
      }

      /* Arrow Up */
      if (e.key === 'ArrowUp' && dropdown) {
        e.preventDefault();
        selIdx = Math.max(selIdx - 1, 0);
        updateSelection();
        if (items[selIdx]) input.value = items[selIdx].dataset.cmd;
        return;
      }

      /* Enter — застосовуємо вибраний */
      if (e.key === 'Enter' && dropdown && selIdx >= 0) {
        e.preventDefault();
        if (items[selIdx]) {
          applyCompletion(items[selIdx].dataset.cmd);
        }
        return;
      }

      /* Escape — закриваємо */
      if (e.key === 'Escape') {
        removeDropdown();
        return;
      }
    });

    /* ── Input handler — live пошук ── */
    input.addEventListener('input', function() {
      var val = input.value.trim();
      if (!val) { removeDropdown(); return; }
      if (val === lastVal) return;
      lastVal = val;

      /* Показуємо підказки після 2+ символів */
      if (val.length < 2) { removeDropdown(); return; }

      var completions = getCompletions(val);
      if (completions.length > 0 && completions.length <= 25) {
        showDropdown(completions, val);
      } else {
        removeDropdown();
      }
    });

    /* Закриваємо при кліку поза */
    document.addEventListener('click', function(e) {
      if (dropdown && !dropdown.contains(e.target) && e.target !== input) {
        removeDropdown();
      }
    });

    /* Закриваємо при blur */
    input.addEventListener('blur', function() {
      setTimeout(removeDropdown, 150);
    });
  }

  /* ══════════════════════════════════════════════════════════
     WATCH FOR TERMINAL INPUTS
     ══════════════════════════════════════════════════════════ */
  injectTabStyles();

  function scanForTerminalInputs() {
    /* SSH термінал в Router Manager */
    var inp1 = document.getElementById('rm-term-in');
    if (inp1) attachTabCompletion(inp1);

    /* Термінал в головному вікні (terminal-plus) */
    var inp2 = document.querySelector('.rm-term-input');
    if (inp2) attachTabCompletion(inp2);

    /* Будь-які нові термінальні інпути */
    document.querySelectorAll('input[placeholder*="RouterOS"], input[placeholder*="команд"]').forEach(function(inp) {
      attachTabCompletion(inp);
    });
  }

  /* Спостерігаємо за змінами DOM */
  var observer = new MutationObserver(function(mutations) {
    var needScan = mutations.some(function(m) { return m.addedNodes.length > 0; });
    if (needScan) scanForTerminalInputs();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  /* Перший scan */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanForTerminalInputs);
  } else {
    scanForTerminalInputs();
  }

  /* Публічний API */
  window.TabCompletion = {
    attach: attachTabCompletion,
    completions: getCompletions,
  };

  console.log('[TabCompletion] завантажено — ' + FLAT_CMDS.length + ' команд RouterOS');

})();