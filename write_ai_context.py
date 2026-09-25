# -*- coding: utf-8 -*-
import subprocess, tempfile, os

AI_CONTEXT = r"""'use strict';
/* ══════════════════════════════════════════════════════
   ai-context.js — Центральний контекст для AI Agent
   Кожен розділ оновлює контекст → AI знає де користувач
   ══════════════════════════════════════════════════════ */

window.AIContext = (function() {

  var _ctx = {
    section:    null,   /* 'firewall', 'interfaces', 'dashboard' */
    subsection: null,   /* 'filter', 'nat', 'mangle' */
    data:       {},     /* дані поточного розділу */
    selected:   null,   /* вибраний рядок */
    userAction: null,   /* 'browsing', 'editing', 'creating' */
    router:     null,   /* активний роутер */
    history:    [],     /* останні 20 дій */
    _listeners: [],
  };

  /* ── Підписка на зміни контексту ── */
  function onChange(fn) {
    _ctx._listeners.push(fn);
  }

  function _notify() {
    _ctx._listeners.forEach(function(fn) {
      try { fn(_ctx); } catch(e) {}
    });
  }

  /* ── Оновлення контексту при вході в розділ ── */
  function enter(section, data, subsection) {
    _ctx.section    = section;
    _ctx.subsection = subsection || null;
    _ctx.data       = data || {};
    _ctx.selected   = null;
    _ctx.userAction = 'browsing';
    _ctx.router     = _getRouter();
    _ctx.history.unshift({
      t: Date.now(), action: 'enter', section: section
    });
    if (_ctx.history.length > 20) _ctx.history.pop();
    console.log('[AIContext] enter:', section, subsection || '');
    _notify();
    /* Тригер аналізу в AI Agent */
    _scheduleAnalysis(section, data);
  }

  /* ── Вибір рядка в таблиці ── */
  function select(rowData, rowType) {
    _ctx.selected   = { data: rowData, type: rowType };
    _ctx.userAction = 'browsing';
    _ctx.history.unshift({ t: Date.now(), action: 'select', rowType: rowType });
    if (_ctx.history.length > 20) _ctx.history.pop();
    _notify();
  }

  /* ── Редагування поля ── */
  function onEdit(fieldId, value) {
    _ctx.userAction = 'editing';
    _ctx.history.unshift({ t: Date.now(), action: 'edit', fieldId: fieldId });
    if (_ctx.history.length > 20) _ctx.history.pop();
  }

  /* ── Отримати активний роутер ── */
  function _getRouter() {
    if (window.__rmGetActiveRouter) return window.__rmGetActiveRouter();
    if (window.RMCore && RMCore.activeRouter) return RMCore.activeRouter();
    return null;
  }

  /* ── Формуємо промпт-контекст для AI ── */
  function toPrompt() {
    var lines = [
      'Поточний контекст користувача:',
      '- Розділ: ' + (_ctx.section || 'невідомо'),
    ];
    if (_ctx.subsection) lines.push('- Підрозділ: ' + _ctx.subsection);
    if (_ctx.userAction) lines.push('- Дія: ' + _ctx.userAction);
    if (_ctx.router)     lines.push('- Роутер: ' + (_ctx.router.name || _ctx.router.ip || '?'));
    if (_ctx.selected)   lines.push('- Вибрано: ' + JSON.stringify(_ctx.selected.data).slice(0, 200));
    if (_ctx.history.length) {
      lines.push('- Останні дії: ' +
        _ctx.history.slice(0, 5).map(function(h) {
          return h.action + '(' + (h.section || h.fieldId || h.rowType || '') + ')';
        }).join(' → '));
    }
    return lines.join('\n');
  }

  /* ── Поточний стан ── */
  function get() { return _ctx; }

  /* ═══════════════════════════════════════════════
     АНАЛІЗ ПО РОЗДІЛАХ — підказки для AI Agent
     ═══════════════════════════════════════════════ */

  var _analyzeTimer = null;

  function _scheduleAnalysis(section, data) {
    if (_analyzeTimer) clearTimeout(_analyzeTimer);
    _analyzeTimer = setTimeout(function() {
      _runAnalysis(section, data);
    }, 800); /* чекаємо 800ms після входу */
  }

  function _runAnalysis(section, data) {
    /* Перевіряємо чи є AI Agent */
    if (!window.AIAgentUI || !window.AIAgentUI.showHint) return;

    if (section === 'firewall') {
      _analyzeFirewall(data);
    } else if (section === 'interfaces') {
      _analyzeInterfaces(data);
    } else if (section === 'dashboard') {
      _analyzeDashboard(data);
    } else if (section === 'routes') {
      _analyzeRoutes(data);
    }
  }

  /* ── Аналіз Firewall ── */
  function _analyzeFirewall(data) {
    var rules = data.filter || [];
    if (!rules.length) return;

    var issues = [];

    /* Дублікати */
    var seen = {};
    rules.forEach(function(r) {
      var key = [r.chain, r.action,
        r['src-address']||'', r['dst-address']||'',
        r.protocol||''].join('|');
      if (seen[key]) {
        issues.push({ type: 'warning', msg: 'Дублікат правила: ' + (r.comment || r['.id']) });
      } else { seen[key] = true; }
    });

    /* Accept-all в input */
    rules.forEach(function(r) {
      if (r.action === 'accept' && r.chain === 'input' &&
          !r['src-address'] && !r.protocol && !r['in-interface']) {
        issues.push({ type: 'critical', msg: '⚠️ Accept-all в input — security ризик!' });
      }
    });

    /* Відключені правила */
    var disabled = rules.filter(function(r) { return r.disabled === 'true'; });
    if (disabled.length > 2) {
      issues.push({ type: 'info', msg: disabled.length + ' правил відключено' });
    }

    if (issues.length) {
      window.AIAgentUI.showHint('firewall', issues);
    }
  }

  /* ── Аналіз Interfaces ── */
  function _analyzeInterfaces(data) {
    var ifaces = data.interfaces || [];
    if (!ifaces.length) return;

    var issues = [];

    /* Інтерфейси з помилками */
    ifaces.forEach(function(iface) {
      var rxErrors = parseInt(iface['rx-error'] || 0);
      var txErrors = parseInt(iface['tx-error'] || 0);
      if (rxErrors > 100 || txErrors > 100) {
        issues.push({
          type: 'warning',
          msg: iface.name + ': ' + (rxErrors + txErrors) + ' помилок — перевір кабель'
        });
      }
      /* Down але має IP */
      if (iface.running === 'false' && iface['actual-mtu']) {
        issues.push({
          type: 'info',
          msg: iface.name + ' не active — перевір підключення'
        });
      }
    });

    if (issues.length) {
      window.AIAgentUI.showHint('interfaces', issues);
    }
  }

  /* ── Аналіз Dashboard ── */
  function _analyzeDashboard(data) {
    var issues = [];
    var res = data.resource || {};

    var cpuLoad = parseInt(res['cpu-load'] || 0);
    var freeMemory = parseInt(res['free-memory'] || 0);
    var totalMemory = parseInt(res['total-memory'] || 1);
    var memPct = Math.round((1 - freeMemory/totalMemory) * 100);

    if (cpuLoad > 80) {
      issues.push({ type: 'critical', msg: 'CPU ' + cpuLoad + '% — критичне навантаження!' });
    } else if (cpuLoad > 50) {
      issues.push({ type: 'warning', msg: 'CPU ' + cpuLoad + '% — підвищене навантаження' });
    }

    if (memPct > 85) {
      issues.push({ type: 'warning', msg: 'RAM ' + memPct + '% — мало вільної памʼяті' });
    }

    if (issues.length && window.AIAgentUI.showHint) {
      window.AIAgentUI.showHint('dashboard', issues);
    }
  }

  /* ── Аналіз Routes ── */
  function _analyzeRoutes(data) {
    var routes = data.routes || [];
    var issues = [];

    /* Кілька default routes */
    var defaults = routes.filter(function(r) {
      return r['dst-address'] === '0.0.0.0/0' && r.active === 'true';
    });
    if (defaults.length > 1) {
      issues.push({ type: 'warning', msg: defaults.length + ' активних default routes!' });
    }

    /* Немає default route */
    if (!defaults.length) {
      issues.push({ type: 'critical', msg: 'Немає default route — інтернет не працює' });
    }

    if (issues.length && window.AIAgentUI.showHint) {
      window.AIAgentUI.showHint('routes', issues);
    }
  }

  /* ── Public API ── */
  return {
    enter:    enter,
    select:   select,
    onEdit:   onEdit,
    get:      get,
    toPrompt: toPrompt,
    onChange: onChange,
  };

})();

console.log('[AIContext] loaded ✅');
"""

