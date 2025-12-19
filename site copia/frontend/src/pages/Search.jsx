import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, Play, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Input } from '../components/ui/input';
import VerifiedAvatar from '../components/VerifiedAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [localQuery, setLocalQuery] = useState(query);
  const [activeFilter, setActiveFilter] = useState('todos');
  const [loading, setLoading] = useState(false);
  const [albumSort, setAlbumSort] = useState('recent');
  const [playlistSort, setPlaylistSort] = useState('recent');

  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [playlists, setPlaylists] = useState([]);

  const sortOptions = [
    { id: 'recent', label: 'MAIS RECENTES' },
    { id: 'plays', label: 'MAIS OUVIDAS' },
    { id: 'downloads', label: 'MAIS BAIXADAS' },
    { id: 'oldest', label: 'MAIS ANTIGOS' },
  ];

  const filters = [
    { id: 'todos', label: 'Todos' },
    { id: 'perfis', label: 'Perfis' },
    { id: 'albums', label: 'CDS/SINGLES' },
    { id: 'playlists', label: 'Playlists' },
  ];

  useEffect(() => {
    if (query) {
      searchAll(query);
    }
  }, [query]);

  const searchAll = async (searchTerm) => {
    setLoading(true);
    try {
      const artistsRes = await supabase
        .from('artists')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%`)
        .limit(20);

      const artistIds = (artistsRes.data || []).map(a => a.id);

      const [albumsRes, playlistsRes] = await Promise.all([
        supabase
          .from('albums')
          .select(`
            *,
            artist:artists(id, name, slug, is_verified, avatar_url)
          `)
          .or(`title.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%${artistIds.length > 0 ? `,artist_id.in.(${artistIds.join(',')})` : ''}`)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('playlists')
          .select('*')
          .eq('is_public', true)
          .ilike('title', `%${searchTerm}%`)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      console.log('Playlists encontradas:', playlistsRes.data, 'Erro:', playlistsRes.error);
      setArtists(artistsRes.data || []);
      setAlbums(albumsRes.data || []);
      setPlaylists(playlistsRes.data || []);
    } catch (error) {
      console.error('Erro na busca:', error);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (localQuery.trim()) {
      setSearchParams({ q: localQuery.trim() });
    }
  };

  const showArtists = activeFilter === 'todos' || activeFilter === 'perfis';
  const showAlbums = activeFilter === 'todos' || activeFilter === 'albums';
  const showPlaylists = activeFilter === 'todos' || activeFilter === 'playlists';

  const sortItems = (items, sortType) => {
    const sorted = [...items];
    switch (sortType) {
      case 'plays':
        return sorted.sort((a, b) => (b.play_count || 0) - (a.play_count || 0));
      case 'downloads':
        return sorted.sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'recent':
      default:
        return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  };

  const sortedAlbums = sortItems(albums, albumSort);
  const sortedPlaylists = sortItems(playlists, playlistSort);

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar artistas, álbuns, playlists..."
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              className="pl-12 h-12 bg-white border-gray-200 text-gray-900"
            />
          </div>
        </form>

        {query && (
          <div>
            {/* Horizontal Filter Tabs */}
            <div className="flex gap-2 mb-8 flex-wrap">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-6 py-2 rounded-full font-medium transition-colors ${
                    activeFilter === filter.id
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Results */}
            <main>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Buscando...</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {/* Perfis Section */}
                  {showArtists && artists.length > 0 && (
                    <section>
                      <h2 className="text-2xl font-bold text-red-600 mb-4 pb-2 border-b-2 border-red-600">
                        PERFIS
                      </h2>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-4">
                        {(activeFilter === 'todos' ? artists.slice(0, 8) : artists).map((artist) => (
                          <Link
                            key={artist.id}
                            to={`/${artist.slug}`}
                            className="group cursor-pointer text-center"
                          >
                            <div className="relative mb-2 mx-auto" style={{ maxWidth: '120px' }}>
                              <VerifiedAvatar
                                src={artist.avatar_url || '/images/default-avatar.png'}
                                alt={artist.name}
                                className="w-full aspect-square rounded-full object-cover transform group-hover:scale-105 transition-transform duration-300 shadow-md"
                                badgeClassName="w-6 h-6"
                                showBadge={artist.is_verified}
                              />
                            </div>
                            <h3 className="text-gray-900 font-semibold text-xs mb-0.5 truncate group-hover:text-red-600 transition-colors">
                              {artist.name}
                            </h3>
                            <p className="text-gray-500 text-xs">
                              {artist.followers_count?.toLocaleString() || 0} ouvintes
                            </p>
                          </Link>
                        ))}
                      </div>
                      {activeFilter === 'todos' && artists.length > 8 && (
                        <button
                          onClick={() => setActiveFilter('perfis')}
                          className="mt-6 w-full py-3 border-2 border-red-600 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
                        >
                          VER TODOS PERFIS
                        </button>
                      )}
                    </section>
                  )}

                  {/* CDS/SINGLES Section */}
                  {showAlbums && albums.length > 0 && (
                    <section>
                      <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-red-600">
                        <h2 className="text-2xl font-bold text-red-600">
                          CDS/SINGLES
                        </h2>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700 transition-colors">
                            <SlidersHorizontal className="w-4 h-4" />
                            Filtros
                            <ChevronDown className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white">
                            {sortOptions.map((option) => (
                              <DropdownMenuItem
                                key={option.id}
                                onClick={() => setAlbumSort(option.id)}
                                className={`cursor-pointer ${albumSort === option.id ? 'bg-red-50 text-red-600 font-medium' : ''}`}
                              >
                                {option.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {(activeFilter === 'todos' ? sortedAlbums.slice(0, 12) : sortedAlbums).map((album) => (
                          <Link
                            key={album.id}
                            to={`/${album.artist?.slug || 'artista'}/${album.slug}`}
                            className="group cursor-pointer"
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
                            <p className="text-gray-500 text-xs truncate mb-2">{album.artist?.name || 'Artista'}</p>
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
                          </Link>
                        ))}
                      </div>
                      {activeFilter === 'todos' && albums.length > 12 && (
                        <button
                          onClick={() => setActiveFilter('albums')}
                          className="mt-6 w-full py-3 border-2 border-red-600 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
                        >
                          VER TODOS CDS/SINGLES
                        </button>
                      )}
                    </section>
                  )}

                  {/* Playlists Section */}
                  {showPlaylists && playlists.length > 0 && (
                    <section>
                      <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-red-600">
                        <h2 className="text-2xl font-bold text-red-600">
                          PLAYLISTS
                        </h2>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700 transition-colors">
                            <SlidersHorizontal className="w-4 h-4" />
                            Filtros
                            <ChevronDown className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white">
                            {sortOptions.map((option) => (
                              <DropdownMenuItem
                                key={option.id}
                                onClick={() => setPlaylistSort(option.id)}
                                className={`cursor-pointer ${playlistSort === option.id ? 'bg-red-50 text-red-600 font-medium' : ''}`}
                              >
                                {option.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {(activeFilter === 'todos' ? sortedPlaylists.slice(0, 6) : sortedPlaylists).map((playlist) => (
                          <Link
                            key={playlist.id}
                            to={`/playlist/${playlist.id}`}
                            className="group cursor-pointer"
                          >
                            <div className="relative mb-3 overflow-hidden rounded-lg shadow-lg">
                              <img
                                src={playlist.cover_url || '/images/default-playlist.jpg'}
                                alt={playlist.title}
                                className="w-full aspect-square object-cover transform group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                                  <Play className="w-5 h-5 text-white ml-1" fill="white" />
                                </div>
                              </div>
                            </div>
                            <h3 className="text-gray-900 font-semibold text-sm mb-1 truncate group-hover:text-red-600 transition-colors">
                              {playlist.title}
                            </h3>
                            <p className="text-gray-500 text-xs truncate">Playlist</p>
                          </Link>
                        ))}
                      </div>
                      {activeFilter === 'todos' && playlists.length > 6 && (
                        <button
                          onClick={() => setActiveFilter('playlists')}
                          className="mt-6 w-full py-3 border-2 border-red-600 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
                        >
                          VER TODAS PLAYLISTS
                        </button>
                      )}
                    </section>
                  )}

                  {/* No Results */}
                  {!loading && artists.length === 0 && albums.length === 0 && playlists.length === 0 && (
                    <div className="text-center py-16">
                      <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        Nenhum resultado encontrado
                      </h3>
                      <p className="text-gray-500">
                        Não encontramos resultados para "{query}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        )}

        {/* Initial State */}
        {!query && (
          <div className="text-center py-20">
            <SearchIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              O que você quer encontrar?
            </h2>
            <p className="text-gray-500">
              Busque por artistas, álbuns ou playlists
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
