with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

if 'scan-cache.js' not in c:
    c = c.replace('</body>', '<script src="scan-cache.js"></script>\n</body>')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK!')
else:
    print('вже є!')
