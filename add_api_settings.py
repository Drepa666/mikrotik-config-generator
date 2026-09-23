# -*- coding: utf-8 -*-
import subprocess, tempfile, os

with open('rm-ai-copilot.js', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('\r\n', '\n')

# Додаємо таб Settings і форму ключа
OLD_TABS = (
    "      '<div id=\"ai-cop-tabs\">' +\n"
    "        '<div class=\"ai-cop-tab active\" data-tab=\"analyze\">🔍 Аналіз</div>' +\n"
    "        '<div class=\"ai-cop-tab\" data-tab=\"chat\">💬 Chat</div>' +\n"
    "        '<div class=\"ai-cop-tab\" data-tab=\"quick\">⚡ Швидко</div>' +\n"
    "      '</div>' +"
)
NEW_TABS = (
    "      '<div id=\"ai-cop-tabs\">' +\n"
    "        '<div class=\"ai-cop-tab active\" data-tab=\"analyze\">🔍 Аналіз</div>' +\n"
    "        '<div class=\"ai-cop-tab\" data-tab=\"chat\">💬 Chat</div>' +\n"
    "        '<div class=\"ai-cop-tab\" data-tab=\"quick\">⚡ Швидко</div>' +\n"
    "        '<div class=\"ai-cop-tab\" data-tab=\"settings\">⚙️ Ключ</div>' +\n"
    "      '</div>' +"
)

print(f'OLD_TABS: {"FOUND" if OLD_TABS in content else "NOT FOUND"}')
if OLD_TABS in content:
    content = content.replace(OLD_TABS, NEW_TABS, 1)
    print('OK: таб Settings додано')

# Додаємо renderSettingsTab після renderQuickTab
OLD_RENDER = "  /* ── Локальний аналіз ── */"
NEW_RENDER = (
    "  /* ── Settings tab ── */\n"
    "  function renderSettingsTab(body) {\n"
    "    var cfg = getAIConfig();\n"
    "    body.innerHTML =\n"
    "      '<div style=\"display:flex;flex-direction:column;gap:12px;\">' +\n"
    "\n"
    "      '<div class=\"ai-issue info\">' +\n"
    "        '<div class=\"ai-issue-title\">⚙️ AI Налаштування</div>' +\n"
    "        '<div class=\"ai-issue-desc\">Введи API ключ для використання AI аналізу.</div>' +\n"
    "      '</div>' +\n"
    "\n"
    "      /* Provider */\n"
    "      '<div>' +\n"
    "        '<div style=\"font-size:11px;color:#4a6070;margin-bottom:6px;\">Провайдер</div>' +\n"
    "        '<select id=\"ai-prov-sel\" style=\"width:100%;background:#0d1821;border:1px solid #2a3b48;' +\n"
    "          'color:#c9d8e4;border-radius:8px;padding:8px 12px;font-size:12px;outline:none;\">' +\n"
    "          '<option value=\"gemini\"'  + (cfg.provider==='gemini'  ?' selected':'') + '>🤖 Google Gemini (безкоштовний)</option>' +\n"
    "          '<option value=\"openai\"'  + (cfg.provider==='openai'  ?' selected':'') + '>🟢 OpenAI GPT-4</option>' +\n"
    "          '<option value=\"groq\"'    + (cfg.provider==='groq'    ?' selected':'') + '>⚡ Groq (швидкий)</option>' +\n"
    "          '<option value=\"anthropic\"'+(cfg.provider==='anthropic'?' selected':'') + '>🔵 Anthropic Claude</option>' +\n"
    "          '<option value=\"deepseek\"'+(cfg.provider==='deepseek' ?' selected':'') + '>🌊 DeepSeek</option>' +\n"
    "        '</select>' +\n"
    "      '</div>' +\n"
    "\n"
    "      /* API Key */\n"
    "      '<div>' +\n"
    "        '<div style=\"font-size:11px;color:#4a6070;margin-bottom:6px;\">API Ключ</div>' +\n"
    "        '<input id=\"ai-key-inp\" type=\"password\" placeholder=\"Встав API ключ тут...\"' +\n"
    "          'value=\"' + cfg.apiKey + '\"' +\n"
    "          'style=\"width:100%;background:#0d1821;border:1px solid #2a3b48;' +\n"
    "          'color:#c9d8e4;border-radius:8px;padding:8px 12px;' +\n"
    "          'font-size:12px;outline:none;box-sizing:border-box;\">' +\n"
    "        '<div style=\"font-size:10px;color:#4a6070;margin-top:4px;\" id=\"ai-key-hint\"></div>' +\n"
    "      '</div>' +\n"
    "\n"
    "      /* Model */\n"
    "      '<div>' +\n"
    "        '<div style=\"font-size:11px;color:#4a6070;margin-bottom:6px;\">Модель (необов\\'язково)</div>' +\n"
    "        '<input id=\"ai-model-inp\" type=\"text\" placeholder=\"залиш порожнім для default\"' +\n"
    "          'value=\"' + (cfg.model||'') + '\"' +\n"
    "          'style=\"width:100%;background:#0d1821;border:1px solid #2a3b48;' +\n"
    "          'color:#c9d8e4;border-radius:8px;padding:8px 12px;' +\n"
    "          'font-size:12px;outline:none;box-sizing:border-box;\">' +\n"
    "      '</div>' +\n"
    "\n"
    "      /* Save btn */\n"
    "      '<button id=\"ai-save-key\" style=\"' +\n"
    "        'background:linear-gradient(135deg,#1a3a2a,#0d2a1a);' +\n"
    "        'border:1px solid #3a7a4a;color:#5fd0a5;' +\n"
    "        'border-radius:8px;padding:10px;width:100%;' +\n"
    "        'cursor:pointer;font-size:13px;font-weight:700;\">💾 Зберегти</button>' +\n"
    "\n"
    "      /* Links */\n"
    "      '<div style=\"font-size:10px;color:#4a6070;line-height:1.8;\">' +\n"
    "        '🔗 Отримати безкоштовний ключ:<br>' +\n"
    "        '<a href=\"#\" id=\"ai-link-gemini\" style=\"color:#5b9bd5;\">Google AI Studio (Gemini)</a><br>' +\n"
    "        '<a href=\"#\" id=\"ai-link-groq\"   style=\"color:#5b9bd5;\">Groq Console (безкоштовно)</a>' +\n"
    "      '</div>' +\n"
    "\n"
    "      /* Status */\n"
    "      '<div id=\"ai-save-status\" style=\"font-size:12px;min-height:18px;\"></div>' +\n"
    "      '</div>';\n"
    "\n"
    "    /* Підказки провайдерів */\n"
    "    var hints = {\n"
    "      gemini:    'aistudio.google.com → Get API key → безкоштовно',\n"
    "      openai:    'platform.openai.com → API keys → платно',\n"
    "      groq:      'console.groq.com → API Keys → безкоштовно',\n"
    "      anthropic: 'console.anthropic.com → API Keys → платно',\n"
    "      deepseek:  'platform.deepseek.com → API keys → дешево',\n"
    "    };\n"
    "\n"
    "    var provSel = document.getElementById('ai-prov-sel');\n"
    "    var keyHint = document.getElementById('ai-key-hint');\n"
    "    if (provSel && keyHint) {\n"
    "      keyHint.textContent = hints[provSel.value] || '';\n"
    "      provSel.onchange = function() {\n"
    "        keyHint.textContent = hints[provSel.value] || '';\n"
    "      };\n"
    "    }\n"
    "\n"
    "    /* Посилання */\n"
    "    var lnkG = document.getElementById('ai-link-gemini');\n"
    "    var lnkR = document.getElementById('ai-link-groq');\n"
    "    if (lnkG) lnkG.onclick = function(e) {\n"
    "      e.preventDefault();\n"
    "      if (window.electronAPI && window.electronAPI.openExternal) {\n"
    "        window.electronAPI.openExternal('https://aistudio.google.com/app/apikey');\n"
    "      } else { window.open('https://aistudio.google.com/app/apikey'); }\n"
    "    };\n"
    "    if (lnkR) lnkR.onclick = function(e) {\n"
    "      e.preventDefault();\n"
    "      if (window.electronAPI && window.electronAPI.openExternal) {\n"
    "        window.electronAPI.openExternal('https://console.groq.com/keys');\n"
    "      } else { window.open('https://console.groq.com/keys'); }\n"
    "    };\n"
    "\n"
    "    /* Зберегти */\n"
    "    var saveBtn = document.getElementById('ai-save-key');\n"
    "    var status  = document.getElementById('ai-save-status');\n"
    "    if (saveBtn) saveBtn.onclick = function() {\n"
    "      var prov  = provSel ? provSel.value : 'gemini';\n"
    "      var key   = (document.getElementById('ai-key-inp')   || {}).value || '';\n"
    "      var model = (document.getElementById('ai-model-inp') || {}).value || '';\n"
    "      if (!key.trim()) {\n"
    "        status.style.color = '#e08080';\n"
    "        status.textContent = '⚠️ Введи API ключ!';\n"
    "        return;\n"
    "      }\n"
    "      localStorage.setItem('ai-provider', prov);\n"
    "      localStorage.setItem('ai-api-key',  key.trim());\n"
    "      localStorage.setItem('ai-model',    model.trim());\n"
    "      status.style.color = '#5fd0a5';\n"
    "      status.textContent = '✅ Збережено! Провайдер: ' + prov;\n"
    "      setTimeout(function() { status.textContent = ''; }, 3000);\n"
    "    };\n"
    "  }\n"
    "\n"
    "  /* ── Локальний аналіз ── */"
)

print(f'OLD_RENDER: {"FOUND" if OLD_RENDER in content else "NOT FOUND"}')
if OLD_RENDER in content:
    content = content.replace(OLD_RENDER, NEW_RENDER, 1)
    print('OK: renderSettingsTab додано')

# Додаємо виклик в renderTab
OLD_RT = (
    "    } else if (_activeTab === 'quick') {\n"
    "      renderQuickTab(body);\n"
    "    }"
)
NEW_RT = (
    "    } else if (_activeTab === 'quick') {\n"
    "      renderQuickTab(body);\n"
    "    } else if (_activeTab === 'settings') {\n"
    "      renderSettingsTab(body);\n"
    "    }"
)
print(f'OLD_RT: {"FOUND" if OLD_RT in content else "NOT FOUND"}')
if OLD_RT in content:
    content = content.replace(OLD_RT, NEW_RT, 1)
    print('OK: renderTab оновлено')

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

with open('rm-ai-copilot.js', 'w', encoding='utf-8') as f:
    f.write(content)
size = os.path.getsize('rm-ai-copilot.js')
r2 = subprocess.run(['node','--check','rm-ai-copilot.js'], capture_output=True, text=True)
print(f'rm-ai-copilot.js: {"OK ✅" if r2.returncode==0 else "FAIL"} ({size:,}b)')
if r2.returncode != 0:
    print(r2.stderr[:200])
    exit(1)

subprocess.run(['git','add','rm-ai-copilot.js'], capture_output=True)
subprocess.run(['git','commit','-m','feat: AI Copilot settings tab - API key, provider, model'], capture_output=True)
rp = subprocess.run(['git','push','origin','main'], capture_output=True, text=True)
print('push:', rp.stdout.strip() or rp.stderr.strip()[-60:])
print('\nDone! npm start')