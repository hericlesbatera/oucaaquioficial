#!/bin/bash
set -e

echo "🔨 Iniciando build..."
cd frontend
echo "📦 Instalando dependências..."
npm ci
echo "🏗️ Compilando frontend..."
npm run build
cd ..

echo "📁 Preparando pasta de distribuição..."
rm -rf build
mkdir -p build
echo "📋 Copiando arquivos compilados..."
cp -r frontend/build/* build/

echo "✅ Build concluído com sucesso!"
ls -la build/ | head -10
