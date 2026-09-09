# -*- coding: utf-8 -*-
import subprocess

with open('plugins.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Знаходимо точне місце — перед list.appendChild(card)
old = """      '</label>' +
      '</div>';
    list.appendChild(card);"""

new = """      '</label>' +
      '</div>' +
      '<button class="pl-del-btn" data-id="' + plugin.id + '" ' +
        'style="margin-top:8px;width:100%;padding:5px;background:transparent;' +
        'border:1px solid #b04040;color:#e05252;border-radius:6px;' +
        'font-size:11px;cursor:pointer;transition:all .15s;" ' +
        'onmouseover="this.style.background=\'#e05252\';this.style.color=\'#fff\';" ' +
        'onmouseout="this.style.background=\'transparent\';this.style.color=\'#e05252\';" ' +
        'onclick="window._plDeletePlugin(\'' + plugin.id + '\',\'' + plugin.name + '\')">' +
        '🗑 Видалити плагін' +
      '</button>';
    list.appendChild(card);"""

if old in content:
    content = content.replace(old, new, 1)
    print('OK: кнопка "Видалити" додана в картку плагіна!')
else:
    print('ПОМИЛКА: точний рядок не знайдено!')
    print('Шукаємо альтернативу...')
    # Альтернативний пошук
    idx = content.find("list.appendChild(card);")
    if idx > 0:
        print(f'list.appendChild знайдено на позиції {idx}')
        print(f'Контекст перед: {content[idx-100:idx]}')

# Додаємо функцію _plDeletePlugin
delete_fn = """

  /* ── Видалення плагіна ── */
  window._plDeletePlugin = function(id, name) {
    if (!confirm('Видалити плагін "' + name + '" зі списку?\\nПлагін зникне з меню і буде вимкнений.')) return;

    /* Деактивуємо якщо активний */
    var plugin = BUILTIN_PLUGINS.find(function(p) { return p.id === id; });
    if (plugin && isEnabled(id)) {
      try {
        if (typeof plugin.destroy === 'function') plugin.destroy();
      } catch(e) {}
      setEnabled(id, false);
    }

    /* Помічаємо як deleted в localStorage */
    try {
      var deleted = JSON.parse(localStorage.getItem('mt-plugins-deleted') || '[]');
      if (deleted.indexOf(id) < 0) deleted.push(id);
      localStorage.setItem('mt-plugins-deleted', JSON.stringify(deleted));
    } catch(e) {}

    /* Перерендеримо список */
    renderPlugins();

    /* Показуємо повідомлення */
    var msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#1a0a0a;' +
      'border:1px solid #b04040;border-radius:8px;padding:12px 16px;' +
      'color:#e05252;font-size:12px;z-index:999999;';
    msg.innerHTML = '🗑 Плагін "' + name + '" видалено. ' +
      '<span style="color:#5fd0a5;cursor:pointer;text-decoration:underline;" ' +
      'onclick="window._plRestorePlugin(\'' + id + '\')">Відновити</span>';
    document.body.appendChild(msg);
    setTimeout(function() { if (msg.parentNode) msg.remove(); }, 4000);
  };

  /* ── Відновлення видаленого плагіна ── */
  window._plRestorePlugin = function(id) {
    try {
      var deleted = JSON.parse(localStorage.getItem('mt-plugins-deleted') || '[]');
      deleted = deleted.filter(function(x) { return x !== id; });
      localStorage.setItem('mt-plugins-deleted', JSON.stringify(deleted));
    } catch(e) {}
    renderPlugins();
  };
"""

if 'window._plDeletePlugin' not in content:
    # Вставляємо перед кінцем модуля
    content = content.replace(
        'function idToGlobalName',
        delete_fn + '\n  function idToGlobalName'
    )
    if 'window._plDeletePlugin' in content:
        print('OK: функція _plDeletePlugin додана!')
    else:
        # Другий варіант вставки
        last_fn = content.rfind('})();')
        if last_fn > 0:
            content = content[:last_fn] + delete_fn + content[last_fn:]
            print('OK: функція _plDeletePlugin додана перед кінцем модуля!')
else:
    print('_plDeletePlugin вже є!')

# Фільтруємо видалені плагіни в renderPlugins
old_render = "BUILTIN_PLUGINS.forEach(function(plugin) {"
new_render = """/* Фільтруємо видалені */
  var deletedPlugins = [];
  try { deletedPlugins = JSON.parse(localStorage.getItem('mt-plugins-deleted') || '[]'); } catch(e) {}
  var visiblePlugins = BUILTIN_PLUGINS.filter(function(p) { return deletedPlugins.indexOf(p.id) < 0; });

  visiblePlugins.forEach(function(plugin) {"""

if old_render in content and 'visiblePlugins' not in content:
    content = content.replace(old_render, new_render, 1)
    # Замінюємо закриття forEach
    content = content.replace(
        '  });\n  /* Конвертує plugin-id',
        '  });\n  /* Конвертує plugin-id'
    )
    print('OK: фільтрація видалених плагінів додана!')
else:
    print('Фільтрація вже є або не знайдено!')

with open('plugins.js', 'w', encoding='utf-8') as f:
    f.write(content)

# Перевіряємо синтаксис
r = subprocess.run(['node', '--check', 'plugins.js'], capture_output=True, text=True)
print('Синтаксис:', 'OK' if r.returncode == 0 else r.stderr[:300])

print('\nГотово! Запускай npm start')