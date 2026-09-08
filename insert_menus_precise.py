# -*- coding: utf-8 -*-
with open('router-manager.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f'Всього рядків: {len(lines)}')

# Нові пункти меню — вставляємо ПІСЛЯ рядка 496
new_menu_items = [
    "    { id: 'sep-extra' },\n",
    "    { id: 'capsman',       icon: '📡', label: 'CAPsMAN' },\n",
    "    { id: 'notifications', icon: '🔔', label: 'Notifications' },\n",
    "    { id: 'sep-extra2' },\n",
    "    { id: 'ipv6',          icon: '🌐', label: 'IPv6' },\n",
    "    { id: 'wireguard',     icon: '🔐', label: 'WireGuard' },\n",
    "    { id: 'certificates',  icon: '🏅', label: 'Certificates' },\n",
    "    { id: 'netwatch',      icon: '👁', label: 'Netwatch' },\n",
    "    { id: 'snmp',          icon: '📊', label: 'SNMP' },\n",
    "    { id: 'logging',       icon: '📋', label: 'Logging' },\n",
]

# Нові обробники — вставляємо ПЕРЕД рядком з "Секція в розробці"
new_handlers = [
    "    if (menu === 'capsman')       { if(window.rmSectionCAPsMAN)       window.rmSectionCAPsMAN();       return; }\n",
    "    if (menu === 'notifications') { if(window.rmSectionNotifications) window.rmSectionNotifications(); return; }\n",
    "    if (menu === 'ipv6')          { if(window.rmSectionIPv6)           window.rmSectionIPv6();          return; }\n",
    "    if (menu === 'wireguard')     { if(window.rmSectionWireGuard)     window.rmSectionWireGuard();     return; }\n",
    "    if (menu === 'certificates')  { if(window.rmSectionCertificates)  window.rmSectionCertificates();  return; }\n",
    "    if (menu === 'netwatch')      { if(window.rmSectionNetwatch)      window.rmSectionNetwatch();      return; }\n",
    "    if (menu === 'snmp')          { if(window.rmSectionSNMP)          window.rmSectionSNMP();          return; }\n",
    "    if (menu === 'logging')       { if(window.rmSectionLogging)       window.rmSectionLogging();       return; }\n",
]

# Знаходимо точні рядки
menu_insert_idx   = None
handler_insert_idx = None

for i, line in enumerate(lines):
    # Після dns-static
    if "{ id: 'dns-static'" in line and menu_insert_idx is None:
        menu_insert_idx = i + 1
        print(f'Меню вставимо після рядка {i+1}: {line.rstrip()}')

    # Перед заглушкою
    if 'Секція в розробці' in line and handler_insert_idx is None:
        handler_insert_idx = i
        print(f'Обробники вставимо перед рядком {i+1}: {line.rstrip()}')

# Перевіряємо чи вже є
already_has_menu    = any("id: 'capsman'" in l for l in lines)
already_has_handler = any("menu === 'capsman'" in l for l in lines)

print(f'\nМеню вже є: {already_has_menu}')
print(f'Обробники вже є: {already_has_handler}')

if already_has_menu and already_has_handler:
    print('Все вже є! Нічого не змінюємо.')
else:
    # Вставляємо — спочатку обробники (більший індекс), потім меню (менший)
    # Важливо: спочатку вставляємо те що далі по файлу!

    if not already_has_handler and handler_insert_idx is not None:
        for j, handler in enumerate(new_handlers):
            lines.insert(handler_insert_idx + j, handler)
        print(f'OK: {len(new_handlers)} обробників вставлено перед рядком {handler_insert_idx+1}')
        # Зсуваємо індекс меню
        if menu_insert_idx and menu_insert_idx > handler_insert_idx:
            menu_insert_idx += len(new_handlers)

    if not already_has_menu and menu_insert_idx is not None:
        for j, item in enumerate(new_menu_items):
            lines.insert(menu_insert_idx + j, item)
        print(f'OK: {len(new_menu_items)} пунктів меню вставлено після рядка {menu_insert_idx}')

    with open('router-manager.js', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print('\nФайл збережено!')

# Перевіряємо синтаксис
import subprocess
result = subprocess.run(
    ['node', '--check', 'router-manager.js'],
    capture_output=True, text=True
)
if result.returncode == 0:
    print('OK: синтаксис правильний!')
else:
    print('ПОМИЛКА синтаксису:')
    print(result.stderr[:300])
    # Відкатуємо!
    import shutil
    shutil.copy('router-manager.js.bak', 'router-manager.js')
    print('Відкат виконано!')

print('\nГотово! Запускай npm start')