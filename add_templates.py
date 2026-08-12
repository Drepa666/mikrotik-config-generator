with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

tag = '<script src="templates.js"></script>'

if tag in c:
    print('вже є!')
else:
    c = c.replace(
        '<script src="topology.js"></script>',
        '<script src="topology.js"></script>\n' + tag,
        1
    )
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK templates.js підключено!')
