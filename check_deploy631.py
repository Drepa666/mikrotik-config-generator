with open('deploy.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print('=== Рядки 625-640 ===')
for i, l in enumerate(lines[624:640], 625):
    print(f'{i}: {repr(l[:80])}')