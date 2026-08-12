/* ============================================================
   i18n.js — Мультимовність UI
   UA | EN | PL | DE
   Виправлені ID: btn-dl, btn-validate, btn-strip, btn-ai-gen
   ============================================================ */
'use strict';

var I18N = {
  uk: {
    name: '🇺🇦 UA',
    translations: {
      'btn-save':            '💾 Зберегти налаштування',
      'btn-load':            '📂 Завантажити',
      'btn-reset':           '🔄 Скинути',
      'btn-copy':            'Копіювати скрипт',
      'btn-download':        'Завантажити .rsc',
      'btn-verify':          '🔍 Перевірити',
      'btn-minimize':        '✂️ Мінімізувати',
      'btn-aigen':           'Генерувати (AI)',
      'pre-home':            '🏠 Дім',
      'pre-office':          '🏢 Офіс',
      'pre-lte':             '📶 LTE',
      'btn-install':         '📲 Встановити',
      'btn-key-save':        'Зберегти',
      'btn-key-show':        'Показати',
      'btn-key-test':        'Тест',
      'btn-parse':           'Розібрати офлайн',
      'btn-fill':            'Заповнити форму',
      'btn-explain':         'Пояснити (AI)',
      'btn-diff':            '🔍 Порівняти',
      'btn-diff-clear':      '✖ Очистити',
      'wizard-btn':          '🧙 Майстер',
      'topo-btn':            '🗺️ Топологія',
      'tmpl-btn':            '📚 Шаблони',
      'section-profiles':    'Профілі та налаштування',
      'section-ai':          'AI-генерація команд',
      'section-model':       'Модель роутера',
      'section-general':     'Загальне',
      'section-wan':         'WAN',
      'section-failover':    'Резервний WAN (Failover)',
      'section-lan':         'LAN',
      'section-dns':         'DNS та NAT',
      'section-wifi':        'Wi-Fi',
      'section-capsman':     'CAPsMAN',
      'section-guest':       'Гостьова мережа (VLAN)',
      'section-wg':          'WireGuard VPN',
      'section-ovpn':        'OpenVPN сервер',
      'section-ovpnclient':  'OpenVPN клієнт',
      'section-ipsec':       'IPsec',
      'section-addrlist':    'Address-List',
      'section-routes':      'Статичні маршрути',
      'section-fw':          'Фаєрвол та сервіси',
      'section-ntp':         'NTP та моніторинг',
      'section-custom':      'Власні команди (AI або вручну)',
      'section-diff':        'Diff .rsc файлів',
      'section-rsc':         'Аналіз .rsc файлу',
      'lbl-hostname':        "Ім'я роутера",
      'lbl-timezone':        'Часовий пояс',
      'lbl-wanif':           'WAN-інтерфейс',
      'lbl-wantype':         'Тип підключення',
      'lbl-lanip':           'IP роутера',
      'lbl-lanports':        'LAN-порти (через кому)',
      'lbl-ssid':            'SSID',
      'lbl-password':        'Пароль',
      'lbl-adminpass':       'Новий пароль admin',
      'lbl-netwatchhost':    'Хост перевірки',
      'lbl-netwatchint':     'Інтервал',
      'lbl-aitask':          'Опис задачі',
      'lbl-aicmd':           'Команди RouterOS',
      'chk-backup':          'Резервна копія перед змінами',
      'chk-safetynet':       'Запобіжник від блокування (авто-відкат)',
      'chk-ddns':            'Cloud DDNS',
      'chk-resetconfig':     'Скинути конфіг перед застосуванням',
      'chk-changepass':      'Змінити пароль admin',
      'chk-disableipv6':     'Вимкнути IPv6',
      'chk-ipneighbor':      'Вимкнути IP Neighbor Discovery',
      'chk-firewall':        'Базовий фаєрвол (defconf)',
      'chk-fasttrack':       'Додати правило FastTrack',
      'chk-fasttrackhw':     'hw-offload для FastTrack (лише CRS/switch-chip)',
      'chk-macprotect':      'Захист MAC (Winbox/Telnet тільки з LAN)',
      'chk-disablesvc':      'Вимкнути telnet, ftp, www, api',
      'chk-disablesvcports': 'Вимкнути небезпечні service-ports',
      'chk-ntp':             'NTP-клієнт (pool.ntp.org)',
      'chk-logwandrops':     'Логувати блокування з WAN',
      'chk-netwatch':        'Netwatch',
      'chk-nat':             'NAT (masquerade)',
      'chk-dhcp':            'DHCP-сервер у LAN',
      'chk-dnsprotect':      'Захист DNS від WAN (блок порту 53)',
      'chk-allowremote':     'allow-remote-requests',
      'chk-staticdns':       'Статичні DNS-записи',
      'chk-portfw':          'Port Forwarding (DST-NAT)',
      'chk-wifi':            'Налаштувати Wi-Fi',
      'chk-band24':          '2.4 ГГц',
      'chk-band5':           '5 ГГц',
      'chk-capsman':         'CAPsMAN сервер',
      'chk-guest':           'Ізольована гостьова мережа',
      'chk-guestwifi':       'Окремий гостьовий Wi-Fi',
      'chk-wg':              'WireGuard сервер',
      'chk-ovpn':            'OpenVPN сервер',
      'chk-ovpnclient':      'OpenVPN клієнт',
      'chk-ipsec':           'IPsec тунелі',
      'chk-addrlist':        'Firewall Address-List',
      'chk-routes':          'Статичні маршрути',
      'chk-failover':        'Увімкнути резервний канал',
    }
  },

  en: {
    name: '🇬🇧 EN',
    translations: {
      'btn-save':            '💾 Save settings',
      'btn-load':            '📂 Load',
      'btn-reset':           '🔄 Reset',
      'btn-copy':            'Copy Script',
      'btn-download':        'Download .rsc',
      'btn-verify':          '🔍 Verify',
      'btn-minimize':        '✂️ Minimize',
      'btn-aigen':           'Generate (AI)',
      'pre-home':            '🏠 Home',
      'pre-office':          '🏢 Office',
      'pre-lte':             '📶 LTE',
      'btn-install':         '📲 Install',
      'btn-key-save':        'Save',
      'btn-key-show':        'Show',
      'btn-key-test':        'Test',
      'btn-parse':           'Parse offline',
      'btn-fill':            'Fill form',
      'btn-explain':         'Explain (AI)',
      'btn-diff':            '🔍 Compare',
      'btn-diff-clear':      '✖ Clear',
      'wizard-btn':          '🧙 Wizard',
      'topo-btn':            '🗺️ Topology',
      'tmpl-btn':            '📚 Templates',
      'section-profiles':    'Profiles & Settings',
      'section-ai':          'AI Command Generation',
      'section-model':       'Router Model',
      'section-general':     'General',
      'section-wan':         'WAN',
      'section-failover':    'Backup WAN (Failover)',
      'section-lan':         'LAN',
      'section-dns':         'DNS & NAT',
      'section-wifi':        'Wi-Fi',
      'section-capsman':     'CAPsMAN',
      'section-guest':       'Guest Network (VLAN)',
      'section-wg':          'WireGuard VPN',
      'section-ovpn':        'OpenVPN Server',
      'section-ovpnclient':  'OpenVPN Client',
      'section-ipsec':       'IPsec',
      'section-addrlist':    'Address-List',
      'section-routes':      'Static Routes',
      'section-fw':          'Firewall & Services',
      'section-ntp':         'NTP & Monitoring',
      'section-custom':      'Custom Commands (AI or manual)',
      'section-diff':        'Diff .rsc Files',
      'section-rsc':         '.rsc File Analysis',
      'lbl-hostname':        'Router Name',
      'lbl-timezone':        'Timezone',
      'lbl-wanif':           'WAN Interface',
      'lbl-wantype':         'Connection Type',
      'lbl-lanip':           'Router IP',
      'lbl-lanports':        'LAN Ports (comma separated)',
      'lbl-ssid':            'SSID',
      'lbl-password':        'Password',
      'lbl-adminpass':       'New admin password',
      'lbl-netwatchhost':    'Check Host',
      'lbl-netwatchint':     'Interval',
      'lbl-aitask':          'Task description',
      'lbl-aicmd':           'RouterOS commands',
      'chk-backup':          'Backup before changes',
      'chk-safetynet':       'Anti-lockout (auto-rollback)',
      'chk-ddns':            'Cloud DDNS',
      'chk-resetconfig':     'Reset config before applying',
      'chk-changepass':      'Change admin password',
      'chk-disableipv6':     'Disable IPv6',
      'chk-ipneighbor':      'Disable IP Neighbor Discovery',
      'chk-firewall':        'Basic Firewall (defconf)',
      'chk-fasttrack':       'Add FastTrack rule',
      'chk-fasttrackhw':     'hw-offload for FastTrack (CRS/switch-chip only)',
      'chk-macprotect':      'MAC Protection (Winbox/Telnet LAN only)',
      'chk-disablesvc':      'Disable telnet, ftp, www, api',
      'chk-disablesvcports': 'Disable dangerous service-ports',
      'chk-ntp':             'NTP Client (pool.ntp.org)',
      'chk-logwandrops':     'Log WAN drops',
      'chk-netwatch':        'Netwatch',
      'chk-nat':             'NAT (masquerade)',
      'chk-dhcp':            'DHCP Server in LAN',
      'chk-dnsprotect':      'DNS protection from WAN (block port 53)',
      'chk-allowremote':     'allow-remote-requests',
      'chk-staticdns':       'Static DNS records',
      'chk-portfw':          'Port Forwarding (DST-NAT)',
      'chk-wifi':            'Configure Wi-Fi',
      'chk-band24':          '2.4 GHz',
      'chk-band5':           '5 GHz',
      'chk-capsman':         'CAPsMAN Server',
      'chk-guest':           'Isolated Guest Network',
      'chk-guestwifi':       'Separate Guest Wi-Fi',
      'chk-wg':              'WireGuard Server',
      'chk-ovpn':            'OpenVPN Server',
      'chk-ovpnclient':      'OpenVPN Client',
      'chk-ipsec':           'IPsec Tunnels',
      'chk-addrlist':        'Firewall Address-List',
      'chk-routes':          'Static Routes',
      'chk-failover':        'Enable backup channel',
    }
  },

  pl: {
    name: '🇵🇱 PL',
    translations: {
      'btn-save':            '💾 Zapisz ustawienia',
      'btn-load':            '📂 Wczytaj',
      'btn-reset':           '🔄 Resetuj',
      'btn-copy':            'Kopiuj skrypt',
      'btn-download':        'Pobierz .rsc',
      'btn-verify':          '🔍 Weryfikuj',
      'btn-minimize':        '✂️ Minimalizuj',
      'btn-aigen':           'Generuj (AI)',
      'pre-home':            '🏠 Dom',
      'pre-office':          '🏢 Biuro',
      'pre-lte':             '📶 LTE',
      'btn-install':         '📲 Zainstaluj',
      'btn-key-save':        'Zapisz',
      'btn-key-show':        'Pokaż',
      'btn-key-test':        'Test',
      'btn-parse':           'Analizuj offline',
      'btn-fill':            'Wypełnij formularz',
      'btn-explain':         'Wyjaśnij (AI)',
      'btn-diff':            '🔍 Porównaj',
      'btn-diff-clear':      '✖ Wyczyść',
      'wizard-btn':          '🧙 Kreator',
      'topo-btn':            '🗺️ Topologia',
      'tmpl-btn':            '📚 Szablony',
      'section-profiles':    'Profile i ustawienia',
      'section-ai':          'Generowanie poleceń AI',
      'section-model':       'Model routera',
      'section-general':     'Ogólne',
      'section-wan':         'WAN',
      'section-failover':    'Zapasowy WAN (Failover)',
      'section-lan':         'LAN',
      'section-dns':         'DNS i NAT',
      'section-wifi':        'Wi-Fi',
      'section-capsman':     'CAPsMAN',
      'section-guest':       'Sieć gości (VLAN)',
      'section-wg':          'WireGuard VPN',
      'section-ovpn':        'Serwer OpenVPN',
      'section-ovpnclient':  'Klient OpenVPN',
      'section-ipsec':       'IPsec',
      'section-addrlist':    'Address-List',
      'section-routes':      'Trasy statyczne',
      'section-fw':          'Zapora i usługi',
      'section-ntp':         'NTP i monitoring',
      'section-custom':      'Własne polecenia (AI lub ręcznie)',
      'section-diff':        'Diff plików .rsc',
      'section-rsc':         'Analiza pliku .rsc',
      'lbl-hostname':        'Nazwa routera',
      'lbl-timezone':        'Strefa czasowa',
      'lbl-wanif':           'Interfejs WAN',
      'lbl-wantype':         'Typ połączenia',
      'lbl-lanip':           'IP routera',
      'lbl-lanports':        'Porty LAN (po przecinku)',
      'lbl-ssid':            'SSID',
      'lbl-password':        'Hasło',
      'lbl-adminpass':       'Nowe hasło administratora',
      'lbl-netwatchhost':    'Host sprawdzania',
      'lbl-netwatchint':     'Interwał',
      'lbl-aitask':          'Opis zadania',
      'lbl-aicmd':           'Polecenia RouterOS',
      'chk-backup':          'Kopia zapasowa przed zmianami',
      'chk-safetynet':       'Zabezpieczenie przed blokadą (auto-rollback)',
      'chk-ddns':            'Cloud DDNS',
      'chk-resetconfig':     'Resetuj konfigurację przed zastosowaniem',
      'chk-changepass':      'Zmień hasło administratora',
      'chk-disableipv6':     'Wyłącz IPv6',
      'chk-ipneighbor':      'Wyłącz IP Neighbor Discovery',
      'chk-firewall':        'Podstawowa zapora (defconf)',
      'chk-fasttrack':       'Dodaj regułę FastTrack',
      'chk-fasttrackhw':     'hw-offload dla FastTrack (tylko CRS/switch-chip)',
      'chk-macprotect':      'Ochrona MAC (Winbox/Telnet tylko z LAN)',
      'chk-disablesvc':      'Wyłącz telnet, ftp, www, api',
      'chk-disablesvcports': 'Wyłącz niebezpieczne service-ports',
      'chk-ntp':             'Klient NTP (pool.ntp.org)',
      'chk-logwandrops':     'Loguj blokowania z WAN',
      'chk-netwatch':        'Netwatch',
      'chk-nat':             'NAT (masquerade)',
      'chk-dhcp':            'Serwer DHCP w LAN',
      'chk-dnsprotect':      'Ochrona DNS z WAN (blok portu 53)',
      'chk-allowremote':     'allow-remote-requests',
      'chk-staticdns':       'Statyczne rekordy DNS',
      'chk-portfw':          'Port Forwarding (DST-NAT)',
      'chk-wifi':            'Konfiguruj Wi-Fi',
      'chk-band24':          '2.4 GHz',
      'chk-band5':           '5 GHz',
      'chk-capsman':         'Serwer CAPsMAN',
      'chk-guest':           'Izolowana sieć gości',
      'chk-guestwifi':       'Oddzielne Wi-Fi dla gości',
      'chk-wg':              'Serwer WireGuard',
      'chk-ovpn':            'Serwer OpenVPN',
      'chk-ovpnclient':      'Klient OpenVPN',
      'chk-ipsec':           'Tunele IPsec',
      'chk-addrlist':        'Zapora Address-List',
      'chk-routes':          'Trasy statyczne',
      'chk-failover':        'Włącz kanał zapasowy',
    }
  },

  de: {
    name: '🇩🇪 DE',
    translations: {
      'btn-save':            '💾 Einstellungen speichern',
      'btn-load':            '📂 Laden',
      'btn-reset':           '🔄 Zurücksetzen',
      'btn-copy':            'Skript kopieren',
      'btn-download':        '.rsc herunterladen',
      'btn-verify':          '🔍 Prüfen',
      'btn-minimize':        '✂️ Minimieren',
      'btn-aigen':           'Generieren (KI)',
      'pre-home':            '🏠 Zuhause',
      'pre-office':          '🏢 Büro',
      'pre-lte':             '📶 LTE',
      'btn-install':         '📲 Installieren',
      'btn-key-save':        'Speichern',
      'btn-key-show':        'Anzeigen',
      'btn-key-test':        'Test',
      'btn-parse':           'Offline analysieren',
      'btn-fill':            'Formular ausfüllen',
      'btn-explain':         'Erklären (KI)',
      'btn-diff':            '🔍 Vergleichen',
      'btn-diff-clear':      '✖ Löschen',
      'wizard-btn':          '🧙 Assistent',
      'topo-btn':            '🗺️ Topologie',
      'tmpl-btn':            '📚 Vorlagen',
      'section-profiles':    'Profile & Einstellungen',
      'section-ai':          'KI-Befehlsgenerierung',
      'section-model':       'Router-Modell',
      'section-general':     'Allgemein',
      'section-wan':         'WAN',
      'section-failover':    'Backup WAN (Failover)',
      'section-lan':         'LAN',
      'section-dns':         'DNS & NAT',
      'section-wifi':        'Wi-Fi',
      'section-capsman':     'CAPsMAN',
      'section-guest':       'Gastnetzwerk (VLAN)',
      'section-wg':          'WireGuard VPN',
      'section-ovpn':        'OpenVPN Server',
      'section-ovpnclient':  'OpenVPN Client',
      'section-ipsec':       'IPsec',
      'section-addrlist':    'Address-List',
      'section-routes':      'Statische Routen',
      'section-fw':          'Firewall & Dienste',
      'section-ntp':         'NTP & Überwachung',
      'section-custom':      'Benutzerdefinierte Befehle (KI oder manuell)',
      'section-diff':        'Diff .rsc Dateien',
      'section-rsc':         '.rsc Datei-Analyse',
      'lbl-hostname':        'Router-Name',
      'lbl-timezone':        'Zeitzone',
      'lbl-wanif':           'WAN-Schnittstelle',
      'lbl-wantype':         'Verbindungstyp',
      'lbl-lanip':           'Router IP',
      'lbl-lanports':        'LAN-Ports (kommagetrennt)',
      'lbl-ssid':            'SSID',
      'lbl-password':        'Passwort',
      'lbl-adminpass':       'Neues Admin-Passwort',
      'lbl-netwatchhost':    'Prüf-Host',
      'lbl-netwatchint':     'Intervall',
      'lbl-aitask':          'Aufgabenbeschreibung',
      'lbl-aicmd':           'RouterOS-Befehle',
      'chk-backup':          'Sicherung vor Änderungen',
      'chk-safetynet':       'Aussperrschutz (Auto-Rollback)',
      'chk-ddns':            'Cloud DDNS',
      'chk-resetconfig':     'Konfiguration vor Anwendung zurücksetzen',
      'chk-changepass':      'Admin-Passwort ändern',
      'chk-disableipv6':     'IPv6 deaktivieren',
      'chk-ipneighbor':      'IP Neighbor Discovery deaktivieren',
      'chk-firewall':        'Basis-Firewall (defconf)',
      'chk-fasttrack':       'FastTrack-Regel hinzufügen',
      'chk-fasttrackhw':     'hw-offload für FastTrack (nur CRS/switch-chip)',
      'chk-macprotect':      'MAC-Schutz (Winbox/Telnet nur LAN)',
      'chk-disablesvc':      'Telnet, FTP, WWW, API deaktivieren',
      'chk-disablesvcports': 'Gefährliche Service-Ports deaktivieren',
      'chk-ntp':             'NTP-Client (pool.ntp.org)',
      'chk-logwandrops':     'WAN-Sperren protokollieren',
      'chk-netwatch':        'Netwatch',
      'chk-nat':             'NAT (masquerade)',
      'chk-dhcp':            'DHCP-Server im LAN',
      'chk-dnsprotect':      'DNS-Schutz von WAN (Port 53 sperren)',
      'chk-allowremote':     'allow-remote-requests',
      'chk-staticdns':       'Statische DNS-Einträge',
      'chk-portfw':          'Port Forwarding (DST-NAT)',
      'chk-wifi':            'Wi-Fi konfigurieren',
      'chk-band24':          '2,4 GHz',
      'chk-band5':           '5 GHz',
      'chk-capsman':         'CAPsMAN Server',
      'chk-guest':           'Isoliertes Gastnetzwerk',
      'chk-guestwifi':       'Separates Gast-WLAN',
      'chk-wg':              'WireGuard Server',
      'chk-ovpn':            'OpenVPN Server',
      'chk-ovpnclient':      'OpenVPN Client',
      'chk-ipsec':           'IPsec Tunnel',
      'chk-addrlist':        'Firewall Address-List',
      'chk-routes':          'Statische Routen',
      'chk-failover':        'Backup-Kanal aktivieren',
    }
  }
};

