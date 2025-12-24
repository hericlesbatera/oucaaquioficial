# ✅ Fix: Reprodução de Músicas Offline Não Funciona

## Problema Real Identificado
Logs mostram:
```
Error: "Filesystem" plugin is not implemented on android
```

O plugin Capacitor necessário para ler arquivos locais não estava instalado.

---

## Solução - Instalação de Plugins

### 1. Instalar Dependências NPM
```bash
npm install
```

### 2. Sincronizar com Android
```bash
npx cap sync android
```

Isto vai:
- ✅ Instalar `@capacitor/filesystem` 
- ✅ Instalar `@capacitor-community/http`
- ✅ Registrar plugins no Android nativo

### 3. Build da APK
```bash
# Se tiver Android Studio instalado:
npx cap build android

# Ou abra em Android Studio:
npx cap open android
```

---

## Fluxo de Reprodução Offline (Agora Funcionará)

```
┌─────────────────────────────────────────┐
│ 1. Download (useCapacitorDownloads)     │
│ URL → Fetch → Base64 → Filesystem       │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│ 2. Leitura (useOfflinePlayer)           │
│ Filesystem.readFile() → Base64 ✅ OK    │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│ 3. Conversão para Blob URL              │
│ atob() → Uint8Array → Blob → blob:...   │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│ 4. Reprodução (PlayerContext)           │
│ audio.src = blob:... → play() ✅ OK     │
└─────────────────────────────────────────┘
```

---

## Checklist Pós-Instalação

- [ ] `npm install` executado
- [ ] `npx cap sync android` executado
- [ ] APK rebuilda
- [ ] App reinstalado no celular
- [ ] Baixar um álbum (verificar sucesso no console)
- [ ] Ir para Library → Downloads
- [ ] Clicar em Play
- [ ] **Música toca!** ✅

---

## Debugging se Ainda Não Funcionar

No console do Capacitor, procure por:

### ✅ Esperado
```
[OfflinePlayer] Lendo arquivo offline: music_downloads/album_name/01...
[OfflinePlayer] Blob criado para 01...
[PlayerContext] Definindo audioUrl: blob:...
[PlayerContext] Áudio carregado com sucesso
```

### ❌ Se Ver Erros
```
Error: "Filesystem" plugin is not implemented on android
→ Rodar `npx cap sync android` novamente

Arquivo lido mas sem dados
→ Download foi incompleto, baixar novamente

Erro ao decodificar base64
→ Arquivo corrompido, deletar e baixar novamente
```

---

## Arquivos Modificados
- ✅ `package.json` - Adicionou `@capacitor/filesystem` e `@capacitor-community/http`
- ✅ `frontend/src/hooks/useOfflinePlayer.js` - Removeu import inválido (já corrigido)

