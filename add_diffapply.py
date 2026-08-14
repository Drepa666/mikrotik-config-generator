with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

if 'diff-apply.js' in c:
    print('вже є!')
else:
    c = c.replace('</body>', '<script src="diff-apply.js"></script>\n</body>')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK: diff-apply.js додано!')