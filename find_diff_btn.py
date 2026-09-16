# -*- coding: utf-8 -*-

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Шукаємо кнопку що відкривала Diff & Apply
for needle in ['Diff', 'diff-apply', 'showDiff', 'openDiff', 'da-modal', 'btn-diff']:
    idx = 0
    while True:
        idx = content.find(needle, idx)
        if idx < 0: break
        ctx = content[max(0,idx-100):idx+150]
        if 'button' in ctx.lower() or 'btn' in ctx.lower() or 'onclick' in ctx.lower():
            print(f'["{needle}"] @ {idx}:')
            print(ctx)
            print('---')
        idx += 1

# Також шукаємо в router-manager.js і plugins.js
for fname in ['router-manager.js', 'plugins.js', 'ui-overrides.js']:
    try:
        with open(fname, 'r', encoding='utf-8') as f:
            c = f.read()
        for needle in ['diff-apply', 'Diff &', 'showDiffApply', 'openDiff']:
            idx = c.find(needle)
            if idx > 0:
                print(f'\n[{fname}] "{needle}" @ {idx}:')
                print(c[max(0,idx-150):idx+200])
                print('---')
    except: pass