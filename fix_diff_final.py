# -*- coding: utf-8 -*-
import subprocess

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

print(f'Розмір до: {len(content)}')

# ── 1. Видаляємо старий DIFF VIEWER script (131387-188366) ──
diff_start = content.find('/* DIFF VIEWER */')
# Йдемо назад до <script
script_start = content.rfind('<script', 0, diff_start)
# Знаходимо закриваючий </script>
script_end = content.find('</script>', diff_start) + 9
print(f'DIFF VIEWER script: {script_start}-{script_end}')
print('Початок:', content[script_start:script_start+50])
print('Кінець:', content[script_end-30:script_end])

content = content[:script_start] + content[script_end:]
print('OK: DIFF VIEWER script видалено ✅')
print(f'Розмір після видалення script: {len(content)}')

# ── 2. Знаходимо і видаляємо HTML секцію diff (diff-text-a textarea) ──
idx_ta = content.find('diff-text-a')
print(f'\ndiff-text-a @ {idx_ta}')
print(content[max(0,idx_ta-200):idx_ta+100])

# Знаходимо батьківський div/section
section_start = content.rfind('<div', 0, idx_ta - 100)
# Знаходимо кінець після diff-output
idx_do = content.find('id="diff-output"')
if idx_do < 0: idx_do = content.find("id='diff-output'")
section_end = content.find('</div>', idx_do) + 6
print(f'\nHTML секція diff: {section_start}-{section_end}')
print('Початок:', content[section_start:section_start+100])
print('Кінець:', content[section_end-50:section_end])

content = content[:section_start] + content[section_end:]
print('OK: HTML секція diff видалена ✅')
print(f'Розмір після: {len(content)}')

# ── 3. Видаляємо стару btn-diff-apply-open (не там де треба) ──
idx_old_btn = content.find('id="btn-diff-apply-open"')
if idx_old_btn > 0:
    btn_start = content.rfind('<button', 0, idx_old_btn)
    btn_end   = content.find('</button>', idx_old_btn) + 9
    print(f'\nСтара кнопка: {btn_start}-{btn_end}')
    content = content[:btn_start] + content[btn_end:]
    print('OK: стара кнопка видалена ✅')

# ── 4. Знаходимо де додати кнопку ──
# Шукаємо btn-rsc-topo або btn-diff або інші кнопки в btnbar
for needle in ['btn-rsc-topo', 'btn-diff-clear', 'btn-diff"', 'id="btn-diff']:
    idx = content.find(needle)
    if idx > 0:
        print(f'\n"{needle}" @ {idx}:')
        print(content[max(0,idx-300):idx+200])
        break

# Знаходимо де кнопки профілю (Версії, Deploy)
# Шукаємо по btn- паттернах
import re
btns = list(re.finditer(r'id="btn-[^"]*"', content))
print('\nВсі кнопки в index.html:')
for b in btns[:30]:
    print(f'  {b.group()} @ {b.start()}')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print(f'\nФінальний розмір: {len(content)}')