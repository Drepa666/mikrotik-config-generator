import time, re
with open('sw.js', 'r', encoding='utf-8') as f:
    c = f.read()
ts = int(time.time())
c = re.sub(r"'mt-config-v\w+'", f"'mt-config-v{ts}'", c)
with open('sw.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
print(f'SW кеш → mt-config-v{ts}')