# -*- coding: utf-8 -*-
with open('router-manager.js', 'r', encoding='utf-8') as f:
    rm = f.read()

# Перевіряємо синтаксис — рахуємо дужки
opens  = rm.count('{')
closes = rm.count('}')
print(f'Дужок {{: {opens}')
print(f'Дужок }}: {closes}')
if opens != closes:
    print(f'ПОМИЛКА: різниця = {opens - closes}')
else:
    print('OK: дужки збалансовані')

# Перевіряємо чи є openManager
for fn in ['openManager', 'closeManager', 'renderSidebar', 'renderContent', 'addRouter']:
    print(f'{"OK" if fn in rm else "НЕМАЄ"}: {fn}')