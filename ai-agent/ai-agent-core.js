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
  systemPrompt:
    'Ти — експерт MikroTik RouterOS v7. Відповідай ТІЛЬКИ українською.\n'
    + 'Маєш ПОВНИЙ доступ до роутера через SSH і REST API.\n'
    + 'Реальний стан роутера — в [ROUTER STATE].\n'
    + '[KNOWLEDGE BASE] — база знань RouterOS.\n'
    + 'ОБОВЯЗКОВО читай [KNOWLEDGE BASE] перед генерацією БУДЬ-ЯКОЇ команди!\n\n'

    + 'КРИТИЧНІ ПРАВИЛА:\n'
    + '1. Відповідай ТІЛЬКИ українською\n'
    + '2. Перевіряй синтаксис в [KNOWLEDGE BASE] — не вигадуй параметри\n'
    + '3. Використовуй реальні дані з [ROUTER STATE]\n'
    + '4. Команди — один рядок, без backslash продовження\n'
    + '5. Команди — в блоках ```routeros\n'
    + '6. comment — ТІЛЬКИ подвійні лапки: comment="текст"\n'
    + '7. Ніколи одинарні лапки в параметрах RouterOS\n\n'

    + 'FIREWALL — ОБОВЯЗКОВІ ПРАВИЛА:\n'
    + 'Для ІСНУЮЧИХ правил: ТІЛЬКИ set .id або remove .id або move .id\n'
    + 'ЗАБОРОНЕНО add — якщо правило вже існує!\n'
    + 'ЗАБОРОНЕНО place-before= — параметр НЕ існує в RouterOS!\n'
    + 'ЗАБОРОНЕНО position= — параметр НЕ існує в RouterOS!\n'
    + 'ЗАБОРОНЕНО state= — правильно connection-state=\n'
    + 'Для переміщення: /ip firewall filter move *ID destination=N\n\n'

    + 'ПРАВИЛЬНІ ПАРАМЕТРИ:\n'
    + 'connection-state=invalid (НЕ state=invalid)\n'
    + 'connection-state=established,related (НЕ state=established)\n'
    + 'in-interface-list=WAN або in-interface-list=LAN\n'
    + 'ЗАБОРОНЕНО in-list= — повна назва ТІЛЬКИ in-interface-list=!\n'
    + 'comment="текст" (НЕ comment=текст, НЕ comment=\'текст\')\n\n'

    + 'ПРАВИЛЬНІ ПРИКЛАДИ:\n'
    + '/ping address=8.8.8.8 count=4\n'
    + '/ip firewall filter set *3 in-interface-list=WAN\n'
    + '/ip firewall filter move *5 destination=2\n'
    + '/ip firewall filter remove *8\n'
    + '/ip firewall filter add chain=input action=accept in-interface-list=LAN comment="allow LAN"\n\n'

    + 'ЗАБОРОНЕНІ КОНСТРУКЦІЇ:\n'
    + '/tool traffic-monitor start — не існує\n'
    + 'place-before=N — не існує\n'
    + 'position=N — не існує\n'
    + 'state=invalid — неправильна назва (треба connection-state=invalid)\n'
    + 'in-list=WAN — не існує (треба in-interface-list=WAN)\n'
    + 'out-list=LAN — не існує (треба out-interface-list=LAN)\n'
    + "comment='текст' — одинарні лапки не працюють"
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
      Date.now() - AIAgent.memory.cacheTime < 30000) {
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
    "/ip/firewall/mangle",
    "/ip/route",
    "/ip/service",
    "/ip/dhcp-server/lease",
    "/ip/dns",
    "/user",
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
    fw.slice(0, 20).forEach(function(r, i) {
      var parts = [];
      parts.push('.id=' + (r['.id'] || '?'));
      parts.push('chain=' + (r.chain || '?'));
      parts.push('action=' + (r.action || '?'));
      if (r.protocol)             parts.push('proto=' + r.protocol);
      if (r['dst-port'])          parts.push('dport=' + r['dst-port']);
      if (r['in-interface'])      parts.push('in=' + r['in-interface']);
      if (r['in-interface-list']) parts.push('in-list=' + r['in-interface-list']);
      if (r['connection-state'])  parts.push('state=' + r['connection-state']);
      if (r['src-address-list'])  parts.push('src-list=' + r['src-address-list']);
      if (r['src-address'])       parts.push('src=' + r['src-address']);
      if (r.disabled === 'true')  parts.push('[OFF]');
      if (r.comment)             parts.push('comment="' + r.comment + '"');
      lines.push(parts.join(' '));
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
      var p = [".id=" + (r[".id"]||"?")];
      p.push("chain=" + (r.chain||"?"));
      p.push("action=" + (r.action||"?"));
      if (r.protocol)          p.push("proto=" + r.protocol);
      if (r["dst-port"])       p.push("dport=" + r["dst-port"]);
      if (r["to-addresses"])   p.push("to=" + r["to-addresses"]);
      if (r["to-ports"])       p.push("to-port=" + r["to-ports"]);
      if (r["in-interface"])   p.push("in=" + r["in-interface"]);
      if (r["out-interface"])  p.push("out=" + r["out-interface"]);
      if (r["in-interface-list"])  p.push("in-list=" + r["in-interface-list"]);
      if (r["out-interface-list"]) p.push("out-list=" + r["out-interface-list"]);
      if (r.disabled === "true") p.push("[OFF]");
      if (r.comment) p.push("comment=\"" + r.comment + "\"");
      lines.push(p.join(" "));
    });

    /* Mangle */
    var mangle = ctx["/ip/firewall/mangle"] || [];
    if (mangle.length) {
      lines.push("\n=== MANGLE (" + mangle.length + ") ===");
      mangle.slice(0, 10).forEach(function(r) {
        lines.push(".id=" + (r[".id"]||"?") + " chain=" + (r.chain||"?") +
          " action=" + (r.action||"?") +
          (r.comment ? " comment=\"" + r.comment + "\"" : ""));
      });
    }

    /* Routes */
    var routes = ctx["/ip/route"] || [];
    var activeRoutes = routes.filter(function(r) { return r.active === "true"; });
    lines.push("\n=== ROUTES (active: " + activeRoutes.length + "/" + routes.length + ") ===");
    activeRoutes.slice(0, 10).forEach(function(r) {
      lines.push(".id=" + (r[".id"]||"?") +
        " dst=" + (r["dst-address"]||"?") +
        " gateway=" + (r.gateway||"?") +
        " distance=" + (r.distance||"?"));
    });

    /* DNS */
    var dns = (ctx["/ip/dns"] || [])[0] || {};
    if (dns.servers) {
      lines.push("\n=== DNS ===");
      lines.push("servers=" + dns.servers +
        " cache-size=" + (dns["cache-size"]||"?"));
    }

    /* Users */
    var users = ctx["/user"] || [];
    lines.push("\n=== USERS (" + users.length + ") ===");
    users.forEach(function(u) {
      lines.push("name=" + (u.name||"?") + " group=" + (u.group||"?"));
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

      /* Додаємо інфо про версію роутера */
      if (window.ROSAdapter && ROSAdapter._version) {
        var adapterCtx = ROSAdapter.getAIContext();
        if (adapterCtx) {
          systemContent += '\n\n' + adapterCtx;
        }
      }

      /* Додаємо KB перед кожною відповіддю */
      if (window.MikroTikKB) {
        var kbContext = MikroTikKB.getContext(userMessage, 3000);
        if (kbContext) {
          systemContent += '\n\n[KNOWLEDGE BASE]\n' + kbContext;
        }
        /* Якщо KB ще не завантажено — завантажуємо */
        if (!MikroTikKB._loaded) {
          MikroTikKB.load();
        }
      }

      /* Додаємо стан роутера */
      if (includeContext && context) {
        systemContent += '\n\n[ROUTER STATE]\n' + context;
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
