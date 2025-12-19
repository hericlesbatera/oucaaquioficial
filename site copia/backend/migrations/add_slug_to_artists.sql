-- Adicionar coluna slug na tabela artists para URLs amigáveis
-- Execute este SQL no Supabase SQL Editor

-- 1. Adicionar coluna slug
ALTER TABLE artists ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Criar índice único para o slug (garante que não há duplicatas)
CREATE UNIQUE INDEX IF NOT EXISTS idx_artists_slug ON artists(slug);

-- 3. Gerar slugs para artistas existentes (sem hífens, tudo junto)
-- Exemplo: "Rey Vaqueiro" vira "reyvaqueiro"
UPDATE artists 
SET slug = LOWER(
  REGEXP_REPLACE(
    TRANSLATE(
      name,
      'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
      'aaaaaeeeeiiiioooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
    ),
    '[^a-zA-Z0-9]', '', 'g'
  )
)
WHERE slug IS NULL;

-- Exemplo específico para Rey Vaqueiro:
UPDATE artists SET slug = 'reyvaqueiro' WHERE name ILIKE '%Rey Vaqueiro%' AND slug IS NULL;

-- Comentário explicativo
COMMENT ON COLUMN artists.slug IS 'URL amigável do artista (sem hífens, ex: reyvaqueiro)';
