#!/bin/bash
set -e

echo "🔨 Iniciando build..."
cd frontend
echo "📦 Instalando dependências..."
yarn install --frozen-lockfile || npm ci
echo "🏗️ Compilando frontend..."
NODE_ENV=production yarn build || NODE_ENV=production npm run build
cd ..

echo "📁 Preparando pasta de distribuição..."
rm -rf build
mkdir -p build
echo "📋 Copiando arquivos compilados..."
cp -r frontend/build/* build/

echo "✅ Build concluído com sucesso!"
ls -la build/ | head -10
