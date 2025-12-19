import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export const useTrackPageView = (pageName) => {
  const { user } = useAuth();

  useEffect(() => {
    const trackView = async () => {
      try {
        await supabase.from('page_visits').insert({
          page_name: pageName || window.location.pathname,
          user_id: user?.id || null,
          user_agent: navigator.userAgent,
          ip_address: null
        });
      } catch (error) {
        console.log('Erro ao registrar visita:', error.message);
      }
    };

    trackView();
  }, [pageName, user?.id]);
};
