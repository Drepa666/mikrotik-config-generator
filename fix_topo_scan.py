# -*- coding: utf-8 -*-
import subprocess

# Вже відновлено з 5658b56 — перевіряємо
r = subprocess.run(['node','--check','topology-visual.js'], capture_output=True, text=True)
print('topology-visual:', 'OK' if r.returncode==0 else 'BROKEN - run fix_clean.py first')
if r.returncode != 0:
    exit(1)

with open('topology-visual.js', 'r', encoding='utf-8') as f:
    tv = f.read()
tv = tv.replace('\r\n', '\n')

# ════════════════════════════════════
# 1. Кнопка Switch Scan в toolbar
# ════════════════════════════════════
import re

btn_match = re.search(
    r"'<button id=\"topo-save-btn\"[^']*?</button>'",
    tv, re.DOTALL
)
if btn_match and 'topo-switch-scan-btn' not in tv:
    OLD_SAVE = btn_match.group()
    NEW_SAVE = (
        OLD_SAVE +
        " +\n    '<button id=\"topo-switch-scan-btn\""
        " title=\"Scan network and build topology\""
        " style=\"background:linear-gradient(135deg,#1a1a3a,#2a1a5a);"
        "border:1px solid #5a3a9a;color:#c084fc;padding:5px 10px;"
        "border-radius:5px;cursor:pointer;font-size:11px;font-weight:700;"
        "margin-left:4px;\">"
        "\U0001f50c Switch Scan</button>'"
    )
    tv = tv.replace(OLD_SAVE, NEW_SAVE, 1)
    print('OK: Switch Scan button added')
elif 'topo-switch-scan-btn' in tv:
    print('OK: button already exists')
else:
    print('WARN: topo-save-btn not found')
    idx = tv.find('topo-save-btn')
    print(repr(tv[max(0,idx-30):idx+80]))

# ════════════════════════════════════
# 2. Handler кнопки
# ════════════════════════════════════
HANDLER_MARKER = "document.getElementById('topo-save-btn').addEventListener"
if HANDLER_MARKER in tv and 'topo-switch-scan-btn' not in tv[:tv.find(HANDLER_MARKER)+10]:
    HANDLER_INSERT = (
        "var _ssBtnEl = document.getElementById('topo-switch-scan-btn');\n"
        "  if (_ssBtnEl) _ssBtnEl.addEventListener('click', runSwitchScan);\n\n  "
    )
    tv = tv.replace(HANDLER_MARKER, HANDLER_INSERT + HANDLER_MARKER, 1)
    print('OK: handler added')
else:
    print('OK: handler already exists or marker not found')

