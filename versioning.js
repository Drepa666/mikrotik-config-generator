/* ============================================================
   versioning.js — Версіонування конфігурацій v1
   Зберігає знімки конфігу з коментарями + diff між версіями
   ============================================================ */
'use strict';

function initVersioning() {

  var MAX_VERSIONS = 50;
  var STORAGE_KEY  = 'mt-config-versions';

  /* ── Завантажуємо версії ── */
  function loadVersions() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch(e) { return []; }
  }

  function saveVersions(versions) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
    } catch(e) {
      alert('Помилка збереження! localStorage переповнений.');
    }
  }

  /* ── Модальне вікно ── */
  var modal = document.createElement('div');
  modal.id = 'ver-modal';
  modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9998;overflow-y:auto;padding:20px;';

  modal.innerHTML = `
  <div style="max-width:1000px;margin:auto;background:#16212c;border:1px solid #2a3b48;border-radius:12px;padding:24px;">

    <!-- Шапка -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div>
        <h3 style="margin:0;color:#5fd0a5;font-size:16px;">🗂️ Версіонування конфігурацій</h3>
        <div style="font-size:11px;color:#4a6070;margin-top:2px;">Зберігай знімки — відновлюй будь-коли</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button id="ver-save-now" style="background:#5fd0a5;color:#082018;border:none;padding:7px 16px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">💾 Зберегти зараз</button>
        <button id="ver-close" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;">✕ Закрити</button>
      </div>
    </div>

    <!-- Зберегти нову версію -->
    <div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;padding:14px;margin-bottom:16px;display:flex;gap:8px;align-items:center;">
      <input id="ver-comment" type="text" placeholder="Коментар до версії (напр: додав WireGuard)..."
        style="flex:1;background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:7px 10px;border-radius:6px;font-size:12px;">
      <select id="ver-tag" style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:7px 8px;border-radius:6px;font-size:12px;">
        <option value="">🏷️ Тег</option>
        <option value="✅ Робочий">✅ Робочий</option>
        <option value="🔧 Тест">🔧 Тест</option>
        <option value="⚠️ Небезпечний">⚠️ Небезпечний</option>
        <option value="🔒 Бекап">🔒 Бекап</option>
        <option value="🚀 Продакшн">🚀 Продакшн</option>
      </select>
      <button id="ver-save-btn" style="background:#5b9bd5;color:#fff;border:none;padding:7px 16px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">+ Зберегти версію</button>
    </div>

    <!-- Статистика -->
    <div id="ver-stats" style="display:flex;gap:16px;margin-bottom:12px;font-size:11px;color:#4a6070;flex-wrap:wrap;"></div>

    <!-- Фільтр/пошук -->
    <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
      <input id="ver-search" type="text" placeholder="🔍 Пошук по коментарю..."
        style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:6px 10px;border-radius:6px;font-size:11px;flex:1;min-width:150px;">
      <select id="ver-filter-tag" style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:6px 8px;border-radius:6px;font-size:11px;">
        <option value="">Всі теги</option>
        <option value="✅ Робочий">✅ Робочий</option>
        <option value="🔧 Тест">🔧 Тест</option>
        <option value="⚠️ Небезпечний">⚠️ Небезпечний</option>
        <option value="🔒 Бекап">🔒 Бекап</option>
        <option value="🚀 Продакшн">🚀 Продакшн</option>
      </select>
      <button id="ver-export-all" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:11px;">📤 Експорт всіх</button>
      <label style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:11px;">
        📥 Імпорт
        <input type="file" id="ver-import-file" accept=".json" style="display:none;">
      </label>
      <button id="ver-clear-all" style="background:transparent;border:1px solid #e0665a;color:#e0665a;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:11px;">🗑️ Очистити всі</button>
    </div>

    <!-- Список версій -->
    <div id="ver-list" style="display:grid;gap:8px;max-height:400px;overflow-y:auto;"></div>

    <!-- Diff між версіями -->
    <div id="ver-diff-section" style="display:none;margin-top:16px;">
      <div style="background:#0a1520;border:1px solid #1c2a37;border-radius:8px;padding:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <div style="font-size:12px;color:#5fd0a5;font-weight:700;">🔍 Diff між версіями</div>
          <button id="ver-diff-close" style="background:transparent;border:none;color:#4a6070;cursor:pointer;font-size:16px;">✕</button>
        </div>
        <div id="ver-diff-labels" style="display:flex;gap:16px;margin-bottom:8px;font-size:11px;"></div>
        <div id="ver-diff-output" style="background:#060d14;border:1px solid #2a3b48;border-radius:6px;padding:12px;font-family:monospace;font-size:11px;max-height:250px;overflow-y:auto;white-space:pre-wrap;line-height:1.7;"></div>
        <div id="ver-diff-stats" style="font-size:11px;color:#4a6070;margin-top:8px;"></div>
      </div>
    </div>

  </div>`;

  document.body.appendChild(modal);

  /* ── Отримати поточний конфіг з генератора ── */
  function getCurrentConfig() {
    var output = document.getElementById('output');
    return output ? output.textContent.trim() : '';
  }

  /* ── Застосувати конфіг до генератора ── */
  function applyConfig(config) {
    var output = document.getElementById('output');
    if (output) {
      output.textContent = config;
    }
  }

  /* ── Зберегти версію ── */
  function saveVersion(comment, tag) {
    var config = getCurrentConfig();
    if (!config) {
      alert('Конфіг порожній! Спочатку згенеруй конфігурацію.');
      return false;
    }

    var versions = loadVersions();
    var version  = {
      id:        Date.now(),
      date:      new Date().toLocaleString('uk-UA'),
      comment:   comment || 'Без коментаря',
      tag:       tag || '',
      config:    config,
      lines:     config.split('\n').length,
      size:      config.length,
    };

    versions.unshift(version);

    /* Обмежуємо кількість версій */
    if (versions.length > MAX_VERSIONS) {
      versions = versions.slice(0, MAX_VERSIONS);
    }

    saveVersions(versions);
    renderVersions();
    return true;
  }

  /* ── Diff між двома конфігами ── */
  function diffConfigs(configA, configB, labelA, labelB) {
    var linesA = configA.split('\n');
    var linesB = configB.split('\n');
    var setA   = {};
    var setB   = {};

    linesA.forEach(function(l) {
      var t = l.trim();
      if (t && !t.startsWith('#')) setA[t] = true;
    });
    linesB.forEach(function(l) {
      var t = l.trim();
      if (t && !t.startsWith('#')) setB[t] = true;
    });

    var added   = linesB.filter(function(l) { var t = l.trim(); return t && !t.startsWith('#') && !setA[t]; });
    var removed = linesA.filter(function(l) { var t = l.trim(); return t && !t.startsWith('#') && !setB[t]; });
    var same    = linesB.filter(function(l) { var t = l.trim(); return t && !t.startsWith('#') && setA[t]; });

    var output  = document.getElementById('ver-diff-output');
    var stats   = document.getElementById('ver-diff-stats');
    var labels  = document.getElementById('ver-diff-labels');
    var section = document.getElementById('ver-diff-section');

    section.style.display = 'block';
    output.innerHTML = '';

    labels.innerHTML =
      '<span style="color:#e0665a;">A: ' + labelA + '</span> → ' +
      '<span style="color:#5fd0a5;">B: ' + labelB + '</span>';

    removed.forEach(function(line) {
      var div = document.createElement('div');
      div.style.cssText = 'color:#e0665a;background:#2a0d0a;padding:1px 4px;';
      div.textContent = '- ' + line;
      output.appendChild(div);
    });

    added.forEach(function(line) {
      var div = document.createElement('div');
      div.style.cssText = 'color:#5fd0a5;background:#0a2a1a;padding:1px 4px;';
      div.textContent = '+ ' + line;
      output.appendChild(div);
    });

    if (same.length) {
      var div = document.createElement('div');
      div.style.color = '#4a6070';
      div.textContent = '... ' + same.length + ' рядків без змін';
      output.appendChild(div);
    }

    stats.innerHTML =
      '<span style="color:#5fd0a5;">+' + added.length + ' додано</span> · ' +
      '<span style="color:#e0665a;">-' + removed.length + ' видалено</span> · ' +
      '<span style="color:#4a6070;">' + same.length + ' без змін</span>';

    section.scrollIntoView({ behavior: 'smooth' });
  }

  /* ── Рендер списку версій ── */
  var selectedForDiff = [];

  function renderVersions() {
    var versions  = loadVersions();
    var list      = document.getElementById('ver-list');
    var search    = document.getElementById('ver-search').value.toLowerCase();
    var filterTag = document.getElementById('ver-filter-tag').value;
    var stats     = document.getElementById('ver-stats');

    /* Статистика */
    var totalSize = versions.reduce(function(s, v) { return s + v.size; }, 0);
    stats.innerHTML =
      '<span>📦 Версій: <b style="color:#5fd0a5;">' + versions.length + '</b> / ' + MAX_VERSIONS + '</span>' +
      '<span>💾 Розмір: <b style="color:#5b9bd5;">' + (totalSize / 1024).toFixed(1) + ' KB</b></span>' +
      '<span>🕐 Остання: <b style="color:#e6b35a;">' + (versions[0] ? versions[0].date : '—') + '</b></span>';

    /* Фільтрація */
    var filtered = versions.filter(function(v) {
      var matchSearch = !search || v.comment.toLowerCase().includes(search) || v.date.includes(search);
      var matchTag    = !filterTag || v.tag === filterTag;
      return matchSearch && matchTag;
    });

    list.innerHTML = '';

    if (!filtered.length) {
      list.innerHTML = '<div style="color:#4a6070;font-size:12px;text-align:center;padding:20px;">Версій не знайдено</div>';
      return;
    }

    filtered.forEach(function(ver, idx) {
      var isSelected = selectedForDiff.indexOf(ver.id) !== -1;
      var card = document.createElement('div');
      card.style.cssText = 'background:#0d1a24;border:1px solid ' + (isSelected ? '#5b9bd5' : '#2a3b48') + ';border-radius:8px;padding:12px;display:flex;gap:10px;align-items:center;';

      /* Чекбокс для diff */
      var chk = document.createElement('input');
      chk.type    = 'checkbox';
      chk.checked = isSelected;
      chk.style.cssText = 'accent-color:#5b9bd5;width:14px;height:14px;cursor:pointer;flex-shrink:0;';
      chk.title   = 'Вибрати для Diff (оберіть 2)';
      chk.addEventListener('change', function() {
        if (chk.checked) {
          if (selectedForDiff.length >= 2) {
            selectedForDiff.shift();
          }
          selectedForDiff.push(ver.id);
        } else {
          selectedForDiff = selectedForDiff.filter(function(id) { return id !== ver.id; });
        }
        renderVersions();
        /* Показуємо diff якщо вибрано 2 */
        if (selectedForDiff.length === 2) {
          var vA = versions.find(function(v) { return v.id === selectedForDiff[0]; });
          var vB = versions.find(function(v) { return v.id === selectedForDiff[1]; });
          if (vA && vB) diffConfigs(vA.config, vB.config, vA.comment, vB.comment);
        }
      });

      /* Інформація */
      var info = document.createElement('div');
      info.style.cssText = 'flex:1;min-width:0;';
      info.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
        (ver.tag ? '<span style="font-size:10px;background:#1c2a37;padding:2px 6px;border-radius:4px;">' + ver.tag + '</span>' : '') +
        '<span style="font-size:12px;color:#e6edf3;font-weight:600;">' + ver.comment + '</span>' +
        '</div>' +
        '<div style="font-size:10px;color:#4a6070;">' +
        '🕐 ' + ver.date + ' · ' +
        '📄 ' + ver.lines + ' рядків · ' +
        '💾 ' + (ver.size / 1024).toFixed(1) + ' KB' +
        '</div>';

      /* Кнопки дій */
      var btns = document.createElement('div');
      btns.style.cssText = 'display:flex;gap:4px;flex-shrink:0;';

      /* Відновити */
      var btnRestore = document.createElement('button');
      btnRestore.textContent = '↩️ Відновити';
      btnRestore.style.cssText = 'background:#5fd0a533;border:1px solid #5fd0a5;color:#5fd0a5;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:10px;';
      btnRestore.addEventListener('click', function() {
        if (confirm('Відновити версію "' + ver.comment + '"?\n\nПоточний конфіг буде перезаписано!')) {
          applyConfig(ver.config);
          modal.style.display = 'none';
          alert('✅ Версію відновлено!');
        }
      });

      /* Переглянути */
      var btnView = document.createElement('button');
      btnView.textContent = '👁️';
      btnView.title = 'Переглянути конфіг';
      btnView.style.cssText = 'background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:10px;';
      btnView.addEventListener('click', function() {
        var win = window.open('', '_blank', 'width=800,height=600');
        win.document.write('<pre style="background:#060d14;color:#c9e8d8;padding:20px;font-size:12px;white-space:pre-wrap;">' + ver.config + '</pre>');
        win.document.title = ver.comment + ' — ' + ver.date;
      });

      /* Експорт */
      var btnExport = document.createElement('button');
      btnExport.textContent = '📤';
      btnExport.title = 'Експорт';
      btnExport.style.cssText = 'background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:10px;';
      btnExport.addEventListener('click', function() {
        var blob = new Blob([ver.config], { type: 'text/plain' });
        var a    = document.createElement('a');
        a.href   = URL.createObjectURL(blob);
        a.download = 'mikrotik-v' + ver.id + '.rsc';
        a.click();
        URL.revokeObjectURL(a.href);
      });

      /* Видалити */
      var btnDel = document.createElement('button');
      btnDel.textContent = '🗑️';
      btnDel.title = 'Видалити версію';
      btnDel.style.cssText = 'background:transparent;border:1px solid #e0665a44;color:#e0665a;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:10px;';
      btnDel.addEventListener('click', function() {
        if (confirm('Видалити версію "' + ver.comment + '"?')) {
          var vers = loadVersions().filter(function(v) { return v.id !== ver.id; });
          saveVersions(vers);
          selectedForDiff = selectedForDiff.filter(function(id) { return id !== ver.id; });
          renderVersions();
        }
      });

      btns.appendChild(btnRestore);
      btns.appendChild(btnView);
      btns.appendChild(btnExport);
      btns.appendChild(btnDel);

      card.appendChild(chk);
      card.appendChild(info);
      card.appendChild(btns);
      list.appendChild(card);
    });

    /* Підказка для diff */
    if (filtered.length >= 2) {
      var hint = document.createElement('div');
      hint.style.cssText = 'font-size:11px;color:#4a6070;text-align:center;padding:6px;';
      hint.textContent = '☑ Оберіть 2 версії для порівняння Diff';
      list.appendChild(hint);
    }
  }

  /* ── Кнопки подій ── */
  document.getElementById('ver-save-btn').addEventListener('click', function() {
    var comment = document.getElementById('ver-comment').value.trim();
    var tag     = document.getElementById('ver-tag').value;
    if (saveVersion(comment, tag)) {
      document.getElementById('ver-comment').value = '';
      document.getElementById('ver-tag').value     = '';
    }
  });

  document.getElementById('ver-save-now').addEventListener('click', function() {
    var comment = prompt('Коментар до версії:', 'Збережено ' + new Date().toLocaleString('uk-UA'));
    if (comment !== null) {
      saveVersion(comment, '');
    }
  });

  /* Enter в полі коментаря */
  document.getElementById('ver-comment').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') document.getElementById('ver-save-btn').click();
  });

  /* Пошук і фільтр */
  document.getElementById('ver-search').addEventListener('input', renderVersions);
  document.getElementById('ver-filter-tag').addEventListener('change', renderVersions);

  /* Diff закрити */
  document.getElementById('ver-diff-close').addEventListener('click', function() {
    document.getElementById('ver-diff-section').style.display = 'none';
    selectedForDiff = [];
    renderVersions();
  });

  /* Експорт всіх */
  document.getElementById('ver-export-all').addEventListener('click', function() {
    var versions = loadVersions();
    if (!versions.length) { alert('Немає версій для експорту!'); return; }
    var blob = new Blob([JSON.stringify(versions, null, 2)], { type: 'application/json' });
    var a    = document.createElement('a');
    a.href   = URL.createObjectURL(blob);
    a.download = 'mt-versions-' + Date.now() + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  /* Імпорт */
  document.getElementById('ver-import-file').addEventListener('change', function() {
    var file = this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported)) throw new Error('Невірний формат');
        var existing = loadVersions();
        var merged   = imported.concat(existing);
        /* Видаляємо дублі по id */
        var seen = {};
        merged = merged.filter(function(v) {
          if (seen[v.id]) return false;
          seen[v.id] = true;
          return true;
        });
        merged = merged.slice(0, MAX_VERSIONS);
        saveVersions(merged);
        renderVersions();
        alert('✅ Імпортовано ' + imported.length + ' версій!');
      } catch(err) {
        alert('❌ Помилка: ' + err.message);
      }
    };
    reader.readAsText(file);
    this.value = '';
  });

  /* Очистити всі */
  document.getElementById('ver-clear-all').addEventListener('click', function() {
    if (confirm('Видалити ВСІ збережені версії?\nЦю дію не можна скасувати!')) {
      saveVersions([]);
      selectedForDiff = [];
      renderVersions();
    }
  });

  /* Закрити */
  document.getElementById('ver-close').addEventListener('click', function() {
    modal.style.display = 'none';
  });
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.style.display = 'none';
  });

  /* ── Авто-збереження при генерації ── */
  var autoSaveTimer = null;
  var lastAutoConfig = '';

  function setupAutoSave() {
    var output = document.getElementById('output');
    if (!output) return;

    var observer = new MutationObserver(function() {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(function() {
        var config = output.textContent.trim();
        if (config && config !== lastAutoConfig && config.length > 100) {
          lastAutoConfig = config;
          /* Тихе авто-збереження кожні 5 хвилин */
        }
      }, 500);
    });

    observer.observe(output, { childList: true, characterData: true, subtree: true });
  }

  setupAutoSave();

  /* ── Кнопка в панелі ── */
  function addBtn() {
    if (document.getElementById('btn-versioning')) return true;
    var btn = document.createElement('button');
    btn.id        = 'btn-versioning';
    btn.className = 'sec';
    btn.textContent = '🗂️ Версії';
    btn.title = 'Версіонування конфігурацій';
    btn.addEventListener('click', function() {
      modal.style.display = 'block';
      renderVersions();
    });
    var bar = document.querySelector('.btnbar');
    if (bar) { bar.appendChild(btn); return true; }
    return false;
  }

  if (!addBtn()) {
    var t = setInterval(function() { if (addBtn()) clearInterval(t); }, 300);
  }

  /* ── Гарячі клавіші ── */
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 's' && modal.style.display !== 'block') {
      var output = document.getElementById('output');
      if (output && output.textContent.trim()) {
        e.preventDefault();
        var comment = prompt('Коментар до версії:', '');
        if (comment !== null) saveVersion(comment, '');
      }
    }
  });

  console.log('[versioning] v1 ready — Ctrl+S для збереження');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVersioning);
} else {
  initVersioning();
}