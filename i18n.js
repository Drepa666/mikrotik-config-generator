/* ============================================================
   i18n.js — Мультимовність UI (повна версія з фіксом f-load)
   UA | EN | PL | DE
   ============================================================ */
'use strict';

var I18N = {
  uk: {
    name: '🇺🇦 UA',
    t: {
      'btn-save':            '💾 Зберегти налаштування',
      'btn-reset':           '🔄 Скинути',
      'btn-copy':            'Копіювати скрипт',
      'btn-dl':              'Завантажити .rsc',
      'btn-validate':        '🔍 Перевірити',
      'btn-strip':           '✂️ Мінімізувати',
      'btn-ai-gen':          'Генерувати (AI)',
      'btn-key-save':        'Зберегти',
      'btn-key-show':        'Показати',
      'btn-key-test':        'Тест',
      'btn-parse':           'Розібрати офлайн',
      'btn-fill':            'Заповнити форму',
      'btn-explain':         'Пояснити (AI)',
      'btn-diff':            '🔍 Порівняти',
      'btn-diff-clear':      '✖ Очистити',
      'pre-home':            '🏠 Дім',
      'pre-office':          '🏢 Офіс',
      'pre-lte':             '📶 LTE',
      'pwa-install-btn':     '📲 Встановити',
      'f-load':              '📂 Завантажити',
      'wizard-btn':          '🧙 Майстер',
      'topo-btn':            '🗺️ Топологія',
      'tmpl-btn':            '📚 Шаблони',
      'exp-rsc':             '⬇️ .rsc (RouterOS)',
      'exp-txt':             '📄 .txt з поясненнями',
      'exp-json':            '📋 JSON профіль',
      'exp-ansible':         '🤖 Ansible Playbook',
      'exp-terraform':       '🏗️ Terraform',
      'sec-score-toggle':    'Деталі',
      'h2-profiles':         'Профілі та налаштування',
      'h2-ai':               'AI-генерація команд',
      'h2-model':            'Модель роутера',
      'h2-general':          'Загальне',
      'h2-wan':              'WAN',
      'h2-failover':         'Резервний WAN (Failover)',
      'h2-lan':              'LAN',
      'h2-dns':              'DNS та NAT',
      'h2-staticdns':        'Static DNS',
      'h2-portfw':           'Port Forwarding',
      'h2-wifi':             'Wi-Fi',
      'h2-capsman':          'CAPsMAN',
      'h2-guest':            'Гостьова мережа (VLAN)',
      'h2-wg':               'WireGuard VPN',
      'h2-ovpn':             'OpenVPN сервер',
      'h2-ovpnclient':       'OpenVPN клієнт',
      'h2-ipsec':            'IPsec',
      'h2-addrlist':         'Address-List',
      'h2-routes':           'Статичні маршрути',
      'h2-fw':               'Фаєрвол та сервіси',
      'h2-ntp':              'NTP та моніторинг',
      'h2-custom':           'Власні команди (AI або вручну)',
      'h2-rsc':              'Аналіз .rsc файлу',
      'h2-diff':             'Diff .rsc файлів',
      'warn-passwords':      '⚠️ Файл налаштувань і згенерований .rsc можуть містити паролі у відкритому вигляді — зберігай їх безпечно.',
      'warn-apikey':         '⚠️ API-ключ не експортується разом із профілем і не зберігається у localStorage. У браузері ключ все одно доступний через DevTools — використовуй лише довірений пристрій.',
      'warn-reset':          '⚠️ Reset перезавантажує роутер. Команда генерується окремо на початку файлу — запускай її лише вручну та окремо від основного сценарію.',
      'warn-netwatch':       '⚠️ Якщо Failover та Netwatch перевіряють один хост — будуть створені два записи Netwatch. Краще використовувати різні хости.',
      'warn-aicmd':          '⚠️ AI-команди не проходять автоматичну перевірку безпеки. Переглянь їх перед імпортом.',
      'chk-backupenable':    'Резервна копія перед змінами',
      'chk-safetynet':       'Запобіжник від блокування (авто-відкат)',
      'chk-ddnsenable':      'Cloud DDNS',
      'chk-resetconfig':     'Скинути конфіг перед застосуванням',
      'chk-changepass':      'Змінити пароль admin',
      'chk-disableipv6':     'Вимкнути IPv6',
      'chk-ipneighbor':      'Вимкнути IP Neighbor Discovery',
      'chk-basicfw':         'Базовий фаєрвол (defconf)',
      'chk-fasttrack':       'Додати правило FastTrack',
      'chk-fasttrackhw':     'hw-offload для FastTrack (лише CRS/switch-chip)',
      'chk-macprotect':      'Захист MAC (Winbox/Telnet тільки з LAN)',
      'chk-disableservices': 'Вимкнути telnet, ftp, www, api',
      'chk-disablesvcports': 'Вимкнути небезпечні service-ports',
      'chk-ntpenable':       'NTP-клієнт (pool.ntp.org)',
      'chk-logwandrops':     'Логувати блокування з WAN',
      'chk-netwatchenable':  'Netwatch',
      'chk-natenable':       'NAT (masquerade)',
      'chk-dhcpenable':      'DHCP-сервер у LAN',
      'chk-dnsprotect':      'Захист DNS від WAN (блок порту 53)',
      'chk-allowremote':     'allow-remote-requests',
      'chk-dnsstaticenable': 'Статичні DNS-записи',
      'chk-pfwenable':       'Port Forwarding (DST-NAT)',
      'chk-wifienable':      'Налаштувати Wi-Fi',
      'chk-band24':          '2.4 ГГц',
      'chk-band5':           '5 ГГц',
      'chk-capsmanenable':   'CAPsMAN сервер',
      'chk-guestenable':     'Ізольована гостьова мережа',
      'chk-guestwifi':       'Окремий гостьовий Wi-Fi',
      'chk-wgenable':        'WireGuard сервер',
      'chk-ovpnenable':      'OpenVPN сервер',
      'chk-ovpnclenable':    'OpenVPN клієнт',
      'chk-ovpnreqcert':     'Вимагати клієнтський сертифікат',
      'chk-ipsecenable':     'IPsec тунелі',
      'chk-addrlistenable':  'Firewall Address-List',
      'chk-routesenable':    'Статичні маршрути',
      'chk-foenable':        'Увімкнути резервний канал',
    }
  },

  en: {
    name: '🇬🇧 EN',
    t: {
      'btn-save':            '💾 Save settings',
      'btn-reset':           '🔄 Reset',
      'btn-copy':            'Copy Script',
      'btn-dl':              'Download .rsc',
      'btn-validate':        '🔍 Verify',
      'btn-strip':           '✂️ Minimize',
      'btn-ai-gen':          'Generate (AI)',
      'btn-key-save':        'Save',
      'btn-key-show':        'Show',
      'btn-key-test':        'Test',
      'btn-parse':           'Parse offline',
      'btn-fill':            'Fill form',
      'btn-explain':         'Explain (AI)',
      'btn-diff':            '🔍 Compare',
      'btn-diff-clear':      '✖ Clear',
      'pre-home':            '🏠 Home',
      'pre-office':          '🏢 Office',
      'pre-lte':             '📶 LTE',
      'pwa-install-btn':     '📲 Install',
      'f-load':              '📂 Load',
      'wizard-btn':          '🧙 Wizard',
      'topo-btn':            '🗺️ Topology',
      'tmpl-btn':            '📚 Templates',
      'exp-rsc':             '⬇️ .rsc (RouterOS)',
      'exp-txt':             '📄 .txt with explanations',
      'exp-json':            '📋 JSON profile',
      'exp-ansible':         '🤖 Ansible Playbook',
      'exp-terraform':       '🏗️ Terraform',
      'sec-score-toggle':    'Details',
      'h2-profiles':         'Profiles & Settings',
      'h2-ai':               'AI Command Generation',
      'h2-model':            'Router Model',
      'h2-general':          'General',
      'h2-wan':              'WAN',
      'h2-failover':         'Backup WAN (Failover)',
      'h2-lan':              'LAN',
      'h2-dns':              'DNS & NAT',
      'h2-staticdns':        'Static DNS',
      'h2-portfw':           'Port Forwarding',
      'h2-wifi':             'Wi-Fi',
      'h2-capsman':          'CAPsMAN',
      'h2-guest':            'Guest Network (VLAN)',
      'h2-wg':               'WireGuard VPN',
      'h2-ovpn':             'OpenVPN Server',
      'h2-ovpnclient':       'OpenVPN Client',
      'h2-ipsec':            'IPsec',
      'h2-addrlist':         'Address-List',
      'h2-routes':           'Static Routes',
      'h2-fw':               'Firewall & Services',
      'h2-ntp':              'NTP & Monitoring',
      'h2-custom':           'Custom Commands (AI or manual)',
      'h2-rsc':              '.rsc File Analysis',
      'h2-diff':             'Diff .rsc Files',
      'warn-passwords':      '⚠️ Settings file and generated .rsc may contain passwords in plain text — store them securely.',
      'warn-apikey':         '⚠️ API key is not exported with the profile and is not stored in localStorage. The key is still accessible via DevTools — use only trusted devices.',
      'warn-reset':          '⚠️ Reset reboots the router. The command is generated separately at the start of the file — run it manually and separately from the main script.',
      'warn-netwatch':       '⚠️ If Failover and Netwatch check the same host — two Netwatch entries will be created. Better to use different hosts.',
      'warn-aicmd':          '⚠️ AI commands do not pass automatic security checks. Review them before importing.',
      'chk-backupenable':    'Backup before changes',
      'chk-safetynet':       'Anti-lockout (auto-rollback)',
      'chk-ddnsenable':      'Cloud DDNS',
      'chk-resetconfig':     'Reset config before applying',
      'chk-changepass':      'Change admin password',
      'chk-disableipv6':     'Disable IPv6',
      'chk-ipneighbor':      'Disable IP Neighbor Discovery',
      'chk-basicfw':         'Basic Firewall (defconf)',
      'chk-fasttrack':       'Add FastTrack rule',
      'chk-fasttrackhw':     'hw-offload for FastTrack (CRS/switch-chip only)',
      'chk-macprotect':      'MAC Protection (Winbox/Telnet LAN only)',
      'chk-disableservices': 'Disable telnet, ftp, www, api',
      'chk-disablesvcports': 'Disable dangerous service-ports',
      'chk-ntpenable':       'NTP Client (pool.ntp.org)',
      'chk-logwandrops':     'Log WAN drops',
      'chk-netwatchenable':  'Netwatch',
      'chk-natenable':       'NAT (masquerade)',
      'chk-dhcpenable':      'DHCP Server in LAN',
      'chk-dnsprotect':      'DNS protection from WAN (block port 53)',
      'chk-allowremote':     'allow-remote-requests',
      'chk-dnsstaticenable': 'Static DNS records',
      'chk-pfwenable':       'Port Forwarding (DST-NAT)',
      'chk-wifienable':      'Configure Wi-Fi',
      'chk-band24':          '2.4 GHz',
      'chk-band5':           '5 GHz',
      'chk-capsmanenable':   'CAPsMAN Server',
      'chk-guestenable':     'Isolated Guest Network',
      'chk-guestwifi':       'Separate Guest Wi-Fi',
      'chk-wgenable':        'WireGuard Server',
      'chk-ovpnenable':      'OpenVPN Server',
      'chk-ovpnclenable':    'OpenVPN Client',
      'chk-ovpnreqcert':     'Require client certificate',
      'chk-ipsecenable':     'IPsec Tunnels',
      'chk-addrlistenable':  'Firewall Address-List',
      'chk-routesenable':    'Static Routes',
      'chk-foenable':        'Enable backup channel',
    }
  },

  pl: {
    name: '🇵🇱 PL',
    t: {
      'btn-save':            '💾 Zapisz ustawienia',
      'btn-reset':           '🔄 Resetuj',
      'btn-copy':            'Kopiuj skrypt',
      'btn-dl':              'Pobierz .rsc',
      'btn-validate':        '🔍 Weryfikuj',
      'btn-strip':           '✂️ Minimalizuj',
      'btn-ai-gen':          'Generuj (AI)',
      'btn-key-save':        'Zapisz',
      'btn-key-show':        'Pokaż',
      'btn-key-test':        'Test',
      'btn-parse':           'Analizuj offline',
      'btn-fill':            'Wypełnij formularz',
      'btn-explain':         'Wyjaśnij (AI)',
      'btn-diff':            '🔍 Porównaj',
      'btn-diff-clear':      '✖ Wyczyść',
      'pre-home':            '🏠 Dom',
      'pre-office':          '🏢 Biuro',
      'pre-lte':             '📶 LTE',
      'pwa-install-btn':     '📲 Zainstaluj',
      'f-load':              '📂 Wczytaj',
      'wizard-btn':          '🧙 Kreator',
      'topo-btn':            '🗺️ Topologia',
      'tmpl-btn':            '📚 Szablony',
      'exp-rsc':             '⬇️ .rsc (RouterOS)',
      'exp-txt':             '📄 .txt z objaśnieniami',
      'exp-json':            '📋 Profil JSON',
      'exp-ansible':         '🤖 Ansible Playbook',
      'exp-terraform':       '🏗️ Terraform',
      'sec-score-toggle':    'Szczegóły',
      'h2-profiles':         'Profile i ustawienia',
      'h2-ai':               'Generowanie poleceń AI',
      'h2-model':            'Model routera',
      'h2-general':          'Ogólne',
      'h2-wan':              'WAN',
      'h2-failover':         'Zapasowy WAN (Failover)',
      'h2-lan':              'LAN',
      'h2-dns':              'DNS i NAT',
      'h2-staticdns':        'Statyczny DNS',
      'h2-portfw':           'Przekierowanie portów',
      'h2-wifi':             'Wi-Fi',
      'h2-capsman':          'CAPsMAN',
      'h2-guest':            'Sieć gości (VLAN)',
      'h2-wg':               'WireGuard VPN',
      'h2-ovpn':             'Serwer OpenVPN',
      'h2-ovpnclient':       'Klient OpenVPN',
      'h2-ipsec':            'IPsec',
      'h2-addrlist':         'Address-List',
      'h2-routes':           'Trasy statyczne',
      'h2-fw':               'Zapora i usługi',
      'h2-ntp':              'NTP i monitoring',
      'h2-custom':           'Własne polecenia (AI lub ręcznie)',
      'h2-rsc':              'Analiza pliku .rsc',
      'h2-diff':             'Diff plików .rsc',
      'warn-passwords':      '⚠️ Plik ustawień i wygenerowany .rsc mogą zawierać hasła w postaci jawnej — przechowuj je bezpiecznie.',
      'warn-apikey':         '⚠️ Klucz API nie jest eksportowany z profilem i nie jest przechowywany w localStorage. Klucz jest nadal dostępny przez DevTools — używaj tylko zaufanych urządzeń.',
      'warn-reset':          '⚠️ Reset restartuje router. Polecenie jest generowane oddzielnie na początku pliku — uruchamiaj je tylko ręcznie i oddzielnie od głównego skryptu.',
      'warn-netwatch':       '⚠️ Jeśli Failover i Netwatch sprawdzają ten sam host — zostaną utworzone dwa wpisy Netwatch. Lepiej używać różnych hostów.',
      'warn-aicmd':          '⚠️ Polecenia AI nie przechodzą automatycznej weryfikacji bezpieczeństwa. Przejrzyj je przed importem.',
      'chk-backupenable':    'Kopia zapasowa przed zmianami',
      'chk-safetynet':       'Zabezpieczenie przed blokadą (auto-rollback)',
      'chk-ddnsenable':      'Cloud DDNS',
      'chk-resetconfig':     'Resetuj konfigurację przed zastosowaniem',
      'chk-changepass':      'Zmień hasło administratora',
      'chk-disableipv6':     'Wyłącz IPv6',
      'chk-ipneighbor':      'Wyłącz IP Neighbor Discovery',
      'chk-basicfw':         'Podstawowa zapora (defconf)',
      'chk-fasttrack':       'Dodaj regułę FastTrack',
      'chk-fasttrackhw':     'hw-offload dla FastTrack (tylko CRS/switch-chip)',
      'chk-macprotect':      'Ochrona MAC (Winbox/Telnet tylko z LAN)',
      'chk-disableservices': 'Wyłącz telnet, ftp, www, api',
      'chk-disablesvcports': 'Wyłącz niebezpieczne service-ports',
      'chk-ntpenable':       'Klient NTP (pool.ntp.org)',
      'chk-logwandrops':     'Loguj blokowania z WAN',
      'chk-netwatchenable':  'Netwatch',
      'chk-natenable':       'NAT (masquerade)',
      'chk-dhcpenable':      'Serwer DHCP w LAN',
      'chk-dnsprotect':      'Ochrona DNS z WAN (blok portu 53)',
      'chk-allowremote':     'allow-remote-requests',
      'chk-dnsstaticenable': 'Statyczne rekordy DNS',
      'chk-pfwenable':       'Przekierowanie portów (DST-NAT)',
      'chk-wifienable':      'Konfiguruj Wi-Fi',
      'chk-band24':          '2.4 GHz',
      'chk-band5':           '5 GHz',
      'chk-capsmanenable':   'Serwer CAPsMAN',
      'chk-guestenable':     'Izolowana sieć gości',
      'chk-guestwifi':       'Oddzielne Wi-Fi dla gości',
      'chk-wgenable':        'Serwer WireGuard',
      'chk-ovpnenable':      'Serwer OpenVPN',
      'chk-ovpnclenable':    'Klient OpenVPN',
      'chk-ovpnreqcert':     'Wymagaj certyfikatu klienta',
      'chk-ipsecenable':     'Tunele IPsec',
      'chk-addrlistenable':  'Zapora Address-List',
      'chk-routesenable':    'Trasy statyczne',
      'chk-foenable':        'Włącz kanał zapasowy',
    }
  },

  de: {
    name: '🇩🇪 DE',
    t: {
      'btn-save':            '💾 Einstellungen speichern',
      'btn-reset':           '🔄 Zurücksetzen',
      'btn-copy':            'Skript kopieren',
      'btn-dl':              '.rsc herunterladen',
      'btn-validate':        '🔍 Prüfen',
      'btn-strip':           '✂️ Minimieren',
      'btn-ai-gen':          'Generieren (KI)',
      'btn-key-save':        'Speichern',
      'btn-key-show':        'Anzeigen',
      'btn-key-test':        'Test',
      'btn-parse':           'Offline analysieren',
      'btn-fill':            'Formular ausfüllen',
      'btn-explain':         'Erklären (KI)',
      'btn-diff':            '🔍 Vergleichen',
      'btn-diff-clear':      '✖ Löschen',
      'pre-home':            '🏠 Zuhause',
      'pre-office':          '🏢 Büro',
      'pre-lte':             '📶 LTE',
      'pwa-install-btn':     '📲 Installieren',
      'f-load':              '📂 Laden',
      'wizard-btn':          '🧙 Assistent',
      'topo-btn':            '🗺️ Topologie',
      'tmpl-btn':            '📚 Vorlagen',
      'exp-rsc':             '⬇️ .rsc (RouterOS)',
      'exp-txt':             '📄 .txt mit Erklärungen',
      'exp-json':            '📋 JSON-Profil',
      'exp-ansible':         '🤖 Ansible Playbook',
      'exp-terraform':       '🏗️ Terraform',
      'sec-score-toggle':    'Details',
      'h2-profiles':         'Profile & Einstellungen',
      'h2-ai':               'KI-Befehlsgenerierung',
      'h2-model':            'Router-Modell',
      'h2-general':          'Allgemein',
      'h2-wan':              'WAN',
      'h2-failover':         'Backup WAN (Failover)',
      'h2-lan':              'LAN',
      'h2-dns':              'DNS & NAT',
      'h2-staticdns':        'Statisches DNS',
      'h2-portfw':           'Portweiterleitung',
      'h2-wifi':             'Wi-Fi',
      'h2-capsman':          'CAPsMAN',
      'h2-guest':            'Gastnetzwerk (VLAN)',
      'h2-wg':               'WireGuard VPN',
      'h2-ovpn':             'OpenVPN Server',
      'h2-ovpnclient':       'OpenVPN Client',
      'h2-ipsec':            'IPsec',
      'h2-addrlist':         'Address-List',
      'h2-routes':           'Statische Routen',
      'h2-fw':               'Firewall & Dienste',
      'h2-ntp':              'NTP & Überwachung',
      'h2-custom':           'Benutzerdefinierte Befehle (KI oder manuell)',
      'h2-rsc':              '.rsc Datei-Analyse',
      'h2-diff':             'Diff .rsc Dateien',
      'warn-passwords':      '⚠️ Die Einstellungsdatei und die generierte .rsc können Passwörter im Klartext enthalten — bewahre sie sicher auf.',
      'warn-apikey':         '⚠️ Der API-Schlüssel wird nicht mit dem Profil exportiert und nicht in localStorage gespeichert. Der Schlüssel ist über DevTools zugänglich — verwende nur vertrauenswürdige Geräte.',
      'warn-reset':          '⚠️ Reset startet den Router neu. Der Befehl wird separat am Anfang der Datei generiert — führe ihn nur manuell und getrennt vom Hauptskript aus.',
      'warn-netwatch':       '⚠️ Wenn Failover und Netwatch denselben Host prüfen — werden zwei Netwatch-Einträge erstellt. Besser verschiedene Hosts verwenden.',
      'warn-aicmd':          '⚠️ KI-Befehle durchlaufen keine automatische Sicherheitsprüfung. Überprüfe sie vor dem Import.',
      'chk-backupenable':    'Sicherung vor Änderungen',
      'chk-safetynet':       'Aussperrschutz (Auto-Rollback)',
      'chk-ddnsenable':      'Cloud DDNS',
      'chk-resetconfig':     'Konfiguration vor Anwendung zurücksetzen',
      'chk-changepass':      'Admin-Passwort ändern',
      'chk-disableipv6':     'IPv6 deaktivieren',
      'chk-ipneighbor':      'IP Neighbor Discovery deaktivieren',
      'chk-basicfw':         'Basis-Firewall (defconf)',
      'chk-fasttrack':       'FastTrack-Regel hinzufügen',
      'chk-fasttrackhw':     'hw-offload für FastTrack (nur CRS/switch-chip)',
      'chk-macprotect':      'MAC-Schutz (Winbox/Telnet nur LAN)',
      'chk-disableservices': 'Telnet, FTP, WWW, API deaktivieren',
      'chk-disablesvcports': 'Gefährliche Service-Ports deaktivieren',
      'chk-ntpenable':       'NTP-Client (pool.ntp.org)',
      'chk-logwandrops':     'WAN-Sperren protokollieren',
      'chk-netwatchenable':  'Netwatch',
      'chk-natenable':       'NAT (masquerade)',
      'chk-dhcpenable':      'DHCP-Server im LAN',
      'chk-dnsprotect':      'DNS-Schutz von WAN (Port 53 sperren)',
      'chk-allowremote':     'allow-remote-requests',
      'chk-dnsstaticenable': 'Statische DNS-Einträge',
      'chk-pfwenable':       'Portweiterleitung (DST-NAT)',
      'chk-wifienable':      'Wi-Fi konfigurieren',
      'chk-band24':          '2,4 GHz',
      'chk-band5':           '5 GHz',
      'chk-capsmanenable':   'CAPsMAN Server',
      'chk-guestenable':     'Isoliertes Gastnetzwerk',
      'chk-guestwifi':       'Separates Gast-WLAN',
      'chk-wgenable':        'WireGuard Server',
      'chk-ovpnenable':      'OpenVPN Server',
      'chk-ovpnclenable':    'OpenVPN Client',
      'chk-ovpnreqcert':     'Client-Zertifikat erforderlich',
      'chk-ipsecenable':     'IPsec Tunnel',
      'chk-addrlistenable':  'Firewall Address-List',
      'chk-routesenable':    'Statische Routen',
      'chk-foenable':        'Backup-Kanal aktivieren',
    }
  }
};

/* ══════════════════════════════════════════════
   Ядро
══════════════════════════════════════════════ */
var _lang = localStorage.getItem('mt-lang') || 'uk';

function tr(key) {
  var d = I18N[_lang] || I18N['uk'];
  return d.t[key] || I18N['uk'].t[key] || key;
}

/* ── Маппінг h2 по UA-тексту → ключ ── */
var H2_MAP = [
  ['Профілі та налаштування',        'h2-profiles'],
  ['AI-генерація команд',            'h2-ai'],
  ['Модель роутера',                 'h2-model'],
  ['Загальне',                       'h2-general'],
  ['Резервний WAN',                  'h2-failover'],
  ['DNS та NAT',                     'h2-dns'],
  ['Static DNS',                     'h2-staticdns'],
  ['Port Forwarding',                'h2-portfw'],
  ['Гостьова мережа',                'h2-guest'],
  ['WireGuard VPN',                  'h2-wg'],
  ['OpenVPN сервер',                 'h2-ovpn'],
  ['OpenVPN клієнт',                 'h2-ovpnclient'],
  ['Address-List',                   'h2-addrlist'],
  ['Статичні маршрути',              'h2-routes'],
  ['Фаєрвол та сервіси',            'h2-fw'],
  ['NTP та моніторинг',              'h2-ntp'],
  ['Власні команди',                 'h2-custom'],
  ['Аналіз .rsc файлу',             'h2-rsc'],
  ['Diff .rsc файлів',               'h2-diff'],
  ['WAN',                            'h2-wan'],
  ['LAN',                            'h2-lan'],
  ['Wi-Fi',                          'h2-wifi'],
  ['CAPsMAN',                        'h2-capsman'],
  ['IPsec',                          'h2-ipsec'],
];

