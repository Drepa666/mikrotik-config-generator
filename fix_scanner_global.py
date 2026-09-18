# -*- coding: utf-8 -*-
import subprocess, re

with open('router-manager.js', 'r', encoding='utf-8') as f:
    content = f.read()

# ── 1. Знаходимо і видаляємо всі ns/scanner функції з кінця файлу ──
fns = ['renderNetworkScanner','startNetScan','nsFilter','nsRender',
       'nsStat','nsTypeBadge','nsSignalColor','nsPing','nsAddToRouter']

# Знаходимо початок блоку scanner (коментар або перша функція)
scanner_marker = '/* ══════════════════════════════════════════════════════\n   NETWORK SCANNER'
if scanner_marker not in content:
    scanner_marker = 'function renderNetworkScanner'

idx_scanner = content.find(scanner_marker)
print(f'Scanner block start @ {idx_scanner}')

# Знаходимо кінець — останній window.ns* або кінець файлу
end_scanner = len(content)
# Шукаємо END NETWORK коментар
idx_end = content.find('END NETWORK SCANNER', idx_scanner)
if idx_end > 0:
    end_scanner = content.find('\n', idx_end) + 1
else:
    # Знаходимо останній window.* аліас scanner
    for fn in reversed(fns):
        idx_w = content.rfind('window.' + fn)
        if idx_w > 0:
            end_scanner = content.find('\n', idx_w) + 1
            break

print(f'Scanner block end @ {end_scanner}')
print('Перші 100:', content[idx_scanner:idx_scanner+100])
print('Останні 100:', content[end_scanner-100:end_scanner])

# Витягуємо блок
scanner_block = content[idx_scanner:end_scanner]

# Видаляємо window.* аліаси з блоку (вони будуть непотрібні)
scanner_block = re.sub(r'\nwindow\.\w+\s*=\s*\w+;\n?', '\n', scanner_block)
# Видаляємо window.__rm* заміни якщо є
scanner_block = scanner_block.replace('window.__rmGetActive()', 'getActive()')
scanner_block = scanner_block.replace('window.__rmRestCall(', 'restCall(')
scanner_block = scanner_block.replace('window.__rmState.routers', 'state.routers')
scanner_block = scanner_block.replace('window.__rmSaveRouters()', 'saveRouters()')
scanner_block = scanner_block.replace('window.__rmRenderTabs()', 'renderTabs()')
scanner_block = scanner_block.replace('window.__rmEsc(', 'esc(')

print('\nОчищений блок (перші 200):', scanner_block[:200])

# Видаляємо старий блок з файлу
content = content[:idx_scanner] + content[end_scanner:]

# Також видаляємо window.__rm* аліаси якщо є
content = re.sub(r'\s*/\* ── Глобальні аліаси для scanner функцій ── \*/.*?window\.__rmRenderTabs.*?;\n', 
                 '\n', content, flags=re.DOTALL)

# ── 2. Знаходимо кінець IIFE і вставляємо scanner всередину ──
# Шукаємо })(); в кінці IIFE RouterManager
idx_close = content.rfind('})();')
if idx_close < 0:
    idx_close = content.rfind('})()')
print(f'\nКінець IIFE @ {idx_close}')
print(repr(content[idx_close:idx_close+10]))

# Вставляємо scanner_block перед закриттям IIFE
content = content[:idx_close] + '\n' + scanner_block + '\n' + content[idx_close:]
print('OK: scanner вставлено всередині IIFE ✅')

# ── 3. Виклик в renderContent ──
# Перевіряємо що renderNetworkScanner викликається правильно
content = content.replace(
    'window.renderNetworkScanner && window.renderNetworkScanner(); return;',
    'renderNetworkScanner(); return;'
)

with open('router-manager.js', 'w', encoding='utf-8') as f:
    f.write(content)

r = subprocess.run(['node', '--check', 'router-manager.js'],
                   capture_output=True, text=True)
print('Синтаксис:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:300])