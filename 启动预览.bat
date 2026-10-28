@echo off
chcp 936 >nul
title Ô¤ÀÀÇéÂÂ¿Õ¼äÍøÕ¾
cd /d "%~dp0"
echo ============================================
echo   Æô¶¯Ô¤ÀÀ·þÎñÆ÷£¨ÇéÂÂ¿Õ¼ä£©
echo   ÍøÖ·: http://127.0.0.1:8368
echo   (¹Ø±Õ´Ë´°¿Ú¼´¿ÉÍ£Ö¹·þÎñÆ÷)
echo ============================================
echo.

set PORT=8368
start "" cmd /c "timeout /t 2 >nul & start "" http://127.0.0.1:%PORT%"

set "PY=C:\Users\23003\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe"
if not exist "%PY%" set "PY=python"
"%PY%" "tools\preview_server.py" %PORT%