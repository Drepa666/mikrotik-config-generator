# -*- coding: utf-8 -*-
import subprocess

# ════════════════════════════════════
# 1. Фікс index.html — порядок скриптів
# ════════════════════════════════════
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Видаляємо старі підключення
for script in ['ai-agent/oui-lookup.js', 'ai-agent/switch-scanner.js']:
    html = html.replace(
        '  <script src="' + script + '"></script>\n', ''
    )
    html = html.replace(
        '<script src="' + script + '"></script>\n', ''
    )

# Знаходимо router-manager.js і вставляємо ПЕРЕД ним
old_rm = None
for candidate in [
    '<script src="router-manager.js">',
    '<script src="./router-manager.js">',
]:
    if candidate in html:
        old_rm = candidate
        break

if old_rm:
    new_before = (
        '  <script src="ai-agent/oui-lookup.js"></script>\n'
        '  <script src="ai-agent/switch-scanner.js"></script>\n'
        '  ' + old_rm
    )
    html = html.replace(old_rm, new_before)
    print('OK: oui-lookup + switch-scanner ПЕРЕД router-manager ✅')
else:
    # Додаємо на початок body
    html = html.replace(
        '<body',
        '<script src="ai-agent/oui-lookup.js"></script>\n'
        '<script src="ai-agent/switch-scanner.js"></script>\n'
        '<body'
    )
    print('OK: скрипти на початку body ✅')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

# ════════════════════════════════════
# 2. Фікс router-manager.js —
#    SwitchScanner може бути не визначений
# ════════════════════════════════════
with open('router-manager.js', 'r', encoding='utf-8') as f:
    rm = f.read()

# Захищаємо всі виклики SwitchScanner
old_show_tab = "onclick=\"SwitchScanner._showTab('routers')\""
new_show_tab = "onclick=\"window.SwitchScanner && SwitchScanner._showTab('routers')\""
if old_show_tab in rm:
    rm = rm.replace(old_show_tab, new_show_tab)
    print('OK: захист _showTab routers ✅')

old_show_tab2 = "onclick=\"SwitchScanner._showTab('scanner')\""
new_show_tab2 = "onclick=\"window.SwitchScanner && SwitchScanner._showTab('scanner')\""
if old_show_tab2 in rm:
    rm = rm.replace(old_show_tab2, new_show_tab2)
    print('OK: захист _showTab scanner ✅')

# Захищаємо buildScannerPanel
old_build = "SwitchScanner._showTab = function(tab) {"
new_build = (
    "/* Захист якщо SwitchScanner ще не завантажений */\n"
    "  if (!window.SwitchScanner) {\n"
    "    console.warn('[RM] SwitchScanner not loaded yet');\n"
    "    return;\n"
    "  }\n\n"
    "  SwitchScanner._showTab = function(tab) {"
)
if old_build in rm:
    rm = rm.replace(old_build, new_build)
    print('OK: захист SwitchScanner в buildScannerPanel ✅')

with open('router-manager.js', 'w', encoding='utf-8') as f:
    f.write(rm)

r = subprocess.run(['node','--check','router-manager.js'],
                   capture_output=True, text=True)
print('router-manager:', 'OK ✅' if r.returncode==0 else '❌\n'+r.stderr[:200])

# ════════════════════════════════════
# 3. Додаємо SMA, Huawei, Waveshare в OUI
# ════════════════════════════════════
with open('ai-agent/oui-lookup.js', 'r', encoding='utf-8') as f:
    oui = f.read()

# Знаходимо кінець _db і додаємо нові вендори
old_db_end = "    /* ABB */\n    '00:0A:DC':'ABB','00:30:11':'ABB',"
new_db_end = (
    "    /* ABB */\n"
    "    '00:0A:DC':'ABB','00:30:11':'ABB',\n"
    "    /* SMA Solar Technology */\n"
    "    '00:80:25':'SMA Solar','00:15:BB':'SMA Solar',\n"
    "    'A4:C3:F0':'SMA Solar','00:0C:B8':'SMA Solar',\n"
    "    '24:A4:3C':'SMA Solar','3C:18:A0':'SMA Solar',\n"
    "    /* Huawei Solar / FusionSolar інвертори */\n"
    "    '00:46:4B':'Huawei Solar','04:C0:6F':'Huawei Solar',\n"
    "    '28:31:52':'Huawei Solar','4C:54:99':'Huawei Solar',\n"
    "    '54:89:98':'Huawei Solar','70:72:CF':'Huawei Solar',\n"
    "    '48:57:02':'Huawei Solar','88:C3:97':'Huawei Solar',\n"
    "    'AC:4E:91':'Huawei Solar','D4:6A:6A':'Huawei Solar',\n"
    "    /* Waveshare Electronics */\n"
    "    '2C:F7:F1':'Waveshare','B8:27:EB':'Waveshare',\n"
    "    'DC:A6:32':'Waveshare','E4:5F:01':'Waveshare',\n"
    "    '28:CD:C1':'Waveshare','00:08:DC':'Waveshare (WIZnet)',\n"
    "    /* Goodwe інвертори */\n"
    "    'C4:4F:33':'GoodWe','D8:96:E0':'GoodWe',\n"
    "    /* Sungrow інвертори */\n"
    "    '64:69:4E':'Sungrow','98:D8:63':'Sungrow',\n"
    "    /* Deye/Sunsynk інвертори */\n"
    "    'C4:DD:57':'Deye Inverter','A8:48:FA':'Deye Inverter',\n"
    "    /* Victron Energy */\n"
    "    '00:26:EC':'Victron Energy','CC:6B:B4':'Victron Energy',\n"
    "    /* Carlo Gavazzi (лічильники) */\n"
    "    '00:0D:AE':'Carlo Gavazzi',\n"
    "    /* Eastron (лічильники) */\n"
    "    '00:60:52':'Eastron',\n"
    "    /* Shelly IoT */\n"
    "    'C4:5B:BE':'Shelly (Allterco)','84:F7:03':'Shelly (Allterco)',\n"
    "    'E8:DB:84':'Shelly (Allterco)',\n"
    "    /* Sonoff/eWeLink */\n"
    "    'A8:03:2A':'Sonoff (ITEAD)','84:F3:EB':'Sonoff (ITEAD)',\n"
    "    '10:06:1C':'Sonoff (ITEAD)',\n"
    "    /* MQTT/RS485 шлюзи Elfin */\n"
    "    '00:1D:EA':'Elfin Gateway',\n"
    "    /* Moxa (промислові шлюзи) */\n"
    "    '00:90:E8':'Moxa','00:60:2E':'Moxa',\n"
    "    /* WAGO (промислова автоматизація) */\n"
    "    '00:30:DE':'WAGO',\n"
    "    /* Phoenix Contact */\n"
    "    '00:A0:45':'Phoenix Contact',\n"
    "    /* Beckhoff */\n"
    "    '00:01:05':'Beckhoff',\n"
    "    /* Hikvision (додаткові) */\n"
    "    '10:12:FB':'Hikvision','28:57:BE':'Hikvision',\n"
    "    '3C:13:CC':'Hikvision','54:C4:15':'Hikvision',\n"
    "    /* Uniview камери */\n"
    "    '00:18:AE':'Uniview (UNV)',\n"
    "    /* Reolink камери */\n"
    "    'EC:71:DB':'Reolink',\n"
)

