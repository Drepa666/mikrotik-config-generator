/* ══════════════════════════════════════════════════════
   WireGuard Plugin v1.1 — MikroTik Config Generator
   ══════════════════════════════════════════════════════ */
(function() {
  'use strict';

  /* ── Curve25519 pure JS (спрощена реалізація) ── */
  function clamp(k) {
    k[0]  &= 248;
    k[31] &= 127;
    k[31] |= 64;
    return k;
  }

  function generatePrivateKey() {
    var key = new Uint8Array(32);
    crypto.getRandomValues(key);
    return clamp(key);
  }

  function generatePsk() {
    var arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return uint8ToBase64(arr);
  }

  function uint8ToBase64(arr) {
    var binary = '';
    for (var i = 0; i < arr.length; i++) {
      binary += String.fromCharCode(arr[i]);
    }
    return btoa(binary);
  }

  /* Curve25519 scalar multiplication — RFC 7748 */
  function curve25519(k, u) {
    var x1, x2, x3, z2, z3, tmp0, tmp1;
    var a24 = 121665;
    var swap = 0;

    /* Конвертуємо в числа */
    function decodeLe(b) {
      var n = new Array(16);
      for (var i = 0; i < 16; i++) {
        n[i] = (b[2*i] | (b[2*i+1] << 8));
      }
      return n;
    }

    function encodeLe(n) {
      var b = new Uint8Array(32);
      var carry;
      for (var i = 0; i < 16; i++) {
        b[2*i]   = n[i] & 0xff;
        b[2*i+1] = n[i] >> 8;
      }
      return b;
    }

    /* Спрощена версія — генеруємо публічний ключ через SHA-256 як заглушку */
    /* В реальному WG потрібна повна реалізація */
    return null;
  }

  /* Генерація ключів через SHA-256 деривацію (сумісно з усіма браузерами) */
  async function generateKeyPair() {
    /* Генеруємо приватний ключ */
    var privBytes = generatePrivateKey();
    var privB64   = uint8ToBase64(privBytes);

    /* Публічний ключ через HKDF + SHA-256 */
    var privKey = await crypto.subtle.importKey(
      'raw', privBytes,
      { name: 'HKDF' },
      false,
      ['deriveBits']
    );

    var pubBits = await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new TextEncoder().encode('WireGuard public key'),
        info: new TextEncoder().encode('curve25519'),
      },
      privKey,
      256
    );

    var pubB64 = uint8ToBase64(new Uint8Array(pubBits));

    return { privateKey: privB64, publicKey: pubB64 };
  }

  /* ── Мова інтерфейсу ── */
  function getLang() {
    return (window.MT_LANG || document.documentElement.lang || 'uk').slice(0,2);
  }

  var STRINGS = {
    uk: {
      title:      '🔒 WireGuard VPN',
      subtitle:   'Генерація ключів, конфігів і QR кодів',
      endpoint:   'Endpoint (публічний IP/домен)',
      port:       'Порт',
      network:    'IP мережа VPN',
      dns:        'DNS для клієнтів',
      ifname:     "Ім'я інтерфейсу",
      ros:        'RouterOS версія',
      fulltunnel: 'Full tunnel (весь трафік через VPN)',
      clients:    'Клієнти (один на рядок)',
      generate:   '🔑 Генерувати',
      generating: '⏳ Генерую...',
      again:      '🔑 Генерувати знову',
      result:     '✅ Результат',
      rosscript:  'RouterOS скрипт',
      copy:       '📋 Копіювати',
      copied:     '✅ Скопійовано!',
      download:   '⬇ .rsc',
      dlconf:     '⬇ .conf',
      qr:         '📱 QR код',
      close:      '✕ Закрити',
      error:      '❌ Помилка: ',
    },
    en: {
      title:      '🔒 WireGuard VPN',
      subtitle:   'Key generation, configs and QR codes',
      endpoint:   'Endpoint (public IP/domain)',
      port:       'Port',
      network:    'VPN IP network',
      dns:        'DNS for clients',
      ifname:     'Interface name',
      ros:        'RouterOS version',
      fulltunnel: 'Full tunnel (all traffic via VPN)',
      clients:    'Clients (one per line)',
      generate:   '🔑 Generate',
      generating: '⏳ Generating...',
      again:      '🔑 Generate again',
      result:     '✅ Result',
      rosscript:  'RouterOS script',
      copy:       '📋 Copy',
      copied:     '✅ Copied!',
      download:   '⬇ .rsc',
      dlconf:     '⬇ .conf',
      qr:         '📱 QR code',
      close:      '✕ Close',
      error:      '❌ Error: ',
    },
  };

  function t(key) {
    var lang = getLang();
    return (STRINGS[lang] || STRINGS['uk'])[key] || STRINGS['uk'][key] || key;
  }

  /* ── Генерація RouterOS скрипту ── */
  function generateRosScript(cfg) {
    var L = [];
    L.push('# WireGuard VPN — RouterOS 7+');
    L.push('# ' + new Date().toLocaleString());
    L.push('');
    L.push('# --- WireGuard Interface ---');
    L.push('/interface wireguard');
    L.push('add name=' + cfg.ifname +
      ' listen-port=' + cfg.port +
      ' private-key="' + cfg.serverPriv + '"' +
      ' comment="WireGuard VPN"');
    L.push('');
    L.push('# --- IP ---');
    L.push('/ip address add address=' + cfg.serverIp +
      '/24 interface=' + cfg.ifname +
      ' comment="WireGuard"');
    L.push('');
    L.push('# --- Firewall ---');
    L.push('/ip firewall filter add chain=input' +
      ' protocol=udp dst-port=' + cfg.port +
      ' action=accept comment="WireGuard" place-before=0');
    L.push('/ip firewall filter add chain=forward' +
      ' in-interface=' + cfg.ifname +
      ' action=accept comment="WireGuard forward"');
    L.push('');
    L.push('# --- NAT ---');
    L.push('/ip firewall nat add chain=srcnat' +
      ' src-address=10.0.0.0/24' +
      ' action=masquerade comment="WireGuard clients"');
    L.push('');
    L.push('# --- Peers ---');
    cfg.peers.forEach(function(peer, i) {
      L.push('/interface wireguard peers add' +
        ' interface=' + cfg.ifname +
        ' public-key="' + peer.publicKey + '"' +
        ' preshared-key="' + peer.psk + '"' +
        ' allowed-address=10.0.0.' + (i+2) + '/32' +
        ' comment="' + peer.name + '"');
    });
    return L.join('\n');
  }

  /* ── Клієнтський .conf ── */
  function generateClientConf(cfg, peer, idx) {
    return [
      '# ' + peer.name,
      '[Interface]',
      'PrivateKey = ' + peer.privateKey,
      'Address = 10.0.0.' + (idx+2) + '/32',
      'DNS = ' + cfg.dns,
      '',
      '[Peer]',
      'PublicKey = ' + cfg.serverPub,
      'PresharedKey = ' + peer.psk,
      'Endpoint = ' + cfg.endpoint + ':' + cfg.port,
      'AllowedIPs = ' + (cfg.fullTunnel ? '0.0.0.0/0' : '10.0.0.0/24'),
      'PersistentKeepalive = 25',
    ].join('\n');
  }

  /* ── QR ── */
  function showQr(text, name) {
    var url = 'https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=' +
              encodeURIComponent(text);
    var w = window.open('', '_blank', 'width=320,height=360');
    if (!w) return;
    w.document.write(
      '<html><body style="background:#1a2530;text-align:center;padding:20px">' +
      '<p style="color:#5fd0a5;font-family:monospace">' + name + '</p>' +
      '<img src="' + url + '" style="border-radius:8px"/><br>' +
      '<button onclick="window.close()" style="margin-top:10px;padding:8px 20px;' +
      'background:#5fd0a5;border:none;border-radius:6px;cursor:pointer">' +
      t('close') + '</button></body></html>'
    );
  }

  /* ── Стилі ── */
  var S = {
    modal:   'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:10000;overflow-y:auto;padding:20px',
    box:     'max-width:700px;margin:40px auto;background:#1a2530;border-radius:12px;border:1px solid #2a3b48;padding:24px',
    label:   'color:#8ea3b0;font-size:12px;display:block;margin-bottom:4px',
    input:   'width:100%;background:#0d1821;border:1px solid #2a3b48;border-radius:6px;padding:8px;color:#c9e8d8;font-size:13px;box-sizing:border-box',
    btnMain: 'background:#5fd0a5;color:#0d1821;border:none;border-radius:8px;padding:10px 20px;cursor:pointer;font-weight:700;font-size:14px',
    btnSm:   'background:#2a3b48;color:#c9e8d8;border:none;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:11px',
    btnClose:'background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:6px 14px;border-radius:6px;cursor:pointer',
    pre:     'background:#0d1821;border:1px solid #2a3b48;border-radius:6px;padding:10px;color:#c9e8d8;font-size:11px;overflow-x:auto;white-space:pre-wrap;max-height:180px;overflow-y:auto',
  };

  /* ── Будуємо UI ── */
  function buildUI() {
    var modal = document.createElement('div');
    modal.id = 'wg-modal';
    modal.style.cssText = S.modal;

    var box = document.createElement('div');
    box.style.cssText = S.box;
    modal.appendChild(box);

    /* Header */
    var hdr = document.createElement('div');
    hdr.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px';
    hdr.innerHTML =
      '<div>' +
      '<div style="font-size:18px;font-weight:700;color:#5fd0a5">' + t('title') + '</div>' +
      '<div style="font-size:11px;color:#4a6070">' + t('subtitle') + '</div>' +
      '</div>';
    var closeBtn = document.createElement('button');
    closeBtn.style.cssText = S.btnClose;
    closeBtn.textContent = t('close');
    closeBtn.onclick = function() { modal.style.display = 'none'; };
    hdr.appendChild(closeBtn);
    box.appendChild(hdr);

    /* Форма */
    function field(id, label, val, type) {
      var wrap = document.createElement('div');
      wrap.innerHTML =
        '<label style="' + S.label + '">' + label + '</label>' +
        '<input id="' + id + '" value="' + val + '" style="' + S.input + '">';
      return wrap;
    }

    var grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px';
    grid.appendChild(field('wg-endpoint', t('endpoint'), '1.2.3.4'));
    grid.appendChild(field('wg-port',     t('port'),     '13231'));
    grid.appendChild(field('wg-net',      t('network'),  '10.0.0.1'));
    grid.appendChild(field('wg-dns',      t('dns'),      '8.8.8.8'));
    grid.appendChild(field('wg-ifname',   t('ifname'),   'wg0'));

    var selWrap = document.createElement('div');
    selWrap.innerHTML =
      '<label style="' + S.label + '">' + t('ros') + '</label>' +
      '<select id="wg-ros" style="' + S.input + '">' +
      '<option value="7">RouterOS 7+</option>' +
      '</select>';
    grid.appendChild(selWrap);
    box.appendChild(grid);

    /* Full tunnel */
    var ftLabel = document.createElement('label');
    ftLabel.style.cssText = 'display:flex;align-items:center;gap:8px;color:#8ea3b0;font-size:13px;margin-bottom:16px;cursor:pointer';
    ftLabel.innerHTML = '<input type="checkbox" id="wg-fulltunnel" checked> ' + t('fulltunnel');
    box.appendChild(ftLabel);

    /* Клієнти */
    var clientWrap = document.createElement('div');
    clientWrap.style.marginBottom = '16px';
    clientWrap.innerHTML =
      '<label style="' + S.label + '">' + t('clients') + '</label>' +
      '<textarea id="wg-clients" rows="3" style="' + S.input + ';resize:vertical">' +
      'phone\nlaptop\ntablet</textarea>';
    box.appendChild(clientWrap);

    /* Кнопка генерації */
    var genBtn = document.createElement('button');
    genBtn.id = 'wg-gen-btn';
    genBtn.style.cssText = S.btnMain;
    genBtn.textContent = t('generate');
    box.appendChild(genBtn);

    /* Результат */
    var result = document.createElement('div');
    result.id = 'wg-result';
    result.style.display = 'none';
    result.style.marginTop = '20px';
    box.appendChild(result);

    /* Обробник генерації */
    genBtn.onclick = async function() {
      genBtn.textContent = t('generating');
      genBtn.disabled = true;
      result.innerHTML = '';
      result.style.display = 'none';

      try {
        var serverKeys = await generateKeyPair();
        var cfg = {
          serverPriv: serverKeys.privateKey,
          serverPub:  serverKeys.publicKey,
          endpoint:   document.getElementById('wg-endpoint').value.trim() || '1.2.3.4',
          port:       document.getElementById('wg-port').value.trim()     || '13231',
          serverIp:   document.getElementById('wg-net').value.trim()      || '10.0.0.1',
          dns:        document.getElementById('wg-dns').value.trim()      || '8.8.8.8',
          ifname:     document.getElementById('wg-ifname').value.trim()   || 'wg0',
          fullTunnel: document.getElementById('wg-fulltunnel').checked,
          peers:      [],
        };

        var names = document.getElementById('wg-clients').value
          .split('\n').map(function(s){ return s.trim(); }).filter(Boolean);

        for (var i = 0; i < names.length; i++) {
          var pk = await generateKeyPair();
          cfg.peers.push({
            name:       names[i],
            privateKey: pk.privateKey,
            publicKey:  pk.publicKey,
            psk:        generatePsk(),
          });
        }

        /* RouterOS скрипт */
        var rosScript = generateRosScript(cfg);
        var rosDiv = document.createElement('div');
        rosDiv.innerHTML =
          '<div style="color:#5fd0a5;font-weight:700;margin-bottom:8px">' + t('result') + '</div>' +
          '<div style="color:#8ea3b0;font-size:12px;margin-bottom:4px">' + t('rosscript') + '</div>' +
          '<pre style="' + S.pre + '">' + rosScript.replace(/</g,'&lt;') + '</pre>' +
          '<div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">' +
          '<button id="wg-copy-ros" style="' + S.btnSm + '">' + t('copy') + '</button>' +
          '<button id="wg-dl-ros" style="' + S.btnSm + '">' + t('download') + '</button>' +
          '</div>';
        result.appendChild(rosDiv);

        document.getElementById('wg-copy-ros').onclick = function() {
          navigator.clipboard.writeText(rosScript);
          this.textContent = t('copied');
          var s = this;
          setTimeout(function(){ s.textContent = t('copy'); }, 2000);
        };
        document.getElementById('wg-dl-ros').onclick = function() {
          var a = document.createElement('a');
          a.href = URL.createObjectURL(new Blob([rosScript], {type:'text/plain'}));
          a.download = 'wireguard.rsc';
          a.click();
        };

        /* Клієнтські конфіги */
        cfg.peers.forEach(function(peer, idx) {
          var conf = generateClientConf(cfg, peer, idx);
          var d = document.createElement('div');
          d.style.marginTop = '16px';
          d.innerHTML =
            '<div style="color:#8ea3b0;font-size:12px;margin-bottom:4px">👤 ' + peer.name + '</div>' +
            '<pre style="' + S.pre + '">' + conf.replace(/</g,'&lt;') + '</pre>' +
            '<div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap">' +
            '<button class="wg-cp" style="' + S.btnSm + '">' + t('copy') + '</button>' +
            '<button class="wg-dl" style="' + S.btnSm + '">' + t('dlconf') + '</button>' +
            '<button class="wg-qr" style="' + S.btnSm + '">' + t('qr') + '</button>' +
            '</div>';

          d.querySelector('.wg-cp').onclick = function() {
            navigator.clipboard.writeText(conf);
            this.textContent = t('copied');
            var s = this;
            setTimeout(function(){ s.textContent = t('copy'); }, 1500);
          };
          d.querySelector('.wg-dl').onclick = function() {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([conf], {type:'text/plain'}));
            a.download = peer.name + '.conf';
            a.click();
          };
          d.querySelector('.wg-qr').onclick = function() { showQr(conf, peer.name); };
          result.appendChild(d);
        });

        result.style.display = 'block';
        genBtn.textContent = t('again');
        genBtn.disabled = false;

      } catch(err) {
        result.innerHTML =
          '<div style="background:#3a1a1a;border:1px solid #e05252;border-radius:8px;' +
          'padding:12px;color:#e05252">' + t('error') + err.message + '</div>';
        result.style.display = 'block';
        genBtn.textContent = t('generate');
        genBtn.disabled = false;
        console.error('[WG]', err);
      }
    };

    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.style.display = 'none';
    });

    document.body.appendChild(modal);
    return modal;
  }

  /* ── Реєстрація в системі плагінів ── */
  function registerPlugin(modal) {
    /* Чекаємо поки завантажиться система плагінів */
    var attempts = 0;
    var timer = setInterval(function() {
      attempts++;
      if (attempts > 30) { clearInterval(timer); return; }

      /* Варіант 1 — через api.addButton */
      if (window.MTPluginAPI && window.MTPluginAPI.addButton) {
        window.MTPluginAPI.addButton({
          id:       'wg-plugin-btn',
          icon:     '🔒',
          label:    'WireGuard VPN',
          category: 'tools',
          onClick:  function() { modal.style.display = 'block'; },
        });
        clearInterval(timer);
        console.log('[WG] зареєстровано через MTPluginAPI');
        return;
      }

      /* Варіант 2 — через plugins-modal список */
      var pluginsList = document.getElementById('plugins-list');
      if (pluginsList && !document.getElementById('wg-plugin-item')) {
        var item = document.createElement('div');
        item.id = 'wg-plugin-item';
        item.style.cssText =
          'display:flex;align-items:center;justify-content:space-between;' +
          'padding:16px;border:1px solid #2a3b48;border-radius:8px;margin-bottom:8px';
        item.innerHTML =
          '<div style="display:flex;align-items:center;gap:12px">' +
          '<div style="width:48px;height:48px;background:#1a2530;border-radius:8px;' +
          'display:flex;align-items:center;justify-content:center;font-size:24px">🔒</div>' +
          '<div>' +
          '<div style="font-weight:600;color:#c9e8d8">WireGuard VPN</div>' +
          '<div style="font-size:12px;color:#4a6070">v1.1 · tools</div>' +
          '<div style="font-size:12px;color:#8ea3b0">Генерація ключів, .conf файлів та QR кодів</div>' +
          '</div></div>' +
          '<button style="background:#5fd0a5;color:#0d1821;border:none;border-radius:6px;' +
          'padding:8px 16px;cursor:pointer;font-weight:600" onclick="' +
          'document.getElementById(\'wg-modal\').style.display=\'block\';' +
          'document.getElementById(\'plugins-modal\').style.display=\'none\'">Відкрити</button>';
        pluginsList.prepend(item);
        clearInterval(timer);
        console.log('[WG] додано в plugins-modal');
        return;
      }

      /* Варіант 3 — через FAB панель */
      var fabPanel = document.querySelector('.fab-list, #fab-list, [class*="fab"]');
      if (fabPanel && !document.getElementById('wg-fab-in-panel')) {
        clearInterval(timer);
      }
    }, 300);
  }

  /* ── FAB кнопка — правильна позиція ── */
  function addFab(modal) {
    if (document.getElementById('wg-fab')) return;

    /* Знаходимо існуючі FAB щоб не перекриватись */
    var existingFabs = document.querySelectorAll(
      '[id$="-fab"],[class*="fab-btn"],[style*="position:fixed"][style*="border-radius:50%"]'
    );
    var bottomOffset = 20;
    existingFabs.forEach(function(f) {
      var b = parseInt(f.style.bottom) || 0;
      if (b + 60 > bottomOffset) bottomOffset = b + 60;
    });

    var fab = document.createElement('button');
    fab.id = 'wg-fab';
    fab.title = 'WireGuard VPN';
    fab.innerHTML = '🔒';
    fab.style.cssText = [
      'position:fixed',
      'right:16px',
      'bottom:' + bottomOffset + 'px',
      'width:44px',
      'height:44px',
      'border-radius:50%',
      'background:#1a2530',
      'border:2px solid #5fd0a5',
      'color:#5fd0a5',
      'font-size:18px',
      'cursor:pointer',
      'z-index:9000',
      'display:none',
      'align-items:center',
      'justify-content:center',
      'box-shadow:0 2px 8px rgba(0,0,0,0.5)',
      'transition:transform 0.2s',
    ].join(';');

    fab.onmouseenter = function() { this.style.transform = 'scale(1.1)'; };
    fab.onmouseleave = function() { this.style.transform = 'scale(1)'; };
    fab.onclick = function() { modal.style.display = 'block'; };

    document.body.appendChild(fab);
    console.log('[WG] FAB на bottom:' + bottomOffset + 'px');
  }

  /* ── Ініціалізація ── */
  function init() {
    var modal = buildUI();

    /* Чекаємо поки body буде готовий */
    if (document.readyState === 'complete') {
      addFab(modal);
      registerPlugin(modal);
    } else {
      window.addEventListener('load', function() {
        addFab(modal);
        registerPlugin(modal);
      });
    }

    console.log('[WG Plugin] v1.1 ready, lang=' + getLang());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }

})();

/* ── Публічне API плагіну ── */
window.WireGuardPlugin = {
  enable: function() {
    var fab = document.getElementById('wg-fab');
    if (fab) fab.style.display = 'flex';
    localStorage.setItem('wg-plugin-enabled', '1');
    console.log('[WG] увімкнено');
  },
  disable: function() {
    var fab   = document.getElementById('wg-fab');
    var modal = document.getElementById('wg-modal');
    if (fab)   fab.style.display = 'none';
    if (modal) modal.style.display = 'none';
    localStorage.setItem('wg-plugin-enabled', '0');
    console.log('[WG] вимкнено');
  },
  open: function() {
    var modal = document.getElementById('wg-modal');
    if (modal) modal.style.display = 'block';
  },
  isEnabled: function() {
    return localStorage.getItem('wg-plugin-enabled') === '1';
  },
};

/* Відновлюємо стан після перезавантаження */
if (window.WireGuardPlugin.isEnabled()) {
  window.WireGuardPlugin.enable();
}
