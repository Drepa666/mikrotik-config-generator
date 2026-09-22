# -*- coding: utf-8 -*-
import subprocess

# Відновлюємо topology-visual.js з git
subprocess.run(['git','checkout','HEAD','--','topology-visual.js'], capture_output=True)
r = subprocess.run(['node','--check','topology-visual.js'], capture_output=True, text=True)
print('Відновлено:', 'OK ✅' if r.returncode==0 else '❌')

with open('topology-visual.js', 'r', encoding='utf-8') as f:
    tv = f.read()
tv = tv.replace('\r\n', '\n')

# Кнопка Switch Scan
import re
btn_match = re.search(r"'<button id=\"topo-save-btn\".*?Зберегти</button>'", tv, re.DOTALL)
if btn_match:
    OLD_SAVE = btn_match.group()
    NEW_SAVE = (
        OLD_SAVE +
        " +\n"
        "    '<button id=\"topo-switch-scan-btn\""
        " style=\"background:linear-gradient(135deg,#1a1a3a,#2a1a5a);"
        "border:1px solid #5a3a9a;color:#c084fc;padding:5px 10px;"
        "border-radius:5px;cursor:pointer;font-size:11px;font-weight:700;\">"
        "\U0001f50c Switch Scan</button>'"
    )
    tv = tv.replace(OLD_SAVE, NEW_SAVE, 1)
    print('OK: \U0001f50c Switch Scan \u043a\u043d\u043e\u043f\u043a\u0430 \u2705')

# Handler кнопки
OLD_HANDLER = "document.getElementById('topo-save-btn').addEventListener('click', function() {"
if OLD_HANDLER in tv:
    NEW_BEFORE = (
        "var _swScanBtn = document.getElementById('topo-switch-scan-btn');\n"
        "  if (_swScanBtn) _swScanBtn.addEventListener('click', runSwitchScan);\n\n  "
    )
    tv = tv.replace(OLD_HANDLER, NEW_BEFORE + OLD_HANDLER, 1)
    print('OK: handler \u2705')

# Функції — вставляємо перед })();
iife_end = tv.rfind('})();')

