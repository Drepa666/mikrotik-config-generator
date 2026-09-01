import shutil, os
from datetime import datetime

# Запускати перед будь-якими змінами
timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
files = ['index.html', 'security-score.js', 'ui-overrides.js',
         'plugins.js', 'wireguard.js', 'port-map.js']

backup_dir = 'backups/' + timestamp
os.makedirs(backup_dir, exist_ok=True)

for f in files:
    if os.path.isfile(f):
        shutil.copy(f, backup_dir + '/' + f)
        print('Backup: ' + f)

print('\nБекап збережено в: ' + backup_dir)
print('Відкат: python restore.py ' + timestamp)