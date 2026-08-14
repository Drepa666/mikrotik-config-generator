with open('terminal.js', 'r', encoding='utf-8') as f:
    c = f.read()

# Виправляємо всі onchange з неекранованими лапками
fixes = [
    (
        "onchange=\"tmUpdatePort(this,'tm-ssh-port')\"",
        'onchange="tmUpdatePort(this,\'tm-ssh-port\')"'
    ),
    (
        "onchange=\"tmUpdatePort(this,'tm-winbox-port')\"",
        'onchange="tmUpdatePort(this,\'tm-winbox-port\')"'
    ),
    (
        "onchange=\"tmUpdatePort(this,'tm-api-port')\"",
        'onchange="tmUpdatePort(this,\'tm-api-port\')"'
    ),
    (
        "onchange=\"tmUpdatePort(this,'tm-ftp-port')\"",
        'onchange="tmUpdatePort(this,\'tm-ftp-port\')"'
    ),
    (
        "onchange=\"tmUpdatePort(this,'tm-telnet-port')\"",
        'onchange="tmUpdatePort(this,\'tm-telnet-port\')"'
    ),
    (
        "onchange=\"tmUpdatePort(this,'tm-www-port')\"",
        'onchange="tmUpdatePort(this,\'tm-www-port\')"'
    ),
]

count = 0
for old, new in fixes:
    if old in c:
        c = c.replace(old, new)
        count += 1
        print(f'OK: виправлено {old[:50]}...')

print(f'Всього виправлено: {count}')

with open('terminal.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
print('terminal.js збережено!')