import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Upload, Music2, BarChart3, Settings, LogOut, User, Disc, ListMusic, Heart, Lock, Video, Disc3, BadgeCheck, MessageSquare, Menu, X, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useImagePreload } from '../../hooks/useImagePreload';
import { supabase } from '../../lib/supabaseClient';

const ArtistMobileMenu = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [artistData, setArtistData] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  
  const avatarUrl = artistData?.avatar_url || user?.avatar;
  const { imageUrl: preloadedAvatar } = useImagePreload(avatarUrl, '/images/default-avatar.png');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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

  // Fechar menu quando mudar de rota
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { section: 'ADICIONAR', items: [
      { path: '/artist/upload', icon: Upload, label: 'Novo Upload' }
    ]},
    { section: 'EDITAR PERFIL', items: [
      { path: '/artist/albums', icon: Disc3, label: 'CDS/SINGLES' },
      { path: '/artist/playlists', icon: ListMusic, label: 'Minhas Playlists' },
      { path: '/artist/favoritos', icon: Heart, label: 'Favoritos' },
      { path: '/artist/meus-videos', icon: Video, label: 'Meus Vídeos' },
      { path: `/${artistData?.slug || user?.id}`, icon: User, label: 'Meu Perfil' }
    ]},
    { section: 'COMUNICAÇÃO', items: [
      { path: '/artist/support', icon: MessageSquare, label: 'Suporte' }
    ]},
    { section: 'DASHBOARD', items: [
      { path: '/artist/settings', icon: Settings, label: 'Configurações' },
      { path: '/artist/email-senha', icon: Lock, label: 'Email e senha' },
      { path: '/artist/dashboard', icon: BarChart3, label: 'Estatísticas' }
    ]}
  ];

  // Encontrar item atual para mostrar no header
  const currentItem = menuItems
    .flatMap(section => section.items)
    .find(item => isActive(item.path));

  return (
    <>
      {/* Mobile Header com navegação */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 text-gray-700"
        >
          <Menu className="w-6 h-6" />
          <span className="font-medium">{currentItem?.label || 'Menu'}</span>
        </button>
        
        <div className="flex items-center gap-2">
          <img
            src={preloadedAvatar}
            alt={artistData?.name || user?.name}
            className="w-8 h-8 rounded-full object-cover"
            onError={(e) => {
              if (e.target.src !== '/images/default-avatar.png') {
                e.target.src = '/images/default-avatar.png';
              }
            }}
          />
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-80 bg-white z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header do Menu */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={preloadedAvatar}
              alt={artistData?.name || user?.name}
              className="w-12 h-12 rounded-full object-cover"
              onError={(e) => {
                if (e.target.src !== '/images/default-avatar.png') {
                  e.target.src = '/images/default-avatar.png';
                }
              }}
            />
            <div>
              <div className="flex items-center gap-1">
                <p className="font-semibold text-gray-900">{user?.name}</p>
                {artistData?.is_verified && (
                  <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-500">Artista</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="py-4 overflow-y-auto h-[calc(100%-140px)]">
          {menuItems.map((section, sectionIndex) => (
            <div key={sectionIndex} className="px-4 mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{section.section}</p>
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={itemIndex}
                    to={item.path}
                    className={`flex items-center justify-between gap-3 px-3 py-3 rounded-lg mb-1 ${
                      isActive(item.path)
                        ? 'text-red-600 bg-red-50'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-4 border-t border-gray-200 bg-white">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair da conta</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default ArtistMobileMenu;
