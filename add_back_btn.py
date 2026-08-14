with open('topology-visual.js', 'r', encoding='utf-8') as f:
    c = f.read()

# Знаходимо кнопку закрити і додаємо перед нею кнопку Назад
OLD = "'<button id=\"topo-close\" style=\"background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:5px 10px;border-radius:5px;cursor:pointer;font-size:12px;\">\u2715</button>' +"

NEW = ("'<button id=\"topo-back\" style=\"background:transparent;border:1px solid #2a3b48;"
       "color:#8ea3b0;padding:5px 12px;border-radius:5px;cursor:pointer;font-size:12px;\">"
       "\u2190 Головне меню</button>' +"
       "\n    '<button id=\"topo-close\" style=\"background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:5px 10px;border-radius:5px;cursor:pointer;font-size:12px;\">\u2715</button>' +")

if OLD in c:
    c = c.replace(OLD, NEW)
    print('OK: кнопка Назад додана!')
else:
    print('WARN: шукаємо інший варіант...')
    import re
    c = re.sub(
        r"(id=\\\"topo-close\\\"[^']+'\u2715</button>')",
        r"'<button id=\"topo-back\" style=\"background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:5px 12px;border-radius:5px;cursor:pointer;font-size:12px;\">\u2190 Головне меню</button>' +\n    \1",
        c
    )
    print('OK через regex!')

# Додаємо обробник для кнопки Назад
OLD2 = "  document.getElementById('topo-close').addEventListener('click', function() {"
NEW2 = """  /* Кнопка Назад */
  var topoBack = document.getElementById('topo-back');
  if (topoBack) {
    topoBack.addEventListener('click', function() {
      modal.style.display = 'none';
      clearInterval(liveTimer);
      /* Скролимо вгору до головного меню */
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  document.getElementById('topo-close').addEventListener('click', function() {"""

if OLD2 in c:
    c = c.replace(OLD2, NEW2)
    print('OK: обробник Назад додано!')

with open('topology-visual.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
print('topology-visual.js збережено!')