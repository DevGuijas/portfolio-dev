@echo off
setlocal
chcp 65001 >nul
title Recuperar acesso - DevGuijas
pushd "%~dp0"
if errorlevel 1 exit /b 1
echo Execute apenas neste computador, com acesso autorizado a pasta do portfolio.
echo Seus projetos e textos serao preservados.
node --env-file-if-exists=.env scripts/setup.mjs --reset
pause
popd