# Tempfile
with tempfile.NamedTemporaryFile(suffix='.js', delete=False, mode='w', encoding='utf-8') as tmp:
    tmp.write(AI_CONTEXT)
    tmp_name = tmp.name
r = subprocess.run(['node','--check', tmp_name], capture_output=True, text=True)
os.unlink(tmp_name)
if r.returncode != 0:
    print('SYNTAX ERROR!\n' + r.stderr[:300])
    exit(1)
print('Tempfile: OK')

os.makedirs('ai-agent', exist_ok=True)
with open('ai-agent/ai-context.js', 'w', encoding='utf-8') as f:
    f.write(AI_CONTEXT)
size = os.path.getsize('ai-agent/ai-context.js')
r2 = subprocess.run(['node','--check','ai-agent/ai-context.js'], capture_output=True, text=True)
print(f'ai-context.js: {"OK ✅" if r2.returncode==0 else "FAIL"} ({size:,}b)')
if r2.returncode != 0:
    print(r2.stderr[:200])
    exit(1)

# Додаємо showHint в ai-agent-ui.js
with open('ai-agent/ai-agent-ui.js', 'r', encoding='utf-8') as f:
    ui = f.read()
ui = ui.replace('\r\n', '\n')

SHOW_HINT = """
/* ── Показати підказку від AIContext ── */
AIAgentUI.showHint = function(section, issues) {
  if (!issues || !issues.length) return;

  /* Показуємо тільки critical і warning */
  var important = issues.filter(function(i) {
    return i.type === 'critical' || i.type === 'warning';
  });
  if (!important.length) return;

  /* Формуємо повідомлення */
  var msg = '🔍 **AI аналіз ' + section + ':**\\n' +
    important.map(function(i) {
      var icon = i.type === 'critical' ? '🔴' : '🟡';
      return icon + ' ' + i.msg;
    }).join('\\n');

  /* Показуємо в AI Agent як system повідомлення */
  AIAgentUI.addMessage('system', msg);

  /* Відкриваємо панель якщо є критичні */
  var hasCritical = important.some(function(i) { return i.type === 'critical'; });
  if (hasCritical && !AIAgentUI.state.isOpen) {
    AIAgentUI.toggle();
  }
};

"""

