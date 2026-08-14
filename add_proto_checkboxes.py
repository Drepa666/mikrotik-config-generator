with open('terminal.js', 'r', encoding='utf-8') as f:
    c = f.read()

# Замінюємо кожен блок протоколу — додаємо чекбокс
protos = [
    ('ssh',    '🔒 SSH',    '#5fd0a5', 'ssh',    '22',   True),
    ('winbox', '📦 Winbox', '#5b9bd5', 'winbox', '8291', True),
    ('api',    '🌐 REST API','#e6b35a','http',   '80',   True),
    ('ftp',    '📁 FTP',    '#9b87f5', 'ftp',    '21',   False),
    ('telnet', '📟 Telnet', '#e0665a', 'telnet', '23',   False),
    ('www',    '🌍 WWW',    '#5fd0a5', 'http',   '80',   False),
]

for svc, label, color, proto, port, checked in protos:
    chk = 'checked' if checked else ''

    OLD = f"""'<div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:6px;padding:8px;">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
    '<label style="font-size:11px;color:{color};font-weight:700;">{label}</label>' +
    '<div id="tm-{svc}-indicator" style="width:8px;height:8px;border-radius:50%;background:#4a6070;"></div>' +
    '</div>' +
    '<div style="display:flex;gap:4px;">' +
    '<select id="tm-{svc}-proto" style="' + tmInputSm() + 'flex:1;" onchange="tmUpdatePort(this,&apos;tm-{svc}-port&apos;)">' +
    '<option value="{port}">{proto}</option>' +
    '</select>' +
    '<input id="tm-{svc}-port" type="number" value="{port}" min="1" max="65535" style="' + tmInputSm() + 'width:70px;">' +
    '</div>' +
    '</div>' +"""

    NEW = f"""'<div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:6px;padding:8px;opacity:1;transition:opacity .2s;" id="tm-{svc}-card">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
    '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;">' +
    '<input type="checkbox" id="tm-{svc}-enabled" {chk} style="accent-color:{color};width:14px;height:14px;cursor:pointer;" onchange="tmToggleProto(&apos;{svc}&apos;)">' +
    '<span style="font-size:11px;color:{color};font-weight:700;">{label}</span>' +
    '</label>' +
    '<div id="tm-{svc}-indicator" style="width:8px;height:8px;border-radius:50%;background:#4a6070;" title="статус"></div>' +
    '</div>' +
    '<div style="display:flex;gap:4px;" id="tm-{svc}-inputs">' +
    '<select id="tm-{svc}-proto" style="' + tmInputSm() + 'flex:1;" onchange="tmUpdatePort(this,&apos;tm-{svc}-port&apos;)">' +
    '<option value="{port}">{proto}</option>' +
    '</select>' +
    '<input id="tm-{svc}-port" type="number" value="{port}" min="1" max="65535" style="' + tmInputSm() + 'width:70px;">' +
    '</div>' +
    '</div>' +"""

    if OLD in c:
        c = c.replace(OLD, NEW)
        print(f'OK: {svc} чекбокс додано!')
    else:
        print(f'WARN: {svc} блок не знайдено')

# Додаємо функцію tmToggleProto
OLD_HELPER = "  window.tmUpdatePort = function(selectEl, portId) {"

NEW_HELPER = """  /* Вмикає/вимикає протокол */
  window.tmToggleProto = function(svc) {
    var chk    = document.getElementById('tm-' + svc + '-enabled');
    var inputs = document.getElementById('tm-' + svc + '-inputs');
    var card   = document.getElementById('tm-' + svc + '-card');
    if (!chk || !inputs) return;
    var enabled = chk.checked;
    inputs.style.opacity    = enabled ? '1'    : '0.3';
    inputs.style.pointerEvents = enabled ? 'auto' : 'none';
    if (card) card.style.borderColor = enabled ? '#2a4a38' : '#2a3b48';
  };

  window.tmUpdatePort = function(selectEl, portId) {"""

if OLD_HELPER in c:
    c = c.replace(OLD_HELPER, NEW_HELPER)
    print('OK: tmToggleProto додано!')

