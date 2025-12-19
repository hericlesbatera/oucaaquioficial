import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockArtists, mockSongs, mockAlbums } from '../../mock';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { Play, Heart, Users, Music, BadgeCheck, Instagram, Twitter, Youtube, MapPin, Music2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from '../../hooks/use-toast';
import VerifiedAvatar from '../../components/VerifiedAvatar';

const ProfilePublicNew = () => {
  const { slug } = useParams();
  const { playSong } = usePlayer();
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('albums');
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [artistAlbums, setArtistAlbums] = useState([]);
  const [artistPlaylists, setArtistPlaylists] = useState([]);

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Mapeamento para nomes corretos com acentos
  const genreNames = {
    'forró': 'Forró', 'forro': 'Forró',
    'arrocha': 'Arrocha', 'piseiro': 'Piseiro', 'arrochadeira': 'Arrochadeira',
    'pagode': 'Pagode', 'sertanejo': 'Sertanejo', 'brega funk': 'Brega Funk',
    'variados': 'Variados', 'samba': 'Samba', 'funk': 'Funk',
    'axé': 'Axé', 'axe': 'Axé', 'reggae': 'Reggae', 'brega': 'Brega',
    'gospel': 'Gospel', 'rap/hip-hop': 'Rap/Hip-Hop', 'pop': 'Pop',
    'mpb': 'MPB', 'rock': 'Rock', 'eletrônica': 'Eletrônica', 'eletronica': 'Eletrônica',
    'trap': 'Trap', 'frevo': 'Frevo'
  };

  // Mapeamento para slugs de URL sem acentos
  const genreSlugs = {
    'forró': 'forro', 'forro': 'forro',
    'arrocha': 'arrocha', 'piseiro': 'piseiro', 'arrochadeira': 'arrochadeira',
    'pagode': 'pagode', 'sertanejo': 'sertanejo', 'brega funk': 'brega-funk',
    'variados': 'variados', 'samba': 'samba', 'funk': 'funk',
    'axé': 'axe', 'axe': 'axe', 'reggae': 'reggae', 'brega': 'brega',
    'gospel': 'gospel', 'rap/hip-hop': 'rap-hip-hop', 'pop': 'pop',
    'mpb': 'mpb', 'rock': 'rock', 'eletrônica': 'eletronica', 'eletronica': 'eletronica',
    'trap': 'trap', 'frevo': 'frevo'
  };

  const getGenreDisplayName = (genre) => {
    if (!genre) return '';
    const lower = genre.toLowerCase();
    return genreNames[lower] || (genre.charAt(0).toUpperCase() + genre.slice(1).toLowerCase());
  };

  const getGenreSlug = (genre) => {
    if (!genre) return '';
    const lower = genre.toLowerCase();
    return genreSlugs[lower] || lower.replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  useEffect(() => {
    const loadArtist = async () => {
      // Primeiro tenta buscar por slug
      let { data: supabaseArtist } = await supabase
        .from('artists')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      
      // Se não encontrar por slug, tenta por id (compatibilidade)
      if (!supabaseArtist) {
        const { data: artistById } = await supabase
          .from('artists')
          .select('*')
          .eq('id', slug)
          .maybeSingle();
        supabaseArtist = artistById;
      }
      
      if (supabaseArtist) {
        // Buscar contagem real de seguidores
        const { count: followersCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('artist_id', supabaseArtist.id);

        // Buscar total de plays dos álbuns do artista (ouvintes mensais)
        const { data: albumsData } = await supabase
          .from('albums')
          .select('play_count')
          .eq('artist_id', supabaseArtist.id);
        
        const totalPlays = (albumsData || []).reduce((sum, album) => sum + (album.play_count || 0), 0);

        setArtist({
          id: supabaseArtist.id,
          name: supabaseArtist.name,
          bio: supabaseArtist.bio,
          avatar: supabaseArtist.avatar_url || '/images/default-avatar.png',
          coverImage: supabaseArtist.cover_url || '',
          verified: supabaseArtist.is_verified,
          followers: followersCount || 0,
          monthlyListeners: totalPlays,
          genre: supabaseArtist.estilo_musical,
          location: supabaseArtist.cidade && supabaseArtist.estado 
            ? `${supabaseArtist.cidade}, ${supabaseArtist.estado}` 
            : supabaseArtist.cidade || supabaseArtist.estado || '',
          instagram: supabaseArtist.instagram || '',
          twitter: supabaseArtist.twitter || '',
          youtube: supabaseArtist.youtube || ''
        });
      } else if (user && user.id === slug) {
        // É o próprio usuário mas não tem registro - criar automaticamente
        const { error } = await supabase
          .from('artists')
          .insert({
            id: user.id,
            email: user.email,
            name: user.name || 'Artista',
            slug: (user.name || 'artista').toLowerCase().replace(/[^a-z0-9]/g, ''),
            bio: '',
            estilo_musical: user.estilo_musical || '',
            cidade: user.cidade || '',
            estado: user.estado || '',
            avatar_url: '',
            cover_url: '',
            followers_count: 0,
            is_verified: false
          });
        
        if (!error) {
          setArtist({
            id: user.id,
            name: user.name || 'Artista',
            bio: '',
            avatar: '/images/default-avatar.png',
            coverImage: '',
            verified: false,
            followers: 0,
            monthlyListeners: 0,
            genre: user.estilo_musical || ''
          });
        } else {
          console.error('Erro ao criar artista:', error);
          setArtist(null);
        }
      } else {
        // Fallback para mockArtists
        const mockArtist = mockArtists.find(a => a.id === slug || a.slug === slug);
        setArtist(mockArtist || null);
        if (mockArtist) {
          setArtistAlbums(mockAlbums.filter(a => a.artistId === mockArtist.id));
        }
      }
      setLoading(false);
    };
    
    const loadAlbums = async (artistId) => {
      // Buscar álbuns do Supabase
      const { data: albums } = await supabase
        .from('albums')
        .select('*')
        .eq('artist_id', artistId)
        .order('created_at', { ascending: false });
      
      if (albums && albums.length > 0) {
        setArtistAlbums(albums.map(album => ({
          id: album.id,
          slug: album.slug,
          title: album.title,
          coverImage: album.cover_url || '/images/default-album.png',
          songCount: album.song_count || 0,
          releaseYear: album.release_year
        })));
      }
    };
    
    loadArtist().then(() => {
      // Load albums after artist is loaded
    });
  }, [slug, user]);

  // Check if user is following this artist
  useEffect(() => {
    const checkFollowing = async () => {
      if (user && artist?.id) {
        const { data } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('artist_id', artist.id)
          .maybeSingle();
        
        setIsFollowing(!!data);
      }
    };
    checkFollowing();
  }, [user, artist?.id]);

  // Load albums and playlists when artist is set
  useEffect(() => {
    if (artist?.id) {
      const loadAlbums = async () => {
        const { data: albums } = await supabase
          .from('albums')
          .select('*')
          .eq('artist_id', artist.id)
          .order('created_at', { ascending: false });
        
        if (albums && albums.length > 0) {
          setArtistAlbums(albums.map(album => ({
            id: album.id,
            slug: album.slug,
            title: album.title,
            coverImage: album.cover_url || '/images/default-album.png',
            songCount: album.song_count || 0,
            releaseYear: album.release_year,
            playCount: album.play_count || 0,
            downloadCount: album.download_count || 0
          })));
        }
      };

      const loadPlaylists = async () => {
        const { data: playlists, error } = await supabase
          .from('playlists')
          .select('*')
          .eq('user_id', artist.id)
          .eq('is_public', true)
          .order('created_at', { ascending: false });
        
        console.log('Playlists do artista:', playlists, 'Erro:', error);
        
        if (playlists) {
          setArtistPlaylists(playlists);
        }
      };

      loadAlbums();
      loadPlaylists();
    }
  }, [artist?.id]);

  const artistSongs = artist ? mockSongs.filter(s => s.artistId === artist.id) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black text-xl">Artista não encontrado</p>
      </div>
    );
  }

  const handleFollowClick = () => {
    if (!user) {
      toast({
        title: 'Login Necessário',
        description: 'Faça login para seguir artistas',
        variant: 'destructive'
      });
      return;
    }

    if (isFollowing) {
      setShowUnfollowModal(true);
    } else {
      handleFollow();
    }
  };

  const handleUnfollow = async () => {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('artist_id', artist.id);
      
      if (error) {
        console.error('Erro ao deixar de seguir:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível deixar de seguir. Tente novamente.',
          variant: 'destructive'
        });
        return;
      }
      
      setIsFollowing(false);
      setArtist(prev => ({ ...prev, followers: Math.max((prev.followers || 1) - 1, 0) }));
      setShowUnfollowModal(false);
      toast({
        title: 'Deixou de seguir',
        description: artist.name
      });
    } catch (err) {
      console.error('Erro ao deixar de seguir:', err);
    }
  };

  const handleFollow = async () => {
    try {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          artist_id: artist.id
        });
      
      if (error) {
        console.error('Erro ao seguir:', error);
        if (error.code === '23505') {
          setIsFollowing(true);
          return;
        }
        toast({
          title: 'Erro',
          description: 'Não foi possível seguir. Tente novamente.',
          variant: 'destructive'
        });
        return;
      }
      
      setIsFollowing(true);
      setArtist(prev => ({ ...prev, followers: (prev.followers || 0) + 1 }));
      toast({
        title: 'Seguindo',
        description: artist.name
      });
    } catch (err) {
      console.error('Erro ao seguir:', err);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Artist Header with Cover */}
      <div className="relative">
        <div
          className="h-96 bg-cover bg-center"
          style={{
            backgroundImage: `url(${artist.coverImage})`,
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black"></div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 pb-6">
            <div className="flex items-end gap-6">
              <div className="relative">
                <img
                  src={artist.avatar}
                  alt={artist.name}
                  className="w-40 h-40 rounded-full border-4 border-white shadow-2xl object-cover"
                />
              </div>
              <div className="flex-1 pb-2">
                <h1 className="text-5xl font-bold text-white mb-2 flex items-center">
                  {artist.name}
                  {artist.verified && (
                    <div className="ml-4 inline-flex items-center">
                      <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
                        <BadgeCheck className="w-4 h-4" color="#fff" />
                      </div>
                    </div>
                  )}
                </h1>
                <div className="flex items-center gap-6 text-white/80 text-sm mt-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{artist.followers?.toLocaleString()} seguidores</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    <span>{artist.monthlyListeners?.toLocaleString()} ouvintes mensais</span>
                  </div>
                </div>
              </div>
              <div className="pb-2">
                <Button
                  onClick={handleFollowClick}
                  className={`px-8 h-12 rounded-full font-semibold ${
                    isFollowing
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {isFollowing ? 'DEIXAR DE SEGUIR' : '+ SEGUIR'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('albums')}
              className={`py-4 px-2 font-semibold border-b-2 transition-colors ${
                activeTab === 'albums'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-black'
              }`}
            >
              ÁLBUNS
            </button>
            <button
              onClick={() => setActiveTab('playlist')}
              className={`py-4 px-2 font-semibold border-b-2 transition-colors ${
                activeTab === 'playlist'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-black'
              }`}
            >
              PLAYLIST
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Álbuns Section */}
            {activeTab === 'albums' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-black">ÁLBUNS</h2>
                  <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">
                    <option>MAIS RECENTES</option>
                    <option>MAIS ANTIGOS</option>
                    <option>A-Z</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {artistAlbums.map((album) => (
                    <Link
                      key={album.id}
                      to={`/${artist?.slug || slug}/${album.slug || album.id}`}
                      className="group cursor-pointer"
                    >
                      <div className="relative mb-3 overflow-hidden rounded-lg shadow-lg">
                        <img
                          src={album.coverImage}
                          alt={album.title}
                          className="w-full aspect-square object-cover transform group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                            <Play className="w-6 h-6 text-white ml-1" fill="white" />
                          </div>
                        </div>
                      </div>
                      <h3 className="text-black font-semibold mb-1 truncate group-hover:text-red-600 transition-colors">
                        {album.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs mb-1">
                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                          <span className="font-bold text-gray-700">{formatNumber(album.playCount)}</span>
                          <span className="text-gray-500">Plays</span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                          <span className="font-bold text-gray-700">{formatNumber(album.downloadCount)}</span>
                          <span className="text-gray-500">Downloads</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {artistAlbums.length === 0 && (
                  <div className="text-center py-20">
                    <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum álbum publicado ainda</p>
                  </div>
                )}
              </div>
            )}

            {/* Playlist Section */}
            {activeTab === 'playlist' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-black">PLAYLISTS</h2>
                  <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">
                    <option>MAIS RECENTES</option>
                    <option>MAIS ANTIGOS</option>
                    <option>A-Z</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {artistPlaylists.map((playlist) => (
                    <Link
                      key={playlist.id}
                      to={`/playlist/${playlist.slug || playlist.id}`}
                      className="group cursor-pointer"
                    >
                      <div className="relative mb-3 overflow-hidden rounded-lg shadow-lg">
                        <img
                          src={playlist.cover_url || '/images/default-playlist.jpg'}
                          alt={playlist.title}
                          className="w-full aspect-square object-cover transform group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                            <Play className="w-6 h-6 text-white ml-1" fill="white" />
                          </div>
                        </div>
                      </div>
                      <h3 className="text-black font-semibold mb-1 truncate group-hover:text-red-600 transition-colors">
                        {playlist.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {(playlist.song_ids || []).length} músicas
                      </p>
                    </Link>
                  ))}
                </div>

                {artistPlaylists.length === 0 && (
                  <div className="text-center py-20">
                    <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhuma playlist ainda</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Informações do Artista */}
          <div className="w-[420px] flex-shrink-0 hidden lg:block">
            <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
              {/* Biografia */}
              {artist.bio && (
                <div className="mb-6">
                  <h3 className="text-base font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">Biografia</h3>
                  <p className="text-gray-600 text-sm leading-relaxed text-justify">
                    {artist.bio}
                  </p>
                </div>
              )}

              {/* Redes Sociais */}
              {(artist.instagram || artist.twitter || artist.youtube) && (
                <div className="mb-6">
                  <h3 className="text-base font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">Redes Sociais</h3>
                  <div className="space-y-2">
                    {artist.instagram && (
                      <a 
                        href={artist.instagram.startsWith('http') ? artist.instagram : `https://instagram.com/${artist.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors text-sm"
                      >
                        <Instagram className="w-4 h-4" />
                        <span>{artist.instagram.includes('/') ? artist.instagram.split('/').filter(Boolean).pop() : artist.instagram.replace('@', '')}</span>
                      </a>
                    )}
                    {artist.twitter && (
                      <a 
                        href={artist.twitter.startsWith('http') ? artist.twitter : `https://twitter.com/${artist.twitter.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors text-sm"
                      >
                        <Twitter className="w-4 h-4" />
                        <span>{artist.twitter.includes('/') ? artist.twitter.split('/').filter(Boolean).pop() : artist.twitter.replace('@', '')}</span>
                      </a>
                    )}
                    {artist.youtube && (
                      <a 
                        href={artist.youtube.startsWith('http') ? artist.youtube : `https://youtube.com/${artist.youtube}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors text-sm"
                      >
                        <Youtube className="w-4 h-4" />
                        <span>{artist.youtube.includes('/') ? artist.youtube.split('/').filter(Boolean).pop() : artist.youtube}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Localização */}
              {artist.location && (
                <div className="mb-6">
                  <h3 className="text-base font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">Localização</h3>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{artist.location}</span>
                  </div>
                </div>
              )}

              {/* Estilo Musical */}
              {artist.genre && (
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">Estilo Musical</h3>
                  <Link 
                    to={`/genero/${getGenreSlug(artist.genre)}`}
                    className="flex items-center gap-2 text-gray-600 text-sm hover:text-red-600 transition-colors"
                  >
                    <Music2 className="w-4 h-4" />
                    <span>{getGenreDisplayName(artist.genre)}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmação para deixar de seguir */}
      {showUnfollowModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">
              Deixar de seguir @{artist?.name}?
            </h3>
            <p className="text-gray-600 text-sm text-center mb-6">
              Tem certeza de que deseja deixar de seguir este Artista?
            </p>
            <div className="border-t border-gray-200">
              <button
                onClick={handleUnfollow}
                className="w-full py-3 text-red-600 font-semibold hover:bg-gray-50 transition-colors"
              >
                Deixar de seguir
              </button>
            </div>
            <div className="border-t border-gray-200">
              <button
                onClick={() => setShowUnfollowModal(false)}
                className="w-full py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePublicNew;