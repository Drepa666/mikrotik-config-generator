import os
import subprocess
import sys

BASE = os.path.dirname(os.path.abspath(__file__))

print('=' * 55)
print(' ДІАГНОСТИКА MikroTik Config Generator')
print('=' * 55)

# 1. Перевірка файлів
print('\n[1] ФАЙЛИ:')
files = {
    'index.html':            'Головний файл',
    'proxy.py':              'Сервер',
    'Start.bat':             'Лаунчер',
    'sw.js':                 'Service Worker',
    'models-extended.js':    'Розширені моделі',
    'ui-overrides.js':       'UI оверрайди',
    'manifest.webmanifest':  'PWA маніфест',
    'network-tools.js':      'Мережеві інструменти',
}

for fname, desc in files.items():
    fpath = os.path.join(BASE, fname)
    if os.path.isfile(fpath):
        size = os.path.getsize(fpath)
        if size < 10:
            print(f'  ⚠️  {fname:30s} {size:>8} байт  ← ПОРОЖНІЙ!')
        else:
            print(f'  ✅  {fname:30s} {size:>8} байт')
    else:
        print(f'  ❌  {fname:30s}  НЕ ЗНАЙДЕНО!')

# 2. Бекапи
print('\n[2] БЕКАПИ:')
backups = [f for f in os.listdir(BASE) if 'backup' in f.lower() or f.endswith('.bak')]
if backups:
    for b in sorted(backups):
        size = os.path.getsize(os.path.join(BASE, b))
        print(f'  📦  {b:45s} {size:>8} байт')
else:
    print('  ⚠️  Бекапів не знайдено')

# 3. JS файли на синтаксичні помилки
print('\n[3] СИНТАКСИС JS:')
js_files = ['models-extended.js', 'ui-overrides.js', 'sw.js', 'network-tools.js']
for jf in js_files:
    fpath = os.path.join(BASE, jf)
    if not os.path.isfile(fpath):
        print(f'  ❌  {jf} — не знайдено')
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    opens  = content.count('{')
    closes = content.count('}')
    lines  = content.count('\n')
    balance = opens - closes
    if balance != 0:
        print(f'  ❌  {jf:30s} дужки: {{={opens} }}={closes} РІЗНИЦЯ={balance}!')
    elif len(content) < 50:
        print(f'  ⚠️  {jf:30s} — ПОРОЖНІЙ або занадто малий!')
    else:
        print(f'  ✅  {jf:30s} {lines} рядків, дужки OK')

# 4. Перевірка index.html
print('\n[4] INDEX.HTML:')
ipath = os.path.join(BASE, 'index.html')
if os.path.isfile(ipath):
    with open(ipath, 'r', encoding='utf-8') as f:
        idx = f.read()
    checks = {
        'window.MODELS':          'window.MODELS оголошено',
        'models-extended.js':     'models-extended підключено',
        'ui-overrides.js':        'ui-overrides підключено',
        'sw.js':                  'Service Worker підключено',
        'network-tools.js':       'network-tools підключено',
        'proxy.py':               'proxy згадується',
    }
    for key, desc in checks.items():
        found = key in idx
        icon = '✅' if found else '❌'
        print(f'  {icon}  {desc}')
    
    # Порядок скриптів
    idx_ext    = idx.find('models-extended.js')
    idx_ui     = idx.find('ui-overrides.js')
    idx_inline = idx.rfind('</script>')
    print(f'\n  Порядок підключення:')
    print(f'    models-extended.js на позиції: {idx_ext}')
    print(f'    ui-overrides.js    на позиції: {idx_ui}')
    print(f'    Останній </script> на позиції: {idx_inline}')
    if idx_ext > 0 and idx_ext < idx_inline:
        print(f'  ❌  models-extended.js підключено РАНІШЕ ніж inline скрипт!')
        print(f'      Треба перенести в кінець файлу (після </script>)')
    elif idx_ext > idx_inline:
        print(f'  ✅  Порядок скриптів правильний')

# 5. Start.bat
print('\n[5] START.BAT:')
bpath = os.path.join(BASE, 'Start.bat')
if os.path.isfile(bpath):
    with open(bpath, 'r', encoding='utf-8', errors='ignore') as f:
        bat = f.read()
    print(f'  Розмір: {len(bat)} байт')
    checks_bat = {
        'python proxy.py':    'запускає proxy.py',
        'localhost:8080':     'відкриває правильний порт',
        'netstat':            'чекає порт (netstat)',
        'start ""':           'відкриває браузер',
        'timeout':            'має затримку',
    }
    for key, desc in checks_bat.items():
        icon = '✅' if key.lower() in bat.lower() else '❌'
        print(f'  {icon}  {desc}')
else:
    print('  ❌  Start.bat не знайдено!')

# 6. Python
print('\n[6] PYTHON:')
print(f'  Версія: {sys.version}')
print(f'  Шлях:   {sys.executable}')
try:
    import paramiko
    print('  ✅  paramiko встановлено (SSH OK)')
except ImportError:
    print('  ⚠️  paramiko не встановлено (SSH недоступний)')

# 7. Порти
print('\n[7] ПОРТИ:')
result = subprocess.run('netstat -an', shell=True, capture_output=True, text=True)
for port in ['8080', '8888']:
    if f':{port}' in result.stdout and 'LISTENING' in result.stdout:
        print(f'  ✅  Порт {port} — СЛУХАЄ')
    else:
        print(f'  ❌  Порт {port} — не активний (сервер не запущений?)')

# 8. Порівняння з бекапом
print('\n[8] ПОРІВНЯННЯ З БЕКАПОМ:')
backup_files = sorted([
    f for f in os.listdir(BASE)
    if 'backup' in f.lower() and f.endswith('.html')
], reverse=True)

if backup_files:
    latest = backup_files[0]
    print(f'  Найновіший бекап: {latest}')
    bsize = os.path.getsize(os.path.join(BASE, latest))
    isize = os.path.getsize(os.path.join(BASE, 'index.html'))
    print(f'  index.html: {isize} байт')
    print(f'  {latest}: {bsize} байт')
    diff = isize - bsize
    if abs(diff) > 5000:
        print(f'  ⚠️  Різниця {abs(diff)} байт — суттєво відрізняються!')
        if bsize > isize:
            print(f'  💡 Бекап БІЛЬШИЙ — можливо він містить більше функцій')
    else:
        print(f'  ✅  Розмір схожий (різниця {abs(diff)} байт)')
else:
    print('  ⚠️  HTML бекапів не знайдено')

print('\n' + '=' * 55)
print(' ГОТОВО! Виправ позначені ❌ проблеми')
print('=' * 55)