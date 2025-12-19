import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { mockSongs } from '../mock';
import { supabase } from '../lib/supabaseClient';

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
  const audioRef = useRef(new Audio());
  const handleNextRef = useRef(null);

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
          setIsPlaying(false);
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

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
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

  const playSong = (song, songQueue = []) => {
    setCurrentSong(song);
    setQueue(songQueue.length > 0 ? songQueue : [song]);
    setIsPlaying(true);

    // Incrementar play_count do álbum
    if (song.albumId) {
      supabase.rpc('increment_play_count', { album_id: song.albumId })
        .then(() => {})
        .catch(() => {
          // Fallback: update direto
          supabase
            .from('albums')
            .update({ play_count: supabase.sql`COALESCE(play_count, 0) + 1` })
            .eq('id', song.albumId)
            .then(() => {});
        });
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePrevious = () => {
    if (currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    if (!queue.length) return;

    const currentIndex = queue.findIndex(s => s.id === currentSong?.id);
    const prevIndex = currentIndex - 1;

    if (prevIndex < 0) {
      if (repeatMode === 'all') {
        setCurrentSong(queue[queue.length - 1]);
      }
    } else {
      setCurrentSong(queue[prevIndex]);
    }
  };

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
    playSong,
    togglePlay,
    handleNext,
    handlePrevious,
    seekTo,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    clearQueue
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};
