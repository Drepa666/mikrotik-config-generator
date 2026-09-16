# -*- coding: utf-8 -*-
import subprocess, re

with open('diff-apply.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Знаходимо ВСІ diffLines функції
matches = list(re.finditer(r'function diffLines\(', content))
print(f'Знайдено diffLines функцій: {len(matches)}')
for m in matches:
    print(f'  @ {m.start()}: {content[m.start():m.start()+80]}')

# Видаляємо ВСІ diffLines і вставляємо одну правильну
NEW_DIFF = '''function diffLines(textA, textB) {
  var linesA = textA.split('\\n');
  var linesB = textB.split('\\n');
  var m = linesA.length, n = linesB.length;
  var dp = [];
  for (var i = 0; i <= m; i++) {
    dp[i] = [];
    for (var j = 0; j <= n; j++) dp[i][j] = 0;
  }
  for (var i = 1; i <= m; i++) {
    for (var j = 1; j <= n; j++) {
      dp[i][j] = (linesA[i-1].trim() === linesB[j-1].trim())
        ? dp[i-1][j-1] + 1
        : Math.max(dp[i-1][j], dp[i][j-1]);
    }
  }
  var raw = [];
  var i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i-1].trim() === linesB[j-1].trim()) {
      raw.unshift({type:'equal',  a:linesA[i-1], b:linesB[j-1], na:i, nb:j});
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      raw.unshift({type:'insert', b:linesB[j-1], nb:j});
      j--;
    } else {
      raw.unshift({type:'delete', a:linesA[i-1], na:i});
      i--;
    }
  }
  var pairs = [];
  var k = 0;
  while (k < raw.length) {
    var cur = raw[k], nxt = raw[k+1];
    if (cur.type === 'delete' && nxt && nxt.type === 'insert') {
      pairs.push({type:'change', a:cur.a, b:nxt.b, na:cur.na, nb:nxt.nb});
      k += 2;
    } else { pairs.push(cur); k++; }
  }
  return {
    pairs:     pairs,
    added:     pairs.filter(function(p){return p.type==='insert';}).map(function(p){return p.b;}),
    removed:   pairs.filter(function(p){return p.type==='delete';}).map(function(p){return p.a;}),
    unchanged: pairs.filter(function(p){return p.type==='equal'; }).map(function(p){return p.a;}),
  };
}'''

# Видаляємо всі існуючі diffLines
def remove_function(text, fname):
    pattern = r'function ' + re.escape(fname) + r'\s*\([^)]*\)\s*\{'
    while True:
        m = re.search(pattern, text)
        if not m: break
        start = m.start()
        depth = 0; found = False; end = start
        for i, ch in enumerate(text[start:], start):
            if ch == '{': depth += 1; found = True
            elif ch == '}': depth -= 1
            if found and depth == 0: end = i + 1; break
        print(f'  Видаляємо diffLines @ {start}-{end}')
        text = text[:start] + text[end:]
    return text

content = remove_function(content, 'diffLines')

# Вставляємо нову перед initDiffApply
idx = content.find('function initDiffApply')
if idx > 0:
    content = content[:idx] + NEW_DIFF + '\n\n' + content[idx:]
    print('OK: нова diffLines вставлена перед initDiffApply ✅')
else:
    content = NEW_DIFF + '\n\n' + content
    print('OK: нова diffLines вставлена на початок ✅')

# Перевіряємо скільки diffLines тепер
count = len(re.findall(r'function diffLines\(', content))
print(f'diffLines функцій після фіксу: {count}')

with open('diff-apply.js', 'w', encoding='utf-8') as f:
    f.write(content)

r = subprocess.run(['node', '--check', 'diff-apply.js'],
                   capture_output=True, text=True)
print('Синтаксис:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:300])