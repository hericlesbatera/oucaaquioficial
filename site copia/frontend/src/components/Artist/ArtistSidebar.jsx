import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Upload, Music2, BarChart3, Settings, LogOut, User, Disc, ListMusic, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../ui/button';
import VerifiedAvatar from '../VerifiedAvatar';

const ArtistSidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [artistData, setArtistData] = useState(null);

  useEffect(() => {
    const loadArtist = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from('artists')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        if (data) {
          setArtistData(data);
        }
      }
    };
    loadArtist();
  }, [user?.id]);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* User Info */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <img
            src={artistData?.avatar_url || user?.avatar || '/images/default-avatar.png'}
            alt={artistData?.name || user?.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">Artista</p>
          </div>
        </div>
        <Link to="/premium">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm">
            premium
          </Button>
        </Link>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">ADICIONAR</p>
          <Link
            to="/artist/upload"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
              isActive('/artist/upload')
                ? 'text-gray-900 bg-gray-100'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Upload className="w-5 h-5" />
            <span className="font-medium">Novo Upload</span>
          </Link>
        </div>

        <div className="px-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">EDITAR PERFIL</p>
          <Link
            to="/artist/albums"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 ${
              isActive('/artist/albums')
                ? 'text-gray-900 bg-gray-100'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Disc className="w-5 h-5" />
            <span>Meus Álbuns</span>
          </Link>
          <Link
            to="/artist/playlists"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 ${
              isActive('/artist/playlists')
                ? 'text-gray-900 bg-gray-100'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ListMusic className="w-5 h-5" />
            <span>Minhas Playlists</span>
          </Link>
          <Link
            to={`/${artistData?.slug || user?.id}`}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 ${
              location.pathname.includes('/profile-public')
                ? 'text-gray-900 bg-gray-100'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <User className="w-5 h-5" />
            <span>Meu Perfil</span>
          </Link>
          <Link
            to="/artist/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
              isActive('/artist/settings')
                ? 'text-gray-900 bg-gray-100'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Configurações</span>
          </Link>
        </div>

        <div className="px-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">DASHBOARD</p>
          <Link
            to="/artist/dashboard"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
              isActive('/artist/dashboard')
                ? 'text-gray-900 bg-gray-100'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Estatísticas</span>
          </Link>
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};

export default ArtistSidebar;