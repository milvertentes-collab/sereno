@echo off
setlocal
chcp 65001 >nul
title Sereno Site
color 0E

echo ============================================
echo    Iniciando Site do Sereno...
echo ============================================
echo.

cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERRO] Node.js nao foi encontrado!
    echo.
    echo Voce precisa instalar o Node.js primeiro.
    echo Baixe em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js encontrado:
node --version
echo.

netstat -ano | findstr /R /C:":3001 .*LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] O servidor ja parece estar rodando na porta 3001.
    echo [INFO] Abrindo apenas o site...
    start "" "http://localhost:3001/"
    exit /b 0
)

if not exist "node_modules" (
    echo [INFO] Instalando dependencias... Isso pode levar alguns minutos.
    echo.
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo.
        echo [ERRO] Falha ao instalar dependencias!
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencias instaladas com sucesso!
    echo.
)

echo [INFO] Abrindo o site em 5 segundos...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c timeout /t 5 /nobreak >nul & start \"\" \"http://localhost:3001/\"' -WindowStyle Hidden" >nul 2>&1

echo [INFO] Iniciando o servidor de desenvolvimento...
echo.
echo ============================================
echo    Site: http://localhost:3001/
echo    Para parar: feche esta janela ou Ctrl+C
echo ============================================
echo.

call npm run dev
endlocal
