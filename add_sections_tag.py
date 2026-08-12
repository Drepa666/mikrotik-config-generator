with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

tag = '<script src="sections.js"></script>'

if tag in c:
    print('вже є!')
else:
    # Додаємо перед </body>
    c = c.replace('</body>', tag + '\n</body>', 1)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK додано!')