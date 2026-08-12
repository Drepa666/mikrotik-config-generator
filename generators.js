/* ============================================================
   MikroTik Config Generator — generators.js
   Автоматично витягнуто з index.html (patch22)
   
   Містить: render(), rosEnsure(), rosSafeName()
            та всі gen*() функції генерації .rsc

   Залежить від: core.js (q, sip, calcNet, isIPv4, isCIDR, isPort)
   
   Функцій: 11
   Розмір: 43,830 символів
   Дата: 2026-08-12 11:13:43
   ============================================================ */
'use strict';

/* ── rosEnsure() ── */
function rosEnsure(command, label) {
  const safeLabel = q(label || 'already exists');
  return ':do { ' + command + ' } on-error={ :log info "' + safeLabel + '" }';
}

/* ── rosSafeName() ── */
function rosSafeName(value, fallback) {
  const name = String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_.-]/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

  return name || fallback;
}

/* ── render() ── */
function render() {
  const model = MODELS[el('model').value];
  const firmware = el('firmware').value;
  const hostname = el('hostname').value.trim() || 'MikroTik';
  const timezone = el('timezone').value;

  const wanInterface = el('wanif').value.trim() || 'ether1';
  const wanType = el('wantype').value;

  const failoverEnabled = el('foenable').checked;
  const lanPorts = uniqueNonEmpty(el('lanports').value.split(','));

  const lanIpCidr = sip(el('lanip').value) || '192.168.88.1/24';
  const lanIp = sip(lanIpCidr.split('/')[0]);
  const lanNetwork = calcNet(lanIpCidr);

  const modelLabel = el('model').value === 'other'
    ? (el('custommodel').value.trim() || 'Інша модель')
    : model.label;

  const warnings = validateForm();
  const vbox = el('vbox');

  if (warnings.length) {
    vbox.className = 'wbox';
    vbox.style.display = 'block';
    vbox.innerHTML =
      '<b>⚠ Перевір перед заливкою:</b><br>' +
      warnings.map(function(warning) {
        return '• ' + esc(warning);
      }).join('<br>');
  } else {
    vbox.style.display = 'none';
    vbox.innerHTML = '';
  }

  const lines = [];

  lines.push('# ============================================================');
  lines.push('# Скрипт згенеровано MikroTik Config Generator');
  lines.push('# Модель: ' + modelLabel + ' | RouterOS: ' + firmware);
  lines.push('# Перевір команди та зроби export перед імпортом у production.');
  lines.push('# ============================================================');
  lines.push('');

  lines.push('# --- Чек-лист безпеки ---');
  lines.push('# [' + (el('changepass').checked && el('adminpass').value.trim() ? 'x' : ' ') + '] Пароль admin змінено');
  lines.push('# [' + (el('basicfw').checked ? 'x' : ' ') + '] Базовий firewall');
  lines.push('# [' + (el('macprotect').checked ? 'x' : ' ') + '] MAC-захист');
  lines.push('# [' + (el('dnsprotect').checked ? 'x' : ' ') + '] Захист DNS із WAN');
  lines.push('# [' + (el('disableservices').checked ? 'x' : ' ') + '] Небезпечні сервіси вимкнено');

  if (el('wgenable').checked) {
    lines.push('# [x] WireGuard: UDP/' + lineValue(el('wgport').value, '51820'));
  }

  if (el('ipsecenable').checked) {
    lines.push('# [x] IPsec');
  }

  if (failoverEnabled) {
    lines.push('# [x] Failover: ' + lineValue(el('foif').value, 'lte1'));
  }

  if (el('guestenable').checked) {
    lines.push('# [x] Ізольована гостьова мережа');
  }

  lines.push('');

  /*
    Reset навмисно лише коментується: reset розриває виконання
    поточного .rsc та перезавантажує пристрій.
  */
  if (el('resetconfig').checked) {
    lines.push('# --- УВАГА: RESET ---');
    lines.push('# Виконай НАСТУПНУ команду окремо, дочекайся перезавантаження,');
    lines.push('# а потім імпортуй цей конфіг повторно без цього блоку.');
    lines.push('# /system reset-configuration no-defaults=yes skip-backup=yes');
    lines.push('');
  }

  if (el('backupenable').checked) {
    lines.push('# --- Резервна копія ---');
    lines.push('/system backup save name=backup-before-config dont-encrypt=yes');
    lines.push('');
  }

  lines.push('# --- Загальне ---');
  lines.push('/system identity set name="' + q(hostname) + '"');
  lines.push('/system clock set time-zone-name=' + timezone);

  if (el('changepass').checked && el('adminpass').value.trim()) {
    lines.push('/user set admin password="' + q(el('adminpass').value) + '"');
  }

  if (el('ddnsenable').checked) {
    lines.push('/ip cloud set ddns-enabled=yes');
    lines.push('# Після імпорту: /ip cloud print');
  }

  if (el('disableipv6').checked) {
    lines.push('/ipv6 settings set disable-ipv6=yes');
  }

  if (el('ipneighbor').checked) {
    lines.push('/ip neighbor discovery-settings set discover-interface-list=none');
  }

  const maxNeighbors = Number(el('maxneighbor').value);
  if (Number.isInteger(maxNeighbors) && maxNeighbors > 0) {
    lines.push('/ip settings set max-neighbor-entries=' + maxNeighbors);
    lines.push('/ipv6 settings set max-neighbor-entries=' + maxNeighbors);
  }

  lines.push('');

  lines.push('# --- Interface Lists ---');
  lines.push(rosEnsure('/interface list add name=WAN', 'Interface list WAN already exists'));
  lines.push(rosEnsure('/interface list add name=LAN', 'Interface list LAN already exists'));
  lines.push(
    rosEnsure(
      '/interface list member add list=WAN interface=' + wanInterface,
      'WAN interface member already exists: ' + wanInterface
    )
  );

  let lanInterface = 'bridge-lan';

  lines.push('');
  lines.push('# --- LAN ---');

  if (model.single) {
    lanInterface = wanInterface;
    lines.push('# Однопортова модель: LAN використовує інтерфейс ' + wanInterface + '.');
    lines.push(
      rosEnsure(
        '/ip address add address=' + lanIpCidr + ' interface=' + wanInterface,
        'LAN IP address already exists'
      )
    );
  } else {
    lines.push(
      rosEnsure(
        '/interface bridge add name=bridge-lan protocol-mode=rstp',
        'Bridge bridge-lan already exists'
      )
    );

    lanPorts.forEach(function(port) {
      lines.push(
        rosEnsure(
          '/interface bridge port add bridge=bridge-lan interface=' + port,
          'Bridge port already exists: ' + port
        )
      );
    });

    lines.push(
      rosEnsure(
        '/ip address add address=' + lanIpCidr + ' interface=bridge-lan',
        'LAN IP address already exists'
      )
    );
  }

  lines.push(
    rosEnsure(
      '/interface list member add list=LAN interface=' + lanInterface,
      'LAN interface member already exists: ' + lanInterface
    )
  );

  lines.push('');
  lines.push('# --- WAN: ' + wanInterface + ' ---');

  if (wanType === 'dhcp') {
    lines.push(
      '/ip dhcp-client add interface=' + wanInterface +
      ' disabled=no add-default-route=yes' +
      ' default-route-distance=1' +
      (failoverEnabled ? ' check-gateway=ping' : '')
    );
  }

  if (wanType === 'static') {
    const wanIp = sip(el('wanip').value) || '203.0.113.10/24';
    const wanGateway = sip(el('wangw').value) || '203.0.113.1';

    lines.push('/ip address add address=' + wanIp + ' interface=' + wanInterface);
    lines.push(
      '/ip route add dst-address=0.0.0.0/0 gateway=' + wanGateway +
      ' distance=1' +
      (failoverEnabled ? ' check-gateway=ping' : '') +
      ' comment="main default route"'
    );
  }

  if (wanType === 'pppoe') {
    lines.push(
      '/interface pppoe-client add interface=' + wanInterface +
      ' name=pppoe-out1' +
      ' user="' + q(lineValue(el('pppoeuser').value, 'login@isp')) + '"' +
      ' password="' + q(el('pppoepass').value) + '"' +
      ' disabled=no add-default-route=yes default-route-distance=1'
    );
  }

  if (wanType === 'lte') {
    const apn = lineValue(el('lteapn').value, 'internet');
    const apnUser = el('lteuser').value.trim();
    const apnPassword = el('ltepass').value;
    const pin = el('ltepin').value.trim();

    if (pin) {
      lines.push('/interface lte settings set pin1="' + q(pin) + '"');
    }

    lines.push(
      rosEnsure(
        '/interface lte apn add name=apn-main apn="' + q(apn) + '"' +
        (apnUser ? ' user="' + q(apnUser) + '"' : '') +
        (apnPassword ? ' password="' + q(apnPassword) + '"' : ''),
        'LTE APN profile apn-main already exists'
      )
    );

    lines.push('/interface lte set ' + wanInterface + ' apn-profiles=apn-main');
    lines.push('# LTE створює default route автоматично після підключення.');
  }

  if (failoverEnabled) {
    const failoverInterface = lineValue(el('foif').value, 'lte1');
    const failoverType = el('fotype').value;
    const healthHost = lineValue(el('fohealthhost').value, '1.1.1.1');

    lines.push('');
    lines.push('# --- Failover: ' + failoverInterface + ' ---');

    if (failoverType === 'dhcp') {
      lines.push(
        '/ip dhcp-client add interface=' + failoverInterface +
        ' disabled=no add-default-route=yes default-route-distance=2'
      );
    }

    if (failoverType === 'static') {
      const ip = sip(el('foip').value) || '203.0.113.20/24';
      const gateway = sip(el('fogw').value) || '203.0.113.1';

      lines.push('/ip address add address=' + ip + ' interface=' + failoverInterface);
      lines.push(
        '/ip route add dst-address=0.0.0.0/0 gateway=' + gateway +
        ' distance=2 check-gateway=ping comment="failover default route"'
      );
    }

    if (failoverType === 'pppoe') {
      lines.push(
        '/interface pppoe-client add interface=' + failoverInterface +
        ' name=pppoe-failover' +
        ' user="' + q(lineValue(el('fouser').value, 'login@isp')) + '"' +
        ' password="' + q(el('fopass').value) + '"' +
        ' disabled=no add-default-route=yes default-route-distance=2'
      );
    }

    if (failoverType === 'lte') {
      const apn = lineValue(el('foapn').value, 'internet');
      const apnUser = el('foapnuser').value.trim();
      const apnPassword = el('foapnpass').value;
      const pin = el('fopin').value.trim();

      if (pin) {
        lines.push('/interface lte settings set pin1="' + q(pin) + '"');
      }

      lines.push(
        rosEnsure(
          '/interface lte apn add name=apn-failover apn="' + q(apn) + '"' +
          (apnUser ? ' user="' + q(apnUser) + '"' : '') +
          (apnPassword ? ' password="' + q(apnPassword) + '"' : ''),
          'LTE APN profile apn-failover already exists'
        )
      );

      lines.push('/interface lte set ' + failoverInterface + ' apn-profiles=apn-failover');
      lines.push(
        rosEnsure(
          '/ip route add dst-address=0.0.0.0/0 gateway=' + failoverInterface +
          ' distance=2 comment="failover LTE route"',
          'Failover LTE route already exists'
        )
      );
    }

    lines.push(
      rosEnsure(
        '/interface list member add list=WAN interface=' + failoverInterface,
        'WAN failover interface already exists: ' + failoverInterface
      )
    );

    lines.push(
      rosRemoveByComment('/tool netwatch', 'Failover health-check')
    );

    lines.push(
      '/tool netwatch add host=' + healthHost +
      ' interval=30s' +
      ' down-script=":log warning failover-down"' +
      ' up-script=":log info failover-up"' +
      ' comment="Failover health-check"'
    );
  }

  if (el('dhcpenable').checked) {
    const dhcpRange = lineValue(el('dhcprange').value, '192.168.88.10-192.168.88.254');
    const clientDns = sip(el('landns').value) || lanIp;

    lines.push('');
    lines.push('# --- DHCP LAN ---');
    lines.push(
      rosEnsure(
        '/ip pool add name=dhcp-pool ranges=' + dhcpRange,
        'DHCP pool already exists'
      )
    );

    lines.push(
      rosEnsure(
        '/ip dhcp-server add name=dhcp-lan interface=' + lanInterface +
        ' address-pool=dhcp-pool lease-time=1d disabled=no',
        'DHCP server dhcp-lan already exists'
      )
    );

    lines.push(
      rosEnsure(
        '/ip dhcp-server network add address=' + lanNetwork +
        ' gateway=' + lanIp +
        ' dns-server=' + clientDns,
        'DHCP network already exists'
      )
    );
  }

  lines.push('');
  lines.push('# --- DNS ---');
  lines.push(
    '/ip dns set servers=' + lineValue(el('upstreamdns').value, '1.1.1.1,8.8.8.8') +
    ' allow-remote-requests=' + (el('allowremote').checked ? 'yes' : 'no')
  );

  lines.push.apply(lines, genStaticDns());
  lines.push.apply(lines, genAddressList());

  if (el('natenable').checked) {
    lines.push('');
    lines.push('# --- NAT ---');
    lines.push(
      '/ip firewall nat add chain=srcnat action=masquerade' +
      ' out-interface-list=WAN ipsec-policy=out,none' +
      ' comment="defconf: masquerade"'
    );
  }

  lines.push.apply(lines, genPortForwarding());
  lines.push.apply(lines, genRoutes());

  if (el('wifienable').checked && model.wifi !== 'none') {
    const ssid = el('ssid').value.trim() || 'MyNetwork';
    const password = el('wifipass').value;

    lines.push('');

    if (!password) {
      lines.push('# --- Wi-Fi ---');
      lines.push('# ⚠ Пароль Wi‑Fi не задано. Wi‑Fi-блок не згенеровано.');
    } else if (model.wifi === 'legacy') {
      lines.push('# --- Wi-Fi legacy (wireless) ---');

      lines.push(
        rosEnsure(
          '/interface wireless security-profiles add name=wifi-sec' +
          ' mode=dynamic-keys authentication-types=wpa2-psk' +
          ' wpa2-pre-shared-key="' + q(password) + '"',
          'Wi-Fi security profile wifi-sec already exists'
        )
      );

      if (el('band24').checked) {
        lines.push(
          '/interface wireless set wlan1 mode=ap-bridge' +
          ' band=2ghz-b/g/n ssid="' + q(ssid) + '"' +
          ' security-profile=wifi-sec disabled=no'
        );

        if (!model.single) {
          lines.push(
            rosEnsure(
              '/interface bridge port add bridge=bridge-lan interface=wlan1',
              'Bridge port already exists: wlan1'
            )
          );
        }
      }

      if (el('band5').checked) {
        lines.push(
          '/interface wireless set wlan2 mode=ap-bridge' +
          ' band=5ghz-a/n/ac ssid="' + q(ssid) + '"' +
          ' security-profile=wifi-sec disabled=no'
        );

        if (!model.single) {
          lines.push(
            rosEnsure(
              '/interface bridge port add bridge=bridge-lan interface=wlan2',
              'Bridge port already exists: wlan2'
            )
          );
        }
      }
    } else if (firmware !== '6.x') {
      const wifiMenu = firmware === '7.13+' ? '/interface wifi' : '/interface wifiwave2';

      lines.push('# --- Wi-Fi 6 ---');

      if (el('band5').checked) {
        lines.push(
          wifiMenu + ' set wifi1 disabled=no' +
          ' configuration.ssid="' + q(ssid) + '"' +
          ' configuration.mode=ap' +
          ' security.authentication-types=wpa2-psk,wpa3-psk' +
          ' security.passphrase="' + q(password) + '"'
        );

        if (!model.single) {
          lines.push(
            rosEnsure(
              '/interface bridge port add bridge=bridge-lan interface=wifi1',
              'Bridge port already exists: wifi1'
            )
          );
        }
      }

      if (el('band24').checked) {
        lines.push(
          wifiMenu + ' set wifi2 disabled=no' +
          ' configuration.ssid="' + q(ssid) + '"' +
          ' configuration.mode=ap' +
          ' security.authentication-types=wpa2-psk,wpa3-psk' +
          ' security.passphrase="' + q(password) + '"'
        );

        if (!model.single) {
          lines.push(
            rosEnsure(
              '/interface bridge port add bridge=bridge-lan interface=wifi2',
              'Bridge port already exists: wifi2'
            )
          );
        }
      }
    } else {
      lines.push('# ⚠ Wi‑Fi 6 не підтримується у RouterOS 6.x.');
    }
  }

  lines.push.apply(lines, genCapsman());

  if (el('guestenable').checked && !model.single) {
    const vlan = lineValue(el('guestvlan').value, '20');
    const guestIpCidr = sip(el('guestip').value) || '192.168.20.1/24';
    const guestIp = sip(guestIpCidr.split('/')[0]);
    const guestNetwork = calcNet(guestIpCidr);
    const guestRange = lineValue(el('guestrange').value, '192.168.20.10-192.168.20.254');

    lines.push('');
    lines.push('# --- Гостьова мережа (VLAN ' + vlan + ') ---');
    lines.push('# ⚠ Для фізичних trunk/access-портів налаштуй bridge VLAN filtering окремо.');
    lines.push(
      rosEnsure(
        '/interface bridge add name=bridge-guest protocol-mode=rstp',
        'Bridge bridge-guest already exists'
      )
    );

    lines.push(
      rosEnsure(
        '/interface vlan add name=vlan-guest vlan-id=' + vlan + ' interface=bridge-lan',
        'VLAN vlan-guest already exists'
      )
    );

    lines.push(
      rosEnsure(
        '/interface bridge port add bridge=bridge-guest interface=vlan-guest',
        'Guest bridge VLAN port already exists'
      )
    );

    lines.push(
      rosEnsure(
        '/ip address add address=' + guestIpCidr + ' interface=bridge-guest',
        'Guest IP address already exists'
      )
    );

    lines.push(
      rosEnsure(
        '/ip pool add name=guest-pool ranges=' + guestRange,
        'Guest DHCP pool already exists'
      )
    );

    lines.push(
      rosEnsure(
        '/ip dhcp-server add name=dhcp-guest interface=bridge-guest' +
        ' address-pool=guest-pool lease-time=1d disabled=no',
        'Guest DHCP server already exists'
      )
    );

    lines.push(
      rosEnsure(
        '/ip dhcp-server network add address=' + guestNetwork +
        ' gateway=' + guestIp +
        ' dns-server=' + guestIp,
        'Guest DHCP network already exists'
      )
    );

    lines.push(
      '/ip firewall filter add chain=forward in-interface=bridge-guest' +
      ' out-interface=bridge-lan action=drop' +
      ' comment="isolate guest from LAN"'
    );

    lines.push(
      '/ip firewall filter add chain=forward in-interface=bridge-lan' +
      ' out-interface=bridge-guest action=drop' +
      ' comment="isolate LAN from guest"'
    );

    lines.push(
      '/ip firewall filter add chain=input in-interface=bridge-guest' +
      ' protocol=udp dst-port=53 action=accept comment="allow guest DNS UDP"'
    );

    lines.push(
      '/ip firewall filter add chain=input in-interface=bridge-guest' +
      ' protocol=tcp dst-port=53 action=accept comment="allow guest DNS TCP"'
    );

    lines.push(
      '/ip firewall filter add chain=input in-interface=bridge-guest' +
      ' protocol=udp dst-port=67-68 action=accept comment="allow guest DHCP"'
    );

    lines.push(
      '/ip firewall filter add chain=input in-interface=bridge-guest' +
      ' action=drop comment="block guest router access"'
    );

    if (el('guestwifi').checked && el('wifienable').checked && model.wifi === 'legacy') {
      const guestSsid = el('guestssid').value.trim() || 'Guest-WiFi';
      const guestPassword = el('guestwifipass').value;

      if (guestPassword) {
        lines.push(
          rosEnsure(
            '/interface wireless security-profiles add name=guest-sec' +
            ' mode=dynamic-keys authentication-types=wpa2-psk' +
            ' wpa2-pre-shared-key="' + q(guestPassword) + '"',
            'Guest Wi-Fi security profile already exists'
          )
        );

        if (el('band24').checked) {
          lines.push(
            rosEnsure(
              '/interface wireless add master-interface=wlan1 name=wlan1-guest' +
              ' ssid="' + q(guestSsid) + '"' +
              ' security-profile=guest-sec disabled=no',
              'Guest Wi-Fi interface already exists: wlan1-guest'
            )
          );

          lines.push(
            rosEnsure(
              '/interface bridge port add bridge=bridge-guest interface=wlan1-guest',
              'Guest bridge port already exists: wlan1-guest'
            )
          );
        }

        if (el('band5').checked) {
          lines.push(
            rosEnsure(
              '/interface wireless add master-interface=wlan2 name=wlan2-guest' +
              ' ssid="' + q(guestSsid) + '"' +
              ' security-profile=guest-sec disabled=no',
              'Guest Wi-Fi interface already exists: wlan2-guest'
            )
          );

          lines.push(
            rosEnsure(
              '/interface bridge port add bridge=bridge-guest interface=wlan2-guest',
              'Guest bridge port already exists: wlan2-guest'
            )
          );
        }
      } else {
        lines.push('# ⚠ Пароль гостьового Wi‑Fi не задано.');
      }
    }

    if (el('guestwifi').checked && model.wifi === 'wifi6') {
      lines.push('# ⚠ Гостьовий Wi‑Fi 6 потребує окремого slave/configuration профілю; налаштуй вручну.');
    }
  }

  if (el('wgenable').checked && firmware !== '6.x') {
    const wgPort = lineValue(el('wgport').value, '51820');
    const wgIp = sip(el('wgserverip').value) || '10.20.30.1/24';

    lines.push('');
    lines.push('# --- WireGuard VPN ---');

    lines.push(
      rosEnsure(
        '/interface wireguard add name=wg1 listen-port=' + wgPort,
        'WireGuard interface wg1 already exists'
      )
    );

    lines.push(
      rosEnsure(
        '/ip address add address=' + wgIp + ' interface=wg1',
        'WireGuard IP address already exists'
      )
    );

    lines.push(
      rosEnsure(
        '/interface list member add list=LAN interface=wg1',
        'WireGuard LAN member already exists'
      )
    );

    const peers = el('wgpeers').value.trim();

    if (peers) {
      peers.split('\n').forEach(function(line) {
        const value = line.trim();
        if (!value || value.startsWith('#')) return;

        const parts = value.split(':');
        const peerName = parts[0] ? parts[0].trim() : '';
        const publicKey = parts[1] ? parts[1].trim() : '';
        const allowedAddress = parts[2] ? parts[2].trim() : '';

        if (publicKey && isCIDR(allowedAddress)) {
          lines.push(
            '/interface wireguard peers add interface=wg1' +
            ' public-key="' + q(publicKey) + '"' +
            ' allowed-address=' + allowedAddress +
            (peerName ? ' comment="' + q(peerName) + '"' : '')
          );
        }
      });
    }

    lines.push('# Публічний ключ сервера: /interface wireguard print');
  }

  if (el('ovpnenable').checked) {
    const port = lineValue(el('ovpnport').value, '1194');
    const localAddress = sip(el('ovpnlocal').value) || '10.10.10.1';
    const range = lineValue(el('ovpnrange').value, '10.10.10.2-10.10.10.254');
    const cipher = el('ovpncipher').value;
    const requireCert = el('ovpnreqcert').checked ? 'yes' : 'no';

    lines.push('');
    lines.push('# --- OpenVPN сервер ---');

    if (
      (cipher === 'aes256-gcm' && firmware !== '7.13+') ||
      (cipher === 'blowfish128' && firmware !== '6.x')
    ) {
      lines.push('# ⚠ Вибране шифрування не сумісне з RouterOS ' + firmware + '.');
    } else {
      lines.push('# Створення CA та серверного сертифіката.');
      lines.push('# Перед повторним запуском перевір: /certificate print');

      lines.push(
        rosEnsure(
          '/certificate add name=ovpn-ca-template common-name=ovpn-ca' +
          ' key-usage=key-cert-sign,crl-sign days-valid=3650',
          'OpenVPN CA template already exists'
        )
      );

      lines.push(
        ':do { /certificate sign ovpn-ca-template name=ovpn-ca ca-crl-host=127.0.0.1 } on-error={ :log info "OpenVPN CA already signed" }'
      );

      lines.push(':delay 5s');

      lines.push(
        rosEnsure(
          '/certificate add name=ovpn-server-template common-name=ovpn-server' +
          ' key-usage=digital-signature,key-encipherment,tls-server days-valid=1825',
          'OpenVPN server certificate template already exists'
        )
      );

      lines.push(
        ':do { /certificate sign ovpn-server-template name=ovpn-server ca=ovpn-ca } on-error={ :log info "OpenVPN server certificate already signed" }'
      );

      lines.push(':delay 5s');

      lines.push(
        rosEnsure(
          '/ip pool add name=ovpn-pool ranges=' + range,
          'OpenVPN pool already exists'
        )
      );

      lines.push(
        rosEnsure(
          '/ppp profile add name=ovpn-profile local-address=' + localAddress +
          ' remote-address=ovpn-pool dns-server=' + (sip(el('landns').value) || '8.8.8.8'),
          'OpenVPN PPP profile already exists'
        )
      );

      const users = el('ovpnusers').value.trim();

      if (users) {
        users.split('\n').forEach(function(line) {
          const value = line.trim();
          if (!value || value.startsWith('#')) return;

          const separator = value.indexOf(':');
          const username = separator >= 0 ? value.slice(0, separator).trim() : value;
          const password = separator >= 0 ? value.slice(separator + 1).trim() : '';

          if (username && password) {
            lines.push(
              '/ppp secret add name="' + q(username) + '"' +
              ' password="' + q(password) + '"' +
              ' service=ovpn profile=ovpn-profile'
            );
          }
        });
      }

      lines.push(
        '/interface ovpn-server server set enabled=yes' +
        ' port=' + port +
        ' certificate=ovpn-server' +
        ' cipher=' + cipher +
        ' auth=sha256 default-profile=ovpn-profile' +
        ' require-client-certificate=' + requireCert
      );
    }
  }

  lines.push.apply(lines, genOpenVpnClient());
  lines.push.apply(lines, genIpsec());

  if (el('macprotect').checked) {
    lines.push('');
    lines.push('# --- Захист MAC ---');
    lines.push('/tool mac-server set allowed-interface-list=LAN');
    lines.push('/tool mac-server mac-winbox set allowed-interface-list=LAN');
    lines.push('/tool mac-server ping set enabled=no');
  }

  if (el('basicfw').checked) {
    lines.push('');
    lines.push('# --- Firewall (defconf-подібний) ---');

    lines.push(
      '/ip firewall filter add chain=input action=accept' +
      ' connection-state=established,related,untracked' +
      ' comment="defconf: accept established,related,untracked"'
    );

    lines.push(
      '/ip firewall filter add chain=input action=drop connection-state=invalid' +
      ' comment="defconf: drop invalid"'
    );

    lines.push(
      '/ip firewall filter add chain=input action=accept protocol=icmp' +
      ' comment="defconf: accept ICMP"'
    );

    lines.push(
      '/ip firewall filter add chain=input action=accept in-interface=lo' +
      ' src-address=127.0.0.1 dst-address=127.0.0.1' +
      ' comment="defconf: accept loopback"'
    );

    if (el('dnsprotect').checked) {
      lines.push(
        '/ip firewall filter add chain=input protocol=udp dst-port=53' +
        ' in-interface-list=WAN action=drop comment="block DNS UDP from WAN"'
      );

      lines.push(
        '/ip firewall filter add chain=input protocol=tcp dst-port=53' +
        ' in-interface-list=WAN action=drop comment="block DNS TCP from WAN"'
      );
    }

    if (el('ovpnenable').checked) {
      lines.push(
        '/ip firewall filter add chain=input protocol=tcp' +
        ' dst-port=' + lineValue(el('ovpnport').value, '1194') +
        ' in-interface-list=WAN action=accept comment="allow OpenVPN"'
      );
    }

    if (el('wgenable').checked && firmware !== '6.x') {
      lines.push(
        '/ip firewall filter add chain=input protocol=udp' +
        ' dst-port=' + lineValue(el('wgport').value, '51820') +
        ' in-interface-list=WAN action=accept comment="allow WireGuard"'
      );
    }

    if (el('ipsecenable').checked) {
      lines.push(
        '/ip firewall filter add chain=input protocol=udp dst-port=500,4500' +
        ' in-interface-list=WAN action=accept comment="allow IPsec IKE"'
      );

      lines.push(
        '/ip firewall filter add chain=input protocol=ipsec-esp' +
        ' in-interface-list=WAN action=accept comment="allow IPsec ESP"'
      );
    }

    lines.push(
      '/ip firewall filter add chain=input action=drop in-interface-list=!LAN' +
      (el('logwandrops').checked ? ' log=yes log-prefix="WAN-DROP: "' : '') +
      ' comment="defconf: drop all not from LAN"'
    );

    lines.push(
      '/ip firewall filter add chain=forward action=accept ipsec-policy=in,ipsec' +
      ' comment="defconf: accept in ipsec"'
    );

    lines.push(
      '/ip firewall filter add chain=forward action=accept ipsec-policy=out,ipsec' +
      ' comment="defconf: accept out ipsec"'
    );

    if (el('fasttrack').checked) {
      lines.push(
        '/ip firewall filter add chain=forward action=fasttrack-connection' +
        ' connection-state=established,related' +
        (el('fasttrackhw').checked ? ' hw-offload=yes' : '') +
        ' comment="defconf: fasttrack"'
      );
    }

    lines.push(
      '/ip firewall filter add chain=forward action=accept' +
      ' connection-state=established,related,untracked' +
      ' comment="defconf: accept established,related,untracked"'
    );

    lines.push(
      '/ip firewall filter add chain=forward action=drop connection-state=invalid' +
      ' comment="defconf: drop invalid"'
    );

    lines.push(
      '/ip firewall filter add chain=forward action=drop' +
      ' in-interface-list=WAN connection-nat-state=!dstnat' +
      ' comment="defconf: drop WAN not DSTNATed"'
    );
  } else if (el('dnsprotect').checked) {
    lines.push('');
    lines.push('# --- Захист DNS із WAN ---');
    lines.push('/ip firewall filter add chain=input protocol=udp dst-port=53 in-interface-list=WAN action=drop');
    lines.push('/ip firewall filter add chain=input protocol=tcp dst-port=53 in-interface-list=WAN action=drop');
  }

  if (el('disableservices').checked) {
    lines.push('');
    lines.push('# --- Вимкнення сервісів ---');
    lines.push('/ip service disable telnet,ftp,www,api,api-ssl');
  }

  if (el('disablesvcports').checked) {
    lines.push('');
    lines.push('# --- Вимкнення service-ports ---');
    lines.push('/ip firewall service-port set ftp disabled=yes');
    lines.push('/ip firewall service-port set tftp disabled=yes');
    lines.push('/ip firewall service-port set h323 disabled=yes');
    lines.push('/ip firewall service-port set sip disabled=yes');
    lines.push('/ip firewall service-port set pptp disabled=yes');
  }

  lines.push.apply(lines, genNtp());

  if (el('netwatchenable').checked) {
    lines.push('');
    lines.push('# --- Netwatch ---');

    lines.push(rosRemoveByComment('/tool netwatch', 'WAN availability check'));

    lines.push(
      '/tool netwatch add host=' + lineValue(el('netwatchhost').value, '8.8.8.8') +
      ' interval=' + lineValue(el('netwatchinterval').value, '30s') +
      ' down-script=":log warning netwatch-down"' +
      ' up-script=":log info netwatch-up"' +
      ' comment="WAN availability check"'
    );
  }

  if (el('safetynet').checked && el('backupenable').checked) {
    const minutes = Math.max(1, Math.min(120, Number(el('safetyminutes').value) || 10));

    lines.push('');
    lines.push('# --- Запобіжник від блокування ---');
    lines.push('# Якщо все працює — видали scheduler після перевірки.');
    lines.push(rosRemoveByComment('/system scheduler', 'Safety net auto revert'));

    lines.push(
      '/system scheduler add name=safety-net-revert' +
      ' interval=' + minutes + 'm' +
      ' start-time=startup' +
      ' comment="Safety net auto revert"' +
      ' on-event="/system backup load name=backup-before-config dont-encrypt=yes"'
    );

    lines.push('# Після успішної перевірки: /system scheduler remove [find name=safety-net-revert]');
  }

  const customCommands = el('customcmds').value.trim();

  if (customCommands) {
    lines.push('');
    lines.push('# --- Власні команди ---');

    customCommands.split('\n').forEach(function(line) {
      if (line.trim()) lines.push(line);
    });
  }

  var _rosRaw = lines.join('\n');
  var _outEl = el('output');
  if (typeof highlightRos === 'function') {
    _outEl.innerHTML = highlightRos(_rosRaw);
  } else {
    _outEl.textContent = _rosRaw;
  }
}

