import React from 'react';
import { Heart, Plus, BadgeCheck, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { toast } from '../hooks/use-toast';
import { useMusicFavorite } from '../hooks/use-music-favorite';
import { useAuth } from '../context/AuthContext';

export const FavoriteSongCard = ({ 
  song, 
  onRemove,
  onPlay
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useMusicFavorite(song?.id);

  const handleRemove = async (e) => {
    e.stopPropagation();
    await onRemove?.(song.song_id || song.songId);
  };

  const handlePlaySong = (e) => {
    e.stopPropagation();
    onPlay?.(song);
  };

  const handleNavigateToArtist = (e) => {
    e.stopPropagation();
    const artistSlug = song.songs?.artist?.slug || song.songs?.artist_id;
    navigate(`/${artistSlug}`);
  };

  const handleAddToPlaylist = (e) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: 'Login Necessário',
        description: 'Faça login para adicionar à playlist'
      });
      return;
    }

    // Play the song after adding to playlist
    onPlay?.(song);
  };

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 hover:bg-gray-100 transition-colors rounded-md mb-2 group cursor-pointer"
    >
      {/* Capa */}
      <img
        src={song.songs?.cover_url || '/placeholder-album.jpg'}
        alt={song.songs?.title}
        className="w-16 h-16 rounded object-cover flex-shrink-0 cursor-pointer"
        onClick={handlePlaySong}
      />
      
      {/* Informações */}
      <div className="flex-1 min-w-0">
        <p 
          className="text-red-600 font-semibold truncate text-sm cursor-pointer hover:text-red-700"
          onClick={handlePlaySong}
        >
          {song.songs?.title}
        </p>
        <div className="flex items-center gap-1 cursor-pointer" onClick={handleNavigateToArtist}>
          <p className="text-gray-600 text-sm truncate hover:text-gray-900">
            {song.songs?.artist_name}
          </p>
          {song.songs?.artist?.is_verified && (
            <BadgeCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 hover:text-blue-600" />
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="transition-all hover:scale-110 p-2"
          title="Favorito"
        >
          <Heart className="w-5 h-5 fill-red-600 text-red-600" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="transition-all hover:scale-110 p-2"
          onClick={handleAddToPlaylist}
          title="Adicionar à playlist"
        >
          <Plus className="w-5 h-5 text-gray-700" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="transition-all hover:scale-110 p-2"
          onClick={handleNavigateToArtist}
          title="Perfil do artista"
        >
          <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="transition-all hover:scale-110 p-2 opacity-0 group-hover:opacity-100"
          onClick={handleRemove}
          title="Remover dos favoritos"
        >
          <Trash2 className="w-5 h-5 text-gray-700" />
        </Button>
      </div>
    </div>
  );
};

export default FavoriteSongCard;
