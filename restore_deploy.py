with open('deploy.js', 'r', encoding='utf-8') as f:
    c = f.read()

# Видаляємо все після маркера масового deploy
marker = '/* ============================================================\n   МАСОВИЙ DEPLOY — вбудовано в deploy.js'
if marker in c:
    c = c[:c.index(marker)]
    with open('deploy.js', 'w', encoding='utf-8', newline='\n') as f:
        f.write(c)
    print(f'OK: масовий deploy видалено! Розмір: {len(c)} байт')
else:
    print('Маркер не знайдено')