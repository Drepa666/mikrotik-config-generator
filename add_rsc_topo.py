with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

# Перевіряємо чи є кнопка
if 'btn-rsc-topo' in c:
    print('Кнопка є в HTML ✅')
else:
    print('Кнопки НЕ МАЄ ❌')

# Перевіряємо чи підключений скрипт
if 'rsc-topology.js' in c:
    print('Скрипт підключено ✅')
else:
    print('Скрипт НЕ підключено ❌')
    # Підключаємо
    c = c.replace(
        '<script src="export.js"></script>',
        '<script src="export.js"></script>\n<script src="rsc-topology.js"></script>',
        1
    )
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('Скрипт додано!')