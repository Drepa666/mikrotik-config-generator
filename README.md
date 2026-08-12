\# 🛰️ MikroTik Config Generator



> Генератор конфігурації RouterOS — один HTML-файл, нульові залежності, працює офлайн.



!\[RouterOS](https://img.shields.io/badge/RouterOS-6.x%20%7C%207.x%20%7C%207.13%2B-blue)

!\[PWA](https://img.shields.io/badge/PWA-offline%20ready-green)

!\[License](https://img.shields.io/badge/license-MIT-orange)



\## ✨ Можливості



| Функція | Опис |

|---|---|

| 🔧 Генератор | Realtime генерація `.rsc` скриптів для RouterOS |

| 🤖 AI інтеграція | 6 провайдерів: Claude, GPT, Grok, Groq, DeepSeek, Gemini |

| 🔍 Diff viewer | Порівняння `.rsc` файлів (LCS алгоритм) |

| ✅ Валідація | Realtime перевірка 20+ полів форми |

| 🎨 Highlighting | Syntax highlighting RouterOS команд |

| 📱 PWA | Встановлюється як застосунок, працює офлайн |

| 🔐 Безпека | API ключ не зберігається в localStorage |



\## 📦 Структура

📂 mikrotik-config-generator/

├── index.html ← головний файл (весь UI + логіка)

├── core.js ← спільні утиліти (isIPv4, isCIDR, q, calcNet...)

├── sw.js ← Service Worker (офлайн кеш)

├── manifest.webmanifest ← PWA маніфест

├── test.html ← unit тести (core.js)

├── icon-192.png ← PWA іконка

└── icon-512.png ← PWA іконка (maskable)



🛠️ Підтримувані конфігурації

Моделі RouterOS

hAP ac lite / ac2 / ac3

hAP ax2 / ax3 / ax S (Wi-Fi 6)

hEX, wAP ac, cAP ac

Chateau LTE7/LTE12/5G/PRO ax

Будь-яка інша (вручну)



🔐 Безпека

q() — екранує \\ $ " % \\n \\r перед вставкою в RouterOS скрипт

isMac() — валідація MAC-адреси перед вставкою

distance — обмежено 1-255 (RouterOS ліміт)

API ключ не зберігається в localStorage і не експортується з профілем

confirm() попередження перед експортом профілів з паролями



Тестує реальні функції з core.js:



q() — 15 тест-кейсів

isIPv4() — 11 тест-кейсів

isCIDR() — 10 тест-кейсів

isPort() — 8 тест-кейсів

isMac() — 8 тест-кейсів

calcNet() — 10 тест-кейсів

📋 Валідація полів (realtime)

ПОЛЕ

ПЕРЕВІРКА

LAN/WAN IP

isCIDR()

DHCP діапазон

Формат + однакова мережа /24

DNS поля

isIPv4() кожен через кому

Port Forwarding

proto:port:IP:port

WireGuard peers

base64 key 44 символи + CIDR

IPsec peers

PSK мін.8 символів + ike1/ike2

IPsec policies

peer:CIDR:CIDR

Address-List

IPv4 або CIDR

Static routes

CIDR=IP:distance (1-255)

DNS static

ім'я=IP + перевірка дублів

OpenVPN range

IP-IP + порядок + підмережа

OpenVPN users

Логін + пароль мін.8 + слабкі паролі

MAC адреса

isMac() regex

