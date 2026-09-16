# -*- coding: utf-8 -*-
import subprocess

# Читаємо з правильним encoding
for enc in ['utf-8', 'utf-8-sig', 'cp1251']:
    try:
        with open('index.html', 'r', encoding=enc) as f:
            content = f.read()
        if 'Deploy' in content:
            print(f'Encoding: {enc}')
            break
    except: continue

print(f'Розмір: {len(content)}')

# ── 1. Видаляємо старий diff розділ (DIFF .RSC ФАЙЛІВ) ──
markers_start = [
    'DIFF .RSC',
    'diff-text-a',
    'diff-file-a',
]
markers_end = [
    '<div id="diff-output"',
]

# Знаходимо початок старої секції
start_idx = -1
for m in markers_start:
    idx = content.find(m)
    if idx > 0:
        # Йдемо назад до <section або <div class="panel"
        for tag in ['<section', '<div class="panel', '<div id="tab-diff']:
            si = content.rfind(tag, 0, idx)
            if si > 0 and idx - si < 2000:
                start_idx = si
                print(f'Початок старого diff: {si} (по "{tag}")')
                break
        if start_idx > 0:
            break

# Знаходимо кінець
end_idx = -1
for m in markers_end:
    idx = content.find(m)
    if idx > 0:
        # Знаходимо закриваючий </div>
        depth = 0; found = False
        for i in range(idx, min(len(content), idx+5000)):
            if content[i:i+4] == '<div': depth += 1
            elif content[i:i+6] == '</div': depth -= 1
            if depth == 0 and i > idx + 5:
                end_idx = i + 6
                found = True
                break
        if found:
            print(f'Кінець старого diff: {end_idx}')
            break

if start_idx > 0 and end_idx > 0 and end_idx > start_idx:
    removed = content[start_idx:end_idx]
    print(f'Видаляємо {end_idx-start_idx} символів')
    print('Початок:', removed[:100])
    print('Кінець:', removed[-100:])
    content = content[:start_idx] + content[end_idx:]
    print('OK: старий diff видалено ✅')
else:
    print(f'ERR: start={start_idx}, end={end_idx}')
    # Показуємо контекст
    idx = content.find('diff-text-a')
    if idx > 0:
        print(f'\ndiff-text-a @ {idx}:')
        print(content[max(0,idx-300):idx+100])

# ── 2. Знаходимо кнопки Версії/Deploy і додаємо Diff&Apply ──
btn_markers = [
    'btn-mass-deploy',
    'mass-deploy',
    'Масовий',
    'btn-versions',
    'Версії',
]

insert_idx = -1
for m in btn_markers:
    idx = content.find(m)
    if idx > 0:
        # Знаходимо кінець кнопки/елементу
        end_btn = content.find('>', idx) + 1
        # Потім кінець тексту кнопки
        end_btn2 = content.find('</button>', idx)
        if end_btn2 > 0:
            insert_idx = end_btn2 + 9
            print(f'\nВставляємо після "{m}" @ {insert_idx}')
            break

if insert_idx > 0:
    DIFF_BTN = (
        '\n    <button id="btn-diff-apply-open" '
        'style="background:linear-gradient(135deg,#5b4efc,#8b5efc);'
        'color:#fff;border:none;border-radius:8px;padding:8px 18px;'
        'font-size:13px;font-weight:600;cursor:pointer;transition:opacity .2s;" '
        'onclick="openDiffApplyModal()">'
        '&#128269; Diff &amp; Apply'
        '</button>'
    )
    content = content[:insert_idx] + DIFF_BTN + content[insert_idx:]
    print('OK: кнопка Diff&Apply додана ✅')

