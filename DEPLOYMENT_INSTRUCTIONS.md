# Instruções de Deployment - Fix do Crash do App

## ⚠️ IMPORTANTE: LEIA ANTES DE FAZER O BUILD

As alterações foram feitas apenas em:
- `frontend/src/pages/AlbumPage.jsx`

Nenhuma mudança no backend, dependências ou configuração.

## Pré-requisitos

- Node.js 20.x
- Android SDK com API 30+
- Gradle 7.0+
- Git configurado

## Passos de Deployment

### 1️⃣ Verificar as Alterações

```bash
# Ver o que foi mudado
git status
git diff frontend/src/pages/AlbumPage.jsx
```

### 2️⃣ Instalar Dependências

```bash
cd frontend
npm install
# ou yarn install
```

### 3️⃣ Compilar o Frontend

```bash
npm run build
```

Se houver erro de build, verificar:
- Node.js versão: `node --version` (deve ser v20.x)
- Limppar cache: `rm -rf node_modules package-lock.json && npm install`

### 4️⃣ Sincronizar com Capacitor

```bash
cd ..
npx cap sync android
```

Este comando:
- Copia os arquivos buildados para `android/app/src/main/assets/public`
- Atualiza configurações do Capacitor
- Prepara o projeto para build

### 5️⃣ Buildar APK para Debug

```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

Output: `app/build/outputs/apk/debug/app-debug.apk`

### 6️⃣ Instalar no Emulador/Device

```bash
adb devices  # Listar devices conectados
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### 7️⃣ Instalar no Emulador (se aplicável)

```bash
# Listar emuladores disponíveis
emulator -list-avds

# Iniciar emulador (ex: Pixel_5_API_30)
emulator -avd Pixel_5_API_30

# Instalar no emulador rodando
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## ✅ Checklist de Teste

Depois de instalar, testar os seguintes cenários:

- [ ] App abre sem erros
- [ ] Home page carrega
- [ ] Clica em um álbum → AlbumPage abre (não crasheia)
- [ ] Imagem do álbum carrega
- [ ] Informações do álbum aparecem (artista, ano, número de músicas)
- [ ] Lista de músicas mostra
- [ ] Botão Play funciona
- [ ] Botão Favoritar funciona
- [ ] Botão Download funciona (se mobile/Android)
- [ ] Navegação para outro álbum funciona
- [ ] Voltar (back button) funciona

## 🔍 Monitoramento de Logs

Durante o teste, monitorar os logs:

```bash
# Todos os logs
adb logcat

# Apenas erros (com destaque para nossos logs)
adb logcat | grep -E "❌|⚠️|ERROR|Exception"

# Apenas logs da aplicação
adb logcat | grep "Musicasua"

# Filtrar por tag
adb logcat -s "ChromiumAndroidWebView"
```

## 📱 Para Produção

### 1. Build de Release

```bash
cd android
./gradlew assembleRelease
```

Requer configuração de signing (chave privada).

### 2. Otimizações

```javascript
// Antes de fazer release, verificar:
// - Remover console.logs de debug (não fizemos aqui)
// - Verificar performance
// - Testar em device real (não apenas emulador)
```

### 3. Versão do APK

Atualizar em `android/app/build.gradle`:
```gradle
versionCode X  // Incrementar por 1
versionName "1.0.X"
```

## 🚀 Deploy no Google Play (Opcional)

1. Assinar APK com chave privada
2. Fazer upload na Play Store Console
3. Testar em Beta/Test Track primeiro
4. Fazer rollout gradual (5% → 25% → 100%)

## 🆘 Troubleshooting

### App ainda está crasheando?

```bash
# Limpar dados do app
adb shell pm clear com.musicasua.app

# Verificar crash logs específicos
adb logcat | grep "FATAL\|CRASH\|Error"

# Verificar se há problema com JavaScript
adb logcat | grep "chromium\|JavaScript"
```

### Build falha com erro de Gradle?

```bash
# Limpar build anterior completamente
cd android
./gradlew clean
cd ..
npx cap sync android
cd android
./gradlew assembleDebug
```

### Capacitor não sincronizando?

```bash
# Atualizar Capacitor
npm install @capacitor/core@latest @capacitor/cli@latest

# Limpar e resincronizar
npx cap sync android --latest
```

## 📊 Métricas de Sucesso

Após o deployment:
- ✅ 0 crashes ao abrir álbum
- ✅ Tempo de carregamento < 2 segundos
- ✅ Download funciona sem erros
- ✅ Transição entre álbuns é suave

## 📝 Changelog

```
v1.0.1 (Data)
- Fix: Corrigir crash ao abrir página de álbum (AlbumPage)
- Improvement: Adicionar validações de null pointer
- Improvement: Melhorar error handling
- Improvement: Adicionar logs informativos para debugging
```

## ❓ Perguntas Comuns

**P: Preciso atualizar o backend?**  
R: Não. As mudanças são apenas no frontend.

**P: Compatibilidade com versões antigas?**  
R: Sim. As mudanças são apenas melhorias de robustez, não afetam API.

**P: Quanto tempo demora o build?**  
R: ~3-5 minutos (depende da máquina)

**P: Preciso fazer commit das mudanças?**  
R: Recomendado: `git commit -m "fix: AlbumPage crash on Android"`

## 📞 Suporte

Se encontrar problemas:
1. Verificar logs com `adb logcat`
2. Procurar mensagens com ❌ ou ERROR
3. Limpar build e tentar novamente
4. Verificar versão do Node.js