# Оновлюємо кнопку "Застосувати порти" — тепер враховує чекбокси
OLD_APPLY = """    var ports = [
      { svc:'ssh',    port: document.getElementById('tm-ssh-port').value },
      { svc:'winbox', port: document.getElementById('tm-winbox-port').value },
      { svc:'www',    port: document.getElementById('tm-www-port').value },
      { svc:'ftp',    port: document.getElementById('tm-ftp-port').value },
      { svc:'telnet', port: document.getElementById('tm-telnet-port').value },
      { svc:'api',    port: document.getElementById('tm-api-port').value },
    ];"""

NEW_APPLY = """    /* Збираємо тільки увімкнені протоколи */
    var allPorts = [
      { svc:'ssh',    port: document.getElementById('tm-ssh-port').value },
      { svc:'winbox', port: document.getElementById('tm-winbox-port').value },
      { svc:'www',    port: document.getElementById('tm-www-port').value },
      { svc:'ftp',    port: document.getElementById('tm-ftp-port').value },
      { svc:'telnet', port: document.getElementById('tm-telnet-port').value },
      { svc:'api',    port: document.getElementById('tm-api-port').value },
    ];

    /* Вмикаємо/вимикаємо сервіси відповідно до чекбоксів */
    var ports = allPorts.map(function(item) {
      var chkEl = document.getElementById('tm-' + item.svc + '-enabled');
      return {
        svc:      item.svc,
        port:     item.port,
        disabled: chkEl ? !chkEl.checked : false,
      };
    });"""

OLD_PATCH = """          body: JSON.stringify({ port: parseInt(item.port) }),"""
NEW_PATCH = """          body: JSON.stringify({
            port:     parseInt(item.port),
            disabled: item.disabled,
          }),"""

if OLD_APPLY in c:
    c = c.replace(OLD_APPLY, NEW_APPLY)
    print('OK: apply враховує чекбокси!')

if OLD_PATCH in c:
    c = c.replace(OLD_PATCH, NEW_PATCH)
    print('OK: PATCH з disabled!')

# Додаємо підказку після блоку портів
OLD_HINT = """'[✅ Застосувати порти] [🔄 Скинути до стандартних]"""
# Шукаємо кнопки застосувати
OLD_BTNS = """'<button id="tm-apply-ports" style="background:#5b9bd5;color:#fff;border:none;padding:7px 16px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">✅ Застосувати порти</button>' +
    '<button id="tm-reset-ports" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;">🔄 Скинути до стандартних</button>' +
    '<div id="tm-ports-status" style="font-size:11.5px;line-height:32px;color:#4a6070;"></div>' +"""

NEW_BTNS = """'<button id="tm-apply-ports" style="background:#5b9bd5;color:#fff;border:none;padding:7px 16px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">✅ Застосувати порти</button>' +
    '<button id="tm-reset-ports" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;">🔄 Скинути до стандартних</button>' +
    '<div id="tm-ports-status" style="font-size:11.5px;line-height:32px;color:#4a6070;"></div>' +
    '</div>' +
    '<div style="background:#0a1f14;border:1px solid #1a4a2a;border-radius:6px;padding:10px 14px;margin-top:10px;">' +
    '<div style="font-size:11px;color:#5fd0a5;font-weight:700;margin-bottom:6px;">💡 Що вмикати на новому роутері для підключення:</div>' +
    '<div style="font-size:11px;color:#8ea3b0;line-height:1.8;">' +
    '🔒 <b style="color:#5fd0a5;">SSH</b> — для терміналу конфігуратора<br>' +
    '🌐 <b style="color:#e6b35a;">REST API (www)</b> — для Deploy скриптів<br>' +
    '📦 <b style="color:#5b9bd5;">Winbox</b> — для програми Winbox<br>' +
    '<span style="color:#4a6070;">Команди: <code style="color:#5fd0a5;">/ip service set ssh disabled=no</code><br>' +
    '<code style="color:#5fd0a5;">/ip service set www disabled=no</code></span>' +
    '</div>' +"""

if OLD_BTNS in c:
    c = c.replace(OLD_BTNS, NEW_BTNS)
    print('OK: підказка додана!')

with open('terminal.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
print('terminal.js збережено!')