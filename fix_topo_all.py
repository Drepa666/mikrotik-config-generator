# -*- coding: utf-8 -*-
import subprocess

# ════════════════════════════════════
# 1. ФІКС topology-extend.js
#    getMacVendor → використовує OUILookup
# ════════════════════════════════════
with open('topology-extend.js', 'r', encoding='utf-8') as f:
    te = f.read()

# Знаходимо функцію getMacVendor повністю
idx = te.find('function getMacVendor')
depth = 0; found = False; end = idx
for i, ch in enumerate(te[idx:], idx):
    if ch == '{': depth += 1; found = True
    elif ch == '}': depth -= 1
    if found and depth == 0: end = i + 1; break

old_fn = te[idx:end]

new_fn = (
    "function getMacVendor(mac) {\n"
    "    if (!mac) return '';\n"
    "    var clean = mac.toUpperCase().replace(/-/g, ':');\n"
    "    /* 1. Спочатку OUILookup (велика база + онлайн) */\n"
    "    if (window.OUILookup) {\n"
    "      var result = OUILookup.lookup(clean);\n"
    "      if (result && result !== 'Unknown') return result;\n"
    "    }\n"
    "    /* 2. Fallback — локальна база topology-extend */\n"
    "    var oui3 = clean.slice(0, 8);\n"
    "    var oui2 = clean.slice(0, 5);\n"
    "    if (_vendorCache[oui3]) return _vendorCache[oui3];\n"
    "    if (MAC_OUI[oui3]) { _vendorCache[oui3] = MAC_OUI[oui3]; return MAC_OUI[oui3]; }\n"
    "    if (MAC_OUI[oui2]) { _vendorCache[oui3] = MAC_OUI[oui2]; return MAC_OUI[oui2]; }\n"
    "    return '';\n"
    "  }"
)

te = te[:idx] + new_fn + te[end:]
print('OK: getMacVendor використовує OUILookup ✅')

with open('topology-extend.js', 'w', encoding='utf-8') as f:
    f.write(te)

r = subprocess.run(['node','--check','topology-extend.js'],
                   capture_output=True, text=True)
print('topology-extend:', 'OK ✅' if r.returncode==0 else '❌\n'+r.stderr[:200])

# ════════════════════════════════════
# 2. ФІКС topology-visual.js
#    lookupVendor → OUILookup онлайн
# ════════════════════════════════════
with open('topology-visual.js', 'r', encoding='utf-8') as f:
    tv = f.read()

# Знаходимо lookupVendor повністю
idx2 = tv.find('function lookupVendor')
depth = 0; found = False; end2 = idx2
for i, ch in enumerate(tv[idx2:], idx2):
    if ch == '{': depth += 1; found = True
    elif ch == '}': depth -= 1
    if found and depth == 0: end2 = i + 1; break

old_lookup = tv[idx2:end2]
print(f'\nlookupVendor знайдено @ {idx2}-{end2}')

