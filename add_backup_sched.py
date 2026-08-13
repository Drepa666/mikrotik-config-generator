with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

if 'backup-scheduler.js' not in c:
    c = c.replace(
        '<script src="pdf-report.js"></script>',
        '<script src="pdf-report.js"></script>\n<script src="backup-scheduler.js"></script>'
    )
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK! backup-scheduler.js підключено')
else:
    print('Вже підключено')