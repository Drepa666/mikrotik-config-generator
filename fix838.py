with open('terminal.js', 'r', encoding='utf-8') as f:
    c = f.read()

# Замінюємо ВСІ прямі document.getElementById на null-safe версії
import re

def make_safe(match):
    id_name  = match.group(1)
    var_name = '_btn_' + id_name.replace('-', '_')
    event    = match.group(2)
    rest     = match.group(3)
    return (
        f"var {var_name} = document.getElementById('{id_name}');\n"
        f"  if ({var_name}) {var_name}.addEventListener('{event}', {rest}"
    )

# Список нових кнопок з terminal_v2
new_btns = [
    'tm-search-btn', 'tm-copy-btn', 'tm-live-btn',
    'tm-bookmarks-btn', 'tm-macros-btn',
    'tm-search-close', 'tm-search-prev', 'tm-search-next',
    'tm-search-input', 'tm-live-start', 'tm-live-stop',
    'tm-bookmark-add', 'tm-macro-add', 'tm-live-cmd',
]

count = 0
for btn_id in new_btns:
    old = f"  document.getElementById('{btn_id}').addEventListener("
    var_name = '_btn_' + btn_id.replace('-', '_')
    new = f"  var {var_name} = document.getElementById('{btn_id}'); if ({var_name}) {var_name}.addEventListener("
    if old in c:
        c = c.replace(old, new)
        count += 1
        print(f'OK: {btn_id}')

# Також замінюємо без відступу
for btn_id in new_btns:
    old = f"document.getElementById('{btn_id}').addEventListener("
    var_name = '_btn_' + btn_id.replace('-', '_')
    new = f"var {var_name} = document.getElementById('{btn_id}'); if ({var_name}) {var_name}.addEventListener("
    if old in c:
        c = c.replace(old, new)
        count += 1
        print(f'OK (no-indent): {btn_id}')

print(f'\nВсього виправлено: {count}')

with open('terminal.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
print('Збережено!')