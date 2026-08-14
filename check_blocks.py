with open('terminal.js', 'r', encoding='utf-8') as f:
    c = f.read()

# Шукаємо що реально є в файлі для ssh, api, www
import re

for svc in ['ssh', 'api', 'www']:
    matches = [(i, line) for i, line in enumerate(c.split('\n'), 1) 
               if 'tm-' + svc + '-indicator' in line]
    print(f'\n=== {svc} ===')
    for i, line in matches:
        print(f'{i}: {line[:100]}')