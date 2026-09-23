# -*- coding: utf-8 -*-
import subprocess, tempfile, os

SEARCH = r"""'use strict';
/* ═══════════════════════════════════════════════════════
   rm-search.js — Global Search (Ctrl+F)
   Паралельний пошук по всіх розділах роутера
   ═══════════════════════════════════════════════════════ */

window.RMSearch = (function() {

  /* ── Всі endpoints для пошуку ── */
  var SECTIONS = [
    { id: 'interfaces',    label: 'Interfaces',       icon: '&#127760;', path: '/interface',                    cols: ['name','type','mac-address','comment'] },
    { id: 'ip-addr',       label: 'IP Addresses',     icon: '&#128205;', path: '/ip/address',                   cols: ['address','interface','network','comment'] },
    { id: 'ip-route',      label: 'Routes',           icon: '&#128337;', path: '/ip/route',                     cols: ['dst-address','gateway','distance','comment'] },
    { id: 'ip-arp',        label: 'ARP',              icon: '&#128268;', path: '/ip/arp',                       cols: ['address','mac-address','interface','comment'] },
    { id: 'dns-static',    label: 'DNS Static',       icon: '&#127760;', path: '/ip/dns/static',                cols: ['name','address','comment'] },
    { id: 'dhcp-server',   label: 'DHCP Server',      icon: '&#128229;', path: '/ip/dhcp-server',               cols: ['name','interface','address-pool','comment'] },
    { id: 'dhcp-lease',    label: 'DHCP Leases',      icon: '&#128229;', path: '/ip/dhcp-server/lease',         cols: ['address','mac-address','host-name','comment'] },
    { id: 'fw-filter',     label: 'Firewall Filter',  icon: '&#128293;', path: '/ip/firewall/filter',           cols: ['chain','action','src-address','dst-address','protocol','comment'] },
    { id: 'fw-nat',        label: 'Firewall NAT',     icon: '&#128260;', path: '/ip/firewall/nat',              cols: ['chain','action','src-address','dst-address','to-addresses','comment'] },
    { id: 'fw-mangle',     label: 'Mangle',           icon: '&#128295;', path: '/ip/firewall/mangle',           cols: ['chain','action','src-address','dst-address','comment'] },
    { id: 'fw-raw',        label: 'Firewall Raw',     icon: '&#128295;', path: '/ip/firewall/raw',              cols: ['chain','action','src-address','dst-address','comment'] },
    { id: 'fw-addr-list',  label: 'Address Lists',    icon: '&#128221;', path: '/ip/firewall/address-list',     cols: ['list','address','comment'] },
    { id: 'queue-simple',  label: 'Simple Queues',    icon: '&#128190;', path: '/queue/simple',                 cols: ['name','target','max-limit','comment'] },
    { id: 'queue-tree',    label: 'Queue Tree',       icon: '&#127795;', path: '/queue/tree',                   cols: ['name','parent','max-limit','comment'] },
    { id: 'ppp-secret',    label: 'PPP Secrets',      icon: '&#128273;', path: '/ppp/secret',                   cols: ['name','service','profile','comment'] },
    { id: 'wireless',      label: 'Wireless',         icon: '&#128246;', path: '/interface/wireless',           cols: ['name','ssid','band','frequency','comment'] },
    { id: 'bridge',        label: 'Bridges',          icon: '&#127747;', path: '/interface/bridge',             cols: ['name','comment'] },
    { id: 'vlan',          label: 'VLANs',            icon: '&#127760;', path: '/interface/vlan',               cols: ['name','vlan-id','interface','comment'] },
    { id: 'tunnel-vpn',    label: 'IP Tunnels',       icon: '&#128274;', path: '/interface/ipip',               cols: ['name','remote-address','local-address','comment'] },
    { id: 'users',         label: 'Users',            icon: '&#128100;', path: '/user',                         cols: ['name','group','address','comment'] },
    { id: 'scripts',       label: 'Scripts',          icon: '&#128196;', path: '/system/script',                cols: ['name','owner','comment'] },
    { id: 'scheduler',     label: 'Scheduler',        icon: '&#128336;', path: '/system/scheduler',             cols: ['name','start-time','interval','comment'] },
    { id: 'neighbors',     label: 'Neighbors',        icon: '&#128101;', path: '/ip/neighbor',                  cols: ['address','identity','platform','comment'] },
    { id: 'certificates',  label: 'Certificates',     icon: '&#128203;', path: '/certificate',                  cols: ['name','common-name','subject-alt-name','comment'] },
    { id: 'hotspot-users', label: 'Hotspot Users',    icon: '&#128246;', path: '/ip/hotspot/user',              cols: ['name','password','profile','comment'] },
    { id: 'ip-pool',       label: 'IP Pools',         icon: '&#128190;', path: '/ip/pool',                      cols: ['name','ranges','comment'] },
  ];

  var _open    = false;
  var _results = [];
  var _router  = null;
  var _xhr     = [];

  /* ── Get router ── */
  function getRouter() {
    if (window.getActiveRouter)   return window.getActiveRouter();
    if (window.RMDataStore && window.RMDataStore._getActiveRouter)
      return window.RMDataStore._getActiveRouter();
    return null;
  }

  /* ── CSS ── */
  function injectCSS() {
    if (document.getElementById('gs-css')) return;
    var s = document.createElement('style');
    s.id = 'gs-css';
    s.textContent = [
      /* Overlay */
      '#gs-overlay {',
      '  display:none; position:fixed; inset:0; z-index:999997;',
      '  background:rgba(0,0,0,.75); backdrop-filter:blur(6px);',
      '  align-items:flex-start; justify-content:center; padding-top:80px;',
      '}',
      '#gs-overlay.gs-visible { display:flex; }',
      /* Panel */
      '#gs-panel {',
      '  background:#0d1117; border:1px solid #2a3b48;',
      '  border-radius:16px; width:720px; max-width:95vw;',
      '  max-height:80vh; overflow:hidden; display:flex;',
      '  flex-direction:column;',
      '  box-shadow:0 24px 80px rgba(0,0,0,.9);',
      '}',
      /* Search bar */
      '#gs-bar {',
      '  display:flex; align-items:center; gap:10px;',
      '  padding:14px 18px; border-bottom:1px solid #1c2a37;',
      '  background:#060d14;',
      '}',
      '#gs-icon { font-size:18px; color:#4a6070; }',
      '#gs-input {',
      '  flex:1; background:transparent; border:none; outline:none;',
      '  color:#c9d8e4; font-size:16px;',
      '}',
      '#gs-input::placeholder { color:#2a3b48; }',
      '#gs-spinner {',
      '  width:18px; height:18px; border:2px solid #2a3b48;',
      '  border-top-color:#5fd0a5; border-radius:50%;',
      '  animation:gs-spin .6s linear infinite; display:none;',
      '}',
      '#gs-spinner.gs-active { display:block; }',
      '@keyframes gs-spin { to { transform:rotate(360deg); } }',
      '#gs-close-btn {',
      '  background:transparent; border:1px solid #2a3b48;',
      '  color:#4a6070; border-radius:6px; padding:3px 9px;',
      '  cursor:pointer; font-size:13px;',
      '}',
      '#gs-close-btn:hover { color:#c9d8e4; }',
      /* Stats */
      '#gs-stats {',
      '  padding:6px 18px; font-size:11px; color:#4a6070;',
      '  border-bottom:1px solid #1c2a37; background:#060d14;',
      '  min-height:24px;',
      '}',
      /* Results */
      '#gs-results {',
      '  overflow-y:auto; flex:1; padding:8px 0;',
      '}',
      /* Section header */
      '.gs-sec-hdr {',
      '  display:flex; align-items:center; gap:8px;',
      '  padding:8px 18px 4px; font-size:11px; font-weight:700;',
      '  color:#5fd0a5; text-transform:uppercase; letter-spacing:.06em;',
      '  border-top:1px solid #0d1a28; margin-top:4px;',
      '}',
      '.gs-sec-hdr:first-child { border-top:none; margin-top:0; }',
      '.gs-sec-count {',
      '  background:#1a2a1a; color:#5fd0a5; border-radius:10px;',
      '  padding:1px 7px; font-size:10px;',
      '}',
      /* Result row */
      '.gs-row {',
      '  display:flex; align-items:center; gap:10px;',
      '  padding:7px 18px; cursor:pointer; transition:background .1s;',
      '}',
      '.gs-row:hover { background:#0a1520; }',
      '.gs-row.gs-selected { background:#0e1e30; }',
      '.gs-row-icon { font-size:14px; flex-shrink:0; }',
      '.gs-row-main {',
      '  flex:1; min-width:0;',
      '}',
      '.gs-row-title {',
      '  color:#c9d8e4; font-size:13px;',
      '  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;',
      '}',
      '.gs-row-sub {',
      '  color:#4a6070; font-size:11px;',
      '  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;',
      '}',
      '.gs-row-badge {',
      '  background:#1a2a3a; border:1px solid #2a3b48;',
      '  color:#5b9bd5; border-radius:5px; padding:1px 7px;',
      '  font-size:10px; flex-shrink:0;',
      '}',
      /* Highlight */
      '.gs-hl { color:#f0a840; font-weight:700; }',
      /* Empty / hint */
      '#gs-hint {',
      '  padding:40px 20px; text-align:center;',
      '  color:#2a3b48; font-size:14px;',
      '}',
      /* Keyboard nav hint */
      '#gs-kbd-hint {',
      '  padding:8px 18px; border-top:1px solid #1c2a37;',
      '  display:flex; gap:14px; background:#060d14;',
      '}',
      '.gs-kbd { display:flex; align-items:center; gap:4px; }',
      '.gs-kbd span { background:#1a2a3a; border:1px solid #2a3b48;',
      '  border-radius:4px; padding:1px 6px; font-size:10px;',
      '  font-family:monospace; color:#8ea3b0; }',
      '.gs-kbd em { font-size:10px; color:#4a6070; font-style:normal; }',
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ── Build UI ── */
  function buildUI() {
    if (document.getElementById('gs-overlay')) return;
    var el = document.createElement('div');
    el.id = 'gs-overlay';
    el.innerHTML =
      '<div id="gs-panel">' +
        '<div id="gs-bar">' +
          '<span id="gs-icon">&#128269;</span>' +
          '<input id="gs-input" placeholder="Search router... (IP, MAC, name, comment)" autocomplete="off">' +
          '<div id="gs-spinner"></div>' +
          '<button id="gs-close-btn">Esc</button>' +
        '</div>' +
        '<div id="gs-stats">Type to search across all router sections</div>' +
        '<div id="gs-results"><div id="gs-hint">&#128269; Start typing to search...</div></div>' +
        '<div id="gs-kbd-hint">' +
          '<div class="gs-kbd"><span>&#8593;&#8595;</span><em>navigate</em></div>' +
          '<div class="gs-kbd"><span>Enter</span><em>open section</em></div>' +
          '<div class="gs-kbd"><span>Esc</span><em>close</em></div>' +
          '<div class="gs-kbd"><span>Ctrl+F</span><em>toggle</em></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);

    /* Events */
    el.addEventListener('click', function(e) {
      if (e.target === el) close();
    });
    document.getElementById('gs-close-btn').onclick = close;

    var input = document.getElementById('gs-input');
    var debounce = null;
    input.addEventListener('input', function() {
      clearTimeout(debounce);
      debounce = setTimeout(function() {
        doSearch(input.value.trim());
      }, 300);
    });

    /* Keyboard nav in results */
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); navResults(1); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); navResults(-1); }
      if (e.key === 'Enter')     { e.preventDefault(); openSelected(); }
    });
  }

  /* ── Navigate results ── */
  var _selIdx = -1;
  function navResults(dir) {
    var rows = document.querySelectorAll('.gs-row');
    if (!rows.length) return;
    rows.forEach(function(r) { r.classList.remove('gs-selected'); });
    _selIdx = (_selIdx + dir + rows.length) % rows.length;
    rows[_selIdx].classList.add('gs-selected');
    rows[_selIdx].scrollIntoView({ block: 'nearest' });
  }

  function openSelected() {
    var sel = document.querySelector('.gs-row.gs-selected');
    if (sel) sel.click();
  }

  /* ── Highlight match ── */
  function highlight(text, query) {
    if (!query) return text;
    var safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return String(text).replace(
      new RegExp('(' + safe + ')', 'gi'),
      '<span class="gs-hl">$1</span>'
    );
  }

  /* ── Search ── */
  function doSearch(query) {
    if (!query || query.length < 2) {
      var res = document.getElementById('gs-results');
      if (res) res.innerHTML = '<div id="gs-hint">&#128269; Start typing to search...</div>';
      var stats = document.getElementById('gs-stats');
      if (stats) stats.textContent = 'Type to search across all router sections';
      return;
    }

    _router = getRouter();
    if (!_router) {
      showStats('No active router connected', '#e08080');
      return;
    }

    showSpinner(true);
    showStats('Searching ' + SECTIONS.length + ' sections...');
    _selIdx = -1;

    var lo = query.toLowerCase();
    var pending = SECTIONS.length;
    var allResults = [];

    SECTIONS.forEach(function(section) {
      /* Timeout per section */
      var done = false;
      var timer = setTimeout(function() {
        if (!done) { done = true; finish(section, []); }
      }, 5000);

      restCallSafe(_router, 'GET', section.path).then(function(data) {
        clearTimeout(timer);
        if (done) return;
        done = true;

        var arr = Array.isArray(data) ? data : [];
        var matches = arr.filter(function(row) {
          return section.cols.some(function(col) {
            return String(row[col] || '').toLowerCase().includes(lo);
          });
        });

        finish(section, matches);
      }).catch(function() {
        clearTimeout(timer);
        if (!done) { done = true; finish(section, []); }
      });

      function finish(sec, matches) {
        if (matches.length) {
          allResults.push({ section: sec, matches: matches });
        }
        pending--;
        if (pending <= 0) {
          showSpinner(false);
          renderResults(allResults, query);
        }
      }
    });
  }

  /* ── Safe restCall ── */
  function restCallSafe(router, method, path) {
    if (window.restCall) return window.restCall(router, method, path);
    return Promise.reject(new Error('restCall not available'));
  }

  /* ── Render results ── */
  function renderResults(allResults, query) {
    var res = document.getElementById('gs-results');
    if (!res) return;

    var total = allResults.reduce(function(s, r) { return s + r.matches.length; }, 0);
    showStats('Found ' + total + ' result(s) in ' + allResults.length + ' section(s)');

    if (!total) {
      res.innerHTML =
        '<div id="gs-hint">&#128269; Nothing found for <strong style="color:#f0a840">"' +
        query + '"</strong></div>';
      return;
    }

    var html = '';
    allResults.forEach(function(group) {
      var sec = group.section;
      html += '<div class="gs-sec-hdr">' +
        sec.icon + ' ' + sec.label +
        '<span class="gs-sec-count">' + group.matches.length + '</span>' +
      '</div>';

      /* Max 5 per section */
      var shown = group.matches.slice(0, 5);
      shown.forEach(function(row) {
        /* Title = first non-empty col */
        var title = '';
        var sub   = [];
        sec.cols.forEach(function(col) {
          var v = String(row[col] || '');
          if (!v) return;
          if (!title) { title = v; }
          else { sub.push(col + ': ' + v); }
        });

        var disabled = row.disabled === 'true' || row.disabled === true;

        html += '<div class="gs-row" data-section="' + sec.id + '" data-id="' + (row['.id'] || '') + '">' +
          '<span class="gs-row-icon">' + sec.icon + '</span>' +
          '<div class="gs-row-main">' +
            '<div class="gs-row-title">' + highlight(title, query) + (disabled ? ' <span style="color:#4a6070;font-size:10px;">(disabled)</span>' : '') + '</div>' +
            (sub.length ? '<div class="gs-row-sub">' + highlight(sub.slice(0, 3).join(' · '), query) + '</div>' : '') +
          '</div>' +
          '<span class="gs-row-badge">' + sec.label + '</span>' +
        '</div>';
      });

      if (group.matches.length > 5) {
        html += '<div style="padding:4px 18px;font-size:11px;color:#4a6070;">' +
          '+ ' + (group.matches.length - 5) + ' more...</div>';
      }
    });

    res.innerHTML = html;

    /* Click on result → close search, navigate to section */
    res.querySelectorAll('.gs-row').forEach(function(row) {
      row.addEventListener('click', function() {
        var sid = row.dataset.section;
        close();
        navigateToSection(sid);
      });
    });
  }

  /* ── Navigate to section in Router Manager ── */
  function navigateToSection(sectionId) {
    /* Мапи section id → пункт меню */
    var MAP = {
      'fw-filter':    function() { clickMenuItem('Filter Rules'); },
      'fw-nat':       function() { clickMenuItem('NAT'); },
      'fw-mangle':    function() { clickMenuItem('Mangle'); },
      'fw-addr-list': function() { clickMenuItem('Firewall'); },
      'interfaces':   function() { clickMenuItem('Interfaces'); },
      'ip-addr':      function() { clickMenuItem('IP'); },
      'ip-route':     function() { clickMenuItem('IP'); },
      'ip-arp':       function() { clickMenuItem('IP'); },
      'dhcp-server':  function() { clickMenuItem('IP'); },
      'dhcp-lease':   function() { clickMenuItem('IP'); },
      'queue-simple': function() { clickMenuItem('Queues'); },
      'queue-tree':   function() { clickMenuItem('Queues'); },
      'ppp-secret':   function() { clickMenuItem('PPP'); },
      'wireless':     function() { clickMenuItem('Wireless'); },
      'users':        function() { clickMenuItem('System'); },
      'scripts':      function() { clickMenuItem('System'); },
      'scheduler':    function() { clickMenuItem('System'); },
    };
    var fn = MAP[sectionId];
    if (fn) fn();
  }

  function clickMenuItem(label) {
    /* Шукаємо в sidebar */
    var items = document.querySelectorAll(
      '.rm-nav-item, .rm-menu-item, [data-section], .rm-sidebar a, .rm-sidebar li'
    );
    for (var i = 0; i < items.length; i++) {
      if (items[i].textContent.trim().includes(label)) {
        items[i].click();
        return;
      }
    }
  }

  /* ── UI helpers ── */
  function showSpinner(on) {
    var sp = document.getElementById('gs-spinner');
    if (sp) sp.classList.toggle('gs-active', on);
  }

  function showStats(text, color) {
    var el = document.getElementById('gs-stats');
    if (!el) return;
    el.textContent = text;
    el.style.color = color || '#4a6070';
  }

  /* ── Open / Close ── */
  function open() {
    var overlay = document.getElementById('gs-overlay');
    if (!overlay) buildUI();
    overlay = document.getElementById('gs-overlay');
    if (!overlay) return;
    _open = true;
    _selIdx = -1;
    overlay.classList.add('gs-visible');
    var input = document.getElementById('gs-input');
    if (input) {
      input.value = '';
      input.focus();
    }
    var res = document.getElementById('gs-results');
    if (res) res.innerHTML = '<div id="gs-hint">&#128269; Start typing to search...</div>';
    showStats('Type to search across all router sections');
  }

  function close() {
    _open = false;
    var overlay = document.getElementById('gs-overlay');
    if (overlay) overlay.classList.remove('gs-visible');
    showSpinner(false);
  }

  function toggle() {
    if (_open) close(); else open();
  }

  /* ── Keyboard Ctrl+F ── */
  function initKeyboard() {
    document.addEventListener('keydown', function(e) {
      /* Ctrl+F тільки в Router Manager */
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        var rmOverlay = document.getElementById('rm-overlay');
        var rmVisible = rmOverlay && rmOverlay.style.display !== 'none';
        if (!rmVisible) return; /* не перехоплюємо на головній сторінці */
        e.preventDefault();
        toggle();
        return;
      }
      if (e.key === 'Escape' && _open) {
        close();
      }
    });
  }

  /* ── Init ── */
  function init() {
    injectCSS();
    buildUI();
    initKeyboard();
    /* Додаємо в shortcuts панель */
    if (window.RMShortcuts) {
      window.RMShortcuts.addShortcut('Router Manager',
        ['Ctrl', 'F'], 'Global Search по всіх розділах роутера');
    }
    console.log('[GlobalSearch] ready — Ctrl+F');
  }

  return { init: init, open: open, close: close, toggle: toggle };

})();

/* Auto-init */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { window.RMSearch.init(); });
} else {
  window.RMSearch.init();
}

console.log('[GlobalSearch] rm-search.js loaded');
"""

