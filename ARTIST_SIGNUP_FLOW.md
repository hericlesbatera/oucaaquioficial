# Fluxo de Criação de Perfil de Artista no Signup

## Resumo
Quando um novo artista se cadastra, seu perfil é criado **automaticamente** com TODAS as informações preenchidas no signup (nome, slug/URL, estado, cidade, estilo musical). O perfil fica pronto para ser acessado imediatamente.

## Dados Criados no Signup

Quando o artista preenche e confirma:
- **Nome do Artista**: "Bonde do Forró"
- **URL do Perfil**: "bondeoforro" 
- **Cidade**: "Recife"
- **Estado**: "PE"
- **Estilo Musical**: "Forró"

O banco de dados cria:

```json
{
  "id": "user-uuid-12345",
  "name": "Bonde do Forró",
  "slug": "bondeoforro",
  "email": "contato@bondeoforro.com",
  "cidade": "Recife",
  "estado": "PE",
  "genero": "",
  "estilo_musical": "Forró",
  "bio": "",
  "avatar_url": "",
  "cover_url": "",
  "followers_count": 0,
  "is_verified": false,
  "created_at": "2025-12-26T10:00:00Z"
}
```

## Campos Opcionais (Vazios Inicialmente)
- `bio` - Preenchida manualmente no perfil
- `avatar_url` - Foto do artista (upload posterior)
- `cover_url` - Foto de capa (upload posterior)

## Fluxo Passo a Passo

### 1️⃣ Artista Clica em "Cadastrar como Artista"
```
Opção User vs Artista
↓
Preenche dados básicos (nome, email, senha)
↓
Clica "PRÓXIMO"
```

### 2️⃣ Preenche Dados de Artista
```
Nome do Artista: "Bonde do Forró"
URL do Perfil: "bondeoforro" (auto-completa a partir do nome)
Cidade: "Recife"
Estado: "PE"
Estilo Musical: "Forró"
↓
Clica "CADASTRAR"
```

### 3️⃣ Backend Cria Perfil (LoginWhite.jsx)
```
Frontend tenta criar em:
  1. Supabase direto (via RLS)
  2. Se falhar, via API backend (/api/auth/init-artist-profile)

✅ Perfil criado com TODAS as informações
```

### 4️⃣ Sucesso! Redireciona ao Perfil
```
Mensagem: "Cadastro finalizado com sucesso"
Verifique seu email...
↓
Redireciona para: oucaaqui.com/bondeoforro
```

### 5️⃣ Artista Confirma Email e Entra na Conta
```
Clica em "Entrar"
Ou clica em "Meu Perfil" no dropdown
↓
Vai direto para: oucaaqui.com/bondeoforro
(seu perfil público já existe!)
```

## Fluxo de "Meu Perfil"

### Primeira Vez (Logo após signup)
```
User clica em "Meu Perfil"
↓
Header.jsx busca artistForUser.slug
↓
Navega para /{slug} (ex: /bondeoforro)
↓
Exibe perfil público completo
```

### Artista Querendo Editar
```
No perfil, clica "Editar Perfil"
↓
Vai para /artist/settings
↓
Pode adicionar foto, biografia, etc
↓
Salva as alterações
↓
Volta ao perfil público atualizado
```

## Informações do Perfil Público

Quando entra em `oucaaqui.com/bondeoforro`, mostra:

```
┌─────────────────────────────────┐
│  [Foto de Capa - vazia inicial] │
│                                 │
│      [Foto do Artista]          │
│     Bonde do Forró              │
│                                 │
│  45.230 seguidores              │
│  125.000 ouvintes mensais        │
│                                 │
│  📍 Recife, PE                  │
│  🎵 Forró                       │
│  Bio: [vazia - sem editar]      │
│                                 │
│  [Botão Reproduzir]             │
│  [Botão Seguir]                 │
│  [Botão Editar - se for dele]   │
└─────────────────────────────────┘
```

## Adicionando Foto e Biografia

Artista pode preencher opcionalmente:

1. **Foto de Perfil** - Clica no avatar e faz upload
2. **Foto de Capa** - Clica na capa e faz upload
3. **Biografia** - Escreve uma descrição pessoal

Tudo em `/artist/settings` ou no próprio perfil clicando "Editar"

## Erros Possíveis

### ❌ Slug já existe
Ao preencher URL, frontend valida se slug está disponível:
```
URL do Perfil: bondeoforro
⚠️  Este endereço já está em uso
```
Artista muda para: bondeoforro2, bondeoforro_oficial, etc

### ❌ Falha ao criar perfil
Se AMBOS Supabase e API falharem:
```
Erro ao criar perfil
Não foi possível criar seu perfil de artista. 
Tente novamente.
```
Artista pode tentar signup novamente

## Permissões no Banco

RLS Policy necessária:

```sql
-- Permitir que usuários criem seu próprio perfil durante signup
CREATE POLICY "Artists can insert their own profile"
ON public.artists
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Permitir leitura pública
CREATE POLICY "Anyone can read artist profiles"
ON public.artists
FOR SELECT
USING (true);
```

## Checklist Técnico

### Frontend (LoginWhite.jsx)
- ✅ Criar artistProfileData com todos os campos
- ✅ Inserir direto no Supabase
- ✅ Se falhar RLS, tentar API como fallback
- ✅ Se falhar tudo, mostrar erro e não deixar completar
- ✅ Redirecionar para `/{artistSlug}` após sucesso

### Frontend (Header.jsx)
- ✅ "Meu Perfil" navega para `/{artistForUser.slug}`
- ✅ Se não tem slug, usa ID
- ✅ Se não tem dados, vai para `/artist/settings`

### Backend
- ✅ Criar `/api/auth/init-artist-profile` (routes/auth.py)
- ✅ Usar `ensure_artist_exists()` para criar
- ✅ Retornar sucesso ou erro claro

### Banco de Dados
- ✅ RLS policies permitem inserção pelo próprio user
- ✅ Slug é unique (constraint)
- ✅ Tabela artists pronta para receber dados

## Teste Manual

1. Abra incógnito/private window
2. Clique "Cadastrar"
3. Selecione "Artista"
4. Preencha:
   - Nome: Seu Nome Aqui
   - Email: seu@email.com
   - Senha: xxxxxxxx
5. Clique "PRÓXIMO"
6. Preencha:
   - Nome do Artista: Seu Nome Aqui
   - URL: seunomeaqui (auto-completa)
   - Cidade: Sua Cidade
   - Estado: SP
   - Estilo: Rock
7. Clique "CADASTRAR"
8. ✅ Deve aparecer "Cadastro finalizado!"
9. ✅ Deve redirecionar para `/seunomeaqui`
10. ✅ Deve exibir o perfil com os dados preenchidos
11. ✅ Foto e biografia vazias (esperado)
12. Clique "Editar Perfil" para adicionar foto/bio

## Tecnologias

- **Frontend**: React + Supabase client
- **Backend**: FastAPI + Supabase service role
- **Banco**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth (JWT)
