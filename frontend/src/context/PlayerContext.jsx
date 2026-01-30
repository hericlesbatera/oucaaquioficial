import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { mockSongs } from '../mock';
import { supabase } from '../lib/supabaseClient';
import { recordSongPlay } from '../lib/statsHelper';

const PlayerContext = createContext();

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
};

export const PlayerProvider = ({ children }) => {
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [queue, setQueue] = useState([]);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [isShuffle, setIsShuffle] = useState(false);
    const [repeatMode, setRepeatMode] = useState('off'); // 'off', 'all', 'one'
    const [isCompactMode, setIsCompactMode] = useState(false);
    const [currentPlaylistId, setCurrentPlaylistId] = useState(null);
    const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  
  const audioRef = useRef(null);
  
  if (!audioRef.current) {
    audioRef.current = new Audio();
    audioRef.current.preload = 'auto';
    audioRef.current.crossOrigin = 'anonymous';
    // Remover qualquer elemento de áudio do DOM se existir
    const existingAudio = document.getElementById('hidden-audio-player');
    if (existingAudio) {
      existingAudio.remove();
    }
  }
  
  const handleNextRef = useRef(null);
  const handlePreviousRef = useRef(null);

  const handleNext = useCallback(() => {
    if (!queue.length) return;

    const currentIndex = queue.findIndex(s => s.id === currentSong?.id);
    let nextIndex;

    if (repeatMode === 'one') {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      return;
    }

    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          // Fechar o player quando chegar à última música
          setIsPlaying(false);
          setCurrentSong(null);
          setQueue([]);
          audioRef.current.pause();
          audioRef.current.src = '';
          return;
        }
      }
    }

    setCurrentSong(queue[nextIndex]);
  }, [queue, currentSong, repeatMode, isShuffle]);

  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (handleNextRef.current) {
        handleNextRef.current();
      }
    };
    const handleError = () => console.error('Erro ao carregar áudio:', audio.error);
    const handleCanPlay = () => console.log('Áudio pronto para reproduzir');

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (currentSong) {
      audioRef.current.src = currentSong.audioUrl;
      if (isPlaying) {
        audioRef.current.play().catch(err => console.error('Error playing audio:', err));
      }
    }
  }, [currentSong]);

  useEffect(() => {
     if (isPlaying) {
       audioRef.current.play().catch(err => console.error('Error playing audio:', err));
     } else {
       audioRef.current.pause();
     }
   }, [isPlaying]);

  // Media Session API - Controles de mídia do sistema (lock screen, notificação, etc)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    
    const mediaSession = navigator.mediaSession;
    
    if (currentSong) {
      const artistName = currentSong.artist_name || currentSong.artistName || currentSong.artist || 'Artista';
      const albumName = currentSong.albumName || currentSong.album || 'Álbum';
      const coverImage = currentSong.cover_url || currentSong.coverImage || currentSong.image || currentSong.artwork;
      
      mediaSession.metadata = new MediaMetadata({
        title: currentSong.title || 'Música',
        artist: artistName,
        album: albumName,
        artwork: coverImage ? [
          {
            src: coverImage,
            sizes: '512x512',
            type: 'image/jpeg'
          },
          {
            src: coverImage,
            sizes: '256x256',
            type: 'image/jpeg'
          },
          {
            src: coverImage,
            sizes: '128x128',
            type: 'image/jpeg'
          }
        ] : []
      });

      mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }

    mediaSession.setActionHandler('play', () => {
      setIsPlaying(true);
    });

    mediaSession.setActionHandler('pause', () => {
      setIsPlaying(false);
    });

    mediaSession.setActionHandler('previoustrack', () => {
      if (handlePreviousRef.current) {
        handlePreviousRef.current();
      }
    });

    mediaSession.setActionHandler('nexttrack', () => {
      if (handleNextRef.current) {
        handleNextRef.current();
      }
    });

    mediaSession.setActionHandler('seekto', (event) => {
      if (event.time !== undefined && audioRef.current) {
        audioRef.current.currentTime = event.time;
        setCurrentTime(event.time);
      }
    });
    
    // Permitir arrastar a barra para frente/trás
    mediaSession.setActionHandler('seekforward', (event) => {
      const skipTime = event.seekOffset || 10;
      if (audioRef.current) {
        audioRef.current.currentTime = Math.min(audioRef.current.currentTime + skipTime, duration);
        setCurrentTime(audioRef.current.currentTime);
      }
    });
    
    mediaSession.setActionHandler('seekbackward', (event) => {
      const skipTime = event.seekOffset || 10;
      if (audioRef.current) {
        audioRef.current.currentTime = Math.max(audioRef.current.currentTime - skipTime, 0);
        setCurrentTime(audioRef.current.currentTime);
      }
    });

    return () => {
      mediaSession.setActionHandler('play', null);
      mediaSession.setActionHandler('pause', null);
      mediaSession.setActionHandler('previoustrack', null);
      mediaSession.setActionHandler('nexttrack', null);
      mediaSession.setActionHandler('seekto', null);
      mediaSession.setActionHandler('seekforward', null);
      mediaSession.setActionHandler('seekbackward', null);
    };
  }, [currentSong, isPlaying, duration]);
  
  // Atualizar posição da barra de progresso no Media Session (tela de bloqueio)
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong || !duration) return;
    
    try {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: 1,
        position: currentTime
      });
    } catch (e) {
      // Alguns navegadores não suportam setPositionState
    }
  }, [currentTime, duration, currentSong]);

  const playSong = async (song, songQueue = [], playlistId = null) => {
   setCurrentSong(song);
   setQueue(songQueue.length > 0 ? songQueue : [song]);
   setIsPlaying(true);
   setCurrentPlaylistId(playlistId);

   // Verificar qual campo contém o ID do álbum e da música
   const albumId = song.albumId || song.album_id || song.albumid;
   const songId = song.id;
   
   if (!albumId || !songId) {
     console.error('Album ID or Song ID not found for song:', song);
     return;
   }

   // Registrar play (incrementa songs.plays, albums.play_count, playlists.play_count se aplicável, e registra na tabela plays)
   recordSongPlay(songId, albumId, playlistId);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePrevious = useCallback(() => {
    // Se já tocou mais de 3 segundos, volta ao início da música atual
    if (currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      // Garante que continue tocando
      if (!isPlaying) {
        setIsPlaying(true);
      }
      return;
    }

    if (!queue.length) return;

    const currentIndex = queue.findIndex(s => s.id === currentSong?.id);
    const prevIndex = currentIndex - 1;

    if (prevIndex < 0) {
      if (repeatMode === 'all') {
        // Vai para a última música da fila
        setCurrentSong(queue[queue.length - 1]);
        setIsPlaying(true);
      } else {
        // Volta ao início da música atual
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      }
    } else {
      // Vai para a música anterior
      setCurrentSong(queue[prevIndex]);
      setIsPlaying(true);
    }
  }, [currentTime, queue, currentSong, repeatMode, isPlaying]);

  useEffect(() => {
    handlePreviousRef.current = handlePrevious;
  }, [handlePrevious]);

  const seekTo = (time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  const toggleRepeat = () => {
    const modes = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeatMode(modes[nextIndex]);
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentSong(null);
    setIsPlaying(false);
    audioRef.current.pause();
    audioRef.current.src = '';
  };

  const value = {
    currentSong,
    isPlaying,
    queue,
    currentTime,
    duration,
    volume,
    isShuffle,
    repeatMode,
    isCompactMode,
    isFullPlayerOpen,
    playSong,
    togglePlay,
    handleNext,
    handlePrevious,
    seekTo,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    clearQueue,
    setIsCompactMode,
    setIsFullPlayerOpen
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};
