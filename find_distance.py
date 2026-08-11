with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print('=== Рядки з distance/dist ===')
for i, line in enumerate(lines, 1):
    if 'dist' in line.lower() and ('test' in line or 'parseInt' in line or 'isNaN' in line):
        print(f'Рядок {i:4d}: {line.rstrip()}')