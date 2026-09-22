'use strict';

window.MikroTikKB = {
  _text:   '',
  _loaded: false,
  _files: [
  "MikroTik RouterOS v7 — зведений практичний мануал.txt"
],

  load: function() {
    if (MikroTikKB._loaded) return Promise.resolve(MikroTikKB._text);
    var files = MikroTikKB._files;
    if (!files || files.length === 0) {
      console.warn('[MikroTikKB] No files configured');
      return Promise.resolve('');
    }
    return Promise.allSettled(
      files.map(function(f) {
        return fetch('./' + f)
          .then(function(r) {
            if (!r.ok) { console.warn('[MikroTikKB] 404:', f); return ''; }
            return r.text();
          })
          .catch(function(e) {
            console.warn('[MikroTikKB] Error:', f, e);
            return '';
          });
      })
    ).then(function(results) {
      var parts = [];
      results.forEach(function(r, i) {
        if (r.status === 'fulfilled' && r.value && r.value.length > 0) {
          parts.push('=== FILE: ' + files[i] + ' ===');
          parts.push(r.value);
          console.log('[MikroTikKB] OK:', files[i], r.value.length, 'chars');
        }
      });
      MikroTikKB._text   = parts.join('\n\n');
      MikroTikKB._loaded = true;
      console.log('[MikroTikKB] Total:', MikroTikKB._text.length, 'chars ✅');
      return MikroTikKB._text;
    });
  },

  /* Релевантний контекст по ключових словах */
  getContext: function(query, maxChars) {
    maxChars = maxChars || 3000;
    if (!MikroTikKB._loaded || !MikroTikKB._text) return '';
    var q = (query || '').toLowerCase();
    var keywords = q.split(/\s+/).filter(function(w) { return w.length > 2; });
    if (keywords.length === 0) return MikroTikKB._text.substring(0, maxChars);
    var lines  = MikroTikKB._text.split('\n');
    var blocks = [];
    var i = 0;
    while (i < lines.length) {
      var line  = lines[i].toLowerCase();
      var score = 0;
      keywords.forEach(function(kw) {
        if (line.indexOf(kw) >= 0) score += 3;
      });
      if (score > 0) {
        var s   = Math.max(0, i - 2);
        var e   = Math.min(lines.length, i + 20);
        var txt = lines.slice(s, e).join('\n');
        blocks.push({ score: score, text: txt });
        i = e;
      } else { i++; }
    }
    blocks.sort(function(a, b) { return b.score - a.score; });
    var result = [];
    var total  = 0;
    for (var j = 0; j < blocks.length; j++) {
      if (total + blocks[j].text.length > maxChars) break;
      result.push(blocks[j].text);
      total += blocks[j].text.length;
    }
    if (result.length === 0) return '';
    return '[БАЗА ЗНАНЬ MIKROTIK]\n' + result.join('\n---\n');
  }
};

/* Завантажуємо одразу */
document.addEventListener('DOMContentLoaded', function() {
  MikroTikKB.load().then(function() {
    /* Тест в консолі: MikroTikKB._loaded, MikroTikKB._text.length */
    console.log('[MikroTikKB] Ready! Test: MikroTikKB.getContext("ping") ✅');
  });
});
