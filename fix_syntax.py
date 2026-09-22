# -*- coding: utf-8 -*-
import subprocess

# ════════════════════════════════════
# 1. Діагностика — що на рядку 78
# ════════════════════════════════════
for fname in ['topology-extend.js', 'topology-visual.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    print(f'\n=== {fname} рядки 70-85 ===')
    for i, l in enumerate(lines[68:88], 69):
        print(f'{i:4d}: {l}', end='')

# ════════════════════════════════════
# 2. Фікс topology-extend.js
#    Знаходимо getMacVendor і замінюємо ОБЕРЕЖНО
# ════════════════════════════════════
with open('topology-extend.js', 'r', encoding='utf-8') as f:
    te = f.read()

# Знаходимо функцію getMacVendor — тільки саму функцію без зайвих дужок
idx = te.find('function getMacVendor')
if idx < 0:
    print('WARN: getMacVendor не знайдено в topology-extend.js')
else:
    # Рахуємо дужки щоб знайти точний кінець функції
    depth = 0; found = False; end = idx
    for i, ch in enumerate(te[idx:], idx):
        if ch == '{': depth += 1; found = True
        elif ch == '}':
            depth -= 1
            if found and depth == 0:
                end = i + 1
                break

    print(f'\ngetMacVendor: [{idx}:{end}]')
    print('Поточна функція:')
    print(repr(te[idx:end]))

    # Перевіряємо що після end немає зайвої }
    after = te[end:end+5]
    print(f'Після функції: {repr(after)}')

    NEW_FN = """function getMacVendor(mac) {
    if (!mac) return '';
    var clean = mac.toUpperCase().replace(/-/g, ':');
    /* 1. OUILookup — велика база + онлайн кеш */
    if (window.OUILookup) {
      var r = OUILookup.lookup(clean);
      if (r && r !== 'Unknown') return r;
    }
    /* 2. Локальна база topology-extend */
    var oui3 = clean.slice(0, 8);
    var oui2 = clean.slice(0, 5);
    if (_vendorCache[oui3]) return _vendorCache[oui3];
    if (MAC_OUI[oui3]) { _vendorCache[oui3] = MAC_OUI[oui3]; return MAC_OUI[oui3]; }
    if (MAC_OUI[oui2]) { _vendorCache[oui3] = MAC_OUI[oui2]; return MAC_OUI[oui2]; }
    return '';
  }"""

    te_new = te[:idx] + NEW_FN + te[end:]

    # Перевіряємо баланс дужок
    open_b  = te_new.count('{')
    close_b = te_new.count('}')
    print(f'Дужки: {{ = {open_b}, }} = {close_b}, різниця = {open_b - close_b}')

    with open('topology-extend.js', 'w', encoding='utf-8') as f:
        f.write(te_new)

r1 = subprocess.run(['node','--check','topology-extend.js'],
                    capture_output=True, text=True)
print('topology-extend:', 'OK ✅' if r1.returncode==0 else '❌\n'+r1.stderr[:300])

# ════════════════════════════════════
# 3. Фікс topology-visual.js
#    lookupVendor — знаходимо ТОЧНИЙ кінець
# ════════════════════════════════════
with open('topology-visual.js', 'r', encoding='utf-8') as f:
    tv = f.read()

idx2 = tv.find('function lookupVendor')
if idx2 < 0:
    print('WARN: lookupVendor не знайдено')
else:
    depth = 0; found = False; end2 = idx2
    for i, ch in enumerate(tv[idx2:], idx2):
        if ch == '{': depth += 1; found = True
        elif ch == '}':
            depth -= 1
            if found and depth == 0:
                end2 = i + 1
                break

    print(f'\nlookupVendor: [{idx2}:{end2}]')
    after2 = tv[end2:end2+5]
    print(f'Після функції: {repr(after2)}')

    NEW_LOOKUP = """function lookupVendor(node) {
    var vendorEl = document.getElementById('detail-vendor');
    if (!vendorEl || !node) {
      if (vendorEl) vendorEl.value = '\u2014';
      return;
    }
    /* Якщо vendor вже є */
    if (node.vendor && node.vendor !== 'Unknown' &&
        node.vendor !== '\u041d\u0435\u0432\u0456\u0434\u043e\u043c\u0438\u0439') {
      vendorEl.value = node.vendor;
      vendorEl.style.color = '#5fd0a5';
      return;
    }
    var mac = (node.mac || '').toUpperCase().replace(/-/g, ':');
    if (!mac) { vendorEl.value = '\u2014'; return; }
    /* 1. OUILookup локально */
    if (window.OUILookup) {
      var local = OUILookup.lookup(mac);
      if (local && local !== 'Unknown') {
        node.vendor    = local;
        vendorEl.value = local;
        vendorEl.style.color = '#5fd0a5';
        return;
      }
    }
    /* 2. getMacVendor з topology-extend */
    if (typeof getMacVendor === 'function') {
      var lv = getMacVendor(mac);
      if (lv) {
        node.vendor    = lv;
        vendorEl.value = lv;
        vendorEl.style.color = '#5fd0a5';
        return;
      }
    }
    /* 3. Онлайн lookup */
    vendorEl.value = '\u23f3 \u0412\u0438\u0437\u043d\u0430\u0447\u0430\u0454\u043c\u043e...';
    vendorEl.style.color = '#f0a840';
    if (window.OUILookup && OUILookup.lookupOnline) {
      OUILookup.lookupOnline(mac, function(vendor) {
        node.vendor    = vendor || 'Unknown';
        vendorEl.value = vendor || 'Unknown';
        vendorEl.style.color = (vendor && vendor !== 'Unknown')
          ? '#5fd0a5' : '#4a6070';
      });
    } else {
      vendorEl.value = 'Unknown';
      vendorEl.style.color = '#4a6070';
    }
  }"""

    tv_new = tv[:idx2] + NEW_LOOKUP + tv[end2:]

    open_b2  = tv_new.count('{')
    close_b2 = tv_new.count('}')
    print(f'Дужки: {{ = {open_b2}, }} = {close_b2}, різниця = {open_b2 - close_b2}')

    with open('topology-visual.js', 'w', encoding='utf-8') as f:
        f.write(tv_new)

r2 = subprocess.run(['node','--check','topology-visual.js'],
                    capture_output=True, text=True)
print('topology-visual:', 'OK ✅' if r2.returncode==0 else '❌\n'+r2.stderr[:300])

# ════════════════════════════════════
# 4. Якщо все ще помилка — відновлюємо з git
# ════════════════════════════════════
if r1.returncode != 0 or r2.returncode != 0:
    print('\nСпроба відновлення через git...')
    for fname in ['topology-extend.js', 'topology-visual.js']:
        res = subprocess.run(
            ['git', 'diff', '--stat', 'HEAD', fname],
            capture_output=True, text=True
        )
        print(f'{fname}: {res.stdout.strip()}')

print('\nВсе готово! npm start')