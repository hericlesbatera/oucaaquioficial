import React, { useCallback, useState, useEffect } from 'react';
import { Heart, Plus, Download, X, BadgeCheck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { recordSongDownload } from '../lib/statsHelper';
import { Button } from './ui/button';
import { toast } from '../hooks/use-toast';
import { useMusicFavorite } from '../hooks/use-music-favorite';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { useAlbumImage } from '../hooks/useAlbumImage';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from './ui/dialog';

const CreditsIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 256 256" height="1.25em" width="1.25em" xmlns="http://www.w3.org/2000/svg">
        <path d="M144,80a8,8,0,0,1,8-8h96a8,8,0,0,1,0,16H152A8,8,0,0,1,144,80Zm104,40H152a8,8,0,0,0,0,16h96a8,8,0,0,0,0-16Zm0,48H176a8,8,0,0,0,0,16h72a8,8,0,0,0,0-16Zm-96.25,22a8,8,0,0,1-5.76,9.74,7.55,7.55,0,0,1-2,.26,8,8,0,0,1-7.75-6c-6.16-23.94-30.34-42-56.25-42s-50.09,18.05-56.25,42a8,8,0,0,1-15.5-4c5.59-21.71,21.84-39.29,42.46-48a48,48,0,1,1,58.58,0C129.91,150.71,146.16,168.29,151.75,190ZM80,136a32,32,0,1,0-32-32A32,32,0,0,0,80,136Z" />
    </svg>
);

const MenuIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path fill="none" strokeLinejoin="round" strokeWidth="48" d="M144 144h320M144 256h320M144 368h320"></path>
        <path fill="none" strokeLinecap="square" strokeLinejoin="round" strokeWidth="32" d="M64 128h32v32H64zm0 112h32v32H64zm0 112h32v32H64z"></path>
    </svg>
);

const cleanTitle = (title) => {
    return title?.replace(/\.mp3$/i, '') || '';
};