/* ── genStaticDns() ── */
function genStaticDns() {
  if (!el('dnsstaticenable').checked) return [];

  const raw = el('dnsstaticentries').value.trim();
  if (!raw) return [];

  const lines = ['', '# --- Static DNS ---'];

  raw.split('\n').forEach(function(line) {
    const value = line.trim();
    if (!value || value.startsWith('#')) return;

    const separator = value.indexOf('=');
    if (separator < 1) return;

    const name = value.slice(0, separator).trim();
    const address = sip(value.slice(separator + 1));

    if (name && isIPv4(address)) {
      lines.push('/ip dns static add name="' + q(name) + '" address=' + address);
    }
  });

  return lines;
}

/* ── genAddressList() ── */
function genAddressList() {
  if (!el('addrlistenable').checked) return [];

  const raw = el('addrlistentries').value.trim();
  if (!raw) return [];

  const lines = ['', '# --- Address-List ---'];

  raw.split('\n').forEach(function(line) {
    const value = line.trim();
    if (!value || value.startsWith('#')) return;

    const separator = value.indexOf('=');
    if (separator < 1) return;

    const list = value.slice(0, separator).trim();
    const address = sip(value.slice(separator + 1));

    if (list && (isIPv4(address) || isCIDR(address))) {
      lines.push('/ip firewall address-list add list="' + q(list) + '" address=' + address);
    }
  });

  return lines;
}

