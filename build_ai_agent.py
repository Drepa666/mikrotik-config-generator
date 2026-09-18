# -*- coding: utf-8 -*-
import os, subprocess

# ── Створюємо папку tools ──
os.makedirs('ai-agent/tools', exist_ok=True)
print('OK: папка ai-agent/tools ✅')

# ════════════════════════════════════════════════════════
# ai-agent-core.js — Ядро: Groq API + контекст + пам'ять
# ════════════════════════════════════════════════════════
CORE_JS = r"""/* ══════════════════════════════════════════════════════
   AI AGENT CORE v1.0
   Groq API + Router Context + Memory
   ══════════════════════════════════════════════════════ */
'use strict';

window.AIAgent = window.AIAgent || {};

/* ── Конфігурація ── */
AIAgent.config = {
  model:       'llama-3.3-70b-versatile',
  maxTokens:   4096,
  temperature: 0.7,
  systemPrompt: `Ти — AI асистент для MikroTik RouterOS конфігуратора.
Ти маєш доступ до поточного стану роутера і можеш:
- Аналізувати конфігурацію та знаходити проблеми
- Генерувати RouterOS скрипти та команди
- Проводити аудит безпеки
- Діагностувати проблеми мережі
- Пояснювати налаштування

ВАЖЛИВО:
- Перед небезпечними діями ЗАВЖДИ питай підтвердження
- Відповідай українською мовою
- Будь конкретним і точним
- Якщо генеруєш команди — пояснюй що вони роблять`
};

/* ── Пам'ять ── */
AIAgent.memory = {
  messages:    [],    // Поточна розмова
  maxMessages: 20,    // Максимум повідомлень в контексті
  routerCache: null,  // Кеш даних роутера
  cacheTime:   0,     // Час кешування

  add: function(role, content) {
    this.messages.push({ role: role, content: content });
    if (this.messages.length > this.maxMessages) {
      // Зберігаємо перше системне і видаляємо старі
      this.messages.splice(1, 2);
    }
  },

  clear: function() {
    this.messages = [];
    this.routerCache = null;
    console.log('[AIAgent] Memory cleared');
  },

  save: function() {
    try {
      localStorage.setItem('ai-agent-memory', JSON.stringify({
        messages: this.messages.slice(-10),
        timestamp: Date.now()
      }));
    } catch(e) {}
  },

  load: function() {
    try {
      var saved = JSON.parse(localStorage.getItem('ai-agent-memory') || '{}');
      // Завантажуємо тільки якщо свіжі (< 1 год)
      if (saved.timestamp && Date.now() - saved.timestamp < 3600000) {
        this.messages = saved.messages || [];
        console.log('[AIAgent] Memory loaded:', this.messages.length, 'messages');
      }
    } catch(e) {}
  }
};

/* ── Збір контексту роутера ── */
AIAgent.getRouterContext = function() {
  var router = AIAgent.getRouter();
  if (!router) return Promise.resolve('Роутер не підключений');

  // Кеш на 30 секунд
  if (AIAgent.memory.routerCache && Date.now() - AIAgent.memory.cacheTime < 30000) {
    return Promise.resolve(AIAgent.memory.routerCache);
  }

  var h = {
    'x-router-ip':   router.ip,
    'x-router-port': String(router.port || 80),
    'x-router-user': router.user || 'admin',
    'x-router-pass': router.pass || '',
  };

  var endpoints = [
    '/system/identity',
    '/system/resource',
    '/system/routerboard',
    '/ip/address',
    '/interface',
    '/ip/firewall/filter',
    '/ip/firewall/nat',
    '/ip/route',
    '/ip/dns',
    '/system/package',
    '/ip/service',
    '/ip/dhcp-server/lease',
  ];

  return Promise.allSettled(
    endpoints.map(function(ep) {
      return fetch('http://localhost:8888/rest' + ep, { headers: h })
        .then(function(r) { return r.json(); })
        .then(function(data) { return { ep: ep, data: data }; })
        .catch(function() { return { ep: ep, data: null }; });
    })
  ).then(function(results) {
    var ctx = {};
    results.forEach(function(r) {
      if (r.value && r.value.data) ctx[r.value.ep] = r.value.data;
    });

    var identity  = (ctx['/system/identity'] || {}).name || 'Unknown';
    var resource  = ctx['/system/resource'] || {};
    var board     = ctx['/system/routerboard'] || {};
    var addresses = ctx['/ip/address'] || [];
    var ifaces    = ctx['/interface'] || [];
    var fwFilter  = ctx['/ip/firewall/filter'] || [];
    var fwNat     = ctx['/ip/firewall/nat'] || [];
    var routes    = ctx['/ip/route'] || [];
    var services  = ctx['/ip/service'] || [];
    var leases    = ctx['/ip/dhcp-server/lease'] || [];
    var packages  = ctx['/system/package'] || [];

    var routerOS = '';
    if (Array.isArray(packages)) {
      var sysPkg = packages.find(function(p){ return p.name === 'routeros'; });
      routerOS = sysPkg ? sysPkg.version : (resource.version || 'Unknown');
    }

    var context = [
      '=== РОУТЕР ===',
      'Ім\'я: ' + identity,
      'Модель: ' + (board['model'] || resource['board-name'] || 'Unknown'),
      'RouterOS: ' + routerOS,
      'CPU: ' + (resource['cpu'] || '?') + ' ' + (resource['cpu-load'] || '0') + '% load',
      'RAM: ' + Math.round((resource['total-memory']||0)/1024/1024) + 'MB total, ' +
               Math.round((resource['free-memory']||0)/1024/1024) + 'MB free',
      'Uptime: ' + (resource['uptime'] || 'Unknown'),
      'Architecture: ' + (resource['architecture-name'] || 'Unknown'),
      '',
      '=== ІНТЕРФЕЙСИ (' + ifaces.length + ') ===',
    ].concat(
      ifaces.slice(0,10).map(function(i) {
        return (i['running']==='true'?'● ':'○ ') + i.name + ' [' + i.type + '] ' + (i['mac-address']||'');
      })
    ).concat([
      '',
      '=== IP АДРЕСИ (' + addresses.length + ') ===',
    ]).concat(
      addresses.map(function(a) { return a.address + ' on ' + a.interface; })
    ).concat([
      '',
      '=== FIREWALL FILTER (' + fwFilter.length + ' правил) ===',
    ]).concat(
      fwFilter.slice(0,20).map(function(r, i) {
        return i + ': chain=' + r.chain + ' action=' + r.action +
          (r['src-address'] ? ' src=' + r['src-address'] : '') +
          (r['dst-address'] ? ' dst=' + r['dst-address'] : '') +
          (r['protocol'] ? ' proto=' + r['protocol'] : '') +
          (r['dst-port'] ? ' dport=' + r['dst-port'] : '') +
          (r['comment'] ? ' #' + r['comment'] : '');
      })
    ).concat([
      '',
      '=== СЕРВІСИ ===',
    ]).concat(
      services.map(function(s) {
        return s.name + ':' + (s.port||'?') + ' ' + (s.disabled==='true'?'ВИМК':'УВІМК');
      })
    ).concat([
      '',
      '=== DHCP КЛІЄНТИ (' + leases.length + ') ===',
    ]).concat(
      leases.slice(0,10).map(function(l) {
        return l.address + ' ' + (l['mac-address']||'') + ' ' + (l['host-name']||'') + ' [' + (l.status||'') + ']';
      })
    ).concat([
      '',
      '=== NAT (' + fwNat.length + ' правил) ===',
    ]).concat(
      fwNat.slice(0,5).map(function(r) {
        return 'chain=' + r.chain + ' action=' + r.action +
          (r['to-addresses'] ? ' to=' + r['to-addresses'] : '');
      })
    );

    var contextStr = context.join('\n');
    AIAgent.memory.routerCache = contextStr;
    AIAgent.memory.cacheTime   = Date.now();
    return contextStr;
  });
};

/* ── Отримати роутер ── */
AIAgent.getRouter = function() {
  try {
    var routers  = JSON.parse(localStorage.getItem('rm-routers') || '[]');
    var activeId = localStorage.getItem('rm-active-router');
    return routers.find(function(r){ return r.id === activeId; }) || routers[0] || null;
  } catch(e) { return null; }
};

/* ── Виконати SSH команду ── */
AIAgent.ssh = function(cmd) {
  var router = AIAgent.getRouter();
  if (!router) return Promise.reject('Немає підключеного роутера');
  return fetch('http://localhost:8888/ssh/exec', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: router.ip, port: router.sshPort || 22,
      username: router.user, password: router.pass,
      command: cmd
    })
  }).then(function(r) { return r.json(); });
};

/* ── Головна функція: надіслати повідомлення ── */
AIAgent.send = function(userMessage, options) {
  options = options || {};
  var includeContext = options.includeContext !== false;

  return AIAgent.getRouterContext()
    .then(function(context) {
      /* Будуємо повідомлення */
      var systemContent = AIAgent.config.systemPrompt;
      if (includeContext && context) {
        systemContent += '\n\n=== ПОТОЧНИЙ СТАН РОУТЕРА ===\n' + context;
      }

      /* Додаємо інформацію про доступні інструменти */
      var tools = AIAgent.tools ? AIAgent.tools.list() : [];
      if (tools.length) {
        systemContent += '\n\n=== ДОСТУПНІ ІНСТРУМЕНТИ ===\n';
        tools.forEach(function(t) {
          systemContent += t.icon + ' ' + t.name + ': ' + t.description + '\n';
        });
      }

      AIAgent.memory.add('user', userMessage);

      var messages = [
        { role: 'system', content: systemContent }
      ].concat(AIAgent.memory.messages);

      /* Groq API через electron-bridge */
      return window.callAI(userMessage, 4096, {
        model:       AIAgent.config.model,
        temperature: AIAgent.config.temperature,
        messages:    messages,
        systemPrompt: systemContent,
      });
    })
    .then(function(response) {
      AIAgent.memory.add('assistant', response);
      AIAgent.memory.save();
      return response;
    });
};

/* ── Парсинг команд з відповіді AI ── */
AIAgent.parseCommands = function(text) {
  var commands = [];
  /* Шукаємо блоки коду з MikroTik командами */
  var codeBlocks = text.match(/```(?:routeros|mikrotik|bash|shell|)?\n?([\s\S]*?)```/g) || [];
  codeBlocks.forEach(function(block) {
    var code = block.replace(/```(?:routeros|mikrotik|bash|shell|)?\n?/g, '').replace(/```/g, '').trim();
    if (code) commands.push(code);
  });
  /* Також шукаємо рядки що починаються з / */
  var lines = text.split('\n');
  lines.forEach(function(line) {
    line = line.trim();
    if (line.startsWith('/') && !commands.some(function(c){ return c.includes(line); })) {
      commands.push(line);
    }
  });
  return commands;
};

/* ── Реєстр інструментів ── */
AIAgent.tools = {
  _registry: {},

  register: function(tool) {
    this._registry[tool.name] = tool;
    console.log('[AIAgent] Tool registered:', tool.name);
  },

  unregister: function(name) {
    delete this._registry[name];
  },

  list: function() {
    return Object.values(this._registry);
  },

  get: function(name) {
    return this._registry[name];
  },

  run: function(name, params) {
    var tool = this._registry[name];
    if (!tool) return Promise.reject('Tool not found: ' + name);
    return Promise.resolve(tool.run(params));
  }
};

/* ── Ініціалізація ── */
AIAgent.init = function() {
  AIAgent.memory.load();
  console.log('[AIAgent Core] ініціалізовано ✅');
  console.log('[AIAgent] Groq model:', AIAgent.config.model);
};

AIAgent.init();
"""

