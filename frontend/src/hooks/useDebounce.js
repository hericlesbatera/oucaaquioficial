import { useRef, useCallback } from 'react';

export const useDebounce = (callback, delay = 150) => {
  const lastClickRef = useRef(0);
  const isExecutingRef = useRef(false);
  const callbackRef = useRef(callback);
  
  // Manter referência atualizada do callback
  callbackRef.current = callback;

  return useCallback(async (...args) => {
    const now = Date.now();
    
    // Prevenir cliques muito rápidos
    if (now - lastClickRef.current < delay) {
      return;
    }
    
    // Prevenir execuções simultâneas
    if (isExecutingRef.current) {
      return;
    }

    lastClickRef.current = now;
    isExecutingRef.current = true;

    try {
      await callbackRef.current(...args);
    } finally {
      // Liberar após um pequeno delay para evitar bouncing
      setTimeout(() => {
        isExecutingRef.current = false;
      }, 100);
    }
  }, [delay]);
};

// Debounce simples para prevenir múltiplos cliques rápidos
export const useClickDebounce = (delay = 300) => {
  const lastClickRef = useRef(0);

  return useCallback((callback) => {
    return (...args) => {
      const now = Date.now();
      if (now - lastClickRef.current < delay) {
        return;
      }
      lastClickRef.current = now;
      callback(...args);
    };
  }, [delay]);
};
