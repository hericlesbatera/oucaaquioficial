const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase client para buscar dados dos álbuns
const supabaseUrl = 'https://rtdxqthhhwqnlrevzmap.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0ZHhxdGhoaHdxbmxyZXZ6bWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5ODI4MjYsImV4cCI6MjA4MDU1ODgyNn0.njhKNQVbMWn-MlAhWfnHOVIRh988xksKry8ofEtEnOw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Lista de User-Agents de crawlers/bots de redes sociais
const botUserAgents = [
  'facebookexternalhit',
  'Facebot',
  'WhatsApp',
  'Twitterbot',
  'LinkedInBot',
  'Slackbot',
  'TelegramBot',
  'Discordbot',
  'Pinterest',
  'Googlebot',
  'bingbot',
  'Baiduspider',
  'YandexBot',
  'DuckDuckBot'
];

// Função para verificar se é um bot/crawler
function isBot(userAgent) {
  if (!userAgent) return false;
  return botUserAgents.some(bot => userAgent.toLowerCase().includes(bot.toLowerCase()));
}

// Função para escapar HTML
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Função para gerar HTML com meta tags dinâmicas
function generateMetaHtml(data) {
  const { title, description, image, url, type = 'music.album', siteName = 'Ouça Aqui' } = data;
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#dc2626" />
  
  <!-- Meta tags básicas -->
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  
  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="${type}" />
  <meta property="og:site_name" content="${escapeHtml(siteName)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:locale" content="pt_BR" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  
  <!-- Favicon -->
  <link rel="icon" type="image/png" href="/favicon.png" />
  <link rel="apple-touch-icon" href="/logo192.png" />
  
  <!-- Redirect para SPA -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(url)}" />
</head>
<body>
  <p>Redirecionando para ${escapeHtml(title)}...</p>
  <script>window.location.href = "${escapeHtml(url)}";</script>
