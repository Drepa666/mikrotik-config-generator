#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, shutil
from datetime import datetime

TARGET = 'index.html'
BACKUP = f'index.backup14.{datetime.now().strftime("%Y%m%d_%H%M%S")}.html'

VALIDATION_CSS = """
/* ============================================================
   INLINE VALIDATION
   ============================================================ */
.field-wrap { position: relative; }
.field-error {
  display: none;
  font-size: 11px;
  color: #e0665a;
  margin-top: 3px;
  padding: 3px 8px;
  background: rgba(224,102,90,.10);
  border-radius: 4px;
  border-left: 2px solid #e0665a;
}
.field-warn {
  display: none;
  font-size: 11px;
  color: #e6b35a;
  margin-top: 3px;
  padding: 3px 8px;
  background: rgba(230,179,90,.10);
  border-radius: 4px;
  border-left: 2px solid #e6b35a;
}
input.invalid, textarea.invalid {
  border-color: #e0665a !important;
  box-shadow: 0 0 0 2px rgba(224,102,90,.15);
}
input.valid {
  border-color: #5fd0a5 !important;
}
input.warn {
  border-color: #e6b35a !important;
  box-shadow: 0 0 0 2px rgba(230,179,90,.12);
}
"""

VALIDATION_JS = """
/* ============================================================
   INLINE FIELD VALIDATION — реальний час
   ============================================================ */
(function() {
  'use strict';

  /* --- Утиліти --- */
  function isIPv4(v) {
    var o = String(v||'').trim().split('.');
    return o.length === 4 && o.every(function(x){
      return /^\\d+$/.test(x) && +x >= 0 && +x <= 255;
    });
  }
  function isCIDR(v) {
    var p = String(v||'').trim().split('/');
    return p.length === 2 && isIPv4(p[0]) &&
      /^\\d+$/.test(p[1]) && +p[1] >= 0 && +p[1] <= 32;
  }
  function isPort(v) {
    return /^\\d+$/.test(String(v).trim()) && +v >= 1 && +v <= 65535;
  }
  function isDhcpRange(v) {
    /* формат: A.B.C.D-A.B.C.E */
    var parts = String(v||'').trim().split('-');
    return parts.length === 2 && isIPv4(parts[0]) && isIPv4(parts[1]);
  }
  function dhcpRangeNetwork(v) {
    /* перевіряє що обидва кінці в одній мережі /24 */
    var parts = String(v||'').trim().split('-');
    if (parts.length !== 2) return false;
    var a = parts[0].split('.'), b = parts[1].split('.');
    return a[0]===b[0] && a[1]===b[1] && a[2]===b[2];
  }

  /* --- Показати/сховати повідомлення --- */
  function setError(input, msg) {
    input.classList.remove('valid','warn');
    input.classList.add('invalid');
    var err = input.parentNode.querySelector('.field-error');
    if (!err) {
      err = document.createElement('div');
      err.className = 'field-error';
      input.parentNode.appendChild(err);
    }
    err.textContent = '✗ ' + msg;
    err.style.display = 'block';
    var w = input.parentNode.querySelector('.field-warn');
    if (w) w.style.display = 'none';
  }

  function setWarn(input, msg) {
    input.classList.remove('invalid','valid');
    input.classList.add('warn');
    var w = input.parentNode.querySelector('.field-warn');
    if (!w) {
      w = document.createElement('div');
      w.className = 'field-warn';
      input.parentNode.appendChild(w);
    }
    w.textContent = '⚠ ' + msg;
    w.style.display = 'block';
    var e = input.parentNode.querySelector('.field-error');
    if (e) e.style.display = 'none';
  }

  function setOk(input) {
    input.classList.remove('invalid','warn');
    input.classList.add('valid');
    var e = input.parentNode.querySelector('.field-error');
    if (e) e.style.display = 'none';
    var w = input.parentNode.querySelector('.field-warn');
    if (w) w.style.display = 'none';
  }

  function clearState(input) {
    input.classList.remove('invalid','valid','warn');
    ['field-error','field-warn'].forEach(function(cls){
      var el = input.parentNode.querySelector('.'+cls);
      if (el) el.style.display = 'none';
    });
  }

  /* --- Правила валідації для кожного поля --- */
  function validateField(input) {
    var id  = input.id;
    var val = input.value.trim();

    /* Пропускаємо порожні необов'язкові поля */
    if (!val) { clearState(input); return; }

    switch (id) {

      /* IP роутера (LAN) */
      case 'lanip':
        if (!isCIDR(val))
          setError(input, 'Має бути IP/маска — наприклад 192.168.88.1/24');
        else setOk(input);
        break;

      /* Діапазон DHCP */
      case 'dhcprange':
        if (!isDhcpRange(val))
          setError(input, 'Формат: 192.168.88.10-192.168.88.254');
        else if (!dhcpRangeNetwork(val))
          setError(input, 'Початок і кінець діапазону в різних мережах!');
        else setOk(input);
        break;

      /* DNS для клієнтів */
      case 'landns':
        var firstDns = val.split(',')[0].trim().split(' ')[0];
        if (!isIPv4(firstDns))
          setError(input, 'Некоректна IPv4-адреса: ' + firstDns);
        else setOk(input);
        break;

      /* Зовнішні DNS */
      case 'upstreamdns':
        var dnsOk = val.split(',').every(function(d){
          return isIPv4(d.trim());
        });
        if (!dnsOk)
          setError(input, 'Один або кілька DNS некоректні. Формат: 8.8.8.8,1.1.1.1');
        else setOk(input);
        break;

      /* WAN IP/маска (статична) */
      case 'wanip':
        if (!isCIDR(val))
          setError(input, 'Має бути IP/маска — наприклад 203.0.113.1/24');
        else setOk(input);
        break;

      /* Шлюз WAN */
      case 'wangw':
        if (!isIPv4(val))
          setError(input, 'Некоректна IPv4-адреса шлюзу');
        else setOk(input);
        break;

      /* Порт OpenVPN */
      case 'ovpnport':
      case 'ovpnclport':
        if (!isPort(val))
          setError(input, 'Порт має бути від 1 до 65535');
        else setOk(input);
        break;

      /* WireGuard порт */
      case 'wgport':
        if (!isPort(val))
          setError(input, 'Порт має бути від 1 до 65535');
        else setOk(input);
        break;

      /* WireGuard IP сервера */
      case 'wgserverip':
        if (!isCIDR(val))
          setError(input, 'Має бути CIDR — наприклад 10.20.30.1/24');
        else setOk(input);
        break;

      /* OpenVPN IP сервера */
      case 'ovpnlocal':
        if (!isIPv4(val))
          setError(input, 'Некоректна IPv4-адреса');
        else setOk(input);
        break;

      /* IP гостьової мережі */
      case 'guestip':
        if (!isCIDR(val))
          setError(input, 'Має бути CIDR — наприклад 192.168.20.1/24');
        else setOk(input);
        break;

      /* Діапазон гостьового DHCP */
      case 'guestrange':
        if (!isDhcpRange(val))
          setError(input, 'Формат: 192.168.20.10-192.168.20.254');
        else if (!dhcpRangeNetwork(val))
          setError(input, 'Початок і кінець діапазону в різних мережах!');
        else setOk(input);
        break;

      /* Пароль Wi-Fi */
      case 'wifipass':
      case 'capsmanpass':
      case 'guestwifipass':
        if (val.length < 8)
          setError(input, 'Мінімум 8 символів для WPA2');
        else if (val.length < 12)
          setWarn(input, 'Рекомендовано 12+ символів для надійності');
        else setOk(input);
        break;

      /* Netwatch хост */
      case 'netwatchhost':
        if (!isIPv4(val) && !/^[a-z0-9.-]+\\.[a-z]{2,}$/i.test(val))
          setWarn(input, 'Має бути IP або домен, наприклад 8.8.8.8');
        else setOk(input);
        break;

      /* Health-check хост failover */
      case 'fohealthhost':
        if (!isIPv4(val) && !/^[a-z0-9.-]+\\.[a-z]{2,}$/i.test(val))
          setWarn(input, 'Має бути IP або домен, наприклад 1.1.1.1');
        else setOk(input);
        break;
    }
  }

  /* --- Підключаємо до всіх полів --- */
  var fieldIds = [
    'lanip','dhcprange','landns','upstreamdns',
    'wanip','wangw',
    'ovpnport','ovpnclport','ovpnlocal',
    'wgport','wgserverip',
    'guestip','guestrange',
    'wifipass','capsmanpass','guestwifipass',
    'netwatchhost','fohealthhost'
  ];

  function attachValidators() {
    fieldIds.forEach(function(id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', function() { validateField(el); });
      el.addEventListener('blur',  function() { validateField(el); });
      /* Перевірити одразу якщо поле вже заповнене */
      if (el.value.trim()) validateField(el);
    });
  }

  /* Запускаємо після DOMContentLoaded */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachValidators);
  } else {
    attachValidators();
  }

})();
"""