/* ── Поточна мова ── */
var currentLang = localStorage.getItem('mt-lang') || 'uk';

/* ── Отримати переклад ── */
function t(key) {
  var lang = I18N[currentLang] || I18N['uk'];
  return lang.translations[key] || I18N['uk'].translations[key] || key;
}

/* ── Застосувати всі переклади ── */
function applyTranslations() {

  /* ── Кнопки — ПРАВИЛЬНІ ID з index.html ── */
  var btnMap = [
    { id: 'btn-save',        key: 'btn-save' },
    { id: 'btn-reset',       key: 'btn-reset' },
    { id: 'btn-copy',        key: 'btn-copy' },
    { id: 'btn-dl',          key: 'btn-download' },
    { id: 'btn-validate',    key: 'btn-verify' },
    { id: 'btn-strip',       key: 'btn-minimize' },
    { id: 'btn-ai-gen',      key: 'btn-aigen' },
    { id: 'pre-home',        key: 'pre-home' },
    { id: 'pre-office',      key: 'pre-office' },
    { id: 'pre-lte',         key: 'pre-lte' },
    { id: 'pwa-install-btn', key: 'btn-install' },
    { id: 'btn-key-save',    key: 'btn-key-save' },
    { id: 'btn-key-show',    key: 'btn-key-show' },
    { id: 'btn-key-test',    key: 'btn-key-test' },
    { id: 'btn-parse',       key: 'btn-parse' },
    { id: 'btn-fill',        key: 'btn-fill' },
    { id: 'btn-explain',     key: 'btn-explain' },
    { id: 'btn-diff',        key: 'btn-diff' },
    { id: 'btn-diff-clear',  key: 'btn-diff-clear' },
    { id: 'wizard-btn',      key: 'wizard-btn' },
    { id: 'topo-btn',        key: 'topo-btn' },
    { id: 'tmpl-btn',        key: 'tmpl-btn' },
  ];

  btnMap.forEach(function(m) {
    var el = document.getElementById(m.id);
    if (el) el.textContent = t(m.key);
  });

  /* ── Заголовки секцій h2 ── */
  var h2Map = [
    { text: 'Профілі',           key: 'section-profiles' },
    { text: 'AI-генерація',      key: 'section-ai' },
    { text: 'Модель роутера',    key: 'section-model' },
    { text: 'Загальне',          key: 'section-general' },
    { text: 'WAN',               key: 'section-wan' },
    { text: 'Резервний WAN',     key: 'section-failover' },
    { text: 'LAN',               key: 'section-lan' },
    { text: 'DNS та NAT',        key: 'section-dns' },
    { text: 'Wi-Fi',             key: 'section-wifi' },
    { text: 'CAPsMAN',           key: 'section-capsman' },
    { text: 'Гостьова мережа',   key: 'section-guest' },
    { text: 'WireGuard',         key: 'section-wg' },
    { text: 'OpenVPN сервер',    key: 'section-ovpn' },
    { text: 'OpenVPN клієнт',    key: 'section-ovpnclient' },
    { text: 'IPsec',             key: 'section-ipsec' },
    { text: 'Address-List',      key: 'section-addrlist' },
    { text: 'Статичні маршрути', key: 'section-routes' },
    { text: 'Фаєрвол',          key: 'section-fw' },
    { text: 'NTP та моніторинг', key: 'section-ntp' },
    { text: 'Власні команди',    key: 'section-custom' },
    { text: 'Diff',              key: 'section-diff' },
    { text: 'Аналіз .rsc',      key: 'section-rsc' },
  ];

  document.querySelectorAll('h2').forEach(function(h2) {
    h2Map.forEach(function(m) {
      var txt = h2.textContent.trim();
      if (txt.indexOf(m.text.substring(0, 8)) === 0) {
        var badge = h2.querySelector('.badge');
        var badgeHtml = badge ? ' ' + badge.outerHTML : '';
        h2.innerHTML = t(m.key) + badgeHtml;
      }
    });
  });

  /* ── Чекбокс labels ── */
  var chkMap = [
    { id: 'backupenable',     key: 'chk-backup' },
    { id: 'safetynet',        key: 'chk-safetynet' },
    { id: 'ddnsenable',       key: 'chk-ddns' },
    { id: 'resetconfig',      key: 'chk-resetconfig' },
    { id: 'changepass',       key: 'chk-changepass' },
    { id: 'disableipv6',      key: 'chk-disableipv6' },
    { id: 'ipneighbor',       key: 'chk-ipneighbor' },
    { id: 'basicfw',          key: 'chk-firewall' },
    { id: 'fasttrack',        key: 'chk-fasttrack' },
    { id: 'fasttrackhw',      key: 'chk-fasttrackhw' },
    { id: 'macprotect',       key: 'chk-macprotect' },
    { id: 'disableservices',  key: 'chk-disablesvc' },
    { id: 'disablesvcports',  key: 'chk-disablesvcports' },
    { id: 'ntpenable',        key: 'chk-ntp' },
    { id: 'logwandrops',      key: 'chk-logwandrops' },
    { id: 'netwatchenable',   key: 'chk-netwatch' },
    { id: 'natenable',        key: 'chk-nat' },
    { id: 'dhcpenable',       key: 'chk-dhcp' },
    { id: 'dnsprotect',       key: 'chk-dnsprotect' },
    { id: 'allowremote',      key: 'chk-allowremote' },
    { id: 'dnsstaticenable',  key: 'chk-staticdns' },
    { id: 'pfwenable',        key: 'chk-portfw' },
    { id: 'wifienable',       key: 'chk-wifi' },
    { id: 'band24',           key: 'chk-band24' },
    { id: 'band5',            key: 'chk-band5' },
    { id: 'capsmanenable',    key: 'chk-capsman' },
    { id: 'guestenable',      key: 'chk-guest' },
    { id: 'guestwifi',        key: 'chk-guestwifi' },
    { id: 'wgenable',         key: 'chk-wg' },
    { id: 'ovpnenable',       key: 'chk-ovpn' },
    { id: 'ovpnclenable',     key: 'chk-ovpnclient' },
    { id: 'ipsecenable',      key: 'chk-ipsec' },
    { id: 'addrlistenable',   key: 'chk-addrlist' },
    { id: 'routesenable',     key: 'chk-routes' },
    { id: 'foenable',         key: 'chk-failover' },
  ];

  chkMap.forEach(function(m) {
    var label = document.querySelector('label[for="' + m.id + '"]');
    if (label) label.textContent = t(m.key);
  });

  /* ── Labels для input полів ── */
  var lblMap = [
    { id: 'hostname',         key: 'lbl-hostname' },
    { id: 'timezone',         key: 'lbl-timezone' },
    { id: 'adminpass',        key: 'lbl-adminpass' },
    { id: 'wanif',            key: 'lbl-wanif' },
    { id: 'wantype',          key: 'lbl-wantype' },
    { id: 'lanip',            key: 'lbl-lanip' },
    { id: 'lanports',         key: 'lbl-lanports' },
    { id: 'ssid',             key: 'lbl-ssid' },
    { id: 'wifipass',         key: 'lbl-password' },
    { id: 'netwatchhost',     key: 'lbl-netwatchhost' },
    { id: 'netwatchinterval', key: 'lbl-netwatchint' },
    { id: 'aitask',           key: 'lbl-aitask' },
    { id: 'aicmd',            key: 'lbl-aicmd' },
  ];

  lblMap.forEach(function(m) {
    var input = document.getElementById(m.id);
    if (!input) return;
    var parent = input.parentNode;
    var label = parent ? parent.querySelector('label') : null;
    if (!label && parent && parent.parentNode) {
      label = parent.parentNode.querySelector('label');
    }
    if (label) label.textContent = t(m.key);
  });

  localStorage.setItem('mt-lang', currentLang);
}

