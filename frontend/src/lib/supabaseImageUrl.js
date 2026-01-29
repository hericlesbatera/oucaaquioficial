/**
 * Gera URLs otimizadas para imagens do Supabase Storage
 * Usando transformações do Supabase para servir imagens menores
 */

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;

export const getOptimizedImageUrl = (storageUrl, options = {}) => {
    if (!storageUrl) return '/images/default-album.png';
    
    // Se já tiver query params, retorna como está
    if (storageUrl.includes('?')) return storageUrl;
    
    // Se for URL interna (já do Supabase), adicionar transformação
    if (storageUrl.includes('supabase') && storageUrl.includes('/storage/')) {
        const width = options.width || 400;
        const height = options.height || 400;
        const quality = options.quality || 80;
        
        // Adicionar query params para otimização
        const separator = storageUrl.includes('?') ? '&' : '?';
        return `${storageUrl}${separator}w=${width}&h=${height}&q=${quality}`;
    }
    
    return storageUrl;
};

/**
 * Versão simplificada para usar em img tags
 * Retorna URL com cache buster se necessário
 */
export const getImageUrl = (url, size = 'medium') => {
    if (!url) return '/images/default-album.png';
    
    const sizes = {
        small: { width: 200, height: 200, quality: 75 },
        medium: { width: 400, height: 400, quality: 80 },
        large: { width: 800, height: 800, quality: 85 }
    };
    
    const opts = sizes[size] || sizes.medium;
    return getOptimizedImageUrl(url, opts);
};
