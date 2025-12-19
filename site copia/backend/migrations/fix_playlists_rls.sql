-- Corrigir RLS para permitir visualização anônima de playlists públicas

-- Remover policy existente
DROP POLICY IF EXISTS "Users can view own playlists" ON playlists;

-- Criar policy que permite visualização anônima de playlists públicas
CREATE POLICY "Anyone can view public playlists" ON playlists
  FOR SELECT USING (is_public = true);

-- Criar policy para usuários verem suas próprias playlists (públicas ou privadas)
CREATE POLICY "Users can view own playlists" ON playlists
  FOR SELECT USING (auth.uid() = user_id);
