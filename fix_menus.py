# -*- coding: utf-8 -*-
import subprocess

with open('network-scanner.js', 'r', encoding='utf-8') as f:
    content = f.read()

old = """(d.ip ? '<button onclick="window.nsPing(\\\''+esc(d.ip)+'\\\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#5fd0a5;border-radius:4px;padding:3px 8px;cursor:pointer;font-size:11px;">🏓</button>' : '') +
            (d.ip ? '<button onclick="window.nsAddToRouter(\\\''+esc(d.ip)+'\\\',\\\''+esc(d.mac)+'\\\',\\\''+esc(d.hostname)"""

# Знаходимо точний індекс
idx = content.find("window.nsPing")
print(f'nsPing @ {idx}')

# Знаходимо початок рядка з кнопками (від <div style="display:flex)
start = content.rfind("'<div style=\"display:flex;gap:4px;\">'", 0, idx)
print(f'start @ {start}')

# Знаходимо кінець блоку кнопок (closing </div>)
end = content.find("'</div>'", idx) + len("'</div>'")
print(f'end @ {end}')

print('Поточний блок:')
print(repr(content[start:end]))# -*- coding: utf-8 -*-
import subprocess

with open('network-scanner.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Використовуємо точні позиції з попереднього запуску
start = 11779
end   = 12333

old_block = content[start:end]
print('Замінюємо:')
print(repr(old_block[:80]))

new_block = """'<div style="display:flex;gap:4px;">' +
            (d.ip ? '<button onclick="window.nsShowPingMenu(event,\\\''+esc(d.ip)+'\\\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#5fd0a5;border-radius:4px;padding:3px 10px;cursor:pointer;font-size:11px;" title="Ping">🏓 ▾</button>' : '') +
            (d.ip ? '<button onclick="window.nsShowPortMenu(event,\\\''+esc(d.ip)+'\\\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#f0a840;border-radius:4px;padding:3px 10px;cursor:pointer;font-size:11px;" title="Інструменти">🔌 ▾</button>' : '') +
            (d.ip ? '<button onclick="window.nsAddToRouter(\\\''+esc(d.ip)+'\\\',\\\''+esc(d.mac)+'\\\',\\\''+esc(d.hostname)+'\\\')" style="background:#1a2a3a;border:1px solid #2a3b48;color:#4a90d9;border-radius:4px;padding:3px 8px;cursor:pointer;font-size:11px;" title="Додати роутер">➕</button>' : '') +
          '</div>'"""

content = content[:start] + new_block + content[end:]

# Перевіряємо що нові функції є
for fn in ['nsShowPingMenu','nsShowPortMenu','nsPingFill','nsDoPing','nsDoPortScan']:
    exists = 'function ' + fn in content
    print(f'function {fn}: {"✅" if exists else "❌ ВІДСУТНЯ"}')

with open('network-scanner.js', 'w', encoding='utf-8') as f:
    f.write(content)

r = subprocess.run(['node', '--check', 'network-scanner.js'],
                   capture_output=True, text=True)
print('Синтаксис:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:200])