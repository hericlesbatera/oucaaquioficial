import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { usePlayer } from '../context/PlayerContext';
import { Play, Disc, TrendingUp, ChevronLeft, ChevronRight, User, BadgeCheck } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import HeroSlider from '../components/HeroSlider';

const HomeImproved = () => {
  const { playSong } = usePlayer();
  const lancamentosRef = useRef(null);
  const topCdsRef = useRef(null);
  const [topCdsFilter, setTopCdsFilter] = useState('mes');
  const [allAlbums, setAllAlbums] = useState([]);
  const [allArtists, setAllArtists] = useState([]);
  
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  useEffect(() => {
    const loadData = async () => {
      // Carregar álbuns do Supabase com dados do artista
      const { data: supabaseAlbums, error: albumsError } = await supabase
        .from('albums')
        .select(`
          *,
          artist:artists(id, name, slug, is_verified)
        `);
      
      if (albumsError) {
        console.error('Erro ao buscar álbuns:', albumsError);
      }
      
      if (supabaseAlbums && supabaseAlbums.length > 0) {
        const formattedAlbums = supabaseAlbums.map(album => ({
          id: album.id,
          slug: album.slug,
          title: album.title,
          artistName: album.artist?.name || album.artist_name,
          artistId: album.artist_id,
          artistSlug: album.artist?.slug || album.artist_id,
          artistVerified: album.artist?.is_verified || false,
          coverImage: album.cover_url || '/images/default-album.png',
          releaseYear: album.release_year,
          playCount: album.play_count || 0,
          downloadCount: album.download_count || 0
        }));
        setAllAlbums(formattedAlbums);
      }
      
      // Carregar artistas do Supabase
      const { data: supabaseArtists } = await supabase
        .from('artists')
        .select('*')
        .limit(20);
      
      if (supabaseArtists && supabaseArtists.length > 0) {
        const formattedSupabaseArtists = supabaseArtists.map(a => ({
          id: a.id,
          slug: a.slug,
          name: a.name,
          avatar: a.avatar_url || '/images/default-avatar.png',
          coverImage: a.cover_url || '',
          verified: a.is_verified,
          monthlyListeners: a.followers_count || 0,
          bio: a.bio
        }));
        setAllArtists(formattedSupabaseArtists);
      }
    };
    
    loadData();
  }, []);

  const scrollSection = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -800 : 800;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Ordenar por quantidade de plays (quando implementado)
  const getFilteredTopCds = () => {
    const albums = [...allAlbums];
    
    // Por enquanto ordena por plays (quando tiver) ou mantém ordem
    // Futuramente: filtrar por período real (dia/semana/mês)
    if (topCdsFilter === 'dia') {
      return albums.sort((a, b) => (b.plays_day || 0) - (a.plays_day || 0));
    } else if (topCdsFilter === 'semana') {
      return albums.sort((a, b) => (b.plays_week || 0) - (a.plays_week || 0));
    } else if (topCdsFilter === 'mes') {
      return albums.sort((a, b) => (b.plays_month || 0) - (a.plays_month || 0));
    } else if (topCdsFilter === 'geral') {
      return albums.sort((a, b) => (b.plays_total || 0) - (a.plays_total || 0));
    }
    return albums;
  };

  const filteredTopCds = getFilteredTopCds();

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      {/* Hero Slider */}
      <HeroSlider />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Lançamentos Recentes */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Disc className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-black">Lançamentos Recentes</h2>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/lancamentos" className="text-red-600 hover:text-red-500 font-bold text-sm">
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
                <div
                  key={album.id}
                  className="flex-shrink-0"
                  style={{ width: '180px' }}
                >
                  <Link
                    to={`/${album.artistSlug}/${album.slug || album.id}`}
                    className="group cursor-pointer block"
                  >
                    <div className="relative mb-3 overflow-hidden rounded-lg shadow-lg">
                      <img
                        src={album.coverImage}
                        alt={album.title}
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
                  </Link>
                  <Link
                    to={`/${album.artistSlug}`}
                    className="flex items-center gap-1 text-gray-600 text-xs truncate hover:text-red-600 transition-colors mb-2"
                  >
                    <span className="truncate">{album.artistName}</span>
                    {album.artistVerified && (
                      <BadgeCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    )}
                  </Link>
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
              ))
            )}
          </div>
        </section>

        {/* TOP CDS */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-black">TOP CDS</h2>
              <div className="flex items-center gap-2 text-sm ml-4">
                <button
                  onClick={() => setTopCdsFilter('dia')}
                  className={`font-bold pb-1 transition-colors ${
                    topCdsFilter === 'dia' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-600 hover:text-red-600'
                  }`}
                >
                  DIA
                </button>
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => setTopCdsFilter('semana')}
                  className={`font-medium transition-colors ${
                    topCdsFilter === 'semana' ? 'text-red-600 border-b-2 border-red-600 pb-1' : 'text-gray-600 hover:text-red-600'
                  }`}
                >
                  SEMANA
                </button>
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => setTopCdsFilter('mes')}
                  className={`font-medium transition-colors ${
                    topCdsFilter === 'mes' ? 'text-red-600 border-b-2 border-red-600 pb-1' : 'text-gray-600 hover:text-red-600'
                  }`}
                >
                  MÊS
                </button>
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => setTopCdsFilter('geral')}
                  className={`font-medium transition-colors ${
                    topCdsFilter === 'geral' ? 'text-red-600 border-b-2 border-red-600 pb-1' : 'text-gray-600 hover:text-red-600'
                  }`}
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
            {filteredTopCds.length === 0 ? (
              <p className="text-gray-500 py-8">Nenhum CD disponível no momento.</p>
            ) : (
              filteredTopCds.map((album, index) => (
                <div
                  key={`${album.id}-${topCdsFilter}`}
                  className="flex-shrink-0"
                  style={{ width: '180px' }}
                >
                  <Link
                    to={`/${album.artistSlug}/${album.slug || album.id}`}
                    className="group cursor-pointer block"
                  >
                    <div className="relative mb-3 overflow-hidden rounded-lg shadow-lg">
                      <div className="absolute top-2 left-2 z-10 bg-red-600 text-white font-bold text-lg w-10 h-10 flex items-center justify-center rounded shadow-lg">
                        {index + 1}
                      </div>
                      <img
                        src={album.coverImage}
                        alt={album.title}
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
                  </Link>
                  <Link
                    to={`/${album.artistSlug}`}
                    className="flex items-center gap-1 text-gray-600 text-xs truncate hover:text-red-600 transition-colors mb-2"
                  >
                    <span className="truncate">{album.artistName}</span>
                    {album.artistVerified && (
                      <BadgeCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    )}
                  </Link>
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
              ))
            )}
          </div>
        </section>

        {/* Artistas em Destaque */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-black">Artistas em Destaque</h2>
            </div>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
            {allArtists.length === 0 ? (
              <p className="text-gray-500 py-8 col-span-full">Nenhum artista disponível no momento.</p>
            ) : (
              allArtists.map((artist) => (
                <Link
                  key={artist.id}
                  to={`/${artist.slug || artist.id}`}
                  className="group cursor-pointer text-center"
                >
                  <div className="relative mb-3 inline-block">
                    <img
                      src={artist.avatar}
                      alt={artist.name}
                      className="w-28 h-28 rounded-full object-cover transform group-hover:scale-110 transition-transform duration-300 shadow-lg"
                    />
                    {artist.verified && (
                      <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
                        <BadgeCheck className="w-4 h-4" color="#fff" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-black font-semibold text-sm mb-1 truncate group-hover:text-red-600 transition-colors">
                    {artist.name}
                  </h3>
                  <p className="text-gray-600 text-xs">
                    {artist.monthlyListeners?.toLocaleString()} ouvintes
                  </p>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomeImproved;