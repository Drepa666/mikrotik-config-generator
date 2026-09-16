# -*- coding: utf-8 -*-
import subprocess, re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

print(f'Розмір до: {len(content)}')

# Знаходимо старий diff блок — шукаємо по заголовку
markers = [
    'DIFF .RSC ФАЙЛІВ',
    'DIFF RSC',
    'renderDiff(',
    'file-a-content',
    'file-b-content',
    'diff-rsc',
]

for marker in markers:
    idx = content.find(marker)
    if idx > 0:
        print(f'Знайдено "{marker}" @ {idx}')
        print(content[max(0,idx-200):idx+100])
        print('---')
        break

# Шукаємо секцію з id або class що містить старий diff
# Зазвичай це div з id="diff-section" або схожим
patterns = [
    r'<div[^>]*id=["\']diff-section["\'][^>]*>.*?</div>\s*(?:<!--[^>]*-->)?',
    r'<section[^>]*diff[^>]*>.*?</section>',
    r'<div[^>]*class=["\'][^"\']*diff-rsc[^"\']*["\'][^>]*>.*?</div>',
]

# Знаходимо точну позицію старого diff
# Шукаємо по тексту "DIFF .RSC ФАЙЛІВ"
idx = content.find('DIFF .RSC ФАЙЛІВ')
if idx < 0:
    idx = content.find('DIFF RSC')
if idx < 0:
    idx = content.find('Порівняння .rsc')

if idx > 0:
    # Знаходимо початок батьківського div
    # Йдемо назад щоб знайти <div
    start = content.rfind('<div', 0, idx)
    # Знаходимо кінець всього блоку
    depth = 0; found = False; end = start
    for i in range(start, min(len(content), start + 50000)):
        if content[i:i+4] == '<div': depth += 1
        elif content[i:i+6] == '</div': depth -= 1
        if depth == 0 and i > start + 10:
            end = i + 6
            break
    print(f'\nСтарий diff блок: {start}-{end} ({end-start} символів)')
    print('Початок:', content[start:start+100])
    print('Кінець:', content[end-50:end])
    
    # Видаляємо
    content = content[:start] + content[end:]
    print('OK: старий diff видалено ✅')
else:
    print('Старий diff не знайдено по тексту, шукаємо по структурі...')
    # Шукаємо renderDiff в index.html
    idx2 = content.find('renderDiff(')
    if idx2 > 0:
        print(f'renderDiff @ {idx2}:')
        print(content[max(0,idx2-300):idx2+200])

print(f'Розмір після: {len(content)}')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Збережено ✅')