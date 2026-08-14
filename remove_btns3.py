import re

# Видаляємо кнопку з dashboard.js
with open('dashboard.js', 'r', encoding='utf-8') as f:
    d = f.read()

# Шукаємо що є
import re
found = re.findall(r"btn\..*?Dashboard.*?btnbar", d, re.DOTALL)
print('dashboard.js знайдено:', len(found))

# Ховаємо додавання кнопки в btnbar
OLD_D = "  var btnbar = document.querySelector('.btnbar');\n  if (btnbar) btnbar.appendChild(btn);"
NEW_D = "  /* Кнопка Dashboard прихована з верхньої панелі */\n  // if (btnbar) btnbar.appendChild(btn);"

if OLD_D in d:
    d = d.replace(OLD_D, NEW_D)
    print('OK: Dashboard кнопка прихована!')
else:
    # Шукаємо інший варіант
    d = re.sub(
        r"(var btnbar[^\n]*\n\s*if \(btnbar\) btnbar\.appendChild\(btn\);)",
        "/* Dashboard btn hidden */",
        d, count=1
    )
    print('OK через regex!')

with open('dashboard.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(d)

# Видаляємо кнопку з cheatsheet.js
with open('cheatsheet.js', 'r', encoding='utf-8') as f:
    c = f.read()

if OLD_D in c:
    c = c.replace(OLD_D, "  /* Кнопка Шпаргалка прихована з верхньої панелі */\n  // if (btnbar) btnbar.appendChild(btn);")
    print('OK: Шпаргалка кнопка прихована!')
else:
    c = re.sub(
        r"(var btnbar[^\n]*\n\s*if \(btnbar\) btnbar\.appendChild\(btn\);)",
        "/* Cheatsheet btn hidden */",
        c, count=1
    )
    print('OK cheatsheet через regex!')

with open('cheatsheet.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)

print('Готово!')