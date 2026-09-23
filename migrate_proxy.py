# -*- coding: utf-8 -*-
import subprocess, tempfile, os

# ════════════════════════════════════════
# КРОК 1: preload.js — додаємо routerRest + routerSsh
# ════════════════════════════════════════
print('=== КРОК 1: preload.js ===')
with open('preload.js', 'r', encoding='utf-8') as f:
    preload = f.read()
preload = preload.replace('\r\n', '\n')

OLD_PRELOAD_END = (
    "  isElectron: true,\n"
    "});\n"
    "\n"
    "console.log('[preload] electronAPI ready — proxy автозапуск увімкнено');"
)
NEW_PRELOAD_END = (
    "  isElectron: true,\n"
    "\n"
    "  /* ── Прямий REST до роутера (без proxy.py) ── */\n"
    "  routerRest: function(opts) {\n"
    "    return ipcRenderer.invoke('router-rest', opts);\n"
    "  },\n"
    "\n"
    "  /* ── Прямий SSH до роутера (без proxy.py) ── */\n"
    "  routerSsh: function(opts) {\n"
    "    return ipcRenderer.invoke('router-ssh', opts);\n"
    "  },\n"
    "\n"
    "  /* ── SSH keep-alive сесія ── */\n"
    "  routerSshStream: function(opts, onData) {\n"
    "    ipcRenderer.on('ssh-stream-data', function(e, data) { onData(data); });\n"
    "    return ipcRenderer.invoke('router-ssh-stream', opts);\n"
    "  },\n"
    "});\n"
    "\n"
    "console.log('[preload] electronAPI ready — direct IPC mode');"
)

print(f'OLD: {"FOUND" if OLD_PRELOAD_END in preload else "NOT FOUND"}')
if OLD_PRELOAD_END in preload:
    preload = preload.replace(OLD_PRELOAD_END, NEW_PRELOAD_END, 1)
    print('OK: preload.js оновлено')

with tempfile.NamedTemporaryFile(suffix='.js', delete=False, mode='w', encoding='utf-8') as tmp:
    tmp.write(preload)
    tmp_name = tmp.name
r = subprocess.run(['node','--check', tmp_name], capture_output=True, text=True)
os.unlink(tmp_name)
if r.returncode != 0:
    print('SYNTAX ERROR preload!\n' + r.stderr[:200])
    exit(1)
print('Tempfile: OK')
with open('preload.js', 'w', encoding='utf-8') as f:
    f.write(preload)
print(f'preload.js: OK ({os.path.getsize("preload.js")}b)')

# ════════════════════════════════════════
# КРОК 2: main.js — додаємо IPC handlers
# ════════════════════════════════════════
print('\n=== КРОК 2: main.js ===')
with open('main.js', 'r', encoding='utf-8') as f:
    main = f.read()
main = main.replace('\r\n', '\n')

# Вставляємо ПІСЛЯ існуючих require
OLD_REQUIRES = "const { app, BrowserWindow, ipcMain, dialog, shell, session } = require('electron');"
NEW_REQUIRES = (
    "const { app, BrowserWindow, ipcMain, dialog, shell, session } = require('electron');\n"
    "const https  = require('https');\n"
    "const http   = require('http');\n"
    "const net    = require('net');\n"
    "let   ssh2Client = null;\n"
    "try { ssh2Client = require('ssh2'); } catch(e) { console.warn('[IPC] ssh2 not found:', e.message); }\n"
)
if OLD_REQUIRES in main:
    main = main.replace(OLD_REQUIRES, NEW_REQUIRES, 1)
    print('OK: requires додано')