with open('ai-agent/ai-agent-core.js', 'w', encoding='utf-8') as f:
    f.write(CORE_JS)
print('OK: ai-agent-core.js ✅')

# ════════════════════════════════════════════════════════
# ai-agent-ui.js — Sidebar UI
# ════════════════════════════════════════════════════════
UI_JS = r"""/* ══════════════════════════════════════════════════════
   AI AGENT UI v1.0 — Sidebar Panel
   ══════════════════════════════════════════════════════ */
'use strict';

window.AIAgentUI = window.AIAgentUI || {};

/* ── Стан UI ── */
AIAgentUI.state = {
  isOpen:   false,
  isLoading: false,
};

/* ── Ініціалізація ── */
AIAgentUI.init = function() {
  AIAgentUI.injectStyles();
  AIAgentUI.createSidebar();
  AIAgentUI.createToggleBtn();
  console.log('[AIAgentUI] ініціалізовано ✅');
};

/* ── Стилі ── */
AIAgentUI.injectStyles = function() {
  if (document.getElementById('ai-agent-styles')) return;
  var style = document.createElement('style');
  style.id = 'ai-agent-styles';
  style.textContent = `
    #ai-sidebar {
      position: fixed;
      top: 0; right: -420px;
      width: 420px; height: 100vh;
      background: #0a0f1a;
      border-left: 1px solid #1a2a3a;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      transition: right .3s cubic-bezier(.4,0,.2,1);
      box-shadow: -4px 0 24px rgba(0,0,0,.5);
    }
    #ai-sidebar.open { right: 0; }

    #ai-toggle-btn {
      position: fixed;
      bottom: 24px; right: 24px;
      width: 52px; height: 52px;
      background: linear-gradient(135deg,#5b4efc,#8b5efc);
      border: none; border-radius: 50%;
      color: #fff; font-size: 22px;
      cursor: pointer; z-index: 9998;
      box-shadow: 0 4px 20px rgba(91,78,252,.5);
      transition: transform .2s, box-shadow .2s;
      display: flex; align-items: center; justify-content: center;
    }
    #ai-toggle-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 28px rgba(91,78,252,.7);
    }
    #ai-toggle-btn.open { background: linear-gradient(135deg,#e05252,#c03030); }

    #ai-messages {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      scroll-behavior: smooth;
    }
    #ai-messages::-webkit-scrollbar { width: 4px; }
    #ai-messages::-webkit-scrollbar-track { background: #060d14; }
    #ai-messages::-webkit-scrollbar-thumb { background: #2a3b48; border-radius: 2px; }

    .ai-msg-user {
      background: linear-gradient(135deg,#1a2a4a,#1a3a5a);
      border: 1px solid #2a4a6a;
      border-radius: 12px 12px 4px 12px;
      padding: 10px 14px;
      color: #c9d8e4;
      font-size: 13px;
      line-height: 1.6;
      align-self: flex-end;
      max-width: 85%;
    }
    .ai-msg-assistant {
      background: #0d1117;
      border: 1px solid #1a2a38;
      border-radius: 12px 12px 12px 4px;
      padding: 10px 14px;
      color: #c9d8e4;
      font-size: 13px;
      line-height: 1.7;
      align-self: flex-start;
      max-width: 95%;
    }
    .ai-msg-assistant pre {
      background: #060d14;
      border: 1px solid #1a2a38;
      border-radius: 6px;
      padding: 10px;
      margin: 8px 0;
      overflow-x: auto;
      font-size: 12px;
      color: #5fd0a5;
    }
    .ai-msg-assistant code {
      background: #060d14;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 12px;
      color: #5fd0a5;
    }
    .ai-msg-system {
      background: #0a1a0a;
      border: 1px solid #1a3a1a;
      border-radius: 8px;
      padding: 8px 12px;
      color: #5fd0a5;
      font-size: 12px;
      text-align: center;
    }
    .ai-msg-error {
      background: #1a0a0a;
      border: 1px solid #3a1a1a;
      border-radius: 8px;
      padding: 8px 12px;
      color: #e05252;
      font-size: 12px;
    }
    .ai-typing {
      display: flex; gap: 4px; align-items: center;
      padding: 10px 14px;
      background: #0d1117;
      border: 1px solid #1a2a38;
      border-radius: 12px;
      width: fit-content;
    }
    .ai-typing span {
      width: 6px; height: 6px;
      background: #5b4efc;
      border-radius: 50%;
      animation: typing 1.2s infinite;
    }
    .ai-typing span:nth-child(2) { animation-delay: .2s; }
    .ai-typing span:nth-child(3) { animation-delay: .4s; }
    @keyframes typing {
      0%,60%,100% { opacity: .2; transform: translateY(0); }
      30% { opacity: 1; transform: translateY(-4px); }
    }
    .ai-cmd-block {
      background: #060d14;
      border: 1px solid #2a4a2a;
      border-radius: 8px;
      padding: 10px;
      margin: 8px 0;
    }
    .ai-cmd-block pre {
      margin: 0 0 8px 0;
      color: #5fd0a5;
      font-size: 12px;
      white-space: pre-wrap;
    }
    .ai-cmd-actions {
      display: flex; gap: 6px;
    }
    .ai-quick-btns {
      display: flex; gap: 6px; flex-wrap: wrap; padding: 0 12px 8px;
    }
    .ai-quick-btn {
      background: #0d1117;
      border: 1px solid #2a3b48;
      color: #8ea3b0;
      border-radius: 16px;
      padding: 4px 12px;
      font-size: 11px;
      cursor: pointer;
      transition: all .15s;
      white-space: nowrap;
    }
    .ai-quick-btn:hover {
      border-color: #5b4efc;
      color: #c9d8e4;
      background: #1a1a3a;
    }
    #ai-input-area {
      padding: 12px;
      border-top: 1px solid #1a2a38;
      display: flex; flex-direction: column; gap: 8px;
    }
    #ai-input-row {
      display: flex; gap: 8px; align-items: flex-end;
    }
    #ai-input {
      flex: 1;
      background: #060d14;
      border: 1px solid #2a3b48;
      border-radius: 10px;
      color: #e6edf3;
      padding: 10px 14px;
      font-size: 13px;
      resize: none;
      min-height: 42px;
      max-height: 120px;
      line-height: 1.5;
      font-family: inherit;
      transition: border-color .2s;
    }
    #ai-input:focus {
      outline: none;
      border-color: #5b4efc;
    }
    #ai-send-btn {
      background: linear-gradient(135deg,#5b4efc,#8b5efc);
      border: none; border-radius: 10px;
      color: #fff; width: 42px; height: 42px;
      cursor: pointer; font-size: 18px;
      transition: opacity .2s;
      flex-shrink: 0;
    }
    #ai-send-btn:hover { opacity: .85; }
    #ai-send-btn:disabled { opacity: .4; cursor: default; }
  `;
  document.head.appendChild(style);
};

/* ── Sidebar ── */
AIAgentUI.createSidebar = function() {
  var sidebar = document.createElement('div');
  sidebar.id = 'ai-sidebar';
  sidebar.innerHTML = [
    /* Header */
    '<div style="display:flex;align-items:center;gap:10px;padding:14px 16px;',
      'border-bottom:1px solid #1a2a38;background:#080f17;flex-shrink:0;">',
      '<div style="width:32px;height:32px;background:linear-gradient(135deg,#5b4efc,#8b5efc);',
        'border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;">🤖</div>',
      '<div>',
        '<div style="font-weight:700;color:#e6edf3;font-size:14px;">AI Асистент</div>',
        '<div id="ai-status" style="font-size:11px;color:#5fd0a5;">● Groq Ready</div>',
      '</div>',
      '<div style="margin-left:auto;display:flex;gap:6px;">',
        '<button onclick="window.AIAgentUI.clearChat()" title="Очистити чат"',
          ' style="background:transparent;border:1px solid #2a3b48;color:#4a6070;',
          'border-radius:6px;padding:4px 8px;cursor:pointer;font-size:12px;">🗑</button>',
        '<button onclick="window.AIAgentUI.runSecurityAudit()" title="Аудит безпеки"',
          ' style="background:#1a0a2a;border:1px solid #3a1a5a;color:#c084fc;',
          'border-radius:6px;padding:4px 8px;cursor:pointer;font-size:12px;">🔒</button>',
        '<button onclick="window.AIAgentUI.toggle()" title="Закрити"',
          ' style="background:transparent;border:1px solid #2a3b48;color:#4a6070;',
          'border-radius:6px;padding:4px 8px;cursor:pointer;font-size:14px;">✕</button>',
      '</div>',
    '</div>',

    /* Router info bar */
    '<div id="ai-router-bar" style="padding:8px 16px;background:#060d14;',
      'border-bottom:1px solid #1a2a38;font-size:11px;color:#4a6070;flex-shrink:0;">',
      '🔌 Роутер не підключений',
    '</div>',

    /* Quick tools */
    '<div style="padding:10px 12px 4px;border-bottom:1px solid #1a2a38;flex-shrink:0;">',
      '<div style="font-size:10px;color:#4a6070;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px;">Швидкі дії</div>',
      '<div class="ai-quick-btns" style="padding:0;">',
        '<button class="ai-quick-btn" onclick="window.AIAgentUI.quickAsk(\'Зроби аудит безпеки роутера\')">🔒 Аудит</button>',
        '<button class="ai-quick-btn" onclick="window.AIAgentUI.quickAsk(\'Проаналізуй поточний стан мережі\')">📊 Аналіз</button>',
        '<button class="ai-quick-btn" onclick="window.AIAgentUI.quickAsk(\'Знайди проблеми в конфігурації\')">🔍 Діагностика</button>',
        '<button class="ai-quick-btn" onclick="window.AIAgentUI.quickAsk(\'Покажи топ пристроїв за трафіком\')">📈 Трафік</button>',
        '<button class="ai-quick-btn" onclick="window.AIAgentUI.quickAsk(\'Зроби backup конфігурації\')">💾 Backup</button>',
        '<button class="ai-quick-btn" onclick="window.AIAgentUI.quickAsk(\'Перевір версію RouterOS і чи є оновлення\')">🔄 Оновлення</button>',
      '</div>',
    '</div>',

    /* Messages */
    '<div id="ai-messages"></div>',

    /* Input */
    '<div id="ai-input-area">',
      '<div id="ai-input-row">',
        '<textarea id="ai-input" rows="1" placeholder="Запитай AI про мережу..."></textarea>',
        '<button id="ai-send-btn" onclick="window.AIAgentUI.send()">▶</button>',
      '</div>',
      '<div style="font-size:10px;color:#2a3b48;text-align:center;">',
        'Groq · llama-3.3-70b · Контекст роутера автоматично',
      '</div>',
    '</div>',
  ].join('');

  document.body.appendChild(sidebar);

  /* Enter для відправки */
  var input = document.getElementById('ai-input');
  if (input) {
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        AIAgentUI.send();
      }
    });
    /* Авторозмір */
    input.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
  }

  /* Оновлюємо router bar */
  AIAgentUI.updateRouterBar();
  setInterval(AIAgentUI.updateRouterBar, 5000);

  /* Вітальне повідомлення */
  setTimeout(function() {
    AIAgentUI.addMessage('system',
      '🤖 AI Асистент готовий! Маю доступ до конфігурації роутера. ' +
      'Запитуй про мережу, безпеку, налаштування — відповім і допоможу!'
    );
  }, 500);
};

/* ── Toggle button ── */
AIAgentUI.createToggleBtn = function() {
  var btn = document.createElement('button');
  btn.id = 'ai-toggle-btn';
  btn.innerHTML = '🤖';
  btn.title = 'AI Асистент';
  btn.onclick = AIAgentUI.toggle;
  document.body.appendChild(btn);
};

/* ── Toggle sidebar ── */
AIAgentUI.toggle = function() {
  var sidebar = document.getElementById('ai-sidebar');
  var btn     = document.getElementById('ai-toggle-btn');
  if (!sidebar) return;
  AIAgentUI.state.isOpen = !AIAgentUI.state.isOpen;
  sidebar.classList.toggle('open', AIAgentUI.state.isOpen);
  if (btn) btn.classList.toggle('open', AIAgentUI.state.isOpen);
  if (AIAgentUI.state.isOpen) {
    AIAgentUI.updateRouterBar();
    setTimeout(function() {
      var input = document.getElementById('ai-input');
      if (input) input.focus();
    }, 300);
  }
};

/* ── Router bar ── */
AIAgentUI.updateRouterBar = function() {
  var bar = document.getElementById('ai-router-bar');
  if (!bar) return;
  var router = AIAgent.getRouter();
  if (!router) {
    bar.innerHTML = '🔴 Роутер не підключений';
    return;
  }
  bar.innerHTML = '🟢 ' + (router.name || router.ip) + ' · ' + router.ip +
    ' · <span style="color:#5fd0a5;">Online</span>';
};

/* ── Додати повідомлення ── */
AIAgentUI.addMessage = function(type, content, meta) {
  var container = document.getElementById('ai-messages');
  if (!container) return;

  var div = document.createElement('div');

  if (type === 'user') {
    div.className = 'ai-msg-user';
    div.textContent = content;
  } else if (type === 'assistant') {
    div.className = 'ai-msg-assistant';
    div.innerHTML = AIAgentUI.formatResponse(content);

    /* Кнопки для команд */
    var commands = AIAgent.parseCommands(content);
    if (commands.length > 0) {
      commands.forEach(function(cmd) {
        var cmdBlock = document.createElement('div');
        cmdBlock.className = 'ai-cmd-block';
        cmdBlock.innerHTML =
          '<pre>' + cmd.replace(/</g,'&lt;') + '</pre>' +
          '<div class="ai-cmd-actions">' +
            '<button onclick="window.AIAgentUI.executeCmd(\'' + btoa(encodeURIComponent(cmd)) + '\')" ' +
              'style="background:#0a2a1a;border:1px solid #2a4a2a;color:#5fd0a5;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;">▶ Виконати</button>' +
            '<button onclick="window.AIAgentUI.copyCmd(\'' + btoa(encodeURIComponent(cmd)) + '\')" ' +
              'style="background:#1a2a3a;border:1px solid #2a3b48;color:#8ea3b0;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;">📋 Копіювати</button>' +
          '</div>';
        div.appendChild(cmdBlock);
      });
    }
  } else if (type === 'system') {
    div.className = 'ai-msg-system';
    div.innerHTML = content;
  } else if (type === 'error') {
    div.className = 'ai-msg-error';
    div.innerHTML = '❌ ' + content;
  }

  if (meta && meta.time) {
    var timeEl = document.createElement('div');
    timeEl.style.cssText = 'font-size:10px;color:#2a3b48;margin-top:4px;text-align:right;';
    timeEl.textContent = new Date().toLocaleTimeString('uk-UA');
    div.appendChild(timeEl);
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
};

/* ── Форматування відповіді ── */
AIAgentUI.formatResponse = function(text) {
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    /* Код блоки */
    .replace(/```(?:routeros|mikrotik|bash|shell|)?\n?([\s\S]*?)```/g,
      '<pre>$1</pre>')
    /* Інлайн код */
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    /* Bold */
    .replace(/\*\*(.*?)\*\*/g, '<b style="color:#e6edf3;">$1</b>')
    /* Заголовки */
    .replace(/^### (.+)$/gm, '<div style="font-weight:700;color:#5fd0a5;margin:8px 0 4px;">$1</div>')
    .replace(/^## (.+)$/gm,  '<div style="font-weight:700;color:#5fd0a5;font-size:14px;margin:8px 0 4px;">$1</div>')
    /* Списки */
    .replace(/^[•\-\*] (.+)$/gm, '<div style="padding-left:12px;">• $1</div>')
    /* Нові рядки */
    .replace(/\n/g, '<br>');
};

/* ── Відправити ── */
AIAgentUI.send = function() {
  var input = document.getElementById('ai-input');
  var btn   = document.getElementById('ai-send-btn');
  if (!input || AIAgentUI.state.isLoading) return;

  var text = input.value.trim();
  if (!text) return;

  input.value = '';
  input.style.height = 'auto';
  AIAgentUI.addMessage('user', text);
  AIAgentUI.setLoading(true);

  /* Анімація друку */
  var typing = document.createElement('div');
  typing.className = 'ai-typing';
  typing.innerHTML = '<span></span><span></span><span></span>';
  var container = document.getElementById('ai-messages');
  if (container) {
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;
  }

  AIAgent.send(text)
    .then(function(response) {
      if (typing.parentNode) typing.remove();
      AIAgentUI.addMessage('assistant', response, { time: true });
    })
    .catch(function(err) {
      if (typing.parentNode) typing.remove();
      AIAgentUI.addMessage('error', String(err));
    })
    .finally(function() {
      AIAgentUI.setLoading(false);
      if (input) input.focus();
    });
};

/* ── Quick ask ── */
AIAgentUI.quickAsk = function(text) {
  if (!AIAgentUI.state.isOpen) AIAgentUI.toggle();
  var input = document.getElementById('ai-input');
  if (input) input.value = text;
  AIAgentUI.send();
};

/* ── Виконати команду ── */
AIAgentUI.executeCmd = function(encoded) {
  var cmd = decodeURIComponent(atob(encoded));
  if (!confirm('Виконати команду на роутері?\n\n' + cmd)) return;
  AIAgentUI.addMessage('system', '⚡ Виконую: ' + cmd);
  AIAgent.ssh(cmd).then(function(d) {
    var out = d.output || d.error || 'OK';
    AIAgentUI.addMessage('assistant', '**Результат:**\n```\n' + out + '\n```');
  }).catch(function(e) {
    AIAgentUI.addMessage('error', 'SSH помилка: ' + e);
  });
};

/* ── Копіювати команду ── */
AIAgentUI.copyCmd = function(encoded) {
  var cmd = decodeURIComponent(atob(encoded));
  navigator.clipboard.writeText(cmd).then(function() {
    AIAgentUI.addMessage('system', '📋 Скопійовано в буфер обміну');
  });
};

/* ── Loading стан ── */
AIAgentUI.setLoading = function(val) {
  AIAgentUI.state.isLoading = val;
  var btn = document.getElementById('ai-send-btn');
  if (btn) btn.disabled = val;
  var status = document.getElementById('ai-status');
  if (status) status.innerHTML = val
    ? '<span style="color:#f0a840;">● Думаю...</span>'
    : '<span style="color:#5fd0a5;">● Groq Ready</span>';
};

/* ── Очистити чат ── */
AIAgentUI.clearChat = function() {
  if (!confirm('Очистити історію чату?')) return;
  AIAgent.memory.clear();
  var container = document.getElementById('ai-messages');
  if (container) container.innerHTML = '';
  AIAgentUI.addMessage('system', '🗑 Чат очищено. Починаємо спочатку!');
};

/* ── Аудит безпеки ── */
AIAgentUI.runSecurityAudit = function() {
  if (!AIAgentUI.state.isOpen) AIAgentUI.toggle();
  AIAgentUI.quickAsk(
    'Проведи повний аудит безпеки мого MikroTik роутера. ' +
    'Перевір: firewall правила, відкриті сервіси, паролі, WiFi шифрування, ' +
    'захист від brute-force, небезпечні налаштування. ' +
    'Дай оцінку безпеки від 0 до 100 і список конкретних рекомендацій з командами для виправлення.'
  );
};

/* ── Ініціалізація ── */
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    if (window.AIAgent) {
      AIAgentUI.init();
      console.log('[AIAgentUI] Ready ✅');
    }
  }, 1000);
});
"""

