# Додаємо об'єднану кнопку і меню в index.html
with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

MENU_SCRIPT = '''
<script>
(function() {
/* ════════════════════════════════════════
   ОБ'ЄДНАНЕ МЕНЮ — Майстер + Шаблони
════════════════════════════════════════ */

/* Меню */
var menu = document.createElement('div');
menu.id = 'merged-menu';
menu.style.cssText = (
  'display:none;position:fixed;bottom:80px;left:50%;transform:translateX(-50%);' +
  'background:#16212c;border:1px solid #2a3b48;border-radius:12px;' +
  'padding:10px;z-index:9999;display:none;' +
  'box-shadow:0 4px 20px rgba(0,0,0,.5);' +
  'flex-direction:row;gap:8px;'
);

menu.innerHTML = (
  '<button onclick="window.wzOpen&&window.wzOpen();document.getElementById(\'merged-menu\').style.display=\'none\';" ' +
  'style="background:#5fd0a533;border:1px solid #5fd0a5;color:#5fd0a5;' +
  'padding:10px 20px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;">' +
  '\uD83E\uDDD9 Майстер</button>' +

  '<button onclick="document.getElementById(\'tmpl-btn\').click();document.getElementById(\'merged-menu\').style.display=\'none\';" ' +
  'style="background:#5b9bd533;border:1px solid #5b9bd5;color:#5b9bd5;' +
  'padding:10px 20px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;">' +
  '\uD83D\uDCDA Шаблони</button>' +

  '<button onclick="document.getElementById(\'topo-modal\').style.display=\'flex\'||\'block\';document.getElementById(\'merged-menu\').style.display=\'none\';" ' +
  'style="background:#9b87f533;border:1px solid #9b87f5;color:#9b87f5;' +
  'padding:10px 20px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;">' +
  '\uD83D\uDDFA\uFE0F Топологія</button>'
);

document.body.appendChild(menu);

/* Закрити при кліку поза меню */
document.addEventListener('click', function(e) {
  if (!menu.contains(e.target) && e.target.id !== 'merged-fab') {
    menu.style.display = 'none';
  }
});

/* ── ОБ'ЄДНАНА FAB КНОПКА ── */
function waitReady() {
  /* Ховаємо оригінальні кнопки wizard і tmpl якщо ще видимі */
  var wz = document.getElementById('wizard-btn');
  var tm = document.getElementById('tmpl-btn');
  if (wz) wz.style.display = 'none';
  if (tm) tm.style.display = 'none';

  /* Знаходимо і ховаємо ping-monitor panel якщо є */
  var pm = document.getElementById('plugin-ping-panel');
  if (pm) pm.remove();

  /* Створюємо об'єднану кнопку */
  var old = document.getElementById('merged-fab');
  if (old) old.remove();

  var fab = document.createElement('button');
  fab.id = 'merged-fab';
  fab.title = 'Майстер · Шаблони · Топологія';
  fab.style.cssText = (
    'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);' +
    'background:#16212c;border:2px solid #5fd0a5;' +
    'color:#5fd0a5;border-radius:24px;' +
    'padding:8px 20px;' +
    'font-size:13px;font-weight:700;' +
    'cursor:pointer;z-index:10000;' +
    'display:flex;align-items:center;gap:10px;' +
    'box-shadow:0 2px 12px rgba(95,208,165,.3);'
  );
  fab.innerHTML = (
    '<span>\uD83E\uDDD9 Майстер</span>' +
    '<span style="color:#2a3b48;">|</span>' +
    '<span style="color:#5b9bd5;">\uD83D\uDCDA Шаблони</span>' +
    '<span style="color:#2a3b48;">|</span>' +
    '<span style="color:#9b87f5;">\uD83D\uDDFA\uFE0F Топологія</span>'
  );

  fab.addEventListener('click', function(e) {
    e.stopPropagation();
    var m = document.getElementById('merged-menu');
    if (!m) return;
    var isOpen = m.style.display === 'flex';
    m.style.display = isOpen ? 'none' : 'flex';
  });

  document.body.appendChild(fab);
}

/* Чекаємо завантаження */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(waitReady, 500);
  });
} else {
  setTimeout(waitReady, 500);
}

})();
</script>
'''

if 'merged-fab' not in c:
    c = c.replace('</body>', MENU_SCRIPT + '\n</body>')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK: об\'єднане меню додано!')
else:
    # Замінюємо старий скрипт
    c = re.sub(r'<script>\s*\(function\(\) \{\s*/\* ════.*?merged-fab.*?\}\)\(\);\s*</script>',
               MENU_SCRIPT, c, flags=re.DOTALL)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK: меню оновлено!')