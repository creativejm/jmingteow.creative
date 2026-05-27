@echo off
title JM Portfolio 後台工具
echo.
echo  ╔══════════════════════════════════════╗
echo  ║     JM Portfolio 後台管理工具啟動     ║
echo  ╚══════════════════════════════════════╝
echo.

:: 關閉已占用 8081 的舊程序
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081 ^| findstr LISTENING 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: 關閉已占用 3000 的舊程序
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)

timeout /t 1 /nobreak >nul

echo  正在啟動服務...

:: 1. 啟動 decap-server API（port 8081）
start "CMS API" cmd /k "node node_modules\decap-server\dist\index.js"

:: 2. 啟動靜態網頁伺服器（port 3000）
start "靜態伺服器" cmd /k "node serve.js"

:: 3. 啟動作品同步監聽
start "作品同步" cmd /k "node sync-projects.js --watch"

:: 等待伺服器就緒
timeout /t 4 /nobreak >nul

echo.
echo  ✅ 服務啟動完成！
echo.
echo  後台網址：http://localhost:3000/m@n@ger/
echo.

:: 自動開啟瀏覽器
start "" "http://localhost:3000/m@n@ger/"

pause
