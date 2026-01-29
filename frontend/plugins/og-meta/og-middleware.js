const { createClient } = require('@supabase/supabase-js');

// Supabase client
const supabaseUrl = 'https://rtdxqthhhwqnlrevzmap.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0ZHhxdGhoaHdxbmxyZXZ6bWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5ODI4MjYsImV4cCI6MjA4MDU1ODgyNn0.njhKNQVbMWn-MlAhWfnHOVIRh988xksKry8ofEtEnOw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Lista de User-Agents de crawlers/bots
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
  'bingbot'
];

function isBot(userAgent) {
  if (!userAgent) return false;
  return botUserAgents.some(bot => userAgent.toLowerCase().includes(bot.toLowerCase()));
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateMetaHtml(data) {
  const { title, description, image, url, type = 'music.album', siteName = 'www.oucaaqui.com' } = data;
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#dc2626" />
  
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  
  <meta property="og:type" content="${type}" />
  <meta property="og:site_name" content="${escapeHtml(siteName)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:locale" content="pt_BR" />
  
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
</head>
<body>
  <p>Redirecionando...</p>
  <script>window.location.href = "${escapeHtml(url)}";</script>
</body>
</html>`;
}

async function getAlbumData(artistSlug, albumSlug) {
  try {
    let { data: album } = await supabase
      .from('albums')
      .select('*')
      .eq('slug', albumSlug)
      .is('deleted_at', null)
      .maybeSingle();
    
    if (!album) {
      const { data: albumById } = await supabase
        .from('albums')
        .select('*')
        .eq('id', albumSlug)
        .is('deleted_at', null)
        .maybeSingle();
      album = albumById;
    }
    
    if (!album) return null;
    
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
    
    const { count: songCount } = await supabase
      .from('songs')
      .select('*', { count: 'exact', head: true })
      .eq('album_id', album.id);
    
    return { album, artist, songCount: songCount || 0 };
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    return null;
  }
}

function setupOgMetaMiddleware(devServer) {
  const app = devServer.app;
  
  // Middleware para interceptar requisições de bots em páginas de álbum
  app.use(async (req, res, next) => {
    const userAgent = req.get('user-agent') || '';
    const url = req.originalUrl || req.url;
    
    // Ignorar arquivos estáticos
    if (url.includes('.') && !url.endsWith('/')) {
      return next();
    }
    
    // Verificar se é uma página de álbum (formato: /artistSlug/albumSlug)
    const albumMatch = url.match(/^\/([^\/]+)\/([^\/\?]+)/);
    
    if (!albumMatch || !isBot(userAgent)) {
      return next();
    }
    
    const [, artistSlug, albumSlug] = albumMatch;
    
    // Ignorar rotas conhecidas
    const knownRoutes = ['login', 'cadastrar', 'reset-password', 'search', 'playlists', 'clips', 'top-cds', 'lancamentos', 'sobre', 'politicas', 'library', 'favorites', 'support', 'admin', 'user', 'artist', 'playlist', 'genero'];
    if (knownRoutes.includes(artistSlug)) {
      return next();
    }
    
    console.log(`🤖 Bot detectado: ${userAgent.substring(0, 30)}...`);
    console.log(`📄 Gerando meta tags para: /${artistSlug}/${albumSlug}`);
    
    try {
      const data = await getAlbumData(artistSlug, albumSlug);
      
      if (!data || !data.album) {
        console.log('❌ Álbum não encontrado');
        return next();
      }
      
      const { album, artist, songCount } = data;
      const artistName = artist?.name || 'Artista';
      const genre = album.genre || 'Música';
      
      const title = `${album.title} - ${genre.charAt(0).toUpperCase() + genre.slice(1)}`;
      const description = `Clique agora para baixar e ouvir grátis ${album.title} postado por ${artistName}. ${songCount} música${songCount !== 1 ? 's' : ''} disponíveis no Ouça Aqui!`;
      const image = album.cover_url || album.image_url || `${req.protocol}://${req.get('host')}/images/og-default.jpg`;
      const fullUrl = `${req.protocol}://${req.get('host')}${url}`;
      
      const html = generateMetaHtml({
        title,
        description,
        image,
        url: fullUrl,
        type: 'music.album'
      });
      
      console.log('✅ Meta tags geradas:', { title, image: image.substring(0, 50) + '...' });
      
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
      
    } catch (error) {
      console.error('❌ Erro:', error.message);
      return next();
    }
  });
}

module.exports = setupOgMetaMiddleware;
