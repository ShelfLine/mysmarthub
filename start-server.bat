@echo off
title CyberSpecs Local Cloud Fleet Server
cd /d "%~dp0"
echo ==========================================================
echo       CYBERSPECS LOCAL CLOUD FLEET SERVER
echo ==========================================================
echo Starting Node server at http://localhost:3000 ...
start "" "http://localhost:3000"
node server.js
pause
