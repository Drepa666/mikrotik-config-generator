# -*- coding: utf-8 -*-
import os

os.makedirs('ai-agent/knowledge', exist_ok=True)

PART1 = """================================================================================
MikroTik RouterOS — Доповнення до мануалу
Частина 1: Моделі, CAPsMAN, WireGuard, VLAN, Hotspot
Версія: 2026 | Джерело: help.mikrotik.com + mikrotik.com
================================================================================

================================================================================
РОЗДІЛ 1: ПОВНИЙ СПИСОК МОДЕЛЕЙ ТА ХАРАКТЕРИСТИКИ
================================================================================

## 1.1 Іменування продуктів MikroTik
Формат: <назва> <функції>-<wireless> <wireless-функції>-<конектор>-<корпус>

Серії за кодом:
  D = Dakota | C = Cypress | S = Chateau | L = Maple | E = Econet | MA = Miami

Функції в назві плати:
  U = USB порт
  P = PoE контролер (активний)
  i = PoE injector (пасивний)
  A = Додаткова пам'ять або вища ліцензія
  H = Потужніший CPU
  G = Gigabit Ethernet
  L = Lite (спрощена версія)
  D = Додатковий диск (SSD/M.2)
  S = SFP порт

Wireless формат: <діапазон><потужність><протокол><антени>
  Приклад: 5HacD2HnD = 5GHz потужний 802.11ac dual-chain + 2.4GHz n dual-chain

Корпус:
  IN = Indoor (для приміщень)
  OUT = Outdoor (вулиця, IP67)
  RM = Rack Mount (19 дюймів)
  TC = Tower Case
  PC = Passive Cooling

================================================================================
## 1.2 hAP серія (home Access Point) — роутери з WiFi
================================================================================

### Тільки 2.4 GHz
---------------------------------------------------------------------------------
hAP lite | RB941-2nD
  CPU:     QCA9533 650MHz, MIPS
  RAM:     32MB
  Storage: 16MB NAND
  Ports:   4x Fast Ethernet (100Mbps)
  WiFi:    2.4GHz 802.11b/g/n, 2x2 MIMO
  USB:     Ні
  PoE in:  Passive 8-30V (ether1)
  Power:   5W max
  RouterOS: L4, v6/v7
  Розміри: 113x89x28mm
  Особливості: Найдоступніший варіант, для дому

hAP lite TC | RB941-2nD-TC
  Аналог hAP lite, але в вежовому корпусі

hAP | RB951Ui-2nD
  CPU:     AR9331 400MHz, MIPS
  RAM:     32MB
  Storage: 16MB NAND
  Ports:   5x Fast Ethernet (100Mbps)
  WiFi:    2.4GHz 802.11b/g/n, 2x2 MIMO
  USB:     1x USB-A
  PoE in:  Passive 8-30V (ether1)
  PoE out: ether5 (пасивний, до 0.58A)
  Power:   7W max
  RouterOS: L4, v6/v7
  Особливості: USB для модему, PoE out на ether5

hAP ax lite | L41G-2axD
  CPU:     MT7621A 880MHz dual-core, MIPS
  RAM:     256MB DDR3
  Storage: 16MB
  Ports:   4x Gigabit Ethernet
  WiFi:    2.4GHz 802.11b/g/n/ax (WiFi 6), 2x2 MIMO
  USB:     1x USB-A
  PoE in:  Passive 12-57V або 802.3af/at (ether1)
  Power:   9W max
  RouterOS: L4, тільки v7
  Switch chip: MT7531
  Особливості: WiFi 6, перша доступна ax модель

hAP ax lite LTE6 | L41G-2axD&FG621-EA
  Аналог hAP ax lite + вбудований LTE Cat6 модем
  Слот: вбудований (не знімний)

L009UiGS-2HaxD-IN
  CPU:     ARM 800MHz
  RAM:     256MB
  Ports:   8x Gigabit + 1x SFP (combo)
  WiFi:    2.4GHz 802.11ax (WiFi 6)
  USB:     1x USB-A
  RouterOS: L5, v7
  Особливості: 8 портів + SFP + WiFi 6, для офісу

### 2.4 GHz + 5 GHz (Dual Band)
---------------------------------------------------------------------------------
hAP ac lite | RB952Ui-5ac2nD
  CPU:     QCA9531 650MHz, MIPS
  RAM:     64MB
  Storage: 16MB NAND
  Ports:   5x Fast Ethernet (100Mbps)
  WiFi:    2.4GHz 802.11n + 5GHz 802.11ac, роздільні антени
  USB:     1x USB-A
  PoE in:  Passive 8-30V (ether1)
  PoE out: ether5
  Power:   7W max
  RouterOS: L4, v6/v7
  Switch chip: Atheros8227
  Config:  ether1=WAN, ether2-5=LAN bridge
  Особливості: Найпопулярніша домашня модель, дуже доступна

hAP ac lite TC | RB952Ui-5ac2nD-TC
  Аналог hAP ac lite в вежовому корпусі (Tower Case)

hAP ac | RB962UiGS-5HacT2HnT
  CPU:     QCA9558 720MHz, MIPS
  RAM:     128MB
  Storage: 16MB NAND
  Ports:   5x Gigabit + 1x SFP + 1x USB-A
  WiFi:    2.4GHz 802.11n (3x3) + 5GHz 802.11ac (3x3)
  PoE in:  Passive 12-57V або 802.3af/at (ether1)
  PoE out: ether2-ether5 (802.3af/at, до 1A на порт)
  Power:   17W max
  RouterOS: L4, v6/v7
  Switch chip: QCA8337
  Особливості: SFP + PoE out + USB, для офісу/SMB

hAP ac² | RBD52G-5HacD2HnD-TC
  CPU:     IPQ4018 716MHz quad-core, ARM
  RAM:     128MB DDR3
  Storage: 16MB NAND
  Ports:   5x Gigabit
  WiFi:    2.4GHz 802.11n (2x2) + 5GHz 802.11ac (2x2)
  USB:     1x USB-A
  PoE in:  Passive 12-28V (ether1)
  Power:   9W max
  RouterOS: L4, v6/v7
  Switch chip: Atheros8327
  Особливості: ARM CPU, швидший за hAP ac lite

hAP ac³ | RBD53iG-5HacD2HnD
  CPU:     IPQ4019 716MHz quad-core, ARM
  RAM:     256MB DDR3
  Storage: 16MB NAND
  Ports:   5x Gigabit
  WiFi:    2.4GHz 802.11n (2x2) + 5GHz 802.11ac (2x2)
  USB:     1x USB-A
  PoE in:  Passive 12-28V або 802.3af/at (ether1)
  Power:   13W max
  RouterOS: L4, v6/v7
  Особливості: Покращена версія ac², зовнішні антени знімні

hAP ac³ LTE6 kit | RBD53GR-5HacD2HnD&R11e-LTE6
  Аналог hAP ac³ + miniPCIe LTE Cat6 модем
  Слот: miniPCIe знімний

hAP ax² | C52iG-5HaxD2HaxD-TC
  CPU:     IPQ6010 1.8GHz dual-core, ARM
  RAM:     256MB DDR4
  Storage: 128MB NAND
  Ports:   5x Gigabit
  WiFi:    2.4GHz 802.11ax (WiFi 6) + 5GHz 802.11ax (WiFi 6), 2x2
  USB:     1x USB-A
  PoE in:  Passive 12-28V або 802.3af/at (ether1)
  Power:   13W max
  RouterOS: L4, тільки v7
  Switch chip: IPQ-PPE (HW offload)
  Особливості: WiFi 6, WPA3, найпопулярніша сучасна домашня модель

hAP ax³ | C53UiG+5HPaxD2HPaxD
  CPU:     IPQ6010 1.8GHz dual-core, ARM
  RAM:     256MB DDR4
  Storage: 128MB NAND
  Ports:   1x 2.5G + 4x Gigabit
  WiFi:    2.4GHz 802.11ax + 5GHz 802.11ax (WiFi 6), 2x2
  USB:     1x USB-A 3.0
  PoE in:  802.3af/at/bt (2.5G порт)
  PoE out: ether5 (802.3af/at)
  Power:   23W max
  RouterOS: L4, тільки v7
  Особливості: 2.5G Ethernet, PoE in/out, топова домашня модель

hAP ax S | E62iUGS-2axD5axT
  CPU:     IPQ5018 1GHz dual-core, ARM
  RAM:     256MB DDR4
  Ports:   4x Gigabit + 1x SFP
  WiFi:    2.4GHz 802.11ax + 5GHz 802.11ax (WiFi 6)
  USB:     1x USB-A
  RouterOS: L4, тільки v7
  Особливості: SFP порт + WiFi 6

### WiFi 7 (новітні)
---------------------------------------------------------------------------------
hAP be lite | A42G-HbeP
  CPU:     MT7981B 1.3GHz dual-core, ARM
  RAM:     256MB
  Ports:   1x 2.5G + 3x Gigabit
  WiFi:    2.4GHz 802.11be + 5GHz 802.11be (WiFi 7), MLO
  USB:     1x USB-C (живлення)
  Power:   USB-C 5V/3A або 12V
  RouterOS: L4, тільки v7
  Особливості: Найдоступніший WiFi 7 роутер, Multi-Link Operation

hAP be³ Media | MA53UG+HbeH
  CPU:     IPQ9570 (Qualcomm), quad-core, ARM64
  RAM:     1GB+
  Ports:   Multi-port з 2.5G
  WiFi:    2.4GHz + 5GHz + 6GHz (WiFi 7, tri-band)
  RouterOS: L4, тільки v7
  Особливості: Tri-band WiFi 7, медіа центр

================================================================================
## 1.3 hEX серія — проводові роутери (без WiFi)
================================================================================

hEX lite | RB750r2
  CPU:     MT7621A 880MHz dual-core, MIPS
  RAM:     64MB DDR2
  Storage: 16MB NAND
  Ports:   5x Fast Ethernet (100Mbps)
  USB:     Ні
  PoE in:  Passive 8-30V (ether1)
  Power:   5W max
  RouterOS: L4, v6/v7
  Особливості: Найдоступніший MPLS роутер, бюджетний

hEX PoE lite | RB750UPr2
  CPU:     MT7621A 880MHz dual-core
  RAM:     64MB
  Ports:   5x Fast Ethernet
  PoE out: ether2-ether5 (пасивний PoE)
  RouterOS: L4, v6/v7

PowerBox | RB750P-PBr2
  CPU:     MT7621A 880MHz
  RAM:     64MB
  Ports:   5x Fast Ethernet
  PoE out: ether2-ether5 (пасивний, IP54 корпус)
  Особливості: Вулиця, IP54

hEX | RB750Gr3
  CPU:     MT7621A 880MHz dual-core, MIPS
  RAM:     256MB DDR3
  Storage: 16MB NAND + MicroSD слот
  Ports:   5x Gigabit
  USB:     1x USB-A
  PoE in:  Passive 8-30V (ether1)
  Power:   10W max (5W без навантаження)
  RouterOS: L4, v6/v7
  Switch chip: MT7621
  Throughput: до 1980 Mbps
  IPSec HW: до 500 Mbps
  Особливості: MicroSD для логів/резервних копій, дуже популярний

hEX refresh | E50UG
  CPU:     EN7562CT 950MHz dual-core, ARM
  RAM:     512MB DDR3L
  Storage: 128MB NAND
  Ports:   5x Gigabit
  USB:     1x USB-A 2.0
  PoE in:  Passive 12-28V (ether1)
  Power:   10W max (4W без навантаження)
  RouterOS: L4, тільки v7
  Switch chip: EN7523
  Особливості: Більше RAM ніж оригінал, новіший ARM CPU

hEX S | RB760iGS
  CPU:     MT7621A 880MHz dual-core, MIPS
  RAM:     256MB DDR3
  Storage: 16MB NAND + MicroSD
  Ports:   5x Gigabit + 1x SFP (1.25G)
  USB:     1x USB-A
  PoE in:  Passive або 802.3af/at 12-57V (ether1)
  PoE out: ether5 (802.3af/at)
  Power:   17W max
  RouterOS: L4, v6/v7
  Особливості: SFP для оптики, PoE out, дуже популярний

hEX S 2025 | E60iUGS
  CPU:     ARM dual-core (новий)
  RAM:     512MB
  Storage: 128MB
  Ports:   5x Gigabit + 1x 2.5G SFP
  USB:     1x USB-A 3.0
  PoE in:  Passive або 802.3af/at 12-57V
  PoE out: ether5
  Power:   12W max
  RouterOS: L4, тільки v7
  Особливості: 2.5G SFP, USB 3.0, найновіша версія

hEX PoE | RB960PGS
  CPU:     QCA9558 800MHz, MIPS
  RAM:     128MB
  Ports:   5x Gigabit
  PoE out: ether2-ether5 (802.3af/at, 1A на порт)
  USB:     1x USB-A
  RouterOS: L4, v6/v7

PowerBox Pro | RB960PGS-PB
  Аналог hEX PoE, IP54 корпус для вулиці

================================================================================
## 1.4 RB серія (RouterBOARD)
================================================================================

RB2011iL-IN
  CPU:     AR9344 600MHz
  RAM:     64MB
  Ports:   5x Fast Ethernet + 5x Gigabit
  RouterOS: L5, v6/v7

RB2011UiAS-IN / RM
  CPU:     AR9344 600MHz
  RAM:     128MB
  Ports:   5x Fast Ethernet + 5x Gigabit + 1x SFP
  USB:     1x USB-A
  LCD:     Так (IN версія)
  RouterOS: L5, v6/v7
  Особливості: LCD панель для моніторингу

RB3011UiAS-RM
  CPU:     IPQ8064 1.4GHz dual-core, ARM
  RAM:     1GB DDR3
  Ports:   10x Gigabit + 1x SFP+
  USB:     1x USB-A 3.0
  RouterOS: L5, v6/v7
  Throughput: до 5Gbps

RB4011iGS+RM
  CPU:     AL21400 1.4GHz quad-core, ARM
  RAM:     1GB DDR4
  Storage: 512MB NAND
  Ports:   10x Gigabit + 1x SFP+ (10G)
  USB:     1x USB-A 3.0
  RouterOS: L5, v6/v7
  Throughput: до 10Gbps
  IPSec HW: до 2.5Gbps

RB4011iGS+5HacQ2HnD-IN
  Аналог RB4011 + вбудований WiFi ac (4x4 + 2x2)

RB5009UG+S+IN
  CPU:     AL52400 1.4GHz quad-core, ARM64
  RAM:     1GB DDR4
  Storage: 1GB NAND
  Ports:   7x Gigabit + 1x 2.5G + 1x SFP+ (10G)
  USB:     1x USB-A 3.0
  RouterOS: L5, v7
  Throughput: до 10Gbps
  IPSec HW: до 3Gbps
  Особливості: ARM64, 2.5G порт, найпотужніший настільний

RB5009UPr+S+IN / OUT
  Аналог RB5009 + PoE out на всіх портах (802.3af/at/bt)
  OUT = IP67 корпус для вулиці

RB1100AHx4
  CPU:     AL21400 1.4GHz quad-core, ARM
  RAM:     1GB DDR4
  Ports:   13x Gigabit
  RouterOS: L6, v6/v7
  Switch chip: RTL8367 x3
  Особливості: Rack, 13 портів, enterprise

================================================================================
## 1.5 CCR (Cloud Core Router) — ISP / Enterprise
================================================================================

### CCR1 серія (Tilera CPU — застаріла але ще використовується)
CCR1009-7G-1C-1S+
  CPU:     Tilera TILE-Gx9 9-core 1GHz
  RAM:     1GB DDR3
  Ports:   7x Gigabit + 1x combo (GE/SFP) + 1x SFP+
  RouterOS: L6, v6/v7
  Throughput: до 12Gbps

CCR1009-8G-1S-1S+
  CPU:     Tilera TILE-Gx9 9-core
  RAM:     1GB
  Ports:   8x Gigabit + 1x SFP + 1x SFP+

CCR1016-12G
  CPU:     Tilera TILE-Gx16 16-core 1.2GHz
  RAM:     2GB DDR3
  Ports:   12x Gigabit
  Throughput: до 24Gbps

CCR1016-12S-1S+
  CPU:     Tilera 16-core
  Ports:   12x SFP + 1x SFP+

CCR1036-8G-2S+
  CPU:     Tilera TILE-Gx36 36-core 1.2GHz
  RAM:     4GB DDR3
  Ports:   8x Gigabit + 2x SFP+
  Throughput: до 36Gbps

CCR1036-12G-4S
  CPU:     Tilera 36-core
  Ports:   12x Gigabit + 4x SFP+

CCR1072-1G-8S+
  CPU:     Tilera TILE-Gx72 72-core 1GHz
  RAM:     16GB DDR3
  Ports:   1x Gigabit + 8x SFP+
  Throughput: до 80Gbps

### CCR2 серія (ARM — сучасна)
CCR2004-1G-12S+2XS
  CPU:     AL52400 1.7GHz quad-core, ARM64
  RAM:     4GB DDR4
  Ports:   1x Gigabit + 12x SFP+ (10G) + 2x SFP28 (25G)
  RouterOS: L6, v7
  Throughput: до 100Gbps
  Особливості: Тихий, без вентилятора

CCR2004-16G-2S+
  CPU:     AL52400 1.7GHz quad-core, ARM64
  RAM:     4GB DDR4
  Ports:   16x Gigabit + 2x SFP+ (10G)
  RouterOS: L6, v7
  Throughput: до 30Gbps
  Особливості: Тихий, популярний для SMB/ISP

CCR2004-16G-2S+PC
  Аналог CCR2004-16G-2S+ з пасивним охолодженням

CCR2116-12G-4S+
  CPU:     AL52400 2.0GHz 16-core, ARM64
  RAM:     16GB DDR4
  Ports:   12x Gigabit + 4x SFP+ (10G)
  RouterOS: L6, v7
  Throughput: до 100Gbps
  Особливості: 16 ядер, вентилятори

CCR2216-1G-12XS-2XQ
  CPU:     AL52400 2.0GHz 16-core, ARM64
  RAM:     16GB DDR4
  Ports:   1x Gigabit + 12x SFP28 (25G) + 2x QSFP28 (100G)
  RouterOS: L6, v7
  Throughput: до 400Gbps
  Особливості: Найпотужніший CCR, L3 HW offload

================================================================================
## 1.6 CRS (Cloud Router Switch)
================================================================================

### CRS1xx/2xx (Qualcomm/Atheros чипи)
Режими: RouterOS або SwOS
Обмеження: Без L3 HW offload (тільки software routing)

CRS105-5S-FB | Switch chip: QCA-8511 | 400MHz | 5x SFP | ACL
CRS106-1C-5S | Switch chip: QCA-8511 | 400MHz | 1x GE + 5x SFP | ACL
CRS112-8G-4S-IN | Switch chip: QCA-8511 | 400MHz | 8x GE + 4x SFP | ACL
CRS112-8P-4S-IN | Switch chip: QCA-8511 | PoE out 802.3af/at
CRS125-24G-1S | Switch chip: QCA-8513L | 600MHz | 24x GE + 1x SFP
CRS125-24G-1S-2HnD | Аналог + WiFi 2.4GHz
CRS109-8G-1S-2HnD | Switch chip: QCA-8513L | 8x GE + SFP + WiFi
CRS210-8G-2S+ | Switch chip: QCA-8519 | 8x GE + 2x SFP+ (10G) | ACL
CRS212-1G-10S-1S+ | Switch chip: QCA-8519 | 10x SFP + 1x SFP+ | ACL
CRS226-24G-2S+ | Switch chip: QCA-8519 | 24x GE + 2x SFP+ | ACL

### CRS3xx (Marvell Prestera чипи)
Режими: RouterOS або SwOS
Підтримка: L3 HW offload на деяких моделях

CRS304-4XG-IN | 4x 10G Ethernet (RJ45) | Marvell
CRS305-1G-4S+IN | 1x GE + 4x SFP+ (10G) | Настільний, популярний
CRS309-1G-8S+IN | 1x GE + 8x SFP+ (10G) | Настільний
CRS310-1G-5S-4S+IN | 1x GE + 5x SFP + 4x SFP+
CRS310-8G+2S+IN | 8x GE + 2x SFP+
CRS312-4C+8XG-RM | 4x combo + 8x 10G Ethernet | Rack
CRS317-1G-16S+RM | 1x GE + 16x SFP+ | Rack, дуже популярний
CRS318-16P-2S+ | 16x GE PoE (802.3af/at) + 2x SFP+
CRS320-8P-8B-4S+RM | 8x PoE + 8x 2.5G + 4x SFP+
CRS326-24G-2S+IN/RM | 24x GE + 2x SFP+ | Найпопулярніший офісний
CRS326-4C+20G+2Q+RM | 4x combo + 20x 10G + 2x 40G QSFP+
CRS326-24S+2Q+RM | 24x SFP+ + 2x QSFP+ | Data Center
CRS328-4C-20S-4S+RM | 4x combo + 20x SFP + 4x SFP+
CRS328-24P-4S+RM | 24x GE PoE + 4x SFP+ | Rack PoE комутатор
CRS354-48G-4S+2Q+RM | 48x GE + 4x SFP+ + 2x QSFP+ (40G)
CRS354-48P-4S+2Q+RM | 48x GE PoE + 4x SFP+ + 2x QSFP+
CRS504-4XQ-IN | 4x QSFP28 (100G) | Data Center
CRS510-8XS-2XQ-IN | 8x SFP28 (25G) + 2x QSFP28 (100G)
CRS518-16XS-2XQ-RM | 16x SFP28 + 2x QSFP28
CRS520-4XS-16XQ-RM | 4x SFP28 + 16x QSFP28 (100G) + 2x QSFP-DD (400G)

### CSS (Cloud Smart Switch — тільки SwOS, без RouterOS)
CSS318-16G-2S+IN | 16x GE + 2x SFP+
CSS326-24G-2S+RM | 24x GE + 2x SFP+
CSS610-8G-2S+IN | 8x GE + 2x SFP+
CSS610-8P-2S+IN | 8x GE PoE + 2x SFP+

================================================================================
## 1.7 Зовнішні пристрої
================================================================================

### wAP (wall Access Point)
wAP | RBwAP2nD | Настінний, 2.4GHz n, 2x Ethernet
wAP ac | RBwAPG-5HacD2HnD | Настінний, dual-band ac, 2x GE
wAP R ac | Зовнішній, dual-band, LTE miniPCIe слот, IP54
wAP ax LTE7 | WiFi 6, LTE Cat7, IP66, зовнішній
wAP 60G | 60GHz, 1Gbps PtP, пара пристроїв

### SXT (зовнішній CPE/PtP)
SXT Lite2 | 2.4GHz | 10 dBi | 802.11n | CPE
SXT Lite5 | 5GHz | 16 dBi | 802.11n | CPE
SXT Lite5 ac | 5GHz | 16 dBi | 802.11ac | CPE
SXT 5 | 5GHz | 16 dBi | 60° сектор | 802.11n
SXT 5 ac | 5GHz | 16 dBi | 802.11ac
SXTsq 5 ac | 5GHz | 20 dBi | вузький промінь
SXTsq LTE4 | LTE Cat4 | eSIM | IP67 | зовнішній
SXTsq LTE4 Global | Глобальна версія з EG25-G модемом

### LHG (Long Haul Gigabit — далекобійні)
LHG 5 | 5GHz | 24.5 dBi | 802.11n | до 10 км
LHG XL 5 | 5GHz | 27 dBi | збільшена антена | до 15 км
LHG 5 ac | 5GHz | 24.5 dBi | 802.11ac | швидший
LHG XL 5 ac | 5GHz | 27 dBi | 802.11ac
LHG 60G | 60GHz | вбудована | 1Gbps full duplex | до 2.4 км
LHGG LTE7 | LTE Cat7 | 17 dBi MIMO | зовнішній LTE
LHG XL 52 ac | Dual-band 5GHz + 2.4GHz | 24.5 dBi

### cAP (стельові AP для CAPsMAN)
cAP lite | RBcAPL-2nD | 2.4GHz n | бюджетний
cAP ac | RBcAP2nD | 2.4+5GHz ac | dual-band
cAP ax | cAP ax | 2.4+5GHz WiFi 6 | IPQ чип
cAP XL ac | Підвищена потужність

### Chateau (домашні LTE/5G)
Chateau LTE12 | LTE Cat12 | 5x GE | WiFi ac dual-band | Desktop
Chateau LTE7 | RBD53G-5HacD2HnD-TC&R11e-LTE7 | LTE Cat7 | WiFi ac
Chateau LTE7 ax | WiFi 6 + LTE Cat7
Chateau LTE18 ax | LTE Cat18 | 4x4 MIMO | WiFi 6 | потужний
Chateau 5G | 5G NR sub-6GHz | eSIM | WiFi 6
Chateau 5G R17 ax | 5G Release 17 | eSIM | WiFi 6 | найновіший
Chateau PRO ax | 5G | Quad-core ARM | потужний WiFi 6

### KNOT (IoT Gateway)
RB924iR-2nD-BT5&BG77
  Bluetooth 5.0 (BLE mesh)
  LTE Cat1 (BG77 модем)
  2.4GHz WiFi 802.11n
  Призначення: IoT збір даних, Bluetooth mesh мережі

### Wireless Wire (бездротовий кабель)
RBwAPG-60ad (wAP 60G) | 60GHz | 1Gbps full duplex | до 200м
Wireless Wire Cube Pro | 60GHz 802.11ay | до 2.4 км

================================================================================
## 1.8 Ліцензійні рівні RouterOS
================================================================================

L1 (Trial/Demo)
  - 24 годинний пробний режим
  - Скидається при перезавантаженні
  - Без комерційного використання

L2 (CPE/Embedded)
  - 1 PPPoE клієнт
  - 1 PPTP клієнт
  - 1 L2TP клієнт
  - Wireless клієнт режим
  - Зазвичай на SXT, LHG клієнтських пристроях

L3 (Wireless AP)
  - Необмежені тунелі
  - 1 Hotspot активна сесія
  - CAPsMAN клієнт

L4 (WISP AP — найпоширеніша для домашніх роутерів)
  - Необмежені тунелі
  - 200 точок доступу CAPsMAN
  - Hotspot (обмежена кількість)
  - Всі протоколи маршрутизації

L5 (WISP)
  - 500 точок доступу CAPsMAN
  - 500 Hotspot активних сесій

L6 (Controller — для CCR та серверних рішень)
  - Необмежено все
  - Повний функціонал
  - The Dude сервер

================================================================================
## 1.9 Switch Chip можливості (критично важливо!)
================================================================================

QCA-8511 / QCA-8519 (CRS1xx/2xx)
  + VLAN IEEE 802.1Q
  + ACL (Access Control List)
  + Port isolation
  + Link Aggregation (LACP)
  - Без L3 HW offload
  - Routing тільки software

Atheros8227 (hAP lite, hAP ac lite, hEX lite)
  + Базовий VLAN
  - Без ACL
  - Обмежений функціонал

Atheros8327 (hAP ac², hAP ac³, RB2011)
  + VLAN 802.1Q
  + Port mirror
  - Без ACL на деяких

MT7621 (hEX, hEX S, RB750Gr3)
  + VLAN 802.1Q
  + Port isolation
  + NAT HW offload (обмежено)

Marvell 98DX (CRS3xx)
  + Повний L2 switching HW
  + L3 HW offload (на деяких моделях)
  + ACL розширений
  + VXLAN
  + MPLS

IPQ-PPE (hAP ax², ax³, Chateau ax)
  + HW offload для WiFi
  + NAT HW offload
  + Хороша продуктивність

================================================================================
РОЗДІЛ 2: CAPsMAN — Централізоване управління WiFi
================================================================================

## 2.1 CAPsMAN v1 (RouterOS v6)

### Архітектура
  Controller (CAPsMAN) — головний роутер з пакетом wireless
  CAP (Controlled AP) — підлегла точка доступу

### Встановлення Controller (v6)
Увімкнути CAPsMAN
/caps-man manager
set enabled=yes ca-certificate=auto certificate=auto

Створити datapath
/caps-man datapath
add name=dp-local bridge=bridge-lan local-forwarding=yes

Конфігурація WiFi 2.4GHz
/caps-man configuration
add name=cfg-2ghz ssid=MyNetwork
mode=ap channel.frequency=2437 channel.width=20mhz
security.authentication-types=wpa2-psk
security.encryption=aes-ccm
security.passphrase=MyPassword123
datapath=dp-local

Конфігурація WiFi 5GHz
/caps-man configuration
add name=cfg-5ghz ssid=MyNetwork-5G
mode=ap channel.frequency=5180 channel.width=20/40/80mhz
security.authentication-types=wpa2-psk
security.encryption=aes-ccm
security.passphrase=MyPassword123
datapath=dp-local

Provisioning (автоналаштування CAP)
/caps-man provisioning
add radio-mac=00:00:00:00:00:00 action=create-dynamic-enabled
master-configuration=cfg-2ghz slave-configuration=cfg-5ghz

Перевірити підключені CAP
/caps-man remote-cap print
/caps-man interface print

### Налаштування CAP (підлегла точка) v6


Anthropic — Claude Sonnet 4.6

Retrieved 1 source

Thought for less than a second
cmd

Згорнути
Зберегти
Копіювати
1
notepad create_kb_part1.py
python

Згорнути

Запустити
Зберегти
Копіювати
580
581
582
583
584
585
586
587
588
589
590
591
592
593
594
595
596
597
598
599
600
601
602
603
604
605
606
607
608
609
610
611
612
613
614
615
616
617
618
619
620
621
622
623
624
625
626
627
628
629
630
631
632
633
634
635
636
637
638
639
640
641
642
643
644
================================================================================
L4 (WISP AP — найпоширеніша для домашніх роутерів)
  - Необмежені тунелі
  - 200 точок доступу CAPsMAN
  - Hotspot (обмежена кількість)
  - Всі протоколи маршрутизації

L5 (WISP)
  - 500 точок доступу CAPsMAN
  - 500 Hotspot активних сесій

L6 (Controller — для CCR та серверних рішень)
  - Необмежено все
  - Повний функціонал
  - The Dude сервер

================================================================================
## 1.9 Switch Chip можливості (критично важливо!)
================================================================================

QCA-8511 / QCA-8519 (CRS1xx/2xx)
  + VLAN IEEE 802.1Q
  + ACL (Access Control List)
  + Port isolation
  + Link Aggregation (LACP)
  - Без L3 HW offload
  - Routing тільки software

Atheros8227 (hAP lite, hAP ac lite, hEX lite)
  + Базовий VLAN
  - Без ACL
  - Обмежений функціонал

Atheros8327 (hAP ac², hAP ac³, RB2011)
  + VLAN 802.1Q
  + Port mirror
  - Без ACL на деяких

MT7621 (hEX, hEX S, RB750Gr3)
  + VLAN 802.1Q
  + Port isolation
  + NAT HW offload (обмежено)

Marvell 98DX (CRS3xx)
  + Повний L2 switching HW
  + L3 HW offload (на деяких моделях)
  + ACL розширений
  + VXLAN
  + MPLS

IPQ-PPE (hAP ax², ax³, Chateau ax)
  + HW offload для WiFi
  + NAT HW offload
  + Хороша продуктивність

================================================================================
РОЗДІЛ 2: CAPsMAN — Централізоване управління WiFi
================================================================================

## 2.1 CAPsMAN v1 (RouterOS v6)

### Архітектура
  Controller (CAPsMAN) — головний роутер з пакетом wireless
  CAP (Controlled AP) — підлегла точка доступу

### Встановлення Controller (v6)
Увімкнути CAPsMAN
/caps-man manager
set enabled=yes ca-certificate=auto certificate=auto

Створити datapath
/caps-man datapath
add name=dp-local bridge=bridge-lan local-forwarding=yes

Конфігурація WiFi 2.4GHz
/caps-man configuration
add name=cfg-2ghz ssid=MyNetwork
mode=ap channel.frequency=2437 channel.width=20mhz
security.authentication-types=wpa2-psk
security.encryption=aes-ccm
security.passphrase=MyPassword123
datapath=dp-local

Конфігурація WiFi 5GHz
/caps-man configuration
add name=cfg-5ghz ssid=MyNetwork-5G
mode=ap channel.frequency=5180 channel.width=20/40/80mhz
security.authentication-types=wpa2-psk
security.encryption=aes-ccm
security.passphrase=MyPassword123
datapath=dp-local

Provisioning (автоналаштування CAP)
/caps-man provisioning
add radio-mac=00:00:00:00:00:00 action=create-dynamic-enabled
master-configuration=cfg-2ghz slave-configuration=cfg-5ghz

Перевірити підключені CAP
/caps-man remote-cap print
/caps-man interface print


Згорнути
Зберегти
Копіювати
1
2

### Налаштування CAP (підлегла точка) v6
На точці доступу (не controller)
/interface wireless
set wlan1 mode=station-pseudobridge

/caps-man cap set enabled=yes
interface=ether1
caps-man-addresses=192.168.88.1
certificate=request


## 2.2 CAPsMAN v2 (RouterOS v7)
Повністю переписаний, новий синтаксис!

### Controller налаштування (v7)
Увімкнути
/interface wifi capsman
set enabled=yes interfaces=bridge

Конфігурація безпеки
/interface wifi security
add name=sec-home authentication-types=wpa2-psk,wpa3-psk
passphrase=MySecurePassword123

Конфігурація каналу 2.4GHz
/interface wifi channel
add name=ch-2ghz frequency=2437 width=20mhz band=2ghz-n

Конфігурація каналу 5GHz
/interface wifi channel
add name=ch-5ghz frequency=5180 width=20/40/80mhz band=5ghz-ac

Основна конфігурація
/interface wifi configuration
add name=cfg-2ghz ssid=HomeWiFi security=sec-home channel=ch-2ghz
datapath.bridge=bridge mode=ap

add name=cfg-5ghz ssid=HomeWiFi-5G security=sec-home channel=ch-5ghz
datapath.bridge=bridge mode=ap

Provisioning
/interface wifi provisioning
add action=create-dynamic-enabled master-configuration=cfg-2ghz
slave-configuration=cfg-5ghz

Перевірити CAP
/interface wifi capsman print
/interface wifi registration-table print


### CAP (підлегла точка) v7

На кожній точці доступу
/interface wifi
set wifi1 configuration.manager=capsman

/interface wifi cap
set enabled=yes slaves-static=wifi1,wifi2
discovery-interfaces=bridge,ether1


### Гостьова мережа через CAPsMAN

На controller — окрема конфігурація для гостей
/interface wifi configuration
add name=cfg-guest ssid=GuestWiFi security=sec-guest
datapath.bridge=bridge-guest mode=ap

/interface wifi provisioning
add action=create-dynamic-enabled master-configuration=cfg-2ghz
slave-configuration=cfg-5ghz,cfg-guest


================================================================================
РОЗДІЛ 3: VPN — повні конфігурації
================================================================================

## 3.1 WireGuard (RouterOS v7)

### Сервер (MikroTik роутер)

Крок 1: Створити WireGuard інтерфейс
/interface wireguard
add name=wg0 listen-port=13231 mtu=1420

Крок 2: Переглянути публічний ключ (скопіюємо для клієнта)
/interface wireguard print

Крок 3: IP адреса для WireGuard мережі
/ip address add address=10.0.0.1/24 interface=wg0

Крок 4: Додати peer (клієнта)
/interface wireguard peers
add interface=wg0
public-key="ПУБЛІЧНИЙ_КЛЮЧ_КЛІЄНТА"
allowed-address=10.0.0.2/32
comment="Laptop John"

Крок 5: Firewall — дозволити WireGuard
/ip firewall filter
add chain=input protocol=udp dst-port=13231 action=accept
comment="WireGuard UDP"

Крок 6: NAT для клієнтів WireGuard
/ip firewall nat
add chain=srcnat src-address=10.0.0.0/24 action=masquerade
comment="WireGuard NAT"

Для Split-tunneling (клієнт бачить тільки LAN)
В peer додаємо тільки LAN підмережу:
allowed-address=192.168.88.0/24
Для Full-tunnel (весь трафік через VPN)
allowed-address=0.0.0.0/0


### Клієнт конфігурація (Windows/Linux/Android)
```ini
[Interface]
PrivateKey = ПРИВАТНИЙ_КЛЮЧ_КЛІЄНТА
Address = 10.0.0.2/24
DNS = 192.168.88.1

[Peer]
PublicKey = ПУБЛІЧНИЙ_КЛЮЧ_СЕРВЕРА
Endpoint = ВАШ_ЗОВНІШНІЙ_IP:13231
# Split tunnel (тільки до роутера):
AllowedIPs = 10.0.0.0/24, 192.168.88.0/24
# Full tunnel (весь трафік):
# AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25

WireGuard між двома MikroTik (Site-to-Site)

# === SITE A (192.168.10.0/24) ===
/interface wireguard add name=wg-site listen-port=13231
/ip address add address=10.1.0.1/30 interface=wg-site
/interface wireguard peers add interface=wg-site \
    public-key="PUB_KEY_SITE_B" \
    endpoint-address=ЗОВН_IP_B endpoint-port=13231 \
    allowed-address=10.1.0.2/32,192.168.20.0/24
/ip route add dst-address=192.168.20.0/24 gateway=10.1.0.2

# === SITE B (192.168.20.0/24) ===
/interface wireguard add name=wg-site listen-port=13231
/ip address add address=10.1.0.2/30 interface=wg-site
/interface wireguard peers add interface=wg-site \
    public-key="PUB_KEY_SITE_A" \
    endpoint-address=ЗОВН_IP_A endpoint-port=13231 \
    allowed-address=10.1.0.1/32,192.168.10.0/24
/ip route add dst-address=192.168.10.0/24 gateway=10.1.0.1

3.2 L2TP/IPSec (Road Warrior — для Windows/iPhone)

# PPP профіль
/ppp profile
add name=vpn-l2tp local-address=10.10.0.1 \
    remote-address=vpn-pool dns-server=8.8.8.8,1.1.1.1 \
    use-compression=no use-encryption=yes

# IP пул для клієнтів
/ip pool add name=vpn-pool ranges=10.10.0.10-10.10.0.100

# L2TP сервер
/interface l2tp-server server
set enabled=yes use-ipsec=required \
    ipsec-secret=MySuperSecretKey \
    default-profile=vpn-l2tp max-mru=1460 max-mtu=1460

# Додати VPN користувачів
/ppp secret
add name=user1 password=Pass123! profile=vpn-l2tp service=l2tp
add name=user2 password=Pass456! profile=vpn-l2tp service=l2tp

# Firewall — дозволити L2TP та IPSec
/ip firewall filter
add chain=input protocol=udp dst-port=500,4500,1701 action=accept \
    comment="L2TP/IPSec ports" place-before=0
add chain=input protocol=ipsec-esp action=accept \
    comment="IPSec ESP" place-before=0
add chain=input protocol=ipsec-ah action=accept \
    comment="IPSec AH" place-before=0

# NAT виняток для VPN трафіку
/ip firewall nat
add chain=srcnat src-address=10.10.0.0/24 action=masquerade

3.3 OpenVPN (OVPN)

# Генерація сертифікатів
/certificate
add name=ca-template common-name=ca key-size=2048 days-valid=3650 \
    key-usage=key-cert-sign,crl-sign
sign ca-template ca-crl-host=192.168.88.1 name=ca

add name=server-template common-name=server key-size=2048 days-valid=3650 \
    key-usage=digital-signature,key-encipherment,tls-server
sign server-template ca=ca name=server

add name=client1-template common-name=client1 key-size=2048 days-valid=3650 \
    key-usage=tls-client
sign client1-template ca=ca name=client1

# OVPN сервер
/interface ovpn-server server
set enabled=yes port=1194 mode=ip protocol=tcp \
    certificate=server ca-certificate=ca \
    cipher=aes256 auth=sha256 \
    default-profile=vpn-ovpn

# PPP профіль
/ppp profile add name=vpn-ovpn local-address=10.20.0.1 \
    remote-address=ovpn-pool

/ip pool add name=ovpn-pool ranges=10.20.0.10-10.20.0.50

# Користувач
/ppp secret add name=vpnuser password=VpnPass123 profile=vpn-ovpn

# Експорт сертифіката клієнта
/certificate export-certificate client1 export-passphrase=CertPass123

3.4 IPSec Site-to-Site (IKEv2)

# === СТОРОНА A ===
/ip ipsec profile
add name=ike2 dh-group=modp2048 enc-algorithm=aes-256 \
    hash-algorithm=sha256 lifetime=8h

/ip ipsec proposal
add name=esp-aes256 auth-algorithms=sha256 enc-algorithms=aes-256-cbc \
    lifetime=4h pfs-group=modp2048

/ip ipsec peer
add name=site-b address=IP_SITE_B exchange-mode=ike2 \
    profile=ike2 send-initial-contact=yes

/ip ipsec identity
add peer=site-b auth-method=pre-shared-key secret=SharedSecret123

/ip ipsec policy
add peer=site-b src-address=192.168.10.0/24 dst-address=192.168.20.0/24 \
    action=encrypt proposal=esp-aes256 tunnel=yes

# Firewall — дозволити IPSec
/ip firewall filter
add chain=input protocol=udp dst-port=500,4500 action=accept
add chain=input protocol=ipsec-esp action=accept

# NAT виняток (важливо!)
/ip firewall nat
add chain=srcnat src-address=192.168.10.0/24 dst-address=192.168.20.0/24 \
    action=accept place-before=0

РОЗДІЛ 4: VLAN — детальне налаштування
4.1 Router-on-a-Stick (один роутер, один trunk)

# Топологія:
# Internet → ether1 (WAN)
# ether2 → Trunk до керованого свіча
# VLAN 10 = Офіс (192.168.10.0/24)
# VLAN 20 = Гості (192.168.20.0/24)
# VLAN 30 = IoT (192.168.30.0/24)

# Крок 1: Створити Bridge
/interface bridge add name=bridge-vlan vlan-filtering=no

# Крок 2: Додати trunk порт до bridge
/interface bridge port add bridge=bridge-vlan interface=ether2

# Крок 3: VLAN інтерфейси на bridge
/interface vlan
add name=vlan10 vlan-id=10 interface=bridge-vlan
add name=vlan20 vlan-id=20 interface=bridge-vlan
add name=vlan30 vlan-id=30 interface=bridge-vlan

# Крок 4: IP адреси
/ip address
add address=192.168.10.1/24 interface=vlan10
add address=192.168.20.1/24 interface=vlan20
add address=192.168.30.1/24 interface=vlan30

# Крок 5: DHCP пули
/ip pool
add name=pool-office ranges=192.168.10.50-192.168.10.200
add name=pool-guest ranges=192.168.20.50-192.168.20.200
add name=pool-iot ranges=192.168.30.50-192.168.30.200

# Крок 6: DHCP сервери
/ip dhcp-server
add name=dhcp-office interface=vlan10 address-pool=pool-office disabled=no
add name=dhcp-guest interface=vlan20 address-pool=pool-guest disabled=no
add name=dhcp-iot interface=vlan30 address-pool=pool-iot disabled=no

/ip dhcp-server network
add address=192.168.10.0/24 gateway=192.168.10.1 dns-server=8.8.8.8
add address=192.168.20.0/24 gateway=192.168.20.1 dns-server=1.1.1.1
add address=192.168.30.0/24 gateway=192.168.30.1 dns-server=8.8.8.8

# Крок 7: Interface Lists для Firewall
/interface list
add name=OFFICE
add name=GUEST
add name=IOT

/interface list member
add list=OFFICE interface=vlan10
add list=GUEST interface=vlan20
add list=IOT interface=vlan30

# Крок 8: Firewall ізоляція
/ip firewall filter
# Гості не бачать Офіс і IoT
add chain=forward in-interface-list=GUEST \
    out-interface-list=OFFICE action=drop comment="Guest can't see Office"
add chain=forward in-interface-list=GUEST \
    out-interface-list=IOT action=drop comment="Guest can't see IoT"
# IoT не бачить нікого
add chain=forward in-interface-list=IOT \
    out-interface-list=OFFICE action=drop comment="IoT isolated"
add chain=forward in-interface-list=IOT \
    out-interface-list=GUEST action=drop comment="IoT isolated"

4.2 VLAN з Bridge VLAN Filtering (рекомендований метод v7)

# Крок 1: Bridge з вимкненим VLAN filtering (спочатку)
/interface bridge
add name=br0 vlan-filtering=no protocol-mode=none

# Крок 2: Додати всі порти
/interface bridge port
add bridge=br0 interface=ether2 comment="Trunk to switch"
add bridge=br0 interface=ether3 pvid=10 comment="Office PC"
add bridge=br0 interface=ether4 pvid=20 comment="Guest port"
add bridge=br0 interface=ether5 pvid=30 comment="IoT port"

# Крок 3: VLAN таблиця
/interface bridge vlan
# Trunk port — всі VLAN теговані
add bridge=br0 tagged=br0,ether2 vlan-ids=10
add bridge=br0 tagged=br0,ether2 vlan-ids=20
add bridge=br0 tagged=br0,ether2 vlan-ids=30
# Access ports — не теговані
add bridge=br0 tagged=ether2 untagged=ether3 vlan-ids=10
add bridge=br0 tagged=ether2 untagged=ether4 vlan-ids=20
add bridge=br0 tagged=ether2 untagged=ether5 vlan-ids=30

# Крок 4: Вмикаємо VLAN filtering
/interface bridge set br0 vlan-filtering=yes

# Крок 5: VLAN інтерфейси
/interface vlan
add name=vlan10 vlan-id=10 interface=br0
add name=vlan20 vlan-id=20 interface=br0
add name=vlan30 vlan-id=30 interface=br0

РОЗДІЛ 5: Hotspot
5.1 Базовий Hotspot

# Крок 1: Підготувати інтерфейс
/interface bridge add name=bridge-hotspot
/interface bridge port add bridge=bridge-hotspot interface=ether3
/ip address add address=10.5.0.1/24 interface=bridge-hotspot

# Крок 2: Запустити майстер
/ip hotspot setup
# (інтерактивний, вибрати interface=bridge-hotspot)

# Або вручну:
/ip pool add name=hs-pool ranges=10.5.0.10-10.5.0.250
/ip dhcp-server add name=hs-dhcp interface=bridge-hotspot \
    address-pool=hs-pool disabled=no
/ip dhcp-server network add address=10.5.0.0/24 gateway=10.5.0.1

/ip hotspot add name=hotspot1 interface=bridge-hotspot \
    address-pool=hs-pool profile=default

# Крок 3: Профілі
/ip hotspot profile
set default hotspot-address=10.5.0.1 \
    login-by=http-chap,http-pap,https \
    ssl-certificate=none use-radius=no

# Крок 4: Користувачі
/ip hotspot user
add name=free password="" limit-uptime=2h comment="Free 2h"
add name=vip password=vip123 profile=vip-profile comment="VIP"
add name=guest1 password=G1pass profile=basic

# Крок 5: Профіль користувача з обмеженнями
/ip hotspot user profile
add name=basic rate-limit=5M/5M session-timeout=2h idle-timeout=30m
add name=vip rate-limit=20M/20M session-timeout=24h
add name=free rate-limit=2M/2M session-timeout=1h

5.2 Hotspot з RADIUS авторизацією

# RADIUS сервер (User Manager на роутері)
/tool user-manager
set enabled=yes

# Або зовнішній RADIUS
/radius
add service=hotspot address=192.168.88.100 secret=RadiusSecret \
    timeout=3000ms

/ip hotspot profile set default use-radius=yes

РОЗДІЛ 6: Маршрутизація
6.1 OSPF (RouterOS v7)

# Крок 1: OSPF Instance
/routing ospf instance
add name=ospf-main router-id=10.0.0.1 version=2

# Крок 2: OSPF Area
/routing ospf area
add name=backbone area-id=0.0.0.0 instance=ospf-main type=default

# Крок 3: Інтерфейси
/routing ospf interface-template
add area=backbone interfaces=ether1,ether2 type=broadcast cost=10
add area=backbone interfaces=ether3 type=ptp cost=1 comment="Fast link"

# Крок 4: Перерозподіл маршрутів
/routing ospf instance
set ospf-main redistribute=connected,static

# Крок 5: Перевірка
/routing ospf neighbor print          # сусіди
/routing ospf lsa print               # LSA база
/ip route print where ospf            # OSPF маршрути

6.2 BGP (RouterOS v7)

# Крок 1: BGP Template
/routing bgp template
add name=default as=65001 \
    router-id=1.2.3.4 \
    hold-time=90 keepalive-time=30

# Крок 2: Підключення до upstream
/routing bgp connection
add name=upstream-isp \
    remote.address=1.2.3.1 remote.as=65000 \
    local.role=ebgp \
    templates=default \
    output.filter-chain=bgp-out-filter \
    input.filter-chain=bgp-in-filter

# Крок 3: Фільтри
/routing filter rule
add chain=bgp-in-filter \
    rule="if (bgp-path-len > 4) { reject }"

add chain=bgp-in-filter \
    rule="if (dst in 0.0.0.0/0) { accept }"

add chain=bgp-out-filter \
    rule="if (dst == 10.0.0.0/24) { accept } else { reject }"

# Крок 4: Оголошення мереж
/routing bgp network
add network=10.0.0.0/24 synchronize=no

# Крок 5: Перевірка
/routing bgp session print            # сесії
/routing bgp advertisements print     # що оголошуємо
/ip route print where bgp             # BGP маршрути

6.3 Multi-WAN Failover + Load Balance

# === FAILOVER (основний/резервний) ===
# Два провайдери:
# WAN1 = ether1, gateway 1.2.3.1
# WAN2 = ether2, gateway 5.6.7.1

# Рекурсивні маршрути для перевірки доступності
/ip route
add dst-address=8.8.8.8/32 gateway=1.2.3.1 distance=1 \
    comment="WAN1 check route"
add dst-address=8.8.4.4/32 gateway=5.6.7.1 distance=1 \
    comment="WAN2 check route"

# Default routes з різними відстанями
add dst-address=0.0.0.0/0 gateway=8.8.8.8 distance=1 \
    check-gateway=ping comment="WAN1-MAIN"
add dst-address=0.0.0.0/0 gateway=8.8.4.4 distance=2 \
    check-gateway=ping comment="WAN2-BACKUP"

# NAT для обох
/ip firewall nat
add chain=srcnat out-interface=ether1 action=masquerade
add chain=srcnat out-interface=ether2 action=masquerade

# === LOAD BALANCE (розподіл навантаження) ===
/ip route
add dst-address=0.0.0.0/0 gateway=1.2.3.1,5.6.7.1 \
    check-gateway=ping comment="Load Balance"

# Mangle для PCC (Per Connection Classifier)
/ip firewall mangle
add chain=prerouting in-interface=bridge-lan \
    per-connection-classifier=src-address-and-dst-address:2/0 \
    action=mark-connection new-connection-mark=WAN1 passthrough=yes
add chain=prerouting in-interface=bridge-lan \
    per-connection-classifier=src-address-and-dst-address:2/1 \
    action=mark-connection new-connection-mark=WAN2 passthrough=yes

add chain=prerouting connection-mark=WAN1 in-interface=bridge-lan \
    action=mark-routing new-routing-mark=to-WAN1 passthrough=no
add chain=prerouting connection-mark=WAN2 in-interface=bridge-lan \
    action=mark-routing new-routing-mark=to-WAN2 passthrough=no

# Routing таблиці
/ip route
add dst-address=0.0.0.0/0 gateway=1.2.3.1 routing-table=to-WAN1
add dst-address=0.0.0.0/0 gateway=5.6.7.1 routing-table=to-WAN2

РОЗДІЛ 7: Безпека — повний чекліст
7.1 Базовий захист нового роутера

# 1. Змінити пароль адміна
/user set admin password=StrongPassword123!

# 2. Додати нового адміна, вимкнути admin
/user add name=myadmin password=StrongPass123! group=full
/user disable admin

# 3. Вимкнути непотрібні сервіси
/ip service
disable telnet
disable ftp
disable www
disable api
disable api-ssl
set ssh port=2222           # змінити порт SSH зі стандартного

# 4. Обмежити доступ до сервісів по IP
/ip service
set winbox address=192.168.88.0/24      # тільки LAN
set ssh address=192.168.88.0/24         # тільки LAN
set www-ssl address=192.168.88.0/24

# 5. Вимкнути непотрібні клієнтські пакети
/ip neighbor discovery-settings set discover-interface-list=LAN

# 6. Вимкнути proxy
/ip proxy set enabled=no

# 7. Вимкнути bandwidth test сервер
/tool bandwidth-server set enabled=no

# 8. Захист Winbox
/tool mac-server set allowed-interface-list=LAN
/tool mac-server ping set enabled=no

7.2 Повний захист Firewall (copy-paste)

# === INPUT CHAIN (захист самого роутера) ===
/ip firewall filter

# Дозволити вже встановлені з'єднання
add chain=input connection-state=established,related,untracked \
    action=accept comment="Accept established"

# Дропнути невалідні
add chain=input connection-state=invalid \
    action=drop comment="Drop invalid"

# Дозволити ICMP з WAN (ping до роутера)
add chain=input in-interface-list=WAN protocol=icmp \
    action=accept comment="Accept ICMP"

# Захист від brute-force SSH/Winbox
add chain=input protocol=tcp dst-port=2222,8291 \
    src-address-list=brute-force action=drop \
    comment="Block brute-force"
add chain=input protocol=tcp dst-port=2222,8291 \
    connection-limit=3,32 action=add-src-to-address-list \
    address-list=brute-force address-list-timeout=1d \
    comment="Detect brute-force"

# Дозволити LAN доступ до роутера
add chain=input in-interface-list=LAN action=accept \
    comment="Accept from LAN"

# Заблокувати все інше з WAN
add chain=input in-interface-list=WAN action=drop \
    comment="Drop WAN input"

# === FORWARD CHAIN (трафік через роутер) ===
# FastTrack для продуктивності
add chain=forward action=fasttrack-connection \
    connection-state=established,related hw-offload=yes \
    comment="FastTrack"
add chain=forward connection-state=established,related \
    action=accept comment="Accept established forward"
add chain=forward connection-state=invalid \
    action=drop comment="Drop invalid forward"

# Дозволити LAN → WAN
add chain=forward in-interface-list=LAN out-interface-list=WAN \
    action=accept comment="LAN to WAN"

# Дозволити port-forward трафік
add chain=forward connection-nat-state=dstnat \
    action=accept comment="Port forwards"

# Дропнути все інше
add chain=forward action=drop comment="Drop all else"

# === ЗАХИСТ від port scan ===
add chain=input protocol=tcp psd=21,3s,3,1 \
    action=add-src-to-address-list address-list=port-scanners \
    address-list-timeout=2w comment="Port scanner detect"
add chain=input src-address-list=port-scanners \
    action=drop comment="Drop port scanners"

7.3 WiFi безпека

# WPA3 (v7)
/interface wifi security
set [find] authentication-types=wpa2-psk,wpa3-psk \
    ft=yes ft-over-ds=yes \
    management-protection=allowed

# Приховати SSID (не рекомендується, але якщо потрібно)
/interface wifi set wlan1 hide-ssid=yes

# Вимкнути WPS
/interface wifi set wlan1 wps=disable

# MAC фільтрація (обмежена безпека)
/interface wifi access-list
add mac-address=AA:BB:CC:DD:EE:FF action=accept comment="My laptop"
add action=reject comment="Block everyone else"

# Гостьова мережа з ізоляцією клієнтів
/interface wifi
add name=guest-wifi ssid=GuestNetwork master-interface=wlan1 \
    security.authentication-types=wpa2-psk \
    security.passphrase=GuestPass123 \
    station-bridge-clone-mac="" \
    isolate-stations=yes

# Обмежити швидкість гостей
/queue simple
add name=guest-limit target=192.168.20.0/24 max-limit=5M/5M

РОЗДІЛ 8: Моніторинг та автоматизація
8.1 Netwatch — реакція на події

# Моніторинг WAN каналу
/tool netwatch
add host=8.8.8.8 interval=30s timeout=1s \
    up-script={
        /log info "WAN UP"
        /ip route enable [find comment="WAN1-MAIN"]
    } \
    down-script={
        /log warning "WAN DOWN - switching to backup"
        /ip route disable [find comment="WAN1-MAIN"]
    }

# Telegram сповіщення при падінні сервера
/tool netwatch
add host=192.168.88.100 interval=60s timeout=2s \
    down-script={
        :local token "YOUR_BOT_TOKEN"
        :local chatid "YOUR_CHAT_ID"
        :local msg "Server 192.168.88.100 is DOWN!"
        /tool fetch url=("https://api.telegram.org/bot" . $token \
            . "/sendMessage?chat_id=" . $chatid . "&text=" . $msg) \
            keep-result=no
    }

8.2 Корисні скрипти
Автоматичне резервне копіювання на FTP

/system script add name=backup-ftp source={
    :local date [/system clock get date]
    :local name [/system identity get name]
    :local filename ($name . "-" . $date)
    /system backup save name=$filename
    :delay 5s
    /export file=$filename
    :delay 5s
    /tool fetch address=192.168.88.100 src-path=($filename . ".backup") \
        user=ftpuser password=ftppass upload=yes mode=ftp
    /tool fetch address=192.168.88.100 src-path=($filename . ".rsc") \
        user=ftpuser password=ftppass upload=yes mode=ftp
    :delay 5s
    /file remove [find name~$filename]
    /log info ("Backup completed: " . $filename)
}

/system scheduler
add name=daily-backup interval=1d start-time=03:00:00 \
    on-event=backup-ftp

Авто-блокування динамічного списку IP

/system script add name=update-blacklist source={
    /tool fetch url="https://example.com/blacklist.txt" \
        dst-path=blacklist.txt
    :delay 3s
    :local content [/file get blacklist.txt contents]
    /ip firewall address-list remove [find list=blacklist comment="auto"]
    :foreach line in=[:toarray $content] do={
        :if ([:len $line] > 6) do={
            /ip firewall address-list add list=blacklist \
                address=$line comment="auto" timeout=24h
        }
    }
    /file remove [find name=blacklist.txt]
    /log info "Blacklist updated"
}

/system scheduler add name=update-bl interval=6h on-event=update-blacklist

Перезавантаження PPPoE при падінні

/system script add name=pppoe-check source={
    :if ([/interface pppoe-client get [find name=pppoe-out] running] = false) do={
        /interface pppoe-client disable [find name=pppoe-out]
        :delay 5s
        /interface pppoe-client enable [find name=pppoe-out]
        /log warning "PPPoE reconnected"
    }
}

/system scheduler add name=check-pppoe interval=5m on-event=pppoe-check

8.3 SNMP для Zabbix/Prometheus

# Налаштування SNMP v2
/snmp
set enabled=yes contact="admin@company.com" \
    location="Server Room" \
    trap-version=2

/snmp community
set [find name=public] addresses=192.168.88.100/32 \
    security=private read-access=yes write-access=no

/snmp trap
add dst-address=192.168.88.100 community=public version=2

# OID для Zabbix:
# CPU load:    1.3.6.1.4.1.14988.1.1.3.14.0
# Free RAM:    1.3.6.1.4.1.14988.1.1.3.6.0
# Total RAM:   1.3.6.1.4.1.14988.1.1.3.5.0
# Uptime:      1.3.6.1.2.1.1.3.0
# Interface traffic: 1.3.6.1.2.1.2.2.1.10/16

РОЗДІЛ 9: Container (Docker) — RouterOS v7
9.1 Підготовка

# Потрібен пакет container (завантажити з mikrotik.com)
# Мінімум RAM: 512MB (рекомендовано 1GB+)
# Потрібен диск/USB

# Встановити пакет
/system package install container

# Дозволити container в device-mode
/system device-mode update container=yes
# ВАЖЛИВО: потрібен фізичний ребут (не soft reboot)

# Після ребуту налаштувати
/interface veth add name=veth1 address=172.17.0.2/16 gateway=172.17.0.1
/interface bridge add name=docker-bridge
/interface bridge port add bridge=docker-bridge interface=veth1
/ip address add address=172.17.0.1/16 interface=docker-bridge
/ip firewall nat add chain=srcnat action=masquerade src-address=172.17.0.0/16

/container config set registry-url=https://registry-1.docker.io \
    tmpdir=disk1/tmp

9.2 Запуск контейнерів

# Nginx веб-сервер
/container add remote-image=nginx:alpine interface=veth1 \
    root-dir=disk1/nginx logging=yes \
    start-on-boot=yes

# Pi-hole DNS blocker
/interface veth add name=veth-pihole address=172.17.0.3/16 gateway=172.17.0.1
/container add remote-image=pihole/pihole:latest interface=veth-pihole \
    root-dir=disk1/pihole logging=yes \
    env=TZ=Europe/Kiev,WEBPASSWORD=admin

# Управління
/container print                  # список контейнерів
/container start [find]           # запустити
/container stop [find]            # зупинити
/container shell [find number=0]  # термінал в контейнер

РОЗДІЛ 10: IPv6

# DHCPv6 клієнт (від провайдера)
/ipv6 dhcp-client
add interface=ether1 request=prefix pool-name=ipv6-pool \
    pool-prefix-length=64 add-default-route=yes use-peer-dns=yes

# SLAAC для LAN (автоматична роздача IPv6)
/ipv6 address
add address=::1/64 from-pool=ipv6-pool interface=bridge-lan advertise=yes

# Статичний IPv6 (якщо провайдер дав /48)
/ipv6 address
add address=2001:db8:1::1/64 interface=bridge-lan advertise=yes

# IPv6 Firewall
/ipv6 firewall filter
add chain=input connection-state=established,related action=accept
add chain=input connection-state=invalid action=drop
add chain=input protocol=icmpv6 action=accept
add chain=input in-interface=ether1 action=drop

/ipv6 firewall filter
add chain=forward connection-state=established,related action=accept
add chain=forward connection-state=invalid action=drop
add chain=forward in-interface=bridge-lan out-interface=ether1 action=accept
add chain=forward in-interface=ether1 connection-nat-state=dstnat action=accept
add chain=forward action=drop

# DNS для IPv6
/ipv6 settings set max-neighbor-entries=8192

# Перевірка
/ipv6 address print
/ping 2001:4860:4860::8888 count=4

РОЗДІЛ 11: Таблиця частих помилок та рішень
СИМПТОМ
ПРИЧИНА
РІШЕННЯ
bad command name START
Команда не існує в ROS
Перевірити ? в CLI
login failure for user admin
Неправильний логін
Перевірити user/pass
401 Unauthorized REST API
Неправильний Basic Auth
Перевірити credentials
Немає інтернету
Немає default route
/ip route add 0.0.0.0/0 gw=...
WiFi не роздає IP
DHCP не на bridge
Перенести DHCP на bridge
VLAN не працює
pvid або tagged неправильно
Перевірити bridge vlan print
SSH не підключається
Firewall або порт змінено
Перевірити ip service та firewall
Повільний IPSec
Немає HW offload
/ip ipsec policy set use-compression=no
WireGuard не з'єднується
UDP заблокований
Перевірити firewall filter chain=input
Роутер перезавантажується
Перегрів або БП
/system health print
DNS не резолвить
DNS не налаштовано
/ip dns set servers=8.8.8.8
CAPsMAN не бачить CAP
Firewall або VLAN
/caps-man remote-cap print
arpList.forEach error
API повернув об'єкт
Перевірити Array.isArray
Втрачений доступ після VLAN
pvid неправильний
Підключитись серійно, виправити pvid
Netinstall не бачить плату
WiFi адаптер
Використати Ethernet
Container не запускається
Мало RAM або диску
/system resource print
OSPF сусіди не піднімаються
MTU або таймери
/routing ospf neighbor print
BGP не отримує маршрути
Фільтр блокує
/routing bgp session print

