# -*- coding: utf-8 -*-
with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

# Коментуємо rm-ux.js тимчасово
c = c.replace(
    '<script src="rm-ux.js"></script>',
    '<!-- <script src="rm-ux.js"></script> -->'
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(c)

print('OK: rm-ux.js тимчасово вимкнено!')
print('Запускай npm start — менеджер має відкриватись нормально')