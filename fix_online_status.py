# -*- coding: utf-8 -*-
import subprocess

with open('network-scanner.js', 'r', encoding='utf-8') as f:
    content = f.read()

old = """    window.__nsDevices = arr;
    window.nsRender(arr);
    if (btn) { btn.disabled = false; btn.textContent = '🔄 Оновити'; }"""

new = """    window.__nsDevices = arr;
    window.nsRender(arr);
    if (btn) { btn.textContent = '🏓 Перевірка...'; }

    /* Перевіряємо реальний статус пінгом для ВСІХ пристроїв з IP */
    var toCheck = arr.filter(function(d){ return d.ip; });
    var checked = 0;

    if (!toCheck.length) {
      if (btn) { btn.disabled = false; btn.textContent = '🔄 Оновити'; }
      return;
    }

    /* Пінгуємо по 3 паралельно */
    var idx = 0;
    function pingNext() {
      if (idx >= toCheck.length) return;
      var d = toCheck[idx++];
      nsSSH('/ping ' + d.ip + ' count=1 interval=200ms')
        .then(function(res) {
          var out = res.output || '';
          /* received=1 або ttl= означає онлайн */
          d.online = (out.includes('received=1') || out.includes('ttl=')) ? true : false;
        })
        .catch(function() { d.online = null; })
        .finally(function() {
          checked++;
          /* Оновлюємо рядок в таблиці */
          window.nsRender(window.__nsDevices);
          if (checked >= toCheck.length) {
            if (btn) { btn.disabled = false; btn.textContent = '🔄 Оновити'; }
          } else {
            pingNext();
          }
        });
    }
    /* 3 паралельних потоки */
    pingNext(); pingNext(); pingNext();"""

if old in content:
    content = content.replace(old, new)
    print('OK: ping перевірка ✅')
else:
    print('ERR: не знайдено!')
    idx = content.find('window.__nsDevices = arr;')
    print(repr(content[idx:idx+200]))

with open('network-scanner.js', 'w', encoding='utf-8') as f:
    f.write(content)

r = subprocess.run(['node', '--check', 'network-scanner.js'],
                   capture_output=True, text=True)
print('Синтаксис:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:200])