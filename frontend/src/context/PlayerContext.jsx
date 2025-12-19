import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { mockSongs } from '../mock';
import { supabase } from '../lib/supabaseClient';
import { recordSongPlay } from '../lib/statsHelper';
import Dexie from 'dexie';

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
    const dbRef = useRef(null);
  
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

  if (!dbRef.current) {
    dbRef.current = new Dexie('Musicasua');
    dbRef.current.version(1).stores({
      downloadedSongs: '++id, albumId, songId, downloadedAt',
      downloadedAlbums: '++id, albumId, downloadedAt',
      downloadProgress: '++id, songId',
      cachedAlbums: '++id, albumId',
      cachedArtists: '++id, artistId',
      cachedImages: '++id, imageUrl',
      albumCovers: '++id, albumId'
    });
  }
  
  const handleNextRef = useRef(null);

  const handleNext = useCallback(() => {
    console.log('handleNext chamado, queue length:', queue.length);
    
    if (!queue.length || !currentSong) {
      console.log('handleNext: sem queue ou currentSong');
      return;
    }

    // Compatibilidade com ambos id e songId
    const currentId = currentSong.id || currentSong.songId;
    const currentIndex = queue.findIndex(s => (s.id === currentId) || (s.songId === currentId));
    console.log('handleNext: currentIndex =', currentIndex, 'currentId =', currentId);
    
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
          setQueue([]);
          setCurrentSong(null);
          audioRef.current.pause();
          audioRef.current.src = '';
          return;
        }
      }
    }

    console.log('handleNext: próxima música index =', nextIndex, queue[nextIndex]?.title);
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
    const handleError = () => {
      console.error('Erro ao carregar áudio:', audio.error);
      if (audio.error) {
        console.error('Código de erro:', audio.error.code);
        console.error('Mensagem de erro:', audio.error.message);
      }
    };
    const handleCanPlay = () => console.log('Áudio pronto para reproduzir');
    const handleLoadStart = () => console.log('Começando a carregar áudio');
    const handleCanPlayThrough = () => console.log('Áudio pode ser reproduzido sem parar');

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
    };
  }, []);

  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  // Ref para controlar se o áudio já foi configurado para a música atual
  const currentSongIdRef = useRef(null);

  // useEffect para carregar música quando currentSong muda (next/prev ou playSong)
  useEffect(() => {
    if (!currentSong) {
      currentSongIdRef.current = null;
      return;
    }
    
    const songId = currentSong.id || currentSong.songId;
    const audioUrl = currentSong.audioUrl || currentSong.url;
    
    console.log('useEffect currentSong mudou:', { songId, audioUrl, prevId: currentSongIdRef.current });
    
    // Só configurar se for uma música DIFERENTE
    if (currentSongIdRef.current === songId) {
      return;
    }
    
    currentSongIdRef.current = songId;
    
    if (audioUrl) {
      // Parar áudio anterior
      audioRef.current.pause();
      audioRef.current.src = audioUrl;
      audioRef.current.volume = volume || 0.7;
      audioRef.current.muted = false;
      
      // Play direto
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('Play OK! Duration:', audioRef.current.duration);
          setIsPlaying(true);
        }).catch(err => {
          console.error('Play error:', err.name, err.message);
          setIsPlaying(false);
        });
      }
    } else {
      console.warn('Nenhuma URL de áudio disponível');
    }
  }, [currentSong]);

  const playSong = (song, songQueue = [], playlistId = null) => {
   setCurrentSong(song);
   setQueue(songQueue.length > 0 ? songQueue : [song]);
   setCurrentPlaylistId(playlistId);

   // Verificar qual campo contém o ID do álbum e da música
   const albumId = song.albumId || song.album_id || song.albumid;
   const songId = song.id;
   
   // Se é offline, não precisa registrar play
   if (song.offline) {
     console.log('Reproduzindo música offline:', songId);
     return;
   }
   
   if (!albumId || !songId) {
     console.error('Album ID or Song ID not found for song:', song);
     return;
   }

   // Registrar play (incrementa songs.plays, albums.play_count, playlists.play_count se aplicável, e registra na tabela plays)
   recordSongPlay(songId, albumId, playlistId);
  };

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Toggle play error:', err);
      });
    }
  };

  const handlePrevious = useCallback(() => {
    if (currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    if (!queue.length || !currentSong) return;

    // Compatibilidade com ambos id e songId
    const currentId = currentSong.id || currentSong.songId;
    const currentIndex = queue.findIndex(s => (s.id === currentId) || (s.songId === currentId));
    const prevIndex = currentIndex - 1;

    if (prevIndex < 0) {
      if (repeatMode === 'all') {
        setCurrentSong(queue[queue.length - 1]);
      }
      return;
    }
    
    setCurrentSong(queue[prevIndex]);
  }, [queue, currentSong, currentTime, repeatMode]);

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