/* ── Маппінг warnings по частині UA-тексту → ключ ── */
var WARN_MAP = [
  ['Файл налаштувань',           'warn-passwords'],
  ['API-ключ не експортується',  'warn-apikey'],
  ['Reset перезавантажує',       'warn-reset'],
  ['Failover та Netwatch',       'warn-netwatch'],
  ['AI-команди не проходять',    'warn-aicmd'],
];

/* ── Тегування — ОДИН РАЗ ── */
var _tagged = false;
function tagOnce() {
  if (_tagged) return;
  _tagged = true;

  /* h2 */
  document.querySelectorAll('h2').forEach(function(el) {
    if (el.dataset.i18n) return;
    var txt = el.textContent.trim();
    for (var i = 0; i < H2_MAP.length; i++) {
      if (txt.indexOf(H2_MAP[i][0]) === 0) {
        el.dataset.i18n = H2_MAP[i][1];
        break;
      }
    }
  });

  /* Warnings — div.hint та p */
  document.querySelectorAll('.hint, p').forEach(function(el) {
    if (el.dataset.i18n) return;
    if (el.children.length > 1) return;
    var txt = el.textContent.trim();
    for (var i = 0; i < WARN_MAP.length; i++) {
      if (txt.indexOf(WARN_MAP[i][0]) !== -1) {
        el.dataset.i18n = WARN_MAP[i][1];
        break;
      }
    }
  });

  console.log('[i18n] tagged:', document.querySelectorAll('[data-i18n]').length);
}