new_lookup = (
    "function lookupVendor(node) {\n"
    "    var vendorEl = document.getElementById('detail-vendor');\n"
    "    if (!vendorEl || !node) {\n"
    "      if (vendorEl) vendorEl.value = '—';\n"
    "      return;\n"
    "    }\n"
    "    /* Якщо vendor вже є в node */\n"
    "    if (node.vendor && node.vendor !== 'Unknown' && node.vendor !== 'Невідомий') {\n"
    "      vendorEl.value = node.vendor;\n"
    "      vendorEl.style.color = '#5fd0a5';\n"
    "      return;\n"
    "    }\n"
    "    var mac = (node.mac || '').toUpperCase().replace(/-/g, ':');\n"
    "    if (!mac) { vendorEl.value = '—'; return; }\n\n"
    "    /* 1. Миттєво з OUILookup */\n"
    "    if (window.OUILookup) {\n"
    "      var local = OUILookup.lookup(mac);\n"
    "      if (local && local !== 'Unknown') {\n"
    "        node.vendor    = local;\n"
    "        vendorEl.value = local;\n"
    "        vendorEl.style.color = '#5fd0a5';\n"
    "        return;\n"
    "      }\n"
    "    }\n"
    "    /* 2. getMacVendor з локальної бази topology-extend */\n"
    "    if (typeof getMacVendor === 'function') {\n"
    "      var localV = getMacVendor(mac);\n"
    "      if (localV) {\n"
    "        node.vendor    = localV;\n"
    "        vendorEl.value = localV;\n"
    "        vendorEl.style.color = '#5fd0a5';\n"
    "        return;\n"
    "      }\n"
    "    }\n"
    "    /* 3. Онлайн lookup */\n"
    "    vendorEl.value = '⏳ Визначаємо...';\n"
    "    vendorEl.style.color = '#f0a840';\n"
    "    if (window.OUILookup && OUILookup.lookupOnline) {\n"
    "      OUILookup.lookupOnline(mac, function(vendor) {\n"
    "        node.vendor    = vendor || 'Unknown';\n"
    "        vendorEl.value = vendor || 'Unknown';\n"
    "        vendorEl.style.color = (vendor && vendor !== 'Unknown')\n"
    "          ? '#5fd0a5' : '#4a6070';\n"
    "      });\n"
    "    } else {\n"
    "      vendorEl.value = 'Unknown';\n"
    "      vendorEl.style.color = '#4a6070';\n"
    "    }\n"
    "  }"
)

tv = tv[:idx2] + new_lookup + tv[end2:]
print('OK: lookupVendor з OUILookup + онлайн ✅')

with open('topology-visual.js', 'w', encoding='utf-8') as f:
    f.write(tv)

r2 = subprocess.run(['node','--check','topology-visual.js'],
                    capture_output=True, text=True)
print('topology-visual:', 'OK ✅' if r2.returncode==0 else '❌\n'+r2.stderr[:200])

