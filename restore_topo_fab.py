with open('topology-visual.js', 'r', encoding='utf-8') as f:
    c = f.read()

# Перевіряємо чи є FAB
print('btn-topo-fab є:', 'btn-topo-fab' in c)
print('document.body.appendChild(fab):', 'document.body.appendChild(fab)' in c)

# Знаходимо кінець файлу — де має бути FAB
print('\n=== Останні 500 символів ===')
print(repr(c[-500:]))