import React, { useState, useEffect, useCallback } from 'react';
import { Download, Trash2, Play, Shuffle } from 'lucide-react';
import { useDownloadManager } from '../../hooks/useDownloadManager';
import { usePlayer } from '../../context/PlayerContext';
import { useDebounce } from '../../hooks/useDebounce';

const DownloadsTab = () => {
  const { downloads, deleteDownload, getDownloadedSong, getDownloadedAlbumCover } = useDownloadManager();
  const { playSong } = usePlayer();
  const [expandedAlbum, setExpandedAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [albumCovers, setAlbumCovers] = useState({});

  useEffect(() => {
    setLoading(false);
  }, [downloads]);

  // Carregar capas dos álbuns do IndexedDB
  useEffect(() => {
    const loadAlbumCovers = async () => {
      const covers = {};
      for (const album of downloads.albums || []) {
        const blobUrl = await getDownloadedAlbumCover(album.albumId);
        covers[album.albumId] = blobUrl || album.coverUrl || '/images/default-album.png';
      }
      setAlbumCovers(covers);
    };

    if (downloads.albums?.length > 0) {
      loadAlbumCovers();
    }
  }, [downloads.albums, getDownloadedAlbumCover]);

  const handlePlayDownloadedSong = useDebounce(async (song, allAlbumSongs = null) => {
    try {
      console.log('Tentando tocar música:', song.songId, song.title);
      // Obter URL da música do IndexedDB
      const blobUrl = await getDownloadedSong(song.songId);
      console.log('BlobUrl recebida:', blobUrl);
      
      if (blobUrl) {
        console.log('Iniciando reprodução da música offline');
        
        // Se passar allAlbumSongs, cria fila com todas as músicas
        let queue = [];
        if (allAlbumSongs && allAlbumSongs.length > 0) {
          // Preparar a fila com os dados necessários para reprodução offline
          for (const s of allAlbumSongs) {
            const songBlobUrl = await getDownloadedSong(s.songId);
            const coverBlobUrl = s.albumId ? await getDownloadedAlbumCover(s.albumId) : null;
            const coverImage = coverBlobUrl || '/images/default-album.png';
            console.log(`Adicionando à fila: ${s.title}, Capa: ${coverBlobUrl ? 'Blob OK' : 'Default'}, AudioUrl: ${songBlobUrl ? 'OK' : 'FAIL'}`);
            if (songBlobUrl) {
              queue.push({
                id: s.songId,
                songId: s.songId,
                albumId: s.albumId,
                title: s.title,
                artist: s.artist,
                duration: s.duration,
                audioUrl: songBlobUrl,
                coverImage: coverImage,
                offline: true
              });
            }
          }
        }
        
        // Obter capa do IndexedDB ou usar padrão
        const coverBlobUrl = song.albumId ? await getDownloadedAlbumCover(song.albumId) : null;
        const coverImage = coverBlobUrl || '/images/default-album.png';
        
        // Tocar a música offline
        playSong({
          id: song.songId,
          songId: song.songId,
          albumId: song.albumId,
          title: song.title,
          artist: song.artist,
          audioUrl: blobUrl,
          duration: song.duration,
          coverImage: coverImage,
          offline: true // Flag para indicar que é offline
        }, queue);
        
        console.log('Música enviada ao player com capa:', coverImage);
      } else {
        console.warn('Nenhuma blobUrl retornada para:', song.songId);
      }
    } catch (error) {
      console.error('Erro ao tocar música offline:', error);
    }
  });

  const handleDeleteSong = async (songId) => {
    if (window.confirm('Deseja remover esta música dos downloads?')) {
      await deleteDownload('song', songId);
    }
  };

  const handleDeleteAlbum = async (albumId) => {
    if (window.confirm('Deseja remover este álbum dos downloads?')) {
      await deleteDownload('album', albumId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const hasDownloads = downloads.albums?.length > 0 || downloads.songs?.length > 0;

  if (!hasDownloads) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Download className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg font-semibold">Nenhum download ainda</p>
        <p className="text-gray-400 text-sm mt-2">
          Baixe músicas e álbuns para ouvi-los offline
        </p>
      </div>
    );
  }

  // Função para tocar seleção aleatória de todos os álbuns
  const handleRandomPlayAllAlbums = async () => {
    try {
      if (!downloads.songs || downloads.songs.length === 0) return;
      
      // Embaralhar todas as músicas de todos os álbuns
      const allSongs = [...downloads.songs].sort(() => Math.random() - 0.5);
      
      if (allSongs.length > 0) {
        handlePlayDownloadedSong(allSongs[0], allSongs);
      }
    } catch (error) {
      console.error('Erro ao tocar seleção aleatória:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Botão de Seleção Aleatória Global */}
      {downloads.albums?.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-600 uppercase">
            Álbuns ({downloads.albums.length})
          </h3>
          <button
            onClick={handleRandomPlayAllAlbums}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
            title="Reproduzir todas as músicas aleatoriamente"
          >
            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M400 304l48 48-48 48m0-288l48 48-48 48M64 352h85.19a80 80 0 0066.56-35.62L256 256"></path><path fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M64 160h85.19a80 80 0 0166.56 35.62l80.5 120.76A80 80 0 00362.81 352H416m0-192h-53.19a80 80 0 00-66.56 35.62L288 208"></path></svg>
            Reprodução Aleatória
          </button>
        </div>
      )}

      {/* Álbuns Baixados */}
      {downloads.albums?.length > 0 && (
        <div className="space-y-3">
          {downloads.albums.map((album) => {
              const albumSongs = downloads.songs?.filter(
                song => song.albumId === album.albumId
              ) || [];
              
              // Usar capa do IndexedDB se disponível, senão usar URL
              let coverImage = albumCovers[album.albumId] || album.coverUrl || '/images/default-album.png';
              
              // Se não tem blob URL do IndexedDB, melhorar URL do Supabase
              if (!albumCovers[album.albumId] && coverImage && coverImage.includes('supabase.co')) {
                // Adicionar parâmetro de transformação/download se necessário
                if (!coverImage.includes('?')) {
                  coverImage += '?download=true';
                }
              }

              return (
              <div key={album.albumId}>
                {/* Card do álbum */}
                <div
                  className="group block p-3 rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Botão para expandir - Lado esquerdo */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedAlbum(
                          expandedAlbum === album.albumId ? null : album.albumId
                        );
                      }}
                      className="flex-shrink-0 self-center p-1.5 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
                      title="Ver músicas"
                    >
                      <svg className={`w-3 h-3 text-white transition-transform duration-300 ${expandedAlbum === album.albumId ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* Capa do álbum com overlay */}
                    <div 
                      className="relative flex-shrink-0 overflow-hidden rounded-lg shadow-md border-2 border-gray-200 cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        if (albumSongs.length > 0) {
                          handlePlayDownloadedSong(albumSongs[0], albumSongs);
                        }
                      }}
                    >
                      <img
                        src={coverImage}
                        alt={album.title}
                        className="w-20 h-20 object-cover transform hover:scale-105 transition-transform duration-300"
                        crossOrigin="anonymous"
                        onError={(e) => { 
                          e.target.src = '/images/default-album.png'; 
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center opacity-0 hover:opacity-100 transform scale-50 hover:scale-100 transition-all duration-300">
                          <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                        </div>
                      </div>
                    </div>

                    {/* Informações do álbum */}
                    <div 
                      className="flex-1 min-w-0 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                      onClick={() => {
                        if (albumSongs.length > 0) {
                          handlePlayDownloadedSong(albumSongs[0], albumSongs);
                        }
                      }}
                    >
                      <h3 className="text-gray-900 font-semibold text-xs line-clamp-2 hover:text-red-600 transition-colors">
                        {album.title}
                      </h3>
                      <p className="text-gray-600 text-xs mt-0.5">{album.artist}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {album.totalTracks} músicas
                      </p>
                    </div>

                    {/* Botões de ação - Shuffle e Delete */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (albumSongs.length > 0) {
                            const shuffledSongs = [...albumSongs].sort(() => Math.random() - 0.5);
                            handlePlayDownloadedSong(shuffledSongs[0], shuffledSongs);
                          }
                        }}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        title="Seleção aleatória"
                      >
                        <Shuffle className="w-4 h-4 text-red-600" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAlbum(album.albumId);
                        }}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        title="Deletar"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Músicas do álbum expandido */}
                {expandedAlbum === album.albumId && (
                  <div className="mt-2 ml-4 space-y-1 border-l-2 border-gray-300 pl-4">
                    <AlbumSongs albumId={album.albumId} onPlaySong={handlePlayDownloadedSong} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Músicas Individuais Baixadas */}
      {downloads.songs?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">
            Músicas Individuais ({downloads.songs.length})
          </h3>
          <div className="space-y-2">
            {downloads.songs
              .filter(song => !song.albumId) // Mostrar apenas músicas sem álbum
              .map((song) => (
                <div
                  key={song.songId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer active:bg-gray-100"
                  onClick={() => handlePlayDownloadedSong(song)}
                >
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {song.title}
                    </h4>
                    <p className="text-xs text-gray-600">{song.artist}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-red-600 fill-red-600 flex-shrink-0" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSong(song.songId);
                      }}
                      className="p-2 hover:bg-white rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para mostrar músicas de um álbum
const AlbumSongs = ({ albumId, onPlaySong }) => {
  const { downloads } = useDownloadManager();

  const albumSongs = downloads.songs?.filter(
    song => song.albumId === albumId
  ) || [];

  return (
    <div className="space-y-1">
      {albumSongs.map((song) => (
        <div
          key={song.songId}
          className="flex items-center justify-between p-2 text-xs hover:bg-gray-50 rounded cursor-pointer transition-all active:bg-gray-100"
          onClick={() => onPlaySong(song)}
        >
          <div className="flex-1 truncate">
            <span className="text-gray-700">{song.title}</span>
          </div>
          <Play className="w-3 h-3 text-red-600 fill-red-600 flex-shrink-0 ml-2" />
        </div>
      ))}
    </div>
  );
};

export default DownloadsTab;
