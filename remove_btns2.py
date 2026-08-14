with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

import re

# Видаляємо будь-яку кнопку що містить текст Dashboard або Шпаргалка
patterns = [
    r'<button[^>]*>[^<]*Dashboard[^<]*</button>',
    r'<button[^>]*>[^<]*Шпаргалка[^<]*</button>',
    r'<button[^>]*>[^<]*📊[^<]*</button>',
    r'<button[^>]*>[^<]*📖[^<]*</button>',
]

count = 0
for p in patterns:
    new_c = re.sub(p, '', c, flags=re.IGNORECASE)
    if new_c != c:
        count += 1
        c = new_c
        print(f'OK: {p[:40]}')

# Показуємо що залишилось з Dashboard/Шпаргалка
found = re.findall(r'<button[^>]*>[^<]*(Dashboard|Шпаргалка)[^<]*</button>', c)
print(f'Залишилось: {found}')
print(f'Видалено: {count}')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(c)
print('Збережено!')