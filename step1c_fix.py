# -*- coding: utf-8 -*-
import subprocess, tempfile, os

# КРОК 1: Читаємо
with open('ai-agent/switch-scanner.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f'Рядків до: {len(lines)}')

# КРОК 2: Точно знаємо що видаляємо — рядки 334-339 (індекси 333-338)
print('\nВидаляємо:')
for i in range(333, 339):
    print(f'  {i+1}: {repr(lines[i])}')

print('\nЗалишаємо до (333):')
print(f'  {repr(lines[332])}')
print('Залишаємо після (340):')
print(f'  {repr(lines[339])}')

# КРОК 3: Видаляємо рядки 334-339 (індекси 333-338 включно)
new_lines = lines[:333] + lines[339:]
print(f'\nРядків після: {len(new_lines)}')

# Перевіряємо стик
print('\nСтик рядків 331-342 після видалення:')
for i, l in enumerate(new_lines[330:342], 331):
    print(f'  {i}: {repr(l)}')

# КРОК 4: Перевіряємо в tempfile
content = ''.join(new_lines)
with tempfile.NamedTemporaryFile(
        suffix='.js', delete=False, mode='w', encoding='utf-8') as tmp:
    tmp.write(content)
    tmp_name = tmp.name

r = subprocess.run(['node','--check', tmp_name],
                   capture_output=True, text=True)
os.unlink(tmp_name)

if r.returncode != 0:
    print('\nSYNTAX ERROR — не записуємо!')
    print(r.stderr[:300])
    exit(1)

print('\nTempfile: OK')

# КРОК 5: Записуємо
with open('ai-agent/switch-scanner.js', 'w', encoding='utf-8') as f:
    f.write(content)

size = os.path.getsize('ai-agent/switch-scanner.js')
print(f'Записано: {size} bytes')

r2 = subprocess.run(['node','--check','ai-agent/switch-scanner.js'],
                    capture_output=True, text=True)
print('switch-scanner:', 'OK ✅' if r2.returncode==0 else '❌\n'+r2.stderr[:200])

if r2.returncode != 0:
    exit(1)

# КРОК 6: Git
subprocess.run(['git','add','ai-agent/switch-scanner.js'], capture_output=True)
subprocess.run(['git','commit','-m','fix: remove duplicate dotTitle lines 334-339'],
               capture_output=True)
rp = subprocess.run(['git','push','origin','main'], capture_output=True, text=True)
print('push:', rp.stdout.strip() or rp.stderr.strip()[-60:])
print('\nDone! npm start')