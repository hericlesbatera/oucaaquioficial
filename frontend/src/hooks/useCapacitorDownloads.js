import { useState, useCallback, useEffect } from 'react';
import { Filesystem, Directory, FilesystemDirectory, Encoding } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { CapacitorHttp } from '@capacitor/core';
import { Http } from '@capacitor-community/http';

const DOWNLOADS_DIR = 'music_downloads';
const METADATA_KEY = 'downloaded_albums';
const IDB_DB_NAME = 'MusicOfflineDB';
const IDB_STORE_NAME = 'albums';
const IDB_VERSION = 1;

// Variable global para controlar se devemos usar IndexedDB
let useIndexedDBFallback = false;
let idbDatabase = null;

// Função utilitária para verificar se o Capacitor está disponível
export const isCapacitorAvailable = () => {
    if (typeof window === 'undefined' || !window.Capacitor) return false;
    let isNative = false;
    if (typeof window.Capacitor.isNativePlatform === 'function') {
        isNative = window.Capacitor.isNativePlatform();
    } else if (window.Capacitor.isNativePlatform === true) {
        isNative = true;
    }
    const platform = window.Capacitor.getPlatform?.();
    if (platform === 'android' || platform === 'ios') {
        isNative = true;
    }
    return isNative;
};

// ==================== INDEXEDDB FALLBACK ====================

const initIndexedDB = () => {
    return new Promise((resolve, reject) => {
        if (idbDatabase) {
            resolve(idbDatabase);
            return;
        }

        const request = indexedDB.open(IDB_DB_NAME, IDB_VERSION);
        
        request.onerror = () => {
            console.error('[IDB] Erro ao abrir IndexedDB:', request.error);
            reject(request.error);
        };
        
        request.onsuccess = () => {
            idbDatabase = request.result;
            console.log('[IDB] IndexedDB inicializado com sucesso');
            resolve(idbDatabase);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
                const store = db.createObjectStore(IDB_STORE_NAME, { keyPath: 'albumId' });
                store.createIndex('title', 'title', { unique: false });
                store.createIndex('downloadedAt', 'downloadedAt', { unique: false });
                console.log('[IDB] Object store criado');
            }
        };
    });
};

const saveToIndexedDB = async (albumData) => {
    const db = await initIndexedDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([IDB_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(IDB_STORE_NAME);
        const request = store.put(albumData);
        
        request.onsuccess = () => resolve(albumData);
        request.onerror = () => reject(request.error);
    });
};