# ── 3. Додаємо модал перед </body> ──
MODAL = '''
<!-- ═══════════════ DIFF & APPLY MODAL ═══════════════ -->
<div id="diff-apply-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;
  background:rgba(0,0,0,.7);z-index:9999;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;">
  <div style="background:#0d1117;border:1px solid #2a3b48;border-radius:12px;width:100%;max-width:1200px;
    max-height:90vh;overflow-y:auto;position:relative;">
    <!-- Header -->
    <div style="display:flex;align-items:center;padding:16px 20px;border-bottom:1px solid #2a3b48;position:sticky;top:0;background:#0d1117;z-index:1;">
      <span style="font-size:18px;margin-right:10px;">&#128269;</span>
      <span style="color:#e6edf3;font-weight:700;font-size:16px;">Diff &amp; Apply — Порівняння конфігурацій</span>
      <button onclick="closeDiffApplyModal()"
        style="margin-left:auto;background:transparent;border:1px solid #2a3b48;color:#8ea3b0;
               border-radius:6px;padding:4px 12px;cursor:pointer;font-size:14px;">✕ Закрити</button>
    </div>
    <!-- Body -->
    <div style="padding:20px;">
      <!-- Підключення до роутера -->
      <div style="background:#080f17;border:1px solid #2a3b48;border-radius:8px;padding:14px 16px;margin-bottom:16px;">
        <div style="color:#4a90d9;font-size:12px;font-weight:600;margin-bottom:10px;">&#128279; Підключення до роутера (для отримання конфігу)</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">
          <div><label style="color:#8ea3b0;font-size:11px;display:block;margin-bottom:4px;">IP</label>
            <input id="da-router-ip" type="text" value="192.168.88.1"
              style="background:#060d14;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:6px 10px;font-size:12px;width:130px;"></div>
          <div><label style="color:#8ea3b0;font-size:11px;display:block;margin-bottom:4px;">Логін</label>
            <input id="da-router-user" type="text" value="admin"
              style="background:#060d14;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:6px 10px;font-size:12px;width:100px;"></div>
          <div><label style="color:#8ea3b0;font-size:11px;display:block;margin-bottom:4px;">Пароль</label>
            <input id="da-router-pass" type="password"
              style="background:#060d14;border:1px solid #2a3b48;border-radius:6px;color:#e6edf3;padding:6px 10px;font-size:12px;width:120px;"></div>
          <button id="da-fetch-current"
            style="background:#1a3a2a;border:1px solid #2a5a3a;color:#5fd0a5;border-radius:6px;padding:7px 14px;cursor:pointer;font-size:12px;font-weight:600;">
            &#128228; Отримати конфіг з роутера</button>
          <span id="da-fetch-status" style="font-size:11px;color:#4a6070;"></span>
        </div>
      </div>
      <!-- Два поля конфігу -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="color:#e6edf3;font-size:13px;font-weight:600;">&#128196; Конфіг A (оригінал)</span>
            <span id="da-count-a" style="font-size:11px;color:#4a6070;margin-left:auto;">0 рядків</span>
            <label style="background:#1a2a3a;border:1px solid #2a3b48;border-radius:4px;padding:2px 8px;
              cursor:pointer;font-size:11px;color:#8ea3b0;">
              &#128194; Файл<input type="file" id="da-file-a" accept=".rsc,.txt" style="display:none;"></label>
            <button id="da-clear-a" style="background:transparent;border:1px solid #2a3b48;color:#4a6070;
              padding:2px 8px;border-radius:4px;cursor:pointer;font-size:10px;">&#128465;</button>
          </div>
          <textarea id="da-text-a" rows="15"
            placeholder="Вставте поточний конфіг або отримайте з роутера..."
            style="width:100%;background:#060d14;border:1px solid #2a3b48;border-radius:6px;
              color:#e6edf3;padding:10px;font-family:monospace;font-size:12px;
              resize:vertical;box-sizing:border-box;line-height:1.6;"></textarea>
        </div>
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="color:#e6edf3;font-size:13px;font-weight:600;">&#128196; Конфіг B (новий)</span>
            <span id="da-count-b" style="font-size:11px;color:#4a6070;margin-left:auto;">0 рядків</span>
            <label style="background:#1a2a3a;border:1px solid #2a3b48;border-radius:4px;padding:2px 8px;
              cursor:pointer;font-size:11px;color:#8ea3b0;">
              &#128194; Файл<input type="file" id="da-file-b" accept=".rsc,.txt" style="display:none;"></label>
            <button id="da-clear-b" style="background:transparent;border:1px solid #2a3b48;color:#4a6070;
              padding:2px 8px;border-radius:4px;cursor:pointer;font-size:10px;">&#128465;</button>
          </div>
          <textarea id="da-text-b" rows="15"
            placeholder="Вставте новий конфіг або згенерований..."
            style="width:100%;background:#060d14;border:1px solid #2a3b48;border-radius:6px;
              color:#e6edf3;padding:10px;font-family:monospace;font-size:12px;
              resize:vertical;box-sizing:border-box;line-height:1.6;"></textarea>
        </div>
      </div>
      <!-- Кнопки -->
      <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
        <button id="da-compare"
          style="background:linear-gradient(135deg,#5fd0a5,#4ab890);color:#082018;
            border:none;border-radius:8px;padding:10px 24px;font-size:14px;
            font-weight:700;cursor:pointer;">&#128269; Порівняти</button>
        <button id="da-apply-btn"
          style="background:linear-gradient(135deg,#4a90d9,#357abd);color:#fff;
            border:none;border-radius:8px;padding:10px 20px;font-size:13px;
            font-weight:600;cursor:pointer;">&#9654; Застосувати зміни</button>
        <button id="da-apply-dry"
          style="background:#1a2a3a;border:1px solid #2a3b48;color:#8ea3b0;
            border-radius:8px;padding:10px 20px;font-size:13px;cursor:pointer;">
          &#128196; Dry Run</button>
        <button id="da-clear-result"
          style="background:#1a2a3a;border:1px solid #2a3b48;color:#e05252;
            border-radius:8px;padding:10px 16px;font-size:13px;cursor:pointer;">
          &#128465; Очистити</button>
      </div>
      <!-- Статистика -->
      <div id="da-diff-stats" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;min-height:24px;"></div>
      <!-- Результат diff -->
      <div id="da-diff-output" style="margin-bottom:12px;"></div>
      <!-- Apply команди -->
      <div id="da-diff-result" style="display:none;margin-top:12px;">
        <div style="color:#8ea3b0;font-size:12px;margin-bottom:6px;">Команди для застосування:</div>
        <textarea id="da-apply-cmds" rows="6"
          style="width:100%;background:#060d14;border:1px solid #2a3b48;border-radius:6px;
            color:#5fd0a5;padding:10px;font-family:monospace;font-size:12px;
            resize:vertical;box-sizing:border-box;"></textarea>
      </div>
    </div>
  </div>
</div>
<script>
function openDiffApplyModal() {
  var m = document.getElementById('diff-apply-modal');
  if (m) {
    m.style.display = 'flex';
    injectDiffCSS();
    // Підтягуємо дані з активного роутера
    var routers = JSON.parse(localStorage.getItem('rm-routers') || '[]');
    var active  = localStorage.getItem('rm-active-router');
    var router  = routers.find(function(r){ return r.id === active; }) || routers[0];
    if (router) {
      var ip   = document.getElementById('da-router-ip');
      var user = document.getElementById('da-router-user');
      var pass = document.getElementById('da-router-pass');
      if (ip   && router.ip)   ip.value   = router.ip;
      if (user && router.user) user.value = router.user;
      if (pass && router.pass) pass.value = router.pass;
    }
  }
}
function closeDiffApplyModal() {
  var m = document.getElementById('diff-apply-modal');
  if (m) m.style.display = 'none';
}
// Закрити по кліку на фон
document.addEventListener('click', function(e) {
  var m = document.getElementById('diff-apply-modal');
  if (m && e.target === m) closeDiffApplyModal();
});
// ESC
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeDiffApplyModal();
});
</script>
<!-- ═══════════════ END DIFF & APPLY MODAL ═══════════════ -->
'''

# Вставляємо перед </body>
body_end = content.rfind('</body>')
if body_end > 0:
    content = content[:body_end] + MODAL + content[body_end:]
    print('OK: модал додано перед </body> ✅')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

r = subprocess.run(['node', '-e', 
    'var fs=require("fs"); var c=fs.readFileSync("index.html","utf8"); console.log("size:", c.length);'],
    capture_output=True, text=True)
print('index.html:', r.stdout.strip() if r.returncode==0 else r.stderr[:200])
print('Done ✅')