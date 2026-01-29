import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Disc, ListMusic, Check, Trash2, Users, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { toast } from '../../hooks/use-toast';

const NotificationDropdown = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
   const [unreadCount, setUnreadCount] = useState(0);
   const [loading, setLoading] = useState(false);
   const [collaborationModal, setCollaborationModal] = useState(null);
   const [processingCollab, setProcessingCollab] = useState(false);
   const [dropdownOpen, setDropdownOpen] = useState(false);

   const handleDropdownOpenChange = (open) => {
     setDropdownOpen(open);
     if (open) {
       const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
       document.body.style.overflow = 'hidden';
       document.body.style.paddingRight = scrollbarWidth + 'px';
     } else {
       document.body.style.overflow = 'auto';
       document.body.style.paddingRight = '0px';
     }
   };

  const loadNotifications = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (!error && data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();

    // Subscribe to real-time notifications
    if (user?.id) {
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            setNotifications(prev => [payload.new, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  const markAsRead = async (notificationId) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = async (notificationId) => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'new_album':
        return <Disc className="w-5 h-5 text-red-500" />;
      case 'new_playlist':
        return <ListMusic className="w-5 h-5 text-blue-500" />;
      case 'collaboration_invite':
        return <Users className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('pt-BR');
  };

  const handleCollaborationClick = (notification) => {
    if (notification.type === 'collaboration_invite') {
      setCollaborationModal(notification);
      setDropdownOpen(false);
      markAsRead(notification.id);
      document.body.style.overflow = 'hidden';
    }
  };

  const handleAcceptCollaboration = async () => {
    if (!collaborationModal || !user) return;
    setProcessingCollab(true);

    try {
      console.log('Aceitando colaboração:', collaborationModal);
      
      // Se não tiver album_id na notificação, buscar pelo artista que convidou
      let albumId = collaborationModal.album_id;
      
      if (!albumId && collaborationModal.artist_id) {
        // Buscar convite pendente do artista
        const { data: invite } = await supabase
          .from('collaboration_invites')
          .select('album_id')
          .eq('invited_user_id', user.id)
          .eq('invited_by_user_id', collaborationModal.artist_id)
          .eq('status', 'pending')
          .single();
        
        if (invite) {
          albumId = invite.album_id;
        }
      }
      
      if (!albumId) {
        throw new Error('Não foi possível identificar o álbum');
      }
      
      // 1. Atualizar status do convite para accepted
      const { data: updateData, error: updateError } = await supabase
        .from('collaboration_invites')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('album_id', albumId)
        .eq('invited_user_id', user.id)
        .select();

      console.log('Update result:', updateData, updateError);
      
      if (updateError) throw updateError;

      // 2. Buscar dados do álbum
      const { data: album } = await supabase
        .from('albums')
        .select('*, artist:artists(name, slug)')
        .eq('id', albumId)
        .single();

      // 3. Notificar seguidores do colaborador
      const { data: followers } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('artist_id', user.id);

      if (followers && followers.length > 0 && album) {
        const notifications = followers.map(f => ({
          user_id: f.follower_id,
          type: 'new_album',
          title: `Novo álbum de ${user.name || 'artista'}`,
          message: `${user.name || 'Um artista que você segue'} participou do álbum "${album.title}"`,
          image_url: album.cover_url,
          link: `/${user.slug || user.id}/${album.slug || album.id}`,
          artist_id: user.id,
          album_id: album.id,
          is_read: false
        }));

        await supabase.from('notifications').insert(notifications);
      }

      toast({
        title: 'Colaboração aceita!',
        description: 'O álbum agora aparece no seu perfil'
      });

      // Remover a notificação de convite
      deleteNotification(collaborationModal.id);
      setCollaborationModal(null);
      document.body.style.overflow = 'auto';

    } catch (error) {
      console.error('Erro ao aceitar colaboração:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aceitar a colaboração',
        variant: 'destructive'
      });
    } finally {
      setProcessingCollab(false);
    }
  };

  const handleRejectCollaboration = async () => {
    if (!collaborationModal || !user) return;
    setProcessingCollab(true);

    try {
      // Se não tiver album_id na notificação, buscar pelo artista que convidou
      let albumId = collaborationModal.album_id;
      
      if (!albumId && collaborationModal.artist_id) {
        const { data: invite } = await supabase
          .from('collaboration_invites')
          .select('album_id')
          .eq('invited_user_id', user.id)
          .eq('invited_by_user_id', collaborationModal.artist_id)
          .eq('status', 'pending')
          .single();
        
        if (invite) {
          albumId = invite.album_id;
        }
      }
      
      // Atualizar status do convite para rejected
      await supabase
        .from('collaboration_invites')
        .update({ status: 'rejected', responded_at: new Date().toISOString() })
        .eq('album_id', albumId)
        .eq('invited_user_id', user.id);

      toast({
        title: 'Convite recusado',
        description: 'Você recusou a colaboração'
      });

      deleteNotification(collaborationModal.id);
      setCollaborationModal(null);
      document.body.style.overflow = 'auto';

      } catch (error) {
      console.error('Erro ao recusar colaboração:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível recusar a colaboração',
        variant: 'destructive'
      });
    } finally {
      setProcessingCollab(false);
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={handleDropdownOpenChange}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 text-white hover:bg-white/20 rounded-full transition-colors">
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white w-80 max-h-96 overflow-y-auto" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-900">Notificações</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              Marcar todas como lidas
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-4 text-center text-gray-500">Carregando...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Nenhuma notificação</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer ${
                  !notification.is_read ? 'bg-red-50' : ''
                }`}
                onClick={() => {
                  if (notification.type === 'collaboration_invite') {
                    handleCollaborationClick(notification);
                  }
                }}
              >
                {notification.type === 'collaboration_invite' ? (
                  <div className="flex-shrink-0">
                    {notification.image_url ? (
                      <img
                        src={notification.image_url}
                        alt=""
                        className="w-12 h-12 rounded object-cover hover:opacity-80 transition-opacity"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-red-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-red-500" />
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={notification.link || '#'}
                    onClick={() => markAsRead(notification.id)}
                    className="flex-shrink-0"
                  >
                    {notification.image_url ? (
                      <img
                        src={notification.image_url}
                        alt=""
                        className="w-12 h-12 rounded object-cover hover:opacity-80 transition-opacity"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                        {getIcon(notification.type)}
                      </div>
                    )}
                  </Link>
                )}
                <div className="flex-1 min-w-0">
                  {notification.type === 'collaboration_invite' ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-red-600 mt-1 font-medium">
                        Clique para responder
                      </p>
                    </div>
                  ) : (
                    <Link
                      to={notification.link || '#'}
                      onClick={() => markAsRead(notification.id)}
                      className="block"
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(notification.created_at)}
                      </p>
                    </Link>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>

      {/* Modal de Convite de Colaboração */}
      {collaborationModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Convite de Colaboração
              </h3>
              <button
                 onClick={() => {
                   setCollaborationModal(null);
                   document.body.style.overflow = 'auto';
                 }}
                 className="text-white/80 hover:text-white"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="p-6">
              {collaborationModal.image_url && (
                <img
                  src={collaborationModal.image_url}
                  alt="Capa do álbum"
                  className="w-32 h-32 rounded-lg object-cover mx-auto mb-4 shadow-lg"
                />
              )}
              
              <h4 className="text-xl font-bold text-gray-900 text-center mb-2">
                {collaborationModal.title}
              </h4>
              <p className="text-gray-600 text-center mb-6">
                {collaborationModal.message}
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-500 text-center">
                  Ao aceitar, este álbum aparecerá no seu perfil e seus seguidores serão notificados.
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleRejectCollaboration}
                  disabled={processingCollab}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  {processingCollab ? 'Processando...' : 'Recusar'}
                </Button>
                <Button
                  onClick={handleAcceptCollaboration}
                  disabled={processingCollab}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {processingCollab ? 'Processando...' : 'Aceitar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DropdownMenu>
  );
};

export default NotificationDropdown;
