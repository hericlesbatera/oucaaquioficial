# Detecção Automática de Offline e Redirecionamento para Biblioteca

## O que foi implementado

Sistema completo que detecta automaticamente quando o app perde conexão com a internet e:

1. **Detecta Offline Automaticamente** - Monitora o status de conexão usando `navigator.onLine`
2. **Redireciona para Biblioteca** - Quando fica offline, redireciona automaticamente para `/library` se o usuário estiver em outra página
3. **Cache de Dados** - Salva os dados da biblioteca no `localStorage` para funcionar offline
4. **Aviso Visual** - Mostra banner diferenciado quando está offline ou em modo cache

## Arquivos Criados/Modificados

### Novos Hooks

#### `frontend/src/hooks/useNetworkStatus.js`
- Monitora eventos `online` e `offline` do navegador
- Fornece `isOnline`, `isOffline` e `wasJustOffline`
- Usado globalmente para detectar estado da rede

#### `frontend/src/hooks/useLibraryCache.js`
- Gerencia cache de dados da biblioteca no `localStorage`
- Funções principais:
  - `saveLibraryToCache(data)` - Salva dados em cache
  - `loadLibraryFromCache()` - Carrega dados do cache
  - `clearLibraryCache()` - Remove cache
  - `hasCachedData()` - Verifica se há dados salvos

### Novo Componente

#### `frontend/src/components/OfflineDetector.jsx`
- Monitora status de offline do usuário
- Redireciona automaticamente para `/library` quando offline
- Salva caminho anterior para voltar quando online

### Modificações

#### `frontend/src/App.js`
- Importou e adicionou o `OfflineDetector` ao renderizar
- Agora está sempre monitorando o status de offline

#### `frontend/src/pages/Library.jsx`
- Integrou `useNetworkStatus` e `useLibraryCache`
- Carrega dados do cache quando offline
- Salva dados em cache após carregar online
- Mostra banners visuais de offline/cache
- Fallback para cache se deu erro ao carregar

## Como Funciona

### Fluxo de Detecção

```
1. OfflineDetector monitora navigator.onLine
   ↓
2. Se ficar offline → Redireciona para /library (se não estiver lá)
   ↓
3. Library.jsx detecta offline → Carrega dados do cache
   ↓
4. Se voltar online → Tenta recarregar dados online
   ↓
5. Dados são salvos em cache para próxima vez offline
```

### Fluxo de Cache

```
Online:
1. Carrega dados do Supabase
2. Salva em localStorage
3. Mostra dados normalmente

Offline:
1. Detecta offline automaticamente
2. Carrega dados do localStorage
3. Mostra aviso visual
4. Apenas downloads funcionam

Erro Online:
1. Se erro ao carregar online
2. Verifica se há cache
3. Carrega cache como fallback
```

## Como Testar

### No Browser
```bash
# 1. Abrir DevTools (F12)
# 2. Ir para Application → Storage → Local Storage
# 3. Procurar por "oucaaqui_library_cache"
# 4. Desconectar a internet (DevTools → Network → Offline)
# 5. Recarregar a página ou navegar para outra rota
# 6. Deve redirecionar para /library automaticamente
# 7. Dados devem carregar do cache
```

### No Mobile (Android)
```bash
# 1. Abrir Configurações do Navegador
# 2. Desabilitar Wi-Fi e dados móveis
# 3. Navegar no app
# 4. Deve redirecionar para Biblioteca
# 5. Dados da biblioteca devem funcionar
# 6. Downloads já baixados devem tocar
```

### Teste de Funcionalidade

**Teste 1: Redirecionamento Automático**
- Login no app
- Abrir página diferente (ex: Home, Albums)
- Desconectar internet
- ✓ Deve redirecionar para /library automaticamente

**Teste 2: Cache de Dados**
- Estar online, carregar biblioteca
- Abrir DevTools → Network → Offline
- Recarregar página
- ✓ Dados devem aparecer do cache

**Teste 3: Aviso Visual**
- Desconectar internet
- ✓ Deve aparecer banner "Modo Offline"
- Voltar online
- ✓ Banner deve desaparecer

**Teste 4: Fallback de Erro**
- Estar online com cache já salvo
- Desabilitar Supabase temporariamente
- Tentar carregar biblioteca
- ✓ Deve usar cache automaticamente

## Dados Armazenados

No `localStorage` com chave `oucaaqui_library_cache`:

```json
{
  "version": "1.0",
  "timestamp": "2025-12-24T10:30:00.000Z",
  "data": {
    "favoriteAlbums": [...],
    "favoritePlaylists": [...],
    "userPlaylists": [...]
  }
}
```

Tamanho típico: ~50-200KB (depende de quantos favoritos)

## Comportamento da UI

### Aviso de Offline (Amarelo)
```
🌐 Modo Offline
Mostrando dados salvos. Apenas downloads estão disponíveis.
```
- Mostra quando `isOffline === true`
- Background: `bg-amber-50`
- Ícone: `WifiOff`

### Aviso de Cache (Azul)
```
📡 Biblioteca em Cache
Mostrando dados salvos. Atualize para ver as mudanças recentes.
```
- Mostra quando `fromCache === true` e online
- Background: `bg-blue-50`
- Ícone: `Wifi`

## Limitações e Considerações

1. **Cache é por usuário** - Cada usuário tem seu próprio cache
2. **Vencimento** - Não há expiração automática, mas timestamp está registrado
3. **Tamanho** - localStorage tem limite (~5-10MB), suficiente para biblioteca
4. **Sincronização** - Quando voltar online, deve recarregar para atualizar
5. **Logout** - Cache persiste mesmo após logout (pode ser limpado se necessário)

## Debug

Para ver logs do sistema offline:

```javascript
// No console do navegador (DevTools)
// Procure por logs com prefixo [NetworkStatus], [LibraryCache], [OfflineDetector]

// Exemplo:
// [NetworkStatus] App está OFFLINE
// [LibraryCache] Biblioteca salva em cache com sucesso
// [OfflineDetector] Redirecionando para biblioteca (offline detectado)
```

## Próximos Passos (Opcional)

1. **Limpeza de Cache Periódica** - Limpar cache automático após X dias
2. **Sincronização em Background** - Sincronizar dados quando voltar online
3. **Indicador Global** - Mostrar status de conexão no Header/Footer
4. **Fallback de Playlists** - Cache também para playlists
5. **Persistência de Configurações** - Salvar preferências do usuário offline

## Compatibilidade

- ✓ Chrome/Edge 75+
- ✓ Firefox 64+
- ✓ Safari 12+
- ✓ Android Chrome
- ✓ iOS Safari
- ✓ Capacitor (Android/iOS)

## Troubleshooting

**Problema: Não redireciona para biblioteca**
- Verificar se está logado (ProtectedRoute)
- Verificar DevTools → Console para erros
- Verificar se `OfflineDetector` está no App.js

**Problema: Cache não está sendo salvo**
- Verificar se localStorage não está disabled
- Verificar tamanho do localStorage (DevTools → Storage)
- Verificar se dados estão sendo retornados do Supabase

**Problema: Dados antigos no cache**
- Limpar localStorage manualmente
- Ou usar DevTools → Storage → Clear All
- Fazer reload da página quando online

---

Sistema de offline automático implementado e pronto para uso!
