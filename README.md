# MikroTik Config Generator

![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)
![RouterOS](https://img.shields.io/badge/RouterOS-6.x%20%7C%207.x%20%7C%207.13%2B-blue)
![PWA](https://img.shields.io/badge/PWA-Offline%20Ready-orange)
![Unit Tests](https://img.shields.io/badge/Unit%20Tests-53%2F53-success)

> Генератор конфігурації RouterOS — один HTML-файл, нульові залежності, працює офлайн.

## Demo

🔗 [https://drepa666.github.io/mikrotik-config-generator/](https://drepa666.github.io/mikrotik-config-generator/)

---

## ⚡ Можливості

| Функція | Опис |
|---|---|
| Генератор | Realtime генерація .rsc скриптів |
| AI | 6 провайдерів: Claude, GPT, Grok, Groq, DeepSeek, Gemini |
| Diff viewer | LCS алгоритм порівняння .rsc файлів |
| Валідація | Realtime перевірка 20+ полів форми |
| Highlighting | Syntax highlighting RouterOS команд |
| Офлайн | PWA — працює без інтернету |
| Профілі | Збереження/завантаження конфігурацій |
| Теми | Світла/темна тема |

---

## 🆕 Нові можливості (Patch 41)

| Функція | Опис |
|---|---|
| 🖥️ Роутер | Панель керування роутером прямо з браузера |
| 🔒 SSH термінал | Повноцінний термінал як у Winbox |
| ⚙️ Сервіси | Вмикання/вимикання сервісів одним кліком |
| 🔌 Протоколи | Вибір протоколу та порту вручну з чекбоксами |
| 📅 Scheduler | Керування розкладом задач |
| 📜 Скрипти | Запуск/видалення скриптів на роутері |
| ⏰ Backup Scheduler | Автобекап на Google Drive за розкладом |
| 🚀 One-Click Deploy | Deploy скриптів на роутер через REST API |
| 🔄 Auto-reconnect | SSH connection pool + keepalive кожні 30s |
| ⬆️⬇️ Історія команд | Навігація стрілками по виконаних командах |
| Tab autocomplete | Автодоповнення команд терміналу |
| ⏹️ Stop | Зупинка команди вручну |

---

## 🚀 Запуск

```cmd
cd C:\Users\bondarenko_ay\Desktop\Mikrotik
python proxy.py