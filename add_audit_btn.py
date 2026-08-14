with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

# Додаємо audit.js якщо немає
if 'audit.js' not in c:
    c = c.replace('</body>', '<script src="audit.js"></script>\n</body>')
    print('OK: audit.js підключено!')

# Додаємо кнопку прямо в btnbar поряд з Масовий Deploy
OLD = '<button class="sec" id="btn-mass-deploy"'
NEW = '<button class="sec" id="btn-audit" onclick="document.getElementById(\'audit-modal\').style.display=\'block\'">🔒 Audit Log</button>\n<button class="sec" id="btn-mass-deploy"'

if OLD in c:
    c = c.replace(OLD, NEW)
    print('OK: кнопка додана поряд з Масовий Deploy!')
else:
    # Шукаємо Версії
    OLD2 = '<button class="sec" id="btn-versioning"'
    NEW2 = '<button class="sec" id="btn-audit" onclick="document.getElementById(\'audit-modal\').style.display=\'block\'">🔒 Audit Log</button>\n<button class="sec" id="btn-versioning"'
    if OLD2 in c:
        c = c.replace(OLD2, NEW2)
        print('OK: кнопка додана поряд з Версіями!')
    else:
        print('WARN: не знайдено — шукаємо btnbar...')
        import re
        c = re.sub(
            r'(class="btnbar"[^>]*>)',
            r'\1<button class="sec" id="btn-audit" onclick="document.getElementById(\'audit-modal\').style.display=\'block\'">🔒 Audit Log</button>',
            c, count=1
        )
        print('OK через regex!')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(c)
print('index.html збережено!')