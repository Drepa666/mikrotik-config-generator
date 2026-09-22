# -*- coding: utf-8 -*-
import os, subprocess

print('=== ШУКАЄМО ФАЙЛИ ТОПОЛОГІЇ ===')
for root, dirs, files in os.walk('.'):
    if 'node_modules' in root: continue
    for f in files:
        if any(kw in f.lower() for kw in
               ['topo','topology','visual','network-map']):
            path = os.path.join(root, f)
            size = os.path.getsize(path)
            print(f'{path}  ({size} байт)')

print('\n=== ШУКАЄМО ДЕ vendor/MAC використовується ===')
for root, dirs, files in os.walk('.'):
    if 'node_modules' in root: continue
    for f in files:
        if not f.endswith('.js'): continue
        path = os.path.join(root, f)
        try:
            with open(path, encoding='utf-8') as fh:
                c = fh.read()
            for kw in ['Виробник','mac-vendor','macVendor',
                       'OUILookup','vendor','MAC Vendor']:
                if kw in c:
                    idx = c.find(kw)
                    print(f'\n"{kw}" в {path} @ {idx}:')
                    print(repr(c[max(0,idx-30):idx+100]))
                    break
        except: pass

print('\n=== ШУКАЄМО LLDP/CDP в топології ===')
for root, dirs, files in os.walk('.'):
    if 'node_modules' in root: continue
    for f in files:
        if not f.endswith('.js'): continue
        path = os.path.join(root, f)
        try:
            with open(path, encoding='utf-8') as fh:
                c = fh.read()
            for kw in ['neighbor','lldp','cdp','bridge port',
                       'switch','глибокий','deepScan']:
                if kw.lower() in c.lower():
                    idx = c.lower().find(kw.lower())
                    print(f'\n"{kw}" в {path}:')
                    print(repr(c[idx:idx+200]))
                    break
        except: pass