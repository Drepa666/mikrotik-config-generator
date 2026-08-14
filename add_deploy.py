with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

if 'deploy.js' not in c:
    c = c.replace(
        '</body>',
        '<script src="deploy.js"></script>\n</body>'
    )
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK! deploy.js підключено')
else:
    print('Вже підключено')