# Deploy Frontend no Railway

## ✅ Pré-requisitos
- [ ] Conta no Railway (railway.app)
- [ ] Projeto criado no Railway
- [ ] Variáveis de ambiente configuradas
- [ ] Git sincronizado (push feito)

## 🚀 Opção 1: Deploy Automático (Recomendado)

### 1. Conectar GitHub ao Railway
1. Abra [railway.app](https://railway.app)
2. Faça login
3. Clique em "New Project"
4. Selecione "Deploy from GitHub"
5. Autorize Railway a acessar seu GitHub
6. Selecione o repositório: **hericlesbatera/oucaaquioficial**
7. Clique em "Deploy"

### 2. Configurar Variáveis de Ambiente
1. No Railway dashboard, abra seu projeto
2. Vá para "Variables"
3. Adicione as seguintes variáveis:

```
VITE_API_URL=http://localhost:8000
```

(Ou a URL do seu backend em produção se tiver)

### 3. Railway Faz Deploy Automaticamente
- Quando você fizer push para o GitHub, Railway detecta automaticamente
- Executa `npm install`
- Executa build do frontend
- Inicia `node server.js`
- Deploy concluído em ~5 minutos

---

## 🔧 Opção 2: Deploy Manual via CLI

### 1. Instalar Railway CLI

```bash
npm install -g railway
```

### 2. Fazer Login

```bash
railway login
```

Isso abrirá navegador para você autorizar.

### 3. Deployar

Na pasta do projeto (onde está railway.json):

```bash
railway up
```

Railway automaticamente:
- Detecta o projeto
- Faz build
- Deploya
- Gera URL pública

---

## 📋 Checklist de Deploy

- [ ] Projeto criado no Railway
- [ ] GitHub conectado (ou usando CLI)
- [ ] Variáveis de ambiente definidas
- [ ] Build funcionando (`npm run build`)
- [ ] `server.js` pronto para iniciar
- [ ] `railway.json` ou `railway.toml` presentes
- [ ] Deploy iniciado
- [ ] Aplicação respondendo em produção

---

## 🔗 URLs Úteis

**Depois do Deploy:**
- URL da aplicação: `https://seu-app.railway.app`
- Dashboard: https://railway.app/dashboard
- Logs: Em "Deployments" → clique no deploy → "Logs"

---

## ⚠️ Variáveis de Ambiente Importantes

Se seu backend estiver em Railway também:

```
VITE_API_URL=https://seu-backend.railway.app
```

Se estiver local:
```
VITE_API_URL=http://localhost:8000
```

Se estiver em outro lugar:
```
VITE_API_URL=https://seu-backend.com
```

---

## 🐛 Troubleshooting

### Erro: "Build failed"
```
❌ npm install falhou
❌ Build falhou
```
**Solução:**
1. Verifique `package.json` está correto
2. Verifique `frontend/` tem `package.json`
3. Veja logs completos no Railway

### Erro: "Port 3000 already in use"
```
❌ Aplicação não inicia
```
**Solução:**
Railway usa porta automática. Verifique `server.js`:
```javascript
const PORT = process.env.PORT || 3000;
```

### Erro: "Cannot find module"
```
❌ Módulo não encontrado
```
**Solução:**
```bash
npm install
npm run build
```

### Erro: CORS ou API não responde
```
❌ Frontend conecta mas API retorna erro
```
**Solução:**
1. Verifique `VITE_API_URL` está correto
2. Certifique que backend está deployado
3. Verifique CORS no backend

---

## 📊 Status do Deploy

Para verificar status:

1. **Railway Dashboard**
   - Vá para seu projeto
   - Veja "Deployments"
   - Status verde = OK ✅
   - Status vermelho = Erro ❌

2. **Logs em Tempo Real**
   - Clique no deployment
   - Aba "Logs"
   - Veja logs da aplicação

3. **Teste a Aplicação**
   ```bash
   curl https://seu-app.railway.app
   ```

---

## 🔄 Deploy Automático a Cada Push

Depois de conectar GitHub:
1. Você faz `git push` local
2. GitHub recebe o push
3. Railway detecta automáticamente
4. Railway faz novo deploy
5. Aplicação atualiza em ~5 minutos

Não precisa fazer nada manualmente a cada push!

---

## 📝 Resumo Rápido

```bash
# Opção 1: Via Web (mais fácil)
1. Abrir railway.app
2. Conectar GitHub
3. Pronto! Deploy automático

# Opção 2: Via CLI
railway login
railway up
```

---

**Tempo estimado de deploy**: 5-10 minutos
**Seu deploy estará em**: `https://{seu-projeto-nome}.railway.app`
