import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockArtists, mockSongs, mockAlbums } from '../../mock';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { Play, Heart, Users, Music, BadgeCheck, Instagram, Twitter, Youtube, MapPin, Music2, Disc3, List, Video, User } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from '../../hooks/use-toast';
import VerifiedAvatar from '../../components/VerifiedAvatar';
import LoadingSpinner from '../../components/LoadingSpinner';

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
  const [artistVideos, setArtistVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [currentVideoPage, setCurrentVideoPage] = useState(1);
  const [albumsSortBy, setAlbumsSortBy] = useState('recent');
  const [sortedAlbums, setSortedAlbums] = useState([]);
  const [playlistsSortBy, setPlaylistsSortBy] = useState('recent');
  const [sortedPlaylists, setSortedPlaylists] = useState([]);

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getYouTubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const getYouTubeThumbnail = (videoId) => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
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

  // Função para ordenar álbuns
  const getSortedAlbums = (albums, sortBy) => {
    const sorted = [...albums];
    
    switch(sortBy) {
      case 'recent':
        // Mais recentes (por release_date, depois por created_at)
        sorted.sort((a, b) => {
          const dateA = new Date(a.release_date || a.created_at || 0);
          const dateB = new Date(b.release_date || b.created_at || 0);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'oldest':
        // Mais antigos (por release_date, depois por created_at)
        sorted.sort((a, b) => {
          const dateA = new Date(a.release_date || a.created_at || 0);
          const dateB = new Date(b.release_date || b.created_at || 0);
          return dateA.getTime() - dateB.getTime();
        });
        break;
      case 'alphabetic':
        // A-Z
        sorted.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
        break;
      default:
        return sorted;
    }
    
    return sorted;
  };

  // Aplicar ordenação quando albums ou sortBy mudar
  useEffect(() => {
    setSortedAlbums(getSortedAlbums(artistAlbums, albumsSortBy));
  }, [artistAlbums, albumsSortBy]);

  // Aplicar ordenação para playlists
  useEffect(() => {
    setSortedPlaylists(getSortedAlbums(artistPlaylists, playlistsSortBy));
  }, [artistPlaylists, playlistsSortBy]);

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
      // 1. Buscar álbuns próprios do artista
      let { data: ownAlbums, error } = await supabase
        .from('albums')
        .select('*')
        .eq('artist_id', artistId)
        .order('release_date', { ascending: false });
      
      // Se houver erro porque a coluna não existe, fazer fallback para created_at
      if (error && error.code === 'PGRST116') {
        const fallback = await supabase
          .from('albums')
          .select('*')
          .eq('artist_id', artistId)
          .order('created_at', { ascending: false });
        ownAlbums = fallback.data;
      }
      
      // 2. Buscar álbuns onde o artista é colaborador aceito
      console.log('Buscando colaborações para artistId:', artistId);
      const { data: collabInvites, error: collabError } = await supabase
        .from('collaboration_invites')
        .select('*')
        .eq('invited_user_id', artistId)
        .eq('status', 'accepted');
      
      console.log('Colaborações encontradas:', collabInvites, 'Erro:', collabError);
      
      let collabAlbums = [];
      if (collabInvites && collabInvites.length > 0) {
        const albumIds = collabInvites.map(c => c.album_id);
        const { data: albums } = await supabase
          .from('albums')
          .select('*')
          .in('id', albumIds);
        console.log('Álbuns de colaboração:', albums);
        collabAlbums = albums || [];
      }
      
      // Combinar álbuns próprios e de colaboração
      const allAlbums = [...(ownAlbums || []), ...collabAlbums];
      
      // Remover duplicatas (caso exista)
      const uniqueAlbums = allAlbums.filter((album, index, self) =>
        index === self.findIndex(a => a.id === album.id)
      );
      
      if (uniqueAlbums.length > 0) {
        // Filtrar álbuns agendados e privados
        const now = new Date();
        const filteredAlbums = uniqueAlbums.filter(album => {
          // Excluir privados
          if (album.is_private) return false;
          // Excluir agendados que ainda não chegou a hora
          if (!album.is_scheduled) return true;
          if (!album.scheduled_publish_at) return true;
          return new Date(album.scheduled_publish_at) <= now;
        });
        
        // Ordenar por data de lançamento
        filteredAlbums.sort((a, b) => {
          const dateA = new Date(a.release_date || a.created_at);
          const dateB = new Date(b.release_date || b.created_at);
          return dateB - dateA;
        });
        
        setArtistAlbums(filteredAlbums.map(album => ({
          id: album.id,
          slug: album.slug,
          title: album.title,
          coverImage: album.cover_url || '/images/default-album.png',
          songCount: album.song_count || 0,
          releaseYear: album.release_year,
          release_date: album.release_date,
          created_at: album.created_at,
          isCollab: album.artist_id !== artistId
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
        // 1. Buscar álbuns próprios do artista - ordenado por data de lançamento
        const { data: ownAlbums } = await supabase
          .from('albums')
          .select('*')
          .eq('artist_id', artist.id)
          .order('release_date', { ascending: false });
        
        // 2. Buscar álbuns onde o artista é colaborador aceito
        console.log('Buscando colaborações para artistId:', artist.id);
        const { data: collabInvites, error: collabError } = await supabase
          .from('collaboration_invites')
          .select('album_id')
          .eq('invited_user_id', artist.id)
          .eq('status', 'accepted');
        
        console.log('Colaborações encontradas:', collabInvites, 'Erro:', collabError);
        
        let collabAlbums = [];
        if (collabInvites && collabInvites.length > 0) {
          const albumIds = collabInvites.map(c => c.album_id);
          const { data: albums } = await supabase
            .from('albums')
            .select('*, artist:artists(slug, name)')
            .in('id', albumIds)
            .order('release_date', { ascending: false });
          console.log('Álbuns de colaboração:', albums);
          collabAlbums = albums || [];
        }
        
        // Combinar álbuns próprios e de colaboração
        const allAlbums = [...(ownAlbums || []), ...collabAlbums];
        
        // Remover duplicatas
        const uniqueAlbums = allAlbums.filter((album, index, self) =>
          index === self.findIndex(a => a.id === album.id)
        );
        
        if (uniqueAlbums.length > 0) {
          // Filtrar álbuns agendados que ainda não chegou a hora
          const now = new Date();
          const filteredAlbums = uniqueAlbums.filter(album => {
            // Excluir álbuns deletados (na lixeira)
            if (album.deleted_at) return false;
            // Excluir privados
            if (album.is_private) return false;
            // Excluir agendados que ainda não chegou a hora
            if (!album.is_scheduled) return true;
            if (!album.scheduled_publish_at) return true;
            return new Date(album.scheduled_publish_at) <= now;
          });
          
          // Ordenar por data de lançamento (mais recentes primeiro)
           filteredAlbums.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
          
          setArtistAlbums(filteredAlbums.map(album => ({
            id: album.id,
            slug: album.slug,
            title: album.title,
            coverImage: album.cover_url || '/images/default-album.png',
            songCount: album.song_count || 0,
            releaseYear: album.release_year,
            release_date: album.release_date,
            created_at: album.created_at,
            playCount: album.play_count || 0,
            downloadCount: album.download_count || 0,
            isCollab: album.artist_id !== artist.id,
            artistSlug: album.artist?.slug || album.artist_id
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

      const getYouTubeTitle = async (url) => {
        try {
          const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
          if (response.ok) {
            const data = await response.json();
            return data.title || 'Vídeo YouTube';
          }
        } catch (error) {
          console.log('Erro ao buscar título do YouTube:', error);
        }
        return 'Vídeo YouTube';
      };

      const loadVideos = async () => {
        try {
          // Carregar vídeos públicos do artista do Supabase
          const { data: dbVideos, error } = await supabase
            .from('artist_videos')
            .select('*')
            .eq('artist_id', artist.id)
            .eq('is_public', true)
            .order('created_at', { ascending: false });

          if (error) {
            console.log('Erro ao carregar vídeos do Supabase:', error);
            setArtistVideos([]);
            return;
          }

          if (dbVideos && dbVideos.length > 0) {
            const videosWithData = dbVideos.map((video) => ({
              id: video.id,
              title: video.title,
              url: video.video_url,
              videoId: video.video_id,
              thumbnail: video.thumbnail || getYouTubeThumbnail(video.video_id),
              addedAt: new Date(video.created_at)
            }));

            setArtistVideos(videosWithData);
            setSelectedVideo(videosWithData[0]); // Selecionar o primeiro vídeo
          } else {
            setArtistVideos([]);
          }
        } catch (error) {
          console.error('Erro ao carregar vídeos:', error);
          setArtistVideos([]);
        }
      };

      loadAlbums();
      loadPlaylists();
      loadVideos();
    }
  }, [artist?.id]);

  const artistSongs = artist ? mockSongs.filter(s => s.artistId === artist.id) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="large" text="Carregando perfil..." />
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
          className="h-48 md:h-96 bg-cover bg-center"
          style={{
            backgroundImage: `url(${artist.coverImage})`,
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black"></div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 pb-4 md:pb-6">
            {/* Mobile Layout */}
            <div className="flex md:hidden gap-4">
              <img
                src={artist.avatar}
                alt={artist.name}
                className="w-20 h-20 rounded-full border-3 border-white shadow-xl object-cover flex-shrink-0"
              />
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  {artist.name}
                  {artist.verified && (
                    <div className="inline-flex items-center">
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <BadgeCheck className="w-3 h-3" color="#fff" />
                      </div>
                    </div>
                  )}
                </h1>
                <div className="flex gap-3 text-white/80 text-xs">
                  <div className="flex items-center gap-1">
                    <Music className="w-3 h-3" />
                    <span>{artist.monthlyListeners?.toLocaleString()} ouvintes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{artist.followers?.toLocaleString()} seguidores</span>
                  </div>
                </div>
                <Button
                  onClick={handleFollowClick}
                  className={`w-24 h-9 rounded-full font-semibold text-xs mt-2 ${
                    isFollowing
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {isFollowing ? 'SEGUINDO' : '+ SEGUIR'}
                </Button>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex items-end gap-6">
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
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-2 md:px-4">
          <div className="flex justify-center md:justify-start gap-1 md:gap-8">
            <button
              onClick={() => setActiveTab('albums')}
              className={`py-3 md:py-4 px-3 md:px-2 font-semibold text-xs md:text-base border-b-2 transition-colors flex items-center gap-1 md:gap-2 ${
                activeTab === 'albums'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-black'
              }`}
            >
              <Disc3 className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">CDS/SINGLES</span>
              <span className="sm:hidden">CDS</span>
            </button>
            <button
              onClick={() => setActiveTab('playlist')}
              className={`py-3 md:py-4 px-3 md:px-2 font-semibold text-xs md:text-base border-b-2 transition-colors flex items-center gap-1 md:gap-2 ${
                activeTab === 'playlist'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-black'
              }`}
            >
              <List className="w-4 h-4 md:w-5 md:h-5" />
              PLAYLISTS
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`py-3 md:py-4 px-3 md:px-2 font-semibold text-xs md:text-base border-b-2 transition-colors flex items-center gap-1 md:gap-2 ${
                activeTab === 'videos'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-black'
              }`}
            >
              <Video className="w-4 h-4 md:w-5 md:h-5" />
              VÍDEOS
            </button>
            <button
              onClick={() => setActiveTab('perfil')}
              className={`py-3 md:py-4 px-3 md:px-2 font-semibold text-xs md:text-base border-b-2 transition-colors flex items-center gap-1 md:gap-2 lg:hidden ${
                activeTab === 'perfil'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-black'
              }`}
            >
              <User className="w-4 h-4 md:w-5 md:h-5" />
              PERFIL
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Álbuns Section */}
            {activeTab === 'albums' && (
              <div>
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h2 className="text-lg md:text-2xl font-bold text-black">CDS/SINGLES</h2>
                  <select 
                    value={albumsSortBy}
                    onChange={(e) => setAlbumsSortBy(e.target.value)}
                    className="px-2 md:px-4 py-1.5 md:py-2 border border-gray-300 rounded-lg text-xs md:text-sm text-gray-700"
                  >
                    <option value="recent">MAIS RECENTES</option>
                    <option value="oldest">MAIS ANTIGOS</option>
                    <option value="alphabetic">A-Z</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                  {sortedAlbums.map((album) => (
                    <div key={album.id}>
                      <Link
                        to={album.isCollab 
                          ? `/${album.artistSlug}/${album.slug || album.id}` 
                          : `/${artist?.slug || slug}/${album.slug || album.id}`}
                        className="group cursor-pointer block"
                      >
                        <div className="relative mb-2 md:mb-3 overflow-hidden rounded-lg shadow-lg">
                          <img
                            src={album.coverImage}
                            alt={album.title}
                            className="w-full aspect-square object-cover transform group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                              <Play className="w-4 h-4 md:w-6 md:h-6 text-white ml-0.5" fill="white" />
                            </div>
                          </div>
                        </div>
                        <h3 className="text-black font-semibold text-sm md:text-base mb-1 truncate group-hover:text-red-600 transition-colors">
                          {album.title}
                        </h3>
                      </Link>
                      <p className="text-gray-600 text-xs md:text-sm mb-2">
                        {artist.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                          <span className="font-bold text-gray-700">{formatNumber(album.playCount)}</span>
                          <span className="text-gray-500">Plays</span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                          <span className="font-bold text-gray-700">{formatNumber(album.downloadCount)}</span>
                          <span className="text-gray-500">Downloads</span>
                        </div>
                      </div>
                    </div>
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
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h2 className="text-lg md:text-2xl font-bold text-black">PLAYLISTS</h2>
                  <select 
                    value={playlistsSortBy}
                    onChange={(e) => setPlaylistsSortBy(e.target.value)}
                    className="px-2 md:px-4 py-1.5 md:py-2 border border-gray-300 rounded-lg text-xs md:text-sm text-gray-700"
                  >
                    <option value="recent">MAIS RECENTES</option>
                    <option value="oldest">MAIS ANTIGOS</option>
                    <option value="alphabetic">A-Z</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                  {sortedPlaylists.map((playlist) => (
                    <Link
                      key={playlist.id}
                      to={`/playlist/${playlist.slug || playlist.id}`}
                      className="group cursor-pointer"
                    >
                      <div className="relative mb-2 md:mb-3 overflow-hidden rounded-lg shadow-lg">
                        <img
                          src={playlist.cover_url || '/images/default-playlist.jpg'}
                          alt={playlist.title}
                          className="w-full aspect-square object-cover transform group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                          <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                            <Play className="w-4 h-4 md:w-6 md:h-6 text-white ml-0.5" fill="white" />
                          </div>
                        </div>
                      </div>
                      <h3 className="text-black font-semibold text-sm md:text-base mb-1 truncate group-hover:text-red-600 transition-colors">
                        {playlist.title}
                      </h3>
                      <p className="text-gray-600 text-xs md:text-sm">
                        {(playlist.song_ids || []).length} músicas
                      </p>
                    </Link>
                  ))}
                </div>

                {artistPlaylists.length === 0 && (
                  <div className="text-center py-12 md:py-20">
                    <Music className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-sm md:text-base">Nenhuma playlist ainda</p>
                  </div>
                )}
              </div>
            )}

            {/* Vídeos Section */}
            {activeTab === 'videos' && (
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-black mb-4 md:mb-6">VÍDEOS</h2>

                {selectedVideo && (
                  <div className="mb-6 md:mb-8">
                    {/* Video Player em destaque */}
                    <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-lg mb-2 md:mb-3">
                      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          className="absolute inset-0 w-full h-full"
                          src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=0&controls=1&modestbranding=1`}
                          title={selectedVideo.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    </div>
                    <h3 className="text-black font-semibold text-base md:text-lg">{selectedVideo.title}</h3>
                  </div>
                )}

                {/* Grid de vídeos */}
                {artistVideos.length > 0 && (
                  <div className="mt-6 md:mt-8">
                    <h3 className="text-base md:text-lg font-bold text-black mb-3 md:mb-4">Mais vídeos</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
                      {artistVideos
                        .slice((currentVideoPage - 1) * 6, currentVideoPage * 6)
                        .map((video) => (
                          <button
                            key={video.id}
                            onClick={() => setSelectedVideo(video)}
                            className={`group cursor-pointer text-left transition-all ${
                              selectedVideo?.id === video.id ? 'ring-2 ring-red-600 rounded-lg' : ''
                            }`}
                          >
                            <div className="relative mb-2 md:mb-3 overflow-hidden rounded-lg shadow-lg">
                              <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="w-full aspect-video object-cover transform group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                                  <Play className="w-4 h-4 md:w-5 md:h-5 text-white ml-0.5" fill="white" />
                                </div>
                              </div>
                            </div>
                            <h4 className="text-black font-semibold text-xs md:text-sm truncate group-hover:text-red-600 transition-colors">
                              {video.title}
                            </h4>
                          </button>
                        ))}
                    </div>

                    {/* Paginação */}
                    {Math.ceil(artistVideos.length / 6) > 1 && (
                      <div className="flex justify-center items-center gap-1 md:gap-2 mt-4 md:mt-6">
                        {Array.from({ length: Math.ceil(artistVideos.length / 6) }, (_, i) => i + 1).map(
                          (page) => (
                            <button
                              key={page}
                              onClick={() => setCurrentVideoPage(page)}
                              className={`px-2 md:px-3 py-1.5 md:py-2 rounded text-sm md:text-base font-medium transition-colors ${
                                currentVideoPage === page
                                  ? 'bg-red-600 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {page}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}

                {artistVideos.length === 0 && (
                  <div className="text-center py-12 md:py-20">
                    <Video className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-sm md:text-base">Nenhum vídeo ainda</p>
                  </div>
                )}
              </div>
            )}

            {/* Perfil Section - Mobile Only */}
            {activeTab === 'perfil' && (
              <div>
                {/* Biografia */}
                {artist.bio && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">Biografia</h3>
                    <p className="text-gray-600 text-sm leading-relaxed text-justify">
                      {artist.bio}
                    </p>
                  </div>
                )}

                {/* Redes Sociais */}
                {(artist.instagram || artist.twitter || artist.youtube) && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">Redes Sociais</h3>
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
                    <h3 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">Localização</h3>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>{artist.location}</span>
                    </div>
                  </div>
                )}

                {/* Estilo Musical */}
                {artist.genre && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">Estilo Musical</h3>
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