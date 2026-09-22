# -*- coding: utf-8 -*-
import subprocess

# ── 1. Оновлюємо системний промпт ──
with open('ai-agent/ai-agent-core.js', 'r', encoding='utf-8') as f:
    core = f.read()

idx = core.find("systemPrompt: '")
end = idx + 16
quote = "'"
i = end
while i < len(core):
    if core[i] == "'" and core[i-1] != '\\': end = i + 1; break
    i += 1

NEW_PROMPT = (
    "systemPrompt: 'You are an expert MikroTik RouterOS v7 engineer.\\n'\n"
    "    + 'You have FULL access to the connected router via SSH and REST API.\\n'\n"
    "    + 'Router real-time state is in [ROUTER STATE].\\n'\n"
    "    + 'MikroTik knowledge base is in [KNOWLEDGE BASE].\\n\\n'\n"
    "    + 'CRITICAL RULES:\\n'\n"
    "    + '1. ALWAYS respond in Ukrainian\\n'\n"
    "    + '2. Commands MUST be single line — NO backslash line continuation\\n'\n"
    "    + '3. Use REAL data from [ROUTER STATE] — never use placeholders\\n'\n"
    "    + '4. Format ALL commands in ```routeros code blocks\\n'\n"
    "    + '5. Check [KNOWLEDGE BASE] for correct syntax before answering\\n\\n'\n"
    "    + 'FIREWALL SAFETY RULES (CRITICAL):\\n'\n"
    "    + 'NEVER add bare drop without conditions: action=drop comment=\\'default drop\\'\\n'\n"
    "    + 'ALWAYS use in-interface-list=WAN for drop rules on input chain\\n'\n"
    "    + 'CORRECT drop: add chain=input action=drop in-interface-list=WAN comment=\\'drop WAN\\'\\n'\n"
    "    + 'WRONG drop: add chain=input action=drop comment=\\'default drop\\'\\n'\n"
    "    + 'Order matters! LAN accept MUST come before any drop rule\\n'\n"
    "    + 'Always add: add chain=input action=accept in-interface-list=LAN before drop\\n\\n'\n"
    "    + 'CORRECT command examples:\\n'\n"
    "    + '  /ping address=8.8.8.8 count=4\\n'\n"
    "    + '  /interface monitor-traffic ether1 once\\n'\n"
    "    + '  /tool torch interface=ether1 duration=10\\n'\n"
    "    + '  /ip firewall filter add chain=input action=accept in-interface-list=LAN\\n'\n"
    "    + '  /ip firewall filter add chain=input action=drop in-interface-list=WAN\\n'\n"
    "    + 'WRONG examples (never use):\\n'\n"
    "    + '  /tool traffic-monitor start\\n'\n"
    "    + '  /ip firewall filter add chain=input action=drop comment=\\'default drop\\''"
)

core = core[:idx] + NEW_PROMPT + core[end:]
print('OK: systemPrompt з firewall safety ✅')

with open('ai-agent/ai-agent-core.js', 'w', encoding='utf-8') as f:
    f.write(core)

r = subprocess.run(['node', '--check', 'ai-agent/ai-agent-core.js'],
                   capture_output=True, text=True)
