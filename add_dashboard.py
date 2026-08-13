with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

if 'dashboard.js' not in c:
    c = c.replace(
        '<script src="passgen.js"></script>',
        '<script src="passgen.js"></script>\n<script src="dashboard.js"></script>'
    )
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK! dashboard.js підключено')
else:
    print('Вже підключено')