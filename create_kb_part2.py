# -*- coding: utf-8 -*-
import os

PART2 = """================================================================================
MikroTik RouterOS — Доповнення до мануалу
Частина 2: QoS, The Dude, REST API, PCQ, Scripting advanced
================================================================================

================================================================================
РОЗДІЛ 12: QoS та Traffic Shaping
================================================================================

## 12.1 Simple Queue — обмеження для клієнта

Обмежити один IP
/queue simple
add name=PC-192.168.88.50 target=192.168.88.50
max-limit=20M/10M comment="John PC"

Обмежити підмережу
add name=Guest-Limit target=192.168.20.0/24
max-limit=50M/20M comment="Guest network"

Пріоритет для VoIP
add name=VoIP-Priority target=192.168.88.0/24
max-limit=100M/100M priority=1
dst-address=0.0.0.0/0
packet-marks=voip-mark


## 12.2 PCQ (Per Connection Classifier) — для провайдерів


Типи черг PCQ
/queue type
add name=PCQ-Download kind=pcq
pcq-classifier=dst-address
pcq-rate=0 pcq-limit=200KiB pcq-total-limit=2000KiB

add name=PCQ-Upload kind=pcq
pcq-classifier=src-address
pcq-rate=0 pcq-limit=200KiB pcq-total-limit=2000KiB

Mangle — маркування пакетів
/ip firewall mangle
add chain=prerouting src-address=192.168.88.0/24
action=mark-packet new-packet-mark=upload passthrough=no
add chain=prerouting dst-address=192.168.88.0/24
action=mark-packet new-packet-mark=download passthrough=no

Queue Tree
/queue tree
add name=WAN-Download parent=global
packet-mark=download queue=PCQ-Download max-limit=100M
add name=WAN-Upload parent=global
packet-mark=upload queue=PCQ-Upload max-limit=50M


## 12.3 Пріоритет для VoIP / відеоконференцій


Mangle — маркувати VoIP трафік
/ip firewall mangle

SIP
add chain=prerouting protocol=udp dst-port=5060,5061
action=mark-packet new-packet-mark=voip passthrough=no

RTP (голос)
add chain=prerouting protocol=udp dst-port=10000-20000
action=mark-packet new-packet-mark=voip passthrough=no

Zoom
add chain=prerouting protocol=udp dst-port=8801-8802
action=mark-packet new-packet-mark=voip passthrough=no

Queue з пріоритетом
/queue simple
add name=VoIP target=192.168.88.0/24
packet-marks=voip priority=1 max-limit=100M/50M


================================================================================
РОЗДІЛ 13: The Dude — мережевий моніторинг
================================================================================


Встановити пакет The Dude (тільки на RouterBOARD)
/system package install dude

Перезавантажити
Запустити сервер
/dude set enabled=yes data-directory=dude

Статус
/dude print

Підключення:
Завантажити The Dude client з mikrotik.com
З'єднатись: IP роутера, порт 2210
Логін/пароль такий самий як RouterOS


================================================================================
РОЗДІЛ 14: REST API
================================================================================

## 14.1 Базові запити


Увімкнути REST API
/ip service enable www-ssl
/ip service set www-ssl port=443 certificate=my-cert

Або без SSL (тільки для тестування!)
/ip service enable www

Формат URL:
GET http://IP/rest/ШЛЯХ
POST http://IP/rest/ШЛЯХ
Авторизація: Basic Auth (user:pass base64)
Приклади curl:
Отримати IP адреси
curl -k -u admin:pass https://192.168.88.1/rest/ip/address

Отримати інтерфейси
curl -k -u admin:pass https://192.168.88.1/rest/interface

Додати IP адресу (POST)
curl -k -u admin:pass -X POST https://192.168.88.1/rest/ip/address
-H "Content-Type: application/json"
-d '{"address":"192.168.99.1/24","interface":"ether3"}'

Видалити правило (DELETE)
curl -k -u admin:pass -X DELETE
https://192.168.88.1/rest/ip/firewall/filter/ITEM_ID


## 14.2 Корисні REST ендпоінти


GET /rest/system/identity # назва роутера
GET /rest/system/resource # CPU, RAM, uptime
GET /rest/system/routerboard # модель, серійний номер
GET /rest/interface # всі інтерфейси
GET /rest/ip/address # IP адреси
GET /rest/ip/route # таблиця маршрутів
GET /rest/ip/firewall/filter # правила firewall
GET /rest/ip/firewall/nat # NAT правила
GET /rest/ip/dhcp-server/lease # DHCP клієнти
GET /rest/ip/arp # ARP таблиця
GET /rest/ip/neighbor # LLDP/CDP сусіди
GET /rest/ip/service # сервіси
GET /rest/log # логи
GET /rest/interface/wireless/registration-table # WiFi клієнти (v6)
GET /rest/interface/wifi/registration-table # WiFi клієнти (v7)
POST /rest/ping # пінг (body: {"address":"8.8.8.8","count":"4"})
POST /rest/ip/firewall/filter # додати правило
DELETE /rest/ip/firewall/filter/ID # видалити правило


================================================================================
РОЗДІЛ 15: Scripting — розширені приклади
================================================================================

## 15.1 Основи мови скриптів


Змінні
:local myVar "hello"
:local myNum 42
:set myVar "world"

Глобальні змінні
:global globalVar
:set globalVar "persistent"

Виведення
:log info "Message"
:put "Output"

Умови
:if (myNum > 10) do={
:log info "Greater than 10"
} else={
:log info "Less or equal 10"
}

Цикл
:for i from=1 to=5 step=1 do={
:log info ("Iteration: " . $i)
}

Foreach
:foreach item in={1;2;3;4;5} do={
:put $item
}

Функції (як скрипти)
/system script add name=myFunc source={
:local result ($1 + $2)
:return $result
}

Масиви
:local arr {1;2;3;"hello";"world"}
:put [:len $arr]
:put ($arr->0)

Парсинг рядка
:local str "192.168.88.1"
:local parts [:toarray $str]


## 15.2 Автоматизація конфігурації


Скрипт налаштування нового роутера
/system script add name=initial-setup source={
# Встановити ім'я
/system identity set name=MyRouter

# Налаштувати NTP /system ntp client set enabled=yes servers=pool.ntp.org # Налаштувати DNS /ip dns set servers=8.8.8.8,1.1.1.1 allow-remote-requests=yes # Вимкнути небезпечні сервіси /ip service disable telnet,ftp,www,api # Змінити порт SSH /ip service set ssh port=2222 # Налаштувати логування /system logging action set [find name=remote] remote=192.168.88.100 \ remote-port=514 src-address=0.0.0.0 /log info "Initial setup completed"
}


================================================================================
РОЗДІЛ 16: Довідник — повний список команд
================================================================================

## Система

/system identity print|set name=...
/system resource print
/system routerboard print
/system clock print|set date=... time=...
/system ntp client print|set enabled=yes servers=...
/system backup save name=...|load name=...
/export file=... compact
/import file=...
/system reboot
/system shutdown
/system reset-configuration no-defaults=yes
/system package print|update check-for-updates
/system health print
/tool profile
/log print|clear|print follow


## Інтерфейси

/interface print|monitor-traffic ... once|enable|disable
/interface bridge print|add|port print
/interface vlan print|add
/interface wireguard print|add
/interface wifi print|scan wlan1 (v7)
/interface wireless print|scan wlan1 (v6)
/interface bonding print|add
/interface vrrp print|add


## IP мережа

/ip address print|add|remove
/ip route print|add|remove|check-gateway=ping
/ip arp print|flush
/ip neighbor print
/ip dns print|set|static add
/ip dhcp-server print|lease print|lease make-static
/ip dhcp-client print|release|renew
/ip pool print|add
/ip service print|enable|disable|set


## Firewall

/ip firewall filter print|add|remove|move|enable|disable
/ip firewall nat print|add|remove
/ip firewall mangle print|add|remove
/ip firewall address-list print|add|remove
/ip firewall connection print|tracking print
/ip firewall connection tracking set enabled=yes|no


## WiFi v7

/interface wifi print|enable|disable|set
/interface wifi scan wlan1 duration=5
/interface wifi registration-table print
/interface wifi capsman print|set enabled=yes
/interface wifi configuration print|add
/interface wifi security print|add
/interface wifi channel print|add
/interface wifi provisioning print|add


## WiFi v6

/interface wireless print|enable|disable
/interface wireless scan wlan1
/interface wireless registration-table print
/interface wireless security-profiles print|add|set
/caps-man manager print|set enabled=yes
/caps-man interface print
/caps-man remote-cap print
/caps-man provisioning print|add


## Маршрутизація

/routing ospf instance print|add
/routing ospf area print|add
/routing ospf neighbor print
/routing bgp session print
/routing bgp connection print|add
/routing bgp advertisements print
/routing filter rule print|add
/ip route print where active|bgp|ospf|static
/routing table print


## VPN

/interface wireguard print|add
/interface wireguard peers print|add
/interface l2tp-server server print|set enabled=yes
/interface pptp-server server print|set enabled=yes
/interface ovpn-server server print|set enabled=yes
/ip ipsec policy print|add
/ip ipsec peer print|add
/ip ipsec sa print
/ppp secret print|add
/ppp profile print|add
/ppp active print


## QoS

/queue simple print|add|remove|set
/queue tree print|add
/queue type print|add
/ip firewall mangle print|add


## Діагностика

/ping address=... count=... interface=... size=...
/tool traceroute address=... count=1
/tool torch interface=... duration=...
/tool bandwidth-test address=... direction=both
/tool netwatch print|add
/tool profile
/tool mac-scan interface=ether1 duration=5
/tool ip-scan address-range=192.168.88.0/24


## CRS Switch

/interface bridge host print # MAC таблиця
/interface bridge mdb print # Multicast
/interface ethernet switch print # Switch status
/interface ethernet switch port print # Port stats
/interface ethernet monitor ether1 once


================================================================================
ПОСИЛАННЯ НА ОФІЦІЙНУ ДОКУМЕНТАЦІЮ
================================================================================

Головна документація:   https://help.mikrotik.com/docs/
RouterOS v7 довідник:   https://help.mikrotik.com/docs/spaces/ROS/
User Manuals:           https://help.mikrotik.com/docs/spaces/UM/
Quick Guides:           https://help.mikrotik.com/docs/spaces/QG/
SwOS:                   https://help.mikrotik.com/docs/spaces/SWOS/
Форум:                  https://forum.mikrotik.com/
Продукти:               https://mikrotik.com/products
Матриця характеристик:  https://mikrotik.com/products/matrix
MUM presentations:      https://mum.mikrotik.com/

Корисні розділи help.mikrotik.com:
  RouterOS → Getting started      # Перший запуск
  RouterOS → Scripting            # Скрипти
  RouterOS → Bridging/Switching   # Bridge та VLAN
  RouterOS → Firewall and QoS     # Firewall
  RouterOS → Routing              # OSPF, BGP, RIP, MPLS
  RouterOS → Virtual Private Net  # VPN
  RouterOS → Wireless             # WiFi/CAPsMAN
  RouterOS → Container            # Docker-like
  RouterOS → REST API             # REST API
  RouterBOARD → Hardware          # Апаратне забезпечення

================================================================================
КІНЕЦЬ ФАЙЛУ ЧАСТИНА 2
================================================================================
"""

with open('ai-agent/knowledge/mikrotik-manual-part2.txt', 'w', encoding='utf-8') as f:
    f.write(PART2)

size2 = len(PART2)
print(f'OK: mikrotik-manual-part2.txt ✅')
print(f'Розмір: {size2} символів ({size2//1024} KB)')

# Загальна статистика
size1 = os.path.getsize('ai-agent/knowledge/mikrotik-manual-part1.txt')
size2 = os.path.getsize('ai-agent/knowledge/mikrotik-manual-part2.txt')
print(f'\nЗагальний розмір бази знань: {(size1+size2)//1024} KB')
print(f'Файли:')
print(f'  mikrotik-manual-part1.txt: {size1//1024} KB')
print(f'  mikrotik-manual-part2.txt: {size2//1024} KB')

