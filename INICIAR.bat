@echo off
setlocal
chcp 65001 >nul
title Portfolio DevGuijas
pushd "%~dp0"
if errorlevel 1 goto folder_error
where node >nul 2>nul
if errorlevel 1 goto node_error
node -e "if(Number(process.versions.node.split('.')[0])!==24)process.exit(1)"
if errorlevel 1 goto node_error
if not exist "node_modules\.package-lock.json" (
  echo Instalando dependencias. Internet necessaria na primeira vez...
  call npm ci --no-fund
  if errorlevel 1 goto error
)
echo Preparando o portfolio...
call npm run build
if errorlevel 1 goto error
call npm run setup
if errorlevel 1 goto error
if not defined OPEN_BROWSER set OPEN_BROWSER=1
call npm start
if errorlevel 1 goto error
popd
exit /b 0
:node_error
echo Instale o Node.js 24 LTS em https://nodejs.org e execute novamente.
goto error
:folder_error
echo Nao foi possivel acessar a pasta do projeto. Extraia o ZIP antes de iniciar.
pause
exit /b 1
:error
echo.
echo O servidor nao iniciou ou foi interrompido por um erro. Veja a mensagem acima.
pause
popd
exit /b 1
