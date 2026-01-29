import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mockArtists } from '../mock';
import { supabase } from '../lib/supabaseClient';
import { usePlayer } from '../context/PlayerContext';
import { useTrackPageView } from '../hooks/useTrackPageView';
import { Play, Disc, TrendingUp, ChevronLeft, ChevronRight, User, RefreshCw } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import HeroSlider from '../components/HeroSlider';
import VerifiedAvatar from '../components/VerifiedAvatar';

const Home = () => {
  useTrackPageView('home');
  const { playSong } = usePlayer();
  const lancamentosRef = useRef(null);
  const topCdsRef = useRef(null);
  
  // Lançamentos
  const [allAlbums, setAllAlbums] = useState([]);
  
  // TOP CDS
  const [topCdsAlbums, setTopCdsAlbums] = useState([]);
  const [period, setPeriod] = useState('geral');
  
  // Artistas
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Carregar álbuns e artistas
  useEffect(() => {
    const loadData = async () => {
      try {
        // Buscar em paralelo para melhorar performance
        const [albumsResult, artistsResult] = await Promise.all([
          // Buscar álbuns públicos com limit maior para TOP CDS (100 em vez de 50)
          supabase
            .from('albums')
            .select('id, slug, title, artist_name, artist_id, cover_url, play_count')
            .eq('is_private', false)
            .is('deleted_at', null)
            .is('is_scheduled', false)
            .order('created_at', { ascending: false })
            .limit(100),
          
          // Buscar artistas em paralelo
          supabase
            .from('artists')
            .select('id, name, slug, avatar_url, verified, monthly_listeners')
            .limit(50)
        ]);
        
        const { data: supabaseAlbums } = albumsResult;
        const { data: supabaseArtists } = artistsResult;
        
        if (supabaseAlbums && supabaseAlbums.length > 0) {
           const formattedAlbums = supabaseAlbums.map(album => ({
             id: album.id,
             slug: album.slug,
             title: album.title,
             artist_name: album.artist_name,
             artist_id: album.artist_id,
             artist: { slug: album.artist_id },
             cover_url: album.cover_url || '/images/default-album.png',
             play_count: album.play_count || 0
           }));
           setAllAlbums(formattedAlbums);
         }
        
        if (supabaseArtists && supabaseArtists.length > 0) {
          const formattedArtists = supabaseArtists.map(artist => ({
            id: artist.id,
            slug: artist.slug,
            name: artist.name || artist.display_name,
            avatar: artist.avatar_url || '/images/default-avatar.png',
            verified: artist.verified || false,
            monthlyListeners: artist.monthly_listeners || 0
          }));
          setArtists(formattedArtists);
        } else {
          setArtists(mockArtists);
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      }
      setLoading(false);
    };
    
    loadData();
  }, []);

  // Carregar TOP CDS quando período muda
  useEffect(() => {
    loadTopCds();
  }, [period, allAlbums]);

  const loadTopCds = async () => {
    try {
      if (allAlbums.length === 0) return;

      // Filtrar apenas álbuns públicos e não deletados
      const validAlbums = allAlbums.filter(album => {
        if (album.is_private === true) return false;
        if (album.deleted_at) return false;
        return true;
      });

      // Se o período for 'geral', retorna os álbuns ordenados por play_count (sem query extra)
      if (period === 'geral') {
        const sorted = [...validAlbums]
          .sort((a, b) => b.play_count - a.play_count)
          .slice(0, 20);
        setTopCdsAlbums(sorted);
        return;
      }

      // Para DIA, SEMANA, MÊS, buscar plays e filtrar por data
      const now = new Date();

      let startDate;
      if (period === 'dia') {
        // Começa à meia-noite de hoje
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (period === 'semana') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === 'mes') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Buscar plays do período com limit para não sobrecarregar
      const { data: plays, error: playsError } = await supabase
        .from('plays')
        .select('album_id')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString())
        .limit(5000); // Limitar para não crashar com muitos dados

      if (playsError) throw playsError;

      // Contar plays por álbum
      const playCountByAlbum = {};
      (plays || []).forEach(play => {
        playCountByAlbum[play.album_id] = (playCountByAlbum[play.album_id] || 0) + 1;
      });

      // Ordenar álbuns pelos plays do período, com desempate por play_count geral
      const sortedAlbums = validAlbums
        .map(album => ({
          ...album,
          period_play_count: playCountByAlbum[album.id] || 0
        }))
        .sort((a, b) => {
          // Se houver plays no período, ordena por eles
          if (b.period_play_count !== a.period_play_count) {
            return b.period_play_count - a.period_play_count;
          }
          // Se empate ou sem plays no período, desempata por play_count geral
          return b.play_count - a.play_count;
        })
        .slice(0, 20);

      setTopCdsAlbums(sortedAlbums);
    } catch (error) {
      console.error('Erro ao carregar TOP CDS:', error);
      setTopCdsAlbums([]);
    }
  };

  const scrollSection = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -800 : 800;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Buscar apenas álbuns necessários (não todos os campos)
      const { data: supabaseAlbums } = await supabase
        .from('albums')
        .select('id, slug, title, artist_name, artist_id, cover_url, play_count')
        .eq('is_private', false)
        .is('deleted_at', null)
        .is('is_scheduled', false)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (supabaseAlbums && supabaseAlbums.length > 0) {
         const formattedAlbums = supabaseAlbums.map(album => ({
           id: album.id,
           slug: album.slug,
           title: album.title,
           artist_name: album.artist_name,
           artist_id: album.artist_id,
           artist: { slug: album.artist_id },
           cover_url: album.cover_url || '/images/default-album.png',
           play_count: album.play_count || 0
         }));
          setAllAlbums(formattedAlbums);
          
          // Recarregar TOP CDS
          loadTopCds();
          return;
         }
    } catch (err) {
      console.error('Erro ao recarregar dados:', err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      {/* Hero Slider - Primeiro no mobile e desktop */}
      <HeroSlider />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Botão de Refresh */}
        <div className="mb-6 flex justify-end">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            size="sm"
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>

        {/* No mobile: Artistas em Destaque aparecem primeiro */}
        <section className="mb-12 md:mb-16 md:order-3">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-red-600" />
              <h2 className="text-2xl md:text-3xl font-bold text-black">Artistas em Destaque</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                to={`/${artist.slug || artist.id}`}
                className="group cursor-pointer text-center"
              >
                <div className="relative mb-3">
                  <VerifiedAvatar
                    src={artist.avatar}
                    alt={artist.name}
                    className="w-full aspect-square rounded-full object-cover transform group-hover:scale-110 transition-transform duration-300 shadow-lg"
                    badgeClassName=""
                    showBadge={artist.verified}
                  />
                </div>
                <h3 className="text-black font-semibold text-sm mb-1 truncate group-hover:text-red-600 transition-colors">
                  {artist.name}
                </h3>
                <p className="text-gray-600 text-xs">
                  {artist.monthlyListeners?.toLocaleString()} ouvintes
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Lançamentos Recentes */}
        <section className="mb-12 md:mb-16 md:order-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Disc className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-black">Lançamentos Recentes</h2>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/releases" className="text-red-600 hover:text-red-500 font-bold text-sm">
                VER TODOS
              </Link>
              <div className="flex gap-2">
                <Button
                  onClick={() => scrollSection(lancamentosRef, 'left')}
                  size="icon"
                  variant="outline"
                  className="w-8 h-8 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => scrollSection(lancamentosRef, 'right')}
                  size="icon"
                  variant="outline"
                  className="w-8 h-8 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <div
            ref={lancamentosRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {allAlbums.length === 0 ? (
              <p className="text-gray-500 py-8">Nenhum lançamento disponível no momento.</p>
            ) : (
              allAlbums.map((album) => (
                <Link
                  key={album.id}
                  to={`/${album.artist?.slug || album.artist_id}/${album.slug || album.id}`}
                  className="group cursor-pointer flex-shrink-0"
                  style={{ width: '180px' }}
                >
                  <div className="relative mb-3 overflow-hidden rounded-lg shadow-lg bg-gray-200">
                    <img
                      src={album.cover_url}
                      alt={album.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full aspect-square object-cover transform group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                        <Play className="w-5 h-5 text-white ml-1" fill="white" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-black font-semibold text-sm mb-1 truncate group-hover:text-red-600 transition-colors">
                    {album.title}
                  </h3>
                  <p className="text-gray-600 text-xs truncate">{album.artist_name}</p>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* TOP CDS */}
        <section className="mb-12 md:mb-16 md:order-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-black">TOP CDS</h2>
              <div className="flex items-center gap-2 text-sm ml-4">
                <button
                  onClick={() => setPeriod('dia')}
                  className={`font-bold pb-1 transition-colors ${period === 'dia' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-600 hover:text-red-600'}`}
                >
                  DIA
                </button>
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => setPeriod('semana')}
                  className={`font-bold pb-1 transition-colors ${period === 'semana' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-600 hover:text-red-600'}`}
                >
                  SEMANA
                </button>
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => setPeriod('mes')}
                  className={`font-bold pb-1 transition-colors ${period === 'mes' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-600 hover:text-red-600'}`}
                >
                  MÊS
                </button>
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => setPeriod('geral')}
                  className={`font-bold pb-1 transition-colors ${period === 'geral' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-600 hover:text-red-600'}`}
                >
                  GERAL
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/top-cds" className="text-red-600 hover:text-red-500 font-bold text-sm">
                VER TODOS
              </Link>
              <div className="flex gap-2">
                <Button
                  onClick={() => scrollSection(topCdsRef, 'left')}
                  size="icon"
                  variant="outline"
                  className="w-8 h-8 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => scrollSection(topCdsRef, 'right')}
                  size="icon"
                  variant="outline"
                  className="w-8 h-8 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <div
            ref={topCdsRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {topCdsAlbums.length === 0 ? (
              <p className="text-gray-500 py-8">Nenhum CD disponível para este período.</p>
            ) : (
              topCdsAlbums.map((album, index) => (
                <Link
                  key={album.id}
                  to={`/${album.artist?.slug || album.artist_id}/${album.slug || album.id}`}
                  className="relative group cursor-pointer flex-shrink-0"
                  style={{ width: '180px' }}
                >
                  <div className="relative mb-3 overflow-hidden rounded-lg shadow-lg bg-gray-200">
                    <div className="absolute top-2 left-2 z-10 bg-red-600 text-white font-bold text-lg w-10 h-10 flex items-center justify-center rounded shadow-lg">
                      {index + 1}
                    </div>
                    <img
                      src={album.cover_url}
                      alt={album.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full aspect-square object-cover transform group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                        <Play className="w-5 h-5 text-white ml-1" fill="white" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-black font-semibold text-sm mb-1 truncate group-hover:text-red-600 transition-colors">
                    {album.title}
                  </h3>
                  <p className="text-gray-600 text-xs truncate">{album.artist_name}</p>
                </Link>
              ))
            )}
          </div>
        </section>
        </div>
    </div>
  );
};

export default Home;
