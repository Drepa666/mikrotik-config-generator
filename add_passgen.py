with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

if 'passgen.js' not in c:
    c = c.replace(
        '<script src="changelog.js"></script>',
        '<script src="changelog.js"></script>\n<script src="passgen.js"></script>'
    )
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK! passgen.js підключено')
else:
    print('Вже підключено')