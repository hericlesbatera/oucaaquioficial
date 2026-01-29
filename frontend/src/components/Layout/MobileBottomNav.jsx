import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Music, TrendingUp, Search, Library } from 'lucide-react';
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
            path: '/lancamentos',
            label: 'Lançamentos',
            icon: Music,
        },
        {
            path: '/top-cds',
            label: 'Tops',
            icon: TrendingUp,
        },
        {
            path: '/library',
            label: 'Biblioteca',
            icon: Library,
            protected: true,
        },
        {
            path: '/search',
            label: 'Busca',
            icon: Search,
        },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40">
            <div className="flex justify-around items-center">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    // Se está protegida e user não existe, não mostrar
                    if (item.protected && !user) {
                        return null;
                    }

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center gap-1 py-3 px-4 flex-1 transition-colors ${
                                isActive(item.path)
                                    ? 'text-red-600'
                                    : 'text-gray-600 hover:text-red-600'
                            }`}
                        >
                            <Icon className="w-6 h-6" />
                            <span className="text-xs font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileBottomNav;
