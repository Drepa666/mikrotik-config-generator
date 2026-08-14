lines = open('terminal.js', encoding='utf-8').readlines()
for i, l in enumerate(lines[59:80], 60):
    print(f'{i}: {l}', end='')