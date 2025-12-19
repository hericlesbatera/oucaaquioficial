-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'new_album', 'new_playlist', 'new_follower', etc
  title VARCHAR(200) NOT NULL,
  message TEXT,
  image_url TEXT,
  link VARCHAR(500), -- URL para onde a notificação leva
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Habilitar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
-- Usuários podem ver apenas suas próprias notificações
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Sistema pode criar notificações (via trigger)
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Usuários podem atualizar suas próprias notificações (marcar como lida)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Usuários podem deletar suas próprias notificações
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FUNÇÃO: Notificar seguidores de novo álbum
-- ============================================
CREATE OR REPLACE FUNCTION notify_followers_new_album()
RETURNS TRIGGER AS $$
DECLARE
  artist_name TEXT;
  artist_slug TEXT;
  follower RECORD;
BEGIN
  -- Buscar nome e slug do artista
  SELECT name, slug INTO artist_name, artist_slug FROM artists WHERE id = NEW.artist_id;
  
  -- Criar notificação para cada seguidor
  FOR follower IN 
    SELECT follower_id FROM follows WHERE artist_id = NEW.artist_id
  LOOP
    INSERT INTO notifications (user_id, type, title, message, image_url, link, artist_id, album_id)
    VALUES (
      follower.follower_id,
      'new_album',
      'Novo álbum de ' || COALESCE(artist_name, 'artista'),
      COALESCE(artist_name, 'Um artista que você segue') || ' lançou "' || NEW.title || '"',
      NEW.cover_url,
      '/' || COALESCE(artist_slug, NEW.artist_id::text) || '/' || COALESCE(NEW.slug, NEW.id::text),
      NEW.artist_id,
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para novos álbuns
DROP TRIGGER IF EXISTS trigger_notify_new_album ON albums;
CREATE TRIGGER trigger_notify_new_album
  AFTER INSERT ON albums
  FOR EACH ROW EXECUTE FUNCTION notify_followers_new_album();

-- ============================================
-- FUNÇÃO: Notificar seguidores de nova playlist
-- ============================================
CREATE OR REPLACE FUNCTION notify_followers_new_playlist()
RETURNS TRIGGER AS $$
DECLARE
  artist_name TEXT;
  artist_slug TEXT;
  follower RECORD;
BEGIN
  -- Só notifica se a playlist for pública
  IF NEW.is_public = false THEN
    RETURN NEW;
  END IF;

  -- Buscar nome e slug do artista
  SELECT name, slug INTO artist_name, artist_slug FROM artists WHERE id = NEW.user_id;
  
  -- Criar notificação para cada seguidor
  FOR follower IN 
    SELECT follower_id FROM follows WHERE artist_id = NEW.user_id
  LOOP
    INSERT INTO notifications (user_id, type, title, message, image_url, link, artist_id)
    VALUES (
      follower.follower_id,
      'new_playlist',
      'Nova playlist de ' || COALESCE(artist_name, 'artista'),
      COALESCE(artist_name, 'Um artista que você segue') || ' criou a playlist "' || NEW.title || '"',
      NEW.cover_url,
      '/' || COALESCE(artist_slug, NEW.user_id::text) || '/playlist/' || COALESCE(NEW.slug, NEW.id::text),
      NEW.user_id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para novas playlists públicas
DROP TRIGGER IF EXISTS trigger_notify_new_playlist ON playlists;
CREATE TRIGGER trigger_notify_new_playlist
  AFTER INSERT ON playlists
  FOR EACH ROW EXECUTE FUNCTION notify_followers_new_playlist();
