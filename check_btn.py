import re

with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

# Знаходимо кнопку
match = re.search(r'<button[^>]*btn-nettools-fab[^>]*>.*?</button>', c, re.DOTALL)
if match:
    print('КНОПКА:')
    print(match.group(0)[:300])
else:
    print('КНОПКА НЕ ЗНАЙДЕНА В index.html!')

# Перевіряємо скрипти
scripts = re.findall(r'<script src="([^"]+)"', c)
print('\nПІДКЛЮЧЕНІ СКРИПТИ:')
import os
for s in scripts:
    size = os.path.getsize(s) if os.path.exists(s) else -1
    ok = '✅' if size > 100 else '❌'
    print(f'  {ok} {s} ({size} байт)')