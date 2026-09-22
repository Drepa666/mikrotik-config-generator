# -*- coding: utf-8 -*-
import subprocess

# ════════════════════════════════════
# 1. Відновлюємо чисті файли з git
# ════════════════════════════════════
print('Відновлення...')
for fname in ['topology-extend.js', 'topology-visual.js']:
    r = subprocess.run(
        ['git', 'checkout', 'HEAD', '--', fname],
        capture_output=True, text=True
    )
    print(f'  {fname}: {"OK ✅" if r.returncode==0 else "❌ "+r.stderr.strip()}')

# ════════════════════════════════════
# 2. ФІКС topology-extend.js
#    str.replace — точний текст з діагностики
# ════════════════════════════════════
with open('topology-extend.js', 'r', encoding='utf-8') as f:
    te = f.read()

# Нормалізуємо line endings
te = te.replace('\r\n', '\n')

# Точний текст оригінальної функції (з діагностики)
OLD_GET_MAC = (
    "function getMacVendor(mac) {\n"
    "    if (!mac) return '';\n"
    "    var clean = mac.toUpperCase().replace(/-/g, ':');\n"
    "    var oui3  = clean.slice(0, 8);\n"
    "    var oui2  = clean.slice(0, 5);\n"
    "\n"
    "    if (_vendorCache[oui3]) return _vendorCache[oui3];\n"
    "    if (MAC_OUI[oui3]) { _vendorCache[oui3] = MAC_OUI[oui3]; return MAC_OUI[oui3]; }\n"
    "    if (MAC_OUI[oui2]) { _vendorCache[oui3] = MAC_OUI[oui2]; return MAC_OUI[oui2]; }\n"
    "    return '';\n"
    "  }"
)

NEW_GET_MAC = (
    "function getMacVendor(mac) {\n"
    "    if (!mac) return '';\n"
    "    var clean = mac.toUpperCase().replace(/-/g, ':');\n"
    "    /* 1. OUILookup — велика база + онлайн кеш */\n"
    "    if (window.OUILookup) {\n"
    "      var ouiResult = OUILookup.lookup(clean);\n"
    "      if (ouiResult && ouiResult !== 'Unknown') return ouiResult;\n"
    "    }\n"
    "    /* 2. Локальна база topology-extend */\n"
    "    var oui3 = clean.slice(0, 8);\n"
    "    var oui2 = clean.slice(0, 5);\n"
    "    if (_vendorCache[oui3]) return _vendorCache[oui3];\n"
    "    if (MAC_OUI[oui3]) { _vendorCache[oui3] = MAC_OUI[oui3]; return MAC_OUI[oui3]; }\n"
    "    if (MAC_OUI[oui2]) { _vendorCache[oui3] = MAC_OUI[oui2]; return MAC_OUI[oui2]; }\n"
    "    return '';\n"
    "  }"
)

if OLD_GET_MAC in te:
    te = te.replace(OLD_GET_MAC, NEW_GET_MAC, 1)
    print('OK: getMacVendor замінено через str.replace ✅')
else:
    # Запасний варіант — шукаємо без порожнього рядка між
    OLD_ALT = OLD_GET_MAC.replace('\n\n', '\n')
    if OLD_ALT in te:
        te = te.replace(OLD_ALT, NEW_GET_MAC, 1)
        print('OK: getMacVendor замінено (alt) ✅')
    else:
        print('WARN: не знайдено точний текст, шукаємо частково...')
        # Останній варіант — шукаємо по сигнатурі
        sig = "function getMacVendor(mac) {"
        if sig in te:
            idx = te.find(sig)
            # Знаходимо кінець вручну — простий підхід
            pos = idx + len(sig)
            depth = 1
            while pos < len(te) and depth > 0:
                if te[pos] == '{':
                    depth += 1
                elif te[pos] == '}':
                    depth -= 1
                pos += 1
            fn_end = pos
            print(f'  Знайдено @ {idx}:{fn_end}')
            print(f'  Текст: {repr(te[idx:fn_end][:80])}...')
            te = te[:idx] + NEW_GET_MAC + te[fn_end:]
            print('OK: getMacVendor замінено (manual scan) ✅')

