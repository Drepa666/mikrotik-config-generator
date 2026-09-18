# -*- coding: utf-8 -*-
import subprocess

with open('network-scanner.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Всі функції що викликаються в onclick без window.
fns = [
    'nsDoPing', 'nsPingFill', 'nsDoPortScan', 
    'nsSelectAllPorts', 'nsRunSSHCmd', 'nsBlockIP', 
    'nsUnblockIP', 'nsCloseMenus'
]

fixed = 0
for fn in fns:
    # Замінюємо тільки в onclick="fn(" — без window.
    old = 'onclick="' + fn + '('
    new = 'onclick="window.' + fn + '('
    count = content.count(old)
    if count > 0:
        content = content.replace(old, new)
        print(f'OK: {fn} — {count} замін ✅')
        fixed += count
    
    # Також в onclick="event.stopPropagation();fn(
    old2 = 'onclick="event.stopPropagation();' + fn + '('
    new2 = 'onclick="event.stopPropagation();window.' + fn + '('
    count2 = content.count(old2)
    if count2 > 0:
        content = content.replace(old2, new2)
        print(f'OK: stopProp+{fn} — {count2} замін ✅')
        fixed += count2

print(f'\nВсього замін: {fixed}')

with open('network-scanner.js', 'w', encoding='utf-8') as f:
    f.write(content)

r = subprocess.run(['node', '--check', 'network-scanner.js'],
                   capture_output=True, text=True)
print('Синтаксис:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:200])