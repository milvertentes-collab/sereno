@echo off
chcp 65001 >nul
title Programa Psicologia
color 0A

echo ============================================
echo    Iniciando Programa Psicologia...
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
echo [INFO] Abrindo o navegador em 5 segundos...
start "" cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:3001"

:: Iniciar o servidor de desenvolvimento
echo [INFO] Iniciando o servidor de desenvolvimento...
echo.
echo ============================================
echo    Acesse: http://localhost:3001
echo    Para parar: feche esta janela ou Ctrl+C
echo ============================================
echo.

call npx next dev -p 3001
