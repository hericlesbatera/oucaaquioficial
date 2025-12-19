# Guia para Criar APK com Capacitor

## Pré-requisitos

1. **Node.js** instalado
2. **Android Studio** instalado (com SDK Android)
3. **Java JDK** instalado

## Passos

### 1. Build o React primeiro

```bash
cd frontend
npm run build
```

Isso cria a pasta `dist/` com os arquivos otimizados.

### 2. Instalar Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/app @capacitor/status-bar @capacitor/keyboard
```

### 3. Inicializar Capacitor

```bash
npx cap init
```

Preencher:
- **App name:** Musicasua
- **App Package ID:** com.musicasua.app
- **Web dir:** dist

### 4. Adicionar plataforma Android

```bash
npx cap add android
```

### 5. Copiar arquivos para Android

```bash
npx cap copy android
```

### 6. Abrir no Android Studio

```bash
npx cap open android
```

### 7. No Android Studio:

1. Esperar gradle sincronizar
2. Conectar celular ou abrir emulador
3. Clicar em "Run" ou ▶️ 
4. Selecionar device
5. Aguardar compilação

### 8. Ou gerar APK direto

**Debug APK:**
```bash
cd android
gradlew assembleDebug
```

APK gerado em: `android/app/build/outputs/apk/debug/app-debug.apk`

**Release APK (otimizado):**
```bash
cd android
gradlew assembleRelease
```

APK gerado em: `android/app/build/outputs/apk/release/app-release.apk`

## Testar o APK

Copie o APK para o celular ou:

```bash
adb install -r caminho/para/app-debug.apk
```

## Troubleshooting

**Se der erro de Gradle:**
```bash
cd android
./gradlew clean build
```

**Se der erro de capacitor.config.json:**
Crie o arquivo na raiz:
```json
{
  "appId": "com.musicasua.app",
  "appName": "Musicasua",
  "webDir": "frontend/dist",
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 0
    }
  }
}
```

## Próximos passos (opcional)

Para release na Play Store, precisaria:
- Assinar APK com keystore
- Adicionar icones e screenshots
- Preencher dados da app no console Google Play
