@echo off
cd /d "d:\musicasua-main\musicasua-main"

echo ===================================
echo Enviando mudancas para GitHub
echo ===================================
echo.

echo 1. Verificando status...
git status
echo.

echo 2. Adicionando arquivos...
git add frontend\src\pages\AlbumPage.jsx
git add frontend\src\hooks\useCapacitorDownloads.js
echo Arquivos adicionados!
echo.

echo 3. Fazendo commit...
git commit -m "fix: corrigir crash ao abrir album e sistema de download offline"
echo Commit criado!
echo.

echo 4. Fazendo push para GitHub...
git push origin main
echo.

echo ===================================
echo Enviando para Railway...
echo ===================================
echo.
echo Acesse: https://railway.app para monitorar o deploy
echo.
pause
