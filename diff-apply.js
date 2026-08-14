/* ============================================================
   diff-apply.js — Diff & Apply конфігурацій v1
   Порівнює два .rsc файли і застосовує тільки зміни
   ============================================================ */
'use strict';

function initDiffApply() {

  var PROXY = 'http://localhost:8888';

  /* ── Модальне вікно ── */
  var modal = document.createElement('div');
  modal.id = 'diffapply-modal';
  modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9998;overflow-y:auto;padding:20px;';

  modal.innerHTML = `
  <div style="max-width:1100px;margin:auto;background:#16212c;border:1px solid #2a3b48;border-radius:12px;padding:24px;">

    <!-- Шапка -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div>
        <h3 style="margin:0;color:#5fd0a5;font-size:16px;">🔄 Diff & Apply</h3>
        <div style="font-size:11px;color:#4a6070;margin-top:2px;">Порівняй конфіги — застосуй тільки зміни</div>
      </div>
      <button id="da-close" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;">✕ Закрити</button>
    </div>

    <!-- Підключення -->
    <div style="background:#0d1a24;border:1px solid #2a3b48;border-radius:8px;padding:12px;margin-bottom:16px;display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;">
      <div>
        <label style="font-size:10px;color:#8ea3b0;display:block;margin-bottom:3px;">IP роутера</label>
        <input id="da-ip" type="text" value="192.168.88.1" style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:6px 10px;border-radius:6px;font-size:12px;width:140px;">
      </div>
      <div>
        <label style="font-size:10px;color:#8ea3b0;display:block;margin-bottom:3px;">Логін</label>
        <input id="da-user" type="text" value="admin" style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:6px 10px;border-radius:6px;font-size:12px;width:80px;">
      </div>
      <div>
        <label style="font-size:10px;color:#8ea3b0;display:block;margin-bottom:3px;">Пароль</label>
        <input id="da-pass" type="password" placeholder="пароль" style="background:#060d14;border:1px solid #1c2a37;color:#e6edf3;padding:6px 10px;border-radius:6px;font-size:12px;width:100px;">
      </div>
      <button id="da-fetch-current" style="background:#5b9bd5;color:#fff;border:none;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">📥 Отримати поточний конфіг</button>
      <span id="da-conn-status" style="font-size:11px;color:#4a6070;padding:6px 0;"></span>
    </div>

    <!-- Два редактори -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">

      <!-- Конфіг A (поточний) -->
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <label style="font-size:11px;color:#8ea3b0;">📄 Конфіг A (поточний / оригінал)</label>
          <div style="display:flex;gap:4px;">
            <label style="background:#0d1a24;border:1px solid #2a3b48;color:#8ea3b0;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:10px;">
              📂 Файл
              <input type="file" id="da-file-a" accept=".rsc,.txt" style="display:none;">
            </label>
            <button id="da-clear-a" style="background:transparent;border:1px solid #2a3b48;color:#4a6070;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:10px;">🗑️</button>
          </div>
        </div>
        <textarea id="da-text-a" rows="18" placeholder="Вставте поточний конфіг або отримайте з роутера..." style="width:100%;background:#060d14;border:1px solid #2a3b48;color:#c9e8d8;padding:10px;border-radius:6px;font-family:monospace;font-size:11px;resize:vertical;box-sizing:border-box;"></textarea>
        <div style="font-size:10px;color:#4a6070;margin-top:4px;" id="da-lines-a">0 рядків</div>
      </div>

      <!-- Конфіг B (новий) -->
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <label style="font-size:11px;color:#8ea3b0;">📄 Конфіг B (новий)</label>
          <div style="display:flex;gap:4px;">
            <label style="background:#0d1a24;border:1px solid #2a3b48;color:#8ea3b0;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:10px;">
              📂 Файл
              <input type="file" id="da-file-b" accept=".rsc,.txt" style="display:none;">
            </label>
            <button id="da-from-generator" style="background:#5fd0a533;border:1px solid #5fd0a5;color:#5fd0a5;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:10px;">← З генератора</button>
            <button id="da-clear-b" style="background:transparent;border:1px solid #2a3b48;color:#4a6070;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:10px;">🗑️</button>
          </div>
        </div>
        <textarea id="da-text-b" rows="18" placeholder="Вставте новий конфіг або завантажте з генератора..." style="width:100%;background:#060d14;border:1px solid #2a3b48;color:#c9e8d8;padding:10px;border-radius:6px;font-family:monospace;font-size:11px;resize:vertical;box-sizing:border-box;"></textarea>
        <div style="font-size:10px;color:#4a6070;margin-top:4px;" id="da-lines-b">0 рядків</div>
      </div>

    </div>

    <!-- Кнопка порівняти -->
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
      <button id="da-compare" style="background:#5fd0a5;color:#082018;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:700;">🔍 Порівняти</button>
      <button id="da-clear-result" style="background:transparent;border:1px solid #2a3b48;color:#8ea3b0;padding:8px 14px;border-radius:6px;cursor:pointer;font-size:12px;">✖ Очистити</button>
      <div id="da-diff-stats" style="font-size:11px;padding:8px 0;color:#4a6070;"></div>
    </div>

    <!-- Результат Diff -->
    <div id="da-diff-result" style="display:none;">

      <!-- Легенда -->
      <div style="display:flex;gap:12px;margin-bottom:8px;font-size:11px;">
        <span style="color:#5fd0a5;">+ Додано</span>
        <span style="color:#e0665a;">- Видалено</span>
        <span style="color:#4a6070;">  Без змін</span>
        <span style="color:#e6b35a;">~ Змінено</span>
      </div>

      <!-- Вивід diff -->
      <div id="da-diff-output" style="background:#060d14;border:1px solid #2a3b48;border-radius:8px;padding:14px;font-family:monospace;font-size:11px;max-height:350px;overflow-y:auto;white-space:pre-wrap;line-height:1.7;margin-bottom:12px;"></div>

      <!-- Apply секція -->
      <div style="background:#0a1f14;border:1px solid #1a4a2a;border-radius:8px;padding:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div>
            <div style="font-size:13px;color:#5fd0a5;font-weight:700;">🚀 Apply — застосувати зміни</div>
            <div style="font-size:11px;color:#4a6070;margin-top:2px;">Будуть виконані тільки нові/змінені рядки</div>
          </div>
          <div style="display:flex;gap:8px;">
            <button id="da-apply-btn" style="background:#5fd0a5;color:#082018;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:700;">⚡ Apply</button>
            <button id="da-apply-dry" style="background:transparent;border:1px solid #5fd0a5;color:#5fd0a5;padding:8px 14px;border-radius:6px;cursor:pointer;font-size:12px;">🧪 Dry Run</button>
          </div>
        </div>

        <!-- Нові рядки для apply -->
        <div style="margin-bottom:10px;">
          <div style="font-size:11px;color:#8ea3b0;margin-bottom:6px;">Рядки для застосування (можна редагувати):</div>
          <textarea id="da-apply-cmds" rows="6" style="width:100%;background:#060d14;border:1px solid #2a3b48;color:#5fd0a5;padding:10px;border-radius:6px;font-family:monospace;font-size:11px;resize:vertical;box-sizing:border-box;"></textarea>
        </div>

        <!-- Прогрес apply -->
        <div id="da-apply-progress" style="display:none;">
          <div style="background:#1c2a37;border-radius:4px;height:6px;margin-bottom:8px;overflow:hidden;">
            <div id="da-apply-bar" style="height:100%;background:#5fd0a5;width:0%;transition:width .3s;border-radius:4px;"></div>
          </div>
          <div id="da-apply-log" style="background:#060d14;border:1px solid #2a3b48;border-radius:6px;padding:10px;font-family:monospace;font-size:11px;max-height:150px;overflow-y:auto;"></div>
        </div>
      </div>

    </div>

  </div>`;

  document.body.appendChild(modal);

  /* ── Синхронізація з терміналом ── */
  function syncFromTerminal() {
    var fields = [
      ['tm-ip',   'da-ip'],
      ['tm-user', 'da-user'],
      ['tm-pass', 'da-pass'],
    ];
    fields.forEach(function(pair) {
      var src = document.getElementById(pair[0]);
      var dst = document.getElementById(pair[1]);
      if (src && dst && src.value) dst.value = src.value;
    });
  }

  /* ── Отримати поточний конфіг з роутера ── */
  document.getElementById('da-fetch-current').addEventListener('click', function() {
    var btn = this;
    btn.textContent = '⏳ Отримую...';
    btn.disabled = true;

    var ip   = document.getElementById('da-ip').value.trim();
    var user = document.getElementById('da-user').value.trim();
    var pass = document.getElementById('da-pass').value;
    var status = document.getElementById('da-conn-status');

    fetch(PROXY + '/ssh/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: ip, port: 22,
        user: user, password: pass,
        command: '/export compact',
        timeout: 30,
      }),
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (!d.ok) throw new Error(d.error);
      document.getElementById('da-text-a').value = d.output || '';
      updateLineCount('da-text-a', 'da-lines-a');
      status.textContent = '✅ Конфіг отримано!';
      status.style.color = '#5fd0a5';
    })
    .catch(function(e) {
      status.textContent = '❌ ' + e.message;
      status.style.color = '#e0665a';
    })
    .finally(function() {
      btn.textContent = '📥 Отримати поточний конфіг';
      btn.disabled = false;
    });
  });

  /* ── Завантаження файлів ── */
  function loadFile(inputId, textareaId, countId) {
    var input = document.getElementById(inputId);
    input.addEventListener('change', function() {
      var file = this.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(e) {
        document.getElementById(textareaId).value = e.target.result;
        updateLineCount(textareaId, countId);
      };
      reader.readAsText(file, 'utf-8');
    });
  }

  loadFile('da-file-a', 'da-text-a', 'da-lines-a');
  loadFile('da-file-b', 'da-text-b', 'da-lines-b');

  /* ── З генератора ── */
  document.getElementById('da-from-generator').addEventListener('click', function() {
    var output = document.getElementById('output');
    if (output && output.textContent.trim()) {
      document.getElementById('da-text-b').value = output.textContent;
      updateLineCount('da-text-b', 'da-lines-b');
    } else {
      alert('Спочатку згенеруй конфіг в генераторі!');
    }
  });

  /* ── Очистити ── */
  document.getElementById('da-clear-a').addEventListener('click', function() {
    document.getElementById('da-text-a').value = '';
    updateLineCount('da-text-a', 'da-lines-a');
  });
  document.getElementById('da-clear-b').addEventListener('click', function() {
    document.getElementById('da-text-b').value = '';
    updateLineCount('da-text-b', 'da-lines-b');
  });
  document.getElementById('da-clear-result').addEventListener('click', function() {
    document.getElementById('da-diff-result').style.display = 'none';
    document.getElementById('da-diff-output').innerHTML = '';
    document.getElementById('da-diff-stats').textContent = '';
    document.getElementById('da-apply-cmds').value = '';
  });

  /* ── Лічильник рядків ── */
  function updateLineCount(textareaId, countId) {
    var ta  = document.getElementById(textareaId);
    var cnt = document.getElementById(countId);
    if (!ta || !cnt) return;
    var lines = ta.value ? ta.value.split('\n').length : 0;
    cnt.textContent = lines + ' рядків';
  }

  ['da-text-a', 'da-text-b'].forEach(function(id) {
    var countId = id === 'da-text-a' ? 'da-lines-a' : 'da-lines-b';
    document.getElementById(id).addEventListener('input', function() {
      updateLineCount(id, countId);
    });
  });

  /* ── LCS Diff алгоритм ── */
  function diffLines(textA, textB) {
    var linesA = textA.split('\n');
    var linesB = textB.split('\n');
    var result = [];

    /* Простий diff — порівнюємо по рядках */
    var setA = {};
    var setB = {};

    linesA.forEach(function(l) {
      var t = l.trim();
      if (t && !t.startsWith('#')) setA[t] = true;
    });
    linesB.forEach(function(l) {
      var t = l.trim();
      if (t && !t.startsWith('#')) setB[t] = true;
    });

    /* Видалені — є в A але немає в B */
    var removed = [];
    linesA.forEach(function(l) {
      var t = l.trim();
      if (t && !t.startsWith('#') && !setB[t]) {
        removed.push(l);
      }
    });

    /* Додані — є в B але немає в A */
    var added = [];
    linesB.forEach(function(l) {
      var t = l.trim();
      if (t && !t.startsWith('#') && !setA[t]) {
        added.push(l);
      }
    });

    /* Без змін */
    var unchanged = [];
    linesB.forEach(function(l) {
      var t = l.trim();
      if (t && !t.startsWith('#') && setA[t]) {
        unchanged.push(l);
      }
    });

    return { added: added, removed: removed, unchanged: unchanged };
  }

  /* ── Порівняти ── */
  document.getElementById('da-compare').addEventListener('click', function() {
    var textA = document.getElementById('da-text-a').value.trim();
    var textB = document.getElementById('da-text-b').value.trim();

    if (!textA || !textB) {
      alert('Заповни обидва поля!');
      return;
    }

    var diff   = diffLines(textA, textB);
    var output = document.getElementById('da-diff-output');
    var stats  = document.getElementById('da-diff-stats');

    output.innerHTML = '';

    /* Показуємо видалені */
    diff.removed.forEach(function(line) {
      var span = document.createElement('div');
      span.style.color = '#e0665a';
      span.style.background = '#2a0d0a';
      span.textContent = '- ' + line;
      output.appendChild(span);
    });

    /* Показуємо додані */
    diff.added.forEach(function(line) {
      var span = document.createElement('div');
      span.style.color = '#5fd0a5';
      span.style.background = '#0a2a1a';
      span.textContent = '+ ' + line;
      output.appendChild(span);
    });

    /* Без змін (скорочено) */
    if (diff.unchanged.length) {
      var info = document.createElement('div');
      info.style.color = '#4a6070';
      info.textContent = '... ' + diff.unchanged.length + ' рядків без змін';
      output.appendChild(info);
    }

    /* Статистика */
    stats.innerHTML =
      '<span style="color:#5fd0a5;">+' + diff.added.length + ' додано</span> · ' +
      '<span style="color:#e0665a;">-' + diff.removed.length + ' видалено</span> · ' +
      '<span style="color:#4a6070;">' + diff.unchanged.length + ' без змін</span>';

    /* Apply команди — тільки додані рядки */
    var applyCmds = diff.added
      .filter(function(l) { return l.trim() && !l.trim().startsWith('#'); })
      .join('\n');
    document.getElementById('da-apply-cmds').value = applyCmds;

    document.getElementById('da-diff-result').style.display = 'block';
  });

  /* ── Apply — застосувати зміни ── */
  document.getElementById('da-apply-btn').addEventListener('click', function() {
    applyChanges(false);
  });

  document.getElementById('da-apply-dry').addEventListener('click', function() {
    applyChanges(true);
  });

  function applyChanges(dryRun) {
    var cmds = document.getElementById('da-apply-cmds').value.trim();
    if (!cmds) {
      alert('Немає команд для застосування!');
      return;
    }

    var ip   = document.getElementById('da-ip').value.trim();
    var user = document.getElementById('da-user').value.trim();
    var pass = document.getElementById('da-pass').value;
    var lines = cmds.split('\n').filter(function(l) { return l.trim(); });

    var progress = document.getElementById('da-apply-progress');
    var bar      = document.getElementById('da-apply-bar');
    var log      = document.getElementById('da-apply-log');

    progress.style.display = 'block';
    log.innerHTML = '';
    bar.style.width = '0%';

    if (dryRun) {
      log.innerHTML = '<span style="color:#e6b35a;">🧪 DRY RUN — команди НЕ виконуються на роутері:</span>\n\n';
      lines.forEach(function(cmd, i) {
        log.innerHTML += '<span style="color:#c9e8d8;">' + (i+1) + '. ' + cmd + '</span>\n';
        bar.style.width = ((i+1) / lines.length * 100) + '%';
      });
      log.innerHTML += '\n<span style="color:#5fd0a5;">✅ Dry run завершено! ' + lines.length + ' команд готові до застосування.</span>';
      return;
    }

    /* Реальне застосування — по одній команді */
    var idx = 0;

    function applyNext() {
      if (idx >= lines.length) {
        log.innerHTML += '\n<span style="color:#5fd0a5;">✅ Apply завершено! ' + lines.length + ' команд застосовано.</span>';
        bar.style.width = '100%';
        return;
      }

      var cmd = lines[idx];
      idx++;
      bar.style.width = (idx / lines.length * 100) + '%';

      log.innerHTML += '<span style="color:#4a6070;">' + idx + '/' + lines.length + '</span> <span style="color:#8ea3b0;">' + cmd + '</span>\n';
      log.scrollTop = log.scrollHeight;

      fetch(PROXY + '/ssh/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: ip, port: 22,
          user: user, password: pass,
          command: cmd,
          timeout: 10,
        }),
      })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (!d.ok || d.error) {
          log.innerHTML += '<span style="color:#e0665a;">  ❌ ' + (d.error || 'помилка') + '</span>\n';
        } else if (d.output && d.output.trim()) {
          log.innerHTML += '<span style="color:#5fd0a5;">  → ' + d.output.trim() + '</span>\n';
        } else {
          log.innerHTML += '<span style="color:#5fd0a5;">  ✅ OK</span>\n';
        }
        log.scrollTop = log.scrollHeight;
        applyNext();
      })
      .catch(function(e) {
        log.innerHTML += '<span style="color:#e0665a;">  ❌ ' + e.message + '</span>\n';
        applyNext();
      });
    }

    applyNext();
  }

  /* ── Закрити ── */
  document.getElementById('da-close').addEventListener('click', function() {
    modal.style.display = 'none';
  });
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.style.display = 'none';
  });

  /* ── Кнопка в панелі ── */
  function addBtn() {
    if (document.getElementById('btn-diffapply')) return true;
    var btn = document.createElement('button');
    btn.id        = 'btn-diffapply';
    btn.className = 'sec';
    btn.textContent = '🔄 Diff & Apply';
    btn.title = 'Порівняй конфіги і застосуй зміни';
    btn.addEventListener('click', function() {
      modal.style.display = 'block';
      syncFromTerminal();
    });
    var bar = document.querySelector('.btnbar');
    if (bar) { bar.appendChild(btn); return true; }
    return false;
  }

  if (!addBtn()) {
    var t = setInterval(function() { if (addBtn()) clearInterval(t); }, 300);
  }

  console.log('[diff-apply] v1 ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDiffApply);
} else {
  initDiffApply();
}