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
     * Carregar URLs de todas as músicas de um álbum
     * @param {string} albumDir - Diretório do álbum
     * @param {Array} songs - Array de músicas com fileName
     * @returns {Promise<Array>} - Array de músicas com audioUrl preenchida
     */
    const loadAlbumOfflineURLs = useCallback(async (albumDir, songs) => {
        if (!isCapacitorAvailable()) return songs;

        try {
            const songsWithURLs = await Promise.all(
                songs.map(async (song) => {
                    const audioUrl = await getOfflineSongURL(albumDir, song.fileName);
                    return {
                        ...song,
                        audioUrl: audioUrl || song.url, // Fallback para URL online se falhar
                        isOffline: !!audioUrl
                    };
                })
            );
            
            return songsWithURLs;
        } catch (error) {
            console.error('Erro ao carregar URLs offline do álbum:', error);
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
