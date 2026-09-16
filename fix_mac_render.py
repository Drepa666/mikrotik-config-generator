# -*- coding: utf-8 -*-
import subprocess

with open('router-manager.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Знаходимо точний рядок з rm-badge і router.ip
old = "'<span class=\"rm-badge\">' + esc(router.ip) + '</span></div>';"

new = ("'<span class=\"rm-badge\">' + esc(router.ip) + '</span>' +"
       "'<span class=\"rm-badge\" style=\"margin-left:6px;background:#1a2a3a;color:#4a90d9;font-family:monospace;font-size:11px;\">' +"
       "(router.mac ? '🔌 ' + esc(router.mac) : '') +"
       "'</span></div>';")

if old in content:
    content = content.replace(old, new)
    print('OK ✅ MAC badge додано в dashboard')
else:
    # Шукаємо схоже
    idx = content.find("'<span class=\"rm-badge\">' + esc(router.ip)")
    print(f'Знайдено @ {idx}:')
    print(repr(content[idx:idx+150]))

with open('router-manager.js', 'w', encoding='utf-8') as f:
    f.write(content)

r = subprocess.run(['node', '--check', 'router-manager.js'],
                   capture_output=True, text=True)
print('Синтаксис:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:200])