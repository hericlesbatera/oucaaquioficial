# Guia de Build e Teste do App Android

## Pré-requisitos
- Node.js 20.x instalado
- Android SDK instalado
- Emulador Android ou dispositivo físico conectado

## Passos para Buildar e Testar

### 1. Instalar dependências do Frontend
```bash
cd frontend
npm install
```

### 2. Buildar o Frontend
```bash
npm run build
```

### 3. Copiar build para o backend (se necessário)
```bash
cd ..
mkdir -p backend/public
cp -r frontend/build/* backend/public/
```

### 4. Sincronizar com Capacitor
```bash
npx cap sync android
```

### 5. Abrir Android Studio ou usar Gradle
```bash
cd android
# Listar todos os devices
adb devices

# Build para debug
./gradlew assembleDebug

# Build e rodar no emulador/device
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### 6. Testar no Device/Emulador
1. Abrir o app
2. Navegar até um álbum
3. Clicar em algum álbum na home page
4. Verificar se a página de álbum carrega corretamente
5. Clicar em "Baixar CD Completo" (se mobile)
6. Verificar console com `adb logcat`

## Monitorar Logs em Tempo Real
```bash
# Todos os logs (completo)
adb logcat

# Apenas logs de erro
adb logcat | grep ERROR

# Apenas logs da app
adb logcat | grep Musicasua

# Apenas logs do JavaScript/React (WebView)
adb logcat | grep "chromium"
```

## Troubleshooting

### App continua crasheando
1. Limpar build anterior:
   ```bash
   cd android
   ./gradlew clean
   ```

2. Reconstruir tudo:
   ```bash
   cd ..
   npx cap sync android
   cd android
   ./gradlew assembleDebug
   ```

3. Verificar logs para mensagens de erro específicas:
   ```bash
   adb logcat | grep -E "❌|ERROR|Exception|Stack"
   ```

### WebView não carregando
- Verificar se `capacitor.config.json` está correto
- Testar em navegador primeiro: `npm start` no frontend

### Problema de permissões
- Verificar `AndroidManifest.xml` para permissões necessárias
- Verificar arquivo `build.gradle` para dependências

## Checklist de Teste

- [ ] App abre sem erros
- [ ] Home page carrega com álbuns
- [ ] Clicar em álbum navega para AlbumPage
- [ ] AlbumPage carrega dados corretamente
- [ ] Imagens do álbum carregam
- [ ] Botão de play funciona
- [ ] Botão de favoritar funciona
- [ ] Botão de download funciona
- [ ] Lista de músicas mostra corretamente
- [ ] Não há crashes ao navegar

## Dicas Importantes

1. **Sempre sincronizar antes de buildar:**
   ```bash
   npx cap sync android
   ```

2. **Limpar cache se tiver problemas:**
   ```bash
   adb shell pm clear com.musicasua.app
   ```

3. **Verificar versão do Capacitor:**
   ```bash
   npm list @capacitor/core
   ```

4. **Se mudar código React, fazer rebuild:**
   ```bash
   cd frontend
   npm run build
   npx cap sync android
   ```
