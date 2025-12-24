import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Library, PlusCircle, Heart, Music, User, BarChart3, Upload, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { mockArtists } from '../../mock';
import { Button } from '../ui/button';

const Sidebar = () => {
  const location = useLocation();
  const { user, isArtist, isPremium } = useAuth();

  // prefer artist avatar if available for the logged user
  let artistForUser = null;
  if (user?.id) {
    artistForUser = mockArtists.find(a => a.userId === user.id || String(a.userId) === String(user.id));
  }
  if (!artistForUser && user?.name) {
    artistForUser = mockArtists.find(a => a.name === user.name);
  }

  const userLinks = [
    { name: 'Início', path: '/', icon: Home },
    { name: 'Buscar', path: '/search', icon: Search },
    { name: 'Biblioteca', path: '/library', icon: Library },
    { name: 'Favoritos', path: '/favorites', icon: Heart }
  ];

  const artistLinks = [
    { name: 'Dashboard', path: '/artist/dashboard', icon: BarChart3 },
    { name: 'Novo Upload', path: '/artist/upload', icon: Upload },
    { name: 'Minhas Músicas', path: '/artist/songs', icon: Music },
    { name: 'Meu Perfil', path: '/artist/profile', icon: User }
  ];

  const links = isArtist ? artistLinks : userLinks;

  return (
    <div className="w-64 bg-black text-white flex flex-col h-full border-r border-red-900/20">
      {/* Logo */}
      <div className="p-6">
        <Link to="/" className="flex items-center space-x-2">
          <Music className="w-8 h-8 text-red-600" />
          <span className="text-2xl font-bold">RedMusic</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-red-900/20 ${
                isActive ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{link.name}</span>
            </Link>
          );
        })}

        {!isArtist && (
          <Link
            to="/playlists"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-red-900/20 text-gray-400 hover:text-white"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="font-medium">Criar Playlist</span>
          </Link>
        )}
      </nav>

      {/* Premium Banner */}
      {!isPremium && !isArtist && (
        <div className="m-4 p-4 bg-gradient-to-br from-red-600 to-red-800 rounded-lg">
          <h3 className="font-bold text-white mb-2">Experimente o Premium</h3>
          <p className="text-sm text-white/80 mb-3">Download ilimitado e sem anúncios</p>
          <Link to="/premium">
            <Button className="w-full bg-white text-red-600 hover:bg-gray-100">
              Assinar Agora
            </Button>
          </Link>
        </div>
      )}

      {/* User Profile */}
      <div className="p-4 border-t border-red-900/20">
        <Link
          to="/profile"
          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-red-900/20 transition-colors"
        >
          <img
            src={user?.avatar || artistForUser?.avatar || '/images/default-avatar.png'}
            alt={user?.name}
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-gray-400">
              {isArtist ? 'Artista' : isPremium ? 'Premium' : 'Gratuito'}
            </p>
          </div>
          <Settings className="w-5 h-5 text-gray-400" />
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;