export const SongListItem = ({
    song,
    index,
    onPlay,
    onDownload,
    showActions = true,
    formatDuration,
    playlistId = null
}) => {
    const { user } = useAuth();
    const { isFavorite, toggleFavorite } = useMusicFavorite(song?.id);
    const { playSong } = usePlayer();
    const [creditsDialogOpen, setCreditsDialogOpen] = useState(false);
    const [artistData, setArtistData] = useState(null);
    
    // Usar hook para garantir que a imagem do álbum carregue corretamente
    const { imageUrl: albumImageUrl } = useAlbumImage(
        song?.albumId,
        song?.coverImage || '/placeholder-album.jpg'
    );
    // Usar a imagem do hook, mas fallback para a original se não estiver disponível
    const displayImageUrl = albumImageUrl || song?.coverImage || '/placeholder-album.jpg';

    useEffect(() => {
        if (creditsDialogOpen) {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        } else {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [creditsDialogOpen]);

    const handleFavoritClick = useCallback(async (e) => {
        e.stopPropagation();

        if (!user) {
            toast({
                title: 'Login Necessário',
                description: 'Faça login para favoritar músicas',
                variant: 'destructive'
            });
            return;
        }

        try {
            await toggleFavorite();
            toast({
                title: isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos',
                description: song.title
            });
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Erro ao atualizar favoritos',
                variant: 'destructive'
            });
        }
    }, [song?.id, song?.title, user, isFavorite, toggleFavorite]);

    const handleAddToPlaylist = useCallback((e) => {
        e.stopPropagation();
        if (!user) {
            toast({
                title: 'Login Necessário',
                description: 'Faça login para adicionar à playlist'
            });
        }
    }, [user]);

    const handleDownload = useCallback(async (e) => {
        e.stopPropagation();

        if (!song.audioUrl) {
            toast({
                title: 'Download Indisponível',
                description: 'Arquivo não disponível',
                variant: 'destructive'
            });
            return;
        }

        toast({
            title: 'Download Iniciado',
            description: song.title
        });

        try {
            // Registrar download da música
            if (song.id) {
                const albumId = song.albumId || song.album_id || song.albumid;
                recordSongDownload(song.id, albumId);
            }

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
        } catch (error) {
            console.error('Download error:', error);
            toast({
                title: 'Erro no Download',
                description: 'Não foi possível baixar o arquivo',
                variant: 'destructive'
            });
        }
    }, [song?.audioUrl, song?.title, song?.id]);

    const handleAddToQueue = useCallback((e) => {
        e.stopPropagation();

        if (!song) return;

        playSong(song, [song], playlistId);
        toast({
            title: 'Adicionado ao player',
            description: cleanTitle(song.title)
        });
    }, [song, playSong, playlistId]);

    const handleCreditsClick = useCallback(async (e) => {
        e.stopPropagation();
        setCreditsDialogOpen(true);

        // Buscar dados do artista
        if (song?.artistId) {
            try {
                const { data } = await supabase
                    .from('artists')
                    .select('name, is_verified, avatar_url')
                    .eq('id', song.artistId)
                    .maybeSingle();

                if (data) {
                    setArtistData(data);
                }
            } catch (error) {
                console.error('Erro ao buscar dados do artista:', error);
            }
        }
    }, [song?.artistId]);

    const defaultFormatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    return (
        <>
            <div
                className="flex items-center gap-4 px-4 py-3 hover:bg-gray-100 transition-colors rounded-md mb-2 group cursor-pointer"
            >
                {/* Número da Faixa */}
                <span className="text-gray-600 w-8 text-center font-medium flex-shrink-0">
                    {String(index + 1).padStart(2, '0')}.
                </span>

                {/* Capa */}
                <img
                    src={displayImageUrl}
                    alt={song.title}
                    className="w-16 h-16 rounded object-cover flex-shrink-0"
                    onError={(e) => { e.target.src = '/placeholder-album.jpg'; }}
                />

                {/* Informações */}
                <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onPlay?.()}
                >
                    <p className="text-red-600 font-semibold truncate text-sm">
                        {song.title}
                    </p>
                    <p className="text-gray-600 text-sm truncate">{song.artistName}</p>
                </div>

                {/* Ações */}
                {showActions && (
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleFavoritClick}
                            title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                        >
                            <Heart
                                className={`w-5 h-5 ${isFavorite ? 'fill-red-600 text-red-600' : 'text-gray-600 hover:text-red-600'
                                    }`}
                            />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleAddToQueue}
                            title="Adicionar ao player"
                        >
                            <Plus className="w-5 h-5 text-gray-600" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleAddToPlaylist}
                            title="Adicionar à playlist"
                        >
                            <MenuIcon />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCreditsClick}
                            title="Créditos da música"
                        >
                            <CreditsIcon />
                        </Button>
                        <span className="text-gray-600 text-sm w-12 text-right">
                            {(formatDuration || defaultFormatDuration)(song.duration)}
                        </span>
                        <Button
                            onClick={handleDownload}
                            variant="outline"
                            size="sm"
                            className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                        >
                            ↓ BAIXAR
                        </Button>
                    </div>
                )}
            </div>

            <Dialog open={creditsDialogOpen} onOpenChange={setCreditsDialogOpen}>
                <DialogContent className="max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>Créditos</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Seção da Música */}
                        <div className="flex gap-3">
                            <img
                                src={displayImageUrl}
                                alt={song?.title}
                                className="w-16 h-16 rounded object-cover"
                                onError={(e) => { e.target.src = '/placeholder-album.jpg'; }}
                            />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900 mb-2">
                                    {cleanTitle(song?.title)}
                                </p>
                                <div className="flex items-center gap-1">
                                    {artistData?.avatar_url && (
                                        <img
                                            src={artistData.avatar_url}
                                            alt={artistData.name}
                                            className="w-4 h-4 rounded-full object-cover"
                                        />
                                    )}
                                    <span className="text-xs text-gray-600">{artistData?.name || song?.artistName}</span>
                                    {artistData?.is_verified && (
                                        <BadgeCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Seção de Composição */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Composição de</h3>
                            {song?.composer ? (
                                <p className="text-base text-gray-900">{song.composer}</p>
                            ) : (
                                <div>
                                    <p className="text-gray-600">Não encontrado</p>
                                    <button className="text-red-600 text-sm hover:underline mt-2">
                                        Faça uma sugestão
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            variant="outline"
                            onClick={(e) => {
                                e.stopPropagation();
                                setCreditsDialogOpen(false);
                            }}
                        >
                            Fechar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default SongListItem;
