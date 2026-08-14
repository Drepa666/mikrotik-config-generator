with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

if 'topology-visual.js' in c:
    print('вже є!')
else:
    c = c.replace('</body>', '<script src="topology-visual.js"></script>\n</body>')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK: topology-visual.js підключено!')