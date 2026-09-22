# -*- coding: utf-8 -*-
import subprocess

with open('ai-agent/terminal-log.js', 'r', encoding='utf-8') as f:
    tl = f.read()

# Замінюємо showMultiRouter — беремо тільки з Router Manager
old_get_routers = (
    "    /* Отримуємо всі роутери */\n"
    "    var routers = [];\n"
    "    try {\n"
    "      var rs  = JSON.parse(localStorage.getItem('rm-routers') || '[]');\n"
    "      var aid = localStorage.getItem('rm-active-router');\n"
    "      routers = rs;\n"
    "    } catch(e) {}"
)

new_get_routers = (
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
    "          return r.ip && r.user && r.pass !== undefined &&\n"
    "                 r.id && r.id.startsWith('r_');\n" 
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

if old_get_routers in tl:
    tl = tl.replace(old_get_routers, new_get_routers)
    print('OK: фільтр роутерів ✅')
else:
    print('WARN: не знайдено — шукаємо')
    idx = tl.find('showMultiRouter: function')
    print(repr(tl[idx:idx+400]))

with open('ai-agent/terminal-log.js', 'w', encoding='utf-8') as f:
    f.write(tl)

r = subprocess.run(['node','--check','ai-agent/terminal-log.js'],
                   capture_output=True, text=True)
print('terminal-log:', 'OK ✅' if r.returncode==0 else '❌\n'+r.stderr[:200])

# Перевіряємо що є в rm-routers
print('\nПеревірка — виконай в консолі браузера:')
print("""
var rs = JSON.parse(localStorage.getItem('rm-routers')||'[]');
console.log('Всього в rm-routers:', rs.length);
rs.forEach(function(r,i){
  console.log(i, r.id, r.ip, r.user, 'pass:', r.pass?'***':'empty');
});
""")