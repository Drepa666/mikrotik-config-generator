'use strict';
(function() {

  var SAVE_KEY = 'mt-topo-saves';

  /* ══════════════════════════════════════════════════
     MAC VENDOR LOOKUP
  ══════════════════════════════════════════════════ */
  var MAC_OUI = {
    'A8:2B:DD': 'Intel',
    'D4:CA:6D': 'MikroTik',
    'E4:8D:8C': 'MikroTik',
    '4C:5E:0C': 'MikroTik',
    '74:4D:28': 'MikroTik',
    'B8:69:F4': 'MikroTik',
    '2C:C8:1B': 'MikroTik',
    '00:50:7F': 'MikroTik',
    '3C:22:FB': 'Apple',
    'CC:2D:E0': 'Apple',
    'AC:DE:48': 'Apple',
    'F0:18:98': 'Apple',
    'B8:27:EB': 'Raspberry Pi',
    'DC:A6:32': 'Raspberry Pi',
    '00:50:56': 'VMware',
    '08:00:27': 'VirtualBox',
    '00:1A:11': 'Google',
    'F4:F5:D8': 'Google',
    '18:FE:34': 'Espressif(ESP)',
    '24:6F:28': 'Espressif(ESP)',
    '00:0C:29': 'VMware',
    '00:1C:42': 'Parallels',
    '28:D2:44': 'SAMSUNG',
    '8C:77:12': 'SAMSUNG',
    'FC:00:12': 'SAMSUNG',
    '00:17:88': 'Philips Hue',
    'EC:FA:BC': 'TP-Link',
    '50:C7:BF': 'TP-Link',
    'C4:E9:84': 'TP-Link',
    '54:AF:97': 'TP-Link',
    '18:D6:C7': 'TP-Link',
    'AC:84:C9': 'Ubiquiti',
    'FC:EC:DA': 'Ubiquiti',
    '78:8A:20': 'Ubiquiti',
    '00:27:22': 'Ubiquiti',
    '44:D9:E7': 'Ubiquiti',
    '68:72:51': 'Cisco',
    '00:1B:54': 'Cisco',
    'B4:E9:B0': 'Cisco',
    '00:23:EA': 'Cisco',
    '70:DB:98': 'Cisco',
    '18:8B:9D': 'Huawei',
    'AC:85:3D': 'Huawei',
    '00:18:82': 'Huawei',
    '28:6E:D4': 'Huawei',
    '00:E0:FC': 'Huawei',
    '10:BF:48': 'Zyxel',
    '00:13:49': 'Zyxel',
    'CC:5D:4E': 'Zyxel',
  };

  var _vendorCache = {};

  function getMacVendor(mac) {
    if (!mac) return '';
    var clean = mac.toUpperCase().replace(/-/g, ':');
    var oui3  = clean.slice(0, 8);
    var oui2  = clean.slice(0, 5);

    if (_vendorCache[oui3]) return _vendorCache[oui3];
    if (MAC_OUI[oui3]) { _vendorCache[oui3] = MAC_OUI[oui3]; return MAC_OUI[oui3]; }

    /* API lookup через proxy щоб уникнути CORS в Electron */
    fetch('http://localhost:8888/macvendor/' + oui3.replace(/:/g,'%3A'))
      .then(function(r) { return r.text(); })
      .then(function(vendor) {
        vendor = (vendor || '').trim();
        if (vendor && !vendor.includes('error') && !vendor.includes('{')) {
          _vendorCache[oui3] = vendor;
          if (window._topoNodes) {
            window._topoNodes.forEach(function(n) {
              if (n.mac && n.mac.toUpperCase().slice(0,8) === oui3) {
                n.vendor = vendor;
                n.note   = updateNoteVendor(n.note, vendor);
              }
            });
            if (typeof window._topoDraw === 'function') window._topoDraw();
          }
        }
      })
      .catch(function() { /* proxy недоступний — ігноруємо */ });

    return '';
  }

  function updateNoteVendor(note, vendor) {
    if (!note) return 'Vendor: ' + vendor;
    if (note.includes('Vendor:')) return note;
    return note + ' | Vendor: ' + vendor;
  }

  function enrichNodeWithVendor(node) {
    if (!node.mac) return node;
    var vendor = getMacVendor(node.mac);
    if (vendor) {
      node.vendor = vendor;
      node.note   = updateNoteVendor(node.note, vendor);
      /* Додаємо vendor до label якщо не дублюється */
      if (node.label && !node.label.includes(vendor)) {
        node.label = node.label + ' [' + vendor + ']';
      }
    }
    return node;
  }

  /* Збагачуємо всі вузли асинхронно */
  function enrichAllVendors(nodes) {
    if (!nodes || !nodes.length) return;
    var withMac = nodes.filter(function(n) { return n.mac; });
    if (!withMac.length) return;

    /* Спочатку локальний OUI */
    withMac.forEach(function(n) { enrichNodeWithVendor(n); });
    if (typeof window._topoDraw === 'function') window._topoDraw();

    /* Потім API для невідомих */
    var unknown = withMac.filter(function(n) { return !n.vendor; });
    unknown.forEach(function(n, i) {
      setTimeout(function() { getMacVendor(n.mac); }, i * 500);
    });
  }



  /* ── Збереження ── */
  function getSaves() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'); } catch(e) { return {}; }
  }
  function putSave(name, data) {
    var s = getSaves(); s[name] = { data: data, ts: Date.now() };
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  }
  function delSave(name) {
    var s = getSaves(); delete s[name];
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  }

  /* ── Панель слотів ── */
  function buildSavePanel() {
    var p = document.createElement('div');
    p.id = 'topo-save-panel';
    p.style.cssText = 'position:fixed;top:60px;right:20px;width:280px;background:#0d1821;border:1px solid #2a3b48;border-radius:10px;padding:14px;z-index:99999;display:none;box-shadow:0 8px 32px rgba(0,0,0,.6);';

    var hdr = document.createElement('div');
    hdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;';
    var ttl = document.createElement('b');
    ttl.style.cssText = 'font-size:13px;color:#e6edf3;';
    ttl.textContent = 'Слоти збереження';
    var cls = document.createElement('button');
    cls.textContent = 'x';
    cls.style.cssText = 'background:none;border:none;color:#8ea3b0;font-size:16px;cursor:pointer;';
    cls.onclick = function() { p.style.display = 'none'; };
    hdr.appendChild(ttl); hdr.appendChild(cls);

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:6px;margin-bottom:10px;';
    var inp = document.createElement('input');
    inp.id = 'topo-save-name';
    inp.placeholder = 'Назва топології...';
    inp.style.cssText = 'flex:1;background:#111d27;border:1px solid #2a3b48;border-radius:5px;color:#e6edf3;padding:5px 8px;font-size:11px;outline:none;';
    var savBtn = document.createElement('button');
    savBtn.textContent = 'Зберегти';
    savBtn.style.cssText = 'background:#5fd0a5;color:#082018;border:none;border-radius:5px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;';
    savBtn.onclick = function() {
      var name = inp.value.trim() || ('Топологія ' + new Date().toLocaleString('uk'));
      var data = null;
      try { data = JSON.parse(localStorage.getItem('mt-topology') || 'null'); } catch(e) {}
      if (!data || !data.nodes || !data.nodes.length) { alert('Немає даних! Спочатку завантаж або намалюй топологію.'); return; }
      putSave(name, data);
      inp.value = '';
      renderSlots();
    };
    row.appendChild(inp); row.appendChild(savBtn);

    var slots = document.createElement('div');
    slots.id = 'topo-save-slots';
    slots.style.cssText = 'display:flex;flex-direction:column;gap:5px;max-height:300px;overflow-y:auto;';

    p.appendChild(hdr); p.appendChild(row); p.appendChild(slots);
    document.body.appendChild(p);
    renderSlots();
    return p;
  }

  function renderSlots() {
    var container = document.getElementById('topo-save-slots');
    if (!container) return;
    var saves = getSaves();
    var keys  = Object.keys(saves).sort(function(a,b) { return saves[b].ts - saves[a].ts; });

    if (!keys.length) {
      container.innerHTML = '<div style="color:#4a6070;font-size:11px;text-align:center;padding:10px;">Немає збережених топологій</div>';
      return;
    }
    container.innerHTML = '';
    keys.forEach(function(name) {
      var save = saves[name];
      var date = new Date(save.ts).toLocaleString('uk');
      var cnt  = save.data && save.data.nodes ? save.data.nodes.length : 0;

      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:7px 8px;background:#111d27;border:1px solid #2a3b48;border-radius:6px;';

      var info = document.createElement('div');
      info.style.cssText = 'flex:1;min-width:0;';
      var n1 = document.createElement('div');
      n1.style.cssText = 'font-size:12px;font-weight:600;color:#e6edf3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
      n1.textContent = name;
      var n2 = document.createElement('div');
      n2.style.cssText = 'font-size:10px;color:#4a6070;';
      n2.textContent = cnt + ' вузлів - ' + date;
      info.appendChild(n1); info.appendChild(n2);

      var loadBtn = document.createElement('button');
      loadBtn.textContent = 'Load';
      loadBtn.style.cssText = 'background:#0d2a1a;border:1px solid #2f7a5c;color:#5fd0a5;border-radius:4px;padding:2px 7px;font-size:11px;cursor:pointer;';
      loadBtn.onclick = (function(saveData) {
        return function() {
          topoSetState(saveData);
          document.getElementById('topo-save-panel').style.display = 'none';
        };
      })(save.data);

      var delBtn = document.createElement('button');
      delBtn.textContent = 'Del';
      delBtn.style.cssText = 'background:transparent;border:1px solid #6b2020;color:#a05050;border-radius:4px;padding:2px 6px;font-size:11px;cursor:pointer;';
      delBtn.onclick = (function(n) {
        return function() {
          if (confirm('Видалити "' + n + '"?')) { delSave(n); renderSlots(); }
        };
      })(name);

      row.appendChild(info); row.appendChild(loadBtn); row.appendChild(delBtn);
      container.appendChild(row);
    });
  }

  /* ── Встановити стан топології ── */
  function topoSetState(data) {
    if (!data || !data.nodes || !data.nodes.length) {
      console.warn('[TopoExt] topoSetState: немає даних!');
      return;
    }
    /* Якщо _topoLoadSaved вже є — відразу викликаємо */
    if (typeof window._topoLoadSaved === 'function') {
      _doSetState(data);
      return;
    }
    /* Чекаємо поки topology-visual.js завантажиться */
    var attempts = 0;
    var timer = setInterval(function() {
      attempts++;
      if (typeof window._topoLoadSaved === 'function') {
        clearInterval(timer);
        _doSetState(data);
      }
      if (attempts > 30) {
        clearInterval(timer);
        console.error('[TopoExt] timeout: _topoLoadSaved timeout');
      }
    }, 100);
  }


  /* ══════════════════════════════════════════════════
     MERGE TOPOLOGY — обєднання статичних і живих даних
  ══════════════════════════════════════════════════ */
  function mergeTopologyData(existing, incoming) {
    var result = {
      nodes: existing.nodes ? existing.nodes.slice() : [],
      edges: existing.edges ? existing.edges.slice() : [],
    };

    var existingIds = {};
    result.nodes.forEach(function(n) { existingIds[n.id] = n; });

    var existingIPs = {};
    result.nodes.forEach(function(n) { if (n.ip) existingIPs[n.ip] = n; });

    /* Додаємо нові вузли — якщо IP вже є, збагачуємо існуючий */
    (incoming.nodes || []).forEach(function(newNode) {
      /* Пошук по ID */
      if (existingIds[newNode.id]) {
        var ex = existingIds[newNode.id];
        /* Збагачуємо: MAC, IP, note */
        if (newNode.mac  && !ex.mac)  ex.mac  = newNode.mac;
        if (newNode.ip   && !ex.ip)   ex.ip   = newNode.ip;
        if (newNode.note && !ex.note) ex.note  = newNode.note;
        if (newNode.vendor)            ex.vendor = newNode.vendor;
        return;
      }
      /* Пошук по IP */
      if (newNode.ip && existingIPs[newNode.ip]) {
        var exIp = existingIPs[newNode.ip];
        if (newNode.mac    && !exIp.mac)    exIp.mac    = newNode.mac;
        if (newNode.note   && !exIp.note)   exIp.note   = newNode.note;
        if (newNode.vendor && !exIp.vendor) exIp.vendor = newNode.vendor;
        /* Оновлюємо label якщо є hostname */
        if (newNode.label && newNode.label !== newNode.ip && exIp.label === exIp.ip) {
          exIp.label = newNode.label;
        }
        return;
      }
      /* Новий вузол — додаємо */
      result.nodes.push(newNode);
      existingIds[newNode.id] = newNode;
      if (newNode.ip) existingIPs[newNode.ip] = newNode;
    });

    /* Додаємо нові edges без дублів */
    var edgeKeys = {};
    result.edges.forEach(function(e) {
      edgeKeys[e.from + '->' + e.to] = true;
    });
    (incoming.edges || []).forEach(function(e) {
      var key = e.from + '->' + e.to;
      if (!edgeKeys[key]) {
        edgeKeys[key] = true;
        result.edges.push(e);
      }
    });

    return result;
  }

  function _doSetState(data) {
    if (!data || !data.nodes || !data.nodes.length) {
      console.warn('[TopoExt] _doSetState: немає даних');
      return;
    }
    console.log('[TopoExt] _doSetState:', data.nodes.length, 'nodes,', (data.edges||[]).length, 'edges');

    /* Зберігаємо в localStorage — єдиний надійний спосіб передати дані в closure */
    try {
      localStorage.setItem('mt-topology', JSON.stringify({
        nodes: data.nodes,
        edges: data.edges || []
      }));
    } catch(e) {
      console.error('[TopoExt] localStorage error:', e);
      return;
    }

    /* Викликаємо _topoLoadSaved — вона робить:
       nodes = data.nodes (пряме перепризначення closure змінної)
       edges = data.edges
       fitToScreen()
       draw()
    */
    if (typeof window._topoLoadSaved === 'function') {
      window._topoLoadSaved();
      console.log('[TopoExt] _topoLoadSaved викликано OK');
      showToast('Завантажено ' + data.nodes.length + ' вузлів, ' + (data.edges||[]).length + ' зєднань');
    } else {
      console.error('[TopoExt] _topoLoadSaved недоступна!');
      showToast('Помилка: _topoLoadSaved не знайдено');
    }
  }

  function topoSetState_REPLACED(data) {
  }

  function showToast(msg) {
    var hint = document.createElement('div');
    hint.style.cssText = [
      'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);',
      'background:#0d2a1a;border:1px solid #5fd0a5;border-radius:8px;',
      'padding:10px 16px;font-size:12px;color:#5fd0a5;z-index:99999;',
      'pointer-events:none;'
    ].join('');
    hint.textContent = msg;
    document.body.appendChild(hint);
    setTimeout(function() { if (hint.parentNode) hint.remove(); }, 3000);
  }

  /* ── Імпорт з RSC ── */
  function importFromRSC(text) {
    if (typeof parseRscTopology !== 'function') {
      alert('parseRscTopology не знайдена!'); return null;
    }
    var p = parseRscTopology(text);
    console.log('[TopoExt] parsed:', p);

    var nodes = [], edges = [];
    var uid = 0;
    function nid() { return 'r' + (++uid); }

    var cloudId = nid();
    nodes.push({ id: cloudId, type: 'cloud', label: 'Internet', x: 500, y: 60 });

    var wanIface = 'ether1';
    if (p.pppoe && p.pppoe.length) wanIface = p.pppoe[0].interface || 'ether1';

    var wanIpObj = (p.ips || []).find(function(x) { return x.interface === wanIface; });
    var wanIp = wanIpObj ? wanIpObj.address.split('/')[0] : '';

    var routerId = nid();
    nodes.push({
      id: routerId, type: 'router',
      label: p.identity || 'MikroTik',
      ip: wanIp, mac: '', iface: wanIface,
      note: 'WAN: ' + wanIface,
      x: 500, y: 220,
    });
    edges.push({ from: cloudId, to: routerId, label: p.pppoe && p.pppoe.length ? 'PPPoE' : 'WAN', active: true });

    var ifMap = {};
    var col = 0;

    (p.ips || []).forEach(function(ip) {
      if (!ip.interface || ip.interface === wanIface || ifMap[ip.interface]) return;
      var id2 = nid();
      ifMap[ip.interface] = id2;
      var type = 'switch';
      if (ip.interface.indexOf('wlan') >= 0) type = 'ap';
      var dhcp = (p.dhcp || []).find(function(d) { return d.interface === ip.interface; });
      var note = dhcp ? ('DHCP: ' + (dhcp.name || '') + ' pool:' + (dhcp.pool || '')) : '';
      var brd  = p.bridges ? p.bridges[ip.interface] : null;
      if (brd && brd.ports) note += (note ? ' | ' : '') + 'Ports: ' + brd.ports.join(', ');
      nodes.push({
        id: id2, type: type,
        label: ip.interface + ' ' + ip.address,
        ip: ip.address.split('/')[0], mac: '', iface: ip.interface,
        note: note, x: 150 + col * 200, y: 400,
      });
      edges.push({ from: routerId, to: id2, label: ip.interface, active: true });
      col++;
    });

    Object.keys(p.vlans || {}).forEach(function(vname) {
      if (ifMap[vname]) return;
      var vlan = p.vlans[vname];
      var id2  = nid();
      ifMap[vname] = id2;
      var vip = (p.ips || []).find(function(x) { return x.interface === vname; });
      nodes.push({
        id: id2, type: 'switch',
        label: vname + ' VLAN' + (vlan.id || ''),
        ip: vip ? vip.address.split('/')[0] : '', mac: '', iface: vlan.interface || '',
        note: 'VLAN ID:' + (vlan.id || '') + ' Parent:' + (vlan.interface || ''),
        x: 150 + col * 200, y: 400,
      });
      edges.push({ from: ifMap[vlan.interface] || routerId, to: id2, label: 'VLAN' + (vlan.id || ''), active: true });
      col++;
    });

    (p.vpn || []).forEach(function(vpn) {
      var id2 = nid();
      nodes.push({
        id: id2, type: 'server',
        label: (vpn.type || 'WireGuard') + ' :' + (vpn.port || '51820'),
        ip: '', mac: '', iface: vpn.name || 'wg0',
        note: 'Type:' + vpn.type + ' Port:' + vpn.port,
        x: 780, y: 220,
      });
      edges.push({ from: routerId, to: id2, label: 'VPN', active: true });
    });

    (p.pppoe || []).forEach(function(pp) {
      var id2 = nid();
      nodes.push({
        id: id2, type: 'server',
        label: 'PPPoE ' + pp.name,
        ip: '', mac: '', iface: pp.interface || 'ether1',
        note: 'PPPoE:' + pp.name,
        x: 750, y: 60,
      });
      edges.push({ from: cloudId, to: id2, label: 'PPPoE', active: true });
      edges.push({ from: id2, to: routerId, label: '', active: true });
    });

    (p.wireless || []).forEach(function(w) {
      if (ifMap[w.name]) return;
      var id2 = nid();
      nodes.push({
        id: id2, type: 'ap',
        label: w.ssid || w.name,
        ip: '', mac: '', iface: w.name,
        note: 'SSID:' + (w.ssid || '') + ' Band:' + (w.band || ''),
        x: 150 + col * 200, y: 550,
      });
      edges.push({ from: ifMap[w.bridge || ''] || routerId, to: id2, label: w.name, active: true });
      col++;
    });

    console.log('[TopoExt] RSC: ' + nodes.length + ' nodes, ' + edges.length + ' edges');
    return { nodes: nodes, edges: edges };
  }

  /* ── Глибоке сканування ── */
  var PROXY = 'http://localhost:8888';
  var scanVisited = {};
  var scanResults = { nodes: [], edges: [] };

  function restCall(ip, user, pass, path) {
    return fetch(PROXY + '/rest' + path, {
      headers: { 'X-Router-IP': ip, 'X-Router-User': user, 'X-Router-Pass': pass }
    }).then(function(r) { return r.json(); });
  }

  function deepScan(ip, user, pass, parentId, depth, onProg, onDone) {
    if (depth > 2 || scanVisited[ip]) { onDone && onDone(); return; }
    scanVisited[ip] = true;
    onProg && onProg('Сканую ' + ip + '...');

    if (depth === 0) {
      scanResults = { nodes: [], edges: [] };
    }

    var PROXY = 'http://localhost:8888';
    var hdrs = {
      'Content-Type':  'application/json',
      'X-Router-IP':   ip,
      'X-Router-User': user,
      'X-Router-Pass': pass,
      'X-Router-Port': '80',
    };

    function sf(url, def) {
      return fetch(PROXY + url, { method:'GET', headers:hdrs })
        .then(function(r) { return r.ok ? r.json() : def; })
        .catch(function()  { return def; });
    }

    Promise.all([
      sf('/rest/system/identity',      {}),
      sf('/rest/ip/arp',               []),
      sf('/rest/ip/dhcp-server/lease', []),
      sf('/rest/ip/neighbor',          []),
      sf('/rest/ip/address',           []),
    ]).then(function(res) {
      var identity  = (!Array.isArray(res[0]) && res[0]) ? res[0] : {};
      var arps      = Array.isArray(res[1]) ? res[1] : [];
      var leases    = Array.isArray(res[2]) ? res[2] : [];
      var neighbors = Array.isArray(res[3]) ? res[3] : [];
      var addresses = Array.isArray(res[4]) ? res[4] : [];

      /* ── Читаємо існуючу топологію з localStorage ── */
      var existNodes   = [];
      var existEdges   = [];
      var ifaceNodes   = {};
      var routerNodeId = 'router-main';

      try {
        var saved = JSON.parse(localStorage.getItem('mt-topology') || '{}');
        existNodes   = saved.nodes    || [];
        existEdges   = saved.edges    || [];
        ifaceNodes   = saved._ifaceNodes || {};
      } catch(ex) {}

      /* Якщо existNodes порожній — беремо з canvas */
      if (!existNodes.length && window._topoNodes) {
        existNodes = window._topoNodes.slice();
        existEdges = window._topoEdges ? window._topoEdges.slice() : [];
      }

      /* Будуємо індекс існуючих вузлів по IP */
      var byIp = {};
      var byId = {};
      existNodes.forEach(function(n) {
        byId[n.id] = n;
        if (n.ip) byIp[n.ip] = n;
      });

      /* Знаходимо router вузол */
      var routerNode = byId['router-main'] || existNodes.find(function(n) {
        return n.type === 'router';
      });
      if (routerNode) routerNodeId = routerNode.id;

      /* ── Hostname map з DHCP leases ── */
      var hostnameMap = {};
      var macMap      = {};
      leases.forEach(function(l) {
        if (l.address) {
          hostnameMap[l.address] = l['host-name'] || '';
          macMap[l.address]      = l['mac-address'] || '';
        }
      });

      /* ── Збагачуємо існуючі вузли з DHCP ── */
      existNodes.forEach(function(n) {
        if (!n.ip) return;
        if (hostnameMap[n.ip] && (!n.label || n.label === n.ip)) {
          n.label = hostnameMap[n.ip];
        }
        if (macMap[n.ip] && !n.mac) {
          n.mac = macMap[n.ip];
          n.note = (n.note || '') + ' | MAC: ' + macMap[n.ip];
        }
      });

      /* ── ARP хости — НОВІ вузли яких ще немає ── */
      var newNodes = [];
      var newEdges = [];
      var hcol = 0;

      arps.forEach(function(arp) {
        var arpIp = arp.address || '';
        if (!arpIp || arpIp === ip) return;

        /* Якщо вже є в існуючій топології — збагачуємо */
        if (byIp[arpIp]) {
          var ex = byIp[arpIp];
          var mac = arp['mac-address'] || macMap[arpIp] || '';
          if (mac && !ex.mac) {
            ex.mac  = mac;
            ex.note = (ex.note || '') + ' | MAC: ' + mac;
          }
          if (hostnameMap[arpIp] && ex.label === arpIp) {
            ex.label = hostnameMap[arpIp];
          }
          /* Vendor lookup */
          if (mac && typeof enrichNodeWithVendor === 'function') {
            enrichNodeWithVendor(ex);
          }
          return;
        }

        /* Новий хост */
        var hostname = hostnameMap[arpIp] || arpIp;
        var mac2     = arp['mac-address'] || macMap[arpIp] || '';
        var arpIface = arp.interface || '';
        var nodeId   = 'host-' + arpIp.replace(/\./g, '-');

        var hn   = hostname.toLowerCase();
        var type = hn.includes('phone') || hn.includes('iphone') ? 'phone' :
                   hn.includes('server') || hn.includes('srv')   ? 'server' :
                   hn.includes('laptop')                          ? 'laptop' : 'pc';

        var newNode = {
          id: nodeId, type: type,
          label: hostname,
          ip: arpIp, mac: mac2,
          iface: arpIface,
          note: 'ARP | MAC: ' + mac2 + (arpIface ? ' | ' + arpIface : ''),
          x: 80 + hcol * 170, y: 620,
        };

        /* Vendor lookup */
        if (mac2 && typeof enrichNodeWithVendor === 'function') {
          enrichNodeWithVendor(newNode);
        }

        newNodes.push(newNode);
        byIp[arpIp] = newNode;

        /* Підключаємо до LAN interface або router */
        var parentId2 = ifaceNodes[arpIface] || routerNodeId;
        newEdges.push({
          from: parentId2, to: nodeId,
          label: arpIface,
          active: arp.complete !== 'false',
        });
        hcol++;
      });

      /* ── Merge: існуючі + нові ── */
      var merged = {
        nodes: existNodes.concat(newNodes),
        edges: existEdges.concat(newEdges),
      };

      console.log('[TopoExt] deepScan merge:',
        existNodes.length, '+', newNodes.length, '=', merged.nodes.length, 'nodes');

      /* ── Рекурсивно для MikroTik neighbors ── */
      var pending = [];
      neighbors.forEach(function(nb) {
        var nbIp    = nb.address || nb['address4'] || '';
        var platform = (nb.platform || '').toLowerCase();
        if (nbIp && !scanVisited[nbIp] && platform.includes('mikrotik')) {
          pending.push(nbIp);
        }
      });

      /* Зберігаємо merged в scanResults */
      scanResults.nodes = merged.nodes;
      scanResults.edges = merged.edges;

      if (!pending.length) { onDone && onDone(); return; }

      var done = 0;
      pending.forEach(function(nbIp) {
        deepScan(nbIp, user, pass, routerNodeId, depth+1, onProg, function() {
          done++;
          if (done >= pending.length) onDone && onDone();
        });
      });
      setTimeout(function() {
        if (done < pending.length) onDone && onDone();
      }, 8000);

    }).catch(function(e) {
      console.error('[TopoExt] deepScan error:', e);
      onDone && onDone();
    });
  }

  /* ── Додаємо кнопки в toolbar topology-visual.js ── */
  function injectUI() {
    /* Видаляємо старий бар якщо є */
    var oldBar = document.getElementById('topo-ext-bar');
    if (oldBar) oldBar.remove();

    var modal = document.getElementById('topo-modal');
    if (!modal) return;

    /* Знаходимо контейнер modal */
    var modalBox = modal.querySelector('[style*="border-radius:14px"]') ||
                   modal.querySelector('[style*="border-radius:12px"]') ||
                   modal.firstElementChild;

    /* Створюємо бар — вставляємо ВСЕРЕДИНУ modal вікна вгорі */
    var bar = document.createElement('div');
    bar.id = 'topo-ext-bar';
    bar.style.cssText = [
      'display:flex;gap:4px;align-items:center;flex-wrap:wrap;',
      'padding:5px 12px;background:#060d14;',
      'border-bottom:1px solid #1c2a37;',
      'flex-shrink:0;'
    ].join('');

    /* Вставляємо після шапки (перший div) */
    if (modalBox) {
      var firstChild = modalBox.firstElementChild;
      if (firstChild && firstChild.nextSibling) {
        modalBox.insertBefore(bar, firstChild.nextSibling);
      } else {
        modalBox.appendChild(bar);
      }
    } else {
      modal.appendChild(bar);
    }

    function makeBtn(id, text, color, onclick) {
      if (document.getElementById(id)) return;
      var b = document.createElement('button');
      b.id = id;
      b.textContent = text;
      b.style.cssText = [
        'background:transparent;border:1px solid ' + color + ';',
        'color:' + color + ';padding:4px 10px;border-radius:5px;',
        'cursor:pointer;font-size:11px;white-space:nowrap;'
      ].join('');
      b.onmouseover = function() { b.style.opacity = '0.75'; };
      b.onmouseout  = function() { b.style.opacity = '1'; };
      b.onclick = onclick;
      bar.appendChild(b);
    }

    /* ── Кнопки ── */
    makeBtn('topo-remote-btn', '+ Роутер', '#f0a840', showAddRouterDialog);
    makeBtn('topo-slots-btn',  'Слоти',    '#5fd0a5', function() {
      var panel = document.getElementById('topo-save-panel');
      if (!panel) panel = buildSavePanel();
      renderSlots();
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    makeBtn('topo-form-btn', 'З форми', '#8ea3b0', function() {
      topoSetState({
        nodes: [
          { id:'c1', type:'cloud',  label:'Internet', x:500, y:60  },
          { id:'r1', type:'router', label:'Router 192.168.88.1', ip:'192.168.88.1', x:500, y:220 },
          { id:'s1', type:'switch', label:'LAN Bridge', x:300, y:380 },
          { id:'a1', type:'ap',     label:'WiFi AP',    x:150, y:500 },
          { id:'p1', type:'pc',     label:'PC',         x:420, y:500 },
        ],
        edges: [
          { from:'c1', to:'r1', label:'WAN',    active:true },
          { from:'r1', to:'s1', label:'LAN',    active:true },
          { from:'s1', to:'a1', label:'ether2', active:true },
          { from:'s1', to:'p1', label:'ether3', active:true },
        ]
      });
    });
    makeBtn('topo-rsc-btn', 'З RSC', '#8ea3b0', function() {
      var inp = document.createElement('input');
      inp.type = 'file'; inp.accept = '.rsc,.txt';
      inp.onchange = function(e) {
        var file = e.target.files[0]; if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
          var data = importFromRSC(ev.target.result);
          console.log('[TopoExt] RSC imported:', data);
          if (data && data.nodes && data.nodes.length) {
            /* Збагачуємо vendor */
            enrichAllVendors(data.nodes);
            /* Читаємо поточну топологію */
            var existRsc = { nodes: [], edges: [] };
            try {
              var sv = localStorage.getItem('mt-topology');
              if (sv) existRsc = JSON.parse(sv);
            } catch(ex2) {}
            /* Merge якщо є існуючі дані */
            var finalRsc = existRsc.nodes && existRsc.nodes.length
              ? mergeTopologyData(existRsc, data)
              : data;
            topoSetState(finalRsc);
          } else {
            alert('RSC: не вдалось розпарсити файл! Перевір формат.');
          }
        };
        reader.readAsText(file);
      };
      inp.click();
    });
    makeBtn('topo-deep-btn', 'Глибокий скан', '#5fd0a5', function() {
      var ipEl   = document.getElementById('topo-ip');
      var userEl = document.getElementById('topo-user');
      var passEl = document.getElementById('topo-pass');
      if (!ipEl) { alert('Поля IP не знайдено!'); return; }
      var ip   = ipEl.value.trim();
      var user = userEl ? userEl.value.trim() : 'admin';
      var pass = passEl ? passEl.value.trim() : '';
      if (!ip) { alert('Введи IP роутера!'); return; }
      var btn = document.getElementById('topo-deep-btn');
      btn.disabled = true; btn.textContent = 'Сканую...';
      scanVisited = {};
      deepScan(ip, user, pass, null, 0,
        function(msg) { if (btn) btn.textContent = msg.slice(0,18); },
        function() {
          if (btn) { btn.disabled = false; btn.textContent = 'Глибокий скан'; }
          if (!scanResults.nodes.length) { alert('Нічого не знайдено!'); return; }
          console.log('[TopoExt] deepScan done:', scanResults.nodes.length, 'nodes');

          /* Збагачуємо MAC vendor */
          enrichAllVendors(scanResults.nodes);

          /* Deep scan — завжди replace (merge дублював вузли) */
          var finalData = {
            nodes: scanResults.nodes.slice(),
            edges: scanResults.edges.slice()
          };
          _doSetState(finalData);
        }
      );
    });
    makeBtn('topo-note-btn', 'Нотатка', '#f0a840', showNoteDialog);

    console.log('[TopoExt] extBar вставлено — ' + bar.children.length + ' кнопок');
  }

  /* Виносимо діалоги в окремі функції */
  function showNoteDialog() {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:999999;display:flex;align-items:center;justify-content:center;';
    var bx = document.createElement('div');
    bx.style.cssText = 'background:#0d1821;border:1px solid #2a3b48;border-radius:10px;padding:20px;width:300px;display:flex;flex-direction:column;gap:10px;';
    var ttl = document.createElement('div');
    ttl.textContent = 'Текст нотатки';
    ttl.style.cssText = 'font-size:13px;font-weight:700;color:#e6edf3;';
    var inp = document.createElement('input');
    inp.type = 'text'; inp.placeholder = 'Введи текст...';
    inp.style.cssText = 'background:#111d27;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:8px 10px;font-size:12px;outline:none;';
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;';
    var cb = document.createElement('button');
    cb.textContent = 'Скасувати';
    cb.style.cssText = 'background:transparent;border:1px solid #2a3b48;color:#8ea3b0;border-radius:6px;padding:6px 14px;font-size:11px;cursor:pointer;';
    cb.onclick = function() { ov.remove(); };
    var ob = document.createElement('button');
    ob.textContent = 'Додати';
    ob.style.cssText = 'background:#5fd0a5;color:#082018;border:none;border-radius:6px;padding:6px 14px;font-size:11px;font-weight:700;cursor:pointer;';
    ob.onclick = function() {
      var txt = inp.value.trim(); ov.remove();
      if (!txt) return;
      window.dispatchEvent(new CustomEvent('topo-add-node', { detail: { type:'note', label:txt, x:400+Math.random()*200, y:300 } }));
    };
    inp.onkeydown = function(e) { if (e.key==='Enter') ob.click(); if (e.key==='Escape') cb.click(); };
    row.appendChild(cb); row.appendChild(ob);
    bx.appendChild(ttl); bx.appendChild(inp); bx.appendChild(row);
    ov.appendChild(bx); document.body.appendChild(ov);
    setTimeout(function() { inp.focus(); }, 50);
  }

  function showAddRouterDialog() {
    /* (існуючий код діалогу + Роутер) */
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:999999;display:flex;align-items:center;justify-content:center;';
    var bx = document.createElement('div');
    bx.style.cssText = 'background:#0d1821;border:1px solid #2a3b48;border-radius:12px;padding:20px;width:360px;display:flex;flex-direction:column;gap:10px;';
    function mkRow(lbl, id, ph, tp) {
      var w=document.createElement('div');
      var l=document.createElement('div'); l.textContent=lbl; l.style.cssText='font-size:11px;color:#8ea3b0;margin-bottom:3px;';
      var i=document.createElement('input'); i.id=id; i.placeholder=ph; i.type=tp||'text';
      i.style.cssText='width:100%;box-sizing:border-box;background:#111d27;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:7px 10px;font-size:12px;outline:none;';
      w.appendChild(l); w.appendChild(i); return w;
    }
    var ttl=document.createElement('div'); ttl.textContent='Підключити роутер'; ttl.style.cssText='font-size:14px;font-weight:700;color:#e6edf3;';
    var st=document.createElement('div'); st.style.cssText='font-size:11px;color:#8ea3b0;min-height:16px;';
    var br=document.createElement('div'); br.style.cssText='display:flex;gap:8px;justify-content:flex-end;';
    var cb=document.createElement('button'); cb.textContent='Скасувати'; cb.style.cssText='background:transparent;border:1px solid #2a3b48;color:#8ea3b0;border-radius:6px;padding:7px 14px;font-size:11px;cursor:pointer;'; cb.onclick=function(){ov.remove();};
    var ab=document.createElement('button'); ab.textContent='Додати'; ab.style.cssText='background:#5fd0a5;color:#082018;border:none;border-radius:6px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;';
    ab.onclick=function(){
      var ip=document.getElementById('rem-ip').value.trim();
      var user=document.getElementById('rem-user').value.trim();
      var pass=document.getElementById('rem-pass').value.trim();
      var name=document.getElementById('rem-name').value.trim()||ip;
      if(!ip){st.textContent='Введи IP!';return;}
      ab.disabled=true; st.textContent='Завантажую...'; st.style.color='#8ea3b0';
      var nid='remote-'+ip.replace(/\./g,'-');
      var newNode={id:nid,type:'router',label:name,ip:ip,mac:'',note:'Remote: '+ip,x:300+Math.random()*300,y:200+Math.random()*200};
      if(window._topoNodes){
        window._topoNodes.push(newNode);
        if(window._topoDraw) window._topoDraw();
        st.textContent='Додано!'; st.style.color='#5fd0a5';
        ab.disabled=false;
      }
    };
    br.appendChild(cb); br.appendChild(ab);
    bx.appendChild(ttl);
    bx.appendChild(mkRow('IP адреса','rem-ip','192.168.88.1 або 1.2.3.4'));
    bx.appendChild(mkRow('Логін','rem-user','admin'));
    bx.appendChild(mkRow('Пароль','rem-pass','','password'));
    bx.appendChild(mkRow('Назва','rem-name','Офіс / Філія'));
    bx.appendChild(st); bx.appendChild(br);
    ov.appendChild(bx); document.body.appendChild(ov);
  }

  /* ── Слухаємо події ── */
  window.addEventListener('topo-add-node', function(e) {
    var node = e.detail;
    if (!node) return;
    node.id = node.id || ('note-' + Date.now());
    if (window._topoNodes) { window._topoNodes.push(node); if (window._topoDraw) window._topoDraw(); }
  });

  /* ── Спостерігач за появою modal ── */
  var _injected = false;
  var observer = new MutationObserver(function() {
    var modal = document.getElementById('topo-modal');
    if (modal && modal.style.display !== 'none' && !_injected) {
      _injected = true;
      setTimeout(injectUI, 400);
    }
    if (modal && modal.style.display === 'none') {
      _injected = false;
      /* Видаляємо extBar при закритті */
      var oldBar = document.getElementById('topo-ext-bar');
      if (oldBar) oldBar.remove();
      /* Видаляємо старі кнопки */
      ['topo-slots-btn','topo-form-btn','topo-rsc-btn','topo-deep-btn','topo-note-btn','topo-remote-btn'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.remove();
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });

  /* Перевіряємо кожні 500ms — якщо бар зник, вставляємо знову */
  setInterval(function() {
    var modal = document.getElementById('topo-modal');
    if (!modal || modal.style.display === 'none') return;
    if (!document.getElementById('topo-ext-bar')) {
      console.log('[TopoExt] extBar зник — відновлюємо...');
      injectUI();
    }
  }, 500);


  /* ══════════════════════════════════════════════════
     AUTO DEEP SCAN + MERGE
     Викликається автоматично після loadFromRouter
  ══════════════════════════════════════════════════ */
  function autoDeepScan(ip, user, pass) {
    console.log('[TopoExt] autoDeepScan start:', ip);

    scanVisited = {};

    /* Беремо поточний стан canvas */
    var existingNodes = (window._topoNodes || []).slice();
    var existingEdges = (window._topoEdges || []).slice();

    deepScan(ip, user, pass, null, 0,
      function(msg) {
        /* Оновлюємо статус */
        var st = document.getElementById('topo-status-text');
        if (st) st.textContent = msg;
      },
      function() {
        if (!scanResults.nodes.length) {
          console.warn('[TopoExt] autoDeepScan: нічого не знайдено');
          return;
        }

        console.log('[TopoExt] autoDeepScan done:', scanResults.nodes.length, 'nodes');

        /* Merge існуючих даних з результатами deepScan */
        var merged = smartMerge(existingNodes, existingEdges,
                                scanResults.nodes, scanResults.edges);

        console.log('[TopoExt] після merge:', merged.nodes.length, 'nodes');
        _doSetState(merged);
      }
    );
  }

  /* Розумний merge по IP адресі */
  function smartMerge(existNodes, existEdges, newNodes, newEdges) {
    /* Будуємо індекси */
    var byId  = {};
    var byIp  = {};
    var result = { nodes: [], edges: [] };

    /* Спочатку всі існуючі */
    existNodes.forEach(function(n) {
      byId[n.id] = n;
      if (n.ip) byIp[n.ip] = n;
      result.nodes.push(n);
    });

    /* Додаємо нові — якщо IP вже є, збагачуємо існуючий */
    newNodes.forEach(function(n) {
      /* Пошук по IP */
      if (n.ip && byIp[n.ip]) {
        var ex = byIp[n.ip];
        /* Збагачуємо полями яких немає */
        if (n.mac   && !ex.mac)    ex.mac   = n.mac;
        if (n.note  && !ex.note)   ex.note  = n.note;
        if (n.label && n.label !== n.ip && ex.label === ex.ip) ex.label = n.label;
        if (n.vendor) ex.vendor = n.vendor;
        return;
      }
      /* Пошук по ID */
      if (byId[n.id]) {
        var exId = byId[n.id];
        if (n.mac && !exId.mac) exId.mac = n.mac;
        if (n.ip  && !exId.ip)  exId.ip  = n.ip;
        return;
      }
      /* Новий вузол */
      byId[n.id] = n;
      if (n.ip) byIp[n.ip] = n;
      result.nodes.push(n);
    });

    /* Edges — існуючі + нові без дублів */
    var edgeKey = {};
    existEdges.forEach(function(e) {
      var k = e.from + '->' + e.to;
      edgeKey[k] = true;
      result.edges.push(e);
    });
    newEdges.forEach(function(e) {
      var k = e.from + '->' + e.to;
      if (!edgeKey[k]) {
        edgeKey[k] = true;
        result.edges.push(e);
      }
    });

    return result;
  }

  /* Експортуємо для topology-visual.js */
  window._topoAutoDeepScan = autoDeepScan;

  window._topoExtInject = injectUI;
  window._doSetState = _doSetState;
  console.log('[TopoExt] ініціалізовано!');

})();