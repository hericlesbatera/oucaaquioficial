import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { Play, Heart, Share2, Download, ListMusic, X, BadgeCheck, Copy, Plus, ThumbsUp, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from '../hooks/use-toast';
import { usePlaylistFavorite } from '../hooks/use-playlist-favorite';
import SongListItem from '../components/SongListItem';
import LoadingSpinner from '../components/LoadingSpinner';
import CommentSection from '../components/CommentSection';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '../components/ui/popover';

const PlaylistPage = () => {
    const { playlistSlug } = useParams();
    const { playSong, currentSong, isPlaying } = usePlayer();
    const { user } = useAuth();
    const [playlist, setPlaylist] = useState(null);
    const [playlistSongs, setPlaylistSongs] = useState([]);
    const [creator, setCreator] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [recommendedPlaylists, setRecommendedPlaylists] = useState([]);

    // Use playlist favorite hook - will be set once playlist is loaded
    const playlistId = playlist?.id;
    const { isFavorite, toggleFavorite, loading: favoriteLoading } = usePlaylistFavorite(playlistId);

    // Função para recarregar e atualizar imagens das músicas
    const refreshPlaylistImages = useCallback(async () => {
        if (!playlist?.song_ids || playlist.song_ids.length === 0) return;

        try {
            toast({
                title: 'Atualizando imagens...',
                description: 'Sincronizando capas dos álbuns'
            });

            const { data: songs } = await supabase
                .from('songs')
                .select('*')
                .in('id', playlist.song_ids);

            if (songs) {
                const albumIds = [...new Set(songs.map(s => s.album_id).filter(Boolean))];
                const { data: albums } = albumIds.length > 0
                    ? await supabase
                        .from('albums')
                        .select('id, cover_url')
                        .in('id', albumIds)
                    : { data: [] };

                const albumMap = {};
                if (albums) {
                    albums.forEach(album => {
                        // Adicionar timestamp para forçar refresh
                        albumMap[album.id] = `${album.cover_url}?t=${new Date().getTime()}`;
                    });
                }

                const updatedSongs = playlist.song_ids
                    .map(id => songs.find(s => s.id === id))
                    .filter(Boolean)
                    .map(song => ({
                        id: song.id,
                        title: song.title,
                        artistName: song.artist_name,
                        artistId: song.artist_id,
                        albumId: song.album_id,
                        albumName: song.album_name,
                        coverImage: (song.album_id && albumMap[song.album_id]) || song.cover_url || '/placeholder-album.jpg',
                        audioUrl: song.audio_url,
                        duration: song.duration || 0
                    }));
                
                setPlaylistSongs(updatedSongs);
                toast({
                    title: 'Imagens atualizadas',
                    description: 'Capas dos álbuns sincronizadas com sucesso'
                });
            }
        } catch (error) {
            console.error('Erro ao atualizar imagens:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível atualizar as imagens',
                variant: 'destructive'
            });
        }
    }, [playlist?.song_ids, playlist?.id]);

    useEffect(() => {
        const loadPlaylist = async () => {
            // Force refresh by adding cache buster
            const timestamp = new Date().getTime();
            
            // Tentar buscar por slug primeiro
            let { data: playlistData } = await supabase
                .from('playlists')
                .select('*')
                .eq('slug', playlistSlug)
                .maybeSingle();

            // Se não encontrar por slug, tentar por ID (compatibilidade)
            if (!playlistData) {
                const { data: byId } = await supabase
                    .from('playlists')
                    .select('*')
                    .eq('id', playlistSlug)
                    .maybeSingle();
                playlistData = byId;
            }

            if (!playlistData) {
                setNotFound(true);
                setLoading(false);
                return;
            }

            setPlaylist({
                ...playlistData,
                download_count: playlistData.download_count || 0,
                play_count: playlistData.play_count || 0
            });

            const { data: creatorData } = await supabase
                .from('artists')
                .select('id, name, slug, avatar_url, is_verified')
                .eq('id', playlistData.user_id)
                .maybeSingle();

            setCreator(creatorData);

            if (playlistData.song_ids && playlistData.song_ids.length > 0) {
                const { data: songs } = await supabase
                    .from('songs')
                    .select('*')
                    .in('id', playlistData.song_ids);

                if (songs) {
                    // Buscar dados dos álbuns para pegar as imagens corretas
                    const albumIds = [...new Set(songs.map(s => s.album_id).filter(Boolean))];
                    const { data: albums } = albumIds.length > 0 
                        ? await supabase
                            .from('albums')
                            .select('id, cover_url')
                            .in('id', albumIds)
                        : { data: [] };

                    const albumMap = {};
                    if (albums) {
                        albums.forEach(album => {
                            albumMap[album.id] = album.cover_url;
                        });
                    }

                    const orderedSongs = playlistData.song_ids
                        .map(id => songs.find(s => s.id === id))
                        .filter(Boolean)
                        .map(song => ({
                            id: song.id,
                            title: song.title,
                            artistName: song.artist_name,
                            artistId: song.artist_id,
                            albumId: song.album_id,
                            albumName: song.album_name,
                            // Usar a imagem do álbum como prioridade, depois cover_url da música
                            coverImage: (song.album_id && albumMap[song.album_id]) || song.cover_url || '/placeholder-album.jpg',
                            audioUrl: song.audio_url,
                            duration: song.duration || 0
                        }));
                    setPlaylistSongs(orderedSongs);
                }
            }

            // Carregar playlists recomendadas
            try {
                const { data: otherPlaylists } = await supabase
                    .from('playlists')
                    .select('*')
                    .neq('id', playlistData.id)
                    .order('play_count', { ascending: false })
                    .limit(6);

                if (otherPlaylists && otherPlaylists.length > 0) {
                    const recommended = otherPlaylists.map(recPlaylist => ({
                        id: recPlaylist.id,
                        slug: recPlaylist.slug,
                        title: recPlaylist.title,
                        coverImage: recPlaylist.cover_url || '/images/default-playlist.jpg',
                        playCount: recPlaylist.play_count || 0,
                        downloadCount: recPlaylist.download_count || 0,
                        creatorId: recPlaylist.user_id
                    }));
                    setRecommendedPlaylists(recommended);
                }
            } catch (error) {
                console.error('Erro ao carregar playlists recomendadas:', error);
            }

            setLoading(false);
        };

        loadPlaylist();
    }, [playlistSlug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <LoadingSpinner size="medium" text="Carregando playlist..." />
            </div>
        );
    }

    if (notFound || !playlist) {
        return (
            <div className="fixed inset-0 top-16 bg-white flex flex-col items-center justify-center pb-32">
                <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
                        <ListMusic className="w-12 h-12 text-red-600" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                        <X className="w-5 h-5 text-white" />
                    </div>
                </div>
                <p className="text-gray-900 text-2xl font-bold mb-2">Playlist não encontrada</p>
                <p className="text-gray-500 mb-6">A playlist que você procura não existe ou foi removida.</p>
                <Link to="/">
                    <Button className="bg-red-600 hover:bg-red-700 text-white">
                        Voltar para Home
                    </Button>
                </Link>
            </div>
        );
    }

    const handlePlayPlaylist = async () => {
        if (playlistSongs.length > 0) {
            // playSong agora recebe playlistId como terceiro parâmetro
            // isso já incrementará o play_count automaticamente
            playSong(playlistSongs[0], playlistSongs, playlist.id);
            
            // Atualizar o play_count na UI imediatamente
            incrementPlayCount();
        }
    };

    const handlePlaySong = (song) => {
        playSong(song, playlistSongs, playlist.id);
        
        // Atualizar o play_count na UI imediatamente
        incrementPlayCount();
    };

    const incrementPlayCount = () => {
        setPlaylist(prev => ({
            ...prev,
            play_count: (prev.play_count || 0) + 1
        }));
    };

    const handleFavorite = async () => {
        if (!user) {
            toast({
                title: 'Login Necessário',
                description: 'Faça login para adicionar aos favoritos',
                variant: 'destructive'
            });
            return;
        }

        try {
            await toggleFavorite();
            toast({
                title: isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos',
                description: playlist.name
            });
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Erro ao atualizar favoritos',
                variant: 'destructive'
            });
        }
    };



    const handleDownloadAll = async () => {
        toast({
            title: 'Download Iniciado',
            description: `Baixando ${playlistSongs.length} músicas...`
        });

        // Incrementar download_count da playlist
        if (playlist.id) {
            try {
                await supabase
                    .from('playlists')
                    .update({ download_count: (playlist.download_count || 0) + 1 })
                    .eq('id', playlist.id);
                setPlaylist(prev => ({ ...prev, download_count: (prev.download_count || 0) + 1 }));
            } catch (error) {
                console.error('Erro ao incrementar download_count:', error);
            }
        }

        for (const song of playlistSongs) {
            if (song.audioUrl) {
                try {
                    const response = await fetch(song.audioUrl);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${song.title}.mp3`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    await new Promise(r => setTimeout(r, 500));
                } catch (error) {
                    console.error('Download error:', error);
                }
            }
        }
    };

    const formatDurationLocal = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-white pb-32">
            {/* Playlist Header */}
            <div className="relative bg-gradient-to-b from-red-900 to-black pt-20 pb-8">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-end gap-8">
                        <div
                            className="relative w-64 h-64 group cursor-pointer"
                            onClick={handlePlayPlaylist}
                        >
                            <img
                                src={playlist.cover_url || '/images/default-playlist.jpg'}
                                alt={playlist.title}
                                className="w-full h-full rounded-lg shadow-2xl object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 rounded-lg flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
                                    <Play className="w-8 h-8 text-white ml-1" fill="white" />
                                </div>
                            </div>
                        </div>
                        <div className="text-white pb-4 flex flex-col justify-between h-56">
                            <div>
                                <p className="text-sm uppercase tracking-wider mb-2">Playlist</p>
                                <h1 className="text-3xl font-bold mb-2 max-w-xl">{playlist.title}</h1>
                                {playlist.description && (
                                    <p className="text-gray-300 text-sm max-w-xl leading-relaxed">
                                        {playlist.description}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                                {/* Foto do criador */}
                                <div className="flex items-center">
                                    {creator && (
                                        <Link to={`/${creator.slug || creator.id}`} className="hover:z-20 relative z-10">
                                            <img
                                                src={creator.avatar_url || '/images/default-avatar.png'}
                                                alt={creator.name}
                                                className="w-8 h-8 rounded-full object-cover border-2 border-white"
                                            />
                                        </Link>
                                    )}
                                </div>

                                {/* Nome do criador */}
                                {creator && (
                                    <Link to={`/${creator.slug || creator.id}`} className="flex items-start hover:opacity-80 transition-opacity">
                                        <span className="text-lg">{creator.name}</span>
                                        {creator.is_verified && (
                                            <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center ml-0.5 mt-0.5">
                                                <BadgeCheck className="w-2 h-2 text-white" />
                                            </div>
                                        )}
                                    </Link>
                                )}

                                <span className="text-gray-400">•</span>
                                <span className="text-gray-400">{playlistSongs.length} músicas</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={handlePlayPlaylist}
                            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg"
                        >
                            <Play className="w-6 h-6 ml-1" fill="white" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleFavorite}
                            className="w-12 h-12 rounded-full border-gray-300 hover:border-red-600"
                        >
                            <Heart
                                className={`w-5 h-5 ${isFavorite ? 'fill-red-600 text-red-600' : 'text-gray-600'
                                    }`}
                            />
                        </Button>
                        <Button
                            onClick={handleDownloadAll}
                            className="bg-red-600 hover:bg-red-700 text-white px-8 h-12 text-base font-bold shadow-lg"
                        >
                            <Download className="w-5 h-5 mr-2" />
                            BAIXAR PLAYLIST
                        </Button>
                        <Button
                            onClick={refreshPlaylistImages}
                            variant="outline"
                            className="w-12 h-12 rounded-full border-gray-300 hover:border-red-600"
                            title="Atualizar imagens das músicas"
                        >
                            <RefreshCw className="w-5 h-5 text-gray-600" />
                        </Button>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="w-12 h-12 rounded-full border-gray-300 hover:border-red-600"
                                >
                                    <Share2 className="w-5 h-5 text-gray-600" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-3" side="right" align="center">
                                <div className="flex items-center gap-3">
                                    <button
                                        className="w-12 h-12 rounded-lg bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors"
                                        onClick={() => {
                                            const url = window.location.href;
                                            window.open(`https://wa.me/?text=${encodeURIComponent(`${playlist.title}\n${url}`)}`, '_blank');
                                        }}
                                        title="WhatsApp"
                                    >
                                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                    </button>
                                    <button
                                        className="w-12 h-12 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors"
                                        onClick={() => {
                                            const url = window.location.href;
                                            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                                        }}
                                        title="Facebook"
                                    >
                                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                        </svg>
                                    </button>
                                    <button
                                        className="w-12 h-12 rounded-lg bg-black hover:bg-gray-800 flex items-center justify-center transition-colors"
                                        onClick={() => {
                                            const url = window.location.href;
                                            window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(playlist.title)}`, '_blank');
                                        }}
                                        title="Twitter / X"
                                    >
                                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                    </button>
                                    <div className="w-px h-8 bg-gray-300"></div>
                                    <Button
                                        variant="outline"
                                        className="h-10 gap-2"
                                        onClick={() => {
                                            const url = window.location.href;
                                            navigator.clipboard.writeText(url);
                                            toast({
                                                title: 'Link copiado!',
                                                description: 'O link foi copiado para a área de transferência'
                                            });
                                        }}
                                    >
                                        <Copy className="w-4 h-4" />
                                        Copiar Link
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* Spacer */}
                        <div className="flex-1"></div>

                        {/* Stats */}
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-100 border border-gray-200 rounded overflow-hidden">
                                <div className="px-5 py-1.5 text-center">
                                    <span className="text-lg font-bold text-red-600">{playlist.download_count?.toLocaleString() || 0}</span>
                                </div>
                                <div className="border-t border-gray-300 px-5 py-1 text-center bg-gray-50">
                                    <span className="text-xs text-gray-500">Downloads</span>
                                </div>
                            </div>
                            <div className="bg-gray-100 border border-gray-200 rounded overflow-hidden">
                                <div className="px-5 py-1.5 text-center">
                                    <span className="text-lg font-bold text-gray-800">{playlist.play_count?.toLocaleString() || 0}</span>
                                </div>
                                <div className="border-t border-gray-300 px-5 py-1 text-center bg-gray-50">
                                    <span className="text-xs text-gray-500">Plays</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Songs List */}
            <div className="max-w-7xl mx-auto px-4 mt-8">
                {playlistSongs.length === 0 ? (
                    <div className="text-center py-20">
                        <ListMusic className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Esta playlist ainda não tem músicas</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-red-600 text-white px-4 py-3 rounded-t-lg">
                            <h2 className="text-xl font-bold">MÚSICAS DA PLAYLIST</h2>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-b-lg" style={{maxHeight: playlistSongs.length > 10 ? '550px' : 'auto', overflowY: playlistSongs.length > 10 ? 'auto' : 'visible'}}>
                            {playlistSongs.map((song, index) => (
                                <SongListItem
                                    key={song.id}
                                    song={song}
                                    index={index}
                                    onPlay={() => handlePlaySong(song)}
                                    showActions={true}
                                    formatDuration={formatDurationLocal}
                                    playlistId={playlist.id}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Ouça Aqui Recomenda Section */}
            <div className="max-w-7xl mx-auto px-4 mt-16 mb-16">
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                    <ThumbsUp className="w-8 h-8 text-red-600 flex-shrink-0" />
                    <h2 className="text-2xl md:text-3xl font-bold text-black whitespace-nowrap">Ouça Aqui Recomenda!</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {recommendedPlaylists.length === 0 ? (
                        <p className="text-gray-500 py-8 col-span-full">Nenhuma playlist disponível no momento.</p>
                    ) : (
                        recommendedPlaylists.map((recPlaylist) => (
                            <div key={recPlaylist.id}>
                                <Link
                                    to={`/playlist/${recPlaylist.slug || recPlaylist.id}`}
                                    className="group cursor-pointer block"
                                >
                                    <div className="relative mb-3 overflow-hidden rounded-lg shadow-lg">
                                        <img
                                            src={recPlaylist.coverImage}
                                            alt={recPlaylist.title}
                                            className="w-full aspect-square object-cover transform group-hover:scale-110 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                                            <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                                                <Play className="w-5 h-5 text-white ml-1" fill="white" />
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="text-black font-semibold text-sm mb-1 truncate group-hover:text-red-600 transition-colors">
                                        {recPlaylist.title}
                                    </h3>
                                </Link>
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                                        <span className="font-bold text-gray-700">{recPlaylist.playCount > 999 ? (recPlaylist.playCount / 1000).toFixed(1) + 'K' : recPlaylist.playCount}</span>
                                        <span className="text-gray-500">Plays</span>
                                    </div>
                                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                                        <span className="font-bold text-gray-700">{recPlaylist.downloadCount > 999 ? (recPlaylist.downloadCount / 1000).toFixed(1) + 'K' : recPlaylist.downloadCount}</span>
                                        <span className="text-gray-500">Downloads</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Comments Section */}
            <CommentSection playlistId={playlist?.id} artistId={creator?.id} />
        </div>
    );
};

export default PlaylistPage;
