# 🧪 Teste Agora - Sistema Completo

## ✅ Tudo pronto! Aqui como testar:

---

## 🔧 Setup Inicial (uma vez)

### 1. **Garantir que backend rodando**
```bash
cd backend
python server.py
# Deve exibir: Uvicorn running on http://127.0.0.1:8000
```

### 2. **Garantir que frontend rodando**
```bash
cd frontend
npm start
# Deve abrir em http://localhost:3000
```

---

## 📱 Teste 1: No Navegador (Browser)

### **Passo a passo:**

1. **Abra Chrome/Firefox** em seu PC
   ```
   http://localhost:3000
   ```

2. **Faça login** (se não estiver)

3. **Clique em um álbum qualquer**
   - Vá em "Tops" ou "Lançamentos"

4. **Clique em "BAIXAR CD COMPLETO"** (botão vermelho)
   - Seu navegador **deve fazer download de um ZIP**
   - Vai para `C:\Users\[seu-user]\Downloads\`

5. **Confirmar:**
   - ✅ ZIP baixado
   - ✅ Pode extrair normalmente

---

## 📲 Teste 2: No App Instalado

### **Instalação:**

1. **Abra Chrome em seu PC** (`localhost:3000`)

2. **Menu (⋮) → Instalar app** (ou procure ícone de "Install")

3. **Clique em "Instalar"**

4. **App aparecerá na sua barra de tarefas/menu iniciar**

### **Teste no App:**

1. **Abra o app instalado** (não pelo navegador!)
   - Deve parecer um app nativo

2. **Faça login** (se necessário)

3. **Clique em um álbum**

4. **Clique em "BAIXAR CD COMPLETO"**
   - ✅ **Mostra "Loader" + porcentagem** (0% → 100%)
   - ✅ **Diferentes de ZIP** (sem download em pasta)
   - ✅ **Salva direto no app** (IndexedDB)

5. **Aguarde até 100%**

6. **Vá em Biblioteca → Downloads**
   - ✅ **Vê o álbum com imagem**
   - ✅ **Lista de 42 músicas**

7. **Clique Play em uma música**
   - ✅ **TOCA normalmente**

---

## 🔌 Teste 3: Offline no App

### **Cenário:**

1. **Com álbum já baixado** (teste anterior)

2. **Desconecte WiFi** (desconecte da rede ou airplane mode)

3. **Abra o app novamente**

4. **Vá em Biblioteca → Downloads**
   - ✅ **Vê o álbum** (dados em cache)
   - ✅ **Vê a imagem** (Blob em cache)
   - ✅ **Vê as 42 músicas** (lista em cache)

5. **Clique Play**
   - ✅ **TOCA normalmente**
   - ✅ **Sem internet!**

---

## 🎯 Resultados Esperados

### **No Navegador:**
```
Botão "BAIXAR CD COMPLETO"
         ↓
     ZIP baixado
         ↓
C:\Users\[user]\Downloads\[Album].zip
```

### **No App (Online):**
```
Botão "BAIXAR CD COMPLETO"
         ↓
    Loader aparece
    "Loader 45%"
         ↓
    Ao atingir 100%
    Toast: "Pronto para offline!"
         ↓
  Salvo em IndexedDB
```

### **No App (Offline):**
```
Biblioteca → Downloads
    ↓
   Mostra álbuns baixados
   Com imagens
   Com lista de músicas
    ↓
  Clica Play
    ↓
   ♪ TOCA normalmente ♪
```

---

## 🔍 Verificar Dados em Cache

### **Via DevTools:**

1. **Abra DevTools** (F12) no app

2. **Vá em Application → IndexedDB → Musicasua**

3. **Expanda as tabelas:**
   - `downloadedSongs` → MP3s baixados
   - `downloadedAlbums` → Álbuns marcados
   - `cachedAlbums` → Metadados em cache
   - `cachedArtists` → Dados artista em cache
   - `cachedImages` → Imagens em Blobs

4. **Clique em um registro** para ver detalhe

---

## 🐛 Se der erro?

### ❌ Botão não mostra loader no app
```
1. Verificar se está REALMENTE no app instalado
   (não abrir em aba de browser normal)
2. DevTools (F12) → Console
3. Procurar por erro "isPWA"
4. Se vazio: fazer refresh (Ctrl+R)
```

### ❌ Mostra erro ao baixar
```
1. Backend respondendo? Testar:
   http://localhost:8000/health
   
2. Se erro 404:
   - Música não tem file_url no banco
   - Precisa fazer upload da música antes

3. DevTools (F12) → Network
   - Procurar por requisição `/api/music/...`
   - Ver status code e erro
```

### ❌ Imagem não aparece offline
```
1. Imagem não foi cacheada
2. Solução: Ir online novamente
3. Abrir álbum (cacheia automaticamente)
4. Depois voltar offline
```

---

## ✨ Confirmação Final

Se conseguir fazer isso tudo:

- ✅ Baixar ZIP no navegador
- ✅ Instalar app
- ✅ Baixar MP3s no app (com loader)
- ✅ Ver downloads em cache
- ✅ Tocar offline

**🎉 PRONTO! Tudo funcionando!**

---

## 💡 Dicas

- **Teste em horário de internet boa** (para first-time caching)
- **Não feche o browser rapidamente** enquanto está baixando
- **Limpar cache se der problema:** `indexedDB.deleteDatabase('Musicasua')`
- **Sempre fazer refresh após instalar app** (Ctrl+R)

---

**Bora testar! Manda screenshot ou avisa se der problema** 🚀
