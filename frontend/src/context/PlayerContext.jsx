import React, { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { mockSongs } from '../mock';
import { supabase } from '../lib/supabaseClient';
import { recordSongPlay } from '../lib/statsHelper';

// Contexto principal: dados estáveis (não muda a cada segundo)
const PlayerContext = createContext();
// Contexto de tempo: currentTime e duration (muda ~1x por segundo, isolado)
const PlayerTimeContext = createContext();

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
};

// Hook separado para quem precisa de currentTime/duration (apenas Player.jsx e modais)
export const usePlayerTime = () => {
  const context = useContext(PlayerTimeContext);
  if (!context) {
    throw new Error('usePlayerTime must be used within PlayerProvider');
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
  const nextAudioRef = useRef(null); // Para pré-carregar próxima música
  
  if (!audioRef.current) {
    audioRef.current = new Audio();
    audioRef.current.preload = 'auto';
    audioRef.current.crossOrigin = 'anonymous';
  }
  
  if (!nextAudioRef.current) {
    nextAudioRef.current = new Audio();
    nextAudioRef.current.preload = 'auto';
    nextAudioRef.current.crossOrigin = 'anonymous';
  }
  
  const handleNextRef = useRef(null);
  const handlePreviousRef = useRef(null);
  const queueRef = useRef(queue);
  const currentSongRef = useRef(currentSong);
  const repeatModeRef = useRef(repeatMode);
  const isShuffleRef = useRef(isShuffle);
  
  // Manter refs atualizados
  useEffect(() => {
    queueRef.current = queue;
    currentSongRef.current = currentSong;
    repeatModeRef.current = repeatMode;
    isShuffleRef.current = isShuffle;
  }, [queue, currentSong, repeatMode, isShuffle]);

  const handleNext = useCallback(() => {
    if (!queue.length) return;

    const currentIndex = queue.findIndex(s => s.id === currentSong?.id);
    let nextIndex;

    if (repeatMode === 'one') {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.error('Error replaying:', err));
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

    // Garantir que isPlaying seja true para a próxima música tocar automaticamente
    setIsPlaying(true);
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
      // IMPORTANTE: Executar a lógica de próxima música diretamente aqui
      // para garantir que funcione em segundo plano no iOS
      const queue = queueRef.current;
      const currentSong = currentSongRef.current;
      const repeatMode = repeatModeRef.current;
      const isShuffle = isShuffleRef.current;
      
      if (!queue.length) return;
      
      const currentIndex = queue.findIndex(s => s.id === currentSong?.id);
      let nextIndex;
      
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(err => console.error('Error replaying:', err));
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
            setIsPlaying(false);
            setCurrentSong(null);
            setQueue([]);
            audio.pause();
            audio.src = '';
            return;
          }
        }
      }
      
      const nextSong = queue[nextIndex];
      if (nextSong) {
        // Atualizar o src e tocar imediatamente - crítico para iOS em segundo plano
        audio.src = nextSong.audioUrl;
        audio.play()
          .then(() => {
            if ('mediaSession' in navigator) {
              navigator.mediaSession.playbackState = 'playing';
            }
          })
          .catch(err => console.error('Error playing next:', err));
        
        // Atualizar o estado do React depois
        setIsPlaying(true);
        setCurrentSong(nextSong);
      }
    };
    
    const handleError = () => console.error('Erro ao carregar áudio:', audio.error);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);
  
  // Pré-carregar próxima música quando faltar 30 segundos para acabar
  // Usa refs para não causar re-render
  const durationRef = useRef(duration);
  const currentTimeRef = useRef(currentTime);
  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);

  useEffect(() => {
    const audio = audioRef.current;
    const handleTimeUpdateForPreload = () => {
      const dur = durationRef.current;
      const ct = audio.currentTime;
      if (!currentSongRef.current || !dur || dur === 0) return;
      
      const timeRemaining = dur - ct;
      if (timeRemaining <= 30 && timeRemaining > 0) {
        const queue = queueRef.current;
        const currentIndex = queue.findIndex(s => s.id === currentSongRef.current?.id);
        let nextIndex = currentIndex + 1;
        
        if (nextIndex >= queue.length && repeatModeRef.current === 'all') {
          nextIndex = 0;
        }
        
        if (queue[nextIndex] && nextAudioRef.current.src !== queue[nextIndex].audioUrl) {
          nextAudioRef.current.src = queue[nextIndex].audioUrl;
          nextAudioRef.current.load();
        }
      }
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdateForPreload);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdateForPreload);
  }, []);

  // Carregar nova música quando currentSong mudar
  useEffect(() => {
    if (currentSong) {
      const audio = audioRef.current;
      
      // Só atualizar src se for uma música diferente
      if (audio.src !== currentSong.audioUrl) {
        audio.src = currentSong.audioUrl;
        
        // Usar evento canplay para garantir que o áudio está pronto antes de tocar
        const playWhenReady = () => {
          if (isPlaying) {
            audio.play()
              .then(() => {
                if ('mediaSession' in navigator) {
                  navigator.mediaSession.playbackState = 'playing';
                }
              })
              .catch(err => console.error('Error playing audio:', err));
          }
          audio.removeEventListener('canplay', playWhenReady);
        };
        
        // Se já está pronto, toca imediatamente; senão, espera carregar
        if (audio.readyState >= 3) {
          playWhenReady();
        } else {
          audio.addEventListener('canplay', playWhenReady);
        }
        
        return () => {
          audio.removeEventListener('canplay', playWhenReady);
        };
      }
    }
  }, [currentSong]);

  useEffect(() => {
     if (isPlaying) {
       audioRef.current.play()
         .then(() => {
           if ('mediaSession' in navigator) {
             navigator.mediaSession.playbackState = 'playing';
           }
         })
         .catch(err => console.error('Error playing audio:', err));
     } else {
       audioRef.current.pause();
       if ('mediaSession' in navigator) {
         navigator.mediaSession.playbackState = 'paused';
       }
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
    
    // REMOVER seekforward/seekbackward para que o iOS mostre os botões de próxima/anterior
    // em vez das bolinhas de pular 10 segundos
    try {
      mediaSession.setActionHandler('seekforward', null);
      mediaSession.setActionHandler('seekbackward', null);
    } catch (e) {
      // Alguns navegadores podem não suportar
    }

    return () => {
      mediaSession.setActionHandler('play', null);
      mediaSession.setActionHandler('pause', null);
      mediaSession.setActionHandler('previoustrack', null);
      mediaSession.setActionHandler('nexttrack', null);
      mediaSession.setActionHandler('seekto', null);
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

  // Valor estável: não inclui currentTime/duration para evitar re-renders a cada segundo
  // useMemo garante que o objeto só muda quando os dados realmente mudam
  const stableValue = useMemo(() => ({
    currentSong,
    isPlaying,
    queue,
    volume,
    isShuffle,
    repeatMode,
    isCompactMode,
    isFullPlayerOpen,
    currentPlaylistId,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [currentSong, isPlaying, queue, volume, isShuffle, repeatMode, isCompactMode, isFullPlayerOpen, currentPlaylistId, handleNext, handlePrevious]);

  // Valor de tempo: muda a cada segundo, mas só afeta Player.jsx e modais
  const timeValue = useMemo(() => ({
    currentTime,
    duration,
    seekTo
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [currentTime, duration]);

  return (
    <PlayerContext.Provider value={stableValue}>
      <PlayerTimeContext.Provider value={timeValue}>
        {children}
      </PlayerTimeContext.Provider>
    </PlayerContext.Provider>
  );
};