# ════ Tempfile ════
with tempfile.NamedTemporaryFile(
        suffix='.js', delete=False, mode='w', encoding='utf-8') as tmp:
    tmp.write(SEARCH)
    tmp_name = tmp.name

r = subprocess.run(['node','--check', tmp_name], capture_output=True, text=True)
os.unlink(tmp_name)
if r.returncode != 0:
    print('SYNTAX ERROR!\n' + r.stderr[:500])
    exit(1)
print('Tempfile: OK')

# ════ Записуємо ════
with open('rm-search.js', 'w', encoding='utf-8') as f:
    f.write(SEARCH)

size = os.path.getsize('rm-search.js')
r2 = subprocess.run(['node','--check','rm-search.js'], capture_output=True, text=True)
print(f'rm-search.js: {"OK" if r2.returncode==0 else "FAIL"} ({size:,}b)')
if r2.returncode != 0:
    print(r2.stderr[:200])
    exit(1)

# ════ index.html ════
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

TARGET = '<script src="rm-safemode.js"></script>'
INSERT = '<script src="rm-search.js"></script>\n    ' + TARGET

if 'rm-search.js' in html:
    print('OK: вже є в index.html')
elif TARGET in html:
    html = html.replace(TARGET, INSERT, 1)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print('OK: rm-search.js додано в index.html')

# ════ Git ════
subprocess.run(['git','add','rm-search.js','index.html'], capture_output=True)
subprocess.run(['git','commit','-m',
    'feat: rm-search.js - Global Search Ctrl+F, 26 sections, parallel search'],
    capture_output=True)
rp = subprocess.run(['git','push','origin','main'], capture_output=True, text=True)
print('push:', rp.stdout.strip() or rp.stderr.strip()[-60:])
print('\nDone! npm start')