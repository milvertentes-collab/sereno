@echo off
setlocal
chcp 65001 >nul
title Sereno Admin
color 0B

echo ============================================
echo    Iniciando Painel Admin do Sereno...
echo ============================================
echo.

cd /d "%~dp0"

:: Verificar se o Node.js esta instalado
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

:: Se a porta 3001 ja estiver em uso, apenas abrir o painel admin
netstat -ano | findstr /R /C:":3001 .*LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] O servidor ja parece estar rodando na porta 3001.
    echo [INFO] Abrindo apenas o painel admin...
    start "" "http://localhost:3001/sereno-admin"
    exit /b 0
)

:: Instalar dependencias se necessario
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

:: Abrir o navegador apos alguns segundos
echo [INFO] Abrindo o painel admin em 5 segundos...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c timeout /t 5 /nobreak >nul & start \"\" \"http://localhost:3001/sereno-admin\"' -WindowStyle Hidden" >nul 2>&1

:: Iniciar o servidor de desenvolvimento
echo [INFO] Iniciando o servidor de desenvolvimento...
echo.
echo ============================================
echo    Painel admin: http://localhost:3001/sereno-admin
echo    Para parar: feche esta janela ou Ctrl+C
echo ============================================
echo.

call npm run dev
endlocal
