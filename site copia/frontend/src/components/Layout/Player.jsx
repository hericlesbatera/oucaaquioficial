import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, VolumeX, Download, Heart, List, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { Slider } from '../ui/slider';
import { Button } from '../ui/button';
import { toast } from '../../hooks/use-toast';
import { formatDuration } from '../../mock';

const Player = () => {
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
    clearQueue,
    playSong
  } = usePlayer();

  const { isPremium } = useAuth();
  const [showQueue, setShowQueue] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  if (!currentSong) return null;

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

  const handleDownload = async () => {
    if (!currentSong?.audioUrl) {
      toast({
        title: 'Download Indisponível',
        description: 'Arquivo não disponível',
        variant: 'destructive'
      });
      return;
    }
    
    toast({
      title: 'Download Iniciado',
      description: `Baixando ${currentSong.title}...`
    });
    
    try {
      const response = await fetch(currentSong.audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentSong.title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Erro no Download',
        description: 'Não foi possível baixar o arquivo',
        variant: 'destructive'
      });
    }
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast({
      title: isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos',
      description: currentSong.title
    });
  };

  const handleClearQueue = () => {
    clearQueue();
    setShowQueue(false);
    toast({
      title: 'Fila limpa',
      description: 'Todas as músicas foram removidas da fila'
    });
  };

  const handlePlayFromQueue = (song) => {
    playSong(song, queue);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 shadow-2xl transition-all ${showQueue ? 'h-auto' : ''}`}>
      {/* Main Player */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 border-t border-white/20 px-4 py-2">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            {/* Song Info - Clickable to show queue */}
            <div 
              className="flex items-center gap-3 w-72 cursor-pointer group"
              onClick={() => setShowQueue(!showQueue)}
            >
              <div className="relative">
                <img
                  src={currentSong.coverImage}
                  alt={currentSong.title}
                  className="w-11 h-11 rounded object-cover shadow-lg"
                />
                <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {showQueue ? (
                    <ChevronDown className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronUp className="w-5 h-5 text-white" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{currentSong.title}</p>
                <p className="text-white/80 text-xs truncate">{currentSong.artistName}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFavorite();
                }}
                className="hover:bg-white/20 h-8 w-8"
              >
                <Heart
                  className={`w-4 h-4 ${
                    isFavorite ? 'fill-white text-white' : 'text-white'
                  }`}
                />
              </Button>
            </div>

            {/* Player Controls */}
            <div className="flex-1 max-w-2xl">
              <div className="flex items-center justify-center gap-3 mb-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleShuffle}
                  className={`hover:bg-white/20 h-8 w-8 ${
                    isShuffle ? 'text-white' : 'text-white/60'
                  }`}
                >
                  <Shuffle className="w-3.5 h-3.5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevious}
                  className="text-white hover:bg-white/20 h-8 w-8"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>

                <Button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 text-red-600 shadow-lg"
                >
                  {isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5 ml-0.5" fill="currentColor" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  className="text-white hover:bg-white/20 h-8 w-8"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleRepeat}
                  className={`hover:bg-white/20 h-8 w-8 ${
                    repeatMode !== 'off' ? 'text-white' : 'text-white/60'
                  }`}
                >
                  <Repeat className="w-3.5 h-3.5" />
                  {repeatMode === 'one' && (
                    <span className="absolute text-xs font-bold">1</span>
                  )}
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-white font-medium w-10 text-right">
                  {formatDuration(Math.floor(currentTime))}
                </span>
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={(value) => seekTo(value[0])}
                  className="flex-1"
                />
                <span className="text-xs text-white font-medium w-10">
                  {formatDuration(Math.floor(duration))}
                </span>
              </div>
            </div>

            {/* Additional Controls */}
            <div className="flex items-center gap-2 w-72 justify-end">
              <Button
                variant="ghost"
                onClick={handleDownload}
                className="text-white hover:bg-white/20 border border-white/30 px-3 h-8 text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                BAIXAR
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQueue(!showQueue)}
                className={`text-white hover:bg-white/20 h-8 w-8 ${showQueue ? 'bg-white/20' : ''}`}
              >
                <List className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-white hover:bg-white/20 h-8 w-8"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>

              <Slider
                value={[volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Queue Panel - Below Player */}
      {showQueue && (
        <div className="bg-zinc-900 border-t border-zinc-800">
          <div className="max-w-screen-2xl mx-auto">
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
              <div>
                <h3 className="text-white font-semibold text-sm">Fila de Reprodução</h3>
                <p className="text-gray-400 text-xs">{queue.length} músicas</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearQueue}
                className="text-gray-400 hover:text-white hover:bg-zinc-800 h-8 px-3"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar fila
              </Button>
            </div>
            <div className="overflow-x-auto overflow-y-hidden px-4 py-3">
              <div className="flex gap-3">
                {queue.map((song, index) => (
                  <div
                    key={song.id}
                    onClick={() => handlePlayFromQueue(song)}
                    className={`flex-shrink-0 flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all min-w-[220px] ${
                      currentSong.id === song.id 
                        ? 'bg-red-600/30 ring-1 ring-red-500' 
                        : 'hover:bg-zinc-800'
                    }`}
                  >
                    <img 
                      src={song.coverImage} 
                      alt={song.title}
                      className="w-14 h-14 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{song.title}</p>
                      <p className="text-gray-400 text-xs truncate">{song.artistName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Player;
