# -*- coding: utf-8 -*-
import subprocess

# ════════════════════════════════════
# 1. Універсальний адаптер команд
# ════════════════════════════════════
ADAPTER_JS = (
    "'use strict';\n\n"
    "/* ══════════════════════════════════════════════════\n"
    "   RouterOS Universal Adapter\n"
    "   Автодетект версії + адаптація команд v6↔v7\n"
    "   ══════════════════════════════════════════════════ */\n\n"
    "window.ROSAdapter = {\n\n"

    "  _version: null,    /* '6' або '7' */\n"
    "  _model:   null,    /* 'hAP ac lite' тощо */\n"
    "  _board:   null,    /* 'RB952Ui-5ac2nD' тощо */\n"
    "  _packages: [],     /* встановлені пакети */\n\n"

    "  /* ── Завантажує версію з REST API ── */\n"
    "  detect: function() {\n"
    "    var router = window.getActiveRouter ? window.getActiveRouter() : null;\n"
    "    if (!router) return Promise.resolve(null);\n"
    "    return Promise.allSettled([\n"
    "      window.restCall(router, 'GET', '/system/resource'),\n"
    "      window.restCall(router, 'GET', '/system/routerboard'),\n"
    "      window.restCall(router, 'GET', '/system/package'),\n"
    "    ]).then(function(results) {\n"
    "      /* Resource */\n"
    "      var res = results[0].status === 'fulfilled' ? results[0].value : {};\n"
    "      if (Array.isArray(res)) res = res[0] || {};\n"
    "      var ver = String(res.version || '7');\n"
    "      ROSAdapter._version  = ver.charAt(0);\n"
    "      ROSAdapter._verFull  = ver;\n"
    "      ROSAdapter._model    = res['board-name'] || res['platform'] || '?';\n"
    "      ROSAdapter._arch     = res['architecture-name'] || '?';\n"
    "      ROSAdapter._cpu      = res['cpu'] || '?';\n"
    "      ROSAdapter._ram      = res['total-memory'] || '?';\n"
    "      ROSAdapter._freeRam  = res['free-memory'] || '?';\n"
    "      ROSAdapter._cpuLoad  = res['cpu-load'] || '0';\n"
    "      ROSAdapter._uptime   = res['uptime'] || '?';\n"
    "      /* Routerboard */\n"
    "      var rb = results[1].status === 'fulfilled' ? results[1].value : {};\n"
    "      if (Array.isArray(rb)) rb = rb[0] || {};\n"
    "      ROSAdapter._board    = rb['board-name'] || rb.model || ROSAdapter._model;\n"
    "      ROSAdapter._serial   = rb['serial-number'] || '?';\n"
    "      ROSAdapter._firmware = rb['current-firmware'] || '?';\n"
    "      /* Packages */\n"
    "      var pkgs = results[2].status === 'fulfilled' ? results[2].value : [];\n"
    "      if (!Array.isArray(pkgs)) pkgs = [];\n"
    "      ROSAdapter._packages = pkgs\n"
    "        .filter(function(p) { return p.disabled !== 'true'; })\n"
    "        .map(function(p) { return p.name; });\n"
    "      /* Детектуємо WiFi стек */\n"
    "      ROSAdapter._wifiStack = 'none';\n"
    "      ROSAdapter._packages.forEach(function(p) {\n"
    "        if (p.indexOf('wifi-qcom') >= 0 || p.indexOf('wifi-mediatek') >= 0)\n"
    "          ROSAdapter._wifiStack = 'new';   /* /interface wifi */\n"
    "        else if (p === 'wireless')\n"
    "          ROSAdapter._wifiStack = 'old';   /* /interface wireless */\n"
    "      });\n"
    "      /* v6 завжди старий стек */\n"
    "      if (ROSAdapter._version === '6') ROSAdapter._wifiStack = 'old';\n"
    "      console.log('[ROSAdapter] Detected:',\n"
    "        'v' + ROSAdapter._verFull,\n"
    "        ROSAdapter._board,\n"
    "        'WiFi:' + ROSAdapter._wifiStack, '✅');\n"
    "      /* Зберігаємо в роутер */\n"
    "      if (router) {\n"
    "        router._rosInfo = ROSAdapter.getSummary();\n"
    "      }\n"
    "      return ROSAdapter.getSummary();\n"
    "    });\n"
    "  },\n\n"

    "  /* ── Підсумок для AI промпту ── */\n"
    "  getSummary: function() {\n"
    "    return {\n"
    "      version:   ROSAdapter._version   || '7',\n"
    "      verFull:   ROSAdapter._verFull   || '7.x',\n"
    "      model:     ROSAdapter._model     || '?',\n"
    "      board:     ROSAdapter._board     || '?',\n"
    "      arch:      ROSAdapter._arch      || '?',\n"
    "      serial:    ROSAdapter._serial    || '?',\n"
    "      firmware:  ROSAdapter._firmware  || '?',\n"
    "      cpu:       ROSAdapter._cpu       || '?',\n"
    "      cpuLoad:   ROSAdapter._cpuLoad   || '0',\n"
    "      ram:       ROSAdapter._ram       || '?',\n"
    "      freeRam:   ROSAdapter._freeRam   || '?',\n"
    "      uptime:    ROSAdapter._uptime    || '?',\n"
    "      packages:  ROSAdapter._packages  || [],\n"
    "      wifiStack: ROSAdapter._wifiStack || 'none',\n"
    "      isV7:      ROSAdapter._version === '7',\n"
    "      isV6:      ROSAdapter._version === '6',\n"
    "      hasWifi:   ROSAdapter._wifiStack !== 'none',\n"
    "      hasWireGuard: (ROSAdapter._packages || []).indexOf('wireguard') >= 0\n"
    "                 || ROSAdapter._version === '7',\n"
    "    };\n"
    "  },\n\n"

    "  /* ── Адаптує команди під версію ── */\n"
    "  adaptCommand: function(cmd) {\n"
    "    var v = ROSAdapter._version || '7';\n"
    "    var ws = ROSAdapter._wifiStack || 'new';\n"
    "    var c = cmd.trim();\n\n"

    "    /* WiFi: новий стек ↔ старий */\n"
    "    if (ws === 'old') {\n"
    "      /* v7 new → v6 old */\n"
    "      c = c.replace('/interface wifi registration-table', '/interface wireless registration-table');\n"
    "      c = c.replace('/interface wifi capsman',            '/caps-man');\n"
    "      c = c.replace('/interface wifi security',           '/interface wireless security-profiles');\n"
    "      c = c.replace('/interface wifi configuration',      '/caps-man configuration');\n"
    "      c = c.replace('/interface wifi provisioning',       '/caps-man provisioning');\n"
    "      c = c.replace('/interface wifi channel',            '/caps-man channel');\n"
    "      c = c.replace('/interface wifi print',              '/interface wireless print');\n"
    "    } else {\n"
    "      /* v6 old → v7 new */\n"
    "      c = c.replace('/interface wireless registration-table', '/interface wifi registration-table');\n"
    "      c = c.replace('/caps-man manager',                 '/interface wifi capsman');\n"
    "      c = c.replace('/interface wireless security-profiles', '/interface wifi security');\n"
    "      c = c.replace('/caps-man configuration',           '/interface wifi configuration');\n"
    "      c = c.replace('/caps-man provisioning',            '/interface wifi provisioning');\n"
    "    }\n\n"

    "    /* BGP: v6 → v7 */\n"
    "    if (v === '7') {\n"
    "      c = c.replace('/routing bgp instance', '/routing bgp template');\n"
    "      c = c.replace('/routing bgp peer',     '/routing bgp connection');\n"
    "      c = c.replace('/routing filter',       '/routing filter rule');\n"
    "      c = c.replace('/routing ospf network', '/routing ospf interface-template');\n"
    "    }\n\n"

    "    return c;\n"
    "  },\n\n"

    "  /* ── Адаптує масив команд ── */\n"
    "  adaptCommands: function(commands) {\n"
    "    return commands.map(function(cmd) {\n"
    "      var adapted = ROSAdapter.adaptCommand(cmd);\n"
    "      if (adapted !== cmd) {\n"
    "        console.log('[ROSAdapter] Adapted:', cmd, '→', adapted);\n"
    "      }\n"
    "      return adapted;\n"
    "    });\n"
    "  },\n\n"

    "  /* ── Контекст для AI промпту ── */\n"
    "  getAIContext: function() {\n"
    "    var s = ROSAdapter.getSummary();\n"
    "    if (!s.verFull || s.verFull === '7.x') return '';\n"
    "    var lines = [\n"
    "      '=== ROUTER HARDWARE & SOFTWARE ===',\n"
    "      'RouterOS version: ' + s.verFull + ' (major: v' + s.version + ')',\n"
    "      'Model: '    + s.model,\n"
    "      'Board: '    + s.board,\n"
    "      'CPU: '      + s.cpu + ' load: ' + s.cpuLoad + '%',\n"
    "      'RAM: free ' + s.freeRam + ' / total ' + s.ram,\n"
    "      'Uptime: '   + s.uptime,\n"
    "      'WiFi stack: ' + (s.wifiStack === 'new'\n"
    "        ? 'NEW (/interface wifi) — v7 commands'\n"
    "        : s.wifiStack === 'old'\n"
    "          ? 'OLD (/interface wireless) — v6 commands'\n"
    "          : 'none'),\n"
    "      'Packages: ' + s.packages.join(', '),\n"
    "      'WireGuard: ' + (s.hasWireGuard ? 'YES' : 'NO'),\n"
    "      '--- COMMAND RULES FOR THIS ROUTER ---',\n"
    "      s.isV7\n"
    "        ? 'USE v7 syntax: /interface wifi, /routing bgp connection, /routing filter rule'\n"
    "        : 'USE v6 syntax: /interface wireless, /routing bgp peer, /caps-man',\n"
    "      s.wifiStack === 'old'\n"
    "        ? 'WiFi: /interface wireless (NOT /interface wifi)'\n"
    "        : 'WiFi: /interface wifi (NOT /interface wireless)',\n"
    "    ];\n"
    "    return lines.join('\\n');\n"
    "  }\n"
    "};\n\n"

    "/* ── Автодетект при підключенні роутера ── */\n"
    "document.addEventListener('DOMContentLoaded', function() {\n"
    "  /* Чекаємо поки router-manager завантажиться */\n"
    "  setTimeout(function() {\n"
    "    if (window.getActiveRouter && window.getActiveRouter()) {\n"
    "      ROSAdapter.detect();\n"
    "    }\n"
    "    /* Повторно при зміні роутера */\n"
    "    var _orig = window.getActiveRouter;\n"
    "    var _last = null;\n"
    "    setInterval(function() {\n"
    "      if (!window.getActiveRouter) return;\n"
    "      var r = window.getActiveRouter();\n"
    "      var id = r ? r.id : null;\n"
    "      if (id && id !== _last) {\n"
    "        _last = id;\n"
    "        ROSAdapter.detect().then(function(info) {\n"
    "          if (info) console.log('[ROSAdapter] Router changed, re-detected:', info);\n"
    "        });\n"
    "      }\n"
    "    }, 3000);\n"
    "  }, 2000);\n"
    "});\n\n"
    "console.log('[ROSAdapter] Ready ✅');\n"
)

