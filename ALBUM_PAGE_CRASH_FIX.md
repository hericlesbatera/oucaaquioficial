# Fix para Crash no AlbumPage - Android App

## Problema
Ao clicar em um álbum no aplicativo Android, a página trava e fecha o app imediatamente.

## Causas Identificadas

### 1. **Acessos a `album?.id` antes de validação**
- O código estava acessando `downloadProgress[album?.id]` sem validar se `album` existia
- Isso causava erros de null pointer ao tentar acessar propriedades de um objeto undefined

### 2. **Falta de tratamento de erro no carregamento**
- A função `loadAlbum()` não tinha try-catch envolvendo a lógica principal
- Qualquer erro durante o carregamento causava crash silencioso

### 3. **Promise.all sem recuperação de erro**
- Se `Promise.all([artistPromise, songsPromise])` falhava, o erro era propagado e causava crash
- Não havia fallback para continuar com dados parciais

### 4. **Acesso a `album.id` em funções sem validação**
- `handleDownloadAlbum()` e `handleFavorite()` não validavam se `album` existia antes de usar

## Correções Realizadas

### 1. **Adicionado try-catch na função `loadAlbum()`**
```javascript
const loadAlbum = async () => {
    try {
        // ... código de carregamento
    } catch (error) {
        console.error('❌ Erro ao carregar álbum:', error);
        if (isMounted) {
            setLoading(false);
            setNotFound(true);
        }
    }
};
```

### 2. **Validação de `album` antes de usar**
```javascript
disabled={!album || downloadInProgress || (album?.id && isAlbumDownloaded(album.id))}
```

Em vez de:
```javascript
disabled={downloadInProgress || isAlbumDownloaded(album?.id)}
```

### 3. **Recuperação de erro em Promise.all**
```javascript
try {
    [artistData, songsResult] = await Promise.all([artistPromise, songsPromise]);
} catch (error) {
    console.error('⚠️ Erro em Promise.all (não crítico):', error);
    // Continuar mesmo com erro - tentar carregar o que foi possível
    artistData = artistData || null;
    songsResult = songsResult || { data: [], error };
}
```

### 4. **Validações nas funções de ação**
```javascript
const handleDownloadAlbum = async () => {
    if (!album || !album.id) {
        console.error('❌ Album ou Album ID não disponível');
        toast({ /* ... */ });
        return;
    }
    
    if (!albumSongs || albumSongs.length === 0) {
        console.error('❌ Nenhuma música encontrada no álbum');
        toast({ /* ... */ });
        return;
    }
    // ... resto do código
};
```

### 5. **Acessos seguro ao `downloadProgress`**
```javascript
{downloadInProgress && album?.id && downloadProgress[album.id] ? (
    // Mostrar progresso
) : (
    // Outro estado
)}
```

## Como Testar

1. **Compilar o app:**
   ```bash
   cd frontend
   npm run build
   cd ..
   ```

2. **Sincronizar com Capacitor:**
   ```bash
   npx cap sync android
   ```

3. **Compilar e rodar no Android:**
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

4. **Testar:**
   - Abrir o app
   - Clicar em um álbum da página inicial
   - Verificar se a página do álbum carrega corretamente
   - Clicar em "Baixar CD Completo"
   - Verificar se o download progride sem crashes

## Logs para Debugging

Se ainda houver crashes, verificar os logs:
```bash
adb logcat | grep "Album\|Capacitor\|ERROR\|Exception"
```

Os erros agora serão capturados com prefixo `❌` para facilitar identificação.
