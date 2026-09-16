# -*- coding: utf-8 -*-
import subprocess

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

print(f'Розмір: {len(content)}')

# ── 1. Показуємо де btn-diff-apply-open і що навколо ──
idx = content.find('btn-diff-apply-open')
print(f'\nbtn-diff-apply-open @ {idx}:')
print(content[max(0,idx-300):idx+200])

# ── 2. Показуємо структуру навколо btn-versions ──
for needle in ['btn-versions', 'btn-mass-deploy', 'btn-audit', 'btn-pdf', 'btn-qr', 'btn-backup']:
    idx2 = content.find(needle)
    if idx2 > 0:
        print(f'\n"{needle}" @ {idx2}:')
        print(content[max(0,idx2-50):idx2+150])
        print('---')

# ── 3. Показуємо DIFF VIEWER блок ──
idx3 = content.find('/* DIFF VIEWER */')
print(f'\nDIFF VIEWER @ {idx3}:')
print(content[idx3:idx3+100])
print('...')
# Знаходимо кінець цього скрипт блоку
end_script = content.find('</script>', idx3)
print(f'Кінець скрипту @ {end_script}:')
print(content[max(0,end_script-100):end_script+20])