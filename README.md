# MikroTik Config Generator

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-5fd0a5?logo=github)](https://drepa666.github.io/mikrotik-config-generator/)
[![RouterOS](https://img.shields.io/badge/RouterOS-6.x%20|%207.x%20|%207.13%2B-blue)](https://mikrotik.com)
[![PWA](https://img.shields.io/badge/PWA-Offline%20Ready-orange)](https://drepa666.github.io/mikrotik-config-generator/)
[![Tests](https://img.shields.io/badge/Unit%20Tests-53%2F53-5fd0a5)](https://drepa666.github.io/mikrotik-config-generator/test.html)

> Генератор конфігурації RouterOS — один HTML-файл, нульові залежності, працює офлайн.

## Demo

**https://drepa666.github.io/mikrotik-config-generator/**

## Можливості

| Функція | Опис |
|---|---|
| Генератор | Realtime генерація .rsc скриптів |
| AI | 6 провайдерів: Claude, GPT, Grok, Groq, DeepSeek, Gemini |
| Diff viewer | LCS алгоритм порівняння .rsc файлів |
| Валідація | Realtime перевірка 20+ полів форми |
| Highlighting | Syntax highlighting RouterOS команд |
| PWA | Офлайн режим, встановлюється як застосунок |
| Безпека | API ключ не в localStorage, екранування q() |

## Структура

    mikrotik-config-generator/
     ├── index.html            - UI + логіка генерації
     ├── core.js               - утиліти (isIPv4, isCIDR, q, calcNet)
     ├── validators.js         - inline валідація форми
     ├── sw.js                 - Service Worker (PWA офлайн)
     ├── manifest.webmanifest  - PWA маніфест
     ├── test.html             - Unit тести
     ├── icon-192.png
     └── icon-512.png

## Швидкий старт

    git clone https://github.com/Drepa666/mikrotik-config-generator.git
    cd mikrotik-config-generator
    python -m http.server 8080

## RouterOS підтримка

| Версія | Wi-Fi API | WireGuard | OpenVPN GCM |
|---|---|---|---|
| 7.13+ | /interface wifi | Yes | Yes |
| 7.1-7.12 | /interface wifiwave2 | Yes | No |
| 6.x | /interface wireless | No | No |

## Безпека

- q() — екранує \ $ " % newline перед вставкою в .rsc
- isMac() — валідація MAC перед вставкою
- distance — обмежено 1-255 (RouterOS ліміт)
- API ключ не зберігається в localStorage
- confirm() перед експортом профілів з паролями

## Unit тести

    http://localhost:8080/test.html

| Suite | Тестів |
|---|---|
| q() екранування | 13 |
| isIPv4() | 10 |
| isCIDR() | 9 |
| isPort() | 7 |
| isMac() | 7 |
| calcNet() | 7 |

## Ліцензія

MIT License
