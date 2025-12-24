# Gerar APK via PWA Builder (Mais Rápido)

## Método 1: PWA Builder Online (Recomendado)

1. Fazer build do React:
```bash
cd frontend
npm run build
```

2. Deploy do `dist/` em um servidor (Firebase, Vercel, etc)
   - Ou servir localmente com `npx serve dist`

3. Ir para: https://www.pwabuilder.com

4. Colar URL da aplicação
   - Exemplo: `https://seu-dominio.com`

5. Clicar em "Start"

6. Ele detecta o manifest.json automaticamente

7. Ir para "Package" → "Android"

8. Clicar em "Download"

9. APK pronto para instalar!

## Método 2: PWA Builder CLI

```bash
npm install -g @pwabuilder/pwabuilder

pwabuilder https://seu-dominio.com --platform android
```

Gera APK em minutos!

## Instalar no celular

```bash
adb install -r app.apk
```

Ou copiar via USB para o celular e abrir.

## Vantagens

✅ Usa o PWA Builder da Microsoft  
✅ Nenhuma dependência (Android Studio não precisa)  
✅ APK otimizado automaticamente  
✅ Suporta offline automaticamente  
✅ Service Worker já integrado  
✅ Muito mais rápido que Capacitor  

## Próximos passos

O APK funcionará como:
- **Online:** Abre site normal
- **Offline:** Mostra versão cacheada com modo offline da Home
- **Downloads:** IndexedDB funciona normally

Perfeito para testar!
