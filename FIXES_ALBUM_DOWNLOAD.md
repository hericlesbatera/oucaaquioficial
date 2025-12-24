# Corrigindo Download de Álbuns e Erro 400 em Favorites

## Problema 1: Erro 400 em Favorites

O erro `Failed to load resource: the server responded with a status of 400` ocorre porque as políticas de RLS (Row Level Security) do Supabase não estão configuradas corretamente.

### Solução:

1. Abra o **Supabase Dashboard** → Seu projeto
2. Vá para **SQL Editor**
3. Cole o conteúdo de `backend/migrations/fix_favorites_rls.sql`
4. Clique em **Run**

Isso criará as políticas necessárias para:
- Usuários verem seus próprios favoritos
- Usuários adicionarem/removerem favoritos

---

## Problema 2: Download Indisponível (archive_url vazio)

O download não funciona porque o campo `archive_url` na tabela `albums` está vazio ou nulo.

### Solução:

1. **Instale requests (se não tiver)**:
```bash
pip install requests
```

2. **Execute o script de geração de archives**:
```bash
cd backend
python generate_album_archives.py
```

Este script:
- Busca todos os álbuns sem `archive_url`
- Para cada álbum, faz download de todas as músicas
- Cria um arquivo ZIP
- Faz upload para o Supabase Storage
- Salva a URL pública no banco de dados

**Tempo estimado**: Depende da quantidade de álbuns e tamanho das músicas (pode levar alguns minutos)

### O que esperar:

```
🎵 Gerando Archives para Álbuns...
==================================================
Encontrados 5 álbuns sem archive

📦 Processando: Rey Vaqueiro - Forró e Vaquejada
   Músicas encontradas: 12
   ✓ 01 - Fogo e Gasolina.mp3
   ✓ 02 - Antes Que Eu Te Esqueça.mp3
   ...
   URL: https://rtdxqthhhwqnlrevzmap.supabase.co/storage/v1/object/public/musica/albums/...
   ✓ Album atualizado

==================================================
✓ Concluído: 5/5 álbuns processados
```

---

## Verificação

Após executar os scripts:

1. Vá para sua página de álbum
2. Clique em **Baixar** → Deve aparecer o ZIP download
3. Verifique em **Favoritos** → Erro 400 desapareceu

---

## Se ainda tiver problemas:

- **Error 400 no download**: Verifique se o arquivo ZIP foi criado corretamente (veja os logs do script)
- **Erro de permissão no Supabase**: Certifique-se de estar usando `SUPABASE_SERVICE_KEY` (admin key)
- **Timeout ao processar**: Se há muitos álbuns, o script pode demorar. Considere executar em lotes menores editando o script
