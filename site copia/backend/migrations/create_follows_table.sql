-- Criar tabela de follows (quem segue quem)
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, artist_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_artist_id ON follows(artist_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at);

-- Habilitar RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
-- Qualquer um pode ver quem segue quem
CREATE POLICY "Anyone can view follows" ON follows
  FOR SELECT USING (true);

-- Usuários podem seguir artistas (criar follow)
CREATE POLICY "Users can follow artists" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Usuários podem deixar de seguir (deletar follow)
CREATE POLICY "Users can unfollow artists" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Função para atualizar contador de seguidores
CREATE OR REPLACE FUNCTION update_followers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE artists SET followers_count = COALESCE(followers_count, 0) + 1 WHERE id = NEW.artist_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE artists SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0) WHERE id = OLD.artist_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contador automaticamente
DROP TRIGGER IF EXISTS trigger_update_followers_count ON follows;
CREATE TRIGGER trigger_update_followers_count
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_followers_count();
