import re

with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

# Видаляємо старий якщо є
c = re.sub(r'<button[^>]*btn-nettools-fab[^>]*>.*?</button>\s*', '', c, flags=re.DOTALL)

FAB = (
    '<button id="btn-nettools-fab" title="Мережеві інструменти" '
    'onclick="var m=document.getElementById(\'nettools-modal\');if(m){m.style.display=\'block\';}"'
    ' style="position:fixed;bottom:358px;right:16px;'
    'background:#16212c;border:2px solid #5fd0a5;'
    'color:#5fd0a5;border-radius:50%;'
    'width:42px;height:42px;font-size:18px;'
    'cursor:pointer;z-index:10000;'
    'display:flex;align-items:center;justify-content:center;'
    'box-shadow:0 2px 8px rgba(95,208,165,.4);">'
    '&#128295;</button>'
)

c = c.replace('</body>', FAB + '\n</body>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK: FAB додано напряму в index.html!')