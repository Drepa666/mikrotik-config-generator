with open('topology-visual.js', 'r', encoding='utf-8') as f:
    c = f.read()

import re
# Знаходимо де саме знаходиться topo-close
idx = c.find('topo-close')
print('=== Контекст topo-close ===')
print(repr(c[idx-100:idx+200]))