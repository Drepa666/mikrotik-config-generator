with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

if 'pdf-report.js' not in c:
    c = c.replace(
        '<script src="qr-wifi.js"></script>',
        '<script src="qr-wifi.js"></script>\n<script src="pdf-report.js"></script>'
    )
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK! pdf-report.js підключено')
else:
    print('Вже підключено')