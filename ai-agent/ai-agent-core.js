/* ══════════════════════════════════════════════════════
   AI AGENT CORE v1.0
   Groq API + Router Context + Memory
   ══════════════════════════════════════════════════════ */
'use strict';

window.AIAgent = window.AIAgent || {};

/* ── Конфігурація ── */
AIAgent.config = {
  model:       '', /* Модель вказана в main.js — не чіпати! */
  maxTokens:   4000,
  temperature: 0.7,
  systemPrompt: `You are an expert MikroTik RouterOS engineer embedded in a router management app.
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
- Never ask for IP if it's in the context`
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
  if (AIAgent.memory.routerCache &&
      Date.now() - AIAgent.memory.cacheTime < 120000) {
    return Promise.resolve(AIAgent.memory.routerCache);
  }
  var router = window.getActiveRouter ? window.getActiveRouter() : null;
  if (!router) return Promise.resolve("Маршрутизатор не пiдключено.");

  var endpoints = [
    "/system/identity",
    "/system/resource",
    "/ip/address",
    "/interface",
    "/ip/firewall/filter",
    "/ip/firewall/nat",
    "/ip/service",
    "/ip/dhcp-server/lease",
  ];

  return Promise.allSettled(
    endpoints.map(function(ep) {
      return window.restCall(router, "GET", ep)
        .then(function(d) {
          return { ep: ep, data: Array.isArray(d) ? d : (d ? [d] : []) };
        })
        .catch(function() { return { ep: ep, data: [] }; });
    })
  ).then(function(results) {
    var ctx = {};
    results.forEach(function(r) {
      if (r.status === "fulfilled") ctx[r.value.ep] = r.value.data;
    });

    var lines = [];
    var identity = (ctx["/system/identity"] || [])[0] || {};
    var resource = (ctx["/system/resource"] || [])[0] || {};
    lines.push("=== ROUTER ===");
    lines.push("name: "    + (identity.name          || "?"));
    lines.push("version: " + (resource.version       || "?"));
    lines.push("cpu: "     + (resource["cpu-load"]   || "?") + "%");
    lines.push("ram: "     + (resource["free-memory"]|| "?"));

    var ifaces = ctx["/interface"] || [];
    lines.push("\n=== INTERFACES (" + ifaces.length + ") ===");
    ifaces.forEach(function(i) {
      lines.push(i.name + " type:" + (i.type||"?") +
        " mac:" + (i["mac-address"]||"?") +
        " run:" + (i.running||"false"));
    });

    var addrs = ctx["/ip/address"] || [];
    lines.push("\n=== IP ADDRESSES (" + addrs.length + ") ===");
    addrs.forEach(function(a) {
      lines.push(a.address + " iface:" + a.interface);
    });

    var fw = ctx["/ip/firewall/filter"] || [];
    lines.push("\n=== FIREWALL (" + fw.length + ") ===");
    fw.slice(0, 15).forEach(function(r, i) {
      lines.push(i + ": chain=" + (r.chain||"?") +
        " action=" + (r.action||"?") +
        " comment=" + (r.comment||""));
    });

    var leases = ctx["/ip/dhcp-server/lease"] || [];
    lines.push("\n=== DHCP CLIENTS (" + leases.length + ") ===");
    leases.forEach(function(l) {
      lines.push("IP:" + (l.address||"?") +
        " MAC:" + (l["mac-address"]||"?") +
        " HOST:" + (l["host-name"]||"?") +
        " STATUS:" + (l.status||"?"));
    });

    var svcs = ctx["/ip/service"] || [];
    lines.push("\n=== SERVICES ===");
    svcs.filter(function(s){ return s.disabled !== "true"; }).forEach(function(s) {
      lines.push(s.name + " port:" + (s.port||"?"));
    });

    var nat = ctx["/ip/firewall/nat"] || [];
    lines.push("\n=== NAT (" + nat.length + ") ===");
    nat.slice(0, 10).forEach(function(r) {
      lines.push("chain=" + (r.chain||"?") + " action=" + (r.action||"?"));
    });

    var str = lines.join("\n");
    console.log("[AIAgent] Context OK:", lines.length, "lines");
    AIAgent.memory.routerCache = str;
    AIAgent.memory.cacheTime   = Date.now();
    return str;
  });
};;;

/* ── Отримати роутер ── */
AIAgent.getRouter = function() {
  return window.getActiveRouter ? window.getActiveRouter() : null;
};;;

/* ── Виконати SSH команду ── */
AIAgent.ssh = function(cmd) {
  var router = window.getActiveRouter ? window.getActiveRouter() : null;
  if (!router) return Promise.reject('Немає роутера');
  if (!window.sshCall) return Promise.reject('sshCall недоступний');
  return window.sshCall(router, cmd)
    .then(function(d) {
      console.log('[AIAgent.ssh] raw result:', JSON.stringify(d).substring(0,200));
      /* sshCall повертає {ok, output} або рядок */
      return d;
    });
};;

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
      /* Не передаємо tools в промпт — модель не підтримує tool_choice */

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
