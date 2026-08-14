with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

# Видаляємо три кнопки пресетів [2]
buttons = [
    '<button class="sec" id="pre-home">🏠 Дім</button>',
    '<button class="sec" id="pre-office">🏢 Офіс</button>',
    '<button class="sec" id="pre-lte">📶 LTE</button>',
]

count = 0
for btn in buttons:
    if btn in c:
        c = c.replace(btn, '')
        count += 1
        print(f'OK: видалено {btn[:30]}...')

print(f'Всього видалено: {count}')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(c)
print('index.html збережено!')