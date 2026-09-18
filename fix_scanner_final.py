# -*- coding: utf-8 -*-
import subprocess

with open('network-scanner.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Замінюємо getActive() на пряме читання з localStorage
old = """  function getActive() {
    return window.__rmGetActive ? window.__rmGetActive() : null;
  }
  function restCall(router, method, path) {
    return window.__rmRestCall
      ? window.__rmRestCall(router, method, path)
      : fetch('http://localhost:8888/rest' + path, {
          method: method,
          headers: {
            'x-router-ip':   router.ip,
            'x-router-port': String(router.port||80),
            'x-router-user': router.user||'admin',
            'x-router-pass': router.pass||'',
          }
        }).then(function(r){ return r.json(); });
  }"""

new = """  function getActive() {
    /* Пряме читання з localStorage — незалежно від IIFE */
    try {
      var routers = JSON.parse(localStorage.getItem('rm-routers') || '[]');
      var activeId = localStorage.getItem('rm-active-router');
      var router = routers.find(function(r){ return r.id === activeId; }) || routers[0];
      return router || null;
    } catch(e) { return null; }
  }
  function restCall(router, method, path) {
    return fetch('http://localhost:8888/rest' + path, {
      method: method,
      headers: {
        'x-router-ip':   router.ip,
        'x-router-port': String(router.port || 80),
        'x-router-user': router.user || 'admin',
        'x-router-pass': router.pass || '',
      }
    }).then(function(r){ return r.json(); });
  }"""

if old in content:
    content = content.replace(old, new)
    print('OK: getActive виправлено ✅')
else:
    print('ERR: не знайдено точно')
    idx = content.find('function getActive')
    print(repr(content[idx:idx+200]))

# Також фіксуємо nsAddToRouter
old2 = """    var rmState = window.__rmState;
    if (!rmState) { alert('Router Manager не готовий'); return; }
    var id = 'rt-'+Date.now();
    rmState.routers.push({id:id,ip:ip,port:80,user:'admin',pass:'',sshPort:22,name:name||ip,mac:mac,type:'mikrotik',connected:false});
    if (window.__rmSaveRouters) window.__rmSaveRouters();
    if (window.__rmRenderTabs) window.__rmRenderTabs();"""

new2 = """    try {
      var routers = JSON.parse(localStorage.getItem('rm-routers') || '[]');
      var id = 'rt-'+Date.now();
      routers.push({id:id,ip:ip,port:80,user:'admin',pass:'',sshPort:22,name:name||ip,mac:mac,type:'mikrotik',connected:false});
      localStorage.setItem('rm-routers', JSON.stringify(routers));
    } catch(e) {}
    if (window.__rmSaveRouters) window.__rmSaveRouters();
    if (window.__rmRenderTabs) window.__rmRenderTabs();"""

if old2 in content:
    content = content.replace(old2, new2)
    print('OK: nsAddToRouter виправлено ✅')

with open('network-scanner.js', 'w', encoding='utf-8') as f:
    f.write(content)

r = subprocess.run(['node', '--check', 'network-scanner.js'],
                   capture_output=True, text=True)
print('Синтаксис:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:200])