with open('ai-agent/ai-agent-ui.js', 'w', encoding='utf-8') as f:
    f.write(UI_JS)
print('OK: ai-agent-ui.js ✅')

# ════════════════════════════════════════════════════════
# tools/tool-security.js — Аудит безпеки
# ════════════════════════════════════════════════════════
SECURITY_JS = r"""/* ══════════════════════════════════════════════════════
   TOOL: Security Audit
   Реєструється в AIAgent.tools автоматично
   ══════════════════════════════════════════════════════ */
'use strict';

(function() {
  if (!window.AIAgent) return;

  AIAgent.tools.register({
    name:        'security_audit',
    icon:        '🔒',
    description: 'Повний аудит безпеки MikroTik роутера',

    run: function() {
      var router = AIAgent.getRouter();
      if (!router) return Promise.reject('Немає роутера');

      var checks = [
        '/ip/service',
        '/ip/firewall/filter',
        '/user',
        '/interface/wireless',
        '/ip/neighbor/discovery-settings',
        '/tool/mac-server',
        '/ip/firewall/filter',
      ];

      return Promise.allSettled(
        checks.map(function(ep) {
          return fetch('http://localhost:8888/rest' + ep, {
            headers: {
              'x-router-ip':   router.ip,
              'x-router-port': String(router.port||80),
              'x-router-user': router.user||'admin',
              'x-router-pass': router.pass||'',
            }
          }).then(function(r){ return r.json(); })
            .then(function(d){ return { ep:ep, data:d }; })
            .catch(function(){ return { ep:ep, data:null }; });
        })
      ).then(function(results) {
        var data = {};
        results.forEach(function(r) {
          if (r.value) data[r.value.ep] = r.value.data;
        });

        var issues   = [];
        var warnings = [];
        var good     = [];
        var score    = 100;

        /* Перевірка сервісів */
        var services = data['/ip/service'] || [];
        services.forEach(function(s) {
          if (s.disabled === 'true') return;
          if (s.name === 'telnet') {
            issues.push({ text: 'Telnet увімкнений — небезпечний протокол!', cmd: '/ip service disable telnet', severity: 'high' });
            score -= 15;
          }
          if (s.name === 'ftp') {
            warnings.push({ text: 'FTP увімкнений — незашифрований протокол', cmd: '/ip service disable ftp', severity: 'medium' });
            score -= 5;
          }
          if (s.name === 'api' && !s['tls-certificate']) {
            warnings.push({ text: 'API без SSL — небезпечна передача даних', cmd: '/ip service disable api', severity: 'medium' });
            score -= 5;
          }
          if (s.name === 'www') {
            warnings.push({ text: 'HTTP (порт 80) увімкнений — використовуй HTTPS', cmd: '/ip service disable www', severity: 'low' });
            score -= 3;
          }
        });

        /* Перевірка firewall */
        var fw = data['/ip/firewall/filter'] || [];
        var hasInputDrop  = fw.some(function(r){ return r.chain==='input'   && r.action==='drop'; });
        var hasForwardDrop= fw.some(function(r){ return r.chain==='forward' && r.action==='drop'; });
        var hasInvalid    = fw.some(function(r){ return r['connection-state'] && r['connection-state'].includes('invalid'); });
        var hasBruteForce = fw.some(function(r){ return r.comment && (r.comment.toLowerCase().includes('brute') || r.comment.toLowerCase().includes('blacklist')); });

        if (!hasInputDrop) {
          issues.push({ text: 'Немає правила DROP для input chain!', cmd: '/ip firewall filter add chain=input action=drop comment="Drop all input" place-before=0', severity: 'high' });
          score -= 20;
        } else { good.push('✅ Input chain має DROP правило'); }

        if (!hasInvalid) {
          warnings.push({ text: 'Немає захисту від invalid пакетів', cmd: '/ip firewall filter add chain=input connection-state=invalid action=drop comment="Drop invalid"', severity: 'medium' });
          score -= 10;
        } else { good.push('✅ Invalid пакети блокуються'); }

        if (!hasBruteForce) {
          warnings.push({ text: 'Немає захисту від brute-force атак', cmd: '/ip firewall filter add chain=input protocol=tcp dst-port=22,8291 src-address-list=blacklist action=drop comment="Brute-force protection"', severity: 'medium' });
          score -= 10;
        } else { good.push('✅ Захист від brute-force є'); }

        /* Перевірка users */
        var users = data['/user'] || [];
        var adminUser = users.find(function(u){ return u.name==='admin'; });
        if (adminUser && (!adminUser.password || adminUser.password === '')) {
          issues.push({ text: 'Порожній пароль адміна!', cmd: '/user set admin password="ВАШ_НОВИЙ_ПАРОЛЬ"', severity: 'critical' });
          score -= 30;
        }

        /* WiFi перевірка */
        var wifi = data['/interface/wireless'] || [];
        wifi.forEach(function(w) {
          if (w['security-profile'] === 'default' || !w['security-profile']) {
            warnings.push({ text: 'WiFi ' + w.name + ' без профілю безпеки!', severity: 'high' });
            score -= 15;
          }
        });

        score = Math.max(0, Math.min(100, score));

        return {
          score:    score,
          issues:   issues,
          warnings: warnings,
          good:     good,
        };
      });
    }
  });

  console.log('[Tool] Security Audit registered ✅');
})();
"""

