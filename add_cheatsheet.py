with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

if 'cheatsheet.js' not in c:
    c = c.replace(
        '<script src="tooltips.js"></script>',
        '<script src="tooltips.js"></script>\n<script src="cheatsheet.js"></script>'
    )
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK! cheatsheet.js підключено')
else:
    print('Вже підключено')