/* ── genPortForwarding() ── */
function genPortForwarding() {
  if (!el('pfwenable').checked) return [];

  const raw = el('pfwrules').value.trim();
  if (!raw) return [];

  const lines = ['', '# --- Port Forwarding (DST-NAT) ---'];

  raw.split('\n').forEach(function(line) {
    const value = line.trim();
    if (!value || value.startsWith('#')) return;

    const parts = value.split(':');
    if (parts.length < 4) return;

    const protocol = parts[0].trim().toLowerCase();
    const externalPort = parts[1].trim();
    const internalIp = sip(parts[2]);
    const internalPort = parts[3].trim();
    const comment = parts.slice(4).join(':').trim();

    if (
      ['tcp', 'udp'].includes(protocol) &&
      isPort(externalPort) &&
      isIPv4(internalIp) &&
      isPort(internalPort)
    ) {
      lines.push(
        '/ip firewall nat add chain=dstnat protocol=' + protocol +
        ' dst-port=' + externalPort +
        ' action=dst-nat to-addresses=' + internalIp +
        ' to-ports=' + internalPort +
        (comment ? ' comment="' + q(comment) + '"' : '')
      );
    }
  });

  return lines;
}

/* ── genRoutes() ── */
function genRoutes() {
  if (!el('routesenable').checked) return [];

  const raw = el('routesentries').value.trim();
  if (!raw) return [];

  const lines = ['', '# --- Статичні маршрути ---'];

  raw.split('\n').forEach(function(line) {
    const value = line.trim();
    if (!value || value.startsWith('#')) return;

    const equalIndex = value.indexOf('=');
    if (equalIndex < 1) return;

    const destination = sip(value.slice(0, equalIndex));
    const params = value.slice(equalIndex + 1).trim().split(':');
    const gateway = sip(params[0]);
    const distance = params[1] ? params[1].trim() : '1';
    const comment = params.slice(2).join(':').trim();

   if (!/^\d+$/.test(distance) || +distance < 1 || +distance > 255) {
      lines.push(
        '/ip route add dst-address=' + destination +
        ' gateway=' + gateway +
        ' distance=' + distance +
        (comment ? ' comment="' + q(comment) + '"' : '')
      );
    }
  });

  return lines;
}