# Вставляємо перед кінцем файлу
INSERT_BEFORE = "\nconsole.log('[AIAgentUI]"
if INSERT_BEFORE in ui:
    ui = ui.replace(INSERT_BEFORE, SHOW_HINT + INSERT_BEFORE, 1)
    print('OK: showHint додано в ai-agent-ui.js')
else:
    ui = ui.rstrip() + '\n' + SHOW_HINT
    print('OK: showHint додано в кінець ai-agent-ui.js')

# Tempfile ui
with tempfile.NamedTemporaryFile(suffix='.js', delete=False, mode='w', encoding='utf-8') as tmp:
    tmp.write(ui); tmp_name = tmp.name
r = subprocess.run(['node','--check', tmp_name], capture_output=True, text=True)
os.unlink(tmp_name)
if r.returncode != 0:
    print('SYNTAX ERROR ui!\n' + r.stderr[:300])
    exit(1)
print('ui Tempfile: OK')
with open('ai-agent/ai-agent-ui.js', 'w', encoding='utf-8') as f:
    f.write(ui)

# Додаємо script в index.html перед ai-agent-core.js
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

OLD_SCRIPT = '  <script src="ai-agent/ai-agent-core.js"></script>'
NEW_SCRIPT = '  <script src="ai-agent/ai-context.js"></script>\n  <script src="ai-agent/ai-agent-core.js"></script>'

if 'ai-context.js' not in html and OLD_SCRIPT in html:
    html = html.replace(OLD_SCRIPT, NEW_SCRIPT, 1)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print('OK: ai-context.js додано в index.html')
else:
    print('OK: вже є або не знайдено — перевір вручну')

# Git
subprocess.run(['git','add',
    'ai-agent/ai-context.js',
    'ai-agent/ai-agent-ui.js',
    'index.html'], capture_output=True)
subprocess.run(['git','commit','-m',
    'feat: AIContext system - section awareness, auto-analysis, showHint'],
    capture_output=True)
rp = subprocess.run(['git','push','origin','main'], capture_output=True, text=True)
print('push:', rp.stdout.strip() or rp.stderr.strip()[-80:])
print('\nDone! npm start')