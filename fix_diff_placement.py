# -*- coding: utf-8 -*-
import subprocess

for enc in ['utf-8', 'utf-8-sig', 'cp1251']:
    try:
        with open('index.html', 'r', encoding=enc) as f:
            content = f.read()
        if 'Масовий Deploy' in content or 'Deploy' in content:
            print(f'Encoding: {enc}')
            break
    except: continue

# ── 1. Додаємо кнопку поруч з "Масовий Deploy" ──
markers = [
    'Масовий Deploy</button>',
    'mass-deploy">',
    'btn-mass-deploy',
]

insert_after = None
for m in markers:
    idx = content.find(m)
    if idx > 0:
        insert_after = content.find('>', idx) + 1
        # Шукаємо кінець кнопки
        end_btn = content.find('</button>', idx)
        if end_btn > 0:
            insert_after = end_btn + 9
        print(f'Знайдено "{m}" @ {idx}, вставляємо після {insert_after}')
        print(content[idx:insert_after])
        break

if insert_after:
    DIFF_BTN = ('\n    <button id="btn-diff-apply-open" '
        'onclick="openDiffApplyModal()" '
        'style="background:linear-gradient(135deg,#5b4efc,#8b5efc);'
        'color:#fff;border:none;border-radius:8px;padding:8px 18px;'
        'font-size:13px;font-weight:600;cursor:pointer;">'
        '&#128269; Diff &amp; Apply'
        '</button>')
    content = content[:insert_after] + DIFF_BTN + content[insert_after:]
    print('OK: кнопка додана після Масовий Deploy ✅')

# ── 2. Видаляємо старий "DIFF .RSC ФАЙЛІВ" розділ ──
# Знаходимо весь старий блок
old_markers = ['DIFF .RSC', 'diff-text-a', 'diff-file-a']
for m in old_markers:
    idx = content.find(m)
    if idx < 0: continue
    
    # Йдемо назад до батьківського section/div
    section_start = -1
    for tag in ['<section', '<div class="section', '<div id="tab-diff', '<div class="tab']:
        si = content.rfind(tag, 0, idx)
        if si > 0 and idx - si < 3000:
            section_start = si
            print(f'Початок секції: {si} по "{tag}"')
            break
    
    if section_start < 0:
        # Шукаємо <div за 2000 символів до маркера
        si = content.rfind('<div', 0, idx - 500)
        if si > 0:
            section_start = si
    
    if section_start < 0:
        print(f'Не знайдено початок секції для {m}')
        continue
    
    # Знаходимо кінець секції
    depth = 0; found = False; end = section_start
    for i in range(section_start, min(len(content), section_start + 20000)):
        if content[i:i+4] == '<div': depth += 1
        elif content[i:i+6] == '</div': depth -= 1
        if found and depth <= 0:
            end = i + 6
            break
        if not found and depth > 0: found = True
    
    if end > section_start + 100:
        print(f'Видаляємо старий diff: {section_start}-{end} ({end-section_start} символів)')
        print('Початок:', content[section_start:section_start+80])
        print('Кінець:', content[end-80:end])
        content = content[:section_start] + content[end:]
        print('OK: старий diff видалено ✅')
        break

# ── 3. Видаляємо стару велику зелену кнопку "Diff & Apply" ──
old_btn = content.find('id="btn-open-diff-apply"')
if old_btn > 0:
    # Знаходимо весь div з кнопкою
    div_start = content.rfind('<div', 0, old_btn)
    btn_end   = content.find('</div>', old_btn) + 6
    if div_start > 0 and btn_end > 0:
        content = content[:div_start] + content[btn_end:]
        print('OK: стара велика кнопка видалена ✅')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print(f'Розмір: {len(content)}')
print('Done ✅')