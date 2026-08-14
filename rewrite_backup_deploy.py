with open('backup-scheduler.js', 'r', encoding='utf-8') as f:
    c = f.read()

# Додаємо кнопку Deploy в кінці форми перед закриваючим тегом кнопок
OLD = """    '<div style="display:flex;gap:10px;margin-top:16px;">' +
    '<button id="bs-copy" style="flex:1;background:#5fd0a5;color:#082018;border:none;padding:10px;border-radius:8px;cursor:pointer;font-weight:700;font-size:12px;">📋 Копіювати</button>' +
    '<button id="bs-dl" style="flex:1;background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:10px;border-radius:8px;cursor:pointer;font-size:12px;">⬇️ Завантажити .rsc</button>' +
    '</div>';"""

NEW = """    '<div style="display:flex;gap:10px;margin-top:16px;">' +
    '<button id="bs-copy" style="flex:1;background:#5fd0a5;color:#082018;border:none;padding:10px;border-radius:8px;cursor:pointer;font-weight:700;font-size:12px;">📋 Копіювати</button>' +
    '<button id="bs-dl" style="flex:1;background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:10px;border-radius:8px;cursor:pointer;font-size:12px;">⬇️ Завантажити .rsc</button>' +
    '</div>' +

    /* Deploy блок */
    '<div style="margin-top:12px;border-top:1px solid #2a3b48;padding-top:14px;">' +
    '<div style="font-size:11px;color:#4a6070;margin-bottom:10px;">🚀 Або відправ напряму на роутер (потрібен <code style=\\'color:#5fd0a5\\'>python proxy.py</code>):</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">' +
    '<input id="bs-router-ip"   type="text"     placeholder="IP роутера: 192.168.88.1" value="192.168.88.1" style="' + inputStyle() + '">' +
    '<input id="bs-router-pass" type="password" placeholder="Пароль admin" style="' + inputStyle() + '">' +
    '</div>' +
    '<div style="display:flex;gap:8px;">' +
    '<button id="bs-deploy-test" style="flex:1;background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:9px;border-radius:8px;cursor:pointer;font-size:12px;">🔍 Перевірити</button>' +
    '<button id="bs-deploy-btn"  style="flex:2;background:#5b9bd5;color:#fff;border:none;padding:9px;border-radius:8px;cursor:pointer;font-weight:700;font-size:12px;">🚀 Deploy на роутер!</button>' +
    '</div>' +
    '<div id="bs-deploy-status" style="margin-top:8px;font-size:11.5px;min-height:20px;"></div>' +
    '</div>';"""

if OLD in c:
    c = c.replace(OLD, NEW)
    print('OK: Deploy блок додано в форму!')
else:
    print('WARN: не знайдено — шукаємо інший спосіб')
    import re
    c = re.sub(
        r"'<div style=\"display:flex;gap:10px;margin-top:16px;\">.*?'</div>';",
        NEW,
        c,
        count=1,
        flags=re.DOTALL
    )
    print('OK: замінено через regex!')

# Додаємо функцію inputStyle якщо її немає
if 'function inputStyle' not in c:
    c = c.replace(
        'function mkBSField(',
        """function inputStyle() {
  return 'width:100%;background:#0d1a24;border:1px solid #2a3b48;color:#e6edf3;padding:8px 10px;border-radius:6px;font-size:12px;box-sizing:border-box;';
}

function mkBSField("""
    )
    print('OK: inputStyle() додано!')

with open('backup-scheduler.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
print('Крок 1 збережено!')