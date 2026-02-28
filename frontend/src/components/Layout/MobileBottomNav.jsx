import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Download, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MobileBottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const navItems = [
        {
            path: '/',
            label: 'Home',
            icon: Home,
        },
        {
            path: '/search',
            label: 'Buscar',
            icon: Search,
        },
        {
            path: '/library',
            label: 'Biblioteca',
            icon: Download,
            protected: true,
        },
        {
            path: user ? (user.artistSlug ? `/${user.artistSlug}` : '/artist/dashboard') : '/login',
            label: 'Perfil',
            icon: User,
        },
    ];

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
            <div className="flex justify-around items-center h-14">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    // Se está protegida e user não existe, não mostrar
                    if (item.protected && !user) {
                        return null;
                    }

                    const active = isActive(item.path);

                    return (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center justify-center gap-0.5 py-2 px-4 flex-1 transition-colors ${
                                active
                                    ? 'text-red-600'
                                    : 'text-gray-500'
                            }`}
                        >
                            <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 1.8} />
                            <span className="text-[10px] font-semibold">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileBottomNav;
