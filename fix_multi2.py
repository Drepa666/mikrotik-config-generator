# -*- coding: utf-8 -*-
import subprocess

with open('ai-agent/terminal-log.js', 'r', encoding='utf-8') as f:
    tl = f.read()

# ── Замінюємо отримання роутерів — читаємо з RouterManager напряму ──
old_get = (
    "    /* Отримуємо тільки роутери з Router Manager */\n"
    "    var routers = [];\n"
    "    try {\n"
    "      /* 1. З window.RouterManager (живий стан) */\n"
    "      if (window.RouterManager && RouterManager.getAll) {\n"
    "        routers = RouterManager.getAll();\n"
    "      } else if (window.state && window.state.routers) {\n"
    "        routers = window.state.routers;\n"
    "      } else {\n"
    "        /* 2. Fallback — з localStorage */\n"
    "        var rs = JSON.parse(localStorage.getItem('rm-routers') || '[]');\n"
    "        /* Фільтруємо — тільки справжні роутери (мають user+pass+sshPort) */\n"
    "        routers = rs.filter(function(r) {\n"
    "          /* Роутер має: ip, user, pass, і або sshPort або port */\n"
    "          return r.ip && r.user &&\n"
    "                 r.pass !== undefined && r.pass !== null &&\n"
    "                 (r.sshPort || r.port || r.id);\n"
    "        });\n"
    "        /* Прибираємо дублікати по IP */\n"
    "        var seen = {};\n"
    "        routers = routers.filter(function(r) {\n"
    "          if (seen[r.ip]) return false;\n"
    "          seen[r.ip] = true;\n"
    "          return true;\n"
    "        });\n"
    "      }\n"
    "    } catch(e) { console.error('[MultiRouter]', e); }"
)

new_get = (
    "    /* Отримуємо роутери з Router Manager */\n"
    "    var routers = [];\n"
    "    try {\n"
    "      /* 1. Пряме звернення до внутрішнього state */\n"
    "      var _found = false;\n"
    "      /* Шукаємо state в усіх можливих місцях */\n"
    "      var _candidates = [\n"
    "        window.RouterManager && RouterManager.routers,\n"
    "        window.RouterManager && RouterManager._routers,\n"
    "        window.RouterManager && RouterManager.getAll && RouterManager.getAll(),\n"
    "        window.rmState && window.rmState.routers,\n"
    "        window._rmState && window._rmState.routers,\n"
    "      ];\n"
    "      for (var _i = 0; _i < _candidates.length; _i++) {\n"
    "        if (Array.isArray(_candidates[_i]) && _candidates[_i].length > 0) {\n"
    "          routers = _candidates[_i];\n"
    "          _found  = true;\n"
    "          console.log('[MultiRouter] з RouterManager:', routers.length);\n"
    "          break;\n"
    "        }\n"
    "      }\n"
    "      /* 2. Активний роутер як мінімум */\n"
    "      if (!_found && window.getActiveRouter) {\n"
    "        var _ar = window.getActiveRouter();\n"
    "        if (_ar) {\n"
    "          routers = [_ar];\n"
    "          _found  = true;\n"
    "          console.log('[MultiRouter] тільки активний:', _ar.ip);\n"
    "          /* Синхронізуємо в localStorage */\n"
    "          try {\n"
    "            var _rs = JSON.parse(localStorage.getItem('rm-routers')||'[]');\n"
    "            if (_rs.length === 0) {\n"
    "              localStorage.setItem('rm-routers', JSON.stringify([_ar]));\n"
    "              console.log('[MultiRouter] відновлено rm-routers ✅');\n"
    "            }\n"
    "          } catch(e) {}\n"
    "        }\n"
    "      }\n"
    "      /* 3. Fallback localStorage */\n"
    "      if (!_found) {\n"
    "        var _rs2 = JSON.parse(localStorage.getItem('rm-routers') || '[]');\n"
    "        routers = _rs2.filter(function(r) {\n"
    "          return r && r.ip && r.user;\n"
    "        });\n"
    "        /* Дедуп по IP */\n"
    "        var _seen = {};\n"
    "        routers = routers.filter(function(r) {\n"
    "          if (_seen[r.ip]) return false;\n"
    "          _seen[r.ip] = true;\n"
    "          return true;\n"
    "        });\n"
    "      }\n"
    "    } catch(e) { console.error('[MultiRouter]', e); }"
)

if old_get in tl:
    tl = tl.replace(old_get, new_get)
    print('OK: отримання роутерів виправлено ✅')
else:
    print('WARN: не знайдено — шукаємо')
    idx = tl.find('showMultiRouter: function')
    depth = 0; found = False; end = idx
    for i, ch in enumerate(tl[idx:], idx):
        if ch == '{': depth += 1; found = True
        elif ch == '}': depth -= 1
        if found and depth == 0: end = i + 1; break
    print(repr(tl[idx:idx+600]))

with open('ai-agent/terminal-log.js', 'w', encoding='utf-8') as f:
    f.write(tl)

r = subprocess.run(['node','--check','ai-agent/terminal-log.js'],
                   capture_output=True, text=True)
print('terminal-log:', 'OK ✅' if r.returncode==0 else '❌\n'+r.stderr[:200])

# ── Також дивимось де RouterManager зберігає роутери ──
with open('router-manager.js', 'r', encoding='utf-8') as f:
    rm = f.read()

for kw in ['state.routers', 'window.rmState', 'window._rm',
           'getAll:', 'getAll =', '.routers =']:
    idx = rm.find(kw)
    if idx > 0:
        print(f'\n"{kw}" @ {idx}:')
        print(repr(rm[idx:idx+150]))

print('\nВсе готово! npm start')
print('\nВиконай в консолі для відновлення:')
print("""
var r = window.getActiveRouter();
if(r) {
  localStorage.setItem('rm-routers', JSON.stringify([r]));
  console.log('✅', r.ip, r.user, r.pass?'***':'no pass');
} else {
  console.log('Всі ключі window:', Object.keys(window).filter(k=>k.includes('outer')||k.includes('tate')));
}
""")