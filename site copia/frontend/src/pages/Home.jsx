import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mockArtists } from '../mock';
import { supabase } from '../lib/supabaseClient';
import { usePlayer } from '../context/PlayerContext';
import { Play, Disc, TrendingUp, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import HeroSlider from '../components/HeroSlider';
import VerifiedAvatar from '../components/VerifiedAvatar';

const Home = () => {
  const { playSong } = usePlayer();
  const lancamentosRef = useRef(null);
  const topCdsRef = useRef(null);
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Buscar álbuns do Supabase
        const { data: supabaseAlbums, error: albumsError } = await supabase
          .from('albums')
          .select('*');
        
        if (albumsError) {
          console.error('Erro ao buscar álbuns:', albumsError);
        }
        
        if (supabaseAlbums && supabaseAlbums.length > 0) {
          // Buscar slugs dos artistas
          const artistIds = [...new Set(supabaseAlbums.map(a => a.artist_id))];
          const { data: artistsData } = await supabase
            .from('artists')
            .select('id, slug')
            .in('id', artistIds);
          
          const artistSlugMap = {};
          (artistsData || []).forEach(a => { artistSlugMap[a.id] = a.slug; });
          
          const formattedAlbums = supabaseAlbums.map(album => ({
            id: album.id,
            slug: album.slug,
            title: album.title,
            artistName: album.artist_name,
            artistId: album.artist_id,
            artistSlug: artistSlugMap[album.artist_id] || album.artist_id,
            coverImage: album.cover_url || '/images/default-album.png',
            releaseYear: album.release_year
          }));
          setAlbums(formattedAlbums);
        }
        
        // Buscar artistas do Supabase
        const { data: supabaseArtists, error: artistsError } = await supabase
          .from('artists')
          .select('*');
        
        if (supabaseArtists && supabaseArtists.length > 0) {
          const formattedArtists = supabaseArtists.map(artist => ({
            id: artist.id,
            slug: artist.slug,
            name: artist.name || artist.display_name,
            avatar: artist.avatar_url || artist.profile_image || '/images/default-avatar.png',
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

  const scrollSection = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -800 : 800;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

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
            {albums.length === 0 ? (
              <p className="text-gray-500 py-8">Nenhum lançamento disponível no momento.</p>
            ) : (
              albums.map((album) => (
                <Link
                  key={album.id}
                  to={`/${album.artistSlug}/${album.slug || album.id}`}
                  className="group cursor-pointer flex-shrink-0"
                  style={{ width: '180px' }}
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
                  <p className="text-gray-600 text-xs truncate">{album.artistName}</p>
                </Link>
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
                <button className="text-red-600 font-bold border-b-2 border-red-600 pb-1">
                  DIA
                </button>
                <span className="text-gray-400">/</span>
                <button className="text-gray-600 hover:text-red-600 transition-colors font-medium">
                  SEMANA
                </button>
                <span className="text-gray-400">/</span>
                <button className="text-gray-600 hover:text-red-600 transition-colors font-medium">
                  MÊS
                </button>
                <span className="text-gray-400">/</span>
                <button className="text-gray-600 hover:text-red-600 transition-colors font-medium">
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
            {albums.length === 0 ? (
              <p className="text-gray-500 py-8">Nenhum CD disponível no momento.</p>
            ) : (
              albums.map((album, index) => (
                <Link
                  key={album.id}
                  to={`/${album.artistSlug}/${album.slug || album.id}`}
                  className="relative group cursor-pointer flex-shrink-0"
                  style={{ width: '180px' }}
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
                  <p className="text-gray-600 text-xs truncate">{album.artistName}</p>
                </Link>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
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
      </div>
    </div>
  );
};

export default Home;