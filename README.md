# -*- coding: utf-8 -*-
import subprocess

README = """\
# 🛡️ MikroTik Manager — Розумна робоча станція мережевого інженера

> **Не просто черговий клієнт для MikroTik.**
> Це повноцінна платформа з вбудованим AI Agent, який розуміє твою мережу,
> знаходить проблеми і виправляє їх — поки ти п'єш каву.

[![Build EXE](https://github.com/Drepa666/mikrotik-config-generator/actions/workflows/build.yml/badge.svg)](https://github.com/Drepa666/mikrotik-config-generator/actions)
[![Release](https://img.shields.io/github/v/release/Drepa666/mikrotik-config-generator?label=остання%20версія&color=5fd0a5)](https://github.com/Drepa666/mikrotik-config-generator/releases)
[![Electron](https://img.shields.io/badge/Electron-44-47848F?logo=electron&logoColor=white)](https://electronjs.org)
[![RouterOS](https://img.shields.io/badge/RouterOS-6.x%20%7C%207.x-CC0000)](https://mikrotik.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 🚀 [Завантажити EXE](https://github.com/Drepa666/mikrotik-config-generator/releases) | [Demo онлайн](https://drepa666.github.io/mikrotik-config-generator/)

---

## 🤖 AI Agent — твій особистий мережевий інженер

> *"Замість того щоб гуглити синтаксис RouterOS — просто скажи AI що потрібно"*

AI Agent вбудований прямо в інтерфейс і має **повний доступ до роутера**:
він не просто генерує команди — він їх **виконує, перевіряє результат і звітує**.

### Що вміє AI Agent:

**🔍 Аналіз і діагностика**
- Автоматично аналізує Firewall при відкритті розділу — знаходить дублікати, мертві правила, security дірки
- Перевіряє стан інтерфейсів — помічає помилки, flapping, неправильний MTU
- Моніторить Dashboard — попереджає про критичне навантаження CPU/RAM
- Аналізує маршрути — знаходить петлі, відсутній default route, конфліктуючі маршрути

**⚡ Виконання команд**
- Генерує **готові RouterOS команди** за описом українською мовою
- Виконує команди **по одній через SSH** — бачиш результат кожної
- Автоматично виправляє синтаксис (лапки, формат параметрів)
- Fallback: якщо REST API недоступний — виконує через SSH

**🔒 Security Audit**
- Одним кліком перевіряє весь Firewall на вразливості
- Знаходить відкриті порти з WAN, відсутній brute-force захист
- Пропонує конкретні команди для виправлення з поясненнями

**💬 Природна взаємодія**
Ти: "Заблокуй всі підключення з 185.220.101.0/24"
AI Agent: Виконую...
✅ /ip firewall filter add chain=input src-address=185.220.101.0/24 action=drop comment="block suspicious"
✅ Правило додано на позицію #3


**🛠️ Підтримка 6 AI провайдерів**

| Провайдер | Модель за замовчуванням | Безкоштовно |
|-----------|------------------------|-------------|
| 🟢 **Groq** | llama3-70b-8192 | ✅ Так |
| 🟢 **Gemini** | gemini-2.0-flash | ✅ Так |
| 🔵 **DeepSeek** | deepseek-chat | 💲 Дешево |
| 🟠 **OpenAI** | gpt-4o-mini | 💲 |
| 🟣 **Anthropic** | claude-3-5-sonnet | 💲 |
| ⚫ **Grok** | grok-2 | 💲 |

---

## 🖥️ Router Manager — повний контроль над роутером

### 📊 Dashboard
- Реальні метрики в реальному часі: CPU, RAM, Uptime, Temperature
- **Traffic Monitor** з живим графіком по кожному інтерфейсу
- Стан всіх інтерфейсів одним поглядом
- Швидкий доступ до будь-якого розділу

### 🔥 Firewall
- **Drag-and-drop** зміна порядку правил — як у Winbox, але краще
- Повний CRUD: Filter / NAT / Mangle / Address Lists
- Кольорове виділення: 🟢 accept / 🔴 drop / 🟡 reject
- Multi-select, bulk enable/disable, пошук по всіх полях
- AI аналіз правил одним кліком — знаходить проблеми за секунди

### 🌐 Мережеві розділи
- **Interfaces** — всі інтерфейси, статистика, enable/disable
- **IP Addresses** — управління адресами
- **Routes** — таблиця маршрутизації
- **DHCP** — сервер, leases, пули адрес
- **DNS** — static entries
- **ARP** — таблиця ARP

### 📡 Wireless / CAPsMAN
- Управління Wi-Fi інтерфейсами
- **CAPsMAN** — централізоване управління точками доступу
- Перегляд підключених клієнтів

### 🔐 VPN / Тунелі
- **WireGuard** — управління peers, генерація конфігурацій
- **PPP** — PPPoE, L2TP, PPTP secrets

### ⚙️ Система
- **Users** — облікові записи
- **Scheduler** — задачі за розкладом
- **Scripts** — запуск/видалення скриптів
- **VLAN** / **Bridge** — налаштування
- **Queue** — управління чергами

### 💻 SSH Термінал
- Повноцінний термінал прямо в додатку
- Автодоповнення команд Tab
- Навігація по історії стрілками ↑↓
- Auto-reconnect кожні 30 секунд
- Macro запис і відтворення команд

---

## 🔍 Мережевий сканер

> *"Хто підключений до моєї мережі прямо зараз?"*

- **Сканування підмережі** — знаходить всі активні пристрої
- Визначення виробника за MAC адресою (OUI база)
- Ping, hostname, відкриті порти для кожного пристрою
- **Port Scanner** — перевірка відкритих портів
- Імпорт знайдених пристроїв в Router Manager

---

## 🗺️ Візуальна топологія мережі

> *"Одним поглядом бачиш всю мережу"*

- **Інтерактивна карта** всіх підключених пристроїв
- Drag-and-drop розташування вузлів
- Автоматичне виявлення топології через LLDP/CDP
- Кольорове кодування: роутери / свічі / точки доступу / клієнти
- Збереження і відновлення карти
- Клік на пристрій → підключення і управління

---

## ⚙️ Генератор конфігурацій

Новий роутер? Заповни форму — отримай готовий `.rsc` файл:

**Підтримувані моделі:**
hAP ac lite / ac2 / ac3 / ax2 / ax3 / ax S · hEX · wAP ac · cAP ac ·
Chateau LTE7 ax / LTE12 / 5G ax / PRO ax · будь-яка інша

**Налаштування:**
- WAN: DHCP / PPPoE / Static / Failover / LTE
- Firewall з brute-force захистом
- Wi-Fi з WPA2/WPA3
- VPN (WireGuard / L2TP / PPTP)
- VLAN / QoS / CAPsMAN
- Автобекап перед змінами

**AI аналіз `.rsc` файлів:**
- Завантаж існуючий конфіг → AI пояснить що він робить
- Знайде вразливості і запропонує виправлення

---

## 🚀 Швидкий старт

### Варіант 1: Завантажити EXE (рекомендовано)

Завантаж MikroTik Manager Setup X.X.X.exe з Releases
Встанови (Next → Next → Finish)
Запусти з робочого столу


### Варіант 2: З вихідного коду
```bash
git clone https://github.com/Drepa666/mikrotik-config-generator.git
cd mikrotik-config-generator
npm install
npm start
Вимоги: Node.js 20+, Python 3.8+

⌨️ Гарячі клавіші
КЛАВІША
ДІЯ
F9
Safe Mode — автовідкат якщо зламаєш доступ
Ctrl+L
Відкрити / закрити AI Agent
Ctrl+F
Пошук по поточному розділу
Ctrl+A
Вибрати всі рядки в таблиці
Del
Видалити вибрані рядки
Tab
Автодоповнення в SSH терміналі
↑ ↓
Навігація по історії команд


🔒 Безпека
🔑 API ключі зберігаються тільки в пам'яті — не записуються на диск
🔐 Credentials роутерів — тільки локально, нікуди не передаються
🛡️ Safe Mode (F9) — якщо правило заблокує доступ, роутер сам відкатиться
🔒 Всі команди — через зашифрований SSH
📸 Можливості в цифрах
🤖 AI провайдерів
6 (Groq, Gemini, OpenAI, Claude, Grok, DeepSeek)
📋 Розділів Router Manager
20+
🔥 Типів Firewall правил
Filter / NAT / Mangle / Raw
🖥️ Моделей MikroTik
14+ (+ довільна)
📡 RouterOS версій
6.x / 7.x / 7.13+
🌍 Мова інтерфейсу
Українська

README = """\
# 🛡️ MikroTik Manager — Розумна робоча станція мережевого інженера