const loadFromIndexedDB = async () => {
    const db = await initIndexedDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([IDB_STORE_NAME], 'readonly');
        const store = transaction.objectStore(IDB_STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
};

const deleteFromIndexedDB = async (albumId) => {
    const db = await initIndexedDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([IDB_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(IDB_STORE_NAME);
        const request = store.delete(albumId);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// ==================== CAPACITOR METHODS (Original) ====================

// Salvar metadados em cache local
const saveMetadata = async (downloads) => {
    if (useIndexedDBFallback) {
        // IndexedDB já salva os dados completos, não precisa de metadata separada
        return;
    }
    await Preferences.set({
        key: METADATA_KEY,
        value: JSON.stringify(downloads)
    });
};

// Carregar metadados do cache
const loadMetadata = async () => {
    if (useIndexedDBFallback) {
        return await loadFromIndexedDB();
    }
    try {
        const { value } = await Preferences.get({ key: METADATA_KEY });
        return value ? JSON.parse(value) : [];
    } catch (error) {
        console.error('Erro ao carregar metadados:', error);
        return [];
    }
};

// Criar pasta de downloads se não existir
const ensureDownloadsDir = async () => {
    if (!isCapacitorAvailable() || useIndexedDBFallback) return;

    try {
        await Filesystem.mkdir({
            path: DOWNLOADS_DIR,
            directory: Directory.Data,
            recursive: true
        });
    } catch (error) {
        console.log('Pasta de downloads já existe ou erro ao criar:', error.message);
    }
};

// Testar se Filesystem plugin funciona
const testFilesystemPlugin = async () => {
    if (!isCapacitorAvailable()) {
        console.log('[Download] Capacitor não disponível, usando IndexedDB');
        useIndexedDBFallback = true;
        return false;
    }

    try {
        // Tentar criar um arquivo de teste
        await Filesystem.writeFile({
            path: `${DOWNLOADS_DIR}/test.txt`,
            data: 'test',
            directory: Directory.Data
        });
        
        // Tentar deletar
        await Filesystem.deleteFile({
            path: `${DOWNLOADS_DIR}/test.txt`,
            directory: Directory.Data
        });
        
        console.log('[Download] Filesystem plugin funcionando corretamente');
        useIndexedDBFallback = false;
        return true;
    } catch (error) {
        console.warn('[Download] Filesystem plugin não disponível:', error.message);
        console.log('[Download] Usando IndexedDB como fallback');
        useIndexedDBFallback = true;
        return false;
    }
};

// Baixar imagem de capa do álbum
const downloadCoverImage = async (coverUrl, albumDir) => {
    if (!coverUrl) {
        console.log('[Download] URL da capa não fornecida');
        return null;
    }

    try {
        console.log(`📸 Baixando capa do álbum...`);

        const response = await fetch(coverUrl);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const blob = await response.blob();
        
        if (useIndexedDBFallback) {
            // Retornar blob diretamente para IndexedDB
            console.log(`   ✅ Capa baixada (IndexedDB mode)`);
            return blob;
        }
        
        // Converter blob para base64
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
        });
        reader.readAsDataURL(blob);
        const base64Data = await base64Promise;
        
        // Criar diretório e salvar arquivo
        const albumPath = `${DOWNLOADS_DIR}/${albumDir}`;
        try { 
            await Filesystem.mkdir({ 
                path: albumPath, 
                directory: Directory.Data, 
                recursive: true 
            }); 
        } catch (mkdirErr) { }
        
        const filePath = `${albumPath}/cover.jpg`;
        await Filesystem.writeFile({
            path: filePath,
            data: base64Data,
            directory: Directory.Data
        });
        
        console.log(`   ✅ Capa baixada com sucesso`);
        return true;

    } catch (error) {
        console.warn(`   ⚠️ Falha ao baixar capa: ${error.message}`);
        return null;
    }
};

// Converter URL para arquivo local
const downloadFile = async (url, fileName, albumDir) => {
    const startTime = Date.now();
    
    try {
        if (!url) {
            throw new Error(`URL vazia para arquivo ${fileName}`);
        }

        console.log(`📥 Iniciando download: ${fileName}`);

        // Se estamos usando IndexedDB, baixar via fetch e retornar blob
        if (useIndexedDBFallback) {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const blob = await response.blob();
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`   ✅ Download OK via fetch (IndexedDB mode) (${elapsed}s)`);
            return blob;
        }

        // Criar diretório do álbum
        const albumPath = `${DOWNLOADS_DIR}/${albumDir}`;
        try { 
            await Filesystem.mkdir({ 
                path: albumPath, 
                directory: Directory.Data, 
                recursive: true 
            }); 
        } catch (mkdirErr) {
            // Diretório já existe, ignorar
        }
        
        const filePath = `${albumPath}/${fileName}`;

        // Método 1: Tentar Http.downloadFile (mais eficiente para arquivos grandes)
        try {
            console.log(`   Tentando Http.downloadFile...`);
            const downloadResult = await Http.downloadFile({
                url: url,
                filePath: filePath,
                fileDirectory: FilesystemDirectory.Data,
                method: 'GET',
                headers: {
                    'Accept': 'audio/mpeg,audio/*,*/*'
                }
            });
            
            if (downloadResult && downloadResult.path) {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                console.log(`   ✅ Download OK via Http.downloadFile (${elapsed}s)`);
                return true;
            }
        } catch (httpErr) {
            console.warn(`   ⚠️ Http.downloadFile falhou: ${httpErr.message}`);
        }

        // Método 2: Fallback - Fetch + writeFile (funciona em mais casos)
        try {
            console.log(`   Tentando fetch + writeFile...`);
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const blob = await response.blob();
            
            // Converter blob para base64
            const reader = new FileReader();
            const base64Promise = new Promise((resolve, reject) => {
                reader.onload = () => {
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
            });
            reader.readAsDataURL(blob);
            const base64Data = await base64Promise;
            
            // Salvar arquivo
            await Filesystem.writeFile({
                path: filePath,
                data: base64Data,
                directory: Directory.Data
            });
            
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`   ✅ Download OK via fetch+writeFile (${elapsed}s)`);
            return true;
            
        } catch (fetchErr) {
            console.error(`   ❌ Fetch falhou: ${fetchErr.message}`);
            throw fetchErr;
        }

    } catch (error) {
        console.error(`❌ Erro no download de ${fileName}:`, error.message);
        throw error;
    }
};

// Converter Blob para Base64 com timeout e otimização
const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
        try {
            const timeoutId = setTimeout(() => {
                reject(new Error('Timeout na conversao Base64 - arquivo muito grande ou conexao lenta'));
            }, 60000);

            const reader = new FileReader();

            reader.onloadend = () => {
                clearTimeout(timeoutId);
                try {
                    if (!reader.result) {
                        throw new Error('FileReader retornou resultado vazio');
                    }

                    const base64 = reader.result.includes(',')
                        ? reader.result.split(',')[1]
                        : reader.result;

                    if (!base64 || base64.length === 0) {
                        throw new Error('Base64 esta vazio apos split');
                    }

                    console.log(`Blob convertido para base64 (${base64.length} chars, ${(base64.length / 1024 / 1024).toFixed(2)}MB)`);
                    resolve(reader.result);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = (error) => {
                clearTimeout(timeoutId);
                console.error('Erro no FileReader:', error);
                reject(new Error(`FileReader error: ${error.message}`));
            };

            reader.onprogress = (event) => {
                if (event.lengthComputable) {
                    const progress = (event.loaded / event.total * 100).toFixed(0);
                    const mb = (event.loaded / 1024 / 1024).toFixed(2);
                    console.log(`   Progresso conversao: ${progress}% (${mb}MB)`);
                }
            };

            reader.readAsDataURL(blob);
        } catch (error) {
            reject(error);
        }
    });
};

