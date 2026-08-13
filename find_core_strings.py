with open('core.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

keywords = [
    'Скрипт згенеровано',
    'Чек-лист безпеки',
    'Резервна копія',
    'Загальне',
    'Перевір команди',
    'Пароль admin змінено',
    'Базовий firewall',
    'MAC-захист',
]

for i, line in enumerate(lines):
    for kw in keywords:
        if kw in line:
            print(f'Рядок {i+1}: {line.rstrip()}')
            break