/* ============================================================
   export.js — Додаткові формати експорту конфігурації
   .txt з коментарями | Ansible | Terraform
   ============================================================ */
'use strict';

/* ── Читаємо дані з форми ── */
function expGetVal(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : '';
}
function expChk(id) {
  var el = document.getElementById(id);
  return el ? el.checked : false;
}
function expGetScript() {
  var out = document.getElementById('output');
  return out ? (out.textContent || out.innerText || '') : '';
}

/* ── Toast ── */
function expToast(msg) {
  var t = document.getElementById('exp-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'exp-toast';
    t.style.cssText = [
      'position:fixed', 'bottom:68px', 'right:24px',
      'background:#5fd0a5', 'color:#082018',
      'padding:8px 18px', 'border-radius:8px',
      'font-size:13px', 'font-weight:700',
      'z-index:99999', 'opacity:0',
      'transition:opacity .25s'
    ].join(';');
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._h);
  t._h = setTimeout(function() { t.style.opacity = '0'; }, 3000);
}

/* ── Скачати файл ── */
function expDownload(filename, content, mime) {
  var blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(function() {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 1000);
}

/* ============================================================
   [1] .txt з детальними коментарями
   ============================================================ */
function exportTxt() {
  var script = expGetScript();
  if (!script.trim()) {
    expToast('⚠️ Спочатку згенеруйте конфігурацію!');
    return;
  }

  var hostname  = expGetVal('hostname') || 'MikroTik-Router';
  var model     = expGetVal('routermodel') || 'hAP ac lite';
  var firmware  = expGetVal('firmware') || '7.13+';
  var wanIf     = expGetVal('wanif') || 'ether1';
  var wanType   = expGetVal('wantype') || 'dhcp';
  var lanIp     = expGetVal('lanip') || '192.168.88.1/24';
  var now       = new Date().toLocaleString('uk-UA');

  var lines = [];

  lines.push('================================================================================');
  lines.push('  MikroTik RouterOS Configuration');
  lines.push('  Згенеровано: MikroTik Config Generator');
  lines.push('================================================================================');
  lines.push('');
  lines.push('ПАРАМЕТРИ КОНФІГУРАЦІЇ:');
  lines.push('  Роутер:    ' + hostname);
  lines.push('  Модель:    ' + model);
  lines.push('  RouterOS:  ' + firmware);
  lines.push('  WAN:       ' + wanIf + ' (' + wanType.toUpperCase() + ')');
  lines.push('  LAN IP:    ' + lanIp);
  lines.push('  Дата:      ' + now);
  lines.push('');
  lines.push('ІНСТРУКЦІЯ:');
  lines.push('  1. Відкрийте Winbox або підключіться через SSH');
  lines.push('  2. Перейдіть у New Terminal');
  lines.push('  3. Скопіюйте та вставте скрипт нижче');
  lines.push('  4. Або завантажте .rsc та імпортуйте:');
  lines.push('     /import file-name=config.rsc');
  lines.push('');
  lines.push('  ⚠️  УВАГА: Перевірте команди перед застосуванням!');
  lines.push('  ⚠️  Зробіть резервну копію: /system backup save');
  lines.push('');
  lines.push('================================================================================');
  lines.push('  СКРИПТ RouterOS:');
  lines.push('================================================================================');
  lines.push('');

  /* Додаємо пояснення до кожної секції */
  var scriptLines = script.split('\n');
  scriptLines.forEach(function(line) {
    /* Секція — додаємо пояснення */
    if (line.indexOf('# --- Interface Lists ---') !== -1) {
      lines.push('');
      lines.push('# [Крок 1] Створення списків інтерфейсів WAN та LAN');
      lines.push('# Це потрібно для правил Firewall та NAT');
    } else if (line.indexOf('# --- LAN ---') !== -1) {
      lines.push('');
      lines.push('# [Крок 2] Налаштування LAN (міст та IP адреса роутера)');
    } else if (line.indexOf('# --- WAN:') !== -1) {
      lines.push('');
      lines.push('# [Крок 3] Налаштування WAN підключення до Інтернету');
    } else if (line.indexOf('# --- DHCP LAN ---') !== -1) {
      lines.push('');
      lines.push('# [Крок 4] DHCP сервер — автоматична видача IP клієнтам');
    } else if (line.indexOf('# --- DNS ---') !== -1) {
      lines.push('');
      lines.push('# [Крок 5] DNS налаштування для роутера та клієнтів');
    } else if (line.indexOf('# --- NAT ---') !== -1) {
      lines.push('');
      lines.push('# [Крок 6] NAT masquerade — дозволяє виходити в Інтернет');
    } else if (line.indexOf('# --- Firewall') !== -1) {
      lines.push('');
      lines.push('# [Крок 7] Firewall — захист від атак ззовні');
      lines.push('# defconf: стандартна конфігурація MikroTik');
    } else if (line.indexOf('# --- WireGuard') !== -1) {
      lines.push('');
      lines.push('# [Крок 8] WireGuard VPN — захищений тунель');
      lines.push('# Після імпорту: /interface wireguard print (публічний ключ)');
    } else if (line.indexOf('# --- OpenVPN') !== -1) {
      lines.push('');
      lines.push('# [Крок 9] OpenVPN сервер');
      lines.push('# Потребує сертифікатів — генерація займає ~30 секунд');
    } else if (line.indexOf('# --- IPsec') !== -1) {
      lines.push('');
      lines.push('# [Крок 10] IPsec тунелі між роутерами');
    } else if (line.indexOf('# --- NTP ---') !== -1) {
      lines.push('');
      lines.push('# [Крок 11] NTP — синхронізація часу з Інтернетом');
    }
    lines.push(line);
  });

  lines.push('');
  lines.push('================================================================================');
  lines.push('  ПІСЛЯ НАЛАШТУВАННЯ ПЕРЕВІРТЕ:');
  lines.push('================================================================================');
  lines.push('');
  lines.push('  /ip address print          — IP адреси');
  lines.push('  /ip route print            — маршрути');
  lines.push('  /ip firewall filter print  — правила firewall');
  lines.push('  /ip dhcp-server print      — DHCP сервер');
  lines.push('  /ip dns print              — DNS налаштування');
  lines.push('  /system identity print     — ім\'я роутера');
  lines.push('  /system clock print        — час та часовий пояс');
  if (expChk('wgenable')) {
    lines.push('  /interface wireguard print — WireGuard (публічний ключ)');
  }
  if (expChk('ovpnenable')) {
    lines.push('  /certificate print         — сертифікати OpenVPN');
  }
  lines.push('');
  lines.push('  Ping тест: /ping 8.8.8.8 count=4');
  lines.push('');
  lines.push('================================================================================');
  lines.push('  Згенеровано: MikroTik Config Generator');
  lines.push('  https://drepa666.github.io/mikrotik-config-generator');
  lines.push('================================================================================');

  var content = lines.join('\n');
  expDownload(hostname + '-config-explained.txt', content, 'text/plain;charset=utf-8');
  expToast('✓ .txt з коментарями завантажено!');
}

/* ============================================================
   [2] Ansible Playbook
   ============================================================ */
function exportAnsible() {
  var script = expGetScript();
  if (!script.trim()) {
    expToast('⚠️ Спочатку згенеруйте конфігурацію!');
    return;
  }

  var hostname = expGetVal('hostname') || 'MikroTik-Router';
  var lanIp    = (expGetVal('lanip') || '192.168.88.1/24').split('/')[0];
  var now      = new Date().toLocaleString('uk-UA');

  /* Розбиваємо скрипт на секції */
  var scriptLines = script.split('\n')
    .filter(function(l) { return l.trim() && !l.startsWith('#'); });

  var tasks = [];
  scriptLines.forEach(function(line) {
    var l = line.trim();
    if (!l) return;
    /* Формуємо Ansible task для кожної команди */
    tasks.push(
      '    - name: "' + l.replace(/"/g, "'").substring(0, 60) + '"\n' +
      '      community.routeros.command:\n' +
      '        commands:\n' +
      '          - "' + l.replace(/"/g, '\\"') + '"'
    );
  });

  var yml = [
    '---',
    '# ============================================================',
    '# Ansible Playbook — MikroTik RouterOS Configuration',
    '# Згенеровано: ' + now,
    '# Роутер: ' + hostname,
    '# ============================================================',
    '# Вимоги:',
    '#   pip install ansible',
    '#   ansible-galaxy collection install community.routeros',
    '# Запуск:',
    '#   ansible-playbook mikrotik-config.yml -i hosts.ini',
    '# ============================================================',
    '',
    '- name: Configure MikroTik Router — ' + hostname,
    '  hosts: mikrotik',
    '  gather_facts: false',
    '  vars:',
    '    ansible_connection: network_cli',
    '    ansible_network_os: routeros',
    '    ansible_user: admin',
    '    ansible_password: "{{ vault_mikrotik_password }}"',
    '    ansible_ssh_common_args: "-o StrictHostKeyChecking=no"',
    '',
    '  tasks:',
    '',
    '    - name: Ping роутер перед налаштуванням',
    '      community.routeros.command:',
    '        commands:',
    '          - "/ping 8.8.8.8 count=1"',
    '      register: ping_result',
    '      ignore_errors: true',
    '',
  ].join('\n');

  yml += tasks.join('\n\n') + '\n';

  yml += [
    '',
    '    - name: Перевірка після налаштування',
    '      community.routeros.command:',
    '        commands:',
    '          - "/ip address print"',
    '          - "/ip route print"',
    '          - "/ip firewall filter print"',
    '      register: verify_result',
    '',
    '    - name: Вивести результат перевірки',
    '      debug:',
    '        var: verify_result.stdout_lines',
    '',
    '# ============================================================',
    '# hosts.ini (приклад):',
    '# [mikrotik]',
    '# ' + lanIp + ' ansible_user=admin',
    '# ============================================================',
  ].join('\n');

  expDownload(hostname + '-ansible-playbook.yml', yml, 'text/yaml;charset=utf-8');
  expToast('✓ Ansible Playbook завантажено!');
}

/* ============================================================
   [3] Terraform config
   ============================================================ */
function exportTerraform() {
  var script = expGetScript();
  if (!script.trim()) {
    expToast('⚠️ Спочатку згенеруйте конфігурацію!');
    return;
  }

  var hostname  = expGetVal('hostname') || 'MikroTik-Router';
  var lanIp     = (expGetVal('lanip') || '192.168.88.1/24').split('/')[0];
  var wanIf     = expGetVal('wanif') || 'ether1';
  var lanPorts  = expGetVal('lanports') || 'ether2,ether3,ether4,ether5';
  var wanType   = expGetVal('wantype') || 'dhcp';
  var dhcpRange = expGetVal('dhcprange') || '192.168.88.10-192.168.88.254';
  var ssid      = expGetVal('ssid') || '';
  var now       = new Date().toLocaleString('uk-UA');

  var tf = [
    '# ============================================================',
    '# Terraform — MikroTik RouterOS Provider',
    '# Згенеровано: ' + now,
    '# Роутер: ' + hostname,
    '# ============================================================',
    '# Вимоги:',
    '#   terraform init',
    '#   terraform plan',
    '#   terraform apply',
    '# ============================================================',
    '',
    'terraform {',
    '  required_providers {',
    '    routeros = {',
    '      source  = "terraform-routeros/routeros"',
    '      version = "~> 1.0"',
    '    }',
    '  }',
    '}',
    '',
    'provider "routeros" {',
    '  hosturl  = "https://' + lanIp + '"',
    '  username = "admin"',
    '  password = var.mikrotik_password',
    '  insecure = true',
    '}',
    '',
    'variable "mikrotik_password" {',
    '  description = "MikroTik admin password"',
    '  type        = string',
    '  sensitive   = true',
    '}',
    '',
    '# ── System Identity ──',
    'resource "routeros_system_identity" "main" {',
    '  name = "' + hostname + '"',
    '}',
    '',
    '# ── Interface Lists ──',
    'resource "routeros_interface_list" "wan" {',
    '  name = "WAN"',
    '}',
    '',
    'resource "routeros_interface_list" "lan" {',
    '  name = "LAN"',
    '}',
    '',
    'resource "routeros_interface_list_member" "wan_member" {',
    '  list      = routeros_interface_list.wan.name',
    '  interface = "' + wanIf + '"',
    '}',
    '',
    '# ── Bridge LAN ──',
    'resource "routeros_interface_bridge" "lan" {',
    '  name          = "bridge-lan"',
    '  protocol_mode = "rstp"',
    '}',
    '',
  ].join('\n');

  /* Порти LAN */
  lanPorts.split(',').forEach(function(port, i) {
    port = port.trim();
    tf += [
      'resource "routeros_interface_bridge_port" "port_' + (i+1) + '" {',
      '  bridge    = routeros_interface_bridge.lan.name',
      '  interface = "' + port + '"',
      '}',
      '',
    ].join('\n');
  });

  tf += [
    '# ── LAN IP ──',
    'resource "routeros_ip_address" "lan" {',
    '  address   = "' + expGetVal('lanip') + '"',
    '  interface = routeros_interface_bridge.lan.name',
    '}',
    '',
  ].join('\n');

  /* WAN */
  if (wanType === 'dhcp') {
    tf += [
      '# ── WAN DHCP ──',
      'resource "routeros_ip_dhcp_client" "wan" {',
      '  interface        = "' + wanIf + '"',
      '  add_default_route = true',
      '  disabled         = false',
      '}',
      '',
    ].join('\n');
  } else if (wanType === 'static') {
    tf += [
      '# ── WAN Static ──',
      'resource "routeros_ip_address" "wan" {',
      '  address   = "' + expGetVal('wanip') + '"',
      '  interface = "' + wanIf + '"',
      '}',
      '',
      'resource "routeros_ip_route" "default" {',
      '  dst_address = "0.0.0.0/0"',
      '  gateway     = "' + expGetVal('wangw') + '"',
      '  distance    = 1',
      '}',
      '',
    ].join('\n');
  }

  /* DHCP Server */
  if (expChk('dhcpenable')) {
    tf += [
      '# ── DHCP Server ──',
      'resource "routeros_ip_pool" "dhcp" {',
      '  name   = "dhcp-pool"',
      '  ranges = ["' + dhcpRange + '"]',
      '}',
      '',
      'resource "routeros_ip_dhcp_server" "lan" {',
      '  name         = "dhcp-lan"',
      '  interface    = routeros_interface_bridge.lan.name',
      '  address_pool = routeros_ip_pool.dhcp.name',
      '  lease_time   = "1d"',
      '  disabled     = false',
      '}',
      '',
    ].join('\n');
  }

  /* DNS */
  tf += [
    '# ── DNS ──',
    'resource "routeros_ip_dns" "main" {',
    '  servers              = "' + (expGetVal('upstreamdns') || '1.1.1.1,8.8.8.8') + '"',
    '  allow_remote_requests = ' + (expChk('allowremote') ? 'true' : 'false'),
    '}',
    '',
  ].join('\n');

  /* NAT */
  if (expChk('natenable')) {
    tf += [
      '# ── NAT ──',
      'resource "routeros_ip_firewall_nat" "masquerade" {',
      '  chain              = "srcnat"',
      '  action             = "masquerade"',
      '  out_interface_list = "WAN"',
      '  ipsec_policy       = "out,none"',
      '  comment            = "defconf: masquerade"',
      '}',
      '',
    ].join('\n');
  }

  /* Wi-Fi */
  if (expChk('wifienable') && ssid) {
    tf += [
      '# ── Wi-Fi ──',
      '# resource "routeros_interface_wireless" "wlan1" {',
      '#   name             = "wlan1"',
      '#   mode             = "ap-bridge"',
      '#   ssid             = "' + ssid + '"',
      '#   band             = "2ghz-b/g/n"',
      '# }',
      '# Примітка: Wi-Fi конфігурація залежить від моделі роутера.',
      '',
    ].join('\n');
  }

  tf += [
    '# ── Outputs ──',
    'output "router_ip" {',
    '  value = "' + lanIp + '"',
    '}',
    '',
    'output "router_name" {',
    '  value = routeros_system_identity.main.name',
    '}',
    '',
    '# ============================================================',
    '# Запуск:',
    '#   export TF_VAR_mikrotik_password="your-password"',
    '#   terraform init',
    '#   terraform plan',
    '#   terraform apply',
    '# ============================================================',
  ].join('\n');

  expDownload(hostname + '-terraform.tf', tf, 'text/plain;charset=utf-8');
  expToast('✓ Terraform config завантажено!');
}

/* ============================================================
   [4] JSON профіль з усіма налаштуваннями
   ============================================================ */
function exportJsonFull() {
  var hostname = expGetVal('hostname') || 'MikroTik-Router';
  var now      = new Date().toISOString();

  var profile = {
    meta: {
      generator:   'MikroTik Config Generator',
      version:     '1.0',
      created:     now,
      router:      hostname,
    },
    general: {
      hostname:    expGetVal('hostname'),
      timezone:    expGetVal('timezone'),
      firmware:    expGetVal('firmware'),
      model:       expGetVal('routermodel'),
      backup:      expChk('backupenable'),
      safetynet:   expChk('safetynet'),
      ddns:        expChk('ddnsenable'),
      changepass:  expChk('changepass'),
      disableipv6: expChk('disableipv6'),
    },
    wan: {
      interface:   expGetVal('wanif'),
      type:        expGetVal('wantype'),
      ip:          expGetVal('wanip'),
      gateway:     expGetVal('wangw'),
      pppoeuser:   expGetVal('pppoeuser'),
      lteapn:      expGetVal('lteapn'),
    },
    lan: {
      ip:          expGetVal('lanip'),
      ports:       expGetVal('lanports'),
      dhcp:        expChk('dhcpenable'),
      dhcprange:   expGetVal('dhcprange'),
    },
    dns: {
      upstream:    expGetVal('upstreamdns'),
      allowremote: expChk('allowremote'),
      protect:     expChk('dnsprotect'),
      nat:         expChk('natenable'),
    },
    wifi: {
      enabled:     expChk('wifienable'),
      ssid:        expGetVal('ssid'),
      band24:      expChk('band24'),
      band5:       expChk('band5'),
    },
    security: {
      firewall:    expChk('basicfw'),
      fasttrack:   expChk('fasttrack'),
      macprotect:  expChk('macprotect'),
      disablesvc:  expChk('disableservices'),
      ntp:         expChk('ntpenable'),
    },
    vpn: {
      wireguard:   expChk('wgenable'),
      openvpn:     expChk('ovpnenable'),
      ipsec:       expChk('ipsecenable'),
    },
    guest: {
      enabled:     expChk('guestenable'),
      vlan:        expGetVal('guestvlan'),
      ip:          expGetVal('guestip'),
    },
  };

  var json = JSON.stringify(profile, null, 2);
  expDownload(hostname + '-profile-full.json', json, 'application/json;charset=utf-8');
  expToast('✓ JSON профіль завантажено!');
}

/* ============================================================
   Кнопка та панель Export
   ============================================================ */
function expInit() {
  /* CSS */
  var style = document.createElement('style');
  style.textContent = [
    '#exp-panel{',
      'background:#16212c;',
      'border:1px solid #2a3b48;',
      'border-radius:10px;',
      'padding:14px 16px;',
      'margin-bottom:12px;',
    '}',
    '#exp-panel h3{',
      'font-size:13px;font-weight:700;',
      'color:#5fd0a5;margin-bottom:10px;',
    '}',
    '.exp-btns{display:flex;flex-wrap:wrap;gap:6px}',
    '.exp-btn{',
      'font-size:12px;padding:6px 14px;',
      'border-radius:6px;border:1px solid #2a3b48;',
      'background:#16212c;color:#8ea3b0;',
      'cursor:pointer;transition:all .15s;',
    '}',
    '.exp-btn:hover{background:#2a3b48;color:#e6edf3}',
    '.exp-btn.primary{',
      'background:#5fd0a5;color:#082018;',
      'border-color:#5fd0a5;font-weight:700;',
    '}',
    '.exp-btn.primary:hover{background:#4db891}',
  ].join('\n');
  document.head.appendChild(style);

  /* Вставляємо панель перед #output */
  var out = document.getElementById('output');
  if (!out || !out.parentNode) return;

  var panel = document.createElement('div');
  panel.id = 'exp-panel';
  panel.innerHTML =
    '<h3>📤 Експорт конфігурації</h3>' +
    '<div class="exp-btns">' +
      '<button class="exp-btn primary" id="exp-rsc">⬇️ .rsc (RouterOS)</button>' +
      '<button class="exp-btn" id="exp-txt">📄 .txt з поясненнями</button>' +
      '<button class="exp-btn" id="exp-json">📋 JSON профіль</button>' +
      '<button class="exp-btn" id="exp-ansible">🤖 Ansible Playbook</button>' +
      '<button class="exp-btn" id="exp-terraform">🏗️ Terraform</button>' +
    '</div>';

  out.parentNode.insertBefore(panel, out);

  /* Bind events */
  document.getElementById('exp-txt').addEventListener('click', exportTxt);
  document.getElementById('exp-json').addEventListener('click', exportJsonFull);
  document.getElementById('exp-ansible').addEventListener('click', exportAnsible);
  document.getElementById('exp-terraform').addEventListener('click', exportTerraform);

  /* .rsc — використовуємо існуючу кнопку */
  document.getElementById('exp-rsc').addEventListener('click', function() {
    var orig = document.getElementById('btn-download') ||
               document.querySelector('[onclick*="download"]') ||
               document.querySelector('button[id*="download"]');
    if (orig) {
      orig.click();
    } else {
      /* Запасний варіант — скачуємо напряму */
      var script = expGetScript();
      var name   = (expGetVal('hostname') || 'mikrotik') + '-config.rsc';
      expDownload(name, script, 'text/plain;charset=utf-8');
      expToast('✓ .rsc завантажено!');
    }
  });

  console.log('[export.js] ✅ ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', expInit);
} else {
  expInit();
}