/**
 * Helper para detectar ambiente e gerenciar downloads
 */

export const isMobileApp = () => {
    if (typeof window === 'undefined') return false;
    return window.Capacitor && window.Capacitor.isPluginAvailable('Filesystem');
};

export const isDesktop = () => {
    return !isMobileApp();
};

export const getPlatform = () => {
    if (!isMobileApp()) return 'desktop';
    return window.Capacitor.getPlatform?.() || 'web';
};

/**
 * Função unificada de download
 * @param {Object} params
 * @param {Object} params.album - Dados do álbum
 * @param {Array} params.albumSongs - Lista de músicas
 * @param {Function} params.onDesktop - Callback para download desktop (ZIP/RAR)
 * @param {Function} params.onMobile - Callback para download mobile (MP3s individuais)
 * @param {Function} params.onProgress - Callback de progresso
 */
export const handleDownload = async ({
    album,
    albumSongs,
    onDesktop,
    onMobile,
    onProgress
}) => {
    try {
        if (isMobileApp()) {
            console.log('🔧 Detectado: Mobile App');
            return await onMobile?.({ album, albumSongs, onProgress });
        } else {
            console.log('🔧 Detectado: Desktop/Web');
            return await onDesktop?.({ album, albumSongs });
        }
    } catch (error) {
        console.error('Erro no download:', error);
        throw error;
    }
};

export default {
    isMobileApp,
    isDesktop,
    getPlatform,
    handleDownload
};
