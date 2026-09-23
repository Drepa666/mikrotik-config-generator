# -*- coding: utf-8 -*-
import subprocess, tempfile, os

with open('rm-sections.js', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('\r\n', '\n')

# 1. Замінюємо заголовок таблиці — додаємо колонку drag handle
OLD_TH = (
    "    html += '<div style=\"overflow-x:auto;\"><table class=\"rm-table rm-table-compact\">' +\n"
    "      '<tr><th>#</th><th>Chain</th><th>Action</th><th>Protocol</th>' +\n"
    "      '<th>Src</th><th>Dst</th><th>Port</th><th>In/Out</th>' +\n"
    "      '<th>State</th><th>Comment</th><th style=\"text-align:right;\">Дії</th></tr>';"
)
NEW_TH = (
    "    html += '<div style=\"overflow-x:auto;\"><table class=\"rm-table rm-table-compact\" id=\"rm-fw-table\">' +\n"
    "      '<tr>' +\n"
    "      '<th style=\"width:20px;\"></th>' +\n"
    "      '<th>#</th><th>Chain</th><th>Action</th><th>Protocol</th>' +\n"
    "      '<th>Src</th><th>Dst</th><th>Port</th><th>In/Out</th>' +\n"
    "      '<th>State</th><th>Comment</th><th style=\"text-align:right;\">Дії</th></tr>';"
)
print(f'OLD_TH: {"FOUND" if OLD_TH in content else "NOT FOUND"}')
if OLD_TH in content:
    content = content.replace(OLD_TH, NEW_TH, 1)
    print('OK: TH оновлено')

# 2. Замінюємо рядок таблиці — додаємо drag handle і data атрибути
OLD_ROW = (
    "      html += '<tr style=\"' + (disabled ? 'opacity:.5;' : '') + '\">' +\n"
    "        '<td style=\"color:#8ea3b0;font-size:11px;\">' + (idx+1) + '</td>' +"
)
NEW_ROW = (
    "      html += '<tr ' +\n"
    "        'draggable=\"true\" ' +\n"
    "        'data-id=\"' + esc(id) + '\" ' +\n"
    "        'data-idx=\"' + idx + '\" ' +\n"
    "        'data-api=\"' + esc(apiPath) + '\" ' +\n"
    "        'style=\"' + (disabled ? 'opacity:.5;' : '') + 'cursor:grab;\" ' +\n"
    "        'class=\"rm-fw-row\">' +\n"
    "        '<td style=\"color:#4a6070;font-size:14px;padding:0 4px;cursor:grab;\" title=\"Перетягни для зміни порядку\">⠿</td>' +\n"
    "        '<td style=\"color:#8ea3b0;font-size:11px;\">' + (idx+1) + '</td>' +"
)
print(f'OLD_ROW: {"FOUND" if OLD_ROW in content else "NOT FOUND"}')
if OLD_ROW in content:
    content = content.replace(OLD_ROW, NEW_ROW, 1)
    print('OK: ROW оновлено')

# 3. Додаємо drag-and-drop логіку в setTimeout блок
OLD_SETUP = "      window.__rmFWToggle = function(id, path, disabled) {"
NEW_SETUP = (
    "      /* ── Drag & Drop для зміни порядку ── */\n"
    "      (function initDragDrop() {\n"
    "        var rows    = document.querySelectorAll('.rm-fw-row');\n"
    "        var dragSrc = null;\n"
    "        var dragSrcIdx = null;\n"
    "\n"
    "        rows.forEach(function(row) {\n"
    "          row.addEventListener('dragstart', function(e) {\n"
    "            dragSrc    = row;\n"
    "            dragSrcIdx = parseInt(row.dataset.idx);\n"
    "            e.dataTransfer.effectAllowed = 'move';\n"
    "            e.dataTransfer.setData('text/plain', row.dataset.id);\n"
    "            setTimeout(function() { row.style.opacity = '0.4'; }, 0);\n"
    "          });\n"
    "\n"
    "          row.addEventListener('dragend', function() {\n"
    "            row.style.opacity = '';\n"
    "            document.querySelectorAll('.rm-fw-row').forEach(function(r) {\n"
    "              r.classList.remove('rm-drag-over');\n"
    "              r.style.borderTop = '';\n"
    "            });\n"
    "          });\n"
    "\n"
    "          row.addEventListener('dragover', function(e) {\n"
    "            e.preventDefault();\n"
    "            e.dataTransfer.dropEffect = 'move';\n"
    "            document.querySelectorAll('.rm-fw-row').forEach(function(r) {\n"
    "              r.style.borderTop = '';\n"
    "            });\n"
    "            row.style.borderTop = '2px solid #5fd0a5';\n"
    "          });\n"
    "\n"
    "          row.addEventListener('dragleave', function() {\n"
    "            row.style.borderTop = '';\n"
    "          });\n"
    "\n"
    "          row.addEventListener('drop', function(e) {\n"
    "            e.preventDefault();\n"
    "            row.style.borderTop = '';\n"
    "            if (!dragSrc || dragSrc === row) return;\n"
    "\n"
    "            var destIdx = parseInt(row.dataset.idx);\n"
    "            var ruleId  = dragSrc.dataset.id;\n"
    "            var apiP    = dragSrc.dataset.api;\n"
    "\n"
    "            if (dragSrcIdx === destIdx) return;\n"
    "\n"
    "            /* Візуальний feedback */\n"
    "            dragSrc.style.opacity = '0.3';\n"
    "            row.style.background  = '#1a2a1a';\n"
    "\n"
    "            /* REST API: переміщення правила */\n"
    "            restCall(r, 'POST', apiP + '/move', {\n"
    "              '.id':        ruleId,\n"
    "              'destination': String(destIdx),\n"
    "            }).then(function(res) {\n"
    "              S().invalidateRelated('fwFilter');\n"
    "              setTimeout(window.rmSectionFirewall, 300);\n"
    "            }).catch(function(e) {\n"
    "              console.error('[FW Move] error:', e);\n"
    "              dragSrc.style.opacity = '';\n"
    "              row.style.background  = '';\n"
    "              /* Fallback через SSH */\n"
    "              var srcNum = dragSrcIdx + 1;\n"
    "              var dstNum = destIdx;\n"
    "              sshCall(r, '/ip firewall filter move ' + srcNum + ' destination=' + dstNum)\n"
    "                .then(function() {\n"
    "                  S().invalidateRelated('fwFilter');\n"
    "                  setTimeout(window.rmSectionFirewall, 300);\n"
    "                });\n"
    "            });\n"
    "          });\n"
    "        });\n"
    "      })();\n"
    "\n"
    "      window.__rmFWToggle = function(id, path, disabled) {"
)
print(f'OLD_SETUP: {"FOUND" if OLD_SETUP in content else "NOT FOUND"}')
if OLD_SETUP in content:
    content = content.replace(OLD_SETUP, NEW_SETUP, 1)
    print('OK: drag-and-drop логіка додана')

# 4. Додаємо CSS для drag-and-drop
OLD_CSS_TARGET = "window.rmSectionFirewall"
CSS_INJECT = """
/* ── Firewall Drag & Drop CSS ── */
if (!document.getElementById('fw-dnd-css')) {
  var s = document.createElement('style');
  s.id = 'fw-dnd-css';
  s.textContent = [
    '.rm-fw-row { transition: opacity .15s, border-top .1s; }',
    '.rm-fw-row:hover td:first-child { color: #5fd0a5 !important; }',
    '.rm-fw-row.rm-drag-over { border-top: 2px solid #5fd0a5; }',
    '#rm-fw-table td:first-child { user-select:none; }',
  ].join('\\n');
  document.head.appendChild(s);
}
"""

# Вставляємо CSS після відкриття setTimeout блоку
OLD_TIMEOUT = "    setTimeout(function() {\n      var search = document.getElementById('rm-fw-search');"
NEW_TIMEOUT = "    setTimeout(function() {\n" + CSS_INJECT + "\n      var search = document.getElementById('rm-fw-search');"
print(f'OLD_TIMEOUT: {"FOUND" if OLD_TIMEOUT in content else "NOT FOUND"}')
if OLD_TIMEOUT in content:
    content = content.replace(OLD_TIMEOUT, NEW_TIMEOUT, 1)
    print('OK: CSS додано')

# Tempfile
with tempfile.NamedTemporaryFile(suffix='.js', delete=False, mode='w', encoding='utf-8') as tmp:
    tmp.write(content)
    tmp_name = tmp.name
r = subprocess.run(['node','--check', tmp_name], capture_output=True, text=True)
os.unlink(tmp_name)
if r.returncode != 0:
    print('SYNTAX ERROR!\n' + r.stderr[:400])
    exit(1)
print('Tempfile: OK')

with open('rm-sections.js', 'w', encoding='utf-8') as f:
    f.write(content)
size = os.path.getsize('rm-sections.js')
r2 = subprocess.run(['node','--check','rm-sections.js'], capture_output=True, text=True)
print(f'rm-sections.js: {"OK ✅" if r2.returncode==0 else "FAIL"} ({size:,}b)')
if r2.returncode != 0:
    print(r2.stderr[:200])
    exit(1)

# Git
subprocess.run(['git','pull','--rebase','origin','main'], capture_output=True)
subprocess.run(['git','add','rm-sections.js'], capture_output=True)
subprocess.run(['git','commit','-m',
    'feat: drag-and-drop reorder for Firewall rules, REST move + SSH fallback'],
    capture_output=True)
rp = subprocess.run(['git','push','origin','main'], capture_output=True, text=True)
print('push:', rp.stdout.strip() or rp.stderr.strip()[-60:])
print('\nDone! npm start')