with open('ai-agent/tools/tool-security.js', 'w', encoding='utf-8') as f:
    f.write(SECURITY_JS)
print('OK: tools/tool-security.js ✅')

# ════════════════════════════════════════════════════════
# tools/tool-ssh.js
# ════════════════════════════════════════════════════════
SSH_JS = r"""/* ══════════════════════════════════════════════════════
   TOOL: SSH Executor
   ══════════════════════════════════════════════════════ */
'use strict';

(function() {
  if (!window.AIAgent) return;

  AIAgent.tools.register({
    name:        'ssh_exec',
    icon:        '⚡',
    description: 'Виконання команд на роутері через SSH',

    run: function(params) {
      if (!params || !params.command) return Promise.reject('Немає команди');
      return AIAgent.ssh(params.command);
    }
  });

  console.log('[Tool] SSH Executor registered ✅');
})();
"""

with open('ai-agent/tools/tool-ssh.js', 'w', encoding='utf-8') as f:
    f.write(SSH_JS)
print('OK: tools/tool-ssh.js ✅')

# ════════════════════════════════════════════════════════
# tools/tool-scripts.js
# ════════════════════════════════════════════════════════
SCRIPTS_JS = r"""/* ══════════════════════════════════════════════════════
   TOOL: Script Generator
   ══════════════════════════════════════════════════════ */
'use strict';

(function() {
  if (!window.AIAgent) return;

  AIAgent.tools.register({
    name:        'script_generator',
    icon:        '📝',
    description: 'Генерація RouterOS скриптів і команд',

    run: function(params) {
      if (!params || !params.description) return Promise.reject('Немає опису');
      return AIAgent.send(
        'Згенеруй RouterOS скрипт для: ' + params.description +
        '\nПоверни тільки код без пояснень.'
      );
    }
  });

  console.log('[Tool] Script Generator registered ✅');
})();
"""

