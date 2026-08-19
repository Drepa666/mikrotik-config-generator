with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

if 'network-tools.js' in c:
    print('вже є!')
else:
    c = c.replace('</body>', '<script src="network-tools.js"></script>\n</body>')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK: network-tools.js підключено!')