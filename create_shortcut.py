import winreg, os

bat = r"""@echo off
cd C:\Users\bondarenko_ay\Desktop\Mikrotik
python proxy.py
"""

# Створюємо .bat на робочому столі
desktop = os.path.join(os.environ['USERPROFILE'], 'Desktop')
bat_path = os.path.join(desktop, 'MikroTik Start.bat')

with open(bat_path, 'w') as f:
    f.write(bat)

print(f'OK: ярлик створено!\n{bat_path}')
print('Двічі клікни на "MikroTik Start.bat" на робочому столі!')