/* ── genOpenVpnClient() ── */
function genOpenVpnClient() {
  if (!el('ovpnclenable').checked) return [];

  const server = el('ovpnclserver').value.trim();
  if (!server) return [];

  const firmware = el('firmware').value;
  const cipher = el('ovpnclcipher').value;
  const name = rosSafeName(el('ovpnclname').value, 'ovpn-client1');
  const port = lineValue(el('ovpnclport').value, '1194');

  const lines = ['', '# --- OpenVPN клієнт ---'];

  if (cipher === 'aes256-gcm' && firmware !== '7.13+') {
    lines.push('# ⚠ aes256-gcm потребує RouterOS 7.13+');
    return lines;
  }

  if (cipher === 'blowfish128' && firmware !== '6.x') {
    lines.push('# ⚠ blowfish128 підтримується лише RouterOS 6.x');
    return lines;
  }

  let command =
    '/interface ovpn-client add name="' + q(name) + '"' +
    ' connect-to="' + q(server) + '"' +
    ' port=' + port +
    ' cipher=' + cipher;

  const user = el('ovpncluser').value.trim();
  const password = el('ovpnclpass').value;
  const certificate = el('ovpnclcert').value.trim();
  const mac = el('ovpnclmac').value.trim();

  if (user) command += ' user="' + q(user) + '"';
  if (password) command += ' password="' + q(password) + '"';
  if (certificate) command += ' certificate="' + q(certificate) + '"';
  if (mac) if (mac && !isMac(mac)) {
        lines.push('# [!] MAC-адреса некоректна: ' + mac + ' — параметр пропущено');
      } else if (mac) {
        command += ' mac-address=' + q(mac);
      }

  command += ' disabled=no';

  lines.push(command);
  lines.push('# Перевір: /interface ovpn-client print');

  return lines;
}

