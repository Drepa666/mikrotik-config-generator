with open('terminal.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print('=== Рядки 820-835 ===')
for i, l in enumerate(lines[819:835], 820):
    print(f'{i}: {l.rstrip()}')