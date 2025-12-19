-- Adicionar coluna slug na tabela albums para URLs amigáveis
-- Execute este SQL no Supabase SQL Editor

-- 1. Adicionar coluna slug
ALTER TABLE albums ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Criar índice único para o slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_albums_slug ON albums(slug);

-- 3. Gerar slugs para álbuns existentes (COM hífens)
-- Exemplo: "O Rey Na Vaquejada 2.0" vira "o-rey-na-vaquejada-2-0"
UPDATE albums 
SET slug = LOWER(
  TRIM(BOTH '-' FROM 
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRANSLATE(
          title,
          'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
          'aaaaaeeeeiiiioooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
        ),
        '[^a-zA-Z0-9]+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  )
)
WHERE slug IS NULL;

-- Comentário explicativo
COMMENT ON COLUMN albums.slug IS 'URL amigável do álbum (com hífens, ex: meu-album-2025)';
