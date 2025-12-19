import React, { useCallback, useState, useEffect } from 'react';
import { Heart, Plus, Download, X, BadgeCheck, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { recordSongDownload } from '../lib/statsHelper';
import { Button } from './ui/button';
import { toast } from '../hooks/use-toast';
import { useMusicFavorite } from '../hooks/use-music-favorite';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from './ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from './ui/sheet';

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

const CreatePlaylistIcon = () => (
  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <path fill="none" d="M0 0h24v24H0z"></path>
    <path d="M14 10H3v2h11v-2zm0-4H3v2h11V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM3 16h7v-2H3v2z"></path>
  </svg>
);

const cleanTitle = (title) => {
  return title?.replace(/\.mp3$/i, '') || '';
};

export const AlbumSongRow = ({ 
   song, 
   index, 
   onPlay, 
   onPlayMobile,
   formatDuration,
   isHighlighted = false
 }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isFavorite, toggleFavorite } = useMusicFavorite(song?.id);
    const { playSong } = usePlayer();
    const [creditsDialogOpen, setCreditsDialogOpen] = useState(false);
    const [artistData, setArtistData] = useState(null);
    const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [loadingPlaylists, setLoadingPlaylists] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [creatingPlaylist, setCreatingPlaylist] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);

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

  const loadUserPlaylists = useCallback(async () => {
    if (!user) return;
    
    setLoadingPlaylists(true);
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('id, title, cover_url, song_ids')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUserPlaylists(data || []);
    } catch (error) {
      console.error('Erro ao carregar playlists:', error);
    } finally {
      setLoadingPlaylists(false);
    }
  }, [user]);

  const handleAddToPlaylist = useCallback((e) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: 'Login Necessário',
        description: 'Faça login para adicionar à playlist'
      });
      return;
    }
    
    setSheetOpen(false);
    loadUserPlaylists();
    setPlaylistModalOpen(true);
  }, [user, loadUserPlaylists]);

  const handleAddSongToPlaylist = useCallback(async (playlist) => {
    if (!song?.id || !playlist?.id) return;
    
    try {
      const currentSongIds = playlist.song_ids || [];
      
      // Verificar se a música já está na playlist
      if (currentSongIds.includes(song.id)) {
        toast({
          title: 'Música já está na playlist',
          description: cleanTitle(song.title),
          variant: 'destructive'
        });
        return;
      }
      
      // Adicionar música à playlist usando song_ids array
      const newSongIds = [...currentSongIds, song.id];
      
      const { error } = await supabase
        .from('playlists')
        .update({ song_ids: newSongIds })
        .eq('id', playlist.id);
      
      if (error) throw error;
      
      toast({
        title: 'Música adicionada!',
        description: cleanTitle(song.title)
      });
      setPlaylistModalOpen(false);
    } catch (error) {
      console.error('Erro ao adicionar música:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a música',
        variant: 'destructive'
      });
    }
  }, [song?.id, song?.title]);

  const handleCreatePlaylist = useCallback(async () => {
    if (!newPlaylistName.trim() || !user || !song?.id) return;
    
    if (newPlaylistName.trim().length < 5) {
      toast({
        title: 'Erro',
        description: 'O título deve ter no mínimo 5 caracteres',
        variant: 'destructive'
      });
      return;
    }
    
    setCreatingPlaylist(true);
    try {
      // Gerar slug igual ao painel
      const generateSlug = (text) => {
        return text
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
      };
      
      const slug = generateSlug(newPlaylistName.trim());
      
      const { data, error } = await supabase
        .from('playlists')
        .insert({
          user_id: user.id,
          slug: slug,
          title: newPlaylistName.trim(),
          description: '',
          cover_url: null,
          is_public: false,
          song_ids: [song.id],
          play_count: 0
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'Playlist criada!',
        description: `"${newPlaylistName.trim()}" com a música adicionada`
      });
      
      setNewPlaylistName('');
      setPlaylistModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar playlist:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a playlist',
        variant: 'destructive'
      });
    } finally {
      setCreatingPlaylist(false);
    }
  }, [newPlaylistName, user, song?.id]);

  const handleViewProfile = useCallback((e) => {
    e.stopPropagation();
    setSheetOpen(false);
    
    if (song?.artistSlug) {
      navigate(`/${song.artistSlug}`);
    } else {
      toast({
        title: 'Perfil não disponível',
        description: 'Informações do artista não encontradas',
        variant: 'destructive'
      });
    }
  }, [song?.artistSlug, navigate]);

  const handleAddToQueue = useCallback((e) => {
    e.stopPropagation();
    
    if (!song) return;
    
    playSong(song, [song]);
    toast({
      title: 'Adicionado ao player',
      description: cleanTitle(song.title)
    });
  }, [song, playSong]);

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

  return (
    <div
      className={`flex items-center gap-3 md:gap-4 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-red-100 transition-colors ${
        isHighlighted ? 'bg-blue-100' : ''
      }`}
    >
      <span className="text-gray-600 w-6 md:w-8 text-center font-medium text-sm md:text-base">
        {String(index + 1).padStart(2, '0')}.
      </span>
      <div 
        className="flex-1 min-w-0 cursor-pointer" 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const isMobile = window.innerWidth < 768;
          if (isMobile) {
            onPlayMobile?.(song);
          } else {
            onPlay?.(song);
          }
        }}
      >
         <p className="text-black font-medium truncate text-sm md:text-base">{cleanTitle(song.title)}</p>
       </div>
      
      {/* Mobile: menu e opções */}
      <div className="md:hidden flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleAddToPlaylist}
          title="Adicionar à playlist"
          className="h-8 w-8"
        >
          <MenuIcon />
        </Button>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              title="Mais opções"
              className="h-8 w-8"
            >
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="5" r="2"></circle>
                <circle cx="12" cy="12" r="2"></circle>
                <circle cx="12" cy="19" r="2"></circle>
              </svg>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="p-6">
            <div className="space-y-3">
              {/* Favoritar */}
              <button
                onClick={(e) => {
                  handleFavoritClick(e);
                  setSheetOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded transition-colors"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-600 text-red-600' : 'text-gray-600'}`} />
                <span className="text-base">{isFavorite ? 'Remover dos favoritos' : 'Favoritar Música'}</span>
              </button>

              {/* Adicionar à fila */}
              <button
                onClick={(e) => {
                  handleAddToQueue(e);
                  setSheetOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded transition-colors"
              >
                <MenuIcon className="w-5 h-5 text-gray-600" />
                <span className="text-base">Adicionar à fila</span>
              </button>

              {/* Ver Perfil */}
              <button
                onClick={handleViewProfile}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                <span className="text-base">Ver Perfil</span>
              </button>

              {/* Adicionar à Playlist */}
              <button
                onClick={handleAddToPlaylist}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded transition-colors"
              >
                <CreatePlaylistIcon className="w-5 h-5 text-gray-600" />
                <span className="text-base">Adicionar à Playlist</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: todos os botões */}
      <div className="hidden md:flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFavoritClick}
          title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart
            className={`w-5 h-5 ${
              isFavorite ? 'fill-red-600 text-red-600' : 'text-gray-600 hover:text-red-600'
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
          {formatDuration(song.duration)}
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

      <Dialog open={creditsDialogOpen} onOpenChange={setCreditsDialogOpen}>
        <DialogContent className="max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Créditos</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Seção da Música */}
            <div className="flex gap-3">
              <img
                src={song?.coverImage}
                alt={song?.title}
                className="w-16 h-16 rounded object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                    {String(song?.trackNumber || 0).padStart(2, '0')} - {cleanTitle(song?.title)}
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

      {/* Modal de Adicionar à Playlist */}
      <Dialog open={playlistModalOpen} onOpenChange={setPlaylistModalOpen}>
        <DialogContent className="max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Adicionar à Playlist</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Criar nova playlist */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome da nova playlist..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <Button
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim() || creatingPlaylist}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {creatingPlaylist ? '...' : <Plus className="w-4 h-4" />}
              </Button>
            </div>

            {/* Separador */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">ou escolha uma playlist</span>
              </div>
            </div>

            {/* Lista de playlists */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {loadingPlaylists ? (
                <p className="text-center text-gray-500 py-4">Carregando...</p>
              ) : userPlaylists.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Você ainda não tem playlists</p>
              ) : (
                userPlaylists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddSongToPlaylist(playlist)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                      {playlist.cover_url ? (
                        <img
                          src={playlist.cover_url}
                          alt={playlist.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-red-100">
                          <CreatePlaylistIcon className="w-6 h-6 text-red-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-900 block truncate">{playlist.title}</span>
                      <span className="text-xs text-gray-500">{playlist.song_ids?.length || 0} músicas</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setPlaylistModalOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
          
export default AlbumSongRow;
