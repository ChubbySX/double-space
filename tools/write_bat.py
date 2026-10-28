# -*- coding: utf-8 -*-
"""生成情侣空间网站的 bat 文件，使用 GBK + CRLF 编码（Windows cmd 中文兼容）"""
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NODE = r"C:\Users\23003\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe"
PY = r"C:\Users\23003\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe"

BATS = {
"构建网站.bat": f"""@echo off
chcp 65001 >nul
title 构建情侣空间网站
cd /d "%~dp0"
echo ============================================
echo   正在构建情侣空间网站 ...
echo ============================================
echo.
rem [1/2] 生成占位照片/音频（已有真人素材后可不执行，将 [ok] 前的 rem 去掉）
rem "%{PY}%" "%~dp0tools\\gen_photos.py"
rem "%{PY}%" "%~dp0tools\\gen_audio.py"
echo.
rem [2/2] 构建 data.js（扫描 content 生成网站数据）
"%{NODE}%" "%~dp0build.js"
if errorlevel 1 (
  echo.
  echo 构建失败！请检查上面的错误信息。
  pause
  exit /b 1
)
echo.
echo 构建完成 ^| 预览：双击 启动预览.bat，浏览器打开 http://127.0.0.1:8368
echo 若页面未更新，请按 Ctrl+F5 强制刷新
echo.
pause
""",
"启动预览.bat": f"""@echo off
title 预览情侣空间网站
cd /d "%~dp0"
echo 启动预览服务器（端口 8368）...
echo 浏览器地址: http://127.0.0.1:8368
echo 关闭本窗口即停止服务
echo.
"%{PY}%" "%~dp0tools\\preview_server.py" 8368
pause
""",
}

def write_bat(name, content):
    path = os.path.join(ROOT, name)
    with open(path, "wb") as f:
        f.write(content.replace("\n", "\r\n").encode("gbk"))
    print("[ok] " + name)

if __name__ == "__main__":
    for name, content in BATS.items():
        write_bat(name, content)
    print("done")