# ════════════════════════════════════
# 3. switch-topology.js — НОВИЙ ФАЙЛ
#    Топологія свічів без авторизації
# ════════════════════════════════════
SWITCH_TOPO = r"""'use strict';
/* ═══════════════════════════════════════════════════════
   SwitchTopology — будує топологію свічів
   Методи: ARP scan, SNMP, Port scan, LLDP через MikroTik
   ═══════════════════════════════════════════════════════ */

window.SwitchTopology = {
  _PROXY: 'http://localhost:8888',
  _scanning: false,
  _result: null,

  /* ══ ГОЛОВНА ФУНКЦІЯ ══ */
  buildTopology: function(opts) {
    /*
      opts = {
        mode:   'mikrotik' | 'direct',
        subnet: '192.168.1' (для direct),
        router: {ip, user, pass, port} (для mikrotik)
      }
    */
    var mode = opts.mode || 'mikrotik';
    SwitchTopology._scanning = true;
    SwitchTopology.setStatus('⏳ Збираємо дані...', '#f0a840');

    if (mode === 'mikrotik') {
      return SwitchTopology._buildFromMikrotik(opts.router);
    } else {
      return SwitchTopology._buildDirect(opts.subnet);
    }
  },

  /* ══ МЕТОД 1: Через MikroTik (є підключений роутер) ══ */
  _buildFromMikrotik: function(router) {
    if (!router) {
      SwitchTopology.setStatus('Немає роутера', '#e08080');
      return Promise.reject('No router');
    }
    var hdrs = {
      'x-router-ip':   router.ip,
      'x-router-port': String(router.port || 80),
      'x-router-user': router.user,
      'x-router-pass': router.pass,
    };
    var P = SwitchTopology._PROXY;
    SwitchTopology.setStatus('Читаємо ARP + LLDP + Bridge...', '#5b9bd5');

    return Promise.allSettled([
      /* ARP таблиця — всі пристрої [1] */
      fetch(P + '/rest/ip/arp', {headers: hdrs}).then(function(r){return r.json();}),
      /* LLDP/CDP сусіди — свічі з назвами [1] */
      fetch(P + '/rest/ip/neighbor', {headers: hdrs}).then(function(r){return r.json();}),
      /* Bridge host — MAC таблиця bridge [1] */
      fetch(P + '/rest/interface/bridge/host', {headers: hdrs}).then(function(r){return r.json();}),
      /* Інтерфейси роутера */
      fetch(P + '/rest/interface', {headers: hdrs}).then(function(r){return r.json();}),
      /* DHCP leases */
      fetch(P + '/rest/ip/dhcp-server/lease', {headers: hdrs}).then(function(r){return r.json();}),
      /* IP адреси роутера */
      fetch(P + '/rest/ip/address', {headers: hdrs}).then(function(r){return r.json();}),
    ]).then(function(results) {
      var arp       = Array.isArray(results[0].value) ? results[0].value : [];
      var neighbors = Array.isArray(results[1].value) ? results[1].value : [];
      var bridgeHosts = Array.isArray(results[2].value) ? results[2].value : [];
      var ifaces    = Array.isArray(results[3].value) ? results[3].value : [];
      var dhcp      = Array.isArray(results[4].value) ? results[4].value : [];
      var addresses = Array.isArray(results[5].value) ? results[5].value : [];

      return SwitchTopology._processData({
        router:       router,
        arp:          arp,
        neighbors:    neighbors,
        bridgeHosts:  bridgeHosts,
        ifaces:       ifaces,
        dhcp:         dhcp,
        addresses:    addresses,
      });
    });
  },

  /* ══ МЕТОД 2: Пряме підключення до свіча ══ */
  _buildDirect: function(subnet) {
    if (!subnet) {
      /* Автовизначення підмережі */
      subnet = '192.168.1';
    }
    SwitchTopology.setStatus('Сканування підмережі ' + subnet + '.0/24...', '#5b9bd5');

    /* Через backend — ARP scan */
    return fetch(SwitchTopology._PROXY + '/direct-scan', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({subnet: subnet, ports: [80,443,22,23,161,502,8080]}),
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      return SwitchTopology._buildDirectTopology(data);
    })
    .catch(function(e) {
      /* Fallback — використовуємо дані зі SwitchScanner */
      if (window.SwitchScanner && SwitchScanner._devices.length > 0) {
        return SwitchTopology._buildDirectTopology({
          devices: SwitchScanner._devices,
        });
      }
      throw e;
    });
  },

  /* ══ ОБРОБКА ДАНИХ З MIKROTIK ══ */
  _processData: function(d) {
    var router    = d.router;
    var arp       = d.arp;
    var neighbors = d.neighbors;
    var bridgeHosts = d.bridgeHosts;
    var ifaces    = d.ifaces;
    var dhcp      = d.dhcp;
    var addresses = d.addresses;

    /* DHCP map: mac → hostname */
    var dhcpMap = {};
    dhcp.forEach(function(e) {
      if (e['mac-address']) {
        dhcpMap[(e['mac-address']||'').toUpperCase()] = e['host-name'] || '';
      }
    });

    /* ARP map: ip → {mac, iface} */
    var arpMap = {};
    arp.forEach(function(e) {
      if (e.address) {
        arpMap[e.address] = {
          mac:   (e['mac-address']||'').toUpperCase(),
          iface: e.interface || '',
        };
      }
    });

    /* Bridge host map: mac → iface (де сидить пристрій) */
    var bridgeMap = {};
    bridgeHosts.forEach(function(e) {
      var mac = (e['mac-address']||'').toUpperCase();
      if (mac) bridgeMap[mac] = e.interface || e.bridge || '';
    });

    /* ── Вузли топології ── */
    var nodes = [];
    var links = [];

    /* 1. Роутер — головний вузол */
    var routerNode = {
      id:       'router-' + router.ip,
      type:     'router',
      label:    router.name || ('MikroTik ' + router.ip),
      ip:       router.ip,
      mac:      '',
      vendor:   'MikroTik',
      icon:     '🔴',
      ifaces:   ifaces.filter(function(i){return !i.disabled;}),
    };
    nodes.push(routerNode);

    /* 2. Сусіди (LLDP/CDP) — визначені свічі */
    var neighborNodes = {};
    neighbors.forEach(function(n) {
      var ip  = n.address || n['ip-address'] || '';
      var mac = (n['mac-address']||'').toUpperCase();
      var id  = 'nbr-' + (ip || mac);
      if (neighborNodes[id]) return;

      var vendor = window.OUILookup ? OUILookup.lookup(mac) : '';
      var dt = window.OUILookup
        ? OUILookup.getDeviceType(vendor, [], n.identity||'')
        : {icon:'🔌', type:'Switch'};

      var node = {
        id:       id,
        type:     dt.type.toLowerCase().includes('router') ? 'router' : 'switch',
        label:    n.identity || n['host-name'] || ip || mac,
        ip:       ip,
        mac:      mac,
        vendor:   vendor,
        icon:     dt.icon,
        iface:    n.interface || '',  /* Через який порт роутера */
        platform: n.platform || n['system-description'] || '',
        source:   'LLDP',
      };
      neighborNodes[id] = node;
      nodes.push(node);

      /* Зв'язок: роутер → сусід */
      links.push({
        from:       routerNode.id,
        to:         id,
        fromIface:  n.interface || '',
        toIface:    n['interface-name'] || '',
        label:      n.interface || '',
        type:       'lldp',
      });
    });

    /* 3. Групуємо ARP пристрої по інтерфейсах */
    var ifaceGroups = {};
    arp.forEach(function(e) {
      var ip  = e.address || '';
      var mac = (e['mac-address']||'').toUpperCase();
      var ifc = e.interface || '';
      if (!ip || ip === router.ip) return;

      /* Перевіряємо чи це вже сусід */
      var isNeighbor = neighbors.some(function(n) {
        return n.address === ip ||
          (n['mac-address']||'').toUpperCase() === mac;
      });
      if (isNeighbor) return;

      if (!ifaceGroups[ifc]) ifaceGroups[ifc] = [];

      var vendor   = window.OUILookup ? OUILookup.lookup(mac) : '';
      var dt       = window.OUILookup
        ? OUILookup.getDeviceType(vendor, [], dhcpMap[mac]||'')
        : {icon:'❓', type:'Unknown'};
      var hostname = dhcpMap[mac] || '';

      /* Визначаємо чи це свіч (по vendor або bridge host) */
      var isSwitch = dt.type.toLowerCase().includes('switch') ||
                     dt.type.toLowerCase().includes('cisco') ||
                     dt.type.toLowerCase().includes('tp-link') ||
                     bridgeMap[mac];

      ifaceGroups[ifc].push({
        id:       'dev-' + ip,
        type:     isSwitch ? 'switch' : SwitchTopology._guessType(dt.type),
        label:    hostname || ip,
        ip:       ip,
        mac:      mac,
        vendor:   vendor,
        icon:     dt.icon,
        iface:    ifc,
        hostname: hostname,
        source:   'ARP',
      });
    });

    /* 4. Визначаємо проміжні свічі по групах */
    Object.keys(ifaceGroups).forEach(function(ifc) {
      var devs = ifaceGroups[ifc];
      if (devs.length === 0) return;

      /* Якщо на одному порту > 2 пристроїв — там є свіч */
      var hasKnownSwitch = devs.some(function(d){return d.type==='switch';});

      /* Шукаємо чи є LLDP сусід на цьому порту */
      var lldpSwitch = null;
      neighbors.forEach(function(n) {
        if (n.interface === ifc) {
          lldpSwitch = neighborNodes['nbr-' + (n.address||n['mac-address'])];
        }
      });

      devs.forEach(function(dev) {
        nodes.push(dev);

        if (lldpSwitch) {
          /* Підключаємо через LLDP свіч */
          links.push({
            from:  lldpSwitch.id,
            to:    dev.id,
            label: '',
            type:  'arp',
          });
        } else if (devs.length >= 3 && !hasKnownSwitch) {
          /* Багато пристроїв на одному порту = ймовірно некерований свіч */
          var syntheticSwitch = 'switch-' + ifc;
          /* Додаємо синтетичний свіч якщо ще немає */
          if (!nodes.find(function(n){return n.id===syntheticSwitch;})) {
            nodes.push({
              id:     syntheticSwitch,
              type:   'switch',
              label:  'Switch (' + ifc + ')',
              ip:     '',
              mac:    '',
              vendor: '',
              icon:   '🔌',
              iface:  ifc,
              source: 'Inferred',
              note:   'Автовизначено — ' + devs.length + ' пристроїв на ' + ifc,
            });
            links.push({
              from:       routerNode.id,
              to:         syntheticSwitch,
              fromIface:  ifc,
              label:      ifc,
              type:       'inferred',
              dashed:     true,
            });
          }
          links.push({
            from:  syntheticSwitch,
            to:    dev.id,
            label: '',
            type:  'arp',
          });
        } else {
          /* Прямо до роутера */
          links.push({
            from:       routerNode.id,
            to:         dev.id,
            fromIface:  ifc,
            label:      ifc,
            type:       'arp',
          });
        }
      });
    });

    var result = {nodes: nodes, links: links, source: 'mikrotik'};
    SwitchTopology._result = result;
    SwitchTopology._scanning = false;
    SwitchTopology.setStatus(
      '✅ Топологія: ' + nodes.length + ' вузлів, ' + links.length + ' зв\'язків',
      '#5fd0a5'
    );
    return result;
  },

  /* ══ ОБРОБКА ПРЯМОГО СКАНУВАННЯ ══ */
  _buildDirectTopology: function(data) {
    var devices = data.devices || [];
    var nodes = [];
    var links = [];

    /* Визначаємо шлюз (gateway) — зазвичай .1 */
    var gateway = devices.find(function(d) {
      return d.ip && d.ip.endsWith('.1');
    }) || devices[0];

    if (gateway) {
      nodes.push({
        id:     'gw-' + gateway.ip,
        type:   'router',
        label:  gateway.hostname || gateway.ip,
        ip:     gateway.ip,
        mac:    gateway.mac,
        vendor: gateway.vendor,
        icon:   gateway.typeIcon || '🔴',
        source: 'Direct',
      });
    }

    /* Групуємо по типу */
    var switches = devices.filter(function(d) {
      return d.type && (
        d.type.toLowerCase().includes('switch') ||
        d.type.toLowerCase().includes('cisco') ||
        d.type.toLowerCase().includes('tp-link')
      ) && d !== gateway;
    });

    var clients = devices.filter(function(d) {
      return d !== gateway && !switches.includes(d);
    });

    /* Додаємо свічі */
    switches.forEach(function(sw) {
      var swNode = {
        id:     'sw-' + sw.ip,
        type:   'switch',
        label:  sw.hostname || sw.vendor || sw.ip,
        ip:     sw.ip,
        mac:    sw.mac,
        vendor: sw.vendor,
        icon:   sw.typeIcon || '🔌',
        openPorts: sw.openPorts || [],
        source: 'Direct',
      };
      nodes.push(swNode);
      if (gateway) {
        links.push({from: 'gw-'+gateway.ip, to: swNode.id, type: 'direct'});
      }
    });

    /* Якщо свічів немає але клієнтів багато — inferring switch */
    if (switches.length === 0 && clients.length >= 3) {
      nodes.push({
        id: 'sw-inferred', type: 'switch',
        label: 'Некерований Switch',
        ip: '', mac: '', vendor: '', icon: '🔌',
        source: 'Inferred',
        note: 'Автовизначено по кількості пристроїв',
      });
      if (gateway) {
        links.push({
          from: 'gw-'+gateway.ip, to: 'sw-inferred',
          type: 'inferred', dashed: true,
        });
      }
    }

    /* Клієнти */
    clients.forEach(function(d) {
      var devNode = {
        id:     'dev-' + d.ip,
        type:   SwitchTopology._guessType(d.type),
        label:  d.hostname || d.ip,
        ip:     d.ip,
        mac:    d.mac,
        vendor: d.vendor,
        icon:   d.typeIcon || '❓',
        source: 'Direct',
      };
      nodes.push(devNode);
      /* Підключаємо до свіча або шлюзу */
      var parent = switches.length > 0
        ? 'sw-' + switches[0].ip
        : (switches.length === 0 && clients.length >= 3
          ? 'sw-inferred'
          : (gateway ? 'gw-' + gateway.ip : null));
      if (parent) {
        links.push({from: parent, to: devNode.id, type: 'direct'});
      }
    });

    var result = {nodes: nodes, links: links, source: 'direct'};
    SwitchTopology._result = result;
    SwitchTopology._scanning = false;
    SwitchTopology.setStatus(
      '✅ ' + nodes.length + ' вузлів, ' + links.length + ' зв\'язків',
      '#5fd0a5'
    );
    return result;
  },

  /* ══ SNMP scan (для керованих свічів) ══ */
  scanSNMP: function(ip, community) {
    community = community || 'public';
    return fetch(SwitchTopology._PROXY + '/snmp/walk', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        host:      ip,
        community: community,
        /* MAC address table OID */
        oid:       '1.3.6.1.2.1.17.4.3',
      }),
    })
    .then(function(r){ return r.json(); })
    .then(function(data) {
      SwitchTopology.log('SNMP ' + ip + ': ' + JSON.stringify(data).slice(0,200));
      return data;
    })
    .catch(function(e) {
      SwitchTopology.log('SNMP недоступний на ' + ip + ': ' + e);
      return null;
    });
  },

  /* ══ Відкрити топологію в topology-visual ══ */
  openInVisual: function() {
    if (!SwitchTopology._result) {
      SwitchTopology.log('Спочатку запустіть сканування');
      return;
    }
    var result = SwitchTopology._result;
    /* Конвертуємо в формат topology-visual */
    var topoNodes = result.nodes.map(function(n, i) {
      return {
        id:     n.id,
        x:      100 + (i % 5) * 200,
        y:      100 + Math.floor(i / 5) * 150,
        type:   n.type || 'device',
        label:  n.label || n.ip || '',
        ip:     n.ip    || '',
        mac:    n.mac   || '',
        vendor: n.vendor|| '',
        note:   (n.source || '') + (n.note ? ' | ' + n.note : ''),
      };
    });
    var topoLinks = result.links.map(function(l) {
      return {
        from:   l.from,
        to:     l.to,
        label:  l.label || '',
        dashed: l.dashed || false,
      };
    });

    /* Якщо topology-visual відкрита — передаємо дані */
    if (window.TopoVisual && TopoVisual.loadData) {
      TopoVisual.loadData({nodes: topoNodes, links: topoLinks});
      SwitchTopology.log('✅ Топологію відкрито в Visual Topology');
    } else {
      /* Зберігаємо в localStorage — topology-visual підхопить */
      try {
        localStorage.setItem('switch-topology-import', JSON.stringify({
          nodes: topoNodes, links: topoLinks,
          timestamp: Date.now(),
          source: result.source,
        }));
        SwitchTopology.log('✅ Топологія збережена — відкрийте Topology для перегляду');
      } catch(e) {
        SwitchTopology.log('Помилка: ' + e);
      }
    }
  },

  /* ══ Визначення типу пристрою ══ */
  _guessType: function(type) {
    if (!type) return 'device';
    var t = type.toLowerCase();
    if (t.includes('router') || t.includes('mikrotik')) return 'router';
    if (t.includes('switch') || t.includes('cisco'))    return 'switch';
    if (t.includes('camera') || t.includes('hikvision')) return 'camera';
    if (t.includes('server') || t.includes('nas'))      return 'server';
    if (t.includes('phone') || t.includes('mobile'))    return 'phone';
    if (t.includes('ap') || t.includes('wifi'))         return 'ap';
    if (t.includes('інвертор') || t.includes('solar'))  return 'device';
    return 'device';
  },

  setStatus: function(msg, color) {
    var el = document.getElementById('sw-topo-status');
    if (el) { el.textContent = msg; el.style.color = color || '#5fd0a5'; }
    console.log('[SwitchTopo]', msg);
  },

  log: function(msg) {
    console.log('[SwitchTopo]', msg);
    if (window.TermLog) TermLog.log('info', msg);
  },
};

console.log('[SwitchTopology] Ready ✅');
"""

