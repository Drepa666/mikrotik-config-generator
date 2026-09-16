# -*- coding: utf-8 -*-
import subprocess

with open('router-manager.js', 'r', encoding='utf-8') as f:
    content = f.read()

old = """        router.connected = true;
        router.name      = data.name;
        router.info      = {};
        renderTabs();
        loadDashboard(id);"""

new = """        router.connected = true;
        router.name      = data.name;
        router.info      = {};
        renderTabs();
        loadDashboard(id);
        /* Підтягуємо MAC роутера */
        restCall(router, 'GET', '/interface').then(function(ifaces) {
          if (!Array.isArray(ifaces)) return;
          var main = ifaces.find(function(i) { return i.type === 'ether' && i.name === 'ether1'; })
                  || ifaces.find(function(i) { return i.type === 'ether'; });
          if (main && main['mac-address']) {
            router.mac = main['mac-address'];
            /* Визначаємо vendor по перших 3 октетах */
            var oui = main['mac-address'].substring(0,8).toUpperCase();
            var vendors = {
              '2C:C8:1B': 'MikroTik', 'D4:CA:6D': 'MikroTik',
              'B8:69:F4': 'MikroTik', '4C:5E:0C': 'MikroTik',
              'CC:2D:E0': 'MikroTik', '48:8F:5A': 'MikroTik',
              '6C:3B:6B': 'MikroTik', 'DC:2C:6E': 'MikroTik',
              '00:0C:42': 'MikroTik', 'E4:8D:8C': 'MikroTik',
              '18:FD:74': 'MikroTik', '74:4D:28': 'MikroTik',
              '08:55:31': 'MikroTik', 'C4:AD:34': 'MikroTik',
            };
            router.vendor = vendors[oui] || 'MikroTik';
            saveRouters();
            renderTabs();
          }
        }).catch(function(){});"""

if old in content:
    content = content.replace(old, new)
    print('OK: MAC підтягування додано ✅')
else:
    print('ERR: не знайдено! Шукаємо схоже...')
    idx = content.find('loadDashboard(id)')
    print(repr(content[max(0,idx-150):idx+50]))

with open('router-manager.js', 'w', encoding='utf-8') as f:
    f.write(content)

r = subprocess.run(['node', '--check', 'router-manager.js'],
                   capture_output=True, text=True)
print('Синтаксис:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:300])