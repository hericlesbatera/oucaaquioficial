import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Music2, Play, BadgeCheck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const GenrePage = () => {
  const { genre } = useParams();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mapeamento para nomes corretos com acentos
  const genreNames = {
    'forró': 'Forró', 'forro': 'Forró',
    'arrocha': 'Arrocha',
    'piseiro': 'Piseiro',
    'arrochadeira': 'Arrochadeira',
    'pagode': 'Pagode',
    'sertanejo': 'Sertanejo',
    'brega funk': 'Brega Funk', 'brega-funk': 'Brega Funk',
    'variados': 'Variados',
    'samba': 'Samba',
    'funk': 'Funk',
    'axé': 'Axé', 'axe': 'Axé',
    'reggae': 'Reggae',
    'brega': 'Brega',
    'gospel': 'Gospel',
    'rap/hip-hop': 'Rap/Hip-Hop', 'rap-hip-hop': 'Rap/Hip-Hop',
    'pop': 'Pop',
    'mpb': 'MPB',
    'rock': 'Rock',
    'eletrônica': 'Eletrônica', 'eletronica': 'Eletrônica',
    'trap': 'Trap',
    'frevo': 'Frevo'
  };

  const getGenreDisplayName = (genreSlug) => {
    if (!genreSlug) return '';
    const decoded = decodeURIComponent(genreSlug).toLowerCase();
    return genreNames[decoded] || (decoded.charAt(0).toUpperCase() + decoded.slice(1));
  };

  useEffect(() => {
    loadAlbums();
  }, [genre]);

  const loadAlbums = async () => {
    setLoading(true);
    
    const decodedGenre = decodeURIComponent(genre).toLowerCase();
    
    // Normalizar gênero removendo acentos e hífens para busca
    const normalizeText = (text) => {
      return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/-/g, ' ');
    };
    
    const normalizedGenre = normalizeText(decodedGenre);
    
    // Buscar todos os artistas e filtrar no cliente
    const { data: allArtists } = await supabase
      .from('artists')
      .select('id, estilo_musical');
    
    // Filtrar artistas cujo estilo musical contém o gênero (com ou sem acento)
    const matchingArtists = (allArtists || []).filter(artist => {
      if (!artist.estilo_musical) return false;
      const normalizedStyle = normalizeText(artist.estilo_musical);
      return normalizedStyle.includes(normalizedGenre) || 
             normalizedStyle.includes(decodedGenre.replace(/-/g, ' '));
    });
    
    const artistIds = matchingArtists.map(a => a.id);
    
    if (artistIds.length === 0) {
      setAlbums([]);
      setLoading(false);
      return;
    }

    // Buscar álbuns desses artistas
    const { data, error } = await supabase
      .from('albums')
      .select(`
        *,
        artist:artists(id, name, slug, is_verified, avatar_url)
      `)
      .in('artist_id', artistIds)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAlbums(data);
    }
    setLoading(false);
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-red-600">
          <h2 className="text-2xl font-bold text-black">
            {getGenreDisplayName(genre)}
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Carregando...</p>
          </div>
        ) : albums.length === 0 ? (
          <div className="text-center py-16">
            <Music2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Nenhum álbum encontrado
            </h3>
            <p className="text-gray-500">
              Não há álbuns do gênero {getGenreDisplayName(genre)} no momento
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {albums.map((album) => (
              <div key={album.id}>
                <Link
                  to={`/${album.artist?.slug || album.artist_id}/${album.slug || album.id}`}
                  className="group cursor-pointer block"
                >
                  <div className="relative mb-3 overflow-hidden rounded-lg shadow-lg">
                    <img
                      src={album.cover_url || '/images/default-cover.jpg'}
                      alt={album.title}
                      className="w-full aspect-square object-cover transform group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                        <Play className="w-5 h-5 text-white ml-1" fill="white" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-gray-900 font-semibold text-sm mb-1 truncate group-hover:text-red-600 transition-colors">
                    {album.title}
                  </h3>
                </Link>
                <Link
                  to={`/${album.artist?.slug || album.artist_id}`}
                  className="flex items-center gap-1 text-gray-500 text-xs truncate hover:text-red-600 transition-colors mb-2"
                >
                  <span className="truncate">{album.artist?.name || album.artist_name}</span>
                  {album.artist?.is_verified && (
                    <BadgeCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  )}
                </Link>
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                    <span className="font-bold text-gray-700">{formatNumber(album.play_count)}</span>
                    <span className="text-gray-500">Plays</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                    <span className="font-bold text-gray-700">{formatNumber(album.download_count)}</span>
                    <span className="text-gray-500">Downloads</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenrePage;
