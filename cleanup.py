# -*- coding: utf-8 -*-
import subprocess, os, glob

# ════ КРОК 1: Показуємо що видалимо ════
print('=== Файли для видалення ===')

# Всі fix_*.py, step*.py, diag*.py файли
patterns = [
    'fix_*.py', 'step*.py', 'diag*.py',
    'debug*.py', 'test*.py', 'patch*.py',
    'cleanup_old*.py',
]

to_delete = []
for pattern in patterns:
    files = glob.glob(pattern)
    for f in files:
        if f != 'cleanup.py':  # не видаляємо себе
            to_delete.append(f)

to_delete.sort()
print(f'Знайдено {len(to_delete)} файлів:')
for f in to_delete:
    size = os.path.getsize(f)
    print(f'  {f} ({size}b)')

# ════ КРОК 2: Підтвердження ════
print(f'\nВидаляємо {len(to_delete)} файлів...')

deleted = []
for f in to_delete:
    try:
        os.remove(f)
        deleted.append(f)
        print(f'  OK: {f}')
    except Exception as e:
        print(f'  FAIL: {f} — {e}')

print(f'\nВидалено: {len(deleted)} файлів')

# ════ КРОК 3: Git — видаляємо з індексу ════
print('\n=== Git cleanup ===')

# Видаляємо з git tracking
for f in deleted:
    subprocess.run(['git','rm','--cached','--force', f],
                   capture_output=True)

# .gitignore — додаємо правило
gitignore_path = '.gitignore'
rules = [
    '# Temp fix scripts',
    'fix_*.py',
    'step*.py',
    'diag*.py',
    'debug*.py',
    'patch*.py',
]

if os.path.exists(gitignore_path):
    with open(gitignore_path, 'r', encoding='utf-8') as f:
        gi = f.read()
else:
    gi = ''

added_rules = []
for rule in rules:
    if rule not in gi:
        added_rules.append(rule)

if added_rules:
    with open(gitignore_path, 'a', encoding='utf-8') as f:
        f.write('\n' + '\n'.join(added_rules) + '\n')
    print(f'OK: .gitignore оновлено ({len(added_rules)} правил)')

# ════ КРОК 4: Фінальний стан ════
print('\n=== Поточний стан папки ===')
all_files = sorted(os.listdir('.'))
js_files  = [f for f in all_files if f.endswith('.js') and not f.startswith('.')]
py_files  = [f for f in all_files if f.endswith('.py')]
misc      = [f for f in all_files if not f.endswith(('.js','.py','.html','.css','.json'))
             and os.path.isfile(f) and not f.startswith('.')]

print(f'JS файлів: {len(js_files)}')
print(f'PY файлів: {len(py_files)}')
for f in py_files:
    print(f'  {f}')
print(f'Інших: {len(misc)}')
for f in misc:
    print(f'  {f}')

# ════ КРОК 5: Git commit + push ════
print('\n=== Git commit ===')

# Перевіряємо rebase
rbase = subprocess.run(['git','status'], capture_output=True, text=True)
if 'rebase' in rbase.stdout.lower():
    subprocess.run(['git','rebase','--abort'], capture_output=True)
    print('OK: rebase abort')

subprocess.run(['git','add','-A'], capture_output=True)

r_commit = subprocess.run(
    ['git','commit','-m','chore: cleanup temp fix scripts, update .gitignore'],
    capture_output=True, text=True
)
print(r_commit.stdout.strip() or r_commit.stderr.strip()[:100])

r_push = subprocess.run(
    ['git','push','origin','main'],
    capture_output=True, text=True
)
print('push:', r_push.stdout.strip() or r_push.stderr.strip()[-80:])

print('\n=== Git log (останні 10) ===')
r_log = subprocess.run(
    ['git','log','--oneline','-10'],
    capture_output=True, text=True
)
print(r_log.stdout)

print('Done!')