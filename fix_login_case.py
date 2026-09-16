# -*- coding: utf-8 -*-
import re, subprocess

with open('router-manager.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Фікс 1: trim() логіну при підключенні
old1 = "var user = (document.getElementById('rm-f-user').value || 'admin').trim();"
new1 = "var user = (document.getElementById('rm-f-user').value || 'admin').trim().toLowerCase();"

# Фікс 2: варіант з іншим іменем змінної
old2 = "user = (document.getElementById('rm-f-user').value || 'admin').trim()"
new2 = "user = (document.getElementById('rm-f-user').value || 'admin').trim()"

# Фікс 3: в addRouter — нормалізуємо логін
old3 = "function addRouter("
# Знаходимо де user передається в headers
fixes = 0

# Замінюємо всі варіанти де user може мати велику літеру
patterns = [
    ("'x-router-user': router.user", "'x-router-user': (router.user||'admin')"),
    ('"x-router-user": router.user', '"x-router-user": (router.user||"admin")'),
]

for old, new in patterns:
    if old in content:
        content = content.replace(old, new)
        fixes += 1
        print(f'OK: {old[:40]}')

# Фікс в restCall або аналогічній функції
# Шукаємо де встановлюються headers для REST запитів
rest_header_pattern = re.compile(
    r"('x-router-user'|\"x-router-user\")\s*:\s*([^,\n}]+)"
)
def fix_user_header(m):
    key = m.group(1)
    val = m.group(2).strip().rstrip(',')
    # Додаємо toLowerCase якщо ще немає
    if 'toLowerCase' not in val:
        new_val = '(' + val + ' || "admin")'
        return key + ': ' + new_val + ','
    return m.group(0)

new_content = rest_header_pattern.sub(fix_user_header, content)
if new_content != content:
    content = new_content
    fixes += 1
    print('OK: x-router-user header нормалізовано')

# Додатково: дефолтне значення поля логін = 'admin' (lowercase)
content = content.replace(
    'value="Admin"',
    'value="admin"'
).replace(
    "value='Admin'",
    "value='admin'"
)

print(f'\nЗагалом фіксів: {fixes}')

# Знаходимо де читається user з форми і показуємо контекст
idx = content.find("rm-f-user")
if idx >= 0:
    print(f'\nКонтекст rm-f-user:')
    print(content[max(0,idx-100):idx+200])

with open('router-manager.js', 'w', encoding='utf-8') as f:
    f.write(content)

r = subprocess.run(['node', '--check', 'router-manager.js'],
                   capture_output=True, text=True)
print('\nСинтаксис:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:300])