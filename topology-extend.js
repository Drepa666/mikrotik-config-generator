'use strict';
(function() {

  var SAVE_KEY = 'mt-topo-saves';

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
    if (!data || !data.nodes || !data.nodes.length) return;

    /* Зберігаємо в localStorage */
    try { localStorage.setItem('mt-topology', JSON.stringify(data)); } catch(e) {}

    /* Спосіб 1: пряме встановлення через window._topoNodes (найнадійніший) */
    if (window._topoNodes !== undefined && window._topoEdges !== undefined) {
      /* Очищаємо існуючі масиви */
      window._topoNodes.length = 0;
      window._topoEdges.length = 0;
      /* Додаємо нові дані */
      data.nodes.forEach(function(n) { window._topoNodes.push(n); });
      (data.edges || []).forEach(function(e) { window._topoEdges.push(e); });
      /* Перемальовуємо */
      if (typeof window._topoDraw === 'function') {
        window._topoDraw();
      }
      /* Авто-розміщення */
      setTimeout(function() {
        if (typeof window._topoAutoLayout === 'function') {
          window._topoAutoLayout(true);
        }
      }, 100);
      showToast('Завантажено ' + data.nodes.length + ' вузлів, ' + (data.edges || []).length + ' зєднань');
      return;
    }

    /* Спосіб 2: через _topoLoadSaved (запасний) */
    if (typeof window._topoLoadSaved === 'function') {
      window._topoLoadSaved();
      showToast('Завантажено ' + data.nodes.length + ' вузлів');
      return;
    }

    /* Спосіб 3: показуємо підказку */
    showToast('Збережено ' + data.nodes.length + ' вузлів - натисни "Авто"');
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
    if (depth > 3 || scanVisited[ip]) { onDone && onDone(); return; }
    scanVisited[ip] = true;
    onProg && onProg('Сканую ' + ip + '...');
    var nodeId = 'rt-' + ip.replace(/\./g, '-');
    if (depth === 0) { scanResults = { nodes: [], edges: [] }; }
    scanResults.nodes.push({ id: nodeId, type: 'router', label: ip, ip: ip, x: 200 + depth * 200, y: 200 + Math.random() * 200 });
    if (parentId) scanResults.edges.push({ from: parentId, to: nodeId, label: '', active: true });
    Promise.all([
      restCall(ip, user, pass, '/ip/neighbor').catch(function() { return []; }),
      restCall(ip, user, pass, '/system/identity').catch(function() { return {}; }),
      restCall(ip, user, pass, '/ip/arp').catch(function() { return []; }),
      restCall(ip, user, pass, '/ip/dhcp-server/lease').catch(function() { return []; }),
      restCall(ip, user, pass, '/caps-man/registration-table').catch(function() { return []; }),
    ]).then(function(res) {
      var neighbors = res[0];
      var identity  = res[1];
      var arps      = res[2];
      var leases    = res[3];
      var capsman   = res[4];

      /* Оновлюємо назву роутера */
      var node = scanResults.nodes.find(function(n) { return n.id === nodeId; });
      if (node && identity && identity.name) {
        node.label = identity.name;
        node.note  = 'IP: ' + ip;
      }

      /* Мапи hostname з DHCP leases */
      var hostnameMap = {};
      var macMap      = {};
      if (Array.isArray(leases)) {
        leases.forEach(function(l) {
          if (l.address) {
            hostnameMap[l.address] = l['host-name'] || '';
            macMap[l.address]      = l['mac-address'] || '';
          }
        });
      }

      /* Додаємо хости з ARP */
      if (Array.isArray(arps)) {
        arps.forEach(function(arp) {
          if (!arp.address || arp.address === ip) return;
          var hostId = 'host-' + arp.address.replace(/\./g, '-');
          if (scanResults.nodes.find(function(n) { return n.id === hostId; })) return;

          var hostname = hostnameMap[arp.address] || arp.address;
          var mac      = arp['mac-address'] || macMap[arp.address] || '';

          /* Визначаємо тип по MAC OUI або hostname */
          var type = 'pc';
          var hn   = hostname.toLowerCase();
          if (hn.includes('phone') || hn.includes('iphone') || hn.includes('android')) type = 'phone';
          else if (hn.includes('ap') || hn.includes('access')) type = 'ap';
          else if (hn.includes('server') || hn.includes('srv'))  type = 'server';

          scanResults.nodes.push({
            id:    hostId,
            type:  type,
            label: hostname,
            ip:    arp.address,
            mac:   mac,
            iface: arp.interface || '',
            note:  'MAC: ' + mac + (arp.interface ? ' | iface: ' + arp.interface : ''),
            x:     150 + Math.random() * 600,
            y:     350 + Math.random() * 200,
          });
          scanResults.edges.push({ from: nodeId, to: hostId, label: arp.interface || '', active: true });
        });
      }

      /* CAPsMAN AP */
      if (Array.isArray(capsman)) {
        capsman.forEach(function(ap) {
          var apMac = ap['mac-address'] || '';
          var apId  = 'ap-' + apMac.replace(/[:.]/g, '-');
          if (!apMac || scanResults.nodes.find(function(n) { return n.id === apId; })) return;
          scanResults.nodes.push({
            id:    apId,
            type:  'ap',
            label: ap.ssid || apMac,
            ip:    '',
            mac:   apMac,
            iface: ap.interface || '',
            note:  'CAPsMAN AP | SSID: ' + (ap.ssid || '') + ' | MAC: ' + apMac,
            x:     200 + Math.random() * 500,
            y:     150 + Math.random() * 200,
          });
          scanResults.edges.push({ from: nodeId, to: apId, label: 'CAPsMAN', active: true });
        });
      }

      /* Сусіди MikroTik — рекурсивно */
      var pending = [];
      if (Array.isArray(neighbors)) {
        neighbors.forEach(function(nb) {
          var nbIp = nb.address || nb.address4 || '';
          if (!nbIp || scanVisited[nbIp]) return;
          var platform = (nb.platform || '').toLowerCase();
          if (platform.includes('mikrotik') || nb['software-id']) {
            pending.push(nbIp);
          } else {
            var nbId   = 'nb-' + nbIp.replace(/\./g, '-');
            var nbType = platform.includes('switch') ? 'switch' :
                         platform.includes('cisco')  ? 'switch' : 'unknown';
            if (!scanResults.nodes.find(function(n) { return n.id === nbId; })) {
              scanResults.nodes.push({
                id:    nbId,
                type:  nbType,
                label: nb.identity || nb['system-name'] || nbIp,
                ip:    nbIp,
                mac:   nb['mac-address'] || '',
                iface: nb.interface || '',
                note:  'Platform: ' + (nb.platform || '?') + ' | IP: ' + nbIp,
                x:     300 + Math.random() * 400,
                y:     100 + Math.random() * 300,
              });
              scanResults.edges.push({ from: nodeId, to: nbId, label: nb.interface || '', active: true });
            }
          }
        });
      }

      if (!pending.length) { onDone && onDone(); return; }
      var done = 0;
      pending.forEach(function(nbIp) {
        deepScan(nbIp, user, pass, nodeId, depth + 1, onProg, function() {
          done++;
          if (done >= pending.length) onDone && onDone();
        });
      });
      setTimeout(function() { if (done < pending.length) onDone && onDone(); }, 8000);
    }).catch(function() { onDone && onDone(); });
  }

  /* ── Додаємо кнопки в toolbar topology-visual.js ── */
  function injectUI() {
    var modal = document.getElementById('topo-modal');
    if (!modal) return;
    if (document.getElementById('topo-slots-btn')) return;

    /* Шукаємо toolbar — пробуємо різні селектори */
    var toolbar = null;

    /* Варіант 1: div з padding:8px */
    var t1 = modal.querySelectorAll('div[style*="padding:8px"]');
    if (t1.length) toolbar = t1[t1.length - 1];

    /* Варіант 2: div що містить кнопки додавання вузлів */
    if (!toolbar) {
      var allDivs = modal.querySelectorAll('div');
      for (var di = 0; di < allDivs.length; di++) {
        var btns = allDivs[di].querySelectorAll('button');
        if (btns.length >= 3) { toolbar = allDivs[di]; break; }
      }
    }

    /* Варіант 3: просто перший або другий дочірній div */
    if (!toolbar) toolbar = modal.children[1] || modal.children[0];

    if (!toolbar) {
      console.warn('[TopoExt] toolbar не знайдено — retry за 1s');
      setTimeout(injectUI, 1000);
      return;
    }

    console.log('[TopoExt] toolbar знайдено:', toolbar.tagName, toolbar.style.cssText.slice(0,50));

    function makeBtn(id, text, color, onclick) {
      var b = document.createElement('button');
      b.id = id;
      b.textContent = text;
      b.style.cssText = 'background:transparent;border:1px solid ' + color + ';color:' + color + ';padding:5px 10px;border-radius:5px;cursor:pointer;font-size:11px;white-space:nowrap;margin-left:2px;';
      b.onclick = onclick;
      toolbar.appendChild(b);
      return b;
    }

    /* Слоти */
    makeBtn('topo-slots-btn', 'Слоти', '#5fd0a5', function() {
      var panel = document.getElementById('topo-save-panel');
      if (!panel) panel = buildSavePanel();
      renderSlots();
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });

    /* З форми */
    makeBtn('topo-form-btn', 'З форми', '#8ea3b0', function() {
      var data = {
        nodes: [
          { id: 'c1', type: 'cloud',  label: 'Internet',   x: 500, y: 60  },
          { id: 'r1', type: 'router', label: 'Router\n192.168.88.1', ip: '192.168.88.1', x: 500, y: 220 },
          { id: 's1', type: 'switch', label: 'LAN Bridge',  x: 300, y: 380 },
          { id: 'a1', type: 'ap',     label: 'WiFi AP',     x: 150, y: 500 },
          { id: 'p1', type: 'pc',     label: 'PC',          x: 400, y: 500 },
        ],
        edges: [
          { from: 'c1', to: 'r1', label: 'WAN',    active: true },
          { from: 'r1', to: 's1', label: 'LAN',    active: true },
          { from: 's1', to: 'a1', label: 'ether2', active: true },
          { from: 's1', to: 'p1', label: 'ether3', active: true },
        ]
      };
      topoSetState(data);
    });

    /* З RSC */
    makeBtn('topo-rsc-btn', 'З RSC', '#8ea3b0', function() {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.rsc,.txt';
      input.onchange = function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
          var data = importFromRSC(ev.target.result);
          if (data) topoSetState(data);
        };
        reader.readAsText(file);
      };
      input.click();
    });

    /* Глибоке сканування */
    makeBtn('topo-deep-btn', 'Глибокий скан', '#5fd0a5', function() {
      var ipEl   = document.getElementById('topo-ip');
      var userEl = document.getElementById('topo-user');
      var passEl = document.getElementById('topo-pass');
      if (!ipEl || !userEl || !passEl) { alert('Поля IP/User/Pass не знайдено!'); return; }
      var ip   = ipEl.value.trim();
      var user = userEl.value.trim();
      var pass = passEl.value.trim();
      if (!ip) { alert('Введи IP роутера!'); return; }
      var btn = document.getElementById('topo-deep-btn');
      btn.disabled = true; btn.textContent = 'Сканую...';
      scanVisited = {};
      deepScan(ip, user, pass, null, 0,
        function(msg) { btn.textContent = msg.slice(0, 20); },
        function() {
          btn.disabled = false; btn.textContent = 'Глибокий скан';
          if (!scanResults.nodes.length) { alert('Нічого не знайдено!'); return; }
          topoSetState(scanResults);
          alert('Знайдено: ' + scanResults.nodes.length + ' вузлів!');
        }
      );
    });

    /* Нотатка */
    makeBtn('topo-note-btn', 'Нотатка', '#f0a840', function() {
      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:999999;display:flex;align-items:center;justify-content:center;';
      var box = document.createElement('div');
      box.style.cssText = 'background:#0d1821;border:1px solid #2a3b48;border-radius:10px;padding:20px;width:300px;';
      var ttl = document.createElement('div');
      ttl.textContent = 'Текст нотатки';
      ttl.style.cssText = 'font-size:13px;font-weight:700;color:#e6edf3;margin-bottom:10px;';
      var inp2 = document.createElement('input');
      inp2.type = 'text';
      inp2.placeholder = 'Введи текст...';
      inp2.style.cssText = 'width:100%;box-sizing:border-box;background:#111d27;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:8px 10px;font-size:12px;outline:none;margin-bottom:10px;';
      var btns2 = document.createElement('div');
      btns2.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;';
      var cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Скасувати';
      cancelBtn.style.cssText = 'background:transparent;border:1px solid #2a3b48;color:#8ea3b0;border-radius:6px;padding:6px 14px;font-size:11px;cursor:pointer;';
      cancelBtn.onclick = function() { document.body.removeChild(overlay); };
      var okBtn = document.createElement('button');
      okBtn.textContent = 'Додати';
      okBtn.style.cssText = 'background:#5fd0a5;color:#082018;border:none;border-radius:6px;padding:6px 14px;font-size:11px;font-weight:700;cursor:pointer;';
      okBtn.onclick = function() {
        var txt = inp2.value.trim();
        document.body.removeChild(overlay);
        if (!txt) return;
        window.dispatchEvent(new CustomEvent('topo-add-node', { detail: { type: 'note', label: txt, x: 400 + Math.random()*200, y: 300 } }));
      };
      inp2.addEventListener('keydown', function(e) { if (e.key === 'Enter') okBtn.click(); if (e.key === 'Escape') cancelBtn.click(); });
      btns2.appendChild(cancelBtn); btns2.appendChild(okBtn);
      box.appendChild(ttl); box.appendChild(inp2); box.appendChild(btns2);
      overlay.appendChild(box); document.body.appendChild(overlay);
      setTimeout(function() { inp2.focus(); }, 50);
    });

    console.log('[TopoExt] UI ін\'єктовано!');
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
      /* Видаляємо старі кнопки щоб при повторному відкритті вони були додані знову */
      ['topo-slots-btn','topo-form-btn','topo-rsc-btn','topo-deep-btn','topo-note-btn'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.remove();
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });

  /* Якщо modal вже є — перевіряємо кожну секунду */
  var _retryInterval = setInterval(function() {
    var modal = document.getElementById('topo-modal');
    if (!modal) return;
    if (modal.style.display === 'none') return;
    if (document.getElementById('topo-slots-btn')) return;
    console.log('[TopoExt] retry injectUI...');
    injectUI();
  }, 1000);

  console.log('[TopoExt] ініціалізовано!');

})();