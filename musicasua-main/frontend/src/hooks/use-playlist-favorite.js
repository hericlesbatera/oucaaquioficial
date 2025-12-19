import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export const usePlaylistFavorite = (playlistId) => {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if playlist is favorited
  useEffect(() => {
    if (!user?.id || !playlistId) {
      setIsFavorite(false);
      return;
    }

    checkFavorite();
  }, [user?.id, playlistId]);

  const checkFavorite = async () => {
    try {
      const { data } = await supabase
        .from('playlist_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('playlist_id', playlistId)
        .single();

      setIsFavorite(!!data);
    } catch (error) {
      setIsFavorite(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user?.id || !playlistId) return;

    try {
      setLoading(true);

      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('playlist_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('playlist_id', playlistId);

        if (error) throw error;
        setIsFavorite(false);
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('playlist_favorites')
          .insert({
            user_id: user.id,
            playlist_id: playlistId,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling playlist favorite:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { isFavorite, toggleFavorite, loading };
};
