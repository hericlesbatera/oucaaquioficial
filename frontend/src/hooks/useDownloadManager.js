import { useState, useEffect, useCallback } from 'react';
import Dexie from 'dexie';

// Inicializar banco de dados IndexedDB
const db = new Dexie('Musicasua');
db.version(1).stores({
  downloadedSongs: '++id, albumId, songId, downloadedAt',
  downloadedAlbums: '++id, albumId, downloadedAt',
  downloadProgress: '++id, songId',
  cachedAlbums: '++id, albumId',
  cachedArtists: '++id, artistId',
  cachedImages: '++id, imageUrl',
  albumCovers: '++id, albumId'
});

export const useDownloadManager = () => {
  const [downloads, setDownloads] = useState({ albums: [], songs: [] });
  const [downloadProgress, setDownloadProgress] = useState({});

  // Carregar downloads do IndexedDB
  const loadDownloads = useCallback(async () => {
    try {
      // Garantir que o banco está aberto
      if (!db.isOpen()) {
        await db.open();
      }
      
      const albums = await db.downloadedAlbums.toArray();
      const songs = await db.downloadedSongs.toArray();
      
      console.log('Downloads carregados:', { albums: albums?.length || 0, songs: songs?.length || 0 });
      
      setDownloads({
        albums: albums || [],
        songs: songs || []
      });
    } catch (error) {
      console.error('Erro ao carregar downloads:', error);
      // Tentar reabrir o banco em caso de erro
      try {
        await db.open();
        const albums = await db.downloadedAlbums.toArray();
        const songs = await db.downloadedSongs.toArray();
        setDownloads({ albums: albums || [], songs: songs || [] });
      } catch (retryError) {
        console.error('Erro ao reabrir banco:', retryError);
      }
    }
  }, []);

  useEffect(() => {
    loadDownloads();
  }, [loadDownloads]);

  // Baixar uma música individual
   const downloadSong = useCallback(async (song) => {
     if (!song || !song.id) {
       console.error('Song ou song.id inválido');
       return;
     }

     try {
       setDownloadProgress(prev => ({
         ...prev,
         [song.id]: 0
       }));

       // Usar a audio_url diretamente do Supabase (suporta tanto snake_case quanto camelCase)
       const audioUrl = song.audio_url || song.audioUrl || song.url || song.file_url;
       if (!audioUrl) throw new Error('Nenhuma URL de áudio encontrada');

       // Buscar arquivo da música
       const response = await fetch(audioUrl);
       if (!response.ok) throw new Error('Erro ao baixar música');

      const blob = await response.blob();

      // Salvar no IndexedDB
      await db.downloadedSongs.add({
        songId: song.id,
        albumId: song.albumId,
        title: song.title,
        artist: song.artist,
        duration: song.duration,
        blob: blob,
        fileSize: blob.size,
        downloadedAt: new Date(),
        fileName: `${song.title}.mp3`,
        albumCoverUrl: song.albumCoverUrl || song.cover_url || song.coverImage
      });

      setDownloadProgress(prev => ({
        ...prev,
        [song.id]: 100
      }));

      await loadDownloads();
      return true;
    } catch (error) {
      console.error('Erro ao baixar música:', error);
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[song.id];
        return newProgress;
      });
      return false;
    }
  }, [loadDownloads]);

  // Baixar álbum completo
  const downloadAlbum = useCallback(async (album, songs) => {
    if (!album || !songs || songs.length === 0) {
      console.error('Album ou songs inválido');
      return;
    }

    try {
      // Baixar todas as músicas do álbum
      let downloadedCount = 0;
      for (const song of songs) {
        const success = await downloadSong(song);
        if (success) downloadedCount++;

        // Atualizar progress
        setDownloadProgress(prev => ({
          ...prev,
          [`album-${album.id}`]: Math.round((downloadedCount / songs.length) * 100)
        }));
      }

      // Marcar álbum como baixado
      await db.downloadedAlbums.add({
        albumId: album.id,
        title: album.title,
        artist: album.artist,
        coverUrl: album.cover_url || album.coverUrl,
        totalTracks: songs.length,
        downloadedAt: new Date()
      });

      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[`album-${album.id}`];
        return newProgress;
      });

      await loadDownloads();
      return true;
    } catch (error) {
      console.error('Erro ao baixar álbum:', error);
      return false;
    }
  }, [downloadSong, loadDownloads]);

  // Deletar download
  const deleteDownload = useCallback(async (type, id) => {
    try {
      if (type === 'song') {
        await db.downloadedSongs.where('songId').equals(id).delete();
      } else if (type === 'album') {
        await db.downloadedAlbums.where('albumId').equals(id).delete();
        // Deletar todas as músicas do álbum
        await db.downloadedSongs.where('albumId').equals(id).delete();
      }
      await loadDownloads();
      return true;
    } catch (error) {
      console.error('Erro ao deletar download:', error);
      return false;
    }
  }, [loadDownloads]);

  // Verificar se uma música está baixada
  const isSongDownloaded = useCallback(async (songId) => {
    try {
      const song = await db.downloadedSongs.where('songId').equals(songId).first();
      return !!song;
    } catch (error) {
      console.error('Erro ao verificar download:', error);
      return false;
    }
  }, []);

  // Verificar se um álbum está baixado
  const isAlbumDownloaded = useCallback(async (albumId) => {
    try {
      const album = await db.downloadedAlbums.where('albumId').equals(albumId).first();
      return !!album;
    } catch (error) {
      console.error('Erro ao verificar download:', error);
      return false;
    }
  }, []);

  // Obter música baixada para tocar offline
   const getDownloadedSong = useCallback(async (songId) => {
     try {
       console.log('Procurando música no IndexedDB:', songId);
       const song = await db.downloadedSongs.where('songId').equals(songId).first();
       
       if (!song) {
         console.warn('Música não encontrada no IndexedDB:', songId);
         return null;
       }
       
       // Suportar tanto o formato antigo (blob) quanto o novo (audioData)
       let blob;
       if (song.audioData) {
         // Novo formato: ArrayBuffer
         const mimeType = song.mimeType || 'audio/mpeg';
         blob = new Blob([song.audioData], { type: mimeType });
         console.log('Blob recriado do ArrayBuffer:', blob.size, 'bytes');
       } else if (song.blob) {
         // Formato antigo: Blob direto
         blob = song.blob;
         console.log('Usando blob existente:', blob.size, 'bytes');
       } else {
         console.warn('Música encontrada mas sem dados de áudio:', songId);
         return null;
       }
       
       const blobUrl = URL.createObjectURL(blob);
       console.log('BlobUrl criada:', blobUrl);
       return blobUrl;
     } catch (error) {
       console.error('Erro ao obter música baixada:', error);
       return null;
     }
   }, []);

  // Obter todas as músicas de um álbum baixado
  const getDownloadedAlbumSongs = useCallback(async (albumId) => {
    try {
      const songs = await db.downloadedSongs.where('albumId').equals(albumId).toArray();
      return songs || [];
    } catch (error) {
      console.error('Erro ao obter músicas do álbum:', error);
      return [];
    }
  }, []);

  // Cachear metadados de álbum
  const cacheAlbumMetadata = useCallback(async (album) => {
    try {
      await db.cachedAlbums.put({
        albumId: album.id,
        title: album.title,
        artist: album.artist_name || album.artist,
        coverUrl: album.cover_url || album.coverImage,
        releaseYear: album.release_year || album.releaseYear,
        totalTracks: album.total_tracks || album.totalTracks,
        genre: album.genre,
        description: album.description,
        cachedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao cachear álbum:', error);
    }
  }, []);

  // Cachear metadados de artista
  const cacheArtistMetadata = useCallback(async (artist) => {
    try {
      await db.cachedArtists.put({
        artistId: artist.id,
        name: artist.name,
        slug: artist.slug,
        avatarUrl: artist.avatar_url || artist.avatar,
        verified: artist.is_verified || artist.verified,
        cachedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao cachear artista:', error);
    }
  }, []);

  // Cachear imagem como Blob
  const cacheImage = useCallback(async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      await db.cachedImages.put({
        imageUrl: imageUrl,
        blob: blob,
        cachedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao cachear imagem:', error);
    }
  }, []);

  // Obter imagem do cache
  const getCachedImage = useCallback(async (imageUrl) => {
    try {
      const cached = await db.cachedImages.where('imageUrl').equals(imageUrl).first();
      if (cached && cached.blob) {
        return URL.createObjectURL(cached.blob);
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter imagem cacheada:', error);
      return null;
    }
  }, []);

  // Baixar álbum direto para app (sem ZIP)
   const downloadAlbumDirect = useCallback(async (album, songs) => {
     if (!album || !songs || songs.length === 0) {
       console.error('Album ou songs inválido');
       return false;
     }

     try {
       console.log('Iniciando download do álbum:', album.title, 'com', songs.length, 'músicas');
       
       // Cachear metadados primeiro
       await cacheAlbumMetadata(album);
       if (album.artist) {
         await cacheArtistMetadata(album.artist);
       }
       await cacheImage(album.cover_url || album.coverImage);
       
       // Baixar e salvar capa do álbum como blob
       const coverUrl = album.cover_url || album.coverImage;
       if (coverUrl) {
         try {
           const coverResponse = await fetch(coverUrl);
           if (coverResponse.ok) {
             const coverBlob = await coverResponse.blob();
             await db.albumCovers.put({
               albumId: album.id,
               blob: coverBlob,
               downloadedAt: new Date()
             });
             console.log(`Capa do álbum ${album.title} salva como blob`);
           }
         } catch (error) {
           console.error(`Erro ao baixar capa do álbum ${album.title}:`, error);
           // Continuar mesmo se a capa falhar
         }
       }

       // Baixar todas as músicas do álbum
       let downloadedCount = 0;
       for (const song of songs) {
         try {
           console.log(`Baixando música: ${song.title} (ID: ${song.id})`);
           
           // Usar a audio_url diretamente do Supabase (suporta tanto snake_case quanto camelCase)
           const audioUrl = song.audio_url || song.audioUrl || song.url || song.file_url;
           if (!audioUrl) {
             console.error(`Nenhuma URL de áudio para: ${song.title}`, song);
             continue;
           }
           
           console.log(`URL de áudio: ${audioUrl}`);
           const response = await fetch(audioUrl);
           if (!response.ok) {
            const errorText = await response.text();
            console.error(`Erro ao baixar música ${song.title}: status ${response.status}`, errorText);
             continue;
           }

           const blob = await response.blob();
           console.log(`Blob recebido para ${song.title}: ${blob.size} bytes, tipo: ${blob.type}`);
           
           // Converter Blob para ArrayBuffer (mais confiável no iOS/Safari)
           const arrayBuffer = await blob.arrayBuffer();
           console.log(`ArrayBuffer criado: ${arrayBuffer.byteLength} bytes`);

           // Salvar no IndexedDB
           const saveResult = await db.downloadedSongs.put({
             songId: song.id,
             albumId: album.id,
             title: song.title,
             artist: song.artist || album.artist_name,
             duration: song.duration,
             audioData: arrayBuffer,  // Salvar como ArrayBuffer
             mimeType: blob.type || 'audio/mpeg',
             fileSize: blob.size,
             downloadedAt: new Date(),
             fileName: `${song.title}.mp3`,
             albumCoverUrl: album.cover_url || album.coverImage
           });
           
           console.log(`Música salva no IndexedDB com ID: ${saveResult}`);

           downloadedCount++;

           // Atualizar progress
           setDownloadProgress(prev => ({
             ...prev,
             [`album-${album.id}`]: Math.round((downloadedCount / songs.length) * 100)
           }));
         } catch (error) {
           console.error(`Erro ao baixar música ${song.title}:`, error);
         }
       }

       console.log(`Download completo: ${downloadedCount}/${songs.length} músicas`);

       // Marcar álbum como baixado
       const albumCoverUrl = album.cover_url || album.coverImage;
       console.log(`Salvando álbum ${album.title} com capa:`, albumCoverUrl);
       
       await db.downloadedAlbums.put({
         albumId: album.id,
         title: album.title,
         artist: album.artist_name || album.artist,
         coverUrl: albumCoverUrl,
         totalTracks: songs.length,
         downloadedAt: new Date()
       });
       
       console.log(`Álbum ${album.title} salvo com sucesso`);
       
       // Verificar se foi salvo corretamente
       const verificacao = await db.downloadedAlbums.where('albumId').equals(album.id).first();
       console.log('Verificação após salvar:', verificacao ? 'OK' : 'FALHOU');

       setDownloadProgress(prev => {
         const newProgress = { ...prev };
         delete newProgress[`album-${album.id}`];
         return newProgress;
       });

       await loadDownloads();
       
       // Log final
       const totalAlbums = await db.downloadedAlbums.count();
       const totalSongs = await db.downloadedSongs.count();
       console.log(`Total no banco: ${totalAlbums} álbuns, ${totalSongs} músicas`);
       
       return downloadedCount === songs.length;
     } catch (error) {
       console.error('Erro ao baixar álbum direto:', error);
       return false;
     }
   }, [cacheAlbumMetadata, cacheArtistMetadata, cacheImage, loadDownloads]);

  // Obter capa do álbum baixada
  const getDownloadedAlbumCover = useCallback(async (albumId) => {
    try {
      const albumCover = await db.albumCovers.where('albumId').equals(albumId).first();
      if (albumCover && albumCover.blob) {
        return URL.createObjectURL(albumCover.blob);
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter capa do álbum:', error);
      return null;
    }
  }, []);

   return {
     downloads,
     downloadProgress,
     downloadSong,
     downloadAlbum,
     downloadAlbumDirect,
     deleteDownload,
     isSongDownloaded,
     isAlbumDownloaded,
     getDownloadedSong,
     getDownloadedAlbumSongs,
     getDownloadedAlbumCover,
     cacheAlbumMetadata,
     cacheArtistMetadata,
     cacheImage,
     getCachedImage,
     loadDownloads
   };
  };
