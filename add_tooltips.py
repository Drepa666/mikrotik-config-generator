with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

if 'tooltips.js' not in c:
    c = c.replace(
        '<script src="dashboard.js"></script>',
        '<script src="dashboard.js"></script>\n<script src="tooltips.js"></script>'
    )
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK! tooltips.js підключено')
else:
    print('Вже підключено')