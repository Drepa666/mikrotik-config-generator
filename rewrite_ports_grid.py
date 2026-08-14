with open('terminal.js', 'r', encoding='utf-8') as f:
    c = f.read()

# Знаходимо початок і кінець всього блоку портів
start = c.find("/* SSH */")
end   = c.find("/* Кнопки дій */")

if start == -1 or end == -1:
    print(f'start={start}, end={end}')
    exit()

print(f'Замінюємо рядки {start}–{end}')

PORTS_BLOCK = """/* SSH */
    '<div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:6px;padding:8px;" id="tm-ssh-card">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
    '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;">' +
    '<input type="checkbox" id="tm-ssh-enabled" checked style="accent-color:#5fd0a5;width:14px;height:14px;cursor:pointer;" onchange="tmToggleProto(&apos;ssh&apos;)">' +
    '<span style="font-size:11px;color:#5fd0a5;font-weight:700;">\\uD83D\\uDD12 SSH</span>' +
    '</label>' +
    '<div id="tm-ssh-indicator" style="width:8px;height:8px;border-radius:50%;background:#4a6070;"></div>' +
    '</div>' +
    '<div style="display:flex;gap:4px;" id="tm-ssh-inputs">' +
    '<select id="tm-ssh-proto" style="' + tmInputSm() + 'flex:1;">' +
    '<option value="22">ssh</option>' +
    '</select>' +
    '<input id="tm-ssh-port" type="number" value="22" min="1" max="65535" style="' + tmInputSm() + 'width:70px;">' +
    '</div>' +
    '</div>' +

    /* Winbox */
    '<div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:6px;padding:8px;" id="tm-winbox-card">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
    '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;">' +
    '<input type="checkbox" id="tm-winbox-enabled" checked style="accent-color:#5b9bd5;width:14px;height:14px;cursor:pointer;" onchange="tmToggleProto(&apos;winbox&apos;)">' +
    '<span style="font-size:11px;color:#5b9bd5;font-weight:700;">\\uD83D\\uDCE6 Winbox</span>' +
    '</label>' +
    '<div id="tm-winbox-indicator" style="width:8px;height:8px;border-radius:50%;background:#4a6070;"></div>' +
    '</div>' +
    '<div style="display:flex;gap:4px;" id="tm-winbox-inputs">' +
    '<select id="tm-winbox-proto" style="' + tmInputSm() + 'flex:1;">' +
    '<option value="8291">winbox</option>' +
    '</select>' +
    '<input id="tm-winbox-port" type="number" value="8291" min="1" max="65535" style="' + tmInputSm() + 'width:70px;">' +
    '</div>' +
    '</div>' +

    /* REST API */
    '<div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:6px;padding:8px;" id="tm-api-card">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
    '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;">' +
    '<input type="checkbox" id="tm-api-enabled" checked style="accent-color:#e6b35a;width:14px;height:14px;cursor:pointer;" onchange="tmToggleProto(&apos;api&apos;)">' +
    '<span style="font-size:11px;color:#e6b35a;font-weight:700;">\\uD83C\\uDF10 REST API</span>' +
    '</label>' +
    '<div id="tm-api-indicator" style="width:8px;height:8px;border-radius:50%;background:#4a6070;"></div>' +
    '</div>' +
    '<div style="display:flex;gap:4px;" id="tm-api-inputs">' +
    '<select id="tm-api-proto" style="' + tmInputSm() + 'flex:1;">' +
    '<option value="80">http</option>' +
    '<option value="443">https</option>' +
    '</select>' +
    '<input id="tm-api-port" type="number" value="80" min="1" max="65535" style="' + tmInputSm() + 'width:70px;">' +
    '</div>' +
    '</div>' +

    /* FTP */
    '<div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:6px;padding:8px;" id="tm-ftp-card">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
    '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;">' +
    '<input type="checkbox" id="tm-ftp-enabled" style="accent-color:#9b87f5;width:14px;height:14px;cursor:pointer;" onchange="tmToggleProto(&apos;ftp&apos;)">' +
    '<span style="font-size:11px;color:#9b87f5;font-weight:700;">\\uD83D\\uDCC1 FTP</span>' +
    '</label>' +
    '<div id="tm-ftp-indicator" style="width:8px;height:8px;border-radius:50%;background:#4a6070;"></div>' +
    '</div>' +
    '<div style="display:flex;gap:4px;" id="tm-ftp-inputs">' +
    '<select id="tm-ftp-proto" style="' + tmInputSm() + 'flex:1;">' +
    '<option value="21">ftp</option>' +
    '</select>' +
    '<input id="tm-ftp-port" type="number" value="21" min="1" max="65535" style="' + tmInputSm() + 'width:70px;">' +
    '</div>' +
    '</div>' +

    /* Telnet */
    '<div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:6px;padding:8px;" id="tm-telnet-card">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
    '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;">' +
    '<input type="checkbox" id="tm-telnet-enabled" style="accent-color:#e0665a;width:14px;height:14px;cursor:pointer;" onchange="tmToggleProto(&apos;telnet&apos;)">' +
    '<span style="font-size:11px;color:#e0665a;font-weight:700;">\\uD83D\\uDCDF Telnet</span>' +
    '</label>' +
    '<div id="tm-telnet-indicator" style="width:8px;height:8px;border-radius:50%;background:#4a6070;"></div>' +
    '</div>' +
    '<div style="display:flex;gap:4px;" id="tm-telnet-inputs">' +
    '<select id="tm-telnet-proto" style="' + tmInputSm() + 'flex:1;">' +
    '<option value="23">telnet</option>' +
    '</select>' +
    '<input id="tm-telnet-port" type="number" value="23" min="1" max="65535" style="' + tmInputSm() + 'width:70px;">' +
    '</div>' +
    '</div>' +

    /* WWW */
    '<div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:6px;padding:8px;" id="tm-www-card">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
    '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;">' +
    '<input type="checkbox" id="tm-www-enabled" style="accent-color:#5fd0a5;width:14px;height:14px;cursor:pointer;" onchange="tmToggleProto(&apos;www&apos;)">' +
    '<span style="font-size:11px;color:#5fd0a5;font-weight:700;">\\uD83C\\uDF0D WWW</span>' +
    '</label>' +
    '<div id="tm-www-indicator" style="width:8px;height:8px;border-radius:50%;background:#4a6070;"></div>' +
    '</div>' +
    '<div style="display:flex;gap:4px;" id="tm-www-inputs">' +
    '<select id="tm-www-proto" style="' + tmInputSm() + 'flex:1;">' +
    '<option value="80">http</option>' +
    '<option value="443">https</option>' +
    '</select>' +
    '<input id="tm-www-port" type="number" value="80" min="1" max="65535" style="' + tmInputSm() + 'width:70px;">' +
    '</div>' +
    '</div>' +

    """

c = c[:start] + PORTS_BLOCK + c[end:]

with open('terminal.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
print('OK: terminal.js повністю перезаписано!')