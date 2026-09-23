'use strict';
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