/* ══════════════════════════════════════════════
   Застосування перекладів
══════════════════════════════════════════════ */
function applyAll() {

  /* 1. Теговані елементи (h2 + warnings) */
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.dataset.i18n;
    var val = tr(key);
    if (!val || val === key) return;
    if (el.tagName === 'H2') {
      var badge = el.querySelector('.badge');
      var bHtml = badge ? ' ' + badge.outerHTML : '';
      el.innerHTML = val + bHtml;
    } else {
      el.textContent = val;
    }
  });

  /* 2. Кнопки за ID */
  [
    'btn-save','btn-reset','btn-copy','btn-dl',
    'btn-validate','btn-strip','btn-ai-gen',
    'btn-key-save','btn-key-show','btn-key-test',
    'btn-parse','btn-fill','btn-explain',
    'btn-diff','btn-diff-clear',
    'pre-home','pre-office','pre-lte',
    'pwa-install-btn',
    'wizard-btn','topo-btn','tmpl-btn',
    'exp-rsc','exp-txt','exp-json','exp-ansible','exp-terraform',
    'sec-score-toggle',
  ].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.textContent = tr(id);
  });

  /* 3. Кнопка "Завантажити" = label[for="f-load"] */
  var fload = document.querySelector('label[for="f-load"]');
  if (fload) fload.textContent = tr('f-load');

  /* 4. Чекбокс labels за for= */
  var CHK = {
    'backupenable':    'chk-backupenable',
    'safetynet':       'chk-safetynet',
    'ddnsenable':      'chk-ddnsenable',
    'resetconfig':     'chk-resetconfig',
    'changepass':      'chk-changepass',
    'disableipv6':     'chk-disableipv6',
    'ipneighbor':      'chk-ipneighbor',
    'basicfw':         'chk-basicfw',
    'fasttrack':       'chk-fasttrack',
    'fasttrackhw':     'chk-fasttrackhw',
    'macprotect':      'chk-macprotect',
    'disableservices': 'chk-disableservices',
    'disablesvcports': 'chk-disablesvcports',
    'ntpenable':       'chk-ntpenable',
    'logwandrops':     'chk-logwandrops',
    'netwatchenable':  'chk-netwatchenable',
    'natenable':       'chk-natenable',
    'dhcpenable':      'chk-dhcpenable',
    'dnsprotect':      'chk-dnsprotect',
    'allowremote':     'chk-allowremote',
    'dnsstaticenable': 'chk-dnsstaticenable',
    'pfwenable':       'chk-pfwenable',
    'wifienable':      'chk-wifienable',
    'band24':          'chk-band24',
    'band5':           'chk-band5',
    'capsmanenable':   'chk-capsmanenable',
    'guestenable':     'chk-guestenable',
    'guestwifi':       'chk-guestwifi',
    'wgenable':        'chk-wgenable',
    'ovpnenable':      'chk-ovpnenable',
    'ovpnclenable':    'chk-ovpnclenable',
    'ovpnreqcert':     'chk-ovpnreqcert',
    'ipsecenable':     'chk-ipsecenable',
    'addrlistenable':  'chk-addrlistenable',
    'routesenable':    'chk-routesenable',
    'foenable':        'chk-foenable',
  };
  Object.keys(CHK).forEach(function(id) {
    var lbl = document.querySelector('label[for="' + id + '"]');
    if (lbl) lbl.textContent = tr(CHK[id]);
  });

  localStorage.setItem('mt-lang', _lang);
}

