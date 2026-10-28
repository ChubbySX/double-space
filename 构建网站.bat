@echo off
chcp 936 >nul
title 构建情侣空间网站
cd /d "%~dp0"

set "PY=C:\Users\23003\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe"
if not exist "%PY%" set "PY=python"
set "NODE=C:\Users\23003\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%NODE%" set "NODE=node"

echo ============================================
echo   构建情侣空间网站（扫描内容 + 生成数据）
echo ============================================
echo.

echo [1/2] 构建 data.js（扫描 content 生成网站数据）...
"%NODE%" build.js
if errorlevel 1 (
  echo.
  echo *** 构建失败，请检查上面的错误 ***
  pause
  exit /b 1
)

echo.
echo ============================================
echo   构建完成！预览：双击 启动预览.bat
echo   浏览器打开 http://127.0.0.1:8368
echo   若页面未更新，请按 Ctrl+F5 强制刷新
echo ============================================
exit /b 0