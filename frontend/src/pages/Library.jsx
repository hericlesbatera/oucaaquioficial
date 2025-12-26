import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { useTrackPageView } from '../hooks/useTrackPageView';
import { useCapacitorDownloads } from '../hooks/useCapacitorDownloads';
import { useOfflinePlayer } from '../hooks/useOfflinePlayer';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useLibraryCache } from '../hooks/useLibraryCache';
import { supabase } from '../lib/supabaseClient';
import { Play, Heart, Download, FileText, ListMusic, Trash2, Music, ChevronDown, Wifi, WifiOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from '../hooks/use-toast';

const Library = () => {
    useTrackPageView('library');
    const { playSong } = usePlayer();
    const { user } = useAuth();
    const { downloads, loading: downloadsLoading, deleteDownloadedAlbum } = useCapacitorDownloads();
    const { loadAlbumOfflineURLs } = useOfflinePlayer();
    const { isOffline } = useNetworkStatus();
    const { saveLibraryToCache, loadLibraryFromCache, hasCachedData } = useLibraryCache();
    const [activeTab, setActiveTab] = useState('favoritos');
    const [loading, setLoading] = useState(true);
    const [expandedDownload, setExpandedDownload] = useState(null);
    const [fromCache, setFromCache] = useState(false);
    const [data, setData] = useState({
        favoriteAlbums: [],
        favoritePlaylists: [],
        userPlaylists: []
    });

    useEffect(() => {
        loadLibraryData();
    }, [user?.id]);

    const loadLibraryData = async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setFromCache(false);

            // Se offline, tentar carregar do cache
            if (isOffline) {
                console.log('[Library] Offline detectado, carregando do cache');
                const cachedData = loadLibraryFromCache();
                if (cachedData) {
                    setData(cachedData);
                    setFromCache(true);
                    setLoading(false);
                    return;
                }
            }

            // Carregar álbuns favoritos
            const { data: albumIds } = await supabase
                .from('album_favorites')
                .select('album_id')
                .eq('user_id', user.id);

            let favoriteAlbumsData = [];
            if (albumIds && albumIds.length > 0) {
                const ids = albumIds.map(a => a.album_id);
                const { data: albums } = await supabase
                    .from('albums')
                    .select(`
            *,
            artist:artist_id (
              id,
              slug,
              is_verified
            )
          `)
                    .in('id', ids)
                    .order('created_at', { ascending: false });
                favoriteAlbumsData = albums || [];
            }

            // Carregar playlists favoritas
            const { data: playlistFavIds } = await supabase
                .from('playlist_favorites')
                .select('playlist_id')
                .eq('user_id', user.id);

            let favoritePlaylists = [];
            if (playlistFavIds && playlistFavIds.length > 0) {
                const ids = playlistFavIds.map(p => p.playlist_id);
                const { data: playlists } = await supabase
                    .from('playlists')
                    .select('*')
                    .in('id', ids)
                    .order('created_at', { ascending: false });
                favoritePlaylists = playlists || [];
            }

            // Carregar playlists do usuário
            const { data: userPlaylistsData } = await supabase
                .from('playlists')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            const newData = {
                favoriteAlbums: favoriteAlbumsData,
                favoritePlaylists: favoritePlaylists,
                userPlaylists: userPlaylistsData || []
            };

            setData(newData);
            
            // Salvar em cache para uso offline
            saveLibraryToCache(newData);
            setFromCache(false);
        } catch (error) {
            console.error('Erro ao carregar biblioteca:', error);
            
            // Se deu erro online, tentar carregar do cache
            if (!isOffline && hasCachedData()) {
                const cachedData = loadLibraryFromCache();
                if (cachedData) {
                    setData(cachedData);
                    setFromCache(true);
                    toast({
                        title: 'Biblioteca em Cache',
                        description: 'Mostrando dados em cache. Verifique sua conexão.',
                        variant: 'default'
                    });
                } else {
                    toast({
                        title: 'Erro',
                        description: 'Erro ao carregar dados da biblioteca',
                        variant: 'destructive'
                    });
                }
            } else {
                toast({
                    title: 'Sem Conexão',
                    description: 'Nenhum dado em cache. Conecte à internet.',
                    variant: 'destructive'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const getCountLabel = () => {
        switch (activeTab) {
            case 'favoritos':
                return `${data.favoriteAlbums.length} favoritos`;
            case 'playlists':
                return `${data.favoritePlaylists.length + data.userPlaylists.length} playlists`;
            case 'downloads':
                return `${downloads.length} downloads`;
            default:
                return '';
        }
    };

    const handlePlayDownloadedAlbum = async (downloadedAlbum) => {
        try {
            console.log('[Library] Iniciando reprodução do álbum baixado:', downloadedAlbum);
            
            // Garantir que cada música tem fileName (fallback)
            const songsWithFileName = (downloadedAlbum.songs || []).map((song, idx) => {
                if (song.fileName) return song;
                // Se não tiver fileName, gerar baseado no índice e título
                return {
                    ...song,
                    fileName: `${String(idx + 1).padStart(2, '0')} - ${(song.title || 'desconhecido').replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_').substring(0, 100)}.mp3`
                };
            });
            
            console.log('[Library] Músicas com fileName:', songsWithFileName);
            
            // Carregar URLs locais das músicas baixadas
            const { songs: songsWithURLs, coverUrl } = await loadAlbumOfflineURLs(
                downloadedAlbum.albumDir, 
                songsWithFileName,
                downloadedAlbum.coverFileName
            );

            console.log('[Library] Músicas carregadas:', songsWithURLs);

            // Criar queue com as músicas
            const queue = songsWithURLs.map(song => ({
                id: song.id,
                title: song.title,
                artist: downloadedAlbum.artist,
                album: downloadedAlbum.title,
                image: coverUrl || downloadedAlbum.coverUrl, // Usar capa offline se disponível
                audioUrl: song.audioUrl,
                isOffline: true,
                albumId: downloadedAlbum.albumId
            }));

            console.log('[Library] Fila criada:', queue);

            // Tocar primeira música da fila
            if (queue.length > 0) {
                console.log('[Library] Tocando música:', queue[0]);
                playSong(queue[0], queue);
                toast({
                    title: 'Reproduzindo Offline',
                    description: `${downloadedAlbum.title} - ${downloadedAlbum.artist}`
                });
            } else {
                toast({
                    title: 'Aviso',
                    description: 'Nenhuma música disponível neste álbum',
                    variant: 'default'
                });
            }
        } catch (error) {
            console.error('[Library] Erro ao reproduzir álbum baixado:', error);
            toast({
                title: 'Erro',
                description: error.message || 'Não foi possível reproduzir o álbum',
                variant: 'destructive'
            });
        }
    };

    const TabButton = ({ tab, icon, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center justify-center gap-2 py-3 md:py-2 rounded-lg font-bold text-sm md:text-base border-2 transition-all flex-1 ${
                activeTab === tab
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-red-600 border-red-600 hover:shadow-md'
            }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    return (
        <div className="flex-1 overflow-y-auto bg-white">
            {/* Aviso de Modo Offline */}
            {isOffline && (
                <div className="bg-amber-50 border-b-2 border-amber-200 px-4 py-3 flex items-center gap-3">
                    <WifiOff className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-900">Modo Offline</p>
                        <p className="text-xs text-amber-700">Mostrando dados salvos. Apenas downloads estão disponíveis.</p>
                    </div>
                </div>
            )}

            {/* Aviso se dados estão em cache */}
            {fromCache && !isOffline && (
                <div className="bg-blue-50 border-b-2 border-blue-200 px-4 py-3 flex items-center gap-3">
                    <Wifi className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900">Biblioteca em Cache</p>
                        <p className="text-xs text-blue-700">Mostrando dados salvos. Atualize para ver as mudanças recentes.</p>
                    </div>
                </div>
            )}

            {/* Abas em botões */}
            <div className="px-3 md:px-6 py-4 md:py-6 bg-white border-b border-gray-100">
                <div className="flex gap-3">
                    <TabButton
                        tab="favoritos"
                        icon={<Heart className="w-5 h-5 fill-current" />}
                        label="Favoritos"
                    />
                    <TabButton
                        tab="playlists"
                        icon={<FileText className="w-5 h-5" />}
                        label="Playlists"
                    />
                    <TabButton
                        tab="downloads"
                        icon={<Download className="w-5 h-5" />}
                        label="Downloads"
                    />
                </div>
            </div>

            {/* Contador e botão Ver Lançamentos */}
            <div className="px-3 md:px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
                <span className="text-gray-800 font-medium text-sm">{getCountLabel()}</span>
                {activeTab === 'favoritos' && (
                    <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-bold text-sm transition-colors flex items-center gap-2 whitespace-nowrap">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                        </svg>
                        Ver Lançamentos
                    </button>
                )}
            </div>

            {/* Conteúdo */}
            <div className="px-4 md:px-6 py-6 bg-white">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'favoritos' && (
                            <div className="space-y-3">
                                {data.favoriteAlbums.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500 text-lg">Nenhum álbum favoritado ainda</p>
                                    </div>
                                ) : (
                                    data.favoriteAlbums.map((album) => (
                                        <div
                                            key={album.id}
                                            className="group cursor-pointer block hover:bg-gray-50 p-3 rounded-lg transition-colors"
                                            onClick={() => {
                                                window.location.href = `/${album.artist?.slug || album.artist_id}/${album.slug || album.id}`;
                                            }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="relative flex-shrink-0 overflow-hidden rounded-lg shadow-md border-2 border-gray-200">
                                                    <img
                                                        src={album.cover_url}
                                                        alt={album.title}
                                                        className="w-20 h-20 object-cover transform group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                                                        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300">
                                                            <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-gray-900 font-semibold text-xs line-clamp-2 group-hover:text-red-600 transition-colors">
                                                        {album.title}
                                                    </h3>
                                                    <p className="text-gray-600 text-xs mt-0.5">{album.artist_name}</p>
                                                    <p className="text-gray-500 text-xs mt-1">
                                                        {album.total_tracks || 0} músicas
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'playlists' && (
                            <div className="space-y-3">
                                {data.favoritePlaylists.length === 0 && data.userPlaylists.length === 0 ? (
                                    <div className="text-center py-12">
                                        <ListMusic className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500 text-lg">Nenhuma playlist ainda</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Seção de playlists favoritas */}
                                        {data.favoritePlaylists.length > 0 && (
                                            <>
                                                <div className="mb-3 mt-4">
                                                    <p className="text-gray-600 text-xs font-semibold uppercase">Playlists Favoritas</p>
                                                </div>
                                                {data.favoritePlaylists.map((playlist) => (
                                                    <div
                                                        key={playlist.id}
                                                        className="group cursor-pointer block hover:bg-gray-50 p-3 rounded-lg transition-colors"
                                                        onClick={() => {
                                                            window.location.href = `/playlist/${playlist.slug || playlist.id}`;
                                                        }}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="relative flex-shrink-0 overflow-hidden rounded-lg shadow-md border-2 border-gray-200 w-20 h-20 bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                                                                {playlist.cover_url ? (
                                                                    <img
                                                                        src={playlist.cover_url}
                                                                        alt={playlist.title}
                                                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                                                                    />
                                                                ) : (
                                                                    <ListMusic className="w-6 h-6 text-white opacity-30" />
                                                                )}
                                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                                                                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300">
                                                                        <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="text-gray-900 font-semibold text-xs line-clamp-2 group-hover:text-red-600 transition-colors">
                                                                    {playlist.title}
                                                                </h3>
                                                                <p className="text-gray-600 text-xs mt-0.5 line-clamp-1">{playlist.description}</p>
                                                                <p className="text-gray-500 text-xs mt-1">
                                                                    {(playlist.song_ids || []).length} músicas
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </>
                                        )}

                                        {/* Seção de minhas playlists */}
                                        {data.userPlaylists.length > 0 && (
                                            <>
                                                <div className="mb-3 mt-6">
                                                    <p className="text-gray-600 text-xs font-semibold uppercase">Minhas Playlists</p>
                                                </div>
                                                {data.userPlaylists.map((playlist) => (
                                                    <div
                                                        key={playlist.id}
                                                        className="group cursor-pointer block hover:bg-gray-50 p-3 rounded-lg transition-colors"
                                                        onClick={() => {
                                                            window.location.href = `/playlist/${playlist.slug || playlist.id}`;
                                                        }}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="relative flex-shrink-0 overflow-hidden rounded-lg shadow-md border-2 border-gray-200 w-20 h-20 bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                                                                {playlist.cover_url ? (
                                                                    <img
                                                                        src={playlist.cover_url}
                                                                        alt={playlist.title}
                                                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                                                                    />
                                                                ) : (
                                                                    <ListMusic className="w-6 h-6 text-white opacity-30" />
                                                                )}
                                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                                                                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300">
                                                                        <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="text-gray-900 font-semibold text-xs line-clamp-2 group-hover:text-red-600 transition-colors">
                                                                    {playlist.title}
                                                                </h3>
                                                                <p className="text-gray-600 text-xs mt-0.5 line-clamp-1">{playlist.description}</p>
                                                                <p className="text-gray-500 text-xs mt-1">
                                                                    {(playlist.song_ids || []).length} músicas
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'downloads' && (
                            <div className="space-y-3">
                                {downloadsLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                                    </div>
                                ) : downloads.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Download className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500 text-lg">Nenhum download ainda</p>
                                        <p className="text-gray-400 text-sm">Baixe músicas e álbuns para ouvi-los offline</p>
                                    </div>
                                ) : (
                                    downloads.map((downloadedAlbum) => (
                                        <div
                                            key={downloadedAlbum.albumId}
                                            className="border border-gray-200 rounded-lg overflow-hidden"
                                        >
                                            {/* Card principal do álbum */}
                                            <div
                                                className="group cursor-pointer block hover:bg-gray-50 p-3 transition-colors"
                                                onClick={() => handlePlayDownloadedAlbum(downloadedAlbum)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="relative flex-shrink-0 overflow-hidden rounded-lg shadow-md border-2 border-gray-200">
                                                        <img
                                                            src={downloadedAlbum.coverUrl}
                                                            alt={downloadedAlbum.title}
                                                            className="w-20 h-20 object-cover transform group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                                                            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300">
                                                                <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-gray-900 font-semibold text-xs line-clamp-2 group-hover:text-red-600 transition-colors">
                                                            {downloadedAlbum.title}
                                                        </h3>
                                                        <p className="text-gray-600 text-xs mt-0.5">{downloadedAlbum.artist}</p>
                                                        <p className="text-gray-500 text-xs mt-1">
                                                            {downloadedAlbum.songCount}/{downloadedAlbum.totalSongs} músicas
                                                        </p>
                                                        <p className="text-gray-400 text-xs mt-1">
                                                            {new Date(downloadedAlbum.downloadedAt).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                    <div className="flex-shrink-0 flex gap-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setExpandedDownload(
                                                                    expandedDownload === downloadedAlbum.albumId 
                                                                        ? null 
                                                                        : downloadedAlbum.albumId
                                                                );
                                                            }}
                                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                            title={expandedDownload === downloadedAlbum.albumId ? "Recolher" : "Expandir"}
                                                        >
                                                            <ChevronDown 
                                                                className={`w-4 h-4 transition-transform ${
                                                                    expandedDownload === downloadedAlbum.albumId ? 'rotate-180' : ''
                                                                }`} 
                                                            />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteDownloadedAlbum(downloadedAlbum.albumId);
                                                                toast({
                                                                    title: 'Deletado',
                                                                    description: `${downloadedAlbum.title} foi removido`
                                                                });
                                                            }}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Deletar"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Lista de músicas (expansível) */}
                                            {expandedDownload === downloadedAlbum.albumId && (
                                                <div className="border-t border-gray-200 bg-gray-50 divide-y divide-gray-200">
                                                    {downloadedAlbum.songs.map((song, idx) => (
                                                        <div
                                                            key={song.id}
                                                            className="px-3 py-2 text-xs hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-2"
                                                            onClick={async () => {
                                                                try {
                                                                    // Garantir que cada música tem fileName
                                                                    const songsWithFileName = (downloadedAlbum.songs || []).map((s, i) => {
                                                                        if (s.fileName) return s;
                                                                        return {
                                                                            ...s,
                                                                            fileName: `${String(i + 1).padStart(2, '0')} - ${(s.title || 'desconhecido').replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_').substring(0, 100)}.mp3`
                                                                        };
                                                                    });
                                                                    
                                                                    const { songs: songsWithURLs, coverUrl } = await loadAlbumOfflineURLs(
                                                                        downloadedAlbum.albumDir, 
                                                                        songsWithFileName,
                                                                        downloadedAlbum.coverFileName
                                                                    );
                                                                    const queue = songsWithURLs.map(s => ({
                                                                        id: s.id,
                                                                        title: s.title,
                                                                        artist: downloadedAlbum.artist,
                                                                        album: downloadedAlbum.title,
                                                                        image: coverUrl || downloadedAlbum.coverUrl,
                                                                        audioUrl: s.audioUrl,
                                                                        isOffline: true,
                                                                        albumId: downloadedAlbum.albumId
                                                                    }));
                                                                    playSong(queue[idx], queue);
                                                                } catch (err) {
                                                                    console.error('Erro ao reproduzir música baixada:', err);
                                                                    toast({
                                                                        title: 'Erro',
                                                                        description: err.message || 'Não foi possível reproduzir',
                                                                        variant: 'destructive'
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            <Play className="w-3 h-3 text-gray-400" fill="currentColor" />
                                                            <span className="text-gray-600 font-medium w-5">{idx + 1}</span>
                                                            <span className="text-gray-700 flex-1 line-clamp-1">{song.title}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Library;
