import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para detectar status de conectividade do app
 * Dispara listeners quando fica online/offline
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasJustOffline, setWasJustOffline] = useState(false);

  const handleOnline = useCallback(() => {
    console.log('[NetworkStatus] App está ONLINE');
    setIsOnline(true);
    setWasJustOffline(false);
  }, []);

  const handleOffline = useCallback(() => {
    console.log('[NetworkStatus] App está OFFLINE');
    setIsOnline(false);
    setWasJustOffline(true);
  }, []);

  useEffect(() => {
    // Verificar status inicial
    setIsOnline(navigator.onLine);

    // Adicionar listeners para eventos de rede
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Limpar listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    isOffline: !isOnline,
    wasJustOffline
  };
};

export default useNetworkStatus;
