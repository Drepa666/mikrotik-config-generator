# -*- coding: utf-8 -*-
import subprocess

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Знаходимо початок секції — йдемо назад від btn-diff
idx = content.find('<button id="btn-diff">')
# Знаходимо початок батьківської секції (div з diff-label)
start = content.rfind('<div', 0, content.rfind('<div', 0, content.rfind('<div', 0, idx)))
# Знаходимо кінець після diff-output div
end = content.find('</div>', content.find('id="diff-output"')) + 6

print(f'start={start}, end={end}')
print('Початок:')
print(content[start:start+100])
print('Кінець:')
print(content[end-50:end+50])

# Новий блок — кнопка що відкриває наш Diff & Apply
NEW_SECTION = '''<div style="margin-top:16px;">
  <button id="btn-open-diff-apply"
    style="background:linear-gradient(135deg,#5fd0a5,#4ab890);color:#082018;
           border:none;border-radius:8px;padding:12px 24px;font-size:14px;
           font-weight:700;cursor:pointer;width:100%;transition:opacity .2s;"
    onmouseover="this.style.opacity='.85'"
    onmouseout="this.style.opacity='1'"
    onclick="
      var m = document.getElementById('diff-apply-modal');
      if (m) { m.style.display='flex'; }
      else if (typeof initDiffApply === 'function') { initDiffApply(); }
    ">
    &#128269; Diff &amp; Apply — Порівняти та застосувати конфіги
  </button>
</div>'''

content = content[:start] + NEW_SECTION + content[end:]
print(f'\nРозмір: {len(content)}')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('OK ✅')