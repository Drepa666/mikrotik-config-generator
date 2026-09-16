/* ══════════════════════════════════════════════════════
   Port Map Plugin v1.0
   ══════════════════════════════════════════════════════ */
(function() {
  'use strict';
  console.log('[PortMap] loading...');

  var PORT_DB = {
    'hap-ax3':       { eth:['ether1(WAN)','ether2','ether3','ether4','ether5'], sfp:[], wifi:['wifi1(5G)','wifi2(2.4G)'], poe:['ether2-5'], lte:[], usb:true },
    'hap-ax2':       { eth:['ether1(WAN)','ether2','ether3','ether4','ether5'], sfp:[], wifi:['wifi1(5G)','wifi2(2.4G)'], poe:[], lte:[], usb:true },
    'hap-be3':       { eth:['ether1(WAN)','ether2','ether3','ether4','ether5'], sfp:[], wifi:['wifi1(6G)','wifi2(5G)','wifi3(2.4G)'], poe:['ether2-5'], lte:[], usb:true },
    'hap-ac3':       { eth:['ether1(WAN)','ether2','ether3','ether4','ether5'], sfp:['sfp1'], wifi:['wlan1(2.4G)','wlan2(5G)'], poe:['ether2-5'], lte:[], usb:true },
    'hap-ac2':       { eth:['ether1(WAN)','ether2','ether3','ether4','ether5'], sfp:[], wifi:['wlan1(2.4G)','wlan2(5G)'], poe:[], lte:[], usb:true },
    'hap-ax-lite':   { eth:['ether1(WAN)','ether2'], sfp:[], wifi:['wifi1(5G)','wifi2(2.4G)'], poe:[], lte:[], usb:false },
    'rb5009':        { eth:['ether1(WAN)','ether2','ether3','ether4','ether5','ether6','ether7','ether8(2.5G)'], sfp:['sfp-sfpplus1(10G)'], wifi:[], poe:[], lte:[], usb:true },
    'rb4011':        { eth:['ether1(WAN)','ether2','ether3','ether4','ether5','ether6','ether7','ether8','ether9','ether10'], sfp:['sfp-sfpplus1(10G)'], wifi:[], poe:[], lte:[], usb:true },
    'rb4011-wifi':   { eth:['ether1(WAN)','ether2','ether3','ether4','ether5','ether6','ether7','ether8','ether9','ether10'], sfp:['sfp-sfpplus1(10G)'], wifi:['wlan1(2.4G)','wlan2(5G)'], poe:[], lte:[], usb:true },
    'hex-s':         { eth:['ether1(WAN)','ether2','ether3','ether4','ether5(POE-out)'], sfp:['sfp1'], wifi:[], poe:[], lte:[], usb:true },
    'hex':           { eth:['ether1(WAN)','ether2','ether3','ether4','ether5'], sfp:[], wifi:[], poe:[], lte:[], usb:true },
    'hex-poe':       { eth:['ether1(WAN)','ether2','ether3','ether4','ether5'], sfp:['sfp1'], wifi:[], poe:['ether1-4'], lte:[], usb:false },
    'l009-rm':       { eth:['ether1(WAN)','ether2','ether3','ether4','ether5','ether6','ether7','ether8'], sfp:['sfp-sfpplus1(10G)'], wifi:[], poe:['ether2-8'], lte:[], usb:false },
    'l009-wifi6':    { eth:['ether1(WAN)','ether2','ether3','ether4','ether5','ether6','ether7','ether8'], sfp:['sfp-sfpplus1(10G)'], wifi:['wifi1(5G)','wifi2(2.4G)'], poe:['ether2-8'], lte:[], usb:false },
    'chateau-lte12': { eth:['ether1(WAN)','ether2','ether3','ether4','ether5'], sfp:[], wifi:['wlan1(2.4G)'], poe:[], lte:['lte1'], usb:true },
    'chateau-5g':    { eth:['ether1(WAN)','ether2','ether3','ether4','ether5'], sfp:[], wifi:['wifi1(5G)'], poe:[], lte:['lte1'], usb:true },
    'sxt-5ac':       { eth:['ether1'], sfp:[], wifi:['wlan1(5G station)'], poe:['ether1(in)'], lte:[], usb:false },
    'lhg-5ax':       { eth:['ether1'], sfp:[], wifi:['wifi1(5G station)'], poe:['ether1(in)'], lte:[], usb:false },
    'wap-ax':        { eth:['ether1'], sfp:[], wifi:['wifi1(5G)','wifi2(2.4G)'], poe:['ether1(in)'], lte:[], usb:false },
    'cap-ax':        { eth:['ether1'], sfp:[], wifi:['wifi1(5G)','wifi2(2.4G)'], poe:['ether1(in)'], lte:[], usb:false },
    'ccr2004-sfp':   { eth:['ether1(mgmt)'], sfp:['sfp-sfpplus1..12'], wifi:[], poe:[], lte:[], usb:true },
    'ccr2116':       { eth:['ether1..16'], sfp:['sfp-sfpplus1..4'], wifi:[], poe:[], lte:[], usb:true },
  };

  var COLORS = {
    eth:  '#5fd0a5',
    sfp:  '#e6b35a',
    wifi: '#7eb8e0',
    poe:  '#e05252',
    lte:  '#b35ae0',
  };

  /* ── Будуємо модалку ── */
  function buildModal() {
    var modal = document.createElement('div');
    modal.id = 'portmap-modal';
    modal.style.cssText =
      'display:none;position:fixed;inset:0;' +
      'background:rgba(0,0,0,0.75);z-index:10001;' +
      'overflow-y:auto;padding:20px';

    var box = document.createElement('div');
    box.style.cssText =
      'max-width:760px;margin:40px auto;background:#1a2530;' +
      'border-radius:12px;border:1px solid #2a3b48;padding:24px';

    /* Header */
    var hdr = document.createElement('div');
    hdr.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:80px';

    var title = document.createElement('div');
    title.innerHTML =
      '<div style="font-size:18px;font-weight:700;color:#e6b35a">\uD83D\uDD0C Port Map</div>' +
      '<div style="font-size:11px;color:#4a6070">Карта портів по моделі роутера</div>';

    var closeBtn = document.createElement('button');
    closeBtn.textContent = '\u2715 Закрити';
    closeBtn.style.cssText =
      'background:transparent;border:1px solid #2a3b48;' +
      'color:#8ea3b0;padding:6px 14px;border-radius:6px;cursor:pointer';
    closeBtn.onclick = function() { modal.style.display = 'none'; };

    hdr.appendChild(title);
    hdr.appendChild(closeBtn);
    box.appendChild(hdr);

    /* Select моделі */
    var selWrap = document.createElement('div');
    selWrap.style.marginBottom = '20px';
    selWrap.innerHTML =
      '<label style="color:#8ea3b0;font-size:12px;display:block;margin-bottom:80px">Оберіть модель</label>';

    var sel = document.createElement('select');
    sel.id = 'pm-model-sel';
    sel.style.cssText =
      'width:100%;background:#0d1821;border:1px solid #2a3b48;' +
      'border-radius:6px;padding:10px;color:#c9e8d8;font-size:14px';

    var opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = '-- Оберіть модель --';
    sel.appendChild(opt0);

    Object.keys(PORT_DB).sort().forEach(function(k) {
      var opt = document.createElement('option');
      opt.value = k;
      opt.textContent = k;
      sel.appendChild(opt);
    });

    selWrap.appendChild(sel);
    box.appendChild(selWrap);

    /* Результат */
    var result = document.createElement('div');
    result.id = 'pm-result';
    box.appendChild(result);

    sel.onchange = function() {
      var key = this.value;
      result.innerHTML = '';
      if (!key || !PORT_DB[key]) return;
      renderPorts(PORT_DB[key], result);
    };

    modal.appendChild(box);
    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.style.display = 'none';
    });

    document.body.appendChild(modal);
    return modal;
  }

  /* ── Рендер портів ── */
  function renderPorts(d, container) {
    function section(label, items, color) {
      if (!items || !items.length) return;
      var wrap = document.createElement('div');
      wrap.style.marginBottom = '16px';

      var lbl = document.createElement('div');
      lbl.style.cssText = 'color:' + color + ';font-size:12px;font-weight:700;margin-bottom:80px';
      lbl.textContent = label;
      wrap.appendChild(lbl);

      var row = document.createElement('div');
      row.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px';

      items.forEach(function(p) {
        var chip = document.createElement('div');
        chip.style.cssText =
          'background:#0d1821;border:1px solid ' + color + ';' +
          'border-radius:6px;padding:8px 12px;' +
          'font-size:12px;color:' + color + ';font-family:monospace';
        chip.textContent = p;
        row.appendChild(chip);
      });

      wrap.appendChild(row);
      container.appendChild(wrap);
    }

    section('\uD83D\uDD37 Ethernet', d.eth, COLORS.eth);
    section('\uD83D\uDCA1 SFP', d.sfp, COLORS.sfp);
    section('\uD83D\uDCF6 Wi-Fi', d.wifi, COLORS.wifi);
    section('\uD83D\uDCF6 LTE', d.lte, COLORS.lte);

    if (d.poe && d.poe.length) {
      var poeDiv = document.createElement('div');
      poeDiv.style.cssText =
        'background:#1a0d0d;border:1px solid ' + COLORS.poe + ';' +
        'border-radius:6px;padding:10px;margin-bottom:80px';
      poeDiv.innerHTML =
        '<div style="color:' + COLORS.poe + ';font-size:12px;font-weight:700;margin-bottom:80px">\u26A1 POE виходи</div>' +
        '<div style="color:#c9e8d8;font-size:12px">' + d.poe.join(', ') + '</div>';
      container.appendChild(poeDiv);
    }

    var usbDiv = document.createElement('div');
    usbDiv.style.cssText = 'display:flex;gap:8px;align-items:center';
    usbDiv.innerHTML =
      '<div style="color:#8ea3b0;font-size:12px">USB:</div>' +
      '<div style="font-size:12px;font-weight:700;color:' + (d.usb ? COLORS.eth : COLORS.poe) + '">' +
      (d.usb ? '\u2705 \u0454' : '\u274C \u041D\u0435\u043C\u0430\u0454') + '</div>';
    container.appendChild(usbDiv);
  }

  /* ── FAB кнопка ── */
  function buildFab(modal) {
    var fab = document.createElement('button');
    fab.id = 'portmap-fab';
    fab.title = 'Port Map';
    fab.innerHTML = '\uD83D\uDD0C';
    fab.style.cssText =
      'display:none;position:fixed;right:16px;bottom:80px;' +
      'width:44px;height:44px;border-radius:50%;' +
      'background:#1a2530;border:2px solid #e6b35a;' +
      'color:#e6b35a;font-size:18px;cursor:pointer;z-index:9001;' +
      'align-items:center;justify-content:center;' +
      'box-shadow:0 2px 8px rgba(0,0,0,0.5)';
    fab.onclick = function() { modal.style.display = 'block'; };
    document.body.appendChild(fab);
    return fab;
  }

  /* ── Ініціалізація ── */
  function init() {
    var modal = buildModal();
    var fab   = buildFab(modal);

    window.PortMapPlugin = {
      enable: function() {
        fab.style.display = 'flex';
        localStorage.setItem('portmap-enabled', '1');
        console.log('[PortMap] увімкнено');
      },
      disable: function() {
        fab.style.display = 'none';
        modal.style.display = 'none';
        localStorage.setItem('portmap-enabled', '0');
        console.log('[PortMap] вимкнено');
      },
      open: function() {
        modal.style.display = 'block';
      },
    };

    /* Відновлюємо стан */
    if (localStorage.getItem('portmap-enabled') === '1') {
      window.PortMapPlugin.enable();
    }

    console.log('[PortMap] v1.0 ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 200);
  }

})();