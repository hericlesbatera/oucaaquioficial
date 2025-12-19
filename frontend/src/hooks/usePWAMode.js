import { useState, useEffect } from 'react';

export const usePWAMode = () => {
  const [isPWA, setIsPWA] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Detectar se app está instalado como PWA
    const checkPWA = () => {
      const standalone = window.navigator.standalone === true;
      const displayMode = window.matchMedia('(display-mode: standalone)').matches;
      const fullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      
      const isPWAMode = standalone || displayMode || fullscreen;
      setIsPWA(isPWAMode);
      
      console.log('PWA Detection:', {
        standalone,
        displayMode,
        fullscreen,
        isPWA: isPWAMode
      });
    };

    // Detectar mudanças de online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    checkPWA();

    // Listener para mudança de display mode (quando instala/desinstala app)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkPWA);

    // Listeners para online/offline
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      mediaQuery.removeEventListener('change', checkPWA);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isPWA,
    isOnline,
    displayMode: isPWA ? 'app' : 'browser'
  };
};
