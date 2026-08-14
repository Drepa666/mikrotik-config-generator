with open('terminal.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Знаходимо всі виклики loadServices
print('=== loadServices() зараз ===')
for i, l in enumerate(lines, 1):
    if 'loadServices()' in l:
        print(f'{i}: {l.rstrip()}')

# Знаходимо де є loadScheduler і loadScripts — туди треба додати loadServices
print('\n=== loadScheduler/loadScripts ===')
for i, l in enumerate(lines, 1):
    if 'loadScheduler()' in l or 'loadScripts()' in l:
        print(f'{i}: {l.rstrip()}')