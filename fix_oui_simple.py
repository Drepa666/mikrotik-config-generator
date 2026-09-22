# -*- coding: utf-8 -*-
import subprocess

# ── Відновлення з git ──
print('Відновлення...')
for fname in ['topology-extend.js', 'topology-visual.js']:
    r = subprocess.run(
        ['git', 'checkout', 'HEAD', '--', fname],
        capture_output=True, text=True
    )
    print(f'  {fname}: {"OK ✅" if r.returncode==0 else r.stderr.strip()}')

# Перевіряємо синтаксис відновлених
for fname in ['topology-extend.js', 'topology-visual.js']:
    r = subprocess.run(['node','--check', fname],
                       capture_output=True, text=True)
    if r.returncode != 0:
        print(f'❌ {fname} навіть з git broken: {r.stderr[:100]}')
        exit(1)
    print(f'  {fname} з git: OK ✅')

# ════════════════════════════════════
# 1. topology-extend.js
#    ХІРУРГІЧНА вставка — 1 рядок після clean=
# ════════════════════════════════════
with open('topology-extend.js', 'r', encoding='utf-8') as f:
    te = f.read()

te = te.replace('\r\n', '\n')

# Шукаємо унікальний рядок всередині getMacVendor
FIND_TE = "    var clean = mac.toUpperCase().replace(/-/g, ':');\n    var oui3"
ADD_TE  = (
    "    var clean = mac.toUpperCase().replace(/-/g, ':');\n"
    "    if (window.OUILookup) {\n"
    "      var _ouiR = OUILookup.lookup(clean);\n"
    "      if (_ouiR && _ouiR !== 'Unknown') return _ouiR;\n"
    "    }\n"
    "    var oui3"
)

if FIND_TE in te:
    te = te.replace(FIND_TE, ADD_TE, 1)
    print('OK: topology-extend OUILookup вставлено ✅')
else:
    # Показуємо що є після 'var clean ='
    idx = te.find("var clean = mac.toUpperCase")
    if idx > 0:
        print(f'WARN: не знайдено точний текст. Після "var clean": {repr(te[idx:idx+100])}')
    else:
        print('WARN: var clean не знайдено взагалі')

with open('topology-extend.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(te)

r1 = subprocess.run(['node','--check','topology-extend.js'],
                    capture_output=True, text=True)
print('topology-extend:', 'OK ✅' if r1.returncode==0 else '❌\n'+r1.stderr[:200])

# ════════════════════════════════════
# 2. topology-visual.js
#    ХІРУРГІЧНА вставка в lookupVendor
# ════════════════════════════════════
with open('topology-visual.js', 'r', encoding='utf-8') as f:
    tv = f.read()

tv = tv.replace('\r\n', '\n')

# Знаходимо унікальний блок всередині lookupVendor
# "if (node.vendor) {" — є тільки в lookupVendor
FIND_TV = (
    "    if (node.vendor) {\n"
    "      vendorEl.value = node.vendor;\n"
    "      vendorEl.style.color = '#5fd0a5';\n"
    "      return;\n"
    "    }"
)
ADD_TV = (
    "    /* OUILookup — перевіряємо vendor */\n"
    "    if (!node.vendor || node.vendor === 'Unknown' ||\n"
    "        node.vendor === '\u041d\u0435\u0432\u0456\u0434\u043e\u043c\u0438\u0439') {\n"
    "      if (window.OUILookup && node.mac) {\n"
    "        var _mac = (node.mac||'').toUpperCase().replace(/-/g,':');\n"
    "        var _ov  = OUILookup.lookup(_mac);\n"
    "        if (_ov && _ov !== 'Unknown') node.vendor = _ov;\n"
    "      }\n"
    "    }\n"
    "    if (node.vendor && node.vendor !== 'Unknown') {\n"
    "      vendorEl.value = node.vendor;\n"
    "      vendorEl.style.color = '#5fd0a5';\n"
    "      return;\n"
    "    }"
)

if FIND_TV in tv:
    tv = tv.replace(FIND_TV, ADD_TV, 1)
    print('OK: topology-visual vendor check замінено ✅')
else:
    # Показуємо що є
    idx2 = tv.find('if (node.vendor)')
    if idx2 > 0:
        print(f'WARN: не знайдено блок. Є: {repr(tv[idx2:idx2+150])}')
    else:
        print('WARN: if (node.vendor) не знайдено')

# Також додаємо онлайн lookup — шукаємо кінець lookupVendor
# по унікальному рядку що йде після функції
FIND_ONLINE = "var mac = (node.mac || '').toUpperCase().replace(/-/g, ':')"
idx3 = tv.find(FIND_ONLINE)
if idx3 > 0:
    # Знаходимо наступний рядок після цього
    end_line = tv.find('\n', idx3) + 1
    next_chunk = tv[end_line:end_line+80]
    print(f'Після mac=: {repr(next_chunk)}')

    # Шукаємо де закінчується lookupVendor по uniq рядку
    # Зазвичай там є fetch або getMacVendor call
    FIND_END = "    var v = getMacVendor(mac);"
    if FIND_END in tv:
        ADD_ONLINE = (
            "    var v = getMacVendor(mac);\n"
            "    /* Онлайн lookup якщо Unknown */\n"
            "    if ((!v || v === '') && window.OUILookup && OUILookup.lookupOnline) {\n"
            "      vendorEl.value = '\u23f3...';\n"
            "      vendorEl.style.color = '#f0a840';\n"
            "      OUILookup.lookupOnline(mac, function(vendor) {\n"
            "        if (!vendor || vendor === 'Unknown') return;\n"
            "        node.vendor    = vendor;\n"
            "        vendorEl.value = vendor;\n"
            "        vendorEl.style.color = '#5fd0a5';\n"
            "      });\n"
            "      return;\n"
            "    }"
        )
        tv = tv.replace(FIND_END, ADD_ONLINE, 1)
        print('OK: онлайн lookup додано ✅')
    else:
        # Показуємо що є після mac=
        print(f'getMacVendor call: {repr(tv[end_line:end_line+200])}')

with open('topology-visual.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(tv)

r2 = subprocess.run(['node','--check','topology-visual.js'],
                    capture_output=True, text=True)
print('topology-visual:', 'OK ✅' if r2.returncode==0 else '❌\n'+r2.stderr[:200])

# ════════════════════════════════════
# 3. Показуємо що реально в getMacVendor після патчу
# ════════════════════════════════════
with open('topology-extend.js', encoding='utf-8') as f:
    te2 = f.read()
idx_show = te2.find('function getMacVendor')
print(f'\ngetMacVendor після патчу:')
print(te2[idx_show:idx_show+400])

print('\nВсе готово! npm start')
