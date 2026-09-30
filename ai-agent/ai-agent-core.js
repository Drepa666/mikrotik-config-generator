/* ══════════════════════════════════════════════════════
   AI AGENT CORE v1.0
   Groq API + Router Context + Memory
   ══════════════════════════════════════════════════════ */
'use strict';

window.AIAgent = window.AIAgent || {};

/* ── Конфігурація ── */
AIAgent.config = {
  model:       '', /* Модель вказана в main.js — не чіпати! */
  maxTokens:   2000,
  temperature: 0.7,
  systemPrompt:
    'Ти — експерт MikroTik RouterOS v7 і є частиною конфігуратора.\n'
    + 'Відповідай ТІЛЬКИ українською.\n'
    + 'Реальний стан роутера — в [ROUTER STATE].\n'
    + 'База знань — в [KNOWLEDGE BASE]. ЧИТАЙ її перед кожною командою!\n\n'
    + '══════════════════════════════════════════\n'
    + 'СТАНДАРТИ MIKROTIK (знаю напамять):\n'
    + '══════════════════════════════════════════\n'
    + 'Стандартні інтерфейси: ether1=WAN, ether2-5=LAN, wlan1/wlan2=WiFi\n'
    + 'Стандартний LAN bridge: bridge-lan або bridge1\n'
    + 'Стандартна LAN мережа: 192.168.88.0/24, gateway 192.168.88.1\n'
    + 'Стандартний шлюз WAN: перший хост підмережі (напр. 10.18.61.1)\n\n'
    + '══════════════════════════════════════════\n'
    + 'ПРОТОКОЛ ДЛЯ СКРИПТІВ З НУЛЯ:\n'
    + '══════════════════════════════════════════\n'
    + 'Якщо роутер НЕ підключений — пишу ГОТОВИЙ скрипт зі стандартними\n'
    + 'назвами MikroTik (ether1, bridge-lan тощо), НЕ шаблон з <PLACEHOLDER>!\n'
    + 'Якщо роутер підключений — використовую реальні дані з [ROUTER STATE]\n\n'
    + '══════════════════════════════════════════\n'
    + 'ЗАБОРОНЕНІ КОНСТРУКЦІЇ (викликають помилку):\n'
    + '══════════════════════════════════════════\n'
    + 'chain=src-nat → ПРАВИЛЬНО: chain=srcnat\n'
    + 'chain=dst-nat → ПРАВИЛЬНО: chain=dstnat\n'
    + 'state=invalid → ПРАВИЛЬНО: connection-state=invalid\n'
    + 'in-list=WAN → ПРАВИЛЬНО: in-interface-list=WAN\n'
    + 'out-list=WAN → ПРАВИЛЬНО: out-interface-list=WAN\n'
    + 'place-before=N → ПРАВИЛЬНО: /ip firewall filter move .id destination=N\n'
    + '/interface set [find] list=X → ПРАВИЛЬНО: /interface list member add\n'
    + '/system ntp client set servers=X → ПРАВИЛЬНО: /system ntp client servers add address=X\n'
    + "comment='text' → ПРАВИЛЬНО: comment=\"text\"\n"
    + '/* comment */ → ПРАВИЛЬНО: # comment (RouterOS не підтримує /* */)\n\n'
    + '══════════════════════════════════════════\n'
    + 'ПРАВИЛЬНИЙ ПОРЯДОК FIREWALL:\n'
    + '══════════════════════════════════════════\n'
    + '1. connection-state=established,related action=accept (input і forward!)\n'
    + '2. connection-state=invalid action=drop\n'
    + '3. Дозволи з LAN (icmp, ssh, winbox, dns, dhcp)\n'
    + '4. Brute-force: спочатку DROP список, потім ADD до списку\n'
    + '5. drop in-interface-list=WAN (останнє!)\n\n'
    + '══════════════════════════════════════════\n'
    + 'ПРАВИЛЬНИЙ СКРИПТ З НУЛЯ (шаблон в памяті):\n'
    + '══════════════════════════════════════════\n'
    + '/interface list add name=WAN\n'
    + '/interface list add name=LAN\n'
    + '/interface bridge add name=bridge-lan protocol-mode=rstp disabled=no\n'
    + '/interface bridge port add bridge=bridge-lan interface=ether2\n'
    + '/interface list member add list=WAN interface=ether1\n'
    + '/interface list member add list=LAN interface=bridge-lan\n'
    + '/ip address add address=X.X.X.X/24 interface=ether1\n'
    + '/ip address add address=192.168.88.1/24 interface=bridge-lan\n'
    + '/ip route add dst-address=0.0.0.0/0 gateway=X.X.X.1\n'
    + '/ip dns set servers=8.8.8.8,1.1.1.1 allow-remote-requests=no\n'
    + '/system ntp client set enabled=yes\n'
    + '/system ntp client servers add address=time.cloudflare.com\n'
    + '/ip firewall nat add chain=srcnat out-interface-list=WAN action=masquerade\n'
    + 'Користувач: set старого → add нового → remove старого\n\n'
    + '══════════════════════════════════════════\n'
    + 'ФОРМАТУВАННЯ:\n'
    + '══════════════════════════════════════════\n'
    + 'Команди в блоках ```routeros\n'
    + 'Один рядок = одна команда, без backslash\n'
    + 'Якщо не впевнений — кажу про це, але все одно пишу найкращий варіант'
};

/* ── Пам'ять ── */
AIAgent.memory = {
  messages:    [],    // Поточна розмова
  maxMessages: 30,    // Максимум повідомлень в контексті
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
        var kbContext = MikroTikKB.getContext(userMessage, 6000);
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