# ════════════════════════════════════
# 3. Функції — вставляємо перед })();
#    ТІЛЬКИ ASCII + \uXXXX — без кирилиці в рядках!
# ════════════════════════════════════
if 'function runSwitchScan' not in tv:
    iife_end = tv.rfind('})();')
    if iife_end < 0:
        print('WARN: IIFE end not found')
    else:
        # Всі рядки — ASCII only або unicode escapes
        FN = (
            "\n"
            "  /* == Switch Scan -> Visual Topology == */\n"
            "  function runSwitchScan() {\n"
            "    var subnet = prompt('Subnet to scan (e.g. 192.168.88 or 10.1.51):', '192.168.88');\n"
            "    if (!subnet || !subnet.trim()) return;\n"
            "    subnet = subnet.trim();\n"
            "\n"
            "    var st = document.createElement('div');\n"
            "    st.id = 'sw-scan-status';\n"
            "    st.style.cssText = 'position:fixed;bottom:60px;left:50%;transform:translateX(-50%);'\n"
            "      + 'background:#0d1117;border:2px solid #5a3a9a;border-radius:10px;'\n"
            "      + 'padding:16px 28px;color:#c084fc;font-size:13px;font-weight:700;'\n"
            "      + 'z-index:9999999;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.7);';\n"
            "    st.innerHTML = '\U0001f50d Scanning ' + subnet + '.0/24...<br>'\n"
            "      + '<span style=\"color:#4a6070;font-size:11px;\">ARP + ping sweep</span>';\n"
            "    document.body.appendChild(st);\n"
            "\n"
            "    var _ipc = window.electronAPI\n"
            "      || (window.require && window.require('electron').ipcRenderer);\n"
            "\n"
            "    if (!_ipc || !_ipc.invoke) {\n"
            "      st.textContent = '\u274c IPC not available';\n"
            "      st.style.borderColor = '#e08080';\n"
            "      setTimeout(function(){ st.remove(); }, 3000);\n"
            "      return;\n"
            "    }\n"
            "\n"
            "    _ipc.invoke('direct-scan', { subnet: subnet, timeout: 2000 })\n"
            "      .then(function(data) {\n"
            "        st.remove();\n"
            "        if (!data || data.ok === false) {\n"
            "          alert('Scan error: ' + (data && data.error || 'unknown'));\n"
            "          return;\n"
            "        }\n"
            "        var devs = Array.isArray(data.devices) ? data.devices : [];\n"
            "        if (devs.length === 0) {\n"
            "          alert('No devices found in ' + subnet + '.0/24');\n"
            "          return;\n"
            "        }\n"
            "        /* Vendor lookup */\n"
            "        devs.forEach(function(d) {\n"
            "          if (window.OUILookup && d.mac) {\n"
            "            d.vendor   = OUILookup.lookup(d.mac);\n"
            "            var dt     = OUILookup.getDeviceType(d.vendor, [], d.hostname || '');\n"
            "            d.typeIcon = dt.icon;\n"
            "            d.devType  = dt.type;\n"
            "          } else {\n"
            "            d.vendor = ''; d.typeIcon = '?'; d.devType = 'Unknown';\n"
            "          }\n"
            "        });\n"
            "        buildSwitchTopology(devs, subnet);\n"
            "      })\n"
            "      .catch(function(e) {\n"
            "        st.remove();\n"
            "        alert('IPC error: ' + e);\n"
            "      });\n"
            "  }\n"
            "\n"
            "  function buildSwitchTopology(devs, subnet) {\n"
            "    if (nodes.length > 0) {\n"
            "      if (!confirm('Replace current topology?')) return;\n"
            "    }\n"
            "    nodes = []; links = [];\n"
            "\n"
            "    var CX = 600; var CY = 420;\n"
            "\n"
            "    /* Gateway — .1 or .254 */\n"
            "    var gw = devs.find(function(d) {\n"
            "      return d.ip && (d.ip.endsWith('.1') || d.ip.endsWith('.254'));\n"
            "    }) || devs[0];\n"
            "    if (!gw) { alert('Cannot detect gateway'); return; }\n"
            "\n"
            "    var gwType = (gw.devType || '').toLowerCase().includes('router')\n"
            "      ? 'router' : 'switch';\n"
            "\n"
            "    nodes.push({\n"
            "      id: 'gw', x: CX, y: 140, type: gwType,\n"
            "      label: gw.vendor || gw.ip,\n"
            "      ip: gw.ip, mac: gw.mac || '',\n"
            "      vendor: gw.vendor || '',\n"
            "      note: (gw.typeIcon || '') + ' ' + gw.ip\n"
            "        + (gw.mac ? ' | ' + gw.mac : ''),\n"
            "    });\n"
            "\n"
            "    /* Managed switches */\n"
            "    var switches = devs.filter(function(d) {\n"
            "      if (d === gw) return false;\n"
            "      var t = (d.devType || '').toLowerCase();\n"
            "      return t.includes('switch') || t.includes('cisco')\n"
            "          || t.includes('tp-link') || t.includes('ubiquiti');\n"
            "    });\n"
            "\n"
            "    switches.forEach(function(sw, i) {\n"
            "      var angle = (i / Math.max(switches.length, 1)) * Math.PI * 2;\n"
            "      var swNode = {\n"
            "        id: 'sw_' + i,\n"
            "        x: CX + 260 * Math.cos(angle),\n"
            "        y: CY + 260 * Math.sin(angle),\n"
            "        type: 'switch',\n"
            "        label: sw.vendor || sw.ip,\n"
            "        ip: sw.ip, mac: sw.mac || '',\n"
            "        vendor: sw.vendor || '',\n"
            "        note: (sw.typeIcon || '') + ' ' + sw.ip,\n"
            "      };\n"
            "      nodes.push(swNode);\n"
            "      links.push({ from: 'gw', to: swNode.id, label: '', dashed: false });\n"
            "    });\n"
            "\n"
            "    /* Other devices */\n"
            "    var others = devs.filter(function(d) {\n"
            "      return d !== gw && switches.indexOf(d) < 0;\n"
            "    });\n"
            "\n"
            "    /* If no switches found — add inferred unmanaged switch */\n"
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
            "    var R = 330;\n"
            "    others.forEach(function(d, i) {\n"
            "      var angle = (i / Math.max(others.length, 1)) * Math.PI * 2 - Math.PI / 2;\n"
            "      var t = (d.devType || '').toLowerCase();\n"
            "      var ntype = t.includes('camera') ? 'device'\n"
            "                : t.includes('phone')  ? 'phone'\n"
            "                : t.includes('server') ? 'server'\n"
            "                : t.includes('ap')     ? 'ap'\n"
            "                : 'pc';\n"
            "      nodes.push({\n"
            "        id: 'dev_' + i,\n"
            "        x: CX + R * Math.cos(angle),\n"
            "        y: CY + 130 + R * Math.sin(angle),\n"
            "        type: ntype,\n"
            "        label: d.hostname || d.vendor || d.ip,\n"
            "        ip: d.ip, mac: d.mac || '',\n"
            "        vendor: d.vendor || '',\n"
            "        note: (d.typeIcon || '?') + ' ' + (d.devType || '') + ' | ' + d.ip\n"
            "          + (d.mac ? ' | ' + d.mac : ''),\n"
            "      });\n"
            "      links.push({ from: parentId, to: 'dev_' + i, label: '', dashed: false });\n"
            "    });\n"
            "\n"
            "    /* Online OUI for unknowns */\n"
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
            "    /* Success toast */\n"
            "    var msg = document.createElement('div');\n"
            "    msg.style.cssText = 'position:fixed;bottom:60px;left:50%;transform:translateX(-50%);'\n"
            "      + 'background:#0d1117;border:2px solid #5fd0a5;border-radius:10px;'\n"
            "      + 'padding:14px 28px;color:#5fd0a5;font-size:13px;font-weight:700;'\n"
            "      + 'z-index:9999999;text-align:center;';\n"
            "    msg.textContent = '\u2705 Topology: ' + nodes.length + ' nodes, '\n"
            "      + links.length + ' links | ' + subnet + '.0/24';\n"
            "    document.body.appendChild(msg);\n"
            "    setTimeout(function(){ msg.remove(); }, 4000);\n"
            "  }\n"
            "\n"
            "  window.TopoVisual = window.TopoVisual || {};\n"
            "  window.TopoVisual.runSwitchScan       = runSwitchScan;\n"
            "  window.TopoVisual.buildSwitchTopology = buildSwitchTopology;\n"
        )
        tv = tv[:iife_end] + FN + tv[iife_end:]
        print('OK: runSwitchScan + buildSwitchTopology inserted')
else:
    print('OK: functions already exist')

with open('topology-visual.js', 'w', encoding='utf-8') as f:
    f.write(tv)

r2 = subprocess.run(['node','--check','topology-visual.js'], capture_output=True, text=True)
print('topology-visual:', 'OK \u2705' if r2.returncode==0 else '\u274c\n'+r2.stderr[:300])

# Git
subprocess.run(['git','add','-A'], capture_output=True)
subprocess.run(['git','commit','-m',
    'feat: Switch Scan in topology-visual, ASCII-safe JS, direct-scan IPC'],
    capture_output=True)
r_push = subprocess.run(
    ['git','push','origin','main'],
    capture_output=True, text=True
)
print('push:', r_push.stdout.strip() or r_push.stderr.strip()[-80:])
print('\nDone! npm start')