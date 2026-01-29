import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useTrackPageView } from '../hooks/useTrackPageView';
import { Heart, Play } from 'lucide-react';
import { Button } from '../components/ui/button';
import { usePlayer } from '../context/PlayerContext';
import { toast } from '../hooks/use-toast';

const Favorites = () => {
  useTrackPageView('favorites');
  const { user } = useAuth();
  const { playSong } = usePlayer();
  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;
      setLoading(true);
      // Buscar músicas favoritas do backend
      const { data, error } = await supabase
        .from('favorites')
        .select('*, song:songs(*)')
        .eq('userId', user.id);
      if (error) {
        toast({ title: 'Erro', description: 'Não foi possível carregar favoritos', variant: 'destructive' });
      } else {
        setFavoriteSongs(data.map(fav => fav.song));
      }
      setLoading(false);
    };
    fetchFavorites();
  }, [user]);

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Faça login para ver seus favoritos.</div>;
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2 text-black">
          <Heart className="w-7 h-7 text-red-600" /> Favoritos
        </h1>
        {loading ? (
          <div className="text-gray-500">Carregando...</div>
        ) : favoriteSongs.length === 0 ? (
          <div className="text-gray-500">Nenhuma música favoritada ainda.</div>
        ) : (
          <div className="space-y-4">
            {favoriteSongs.map(song => (
              <div key={song.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg shadow-sm">
                <Button onClick={() => playSong(song)} className="bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center">
                  <Play className="w-5 h-5" />
                </Button>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-black truncate">{song.title}</p>
                  <p className="text-sm text-gray-500 truncate">{song.artistName}</p>
                </div>
                <Heart className="w-6 h-6 text-red-600" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
