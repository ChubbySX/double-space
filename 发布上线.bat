@echo off
chcp 936 >nul
cd /d "%~dp0%"

set "PY=C:\Users\23003\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe"
if not exist "%PY%" set "PY=python"
set "NODE=C:\Users\23003\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%NODE%" set "NODE=node"

REM === 清理上次中断的发布（还原版本号 + 撤销未推送的提交） ===
if exist "content\version.json.bak" (
  echo [!] 检测到上次发布中途中断，正在还原版本号...
  copy /Y "content\version.json.bak" "content\version.json" >nul
  del "content\version.json.bak" >nul 2>&1
  git reset --mixed HEAD~1 >nul 2>&1
  "%NODE%" tools\sync_version.js >nul 2>&1
  echo     已还原版本号并撤销未推送的提交。
  echo.
)

echo ============================================
echo   发布情侣空间到 GitHub Pages
echo   https://chubbysx.github.io/double-space/
echo ============================================
echo.

echo [1/4] 暂存改动...
git add .
echo.

echo [2/4] 构建网站内容（c+1, d+1）...
copy /Y "content\version.json" "content\version.json.bak" >nul
"%NODE%" build.js
if errorlevel 1 (
  del "content\version.json.bak" >nul 2>&1
  echo.
  echo *** 构建失败，请检查上面的错误 ***
  pause
  exit /b 1
)
echo.

echo [3/4] 升级发布版本号（b+1, c归零, d还原）...
"%PY%" tools\bump_publish.py
echo.

echo [4/4] 提交并推送（最多重试3次）...
git add .
for /f "delims=" %%t in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HHmm"') do set "TS=%%t"
git commit -m "更新内容 %TS%"
set ATTEMPT=0
:PUSHRETRY
set /a ATTEMPT+=1
echo   第 %ATTEMPT% 次推送...
git push origin main
if errorlevel 1 goto PUSHFAIL
goto PUSHDONE
:PUSHFAIL
if %ATTEMPT% LSS 3 (echo   失败3秒后重试... & timeout /t 3 >nul & goto PUSHRETRY)
echo.
echo *** 推送失败！正在回滚... ***
git reset --mixed HEAD~1 >nul 2>&1
copy /Y "content\version.json.bak" "content\version.json" >nul
del "content\version.json.bak" >nul 2>&1
"%NODE%" tools\sync_version.js >nul 2>&1
echo.
echo *** 推送失败！未记录版本号变更，请稍后重试 ***
echo   1) 等几分钟再双击本脚本
echo   2) 临时开手机热点再双击
pause
exit /b 1
:PUSHDONE
del "content\version.json.bak" >nul 2>&1
echo.
echo ============================================
echo   发布完成！1-2分钟后刷新网页
echo   https://chubbysx.github.io/double-space/
echo ============================================
exit /b 0