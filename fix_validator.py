# -*- coding: utf-8 -*-
import subprocess

# Пишемо окремий файл валідатора
VALIDATOR_JS = (
    "'use strict';\n\n"
    "/* ══════════════════════════════════════════════════════\n"
    "   RouterOS Command Validator v1.0\n"
    "   Перевіряє синтаксис, версію, безпеку команд\n"
    "   ══════════════════════════════════════════════════════ */\n\n"
    "window.ROSValidator = {\n\n"

    "  /* ── Команди які НЕ існують в RouterOS ── */\n"
    "  _invalidCommands: [\n"
    "    { pattern: '/tool traffic-monitor', fix: '/interface monitor-traffic IFACE once' },\n"
    "    { pattern: '/interface monitor start', fix: '/interface monitor-traffic IFACE once' },\n"
    "    { pattern: '/ip firewall enable', fix: '/ip firewall filter enable [find]' },\n"
    "    { pattern: '/system update', fix: '/system package update install' },\n"
    "    { pattern: '/interface wifi enable all', fix: '/interface wifi enable [find]' },\n"
    "    { pattern: '/ip route add default', fix: '/ip route add dst-address=0.0.0.0/0 gateway=GW' },\n"
    "    { pattern: '/tool ping', fix: '/ping address=IP count=4' },\n"
    "    { pattern: 'service=any', fix: 'service=l2tp (вказати конкретно)' },\n"
    "    { pattern: '/caps-man interface add', fix: '/interface wifi configuration add (v7)' },\n"
    "  ],\n\n"

    "  /* ── Команди тільки для v7 ── */\n"
    "  _v7only: [\n"
    "    '/interface wireguard',\n"
    "    '/interface wifi',\n"
    "    '/container',\n"
    "    '/zerotier',\n"
    "    '/routing bgp connection',\n"
    "    '/routing ospf instance',\n"
    "    '/routing filter rule',\n"
    "    '/interface wifi capsman',\n"
    "    '/interface wifi security',\n"
    "    '/interface wifi channel',\n"
    "    '/interface wifi configuration',\n"
    "    '/interface wifi provisioning',\n"
    "  ],\n\n"

    "  /* ── Команди тільки для v6 ── */\n"
    "  _v6only: [\n"
    "    '/caps-man',\n"
    "    '/interface wireless security-profiles',\n"
    "    '/routing bgp instance',\n"
    "    '/routing ospf network',\n"
    "    '/routing filter',\n"
    "  ],\n\n"

    "  /* ── Небезпечні паттерни ── */\n"
    "  _dangerous: [\n"
    "    {\n"
    "      check: function(c) {\n"
    "        return c.indexOf('chain=input') >= 0 &&\n"
    "               c.indexOf('action=drop') >= 0 &&\n"
    "               c.indexOf('in-interface') < 0 &&\n"
    "               c.indexOf('src-address') < 0 &&\n"
    "               c.indexOf('protocol') < 0 &&\n"
    "               c.indexOf('connection-state') < 0;\n"
    "      },\n"
    "      msg: '⚠️ НЕБЕЗПЕЧНО: Голий DROP в input chain!\\nБлокує LAN, DNS, DHCP, Winbox.\\nДодайте: in-interface-list=WAN',\n"
    "      fix: function(c) { return c.replace('action=drop', 'action=drop in-interface-list=WAN'); }\n"
    "    },\n"
    "    {\n"
    "      check: function(c) { return c.indexOf('reset-configuration') >= 0; },\n"
    "      msg: '⚠️ НЕБЕЗПЕЧНО: Скидання всіх налаштувань!',\n"
    "      fix: null\n"
    "    },\n"
    "    {\n"
    "      check: function(c) { return c.indexOf('format') >= 0 && c.indexOf('disk') >= 0; },\n"
    "      msg: '⚠️ НЕБЕЗПЕЧНО: Форматування диску!',\n"
    "      fix: null\n"
    "    },\n"
    "    {\n"
    "      check: function(c) {\n"
    "        return c.indexOf('chain=forward') >= 0 &&\n"
    "               c.indexOf('action=drop') >= 0 &&\n"
    "               c.indexOf('in-interface') < 0 &&\n"
    "               c.indexOf('src-address') < 0;\n"
    "      },\n"
    "      msg: '⚠️ ОБЕРЕЖНО: DROP в forward chain без умов — блокує весь трафік між мережами!',\n"
    "      fix: null\n"
    "    },\n"
    "  ],\n\n"

    "  /* ── Правила синтаксису ── */\n"
    "  _syntaxRules: [\n"
    "    {\n"
    "      check: function(c) { return c.indexOf('\\\\') >= 0 && c.indexOf('\\n') >= 0; },\n"
    "      msg: 'Команда містить продовження рядка (\\\\) — розбийте на окремі команди'\n"
    "    },\n"
    "    {\n"
    "      check: function(c) { return /\\bX\\.X\\.X\\.X\\b/.test(c) || /\\bY\\.Y\\.Y\\.Y\\b/.test(c); },\n"
    "      msg: 'Команда містить placeholder IP (X.X.X.X) — замініть на реальний IP'\n"
    "    },\n"
    "    {\n"
    "      check: function(c) { return c.indexOf('YOUR_') >= 0 || c.indexOf('NEWPASSWORD') >= 0; },\n"
    "      msg: 'Команда містить placeholder — замініть на реальне значення'\n"
    "    },\n"
    "    {\n"
    "      check: function(c) {\n"
    "        return c.indexOf('/ip firewall filter add') >= 0 &&\n"
    "               c.indexOf('comment=') < 0;\n"
    "      },\n"
    "      msg: 'Рекомендація: додайте comment= до firewall правила для ідентифікації'\n"
    "    },\n"
    "  ],\n\n"

    "  /* ── Головна функція валідації ── */\n"
    "  validate: function(commands, rosVersion) {\n"
    "    var results = [];\n"
    "    var version = rosVersion || '7';\n"
    "    var isV7 = version.charAt(0) === '7';\n\n"

    "    commands.forEach(function(cmd) {\n"
    "      var c = cmd.trim().toLowerCase();\n"
    "      var cmdResult = { cmd: cmd, errors: [], warnings: [], fixes: [], ok: true };\n\n"

    "      /* 1. Невалідні команди */\n"
    "      ROSValidator._invalidCommands.forEach(function(rule) {\n"
    "        if (c.indexOf(rule.pattern.toLowerCase()) >= 0) {\n"
    "          cmdResult.errors.push('Команда не існує: ' + rule.pattern);\n"
    "          cmdResult.fixes.push('Правильно: ' + rule.fix);\n"
    "          cmdResult.ok = false;\n"
    "        }\n"
    "      });\n\n"

    "      /* 2. Версія RouterOS */\n"
    "      if (!isV7) {\n"
    "        ROSValidator._v7only.forEach(function(v7cmd) {\n"
    "          if (c.indexOf(v7cmd.toLowerCase()) >= 0) {\n"
    "            cmdResult.errors.push('Команда тільки для RouterOS v7: ' + v7cmd);\n"
    "            cmdResult.ok = false;\n"
    "          }\n"
    "        });\n"
    "      }\n"
    "      if (isV7) {\n"
    "        ROSValidator._v6only.forEach(function(v6cmd) {\n"
    "          if (c.indexOf(v6cmd.toLowerCase()) >= 0) {\n"
    "            cmdResult.warnings.push('Команда від v6, може не працювати в v7: ' + v6cmd);\n"
    "          }\n"
    "        });\n"
    "      }\n\n"

    "      /* 3. Небезпечні паттерни */\n"
    "      ROSValidator._dangerous.forEach(function(rule) {\n"
    "        if (rule.check(c)) {\n"
    "          cmdResult.warnings.push(rule.msg);\n"
    "          if (rule.fix) cmdResult.fixes.push('Автовиправлення: ' + rule.fix(cmd));\n"
    "          cmdResult.ok = false;\n"
    "        }\n"
    "      });\n\n"

    "      /* 4. Синтаксис */\n"
    "      ROSValidator._syntaxRules.forEach(function(rule) {\n"
    "        if (rule.check(cmd)) {\n"
    "          cmdResult.warnings.push(rule.msg);\n"
    "        }\n"
    "      });\n\n"

    "      results.push(cmdResult);\n"
    "    });\n\n"

    "    return results;\n"
    "  },\n\n"

    "  /* ── Отримати версію з контексту роутера ── */\n"
    "  getRouterVersion: function() {\n"
    "    if (!window.getActiveRouter) return '7';\n"
    "    var r = window.getActiveRouter();\n"
    "    if (!r || !r.info) return '7';\n"
    "    var ver = r.info.version || r.version || '7';\n"
    "    return String(ver).charAt(0);\n"
    "  },\n\n"

    "  /* ── HTML для відображення результатів ── */\n"
    "  renderResults: function(results) {\n"
    "    var html = '';\n"
    "    var hasIssues = results.some(function(r) {\n"
    "      return r.errors.length > 0 || r.warnings.length > 0;\n"
    "    });\n"
    "    if (!hasIssues) return '';\n\n"
    "    results.forEach(function(r) {\n"
    "      if (r.errors.length === 0 && r.warnings.length === 0) return;\n"
    "      html += '<div style=\"background:#1a0a0a;border:1px solid #c03030;border-radius:8px;padding:10px 14px;margin-bottom:8px;\">';\n"
    "      html += '<div style=\"color:#ff6060;font-family:monospace;font-size:11px;margin-bottom:6px;\">' + r.cmd + '</div>';\n"
    "      r.errors.forEach(function(e) {\n"
    "        html += '<div style=\"color:#ff4040;font-size:12px;\">❌ ' + e + '</div>';\n"
    "      });\n"
    "      r.warnings.forEach(function(w) {\n"
    "        html += '<div style=\"color:#ffaa40;font-size:12px;\">' + w.replace(/\\n/g,'<br>') + '</div>';\n"
    "      });\n"
    "      r.fixes.forEach(function(f) {\n"
    "        html += '<div style=\"color:#5fd0a5;font-size:12px;\">✅ ' + f + '</div>';\n"
    "      });\n"
    "      html += '</div>';\n"
    "    });\n"
    "    return html;\n"
    "  }\n"
    "};\n\n"
    "console.log('[ROSValidator] Ready ✅');\n"
)

