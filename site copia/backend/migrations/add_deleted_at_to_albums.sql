-- Adicionar coluna deleted_at na tabela albums para soft delete (lixeira)
-- Execute este SQL no Supabase SQL Editor

ALTER TABLE albums ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Criar índice para melhorar performance das queries
CREATE INDEX IF NOT EXISTS idx_albums_deleted_at ON albums(deleted_at);

-- Comentário explicativo
COMMENT ON COLUMN albums.deleted_at IS 'Data de exclusão (soft delete). NULL = ativo, com data = na lixeira por 30 dias';
