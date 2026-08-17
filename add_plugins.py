with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

if 'plugins.js' in c:
    print('вже є!')
else:
    c = c.replace('</body>', '<script src="plugins.js"></script>\n</body>')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK: plugins.js підключено!')