with open('ai-agent/tools/tool-scripts.js', 'w', encoding='utf-8') as f:
    f.write(SCRIPTS_JS)
print('OK: tools/tool-scripts.js ✅')

# ════════════════════════════════════════════════════════
# tools/tool-diagnosis.js
# ════════════════════════════════════════════════════════
DIAGNOSIS_JS = r"""/* ══════════════════════════════════════════════════════
   TOOL: Network Diagnosis
   ══════════════════════════════════════════════════════ */
'use strict';

(function() {
  if (!window.AIAgent) return;

  AIAgent.tools.register({
    name:        'diagnosis',
    icon:        '🔍',
    description: 'Діагностика проблем мережі та роутера',

    run: function(params) {
      var router = AIAgent.getRouter();
      if (!router) return Promise.reject('Немає роутера');

      /* Збираємо діагностичні дані */
      var cmds = [
        '/system resource print',
        '/ip firewall connection print count-only',
        '/log print where topics~"error" limit=20',
        '/interface print stats',
      ];

      return Promise.allSettled(
        cmds.map(function(cmd) { return AIAgent.ssh(cmd); })
      ).then(function(results) {
        var diag = {};
        cmds.forEach(function(cmd, i) {
          diag[cmd] = results[i].value ? results[i].value.output : 'error';
        });
        return diag;
      });
    }
  });

  console.log('[Tool] Diagnosis registered ✅');
})();
"""

