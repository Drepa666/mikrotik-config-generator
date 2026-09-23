# -*- coding: utf-8 -*-
import subprocess, tempfile, os

with open('main.js', 'r', encoding='utf-8') as f:
    main = f.read()
main = main.replace('\r\n', '\n')

# Вставляємо handlers перед ipcMain.handle('save-file'
TARGET = "ipcMain.handle('save-file'"
print(f'TARGET: {"FOUND" if TARGET in main else "NOT FOUND"}')

IPC = """
/* ══════════════════════════════════════════════════════════
   DIRECT IPC — REST + SSH без proxy.py
   ══════════════════════════════════════════════════════════ */

ipcMain.handle('router-rest', async function(event, opts) {
  return new Promise(function(resolve) {
    try {
      var protocol = opts.useHttps ? https : http;
      var port     = parseInt(opts.port) || (opts.useHttps ? 443 : 80);
      var bodyStr  = (opts.body && opts.method !== 'GET')
                     ? JSON.stringify(opts.body) : null;
      var auth = Buffer.from(
        (opts.user || 'admin') + ':' + (opts.pass || '')
      ).toString('base64');

      var reqOpts = {
        hostname: opts.ip,
        port:     port,
        path:     '/rest' + opts.path,
        method:   opts.method || 'GET',
        rejectUnauthorized: false,
        headers: {
          'Authorization': 'Basic ' + auth,
          'Content-Type':  'application/json',
          'Accept':        'application/json',
        },
      };
      if (bodyStr) {
        reqOpts.headers['Content-Length'] = Buffer.byteLength(bodyStr);
      }

      var req = protocol.request(reqOpts, function(res) {
        var chunks = [];
        res.on('data', function(c) { chunks.push(c); });
        res.on('end', function() {
          try {
            var raw  = Buffer.concat(chunks).toString('utf-8');
            var json = raw ? JSON.parse(raw) : {};
            resolve(json);
          } catch(e) {
            resolve({ error: 'JSON parse: ' + e.message });
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

ipcMain.handle('router-ssh', async function(event, opts) {
  if (!ssh2Client) {
    return { ok: false, error: 'ssh2 not available' };
  }
  return new Promise(function(resolve) {
    try {
      var conn   = new ssh2Client.Client();
      var output = '';
      var errOut = '';
      var done   = false;

      var timer = setTimeout(function() {
        if (!done) {
          done = true;
          try { conn.end(); } catch(e2) {}
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
        if (!done) { done = true; resolve({ ok: false, error: e.message }); }
      });

      conn.connect({
        host:         opts.ip,
        port:         parseInt(opts.sshPort) || 22,
        username:     opts.user || 'admin',
        password:     opts.pass || '',
        readyTimeout: 8000,
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

ipcMain.handle('ipc-mode', function() {
  return { rest: true, ssh: ssh2Client !== null };
});

"""

main = main.replace(TARGET, IPC + TARGET, 1)
print('OK: handlers додано')

# ════ Tempfile ════
with tempfile.NamedTemporaryFile(
        suffix='.js', delete=False, mode='w', encoding='utf-8') as tmp:
    tmp.write(main)
    tmp_name = tmp.name

r = subprocess.run(['node','--check', tmp_name], capture_output=True, text=True)
os.unlink(tmp_name)
if r.returncode != 0:
    print('SYNTAX ERROR!\n' + r.stderr[:300])
    exit(1)
print('Tempfile: OK')

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(main)

size = os.path.getsize('main.js')
r2 = subprocess.run(['node','--check','main.js'], capture_output=True, text=True)
print(f'main.js: {"OK ✅" if r2.returncode==0 else "FAIL"} ({size:,}b)')
if r2.returncode != 0:
    print(r2.stderr[:200])
    exit(1)

# ════ Git ════
subprocess.run(['git','pull','--rebase','origin','main'], capture_output=True)
subprocess.run(['git','add','main.js'], capture_output=True)
subprocess.run(['git','commit','-m',
    'feat: add router-rest + router-ssh IPC handlers in main.js'],
    capture_output=True)
rp = subprocess.run(['git','push','origin','main'], capture_output=True, text=True)
print('push:', rp.stdout.strip() or rp.stderr.strip()[-60:])
print('\nDone! npm start')