import shutil, sys, os

if len(sys.argv) < 2:
    # Показуємо доступні бекапи
    backups = sorted(os.listdir('backups')) if os.path.isdir('backups') else []
    print('Доступні бекапи:')
    for b in backups[-10:]:
        print('  ' + b)
    print('\nВикористання: python restore.py TIMESTAMP')
    sys.exit(0)

timestamp = sys.argv[1]
backup_dir = 'backups/' + timestamp

if not os.path.isdir(backup_dir):
    print('Бекап не знайдено: ' + backup_dir)
    sys.exit(1)

for f in os.listdir(backup_dir):
    shutil.copy(backup_dir + '/' + f, f)
    print('Відновлено: ' + f)

print('\nВідкат до ' + timestamp + ' виконано!')