/* ── Перемикач мов ── */
function createLangSwitcher() {
  if (document.getElementById('lang-switcher')) return;

  var switcher = document.createElement('div');
  switcher.id = 'lang-switcher';
  switcher.style.cssText = [
    'position:fixed', 'top:12px', 'right:16px',
    'display:flex', 'gap:4px', 'z-index:9997',
    'background:rgba(15,23,32,.92)',
    'border:1px solid #2a3b48',
    'border-radius:8px', 'padding:4px',
    'backdrop-filter:blur(4px)'
  ].join(';');

  Object.keys(I18N).forEach(function(langCode) {
    var btn = document.createElement('button');
    btn.textContent = I18N[langCode].name;
    btn.title = langCode.toUpperCase();
    btn.style.cssText = [
      'font-size:11px', 'padding:3px 8px',
      'border-radius:5px', 'border:none',
      'cursor:pointer', 'transition:all .15s',
      'font-weight:600'
    ].join(';');

    function updateStyle() {
      if (currentLang === langCode) {
        btn.style.background = '#5fd0a5';
        btn.style.color = '#082018';
      } else {
        btn.style.background = 'transparent';
        btn.style.color = '#8ea3b0';
      }
    }
    updateStyle();

    btn.addEventListener('click', function() {
      currentLang = langCode;
      switcher.querySelectorAll('button').forEach(function(b) {
        b.style.background = 'transparent';
        b.style.color = '#8ea3b0';
      });
      btn.style.background = '#5fd0a5';
      btn.style.color = '#082018';
      applyTranslations();
    });

    switcher.appendChild(btn);
  });

  document.body.appendChild(switcher);
}

/* ── Ініціалізація ── */
function i18nInit() {
  createLangSwitcher();
  var saved = localStorage.getItem('mt-lang');
  if (saved && I18N[saved]) currentLang = saved;
  setTimeout(applyTranslations, 400);
  console.log('[i18n] ready | мов: ' + Object.keys(I18N).length);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', i18nInit);
} else {
  i18nInit();
}
