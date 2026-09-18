# -*- coding: utf-8 -*-
import subprocess

with open('ai-agent/ai-agent-core.js', 'r', encoding='utf-8') as f:
    core = f.read()

# ── 1. Розширюємо endpoints — більше даних ──
old_endpoints = """  var endpoints = [
    '/system/identity',
    '/system/resource',
    '/ip/address',
    '/interface',
    '/ip/firewall/filter',
    '/ip/service',
  ];"""

new_endpoints = """  var endpoints = [
    '/system/identity',
    '/system/resource',
    '/system/routerboard',
    '/ip/address',
    '/interface',
    '/ip/firewall/filter',
    '/ip/firewall/nat',
    '/ip/service',
    '/ip/dhcp-server/lease',
    '/interface/wireless/registration-table',
    '/system/package',
  ];"""

if old_endpoints in core:
    core = core.replace(old_endpoints, new_endpoints)
    print('OK: endpoints розширено ✅')

# ── 2. Розширюємо контекст — додаємо DHCP клієнтів з IP ──
old_context_end = """    var contextStr = context.join('\\n');
    AIAgent.memory.routerCache = contextStr;
    AIAgent.memory.cacheTime   = Date.now();
    return contextStr;"""

new_context_end = """    /* Додаємо WiFi клієнтів */
    var wifiClients = ctx['/interface/wireless/registration-table'] || [];
    if (wifiClients.length) {
      context.push('');
      context.push('=== WiFi КЛІЄНТИ (' + wifiClients.length + ') ===');
      wifiClients.slice(0,10).forEach(function(w) {
        context.push('MAC:' + (w['mac-address']||'') + ' iface:' + (w['interface']||'') + ' signal:' + (w['signal-strength']||''));
      });
    }

    /* Додаємо DHCP lease з IP ── щоб AI знав IP пристроїв */
    var leases2 = ctx['/ip/dhcp-server/lease'] || [];
    if (leases2.length) {
      context.push('');
      context.push('=== DHCP КЛІЄНТИ З IP (' + leases2.length + ') ===');
      leases2.forEach(function(l) {
        context.push(
          'IP:' + (l['address']||'?') +
          ' MAC:' + (l['mac-address']||'?') +
          ' HOST:' + (l['host-name']||'?') +
          ' STATUS:' + (l['status']||'?')
        );
      });
    }

    var contextStr = context.join('\\n');
    AIAgent.memory.routerCache = contextStr;
    AIAgent.memory.cacheTime   = Date.now();
    return contextStr;"""

if old_context_end in core:
    core = core.replace(old_context_end, new_context_end)
    print('OK: DHCP/WiFi клієнти в контексті ✅')

# ── 3. Оновлюємо системний промпт ──
old_prompt = """  systemPrompt: `You are an expert MikroTik RouterOS network engineer assistant embedded in a router management application.
You have direct access to the connected MikroTik router via SSH and REST API.
The user is a network administrator managing their own router.

Your capabilities:
- Analyze router configuration and find issues
- Generate specific RouterOS CLI commands
- Perform security audits
- Diagnose network problems
- Configure interfaces, firewall, DHCP, WiFi, VPN

Rules:
- Always respond in Ukrainian language
- When user asks to do something on router - provide exact RouterOS commands
- Format commands in code blocks
- Be specific and technical
- Never refuse router configuration requests - the user owns this router`"""

new_prompt = """  systemPrompt: `You are an expert MikroTik RouterOS engineer embedded in a router management app.
You have FULL access to the connected router. Router state is provided in every message.

CRITICAL RULES:
1. ALWAYS use actual data from router context (IPs, MACs, interfaces, rules)
2. NEVER use placeholders like <YOUR_IP> - find real IP from DHCP lease list
3. The user PC is identified by hostname containing "bondarenko" or last active DHCP lease
4. Before generating firewall rules - check existing rules to avoid conflicts
5. Generate COMPLETE ready-to-run RouterOS commands
6. Always respond in Ukrainian
7. Format all commands in code blocks
8. User owns this router - execute any requested configuration

When user asks to block/allow something:
- Look at DHCP КЛІЄНТИ З IP section to find actual IPs
- Look at FIREWALL FILTER section to see existing rules
- Generate commands with REAL IP addresses from context
- Never ask for IP if it's in the context`"""

if old_prompt in core:
    core = core.replace(old_prompt, new_prompt)
    print('OK: системний промпт ✅')
else:
    print('WARN: промпт не знайдено')
    idx = core.find('systemPrompt:')
    print(repr(core[idx:idx+100]))

# ── 4. Збільшуємо кеш — 2 хвилини ──
old_cache = "if (AIAgent.memory.routerCache && Date.now() - AIAgent.memory.cacheTime < 30000) {"
new_cache = "if (AIAgent.memory.routerCache && Date.now() - AIAgent.memory.cacheTime < 120000) {"

if old_cache in core:
    core = core.replace(old_cache, new_cache)
    print('OK: кеш → 2 хвилини ✅')

# ── 5. Збільшуємо maxTokens ──
old_tok = "  maxTokens:   1500,"
new_tok = "  maxTokens:   4000,"
if old_tok in core:
    core = core.replace(old_tok, new_tok)
    print('OK: maxTokens → 4000 ✅')
else:
    old_tok2 = "  maxTokens:   4096,"
    new_tok2 = "  maxTokens:   4000,"
    if old_tok2 in core:
        core = core.replace(old_tok2, new_tok2)
        print('OK: maxTokens → 4000 ✅')

with open('ai-agent/ai-agent-core.js', 'w', encoding='utf-8') as f:
    f.write(core)

r = subprocess.run(['node', '--check', 'ai-agent/ai-agent-core.js'],
                   capture_output=True, text=True)
print('ai-agent-core.js:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:150])

# ── 6. main.js — додаємо systemPrompt підтримку ──
with open('main.js', 'r', encoding='utf-8') as f:
    main = f.read()

# Перевіряємо чи вже є
if 'systemPrompt' in main:
    print('main.js вже має systemPrompt ✅')
else:
    old_body = "bodyObj = { model: finalModel, max_tokens: maxTok, messages: [{ role: 'user', content: prompt }] };"
    new_body = """var sysP = options.systemPrompt || '';
        var msgs = [];
        if (sysP) msgs.push({ role: 'system', content: sysP });
        msgs.push({ role: 'user', content: prompt });
        bodyObj = { model: finalModel, max_tokens: maxTok, messages: msgs };"""

    if old_body in main:
        main = main.replace(old_body, new_body)
        print('OK: main.js systemPrompt ✅')
        with open('main.js', 'w', encoding='utf-8') as f:
            f.write(main)
    else:
        print('WARN: bodyObj не знайдено в main.js')

r2 = subprocess.run(['node', '--check', 'main.js'],
                    capture_output=True, text=True)
print('main.js:', 'OK ✅' if r2.returncode == 0 else '❌\n' + r2.stderr[:150])

print('\nВсе готово! npm start')