'use strict';
/* ═══════════════════════════════════════════════════════
   rm-ai-copilot.js — AI Copilot для Router Manager
   Аналіз Firewall, знаходить проблеми, пропонує фікси
   ═══════════════════════════════════════════════════════ */

window.RMAICopilot = (function() {

  /* ── CSS ── */
  function injectCSS() {
    if (document.getElementById('ai-cop-css')) return;
    var s = document.createElement('style');
    s.id = 'ai-cop-css';
    s.textContent = [
      /* Кнопка */
      '#ai-cop-btn {',
      '  position:fixed; bottom:60px; right:16px; z-index:9995;',
      '  width:44px; height:44px; border-radius:50%;',
      '  background:linear-gradient(135deg,#1a2a4a,#0d1a2e);',
      '  border:1px solid #3a5a8a; color:#5b9bd5;',
      '  cursor:pointer; font-size:20px;',
      '  display:flex; align-items:center; justify-content:center;',
      '  box-shadow:0 4px 20px rgba(91,155,213,.3);',
      '  transition:all .2s;',
      '}',
      '#ai-cop-btn:hover {',
      '  border-color:#5b9bd5; color:#fff;',
      '  box-shadow:0 4px 24px rgba(91,155,213,.5);',
      '  transform:scale(1.08);',
      '}',
      /* Panel */
      '#ai-cop-panel {',
      '  position:fixed; right:0; top:0; bottom:0; width:420px;',
      '  background:#0d1117; border-left:1px solid #2a3b48;',
      '  z-index:99996; display:flex; flex-direction:column;',
      '  transform:translateX(100%); transition:transform .25s ease;',
      '  box-shadow:-8px 0 40px rgba(0,0,0,.6);',
      '}',
      '#ai-cop-panel.open { transform:translateX(0); }',
      /* Header */
      '#ai-cop-header {',
      '  padding:14px 16px; border-bottom:1px solid #1c2a37;',
      '  background:#060d14; display:flex; align-items:center; gap:10px;',
      '}',
      '#ai-cop-title {',
      '  flex:1; font-size:14px; font-weight:700; color:#c9d8e4;',
      '  display:flex; align-items:center; gap:8px;',
      '}',
      '#ai-cop-close {',
      '  background:transparent; border:1px solid #2a3b48;',
      '  color:#4a6070; border-radius:6px; padding:3px 9px;',
      '  cursor:pointer; font-size:13px;',
      '}',
      '#ai-cop-close:hover { color:#c9d8e4; }',
      /* Tabs */
      '#ai-cop-tabs {',
      '  display:flex; border-bottom:1px solid #1c2a37;',
      '  background:#060d14;',
      '}',
      '.ai-cop-tab {',
      '  flex:1; padding:8px 4px; text-align:center;',
      '  font-size:11px; color:#4a6070; cursor:pointer;',
      '  border-bottom:2px solid transparent; transition:all .15s;',
      '}',
      '.ai-cop-tab:hover { color:#8ea3b0; }',
      '.ai-cop-tab.active { color:#5b9bd5; border-bottom-color:#5b9bd5; }',
      /* Body */
      '#ai-cop-body {',
      '  flex:1; overflow-y:auto; padding:12px;',
      '}',
      /* Chat */
      '#ai-cop-chat { display:flex; flex-direction:column; gap:8px; }',
      '.ai-msg {',
      '  border-radius:10px; padding:10px 12px;',
      '  font-size:12px; line-height:1.5; max-width:95%;',
      '}',
      '.ai-msg.user {',
      '  background:#1a2a3a; color:#c9d8e4;',
      '  align-self:flex-end; border-bottom-right-radius:3px;',
      '}',
      '.ai-msg.ai {',
      '  background:#060d14; border:1px solid #1c2a37;',
      '  color:#c9d8e4; align-self:flex-start;',
      '  border-bottom-left-radius:3px;',
      '}',
      '.ai-msg.ai pre {',
      '  background:#0a1520; border-radius:6px;',
      '  padding:8px; overflow-x:auto; font-size:11px;',
      '  margin:6px 0; color:#5fd0a5;',
      '}',
      '.ai-msg.error { border-color:#e08080; color:#e08080; }',
      '.ai-msg.thinking {',
      '  color:#4a6070; border-style:dashed;',
      '  animation:ai-blink 1s infinite;',
      '}',
      '@keyframes ai-blink {',
      '  0%,100% { opacity:1; } 50% { opacity:.5; }',
      '}',
      /* Analysis cards */
      '.ai-issue {',
      '  background:#060d14; border:1px solid #1c2a37;',
      '  border-radius:10px; padding:12px; margin-bottom:10px;',
      '  border-left:3px solid #4a6070;',
      '}',
      '.ai-issue.critical { border-left-color:#e08080; }',
      '.ai-issue.warning  { border-left-color:#f0a840; }',
      '.ai-issue.info     { border-left-color:#5b9bd5; }',
      '.ai-issue.ok       { border-left-color:#5fd0a5; }',
      '.ai-issue-title {',
      '  font-size:12px; font-weight:700; color:#c9d8e4;',
      '  margin-bottom:4px; display:flex; align-items:center; gap:6px;',
      '}',
      '.ai-issue-desc {',
      '  font-size:11px; color:#8ea3b0; line-height:1.4;',
      '}',
      '.ai-issue-fix {',
      '  margin-top:8px; font-size:11px; color:#5fd0a5;',
      '  background:#0a1a14; border-radius:6px; padding:6px 8px;',
      '  font-family:monospace; cursor:pointer;',
      '}',
      '.ai-issue-fix:hover { background:#0d2a1a; }',
      /* Input */
      '#ai-cop-input-wrap {',
      '  padding:10px 12px; border-top:1px solid #1c2a37;',
      '  background:#060d14; display:flex; gap:8px; align-items:flex-end;',
      '}',
      '#ai-cop-input {',
      '  flex:1; background:#0d1821; border:1px solid #2a3b48;',
      '  color:#c9d8e4; border-radius:8px; padding:8px 10px;',
      '  font-size:12px; outline:none; resize:none; min-height:36px;',
      '  max-height:100px; font-family:inherit;',
      '}',
      '#ai-cop-input:focus { border-color:#5b9bd5; }',
      '#ai-cop-send {',
      '  background:linear-gradient(135deg,#1a3a5a,#0d2a4a);',
      '  border:1px solid #3a6a9a; color:#5b9bd5;',
      '  border-radius:8px; padding:8px 14px; cursor:pointer;',
      '  font-size:13px; transition:all .15s;',
      '}',
      '#ai-cop-send:hover { background:#1a4a7a; color:#fff; }',
      /* Аналіз кнопки */
      '.ai-analyze-btn {',
      '  width:100%; background:#060d14; border:1px solid #2a3b48;',
      '  color:#8ea3b0; border-radius:8px; padding:10px;',
      '  cursor:pointer; font-size:12px; margin-bottom:8px;',
      '  text-align:left; transition:all .15s;',
      '  display:flex; align-items:center; gap:8px;',
      '}',
      '.ai-analyze-btn:hover { border-color:#5b9bd5; color:#c9d8e4; }',
      '.ai-analyze-btn .ai-btn-icon { font-size:16px; }',
      /* Stats */
      '.ai-stat-row {',
      '  display:flex; justify-content:space-between;',
      '  padding:5px 0; border-bottom:1px solid #0d1a28;',
      '  font-size:11px;',
      '}',
      '.ai-stat-row:last-child { border-bottom:none; }',
      '.ai-stat-key { color:#4a6070; }',
      '.ai-stat-val { color:#c9d8e4; font-family:monospace; }',
      '.ai-stat-val.green { color:#5fd0a5; }',
      '.ai-stat-val.red   { color:#e08080; }',
      '.ai-stat-val.yellow { color:#f0a840; }',
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ── Отримуємо API ключ і провайдер ── */
  function getAIConfig() {
    var provider = localStorage.getItem('ai-provider') || 'gemini';
    var apiKey   = localStorage.getItem('ai-api-key')  || '';
    var model    = localStorage.getItem('ai-model')    || '';
    return { provider: provider, apiKey: apiKey, model: model };
  }

  /* ── Викликаємо AI ── */
  function callAI(prompt, context) {
    var cfg = getAIConfig();
    if (!cfg.apiKey) {
      return Promise.reject(new Error('No API key. Set it in AI settings.'));
    }
    var fullPrompt = context
      ? 'Context:\n' + context + '\n\nQuestion: ' + prompt
      : prompt;

    return window.electronAPI.aiRequest({
      provider: cfg.provider,
      apiKey:   cfg.apiKey,
      model:    cfg.model,
      messages: [
        {
          role: 'system',
          content: 'You are a MikroTik RouterOS expert. Analyze firewall rules, ' +
                   'find issues, duplicates, security problems. ' +
                   'Be concise. Use RouterOS syntax in examples. ' +
                   'Answer in the same language as the question.'
        },
        { role: 'user', content: fullPrompt }
      ],
    });
  }

  /* ── Отримуємо роутер ── */
  function getRouter() {
    if (window.__rmGetActiveRouter) return window.__rmGetActiveRouter();
    return null;
  }

  /* ── Отримуємо Firewall правила ── */
  function getFirewallRules(router) {
    return Promise.all([
      window.restCall(router, 'GET', '/ip/firewall/filter').catch(function(){return[];}),
      window.restCall(router, 'GET', '/ip/firewall/nat').catch(function(){return[];}),
      window.restCall(router, 'GET', '/ip/firewall/mangle').catch(function(){return[];}),
      window.restCall(router, 'GET', '/ip/firewall/address-list').catch(function(){return[];}),
    ]).then(function(res) {
      return {
        filter:      Array.isArray(res[0]) ? res[0] : [],
        nat:         Array.isArray(res[1]) ? res[1] : [],
        mangle:      Array.isArray(res[2]) ? res[2] : [],
        addressList: Array.isArray(res[3]) ? res[3] : [],
      };
    });
  }

  /* ── Локальний аналіз (без AI) ── */
  function analyzeLocally(rules) {
    var issues = [];
    var filter = rules.filter;

    /* 1. Відключені правила */
    var disabled = filter.filter(function(r) {
      return r.disabled === 'true' || r.disabled === true;
    });
    if (disabled.length) {
      issues.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Відключені правила (' + disabled.length + ')',
        desc: 'Правила відключені але не видалені: ' +
              disabled.slice(0,3).map(function(r){
                return r.comment || r.chain || r['.id'];
              }).join(', '),
        fix: null,
      });
    }

    /* 2. Правила без коментарів */
    var noComment = filter.filter(function(r) {
      return !r.comment || r.comment.trim() === '';
    });
    if (noComment.length > 3) {
      issues.push({
        type: 'info',
        icon: '📝',
        title: 'Правила без коментарів (' + noComment.length + ')',
        desc: 'Рекомендується додати коментарі до всіх правил для кращого розуміння.',
        fix: null,
      });
    }

    /* 3. Drop all в forward без log */
    var dropAll = filter.filter(function(r) {
      return r.action === 'drop' && r.chain === 'forward' &&
             (!r['src-address'] && !r['dst-address'] && !r.protocol);
    });
    if (dropAll.length) {
      issues.push({
        type: 'critical',
        icon: '🚨',
        title: 'Drop-all правило в forward',
        desc: 'Знайдено drop-all правило в forward chain. Переконайтесь що потрібний трафік дозволений вище.',
        fix: null,
      });
    }

    /* 4. Accept all без умов */
    var acceptAll = filter.filter(function(r) {
      return r.action === 'accept' && r.chain === 'input' &&
             (!r['src-address'] && !r.protocol && !r['in-interface']);
    });
    if (acceptAll.length) {
      issues.push({
        type: 'critical',
        icon: '🔓',
        title: 'Accept-all в input (' + acceptAll.length + ')',
        desc: 'Знайдено правило що приймає весь вхідний трафік без умов — security risk!',
        fix: '/ip firewall filter add chain=input action=drop comment="drop all" place-before=0',
      });
    }

    /* 5. Дублікати (однакові chain+action+src+dst) */
    var seen = {};
    var dupes = [];
    filter.forEach(function(r) {
      var key = [r.chain, r.action, r['src-address']||'', r['dst-address']||'', r.protocol||''].join('|');
      if (seen[key]) {
        dupes.push(r);
      } else {
        seen[key] = true;
      }
    });
    if (dupes.length) {
      issues.push({
        type: 'warning',
        icon: '🔄',
        title: 'Можливі дублікати (' + dupes.length + ')',
        desc: 'Знайдено правила з однаковими параметрами: ' +
              dupes.slice(0,2).map(function(r){
                return (r.comment || r['.id']);
              }).join(', '),
        fix: null,
      });
    }

    /* 6. NAT masquerade перевірка */
    var masq = rules.nat.filter(function(r) {
      return r.action === 'masquerade';
    });
    if (masq.length === 0 && rules.nat.length > 0) {
      issues.push({
        type: 'info',
        icon: 'ℹ️',
        title: 'Немає masquerade в NAT',
        desc: 'NAT правила є але masquerade не знайдено. Можливо інтернет не буде працювати.',
        fix: '/ip firewall nat add chain=srcnat action=masquerade out-interface=ether1',
      });
    }

    /* 7. Загальна статистика */
    var stats = {
      filterTotal:   filter.length,
      filterActive:  filter.filter(function(r){return r.disabled!=='true';}).length,
      filterDisabled: disabled.length,
      natTotal:      rules.nat.length,
      mangleTotal:   rules.mangle.length,
      addressLists:  rules.addressList.length,
    };

    return { issues: issues, stats: stats };
  }

  /* ── Форматуємо правила для AI ── */
  function formatRulesForAI(rules) {
    var lines = [];
    lines.push('=== FIREWALL FILTER (' + rules.filter.length + ' rules) ===');
    rules.filter.slice(0, 30).forEach(function(r, i) {
      lines.push(i + ': chain=' + r.chain +
        ' action=' + r.action +
        (r['src-address']  ? ' src='  + r['src-address']  : '') +
        (r['dst-address']  ? ' dst='  + r['dst-address']  : '') +
        (r.protocol        ? ' proto='+ r.protocol        : '') +
        (r['dst-port']     ? ' dport='+ r['dst-port']     : '') +
        (r.disabled==='true' ? ' [DISABLED]' : '') +
        (r.comment         ? ' #' + r.comment             : ''));
    });
    if (rules.filter.length > 30) {
      lines.push('... and ' + (rules.filter.length - 30) + ' more rules');
    }
    lines.push('\n=== NAT (' + rules.nat.length + ' rules) ===');
    rules.nat.slice(0, 10).forEach(function(r, i) {
      lines.push(i + ': chain=' + r.chain + ' action=' + r.action +
        (r['out-interface'] ? ' out=' + r['out-interface'] : '') +
        (r['to-addresses']  ? ' to='  + r['to-addresses']  : '') +
        (r.comment          ? ' #' + r.comment              : ''));
    });
    return lines.join('\n');
  }

  /* ── State ── */
  var _open      = false;
  var _activeTab = 'analyze';
  var _chat      = [];
  var _rules     = null;
  var _loading   = false;

  /* ── Build UI ── */
  function buildUI() {
    if (document.getElementById('ai-cop-panel')) return;

    /* Кнопка */
    var btn = document.createElement('button');
    btn.id = 'ai-cop-btn';
    btn.title = 'AI Copilot';
    btn.innerHTML = '🤖';
    btn.onclick = toggle;
    document.body.appendChild(btn);

    /* Panel */
    var panel = document.createElement('div');
    panel.id = 'ai-cop-panel';
    panel.innerHTML =
      '<div id="ai-cop-header">' +
        '<div id="ai-cop-title">🤖 AI Copilot</div>' +
        '<button id="ai-cop-close">✕</button>' +
      '</div>' +
      '<div id="ai-cop-tabs">' +
        '<div class="ai-cop-tab active" data-tab="analyze">🔍 Аналіз</div>' +
        '<div class="ai-cop-tab" data-tab="chat">💬 Chat</div>' +
        '<div class="ai-cop-tab" data-tab="quick">⚡ Швидко</div>' +
        '<div class="ai-cop-tab" data-tab="settings">⚙️ Ключ</div>' +
      '</div>' +
      '<div id="ai-cop-body"></div>' +
      '<div id="ai-cop-input-wrap">' +
        '<textarea id="ai-cop-input" placeholder="Запитай про роутер..."></textarea>' +
        '<button id="ai-cop-send">➤</button>' +
      '</div>';
    document.body.appendChild(panel);

    /* Events */
    document.getElementById('ai-cop-close').onclick = close;

    /* Tabs */
    panel.querySelectorAll('.ai-cop-tab').forEach(function(tab) {
      tab.onclick = function() {
        panel.querySelectorAll('.ai-cop-tab').forEach(function(t) {
          t.classList.remove('active');
        });
        tab.classList.add('active');
        _activeTab = tab.dataset.tab;
        renderTab();
      };
    });

    /* Send */
    document.getElementById('ai-cop-send').onclick = sendMessage;
    document.getElementById('ai-cop-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    renderTab();
  }

  /* ── Render tab ── */
  function renderTab() {
    var body = document.getElementById('ai-cop-body');
    if (!body) return;

    if (_activeTab === 'analyze') {
      renderAnalyzeTab(body);
    } else if (_activeTab === 'chat') {
      renderChatTab(body);
    } else if (_activeTab === 'quick') {
      renderQuickTab(body);
    } else if (_activeTab === 'settings') {
      renderSettingsTab(body);
    }
  }

  /* ── Analyze tab ── */
  function renderAnalyzeTab(body) {
    body.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:8px;">' +
        '<button class="ai-analyze-btn" id="ai-btn-local">' +
          '<span class="ai-btn-icon">🔍</span>' +
          '<div><div style="font-weight:700;color:#c9d8e4;">Локальний аналіз</div>' +
          '<div style="font-size:10px;color:#4a6070;">Без AI — швидко знаходить типові проблеми</div></div>' +
        '</button>' +
        '<button class="ai-analyze-btn" id="ai-btn-ai">' +
          '<span class="ai-btn-icon">🤖</span>' +
          '<div><div style="font-weight:700;color:#c9d8e4;">AI аналіз Firewall</div>' +
          '<div style="font-size:10px;color:#4a6070;">Глибокий аналіз через AI — потрібен API ключ</div></div>' +
        '</button>' +
        '<button class="ai-analyze-btn" id="ai-btn-security">' +
          '<span class="ai-btn-icon">🔐</span>' +
          '<div><div style="font-weight:700;color:#c9d8e4;">Security Audit</div>' +
          '<div style="font-size:10px;color:#4a6070;">Перевірка безпеки конфігурації</div></div>' +
        '</button>' +
        '<button class="ai-analyze-btn" id="ai-btn-optimize">' +
          '<span class="ai-btn-icon">⚡</span>' +
          '<div><div style="font-weight:700;color:#c9d8e4;">Оптимізація правил</div>' +
          '<div style="font-size:10px;color:#4a6070;">Пропозиції щодо порядку та ефективності</div></div>' +
        '</button>' +
      '</div>' +
      '<div id="ai-results" style="margin-top:12px;"></div>';

    document.getElementById('ai-btn-local').onclick    = doLocalAnalysis;
    document.getElementById('ai-btn-ai').onclick       = doAIAnalysis;
    document.getElementById('ai-btn-security').onclick = doSecurityAudit;
    document.getElementById('ai-btn-optimize').onclick = doOptimize;
  }

  /* ── Chat tab ── */
  function renderChatTab(body) {
    body.innerHTML = '<div id="ai-cop-chat"></div>';
    renderChat();
  }

  function renderChat() {
    var chatEl = document.getElementById('ai-cop-chat');
    if (!chatEl) return;
    chatEl.innerHTML = '';
    if (!_chat.length) {
      chatEl.innerHTML =
        '<div style="text-align:center;color:#4a6070;padding:30px;font-size:12px;">' +
        '💬 Запитай що завгодно про роутер,<br>Firewall, мережу або конфігурацію</div>';
      return;
    }
    _chat.forEach(function(msg) {
      var div = document.createElement('div');
      div.className = 'ai-msg ' + msg.role + (msg.error ? ' error' : '');
      div.innerHTML = formatMessage(msg.content);
      chatEl.appendChild(div);
    });
    chatEl.scrollTop = chatEl.scrollHeight;
  }

  function formatMessage(text) {
    /* Форматуємо ```code``` блоки */
    return text
      .replace(/```([\s\S]*?)```/g, '<pre>$1</pre>')
      .replace(/`([^`]+)`/g, '<code style="background:#0a1520;padding:1px 4px;border-radius:3px;color:#5fd0a5;">$1</code>')
      .replace(/\n/g, '<br>');
  }

  /* ── Quick tab ── */
  function renderQuickTab(body) {
    var questions = [
      { icon: '🛡️', text: 'Які правила можуть блокувати інтернет?' },
      { icon: '🔄', text: 'Знайди дублікати в Firewall Filter' },
      { icon: '📊', text: 'Оціни поточну конфігурацію NAT' },
      { icon: '⚠️', text: 'Які security ризики є в конфігурації?' },
      { icon: '🚀', text: 'Як оптимізувати порядок Firewall правил?' },
      { icon: '🌐', text: 'Чи правильно налаштований masquerade?' },
      { icon: '🔐', text: 'Перевір чи захищений input chain' },
      { icon: '📝', text: 'Запропонуй шаблон базового Firewall' },
    ];

    body.innerHTML =
      '<div style="font-size:11px;color:#4a6070;margin-bottom:10px;">Швидкі питання:</div>' +
      questions.map(function(q) {
        return '<button class="ai-analyze-btn ai-quick-q" data-q="' + q.text + '">' +
          '<span class="ai-btn-icon">' + q.icon + '</span>' +
          '<span style="font-size:12px;color:#c9d8e4;">' + q.text + '</span>' +
        '</button>';
      }).join('');

    body.querySelectorAll('.ai-quick-q').forEach(function(btn) {
      btn.onclick = function() {
        var q = btn.dataset.q;
        /* Переходимо в chat і відправляємо */
        _activeTab = 'chat';
        document.querySelectorAll('.ai-cop-tab').forEach(function(t) {
          t.classList.toggle('active', t.dataset.tab === 'chat');
        });
        renderTab();
        askAI(q);
      };
    });
  }

  /* ── Settings tab ── */
  function renderSettingsTab(body) {
    var cfg = getAIConfig();
    body.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:12px;">' +

      '<div class="ai-issue info">' +
        '<div class="ai-issue-title">⚙️ AI Налаштування</div>' +
        '<div class="ai-issue-desc">Введи API ключ для використання AI аналізу.</div>' +
      '</div>' +

      /* Provider */
      '<div>' +
        '<div style="font-size:11px;color:#4a6070;margin-bottom:6px;">Провайдер</div>' +
        '<select id="ai-prov-sel" style="width:100%;background:#0d1821;border:1px solid #2a3b48;' +
          'color:#c9d8e4;border-radius:8px;padding:8px 12px;font-size:12px;outline:none;">' +
          '<option value="gemini"'  + (cfg.provider==='gemini'  ?' selected':'') + '>🤖 Google Gemini (безкоштовний)</option>' +
          '<option value="openai"'  + (cfg.provider==='openai'  ?' selected':'') + '>🟢 OpenAI GPT-4</option>' +
          '<option value="groq"'    + (cfg.provider==='groq'    ?' selected':'') + '>⚡ Groq (швидкий)</option>' +
          '<option value="anthropic"'+(cfg.provider==='anthropic'?' selected':'') + '>🔵 Anthropic Claude</option>' +
          '<option value="deepseek"'+(cfg.provider==='deepseek' ?' selected':'') + '>🌊 DeepSeek</option>' +
        '</select>' +
      '</div>' +

      /* API Key */
      '<div>' +
        '<div style="font-size:11px;color:#4a6070;margin-bottom:6px;">API Ключ</div>' +
        '<input id="ai-key-inp" type="password" placeholder="Встав API ключ тут..."' +
          'value="' + cfg.apiKey + '"' +
          'style="width:100%;background:#0d1821;border:1px solid #2a3b48;' +
          'color:#c9d8e4;border-radius:8px;padding:8px 12px;' +
          'font-size:12px;outline:none;box-sizing:border-box;">' +
        '<div style="font-size:10px;color:#4a6070;margin-top:4px;" id="ai-key-hint"></div>' +
      '</div>' +

      /* Model */
      '<div>' +
        '<div style="font-size:11px;color:#4a6070;margin-bottom:6px;">Модель (необов\'язково)</div>' +
        '<input id="ai-model-inp" type="text" placeholder="залиш порожнім для default"' +
          'value="' + (cfg.model||'') + '"' +
          'style="width:100%;background:#0d1821;border:1px solid #2a3b48;' +
          'color:#c9d8e4;border-radius:8px;padding:8px 12px;' +
          'font-size:12px;outline:none;box-sizing:border-box;">' +
      '</div>' +

      /* Save btn */
      '<button id="ai-save-key" style="' +
        'background:linear-gradient(135deg,#1a3a2a,#0d2a1a);' +
        'border:1px solid #3a7a4a;color:#5fd0a5;' +
        'border-radius:8px;padding:10px;width:100%;' +
        'cursor:pointer;font-size:13px;font-weight:700;">💾 Зберегти</button>' +

      /* Links */
      '<div style="font-size:10px;color:#4a6070;line-height:1.8;">' +
        '🔗 Отримати безкоштовний ключ:<br>' +
        '<a href="#" id="ai-link-gemini" style="color:#5b9bd5;">Google AI Studio (Gemini)</a><br>' +
        '<a href="#" id="ai-link-groq"   style="color:#5b9bd5;">Groq Console (безкоштовно)</a>' +
      '</div>' +

      /* Status */
      '<div id="ai-save-status" style="font-size:12px;min-height:18px;"></div>' +
      '</div>';

    /* Підказки провайдерів */
    var hints = {
      gemini:    'aistudio.google.com → Get API key → безкоштовно',
      openai:    'platform.openai.com → API keys → платно',
      groq:      'console.groq.com → API Keys → безкоштовно',
      anthropic: 'console.anthropic.com → API Keys → платно',
      deepseek:  'platform.deepseek.com → API keys → дешево',
    };

    var provSel = document.getElementById('ai-prov-sel');
    var keyHint = document.getElementById('ai-key-hint');
    if (provSel && keyHint) {
      keyHint.textContent = hints[provSel.value] || '';
      provSel.onchange = function() {
        keyHint.textContent = hints[provSel.value] || '';
      };
    }

    /* Посилання */
    var lnkG = document.getElementById('ai-link-gemini');
    var lnkR = document.getElementById('ai-link-groq');
    if (lnkG) lnkG.onclick = function(e) {
      e.preventDefault();
      if (window.electronAPI && window.electronAPI.openExternal) {
        window.electronAPI.openExternal('https://aistudio.google.com/app/apikey');
      } else { window.open('https://aistudio.google.com/app/apikey'); }
    };
    if (lnkR) lnkR.onclick = function(e) {
      e.preventDefault();
      if (window.electronAPI && window.electronAPI.openExternal) {
        window.electronAPI.openExternal('https://console.groq.com/keys');
      } else { window.open('https://console.groq.com/keys'); }
    };

    /* Зберегти */
    var saveBtn = document.getElementById('ai-save-key');
    var status  = document.getElementById('ai-save-status');
    if (saveBtn) saveBtn.onclick = function() {
      var prov  = provSel ? provSel.value : 'gemini';
      var key   = (document.getElementById('ai-key-inp')   || {}).value || '';
      var model = (document.getElementById('ai-model-inp') || {}).value || '';
      if (!key.trim()) {
        status.style.color = '#e08080';
        status.textContent = '⚠️ Введи API ключ!';
        return;
      }
      localStorage.setItem('ai-provider', prov);
      localStorage.setItem('ai-api-key',  key.trim());
      localStorage.setItem('ai-model',    model.trim());
      status.style.color = '#5fd0a5';
      status.textContent = '✅ Збережено! Провайдер: ' + prov;
      setTimeout(function() { status.textContent = ''; }, 3000);
    };
  }

  /* ── Локальний аналіз ── */
  function doLocalAnalysis() {
    var router = getRouter();
    var res = document.getElementById('ai-results');
    if (!res) return;
    if (!router) {
      res.innerHTML = '<div class="ai-issue warning"><div class="ai-issue-title">⚠️ Немає підключеного роутера</div></div>';
      return;
    }

    res.innerHTML = '<div style="color:#4a6070;font-size:12px;padding:10px;">⏳ Аналіз...</div>';

    getFirewallRules(router).then(function(rules) {
      _rules = rules;
      var result = analyzeLocally(rules);
      var html = '';

      /* Stats */
      html += '<div class="ai-issue ok" style="margin-bottom:12px;">';
      html += '<div class="ai-issue-title">📊 Статистика</div>';
      html += '<div class="ai-stat-row"><span class="ai-stat-key">Filter rules</span>' +
              '<span class="ai-stat-val">' + result.stats.filterTotal + '</span></div>';
      html += '<div class="ai-stat-row"><span class="ai-stat-key">Active</span>' +
              '<span class="ai-stat-val green">' + result.stats.filterActive + '</span></div>';
      html += '<div class="ai-stat-row"><span class="ai-stat-key">Disabled</span>' +
              '<span class="ai-stat-val ' + (result.stats.filterDisabled>0?'yellow':'green') + '">' +
              result.stats.filterDisabled + '</span></div>';
      html += '<div class="ai-stat-row"><span class="ai-stat-key">NAT rules</span>' +
              '<span class="ai-stat-val">' + result.stats.natTotal + '</span></div>';
      html += '<div class="ai-stat-row"><span class="ai-stat-key">Mangle rules</span>' +
              '<span class="ai-stat-val">' + result.stats.mangleTotal + '</span></div>';
      html += '<div class="ai-stat-row"><span class="ai-stat-key">Address lists</span>' +
              '<span class="ai-stat-val">' + result.stats.addressLists + '</span></div>';
      html += '</div>';

      if (!result.issues.length) {
        html += '<div class="ai-issue ok"><div class="ai-issue-title">✅ Проблем не знайдено</div>' +
                '<div class="ai-issue-desc">Базовий аналіз не виявив типових помилок.</div></div>';
      } else {
        result.issues.forEach(function(issue) {
          html += '<div class="ai-issue ' + issue.type + '">';
          html += '<div class="ai-issue-title">' + issue.icon + ' ' + issue.title + '</div>';
          html += '<div class="ai-issue-desc">' + issue.desc + '</div>';
          if (issue.fix) {
            html += '<div class="ai-issue-fix" title="Клікни щоб скопіювати">' +
                    '💡 ' + issue.fix + '</div>';
          }
          html += '</div>';
        });
      }

      res.innerHTML = html;

      /* Copy fix on click */
      res.querySelectorAll('.ai-issue-fix').forEach(function(el) {
        el.onclick = function() {
          navigator.clipboard.writeText(el.textContent.replace('💡 ', ''));
          el.style.color = '#5fd0a5';
          setTimeout(function() { el.style.color = ''; }, 1000);
        };
      });

    }).catch(function(e) {
      res.innerHTML = '<div class="ai-issue critical"><div class="ai-issue-title">❌ Помилка</div>' +
                      '<div class="ai-issue-desc">' + e.message + '</div></div>';
    });
  }

  /* ── AI аналіз ── */
  function doAIAnalysis() {
    var router = getRouter();
    if (!router) { showNoRouter(); return; }

    setLoading(true);
    getFirewallRules(router).then(function(rules) {
      _rules = rules;
      var context = formatRulesForAI(rules);
      return callAI(
        'Проаналізуй ці MikroTik Firewall правила. ' +
        'Знайди: 1) помилки та небезпечні місця 2) дублікати 3) правила що ніколи не спрацюють ' +
        '4) пропущені правила для безпеки. ' +
        'Дай конкретні рекомендації з RouterOS командами.',
        context
      );
    }).then(function(res) {
      setLoading(false);
      var text = res && res.content ? res.content :
                 res && res.text   ? res.text    :
                 JSON.stringify(res);
      addToResults(text);
    }).catch(function(e) {
      setLoading(false);
      showError(e.message);
    });
  }

  /* ── Security audit ── */
  function doSecurityAudit() {
    var router = getRouter();
    if (!router) { showNoRouter(); return; }
    setLoading(true);
    getFirewallRules(router).then(function(rules) {
      _rules = rules;
      var context = formatRulesForAI(rules);
      return callAI(
        'Проведи Security Audit MikroTik Firewall. ' +
        'Перевір: відкриті порти на input, захист від brute-force, ' +
        'port knocking, drop invalid, захист від DDoS. ' +
        'Список критичних вразливостей з пріоритетами HIGH/MEDIUM/LOW.',
        context
      );
    }).then(function(res) {
      setLoading(false);
      var text = res && res.content ? res.content : res && res.text ? res.text : JSON.stringify(res);
      addToResults(text);
    }).catch(function(e) {
      setLoading(false);
      showError(e.message);
    });
  }

  /* ── Optimize ── */
  function doOptimize() {
    var router = getRouter();
    if (!router) { showNoRouter(); return; }
    setLoading(true);
    getFirewallRules(router).then(function(rules) {
      _rules = rules;
      var context = formatRulesForAI(rules);
      return callAI(
        'Запропонуй оптимізацію порядку Firewall правил для MikroTik. ' +
        'Правила з більшим трафіком повинні бути вище. ' +
        'Знайди правила які можна об\'єднати в address-list. ' +
        'Дай конкретний оптимізований порядок.',
        context
      );
    }).then(function(res) {
      setLoading(false);
      var text = res && res.content ? res.content : res && res.text ? res.text : JSON.stringify(res);
      addToResults(text);
    }).catch(function(e) {
      setLoading(false);
      showError(e.message);
    });
  }

  /* ── Chat: send message ── */
  function sendMessage() {
    var input = document.getElementById('ai-cop-input');
    if (!input) return;
    var text = input.value.trim();
    if (!text || _loading) return;
    input.value = '';
    askAI(text);
  }

  function askAI(question) {
    /* Переходимо в chat tab */
    _activeTab = 'chat';
    document.querySelectorAll('.ai-cop-tab').forEach(function(t) {
      t.classList.toggle('active', t.dataset.tab === 'chat');
    });

    _chat.push({ role: 'user', content: question });
    renderTab();
    _loading = true;

    /* Додаємо thinking */
    var chatEl = document.getElementById('ai-cop-chat');
    if (chatEl) {
      var thinking = document.createElement('div');
      thinking.className = 'ai-msg ai thinking';
      thinking.id = 'ai-thinking';
      thinking.textContent = '🤔 Думаю...';
      chatEl.appendChild(thinking);
      chatEl.scrollTop = chatEl.scrollHeight;
    }

    /* Контекст — поточні правила якщо є */
    var context = _rules ? formatRulesForAI(_rules) : null;

    callAI(question, context).then(function(res) {
      _loading = false;
      var text = res && res.content ? res.content :
                 res && res.text   ? res.text    :
                 typeof res === 'string' ? res   :
                 JSON.stringify(res);
      var thinking2 = document.getElementById('ai-thinking');
      if (thinking2) thinking2.remove();
      _chat.push({ role: 'ai', content: text });
      renderChat();
    }).catch(function(e) {
      _loading = false;
      var thinking3 = document.getElementById('ai-thinking');
      if (thinking3) thinking3.remove();
      _chat.push({ role: 'ai', content: '❌ ' + e.message, error: true });
      renderChat();
    });
  }

  /* ── Helpers ── */
  function setLoading(on) {
    _loading = on;
    var res = document.getElementById('ai-results');
    if (on && res) {
      res.innerHTML =
        '<div style="text-align:center;padding:20px;color:#4a6070;">' +
        '<div style="font-size:24px;margin-bottom:8px;">🤖</div>' +
        '<div style="font-size:12px;animation:ai-blink 1s infinite;">AI аналізує...</div>' +
        '</div>';
    }
  }

  function addToResults(text) {
    var res = document.getElementById('ai-results');
    if (!res) return;
    res.innerHTML =
      '<div class="ai-issue info">' +
        '<div class="ai-issue-title">🤖 AI аналіз</div>' +
        '<div class="ai-issue-desc" style="white-space:pre-wrap;line-height:1.6;">' +
          formatMessage(text) +
        '</div>' +
      '</div>';
  }

  function showNoRouter() {
    var res = document.getElementById('ai-results');
    if (res) res.innerHTML =
      '<div class="ai-issue warning">' +
        '<div class="ai-issue-title">⚠️ Немає підключеного роутера</div>' +
        '<div class="ai-issue-desc">Підключіться до роутера спочатку.</div>' +
      '</div>';
  }

  function showError(msg) {
    var res = document.getElementById('ai-results');
    if (res) res.innerHTML =
      '<div class="ai-issue critical">' +
        '<div class="ai-issue-title">❌ Помилка</div>' +
        '<div class="ai-issue-desc">' + msg + '</div>' +
      '</div>';
  }

  /* ── Open / Close / Toggle ── */
  function open() {
    _open = true;
    var panel = document.getElementById('ai-cop-panel');
    if (panel) panel.classList.add('open');
  }

  function close() {
    _open = false;
    var panel = document.getElementById('ai-cop-panel');
    if (panel) panel.classList.remove('open');
  }

  function toggle() {
    if (_open) close(); else open();
  }

  /* ── Init ── */
  function init() {
    injectCSS();
    buildUI();
    /* Shortcuts */
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        toggle();
      }
    });
    /* Додаємо в shortcuts panel */
    if (window.RMShortcuts) {
      window.RMShortcuts.addShortcut('Router Manager',
        ['Ctrl', 'I'], 'AI Copilot — аналіз Firewall');
    }
    console.log('[AI Copilot] ready — Ctrl+I to toggle');
  }

  return { init: init, open: open, close: close, toggle: toggle };

})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { window.RMAICopilot.init(); });
} else {
  window.RMAICopilot.init();
}

console.log('[AI Copilot] rm-ai-copilot.js loaded');