with open('ai-agent/ros-adapter.js', 'w', encoding='utf-8') as f:
    f.write(ADAPTER_JS)

r = subprocess.run(['node', '--check', 'ai-agent/ros-adapter.js'],
                   capture_output=True, text=True)
print('ros-adapter.js:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:200])

# ════════════════════════════════════
# 2. Інтегруємо в ai-agent-core.js
# ════════════════════════════════════
with open('ai-agent/ai-agent-core.js', 'r', encoding='utf-8') as f:
    core = f.read()

# Додаємо ROSAdapter контекст в AIAgent.send
old_send = (
    "      /* Додаємо KB перед кожною відповіддю */\n"
    "      if (window.MikroTikKB) {\n"
)

new_send = (
    "      /* Додаємо інфо про версію роутера */\n"
    "      if (window.ROSAdapter && ROSAdapter._version) {\n"
    "        var adapterCtx = ROSAdapter.getAIContext();\n"
    "        if (adapterCtx) {\n"
    "          systemContent += '\\n\\n' + adapterCtx;\n"
    "        }\n"
    "      }\n\n"
    "      /* Додаємо KB перед кожною відповіддю */\n"
    "      if (window.MikroTikKB) {\n"
)

if old_send in core:
    core = core.replace(old_send, new_send)
    print('OK: ROSAdapter в send() ✅')
else:
    print('WARN: не знайдено — шукаємо MikroTikKB')
    idx = core.find('MikroTikKB')
    print(repr(core[max(0,idx-100):idx+100]))

with open('ai-agent/ai-agent-core.js', 'w', encoding='utf-8') as f:
    f.write(core)

r2 = subprocess.run(['node', '--check', 'ai-agent/ai-agent-core.js'],
                    capture_output=True, text=True)
print('core:', 'OK ✅' if r2.returncode == 0 else '❌\n' + r2.stderr[:200])

# ════════════════════════════════════
# 3. Адаптуємо команди перед виконанням
# ════════════════════════════════════
with open('ai-agent/ai-agent-executor.js', 'r', encoding='utf-8') as f:
    ex = f.read()

old_clean = (
    "    /* Очищаємо команди від \\\\ продовжень рядків */\n"
    "    var cleanCmds = commands.map(function(cmd) {\n"
)

new_clean = (
    "    /* Очищаємо команди від \\\\ продовжень рядків */\n"
    "    var cleanCmds = commands.map(function(cmd) {\n"
)

# Знаходимо де cleanCmds завершується і додаємо адаптацію
old_after_clean = "    var hasDangerous = cleanCmds.some(function(c) {"
new_after_clean = (
    "    /* Адаптуємо команди під версію роутера */\n"
    "    if (window.ROSAdapter && ROSAdapter._version) {\n"
    "      cleanCmds = ROSAdapter.adaptCommands(cleanCmds);\n"
    "    }\n\n"
    "    var hasDangerous = cleanCmds.some(function(c) {"
)

if old_after_clean in ex:
    ex = ex.replace(old_after_clean, new_after_clean)
    print('OK: adaptCommands перед виконанням ✅')

# ROSValidator також отримує версію з ROSAdapter
old_version = "      var rosVersion = ROSValidator.getRouterVersion();"
new_version = (
    "      var rosVersion = window.ROSAdapter\n"
    "        ? ROSAdapter._version || '7'\n"
    "        : ROSValidator.getRouterVersion();"
)

if old_version in ex:
    ex = ex.replace(old_version, new_version)
    print('OK: ROSValidator використовує ROSAdapter версію ✅')

with open('ai-agent/ai-agent-executor.js', 'w', encoding='utf-8') as f:
    f.write(ex)

r3 = subprocess.run(['node', '--check', 'ai-agent/ai-agent-executor.js'],
                    capture_output=True, text=True)
print('executor:', 'OK ✅' if r3.returncode == 0 else '❌\n' + r3.stderr[:200])

# ════════════════════════════════════
# 4. Підключаємо в index.html
# ════════════════════════════════════
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

if 'ros-adapter.js' not in html:
    html = html.replace(
        '<script src="ai-agent/ros-validator.js"></script>',
        '<script src="ai-agent/ros-adapter.js"></script>\n  <script src="ai-agent/ros-validator.js"></script>'
    )
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print('OK: ros-adapter.js в index.html ✅')

print('\nВсе готово! npm start')
print('\nПеревірка в консолі:')
print('  ROSAdapter._version   // 6 або 7')
print('  ROSAdapter._board     // модель роутера')
print('  ROSAdapter._wifiStack // old/new/none')
print('  ROSAdapter.getAIContext() // що бачить AI')