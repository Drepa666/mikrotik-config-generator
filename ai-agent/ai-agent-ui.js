/* ══════════════════════════════════════════════════════
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
        '<button onclick="window.AIKeystore.showModal()" title="API Ключ"',
          ' style="background:#1a1a0a;border:1px solid #3a3a1a;color:#f0a840;',
          'border-radius:6px;padding:4px 8px;cursor:pointer;font-size:12px;">🔑</button>',
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
