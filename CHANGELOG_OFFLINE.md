# Changelog - Offline Music & Authentication Cache

## ✅ Fixes Implementados

### 1. Reprodução de Músicas Offline
- **Problema**: Música era baixada mas não tocava
- **Causa**: Plugin `@capacitor/filesystem` não instalado
- **Solução**: Instalado `@capacitor/filesystem` v8.0.0
- **Arquivos modificados**:
  - `package.json` - adicionado dependency
  - `frontend/src/hooks/useCapacitorDownloads.js` - removido import inválido de `@capacitor-community/http`
  - `frontend/src/hooks/useOfflinePlayer.js` - corrigido import quebrado (linha 12)

### 2. Cache de Capa do Álbum Offline
- **Problema**: Capa do álbum não aparecia ao tocar offline
- **Solução**: Baixar e salvar capa junto com músicas
- **Arquivos modificados**:
  - `frontend/src/hooks/useCapacitorDownloads.js` - adicionado download de capa
  - `frontend/src/hooks/useOfflinePlayer.js` - adicionado carregamento de capa como blob URL
  - `frontend/src/pages/Library.jsx` - usar capa offline quando disponível

### 3. Delete de Álbuns
- **Problema**: Delete de álbum falhava com erro "file does not exist"
- **Causa**: Tratamento inadequado de erros de filesystem
- **Solução**: Continuar mesmo se arquivo não existir, atualizar metadata sempre
- **Arquivos modificados**:
  - `frontend/src/hooks/useCapacitorDownloads.js` - error handling melhorado em `deleteDownloadedAlbum` e `deleteDownloadedSong`

### 4. Autenticação Persistente (Offline)
- **Problema**: Ao abrir app sem internet, usuário não aparecia
- **Solução**: Restaurar usuário do localStorage quando Supabase não tiver sessão
- **Arquivos modificados**:
  - `frontend/src/context/AuthContext.jsx` - fallback para localStorage se sem sessão Supabase

---

## 📋 Fluxos Testados

### Reprodução Offline ✅
1. Login com internet
2. Desligar internet
3. Abrir app → usuário persiste
4. Library → Downloads aparecem
5. Play → música toca
6. Capa aparece

### Delete Offline ✅
1. Deletar álbum offline
2. Metadata atualizado mesmo se arquivo já deletado
3. Sem erros no console

### Autenticação Persistente ✅
1. Login com internet
2. Fechar app
3. Desligar internet
4. Abrir app → usuário e library aparecem
5. Tocar música offline → funciona

---

## 🔧 Dependências Adicionadas

```json
{
  "@capacitor/filesystem": "^8.0.0"
}
```

---

## 📝 Notas Técnicas

### Como Funciona o Offline
```
Download:
Supabase URL → Fetch → Blob → Base64 → Filesystem.writeFile()

Reprodução:
Filesystem.readFile() → Base64 → atob() → Uint8Array → Blob → URL.createObjectURL()

Auth:
Supabase Session → [SEM INTERNET] → localStorage['currentUser']
```

### Limitações Atuais
- ❌ Home/Search não funciona offline (requer backend)
- ❌ Novo login não funciona sem internet
- ❌ Playlists não são cacheadas
- ✅ Tudo funciona na Library com downloads

---

## 🚀 Próximos Passos (Futuro)

- [ ] Cache de playlists favoritas
- [ ] Cache de busca recente
- [ ] Indicador visual "Modo Offline"
- [ ] Sync incremental quando voltar internet

