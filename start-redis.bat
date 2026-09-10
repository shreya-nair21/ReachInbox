@echo off
set "REDIS_PATH=%LOCALAPPDATA%\Microsoft\WinGet\Packages\taizod1024.redis-windows-fork_Microsoft.Winget.Source_8wekyb3d8bbwe\Redis-8.10.1-Windows-x64-msys2\redis-server.exe"

if exist "%REDIS_PATH%" (
    echo [ReachInbox] Starting Redis 8.10.1 on port 6380...
    "%REDIS_PATH%" --port 6380
) else (
    echo [ReachInbox] Starting fallback redis-server on port 6380...
    redis-server --port 6380
)
