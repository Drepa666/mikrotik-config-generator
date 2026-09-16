# -*- coding: utf-8 -*-
import subprocess

with open('diff-apply.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Фіксуємо лапки в onclick
fixes = [
    ("onclick=\"runDiffAI('analyze')\"", 'onclick="runDiffAI(\'analyze\')"'),
    ("onclick=\"runDiffAI('risk')\"",    'onclick="runDiffAI(\'risk\')"'),
    ("onclick=\"runDiffAI('apply')\"",   'onclick="runDiffAI(\'apply\')"'),
    ("onclick=\"runDiffAI('custom')\"",  'onclick="runDiffAI(\'custom\')"'),
]

# Замінюємо всі варіанти onclick з одинарними лапками всередині подвійних
import re

# Знаходимо рядки з onclick="runDiffAI(...)"
def fix_onclick(m):
    inner = m.group(1)
    return "onclick=\"runDiffAI(\\'" + inner + "\\')\""

content = re.sub(r'''onclick="runDiffAI\('(\w+)'\)"''', fix_onclick, content)

# Також фіксуємо showAIChat
content = content.replace(
    'onclick="showAIChat()"',
    "onclick=\"showAIChat()\""
)

# Перевіряємо рядок 331
lines = content.split('\n')
print('Рядок 329-333:')
for i, l in enumerate(lines[328:334], 329):
    print(f'{i}: {l[:120]}')

with open('diff-apply.js', 'w', encoding='utf-8') as f:
    f.write(content)

r = subprocess.run(['node', '--check', 'diff-apply.js'],
                   capture_output=True, text=True)
print('Синтаксис:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:300])