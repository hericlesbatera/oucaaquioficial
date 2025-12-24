# 📱 Guia: Modo Offline do App

## O que funciona offline?

### ✅ FUNCIONA OFFLINE
1. **Reprodução de músicas baixadas**
   - Toca álbuns/músicas na biblioteca
   - Capa do álbum aparece
   - Player normal

2. **Biblioteca pessoal (com cache)**
   - Login permanece salvo
   - User name e avatar mostram
   - Downloads aparecem

3. **Navegação básica**
   - Library (com downloads)
   - Player
   - Controles (play, pause, próximo, etc)

### ❌ NÃO FUNCIONA OFFLINE
- Home (requer busca ao servidor)
- Search (requer backend)
- Upload de músicas
- Criação de playlists
- Sincronizar com novo conteúdo

---

## Como Funciona o Cache de Autenticação

### Login Normal
```
App abre → Supabase valida sessão → Restaura usuário ✅
Dados salvos em: localStorage['currentUser']
```

### Sem Internet (Offline)
```
App abre → Sem sessão do Supabase → Restaura do cache ✅
localStorage['currentUser'] é lido automaticamente
Usuário aparece normalmente
```

### Logout
```
Usuário clica "Sair"
→ localStorage['currentUser'] é deletado
→ Próxima abertura: tela de login (offline ou online)
```

---

## Exemplos de Comportamento

### Cenário 1: Usuário logado + Internet
1. App abre
2. Supabase valida token
3. Usuário mostrado
4. Música pode tocar (online ou offline)

### Cenário 2: Usuário logado + SEM Internet
1. App abre
2. Sem conexão → Supabase timeout
3. **localStorage restaura o usuário** ✅
4. Library aparece normalmente
5. Downloads tocam normalmente

### Cenário 3: Internet volta
1. Supabase reconecta
2. Sincroniza tudo automaticamente
3. App volta ao normal

### Cenário 4: Usuário faz logout + SEM Internet
1. Usuário clica "Sair"
2. localStorage['currentUser'] deletado
3. Página de login aparece
4. ❌ Não consegue fazer login sem internet

---

## Arquivos Envolvidos

| Arquivo | Função |
|---------|--------|
| `AuthContext.jsx` | Gerencia login e cache do usuário |
| `useCapacitorDownloads.js` | Download de áudio + capa |
| `useOfflinePlayer.js` | Carrega arquivo local como blob URL |
| `PlayerContext.jsx` | Toca blob URLs |
| `Library.jsx` | Mostra downloads salvos |

---

## Melhorias Futuras

- [ ] Salvar playlists favoritas offline
- [ ] Salvar busca recentes offline
- [ ] Sync incremental quando voltar internet
- [ ] Indicador "Modo Offline" na UI
- [ ] Cache de imagens de álbuns

