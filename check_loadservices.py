with open('terminal.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Знаходимо функцію loadServices
start = -1
for i, l in enumerate(lines, 1):
    if 'function loadServices()' in l:
        start = i
        break

print(f'=== loadServices починається на рядку {start} ===')
for i, l in enumerate(lines[start-1:start+60], start):
    print(f'{i}: {l.rstrip()}')
