with open('network-tools.js', 'r', encoding='utf-8') as f:
    c = f.read()

# Виправляємо ініціалізацію scanData
OLD = "  var scanData = window._ntScanCache || [];"
NEW = "  var scanData = window._ntScanCache || [];\n  var hadCache = scanData.length > 0;"

if OLD in c:
    c = c.replace(OLD, NEW)
    print('OK: hadCache додано!')
else:
    # Якщо попередній патч не застосувався
    OLD_ORIG = "  var scanData = [];"
    NEW_ORIG = "  var scanData = window._ntScanCache || [];\n  var hadCache = (window._ntScanCache||[]).length > 0;"
    if OLD_ORIG in c:
        c = c.replace(OLD_ORIG, NEW_ORIG)
        print('OK: оригінальний рядок замінено!')

# Знаходимо кінець функції renderResults і зберігаємо кеш
OLD2 = "  function renderResults(data) {\n    scanData = data;"
NEW2 = "  function renderResults(data) {\n    scanData = data;\n    window._ntScanCache = data;"

if OLD2 in c:
    c = c.replace(OLD2, NEW2)
    print('OK: кеш зберігається!')
else:
    print('WARN: renderResults не знайдено!')
    # Шукаємо
    idx = c.find('function renderResults')
    if idx > 0:
        print(repr(c[idx:idx+100]))

# Знаходимо кінець renderScan і додаємо відновлення
OLD3 = "  if (filterEl) filterEl.addEventListener('input',  function() { renderResults(scanData); });\n    if (sortEl)   sortEl.addEventListener('change', function() { renderResults(scanData); });"

NEW3 = """  if (filterEl) filterEl.addEventListener('input',  function() { renderResults(scanData); });
    if (sortEl)   sortEl.addEventListener('change', function() { renderResults(scanData); });

    /* ── Відновлення кешу при поверненні на вкладку ── */
    if (scanData.length > 0) {
      renderResults(scanData);
      var st = document.getElementById('scan-status');
      if (st) st.textContent = '\uD83D\uDDC2\uFE0F Збережено: ' + scanData.length + ' пристроїв \u2014 натисни Сканувати щоб оновити';
      var cnt = document.getElementById('scan-count');
      if (cnt) cnt.textContent = scanData.length + ' пристроїв';
    }"""

if OLD3 in c:
    c = c.replace(OLD3, NEW3)
    print('OK: відновлення кешу додано!')
else:
    print('WARN: місце для відновлення не знайдено!')
    idx = c.find("filterEl.addEventListener('input'")
    if idx > 0:
        print(repr(c[idx-10:idx+150]))

with open('network-tools.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
print('\nnetwork-tools.js збережено!')