def main():
    if not os.path.exists(TARGET):
        print(f'❌ {TARGET} не знайдено!'); return

    shutil.copy2(TARGET, BACKUP)
    print(f'💾 Бекап: {BACKUP}')

    with open(TARGET, 'r', encoding='utf-8') as f:
        content = f.read()

    orig = len(content)

    # [1] CSS
    if 'field-error' in content:
        print('⏭  [CSS] Validation стилі вже є')
    else:
        content = content.replace('</style>', VALIDATION_CSS + '\n</style>', 1)
        print('✅ [CSS] Validation стилі додано')

    # [2] JS
    if 'validateField' in content:
        print('⏭  [JS] Validation логіка вже є')
    else:
        idx = content.rfind('</script>')
        if idx != -1:
            content = content[:idx] + VALIDATION_JS + content[idx:]
            print('✅ [JS] Inline validation додано (18 полів)')
        else:
            print('❌ </script> не знайдено')

    with open(TARGET, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f'📊 Розмір: {orig:,} → {len(content):,} (Δ {len(content)-orig:+,})')
    print('\n🎉 Готово! Поля тепер валідуються в реальному часі:')
    print('   🔴 Червона рамка + текст = помилка')
    print('   🟡 Жовта рамка + текст = попередження')
    print('   🟢 Зелена рамка = все вірно')
    print('\n   python -m http.server 8080 → Ctrl+Shift+R')

if __name__ == '__main__':
    main()