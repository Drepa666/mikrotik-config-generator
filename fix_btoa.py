# -*- coding: utf-8 -*-
import subprocess

with open('router-manager.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Перевіряємо чи є net-scanner в меню
if 'net-scanner' in content:
    idx = content.find('net-scanner')
    print(f'net-scanner @ {idx}:')
    print(content[max(0,idx-100):idx+100])
else:
    print('ERR: net-scanner не знайдено!')

# Перевіряємо MENU масив
idx_menu = content.find("{ id: 'neighbors'")
print(f'\nneighbors @ {idx_menu}:')
print(content[idx_menu:idx_menu+200])

# Додаємо якщо немає
if 'net-scanner' not in content:
    old = "{ id: 'neighbors', icon: '🏘️', label: 'Neighbors' },"
    new = """{ id: 'neighbors', icon: '🏘️', label: 'Neighbors' },
    { id: 'net-scanner', icon: '🔍', label: 'Сканер мережі' },"""
    if old in content:
        content = content.replace(old, new)
        print('OK: net-scanner додано ✅')
    else:
        print('Neighbors не знайдено! Шукаємо...')
        idx2 = content.find('neighbors')
        print(content[max(0,idx2-50):idx2+150])

# Перевіряємо renderContent
if "menu === 'net-scanner'" not in content:
    print('\nERR: обробник net-scanner відсутній!')
    # Знаходимо neighbors обробник
    idx3 = content.find("menu === 'neighbors'")
    if idx3 > 0:
        end = content.find('\n', idx3) + 1
        content = content[:end] + \
            "    if (menu === 'net-scanner') { renderNetworkScanner(); return; }\n" + \
            content[end:]
        print('OK: обробник додано ✅')
    else:
        # Додаємо перед останнім if (menu
        idx4 = content.rfind("if (menu === '")
        end4 = content.find('\n', idx4) + 1
        content = content[:idx4] + \
            "    if (menu === 'net-scanner') { renderNetworkScanner(); return; }\n    " + \
            content[idx4:]
        print('OK: обробник додано (fallback) ✅')
else:
    print('OK: обробник є ✅')

with open('router-manager.js', 'w', encoding='utf-8') as f:
    f.write(content)

r = subprocess.run(['node', '--check', 'router-manager.js'],
                   capture_output=True, text=True)
print('Синтаксис:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:200])