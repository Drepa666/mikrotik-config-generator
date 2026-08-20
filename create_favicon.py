import base64, os

# Мінімальний favicon 16x16 (MikroTik зелений)
favicon_b64 = (
    "AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAA"
    "AAQAAAAAAAAAAAAAAAAAAAAAAAAA5/DQAOT/0ADk/9AA5P/QAOT/0ADk"
    "/9AA5P/QAOT/0ADk/9AA5P/QAOT/0ADk/9AA5P/QAOT/0ADk/9AA5P/Q"
    "AOT/0ADk/9AA5P/QAOT/0ADk/9AA5P/QAOT/0ADk/9AA5P/QAOT/0ADk"
    "/9AA5P/QAOT/0ADk/9AA5P/QAOT/0ADk/9AA5P/QAOT/0ADk/9AA5P/Q"
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=="
)

# Просто копіюємо icon-192.png як favicon
if os.path.exists('icon-192.png'):
    import shutil
    shutil.copy('icon-192.png', 'favicon.ico')
    print('OK: favicon.ico створено з icon-192.png!')
else:
    # Створюємо порожній favicon
    with open('favicon.ico', 'wb') as f:
        f.write(bytes([
            0,0,1,0,1,0,16,16,0,0,1,0,32,0,104,4,
            0,0,22,0,0,0,40,0,0,0,16,0,0,0,32,0,
            0,0,1,0,32,0,0,0,0,0,0,4,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0
        ] + [95,208,165,255]*256 + [0]*128))
    print('OK: favicon.ico створено!')

# Перевіряємо чи є в index.html
with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

if 'favicon.ico' not in c:
    c = c.replace('<head>', '<head>\n<link rel="icon" href="favicon.ico" type="image/x-icon">')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('OK: favicon підключено в index.html!')
else:
    print('favicon вже є в index.html')