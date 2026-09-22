# -*- coding: utf-8 -*-
import subprocess

# Відновлюємо з origin
subprocess.run(['git','fetch','origin'], capture_output=True)
subprocess.run(['git','checkout','origin/main','--','topology-visual.js'], capture_output=True)

r = subprocess.run(['node','--check','topology-visual.js'], capture_output=True, text=True)
print('origin/main:', 'OK' if r.returncode==0 else 'BROKEN')

if r.returncode != 0:
    # Шукаємо останній робочий commit
    log = subprocess.run(
        ['git','log','--oneline','-20','origin/main','--','topology-visual.js'],
        capture_output=True, text=True
    ).stdout
    print('Git log:')
    print(log)

    # Перебираємо commits
    for line in log.strip().split('\n'):
        sha = line.split()[0]
        subprocess.run(['git','checkout', sha,'--','topology-visual.js'], capture_output=True)
        r2 = subprocess.run(['node','--check','topology-visual.js'], capture_output=True, text=True)
        if r2.returncode == 0:
            print(f'OK: знайдено робочий commit {sha}')
            break
        else:
            print(f'  {sha}: broken')

r3 = subprocess.run(['node','--check','topology-visual.js'], capture_output=True, text=True)
print('Фінал:', 'OK' if r3.returncode==0 else r3.stderr[:100])

import os
print('Розмір:', os.path.getsize('topology-visual.js'), 'байт')