with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

import os
missing = []
import re
scripts = re.findall(r'<script src="([^"]+)"', c)
for s in scripts:
    if not os.path.exists(s):
        missing.append(s)
        c = c.replace('<script src="' + s + '"></script>', '')
        print('Видалено:', s)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(c)
print('Готово! Видалено:', len(missing), 'зайвих скриптів')