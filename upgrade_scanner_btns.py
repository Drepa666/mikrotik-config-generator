# -*- coding: utf-8 -*-
import subprocess

with open('network-scanner.js', 'r', encoding='utf-8') as f:
    content = f.read()

# ── 1. Замінюємо кнопки в таблиці ──
old_btns = """(d.ip ? '<button onclick="window.nsPing(\''+esc(d.ip)+'\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#5fd0a5;border-radius:4px;padding:3px 8px;cursor:pointer;font-size:11px;">🏓</button>' : '') +
            (d.ip ? '<button onclick="window.nsPortScan(\''+esc(d.ip)+'\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#f0a840;border-radius:4px;padding:3px 8px;cursor:pointer;font-size:11px;" title="Порт-скан">🔌</button>' : '') +
            (d.ip ? '<button onclick="window.nsAddToRouter(\''+esc(d.ip)+'\',\''+esc(d.mac)+'\',\''+esc(d.hostname)+'\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#4a90d9;border-radius:4px;padding:3px 8px;cursor:pointer;font-size:11px;" title="Додати роутер">➕</button>' : '') +"""

new_btns = """(d.ip ? '<button onclick="window.nsShowPingMenu(event,\''+esc(d.ip)+'\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#5fd0a5;border-radius:4px;padding:3px 10px;cursor:pointer;font-size:11px;" title="Ping">🏓 ▾</button>' : '') +
            (d.ip ? '<button onclick="window.nsShowPortMenu(event,\''+esc(d.ip)+'\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#f0a840;border-radius:4px;padding:3px 10px;cursor:pointer;font-size:11px;" title="Інструменти">🔌 ▾</button>' : '') +
            (d.ip ? '<button onclick="window.nsAddToRouter(\''+esc(d.ip)+'\',\''+esc(d.mac)+'\',\''+esc(d.hostname)+'\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#4a90d9;border-radius:4px;padding:3px 8px;cursor:pointer;font-size:11px;" title="Додати роутер">➕</button>' : '') +"""

if old_btns in content:
    content = content.replace(old_btns, new_btns)
    print('OK: кнопки замінено ✅')
else:
    print('ERR: шукаємо частинами...')
    idx = content.find('window.nsPing')
    print(repr(content[idx:idx+200]))

# ── 2. Замінюємо функцію nsPortScan і додаємо нові функції ──
# Знаходимо функцію nsPortScan і замінюємо на повний блок
import re

