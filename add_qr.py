with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

if 'qr-wifi.js' not in c:
    c = c.replace(
        '<script src="analyzer.js"></script>',
        '<script src="analyzer.js"></script>\n<script src="qr-wifi.js"></script>'
    )
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK! qr-wifi.js підключено')
else:
    print('Вже підключено')