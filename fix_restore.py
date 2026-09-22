# -*- coding: utf-8 -*-
import subprocess

# ════════════════════════════════════
# 1. Відновлюємо обидва файли з git
# ════════════════════════════════════
print('Відновлення з git...')
for fname in ['topology-extend.js', 'topology-visual.js']:
    r = subprocess.run(
        ['git', 'checkout', 'HEAD', '--', fname],
        capture_output=True, text=True
    )
    if r.returncode == 0:
        print(f'OK: {fname} відновлено ✅')
    else:
        # Спробуємо з origin
        r2 = subprocess.run(
            ['git', 'checkout', 'origin/main', '--', fname],
            capture_output=True, text=True
        )
        if r2.returncode == 0:
            print(f'OK: {fname} відновлено з origin ✅')
        else:
            print(f'WARN: {fname} - {r.stderr.strip()}')

# Перевіряємо розміри
import os
for fname in ['topology-extend.js', 'topology-visual.js']:
    size = os.path.getsize(fname)
    with open(fname, encoding='utf-8') as f:
        lines = f.readlines()
    print(f'{fname}: {size} байт, {len(lines)} рядків')

# ════════════════════════════════════
# 2. Перевіряємо синтаксис відновлених файлів
# ════════════════════════════════════
for fname in ['topology-extend.js', 'topology-visual.js']:
    r = subprocess.run(['node', '--check', fname],
                       capture_output=True, text=True)
    print(f'{fname}: {"OK ✅" if r.returncode==0 else "❌ "+r.stderr[:100]}')

# ════════════════════════════════════
# 3. Знаходимо точну структуру IIFE
# ════════════════════════════════════
with open('topology-extend.js', encoding='utf-8') as f:
    te_orig = f.read()

# Знаходимо де ЗАКІНЧУЄТЬСЯ IIFE
iife_end = te_orig.rfind('})();')
fn_idx   = te_orig.find('function getMacVendor')
print(f'\ntopology-extend.js:')
print(f'  Розмір: {len(te_orig)} символів')
print(f'  getMacVendor @ {fn_idx}')
print(f'  IIFE end @ {iife_end}')
print(f'  IIFE structure: ...{repr(te_orig[iife_end-10:iife_end+5])}')

# Знаходимо кінець getMacVendor — але тільки до IIFE end
depth = 0; found = False; fn_end = fn_idx
for i, ch in enumerate(te_orig[fn_idx:iife_end], fn_idx):
    if ch == '{': depth += 1; found = True
    elif ch == '}':
        depth -= 1
        if found and depth == 0:
            fn_end = i + 1
            break

print(f'  getMacVendor кінець @ {fn_end}')
print(f'  Функція: {repr(te_orig[fn_idx:fn_end][:100])}...')
print(f'  Після функції (до IIFE): {repr(te_orig[fn_end:fn_end+20])}')

# ════════════════════════════════════
# 4. Акуратний патч topology-extend.js
#    Замінюємо ТІЛЬКИ тіло функції getMacVendor
# ════════════════════════════════════
NEW_GET_MAC = """function getMacVendor(mac) {
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

te_new = te_orig[:fn_idx] + NEW_GET_MAC + te_orig[fn_end:]

# Перевіряємо баланс
ob = te_new.count('{')
cb = te_new.count('}')
print(f'\nПісля патчу topology-extend: {{ = {ob}, }} = {cb}, різниця = {ob-cb}')

with open('topology-extend.js', 'w', encoding='utf-8') as f:
    f.write(te_new)

r1 = subprocess.run(['node','--check','topology-extend.js'],
                    capture_output=True, text=True)
print('topology-extend:', 'OK ✅' if r1.returncode==0 else '❌\n'+r1.stderr[:200])

# ════════════════════════════════════
# 5. Патч topology-visual.js
# ════════════════════════════════════
with open('topology-visual.js', encoding='utf-8') as f:
    tv_orig = f.read()

iife_end2 = tv_orig.rfind('})();')
fn_idx2   = tv_orig.find('function lookupVendor')
print(f'\ntopology-visual.js:')
print(f'  Розмір: {len(tv_orig)} символів')
print(f'  lookupVendor @ {fn_idx2}')
print(f'  IIFE end @ {iife_end2}')

if fn_idx2 < 0:
    print('WARN: lookupVendor не знайдено!')
else:
    depth = 0; found = False; fn_end2 = fn_idx2
    for i, ch in enumerate(tv_orig[fn_idx2:iife_end2], fn_idx2):
        if ch == '{': depth += 1; found = True
        elif ch == '}':
            depth -= 1
            if found and depth == 0:
                fn_end2 = i + 1
                break

    print(f'  lookupVendor кінець @ {fn_end2}')
    print(f'  Після функції: {repr(tv_orig[fn_end2:fn_end2+20])}')

    NEW_LOOKUP = """function lookupVendor(node) {
    var vendorEl = document.getElementById('detail-vendor');
    if (!vendorEl || !node) {
      if (vendorEl) vendorEl.value = '\u2014';
      return;
    }
    /* Vendor вже є */
    if (node.vendor &&
        node.vendor !== 'Unknown' &&
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
    /* 3. \u041e\u043d\u043b\u0430\u0439\u043d lookup */
    vendorEl.value = '\u23f3 \u0412\u0438\u0437\u043d\u0430\u0447\u0430\u0454\u043c\u043e...';
    vendorEl.style.color = '#f0a840';
    if (window.OUILookup && OUILookup.lookupOnline) {
      OUILookup.lookupOnline(mac, function(vendor) {
        node.vendor    = vendor || 'Unknown';
        vendorEl.value = vendor || 'Unknown';
        vendorEl.style.color =
          (vendor && vendor !== 'Unknown') ? '#5fd0a5' : '#4a6070';
      });
    } else {
      vendorEl.value = 'Unknown';
      vendorEl.style.color = '#4a6070';
    }
  }"""

    tv_new = tv_orig[:fn_idx2] + NEW_LOOKUP + tv_orig[fn_end2:]

    ob2 = tv_new.count('{')
    cb2 = tv_new.count('}')
    print(f'Після патчу topology-visual: {{ = {ob2}, }} = {cb2}, різниця = {ob2-cb2}')

    with open('topology-visual.js', 'w', encoding='utf-8') as f:
        f.write(tv_new)

r2 = subprocess.run(['node','--check','topology-visual.js'],
                    capture_output=True, text=True)
print('topology-visual:', 'OK ✅' if r2.returncode==0 else '❌\n'+r2.stderr[:200])

print('\nВсе готово! npm start')