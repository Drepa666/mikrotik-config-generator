# -*- coding: utf-8 -*-
import subprocess, os, json

# ════ КРОК 1: Перевіряємо package.json ════
print('=== Перевірка package.json ===')
with open('package.json', 'r', encoding='utf-8') as f:
    pkg = json.load(f)

print(f'Назва: {pkg.get("name")}')
print(f'Версія: {pkg.get("version")}')
print(f'Main: {pkg.get("main")}')

# Перевіряємо чи є electron-builder
has_builder = 'electron-builder' in pkg.get('devDependencies', {}) \
           or 'electron-builder' in pkg.get('dependencies', {})
has_packager = 'electron-packager' in pkg.get('devDependencies', {}) \
            or 'electron-packager' in pkg.get('dependencies', {})

print(f'electron-builder: {"YES" if has_builder else "NO"}')
print(f'electron-packager: {"YES" if has_packager else "NO"}')

# Перевіряємо scripts
scripts = pkg.get('scripts', {})
print(f'\nScripts:')
for k, v in scripts.items():
    print(f'  {k}: {v}')

# ════ КРОК 2: Перевіряємо build конфіг ════
print('\n=== Build конфіг ===')
build_cfg = pkg.get('build', {})
if build_cfg:
    print(json.dumps(build_cfg, indent=2, ensure_ascii=False))
else:
    print('Немає build конфігу в package.json!')

# ════ КРОК 3: Що є в node_modules ════
print('\n=== Доступні build інструменти ===')
tools = ['electron-builder', 'electron-packager']
for tool in tools:
    path = os.path.join('node_modules', '.bin', tool + '.cmd')
    path2 = os.path.join('node_modules', '.bin', tool)
    exists = os.path.exists(path) or os.path.exists(path2)
    print(f'  {tool}: {"YES" if exists else "NO"}')

# ════ КРОК 4: Показуємо що треба зробити ════
print('\n=== Що треба зробити ===')
if not has_builder and not has_packager:
    print('ТРЕБА: npm install --save-dev electron-builder')
    print('ТРЕБА: додати build конфіг в package.json')
elif has_builder:
    print('OK: electron-builder встановлений')
    print('КОМАНДА: npm run build  або  npx electron-builder')
elif has_packager:
    print('OK: electron-packager встановлений')
    print('КОМАНДА: npm run package')