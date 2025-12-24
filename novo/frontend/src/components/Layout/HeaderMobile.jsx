import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../AuthModal';
import { supabase } from '../../lib/supabaseClient';
import { User, Upload, Music, ListMusic, Heart, Video, Settings, Mail, MessageCircle, LogOut } from 'lucide-react';

const HeaderMobile = () => {
    const { user, logout, isArtist } = useAuth();
    const navigate = useNavigate();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [artistAvatar, setArtistAvatar] = useState(null);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        const loadArtistAvatar = async () => {
            if (user?.id && isArtist) {
                try {
                    const { data: supabaseArtist } = await supabase
                        .from('artists')
                        .select('id, avatar_url')
                        .eq('id', user.id)
                        .maybeSingle();

                    if (supabaseArtist?.avatar_url) {
                        setArtistAvatar(supabaseArtist.avatar_url);
                    }
                } catch (error) {
                    console.error('Erro ao carregar avatar do artista:', error);
                }
            }
        };

        loadArtistAvatar();
    }, [user?.id, isArtist]);

    const handleNavigate = (path) => {
        navigate(path);
        setShowMenu(false);
    };

    return (
        <>
            <header className="bg-red-600 shadow-lg sticky top-0 z-50 md:hidden">
                <div className="px-4 h-16 flex items-center justify-between md:hidden">
                    {/* Logo */}
                    <Link to="/" className="flex items-center flex-shrink-0">
                        <img src="/images/Logo-escutai.png" alt="Escutaí" className="max-h-10 w-auto" />
                    </Link>

                    {/* Login Button */}
                    <div className="relative">
                        {user ? (
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="w-10 h-10 rounded-full overflow-hidden border-2 border-white hover:opacity-80 transition-opacity flex-shrink-0"
                                title={user.name}
                            >
                                <img 
                                    src={artistAvatar || user.avatar} 
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        if (e.target.src !== '/images/default-avatar.png') {
                                            e.target.src = '/images/default-avatar.png';
                                        }
                                    }}
                                />
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="flex items-center gap-2 text-white font-medium text-sm hover:opacity-80 transition-opacity"
                            >
                                ENTRAR
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="text-white w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M416 448h-84c-6.6 0-12-5.4-12-12v-40c0-6.6 5.4-12 12-12h84c17.7 0 32-14.3 32-32V160c0-17.7-14.3-32-32-32h-84c-6.6 0-12-5.4-12-12V76c0-6.6 5.4-12 12-12h84c53 0 96 43 96 96v192c0 53-43 96-96 96zm-47-201L201 79c-15-15-41-4.5-41 17v96H24c-13.3 0-24 10.7-24 24v96c0 13.3 10.7 24 24 24h136v96c0 21.5 26 32 41 17l168-168c9.3-9.4 9.3-24.6 0-34z"></path>
                                </svg>
                            </button>
                        )}

                        {/* Dropdown Menu */}
                        {showMenu && user && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 max-h-[80vh] overflow-y-auto">
                                {/* Meu Perfil */}
                                <div className="p-4 border-b border-gray-200">
                                    <button
                                        onClick={() => handleNavigate(isArtist ? '/artist/dashboard' : '/user/panel')}
                                        className="flex items-center gap-3 text-gray-700 hover:text-red-600 w-full"
                                    >
                                        <User className="w-5 h-5" />
                                        <span className="font-semibold">Meu Perfil</span>
                                    </button>
                                </div>

                                {/* ADICIONAR */}
                                {isArtist && (
                                    <div className="px-4 py-3 border-b border-gray-200">
                                        <p className="text-xs text-gray-500 font-semibold mb-2">ADICIONAR</p>
                                        <button
                                            onClick={() => handleNavigate('/artist/upload')}
                                            className="flex items-center gap-3 text-gray-700 hover:text-red-600 w-full py-2"
                                        >
                                            <Upload className="w-5 h-5" />
                                            <span>Novo Upload</span>
                                        </button>
                                    </div>
                                )}

                                {/* EDITAR PERFIL */}
                                <div className="px-4 py-3 border-b border-gray-200">
                                    <p className="text-xs text-gray-500 font-semibold mb-2">EDITAR PERFIL</p>
                                    <div className="space-y-2">
                                        {isArtist ? (
                                            <>
                                                <button
                                                    onClick={() => handleNavigate('/artist/albums')}
                                                    className="flex items-center gap-3 text-gray-700 hover:text-red-600 w-full py-1 text-sm"
                                                >
                                                    <Music className="w-5 h-5" />
                                                    <span>CDS/SINGLES</span>
                                                </button>
                                                <button
                                                    onClick={() => handleNavigate('/artist/playlists')}
                                                    className="flex items-center gap-3 text-gray-700 hover:text-red-600 w-full py-1 text-sm"
                                                >
                                                    <ListMusic className="w-5 h-5" />
                                                    <span>Minhas Playlists</span>
                                                </button>
                                                <button
                                                    onClick={() => handleNavigate('/artist/favoritos')}
                                                    className="flex items-center gap-3 text-gray-700 hover:text-red-600 w-full py-1 text-sm"
                                                >
                                                    <Heart className="w-5 h-5" />
                                                    <span>Favoritos</span>
                                                </button>
                                                <button
                                                    onClick={() => handleNavigate('/artist/meus-videos')}
                                                    className="flex items-center gap-3 text-gray-700 hover:text-red-600 w-full py-1 text-sm"
                                                >
                                                    <Video className="w-5 h-5" />
                                                    <span>Meus Vídeos</span>
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleNavigate('/playlists')}
                                                    className="flex items-center gap-3 text-gray-700 hover:text-red-600 w-full py-1 text-sm"
                                                >
                                                    <ListMusic className="w-5 h-5" />
                                                    <span>Minhas Playlists</span>
                                                </button>
                                                <button
                                                    onClick={() => handleNavigate('/favorites')}
                                                    className="flex items-center gap-3 text-gray-700 hover:text-red-600 w-full py-1 text-sm"
                                                >
                                                    <Heart className="w-5 h-5" />
                                                    <span>Favoritos</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* COMUNICAÇÃO */}
                                {isArtist && (
                                    <div className="px-4 py-3 border-b border-gray-200">
                                        <p className="text-xs text-gray-500 font-semibold mb-2">COMUNICAÇÃO</p>
                                        <button
                                            onClick={() => handleNavigate('/artist/support')}
                                            className="flex items-center gap-3 text-gray-700 hover:text-red-600 w-full py-1 text-sm"
                                        >
                                            <MessageCircle className="w-5 h-5" />
                                            <span>Suporte</span>
                                        </button>
                                    </div>
                                )}

                                {/* DASHBOARD */}
                                <div className="px-4 py-3 border-b border-gray-200">
                                    <p className="text-xs text-gray-500 font-semibold mb-2">DASHBOARD</p>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => handleNavigate(isArtist ? '/artist/settings' : '/user/panel')}
                                            className="flex items-center gap-3 text-gray-700 hover:text-red-600 w-full py-1 text-sm"
                                        >
                                            <Settings className="w-5 h-5" />
                                            <span>Configurações</span>
                                        </button>
                                        <button
                                            onClick={() => handleNavigate(isArtist ? '/artist/email-senha' : '/user/panel')}
                                            className="flex items-center gap-3 text-gray-700 hover:text-red-600 w-full py-1 text-sm"
                                        >
                                            <Mail className="w-5 h-5" />
                                            <span>Email e senha</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Sair */}
                                <div className="p-4">
                                    <button
                                        onClick={() => {
                                            logout();
                                            setShowMenu(false);
                                        }}
                                        className="flex items-center gap-3 text-red-600 hover:text-red-700 w-full font-semibold"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        <span>Sair</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Auth Modal */}
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </>
    );
};

export default HeaderMobile;
