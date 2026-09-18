# -*- coding: utf-8 -*-
import subprocess

with open('ai-agent/ai-agent-executor.js', 'r', encoding='utf-8') as f:
    ex = f.read()

old_btn = """'border-radius:8px;padding:10px 24px;cursor:pointer;font-size:13px;font-weight:700;">' +
            (hasDangerous ? '⚠️ Виконати все одно' : '▶ Виконати') +
          '</button>' +"""

new_btn = """'border-radius:8px;padding:10px 24px;cursor:pointer;font-size:13px;font-weight:700;">' +
            (hasDangerous ? '⚠️ Відкрити термінал' : '▶ Відкрити термінал') +
          '</button>' +"""

# Замінюємо onclick теж
old_onclick = """'<button onclick="window.AIExecutor.runAll(' + JSON.stringify(commands).replace(/'/g, "\\'") + ')" ' +"""
new_onclick = """'<button onclick="window.AIExecutor.runInTerminal(' + JSON.stringify(commands).replace(/'/g, "\\'") + ')" ' +"""

if old_btn in ex:
    ex = ex.replace(old_btn, new_btn)
    print('OK: текст кнопки ✅')
else:
    print('ERR: текст не знайдено')

if old_onclick in ex:
    ex = ex.replace(old_onclick, new_onclick)
    print('OK: onclick → runInTerminal ✅')
else:
    # Шукаємо інший варіант
    idx = ex.find('runAll(')
    if idx > 0:
        print(f'runAll @ {idx}:')
        print(repr(ex[max(0,idx-50):idx+100]))

with open('ai-agent/ai-agent-executor.js', 'w', encoding='utf-8') as f:
    f.write(ex)

r = subprocess.run(['node', '--check', 'ai-agent/ai-agent-executor.js'],
                   capture_output=True, text=True)
print('Синтаксис:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:150])