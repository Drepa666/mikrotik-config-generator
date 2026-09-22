# -*- coding: utf-8 -*-
import subprocess

# ════════════════════════════════════
# 1. main.js — додаємо IPC direct-scan
# ════════════════════════════════════
with open('main.js', 'r', encoding='utf-8') as f:
    mj = f.read()
mj = mj.replace('\r\n', '\n')

# Вставляємо після останнього ipcMain.handle
LAST_HANDLE_END = "});"
last_ai = mj.rfind("ipcMain.handle('ai-request'")
# Знаходимо кінець цього handler
end_pos = mj.find('\n});', last_ai) + 4
print(f'Вставляємо після позиції {end_pos}')

DIRECT_SCAN_IPC = r"""

/* ══════════════════════════════════════════════════════
   Direct Network Scan — ARP + Ping без роутера
   ══════════════════════════════════════════════════════ */
ipcMain.handle('direct-scan', async function(event, opts) {
  var subnet  = (opts && opts.subnet)  || '192.168.1';
  var timeout = (opts && opts.timeout) || 1500;

  return new Promise(function(resolve) {
    var devices = {};

    /* ── Крок 1: системний ARP (-a) ── */
    try {
      var arpOut = execSync('arp -a', {timeout: 5000}).toString();
      /*
        Windows: Interface: 192.168.1.100 --- 0xe
          Internet Address  Physical Address  Type
          192.168.1.1       aa-bb-cc-dd-ee-ff dynamic
        Linux/Mac: ? (192.168.1.1) at aa:bb:cc:dd:ee:ff [ether] on eth0
      */
      var lines = arpOut.split('\n');
      lines.forEach(function(line) {
        /* Windows формат */
        var winMatch = line.match(
          /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s+([0-9a-fA-F]{2}[-:][0-9a-fA-F]{2}[-:][0-9a-fA-F]{2}[-:][0-9a-fA-F]{2}[-:][0-9a-fA-F]{2}[-:][0-9a-fA-F]{2})\s+(\w+)/
        );
        if (winMatch) {
          var ip  = winMatch[1];
          var mac = winMatch[2].toUpperCase().replace(/-/g, ':');
          var typ = winMatch[3]; /* dynamic / static */
          if (ip && mac && mac !== 'FF:FF:FF:FF:FF:FF' && !ip.endsWith('.255')) {
            devices[ip] = {
              ip:      ip,
              mac:     mac,
              online:  true,
              source:  'ARP',
              dynamic: typ === 'dynamic',
            };
          }
        }
        /* Linux/Mac формат */
        var linMatch = line.match(
          /\((\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\)\s+at\s+([0-9a-fA-F:]+)/
        );
        if (linMatch) {
          var ip2  = linMatch[1];
          var mac2 = linMatch[2].toUpperCase();
          if (ip2 && mac2 && !ip2.endsWith('.255')) {
            devices[ip2] = { ip: ip2, mac: mac2, online: true, source: 'ARP', dynamic: true };
          }
        }
      });
      console.log('[DirectScan] ARP знайдено:', Object.keys(devices).length);
    } catch(e) {
      console.error('[DirectScan] ARP помилка:', e.message);
    }

    /* ── Крок 2: Ping sweep — перевіряємо весь /24 ── */
    var parts  = subnet.split('.');
    if (parts.length >= 3) {
      var base   = parts.slice(0, 3).join('.');
      var total  = 0;
      var done   = 0;
      var TARGET = 254; /* .1 — .254 */

      for (var i = 1; i <= TARGET; i++) {
        (function(host) {
          total++;
          var ip = base + '.' + host;
          var sock = new net.Socket();
          var responded = false;

          sock.setTimeout(timeout);
          sock.on('connect', function() {
            responded = true;
            if (!devices[ip]) {
              devices[ip] = { ip: ip, mac: '', online: true, source: 'Ping' };
            } else {
              devices[ip].online = true;
            }
            sock.destroy();
          });
          sock.on('error', function() {
            /* Порт закритий але хост може існувати */
            sock.destroy();
          });
          sock.on('timeout', function() { sock.destroy(); });
          sock.on('close', function() {
            done++;
            if (done >= total) finalize();
          });
          /* Перевіряємо порт 80 */
          sock.connect(80, ip);
        })(i);
      }

      /* Якщо ping sweep завис — фіналізуємо через timeout+2s */
      setTimeout(function() {
        if (done < total) {
          console.log('[DirectScan] Timeout, done:', done, '/', total);
          finalize();
        }
      }, timeout + 2000);

    } else {
      finalize();
    }

    function finalize() {
      var result = Object.values(devices).filter(function(d) {
        return d.ip && !d.ip.endsWith('.0') && !d.ip.endsWith('.255');
      });
      /* Сортуємо по IP */
      result.sort(function(a, b) {
        var ao = a.ip.split('.').map(Number);
        var bo = b.ip.split('.').map(Number);
        for (var i = 0; i < 4; i++) if (ao[i] !== bo[i]) return ao[i] - bo[i];
        return 0;
      });
      console.log('[DirectScan] Фінал:', result.length, 'пристроїв');
      resolve({ ok: true, devices: result });
    }
  });
});

/* ── Direct Topology — будуємо топологію зі scan результатів ── */
ipcMain.handle('direct-topology', async function(event, opts) {
  /* Просто проксі до direct-scan + topology build на frontend */
  return ipcMain.listeners && ipcMain._events['direct-scan']
    ? await ipcMain.emit('direct-scan', null, opts)
    : { ok: false, error: 'direct-scan not ready' };
});
"""