with open('ai-agent/tools/tool-diagnosis.js', 'w', encoding='utf-8') as f:
    f.write(DIAGNOSIS_JS)
print('OK: tools/tool-diagnosis.js ✅')

# ════════════════════════════════════════════════════════
# Підключаємо в index.html
# ════════════════════════════════════════════════════════
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

AI_SCRIPTS = """
  <!-- AI Agent -->
  <script src="ai-agent/ai-agent-core.js"></script>
  <script src="ai-agent/tools/tool-security.js"></script>
  <script src="ai-agent/tools/tool-ssh.js"></script>
  <script src="ai-agent/tools/tool-scripts.js"></script>
  <script src="ai-agent/tools/tool-diagnosis.js"></script>
  <script src="ai-agent/ai-agent-ui.js"></script>"""

if 'ai-agent-core.js' not in html:
    html = html.replace('</body>', AI_SCRIPTS + '\n</body>')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print('OK: index.html оновлено ✅')
else:
    print('index.html вже має AI Agent ✅')

# ── Перевірка синтаксису ──
errors = 0
for fn in ['ai-agent/ai-agent-core.js', 'ai-agent/ai-agent-ui.js',
           'ai-agent/tools/tool-security.js', 'ai-agent/tools/tool-ssh.js',
           'ai-agent/tools/tool-scripts.js', 'ai-agent/tools/tool-diagnosis.js']:
    r = subprocess.run(['node', '--check', fn], capture_output=True, text=True)
    if r.returncode == 0:
        print(f'Синтаксис {fn}: OK ✅')
    else:
        print(f'Синтаксис {fn}: ❌\n{r.stderr[:200]}')
        errors += 1

print(f'\n{"Всі файли OK! ✅" if errors==0 else f"Помилок: {errors} ❌"}')