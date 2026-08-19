with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

import re

# Шукаємо backup scheduler блок
idx = c.find('auto-backup')
if idx > 0:
    print('=== Контекст auto-backup ===')
    print(repr(c[idx-100:idx+300]))
else:
    print('auto-backup не знайдено в index.html')
    # Шукаємо в інших файлах
    import os
    for f in os.listdir('.'):
        if f.endswith('.js'):
            with open(f, 'r', encoding='utf-8') as fh:
                content = fh.read()
            if 'auto-backup' in content:
                print(f'Знайдено в: {f}')
                idx2 = content.find('auto-backup')
                print(repr(content[idx2-50:idx2+200]))
                print('---')