# -*- coding: utf-8 -*-
with open('router-manager.js', 'r', encoding='utf-8') as f:
    rm = f.read()

# Замінюємо старий обробник на новий
old = "if (menu === 'dashboard')     { renderDashboard(); return; }"
new = """if (menu === 'dashboard') {
      if (window.rmSectionDashboard) {
        window.rmSectionDashboard(); return;
      }
      renderDashboard(); return;
    }"""

if old in rm:
    rm = rm.replace(old, new, 1)
    print('OK: dashboard обробник замінено!')
else:
    # Пробуємо з іншою кількістю пробілів
    import re
    m = re.search(r"if \(menu === 'dashboard'\)\s*\{[^}]+\}", rm)
    if m:
        print('Знайдено:', m.group())
        rm = rm.replace(m.group(),
            "if (menu === 'dashboard') { if (window.rmSectionDashboard) { window.rmSectionDashboard(); return; } renderDashboard(); return; }",
            1)
        print('OK: замінено через regex!')
    else:
        print('НЕ знайдено!')

# Додаємо Traffic Monitor обробник якщо немає
if "menu === 'traffic'" not in rm:
    old2 = "if (menu === 'dashboard')"
    new2 = """if (menu === 'traffic') {
      if (window.rmSectionTraffic) { window.rmSectionTraffic(); return; }
    }
    if (menu === 'dashboard')"""
    rm = rm.replace(old2, new2, 1)
    print('OK: traffic обробник додано!')

# Додаємо Traffic в меню якщо немає
if "'traffic'" not in rm:
    old3 = "{ id: 'dashboard', icon: '📊', label: 'Dashboard' },"
    new3 = """{ id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'traffic',   icon: '📈', label: 'Traffic Monitor' },"""
    if old3 in rm:
        rm = rm.replace(old3, new3, 1)
        print('OK: Traffic Monitor в меню додано!')

with open('router-manager.js', 'w', encoding='utf-8') as f:
    f.write(rm)

# Перевіряємо чи rm-dashboard.js підключено в index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

if 'rm-dashboard.js' not in html:
    # Підключаємо після rm-sections-extra.js
    tag = '<script src="rm-dashboard.js"></script>'
    if '<script src="rm-sections-extra.js"></script>' in html:
        html = html.replace(
            '<script src="rm-sections-extra.js"></script>',
            '<script src="rm-sections-extra.js"></script>\n' + tag
        )
        print('OK: rm-dashboard.js підключено в index.html!')
    else:
        html = html.replace('</body>', tag + '\n</body>')
        print('OK: rm-dashboard.js підключено перед </body>!')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
else:
    print('rm-dashboard.js вже підключено в index.html')

print('\nГотово! Запускай npm start')