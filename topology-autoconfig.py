with open('topology-visual.js', 'r', encoding='utf-8') as f:
    c = f.read()

# Додаємо кнопку в toolbar топології
OLD = "'<span style=\"color:#2a3b48;padding:0 4px;\">|</span>' +"
NEW = ("'<span style=\"color:#2a3b48;padding:0 4px;\">|</span>' +"
       "\n    '<button id=\"topo-autoconfig\" style=\"background:#5fd0a5;color:#082018;"
       "border:none;padding:4px 12px;border-radius:4px;cursor:pointer;"
       "font-size:12px;font-weight:700;\">"
       "&#9889; Генерувати конфіг</button>' +")

if OLD in c:
    c = c.replace(OLD, NEW)
    print('OK: кнопка додана в toolbar!')

# Додаємо обробник кнопки
OLD2 = "  document.getElementById('topo-load-btn').addEventListener('click', loadFromRouter);"
NEW2 = """  document.getElementById('topo-load-btn').addEventListener('click', loadFromRouter);

  /* ── Генерувати конфіг з топології ── */
  document.getElementById('topo-autoconfig').addEventListener('click', function() {
    if (!nodes.length) {
      alert('Спочатку додай вузли в топологію!');
      return;
    }
    if (!edges.length) {
      alert('З\\'єднай вузли стрілками (Shift+клік)!');
      return;
    }

    if (!window.topoAutoConfig) {
      alert('Модуль auto-config не завантажено!');
      return;
    }

    /* Перевіряємо чи є роутер */
    var router = nodes.find(function(n) { return n.type === 'router'; });
    if (!router) {
      alert('Додай вузол типу Router!');
      return;
    }

    /* Показуємо панель вибору */
    var choice = confirm(
      'Що зробити з топологією?\\n\\n' +
      'OK = Заповнити форму генератора автоматично\\n' +
      'Скасувати = Показати RSC скрипт окремо'
    );

    if (choice) {
      /* Заповнюємо форму */
      modal.style.display = 'none';
      var result = window.topoAutoConfig.fillForm(nodes, edges);
      if (result) {
        var msg = '\\u2705 Форму заповнено!\\n\\n';
        if (result.ok.length)       msg += '\\u2705 ' + result.ok.join('\\n\\u2705 ');
        if (result.warnings.length) msg += '\\n\\n\\u26A0\\uFE0F ' + result.warnings.join('\\n\\u26A0\\uFE0F ');
        setTimeout(function() { alert(msg); }, 600);
      }
    } else {
      /* Показуємо RSC */
      var script = window.topoAutoConfig.generateScript(nodes, edges);
      var win = window.open('', '_blank', 'width=900,height=700');
      win.document.write(
        '<html><head><title>Topology Config</title></head><body style="background:#060d14;color:#c9e8d8;padding:20px;">' +
        '<div style="display:flex;gap:10px;margin-bottom:16px;">' +
        '<button onclick="navigator.clipboard.writeText(document.getElementById(\\'script\\').textContent)" ' +
        'style="background:#5fd0a5;color:#082018;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:700;">' +
        '&#128203; Копіювати</button>' +
        '<button onclick="var a=document.createElement(\\'a\\');a.href=\\'data:text/plain;charset=utf-8,\\'+encodeURIComponent(document.getElementById(\\'script\\').textContent);a.download=\\'topology-config.rsc\\';a.click();" ' +
        'style="background:#5b9bd5;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;">' +
        '&#128229; Завантажити .rsc</button>' +
        '</div>' +
        '<pre id="script" style="font-family:monospace;font-size:12px;white-space:pre-wrap;line-height:1.7;">' +
        script.replace(/</g,'&lt;').replace(/>/g,'&gt;') +
        '</pre></body></html>'
      );
    }

    if (window.auditLog) window.auditLog.add('Генерація конфігу з топології', nodes.length + ' вузлів', 'config');
    setStatus('\\u2705 Конфіг згенеровано!');
  });"""

if OLD2 in c:
    c = c.replace(OLD2, NEW2)
    print('OK: обробник кнопки додано!')

with open('topology-visual.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
print('topology-visual.js збережено!')