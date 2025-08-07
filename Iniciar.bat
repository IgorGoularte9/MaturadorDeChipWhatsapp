@echo off
cd /d "%~dp0"

:: Verifica se a pasta node_modules existe (indicando que as dependências já foram instaladas)
if not exist "node_modules" (
    echo Instalando dependências...
    npm install
)

echo Iniciando o script...
npm run start

pause