/* ── genIpsec() ── */
function genIpsec() {
  if (!el('ipsecenable').checked) return [];

  const rawPeers = el('ipsecpeers').value.trim();
  if (!rawPeers) return [];

  const encryption = el('ipsecenc').value;
  const hash = el('ipsechash').value;

  /*
    Для RouterOS:
    aes-256 -> aes-256-cbc
    aes-128 -> aes-128-cbc
    3des    -> 3des
  */
  const proposalEncryption = encryption === '3des'
    ? '3des'
    : encryption + '-cbc';

  const lines = ['', '# --- IPsec ---'];

  rawPeers.split('\n').forEach(function(line) {
    const value = line.trim();
    if (!value || value.startsWith('#')) return;

    const parts = value.split(':');

    const peerName = rosSafeName(parts[0], 'peer');
    const peerAddress = sip(parts[1] || '');
    const psk = parts[2] ? parts[2].trim() : '';
    const mode = (parts[3] || 'ike2').trim();

    if (!peerAddress) return;

    lines.push(
      rosEnsure(
        '/ip ipsec profile add name="profile-' + q(peerName) + '"' +
        ' enc-algorithm=' + encryption +
        ' hash-algorithm=' + hash +
        ' dh-group=modp2048',
        'IPsec profile exists: ' + peerName
      )
    );

    lines.push(
      rosEnsure(
        '/ip ipsec proposal add name="proposal-' + q(peerName) + '"' +
        ' enc-algorithms=' + proposalEncryption +
        ' auth-algorithms=' + hash +
        ' pfs-group=none',
        'IPsec proposal exists: ' + peerName
      )
    );

    lines.push(
      rosEnsure(
        '/ip ipsec peer add name="' + q(peerName) + '"' +
        ' address=' + peerAddress + '/32' +
        ' exchange-mode=' + q(mode) +
        ' profile="profile-' + q(peerName) + '"',
        'IPsec peer exists: ' + peerName
      )
    );

    if (psk) {
      lines.push(
        '/ip ipsec identity add peer="' + q(peerName) + '"' +
        ' auth-method=pre-shared-key secret="' + q(psk) + '"'
      );
    } else {
      lines.push('# ⚠ PSK для IPsec peer "' + peerName + '" не вказано.');
    }
  });

  const policies = el('ipsecpolicies').value.trim();

  if (policies) {
    lines.push('');

    policies.split('\n').forEach(function(line) {
      const value = line.trim();
      if (!value || value.startsWith('#')) return;

      const parts = value.split(':');
      const peer = rosSafeName(parts[0], 'peer');
      const source = sip(parts[1] || '');
      const destination = sip(parts[2] || '');

      if (isCIDR(source) && isCIDR(destination)) {
        lines.push(
          '/ip ipsec policy add peer="' + q(peer) + '"' +
          ' src-address=' + source +
          ' dst-address=' + destination +
          ' proposal="proposal-' + q(peer) + '"' +
          ' tunnel=yes'
        );
      }
    });
  }

  lines.push('# Перевір: /ip ipsec active-peers print');

  return lines;
}

