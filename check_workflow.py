# -*- coding: utf-8 -*-
import os

# Читаємо існуючі workflows
wf_dir = '.github/workflows'
for fname in os.listdir(wf_dir):
    fpath = os.path.join(wf_dir, fname)
    print(f'\n=== {fname} ===')
    with open(fpath, 'r', encoding='utf-8') as f:
        print(f.read())