with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

if 'terminal.js' in c:
    print('terminal.js вже є в index.html!')
else:
    c = c.replace('</body>', '<script src="terminal.js"></script>\n</body>')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK: terminal.js підключено!')