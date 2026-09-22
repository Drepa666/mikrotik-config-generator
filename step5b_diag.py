# -*- coding: utf-8 -*-

with open('ai-agent/switch-scanner.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Показуємо весь блок мержу ARP+DHCP+LLDP
print('Рядки 55-130:')
for i, l in enumerate(lines[54:130], 55):
    print(f'  {i}: {repr(l)}')

# Показуємо pingCheck — чи він перезаписує online/source
print('\nPingCheck блок:')
for i, l in enumerate(lines, 1):
    if 'pingCheck' in l or 'function next' in l:
        print(f'  {i}: {repr(l)}')