# -*- coding: utf-8 -*-
# ТІЛЬКИ ЧИТАЄМО — нічого не змінюємо

import os

# ════ 1. network-scanner.js ════
print('=' * 50)
print('network-scanner.js')
print('=' * 50)
with open('network-scanner.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()
print(f'Рядків: {len(lines)}')

# Де vendor присвоюється
print('\n--- vendor присвоєння ---')
for i, l in enumerate(lines, 1):
    if 'vendor' in l and ('=' in l or ':' in l):
        print(f'  {i}: {repr(l)}')

# Де рендериться рядок таблиці
print('\n--- renderRow / tbody / innerHTML ---')
for i, l in enumerate(lines, 1):
    if 'tbody' in l or 'renderRow' in l or ('td' in l and 'vendor' in l.lower()):
        print(f'  {i}: {repr(l)}')

# Де online/кольори крапок
print('\n--- online / dotColor / крапки ---')
for i, l in enumerate(lines, 1):
    if 'online' in l or 'dotColor' in l or 'e08080' in l or '5fd0a5' in l or 'f0a840' in l:
        print(f'  {i}: {repr(l)}')

# ════ 2. switch-scanner.js ════
print('\n' + '=' * 50)
print('switch-scanner.js')
print('=' * 50)
with open('ai-agent/switch-scanner.js', 'r', encoding='utf-8') as f:
    sc_lines = f.readlines()
print(f'Рядків: {len(sc_lines)}')

# Де OUILookup викликається
print('\n--- OUILookup виклики ---')
for i, l in enumerate(sc_lines, 1):
    if 'OUILookup' in l or 'lookup(' in l or 'getDeviceType' in l:
        print(f'  {i}: {repr(l)}')

# Де vendor присвоюється в devices
print('\n--- vendor в devices ---')
for i, l in enumerate(sc_lines, 1):
    if ('vendor' in l and ('=' in l or ':' in l) and
            'vendorHtml' not in l and 'vendorEl' not in l):
        print(f'  {i}: {repr(l)}')

# oui-lookup.js — що в ньому
print('\n' + '=' * 50)
print('oui-lookup.js — перші 50 рядків')
print('=' * 50)
with open('ai-agent/oui-lookup.js', 'r', encoding='utf-8') as f:
    oui_lines = f.readlines()
print(f'Рядків: {len(oui_lines)}')
for i, l in enumerate(oui_lines[:50], 1):
    print(f'  {i}: {repr(l)}')