with open('ai-agent/ros-validator.js', 'w', encoding='utf-8') as f:
    f.write(VALIDATOR_JS)

r = subprocess.run(['node', '--check', 'ai-agent/ros-validator.js'],
                   capture_output=True, text=True)
print('ros-validator.js:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:200])

# ── Інтегруємо в executor ──
with open('ai-agent/ai-agent-executor.js', 'r', encoding='utf-8') as f:
    ex = f.read()

# Замінюємо validateFirewall на ROSValidator
old_validate = "    var fwWarnings = AIExecutor.validateFirewall(cleanCmds);"
new_validate = (
    "    /* Використовуємо ROSValidator якщо є */\n"
    "    var fwWarnings = [];\n"
    "    if (window.ROSValidator) {\n"
    "      var rosVersion = ROSValidator.getRouterVersion();\n"
    "      var validResults = ROSValidator.validate(cleanCmds, rosVersion);\n"
    "      var validHtml = ROSValidator.renderResults(validResults);\n"
    "      validResults.forEach(function(r) {\n"
    "        r.errors.forEach(function(e) { fwWarnings.push('❌ ' + e); });\n"
    "        r.warnings.forEach(function(w) { fwWarnings.push(w); });\n"
    "      });\n"
    "    } else {\n"
    "      fwWarnings = AIExecutor.validateFirewall(cleanCmds);\n"
    "    }"
)

if old_validate in ex:
    ex = ex.replace(old_validate, new_validate)
    print('OK: ROSValidator в executor ✅')

# Замінюємо warningsHtml на validHtml
old_warn_html = "    var warningsHtml = '';\n    if (fwWarnings && fwWarnings.length > 0) {\n      warningsHtml = fwWarnings.map(function(w) {\n        return '<div style=\"background:#3a1010;border:1px solid #c03030;' +\n          'border-radius:8px;padding:10px 14px;margin-bottom:10px;' +\n          'color:#ff8080;font-size:12px;\">' +\n          w.replace(/\\n/g,'<br>') + '</div>';\n      }).join('');\n    }"

new_warn_html = (
    "    var warningsHtml = '';\n"
    "    if (window.ROSValidator && typeof validHtml !== 'undefined' && validHtml) {\n"
    "      warningsHtml = validHtml;\n"
    "    } else if (fwWarnings && fwWarnings.length > 0) {\n"
    "      warningsHtml = fwWarnings.map(function(w) {\n"
    "        return '<div style=\"background:#3a1010;border:1px solid #c03030;' +\n"
    "          'border-radius:8px;padding:10px 14px;margin-bottom:10px;' +\n"
    "          'color:#ff8080;font-size:12px;\">' +\n"
    "          w.replace(/\\n/g,'<br>') + '</div>';\n"
    "      }).join('');\n"
    "    }"
)

if old_warn_html in ex:
    ex = ex.replace(old_warn_html, new_warn_html)
    print('OK: validHtml в executor ✅')

with open('ai-agent/ai-agent-executor.js', 'w', encoding='utf-8') as f:
    f.write(ex)

r2 = subprocess.run(['node', '--check', 'ai-agent/ai-agent-executor.js'],
                    capture_output=True, text=True)
print('executor:', 'OK ✅' if r2.returncode == 0 else '❌\n' + r2.stderr[:200])

# ── Підключаємо в index.html перед executor ──
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

if 'ros-validator.js' not in html:
    html = html.replace(
        '<script src="ai-agent/ai-agent-executor.js"></script>',
        '<script src="ai-agent/ros-validator.js"></script>\n  <script src="ai-agent/ai-agent-executor.js"></script>'
    )
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print('OK: ros-validator.js в index.html ✅')

print('\nВсе готово! npm start')