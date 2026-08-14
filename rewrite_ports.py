with open('terminal.js', 'r', encoding='utf-8') as f:
    c = f.read()

import re

# Знаходимо весь блок портів від початку до кінця
start = c.find("'<div style=\"display:grid;")
if start == -1:
    start = c.find('"<div style=\\"display:grid;')

# Шукаємо по id
start = c.find('"tm-ports-grid"')
# Беремо рядок де починається grid div
lines = c.split('\n')
grid_start_line = -1
grid_end_line = -1

for i, line in enumerate(lines):
    if 'tm-ports-grid' in line:
        grid_start_line = i
    if grid_start_line > 0 and 'tm-reset-ports' in line:
        grid_end_line = i
        break

print(f'Grid start: {grid_start_line}, end: {grid_end_line}')
if grid_start_line > 0:
    for i in range(max(0, grid_start_line-2), min(len(lines), grid_end_line+3)):
        print(f'{i+1}: {lines[i][:80]}')