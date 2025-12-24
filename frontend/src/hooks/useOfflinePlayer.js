import { useState, useCallback, useRef } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { isCapacitorAvailable } from './useCapacitorDownloads';

const DOWNLOADS_DIR = 'music_downloads';

/**
 * Hook para gerenciar reprodução de arquivos baixados offline
 * Converte arquivos locais em URLs reproduzíveis
 */
export const useOfflinePlayer = () => {
    const [offlineURLs, setOfflineURLs] = useState({});
    const urlCacheRef = useRef({});

    /**
     * Carregar URL reproduzível de uma música baixada
     * @param {string} albumDir - Diretório do álbum (título sanitizado)
     * @param {string} fileName - Nome do arquivo
     * @returns {Promise<string>} - URL do arquivo ou null
     */
    const getOfflineSongURL = useCallback(async (albumDir, fileName) => {
        if (!isCapacitorAvailable()) {
            console.log('[OfflinePlayer] Capacitor não disponível');
            return null;
        }

        const cacheKey = `${albumDir}/${fileName}`;
        
        // Verificar cache primeiro (ref para evitar re-renders)
        if (urlCacheRef.current[cacheKey]) {
            console.log(`[OfflinePlayer] Usando URL do cache para: ${fileName}`);
            return urlCacheRef.current[cacheKey];
        }

        try {
            const filePath = `${DOWNLOADS_DIR}/${albumDir}/${fileName}`;
            console.log(`[OfflinePlayer] Lendo arquivo: ${filePath}`);
            
            // Ler o arquivo (retorna base64 por padrão)
            const file = await Filesystem.readFile({
                path: filePath,
                directory: Directory.Data
            });

            if (!file || !file.data) {
                console.error(`[OfflinePlayer] Arquivo vazio ou inválido: ${fileName}`);
                return null;
            }

            console.log(`[OfflinePlayer] Arquivo lido com sucesso: ${fileName} (${file.data.length} chars)`);

            // Criar blob URL a partir do base64
            try {
                // Remover prefixo data:audio/mpeg;base64, se existir
                let base64Data = file.data;
                if (base64Data.includes(',')) {
                    base64Data = base64Data.split(',')[1];
                }
                
                const binaryString = atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'audio/mpeg' });
                const url = URL.createObjectURL(blob);

                console.log(`[OfflinePlayer] Blob URL criada: ${url.substring(0, 50)}...`);

                // Cachear no ref (não causa re-render)
                urlCacheRef.current[cacheKey] = url;
                
                // Também atualizar estado para persistência
                setOfflineURLs(prev => ({
                    ...prev,
                    [cacheKey]: url
                }));

                return url;
            } catch (decodeError) {
                console.error(`[OfflinePlayer] Erro ao decodificar base64 para ${fileName}:`, decodeError);
                return null;
            }
        } catch (error) {
            console.error(`[OfflinePlayer] Erro ao carregar URL offline para ${fileName}:`, error);
            return null;
        }
    }, []);

    /**
     * Carregar URL offline da imagem de capa
     * @param {string} albumDir - Diretório do álbum
     * @returns {Promise<string>} - URL da imagem ou null
     */
    const getOfflineCoverURL = useCallback(async (albumDir) => {
        if (!isCapacitorAvailable()) {
            return null;
        }

        const cacheKey = `${albumDir}/cover.jpg`;
        
        // Verificar cache primeiro
        if (urlCacheRef.current[cacheKey]) {
            return urlCacheRef.current[cacheKey];
        }

        try {
            const filePath = `${DOWNLOADS_DIR}/${albumDir}/cover.jpg`;
            console.log(`[OfflinePlayer] Lendo capa: ${filePath}`);
            
            const file = await Filesystem.readFile({
                path: filePath,
                directory: Directory.Data
            });

            if (!file || !file.data) {
                console.log(`[OfflinePlayer] Capa não encontrada para: ${albumDir}`);
                return null;
            }

            // Criar URL para a imagem
            let base64Data = file.data;
            if (base64Data.includes(',')) {
                base64Data = base64Data.split(',')[1];
            }
            
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'image/jpeg' });
            const url = URL.createObjectURL(blob);

            console.log(`[OfflinePlayer] Capa carregada com sucesso: ${albumDir}`);
            
            // Cachear
            urlCacheRef.current[cacheKey] = url;
            setOfflineURLs(prev => ({ ...prev, [cacheKey]: url }));

            return url;
        } catch (error) {
            console.log(`[OfflinePlayer] Capa não encontrada ou erro: ${albumDir}`, error.message);
            return null;
        }
    }, []);

    /**
     * Carregar URLs de todas as músicas de um álbum
     * @param {string} albumDir - Diretório do álbum
     * @param {Array} songs - Array de músicas com fileName
     * @returns {Promise<Array>} - Array de músicas com audioUrl preenchida
     */
    const loadAlbumOfflineURLs = useCallback(async (albumDir, songs) => {
        if (!isCapacitorAvailable()) {
            console.log('[OfflinePlayer] Capacitor não disponível, retornando músicas originais');
            return songs;
        }

        console.log(`[OfflinePlayer] Carregando URLs offline para ${songs.length} músicas do álbum: ${albumDir}`);

        try {
            const songsWithURLs = [];
            
            for (let i = 0; i < songs.length; i++) {
                const song = songs[i];
                console.log(`[OfflinePlayer] Processando música ${i + 1}/${songs.length}: ${song.title} (${song.fileName})`);
                
                const audioUrl = await getOfflineSongURL(albumDir, song.fileName);
                
                if (audioUrl) {
                    console.log(`[OfflinePlayer] ✅ URL offline criada para: ${song.title}`);
                } else {
                    console.warn(`[OfflinePlayer] ⚠️ Falha ao criar URL offline para: ${song.title}`);
                }
                
                songsWithURLs.push({
                    ...song,
                    audioUrl: audioUrl || song.url, // Fallback para URL online se falhar
                    isOffline: !!audioUrl
                });
            }

            const offlineCount = songsWithURLs.filter(s => s.isOffline).length;
            console.log(`[OfflinePlayer] ${offlineCount}/${songs.length} músicas prontas para reprodução offline`);
            
            return songsWithURLs;
        } catch (error) {
            console.error('[OfflinePlayer] Erro ao carregar URLs offline do álbum:', error);
            return songs;
        }
    }, [getOfflineSongURL]);

    /**
     * Limpar cache de URLs
     */
    const clearURLCache = useCallback(() => {
        Object.values(offlineURLs).forEach(url => {
            URL.revokeObjectURL(url);
        });
        setOfflineURLs({});
    }, [offlineURLs]);

    return {
        getOfflineSongURL,
        loadAlbumOfflineURLs,
        clearURLCache,
        offlineURLs
    };
};

export default useOfflinePlayer;
