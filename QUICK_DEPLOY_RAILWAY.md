# Deploy Rápido - Railway Frontend

## ⚡ 30 Segundos - Opção Mais Rápida

### Passo 1: Abrir Railway
Acesse: https://railway.app/dashboard

### Passo 2: Novo Projeto
Clique em "New Project" → "Deploy from GitHub"

### Passo 3: Selecionar Repositório
Autorize e selecione: `hericlesbatera/oucaaquioficial`

### Passo 4: Deploy
Clique em "Deploy Now"

**Pronto! Railway faz tudo automaticamente** ✅

URL será: `https://oucaaquioficial.railway.app`

---

## 🖥️ Se Preferir via Terminal

### Instalar Railway CLI
```bash
npm install -g railway
```

### Fazer Login
```bash
railway login
```

### Deploy
```bash
cd c:\Users\heric\Documents\oucaaquioficial-main\oucaaquioficial-main
railway up
```

Railway faz upload, build e publica automaticamente.

---

## ✅ Verificar Deploy

Após deploy:

```bash
# Testar se está funcionando
curl https://seu-app.railway.app

# Ou abra no navegador
# https://seu-app.railway.app
```

---

## 📝 Variáveis de Ambiente (Se Necessário)

No Railway Dashboard → Variables:

```
VITE_API_URL=https://seu-backend.railway.app
```

(Ou URL do seu backend)

---

## 🎯 Resultado Final

```
✅ Frontend deployado no Railway
✅ URL pública funcionando
✅ Auto-deploy a cada git push
✅ Logs disponíveis em tempo real
```

**Tempo total**: 5-10 minutos

**Próximo**: Deploy do backend também!
