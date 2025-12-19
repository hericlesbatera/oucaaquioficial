import React, { useState, useEffect } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { useDownloadManager } from '../../hooks/useDownloadManager';
import { toast } from '../../hooks/use-toast';

const DownloadButton = ({ song, album, songs = [], type = 'song' }) => {
   const { downloadSong, downloadAlbum, downloadAlbumDirect, deleteDownload, downloadProgress } =
     useDownloadManager();
   const [isDownloaded, setIsDownloaded] = useState(false);
   const [isLoading, setIsLoading] = useState(false);

   const itemId = type === 'song' ? song?.id : album?.id;
   const progress = downloadProgress[itemId] || 0;

  useEffect(() => {
    checkDownloadStatus();
  }, [itemId]);

  const checkDownloadStatus = async () => {
    if (type === 'song' && song?.id) {
      // Verificar se a música está baixada
      const result = await checkSongDownloaded(song.id);
      setIsDownloaded(result);
    } else if (type === 'album' && album?.id) {
      // Verificar se o álbum está baixado
      const result = await checkAlbumDownloaded(album.id);
      setIsDownloaded(result);
    }
  };

  const checkSongDownloaded = async (songId) => {
    try {
      // Usar IndexedDB diretamente
      const dbRequest = indexedDB.open('Musicasua', 1);
      return new Promise((resolve) => {
        dbRequest.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction('downloadedSongs', 'readonly');
          const store = transaction.objectStore('downloadedSongs');
          const index = store.index('songId');
          const request = index.get(songId);

          request.onsuccess = () => {
            resolve(!!request.result);
          };
          request.onerror = () => {
            resolve(false);
          };
        };
      });
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return false;
    }
  };

  const checkAlbumDownloaded = async (albumId) => {
    try {
      const dbRequest = indexedDB.open('Musicasua', 1);
      return new Promise((resolve) => {
        dbRequest.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction('downloadedAlbums', 'readonly');
          const store = transaction.objectStore('downloadedAlbums');
          const index = store.index('albumId');
          const request = index.get(albumId);

          request.onsuccess = () => {
            resolve(!!request.result);
          };
          request.onerror = () => {
            resolve(false);
          };
        };
      });
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return false;
    }
  };

  const handleDownload = async (e) => {
    e.stopPropagation();

    if (type === 'song' && song) {
      setIsLoading(true);
      const success = await downloadSong(song);
      setIsLoading(false);

      if (success) {
        setIsDownloaded(true);
        toast({
          title: 'Sucesso',
          description: `"${song.title}" foi baixado com sucesso`,
          variant: 'default'
        });
      } else {
        toast({
          title: 'Erro',
          description: 'Erro ao baixar música',
          variant: 'destructive'
        });
      }
    } else if (type === 'album' && album) {
       setIsLoading(true);
       console.log('Iniciando download do álbum:', album.title, 'com', songs.length, 'músicas');
       const success = await downloadAlbumDirect(album, songs.length > 0 ? songs : []);
       setIsLoading(false);

       if (success) {
         setIsDownloaded(true);
         toast({
           title: 'Sucesso',
           description: `"${album.title}" foi baixado com sucesso`,
           variant: 'default'
         });
       } else {
         toast({
           title: 'Erro',
           description: 'Erro ao baixar álbum',
           variant: 'destructive'
         });
       }
     }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();

    const confirmDelete = window.confirm(
      `Deseja remover ${
        type === 'song'
          ? `"${song?.title}"`
          : `o álbum "${album?.title}"`
      } dos downloads?`
    );

    if (confirmDelete) {
      const success = await deleteDownload(type, itemId);
      if (success) {
        setIsDownloaded(false);
        toast({
          title: 'Removido',
          description: 'Download removido com sucesso',
          variant: 'default'
        });
      }
    }
  };

  // Mostrar progresso de download
  if (isLoading && progress > 0 && progress < 100) {
    return (
      <div className="relative inline-flex items-center justify-center">
        <div className="relative w-10 h-10 rounded-full bg-gray-200">
          <svg
            className="w-full h-full"
            style={{
              background: `conic-gradient(#ef4444 ${progress * 3.6}deg, #e5e7eb 0deg)`
            }}
          >
            <circle cx="20" cy="20" r="16" fill="white" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-red-600">
            {progress}%
          </div>
        </div>
      </div>
    );
  }

  // Botão de download/remover
  return (
    <button
      onClick={isDownloaded ? handleDelete : handleDownload}
      disabled={isLoading}
      className={`inline-flex items-center justify-center p-2 rounded-full transition-all ${
        isDownloaded
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } disabled:opacity-50`}
      title={isDownloaded ? 'Remover download' : 'Baixar'}
    >
      {isDownloaded ? (
        <Trash2 className="w-5 h-5" />
      ) : (
        <Download className="w-5 h-5" />
      )}
    </button>
  );
};

export default DownloadButton;
