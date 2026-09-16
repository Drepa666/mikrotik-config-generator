# -*- coding: utf-8 -*-
import subprocess

with open('proxy.py', 'r', encoding='utf-8') as f:
    content = f.read()

ARP_SCAN = """
        # ── ARP Scan ──
        if path == '/arp-scan':
            try:
                import subprocess as _sp, re as _re
                subnet = self.path.split('subnet=')[-1].split('&')[0] if 'subnet=' in self.path else '192.168.88.0'
                # Отримуємо ARP таблицю через arp -a
                result = _sp.run(['arp', '-a'], capture_output=True, text=True, timeout=10)
                hosts  = []
                for line in result.stdout.splitlines():
                    # Windows: hostname (ip) at mac [ether] on iface
                    # або: ip mac type iface
                    m = _re.search(r'(\\d+\\.\\d+\\.\\d+\\.\\d+)\\s+([0-9a-fA-F:\\-]{11,17})', line)
                    if m:
                        ip  = m.group(1)
                        mac = m.group(2).replace('-', ':').upper()
                        # Фільтр: тільки LAN адреси (не 255.x, не 224.x)
                        parts = ip.split('.')
                        if int(parts[0]) >= 224: continue
                        if ip.endswith('.255'):   continue
                        hosts.append({'ip': ip, 'mac': mac, 'hostname': ip})
                send_json(self, hosts)
            except Exception as e:
                send_json(self, {'error': str(e)}, 500)
            return
"""

# Вставляємо після /ping handler
old = """        if path in ('/health', '/ping'):
            send_json(self, {'ok': True, 'ssh': SSH_OK, 'electron': ELECTRON_MODE})
            return"""

new = old + "\n" + ARP_SCAN

if old in content:
    content = content.replace(old, new, 1)
    print('OK: /arp-scan додано')
else:
    # Fallback
    old2 = "        if path in ('/health', '/ping'):"
    idx  = content.find(old2)
    if idx >= 0:
        # Знаходимо кінець цього if блоку
        end = content.find('return', idx) + len('return')
        content = content[:end] + "\n" + ARP_SCAN + content[end:]
        print('OK: /arp-scan додано (fallback)')
    else:
        print('ERR: не знайдено місце вставки')

with open('proxy.py', 'w', encoding='utf-8') as f:
    f.write(content)

r = subprocess.run(['python', '-m', 'py_compile', 'proxy.py'],
                   capture_output=True, text=True)
print('proxy.py:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:300])