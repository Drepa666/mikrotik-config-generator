import os

keywords = [
    'Скрипт згенеровано',
    'Чек-лист',
    'Резервна копія',
    'Загальне',
    'Перевір команди',
    'Пароль admin',
    'Базовий firewall',
    'MAC-захист',
    'Захист DNS',
    'Небезпечні',
    'DHCP LAN',
    'Фаєрвол',
    'Модель:',
]

for fname in os.listdir('.'):
    if not fname.endswith('.js'):
        continue
    try:
        with open(fname, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        for i, line in enumerate(lines):
            for kw in keywords:
                if kw in line:
                    print(f'[{fname}] рядок {i+1}: {line.rstrip()}')
                    break
    except Exception as e:
        print(f'[ERROR] {fname}: {e}')