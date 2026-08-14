with open('terminal.js', 'r', encoding='utf-8') as f:
    c = f.read()

# Пряма заміна проблемних рядків
problems = [
    ("onchange=\"tmUpdatePort(this,'tm-ssh-port')\"",
     "onchange=\"tmUpdatePort(this,&apos;tm-ssh-port&apos;)\""),
    ("onchange=\"tmUpdatePort(this,'tm-winbox-port')\"",
     "onchange=\"tmUpdatePort(this,&apos;tm-winbox-port&apos;)\""),
    ("onchange=\"tmUpdatePort(this,'tm-api-port')\"",
     "onchange=\"tmUpdatePort(this,&apos;tm-api-port&apos;)\""),
    ("onchange=\"tmUpdatePort(this,'tm-ftp-port')\"",
     "onchange=\"tmUpdatePort(this,&apos;tm-ftp-port&apos;)\""),
    ("onchange=\"tmUpdatePort(this,'tm-telnet-port')\"",
     "onchange=\"tmUpdatePort(this,&apos;tm-telnet-port&apos;)\""),
    ("onchange=\"tmUpdatePort(this,'tm-www-port')\"",
     "onchange=\"tmUpdatePort(this,&apos;tm-www-port&apos;)\""),
]

count = 0
for old, new in problems:
    if old in c:
        c = c.replace(old, new)
        count += 1
        print(f'Fixed: {old[:45]}...')

print(f'Всього: {count}')

with open('terminal.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
print('Збережено!')

# Перевіряємо рядок 65
lines = c.split('\n')
print('\n=== Рядок 63-67 після виправлення ===')
for i, l in enumerate(lines[62:67], 63):
    print(f'{i}: {l[:80]}')