# -*- coding: utf-8 -*-
import subprocess

# Шукаємо де відкривається diff в index.html та інших файлах
for fname in ['index.html', 'router-manager.js', 'plugins.js', 'ui-overrides.js']:
    try:
        with open(fname, 'r', encoding='utf-8') as f:
            content = f.read()
        for needle in ['diff-apply', 'Diff', 'doDiff', 'da-compare', 'diffApply', 'diff_apply']:
            idx = content.find(needle)
            if idx > 0:
                print(f'\n[{fname}] "{needle}" @ {idx}:')
                print(content[max(0,idx-100):idx+150])
                print('---')
    except: pass