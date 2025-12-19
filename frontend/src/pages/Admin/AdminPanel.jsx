import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { LogOut, Image, Music, Star, Bell, MessageSquare, BarChart3, Settings, AlertCircle } from 'lucide-react';
import { toast } from '../../hooks/use-toast';

// Componentes Admin
import SlidesManager from './SlidesManager';
import AlbumsManager from './AlbumsManager';
import RecommendedAlbumsManager from './RecommendedAlbumsManager';
import SupportInbox from './SupportInbox';
import PopupManager from './PopupManager';
import SiteStatistics from './SiteStatistics';
import AdminSettings from './AdminSettings';
import ReportsManager from './ReportsManager';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('slides');
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user?.id) {
      navigate('/login');
      return;
    }

    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setIsAdmin(true);
      setAdminData(data);
    } else {
      toast({
        title: 'Acesso Negado',
        description: 'Você não tem permissão de administrador',
        variant: 'destructive'
      });
      navigate('/');
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const menuItems = [
    { id: 'slides', label: 'Hero Slider', icon: Image },
    { id: 'albums', label: 'Gerenciar Álbuns', icon: Music },
    { id: 'recommended', label: 'Recomendados', icon: Star },
    { id: 'popup', label: 'Pop-up Home', icon: Bell },
    { id: 'support', label: 'Suporte', icon: MessageSquare },
    { id: 'reports', label: 'Denúncias de Conteúdo', icon: AlertCircle },
    { id: 'statistics', label: 'Estatísticas', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'slides':
        return <SlidesManager />;
      case 'albums':
        return <AlbumsManager />;
      case 'recommended':
        return <RecommendedAlbumsManager />;
      case 'popup':
        return <PopupManager />;
      case 'support':
        return <SupportInbox />;
      case 'reports':
        return <ReportsManager />;
      case 'statistics':
        return <SiteStatistics />;
      case 'settings':
        return <AdminSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
          {/* Profile Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start gap-3">
              <img 
                src={user?.user_metadata?.avatar_url || adminData?.avatar_url || adminData?.photo || 'https://via.placeholder.com/48'} 
                alt="Admin"
                className="w-12 h-12 rounded-full object-cover bg-gray-200"
                onError={(e) => e.target.src = 'https://via.placeholder.com/48'}
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{user?.user_metadata?.name || adminData?.name || 'Admin'}</h3>
                <p className="text-xs text-gray-500">Ouça Aqui</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-1 flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    activeTab === item.id
                      ? 'bg-red-50 text-red-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Logout Button */}
          <div className="absolute bottom-6 left-6 w-52">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
