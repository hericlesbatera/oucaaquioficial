import { useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';

/**
 * Hook que adiciona a classe "player-active" ao body quando há música tocando
 * Remove a classe quando o player está em modo compacto
 */
export const usePlayerActive = () => {
  const { currentSong, isCompactMode } = usePlayer();

  useEffect(() => {
    // Adiciona player-active apenas se houver música E o player NÃO estiver compacto
    if (currentSong && !isCompactMode) {
      document.body.classList.add('player-active');
    } else {
      document.body.classList.remove('player-active');
    }

    return () => {
      document.body.classList.remove('player-active');
    };
  }, [currentSong, isCompactMode]);
};