# Знаходимо function nsPortScan
m = re.search(r'function nsPortScan\s*\(ip\)\s*\{', content)
if m:
    start = m.start()
    depth = 0; found = False; end = start
    for i, ch in enumerate(content[start:], start):
        if ch == '{': depth += 1; found = True
        elif ch == '}': depth -= 1
        if found and depth == 0: end = i+1; break
    print(f'nsPortScan: {start}-{end}')

    NEW_TOOLS = r"""function nsShowPingMenu(e, ip) {
    e.stopPropagation();
    nsCloseMenus();
    var rect = e.target.getBoundingClientRect();
    var menu = document.createElement('div');
    menu.id = 'ns-ping-menu';
    menu.style.cssText = 'position:fixed;z-index:99999;background:#0d1117;border:1px solid #2a3b48;border-radius:8px;padding:8px 0;min-width:240px;box-shadow:0 8px 24px rgba(0,0,0,.5);top:'+(rect.bottom+4)+'px;left:'+rect.left+'px;';
    var items = [
      {label:'🏓 Стандарт (4 пакети, 56b)',  cmd:'/ping '+ip+' count=4'},
      {label:'🏓 Швидкий (10 пакетів)',       cmd:'/ping '+ip+' count=10'},
      {label:'🏓 Великі пакети (1472b)',       cmd:'/ping '+ip+' count=4 size=1472'},
      {label:'🏓 Малі пакети (32b)',           cmd:'/ping '+ip+' count=4 size=32'},
      {label:'🏓 Тест (100 пакетів)',          cmd:'/ping '+ip+' count=100 interval=10ms'},
      {label:'🏓 Flood тест',                  cmd:'/ping '+ip+' count=20 interval=10ms size=1472'},
      {sep:true},
      {label:'📡 Traceroute',                  cmd:'/tool traceroute '+ip+' count=3'},
    ];
    items.forEach(function(item) {
      if (item.sep) { var s=document.createElement('div'); s.style.cssText='height:1px;background:#1a2a38;margin:4px 0;'; menu.appendChild(s); return; }
      var btn=document.createElement('div');
      btn.textContent=item.label;
      btn.style.cssText='padding:8px 16px;cursor:pointer;font-size:12px;color:#c9d8e4;white-space:nowrap;';
      btn.onmouseover=function(){this.style.background='#1a2a3a';};
      btn.onmouseout=function(){this.style.background='';};
      btn.onclick=function(){ nsCloseMenus(); nsRunSSHCmd(item.cmd,'🏓 '+ip); };
      menu.appendChild(btn);
    });
    document.body.appendChild(menu);
    setTimeout(function(){ document.addEventListener('click',nsCloseMenus,{once:true}); },10);
  }

  function nsShowPortMenu(e, ip) {
    e.stopPropagation();
    nsCloseMenus();
    var rect = e.target.getBoundingClientRect();
    var menu = document.createElement('div');
    menu.id = 'ns-port-menu';
    menu.style.cssText = 'position:fixed;z-index:99999;background:#0d1117;border:1px solid #2a3b48;border-radius:8px;padding:8px 0;min-width:240px;box-shadow:0 8px 24px rgba(0,0,0,.5);top:'+(rect.bottom+4)+'px;left:'+rect.left+'px;';
    var items = [
      {label:'🔍 Повний скан портів',          action:function(){ nsPortScan(ip); }},
      {sep:true},
      {label:'🌐 HTTP (80)',                    cmd:'/tool fetch address='+ip+' port=80 mode=tcp dst-path=/null as-value'},
      {label:'🔒 HTTPS (443)',                  cmd:'/tool fetch address='+ip+' port=443 mode=tcp dst-path=/null as-value'},
      {label:'🖥 SSH (22)',                     cmd:'/tool fetch address='+ip+' port=22 mode=tcp dst-path=/null as-value'},
      {label:'🔧 Winbox (8291)',                cmd:'/tool fetch address='+ip+' port=8291 mode=tcp dst-path=/null as-value'},
      {label:'🖨 RDP (3389)',                   cmd:'/tool fetch address='+ip+' port=3389 mode=tcp dst-path=/null as-value'},
      {label:'📡 SNMP (161)',                   cmd:'/ip snmp community print'},
      {sep:true},
      {label:'📋 ARP info',                     cmd:'/ip arp print where address='+ip},
      {label:'🔗 DNS resolve',                  cmd:'/resolve '+ip},
      {label:'📊 Bandwidth test',               cmd:'/tool bandwidth-test address='+ip+' direction=both duration=5'},
      {sep:true},
      {label:'🚫 Заблокувати IP',               action:function(){ nsBlockIP(ip); }},
      {label:'✅ Розблокувати IP',              action:function(){ nsUnblockIP(ip); }},
    ];
    items.forEach(function(item) {
      if (item.sep) { var s=document.createElement('div'); s.style.cssText='height:1px;background:#1a2a38;margin:4px 0;'; menu.appendChild(s); return; }
      var btn=document.createElement('div');
      btn.textContent=item.label;
      btn.style.cssText='padding:8px 16px;cursor:pointer;font-size:12px;color:#c9d8e4;white-space:nowrap;';
      btn.onmouseover=function(){this.style.background='#1a2a3a';};
      btn.onmouseout=function(){this.style.background='';};
      btn.onclick=function(){ nsCloseMenus(); if(item.action) item.action(); else nsRunSSHCmd(item.cmd,'🔌 '+ip); };
      menu.appendChild(btn);
    });
    document.body.appendChild(menu);
    setTimeout(function(){ document.addEventListener('click',nsCloseMenus,{once:true}); },10);
  }

  function nsCloseMenus() {
    ['ns-ping-menu','ns-port-menu'].forEach(function(id){ var m=document.getElementById(id); if(m) m.remove(); });
  }

  function nsRunSSHCmd(cmd, title) {
    var router = getActive();
    if (!router) { alert('Немає роутера'); return; }
    var existing = document.getElementById('ns-result-modal');
    if (existing) existing.remove();
    var modal = document.createElement('div');
    modal.id = 'ns-result-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);z-index:99998;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML =
      '<div style="background:#0d1117;border:1px solid #2a3b48;border-radius:12px;width:620px;max-height:80vh;overflow-y:auto;">' +
        '<div style="display:flex;align-items:center;padding:14px 18px;border-bottom:1px solid #1a2a38;position:sticky;top:0;background:#0d1117;">' +
          '<span style="font-weight:700;color:#e6edf3;font-size:14px;">'+title+'</span>' +
          '<code style="margin-left:10px;font-size:10px;color:#4a6070;flex:1;overflow:hidden;text-overflow:ellipsis;">'+cmd+'</code>' +
          '<button onclick="document.getElementById(\'ns-result-modal\').remove()" style="margin-left:8px;background:transparent;border:1px solid #2a3b48;color:#8ea3b0;border-radius:6px;padding:4px 10px;cursor:pointer;">✕</button>' +
        '</div>' +
        '<div id="ns-result-body" style="padding:16px;font-family:monospace;font-size:12px;color:#4a6070;">⏳ Виконую...</div>' +
      '</div>';
    document.body.appendChild(modal);
    fetch('http://localhost:8888/ssh/exec',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({host:router.ip,port:router.sshPort||22,username:router.user,password:router.pass,command:cmd})
    }).then(function(r){return r.json();}).then(function(d){
      var body=document.getElementById('ns-result-body');
      if(!body) return;
      var out=d.output||d.error||'Немає відповіді';
      body.style.color=d.ok?'#5fd0a5':'#e05252';
      body.innerHTML='<pre style="margin:0;white-space:pre-wrap;word-break:break-all;">'+out.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</pre>';
    }).catch(function(e){
      var body=document.getElementById('ns-result-body');
      if(body) body.innerHTML='<span style="color:#e05252;">❌ '+e+'</span>';
    });
  }

  function nsPortScan(ip) {
    var router = getActive();
    if (!router) { alert('Немає роутера'); return; }
    var ports = [21,22,23,25,53,80,443,1194,1723,3306,3389,5432,5900,8080,8291,8443,8728,8729];
    var cmds  = ports.map(function(p){ return '/tool fetch address='+ip+' port='+p+' mode=tcp dst-path=/null as-value'; });
    nsRunSSHCmd(cmds.join('\n'), '🔌 Port Scan '+ip);
  }

  function nsBlockIP(ip) {
    if(!confirm('Заблокувати '+ip+'?')) return;
    nsRunSSHCmd('/ip firewall filter add chain=forward src-address='+ip+' action=drop comment="Blocked by Scanner"','🚫 Block '+ip);
  }

  function nsUnblockIP(ip) {
    nsRunSSHCmd('/ip firewall filter remove [find where src-address='+ip+' comment="Blocked by Scanner"]','✅ Unblock '+ip);
  }

  function nsPing(ip) {
    nsShowPingMenu({target:{getBoundingClientRect:function(){return {bottom:300,left:300};}},stopPropagation:function(){}},ip);
  }"""

    content = content[:start] + NEW_TOOLS + content[end:]
    print('OK: всі інструменти замінено ✅')

# ── 3. Оновлюємо window реєстрацію ──
for fn in ['nsShowPingMenu','nsShowPortMenu','nsCloseMenus','nsRunSSHCmd','nsBlockIP','nsUnblockIP']:
    if 'window.'+fn not in content:
        content = content.rstrip() + '\n  window.'+fn+' = '+fn+';'
        print(f'OK: window.{fn} ✅')

with open('network-scanner.js', 'w', encoding='utf-8') as f:
    f.write(content)

r = subprocess.run(['node', '--check', 'network-scanner.js'],
                   capture_output=True, text=True)
print('Синтаксис:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:300])