# -*- coding: utf-8 -*-
import subprocess, tempfile, os

with open('ai-agent/ai-agent-ui.js', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('\r\n', '\n')

# 1. Додаємо нові кнопки в quick tools
OLD_BTNS = (
    "        '<button class=\"ai-quick-btn\" onclick=\"window.AISecurityAudit.run()\">🔒 Аудит</button>',,"
)
NEW_BTNS = (
    "        '<button class=\"ai-quick-btn\" onclick=\"window.AISecurityAudit.run()\">🔒 Аудит</button>',"
    "\n        '<button class=\"ai-quick-btn\" onclick=\"window.AIAgentUI.localFirewallAnalysis()\">🔍 Firewall</button>',"
    "\n        '<button class=\"ai-quick-btn\" onclick=\"window.AIAgentUI.aiFirewallAnalysis()\">🤖 AI Firewall</button>',"
    "\n        '<button class=\"ai-quick-btn\" onclick=\"window.AIAgentUI.securityAudit()\">🔐 Security</button>',"
)

print(f'OLD_BTNS: {"FOUND" if OLD_BTNS in content else "NOT FOUND"}')
if OLD_BTNS in content:
    content = content.replace(OLD_BTNS, NEW_BTNS, 1)
    print('OK: кнопки додано')

# 2. Додаємо функції аналізу перед кінцем файлу
INJECT_BEFORE = "\nconsole.log('[AIAgentUI]"
if INJECT_BEFORE not in content:
    INJECT_BEFORE = "\nAIAgentUI.init"

FIREWALL_FUNCS = """
/* ══════════════════════════════════════════════════════
   FIREWALL ANALYSIS — перенесено з rm-ai-copilot.js
   ══════════════════════════════════════════════════════ */

AIAgentUI._getActiveRouter = function() {
  if (window.__rmGetActiveRouter) return window.__rmGetActiveRouter();
  return null;
};

AIAgentUI._getFirewallRules = function() {
  var router = AIAgentUI._getActiveRouter();
  if (!router) return Promise.reject(new Error('Роутер не підключений'));
  return Promise.all([
    window.restCall(router, 'GET', '/ip/firewall/filter').catch(function(){return[];}),
    window.restCall(router, 'GET', '/ip/firewall/nat').catch(function(){return[];}),
    window.restCall(router, 'GET', '/ip/firewall/mangle').catch(function(){return[];}),
  ]).then(function(res) {
    return {
      filter:  Array.isArray(res[0]) ? res[0] : [],
      nat:     Array.isArray(res[1]) ? res[1] : [],
      mangle:  Array.isArray(res[2]) ? res[2] : [],
    };
  });
};

AIAgentUI._formatRulesForAI = function(rules) {
  var lines = ['=== FIREWALL FILTER (' + rules.filter.length + ' rules) ==='];
  rules.filter.slice(0, 30).forEach(function(r, i) {
    lines.push(i + ': chain=' + r.chain +
      ' action=' + r.action +
      (r['src-address']  ? ' src='   + r['src-address']  : '') +
      (r['dst-address']  ? ' dst='   + r['dst-address']  : '') +
      (r.protocol        ? ' proto=' + r.protocol        : '') +
      (r['dst-port']     ? ' dport=' + r['dst-port']     : '') +
      (r.disabled==='true' ? ' [DISABLED]' : '') +
      (r.comment         ? ' #' + r.comment              : ''));
  });
  lines.push('\\n=== NAT (' + rules.nat.length + ' rules) ===');
  rules.nat.slice(0, 10).forEach(function(r, i) {
    lines.push(i + ': chain=' + r.chain + ' action=' + r.action +
      (r['out-interface'] ? ' out=' + r['out-interface'] : '') +
      (r.comment          ? ' #'   + r.comment           : ''));
  });
  return lines.join('\\n');
};

/* Локальний аналіз без AI */
AIAgentUI.localFirewallAnalysis = function() {
  AIAgentUI.addMessage('user', '🔍 Локальний аналіз Firewall...');
  AIAgentUI._getFirewallRules().then(function(rules) {
    var issues = [];
    var filter = rules.filter;

    var disabled = filter.filter(function(r){return r.disabled==='true';});
    if (disabled.length) issues.push('⚠️ Відключені правила: ' + disabled.length);

    var noComment = filter.filter(function(r){return !r.comment||!r.comment.trim();});
    if (noComment.length > 3) issues.push('📝 Без коментарів: ' + noComment.length);

    var acceptAll = filter.filter(function(r){
      return r.action==='accept' && r.chain==='input' &&
             !r['src-address'] && !r.protocol && !r['in-interface'];
    });
    if (acceptAll.length) issues.push('🔓 КРИТИЧНО: accept-all в input (' + acceptAll.length + ')');

    var seen = {}, dupes = [];
    filter.forEach(function(r) {
      var key = [r.chain,r.action,r['src-address']||'',r['dst-address']||'',r.protocol||''].join('|');
      if (seen[key]) dupes.push(r); else seen[key]=true;
    });
    if (dupes.length) issues.push('🔄 Можливі дублікати: ' + dupes.length);

    var masq = rules.nat.filter(function(r){return r.action==='masquerade';});
    if (!masq.length && rules.nat.length > 0) issues.push('🌐 Немає masquerade в NAT!');

    var report = '📊 Firewall аналіз:\\n' +
      '• Filter rules: ' + filter.length + ' (активних: ' +
      filter.filter(function(r){return r.disabled!=='true';}).length + ')\\n' +
      '• NAT rules: ' + rules.nat.length + '\\n' +
      '• Mangle rules: ' + rules.mangle.length + '\\n\\n';

    if (issues.length) {
      report += '🚨 Знайдені проблеми:\\n' + issues.join('\\n');
    } else {
      report += '✅ Типових проблем не знайдено';
    }

    AIAgentUI.addMessage('ai', report);
  }).catch(function(e) {
    AIAgentUI.addMessage('ai', '❌ ' + e.message);
  });
};

/* AI аналіз Firewall */
AIAgentUI.aiFirewallAnalysis = function() {
  AIAgentUI.addMessage('user', '🤖 AI аналіз Firewall правил...');
  AIAgentUI._getFirewallRules().then(function(rules) {
    var context = AIAgentUI._formatRulesForAI(rules);
    var prompt = 'Проаналізуй MikroTik Firewall правила. ' +
      'Знайди: помилки, дублікати, security ризики, мертві правила. ' +
      'Дай конкретні рекомендації з RouterOS командами. ' +
      'Відповідай українською.\\n\\n' + context;
    AIAgentUI.quickAsk(prompt);
  }).catch(function(e) {
    AIAgentUI.addMessage('ai', '❌ ' + e.message);
  });
};

/* Security Audit */
AIAgentUI.securityAudit = function() {
  AIAgentUI.addMessage('user', '🔐 Security Audit конфігурації...');
  AIAgentUI._getFirewallRules().then(function(rules) {
    var context = AIAgentUI._formatRulesForAI(rules);
    var prompt = 'Зроби Security Audit MikroTik Firewall. ' +
      'Перевір: відкриті порти на input, захист від brute-force, ' +
      'drop invalid, захист від DDoS, masquerade. ' +
      'Список вразливостей з пріоритетами HIGH/MEDIUM/LOW. ' +
      'Відповідай українською.\\n\\n' + context;
    AIAgentUI.quickAsk(prompt);
  }).catch(function(e) {
    AIAgentUI.addMessage('ai', '❌ ' + e.message);
  });
};

"""

print(f'INJECT_BEFORE: {"FOUND" if INJECT_BEFORE in content else "NOT FOUND"}')
idx = content.find(INJECT_BEFORE)
if idx >= 0:
    content = content[:idx] + FIREWALL_FUNCS + content[idx:]
    print('OK: функції додано')
else:
    content = content.rstrip() + '\n' + FIREWALL_FUNCS
    print('OK: функції додано в кінець')

# Tempfile
with tempfile.NamedTemporaryFile(suffix='.js', delete=False, mode='w', encoding='utf-8') as tmp:
    tmp.write(content)
    tmp_name = tmp.name
r = subprocess.run(['node','--check', tmp_name], capture_output=True, text=True)
os.unlink(tmp_name)
if r.returncode != 0:
    print('SYNTAX ERROR!\n' + r.stderr[:300])
    exit(1)
print('Tempfile: OK')

with open('ai-agent/ai-agent-ui.js', 'w', encoding='utf-8') as f:
    f.write(content)
size = os.path.getsize('ai-agent/ai-agent-ui.js')
r2 = subprocess.run(['node','--check','ai-agent/ai-agent-ui.js'], capture_output=True, text=True)
print(f'ai-agent-ui.js: {"OK ✅" if r2.returncode==0 else "FAIL"} ({size:,}b)')
if r2.returncode != 0:
    print(r2.stderr[:200])
    exit(1)

# 3. Видаляємо rm-ai-copilot.js з index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

OLD_SCRIPT = '    <script src="rm-ai-copilot.js"></script>\n'
if OLD_SCRIPT in html:
    html = html.replace(OLD_SCRIPT, '', 1)
    print('OK: rm-ai-copilot.js видалено з index.html')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)

# Git
subprocess.run(['git','pull','--rebase','origin','main'], capture_output=True)
subprocess.run(['git','add','ai-agent/ai-agent-ui.js','index.html'], capture_output=True)
subprocess.run(['git','commit','-m',
    'feat: Firewall analysis merged into AI Agent, rm-ai-copilot removed'],
    capture_output=True)
rp = subprocess.run(['git','push','origin','main'], capture_output=True, text=True)
print('push:', rp.stdout.strip() or rp.stderr.strip()[-60:])
print('\nDone! npm start')