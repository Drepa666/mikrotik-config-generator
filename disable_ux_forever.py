# -*- coding: utf-8 -*-
import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Вимикаємо rm-ux.js назавжди
html = re.sub(
    r'\s*<script src="rm-ux\.js"></script>',
    '\n<!-- rm-ux.js DISABLED — UX вбудовано в router-manager.js -->',
    html
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('OK: rm-ux.js вимкнено назавжди!')

# Перевіряємо sw.js
with open('sw.js', 'r', encoding='utf-8') as f:
    sw = f.read()

print('sw.js має file:// захист:', 'file:' in sw and 'return' in sw)