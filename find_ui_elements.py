import re

with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

# Шукаємо Майстер/Шаблони/Ping Monitor
keywords = ['Майстер', 'Шаблони', 'Ping Monitor', 'wizard', 'templates', 'ping-monitor']
for kw in keywords:
    idx = c.find(kw)
    if idx > 0:
        print(f'\n=== {kw} @ {idx} ===')
        print(repr(c[idx-150:idx+150]))
        print('---')