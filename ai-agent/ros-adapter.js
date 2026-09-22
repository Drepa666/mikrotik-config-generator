'use strict';

/* ══════════════════════════════════════════════════
   RouterOS Universal Adapter
   Автодетект версії + адаптація команд v6↔v7
   ══════════════════════════════════════════════════ */

window.ROSAdapter = {

  _version: null,    /* '6' або '7' */
  _model:   null,    /* 'hAP ac lite' тощо */
  _board:   null,    /* 'RB952Ui-5ac2nD' тощо */
  _packages: [],     /* встановлені пакети */

  /* ── Завантажує версію з REST API ── */
  detect: function() {
    var router = window.getActiveRouter ? window.getActiveRouter() : null;
    if (!router) return Promise.resolve(null);
    return Promise.allSettled([
      window.restCall(router, 'GET', '/system/resource'),
      window.restCall(router, 'GET', '/system/routerboard'),
      window.restCall(router, 'GET', '/system/package'),
    ]).then(function(results) {
      /* Resource */
      var res = results[0].status === 'fulfilled' ? results[0].value : {};
      if (Array.isArray(res)) res = res[0] || {};
      var ver = String(res.version || '7');
      ROSAdapter._version  = ver.charAt(0);
      ROSAdapter._verFull  = ver;
      ROSAdapter._model    = res['board-name'] || res['platform'] || '?';
      ROSAdapter._arch     = res['architecture-name'] || '?';
      ROSAdapter._cpu      = res['cpu'] || '?';
      ROSAdapter._ram      = res['total-memory'] || '?';
      ROSAdapter._freeRam  = res['free-memory'] || '?';
      ROSAdapter._cpuLoad  = res['cpu-load'] || '0';
      ROSAdapter._uptime   = res['uptime'] || '?';
      /* Routerboard */
      var rb = results[1].status === 'fulfilled' ? results[1].value : {};
      if (Array.isArray(rb)) rb = rb[0] || {};
      ROSAdapter._board    = rb['board-name'] || rb.model || ROSAdapter._model;
      ROSAdapter._serial   = rb['serial-number'] || '?';
      ROSAdapter._firmware = rb['current-firmware'] || '?';
      /* Packages */
      var pkgs = results[2].status === 'fulfilled' ? results[2].value : [];
      if (!Array.isArray(pkgs)) pkgs = [];
      ROSAdapter._packages = pkgs
        .filter(function(p) { return p.disabled !== 'true'; })
        .map(function(p) { return p.name; });
      /* Детектуємо WiFi стек */
      ROSAdapter._wifiStack = 'none';
      ROSAdapter._packages.forEach(function(p) {
        if (p.indexOf('wifi-qcom') >= 0 || p.indexOf('wifi-mediatek') >= 0)
          ROSAdapter._wifiStack = 'new';   /* /interface wifi */
        else if (p === 'wireless')
          ROSAdapter._wifiStack = 'old';   /* /interface wireless */
      });
      /* v6 завжди старий стек */
      if (ROSAdapter._version === '6') ROSAdapter._wifiStack = 'old';
      console.log('[ROSAdapter] Detected:',
        'v' + ROSAdapter._verFull,
        ROSAdapter._board,
        'WiFi:' + ROSAdapter._wifiStack, '✅');
      /* Зберігаємо в роутер */
      if (router) {
        router._rosInfo = ROSAdapter.getSummary();
      }
      return ROSAdapter.getSummary();
    });
  },

  /* ── Підсумок для AI промпту ── */
  getSummary: function() {
    return {
      version:   ROSAdapter._version   || '7',
      verFull:   ROSAdapter._verFull   || '7.x',
      model:     ROSAdapter._model     || '?',
      board:     ROSAdapter._board     || '?',
      arch:      ROSAdapter._arch      || '?',
      serial:    ROSAdapter._serial    || '?',
      firmware:  ROSAdapter._firmware  || '?',
      cpu:       ROSAdapter._cpu       || '?',
      cpuLoad:   ROSAdapter._cpuLoad   || '0',
      ram:       ROSAdapter._ram       || '?',
      freeRam:   ROSAdapter._freeRam   || '?',
      uptime:    ROSAdapter._uptime    || '?',
      packages:  ROSAdapter._packages  || [],
      wifiStack: ROSAdapter._wifiStack || 'none',
      isV7:      ROSAdapter._version === '7',
      isV6:      ROSAdapter._version === '6',
      hasWifi:   ROSAdapter._wifiStack !== 'none',
      hasWireGuard: (ROSAdapter._packages || []).indexOf('wireguard') >= 0
                 || ROSAdapter._version === '7',
    };
  },

  /* ── Адаптує команди під версію ── */
  adaptCommand: function(cmd) {
    var v = ROSAdapter._version || '7';
    var ws = ROSAdapter._wifiStack || 'new';
    var c = cmd.trim();

    /* WiFi: новий стек ↔ старий */
    if (ws === 'old') {
      /* v7 new → v6 old */
      c = c.replace('/interface wifi registration-table', '/interface wireless registration-table');
      c = c.replace('/interface wifi capsman',            '/caps-man');
      c = c.replace('/interface wifi security',           '/interface wireless security-profiles');
      c = c.replace('/interface wifi configuration',      '/caps-man configuration');
      c = c.replace('/interface wifi provisioning',       '/caps-man provisioning');
      c = c.replace('/interface wifi channel',            '/caps-man channel');
      c = c.replace('/interface wifi print',              '/interface wireless print');
    } else {
      /* v6 old → v7 new */
      c = c.replace('/interface wireless registration-table', '/interface wifi registration-table');
      c = c.replace('/caps-man manager',                 '/interface wifi capsman');
      c = c.replace('/interface wireless security-profiles', '/interface wifi security');
      c = c.replace('/caps-man configuration',           '/interface wifi configuration');
      c = c.replace('/caps-man provisioning',            '/interface wifi provisioning');
    }

    /* BGP: v6 → v7 */
    if (v === '7') {
      c = c.replace('/routing bgp instance', '/routing bgp template');
      c = c.replace('/routing bgp peer',     '/routing bgp connection');
      c = c.replace('/routing filter',       '/routing filter rule');
      c = c.replace('/routing ospf network', '/routing ospf interface-template');
    }

    return c;
  },

  /* ── Адаптує масив команд ── */
  adaptCommands: function(commands) {
    return commands.map(function(cmd) {
      var adapted = ROSAdapter.adaptCommand(cmd);
      if (adapted !== cmd) {
        console.log('[ROSAdapter] Adapted:', cmd, '→', adapted);
      }
      return adapted;
    });
  },

  /* ── Контекст для AI промпту ── */
  getAIContext: function() {
    var s = ROSAdapter.getSummary();
    if (!s.verFull || s.verFull === '7.x') return '';
    var lines = [
      '=== ROUTER HARDWARE & SOFTWARE ===',
      'RouterOS version: ' + s.verFull + ' (major: v' + s.version + ')',
      'Model: '    + s.model,
      'Board: '    + s.board,
      'CPU: '      + s.cpu + ' load: ' + s.cpuLoad + '%',
      'RAM: free ' + s.freeRam + ' / total ' + s.ram,
      'Uptime: '   + s.uptime,
      'WiFi stack: ' + (s.wifiStack === 'new'
        ? 'NEW (/interface wifi) — v7 commands'
        : s.wifiStack === 'old'
          ? 'OLD (/interface wireless) — v6 commands'
          : 'none'),
      'Packages: ' + s.packages.join(', '),
      'WireGuard: ' + (s.hasWireGuard ? 'YES' : 'NO'),
      '--- COMMAND RULES FOR THIS ROUTER ---',
      s.isV7
        ? 'USE v7 syntax: /interface wifi, /routing bgp connection, /routing filter rule'
        : 'USE v6 syntax: /interface wireless, /routing bgp peer, /caps-man',
      s.wifiStack === 'old'
        ? 'WiFi: /interface wireless (NOT /interface wifi)'
        : 'WiFi: /interface wifi (NOT /interface wireless)',
    ];
    return lines.join('\n');
  }
};

/* ── Автодетект при підключенні роутера ── */
document.addEventListener('DOMContentLoaded', function() {
  /* Чекаємо поки router-manager завантажиться */
  setTimeout(function() {
    if (window.getActiveRouter && window.getActiveRouter()) {
      ROSAdapter.detect();
    }
    /* Повторно при зміні роутера */
    var _orig = window.getActiveRouter;
    var _last = null;
    setInterval(function() {
      if (!window.getActiveRouter) return;
      var r = window.getActiveRouter();
      var id = r ? r.id : null;
      if (id && id !== _last) {
        _last = id;
        ROSAdapter.detect().then(function(info) {
          if (info) console.log('[ROSAdapter] Router changed, re-detected:', info);
        });
      }
    }, 3000);
  }, 2000);
});

console.log('[ROSAdapter] Ready ✅');
