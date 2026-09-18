# -*- coding: utf-8 -*-
import subprocess

with open('ai-agent/ai-agent-ui.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Замінюємо рядки 446-482 (вся функція send)
new_send = """/* ── Відправити ── */
AIAgentUI.send = function() {
  var input = document.getElementById('ai-input');
  if (!input || AIAgentUI.state.isLoading) return;

  var text = input.value.trim();
  var file = window.AIFileUpload ? window.AIFileUpload._current : null;
  if (!text && !file) return;
  if (!text) text = 'Проаналізуй цей файл і налаштуй роутер відповідно';

  var finalPrompt = file
    ? window.AIFileUpload.buildPromptWithFile(text, file)
    : text;

  input.value = '';
  input.style.height = 'auto';

  var displayText = file ? text + '\\n📎 ' + file.name : text;
  AIAgentUI.addMessage('user', displayText);
  AIAgentUI.setLoading(true);
  if (window.AIFileUpload) window.AIFileUpload.clearFile();

  /* Анімація друку */
  var typing = document.createElement('div');
  typing.className = 'ai-typing';
  typing.innerHTML = '<span></span><span></span><span></span>';
  var container = document.getElementById('ai-messages');
  if (container) {
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;
  }

  AIAgent.send(finalPrompt)
    .then(function(response) {
      if (typing.parentNode) typing.remove();
      AIAgentUI.addMessage('assistant', response, { time: true });
    })
    .catch(function(err) {
      if (typing.parentNode) typing.remove();
      AIAgentUI.addMessage('error', String(err));
    })
    .finally(function() {
      AIAgentUI.setLoading(false);
      if (input) input.focus();
    });
};
"""

# Знаходимо початок і кінець функції send
start_line = None
end_line   = None
for i, line in enumerate(lines):
    if '/* ── Відправити ── */' in line:
        start_line = i
    if start_line and i > start_line and line.strip() == '};' and end_line is None:
        end_line = i + 1
        break

print(f'send функція: рядки {start_line+1}-{end_line}')
print('Перший рядок:', repr(lines[start_line].rstrip()))
print('Останній рядок:', repr(lines[end_line-1].rstrip()))

# Замінюємо
lines = lines[:start_line] + [new_send] + lines[end_line:]

with open('ai-agent/ai-agent-ui.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

r = subprocess.run(['node', '--check', 'ai-agent/ai-agent-ui.js'],
                   capture_output=True, text=True)
print('Синтаксис:', 'OK ✅' if r.returncode == 0 else '❌\n' + r.stderr[:200])