# -*- coding: utf-8 -*-
import json, os

with open('package.json', 'r', encoding='utf-8') as f:
    pkg = json.load(f)

print('=== package.json ===')
print('name:', pkg.get('name'))
print('version:', pkg.get('version'))
print('main:', pkg.get('main'))
print('scripts:', json.dumps(pkg.get('scripts', {}), indent=2))
print('build config:', json.dumps(pkg.get('build', {}), indent=2))

# Чи є electron-builder?
deps = {**pkg.get('dependencies',{}), **pkg.get('devDependencies',{})}
for k in ['electron-builder','electron','electron-packager']:
    print(f'{k}: {"✅ " + deps[k] if k in deps else "❌ немає"}')

# GitHub Actions?
print('\n.github/workflows:', os.path.exists('.github/workflows'))