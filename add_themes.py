with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

if 'themes.js' not in c:
    c = c.replace(
        '<script src="cheatsheet.js"></script>',
        '<script src="cheatsheet.js"></script>\n<script src="themes.js"></script>'
    )
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK! themes.js підключено')
else:
    print('Вже підключено')