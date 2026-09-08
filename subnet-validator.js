'use strict';

/* ══════════════════════════════════════════════════════
   Subnet Validator — детальна перевірка мереж
   ══════════════════════════════════════════════════════ */

(function() {

  /* ── Утиліти ── */
  function ipToInt(ip) {
    var parts = ip.trim().split('.');
    if (parts.length !== 4) return null;
    var result = 0;
    for (var i = 0; i < 4; i++) {
      var n = parseInt(parts[i], 10);
      if (isNaN(n) || n < 0 || n > 255) return null;
      result = (result << 8) | n;
    }
    return result >>> 0;
  }

  function parseCIDR(cidr) {
    var parts = String(cidr).trim().split('/');
    if (parts.length !== 2) return null;
    var ip     = parts[0].trim();
    var prefix = parseInt(parts[1], 10);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) return null;
    var ipInt = ipToInt(ip);
    if (ipInt === null) return null;
    var mask    = prefix === 0 ? 0 : ((~0) << (32 - prefix)) >>> 0;
    var network = (ipInt & mask) >>> 0;
    var bcast   = (network | (~mask >>> 0)) >>> 0;
    return { ip: ipInt, prefix: prefix, mask: mask, network: network, broadcast: bcast, str: ip + '/' + prefix };
  }

  function intToIp(n) {
    return [
      (n >>> 24) & 255,
      (n >>> 16) & 255,
      (n >>>  8) & 255,
       n         & 255,
    ].join('.');
  }

  function isValidIP(ip) {
    return ipToInt(ip.trim()) !== null;
  }

  function isValidCIDR(cidr) {
    return parseCIDR(cidr) !== null;
  }

  function networksOverlap(cidr1, cidr2) {
    var a = parseCIDR(cidr1);
    var b = parseCIDR(cidr2);
    if (!a || !b) return false;
    return a.network <= b.broadcast && b.network <= a.broadcast;
  }

  function ipInSubnet(ip, cidr) {
    var ipInt = ipToInt(ip.trim());
    var net   = parseCIDR(cidr);
    if (!ipInt || !net) return false;
    return (ipInt & net.mask) >>> 0 === net.network;
  }

  function parseRange(range) {
    var parts = range.trim().split('-');
    if (parts.length !== 2) return null;
    var start = ipToInt(parts[0].trim());
    var end   = ipToInt(parts[1].trim());
    if (!start || !end) return null;
    return { start: start, end: end };
  }

  function isPrivateIP(ip) {
    var n = ipToInt(ip);
    if (!n) return false;
    return (
      (n >= ipToInt('10.0.0.0')     && n <= ipToInt('10.255.255.255'))  ||
      (n >= ipToInt('172.16.0.0')   && n <= ipToInt('172.31.255.255'))  ||
      (n >= ipToInt('192.168.0.0')  && n <= ipToInt('192.168.255.255')) ||
      (n >= ipToInt('127.0.0.0')    && n <= ipToInt('127.255.255.255'))
    );
  }

  function el(id) { return document.getElementById(id); }

  /* ══════════════════════════════════════════════════════
     Основна функція валідації
     ══════════════════════════════════════════════════════ */
  function validateNetworks() {
    var results = [];
    var errors  = 0;
    var warnings = 0;
    var ok      = 0;

    function addResult(status, category, message, detail) {
      results.push({ status: status, category: category, message: message, detail: detail || '' });
      if (status === 'error')   errors++;
      if (status === 'warning') warnings++;
      if (status === 'ok')      ok++;
    }

    /* ── LAN IP ── */
    var lanIpVal = el('lanip') ? el('lanip').value.trim() : '';
    var lanNet   = null;
    if (!lanIpVal) {
      addResult('error', 'LAN', 'LAN IP не вказано', '');
    } else if (!isValidCIDR(lanIpVal)) {
      addResult('error', 'LAN', 'LAN IP некоректний формат', 'Очікується: 192.168.88.1/24');
    } else {
      lanNet = parseCIDR(lanIpVal);
      addResult('ok', 'LAN', 'LAN IP коректний: ' + lanIpVal,
        'Мережа: ' + intToIp(lanNet.network) + '/' + lanNet.prefix +
        ' | Broadcast: ' + intToIp(lanNet.broadcast) +
        ' | Хостів: ' + (lanNet.broadcast - lanNet.network - 1));
    }

    /* ── DHCP діапазон ── */
    var dhcpOn  = el('dhcpenable') && el('dhcpenable').checked;
    var dhcpVal = el('dhcprange') ? el('dhcprange').value.trim() : '';
    if (dhcpOn && dhcpVal) {
      var dhcpRange = parseRange(dhcpVal);
      if (!dhcpRange) {
        addResult('error', 'DHCP', 'Діапазон DHCP некоректний', 'Очікується: 192.168.88.10-192.168.88.254');
      } else {
        if (lanNet) {
          var startOk = (dhcpRange.start & lanNet.mask) >>> 0 === lanNet.network;
          var endOk   = (dhcpRange.end   & lanNet.mask) >>> 0 === lanNet.network;
          if (!startOk || !endOk) {
            addResult('error', 'DHCP',
              'Діапазон DHCP виходить за межі LAN підмережі',
              'LAN: ' + intToIp(lanNet.network) + '/' + lanNet.prefix +
              ' | DHCP: ' + dhcpVal);
          } else if (dhcpRange.start >= dhcpRange.end) {
            addResult('error', 'DHCP', 'Початок діапазону >= кінцю', dhcpVal);
          } else {
            var dhcpCount = dhcpRange.end - dhcpRange.start + 1;
            addResult('ok', 'DHCP',
              'Діапазон DHCP коректний: ' + dhcpVal,
              'Адрес в пулі: ' + dhcpCount +
              ' | Входить в LAN: ' + intToIp(lanNet.network) + '/' + lanNet.prefix);
            /* Перевірка чи IP роутера не в діапазоні DHCP */
            if (lanNet && dhcpRange.start <= lanNet.ip && lanNet.ip <= dhcpRange.end) {
              addResult('warning', 'DHCP',
                'IP роутера входить в DHCP діапазон — конфлікт!',
                'IP роутера: ' + intToIp(lanNet.ip) + ' | DHCP: ' + dhcpVal);
            }
          }
        }
      }
    }

    /* ── WAN ── */
    var wanType = el('wantype') ? el('wantype').value : 'dhcp';
    var wanIf   = el('wanif')   ? el('wanif').value.trim() : '';

    if (wanType === 'static') {
      var wanIpVal = el('wanip') ? el('wanip').value.trim() : '';
      var wanGwVal = el('wangw') ? el('wangw').value.trim() : '';
      if (!isValidCIDR(wanIpVal)) {
        addResult('error', 'WAN', 'WAN IP некоректний формат', 'Очікується: 203.0.113.10/24');
      } else {
        var wanNet = parseCIDR(wanIpVal);
        if (isPrivateIP(intToIp(wanNet.ip))) {
          addResult('warning', 'WAN', 'WAN IP є приватним — це нормально для PPPoE/NAT провайдерів', wanIpVal);
        } else {
          addResult('ok', 'WAN', 'WAN IP коректний: ' + wanIpVal, '');
        }
        if (lanNet && networksOverlap(wanIpVal, lanIpVal)) {
          addResult('error', 'WAN', 'WAN і LAN підмережі перетинаються!',
            'WAN: ' + wanIpVal + ' | LAN: ' + lanIpVal);
        }
        if (!isValidIP(wanGwVal)) {
          addResult('error', 'WAN', 'Gateway некоректний', 'Очікується: 203.0.113.1');
        } else if (wanNet && !ipInSubnet(wanGwVal, wanIpVal)) {
          addResult('warning', 'WAN', 'Gateway не в WAN підмережі', 'GW: ' + wanGwVal + ' | WAN: ' + wanIpVal);
        } else {
          addResult('ok', 'WAN', 'Gateway коректний: ' + wanGwVal, '');
        }
      }
    } else {
      addResult('ok', 'WAN', 'WAN тип: ' + wanType.toUpperCase() + ' (' + wanIf + ')', 'IP отримується автоматично');
    }

    /* ── Failover ── */
    var foOn = el('foenable') && el('foenable').checked;
    if (foOn) {
      var foIf = el('foif') ? el('foif').value.trim() : '';
      if (foIf === wanIf) {
        addResult('error', 'Failover', 'Резервний WAN = основний WAN!',
          'WAN: ' + wanIf + ' | Failover: ' + foIf);
      } else {
        addResult('ok', 'Failover', 'Failover інтерфейс: ' + foIf, 'Відрізняється від WAN: ' + wanIf);
      }
      var foType = el('fotype') ? el('fotype').value : 'lte';
      if (foType === 'static') {
        var foIpVal = el('foip') ? el('foip').value.trim() : '';
        if (foIpVal && lanNet && networksOverlap(foIpVal, lanIpVal)) {
          addResult('error', 'Failover', 'Failover і LAN підмережі перетинаються!',
            'Failover: ' + foIpVal + ' | LAN: ' + lanIpVal);
        }
      }
      var foHealth = el('fohealthhost') ? el('fohealthhost').value.trim() : '';
      if (foHealth && !isValidIP(foHealth)) {
        addResult('error', 'Failover', 'Health-check хост некоректний IP', foHealth);
      } else if (foHealth) {
        addResult('ok', 'Failover', 'Health-check хост: ' + foHealth, '');
      }
    }

    /* ── DNS ── */
    var dnsVal = el('upstreamdns') ? el('upstreamdns').value.trim() : '';
    if (dnsVal) {
      var dnsServers = dnsVal.split(',').map(function(d) { return d.trim(); });
      var dnsErrors  = [];
      dnsServers.forEach(function(dns) {
        if (!isValidIP(dns)) dnsErrors.push(dns);
      });
      if (dnsErrors.length) {
        addResult('error', 'DNS', 'Некоректні DNS сервери: ' + dnsErrors.join(', '), '');
      } else {
        addResult('ok', 'DNS', 'DNS сервери коректні: ' + dnsVal,
          'Кількість серверів: ' + dnsServers.length);
      }
    }

    /* ── WireGuard ── */
    var wgOn = el('wgenable') && el('wgenable').checked;
    if (wgOn) {
      var wgIp   = el('wgserverip') ? el('wgserverip').value.trim() : '';
      var wgPort = el('wgport')     ? el('wgport').value.trim()     : '';
      if (!isValidCIDR(wgIp)) {
        addResult('error', 'WireGuard', 'WireGuard IP некоректний', 'Очікується: 10.20.30.1/24');
      } else {
        if (lanNet && networksOverlap(wgIp, lanIpVal)) {
          addResult('error', 'WireGuard',
            'WireGuard і LAN підмережі перетинаються!',
            'WG: ' + wgIp + ' | LAN: ' + lanIpVal);
        } else {
          addResult('ok', 'WireGuard', 'WireGuard IP коректний: ' + wgIp, '');
        }
      }
      var wgPortN = parseInt(wgPort, 10);
      if (isNaN(wgPortN) || wgPortN < 1 || wgPortN > 65535) {
        addResult('error', 'WireGuard', 'WireGuard порт некоректний: ' + wgPort, '1-65535');
      } else if (wgPortN < 1024) {
        addResult('warning', 'WireGuard', 'WireGuard порт < 1024 — може конфліктувати з системними', wgPort);
      } else {
        addResult('ok', 'WireGuard', 'WireGuard порт коректний: ' + wgPort, '');
      }
      /* Peers */
      var wgPeers = el('wgpeers') ? el('wgpeers').value.trim() : '';
      if (wgPeers) {
        wgPeers.split('\n').forEach(function(line, idx) {
          line = line.trim();
          if (!line) return;
          var parts = line.split(':');
          if (parts.length < 3) {
            addResult('error', 'WireGuard', 'Peer ' + (idx + 1) + ': неправильний формат', 'Очікується: name:pubkey:IP/32');
          } else {
            var peerIp = parts[2].trim();
            if (!isValidCIDR(peerIp)) {
              addResult('error', 'WireGuard', 'Peer ' + (idx + 1) + ': некоректний IP: ' + peerIp, '');
            } else {
              addResult('ok', 'WireGuard', 'Peer ' + (idx + 1) + ' (' + parts[0].trim() + '): ' + peerIp, '');
            }
          }
        });
      }
    }

    /* ── Гостьова мережа ── */
    var guestOn = el('guestenable') && el('guestenable').checked;
    if (guestOn) {
      var guestIp    = el('guestip')    ? el('guestip').value.trim()    : '';
      var guestVlan  = el('guestvlan')  ? el('guestvlan').value.trim()  : '';
      var guestRange = el('guestrange') ? el('guestrange').value.trim() : '';
      var vlanId     = parseInt(guestVlan, 10);
      if (isNaN(vlanId) || vlanId < 1 || vlanId > 4094) {
        addResult('error', 'Guest', 'VLAN ID некоректний: ' + guestVlan, '1-4094');
      } else {
        addResult('ok', 'Guest', 'VLAN ID коректний: ' + guestVlan, '');
      }
      if (!isValidCIDR(guestIp)) {
        addResult('error', 'Guest', 'Guest IP некоректний', 'Очікується: 192.168.20.1/24');
      } else {
        if (lanNet && networksOverlap(guestIp, lanIpVal)) {
          addResult('error', 'Guest',
            'Guest і LAN підмережі перетинаються!',
            'Guest: ' + guestIp + ' | LAN: ' + lanIpVal);
        } else {
          addResult('ok', 'Guest', 'Guest IP коректний: ' + guestIp, '');
        }
        if (wgOn && el('wgserverip') && networksOverlap(guestIp, el('wgserverip').value.trim())) {
          addResult('error', 'Guest', 'Guest і WireGuard підмережі перетинаються!', '');
        }
        /* DHCP в guest */
        if (guestRange) {
          var gr = parseRange(guestRange);
          var gn = parseCIDR(guestIp);
          if (!gr) {
            addResult('error', 'Guest', 'Guest DHCP діапазон некоректний', guestRange);
          } else if (gn && ((gr.start & gn.mask) >>> 0 !== gn.network || (gr.end & gn.mask) >>> 0 !== gn.network)) {
            addResult('error', 'Guest', 'Guest DHCP виходить за межі Guest підмережі',
              'Guest: ' + guestIp + ' | DHCP: ' + guestRange);
          } else {
            addResult('ok', 'Guest', 'Guest DHCP діапазон коректний: ' + guestRange, '');
          }
        }
      }
    }

    /* ── Static Routes ── */
    var routesOn = el('routesenable') && el('routesenable').checked;
    if (routesOn) {
      var routesVal = el('routesentries') ? el('routesentries').value.trim() : '';
      if (routesVal) {
        routesVal.split('\n').forEach(function(line, idx) {
          line = line.trim();
          if (!line || line[0] === '#') return;
          var ei   = line.indexOf('=');
          if (ei < 0) { addResult('error', 'Routes', 'Маршрут ' + (idx+1) + ': неправильний формат', 'мережа=шлюз:distance:коментар'); return; }
          var dst  = line.slice(0, ei).trim();
          var rest = line.slice(ei + 1).split(':');
          var gw   = rest[0].trim();
          if (!isValidCIDR(dst)) {
            addResult('error', 'Routes', 'Маршрут ' + (idx+1) + ': некоректна мережа: ' + dst, '');
          } else if (!isValidIP(gw)) {
            addResult('error', 'Routes', 'Маршрут ' + (idx+1) + ': некоректний шлюз: ' + gw, '');
          } else {
            addResult('ok', 'Routes', 'Маршрут ' + (idx+1) + ': ' + dst + ' → ' + gw, '');
          }
        });
      }
    }

    /* ── Port Forwarding ── */
    var pfwOn = el('pfwenable') && el('pfwenable').checked;
    if (pfwOn) {
      var pfwVal = el('pfwrules') ? el('pfwrules').value.trim() : '';
      if (pfwVal) {
        pfwVal.split('\n').forEach(function(line, idx) {
          line = line.trim();
          if (!line || line[0] === '#') return;
          var parts   = line.split(':');
          if (parts.length < 4) {
            addResult('error', 'Port Forward', 'Правило ' + (idx+1) + ': неправильний формат', 'proto:зовн:внутр_IP:внутр:коментар');
            return;
          }
          var proto   = parts[0].trim();
          var extPort = parseInt(parts[1].trim(), 10);
          var intIp   = parts[2].trim();
          var intPort = parseInt(parts[3].trim(), 10);
          if (!['tcp','udp'].includes(proto)) {
            addResult('warning', 'Port Forward', 'Правило ' + (idx+1) + ': протокол "' + proto + '" — перевір', '');
          }
          if (isNaN(extPort) || extPort < 1 || extPort > 65535) {
            addResult('error', 'Port Forward', 'Правило ' + (idx+1) + ': зовнішній порт некоректний: ' + parts[1], '');
          }
          if (!isValidIP(intIp)) {
            addResult('error', 'Port Forward', 'Правило ' + (idx+1) + ': IP некоректний: ' + intIp, '');
          } else if (lanNet && !ipInSubnet(intIp, lanIpVal)) {
            addResult('warning', 'Port Forward', 'Правило ' + (idx+1) + ': IP ' + intIp + ' не в LAN підмережі', '');
          } else {
            addResult('ok', 'Port Forward', 'Правило ' + (idx+1) + ': ' + proto + ':' + extPort + ' → ' + intIp + ':' + intPort, '');
          }
        });
      }
    }

    /* ── OpenVPN ── */
    var ovpnOn = el('ovpnenable') && el('ovpnenable').checked;
    if (ovpnOn) {
      var ovpnLocal = el('ovpnlocal') ? el('ovpnlocal').value.trim() : '';
      var ovpnRange = el('ovpnrange') ? el('ovpnrange').value.trim() : '';
      var ovpnPort  = el('ovpnport')  ? el('ovpnport').value.trim()  : '';
      if (!isValidIP(ovpnLocal)) {
        addResult('error', 'OpenVPN', 'OpenVPN local IP некоректний: ' + ovpnLocal, '');
      } else {
        addResult('ok', 'OpenVPN', 'OpenVPN server IP: ' + ovpnLocal, '');
      }
      if (ovpnRange && !parseRange(ovpnRange)) {
        addResult('error', 'OpenVPN', 'OpenVPN діапазон клієнтів некоректний', ovpnRange);
      }
      var ovpnPortN = parseInt(ovpnPort, 10);
      if (isNaN(ovpnPortN) || ovpnPortN < 1 || ovpnPortN > 65535) {
        addResult('error', 'OpenVPN', 'OpenVPN порт некоректний: ' + ovpnPort, '');
      } else {
        addResult('ok', 'OpenVPN', 'OpenVPN порт: ' + ovpnPort, '');
      }
    }

    return { results: results, errors: errors, warnings: warnings, ok: ok };
  }

  /* ══════════════════════════════════════════════════════
     Рендер модального вікна з результатами
     ══════════════════════════════════════════════════════ */
  function renderValidationModal(data) {
    var existing = document.getElementById('subnet-validator-modal');
    if (existing) existing.remove();

    var icons = { ok: '✅', warning: '⚠️', error: '❌' };
    var colors = {
      ok:      '#1a3a2a',
      warning: '#3a2a10',
      error:   '#3a1a1a',
    };
    var borderColors = {
      ok:      '#2f7a5c',
      warning: '#b87a20',
      error:   '#b04040',
    };

    /* Групуємо по категоріях */
    var categories = {};
    data.results.forEach(function(r) {
      if (!categories[r.category]) categories[r.category] = [];
      categories[r.category].push(r);
    });

    var html = '<div id="subnet-validator-modal" style="' +
      'position:fixed;top:0;left:0;width:100%;height:100%;' +
      'background:rgba(0,0,0,0.75);z-index:99999;' +
      'display:flex;align-items:center;justify-content:center;' +
      '">' +
      '<div style="' +
        'background:#16212c;border:1px solid #2a3b48;border-radius:12px;' +
        'width:780px;max-width:95vw;max-height:85vh;overflow-y:auto;' +
        'padding:24px;position:relative;' +
      '">' +

      /* Заголовок */
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">' +
        '<div>' +
          '<h2 style="margin:0;font-size:18px;color:#5fd0a5;">🔍 Validator підмереж</h2>' +
          '<p style="margin:4px 0 0;font-size:13px;color:#8ea3b0;">Детальний аналіз мережевих налаштувань</p>' +
        '</div>' +
        '<button onclick="document.getElementById(\'subnet-validator-modal\').remove()" style="' +
          'background:transparent;border:1px solid #2a3b48;color:#e6edf3;' +
          'padding:6px 12px;border-radius:6px;cursor:pointer;font-size:13px;' +
        '">✕ Закрити</button>' +
      '</div>' +

      /* Підсумок */
      '<div style="' +
        'display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;' +
        'margin-bottom:20px;' +
      '">' +
        '<div style="background:#0d2a1a;border:1px solid #2f7a5c;border-radius:8px;padding:12px;text-align:center;">' +
          '<div style="font-size:28px;font-weight:700;color:#5fd0a5;">' + data.ok + '</div>' +
          '<div style="font-size:12px;color:#8ea3b0;margin-top:4px;">✅ Коректних</div>' +
        '</div>' +
        '<div style="background:#3a2a10;border:1px solid #b87a20;border-radius:8px;padding:12px;text-align:center;">' +
          '<div style="font-size:28px;font-weight:700;color:#f0a840;">' + data.warnings + '</div>' +
          '<div style="font-size:12px;color:#8ea3b0;margin-top:4px;">⚠️ Попереджень</div>' +
        '</div>' +
        '<div style="background:#3a1a1a;border:1px solid #b04040;border-radius:8px;padding:12px;text-align:center;">' +
          '<div style="font-size:28px;font-weight:700;color:#e05252;">' + data.errors + '</div>' +
          '<div style="font-size:12px;color:#8ea3b0;margin-top:4px;">❌ Помилок</div>' +
        '</div>' +
      '</div>';

    /* Результати по категоріях */
    Object.keys(categories).forEach(function(cat) {
      var items    = categories[cat];
      var catError = items.some(function(i) { return i.status === 'error'; });
      var catWarn  = items.some(function(i) { return i.status === 'warning'; });
      var catColor = catError ? '#e05252' : (catWarn ? '#f0a840' : '#5fd0a5');

      html += '<div style="margin-bottom:16px;">' +
        '<h3 style="font-size:13px;color:' + catColor + ';margin:0 0 8px;' +
          'text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #2a3b48;padding-bottom:6px;">' +
          cat +
        '</h3>';

      items.forEach(function(item) {
        html += '<div style="' +
          'background:' + colors[item.status] + ';' +
          'border:1px solid ' + borderColors[item.status] + ';' +
          'border-radius:6px;padding:10px 12px;margin-bottom:8px;' +
        '">' +
          '<div style="display:flex;align-items:flex-start;gap:8px;">' +
            '<span style="flex-shrink:0;">' + icons[item.status] + '</span>' +
            '<div>' +
              '<div style="font-size:13px;color:#e6edf3;">' + item.message + '</div>' +
              (item.detail ? '<div style="font-size:11.5px;color:#8ea3b0;margin-top:3px;">' + item.detail + '</div>' : '') +
            '</div>' +
          '</div>' +
        '</div>';
      });

      html += '</div>';
    });

    /* Фінальний вердикт */
    if (data.errors === 0 && data.warnings === 0) {
      html += '<div style="background:#0d2a1a;border:1px solid #2f7a5c;border-radius:8px;padding:14px;text-align:center;margin-top:8px;">' +
        '<div style="font-size:15px;color:#5fd0a5;font-weight:600;">🎉 Всі мережеві налаштування коректні!</div>' +
        '<div style="font-size:12px;color:#8ea3b0;margin-top:4px;">Можна генерувати конфігурацію.</div>' +
      '</div>';
    } else if (data.errors > 0) {
      html += '<div style="background:#3a1a1a;border:1px solid #b04040;border-radius:8px;padding:14px;text-align:center;margin-top:8px;">' +
        '<div style="font-size:15px;color:#e05252;font-weight:600;">❌ Знайдено ' + data.errors + ' помилок — виправ перед заливкою!</div>' +
        '<div style="font-size:12px;color:#8ea3b0;margin-top:4px;">Конфігурація може не працювати коректно.</div>' +
      '</div>';
    } else {
      html += '<div style="background:#3a2a10;border:1px solid #b87a20;border-radius:8px;padding:14px;text-align:center;margin-top:8px;">' +
        '<div style="font-size:15px;color:#f0a840;font-weight:600;">⚠️ Є ' + data.warnings + ' попереджень — перевір уважно</div>' +
        '<div style="font-size:12px;color:#8ea3b0;margin-top:4px;">Конфігурація може працювати але потребує перевірки.</div>' +
      '</div>';
    }

    html += '</div></div>';

    document.body.insertAdjacentHTML('beforeend', html);

    /* Закриття по кліку поза вікном */
    document.getElementById('subnet-validator-modal').addEventListener('click', function(e) {
      if (e.target === this) this.remove();
    });
  }

  /* ══════════════════════════════════════════════════════
     Додаємо кнопку в UI
     ══════════════════════════════════════════════════════ */
  function addValidatorButton() {
    /* Шукаємо існуючу кнопку Перевірити */
    var existing = document.getElementById('btn-validate-networks');
    if (existing) return;

    /* Знаходимо btnbar біля output */
    var btnValidate = document.getElementById('btn-validate');
    if (!btnValidate) {
      console.warn('[SubnetValidator] btn-validate не знайдено');
      return;
    }

    var btn = document.createElement('button');
    btn.id        = 'btn-validate-networks';
    btn.className = 'sec';
    btn.textContent = '🌐 Перевірити мережі';
    btn.style.cssText = 'white-space:nowrap;';

    btn.addEventListener('click', function() {
      var data = validateNetworks();
      renderValidationModal(data);
    });

    /* Вставляємо після btn-validate */
    btnValidate.parentNode.insertBefore(btn, btnValidate.nextSibling);
    console.log('[SubnetValidator] Кнопка додана!');
  }

  /* ══════════════════════════════════════════════════════
     Ініціалізація
     ══════════════════════════════════════════════════════ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addValidatorButton);
  } else {
    addValidatorButton();
  }

  /* Глобальний доступ для тестування */
  window.SubnetValidator = { validate: validateNetworks, show: function() { renderValidationModal(validateNetworks()); } };

  console.log('[SubnetValidator] завантажено — window.SubnetValidator.show()');

})();