/* ── genCapsman() ── */
function genCapsman() {
  if (!el('capsmanenable').checked) return [];

  const firmware = el('firmware').value;
  const ssid = el('capsmanssid').value.trim() || 'CAPsMAN';
  const password = el('capsmanpass').value.trim();

  if (!password) {
    return [
      '',
      '# --- CAPsMAN ---',
      '# ⚠ Пароль CAPsMAN не задано. Блок не згенеровано.'
    ];
  }

  const channel24 = el('capsman24ch').value.trim() || '2417/20/gn';
  const channel5 = el('capsman5ch').value.trim() || '5180/80/ac';

  const parts24 = channel24.split('/');
  const parts5 = channel5.split('/');

  const freq24 = parts24[0] || '2417';
  const width24 = parts24[1] || '20';
  const freq5 = parts5[0] || '5180';
  const width5 = parts5[1] || '80';

  const lines = [''];

  if (firmware === '6.x') {
    lines.push('# --- CAPsMAN v1 (RouterOS 6) ---');
    lines.push('/caps-man manager set enabled=yes');

    lines.push(
      rosEnsure(
        '/caps-man channel add name="ch-2ghz" frequency=' + freq24 +
        ' width=' + width24 +
        ' band=2ghz-g/n',
        'CAPsMAN channel exists: ch-2ghz'
      )
    );

    lines.push(
      rosEnsure(
        '/caps-man channel add name="ch-5ghz" frequency=' + freq5 +
        ' width=' + width5 +
        ' band=5ghz-a/n/ac',
        'CAPsMAN channel exists: ch-5ghz'
      )
    );

    lines.push(
      rosEnsure(
        '/caps-man security add name="sec-wpa2"' +
        ' authentication-types=wpa2-psk' +
        ' passphrase="' + q(password) + '"',
        'CAPsMAN security profile exists'
      )
    );

    lines.push(
      rosEnsure(
        '/caps-man configuration add name="cfg-2ghz"' +
        ' ssid="' + q(ssid) + '"' +
        ' channel=ch-2ghz security=sec-wpa2 mode=ap',
        'CAPsMAN configuration exists: cfg-2ghz'
      )
    );

    lines.push(
      rosEnsure(
        '/caps-man configuration add name="cfg-5ghz"' +
        ' ssid="' + q(ssid) + '_5G"' +
        ' channel=ch-5ghz security=sec-wpa2 mode=ap',
        'CAPsMAN configuration exists: cfg-5ghz'
      )
    );

    lines.push(
      rosEnsure(
        '/caps-man provisioning add action=create-dynamic-enabled' +
        ' master-configuration=cfg-2ghz hw-supported-modes=gn',
        'CAPsMAN provisioning exists: 2ghz'
      )
    );

    lines.push(
      rosEnsure(
        '/caps-man provisioning add action=create-dynamic-enabled' +
        ' master-configuration=cfg-5ghz hw-supported-modes=an,ac',
        'CAPsMAN provisioning exists: 5ghz'
      )
    );

    return lines;
  }

  lines.push('# --- CAPsMAN / WiFi CAPsMAN (RouterOS 7) ---');
  lines.push('# ⚠ Підтримка залежить від установленого WiFi-пакета та конкретної моделі.');
  lines.push('/interface wifi capsman set enabled=yes');

  lines.push(
    rosEnsure(
      '/interface wifi configuration add name="cfg-2ghz"' +
      ' ssid="' + q(ssid) + '"' +
      ' mode=ap' +
      ' security.authentication-types=wpa2-psk,wpa3-psk' +
      ' security.passphrase="' + q(password) + '"' +
      ' channel.frequency=' + freq24 +
      ' channel.width=' + width24,
      'WiFi CAPsMAN config exists: cfg-2ghz'
    )
  );

  lines.push(
    rosEnsure(
      '/interface wifi configuration add name="cfg-5ghz"' +
      ' ssid="' + q(ssid) + '_5G"' +
      ' mode=ap' +
      ' security.authentication-types=wpa2-psk,wpa3-psk' +
      ' security.passphrase="' + q(password) + '"' +
      ' channel.frequency=' + freq5 +
      ' channel.width=' + width5,
      'WiFi CAPsMAN config exists: cfg-5ghz'
    )
  );

  lines.push(
    rosEnsure(
      '/interface wifi provisioning add action=create-dynamic-enabled' +
      ' master-configuration=cfg-2ghz supported-bands=2ghz-g/n',
      'WiFi CAPsMAN provisioning exists: 2ghz'
    )
  );

  lines.push(
    rosEnsure(
      '/interface wifi provisioning add action=create-dynamic-enabled' +
      ' master-configuration=cfg-5ghz supported-bands=5ghz-a/n/ac',
      'WiFi CAPsMAN provisioning exists: 5ghz'
    )
  );

  return lines;
}

/* ── genNtp() ── */
function genNtp() {
  if (!el('ntpenable').checked) return [];

  const firmware = el('firmware').value;
  const lines = ['', '# --- NTP ---'];

  if (firmware === '6.x') {
    lines.push(
      '# RouterOS 6.x використовує IP-адреси primary-ntp та secondary-ntp.'
    );
    lines.push(
      '/system ntp client set enabled=yes primary-ntp=162.159.200.1 secondary-ntp=162.159.200.123'
    );
  } else {
    lines.push('/system ntp client set enabled=yes');
    lines.push(
      rosEnsure(
        '/system ntp client servers add address=pool.ntp.org',
        'NTP server already exists'
      )
    );
  }

  return lines;
}


/* ── Маркер для перевірки завантаження ── */
window._generatorsLoaded = true;
window._generatorsFunctions = ['rosEnsure', 'rosSafeName', 'render', 'genStaticDns', 'genAddressList', 'genPortForwarding', 'genRoutes', 'genOpenVpnClient', 'genIpsec', 'genCapsman', 'genNtp'];
console.log('[generators.js] Завантажено — ' + 
  window._generatorsFunctions.length + ' функцій');
