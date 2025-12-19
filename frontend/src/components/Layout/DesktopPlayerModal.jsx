import React, { useState, useEffect } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, VolumeX, Heart } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { useDownloadManager } from '../../hooks/useDownloadManager';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { formatDuration } from '../../mock';
import { useMusicFavorite } from '../../hooks/use-music-favorite';

const DesktopPlayerModal = ({ isOpen, onClose }) => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isShuffle,
    repeatMode,
    togglePlay,
    handleNext,
    handlePrevious,
    seekTo,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    queue,
  } = usePlayer();

  const { isFavorite, toggleFavorite } = useMusicFavorite(currentSong?.id);
  const { user } = useAuth();
  const { getDownloadedAlbumCover } = useDownloadManager();

  const [isMuted, setIsMuted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [offlineCoverUrl, setOfflineCoverUrl] = useState(null);

  // Carregar capa do offline se disponível
  useEffect(() => {
    const loadOfflineCover = async () => {
      if (currentSong?.offline && currentSong?.albumId) {
        const coverUrl = await getDownloadedAlbumCover(currentSong.albumId);
        setOfflineCoverUrl(coverUrl);
      } else {
        setOfflineCoverUrl(null);
      }
    };
    loadOfflineCover();
  }, [currentSong?.albumId, currentSong?.offline, getDownloadedAlbumCover]);

  if (!isOpen || !currentSong) return null;

  const handleVolumeChange = (value) => {
    setVolume(value[0]);
    setIsMuted(value[0] === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(0.7);
      setIsMuted(false);
    } else {
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleFavorite = async () => {
    if (user) {
      await toggleFavorite();
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="hidden md:flex fixed inset-0 bg-black z-50 flex-col">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
        title="Fechar"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="text-center max-w-xl">
          {/* Album Art */}
          <div className="mb-8 flex justify-center">
            <img
              src={imageError ? '/images/default-album.png' : (offlineCoverUrl || currentSong.coverImage)}
              alt={currentSong.title}
              className="w-64 h-64 rounded-2xl shadow-2xl object-cover"
              onError={() => setImageError(true)}
            />
          </div>

          {/* Song Info */}
          <h1 className="text-5xl font-bold text-white mb-2 line-clamp-2">
            {currentSong.title?.replace(/\.mp3$/i, '') || ''}
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            {currentSong.artistName}
          </p>

          {/* Progress Bar */}
          <div className="mb-8">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={(value) => seekTo(value[0])}
              className="w-full mb-2"
            />
            <div className="flex justify-between text-sm text-gray-400">
              <span>{formatDuration(Math.floor(currentTime))}</span>
              <span>{formatDuration(Math.floor(duration))}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleShuffle}
              className={`h-10 w-10 rounded-full transition-colors ${
                isShuffle ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Shuffle className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="h-10 w-10 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
            >
              <SkipBack className="w-5 h-5" />
            </Button>

            <Button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 text-black shadow-lg flex items-center justify-center"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7" fill="currentColor" />
              ) : (
                <Play className="w-7 h-7 ml-1" fill="currentColor" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="h-10 w-10 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
            >
              <SkipForward className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleRepeat}
              className={`h-10 w-10 rounded-full transition-colors relative ${
                repeatMode !== 'off' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Repeat className="w-5 h-5" />
              {repeatMode === 'one' && (
                <span className="absolute text-xs font-bold">1</span>
              )}
            </Button>
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFavorite}
              className="text-gray-400 hover:text-red-600 h-10 w-10"
            >
              <Heart
                className="w-5 h-5"
                fill={isFavorite ? 'currentColor' : 'none'}
                strokeWidth={isFavorite ? 0 : 2}
              />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="text-gray-400 hover:text-white h-10 w-10"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>

            <div className="w-24">
              <Slider
                value={[volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Queue Info */}
          {queue.length > 0 && (
            <div className="mt-12 text-gray-400 text-sm">
              <p>{queue.length} músicas na fila</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesktopPlayerModal;
