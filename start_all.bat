@echo off
start "Proxy" python proxy.py
start "Node" node server.js
timeout /t 2
start http://localhost:8080