# Всі рядки ASCII + unicode escapes щоб уникнути проблем з кодуванням
INSERT_FN = (
    "\n"
    "  /* == Switch Scan -> Visual Topology == */\n"
    "  function runSwitchScan() {\n"
    "    var subnet = prompt(\n"
    "      'Subnet (e.g. 192.168.88 or 10.1.51):',\n"
    "      '192.168.88'\n"
    "    );\n"
    "    if (!subnet) return;\n"
    "\n"
    "    var statusEl = document.createElement('div');\n"
    "    statusEl.style.cssText = [\n"
    "      'position:fixed','bottom:60px','left:50%',\n"
    "      'transform:translateX(-50%)',\n"
    "      'background:#0d1117','border:1px solid #5a3a9a',\n"
    "      'border-radius:10px','padding:16px 24px',\n"
    "      'color:#c084fc','font-size:13px','font-weight:600',\n"
    "      'z-index:9999999','text-align:center',\n"
    "      'box-shadow:0 4px 20px rgba(0,0,0,.6)',\n"
    "    ].join(';');\n"
    "    statusEl.textContent = '\U0001f50d Scanning ' + subnet + '.0/24...';\n"
    "    document.body.appendChild(statusEl);\n"
    "\n"
    "    var _ipc = window.electronAPI ||\n"
    "      (window.require && window.require('electron').ipcRenderer);\n"
    "\n"
    "    if (!_ipc || !_ipc.invoke) {\n"
    "      statusEl.textContent = '\u274c Electron IPC not available';\n"
    "      statusEl.style.color = '#e08080';\n"
    "      setTimeout(function(){ statusEl.remove(); }, 3000);\n"
    "      return;\n"
    "    }\n"
    "\n"
    "    _ipc.invoke('direct-scan', { subnet: subnet, timeout: 2000 })\n"
    "      .then(function(data) {\n"
    "        statusEl.remove();\n"
    "        if (!data || data.ok === false) {\n"
    "          alert('Scan error: ' + (data && data.error || 'unknown'));\n"
    "          return;\n"
    "        }\n"
    "        var devs = Array.isArray(data.devices) ? data.devices : [];\n"
    "        if (devs.length === 0) {\n"
    "          alert('No devices found in ' + subnet + '.0/24');\n"
    "          return;\n"
    "        }\n"
    "        devs.forEach(function(d) {\n"
    "          if (window.OUILookup && d.mac) {\n"
    "            d.vendor  = OUILookup.lookup(d.mac);\n"
    "            var dt    = OUILookup.getDeviceType(d.vendor, [], d.hostname || '');\n"
    "            d.typeIcon = dt.icon;\n"
    "            d.devType  = dt.type;\n"
    "          } else {\n"
    "            d.vendor = ''; d.typeIcon = '?'; d.devType = 'Unknown';\n"
    "          }\n"
    "        });\n"
    "        buildSwitchTopology(devs, subnet);\n"
    "      })\n"
    "      .catch(function(e) {\n"
    "        statusEl.remove();\n"
    "        alert('IPC error: ' + e);\n"
    "      });\n"
    "  }\n"
    "\n"
    "  function buildSwitchTopology(devs, subnet) {\n"
    "    if (nodes.length > 0) {\n"
    "      if (!confirm('Replace current topology with scan results?')) return;\n"
    "    }\n"
    "    nodes = []; links = [];\n"
    "\n"
    "    var CX = 600; var CY = 400;\n"
    "\n"
    "    /* Gateway */\n"
    "    var gw = devs.find(function(d) {\n"
    "      return d.ip && (d.ip.endsWith('.1') || d.ip.endsWith('.254'));\n"
    "    }) || devs[0];\n"
    "    if (!gw) return;\n"
    "\n"
    "    var gwNode = {\n"
    "      id: 'gw', x: CX, y: 150,\n"
    "      type: 'switch',\n"
    "      label: gw.vendor || gw.ip,\n"
    "      ip: gw.ip, mac: gw.mac, vendor: gw.vendor || '',\n"
    "      note: (gw.typeIcon || '') + ' ' + gw.ip,\n"
    "    };\n"
    "    nodes.push(gwNode);\n"
    "\n"
    "    /* Switches */\n"
    "    var switches = devs.filter(function(d) {\n"
    "      if (d === gw) return false;\n"
    "      var t = (d.devType || '').toLowerCase();\n"
    "      return t.includes('switch') || t.includes('cisco') || t.includes('tp-link');\n"
    "    });\n"
    "\n"
    "    switches.forEach(function(sw, i) {\n"
    "      var angle = (i / Math.max(switches.length, 1)) * Math.PI * 2;\n"
    "      var swNode = {\n"
    "        id: 'sw_' + i, x: CX + 250 * Math.cos(angle), y: CY + 250 * Math.sin(angle),\n"
    "        type: 'switch', label: sw.vendor || sw.ip,\n"
    "        ip: sw.ip, mac: sw.mac, vendor: sw.vendor || '',\n"
    "        note: (sw.typeIcon || '') + ' ' + sw.ip,\n"
    "      };\n"
    "      nodes.push(swNode);\n"
    "      links.push({ from: 'gw', to: swNode.id, label: '', dashed: false });\n"
    "    });\n"
    "\n"
    "    /* Inferred switch */\n"
    "    var others = devs.filter(function(d){ return d !== gw && !switches.includes(d); });\n"
    "    var parentId = 'gw';\n"
    "    if (switches.length === 0 && others.length > 2) {\n"
    "      nodes.push({\n"
    "        id: 'sw_inf', x: CX, y: CY,\n"
    "        type: 'switch', label: 'Unmanaged Switch',\n"
    "        ip: '', mac: '', vendor: '',\n"
    "        note: 'Auto-detected',\n"
    "      });\n"
    "      links.push({ from: 'gw', to: 'sw_inf', label: '', dashed: true });\n"
    "      parentId = 'sw_inf';\n"
    "    } else if (switches.length > 0) {\n"
    "      parentId = 'sw_0';\n"
    "    }\n"
    "\n"
    "    /* Clients */\n"
    "    var R = 320;\n"
    "    others.forEach(function(d, i) {\n"
    "      var angle = (i / Math.max(others.length, 1)) * Math.PI * 2 - Math.PI / 2;\n"
    "      var t = (d.devType || '').toLowerCase();\n"
    "      var ntype = t.includes('camera') ? 'device'\n"
    "                : t.includes('pc')     ? 'pc'\n"
    "                : t.includes('phone')  ? 'phone'\n"
    "                : t.includes('server') ? 'server'\n"
    "                : 'device';\n"
    "      var devNode = {\n"
    "        id: 'dev_' + i,\n"
    "        x: CX + R * Math.cos(angle),\n"
    "        y: CY + 120 + R * Math.sin(angle),\n"
    "        type: ntype,\n"
    "        label: d.hostname || d.vendor || d.ip,\n"
    "        ip: d.ip, mac: d.mac, vendor: d.vendor || '',\n"
    "        note: (d.typeIcon || '?') + ' ' + (d.devType || '') + ' | ' + d.ip,\n"
    "      };\n"
    "      nodes.push(devNode);\n"
    "      links.push({ from: parentId, to: devNode.id, label: '', dashed: false });\n"
    "    });\n"
    "\n"
    "    /* Online OUI lookup */\n"
    "    if (window.OUILookup && OUILookup.lookupOnline) {\n"
    "      nodes.filter(function(n){ return n.mac && !n.vendor; })\n"
    "           .forEach(function(n, i) {\n"
    "        setTimeout(function() {\n"
    "          OUILookup.lookupOnline(n.mac, function(v) {\n"
    "            if (v && v !== 'Unknown') { n.vendor = v; redraw(); }\n"
    "          });\n"
    "        }, i * 600);\n"
    "      });\n"
    "    }\n"
    "\n"
    "    redraw();\n"
    "\n"
    "    /* Success message */\n"
    "    var msg = document.createElement('div');\n"
    "    msg.style.cssText = [\n"
    "      'position:fixed','bottom:60px','left:50%',\n"
    "      'transform:translateX(-50%)',\n"
    "      'background:#0d1117','border:1px solid #5fd0a5',\n"
    "      'border-radius:10px','padding:14px 24px',\n"
    "      'color:#5fd0a5','font-size:13px','font-weight:600',\n"
    "      'z-index:9999999','text-align:center',\n"
    "    ].join(';');\n"
    "    msg.textContent = '\u2705 Topology built: ' + nodes.length +\n"
    "      ' nodes, ' + links.length + ' links | ' + subnet + '.0/24';\n"
    "    document.body.appendChild(msg);\n"
    "    setTimeout(function(){ msg.remove(); }, 4000);\n"
    "  }\n"
    "\n"
    "  window.TopoVisual = window.TopoVisual || {};\n"
    "  window.TopoVisual.runSwitchScan       = runSwitchScan;\n"
    "  window.TopoVisual.buildSwitchTopology = buildSwitchTopology;\n"
)

tv = tv[:iife_end] + INSERT_FN + tv[iife_end:]

with open('topology-visual.js', 'w', encoding='utf-8') as f:
    f.write(tv)

r = subprocess.run(['node','--check','topology-visual.js'], capture_output=True, text=True)
print('topology-visual:', 'OK ✅' if r.returncode==0 else '❌\n'+r.stderr[:300])

subprocess.run(['git','add','-A'], capture_output=True)
subprocess.run(['git','commit','-m',
    'fix: encoding in topology-visual Switch Scan, ASCII-safe JS strings'],
    capture_output=True)
r_push = subprocess.run(
    ['git','push','origin','main'],
    capture_output=True, text=True
)
print('push:', r_push.stdout.strip() or r_push.stderr.strip()[-80:])
print('\nВсе готово! npm start')