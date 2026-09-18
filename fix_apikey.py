# -*- coding: utf-8 -*-
import subprocess

# ── 1. Фікс моделі в core (llama-3.3 не існує) ──
with open('ai-agent/ai-agent-core.js', 'r', encoding='utf-8') as f:
    core = f.read()

core = core.replace(
    "model:       'llama-3.3-70b-versatile'",
    "model:       'llama3-70b-8192'"
)
print('OK: модель → llama3-70b-8192 ✅')

with open('ai-agent/ai-agent-core.js', 'w', encoding='utf-8') as f:
    f.write(core)

# ── 2. Keystore — при розблокуванні підставляє в DOM ──
# electron-bridge.js читає ai-key і ai-prov з DOM
# Тому просто заповнюємо ці поля при збереженні/розблокуванні

with open('ai-agent/ai-agent-keystore.js', 'r', encoding='utf-8') as f:
    ks = f.read()

# Додаємо helper функцію що заповнює DOM
old_storage = "  STORAGE_KEY: 'ai-agent-apikey-v2',"
new_storage = """  STORAGE_KEY: 'ai-agent-apikey-v2',

  /* Підставляємо ключ в DOM елементи які читає electron-bridge.js */
  _fillDOM: function(apiKey) {
    var keyEl  = document.getElementById('ai-key');
    var provEl = document.getElementById('ai-prov');
    if (keyEl)  keyEl.value  = apiKey;
    if (provEl) {
      /* Ставимо Groq */
      for (var i = 0; i < provEl.options.length; i++) {
        if (provEl.options[i].value === 'groq' ||
            provEl.options[i].text.toLowerCase().includes('groq')) {
          provEl.selectedIndex = i;
          break;
        }
      }
    }
    console.log('[Keystore] DOM заповнено ✅');
  },"""

if old_storage in ks:
    ks = ks.replace(old_storage, new_storage)
    print('OK: _fillDOM додано ✅')

# При saveKey — заповнюємо DOM
old_save_key = """    AIKeystore._sessionKey = apiKey; /* Кешуємо в сесії */
    console.log('[Keystore] API key saved ✅');"""
new_save_key = """    AIKeystore._sessionKey = apiKey; /* Кешуємо в сесії */
    AIKeystore._fillDOM(apiKey);
    console.log('[Keystore] API key saved ✅');"""

if old_save_key in ks:
    ks = ks.replace(old_save_key, new_save_key)
    print('OK: saveKey → fillDOM ✅')

# При getKey — заповнюємо DOM
old_get_key = """    if (key) AIKeystore._sessionKey = key;
    return key;"""
new_get_key = """    if (key) {
      AIKeystore._sessionKey = key;
      AIKeystore._fillDOM(key);
    }
    return key;"""

if old_get_key in ks:
    ks = ks.replace(old_get_key, new_get_key)
    print('OK: getKey → fillDOM ✅')

# При старті — якщо є ключ в сесії одразу заповнюємо
old_init = "  AIKeystore.initSession();"
new_init = """  AIKeystore.initSession();
  /* Якщо є ключ в сесії після reload — заповнюємо DOM */
  document.addEventListener('DOMContentLoaded', function() {
    if (AIKeystore._sessionKey) {
      setTimeout(function(){ AIKeystore._fillDOM(AIKeystore._sessionKey); }, 500);
    }
  });"""

if old_init in ks:
    ks = ks.replace(old_init, new_init)
    print('OK: DOMContentLoaded fillDOM ✅')

with open('ai-agent/ai-agent-keystore.js', 'w', encoding='utf-8') as f:
    f.write(ks)

# ── Перевірка ──
for fn in ['ai-agent/ai-agent-core.js', 'ai-agent/ai-agent-keystore.js']:
    r = subprocess.run(['node', '--check', fn], capture_output=True, text=True)
    print(f'{fn}: {"OK ✅" if r.returncode==0 else "❌ "+r.stderr[:150]}')