with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

tag = '<script src="export.js"></script>'

if tag in c:
    print('вже є!')
else:
    c = c.replace(
        '<script src="i18n.js"></script>',
        '<script src="i18n.js"></script>\n' + tag,
        1
    )
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK export.js підключено!')
