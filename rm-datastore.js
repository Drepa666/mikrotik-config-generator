'use strict';

/* ============================================================
   DataStore — центральний кеш даних роутера
   EventBus  — пов'язує секції між собою
   ============================================================ */

(function() {

  var PROXY = 'http://localhost:8888';

  /* ══════════════════════════════════════════════════════════
     EVENT BUS
     ══════════════════════════════════════════════════════════ */
  var EventBus = {
    _handlers: {},
    on: function(event, fn) {
      if (!this._handlers[event]) this._handlers[event] = [];
      this._handlers[event].push(fn);
    },
    off: function(event, fn) {
      if (!this._handlers[event]) return;
      this._handlers[event] = this._handlers[event].filter(function(h) { return h !== fn; });
    },
    emit: function(event, data) {
      (this._handlers[event] || []).forEach(function(fn) {
        try { fn(data); } catch(e) { console.error('[EventBus]', event, e); }
      });
    },
  };

  /* ══════════════════════════════════════════════════════════
     DATA STORE
     ══════════════════════════════════════════════════════════ */
  var DataStore = {
    _cache:    {},   /* { routerId: { interfaces: [], addresses: [], ... } } */
    _loading:  {},   /* { routerId_key: Promise } */
    _router:   null, /* поточний активний роутер */

    setRouter: function(router) {
      this._router = router;
      if (router && !this._cache[router.id]) {
        this._cache[router.id] = {};
      }
    },

    getRouter: function() { return this._router; },

    /* Отримати дані з кешу або завантажити */
    get: function(key, force) {
      var self   = this;
      var router = this._router;
      if (!router) return Promise.resolve([]);

      var cache = this._cache[router.id] || {};

      if (!force && cache[key] !== undefined) {
        return Promise.resolve(cache[key]);
      }

      var loadKey = router.id + '_' + key;
      if (this._loading[loadKey]) return this._loading[loadKey];

      var apiMap = {
        interfaces:      '/interface',
        addresses:       '/ip/address',
        routes:          '/ip/route',
        dhcpLeases:      '/ip/dhcp-server/lease',
        dhcpServers:     '/ip/dhcp-server',
        dhcpNetworks:    '/ip/dhcp-server/network',
        ipPools:         '/ip/pool',
        dns:             '/ip/dns',
        dnsStatic:       '/ip/dns/static',
        arp:             '/ip/arp',
        fwFilter:        '/ip/firewall/filter',
        fwNat:           '/ip/firewall/nat',
        fwMangle:        '/ip/firewall/mangle',
        fwAddressList:   '/ip/firewall/address-list',
        fwConnections:   '/ip/firewall/connection',
        fwServicePort:   '/ip/firewall/service-port',
        wireless:        '/interface/wireless',
        wirelessClients: '/interface/wireless/registration-table',
        wireguard:       '/interface/wireguard',
        wireguardPeers:  '/interface/wireguard/peers',
        bridge:          '/interface/bridge',
        bridgePorts:     '/interface/bridge/port',
        vlan:            '/interface/vlan',
        pppoeClient:     '/interface/pppoe-client',
        lte:             '/interface/lte',
        bonding:         '/interface/bonding',
        queuesSimple:    '/queue/simple',
        queuesTree:      '/queue/tree',
        queuesType:      '/queue/type',
        pppSecrets:      '/ppp/secret',
        pppActive:       '/ppp/active',
        pppProfiles:     '/ppp/profile',
        users:           '/user',
        userGroups:      '/user/group',
        scheduler:       '/system/scheduler',
        scripts:         '/system/script',
        resource:        '/system/resource',
        identity:        '/system/identity',
        clock:           '/system/clock',
        ntp:             '/system/ntp/client',
        logging:         '/system/logging',
        logActions:      '/system/logging/action',
        packages:        '/system/package',
        health:          '/system/health',
        services:        '/ip/service',
        neighbors:       '/ip/neighbor',
        netwatch:        '/tool/netwatch',
        snmp:            '/snmp',
        certificates:    '/certificate',
        ipv6Addresses:   '/ipv6/address',
        ipv6Routes:      '/ipv6/route',
        romonNeighbors:  '/tool/romon/neighbor',
        interfaceLists:  '/interface/list',
        ifListMembers:   '/interface/list/member',
        ospf:            '/routing/ospf/instance',
        bgp:             '/routing/bgp/connection',
      };

      var path = apiMap[key];
      if (!path) return Promise.resolve([]);

      var promise = restCall(router, 'GET', path).then(function(data) {
        delete self._loading[loadKey];
        if (Array.isArray(data)) {
          self._cache[router.id][key] = data;
          EventBus.emit('data:loaded', { key: key, data: data, routerId: router.id });
        }
        return Array.isArray(data) ? data : [];
      }).catch(function() {
        delete self._loading[loadKey];
        return [];
      });

      this._loading[loadKey] = promise;
      return promise;
    },

    /* Інвалідуємо кеш після зміни */
    invalidate: function(key) {
      var router = this._router;
      if (!router || !this._cache[router.id]) return;
      delete this._cache[router.id][key];
      EventBus.emit('data:invalidated', { key: key });
    },

    /* Інвалідуємо пов'язані ключі */
    invalidateRelated: function(key) {
      var related = {
        interfaces:   ['addresses','arp','fwFilter','fwNat','wireless','vlan','bridgePorts','dhcpServers'],
        addresses:    ['routes','arp','dhcpNetworks'],
        dhcpServers:  ['dhcpLeases','dhcpNetworks','ipPools'],
        ipPools:      ['dhcpServers'],
        fwFilter:     ['fwNat','fwMangle'],
        fwAddressList:['fwFilter','fwNat','fwMangle'],
        pppSecrets:   ['pppActive'],
        users:        ['userGroups'],
        scheduler:    ['scripts'],
        wireguard:    ['wireguardPeers'],
        bridge:       ['bridgePorts','vlan'],
      };
      var self = this;
      this.invalidate(key);
      (related[key] || []).forEach(function(k) { self.invalidate(k); });
      EventBus.emit('data:changed', { key: key });
    },

    /* Отримати список інтерфейсів для dropdown */
    getInterfaceNames: function() {
      var router = this._router;
      if (!router) return Promise.resolve([]);
      return this.get('interfaces').then(function(ifaces) {
        return ifaces.map(function(i) { return i.name; }).filter(Boolean);
      });
    },

    /* Отримати всі типи інтерфейсів */
    getInterfacesByType: function(type) {
      return this.get('interfaces').then(function(ifaces) {
        return ifaces.filter(function(i) { return i.type === type; });
      });
    },

    /* Очистити кеш роутера */
    clearRouter: function(routerId) {
      delete this._cache[routerId];
    },
  };

  /* ══════════════════════════════════════════════════════════
     REST HELPERS
     ══════════════════════════════════════════════════════════ */
  function restCall(router, method, path, body) {
    var url  = PROXY + '/rest' + path;
    var opts = {
      method: method,
      headers: {
        'Content-Type':  'application/json',
        'x-router-ip':   router.ip,
        'x-router-port': String(router.port),
        'Authorization': 'Basic ' + btoa(router.user + ':' + router.pass),
      },
    };
    if (body) opts.body = JSON.stringify(body);
    return fetch(url, opts).then(function(r) {
      if (r.status === 204) return {};
      return r.json().catch(function() { return {}; });
    });
  }

  function sshCall(router, command) {
    return fetch(PROXY + '/ssh/exec', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: router.ip, port: router.sshPort || 22,
        username: router.user, password: router.pass,
        command: command,
      }),
    }).then(function(r) { return r.json(); });
  }

  /* ══════════════════════════════════════════════════════════
     SMART FORM HELPERS — заповнюють dropdown реальними даними
     ══════════════════════════════════════════════════════════ */
  var SmartForm = {

    /* Dropdown з інтерфейсами */
    ifaceSelect: function(selected, extraOptions) {
      return DataStore.getInterfaceNames().then(function(names) {
        var opts = (extraOptions || []).concat(names);
        return '<select>' +
          opts.map(function(n) {
            return '<option value="' + esc(n) + '"' + (n === selected ? ' selected' : '') + '>' + esc(n) + '</option>';
          }).join('') +
        '</select>';
      });
    },

    /* Dropdown з пулами */
    poolSelect: function(selected) {
      return DataStore.get('ipPools').then(function(pools) {
        var opts = [''].concat(pools.map(function(p) { return p.name; }));
        return '<select>' +
          opts.map(function(n) {
            return '<option value="' + esc(n) + '"' + (n === selected ? ' selected' : '') + '>' + esc(n || '— не вибрано —') + '</option>';
          }).join('') +
        '</select>';
      });
    },

    /* Dropdown з профілями PPP */
    pppProfileSelect: function(selected) {
      return DataStore.get('pppProfiles').then(function(profiles) {
        var opts = profiles.map(function(p) { return p.name; });
        return '<select>' +
          opts.map(function(n) {
            return '<option value="' + esc(n) + '"' + (n === selected ? ' selected' : '') + '>' + esc(n) + '</option>';
          }).join('') +
        '</select>';
      });
    },
  };

  /* ══════════════════════════════════════════════════════════
     УТИЛІТИ
     ══════════════════════════════════════════════════════════ */
  function esc(s) {
    return String(s || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ══════════════════════════════════════════════════════════
     EXPORT
     ══════════════════════════════════════════════════════════ */
  window.RMStore     = DataStore;
  window.RMEventBus  = EventBus;
  window.RMSmartForm = SmartForm;
  window.RMRestCall  = restCall;
  window.RMSshCall   = sshCall;
  window.RMEsc       = esc;

  console.log('[DataStore] завантажено');

})();