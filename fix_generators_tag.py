with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

before = len(c)
c = c.replace('<script src="generators.js"></script>\n', '')
c = c.replace('<script src="generators.js"></script>', '')
after = len(c)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(c)

if before != after:
    print('Done! generators.js тег видалено')
else:
    print('Тег не знайдено — перевір вручну')