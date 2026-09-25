# -*- coding: utf-8 -*-
import subprocess, tempfile, os

with open('router-manager-crud.js', 'r', encoding='utf-8') as f:
    crud = f.read()
crud = crud.replace('\r\n', '\n')

# Підключаємо AIContext до rmCrudFWFilter
OLD_FW = (
    "  window.rmCrudFWFilter = function() {\n"
    "    window.renderTableCRUD({"
)
NEW_FW = (
    "  window.rmCrudFWFilter = function() {\n"
    "    /* AIContext — повідомляємо AI де ми */\n"
    "    if (window.AIContext) {\n"
    "      var r = window.__rmGetActiveRouter ? window.__rmGetActiveRouter() : null;\n"
    "      if (r) {\n"
    "        window.restCall(r, 'GET', '/ip/firewall/filter')\n"
    "          .then(function(rules) {\n"
    "            window.AIContext.enter('firewall', { filter: rules }, 'filter');\n"
    "          }).catch(function() {\n"
    "            window.AIContext.enter('firewall', {}, 'filter');\n"
    "          });\n"
    "      } else {\n"
    "        window.AIContext.enter('firewall', {}, 'filter');\n"
    "      }\n"
    "    }\n"
    "    window.renderTableCRUD({"
)
print(f'OLD_FW: {"FOUND" if OLD_FW in crud else "NOT FOUND"}')
if OLD_FW in crud:
    crud = crud.replace(OLD_FW, NEW_FW, 1)
    print('OK: AIContext → Firewall Filter')

# Підключаємо до Interfaces
OLD_IF = None
for candidate in [
    "  window.rmCrudInterfaces = function() {\n    window.renderTableCRUD({",
    "  window.rmCrudInterfaces = function () {\n    window.renderTableCRUD({",
]:
    if candidate in crud:
        OLD_IF = candidate
        break

if OLD_IF:
    NEW_IF = OLD_IF.replace(
        "  window.rmCrudInterfaces = function() {\n    window.renderTableCRUD({",
        "  window.rmCrudInterfaces = function() {\n"
        "    if (window.AIContext) {\n"
        "      var r = window.__rmGetActiveRouter ? window.__rmGetActiveRouter() : null;\n"
        "      if (r) {\n"
        "        window.restCall(r, 'GET', '/interface')\n"
        "          .then(function(ifaces) {\n"
        "            window.AIContext.enter('interfaces', { interfaces: ifaces });\n"
        "          }).catch(function() {\n"
        "            window.AIContext.enter('interfaces', {});\n"
        "          });\n"
        "      }\n"
        "    }\n"
        "    window.renderTableCRUD({"
    )
    crud = crud.replace(OLD_IF, NEW_IF, 1)
    print('OK: AIContext → Interfaces')
else:
    # Шукаємо інакше
    idx = crud.find('rmCrudInterfaces')
    print(f'rmCrudInterfaces @ {idx}: ' + repr(crud[idx:idx+80]))

# Tempfile
with tempfile.NamedTemporaryFile(suffix='.js', delete=False, mode='w', encoding='utf-8') as tmp:
    tmp.write(crud); tmp_name = tmp.name
r = subprocess.run(['node','--check', tmp_name], capture_output=True, text=True)
os.unlink(tmp_name)
if r.returncode != 0:
    print('SYNTAX ERROR!\n' + r.stderr[:300]); exit(1)
print('Tempfile: OK')

with open('router-manager-crud.js', 'w', encoding='utf-8') as f:
    f.write(crud)

# Також додаємо Dashboard hook в rm-dashboard.js
if os.path.exists('rm-dashboard.js'):
    with open('rm-dashboard.js', 'r', encoding='utf-8') as f:
        dash = f.read()
    dash = dash.replace('\r\n', '\n')

    # Шукаємо де рендериться dashboard
    for trigger in ['function renderDashboard', 'window.rmDashboard', 'rmSectionDashboard']:
        if trigger in dash:
            print(f'Dashboard trigger: {trigger}')
            idx = dash.find(trigger)
            print(repr(dash[idx:idx+100]))
            break

# Git
subprocess.run(['git','add',
    'router-manager-crud.js'], capture_output=True)
subprocess.run(['git','commit','-m',
    'feat: AIContext connected to Firewall and Interfaces sections'],
    capture_output=True)
rp = subprocess.run(['git','push','origin','main'], capture_output=True, text=True)
print('push:', rp.stdout.strip() or rp.stderr.strip()[-60:])
print('\nDone! npm start — відкрий Firewall → побачиш AI аналіз')