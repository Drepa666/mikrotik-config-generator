/* ============================================================
   MikroTik Config Generator — validators.js
   Всі функції inline-валідації форми
   Залежить від: core.js (isIPv4, isCIDR, isPort, isMac)
   ============================================================ */
'use strict';

(function() {

  /* ── UI утиліти ─────────────────────────────────────────── */
  function getHintEl(parent, cls) {
    var el = parent.parentNode
      ? parent.parentNode.querySelector('.' + cls)
      : null;
    if (!el) {
      el = document.createElement('div');
      el.className = cls;
      if (parent.parentNode) parent.parentNode.appendChild(el);
    }
    return el;
  }

  function setFieldError(input, msg) {
    input.classList.remove('valid', 'warn');
    input.classList.add('invalid');
    var el = getHintEl(input, 'field-error');
    el.textContent = '\u2717 ' + msg;
    el.style.display = 'block';
    var w = getHintEl(input, 'field-warn');
    w.style.display = 'none';
  }

  function setFieldWarn(input, msg) {
    input.classList.remove('invalid', 'valid');
    input.classList.add('warn');
    var el = getHintEl(input, 'field-warn');
    el.textContent = '\u26a0 ' + msg;
    el.style.display = 'block';
    var e = getHintEl(input, 'field-error');
    e.style.display = 'none';
  }

  function setFieldOk(input) {
    input.classList.remove('invalid', 'warn');
    input.classList.add('valid');
    ['field-error', 'field-warn'].forEach(function(cls) {
      var el = input.parentNode
        ? input.parentNode.querySelector('.' + cls)
        : null;
      if (el) el.style.display = 'none';
    });
  }

  function clearField(input) {
    input.classList.remove('invalid', 'valid', 'warn');
    ['field-error', 'field-warn'].forEach(function(cls) {
      var el = input.parentNode
        ? input.parentNode.querySelector('.' + cls)
        : null;
      if (el) el.style.display = 'none';
    });
  }

  function getOrCreate(parent, cls) {
    var el = parent.parentNode
      ? parent.parentNode.querySelector('.' + cls)
      : null;
    if (!el) {
      el = document.createElement('div');
      el.className = cls;
      if (parent.parentNode) parent.parentNode.appendChild(el);
    }
    return el;
  }

  function showTaErrors(el, errors) {
    el.classList.remove('ta-valid');
    el.classList.add('ta-invalid');
    var errEl = getOrCreate(el, 'ta-error-list');
    errEl.style.borderColor = '';
    errEl.style.color = '';
    errEl.style.background = '';
    errEl.innerHTML = errors.map(function(e) {
      return '\u2717 ' + e;
    }).join('<br>');
    errEl.classList.add('visible');
    var okEl = getOrCreate(el, 'ta-ok-msg');
    okEl.classList.remove('visible');
  }

  function showTaWarn(el, warns) {
    el.classList.remove('ta-valid', 'ta-invalid');
    el.classList.add('ta-invalid');
    var errEl = getOrCreate(el, 'ta-error-list');
    errEl.style.borderColor = '#e6b35a';
    errEl.style.color = '#e6b35a';
    errEl.style.background = 'rgba(230,179,90,.10)';
    errEl.innerHTML = warns.map(function(e) {
      return '\u26a0 ' + e;
    }).join('<br>');
    errEl.classList.add('visible');
    var okEl = getOrCreate(el, 'ta-ok-msg');
    okEl.classList.remove('visible');
  }

  function showTaOk(el, msg) {
    el.classList.remove('ta-invalid');
    el.classList.add('ta-valid');
    var errEl = getOrCreate(el, 'ta-error-list');
    errEl.classList.remove('visible');
    var okEl = getOrCreate(el, 'ta-ok-msg');
    okEl.textContent = '\u2713 ' + (msg || 'Все вірно');
    okEl.classList.add('visible');
  }

  function clearTa(el) {
    el.classList.remove('ta-invalid', 'ta-valid');
    ['ta-error-list', 'ta-ok-msg'].forEach(function(cls) {
      var e = el.parentNode ? el.parentNode.querySelector('.' + cls) : null;
      if (e) { e.classList.remove('visible'); e.textContent = ''; }
    });
  }

  /* ── Глобальні з core.js ────────────────────────────────── */
  function _isIPv4(v)  { return typeof isIPv4  === 'function' ? isIPv4(v)  : false; }
  function _isCIDR(v)  { return typeof isCIDR  === 'function' ? isCIDR(v)  : false; }
  function _isPort(v)  { return typeof isPort  === 'function' ? isPort(v)  : false; }
  function _isMac(v)   { return typeof isMac   === 'function' ? isMac(v)   : false; }
  function _isBase64Key(v) {
    return /^[A-Za-z0-9+\/]{43}=$/.test(String(v || '').trim());
  }

  /* ══════════════════════════════════════════════════════════
     ПРОСТІ ПОЛЯ (input)
  ══════════════════════════════════════════════════════════ */

  function validateField(input) {
    var id  = input.id;
    var val = input.value.trim();
    if (!val) { clearField(input); return; }

    switch (id) {
      case 'lanip':
        if (!_isCIDR(val))
          setFieldError(input, 'Має бути IP/маска — наприклад 192.168.88.1/24');
        else setFieldOk(input);
        break;

      case 'dhcprange':
        var dp = val.split('-');
        if (dp.length !== 2 || !_isIPv4(dp[0]) || !_isIPv4(dp[1]))
          setFieldError(input, 'Формат: 192.168.88.10-192.168.88.254');
        else {
          var a = dp[0].split('.'), b = dp[1].split('.');
          if (a[0]!==b[0]||a[1]!==b[1]||a[2]!==b[2])
            setFieldError(input, 'Початок і кінець діапазону в різних мережах!');
          else setFieldOk(input);
        }
        break;

      case 'wanip':
      case 'guestip':
      case 'wgserverip':
      case 'foip':
        if (!_isCIDR(val))
          setFieldError(input, 'Має бути CIDR — наприклад 192.168.88.1/24');
        else setFieldOk(input);
        break;

      case 'wangw':
      case 'fogw':
      case 'ovpnlocal':
        if (!_isIPv4(val))
          setFieldError(input, 'Некоректна IPv4-адреса');
        else setFieldOk(input);
        break;

      case 'landns':
      case 'upstreamdns':
        var dnsEntries = val.split(/[,\s]+/).filter(Boolean);
        var dnsErrors = dnsEntries.filter(function(d) { return !_isIPv4(d); });
        if (dnsErrors.length)
          setFieldError(input, 'Некоректні IP: ' + dnsErrors.join(', '));
        else setFieldOk(input);
        break;

      case 'ovpnport':
      case 'ovpnclport':
      case 'wgport':
        if (!_isPort(val))
          setFieldError(input, 'Порт має бути від 1 до 65535');
        else setFieldOk(input);
        break;

      case 'guestrange':
        var gp = val.split('-');
        if (gp.length !== 2 || !_isIPv4(gp[0]) || !_isIPv4(gp[1]))
          setFieldError(input, 'Формат: 192.168.20.10-192.168.20.254');
        else {
          var ga = gp[0].split('.'), gb = gp[1].split('.');
          if (ga[0]!==gb[0]||ga[1]!==gb[1]||ga[2]!==gb[2])
            setFieldError(input, 'Початок і кінець в різних мережах!');
          else setFieldOk(input);
        }
        break;

      case 'wifipass':
      case 'capsmanpass':
      case 'guestwifipass':
        if (val.length < 8)
          setFieldError(input, 'Мінімум 8 символів для WPA2');
        else if (val.length < 12)
          setFieldWarn(input, 'Рекомендовано 12+ символів');
        else setFieldOk(input);
        break;

      case 'netwatchhost':
      case 'fohealthhost':
        if (!_isIPv4(val) && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(val))
          setFieldWarn(input, 'Має бути IP або домен');
        else setFieldOk(input);
        break;

      case 'routername':
        if (val.length > 64)
          setFieldError(input, 'Максимум 64 символи (зараз: ' + val.length + ')');
        else if (!/^[a-zA-Z0-9_\-]+$/.test(val))
          setFieldError(input, 'Лише a-z, A-Z, 0-9, -, _');
        else if (/^[\-_]/.test(val))
          setFieldWarn(input, 'Назва починається з - або _');
        else setFieldOk(input);
        break;

      case 'pppoeuser':
        var wt = document.getElementById('wantype');
        if (wt && wt.value === 'pppoe' && !val)
          setFieldError(input, 'PPPoE логін не може бути порожнім');
        else setFieldOk(input);
        break;

      case 'apn':
      case 'foapn':
        if (/\s/.test(val))
          setFieldError(input, 'APN не може містити пробіли');
        else if (!/^[a-zA-Z0-9.\-_]+$/.test(val))
          setFieldError(input, 'APN: лише a-z, 0-9, ., -, _');
        else setFieldOk(input);
        break;

      case 'netwatchinterval':
        var m = val.match(/^(\d+)(s|m|h)$/i);
        if (!m)
          setFieldError(input, 'Формат: 30s, 5m, 1h');
        else if (m[2]==='s' && +m[1] < 1)
          setFieldError(input, 'Мінімум 1s');
        else if (m[2]==='s' && +m[1] < 10)
          setFieldWarn(input, 'Інтервал < 10s може навантажувати роутер');
        else setFieldOk(input);
        break;
    }
  }

  /* ══════════════════════════════════════════════════════════
     TEXTAREA ПОЛЯ
  ══════════════════════════════════════════════════════════ */

  function validateDnsField(input) {
    var val = input.value.trim();
    if (!val) { clearField(input); return; }
    var entries = val.split(/[,\s]+/).filter(Boolean);
    var bad = entries.filter(function(e) { return !_isIPv4(e); });
    if (bad.length)
      setFieldError(input, 'Некоректні IP: ' + bad.join(', '));
    else setFieldOk(input);
  }

  function validatePortForwarding(ta) {
    var raw = ta.value.trim();
    if (!raw) { clearTa(ta); return; }
    var errors = [], valid = 0;
    raw.split('\n').forEach(function(line, i) {
      var val = line.trim();
      if (!val || val.charAt(0)==='#') return;
      var num = i+1, parts = val.split(':');
      if (parts.length < 4) {
        errors.push('Рядок '+num+': формат proto:зовн:IP:внутр[:коментар]');
        return;
      }
      var proto=parts[0].trim().toLowerCase(),
          ext=parts[1].trim(), ip=parts[2].trim(), int_=parts[3].trim();
      if (!['tcp','udp'].includes(proto))
        errors.push('Рядок '+num+': протокол "'+proto+'" → tcp або udp');
      if (!_isPort(ext))
        errors.push('Рядок '+num+': зовнішній порт "'+ext+'" → 1-65535');
      if (!_isIPv4(ip))
        errors.push('Рядок '+num+': IP "'+ip+'" → некоректна IPv4');
      if (!_isPort(int_))
        errors.push('Рядок '+num+': внутрішній порт "'+int_+'" → 1-65535');
      if (['tcp','udp'].includes(proto)&&_isPort(ext)&&_isIPv4(ip)&&_isPort(int_))
        valid++;
    });
    errors.length
      ? showTaErrors(ta, errors)
      : showTaOk(ta, 'Port Forwarding ('+valid+' правил) — коректні');
  }

  function validateWgPeers(ta) {
    var raw = ta.value.trim();
    if (!raw) { clearTa(ta); return; }
    var errors = [], warns = [], valid = 0;
    raw.split('\n').forEach(function(line, i) {
      var val = line.trim();
      if (!val || val.charAt(0)==='#') return;
      var num=i+1, parts=val.split(':');
      if (parts.length < 3) {
        errors.push('Рядок '+num+': формат ім\'я:public_key:IP/32');
        return;
      }
      var name=parts[0].trim(), key=parts[1].trim(), ip=parts[2].trim();
      if (!name) errors.push('Рядок '+num+': ім\'я порожнє');
      if (!_isBase64Key(key))
        errors.push('Рядок '+num+': key "'+key.slice(0,8)+'..." → base64, 44 символи');
      if (!_isCIDR(ip))
        errors.push('Рядок '+num+': "'+ip+'" → CIDR (напр. 10.20.30.2/32)');
      else if (!ip.endsWith('/32')&&!ip.endsWith('/24'))
        warns.push('Рядок '+num+': маска /'+ip.split('/')[1]+' — для клієнта зазвичай /32');
      if (name&&_isBase64Key(key)&&_isCIDR(ip)) valid++;
    });
    var realErr = errors.filter(function(e){return !e.startsWith('\u26a0');});
    if (realErr.length) showTaErrors(ta, errors);
    else if (warns.length) showTaWarn(ta, warns);
    else showTaOk(ta, 'WireGuard peers ('+valid+' шт.) — коректні');
  }

  function validateIpsecPeers(ta) {
    var raw = ta.value.trim();
    if (!raw) { clearTa(ta); return; }
    var errors = [], valid = 0;
    raw.split('\n').forEach(function(line, i) {
      var val = line.trim();
      if (!val || val.charAt(0)==='#') return;
      var num=i+1, parts=val.split(':');
      if (parts.length < 4) {
        errors.push('Рядок '+num+': формат ім\'я:IP:PSK:режим (ike1/ike2)');
        return;
      }
      var name=parts[0].trim(), ip=parts[1].trim(),
          psk=parts[2].trim(), mode=parts[3].trim().toLowerCase();
      if (!name) errors.push('Рядок '+num+': ім\'я порожнє');
      if (!_isIPv4(ip)) errors.push('Рядок '+num+': IP "'+ip+'" некоректний');
      if (psk.length < 8) errors.push('Рядок '+num+': PSK мін. 8 символів');
      if (!['ike1','ike2'].includes(mode))
        errors.push('Рядок '+num+': режим "'+mode+'" → ike1 або ike2');
      if (name&&_isIPv4(ip)&&psk.length>=8&&['ike1','ike2'].includes(mode))
        valid++;
    });
    errors.length
      ? showTaErrors(ta, errors)
      : showTaOk(ta, 'IPsec peers ('+valid+' шт.) — коректні');
  }

  function validateIpsecPolicies(ta) {
    var raw = ta.value.trim();
    if (!raw) { clearTa(ta); return; }
    var errors = [], warns = [], valid = 0;
    raw.split('\n').forEach(function(line, i) {
      var val = line.trim();
      if (!val || val.charAt(0)==='#') return;
      var num=i+1, parts=val.split(':');
      if (parts.length < 3) {
        errors.push('Рядок '+num+': формат peer:src_net:dst_net');
        return;
      }
      var peer=parts[0].trim(), src=parts[1].trim(), dst=parts[2].trim();
      if (!peer) errors.push('Рядок '+num+': peer порожній');
      if (!_isCIDR(src)) errors.push('Рядок '+num+': src "'+src+'" → CIDR');
      if (!_isCIDR(dst)) errors.push('Рядок '+num+': dst "'+dst+'" → CIDR');
      if (_isCIDR(src)&&_isCIDR(dst)&&src===dst)
        warns.push('Рядок '+num+': src і dst однакові ('+src+')');
      if (peer&&_isCIDR(src)&&_isCIDR(dst)) valid++;
    });
    if (errors.length) showTaErrors(ta, errors);
    else if (warns.length) showTaWarn(ta, warns);
    else showTaOk(ta, 'IPsec Policies ('+valid+' шт.) — коректні');
  }

  function validateAddrList(ta) {
    var raw = ta.value.trim();
    if (!raw) { clearTa(ta); return; }
    var errors = [], valid = 0;
    raw.split('\n').forEach(function(line, i) {
      var val = line.trim();
      if (!val || val.charAt(0)==='#') return;
      var num=i+1, sep=val.indexOf('=');
      if (sep < 1) {
        errors.push('Рядок '+num+': формат список=IP або список=CIDR');
        return;
      }
      var name=val.slice(0,sep).trim(), addr=val.slice(sep+1).trim().split(/\s+/)[0];
      if (!name) errors.push('Рядок '+num+': назва порожня');
      if (!_isIPv4(addr)&&!_isCIDR(addr))
        errors.push('Рядок '+num+': "'+addr+'" → IPv4 або CIDR');
      if (name&&(_isIPv4(addr)||_isCIDR(addr))) valid++;
    });
    errors.length
      ? showTaErrors(ta, errors)
      : showTaOk(ta, 'Address-List ('+valid+' записів) — коректні');
  }

  function validateRoutes(ta) {
    var raw = ta.value.trim();
    if (!raw) { clearTa(ta); return; }
    var errors = [], valid = 0;
    raw.split('\n').forEach(function(line, i) {
      var val = line.trim();
      if (!val || val.charAt(0)==='#') return;
      var num=i+1, eq=val.indexOf('=');
      if (eq < 1) {
        errors.push('Рядок '+num+': формат CIDR=IP:distance[:коментар]');
        return;
      }
      var dst=val.slice(0,eq).trim(), rest=val.slice(eq+1).trim().split(':');
      var gw=rest[0].trim(), dist=rest[1]?rest[1].trim():'1';
      if (!_isCIDR(dst)) errors.push('Рядок '+num+': dst "'+dst+'" → CIDR');
      if (!_isIPv4(gw)) errors.push('Рядок '+num+': шлюз "'+gw+'" → IPv4');
      if (!/^\d+$/.test(dist)||+dist<1||+dist>255)
        errors.push('Рядок '+num+': distance "'+dist+'" → 1-255');
      if (_isCIDR(dst)&&_isIPv4(gw)&&/^\d+$/.test(dist)&&+dist>=1&&+dist<=255)
        valid++;
    });
    errors.length
      ? showTaErrors(ta, errors)
      : showTaOk(ta, 'Маршрути ('+valid+' шт.) — коректні');
  }

  function validateDnsStatic(ta) {
    var raw = ta.value.trim();
    if (!raw) { clearTa(ta); return; }
    var errors = [], valid = 0, names = {};
    raw.split('\n').forEach(function(line, i) {
      var val = line.trim();
      if (!val || val.charAt(0)==='#') return;
      var num=i+1, eq=val.indexOf('=');
      if (eq < 1) {
        errors.push('Рядок '+num+': формат ім\'я=IP');
        return;
      }
      var name=val.slice(0,eq).trim(), ip=val.slice(eq+1).trim().split(/\s+/)[0];
      if (!name) errors.push('Рядок '+num+': ім\'я порожнє');
      else if (!/^[a-zA-Z0-9._\-]+$/.test(name))
        errors.push('Рядок '+num+': ім\'я "'+name+'" → лише a-z, 0-9, ., -, _');
      else if (names[name])
        errors.push('Рядок '+num+': дубль "'+name+'"');
      else names[name]=true;
      if (!_isIPv4(ip)) errors.push('Рядок '+num+': IP "'+ip+'" некоректний');
      if (name&&/^[a-zA-Z0-9._\-]+$/.test(name)&&_isIPv4(ip)) valid++;
    });
    errors.length
      ? showTaErrors(ta, errors)
      : showTaOk(ta, 'DNS записи ('+valid+' шт.) — коректні');
  }

  function validateOvpnRange(input) {
    var val = input.value.trim();
    if (!val) { clearField(input); return; }
    var parts = val.split('-');
    if (parts.length !== 2) {
      setFieldError(input, 'Формат: IP_початок-IP_кінець');
      return;
    }
    var s=parts[0].trim(), e=parts[1].trim();
    if (!_isIPv4(s)||!_isIPv4(e)) {
      setFieldError(input, 'Обидва кінці мають бути IPv4');
      return;
    }
    var sp=s.split('.').map(Number), ep=e.split('.').map(Number);
    var si=(sp[0]<<24)|(sp[1]<<16)|(sp[2]<<8)|sp[3];
    var ei=(ep[0]<<24)|(ep[1]<<16)|(ep[2]<<8)|ep[3];
    if (ei<=si) { setFieldError(input,'Кінець має бути більше початку'); return; }
    if (sp[0]!==ep[0]||sp[1]!==ep[1]||sp[2]!==ep[2])
      { setFieldError(input,'Початок і кінець в різних мережах /24'); return; }
    setFieldOk(input);
  }

  function validateOvpnUsers(ta) {
    var raw = ta.value.trim();
    if (!raw) { clearTa(ta); return; }
    var errors = [], warns = [], valid = 0, logins = {};
    var weak = ['password','12345678','qwerty123','admin123'];
    raw.split('\n').forEach(function(line, i) {
      var val = line.trim();
      if (!val || val.charAt(0)==='#') return;
      var num=i+1, ci=val.indexOf(':');
      if (ci < 1) {
        errors.push('Рядок '+num+': формат логін:пароль');
        return;
      }
      var login=val.slice(0,ci).trim(), pass=val.slice(ci+1).trim();
      if (!login) errors.push('Рядок '+num+': логін порожній');
      else if (!/^[a-zA-Z0-9_\.\-]+$/.test(login))
        errors.push('Рядок '+num+': логін "'+login+'" → a-z, 0-9, _, ., -');
      else if (logins[login])
        errors.push('Рядок '+num+': дубль логіну "'+login+'"');
      else logins[login]=true;
      if (!pass) errors.push('Рядок '+num+': пароль порожній');
      else if (pass.length<8) errors.push('Рядок '+num+': пароль мін. 8 символів');
      else if (pass.length<12) warns.push('Рядок '+num+': рекомендовано 12+ символів');
      if (weak.includes(pass.toLowerCase()))
        errors.push('Рядок '+num+': пароль занадто простий');
      if (login&&pass&&pass.length>=8&&!weak.includes(pass.toLowerCase())) valid++;
    });
    if (errors.length) showTaErrors(ta, errors);
    else if (warns.length) showTaWarn(ta, warns);
    else showTaOk(ta, 'Користувачі ('+valid+' шт.) — коректні');
  }

  /* ══════════════════════════════════════════════════════════
     SEMANTIC CHECKER
  ══════════════════════════════════════════════════════════ */
  var _semPanel = null;

  function getSemanticPanel() {
    if (_semPanel) return _semPanel;
    var wrap = document.getElementById('out-wrap');
    if (!wrap) return null;
    _semPanel = document.createElement('div');
    _semPanel.id = 'semantic-panel';
    _semPanel.style.cssText = [
      'display:none','background:#2a2614',
      'border:1px solid #e6b35a','border-radius:8px',
      'padding:10px 14px','margin-bottom:12px',
      'font-size:12px','color:#ffe3a3','line-height:1.7'
    ].join(';');
    wrap.insertBefore(_semPanel, wrap.firstChild);
    return _semPanel;
  }

  function runSemanticCheck() {
    var warns = [];
    var fw  = (document.getElementById('firmware')||{}).value||'';
    var mdl = (document.getElementById('model')||{}).value||'';
    var wg  = document.getElementById('wgenable');
    var ovpn = document.getElementById('ovpnenable');
    var cipher=(document.getElementById('ovpncipher')||{}).value||'';
    var caps = document.getElementById('capsmanserv');
    var wifi = document.getElementById('wifienable');
    var guest= document.getElementById('guestenable');
    var vlan = document.getElementById('guestvlan');
    var wifi6=['hap-ax2','hap-ax3','hap-ax-s','chateau-lte7','chateau-5g','chateau-pro-ax'];
    var single=['wap-ac','cap-ac'];

    if (wg&&wg.checked&&fw==='6.x')
      warns.push('\ud83d\udd34 <b>WireGuard</b> не підтримується в RouterOS 6.x');
    if (ovpn&&ovpn.checked&&cipher==='aes256-gcm'&&fw!=='7.13+')
      warns.push('\ud83d\udd34 <b>OpenVPN aes256-gcm</b> лише RouterOS 7.13+');
    if (ovpn&&ovpn.checked&&cipher==='blowfish128'&&fw!=='6.x')
      warns.push('\u26a0\ufe0f <b>blowfish128</b> рекомендований лише для 6.x');
    if (wifi&&wifi.checked&&wifi6.includes(mdl)&&fw==='6.x')
      warns.push('\ud83d\udd34 <b>Wi-Fi 6</b> моделі не підтримують RouterOS 6.x');
    if (caps&&caps.checked&&single.includes(mdl))
      warns.push('\u26a0\ufe0f <b>CAPsMAN</b> на '+mdl+' — переконайся що LAN/Management в різних VLAN');
    if (guest&&guest.checked&&vlan&&+vlan.value===1)
      warns.push('\ud83d\udd34 <b>VLAN ID = 1</b> — native VLAN, конфліктує з LAN');
    if (wifi&&wifi.checked&&mdl==='hex')
      warns.push('\ud83d\udd34 <b>hEX</b> не має Wi-Fi модуля');

    var panel = getSemanticPanel();
    if (!panel) return;
    if (warns.length) {
      panel.style.display = 'block';
      panel.innerHTML = '<b>\u26a0\ufe0f Семантичні попередження:</b><br>' +
        warns.map(function(w){ return '\u2022 '+w; }).join('<br>');
    } else {
      panel.style.display = 'none';
    }
  }

  /* ══════════════════════════════════════════════════════════
     ІНІЦІАЛІЗАЦІЯ
  ══════════════════════════════════════════════════════════ */
  function attachField(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input',  function() { validateField(el); });
    el.addEventListener('blur',   function() { validateField(el); });
    el.addEventListener('change', function() { validateField(el); });
    if (el.value && el.value.trim()) validateField(el);
  }

  function attachTa(id, fn) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', function() { fn(el); });
    el.addEventListener('blur',  function() { fn(el); });
    if (el.value && el.value.trim()) fn(el);
  }

  function attachSemantic(ids) {
    ids.forEach(function(id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', runSemanticCheck);
      el.addEventListener('input',  runSemanticCheck);
    });
  }

  function init() {
    /* Прості поля */
    [
      'lanip','dhcprange','wanip','wangw','guestip','guestrange',
      'wgserverip','ovpnport','ovpnclport','wgport','ovpnlocal',
      'wifipass','capsmanpass','guestwifipass','netwatchhost','fohealthhost',
      'routername','pppoeuser','apn','foapn','netwatchinterval',
      'landns','upstreamdns','foip','fogw'
    ].forEach(attachField);

    /* Textarea */
    attachTa('pfwrules',         validatePortForwarding);
    attachTa('wgpeers',          validateWgPeers);
    attachTa('ipsecpeers',       validateIpsecPeers);
    attachTa('ipsecpolicies',    validateIpsecPolicies);
    attachTa('addrlistentries',  validateAddrList);
    attachTa('routesentries',    validateRoutes);
    attachTa('dnsstaticentries', validateDnsStatic);
    attachTa('ovpnusers',        validateOvpnUsers);

    /* ovpnrange — input */
    var ovpnr = document.getElementById('ovpnrange');
    if (ovpnr) {
      ovpnr.addEventListener('input', function() { validateOvpnRange(ovpnr); });
      ovpnr.addEventListener('blur',  function() { validateOvpnRange(ovpnr); });
      if (ovpnr.value.trim()) validateOvpnRange(ovpnr);
    }

    /* Semantic checker */
    attachSemantic([
      'firmware','model','wgenable','ovpnenable','ovpncipher',
      'capsmanserv','wifienable','guestenable','guestvlan'
    ]);
    runSemanticCheck();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
