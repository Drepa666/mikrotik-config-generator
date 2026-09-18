/* ══════════════════════════════════════════════════════
   AI AGENT CORE v1.0
   Groq API + Router Context + Memory
   ══════════════════════════════════════════════════════ */
'use strict';

window.AIAgent = window.AIAgent || {};

/* ── Конфігурація ── */
AIAgent.config = {
  model:       'llama3-70b-8192',
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