// Deletar arquivo
const deleteFile = async (filePath) => {
    if (!isCapacitorAvailable() || useIndexedDBFallback) return;

    try {
        await Filesystem.deleteFile({
            path: filePath,
            directory: Directory.Data
        });
    } catch (error) {
        console.error('Erro ao deletar arquivo:', error);
        throw error;
    }
};

// Deletar pasta do álbum
const deleteDirectory = async (dirPath) => {
    if (!isCapacitorAvailable() || useIndexedDBFallback) return;

    try {
        await Filesystem.rmdir({
            path: dirPath,
            directory: Directory.Data,
            recursive: true
        });
    } catch (error) {
        console.error('Erro ao deletar pasta:', error);
        throw error;
    }
};

// Sanitizar nomes de arquivo
function sanitizePath(name) {
    return name
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, '_')
        .substring(0, 100);
}

// Hook customizado
export const useCapacitorDownloads = (onSongDownloadStart) => {
    const [downloads, setDownloads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState({});
    const [isReady, setIsReady] = useState(false);

    // Inicializar
    useEffect(() => {
        const init = async () => {
            // Testar se Filesystem funciona, senão usar IndexedDB
            await testFilesystemPlugin();
            
            if (!useIndexedDBFallback) {
                await ensureDownloadsDir();
            }
            
            await loadDownloads();
            setIsReady(true);
        };
        
        init();
    }, []);

    const loadDownloads = useCallback(async () => {
        setLoading(true);
        try {
            const metadata = await loadMetadata();
            console.log(`[Download] Carregados ${metadata.length} álbuns`);
            setDownloads(metadata);
        } catch (error) {
            console.error('Erro ao carregar downloads:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const downloadAlbum = useCallback(async (album, songs) => {
        const debugLogs = [];
        const originalLog = console.log;
        const originalError = console.error;

        const captureLog = (...args) => {
            originalLog(...args);
            debugLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        };

        console.log = captureLog;
        console.error = captureLog;

        try {
            console.log('==========================================');
            console.log('INICIANDO DOWNLOAD DE ALBUM');
            console.log(`Modo: ${useIndexedDBFallback ? 'IndexedDB' : 'Filesystem'}`);
            console.log('==========================================');
            console.log('Album:', {
                id: album?.id,
                title: album?.title,
                artist: album?.artist_name
            });
            console.log('Numero de musicas:', songs?.length);

            if (!album || !album.id || !album.title) {
                console.error('Album invalido:', album);
                throw new Error('Dados do album invalidos');
            }

            if (!songs || songs.length === 0) {
                console.error('Nenhuma musica para baixar');
                throw new Error('Album sem musicas');
            }

            const albumDir = sanitizePath(album.title);
            console.log('Pasta do album:', albumDir);

            // Baixar capa do álbum primeiro
            const coverUrl = album.cover_url || album.coverImage;
            let coverBlob = null;
            if (coverUrl) {
                coverBlob = await downloadCoverImage(coverUrl, albumDir);
            }

            // Validar URLs antes de começar
            const SUPABASE_URL = 'https://rtdxqthhhwqnlrevzmap.supabase.co';
            const songsWithValidURLs = songs.map(song => {
                let url = song?.audioUrl || song?.audio_url || song?.url;
                
                // Se URL é relativa, construir URL completa do Supabase
                if (url && !url.startsWith('http')) {
                    url = `${SUPABASE_URL}/storage/v1/object/public/${url}`;
                }
                
                return { ...song, audioUrl: url, audio_url: url, url: url };
            }).filter(song => !!song.audioUrl);

            console.log(`Musicas com URL valida: ${songsWithValidURLs.length}/${songs.length}`);

            if (songsWithValidURLs.length === 0) {
                console.error('Nenhuma musica possui URL de audio valida!');
                throw new Error('Nenhuma musica possui URL de audio valida. Verifique se as musicas foram carregadas corretamente.');
            }

            const downloadedSongs = [];
            let successCount = 0;
            let failCount = 0;
            let lastError = '';

            // iniciar progresso em 0
            setDownloadProgress(prev => ({
                ...prev,
                [album.id]: { current: 0, total: songsWithValidURLs.length }
            }));

            for (let i = 0; i < songsWithValidURLs.length; i++) {
                const song = songsWithValidURLs[i];

                if (!song) {
                    console.warn(`Musica ${i + 1} e invalida (null/undefined)`);
                    failCount++;
                    continue;
                }

                const songUrl = song.audioUrl || song.audio_url || song.url;
                const fileName = `${String(i + 1).padStart(2, '0')} - ${sanitizePath(song.title || 'desconhecido')}.mp3`;

                console.log(`\nMUSICA ${i + 1}/${songsWithValidURLs.length}`);
                console.log(`   Titulo: ${song.title}`);
                console.log(`   ID: ${song.id}`);

                if (!songUrl) {
                    console.error(`URL nao encontrada para: ${song.title}`);
                    failCount++;
                    continue;
                }

                // Callback para informar qual música está sendo baixada
                if (onSongDownloadStart) {
                    onSongDownloadStart({
                        song: song.title,
                        index: successCount + failCount + 1,
                        total: songsWithValidURLs.length
                    });
                }

                try {
                    console.log(`   Iniciando download...`);
                    const result = await downloadFile(songUrl, fileName, albumDir);

                    const songData = {
                        id: song.id,
                        title: song.title,
                        fileName: fileName
                    };
                    
                    // Se estamos usando IndexedDB, salvar o blob também
                    if (useIndexedDBFallback && result instanceof Blob) {
                        songData.audioBlob = result;
                    }

                    downloadedSongs.push(songData);

                    console.log(`   SUCESSO`);
                    successCount++;
                    setDownloadProgress(prev => ({
                        ...prev,
                        [album.id]: { current: successCount, total: songsWithValidURLs.length }
                    }));
                } catch (error) {
                    console.error(`   FALHA: ${error.message}`);
                    lastError = `${song.title}: ${error.message}`;
                    failCount++;
                    setDownloadProgress(prev => ({
                        ...prev,
                        [album.id]: { current: successCount, total: songsWithValidURLs.length, failed: failCount, lastError }
                    }));
                }
            }

            console.log('\n==========================================');
            console.log('RESUMO DO DOWNLOAD');
            console.log(`   Sucesso: ${successCount}/${songsWithValidURLs.length}`);
            console.log(`   Falha: ${failCount}/${songsWithValidURLs.length}`);
            console.log('==========================================\n');

            // Verificar se alguma música foi baixada com sucesso
            if (downloadedSongs.length === 0) {
                console.error('Nenhuma musica foi baixada com sucesso!');
                const errorMsg = lastError 
                    ? `Erro: ${lastError}` 
                    : 'Verifique sua conexao e espaco disponivel.';
                throw new Error(`Falha ao baixar. ${errorMsg}`);
            }

            // Salvar metadados do álbum
            const albumDownload = {
                albumId: album.id,
                title: album.title,
                artist: album.artist_name || album.artistName || 'Desconhecido',
                coverUrl: album.cover_url || album.coverImage,
                albumDir: albumDir,
                downloadedAt: new Date().toISOString(),
                songCount: downloadedSongs.length,
                totalSongs: songs.length,
                songs: downloadedSongs,
                useIndexedDB: useIndexedDBFallback
            };

            // Se usando IndexedDB, adicionar blobs
            if (useIndexedDBFallback) {
                if (coverBlob instanceof Blob) {
                    albumDownload.coverBlob = coverBlob;
                }
            }

            console.log('Salvando metadados:', {
                albumId: albumDownload.albumId,
                title: albumDownload.title,
                musicas: albumDownload.songs.length,
                modo: useIndexedDBFallback ? 'IndexedDB' : 'Filesystem'
            });

            if (useIndexedDBFallback) {
                // Salvar no IndexedDB
                await saveToIndexedDB(albumDownload);
                const updatedDownloads = [...downloads, albumDownload];
                setDownloads(updatedDownloads);
            } else {
                // Salvar via Preferences
                let updatedDownloads = [...downloads, albumDownload];

                try {
                    await saveMetadata(updatedDownloads);
                    console.log('Metadados salvos com sucesso');
                } catch (saveError) {
                    console.error('Erro ao salvar metadados:', saveError);
                }

                setDownloads(updatedDownloads);
            }

            setDownloadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[album.id];
                return newProgress;
            });

            console.log('DOWNLOAD CONCLUIDO COM SUCESSO');
            console.log('==========================================\n');

            // Restaurar console originais
            console.log = originalLog;
            console.error = originalError;
            
            return albumDownload;
        } catch (error) {
            console.error('ERRO GERAL NO DOWNLOAD:', error);

            // Restaurar console originais
            console.log = originalLog;
            console.error = originalError;
            
            // Limpar progresso em caso de erro
            setDownloadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[album.id];
                return newProgress;
            });

            throw error;
        }
    }, [downloads, onSongDownloadStart]);

    const downloadSong = useCallback(async (song, album) => {
        try {
            const albumDir = sanitizePath(album.title);
            const fileName = `${sanitizePath(song.title)}.mp3`;

            await downloadFile(song.url, fileName, albumDir);

            const updatedDownloads = downloads.map(dl => {
                if (dl.albumId === album.id) {
                    return {
                        ...dl,
                        songs: [...dl.songs, { id: song.id, title: song.title, fileName }],
                        songCount: dl.songs.length + 1
                    };
                }
                return dl;
            });

            setDownloads(updatedDownloads);
            
            if (useIndexedDBFallback) {
                const albumData = updatedDownloads.find(d => d.albumId === album.id);
                if (albumData) {
                    await saveToIndexedDB(albumData);
                }
            } else {
                await saveMetadata(updatedDownloads);
            }

            return true;
        } catch (error) {
            console.error('Erro ao baixar musica:', error);
            throw error;
        }
    }, [downloads]);

    const deleteDownloadedAlbum = useCallback(async (albumId) => {
        try {
            const album = downloads.find(d => d.albumId === albumId);
            if (album) {
                if (!useIndexedDBFallback) {
                    await deleteDirectory(`${DOWNLOADS_DIR}/${album.albumDir}`);
                }
                
                if (useIndexedDBFallback) {
                    await deleteFromIndexedDB(albumId);
                }
                
                const updated = downloads.filter(d => d.albumId !== albumId);
                setDownloads(updated);
                
                if (!useIndexedDBFallback) {
                    await saveMetadata(updated);
                }
            }
        } catch (error) {
            console.error('Erro ao deletar album:', error);
            throw error;
        }
    }, [downloads]);

    const deleteDownloadedSong = useCallback(async (albumId, songId, fileName) => {
        try {
            const album = downloads.find(d => d.albumId === albumId);
            if (album) {
                if (!useIndexedDBFallback) {
                    const filePath = `${DOWNLOADS_DIR}/${album.albumDir}/${fileName}`;
                    await deleteFile(filePath);
                }

                const updated = downloads.map(dl => {
                    if (dl.albumId === albumId) {
                        return {
                            ...dl,
                            songs: dl.songs.filter(s => s.id !== songId),
                            songCount: dl.songs.length - 1
                        };
                    }
                    return dl;
                }).filter(dl => dl.songCount > 0);

                setDownloads(updated);
                
                if (useIndexedDBFallback) {
                    const albumData = updated.find(d => d.albumId === albumId);
                    if (albumData) {
                        await saveToIndexedDB(albumData);
                    } else {
                        await deleteFromIndexedDB(albumId);
                    }
                } else {
                    await saveMetadata(updated);
                }
            }
        } catch (error) {
            console.error('Erro ao deletar musica:', error);
            throw error;
        }
    }, [downloads]);

    const isAlbumDownloaded = useCallback((albumId) => {
        return downloads.some(d => d.albumId === albumId);
    }, [downloads]);

    const getDownloadedAlbum = useCallback((albumId) => {
        return downloads.find(d => d.albumId === albumId);
    }, [downloads]);

    return {
        downloads,
        loading,
        downloadProgress,
        downloadAlbum,
        downloadSong,
        deleteDownloadedAlbum,
        deleteDownloadedSong,
        isAlbumDownloaded,
        getDownloadedAlbum,
        loadDownloads,
        isCapacitorAvailable: isCapacitorAvailable(),
        isReady,
        useIndexedDBFallback
    };
};

export default useCapacitorDownloads;
