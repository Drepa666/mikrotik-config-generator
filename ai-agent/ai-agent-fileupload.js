/* ══════════════════════════════════════════════════════
   AI FILE UPLOAD v1.0
   Підтримка: TXT, JSON, RSC, PNG, JPG, PDF
   ══════════════════════════════════════════════════════ */
'use strict';

window.AIFileUpload = {

  /* ── Підтримувані типи ── */
  SUPPORTED: {
    text: ['.txt', '.rsc', '.json', '.conf', '.cfg', '.log', '.csv', '.yaml', '.yml'],
    image: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'],
    pdf: ['.pdf'],
  },

  /* ── Поточний файл ── */
  _current: null,

  /* ── Читаємо файл ── */
  readFile: function(file) {
    return new Promise(function(resolve, reject) {
      var ext = ('.' + file.name.split('.').pop()).toLowerCase();
      var isText  = AIFileUpload.SUPPORTED.text.some(function(e){ return ext === e; });
      var isImage = AIFileUpload.SUPPORTED.image.some(function(e){ return ext === e; });
      var isPdf   = ext === '.pdf';

      if (isText) {
        var reader = new FileReader();
        reader.onload  = function(e){ resolve({ type:'text',  name:file.name, content:e.target.result, size:file.size }); };
        reader.onerror = function(){ reject('Помилка читання файлу'); };
        reader.readAsText(file, 'utf-8');
      } else if (isImage) {
        var reader2 = new FileReader();
        reader2.onload  = function(e){ resolve({ type:'image', name:file.name, content:e.target.result, size:file.size }); };
        reader2.onerror = function(){ reject('Помилка читання зображення'); };
        reader2.readAsDataURL(file);
      } else if (isPdf) {
        resolve({ type:'pdf', name:file.name, content:'[PDF файл — текстовий аналіз недоступний]', size:file.size });
      } else {
        reject('Непідтримуваний тип файлу: ' + ext);
      }
    });
  },

  /* ── Відкрити діалог вибору файлу ── */
  openDialog: function() {
    var input = document.createElement('input');
    input.type   = 'file';
    input.accept = [
      '.txt','.rsc','.json','.conf','.cfg','.log','.csv','.yaml','.yml',
      '.png','.jpg','.jpeg','.gif','.webp',
      '.pdf'
    ].join(',');
    input.onchange = function(e) {
      var file = e.target.files[0];
      if (!file) return;
      AIFileUpload.processFile(file);
    };
    input.click();
  },

  /* ── Обробка файлу ── */
  processFile: function(file) {
    AIFileUpload.readFile(file).then(function(result) {
      AIFileUpload._current = result;
      AIFileUpload.showPreview(result);
    }).catch(function(err) {
      AIAgentUI.addMessage('error', err);
    });
  },

  /* ── Показати прев'ю ── */
  showPreview: function(file) {
    var preview = document.getElementById('ai-file-preview');
    if (!preview) return;

    var icon = file.type === 'image' ? '🖼' :
               file.type === 'pdf'   ? '📄' : '📝';
    var size = file.size > 1024*1024
      ? (file.size/1024/1024).toFixed(1) + ' MB'
      : (file.size/1024).toFixed(0) + ' KB';

    preview.style.display = 'flex';
    preview.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;">' +
        '<span style="font-size:16px;">' + icon + '</span>' +
        '<div style="min-width:0;">' +
          '<div style="font-size:12px;color:#c9d8e4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + file.name + '</div>' +
          '<div style="font-size:10px;color:#4a6070;">' + size + (file.type==='text' ? ' · ' + file.content.split('\n').length + ' рядків' : '') + '</div>' +
        '</div>' +
      '</div>' +
      '<button onclick="window.AIFileUpload.clearFile()" ' +
        'style="background:transparent;border:none;color:#4a6070;cursor:pointer;font-size:14px;flex-shrink:0;">✕</button>';

    /* Якщо зображення — показуємо мініатюру */
    if (file.type === 'image') {
      var img = document.createElement('img');
      img.src   = file.content;
      img.style.cssText = 'width:100%;max-height:120px;object-fit:contain;border-radius:6px;margin-top:6px;';
      preview.appendChild(img);
      preview.style.flexDirection = 'column';
    }
  },

  /* ── Очистити файл ── */
  clearFile: function() {
    AIFileUpload._current = null;
    var preview = document.getElementById('ai-file-preview');
    if (preview) { preview.style.display = 'none'; preview.innerHTML = ''; }
  },

  /* ── Будуємо prompt з файлом ── */
  buildPromptWithFile: function(userMessage, file) {
    if (!file) return userMessage;

    if (file.type === 'text') {
      var lines = file.content.split('\n').length;
      var preview = file.content.length > 8000
        ? file.content.substring(0, 8000) + '\n... [обрізано, ' + lines + ' рядків всього]'
        : file.content;

      return userMessage + '\n\n' +
        '=== ВМІСТ ФАЙЛУ: ' + file.name + ' ===\n' +
        preview + '\n' +
        '=== КІНЕЦЬ ФАЙЛУ ===\n\n' +
        'Файл містить ' + lines + ' рядків (' + (file.content.length/1024).toFixed(1) + ' KB). ' +
        'Проаналізуй вміст і дай відповідь на моє запитання.';
    }

    if (file.type === 'image') {
      return userMessage + '\n\n' +
        '[Користувач завантажив зображення: ' + file.name + ']\n' +
        'Опиши що бачиш на зображенні і як це допоможе налаштувати роутер. ' +
        'Якщо це скріншот конфігурації або помилки — проаналізуй і дай рекомендації.';
    }

    return userMessage;
  },

  /* ── Drag & Drop ── */
  initDragDrop: function(container) {
    if (!container) return;
    container.addEventListener('dragover', function(e) {
      e.preventDefault();
      container.style.borderColor = '#5b4efc';
    });
    container.addEventListener('dragleave', function() {
      container.style.borderColor = '';
    });
    container.addEventListener('drop', function(e) {
      e.preventDefault();
      container.style.borderColor = '';
      var file = e.dataTransfer.files[0];
      if (file) AIFileUpload.processFile(file);
    });
  }
};

console.log('[AIFileUpload] Ready ✅');
