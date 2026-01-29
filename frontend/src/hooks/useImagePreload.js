import { useState, useEffect } from 'react';

/**
 * Hook para pré-carregar imagens e evitar o flash de imagem padrão
 * @param {string} imageUrl - URL da imagem a carregar
 * @param {string} fallback - URL da imagem de fallback
 * @returns {object} { imageUrl: string, isLoading: boolean }
 */
export const useImagePreload = (imageUrl, fallback = '/images/default-avatar.png') => {
  const [displayUrl, setDisplayUrl] = useState(fallback);
  const [isLoading, setIsLoading] = useState(!!imageUrl);

  useEffect(() => {
    if (!imageUrl || imageUrl === fallback) {
      setDisplayUrl(fallback);
      setIsLoading(false);
      return;
    }

    // Se a imagem já está em cache do navegador, usar direto
    setIsLoading(true);
    
    const img = new Image();
    
    img.onload = () => {
      setDisplayUrl(imageUrl);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      setDisplayUrl(fallback);
      setIsLoading(false);
    };
    
    // Iniciar carregamento
    img.src = imageUrl;
  }, [imageUrl, fallback]);

  return { imageUrl: displayUrl, isLoading };
};
