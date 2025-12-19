import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music, Search, User, ChevronDown, Upload, Disc, Settings, BarChart3, LogOut, Heart, ListMusic } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { mockArtists } from '../../mock';
import { supabase } from '../../lib/supabaseClient';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import NotificationDropdown from '../Notifications/NotificationDropdown';

const Header = () => {
  const { user, logout, isArtist } = useAuth();
  const [artistForUser, setArtistForUser] = useState(null);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [scrollDirection, setScrollDirection] = useState('down');
  const genreListRef = React.useRef(null);
  
  const allGenres = [
    { name: 'Forró', slug: 'forro' },
    { name: 'Arrocha', slug: 'arrocha' },
    { name: 'Piseiro', slug: 'piseiro' },
    { name: 'Arrochadeira', slug: 'arrochadeira' },
    { name: 'Pagode', slug: 'pagode' },
    { name: 'Sertanejo', slug: 'sertanejo' },
    { name: 'Brega Funk', slug: 'brega-funk' },
    { name: 'Variados', slug: 'variados' },
    { name: 'Samba', slug: 'samba' },
    { name: 'Funk', slug: 'funk' },
    { name: 'Axé', slug: 'axe' },
    { name: 'Reggae', slug: 'reggae' },
    { name: 'Brega', slug: 'brega' },
    { name: 'Gospel', slug: 'gospel' },
    { name: 'Rap/Hip-Hop', slug: 'rap-hip-hop' },
    { name: 'Pop', slug: 'pop' },
    { name: 'MPB', slug: 'mpb' },
    { name: 'Rock', slug: 'rock' },
    { name: 'Eletrônica', slug: 'eletronica' },
    { name: 'Trap', slug: 'trap' },
    { name: 'Frevo', slug: 'frevo' }
  ];
  
  const visibleGenres = showAllGenres ? allGenres : allGenres.slice(0, 14);

  useEffect(() => {
    const loadArtist = async () => {
      if (user?.id && isArtist) {
        const { data: supabaseArtist } = await supabase
          .from('artists')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (supabaseArtist) {
          setArtistForUser({
            id: supabaseArtist.id,
            slug: supabaseArtist.slug,
            name: supabaseArtist.name,
            avatar: supabaseArtist.avatar_url || '/images/default-avatar.png'
          });
        } else {
          const mockArtist = mockArtists.find(a => a.userId === user.id || String(a.userId) === String(user.id));
          if (mockArtist) setArtistForUser(mockArtist);
        }
      }
    };
    loadArtist();
  }, [user?.id, isArtist]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
    }
  };

  return (
    <header className="bg-red-600 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <img src="/images/Logo-escutai.png" alt="Escutaí" className="h-9" />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-white hover:text-gray-200 font-medium transition-colors">
              Lançamentos
            </Link>
            <Link to="/artists" className="text-white hover:text-gray-200 font-medium transition-colors">
              Artistas
            </Link>
            <Link to="/albums" className="text-white hover:text-gray-200 font-medium transition-colors">
              Músicas
            </Link>
            <DropdownMenu modal={false} onOpenChange={(open) => { if (!open) setShowAllGenres(false); }}>
              <DropdownMenuTrigger className="text-white hover:text-gray-200 font-medium transition-colors">
                Gêneros ▼
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white w-48">
                {visibleGenres.map((genre) => (
                  <DropdownMenuItem 
                    key={genre.slug} 
                    className="cursor-pointer hover:bg-red-50 hover:text-red-600 p-0"
                    asChild
                  >
                    <Link 
                      to={`/genero/${genre.slug}`}
                      className="w-full px-2 py-1.5 block"
                    >
                      {genre.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
                {!showAllGenres && allGenres.length > 14 && (
                  <div 
                    onMouseEnter={() => setShowAllGenres(true)}
                    className="w-full py-2 flex items-center justify-center text-gray-400 border-t cursor-pointer hover:text-red-600 transition-colors"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden lg:flex items-center flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <Input
                type="text"
                placeholder="Busque por artistas, álbuns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 bg-white border-0 text-gray-900 placeholder:text-gray-500 rounded-full shadow-sm focus:ring-2 focus:ring-white/50"
              />
            </div>
          </form>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user && <NotificationDropdown />}
            {user ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors">
                    <img
                      src={artistForUser?.avatar || user?.avatar || user?.user_metadata?.avatar_url || '/images/default-avatar.png'}
                      alt={artistForUser?.name || user?.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-white font-medium hidden md:block">{user.name}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white w-56">
                  {isArtist ? (
                    <>
                      <DropdownMenuItem onClick={() => navigate(`/${artistForUser?.slug || artistForUser?.id || 'a1'}`)} className="cursor-pointer flex items-center gap-3 py-3">
                        <User className="w-5 h-5 text-gray-500" />
                        <span>Meu Perfil</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/artist/upload')} className="cursor-pointer flex items-center gap-3 py-3">
                        <Upload className="w-5 h-5 text-gray-500" />
                        <span>Novo Upload</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/artist/albums')} className="cursor-pointer flex items-center gap-3 py-3">
                        <Disc className="w-5 h-5 text-gray-500" />
                        <span>Meus Álbuns</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/artist/dashboard')} className="cursor-pointer flex items-center gap-3 py-3">
                        <BarChart3 className="w-5 h-5 text-gray-500" />
                        <span>Estatísticas</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/artist/settings')} className="cursor-pointer flex items-center gap-3 py-3">
                        <Settings className="w-5 h-5 text-gray-500" />
                        <span>Configurações</span>
                      </DropdownMenuItem>
                      <div className="border-t border-gray-200 my-2"></div>
                      <DropdownMenuItem onClick={logout} className="cursor-pointer flex items-center gap-3 py-3 text-red-600">
                        <LogOut className="w-5 h-5" />
                        <span>Sair</span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/favorites')} className="cursor-pointer flex items-center gap-3 py-3">
                        <Heart className="w-5 h-5 text-gray-500" />
                        <span>Favoritos</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/playlists')} className="cursor-pointer flex items-center gap-3 py-3">
                        <ListMusic className="w-5 h-5 text-gray-500" />
                        <span>Playlists</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/premium')} className="cursor-pointer flex items-center gap-3 py-3">
                        <Music className="w-5 h-5 text-gray-500" />
                        <span>Assinar Premium</span>
                      </DropdownMenuItem>
                      <div className="border-t border-gray-200 my-2"></div>
                      <DropdownMenuItem onClick={logout} className="cursor-pointer flex items-center gap-3 py-3 text-red-600">
                        <LogOut className="w-5 h-5" />
                        <span>Sair</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => navigate('/login')}
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-red-600"
                >
                  Entrar
                </Button>
                <Button
                  onClick={() => navigate('/cadastrar')}
                  className="bg-white text-red-600 hover:bg-gray-100"
                >
                  Cadastrar
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;