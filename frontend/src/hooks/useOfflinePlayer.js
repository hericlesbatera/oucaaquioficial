import { useState, useCallback, useRef } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { isCapacitorAvailable } from './useCapacitorDownloads';

const DOWNLOADS_DIR = 'music_downloads';

/**
 * Hook para gerenciar reprodução de arquivos baixados offline
 * Converte arquivos locais em URLs reproduzíveis
 * Suporta tanto Capacitor Filesystem quanto IndexedDB
 */
export const useOfflinePlayer = () => {
    const [offlineURLs, setOfflineURLs] = useState({});
    const urlCacheRef = useRef({});

    /**
     * Criar URL de blob a partir de dados blob
     */
    const createBlobURL = useCallback((blob, mimeType = 'audio/mpeg') => {
        if (blob instanceof Blob) {
            return URL.createObjectURL(blob);
        }
        return null;
    }, []);

    /**
     * Carregar URL reproduzível de uma música baixada via Filesystem
     */
    const getOfflineSongURLFromFilesystem = useCallback(async (albumDir, fileName) => {
        try {
            const filePath = `${DOWNLOADS_DIR}/${albumDir}/${fileName}`;
            console.log(`[OfflinePlayer] Lendo arquivo do Filesystem: ${filePath}`);
            
            const file = await Filesystem.readFile({
                path: filePath,
                directory: Directory.Data
            });

            if (!file || !file.data) {
                console.error(`[OfflinePlayer] Arquivo vazio ou inválido: ${fileName}`);
                return null;
            }

            console.log(`[OfflinePlayer] Arquivo lido com sucesso: ${fileName}`);

            // Criar blob URL a partir do base64
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
            return URL.createObjectURL(blob);

        } catch (error) {
            console.error(`[OfflinePlayer] Erro ao ler do Filesystem: ${error.message}`);
            return null;
        }
    }, []);

    /**
     * Carregar URL reproduzível de uma música baixada
     * Suporta tanto Filesystem quanto IndexedDB (via blob salvo)
     */
    const getOfflineSongURL = useCallback(async (albumDir, fileName, songData = null) => {
        const cacheKey = `${albumDir}/${fileName}`;
        
        // Verificar cache primeiro
        if (urlCacheRef.current[cacheKey]) {
            console.log(`[OfflinePlayer] Usando URL do cache para: ${fileName}`);
            return urlCacheRef.current[cacheKey];
        }

        // Se temos blob direto (IndexedDB mode)
        if (songData?.audioBlob instanceof Blob) {
            console.log(`[OfflinePlayer] Criando URL do blob (IndexedDB): ${fileName}`);
            const url = URL.createObjectURL(songData.audioBlob);
            urlCacheRef.current[cacheKey] = url;
            setOfflineURLs(prev => ({ ...prev, [cacheKey]: url }));
            return url;
        }

        // Se Capacitor não está disponível ou Filesystem não funciona
        if (!isCapacitorAvailable()) {
            console.log('[OfflinePlayer] Capacitor não disponível');
            return null;
        }

        try {
            const url = await getOfflineSongURLFromFilesystem(albumDir, fileName);
            
            if (url) {
                urlCacheRef.current[cacheKey] = url;
                setOfflineURLs(prev => ({ ...prev, [cacheKey]: url }));
                console.log(`[OfflinePlayer] ✅ URL criada para: ${fileName}`);
            }
            
            return url;
        } catch (error) {
            console.error(`[OfflinePlayer] Erro ao carregar URL offline para ${fileName}:`, error);
            return null;
        }
    }, [getOfflineSongURLFromFilesystem]);

    /**
     * Carregar URL offline da imagem de capa
     */
    const getOfflineCoverURL = useCallback(async (albumDir, coverBlob = null) => {
        const cacheKey = `${albumDir}/cover.jpg`;
        
        // Verificar cache primeiro
        if (urlCacheRef.current[cacheKey]) {
            return urlCacheRef.current[cacheKey];
        }

        // Se temos blob direto (IndexedDB mode)
        if (coverBlob instanceof Blob) {
            console.log(`[OfflinePlayer] Criando URL da capa do blob (IndexedDB): ${albumDir}`);
            const url = URL.createObjectURL(coverBlob);
            urlCacheRef.current[cacheKey] = url;
            setOfflineURLs(prev => ({ ...prev, [cacheKey]: url }));
            return url;
        }

        if (!isCapacitorAvailable()) {
            return null;
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
     * @param {Array} songs - Array de músicas com fileName e opcionalmente audioBlob
     * @param {boolean} useIndexedDB - Se true, usa blobs do IndexedDB
     * @returns {Promise<Array>} - Array de músicas com audioUrl preenchida
     */
    const loadAlbumOfflineURLs = useCallback(async (albumDir, songs, useIndexedDB = false) => {
        console.log(`[OfflinePlayer] Carregando URLs offline para ${songs.length} músicas`);
        console.log(`[OfflinePlayer] Modo: ${useIndexedDB ? 'IndexedDB' : 'Filesystem'}`);

        try {
            const songsWithURLs = [];
            
            for (let i = 0; i < songs.length; i++) {
                const song = songs[i];
                console.log(`[OfflinePlayer] Processando música ${i + 1}/${songs.length}: ${song.title}`);
                
                let audioUrl = null;
                
                // Se o song tem audioBlob, é IndexedDB mode
                if (song.audioBlob instanceof Blob) {
                    console.log(`[OfflinePlayer] Usando blob do IndexedDB`);
                    audioUrl = await getOfflineSongURL(albumDir, song.fileName, song);
                } else if (!useIndexedDB && isCapacitorAvailable()) {
                    // Tentar Filesystem
                    audioUrl = await getOfflineSongURL(albumDir, song.fileName);
                }
                
                if (audioUrl) {
                    console.log(`[OfflinePlayer] ✅ URL criada para: ${song.title}`);
                } else {
                    console.warn(`[OfflinePlayer] ⚠️ Sem URL offline para: ${song.title}`);
                }
                
                songsWithURLs.push({
                    ...song,
                    audioUrl: audioUrl || song.url,
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
        Object.values(urlCacheRef.current).forEach(url => {
            try {
                URL.revokeObjectURL(url);
            } catch (e) {
                // Ignorar erros ao revogar
            }
        });
        urlCacheRef.current = {};
        setOfflineURLs({});
    }, []);

    return {
        getOfflineSongURL,
        getOfflineCoverURL,
        loadAlbumOfflineURLs,
        clearURLCache,
        createBlobURL,
        offlineURLs
    };
};

export default useOfflinePlayer;
