# -*- coding: utf-8 -*-
import subprocess

with open('router-manager.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Знаходимо openManager і кінець функції
open_mgr_start = None
open_mgr_end   = None

for i, line in enumerate(lines):
    if 'function openManager()' in line:
        open_mgr_start = i
    if open_mgr_start and i > open_mgr_start:
        if line.strip() == '}' and open_mgr_end is None:
            open_mgr_end = i
            break

print(f'openManager: рядки {open_mgr_start+1}—{open_mgr_end+1}')
print('Поточне тіло:')
for i in range(open_mgr_start, min(open_mgr_end+1, open_mgr_start+15)):
    print(f'  {i+1}: {lines[i].rstrip()}')

# UX код — вбудовуємо всередину openManager після classList.add('open')
ux_code = '''\
    /* ══ UX: Search + Shortcuts + Quick Bar ══ */
    setTimeout(function() {
      var overlay = document.getElementById('rm-overlay');
      if (!overlay) return;

      /* ── Styles ── */
      if (!document.getElementById('rm-ux-styles')) {
        var st = document.createElement('style');
        st.id  = 'rm-ux-styles';
        st.textContent =
          '#rm-qbar{display:flex;align-items:center;gap:4px;flex-wrap:wrap;' +
            'padding:4px 10px;background:#0a1520;border-bottom:1px solid #1a2d3d;}' +
          '.rm-qb{padding:3px 8px;border-radius:5px;border:1px solid #2a3b48;' +
            'background:#111d27;color:#8ea3b0;font-size:10px;cursor:pointer;}' +
          '.rm-qb:hover{border-color:#5fd0a5;color:#5fd0a5;background:#0d2a1a;}' +
          '#rm-sw{padding:4px 8px 0;position:relative;}' +
          '#rm-si{width:100%;box-sizing:border-box;background:#0d1821;' +
            'border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;' +
            'padding:6px 10px 6px 26px;font-size:11px;outline:none;}' +
          '#rm-si:focus{border-color:#5fd0a5;}' +
          '#rm-sico{position:absolute;left:16px;top:50%;transform:translateY(-50%);' +
            'font-size:11px;color:#4a6070;pointer-events:none;}' +
          '#rm-sd{position:absolute;top:calc(100% + 2px);left:8px;right:8px;' +
            'background:#111d27;border:1px solid #2a3b48;border-radius:8px;' +
            'z-index:999999;max-height:300px;overflow-y:auto;' +
            'box-shadow:0 8px 24px rgba(0,0,0,.6);display:none;}' +
          '#rm-sd.open{display:block;}' +
          '.rm-sdi{padding:7px 10px;display:flex;align-items:center;gap:8px;' +
            'cursor:pointer;font-size:11px;color:#e6edf3;}' +
          '.rm-sdi:hover{background:#1a2d3d;}' +
          '.rm-sdg{padding:4px 10px 2px;font-size:10px;color:#4a6070;' +
            'border-top:1px solid #1a2d3d;}' +
          '.rm-sdg:first-child{border-top:none;}' +
          '.rm-sdhl{color:#5fd0a5;font-weight:700;}';
        document.head.appendChild(st);
      }

      /* ── Quick Bar перед rm-content ── */
      var rmContent = document.getElementById('rm-content');
      if (rmContent && !document.getElementById('rm-qbar')) {
        var qbar = document.createElement('div');
        qbar.id  = 'rm-qbar';
        qbar.innerHTML =
          qb('📊','Dash','dashboard') + qb('🌐','Ifaces','interfaces') +
          qb('📋','IP','ip-addresses') + qb('📡','DHCP','ip-dhcp') +
          qb('🔥','FW','fw-filter') + qb('📈','Traffic','traffic') +
          qb('🔑','PPP','ppp-secrets') + qb('⚙️','Sys','sys-resources') +
          '<span style="margin-left:auto;">' +
            '<button class="rm-qb" onclick="alert(' + "'Ctrl+K — пошук\\nCtrl+D — Dashboard\\nCtrl+F — Firewall\\nCtrl+I — Interfaces\\nCtrl+H — DHCP\\nCtrl+T — Traffic'" + ')">⌨️</button>' +
          '</span>';
        rmContent.parentNode.insertBefore(qbar, rmContent);
      }

      /* ── Search у nav (батько першого [data-id] елемента) ── */
      if (!document.getElementById('rm-si')) {
        var firstItem = overlay.querySelector('[data-id]');
        var nav = firstItem ? firstItem.parentNode : null;
        if (nav && nav !== overlay && nav !== rmContent) {
          var sw = document.createElement('div');
          sw.id  = 'rm-sw';
          sw.innerHTML =
            '<span id="rm-sico">🔍</span>' +
            '<input id="rm-si" type="text" placeholder="Ctrl+K — пошук..." autocomplete="off">' +
            '<div id="rm-sd"></div>';
          nav.insertBefore(sw, nav.firstChild);

          /* Search logic */
          var si = document.getElementById('rm-si');
          var sd = document.getElementById('rm-sd');
          var st2 = null;
          si.addEventListener('input', function() {
            clearTimeout(st2);
            st2 = setTimeout(function() { rmSearch(si.value.trim()); }, 200);
          });
          si.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') { sd.classList.remove('open'); si.blur(); }
            if (e.key === 'Enter') {
              var sel = sd.querySelector('.rm-sdi');
              if (sel) sel.click();
            }
          });
          document.addEventListener('click', function(e) {
            var w = document.getElementById('rm-sw');
            if (w && !w.contains(e.target)) sd.classList.remove('open');
          });
        }
      }
    }, 200);

    /* ── Helpers ── */
    function qb(icon, label, menu) {
      return '<button class="rm-qb" onclick="window.__rmSetMenu && window.__rmSetMenu(\'' +
        menu + '\')">' + icon + ' ' + label + '</button>';
    }

    function rmSearch(q) {
      var sd = document.getElementById('rm-sd');
      if (!sd) return;
      if (!q) { sd.classList.remove('open'); return; }
      var ql = q.toLowerCase();
      var menus = [
        {icon:'📊',label:'Dashboard',id:'dashboard'},
        {icon:'📈',label:'Traffic Monitor',id:'traffic'},
        {icon:'🌐',label:'Interfaces',id:'interfaces'},
        {icon:'📋',label:'IP Addresses',id:'ip-addresses'},
        {icon:'🛣️',label:'Routes',id:'ip-routes'},
        {icon:'📡',label:'DHCP',id:'ip-dhcp'},
        {icon:'🔥',label:'Firewall Filter',id:'fw-filter'},
        {icon:'🔀',label:'NAT',id:'fw-nat'},
        {icon:'📊',label:'Queues',id:'queues-simple'},
        {icon:'🔑',label:'PPP Secrets',id:'ppp-secrets'},
        {icon:'📶',label:'Wireless',id:'wl-interfaces'},
        {icon:'🔐',label:'WireGuard',id:'wireguard'},
        {icon:'📡',label:'CAPsMAN',id:'capsman'},
        {icon:'🌐',label:'IPv6',id:'ipv6'},
        {icon:'🏅',label:'Certificates',id:'certificates'},
        {icon:'👁',label:'Netwatch',id:'netwatch'},
        {icon:'📊',label:'SNMP',id:'snmp'},
        {icon:'📋',label:'Logging',id:'logging'},
        {icon:'🔔',label:'Notifications',id:'notifications'},
        {icon:'⚙️',label:'System',id:'sys-resources'},
        {icon:'💻',label:'Terminal',id:'terminal'},
      ];
      var hits = menus.filter(function(m) {
        return m.label.toLowerCase().includes(ql) || m.id.includes(ql);
      });
      var out = '';
      if (hits.length) {
        out += '<div class="rm-sdg">📋 Меню</div>';
        hits.slice(0,8).forEach(function(m) {
          var hl = m.label.replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\\\]/g,'\\\\$&') + ')', 'gi'),
            '<span class="rm-sdhl">$1</span>');
          out += '<div class="rm-sdi" data-menu="' + m.id + '">' +
            m.icon + ' <span>' + hl + '</span></div>';
        });
      }
      if (!out) out = '<div style="padding:12px;text-align:center;color:#4a6070;font-size:11px;">Нічого не знайдено</div>';
      sd.innerHTML = out;
      sd.classList.add('open');
      sd.querySelectorAll('.rm-sdi').forEach(function(item) {
        item.addEventListener('click', function() {
          if (window.__rmSetMenu) window.__rmSetMenu(item.dataset.menu);
          sd.classList.remove('open');
          var si = document.getElementById('rm-si');
          if (si) si.value = '';
        });
      });
    }
'''

# Вставляємо перед закриттям openManager
if open_mgr_end is not None:
    # Перевіряємо чи вже є
    content = ''.join(lines)
    if 'rm-ux-styles' in content:
        print('UX вже вбудовано!')
    else:
        lines.insert(open_mgr_end, ux_code)
        print(f'OK: UX вбудовано перед рядком {open_mgr_end+1}')

    with open('router-manager.js', 'w', encoding='utf-8') as f:
        f.writelines(lines)
else:
    print('openManager не знайдено!')

# Додаємо Ctrl+K shortcut глобально
with open('router-manager.js', 'r', encoding='utf-8') as f:
    rm = f.read()

kbd_listener = '''
  /* ── Keyboard shortcuts ── */
  document.addEventListener('keydown', function(e) {
    var tag = ((document.activeElement||{}).tagName||'').toUpperCase();
    if (tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT') {
      if (e.ctrlKey && e.key==='k') {
        e.preventDefault();
        var si = document.getElementById('rm-si');
        if (si) { si.focus(); si.select(); }
      }
      return;
    }
    if (e.ctrlKey && e.key==='k') {
      e.preventDefault();
      var si = document.getElementById('rm-si');
      if (si) { si.focus(); si.select(); }
    }
    if (!window.__rmSetMenu) return;
    var nav = {d:'dashboard',t:'traffic',f:'fw-filter',i:'interfaces',h:'ip-dhcp'};
    if (e.ctrlKey && nav[e.key]) { e.preventDefault(); window.__rmSetMenu(nav[e.key]); }
  });
'''

if 'Keyboard shortcuts' not in rm:
    # Вставляємо перед кінцевою дужкою модуля
    rm = rm.rstrip()
    if rm.endswith('})();'):
        rm = rm[:-5] + kbd_listener + '\n})();'
    elif rm.endswith('});'):
        rm = rm[:-3] + kbd_listener + '\n});'
    else:
        rm += kbd_listener
    print('OK: Keyboard shortcuts додано!')
    with open('router-manager.js', 'w', encoding='utf-8') as f:
        f.write(rm)
else:
    print('Keyboard shortcuts вже є!')

# Перевіряємо синтаксис
r = subprocess.run(['node','--check','router-manager.js'], capture_output=True, text=True)
print('Синтаксис:', 'OK' if r.returncode == 0 else r.stderr[:200])

r2 = subprocess.run(['node','--check','sw.js'], capture_output=True, text=True)
print('sw.js:', 'OK' if r2.returncode == 0 else r2.stderr[:100])

print('\nГотово! Запускай npm start')