import { useState, useCallback } from 'react';

const DB_NAME = 'OucaaquiDownloads';
const STORE_NAME = 'downloads';
const DB_VERSION = 1;

let db = null;

// Inicializar IndexedDB
const initDB = () => {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('albumId', 'albumId', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
};

// Salvar arquivo no IndexedDB
const saveDownload = async (song) => {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const downloadRecord = {
        id: song.id,
        songId: song.id,
        title: song.title,
        artist: song.artist_name || song.artist,
        albumId: song.album_id,
        albumTitle: song.album_title,
        url: song.url,
        coverUrl: song.cover_url,
        duration: song.duration,
        timestamp: Date.now(),
        fileData: null // Será preenchido ao baixar
    };

    return new Promise((resolve, reject) => {
        const request = store.put(downloadRecord);
        request.onsuccess = () => resolve(downloadRecord);
        request.onerror = () => reject(request.error);
    });
};

// Baixar e armazenar arquivo
const downloadAndSave = async (song) => {
    try {
        // Buscar arquivo
        const response = await fetch(song.url);
        if (!response.ok) throw new Error('Erro ao baixar arquivo');

        const blob = await response.blob();

        // Salvar no IndexedDB
        const database = await initDB();
        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const downloadRecord = {
            id: song.id,
            songId: song.id,
            title: song.title,
            artist: song.artist_name || song.artist,
            albumId: song.album_id,
            albumTitle: song.album_title,
            coverUrl: song.cover_url,
            duration: song.duration,
            timestamp: Date.now(),
            fileBlob: blob,
            blobUrl: URL.createObjectURL(blob)
        };

        return new Promise((resolve, reject) => {
            const request = store.put(downloadRecord);
            request.onsuccess = () => resolve(downloadRecord);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Erro ao baixar:', error);
        throw error;
    }
};

// Obter todos os downloads
const getAllDownloads = async () => {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Obter downloads de um álbum
const getAlbumDownloads = async (albumId) => {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('albumId');

    return new Promise((resolve, reject) => {
        const request = index.getAll(albumId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Deletar download
const deleteDownload = async (songId) => {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
        const request = store.delete(songId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// Hook customizado
export const useDownloads = () => {
    const [downloads, setDownloads] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadDownloads = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAllDownloads();
            setDownloads(data);
        } catch (error) {
            console.error('Erro ao carregar downloads:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const addDownload = useCallback(async (song) => {
        try {
            const download = await downloadAndSave(song);
            setDownloads(prev => [...prev, download]);
            return download;
        } catch (error) {
            console.error('Erro ao adicionar download:', error);
            throw error;
        }
    }, []);

    const removeDownload = useCallback(async (songId) => {
        try {
            await deleteDownload(songId);
            setDownloads(prev => prev.filter(d => d.id !== songId));
        } catch (error) {
            console.error('Erro ao remover download:', error);
            throw error;
        }
    }, []);

    const getDownloadsByAlbum = useCallback(async (albumId) => {
        try {
            return await getAlbumDownloads(albumId);
        } catch (error) {
            console.error('Erro ao buscar downloads do álbum:', error);
            return [];
        }
    }, []);

    return {
        downloads,
        loading,
        loadDownloads,
        addDownload,
        removeDownload,
        getDownloadsByAlbum
    };
};

export default useDownloads;
