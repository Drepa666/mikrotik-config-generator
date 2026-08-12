/* sections.js — кнопки копіювання секцій */

var SECS = [
  { label: 'Безпека',    m: '# --- Чек-лист безпеки ---' },
  { label: 'Бекап',      m: '# --- Резервна копія ---' },
  { label: 'Загальне',   m: '# --- Загальне ---' },
  { label: 'Interfaces', m: '# --- Interface Lists ---' },
  { label: 'LAN',        m: '# --- LAN ---' },
  { label: 'WAN',        m: '# --- WAN:' },
  { label: 'DHCP',       m: '# --- DHCP LAN ---' },
  { label: 'DNS',        m: '# --- DNS ---' },
  { label: 'NAT',        m: '# --- NAT ---' },
  { label: 'MAC',        m: '# --- Захист MAC ---' },
  { label: 'Firewall',   m: '# --- Firewall (defconf' },
  { label: 'NTP',        m: '# --- NTP ---' },
  { label: 'Port FW',    m: '# --- Port Forwarding ---' },
  { label: 'Wi-Fi',      m: '# --- Wi-Fi' },
  { label: 'CAPsMAN',    m: '# --- CAPsMAN' },
  { label: 'Guest',      m: '# --- Guest' },
  { label: 'Failover',   m: '# --- Failover' },
  { label: 'WireGuard',  m: '# --- WireGuard' },
  { label: 'OpenVPN',    m: '# --- OpenVPN' },
  { label: 'IPsec',      m: '# [x] IPsec' },
  { label: 'Addr-List',  m: '# --- Address-List' },
  { label: 'Routes',     m: '# --- Static Routes' },
];
function secGetScript() {
  var el = document.getElementById('output');
  if (!el) return '';
  return el.textContent || el.innerText || '';
}

function secShowToast(name) {
  var t = document.getElementById('sec-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'sec-toast';
    t.style.cssText = [
      'position:fixed', 'bottom:24px', 'right:24px',
      'background:#5fd0a5', 'color:#082018',
      'padding:8px 18px', 'border-radius:8px',
      'font-size:13px', 'font-weight:700',
      'z-index:99999', 'opacity:0',
      'transition:opacity .25s'
    ].join(';');
    document.body.appendChild(t);
  }
  t.textContent = '\u2713 ' + name + ' скопійовано';
  t.style.opacity = '1';
  clearTimeout(t._h);
  t._h = setTimeout(function() { t.style.opacity = '0'; }, 2000);
}

function secCopySection(s) {
  var txt = secGetScript();
  if (!txt) return;
  var lines = txt.split('\n');
  var start = -1, end = lines.length;
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].indexOf(s.m) !== -1) {
      start = i;
    } else if (start !== -1 && i > start) {
      if (lines[i].trim().indexOf('# ---') === 0 &&
          lines[i].indexOf(s.m) === -1) {
        end = i;
        break;
      }
    }
  }
  if (start === -1) {
    console.warn('[sections.js] не знайдено:', s.m);
    return;
  }
  var section = lines.slice(start, end).join('\n').trim();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(section)
      .then(function() { secShowToast(s.label); });
  } else {
    var ta = document.createElement('textarea');
    ta.value = section;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    secShowToast(s.label);
  }
}

function updateButtons() {
  var out = document.getElementById('output');
  if (!out) return;

  var old = document.getElementById('sec-btns');
  if (old) old.parentNode.removeChild(old);

  var txt = secGetScript();
  if (!txt.trim()) return;

  var available = SECS.filter(function(s) {
    return txt.indexOf(s.m) !== -1;
  });
  if (!available.length) return;

  var wrap = document.createElement('div');
  wrap.id = 'sec-btns';
  wrap.style.cssText = [
    'display:flex', 'flex-wrap:wrap',
    'gap:4px', 'padding:4px 0 8px 0'
  ].join(';');

  available.forEach(function(s) {
    var btn = document.createElement('button');
    btn.textContent = s.label;
    btn.title = 'Копіювати: ' + s.label;
    btn.style.cssText = [
      'font-size:11px', 'padding:2px 10px',
      'border-radius:4px', 'cursor:pointer',
      'background:#16212c', 'color:#8ea3b0',
      'border:1px solid #2a3b48'
    ].join(';');
    btn.onmouseover = function() {
      btn.style.background = '#2a3b48';
      btn.style.color = '#e6edf3';
    };
    btn.onmouseout = function() {
      btn.style.background = '#16212c';
      btn.style.color = '#8ea3b0';
    };
    btn.onclick = function() {
      secCopySection(s);
      btn.style.background = '#5fd0a5';
      btn.style.color = '#082018';
      setTimeout(function() {
        btn.style.background = '#16212c';
        btn.style.color = '#8ea3b0';
      }, 1000);
    };
    wrap.appendChild(btn);
  });

  out.parentNode.insertBefore(wrap, out);
}

function secPatchRender() {
  if (typeof window.render !== 'function') {
    setTimeout(secPatchRender, 200);
    return;
  }
  var _orig = window.render;
  window.render = function() {
    _orig.apply(this, arguments);
    setTimeout(updateButtons, 200);
  };
  setTimeout(updateButtons, 500);
  console.log('[sections.js] ready | output:', 
    document.getElementById('output') ? 'OK' : 'NOT FOUND');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', secPatchRender);
} else {
  secPatchRender();
}