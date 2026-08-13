with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

changed = False

if 'changelog.js' not in c:
    c = c.replace(
        '<script src="backup-scheduler.js"></script>',
        '<script src="backup-scheduler.js"></script>\n<script src="changelog.js"></script>'
    )
    changed = True
    print('OK! changelog.js підключено')
else:
    print('changelog.js вже підключено')

if changed:
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)