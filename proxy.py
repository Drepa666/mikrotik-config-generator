# -*- coding: utf-8 -*-
import os, sys, json, threading, time
import http.server, http.client
import urllib.request, urllib.error
import base64

WEB_PORT      = 8080
PROXY_PORT    = 8888
ELECTRON_MODE = '--electron' in sys.argv
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))

try:
    import paramiko
    SSH_OK = True
except ImportError:
    SSH_OK = False

def send_json(handler, data, status=200):
    body = json.dumps(data, ensure_ascii=False).encode('utf-8')
    handler.send_response(status)
    handler.send_header('Content-Type',   'application/json; charset=utf-8')
    handler.send_header('Content-Length', str(len(body)))
    handler.send_header('Access-Control-Allow-Origin',  '*')
    handler.send_header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    handler.send_header('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-router-ip,x-router-port,x-router-user,x-router-pass')
    handler.end_headers()
    handler.wfile.write(body)

def ssh_exec(host, port, username, password, command, timeout=15):
    if not SSH_OK:
        return {'ok': False, 'error': 'paramiko not installed'}
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(hostname=host, port=int(port), username=username,
                       password=password, timeout=15,
                       look_for_keys=False, allow_agent=False)
        stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
        out = stdout.read().decode('utf-8', errors='replace')
        err = stderr.read().decode('utf-8', errors='replace')
        client.close()
        return {'ok': True, 'output': out, 'error': err}
    except paramiko.AuthenticationException:
        return {'ok': False, 'error': 'Wrong login or password'}
    except Exception as e:
        return {'ok': False, 'error': str(e)}

def make_ruijie_ssl():
    import ssl
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ctx.check_hostname = False
    ctx.verify_mode    = ssl.CERT_NONE
    try:    ctx.minimum_version = ssl.TLSVersion.TLSv1
    except: pass
    try:    ctx.set_ciphers('ALL:@SECLEVEL=0')
    except: ctx.set_ciphers('DEFAULT@SECLEVEL=0')
    return ctx

