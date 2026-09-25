# -*- coding: utf-8 -*-
import os, sys, json, subprocess, tempfile, re
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

PROJECT_DIR = r"C:\Users\bondarenko_ay\Desktop\Mikrotik"
ALLOWED_EXT = {".js", ".py", ".html", ".css", ".json", ".txt", ".md"}

def detect_language(filepath):
    ext = Path(filepath).suffix.lower()
    return {".js":"javascript",".py":"python",".html":"html",
            ".css":"css",".json":"json",".txt":"text"}.get(ext,"unknown")

def check_syntax(filepath, language):
    if language == "javascript":
        r = subprocess.run(["node","--check",filepath],capture_output=True,text=True,timeout=10)
        return {"ok": r.returncode == 0, "output": r.stderr.strip() or "OK"}
    if language == "python":
        r = subprocess.run([sys.executable,"-m","py_compile",filepath],capture_output=True,text=True,timeout=10)
        return {"ok": r.returncode == 0, "output": r.stderr.strip() or "OK"}
    return {"ok": True, "output": "skip"}

def check_brackets(content):
    errors = []
    if content.count("{") != content.count("}"):
        errors.append("{ } mismatch: open=" + str(content.count("{")) + " close=" + str(content.count("}")))
    if content.count("(") != content.count(")"):
        errors.append("( ) mismatch: open=" + str(content.count("(")) + " close=" + str(content.count(")")))
    return {"ok": len(errors) == 0, "errors": errors}

def check_surrogates(content):
    found = [c for c in content if "\ud800" <= c <= "\udfff"]
    return {"ok": len(found) == 0, "count": len(found)}

def check_cyrillic_js(content, language):
    if language != "javascript":
        return {"ok": True, "issues": []}
    issues = []
    cyr = re.compile(r"[\u0400-\u04FF]")
    for i, line in enumerate(content.split("\n"), 1):
        clean = re.sub(r"//.*$", "", line)
        clean = re.sub(r'"[^"]*"', '""', clean)
        clean = re.sub(r"'[^']*'", "''", clean)
        if cyr.search(clean):
            issues.append("Line " + str(i) + ": " + line.strip()[:80])
    return {"ok": len(issues) == 0, "issues": issues}

def qa_check(filepath, content):
    lang = detect_language(filepath)
    brackets = check_brackets(content)
    surrogates = check_surrogates(content)
    cyrillic = check_cyrillic_js(content, lang)
    scores = {
        "architecture":    10 if brackets["ok"] else 5,
        "readability":     10 if cyrillic["ok"] else 5,
        "security":        10 if surrogates["ok"] else 0,
        "maintainability": 10 if brackets["ok"] else 5,
    }
    return {
        "language": lang,
        "scores": scores,
        "total": round(sum(scores.values()) / len(scores), 1),
        "checks": {"brackets": brackets, "surrogates": surrogates, "cyrillic": cyrillic},
        "file_size": len(content.encode("utf-8")),
        "qa_passed": all([brackets["ok"], surrogates["ok"], cyrillic["ok"], len(content) > 0])
    }

