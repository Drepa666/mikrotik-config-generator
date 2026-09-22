# -*- coding: utf-8 -*-
import subprocess, tempfile, os

# КРОК 1: Читаємо файл і показуємо рядок 334
with open('ai-agent/switch-scanner.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f'Всього рядків: {len(lines)}')
print(f'Рядок 332-336:')
for i, l in enumerate(lines[330:337], 331):
    print(f'  {i}: {repr(l)}')

# КРОК 2: Знаходимо ВСІ місця з не-ASCII в dotTitle/dotColor блоці
with open('ai-agent/switch-scanner.js', 'r', encoding='utf-8') as f:
    sc = f.read()

print(f'\nРозмір: {len(sc)} bytes')

# Знаходимо точний проблемний блок
# Шукаємо по унікальному рядку що точно є
MARKERS = [
    "var hasDHCP = d.source",
    "var hasLLDP = d.source",
    "var hasWiFi = d.source",
    "var dotColor",
    "var dotTitle",
    "confirmed",
]
for m in MARKERS:
    idx = sc.find(m)
    count = sc.count(m)
    print(f'  "{m}": {count}x @ {idx}')

# Показуємо весь проблемний регіон
idx_start = sc.find("var hasDHCP = d.source")
if idx_start < 0:
    idx_start = sc.find("var confirmed")
if idx_start < 0:
    idx_start = sc.find("var dotColor")

idx_end = sc.find("\n", sc.find("var dotTitle", idx_start)) + 1
print(f'\nБлок [{idx_start}:{idx_end}]:')
print(repr(sc[idx_start:idx_end]))