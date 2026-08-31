import re, os

print('=' * 60)
print(' МЕГА ПЕРЕВІРКА index.html')
print('=' * 60)

with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

errors  = []
changed = False

def clean_js(js):
    """Видаляємо коментарі та regex літерали"""
    # Багаторядкові /* ... */
    js = re.sub(
        r'/\*.*?\*/',
        lambda m: '\n' * m.group().count('\n'),
        js, flags=re.DOTALL
    )
    # Однорядкові // ...
    js = re.sub(r'//[^\n]*', '', js)
    # Regex літерали /.../ щоб не рахувати { } всередині
    js = re.sub(r'/(?:[^/\\\n]|\\.)+/[gimsuy]*', '""', js)
    return js

# ══════════════════════════════════════
# 1. Script блоки
# ══════════════════════════════════════
print('\n[1] Script блоки...')
blocks = list(re.finditer(
    r'<script(?![^>]*src=)[^>]*>(.*?)</script>',
    c, re.DOTALL
))

for i, b in enumerate(blocks):
    js_raw = b.group(1)
    js     = clean_js(js_raw)
    o      = js.count('{')
    cl     = js.count('}')
    po     = js.count('(')
    pc     = js.count(')')
    ln     = c[:b.start()].count('\n') + 1
    ok_b   = (o == cl)
    ok_p   = (po == pc)
    icon   = '✅' if (ok_b and ok_p) else '❌'

    print(icon + ' Блок ' + str(i+1) +
          ' (рядок ' + str(ln) + '):'
          ' {=' + str(o) + ' }=' + str(cl) +
          ' різниця=' + str(o - cl) +
          '  (=' + str(po) + ' )=' + str(pc) +
          ' різниця=' + str(po - pc))

    if not ok_b:
        errors.append('Блок ' + str(i+1) +
                      ' рядок ' + str(ln) +
                      ': не вистачає ' + str(o - cl) + 'x }')
    if not ok_p:
        errors.append('Блок ' + str(i+1) +
                      ' рядок ' + str(ln) +
                      ': не вистачає ' + str(po - pc) + 'x )')

# ══════════════════════════════════════
# 2. Підключені JS файли
# ══════════════════════════════════════
print('\n[2] Підключені JS файли...')
required = [
    'network-tools.js',
    'models-extended.js',
    'ui-overrides.js',
]

for fname in required:
    cnt = (c.count('src="' + fname + '"') +
           c.count("src='" + fname + "'"))
    if cnt == 0:
        tag = '<script src="' + fname + '"></script>'
        c = c.replace('</body>', tag + '\n</body>', 1)
        print('  ✅ ' + fname + ': додано!')
        changed = True
        errors.append(fname + ' не було — додано')
    elif cnt > 1:
        tag = '<script src="' + fname + '"></script>'
        c = c.replace(tag + '\n', '', cnt - 1)
        c = c.replace(tag, '', cnt - 1)
        c = c.replace('</body>', tag + '\n</body>', 1)
        print('  ✅ ' + fname + ': дублікат прибрано (було ' + str(cnt) + ')')
        changed = True
    else:
        print('  ✅ ' + fname + ': OK')

# sw.js — окрема перевірка
sw_tag_count = (c.count('<script src="sw.js">') +
                c.count("<script src='sw.js'>"))
sw_reg_count = c.count("register('./sw.js')")

if sw_tag_count > 0:
    # Видаляємо src тег — залишаємо тільки register
    tag_sw = '<script src="sw.js"></script>'
    while tag_sw in c:
        c = c.replace(tag_sw + '\n', '', 1)
        c = c.replace(tag_sw, '', 1)
    print('  ✅ sw.js: src тег прибрано, використовується register')
    changed = True
elif sw_reg_count == 0:
    sw_reg = ('<script>\n'
              "if ('serviceWorker' in navigator) {\n"
              "  navigator.serviceWorker.register('./sw.js');\n"
              '}\n'
              '</script>')
    c = c.replace('</body>', sw_reg + '\n</body>', 1)
    print('  ✅ sw.js: реєстрацію додано!')
    changed = True
else:
    print('  ✅ sw.js: OK (register=' + str(sw_reg_count) + ')')

# ══════════════════════════════════════
# 3. JS файли на диску
# ══════════════════════════════════════
print('\n[3] JS файли на диску...')
for fname in required:
    if not os.path.isfile(fname):
        print('  ❌ ' + fname + ': файл відсутній!')
        errors.append(fname + ' відсутній')
        continue
    with open(fname, 'r', encoding='utf-8') as f:
        jc = f.read()
    size   = len(jc)
    jc_cl  = clean_js(jc)
    o      = jc_cl.count('{')
    cl     = jc_cl.count('}')
    if size < 100:
        print('  ❌ ' + fname + ': ПОРОЖНІЙ (' + str(size) + ' байт)!')
        errors.append(fname + ' порожній')
    elif o != cl:
        print('  ❌ ' + fname + ': {=' + str(o) +
              ' }=' + str(cl) + ' різниця=' + str(o - cl))
        errors.append(fname + ' дисбаланс дужок')
    else:
        print('  ✅ ' + fname + ': ' + str(size) + ' байт, дужки OK')

# ══════════════════════════════════════
# 4. window.MODELS
# ══════════════════════════════════════
print('\n[4] window.MODELS...')
if 'window.MODELS' in c:
    print('  ✅ window.MODELS знайдено')
else:
    m = re.search(r'(var|const|let)\s+MODELS\s*=\s*\{', c)
    if m:
        old = m.group()
        new = old.replace('MODELS', 'MODELS=window.MODELS', 1)
        c   = c.replace(old, new, 1)
        print('  ✅ window.MODELS додано!')
        changed = True
    else:
        print('  ⚠️  MODELS не знайдено (можливо в окремому файлі)')

# ══════════════════════════════════════
# 5. Кінець файлу
# ══════════════════════════════════════
print('\n[5] Кінець файлу...')
if '</html>' in c:
    print('  ✅ </html> є')
else:
    print('  ⚠️  </html> відсутній!')

if '\x1a' in c:
    c = c.replace('\x1a', '')
    print('  ✅ Ctrl+Z символ видалено!')
    changed = True
else:
    print('  ✅ Зайвих символів немає')

# ══════════════════════════════════════
# 6. Зберігаємо
# ══════════════════════════════════════
if changed:
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('\n💾 index.html збережено!')
else:
    print('\nℹ️  Змін не було')

# ══════════════════════════════════════
# 7. Підсумок
# ══════════════════════════════════════
print('\n' + '=' * 60)
if errors:
    print('⚠️  Знайдено ' + str(len(errors)) + ' проблем:')
    for e in errors:
        print('   → ' + e)
    print('\n💡 Запусти ще раз для перевірки!')
else:
    print('✅ ВСЕ OK! Проблем не знайдено.')
print('=' * 60)