</body>
</html>`;
}

// Função para buscar dados do álbum
async function getAlbumData(artistSlug, albumSlug) {
  try {
    // Buscar álbum pelo slug
    let { data: album, error: albumError } = await supabase
      .from('albums')
      .select('*')
      .eq('slug', albumSlug)
      .is('deleted_at', null)
      .maybeSingle();
    
    if (albumError) {
      console.error('Erro ao buscar álbum:', albumError);
      return null;
    }
    
    if (!album) {
      // Tentar buscar por ID
      const { data: albumById } = await supabase
        .from('albums')
        .select('*')
        .eq('id', albumSlug)
        .is('deleted_at', null)
        .maybeSingle();
      album = albumById;
    }
    
    if (!album) return null;
    
    // Buscar artista
    let { data: artist } = await supabase
      .from('artists')
      .select('id, name, slug')
      .eq('slug', artistSlug)
      .maybeSingle();
    
    if (!artist) {
      const { data: artistById } = await supabase
        .from('artists')
        .select('id, name, slug')
        .eq('id', artistSlug)
        .maybeSingle();
      artist = artistById;
    }
    
    // Contar músicas
    const { count: songCount } = await supabase
      .from('songs')
      .select('*', { count: 'exact', head: true })
      .eq('album_id', album.id);
    
    return {
      album,
      artist,
      songCount: songCount || 0
    };
  } catch (error) {
    console.error('Erro ao buscar dados do álbum:', error);
    return null;
  }
}

// Função para buscar dados do artista
async function getArtistData(artistSlug) {
  try {
    let { data: artist } = await supabase
      .from('artists')
      .select('*')
      .eq('slug', artistSlug)
      .maybeSingle();
    
    if (!artist) {
      const { data: artistById } = await supabase
        .from('artists')
        .select('*')
        .eq('id', artistSlug)
        .maybeSingle();
      artist = artistById;
    }
    
    if (!artist) return null;
    
    // Contar álbuns
    const { count: albumCount } = await supabase
      .from('albums')
      .select('*', { count: 'exact', head: true })
      .eq('artist_id', artist.id)
      .is('deleted_at', null);
    
    return {
      artist,
      albumCount: albumCount || 0
    };
  } catch (error) {
    console.error('Erro ao buscar dados do artista:', error);
    return null;
  }
}

// Servir arquivos estáticos da pasta build
app.use(express.static(path.join(__dirname, 'build'), {
  // Não servir index.html para rotas dinâmicas
  index: false
}));

// Middleware para páginas de álbuns (formato: /:artistSlug/:albumSlug)
app.get('/:artistSlug/:albumSlug', async (req, res, next) => {
  const userAgent = req.get('user-agent') || '';
  const { artistSlug, albumSlug } = req.params;
  
  // Ignorar arquivos estáticos
  if (albumSlug.includes('.')) {
    return next();
  }
  
  // Se não for um bot, servir o SPA normalmente
  if (!isBot(userAgent)) {
    return res.sendFile(path.join(__dirname, 'build', 'index.html'));
  }
  
  console.log(`🤖 Bot detectado: ${userAgent.substring(0, 50)}...`);
  console.log(`📄 Gerando meta tags para: /${artistSlug}/${albumSlug}`);
  
  try {
    const data = await getAlbumData(artistSlug, albumSlug);
    
    if (!data || !data.album) {
      console.log('❌ Álbum não encontrado, servindo página padrão');
      return res.sendFile(path.join(__dirname, 'build', 'index.html'));
    }
    
    const { album, artist, songCount } = data;
    const artistName = artist?.name || 'Artista';
    const genre = album.genre || 'Música';
    
    // Gerar título no formato: "Nome do Álbum - Gênero"
    const title = `${album.title} - ${genre.charAt(0).toUpperCase() + genre.slice(1)}`;
    
    // Gerar descrição
    const description = `Clique agora para baixar e ouvir grátis ${album.title} postado por ${artistName}. ${songCount} música${songCount !== 1 ? 's' : ''} disponíveis no Ouça Aqui!`;
    
    // URL da imagem do álbum
    const image = album.cover_url || album.image_url || 'https://www.oucaaqui.com/images/og-default.jpg';
    
    // URL completa da página
    const baseUrl = req.protocol + '://' + req.get('host');
    const url = `${baseUrl}/${artistSlug}/${albumSlug}`;
    
    const html = generateMetaHtml({
      title,
      description,
      image,
      url,
      type: 'music.album',
      siteName: 'www.oucaaqui.com'
    });
    
    console.log('✅ Meta tags geradas com sucesso');
    res.send(html);
    
  } catch (error) {
    console.error('❌ Erro ao gerar meta tags:', error);
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  }
});

// Middleware para páginas de artistas (formato: /:artistSlug)
app.get('/:artistSlug', async (req, res, next) => {
  const userAgent = req.get('user-agent') || '';
  const { artistSlug } = req.params;
  
  // Ignorar arquivos estáticos e rotas conhecidas
  const knownRoutes = ['login', 'cadastrar', 'reset-password', 'search', 'playlists', 'clips', 'top-cds', 'lancamentos', 'sobre', 'politicas', 'library', 'favorites', 'support', 'admin', 'user', 'artist', 'playlist'];
  if (artistSlug.includes('.') || knownRoutes.includes(artistSlug)) {
    return next();
  }
  
  // Se não for um bot, servir o SPA normalmente
  if (!isBot(userAgent)) {
    return res.sendFile(path.join(__dirname, 'build', 'index.html'));
  }
  
  console.log(`🤖 Bot detectado para perfil: ${userAgent.substring(0, 50)}...`);
  
  try {
    const data = await getArtistData(artistSlug);
    
    if (!data || !data.artist) {
      return res.sendFile(path.join(__dirname, 'build', 'index.html'));
    }
    
    const { artist, albumCount } = data;
    
    const title = `${artist.name} - Ouça Aqui`;
    const description = artist.bio || `Ouça as melhores músicas de ${artist.name}. ${albumCount} álbum${albumCount !== 1 ? 's' : ''} disponíveis para baixar e ouvir grátis!`;
    const image = artist.avatar_url || artist.cover_url || 'https://www.oucaaqui.com/images/og-default.jpg';
    
    const baseUrl = req.protocol + '://' + req.get('host');
    const url = `${baseUrl}/${artistSlug}`;
    
    const html = generateMetaHtml({
      title,
      description,
      image,
      url,
      type: 'profile',
      siteName: 'www.oucaaqui.com'
    });
    
    res.send(html);
    
  } catch (error) {
    console.error('Erro ao gerar meta tags do artista:', error);
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  }
});

// Para qualquer outra rota, servir index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🔗 Open Graph meta tags habilitadas para compartilhamento em redes sociais`);
});