if old_db_end in oui:
    oui = oui.replace(old_db_end, new_db_end)
    print('OK: SMA, Huawei Solar, Waveshare та інші додано ✅')
else:
    print('WARN: кінець _db не знайдено — шукаємо')
    idx = oui.find("'ABB'")
    print(repr(oui[max(0,idx-20):idx+50]))

# Оновлюємо getDeviceType — додаємо нові типи
old_sma = (
    "    if (v.includes('sofar') || v.includes('growatt') || "
    "v.includes('sma solar') || v.includes('fronius'))\n"
    "      return { icon:'☀️', type:'Інвертор' };"
)
new_sma = (
    "    if (v.includes('sofar') || v.includes('growatt') ||\n"
    "        v.includes('sma solar') || v.includes('fronius') ||\n"
    "        v.includes('huawei solar') || v.includes('goodwe') ||\n"
    "        v.includes('sungrow') || v.includes('deye') ||\n"
    "        v.includes('victron') || v.includes('sunsynk'))\n"
    "      return { icon:'☀️', type:'Інвертор' };"
)
if old_sma in oui:
    oui = oui.replace(old_sma, new_sma)
    print('OK: getDeviceType інвертори розширено ✅')

# Додаємо Waveshare і промислові шлюзи
old_siemens = (
    "    if (v.includes('siemens') || v.includes('schneider') || "
    "v.includes('abb') || v.includes('advantech'))\n"
    "      return { icon:'⚙️', type:'Промисловий контролер' };"
)
new_siemens = (
    "    if (v.includes('siemens') || v.includes('schneider') ||\n"
    "        v.includes('abb') || v.includes('advantech') ||\n"
    "        v.includes('wago') || v.includes('phoenix contact') ||\n"
    "        v.includes('beckhoff') || v.includes('moxa') ||\n"
    "        v.includes('carlo gavazzi') || v.includes('eastron') ||\n"
    "        v.includes('elfin'))\n"
    "      return { icon:'⚙️', type:'Промисловий контролер' };"
)
if old_siemens in oui:
    oui = oui.replace(old_siemens, new_siemens)
    print('OK: промислові контролери розширено ✅')

# Додаємо Waveshare і Shelly
old_raspberry = (
    "    if (v.includes('raspberry') || v.includes('espressif'))\n"
    "      return { icon:'🖥', type:'SBC/IoT' };"
)
new_raspberry = (
    "    if (v.includes('waveshare') || v.includes('wiznet'))\n"
    "      return { icon:'📡', type:'Waveshare/Gateway' };\n"
    "    if (v.includes('shelly') || v.includes('sonoff') ||\n"
    "        v.includes('allterco') || v.includes('itead'))\n"
    "      return { icon:'💡', type:'Smart Home' };\n"
    "    if (v.includes('raspberry') || v.includes('espressif'))\n"
    "      return { icon:'🖥', type:'SBC/IoT' };"
)
if old_raspberry in oui:
    oui = oui.replace(old_raspberry, new_raspberry)
    print('OK: Waveshare, Shelly, Sonoff типи ✅')

with open('ai-agent/oui-lookup.js', 'w', encoding='utf-8') as f:
    f.write(oui)

r2 = subprocess.run(['node','--check','ai-agent/oui-lookup.js'],
                    capture_output=True, text=True)
print('oui-lookup:', 'OK ✅' if r2.returncode==0 else '❌\n'+r2.stderr[:200])

# Перевіряємо порядок в index.html
print('\nПорядок скриптів в index.html:')
with open('index.html', 'r', encoding='utf-8') as f:
    html2 = f.read()
for kw in ['oui-lookup.js','switch-scanner.js','router-manager.js']:
    idx = html2.find(kw)
    if idx > 0:
        print(f'  {kw} @ позиція {idx}')

print('\nВсе готово! npm start')