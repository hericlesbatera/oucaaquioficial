import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { mockAlbums, mockSongs, formatDuration } from '../mock';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { Play, Heart, Share2, Download, Plus, BadgeCheck, Copy, X, Disc } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from '../hooks/use-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';

const AlbumPage = () => {
  const { artistSlug, albumSlug } = useParams();
  const navigate = useNavigate();
  const { playSong } = usePlayer();
  const { user, isPremium } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [album, setAlbum] = useState(null);
  const [albumSongs, setAlbumSongs] = useState([]);
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadAlbum = async () => {
      // Verificar se artistSlug é um artista válido (não aceita "album" como slug)
      if (artistSlug === 'album') {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Buscar artista por slug
      let { data: artistData } = await supabase
        .from('artists')
        .select('*')
        .eq('slug', artistSlug)
        .maybeSingle();
      
      // Se não encontrar por slug, tenta por ID
      if (!artistData) {
        const { data: artistById } = await supabase
          .from('artists')
          .select('*')
          .eq('id', artistSlug)
          .maybeSingle();
        artistData = artistById;
      }
      
      if (!artistData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      
      setArtist(artistData);

      // Buscar álbum por slug
      let { data: supabaseAlbum } = await supabase
        .from('albums')
        .select('*')
        .eq('slug', albumSlug)
        .maybeSingle();
      
      // Se não encontrar por slug, tenta por ID do álbum
      if (!supabaseAlbum) {
        const { data: albumById } = await supabase
          .from('albums')
          .select('*')
          .eq('id', albumSlug)
          .maybeSingle();
        supabaseAlbum = albumById;
      }
      
      if (!supabaseAlbum) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setAlbum({
        id: supabaseAlbum.id,
        slug: supabaseAlbum.slug,
        title: supabaseAlbum.title,
        artistName: supabaseAlbum.artist_name,
        artistId: supabaseAlbum.artist_id,
        coverImage: supabaseAlbum.cover_url || '/images/default-album.png',
        releaseYear: supabaseAlbum.release_year,
        description: supabaseAlbum.description,
        genre: supabaseAlbum.genre,
        archiveUrl: supabaseAlbum.archive_url,
        download_count: supabaseAlbum.download_count || 0,
        play_count: supabaseAlbum.play_count || 0
      });
      
      // Buscar músicas do álbum
      const { data: songs } = await supabase
        .from('songs')
        .select('*')
        .eq('album_id', supabaseAlbum.id)
        .order('track_number', { ascending: true });
      
      if (songs) {
        setAlbumSongs(songs.map(song => ({
          id: song.id,
          title: song.title,
          artistName: song.artist_name,
          artistId: song.artist_id,
          albumId: song.album_id,
          albumName: song.album_name,
          coverImage: song.cover_url,
          audioUrl: song.audio_url,
          duration: song.duration || 0,
          trackNumber: song.track_number
        })));
      }
      
      setLoading(false);
    };
    
    loadAlbum();
  }, [artistSlug, albumSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (notFound || !album) {
    return (
      <div className="fixed inset-0 top-16 bg-white flex flex-col items-center justify-center pb-32">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
            <Disc className="w-12 h-12 text-red-600" />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </div>
        </div>
        <p className="text-gray-900 text-2xl font-bold mb-2">Álbum não encontrado</p>
        <p className="text-gray-500 mb-6">O álbum que você procura não existe ou foi removido.</p>
        <Link to="/">
          <Button className="bg-red-600 hover:bg-red-700 text-white">
            Voltar para Home
          </Button>
        </Link>
      </div>
    );
  }

  const handlePlayAlbum = async () => {
    if (albumSongs.length > 0) {
      playSong(albumSongs[0], albumSongs);
      
      // Incrementar play_count
      if (album.id) {
        const { error } = await supabase.rpc('increment_play_count', { album_id: album.id });
        if (!error) {
          setAlbum(prev => ({ ...prev, play_count: (prev.play_count || 0) + 1 }));
        } else {
          // Fallback: update direto
          await supabase
            .from('albums')
            .update({ play_count: (album.play_count || 0) + 1 })
            .eq('id', album.id);
          setAlbum(prev => ({ ...prev, play_count: (prev.play_count || 0) + 1 }));
        }
      }
    }
  };

  const handleDownloadAlbum = async () => {
    if (album.archiveUrl) {
      toast({
        title: 'Download Iniciado',
        description: `Baixando ${album.title}...`
      });
      try {
        // Incrementar contador de downloads
        if (album.id) {
          const { data, error } = await supabase.rpc('increment_download_count', { album_id: album.id });
          if (!error) {
            setAlbum(prev => ({ ...prev, download_count: (prev.download_count || 0) + 1 }));
          } else {
            // Fallback: update direto
            await supabase
              .from('albums')
              .update({ download_count: (album.download_count || 0) + 1 })
              .eq('id', album.id);
            setAlbum(prev => ({ ...prev, download_count: (prev.download_count || 0) + 1 }));
          }
        }

        const response = await fetch(album.archiveUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const extension = album.archiveUrl.includes('.rar') ? 'rar' : 'zip';
        link.download = `${album.title}.${extension}`;
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
    } else {
      toast({
        title: 'Download Indisponível',
        description: 'O arquivo do álbum não está disponível',
        variant: 'destructive'
      });
    }
  };

  const handleFavorite = () => {
    if (!user) {
      toast({
        title: 'Login Necessário',
        description: 'Faça login para adicionar aos favoritos',
        variant: 'destructive'
      });
      return;
    }
    setIsFavorite(!isFavorite);
    toast({
      title: isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos',
      description: album.title
    });
  };

  const formatDurationLocal = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Album Header */}
      <div className="relative bg-gradient-to-b from-red-900 to-black pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end gap-8">
            <div 
              className="relative w-64 h-64 group cursor-pointer"
              onClick={handlePlayAlbum}
            >
              <img
                src={album.coverImage}
                alt={album.title}
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
                <p className="text-sm uppercase tracking-wider mb-2">Álbum</p>
                <h1 className="text-3xl font-bold mb-2 max-w-xl">{album.title}</h1>
                {album.description && (
                  <p className="text-gray-300 text-sm max-w-xl leading-relaxed">
                    <span className="text-gray-400">Descrição:</span> {album.description.length > 150 ? `${album.description.slice(0, 150)}...` : album.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/${artist?.slug || album.artistId}`} className="flex items-center gap-2 hover:text-red-400 transition-colors">
                  <img
                    src={artist?.avatar_url || artist?.profile_image || '/images/default-avatar.png'}
                    alt={album.artistName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-xl flex items-center gap-2">
                    {album.artistName}
                    {artist?.is_verified && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <BadgeCheck className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </span>
                </Link>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400">{album.releaseYear}</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400">{albumSongs.length} músicas</span>
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
              onClick={handlePlayAlbum}
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
                className={`w-5 h-5 ${
                  isFavorite ? 'fill-red-600 text-red-600' : 'text-gray-600'
                }`}
              />
            </Button>
            <Button
              onClick={handleDownloadAlbum}
              className="bg-red-600 hover:bg-red-700 text-white px-8 h-12 text-base font-bold shadow-lg"
            >
              <Download className="w-5 h-5 mr-2" />
              BAIXAR CD COMPLETO
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
                      window.open(`https://wa.me/?text=${encodeURIComponent(`${album.title} - ${album.artistName}\n${url}`)}`, '_blank');
                    }}
                    title="WhatsApp"
                  >
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
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
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>
                  <button
                    className="w-12 h-12 rounded-lg bg-black hover:bg-gray-800 flex items-center justify-center transition-colors"
                    onClick={() => {
                      const url = window.location.href;
                      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`${album.title} - ${album.artistName}`)}`, '_blank');
                    }}
                    title="Twitter / X"
                  >
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
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
                  <span className="text-lg font-bold text-red-600">{album.download_count?.toLocaleString() || 0}</span>
                </div>
                <div className="border-t border-gray-300 px-5 py-1 text-center bg-gray-50">
                  <span className="text-xs text-gray-500">Downloads</span>
                </div>
              </div>
              <div className="bg-gray-100 border border-gray-200 rounded overflow-hidden">
                <div className="px-5 py-1.5 text-center">
                  <span className="text-lg font-bold text-gray-800">{album.play_count?.toLocaleString() || 0}</span>
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
        <div className="bg-red-600 text-white px-4 py-3 rounded-t-lg">
          <h2 className="text-xl font-bold">MÚSICAS DO CD</h2>
        </div>
        <div className="bg-white border border-gray-200 rounded-b-lg">
          {albumSongs.map((song, index) => (
            <div
              key={song.id}
              className="flex items-center gap-4 px-4 py-3 hover:bg-red-50 transition-colors border-b border-gray-100 last:border-0 group cursor-pointer"
              onClick={() => playSong(song, albumSongs)}
            >
              <span className="text-gray-600 w-8 text-center font-medium">{String(index + 1).padStart(2, '0')}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-black font-medium truncate">{song.title}</p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!user) {
                      toast({
                        title: 'Login Necessário',
                        description: 'Faça login para adicionar à playlist'
                      });
                    }
                  }}
                >
                  <Plus className="w-5 h-5 text-gray-600" />
                </Button>
                <span className="text-gray-600 text-sm w-12 text-right">
                  {formatDurationLocal(song.duration)}
                </span>
                <Button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (song.audioUrl) {
                      toast({
                        title: 'Download Iniciado',
                        description: song.title
                      });
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
                      } catch (error) {
                        console.error('Download error:', error);
                        toast({
                          title: 'Erro no Download',
                          description: 'Não foi possível baixar o arquivo',
                          variant: 'destructive'
                        });
                      }
                    } else {
                      toast({
                        title: 'Download Indisponível',
                        description: 'Arquivo não disponível',
                        variant: 'destructive'
                      });
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ↓ BAIXAR
                </Button>
              </div>
            </div>
          ))}
          
          {albumSongs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma música encontrada neste álbum
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlbumPage;
