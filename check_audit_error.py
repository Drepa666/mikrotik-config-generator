# Перевіряємо чи є синтаксична помилка в audit.js
with open('audit.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Пробуємо знайти проблему
lines = content.split('\n')
print(f'Рядків в audit.js: {len(lines)}')
print(f'FAB є: {"btn-audit-fab" in content}')
print(f'bottom:116px є: {"bottom:116px" in content}')

# Шукаємо підозрілі символи
import re
problems = re.findall(r'.{0,20}[\\\']{2,}.{0,20}', content)
print(f'\nПідозрілі місця: {len(problems)}')
for p in problems[:5]:
    print(repr(p))