def send_json(handler, data, status=200):
    body = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.end_headers()
    handler.wfile.write(body)

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print("[QA] " + fmt % args)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?")[0]
        params = {}
        if "?" in self.path:
            for p in self.path.split("?", 1)[1].split("&"):
                k, _, v = p.partition("=")
                params[k] = v.replace("%2F", "/").replace("%5C", "\\").replace("%20", " ")

        if path == "/health":
            send_json(self, {"ok": True, "server": "QA Agent v1.0",
                             "project": PROJECT_DIR,
                             "project_exists": os.path.exists(PROJECT_DIR)})
            return

        if path == "/list":
            files = []
            for root, dirs, fnames in os.walk(PROJECT_DIR):
                dirs[:] = [d for d in dirs if d not in (
                    "node_modules", ".git", "dist", "__pycache__")]
                for f in fnames:
                    if Path(f).suffix.lower() in ALLOWED_EXT:
                        rel = os.path.relpath(
                            os.path.join(root, f), PROJECT_DIR).replace("\\", "/")
                        files.append({"path": rel, "language": detect_language(f)})
            send_json(self, {"ok": True, "count": len(files), "files": files})
            return

        if path == "/read":
            fname = params.get("file", "")
            fpath = os.path.join(PROJECT_DIR, fname)
            if not os.path.exists(fpath):
                send_json(self, {"ok": False, "error": "File not found: " + fname}, 404)
                return
            with open(fpath, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
            send_json(self, {
                "ok": True, "file": fname,
                "language": detect_language(fname),
                "content": content,
                "lines": len(content.split("\n")),
                "size": len(content.encode("utf-8")),
                "qa": qa_check(fname, content)
            })
            return

        send_json(self, {"ok": False, "error": "Unknown endpoint"}, 404)

    def do_POST(self):
        path = self.path.split("?")[0]
        n = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(n).decode("utf-8")) if n > 0 else {}

        if path == "/qa":
            fname = body.get("file", "")
            content = body.get("content", "")
            if not content and fname:
                fpath = os.path.join(PROJECT_DIR, fname)
                if os.path.exists(fpath):
                    with open(fpath, "r", encoding="utf-8", errors="replace") as f:
                        content = f.read()
            send_json(self, {"ok": True, "qa": qa_check(fname or "unknown", content)})
            return

        if path in ("/apply", "/patch"):
            fname   = body.get("file", "")
            old_txt = body.get("old", "")
            new_txt = body.get("new", "")
            fpath   = os.path.join(PROJECT_DIR, fname)
            lang    = detect_language(fname)

            if not os.path.exists(fpath):
                send_json(self, {"ok": False, "error": "File not found: " + fname})
                return

            with open(fpath, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()

            if old_txt and old_txt not in content:
                send_json(self, {"ok": False,
                                 "error": "OLD text not found in file!",
                                 "hint": "Copy exact text from readFile response"})
                return

            new_content = content.replace(old_txt, new_txt, 1) if old_txt else new_txt
            qa = qa_check(fname, new_content)

            if not qa["checks"]["brackets"]["ok"]:
                send_json(self, {"ok": False, "error": "BRACKET MISMATCH!", "qa": qa})
                return
            if not qa["checks"]["surrogates"]["ok"]:
                send_json(self, {"ok": False, "error": "SURROGATES found!", "qa": qa})
                return

            if lang in ("javascript", "python"):
                with tempfile.NamedTemporaryFile(
                    suffix=Path(fname).suffix,
                    mode="w", encoding="utf-8", delete=False
                ) as tmp:
                    tmp.write(new_content)
                    tmp_path = tmp.name
                syntax = check_syntax(tmp_path, lang)
                os.unlink(tmp_path)
                if not syntax["ok"]:
                    send_json(self, {"ok": False,
                                     "error": "SYNTAX ERROR! Not written.",
                                     "syntax": syntax["output"], "qa": qa})
                    return

            with open(fpath, "w", encoding="utf-8") as f:
                f.write(new_content)

            size = os.path.getsize(fpath)
            if size == 0:
                send_json(self, {"ok": False, "error": "File is 0 bytes!"})
                return

            send_json(self, {"ok": True, "file": fname, "size": size,
                             "qa": qa, "message": "File updated successfully!"})
            return

        send_json(self, {"ok": False, "error": "Unknown endpoint"}, 404)

if __name__ == "__main__":
    print("=" * 50)
    print("  QA Agent Server v1.0")
    print("  http://localhost:7788")
    print("  Project: " + PROJECT_DIR)
    print("  Endpoints: /health /list /read /apply /qa")
    print("=" * 50)
    server = HTTPServer(("127.0.0.1", 7788), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Stopped.")
        server.shutdown()