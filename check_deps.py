# -*- coding: utf-8 -*-
import subprocess, os, json

# Перевіряємо доступні модулі
print('=== node_modules ===')
modules = ['ssh2', 'axios', 'node-fetch']
for m in modules:
    exists = os.path.exists(os.path.join('node_modules', m))
    print(f'  {m}: {"YES ✅" if exists else "NO ❌"}')

# Читаємо package.json dependencies
with open('package.json', 'r', encoding='utf-8') as f:
    pkg = json.load(f)

print('\n=== dependencies ===')
for k, v in pkg.get('dependencies', {}).items():
    print(f'  {k}: {v}')

print('\n=== devDependencies ===')
for k, v in pkg.get('devDependencies', {}).items():
    print(f'  {k}: {v}')

# Перевіряємо як renderer викликає proxy
print('\n=== Як renderer викликає proxy ===')
with open('router-manager.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, l in enumerate(lines, 1):
    if 'localhost:8888' in l or 'proxy' in l.lower() or \
       'fetch(' in l or '8888' in l:
        print(f'  {i}: {l.rstrip()[:120]}')