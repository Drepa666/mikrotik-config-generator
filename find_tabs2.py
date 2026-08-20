import re

with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

# Шукаємо таби і кнопки по тексту
keywords = ['\u041c\u0430\u0439\u0441\u0442\u0435\u0440', '\u0428\u0430\u0431\u043b\u043e\u043d', 'Ping Monitor', 'btn-wizard', 'btn-template', 'tab-wizard', 'tab-template', 'ping-monitor']
for kw in keywords:
    idx = 0
    while True:
        idx = c.find(kw, idx)
        if idx == -1: break
        # Пропускаємо script src
        ctx = c[idx-200:idx+200]
        if 'script src' not in ctx:
            print(f'\n=== {kw} @ {idx} ===')
            print(repr(c[idx-150:idx+150]))
        idx += 1