# Вставляємо IPC handlers перед останнім рядком файлу
IPC_HANDLERS = """
/* ══════════════════════════════════════════════════════════
   DIRECT IPC — REST + SSH без proxy.py
   ══════════════════════════════════════════════════════════ */

/* ── REST handler ── */
ipcMain.handle('router-rest', async function(event, opts) {
  /*
    opts: { ip, port, user, pass, useHttps, method, path, body }
  */
  return new Promise(function(resolve) {
    try {
      var protocol = opts.useHttps ? https : http;
      var port     = opts.port || (opts.useHttps ? 443 : 80);
      var bodyStr  = opts.body ? JSON.stringify(opts.body) : null;
      var auth     = Buffer.from((opts.user || 'admin') + ':' + (opts.pass || '')).toString('base64');

      var reqOpts = {
        hostname:         opts.ip,
        port:             port,
        path:             '/rest' + opts.path,
        method:           opts.method || 'GET',
        rejectUnauthorized: false,
        headers: {
          'Authorization':  'Basic ' + auth,
          'Content-Type':   'application/json',
          'Accept':         'application/json',
        },
      };
      if (bodyStr) reqOpts.headers['Content-Length'] = Buffer.byteLength(bodyStr);

      var req = protocol.request(reqOpts, function(res) {
        var chunks = [];
        res.on('data', function(c) { chunks.push(c); });
        res.on('end', function() {
          try {
            var raw  = Buffer.concat(chunks).toString('utf-8');
            var json = raw ? JSON.parse(raw) : {};
            resolve(json);
          } catch(e) {
            resolve({ error: 'JSON parse error: ' + e.message });
          }
        });
      });

      req.setTimeout(10000, function() {
        req.destroy();
        resolve({ error: 'timeout' });
      });

      req.on('error', function(e) {
        resolve({ error: e.message });
      });

      if (bodyStr) req.write(bodyStr);
      req.end();

    } catch(e) {
      resolve({ error: e.message });
    }
  });
});

/* ── SSH handler ── */
ipcMain.handle('router-ssh', async function(event, opts) {
  /*
    opts: { ip, sshPort, user, pass, command }
  */
  if (!ssh2Client) {
    return { ok: false, error: 'ssh2 module not available' };
  }

  return new Promise(function(resolve) {
    try {
      var conn = new ssh2Client.Client();
      var output = '';
      var errOut = '';
      var done   = false;

      var timer = setTimeout(function() {
        if (!done) {
          done = true;
          try { conn.end(); } catch(e) {}
          resolve({ ok: false, error: 'SSH timeout', output: output });
        }
      }, 15000);

      conn.on('ready', function() {
        conn.exec(opts.command, function(err, stream) {
          if (err) {
            clearTimeout(timer);
            done = true;
            conn.end();
            resolve({ ok: false, error: err.message });
            return;
          }
          stream.on('data', function(d) { output += d.toString(); });
          stream.stderr.on('data', function(d) { errOut += d.toString(); });
          stream.on('close', function(code) {
            clearTimeout(timer);
            done = true;
            conn.end();
            resolve({
              ok:     code === 0 || output.length > 0,
              output: output,
              stderr: errOut,
              code:   code,
            });
          });
        });
      });

      conn.on('error', function(e) {
        clearTimeout(timer);
        if (!done) {
          done = true;
          resolve({ ok: false, error: e.message });
        }
      });

      conn.connect({
        host:           opts.ip,
        port:           opts.sshPort || 22,
        username:       opts.user || 'admin',
        password:       opts.pass || '',
        readyTimeout:   8000,
        algorithms: {
          kex: [
            'diffie-hellman-group14-sha256',
            'diffie-hellman-group14-sha1',
            'diffie-hellman-group1-sha1',
            'ecdh-sha2-nistp256',
          ],
          cipher: [
            'aes128-ctr','aes192-ctr','aes256-ctr',
            'aes128-cbc','aes256-cbc','3des-cbc',
          ],
          serverHostKey: [
            'ssh-rsa','ssh-dss','ecdsa-sha2-nistp256',
            'rsa-sha2-256','rsa-sha2-512',
          ],
        },
      });

    } catch(e) {
      resolve({ ok: false, error: e.message });
    }
  });
});

/* ── Перевірка чи є IPC режим ── */
ipcMain.handle('ipc-mode', function() {
  return {
    rest: true,
    ssh:  ssh2Client !== null,
    proxy: true, /* proxy.py все ще доступний як fallback */
  };
});
"""

# Вставляємо перед app.on('ready') або в кінець
INSERT_BEFORE = "ipcMain.handle('save-file'"
if INSERT_BEFORE in main:
    main = main.replace(INSERT_BEFORE, IPC_HANDLERS + "\n" + INSERT_BEFORE, 1)
    print('OK: IPC handlers додано в main.js')
else:
    print('WARN: не знайшли місце — додаємо в кінець')
    main = main.rstrip() + '\n' + IPC_HANDLERS

with tempfile.NamedTemporaryFile(suffix='.js', delete=False, mode='w', encoding='utf-8') as tmp:
    tmp.write(main)
    tmp_name = tmp.name
r = subprocess.run(['node','--check', tmp_name], capture_output=True, text=True)
os.unlink(tmp_name)
if r.returncode != 0:
    print('SYNTAX ERROR main.js!\n' + r.stderr[:300])
    exit(1)
print('Tempfile: OK')
with open('main.js', 'w', encoding='utf-8') as f:
    f.write(main)
print(f'main.js: OK ({os.path.getsize("main.js")}b)')

# ════════════════════════════════════════
# КРОК 3: router-manager.js
# Замінюємо restCall і sshCall щоб використовували IPC
# ════════════════════════════════════════
print('\n=== КРОК 3: router-manager.js ===')
with open('router-manager.js', 'r', encoding='utf-8') as f:
    rm = f.read()
rm = rm.replace('\r\n', '\n')

# Знаходимо restCall
idx = rm.find('window.restCall = function restCall(router, method, path, body)')
if idx < 0:
    idx = rm.find('function restCall(')
print(f'restCall @ {idx}')
print(repr(rm[idx:idx+300]))

# Знаходимо sshCall
idx2 = rm.find('window.sshCall = function sshCall(router, command)')
if idx2 < 0:
    idx2 = rm.find('window.sshCall = function sshCall')
print(f'\nsshCall @ {idx2}')
print(repr(rm[idx2:idx2+200]))