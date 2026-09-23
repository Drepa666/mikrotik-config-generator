# -*- coding: utf-8 -*-
import subprocess, os, glob

# Видаляємо нові temp файли
to_delete = glob.glob('read_*.py') + glob.glob('write_*.py') + \
            glob.glob('move_*.py') + glob.glob('fix_search*.py') + \
            glob.glob('fix_build*.py') + ['build_exe.py', 'analyze_tables.py',
             'read_crud.py', 'cleanup.py', 'cleanup2.py']

for f in to_delete:
    if os.path.exists(f) and f != 'cleanup2.py':
        os.remove(f)
        print(f'OK: {f}')

subprocess.run(['git','add','-A'], capture_output=True)
subprocess.run(['git','commit','-m','chore: cleanup temp scripts'], capture_output=True)
rp = subprocess.run(['git','push','origin','main'], capture_output=True, text=True)
print('push:', rp.stdout.strip() or rp.stderr.strip()[-60:])
print('Done!')