/* ══════════════════════════════════════════════
   Перемикач мов
══════════════════════════════════════════════ */
function createSwitcher() {
  if (document.getElementById('lang-switcher')) return;

  var sw = document.createElement('div');
  sw.id = 'lang-switcher';
  sw.style.cssText = [
    'position:fixed','top:12px','right:16px',
    'display:flex','gap:4px','z-index:9997',
    'background:rgba(15,23,32,.92)',
    'border:1px solid #2a3b48',
    'border-radius:8px','padding:4px',
    'backdrop-filter:blur(4px)',
  ].join(';');

  Object.keys(I18N).forEach(function(code) {
    var btn = document.createElement('button');
    btn.textContent = I18N[code].name;
    btn.style.cssText = [
      'font-size:11px','padding:3px 8px',
      'border-radius:5px','border:none',
      'cursor:pointer','font-weight:600',
      'transition:all .15s',
    ].join(';');

    function upd() {
      btn.style.background = _lang === code ? '#5fd0a5' : 'transparent';
      btn.style.color      = _lang === code ? '#082018' : '#8ea3b0';
    }
    upd();

    btn.addEventListener('click', function() {
      _lang = code;
      sw.querySelectorAll('button').forEach(function(b) {
        b.style.background = 'transparent';
        b.style.color = '#8ea3b0';
      });
      btn.style.background = '#5fd0a5';
      btn.style.color = '#082018';
      applyAll();
    });

    sw.appendChild(btn);
  });

  document.body.appendChild(sw);
}