mj_new = mj[:end_pos] + DIRECT_SCAN_IPC + mj[end_pos:]

with open('main.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(mj_new)

r1 = subprocess.run(['node','--check','main.js'],
                    capture_output=True, text=True)
print('main.js:', 'OK ✅' if r1.returncode==0 else '❌\n'+r1.stderr[:300])

# ════════════════════════════════════
# 2. switch-scanner.js — scanDirect через IPC
# ════════════════════════════════════
with open('ai-agent/switch-scanner.js', 'r', encoding='utf-8') as f:
    sc = f.read()
sc = sc.replace('\r\n', '\n')

# Замінюємо fetch на ipcRenderer.invoke
OLD_FETCH = (
    "    /* Через backend — прямий ARP/ping scan */\n"
    "    fetch(SwitchScanner._PROXY + '/direct-scan', {\n"
    "      method: 'POST',\n"
    "      headers: {'Content-Type': 'application/json'},\n"
    "      body: JSON.stringify({\n"
    "        subnet:    subnet,\n"
    "        snmp:      snmpCommunity,\n"
    "        ports:     [80, 443, 22, 23, 161, 502, 8080, 8443],\n"
    "        timeout:   3000,\n"
    "      }),\n"
    "    })\n"
    "    .then(function(r) { return r.json(); })\n"
    "    .then(function(data) {"
)
NEW_FETCH = (
    "    /* Electron IPC — прямий ARP/ping scan */\n"
    "    var _ipc = window.electronAPI || (window.require && window.require('electron').ipcRenderer);\n"
    "    if (!_ipc || !_ipc.invoke) {\n"
    "      SwitchScanner.setStatus('❌ IPC недоступний', '#e08080');\n"
    "      SwitchScanner._scanning = false;\n"
    "      return;\n"
    "    }\n"
    "    _ipc.invoke('direct-scan', { subnet: subnet, timeout: 2000 })\n"
    "    .then(function(data) {"
)
if OLD_FETCH in sc:
    sc = sc.replace(OLD_FETCH, NEW_FETCH, 1)
    print('OK: fetch → ipcRenderer.invoke ✅')
else:
    print('WARN: fetch block не знайдено')
    idx = sc.find('direct-scan')
    if idx > 0:
        print(repr(sc[max(0,idx-100):idx+200]))

# Фіксуємо обробку відповіді — data може бути {ok, devices}
OLD_DATA = (
    "      var devs = Array.isArray(data) ? data\n"
    "               : Array.isArray(data.devices) ? data.devices : [];"
)
NEW_DATA = (
    "      if (data && data.ok === false) {\n"
    "        SwitchScanner.setStatus('❌ ' + (data.error||'Помилка сканування'), '#e08080');\n"
    "        SwitchScanner._scanning = false;\n"
    "        return;\n"
    "      }\n"
    "      var devs = Array.isArray(data) ? data\n"
    "               : Array.isArray(data.devices) ? data.devices : [];"
)
if OLD_DATA in sc:
    sc = sc.replace(OLD_DATA, NEW_DATA, 1)
    print('OK: обробка відповіді IPC ✅')

with open('ai-agent/switch-scanner.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(sc)

r2 = subprocess.run(['node','--check','ai-agent/switch-scanner.js'],
                    capture_output=True, text=True)
print('switch-scanner:', 'OK ✅' if r2.returncode==0 else '❌\n'+r2.stderr[:200])

# ════════════════════════════════════
# 3. topology-visual.js — кнопка "🔌 Switch Scan"
#    + автопобудова топології зі scan результатів
# ════════════════════════════════════
with open('topology-visual.js', 'r', encoding='utf-8') as f:
    tv = f.read()
tv = tv.replace('\r\n', '\n')

# Знаходимо кнопку "Глибокий скан" або toolbar
import re
# Шукаємо кнопку в toolbar
btn_match = re.search(
    r"'<button id=\"topo-save-btn\".*?Зберегти</button>'",
    tv, re.DOTALL
)
if btn_match:
    print(f'Знайдено save-btn @ {btn_match.start()}')
    OLD_SAVE = btn_match.group()
    NEW_SAVE = (
        OLD_SAVE + " +\n"
        "    '<button id=\"topo-switch-scan-btn\"' +\n"
        "    ' title=\"Сканувати мережу напряму і побудувати топологію\"' +\n"
        "    ' style=\"background:linear-gradient(135deg,#1a1a3a,#2a1a5a);' +\n"
        "    'border:1px solid #5a3a9a;color:#c084fc;padding:5px 10px;' +\n"
        "    'border-radius:5px;cursor:pointer;font-size:11px;font-weight:700;\">' +\n"
        "    '🔌 Switch Scan</button>'"
    )
    tv = tv.replace(OLD_SAVE, NEW_SAVE, 1)
    print('OK: кнопка Switch Scan в toolbar ✅')
else:
    print('WARN: save-btn не знайдено')
    idx = tv.find('topo-save-btn')
    print(repr(tv[max(0,idx-50):idx+100]))

# Додаємо обробник кнопки — після інших обробників
OLD_SAVE_HANDLER = "document.getElementById('topo-save-btn').addEventListener('click', function() {"
if OLD_SAVE_HANDLER in tv:
    idx_h = tv.find(OLD_SAVE_HANDLER)
    NEW_SWITCH_HANDLER = (
        "/* Switch Scan button */\n"
        "  var switchScanBtn = document.getElementById('topo-switch-scan-btn');\n"
        "  if (switchScanBtn) {\n"
        "    switchScanBtn.addEventListener('click', function() {\n"
        "      TopoVisual.runSwitchScan();\n"
        "    });\n"
        "  }\n\n  "
    )
    tv = tv[:idx_h] + NEW_SWITCH_HANDLER + tv[idx_h:]
    print('OK: Switch Scan handler ✅')

# Додаємо функцію TopoVisual.runSwitchScan()
# Знаходимо місце перед закриттям IIFE
iife_end = tv.rfind('})();')
INSERT_FN = """
  /* ══ Switch Scan → Visual Topology ══ */
  function runSwitchScan() {
    /* Діалог вибору підмережі */
    var subnet = prompt(
      'Підмережа для сканування:\\n' +
      'Наприклад: 192.168.1 (сканує 192.168.1.1-254)\\n' +
      'Або 10.1.51 для вашої мережі',
      '192.168.88'
    );
    if (!subnet) return;

    /* Показуємо статус */
    var statusEl = document.createElement('div');
    statusEl.style.cssText = [
      'position:fixed','bottom:60px','left:50%',
      'transform:translateX(-50%)',
      'background:#0d1117','border:1px solid #5a3a9a',
      'border-radius:10px','padding:16px 24px',
      'color:#c084fc','font-size:13px','font-weight:600',
      'z-index:9999999','text-align:center',
      'box-shadow:0 4px 20px rgba(0,0,0,.6)',
    ].join(';');
    statusEl.innerHTML =
      '🔍 Сканування мережі ' + subnet + '.0/24...<br>' +
      '<span style="color:#4a6070;font-size:11px;">' +
        'ARP таблиця + ping sweep (до 30 сек)' +
      '</span>';
    document.body.appendChild(statusEl);

    /* Викликаємо IPC */
    var _ipc = window.electronAPI ||
      (window.require && window.require('electron').ipcRenderer);

    if (!_ipc || !_ipc.invoke) {
      statusEl.innerHTML = '❌ Electron IPC недоступний';
      statusEl.style.borderColor = '#e08080';
      statusEl.style.color = '#e08080';
      setTimeout(function(){ statusEl.remove(); }, 3000);
      return;
    }

    _ipc.invoke('direct-scan', { subnet: subnet, timeout: 2000 })
      .then(function(data) {
        statusEl.remove();
        if (!data || data.ok === false) {
          alert('Помилка сканування: ' + (data && data.error));
          return;
        }
        var devs = Array.isArray(data.devices) ? data.devices : [];
        if (devs.length === 0) {
          alert('Пристроїв не знайдено в підмережі ' + subnet + '.0/24');
          return;
        }
        /* Додаємо vendor/type через OUILookup */
        devs.forEach(function(d) {
          if (window.OUILookup && d.mac) {
            d.vendor   = OUILookup.lookup(d.mac);
            var dt     = OUILookup.getDeviceType(d.vendor, [], d.hostname||'');
            d.typeIcon = dt.icon;
            d.devType  = dt.type;
          } else {
            d.vendor   = '';
            d.typeIcon = '❓';
            d.devType  = 'Unknown';
          }
        });
        buildSwitchTopology(devs, subnet);
      })
      .catch(function(e) {
        statusEl.remove();
        alert('IPC помилка: ' + e);
      });
  }

  /* ── Будуємо топологію зі scan результатів ── */
  function buildSwitchTopology(devs, subnet) {
    /* Очищаємо поточну топологію */
    if (nodes.length > 0) {
      if (!confirm('Поточна топологія буде замінена. Продовжити?')) return;
    }
    nodes = [];
    links = [];

    var W = 1200;
    var H = 700;
    var CX = W / 2;
    var CY = H / 2;

    /* ── Визначаємо шлюз (gateway) ── */
    var gateway = devs.find(function(d) {
      return d.ip && (d.ip.endsWith('.1') || d.ip.endsWith('.254'));
    }) || devs[0];

    if (!gateway) return;

    /* ── Шлюз — центральний вузол ── */
    var gwType = (gateway.devType||'').toLowerCase().includes('mikrotik')
      ? 'router' : 'switch';
    var gwNode = {
      id:     'sw-gw',
      x:      CX,
      y:      CY - 200,
      type:   gwType,
      label:  gateway.vendor || gateway.ip,
      ip:     gateway.ip,
      mac:    gateway.mac,
      vendor: gateway.vendor || '',
      note:   gateway.typeIcon + ' Gateway | ' + gateway.ip,
    };
    nodes.push(gwNode);

    /* ── Клієнти по колу навколо шлюзу ── */
    var clients = devs.filter(function(d){ return d !== gateway; });

    /* Групуємо по типу */
    var switches = clients.filter(function(d) {
      var t = (d.devType||'').toLowerCase();
      return t.includes('switch') || t.includes('cisco') ||
             t.includes('tp-link') || t.includes('ubiquiti');
    });
    var others = clients.filter(function(d) {
      return !switches.includes(d);
    });

    /* Спочатку додаємо свічі */
    switches.forEach(function(sw, i) {
      var angle = (i / Math.max(switches.length, 1)) * Math.PI * 2;
      var R = 250;
      var swNode = {
        id:     'sw-' + sw.ip.replace(/\./g,'_'),
        x:      CX + R * Math.cos(angle),
        y:      CY - 200 + R * Math.sin(angle) + 100,
        type:   'switch',
        label:  sw.vendor || sw.ip,
        ip:     sw.ip,
        mac:    sw.mac,
        vendor: sw.vendor || '',
        note:   sw.typeIcon + ' ' + sw.devType + ' | ' + sw.ip,
      };
      nodes.push(swNode);
      links.push({
        from: gwNode.id, to: swNode.id,
        label: '', dashed: false,
      });
    });

    /* Якщо немає свічів але є клієнти — ймовірно некерований свіч */
    var hasInferred = false;
    if (switches.length === 0 && others.length > 2) {
      var infNode = {
        id:     'sw-inferred',
        x:      CX,
        y:      CY,
        type:   'switch',
        label:  'Некерований Switch',
        ip:     '',
        mac:    '',
        vendor: '',
        note:   '⚠️ Автовизначено по кількості пристроїв',
      };
      nodes.push(infNode);
      links.push({
        from: gwNode.id, to: infNode.id,
        label: '', dashed: true,
      });
      hasInferred = true;
    }

    /* Клієнти по колу */
    var R2 = switches.length > 0 ? 350 : 280;
    others.forEach(function(d, i) {
      var angle = (i / Math.max(others.length, 1)) * Math.PI * 2 - Math.PI/2;
      var devType = (d.devType||'Unknown').toLowerCase();
      var nodeType = devType.includes('camera') ? 'device'
                   : devType.includes('pc')     ? 'pc'
                   : devType.includes('phone')  ? 'phone'
                   : devType.includes('server') ? 'server'
                   : devType.includes('ap')     ? 'ap'
                   : 'device';

      var devNode = {
        id:     'dev-' + d.ip.replace(/\./g,'_'),
        x:      CX + R2 * Math.cos(angle),
        y:      CY + 100 + R2 * Math.sin(angle),
        type:   nodeType,
        label:  d.hostname || d.vendor || d.ip,
        ip:     d.ip,
        mac:    d.mac,
        vendor: d.vendor || '',
        note:   (d.typeIcon||'❓') + ' ' + (d.devType||'') + ' | ' + d.ip,
      };
      nodes.push(devNode);

      /* Підключаємо до свіча або шлюзу */
      var parentId = hasInferred
        ? 'sw-inferred'
        : (switches.length > 0
          ? ('sw-' + switches[0].ip.replace(/\./g,'_'))
          : gwNode.id);

      links.push({ from: parentId, to: devNode.id, label: '', dashed: false });
    });

    /* Оновлюємо OUI онлайн для Unknown */
    if (window.OUILookup && OUILookup.lookupOnline) {
      nodes.filter(function(n){ return n.mac && !n.vendor; })
           .forEach(function(n, i) {
        setTimeout(function() {
          OUILookup.lookupOnline(n.mac, function(v) {
            if (v && v !== 'Unknown') {
              n.vendor = v;
              n.note = n.note.replace('❓', '');
              redraw();
            }
          });
        }, i * 600);
      });
    }

    /* Рендеримо */
    redraw();

    /* Повідомлення */
    var msg = document.createElement('div');
    msg.style.cssText = [
      'position:fixed','bottom:60px','left:50%',
      'transform:translateX(-50%)',
      'background:#0d1117','border:1px solid #5fd0a5',
      'border-radius:10px','padding:14px 24px',
      'color:#5fd0a5','font-size:13px','font-weight:600',
      'z-index:9999999','text-align:center',
    ].join(';');
    msg.innerHTML =
      '✅ Топологія побудована!<br>' +
      '<span style="color:#4a6070;font-size:11px;">' +
        nodes.length + ' вузлів, ' + links.length + ' зв\'язків | ' +
        'Підмережа: ' + subnet + '.0/24' +
      '</span>';
    document.body.appendChild(msg);
    setTimeout(function(){ msg.remove(); }, 4000);
  }

  /* Публічний API */
  window.TopoVisual = window.TopoVisual || {};
  window.TopoVisual.runSwitchScan = runSwitchScan;
  window.TopoVisual.buildSwitchTopology = buildSwitchTopology;

"""

if iife_end > 0:
    tv = tv[:iife_end] + INSERT_FN + tv[iife_end:]
    print('OK: runSwitchScan + buildSwitchTopology додано ✅')

with open('topology-visual.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(tv)

r3 = subprocess.run(['node','--check','topology-visual.js'],
                    capture_output=True, text=True)
print('topology-visual:', 'OK ✅' if r3.returncode==0 else '❌\n'+r3.stderr[:200])

# ════════════════════════════════════
# 4. GIT
# ════════════════════════════════════
subprocess.run(['git','rebase','--abort'], capture_output=True)
subprocess.run(['git','pull','--no-rebase','origin','main'], capture_output=True)
subprocess.run(['git','add','-A'], capture_output=True)
subprocess.run(['git','commit','-m',
    'feat: direct-scan IPC in main.js, switch topology in topology-visual'],
    capture_output=True)
r_push = subprocess.run(
    ['git','push','--force-with-lease','origin','main'],
    capture_output=True, text=True
)
print('git push:', r_push.stdout.strip() or r_push.stderr.strip()[-100:])
print('\nВсе готово! npm start')