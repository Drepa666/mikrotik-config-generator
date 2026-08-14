with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

# Кнопки для видалення
buttons = [
    # Dashboard
    '<button class="sec" id="open-dashboard">',
    # Шпаргалка  
    '<button class="sec" id="open-cheatsheet">',
]

import re

# Видаляємо кнопки з btnbar повністю
patterns = [
    r'<button[^>]*id="open-dashboard"[^>]*>.*?</button>',
    r'<button[^>]*id="open-cheatsheet"[^>]*>.*?</button>',
]

count = 0
for pattern in patterns:
    new_c = re.sub(pattern, '', c, flags=re.DOTALL)
    if new_c != c:
        c = new_c
        count += 1
        print(f'OK: видалено кнопку за pattern')

print(f'Всього видалено: {count}')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(c)
print('index.html збережено!')