/* ══════════════════════════════════════════════
   Старт
══════════════════════════════════════════════ */
function i18nInit() {
  var saved = localStorage.getItem('mt-lang');
  if (saved && I18N[saved]) _lang = saved;

  createSwitcher();

  /* Тегуємо поки DOM ще в UA */
  tagOnce();

  /* Якщо не UA — застосовуємо одразу */
  if (_lang !== 'uk') {
    setTimeout(applyAll, 500);
  }

  console.log('[i18n] ready | мов: ' + Object.keys(I18N).length);
}
/* ══════════════════════════════════════════════
   Переклади для згенерованого .rsc скрипту
   Використовується з core.js через window.i18nScript()
══════════════════════════════════════════════ */
window.i18nScript = function(key) {
  var MAP = {
    uk: {
      'generated-by':   'Скрипт згенеровано MikroTik Config Generator',
      'check-before':   'Перевір команди та зроби export перед імпортом у production.',
      'model-label':    'Модель',
      'checklist':      'Чек-лист безпеки',
      'chk-adminpass':  'Пароль admin змінено',
      'chk-fw':         'Базовий firewall',
      'chk-mac':        'MAC-захист',
      'chk-dns':        'Захист DNS із WAN',
      'chk-svc':        'Небезпечні сервіси вимкнено',
      'chk-ipv6':       'IPv6 вимкнено',
      'chk-neighbor':   'IP Neighbor Discovery вимкнено',
      'chk-ddns':       'Cloud DDNS увімкнено',
      'sec-backup':     'Резервна копія',
      'sec-safety':     'Запобіжник (авто-відкат через',
      'sec-safety2':    'хв — видали scheduler після перевірки)',
      'sec-general':    'Загальне',
      'sec-wan':        'WAN',
      'sec-wan-dhcp':   'WAN: DHCP-клієнт',
      'sec-wan-static': 'WAN: Статична IP',
      'sec-wan-pppoe':  'WAN: PPPoE',
      'sec-wan-lte':    'WAN: LTE',
      'sec-failover':   'Резервний WAN (Failover)',
      'sec-lan':        'LAN',
      'sec-dns':        'DNS та NAT',
      'sec-staticdns':  'Static DNS',
      'sec-portfw':     'Port Forwarding',
      'sec-wifi':       'Wi-Fi',
      'sec-capsman':    'CAPsMAN',
      'sec-guest':      'Гостьова мережа (VLAN)',
      'sec-wg':         'WireGuard VPN',
      'sec-ovpn':       'OpenVPN сервер',
      'sec-ovpnclient': 'OpenVPN клієнт',
      'sec-ipsec':      'IPsec',
      'sec-addrlist':   'Address-List',
      'sec-routes':     'Статичні маршрути',
      'sec-fw':         'Фаєрвол та сервіси',
      'sec-ntp':        'NTP',
      'sec-netwatch':   'Netwatch',
      'sec-custom':     'Власні команди',
      'sec-ipv6-off':   'Вимкнути IPv6',
      'sec-neighbor':   'IP Neighbor Discovery',
      'chk-notdone':    '[ ] ',
      'chk-done':       '[x] ',
    },
    en: {
      'generated-by':   'Script generated by MikroTik Config Generator',
      'check-before':   'Review commands and do export before importing to production.',
      'model-label':    'Model',
      'checklist':      'Security checklist',
      'chk-adminpass':  'Admin password changed',
      'chk-fw':         'Basic firewall',
      'chk-mac':        'MAC protection',
      'chk-dns':        'DNS protection from WAN',
      'chk-svc':        'Dangerous services disabled',
      'chk-ipv6':       'IPv6 disabled',
      'chk-neighbor':   'IP Neighbor Discovery disabled',
      'chk-ddns':       'Cloud DDNS enabled',
      'sec-backup':     'Backup',
      'sec-safety':     'Safety net (auto-rollback in',
      'sec-safety2':    'min — remove scheduler after check)',
      'sec-general':    'General',
      'sec-wan':        'WAN',
      'sec-wan-dhcp':   'WAN: DHCP client',
      'sec-wan-static': 'WAN: Static IP',
      'sec-wan-pppoe':  'WAN: PPPoE',
      'sec-wan-lte':    'WAN: LTE',
      'sec-failover':   'Backup WAN (Failover)',
      'sec-lan':        'LAN',
      'sec-dns':        'DNS & NAT',
      'sec-staticdns':  'Static DNS',
      'sec-portfw':     'Port Forwarding',
      'sec-wifi':       'Wi-Fi',
      'sec-capsman':    'CAPsMAN',
      'sec-guest':      'Guest Network (VLAN)',
      'sec-wg':         'WireGuard VPN',
      'sec-ovpn':       'OpenVPN Server',
      'sec-ovpnclient': 'OpenVPN Client',
      'sec-ipsec':      'IPsec',
      'sec-addrlist':   'Address-List',
      'sec-routes':     'Static Routes',
      'sec-fw':         'Firewall & Services',
      'sec-ntp':        'NTP',
      'sec-netwatch':   'Netwatch',
      'sec-custom':     'Custom Commands',
      'sec-ipv6-off':   'Disable IPv6',
      'sec-neighbor':   'IP Neighbor Discovery',
      'chk-notdone':    '[ ] ',
      'chk-done':       '[x] ',
    },
    pl: {
      'generated-by':   'Skrypt wygenerowany przez MikroTik Config Generator',
      'check-before':   'Sprawdź polecenia i zrób export przed importem do produkcji.',
      'model-label':    'Model',
      'checklist':      'Lista kontrolna bezpieczeństwa',
      'chk-adminpass':  'Hasło administratora zmienione',
      'chk-fw':         'Podstawowa zapora',
      'chk-mac':        'Ochrona MAC',
      'chk-dns':        'Ochrona DNS z WAN',
      'chk-svc':        'Niebezpieczne usługi wyłączone',
      'chk-ipv6':       'IPv6 wyłączone',
      'chk-neighbor':   'IP Neighbor Discovery wyłączone',
      'chk-ddns':       'Cloud DDNS włączone',
      'sec-backup':     'Kopia zapasowa',
      'sec-safety':     'Zabezpieczenie (auto-rollback za',
      'sec-safety2':    'min — usuń scheduler po sprawdzeniu)',
      'sec-general':    'Ogólne',
      'sec-wan':        'WAN',
      'sec-wan-dhcp':   'WAN: Klient DHCP',
      'sec-wan-static': 'WAN: Statyczny IP',
      'sec-wan-pppoe':  'WAN: PPPoE',
      'sec-wan-lte':    'WAN: LTE',
      'sec-failover':   'Zapasowy WAN (Failover)',
      'sec-lan':        'LAN',
      'sec-dns':        'DNS i NAT',
      'sec-staticdns':  'Statyczny DNS',
      'sec-portfw':     'Przekierowanie portów',
      'sec-wifi':       'Wi-Fi',
      'sec-capsman':    'CAPsMAN',
      'sec-guest':      'Sieć gości (VLAN)',
      'sec-wg':         'WireGuard VPN',
      'sec-ovpn':       'Serwer OpenVPN',
      'sec-ovpnclient': 'Klient OpenVPN',
      'sec-ipsec':      'IPsec',
      'sec-addrlist':   'Address-List',
      'sec-routes':     'Trasy statyczne',
      'sec-fw':         'Zapora i usługi',
      'sec-ntp':        'NTP',
      'sec-netwatch':   'Netwatch',
      'sec-custom':     'Własne polecenia',
      'sec-ipv6-off':   'Wyłącz IPv6',
      'sec-neighbor':   'IP Neighbor Discovery',
      'chk-notdone':    '[ ] ',
      'chk-done':       '[x] ',
    },
    de: {
      'generated-by':   'Skript generiert von MikroTik Config Generator',
      'check-before':   'Befehle prüfen und Export machen vor dem Import in Produktion.',
      'model-label':    'Modell',
      'checklist':      'Sicherheits-Checkliste',
      'chk-adminpass':  'Admin-Passwort geändert',
      'chk-fw':         'Basis-Firewall',
      'chk-mac':        'MAC-Schutz',
      'chk-dns':        'DNS-Schutz von WAN',
      'chk-svc':        'Gefährliche Dienste deaktiviert',
      'chk-ipv6':       'IPv6 deaktiviert',
      'chk-neighbor':   'IP Neighbor Discovery deaktiviert',
      'chk-ddns':       'Cloud DDNS aktiviert',
      'sec-backup':     'Sicherung',
      'sec-safety':     'Sicherheitsnetz (Auto-Rollback in',
      'sec-safety2':    'Min — Scheduler nach Prüfung löschen)',
      'sec-general':    'Allgemein',
      'sec-wan':        'WAN',
      'sec-wan-dhcp':   'WAN: DHCP-Client',
      'sec-wan-static': 'WAN: Statische IP',
      'sec-wan-pppoe':  'WAN: PPPoE',
      'sec-wan-lte':    'WAN: LTE',
      'sec-failover':   'Backup WAN (Failover)',
      'sec-lan':        'LAN',
      'sec-dns':        'DNS & NAT',
      'sec-staticdns':  'Statisches DNS',
      'sec-portfw':     'Portweiterleitung',
      'sec-wifi':       'Wi-Fi',
      'sec-capsman':    'CAPsMAN',
      'sec-guest':      'Gastnetzwerk (VLAN)',
      'sec-wg':         'WireGuard VPN',
      'sec-ovpn':       'OpenVPN Server',
      'sec-ovpnclient': 'OpenVPN Client',
      'sec-ipsec':      'IPsec',
      'sec-addrlist':   'Address-List',
      'sec-routes':     'Statische Routen',
      'sec-fw':         'Firewall & Dienste',
      'sec-ntp':        'NTP',
      'sec-netwatch':   'Netwatch',
      'sec-custom':     'Benutzerdefinierte Befehle',
      'sec-ipv6-off':   'IPv6 deaktivieren',
      'sec-neighbor':   'IP Neighbor Discovery',
      'chk-notdone':    '[ ] ',
      'chk-done':       '[x] ',
    },
  };
  var lang = MAP[_lang] || MAP['uk'];
  return lang[key] || MAP['uk'][key] || key;
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', i18nInit);
} else {
  i18nInit();
}