class ProxyHandler(http.server.BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        if args and len(args) >= 2 and str(args[1]) not in ('200','204'):
            print('[proxy] ' + fmt % args)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin',  '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-router-ip,x-router-port,x-router-user,x-router-pass')
        self.send_header('Content-Length', '0')
        self.end_headers()

    def do_GET(self):    self._handle('GET')
    def do_POST(self):   self._handle('POST')
    def do_PUT(self):    self._handle('PUT')
    def do_PATCH(self):  self._handle('PATCH')
    def do_DELETE(self): self._handle('DELETE')

    def _read_body(self):
        n = int(self.headers.get('Content-Length', 0) or 0)
        return self.rfile.read(n) if n > 0 else b''

    def _handle(self, method):
        full_path = self.path
        path      = full_path.split('?')[0]

        # health
        if path in ('/health', '/ping'):
            send_json(self, {'ok': True, 'ssh': SSH_OK, 'electron': ELECTRON_MODE})
            return

        # arp-scan
        if path == '/arp-scan':
            try:
                import subprocess as _sp, re as _re
                res   = _sp.run(['arp', '-a'], capture_output=True, text=True, timeout=10)
                hosts = []
                for line in res.stdout.splitlines():
                    m = _re.search(r'(\d+\.\d+\.\d+\.\d+)\s+([0-9a-fA-F:\-]{11,17})', line)
                    if m:
                        ip  = m.group(1)
                        mac = m.group(2).replace('-',':').upper()
                        if int(ip.split('.')[0]) >= 224: continue
                        if ip.endswith('.255'):           continue
                        hosts.append({'ip': ip, 'mac': mac, 'hostname': ip})
                send_json(self, hosts)
            except Exception as e:
                send_json(self, {'error': str(e)}, 500)
            return

        # ssh/exec
        if path == '/ssh/exec':
            try:
                body = json.loads(self._read_body().decode('utf-8'))
                send_json(self, ssh_exec(
                    body.get('host',''), body.get('port',22),
                    body.get('username','admin'), body.get('password',''),
                    body.get('command',''), body.get('timeout',15)))
            except Exception as e:
                send_json(self, {'ok': False, 'error': str(e)}, 500)
            return

        # ruijie-rpc
        if path == '/ruijie-rpc':
            try:
                body  = json.loads(self._read_body().decode('utf-8'))
                host  = body.get('host',  '192.168.110.1')
                port  = body.get('port',  443)
                token = body.get('token', '')
                rpcm  = body.get('method','')
                parms = body.get('params',{})
                ctx   = make_ruijie_ssl()
                conn  = http.client.HTTPSConnection(host, port, timeout=15, context=ctx)
                conn.request('POST', '/cgi-bin/luci/api/cmd?auth=' + token,
                    body=json.dumps({'method': rpcm, 'params': parms}),
                    headers={'Content-Type':'application/json;charset=UTF-8',
                             'Accept':'application/json','Connection':'close',
                             'X-Requested-With':'XMLHttpRequest'})
                resp = conn.getresponse()
                rb   = resp.read()
                conn.close()
                send_json(self, json.loads(rb))
            except Exception as e:
                send_json(self, {'error': str(e)}, 500)
            return

        # MikroTik REST proxy
        rip  = self.headers.get('x-router-ip',   '')
        rport= self.headers.get('x-router-port', '80')
        ruser= self.headers.get('x-router-user', '')
        rpass= self.headers.get('x-router-pass', '')
        # Fallback: decode Authorization: Basic header
        if not ruser:
            auth_hdr = self.headers.get('Authorization', '')
            if auth_hdr.startswith('Basic '):
                import base64 as _b64
                try:
                    decoded = _b64.b64decode(auth_hdr[6:]).decode('utf-8')
                    ruser, rpass = decoded.split(':', 1)
                except:
                    ruser = 'admin'
        if not ruser: ruser = 'admin'

        if not rip:
            send_json(self, {'error': 'Missing x-router-ip'}, 400)
            return

        try:
            # JS надсилає /rest/xxx — прибираємо /rest щоб не дублювати
            api = path[5:] if path.startswith('/rest') else path
            qs  = ('?' + full_path.split('?',1)[1]) if '?' in full_path else ''
            url = 'http://{}:{}/rest{}{}'.format(rip, rport, api, qs)

            body = self._read_body()
            creds = base64.b64encode('{}:{}'.format(ruser, rpass).encode()).decode()
            req = urllib.request.Request(url=url, data=body if body else None, method=method)
            req.add_header('Authorization', 'Basic ' + creds)
            req.add_header('Content-Type',  'application/json')
            req.add_header('Accept',        'application/json')

            with urllib.request.urlopen(req, timeout=15) as resp:
                rb = resp.read()
                self.send_response(resp.status)
                self.send_header('Content-Type',  'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-Length', str(len(rb)))
                self.end_headers()
                self.wfile.write(rb)

        except urllib.error.HTTPError as e:
            rb = e.read()
            self.send_response(e.code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', str(len(rb)))
            self.end_headers()
            self.wfile.write(rb)
        except Exception as e:
            send_json(self, {'error': str(e)}, 502)

class StaticHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)
    def log_message(self, fmt, *args): pass
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

def open_browser():
    time.sleep(1.5)
    import webbrowser
    webbrowser.open('http://localhost:{}'.format(WEB_PORT))

def main():
    print('=' * 52)
    print('  MikroTik Config Generator v5')
    print('=' * 52)
    if not ELECTRON_MODE:
        print('  Web UI  -> http://localhost:{}'.format(WEB_PORT))
    print('  Proxy   -> http://localhost:{}'.format(PROXY_PORT))
    print('  SSH     -> {}'.format('OK' if SSH_OK else 'NO paramiko'))
    print('  Ctrl+C щоб зупинити')
    print('=' * 52)

    proxy_srv = http.server.ThreadingHTTPServer(('127.0.0.1', PROXY_PORT), ProxyHandler)
    threading.Thread(target=proxy_srv.serve_forever, daemon=True).start()
    print('[proxy] Proxy -> http://localhost:{}'.format(PROXY_PORT))

    if ELECTRON_MODE:
        try:
            proxy_srv.serve_forever()
        except KeyboardInterrupt:
            proxy_srv.shutdown()
        return

    threading.Thread(target=open_browser, daemon=True).start()
    web_srv = http.server.ThreadingHTTPServer(('127.0.0.1', WEB_PORT), StaticHandler)
    print('[proxy] HTTP  -> http://localhost:{}'.format(WEB_PORT))
    try:
        web_srv.serve_forever()
    except KeyboardInterrupt:
        web_srv.shutdown()
        proxy_srv.shutdown()

if __name__ == '__main__':
    main()