'use strict';
window.OUILookup = {

  /* ── Локальна база (топ вендори) ── */
  _db: {
    /* MikroTik */
    '4C:5E:0C':'MikroTik','2C:C8:1B':'MikroTik','B8:69:F4':'MikroTik',
    'D4:CA:6D':'MikroTik','DC:2C:6E':'MikroTik','E4:8D:8C':'MikroTik',
    '18:FD:74':'MikroTik','48:8F:5A':'MikroTik','74:4D:28':'MikroTik',
    '6C:3B:6B':'MikroTik','08:55:31':'MikroTik','64:D1:54':'MikroTik',
    'C4:AD:34':'MikroTik','CC:2D:E0':'MikroTik','DC:2C:6E':'MikroTik',
    /* Cisco */
    '00:09:0F':'Cisco','00:1A:A1':'Cisco','00:1B:54':'Cisco',
    '00:23:EA':'Cisco','58:AC:78':'Cisco','70:DB:98':'Cisco',
    'A4:4C:11':'Cisco','00:0C:29':'Cisco','00:50:56':'Cisco VMware',
    '00:1C:57':'Cisco','00:22:55':'Cisco','FC:FB:FB':'Cisco',
    /* MediaTek */
    'F4:4E:B4':'MediaTek','00:0C:E7':'MediaTek','00:0C:43':'MediaTek',
    '00:90:CC':'MediaTek','20:F4:1B':'MediaTek','4C:BC:98':'MediaTek',
    'AC:BD:D4':'MediaTek','C4:4B:44':'MediaTek','10:6F:3F':'MediaTek',
    /* Realtek (дуже часто в пристроях) */
    '00:E0:4C':'Realtek','52:54:00':'Realtek/QEMU',
    /* TP-Link */
    '50:C7:BF':'TP-Link','54:AF:97':'TP-Link','14:CC:20':'TP-Link',
    'B0:95:75':'TP-Link','AC:84:C9':'TP-Link','E8:48:B8':'TP-Link',
    '30:DE:4B':'TP-Link','A0:F3:C1':'TP-Link','18:A6:F7':'TP-Link',
    '90:F6:52':'TP-Link','D8:47:32':'TP-Link','EC:08:6B':'TP-Link',
    /* Huawei */
    '00:46:4B':'Huawei','04:C0:6F':'Huawei','28:31:52':'Huawei',
    '4C:54:99':'Huawei','54:89:98':'Huawei','70:72:CF':'Huawei',
    '48:57:02':'Huawei','88:C3:97':'Huawei','AC:4E:91':'Huawei',
    /* Hikvision */
    'C0:56:E3':'Hikvision','44:19:B6':'Hikvision','8C:E7:48':'Hikvision',
    'BC:AD:28':'Hikvision','D0:C5:D3':'Hikvision','18:68:CB':'Hikvision',
    '10:12:FB':'Hikvision','28:57:BE':'Hikvision','54:C4:15':'Hikvision',
    /* Dahua */
    '3C:EF:8C':'Dahua','90:02:A9':'Dahua','4C:11:BF':'Dahua',
    'E0:50:8B':'Dahua','BC:32:B2':'Dahua',
    /* Ubiquiti */
    '04:18:D6':'Ubiquiti','24:A4:3C':'Ubiquiti','68:72:51':'Ubiquiti',
    '78:8A:20':'Ubiquiti','B4:FB:E4':'Ubiquiti','DC:9F:DB':'Ubiquiti',
    '00:27:22':'Ubiquiti','FC:EC:DA':'Ubiquiti','80:2A:A8':'Ubiquiti',
    /* SMA Solar */
    '00:80:25':'SMA Solar','00:15:BB':'SMA Solar',
    'A4:C3:F0':'SMA Solar','00:0C:B8':'SMA Solar',
    /* Huawei Solar */
    'D0:76:50':'Huawei Solar','70:72:CF':'Huawei Solar',
    /* Growatt */
    'C4:4F:33':'Growatt','58:BF:25':'Growatt',
    /* Goodwe */
    'C4:4F:33':'GoodWe','D8:96:E0':'GoodWe',
    /* Sungrow */
    '64:69:4E':'Sungrow','98:D8:63':'Sungrow',
    /* Victron */
    '00:26:EC':'Victron','CC:6B:B4':'Victron',
    /* Fronius */
    '00:03:AC':'Fronius',
    /* Waveshare */
    '2C:F7:F1':'Waveshare','00:08:DC':'WIZnet',
    '28:CD:C1':'Waveshare',
    /* Shelly */
    'C4:5B:BE':'Shelly','84:F7:03':'Shelly','E8:DB:84':'Shelly',
    '30:C6:F7':'Shelly',
    /* Sonoff */
    'A8:03:2A':'Sonoff','84:F3:EB':'Sonoff','10:06:1C':'Sonoff',
    /* Espressif (ESP8266/ESP32) */
    '24:62:AB':'Espressif','30:AE:A4':'Espressif',
    'A4:CF:12':'Espressif','CC:50:E3':'Espressif',
    '24:0A:C4':'Espressif','3C:71:BF':'Espressif',
    '80:7D:3A':'Espressif','84:CC:A8':'Espressif',
    '94:B9:7E':'Espressif','A4:E5:7C':'Espressif',
    /* Raspberry Pi */
    'B8:27:EB':'Raspberry Pi','DC:A6:32':'Raspberry Pi',
    'E4:5F:01':'Raspberry Pi','D8:3A:DD':'Raspberry Pi',
    /* Apple */
    '00:03:93':'Apple','3C:22:FB':'Apple','A4:CF:99':'Apple',
    'F0:18:98':'Apple','AC:DE:48':'Apple','00:1B:63':'Apple',
    /* Samsung */
    '00:16:32':'Samsung','2C:FD:A1':'Samsung','8C:77:12':'Samsung',
    'A0:07:98':'Samsung','F4:7B:5E':'Samsung',
    /* Dell */
    '00:14:22':'Dell','18:DB:F2':'Dell','F8:BC:12':'Dell',
    'B4:96:91':'Dell','14:18:77':'Dell',
    /* HP */
    '00:0F:61':'HP','3C:D9:2B':'HP','94:57:A5':'HP',
    'FC:15:B4':'HP','9C:8E:99':'HP',
    /* D-Link */
    '00:1C:F0':'D-Link','14:D6:4D':'D-Link','84:C9:B2':'D-Link',
    '90:94:E4':'D-Link','B0:C5:54':'D-Link',
    /* Netgear */
    '00:14:6C':'Netgear','20:4E:7F':'Netgear','A0:04:60':'Netgear',
    '9C:3D:CF':'Netgear','C0:3F:0E':'Netgear',
    /* Zyxel */
    '00:13:49':'Zyxel','50:67:F0':'Zyxel','BC:99:11':'Zyxel',
    /* Siemens */
    '00:0E:8C':'Siemens','00:1B:1B':'Siemens','20:87:56':'Siemens',
    /* Schneider */
    '00:80:F4':'Schneider','00:60:34':'Schneider',
    /* ABB */
    '00:0A:DC':'ABB','00:30:11':'ABB',
    /* Moxa */
    '00:90:E8':'Moxa','00:60:2E':'Moxa',
    /* WAGO */
    '00:30:DE':'WAGO',
    /* Beckhoff */
    '00:01:05':'Beckhoff',
    /* Carlo Gavazzi */
    '00:0D:AE':'Carlo Gavazzi',
    /* VMware (часто в мережі) */
    '00:0C:29':'VMware','00:50:56':'VMware','00:05:69':'VMware',
    /* QEMU/KVM */
    '52:54:00':'QEMU/KVM',
    /* Synology NAS */
    '00:11:32':'Synology','BC:5F:F4':'Synology',
    /* QNAP NAS */
    '00:08:9B':'QNAP','24:5E:BE':'QNAP',
    /* Axis cameras */
    '00:40:8C':'AXIS','AC:CC:8E':'AXIS',
    /* Intel */
    'F4:4E:B4':'MediaTek','8C:8D:28':'Intel','18:66:DA':'Intel',
    'AC:ED:5C':'Intel','00:1B:21':'Intel','00:21:6A':'Intel',
    '8C:EC:4B':'Intel','94:65:9C':'Intel','A4:C3:F0':'Intel',
    'D0:57:7B':'Intel','00:1E:67':'Intel','E4:B3:18':'Intel',
    /* Apple */
    'F4:4E:B4':'MediaTek','3C:15:C2':'Apple','A8:86:DD':'Apple',
    '00:17:F2':'Apple','28:CF:DA':'Apple','3C:07:54':'Apple',
    'AC:BC:32':'Apple','F0:18:98':'Apple','DC:A9:04':'Apple',
    '78:4F:43':'Apple','B8:E8:56':'Apple','8C:85:90':'Apple',
    /* Samsung */
    '00:12:47':'Samsung','00:15:99':'Samsung','00:1A:8A':'Samsung',
    '00:21:19':'Samsung','18:22:7E':'Samsung','30:07:4D':'Samsung',
    '4C:BC:98':'Samsung','78:52:1A':'Samsung','94:35:0A':'Samsung',
    'B4:79:A7':'Samsung','CC:07:AB':'Samsung','E4:92:FB':'Samsung',
    /* Xiaomi */
    '00:9E:C8':'Xiaomi','04:CF:8C':'Xiaomi','10:2A:B3':'Xiaomi',
    '14:F6:5A':'Xiaomi','28:6C:07':'Xiaomi','34:80:B3':'Xiaomi',
    '50:8F:4C':'Xiaomi','64:09:80':'Xiaomi','74:23:44':'Xiaomi',
    '8C:BE:BE':'Xiaomi','A4:50:46':'Xiaomi','F8:A4:5F':'Xiaomi',
    /* Dell */
    '00:06:5B':'Dell','00:08:74':'Dell','00:0B:DB':'Dell',
    '00:11:43':'Dell','00:12:3F':'Dell','00:13:72':'Dell',
    '14:18:77':'Dell','18:03:73':'Dell','18:66:DA':'Dell',
    'B8:CA:3A':'Dell','F4:8E:38':'Dell','F8:DB:88':'Dell',
    /* HP */
    '00:0F:20':'HP','00:11:0A':'HP','00:12:79':'HP',
    '00:13:21':'HP','00:14:38':'HP','00:15:60':'HP',
    '3C:A8:2A':'HP','58:20:B1':'HP','78:E7:D1':'HP',
    'B4:99:BA':'HP','D4:85:64':'HP','FC:15:B4':'HP',
    /* Lenovo */
    '00:1A:6B':'Lenovo','00:21:CC':'Lenovo','28:D2:44':'Lenovo',
    '40:8D:5C':'Lenovo','54:EE:75':'Lenovo','70:F3:95':'Lenovo',
    '88:70:8C':'Lenovo','98:FA:9B':'Lenovo','B8:63:4D':'Lenovo',
    /* ASUS */
    '00:1A:92':'ASUS','00:1D:60':'ASUS','00:22:15':'ASUS',
    '08:60:6E':'ASUS','10:02:B5':'ASUS','14:DA:E9':'ASUS',
    '2C:4D:54':'ASUS','40:16:7E':'ASUS','50:46:5D':'ASUS',
    '74:D0:2B':'ASUS','90:E6:BA':'ASUS','AC:22:0B':'ASUS',
    /* Realtek/Common */
    'B2:33:88':'Local/Virtual MAC','A6:45:43':'Local/Virtual MAC',
    'A2:33:88':'Local/Virtual MAC','02:00:00':'Local/Virtual MAC',
    /* D-Link */
    '00:05:5D':'D-Link','00:0D:88':'D-Link','00:11:95':'D-Link',
    '00:1B:11':'D-Link','00:21:91':'D-Link','00:26:5A':'D-Link',
    '1C:7E:E5':'D-Link','28:10:7B':'D-Link','34:08:04':'D-Link',
    /* Netgear */
    '00:09:5B':'Netgear','00:0F:B5':'Netgear','00:14:6C':'Netgear',
    '00:1B:2F':'Netgear','00:1E:2A':'Netgear','00:22:3F':'Netgear',
    '20:4E:7F':'Netgear','28:C6:8E':'Netgear','30:46:9A':'Netgear',
    /* Zyxel */
    '00:13:49':'Zyxel','00:19:CB':'Zyxel','00:A0:C5':'Zyxel',
    '28:28:5D':'Zyxel','40:4A:03':'Zyxel','50:67:F0':'Zyxel',
    /* Synology */
    '00:11:32':'Synology','00:1B:21':'Synology','90:09:D0':'Synology',
    /* QNAP */
    '00:08:9B':'QNAP','24:5E:BE':'QNAP','00:D0:B4':'QNAP',

  },

  /* ── Кеш онлайн запитів ── */
  _cache: {},
  _pending: {},

  /* ── Основна функція lookup ── */
  lookup: function(mac) {
    if (!mac) return 'Unknown';
    var norm = mac.toUpperCase().replace(/-/g, ':').trim();
    /* Перевіряємо локальну адресу (2й біт першого октету) */
    var firstOctet = parseInt(norm.slice(0,2), 16);
    if (firstOctet & 0x02) return 'Local/Virtual MAC';
    /* Перевіряємо кеш */
    if (OUILookup._cache[norm]) return OUILookup._cache[norm];
    /* Локальна база — prefix 8 символів (XX:XX:XX) */
    var p6 = norm.slice(0, 8);
    var local = OUILookup._db[p6];
    if (local) return local;
    return 'Unknown';
  },

  /* ── Онлайн lookup через API ── */
  lookupOnline: function(mac, callback) {
    if (!mac || mac.length < 8) { callback('Unknown'); return; }
    var norm = mac.toUpperCase().replace(/-/g, ':').trim();
    /* Перевіряємо локальну адресу */
    var firstOctet = parseInt(norm.slice(0,2), 16);
    if (firstOctet & 0x02) { callback('Local/Virtual MAC'); return; }
    /* Кеш */
    if (OUILookup._cache[norm]) { callback(OUILookup._cache[norm]); return; }
    /* Локальна база */
    var local = OUILookup.lookup(norm);
    if (local && local !== 'Unknown') { callback(local); return; }
    /* Якщо вже запитуємо */
    if (OUILookup._pending[norm]) {
      OUILookup._pending[norm].push(callback);
      return;
    }
    OUILookup._pending[norm] = [callback];
    /* API запит — macvendors.com (безкоштовний) */
    var prefix = norm.slice(0, 8);
    fetch('https://api.macvendors.com/' + encodeURIComponent(prefix))
      .then(function(r) {
        if (!r.ok) throw new Error('not found');
        return r.text();
      })
      .then(function(vendor) {
        vendor = vendor.trim();
        OUILookup._cache[norm] = vendor;
        /* Зберігаємо в localStorage */
        try {
          var saved = JSON.parse(localStorage.getItem('oui-cache') || '{}');
          saved[norm.slice(0,8)] = vendor;
          localStorage.setItem('oui-cache', JSON.stringify(saved));
        } catch(e) {}
        (OUILookup._pending[norm] || []).forEach(function(cb){ cb(vendor); });
        delete OUILookup._pending[norm];
      })
      .catch(function() {
        OUILookup._cache[norm] = 'Unknown';
        (OUILookup._pending[norm] || []).forEach(function(cb){ cb('Unknown'); });
        delete OUILookup._pending[norm];
      });
  },

  /* ── Завантажуємо кеш з localStorage ── */
  loadCache: function() {
    try {
      var saved = JSON.parse(localStorage.getItem('oui-cache') || '{}');
      Object.assign(OUILookup._cache, saved);
      console.log('[OUI] Завантажено з кешу:', Object.keys(saved).length, 'записів');
    } catch(e) {}
  },

  /* ── Визначаємо тип пристрою ── */
  getDeviceType: function(vendor, openPorts, hostname) {
    var v = (vendor  || '').toLowerCase();
    var h = (hostname|| '').toLowerCase();
    var p = openPorts || [];

    if (v.includes('local/virtual')) return { icon:'💻', type:'Virtual/Local' };
    if (v.includes('mikrotik') || v.includes('routerboard'))
      return { icon:'🔴', type:'MikroTik Router' };
    if (v.includes('ubiquiti') || v.includes('unifi'))
      return { icon:'🔵', type:'Ubiquiti' };
    if (v.includes('cisco') && !v.includes('vmware'))
      return { icon:'🔌', type:'Cisco' };
    if (v.includes('vmware') || v.includes('qemu') || v.includes('virtual'))
      return { icon:'🖥', type:'Virtual Machine' };
    if (v.includes('hp') && !v.includes('huawei'))
      return { icon:'🔌', type:'HP' };
    if (v.includes('tp-link') || v.includes('d-link') ||
        v.includes('netgear') || v.includes('zyxel'))
      return { icon:'🔌', type:'Switch/Router' };
    if (v.includes('hikvision') || v.includes('dahua') ||
        v.includes('axis') || v.includes('reolink') || v.includes('uniview'))
      return { icon:'📷', type:'IP Camera' };
    if (v.includes('sma solar')   || v.includes('goodwe') ||
        v.includes('sungrow')     || v.includes('fronius') ||
        v.includes('victron')     || v.includes('deye') ||
        v.includes('huawei solar')|| v.includes('sofar') ||
        v.includes('growatt'))
      return { icon:'☀️', type:'Інвертор' };
    if (v.includes('waveshare') || v.includes('wiznet'))
      return { icon:'📡', type:'Waveshare/Gateway' };
    if (v.includes('shelly') || v.includes('sonoff') || v.includes('allterco'))
      return { icon:'💡', type:'Smart Home' };
    if (v.includes('espressif') || v.includes('raspberry'))
      return { icon:'🖥', type:'SBC/IoT' };
    if (v.includes('siemens') || v.includes('schneider') ||
        v.includes('abb') || v.includes('wago') ||
        v.includes('beckhoff') || v.includes('moxa') ||
        v.includes('carlo gavazzi'))
      return { icon:'⚙️', type:'Промисловий' };
    if (v.includes('synology') || v.includes('qnap'))
      return { icon:'💾', type:'NAS' };
    if (v.includes('apple'))  return { icon:'🍎', type:'Apple' };
    if (v.includes('samsung') || v.includes('realtek'))
      return { icon:'📱', type:'PC/Mobile' };
    if (v.includes('dell') || v.includes('hp'))
      return { icon:'💻', type:'PC/Server' };
    if (p.includes(502))  return { icon:'⚙️', type:'Modbus' };
    if (p.includes(80) || p.includes(443))
      return { icon:'🌐', type:'Web пристрій' };
    if (v !== 'unknown' && v !== '')
      return { icon:'📦', type:vendor };
    return { icon:'❓', type:'Unknown' };
  },
};

OUILookup.loadCache();
console.log('[OUILookup] Ready ✅ DB:', Object.keys(OUILookup._db).length, 'entries');