with open('topology-extend.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(te)

r1 = subprocess.run(['node','--check','topology-extend.js'],
                    capture_output=True, text=True)
print('topology-extend:', 'OK ✅' if r1.returncode==0 else '❌\n'+r1.stderr[:200])

# Перевіряємо що МакВендор тепер один
count = te.count('function getMacVendor')
print(f'  getMacVendor зустрічається {count} раз(и) — має бути 1')

# ════════════════════════════════════
# 3. ФІКС topology-visual.js
# ════════════════════════════════════
with open('topology-visual.js', 'r', encoding='utf-8') as f:
    tv = f.read()

tv = tv.replace('\r\n', '\n')

# Знаходимо lookupVendor через простий ручний скан
sig2 = 'function lookupVendor('
if sig2 not in tv:
    print('WARN: lookupVendor не знайдено')
else:
    idx2 = tv.find(sig2)
    # Йдемо до першої { (відкриття функції)
    pos2 = idx2
    while pos2 < len(tv) and tv[pos2] != '{':
        pos2 += 1
    # Тепер рахуємо дужки
    depth2 = 0
    fn_end2 = pos2
    while fn_end2 < len(tv):
        if tv[fn_end2] == '{':
            depth2 += 1
        elif tv[fn_end2] == '}':
            depth2 -= 1
            if depth2 == 0:
                fn_end2 += 1
                break
        fn_end2 += 1

    print(f'lookupVendor: [{idx2}:{fn_end2}]')
    print(f'  Знайдено: {repr(tv[idx2:idx2+50])}...')
    print(f'  Закінчення: {repr(tv[fn_end2-20:fn_end2+5])}')
    print(f'  Після функції: {repr(tv[fn_end2:fn_end2+30])}')

    NEW_LOOKUP = (
        "function lookupVendor(node) {\n"
        "    var vendorEl = document.getElementById('detail-vendor');\n"
        "    if (!vendorEl || !node) {\n"
        "      if (vendorEl) vendorEl.value = '\u2014';\n"
        "      return;\n"
        "    }\n"
        "    /* Vendor вже є в node */\n"
        "    if (node.vendor &&\n"
        "        node.vendor !== 'Unknown' &&\n"
        "        node.vendor !== '\u041d\u0435\u0432\u0456\u0434\u043e\u043c\u0438\u0439') {\n"
        "      vendorEl.value = node.vendor;\n"
        "      vendorEl.style.color = '#5fd0a5';\n"
        "      return;\n"
        "    }\n"
        "    var mac = (node.mac || '').toUpperCase().replace(/-/g, ':');\n"
        "    if (!mac) { vendorEl.value = '\u2014'; return; }\n"
        "    /* 1. OUILookup локально */\n"
        "    if (window.OUILookup) {\n"
        "      var localV = OUILookup.lookup(mac);\n"
        "      if (localV && localV !== 'Unknown') {\n"
        "        node.vendor    = localV;\n"
        "        vendorEl.value = localV;\n"
        "        vendorEl.style.color = '#5fd0a5';\n"
        "        return;\n"
        "      }\n"
        "    }\n"
        "    /* 2. getMacVendor */\n"
        "    if (typeof getMacVendor === 'function') {\n"
        "      var lv = getMacVendor(mac);\n"
        "      if (lv) {\n"
        "        node.vendor    = lv;\n"
        "        vendorEl.value = lv;\n"
        "        vendorEl.style.color = '#5fd0a5';\n"
        "        return;\n"
        "      }\n"
        "    }\n"
        "    /* 3. \u041e\u043d\u043b\u0430\u0439\u043d */\n"
        "    vendorEl.value = '\u23f3 \u0412\u0438\u0437\u043d\u0430\u0447\u0430\u0454\u043c\u043e...';\n"
        "    vendorEl.style.color = '#f0a840';\n"
        "    if (window.OUILookup && OUILookup.lookupOnline) {\n"
        "      OUILookup.lookupOnline(mac, function(vendor) {\n"
        "        node.vendor    = vendor || 'Unknown';\n"
        "        vendorEl.value = vendor || 'Unknown';\n"
        "        vendorEl.style.color =\n"
        "          (vendor && vendor !== 'Unknown') ? '#5fd0a5' : '#4a6070';\n"
        "      });\n"
        "    } else {\n"
        "      vendorEl.value = 'Unknown';\n"
        "      vendorEl.style.color = '#4a6070';\n"
        "    }\n"
        "  }"
    )

    tv_new = tv[:idx2] + NEW_LOOKUP + tv[fn_end2:]

    # Перевіряємо що не дублюємо
    count2 = tv_new.count('function lookupVendor')
    print(f'  lookupVendor зустрічається {count2} раз(и) — має бути 1')

    with open('topology-visual.js', 'w', encoding='utf-8', newline='\n') as f:
        f.write(tv_new)

r2 = subprocess.run(['node','--check','topology-visual.js'],
                    capture_output=True, text=True)
print('topology-visual:', 'OK ✅' if r2.returncode==0 else '❌\n'+r2.stderr[:200])

print('\nВсе готово! npm start')