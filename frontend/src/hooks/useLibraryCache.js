import { useState, useCallback } from 'react';

const LIBRARY_CACHE_KEY = 'oucaaqui_library_cache';
const LIBRARY_CACHE_VERSION = '1.0';

/**
 * Hook para cachear dados da biblioteca no localStorage
 * Permite visualizar biblioteca offline com dados salvos
 */
export const useLibraryCache = () => {
  const [cacheData, setCacheData] = useState(null);

  /**
   * Salvar dados da biblioteca em cache
   */
  const saveLibraryToCache = useCallback((libraryData) => {
    try {
      const cacheObject = {
        version: LIBRARY_CACHE_VERSION,
        timestamp: new Date().toISOString(),
        data: libraryData
      };
      localStorage.setItem(LIBRARY_CACHE_KEY, JSON.stringify(cacheObject));
      setCacheData(libraryData);
      console.log('[LibraryCache] Biblioteca salva em cache com sucesso');
      return true;
    } catch (error) {
      console.error('[LibraryCache] Erro ao salvar biblioteca em cache:', error);
      return false;
    }
  }, []);

  /**
   * Carregar dados da biblioteca do cache
   */
  const loadLibraryFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(LIBRARY_CACHE_KEY);
      if (cached) {
        const cacheObject = JSON.parse(cached);
        
        // Validar versão do cache
        if (cacheObject.version !== LIBRARY_CACHE_VERSION) {
          console.warn('[LibraryCache] Versão do cache desatualizada');
          return null;
        }

        setCacheData(cacheObject.data);
        const cacheAge = new Date() - new Date(cacheObject.timestamp);
        const ageInHours = Math.floor(cacheAge / (1000 * 60 * 60));
        console.log(`[LibraryCache] Biblioteca carregada do cache (${ageInHours}h atrás)`);
        
        return cacheObject.data;
      }
      return null;
    } catch (error) {
      console.error('[LibraryCache] Erro ao carregar biblioteca do cache:', error);
      return null;
    }
  }, []);

  /**
   * Limpar cache da biblioteca
   */
  const clearLibraryCache = useCallback(() => {
    try {
      localStorage.removeItem(LIBRARY_CACHE_KEY);
      setCacheData(null);
      console.log('[LibraryCache] Cache da biblioteca removido');
      return true;
    } catch (error) {
      console.error('[LibraryCache] Erro ao limpar cache:', error);
      return false;
    }
  }, []);

  /**
   * Verificar se há dados em cache
   */
  const hasCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem(LIBRARY_CACHE_KEY);
      return cached !== null;
    } catch (error) {
      return false;
    }
  }, []);

  return {
    cacheData,
    saveLibraryToCache,
    loadLibraryFromCache,
    clearLibraryCache,
    hasCachedData
  };
};

export default useLibraryCache;
