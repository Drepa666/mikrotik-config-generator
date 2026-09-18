# -*- coding: utf-8 -*-
import subprocess, re

with open('diff-apply.js', 'r', encoding='utf-8') as f:
    content = f.read()

# ── Фікс 1: AI — знаходимо runDiffAI і виправляємо виклик ──
old_ai = """  var aiFn = window.groqChat || window.sendToAI || window.askAI;
  var done = function(text) {
    out.innerHTML = '<div style="line-height:1.8;">' +
      text.replace(/\\*\\*(.*?)\\*\\*/g,'<b style="color:#5fd0a5;">$1</b>').replace(/\\n/g,'<br>') +
    '</div>';
    if (btn) btn.disabled = false;
  };
  if (typeof aiFn === 'function') {
    aiFn(prompt).then(done).catch(function(){ done(localDiffAI(d, mode)); });
  } else {
    done(localDiffAI(d, mode));
  }"""

new_ai = """  var done = function(text) {
    out.innerHTML = '<div style="line-height:1.8;">' +
      (text||'').replace(/\\*\\*(.*?)\\*\\*/g,'<b style="color:#5fd0a5;">$1</b>').replace(/\\n/g,'<br>') +
    '</div>';
    if (btn) btn.disabled = false;
  };
  /* Electron Bridge AI */
  if (window.electronAPI && typeof window.electronAPI.callAI === 'function') {
    window.electronAPI.callAI(prompt).then(done).catch(function(e){
      console.error('AI error:', e);
      done(localDiffAI(d, mode));
    });
  } else if (window.__callAI) {
    window.__callAI(prompt).then(done).catch(function(){ done(localDiffAI(d, mode)); });
  } else {
    done(localDiffAI(d, mode));
  }"""

if old_ai in content:
    content = content.replace(old_ai, new_ai)
    print('OK: AI виклик виправлено ✅')
else:
    print('WARN: AI блок не знайдено точно — шукаємо...')
    idx = content.find('window.groqChat || window.sendToAI')
    if idx > 0:
        print(repr(content[idx:idx+200]))

# ── Фікс 2: Diff вирівнювання — zip delete+insert ──
old_merge = """  var pairs = [], k = 0;
  while (k < raw.length) {
    var cur = raw[k], nxt = raw[k+1];
    if (cur.type === 'delete' && nxt && nxt.type === 'insert') {
      pairs.push({type:'change', a:cur.a, b:nxt.b, na:cur.na, nb:nxt.nb}); k += 2;
    } else { pairs.push(cur); k++; }
  }"""

new_merge = """  /* Групуємо послідовні delete і insert — zip разом */
  var pairs = [];
  var k = 0;
  while (k < raw.length) {
    /* Збираємо блок delete */
    var dels = [], ins = [];
    while (k < raw.length && raw[k].type === 'delete') { dels.push(raw[k]); k++; }
    while (k < raw.length && raw[k].type === 'insert') { ins.push(raw[k]); k++; }
    if (dels.length > 0 || ins.length > 0) {
      var maxLen = Math.max(dels.length, ins.length);
      for (var z = 0; z < maxLen; z++) {
        var d = dels[z], ins_z = ins[z];
        if (d && ins_z) {
          pairs.push({type:'change', a:d.a, b:ins_z.b, na:d.na, nb:ins_z.nb});
        } else if (d) {
          pairs.push({type:'delete', a:d.a, na:d.na});
        } else {
          pairs.push({type:'insert', b:ins_z.b, nb:ins_z.nb});
        }
      }
    }
    if (k < raw.length && raw[k].type === 'equal') {
      pairs.push(raw[k]); k++;
    }
  }"""

if old_merge in content:
    content = content.replace(old_merge, new_merge)
    print('OK: diff вирівнювання виправлено ✅')
else:
    print('WARN: merge блок не знайдено — шукаємо...')
    idx = content.find('var pairs = [], k = 0;')
    if idx > 0:
        print(repr(content[idx:idx+300]))

# ── Фікс 3: electron-bridge AI інтеграція ──
# Перевіряємо як викликається AI в electron-bridge.js
with open('electron-bridge.js', 'r', encoding='utf-8') as f:
    bridge = f.read()

for needle in ['callAI', 'groqChat', 'sendToAI', 'askAI', 'ipcRenderer']:
    idx = bridge.find(needle)
    if idx > 0:
        print(f'\nelectron-bridge [{needle}] @ {idx}:')
        print(bridge[max(0,idx-50):idx+150])
        break

with open('diff-apply.js', 'w', encoding='utf-8') as f:
    f.write(content)

r = subprocess.run(['node', '--check', 'diff-apply.js'],
                   capture_output=True, text=True)
print('\nСинтаксис:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:300])