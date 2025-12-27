# Perfil de Artista - Criação Automática no Signup

## Problema Original
Quando um novo artista se cadastrava, o perfil não era criado automaticamente. Ao clicar em "Meu Perfil", tentava acessar um perfil que não existia ou levava para um artista errado.

## Solução: Criar Obrigatoriamente no Signup
Agora o perfil é criado **OBRIGATORIAMENTE** durante o signup com TODOS os dados (nome, slug, cidade, estado, estilo musical). Foto de perfil e biografia ficam vazios para serem preenchidos depois.

## Fluxo Novo

### 1. **Frontend (LoginWhite.jsx)** ✅ FEITO
- ✅ Tenta criar perfil direto no Supabase durante signup
- ✅ Se falhar com RLS, tenta via API como fallback  
- ✅ Redireciona para `/artist/settings` ao invés de perfil público (que pode não existir)

### 2. **Frontend (Header.jsx)** ✅ FEITO
- ✅ "Meu Perfil" navega direto para `/{artistSlug}` (perfil público)
- ✅ Perfil já foi criado no signup, então sempre existe
- ✅ Se algo falhar, fallback para `/artist/settings`

### 3. **Backend (auth.py)** ✅ CRIADO
Arquivo criado: `backend/routes/auth.py`

Este arquivo já está pronto, você só precisa:

#### Opção A: Se usa o backend Python em oucaaqui_backend (GitHub)
Copiar o conteúdo de `backend/routes/auth.py` daqui e colar em:
```
https://github.com/hericlesbatera/oucaaqui_backend/blob/master/routes/auth.py
```

Depois atualizar `server.py`:
```python
from routes.auth import router as auth_router
# ...
app.include_router(auth_router, prefix="/api")
```

#### Opção B: Se usa o backend local aqui
Já foi criado em `backend/routes/auth.py` - você só precisa atualizar um `server.py` lá.

## Fluxo Agora

```
1. Novo artista preenche dados no signup:
   - Nome, email, senha
   - Nome do Artista, URL (slug), Cidade, Estado, Estilo Musical
   ↓
2. Frontend tenta criar perfil OBRIGATORIAMENTE:
   a) Via Supabase direto (RLS)
   b) Se falhar RLS, via API backend (/api/auth/init-artist-profile)
   c) Se falhar tudo, mostra erro e não deixa completar signup
   ↓
3. Perfil criado com TODOS os dados (nome, slug, cidade, estado, estilo)
   Foto e biografia vazios (opcionais para depois)
   ↓
4. Signup finalizado, redireciona para /{artistSlug}
   Exemplo: /bondeoforro
   ↓
5. Artista vê seu perfil público criado
   Pode clicar "Editar" para adicionar foto, biografia, etc
   ↓
6. Clicando em "Meu Perfil", sempre leva para /{artistSlug}
```

## Checklist Deploy

- [ ] Adicionar `routes/auth.py` ao backend Python
- [ ] Atualizar `server.py` do backend para incluir auth router
- [ ] Deploy backend
- [ ] Verificar que LoginWhite.jsx foi atualizado
- [ ] Verificar que Header.jsx foi atualizado
- [ ] Deploy frontend
- [ ] Testar novo signup de artista
- [ ] Verificar que perfil é criado corretamente
- [ ] Verificar que "Meu Perfil" leva ao lugar certo

## Teste Manual

1. Abra janela incógnito
2. Clique em "Cadastrar"
3. Selecione "Artista"
4. Preencha:
   - Nome: "Seu Nome"
   - Email: seu@email.com
   - Senha: xxxxxxxx
5. Clique "PRÓXIMO"
6. Preencha:
   - Nome do Artista: "Seu Nome"
   - URL: "seunome" (auto-completa)
   - Cidade: "São Paulo"
   - Estado: "SP"
   - Estilo: "Rock"
7. Clique "CADASTRAR"
8. Deve mostrar "Cadastro finalizado!"
9. Deve redirecionar para `/seunome` (seu perfil)
10. Seu perfil deve exibir:
    - Nome correto: "Seu Nome"
    - URL correto: /seunome
    - Estado/Cidade: São Paulo, SP
    - Estilo: Rock
    - Foto: vazia (esperado)
    - Biografia: vazia (esperado)
11. Feche o navegador
12. Confirme o email em seu email provider
13. Abra novamente e faça login
14. Clique em "Meu Perfil"
15. Deve ir para `/seunome` (seu perfil público)

## Logs para Debug

**Frontend (Console do navegador):**
```
[SIGNUP] Criando perfil de artista para: user-id-xxx
[SIGNUP] Perfil de artista criado com sucesso
ou
[SIGNUP] Erro ao criar perfil no Supabase: ...
[SIGNUP] Tentando criar via API backend...
```

**Backend (Terminal/Logs):**
```
[AUTH] Init artist profile request for user: user-id-xxx
[AUTH] Artist profile initialized for: user-id-xxx
ou
[AUTH] Artist already exists: user-id-xxx
```

## Relacionado
- Documentação original: `SOLUCAO_TRIGGER_SIGNUP.md`
- Referência rápida: `QUICK_REFERENCE_ARTIST_SIGNUP.md`
