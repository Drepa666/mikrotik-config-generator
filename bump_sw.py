import re

with open('sw.js', 'r', encoding='utf-8') as f:
    c = f.read()

# Знаходимо версію і збільшуємо
match = re.search(r'v(\d+)', c)
if match:
    old_ver = int(match.group(1))
    new_ver = old_ver + 1
    c = c.replace(f'v{old_ver}', f'v{new_ver}', 1)
    print(f'OK: v{old_ver} → v{new_ver}')

with open('sw.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
print('sw.js збережено!')