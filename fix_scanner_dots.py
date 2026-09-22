# -*- coding: utf-8 -*-
import subprocess, tempfile, os

# ════ КРОК 1: ЧИТАЄМО ════
with open('ai-agent/switch-scanner.js', 'r', encoding='utf-8') as f:
    sc = f.read()
sc = sc.replace('\r\n', '\n')
print(f'Розмір: {len(sc)} символів')

# ════ КРОК 2: ЗНАХОДИМО ТОЧНИЙ ТЕКСТ ════
# З діагностики знаємо точний блок [12206:12660]
# Шукаємо перший var hasDHCP
idx = sc.find("var hasDHCP = d.source && d.source.includes('DHCP');")
print(f'OLD блок @ {idx}')
if idx < 0:
    print('NOT FOUND — зупиняємось')
    exit(1)

# Знаходимо кінець блоку — рядок після dotTitle
end_idx = sc.find('\n', sc.find('var dotTitle', idx)) + 1
print(f'END @ {end_idx}')
print('OLD:')
print(repr(sc[idx:end_idx]))

# ════ КРОК 3: НОВИЙ БЛОК — тільки ASCII ════
NEW_BLOCK = (
    "var confirmed = d.source && (\n"
    "        d.source.includes('DHCP') ||\n"
    "        d.source.includes('LLDP') ||\n"
    "        d.source.includes('WiFi')\n"
    "      );\n"
    "      var dotColor = !d.online   ? '#e08080'\n"
    "                   : confirmed   ? '#5fd0a5'\n"
    "                   : '#f0a840';\n"
    "      var dotTitle = !d.online   ? 'Offline'\n"
    "                   : confirmed   ? 'Online'\n"
    "                   : 'ARP only';\n"
)

sc_new = sc[:idx] + NEW_BLOCK + sc[end_idx:]

# ════ КРОК 4: ПЕРЕВІРЯЄМО В TEMPFILE ════
with tempfile.NamedTemporaryFile(
        suffix='.js', delete=False, mode='w', encoding='utf-8') as tmp:
    tmp.write(sc_new)
    tmp_name = tmp.name

r = subprocess.run(['node','--check', tmp_name],
                   capture_output=True, text=True)
os.unlink(tmp_name)

if r.returncode != 0:
    print('SYNTAX ERROR в tempfile — не записуємо!')
    print(r.stderr[:300])
    exit(1)

print('Tempfile: OK')

# Перевіряємо що OLD зник, NEW є
assert 'var hasDHCP' not in sc_new, 'OLD hasDHCP залишився!'
assert 'confirmed' in sc_new, 'NEW confirmed не вставлено!'
assert 'Offline' in sc_new, 'ASCII dotTitle не вставлено!'
print('Assertions: OK')

# ════ КРОК 5: ЗАПИСУЄМО ════
with open('ai-agent/switch-scanner.js', 'w', encoding='utf-8') as f:
    f.write(sc_new)

size = os.path.getsize('ai-agent/switch-scanner.js')
print(f'Записано: {size} bytes')

r2 = subprocess.run(['node','--check','ai-agent/switch-scanner.js'],
                    capture_output=True, text=True)
print('switch-scanner:', 'OK' if r2.returncode==0 else '❌\n'+r2.stderr[:200])
if r2.returncode != 0:
    exit(1)

# ════ ФІНАЛЬНА ПЕРЕВІРКА ВСІХ ФАЙЛІВ ════
print('\n=== ФІНАЛ ===')
all_ok = True
for fname in ['ai-agent/switch-scanner.js', 'topology-visual.js',
              'router-manager.js', 'preload.js', 'main.js']:
    sz = os.path.getsize(fname)
    rc = subprocess.run(['node','--check',fname],
                        capture_output=True, text=True).returncode
    ok = rc == 0 and sz > 100
    all_ok = all_ok and ok
    print(f'  {"OK" if ok else "FAIL"} {fname} ({sz}b)')

if all_ok:
    subprocess.run(['git','add','-A'], capture_output=True)
    subprocess.run(['git','commit','-m',
        'fix: dotColor ASCII-only confirmed block, no Cyrillic in JS'],
        capture_output=True)
    rp = subprocess.run(['git','push','origin','main'],
                        capture_output=True, text=True)
    print('push:', rp.stdout.strip() or rp.stderr.strip()[-60:])
    print('\nDone! npm start')
else:
    print('\nFAIL — git checkout working-state -- ai-agent/switch-scanner.js')