# -*- coding: utf-8 -*-
import os, glob

# Шукаємо у ВСІХ js і html файлах
for fname in glob.glob('*.js') + glob.glob('*.html'):
    try:
        with open(fname, 'r', encoding='utf-8') as f:
            content = f.read()
        for kw in ['ua UA', 'gb EN', 'UA</span', 'EN</span', 'lang', 'emoji']:
            if kw in content:
                lines = content.split('\n')
                for i, l in enumerate(lines, 1):
                    if kw in l and ('button' in l.lower() or 'span' in l.lower()
                                    or 'flag' in l.lower() or 'lang' in l.lower()):
                        print(f'{fname}:{i}: {l.strip()[:100]}')
                break
    except:
        pass