> **Не просто черговий клієнт для MikroTik.**
> Це повноцінна платформа з вбудованим AI Agent, який розуміє твою мережу,
> знаходить проблеми і виправляє їх — поки ти п'єш каву.

[![Build EXE](https://github.com/Drepa666/mikrotik-config-generator/actions/workflows/build.yml/badge.svg)](https://github.com/Drepa666/mikrotik-config-generator/actions)
[![Release](https://img.shields.io/github/v/release/Drepa666/mikrotik-config-generator?label=остання%20версія&color=5fd0a5)](https://github.com/Drepa666/mikrotik-config-generator/releases)
[![Electron](https://img.shields.io/badge/Electron-44-47848F?logo=electron&logoColor=white)](https://electronjs.org)
[![RouterOS](https://img.shields.io/badge/RouterOS-6.x%20%7C%207.x-CC0000)](https://mikrotik.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 🚀 [Завантажити EXE](https://github.com/Drepa666/mikrotik-config-generator/releases) | [Demo онлайн](https://drepa666.github.io/mikrotik-config-generator/)

---

## 🤖 AI Agent — твій особистий мережевий інженер

> *"Замість того щоб гуглити синтаксис RouterOS — просто скажи AI що потрібно"*

AI Agent вбудований прямо в інтерфейс і має **повний доступ до роутера**:
він не просто генерує команди — він їх **виконує, перевіряє результат і звітує**.

### Що вміє AI Agent:

**🔍 Аналіз і діагностика**
- Автоматично аналізує Firewall при відкритті розділу — знаходить дублікати, мертві правила, security дірки
- Перевіряє стан інтерфейсів — помічає помилки, flapping, неправильний MTU
- Моніторить Dashboard — попереджає про критичне навантаження CPU/RAM
- Аналізує маршрути — знаходить петлі, відсутній default route, конфліктуючі маршрути

**⚡ Виконання команд**
- Генерує **готові RouterOS команди** за описом українською мовою
- Виконує команди **по одній через SSH** — бачиш результат кожної
- Автоматично виправляє синтаксис (лапки, формат параметрів)
- Fallback: якщо REST API недоступний — виконує через SSH

**🔒 Security Audit**
- Одним кліком перевіряє весь Firewall на вразливості
- Знаходить відкриті порти з WAN, відсутній brute-force захист
- Пропонує конкретні команди для виправлення з поясненнями

**💬 Природна взаємодія**
Ти: "Заблокуй всі підключення з 185.220.101.0/24"
AI Agent: Виконую...
✅ /ip firewall filter add chain=input src-address=185.220.101.0/24 action=drop comment="block suspicious"
✅ Правило додано на позицію #3


Згорнути
Зберегти
Копіювати
58
59
60
61
62
63
64
65
66
67
68
69
70
71
72
73
74
75
76
77
78
79
80
81
82
83
84
85
86
87
88
89
90
91
92
93
94
95
96
97
98
99
100
101
102
103
104
105
106
107
108
109
110
111
112
| 🔵 **DeepSeek** | deepseek-chat | 💲 Дешево |
- Auto-reconnect кожні 30 секунд
- Macro запис і відтворення команд

---

## 🔍 Мережевий сканер

> *"Хто підключений до моєї мережі прямо зараз?"*

- **Сканування підмережі** — знаходить всі активні пристрої
- Визначення виробника за MAC адресою (OUI база)
- Ping, hostname, відкриті порти для кожного пристрою
- **Port Scanner** — перевірка відкритих портів
- Імпорт знайдених пристроїв в Router Manager

---

## 🗺️ Візуальна топологія мережі

> *"Одним поглядом бачиш всю мережу"*

- **Інтерактивна карта** всіх підключених пристроїв
- Drag-and-drop розташування вузлів
- Автоматичне виявлення топології через LLDP/CDP
- Кольорове кодування: роутери / свічі / точки доступу / клієнти
- Збереження і відновлення карти
- Клік на пристрій → підключення і управління

---

## ⚙️ Генератор конфігурацій

Новий роутер? Заповни форму — отримай готовий `.rsc` файл:

**Підтримувані моделі:**
hAP ac lite / ac2 / ac3 / ax2 / ax3 / ax S · hEX · wAP ac · cAP ac ·
Chateau LTE7 ax / LTE12 / 5G ax / PRO ax · будь-яка інша

**Налаштування:**
- WAN: DHCP / PPPoE / Static / Failover / LTE
- Firewall з brute-force захистом
- Wi-Fi з WPA2/WPA3
- VPN (WireGuard / L2TP / PPTP)
- VLAN / QoS / CAPsMAN
- Автобекап перед змінами

**AI аналіз `.rsc` файлів:**
- Завантаж існуючий конфіг → AI пояснить що він робить
- Знайде вразливості і запропонує виправлення

---

## 🚀 Швидкий старт

### Варіант 1: Завантажити EXE (рекомендовано)
Завантаж MikroTik Manager Setup X.X.X.exe з Releases
Встанови (Next → Next → Finish)
Запусти з робочого столу

Згорнути
Зберегти
Копіювати
1
2
3
4
5
6
7

### Варіант 2: З вихідного коду
```bash
git clone https://github.com/Drepa666/mikrotik-config-generator.git
cd mikrotik-config-generator
npm install
npm start
Вимоги: Node.js 20+, Python 3.8+

🤖 Підключення AI Agent (5 хвилин)

Згорнути
Зберегти
Копіювати
1
2
3
4
5
6
1. Отримай безкоштовний ключ Groq: https://console.groq.com
   (реєстрація 1 хвилина, 6000 запитів/день безкоштовно)

2. В додатку: "AI-генерація команд" → вставити ключ → Зберегти

3. Натисни кнопку 🤖 внизу праворуч → друкуй запит → Enter
⌨️ Гарячі клавіші
Клавіша
Дія
F9
Safe Mode — автовідкат якщо зламаєш доступ
Ctrl+L
Відкрити / закрити AI Agent
Ctrl+F
Пошук по поточному розділу
Ctrl+A
Вибрати всі рядки в таблиці
Del
Видалити вибрані рядки
Tab
Автодоповнення в SSH терміналі
↑ ↓
Навігація по історії команд


🔒 Безпека
🔑 API ключі зберігаються тільки в пам'яті — не записуються на диск
🔐 Credentials роутерів — тільки локально, нікуди не передаються
🛡️ Safe Mode (F9) — якщо правило заблокує доступ, роутер сам відкатиться
🔒 Всі команди — через зашифрований SSH
📸 Можливості в цифрах
🤖 AI провайдерів
6 (Groq, Gemini, OpenAI, Claude, Grok, DeepSeek)
📋 Розділів Router Manager
20+
🔥 Типів Firewall правил
Filter / NAT / Mangle / Raw
🖥️ Моделей MikroTik
14+ (+ довільна)
📡 RouterOS версій
6.x / 7.x / 7.13+
🌍 Мова інтерфейсу
Українська


🗺️ Що далі

AI підказки в кожному розділі в реальному часі

WebSocket для live Traffic Monitor

UniFi / TP-Link Omada / pfSense підтримка

Git-подібна історія змін конфігурації

Командна робота (sync між інженерами)
📄 Ліцензія
MIT © 2025 MikroTik Manager

<div align="center">
⭐ Якщо проєкт корисний — постав зірку!
Зроблено з ❤️ для мережевих інженерів України

Winbox — це минуле. MikroTik Manager — це сьогодення.
