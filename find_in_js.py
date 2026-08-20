import os

keywords = ['\u041c\u0430\u0439\u0441\u0442\u0435\u0440', '\u0428\u0430\u0431\u043b\u043e\u043d\u0438', 'Ping Monitor', 'btn-tab', 'tab-bar', 'bottomnav', 'bottom-nav', 'nav-tab']

for fname in os.listdir('.'):
    if not fname.endswith('.js'): continue
    try:
        with open(fname, 'r', encoding='utf-8') as f:
            c = f.read()
    except: continue

    for kw in keywords:
        idx = c.find(kw)
        if idx > 0:
            print(f'\n=== {kw} в {fname} @ {idx} ===')
            print(repr(c[idx-100:idx+150]))
            print('---')