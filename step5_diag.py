# -*- coding: utf-8 -*-

with open('ai-agent/switch-scanner.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f'Рядків: {len(lines)}')

# Знаходимо де source виставляється для ARP
print('\n--- ARP source ---')
for i, l in enumerate(lines, 1):
    if 'source' in l and ('ARP' in l or 'DHCP' in l or 'LLDP' in l):
        print(f'  {i}: {repr(l)}')

# Знаходимо confirmed блок
print('\n--- confirmed/dotColor ---')
for i, l in enumerate(lines, 1):
    if 'confirmed' in l or 'dotColor' in l or 'dotTitle' in l:
        print(f'  {i}: {repr(l)}')