with open('switch-topology.js', 'w', encoding='utf-8') as f:
    f.write(SWITCH_TOPO)

r3 = subprocess.run(['node','--check','switch-topology.js'],
                    capture_output=True, text=True)
print('switch-topology:', 'OK ✅' if r3.returncode==0 else '❌\n'+r3.stderr[:200])

# ════════════════════════════════════
# 4. Підключаємо switch-topology.js в index.html
# ════════════════════════════════════
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

if 'switch-topology.js' not in html:
    html = html.replace(
        '<script src="topology-visual.js">',
        '<script src="switch-topology.js"></script>\n'
        '  <script src="topology-visual.js">'
    )
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print('OK: switch-topology.js в index.html ✅')
else:
    print('OK: switch-topology.js вже є ✅')

# ════════════════════════════════════
# 5. Додаємо кнопку "Switch Topo" в topology-visual
# ════════════════════════════════════
with open('topology-visual.js', 'r', encoding='utf-8') as f:
    tv2 = f.read()

# Шукаємо кнопку "Глибокий скан"
old_btn = "'Глибокий скан'"
if old_btn in tv2:
    idx_btn = tv2.find(old_btn)
    print(f'\nКнопка Глибокий скан @ {idx_btn}:')
    print(repr(tv2[max(0,idx_btn-100):idx_btn+100]))

    # Знаходимо весь button блок
    btn_start = tv2.rfind("'<button", 0, idx_btn)
    btn_end   = tv2.find("'", idx_btn + len(old_btn) + 2) + 1

    old_deep_btn = tv2[btn_start:btn_end]
    new_deep_btn = old_deep_btn + (
        " +\n"
        "        '<button onclick=\"SwitchTopology.buildTopology({" +
        "mode:\\'mikrotik\\',router:window.getActiveRouter&&getActiveRouter()})" +
        ".then(function(){SwitchTopology.openInVisual();})\" " +
        "style=\"background:#1a2a3a;border:1px solid #2a3b48;" +
        "color:#5b9bd5;border-radius:6px;padding:5px 12px;" +
        "cursor:pointer;font-size:12px;\">📡 Switch Topo</button>'"
    )

    tv2 = tv2[:btn_start] + new_deep_btn + tv2[btn_end:]
    print('OK: кнопка Switch Topo додана ✅')

    with open('topology-visual.js', 'w', encoding='utf-8') as f:
        f.write(tv2)

    r4 = subprocess.run(['node','--check','topology-visual.js'],
                        capture_output=True, text=True)
    print('topology-visual:', 'OK ✅' if r4.returncode==0 else '❌\n'+r4.stderr[:200])
else:
    print('WARN: кнопка Глибокий скан не знайдена')
    idx_t = tv2.find("'+ Роутер'")
    print(repr(tv2[max(0,idx_t-50):idx_t+200]))

print('\nВсе готово! npm start')