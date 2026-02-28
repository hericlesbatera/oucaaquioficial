import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import IconHome from '../../assets/icons/icon-home.svg';
import IconArtistasDestaque from '../../assets/icons/icon-artistas-destaque.svg';
import IconLancamentos from '../../assets/icons/icon-lancamentos.svg';

const MobileBottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const navItems = [
        {
            path: '/',
            label: 'Home',
            svgIcon: IconHome,
        },
        {
            path: '/lancamentos',
            label: 'Lançamentos',
            svgIcon: IconLancamentos,
        },
        {
            path: '/search',
            label: 'Buscar',
            lucideIcon: Search,
        },
        {
            path: user ? (user.artistSlug ? `/${user.artistSlug}` : '/artist/dashboard') : '/login',
            label: 'Perfil',
            svgIcon: IconArtistasDestaque,
        },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
            <div className="flex justify-around items-center h-14">
                {navItems.map((item) => {
                    // Se está protegida e user não existe, não mostrar
                    if (item.protected && !user) {
                        return null;
                    }

                    const active = isActive(item.path);
                    const colorClass = active ? '' : 'text-gray-500';

                    return (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 flex-1 transition-colors ${colorClass}`}
                            style={active ? { color: '#E53935' } : {}}
                        >
                            {item.svgIcon ? (
                                <img
                                    src={item.svgIcon}
                                    alt={item.label}
                                    className="w-6 h-6"
                                    style={{
                                        filter: active
                                            ? 'invert(20%) sepia(90%) saturate(5000%) hue-rotate(350deg) brightness(95%) contrast(110%)'
                                            : 'invert(60%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(80%) contrast(90%)',
                                    }}
                                />
                            ) : (
                                <item.lucideIcon className="w-6 h-6" strokeWidth={active ? 2.5 : 1.8} />
                            )}
                            <span className="text-[10px] font-semibold">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileBottomNav;
