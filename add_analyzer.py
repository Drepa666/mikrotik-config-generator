with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

if 'analyzer.js' not in c:
    c = c.replace(
        '<script src="rsc-topology.js"></script>',
        '<script src="rsc-topology.js"></script>\n<script src="analyzer.js"></script>'
    )
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK! analyzer.js підключено')
else:
    print('Вже підключено')
