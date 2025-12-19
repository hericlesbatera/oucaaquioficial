import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Disc, ListMusic, Check, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';

const NotificationDropdown = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

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

  if (!user) return null;

  return (
    <DropdownMenu modal={false}>
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
                className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 ${
                  !notification.is_read ? 'bg-red-50' : ''
                }`}
              >
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
                <div className="flex-1 min-w-0">
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
                </div>
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