print('core:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:200])

# ── 2. Фікс executor — валідація небезпечних команд ──
with open('ai-agent/ai-agent-executor.js', 'r', encoding='utf-8') as f:
    ex = f.read()

# Знаходимо executeOne і додаємо валідацію
old_exec_start = (
    "    /* Очищаємо команду */\n"
    "    var c = cmd\n"
)

new_exec_start = (
    "    /* Очищаємо команду */\n"
    "    var c = cmd\n"
)

# Знаходимо parseCommands і додаємо валідацію
old_parse = "  parseCommands: function(text) {"

new_parse = (
    "  /* Перевірка небезпечних firewall команд */\n"
    "  validateFirewall: function(commands) {\n"
    "    var warnings = [];\n"
    "    commands.forEach(function(cmd) {\n"
    "      var c = cmd.toLowerCase();\n"
    "      /* Небезпечно: drop без умов в input chain */\n"
    "      if (c.indexOf('chain=input') >= 0 &&\n"
    "          c.indexOf('action=drop') >= 0 &&\n"
    "          c.indexOf('in-interface') < 0 &&\n"
    "          c.indexOf('src-address') < 0 &&\n"
    "          c.indexOf('protocol') < 0 &&\n"
    "          c.indexOf('connection-state') < 0) {\n"
    "        warnings.push('⚠️ НЕБЕЗПЕЧНО: Голий DROP в input chain без умов!\\n' +\n"
    "          'Це заблокує весь трафік включно з LAN, DNS, DHCP, Winbox!\\n' +\n"
    "          'Додайте умову: in-interface-list=WAN');\n"
    "      }\n"
    "      /* Небезпечно: reset-configuration */\n"
    "      if (c.indexOf('reset-configuration') >= 0) {\n"
    "        warnings.push('⚠️ НЕБЕЗПЕЧНО: reset-configuration видалить ВСІ налаштування!');\n"
    "      }\n"
    "    });\n"
    "    return warnings;\n"
    "  },\n\n"
    "  parseCommands: function(text) {"
)

if old_parse in ex:
    ex = ex.replace(old_parse, new_parse)
    print('OK: validateFirewall ✅')

# Додаємо виклик валідації в showConfirmModal
old_has_dangerous = (
    "    var hasDangerous = cleanCmds.some(function(c) {\n"
    "      var l = c.toLowerCase();\n"
    "      return l.indexOf('reset') >= 0 || l.indexOf('remove') >= 0 ||\n"
    "             l.indexOf('reboot') >= 0 || l.indexOf('shutdown') >= 0 ||\n"
    "             l.indexOf('format') >= 0;\n"
    "    });"
)

new_has_dangerous = (
    "    var hasDangerous = cleanCmds.some(function(c) {\n"
    "      var l = c.toLowerCase();\n"
    "      return l.indexOf('reset') >= 0 || l.indexOf('remove') >= 0 ||\n"
    "             l.indexOf('reboot') >= 0 || l.indexOf('shutdown') >= 0 ||\n"
    "             l.indexOf('format') >= 0;\n"
    "    });\n\n"
    "    /* Валідація firewall правил */\n"
    "    var fwWarnings = AIExecutor.validateFirewall(cleanCmds);\n"
    "    if (fwWarnings.length > 0) {\n"
    "      hasDangerous = true;\n"
    "      console.warn('[Executor] Firewall warnings:', fwWarnings);\n"
    "    }"
)

if old_has_dangerous in ex:
    ex = ex.replace(old_has_dangerous, new_has_dangerous)
    print('OK: firewall validation в modal ✅')

# Додаємо попередження у вікно модалу
old_cmds_html = (
    "    var cmdsHtml = cleanCmds.map(function(cmd, i) {"
)

new_cmds_html = (
    "    /* Показуємо firewall попередження */\n"
    "    var warningsHtml = '';\n"
    "    if (fwWarnings && fwWarnings.length > 0) {\n"
    "      warningsHtml = fwWarnings.map(function(w) {\n"
    "        return '<div style=\"background:#3a1010;border:1px solid #c03030;' +\n"
    "          'border-radius:8px;padding:10px 14px;margin-bottom:10px;' +\n"
    "          'color:#ff8080;font-size:12px;\">' +\n"
    "          w.replace(/\\n/g,'<br>') + '</div>';\n"
    "      }).join('');\n"
    "    }\n\n"
    "    var cmdsHtml = cleanCmds.map(function(cmd, i) {"
)

if old_cmds_html in ex:
    ex = ex.replace(old_cmds_html, new_cmds_html)
    print('OK: warnings HTML ✅')

# Додаємо warningsHtml перед cmdsHtml в modal.innerHTML
old_modal_content = "          cmdsHtml +"
new_modal_content = "          warningsHtml + cmdsHtml +"

if old_modal_content in ex:
    ex = ex.replace(old_modal_content, new_modal_content, 1)
    print('OK: warnings в modal ✅')

with open('ai-agent/ai-agent-executor.js', 'w', encoding='utf-8') as f:
    f.write(ex)

r2 = subprocess.run(['node', '--check', 'ai-agent/ai-agent-executor.js'],
                    capture_output=True, text=True)
print('executor:', 'OK ✅' if r2.returncode == 0 else '❌\n' + r2.stderr[:200])

print('\nВсе готово! npm start')