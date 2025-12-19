import React, { useState } from 'react';
import { mockSongs, mockAlbums, formatDuration } from '../../mock';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Edit, Trash2, MoreVertical, Play, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { toast } from '../../hooks/use-toast';

const Songs = () => {
  const [songs] = useState(mockSongs.filter(s => s.artistId === 'a1'));
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [editFormData, setEditFormData] = useState({
    videoLink: ''
  });

  const getYouTubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleEdit = (album) => {
    setEditingAlbum(album);
    setEditFormData({
      videoLink: album.videoLink || ''
    });
  };

  const handleSaveEdit = async () => {
    try {
      // TODO: Implementar chamada à API para atualizar o álbum no banco de dados
      // Por enquanto apenas fechamos o modal e mostramos um toast
      toast({
        title: 'Sucesso',
        description: 'Link do vídeo atualizado com sucesso'
      });
      setEditingAlbum(null);
      setEditFormData({ videoLink: '' });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar o link do vídeo',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = (song) => {
    toast({
      title: 'Música Removida',
      description: `${song.title} foi removida com sucesso`,
      variant: 'destructive'
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-red-950/20 to-black p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Minhas Músicas</h1>
          <p className="text-gray-400">{songs.length} músicas publicadas</p>
        </div>
      </div>

      {/* Modal de Edição do Álbum */}
      {editingAlbum && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <Card className="bg-white shadow-lg w-full max-w-md mx-auto rounded-lg">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Editar Álbum: {editingAlbum.title}
                </h2>
                <button
                  onClick={() => setEditingAlbum(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <Label htmlFor="videoLink" className="text-gray-700 font-semibold block mb-2">
                  Link do Vídeo do YouTube (Opcional)
                </Label>
                <Input
                  id="videoLink"
                  type="url"
                  value={editFormData.videoLink}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, videoLink: e.target.value }))}
                  placeholder="https://youtu.be/EPquJPEilnPI"
                  className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {editFormData.videoLink && getYouTubeVideoId(editFormData.videoLink) 
                    ? '✓ Link do YouTube válido' 
                    : editFormData.videoLink 
                    ? '✗ Link do YouTube inválido' 
                    : 'Formato: https://youtu.be/... ou https://www.youtube.com/watch?v=...'}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingAlbum(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveEdit}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Salvar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Albums */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Álbuns</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {mockAlbums.filter(a => a.artistId === 'a1').map((album) => (
            <Card key={album.id} className="bg-zinc-900 border-red-900/20 p-4 hover:bg-zinc-800 transition-colors group">
              <div className="relative mb-4">
                <img
                  src={album.coverImage}
                  alt={album.title}
                  className="w-full aspect-square object-cover rounded-md"
                />
                <Button
                  className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play className="w-4 h-4 ml-0.5" />
                </Button>
              </div>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold mb-1 truncate">{album.title}</h3>
                  <p className="text-gray-400 text-sm">{album.songCount} músicas</p>
                  <p className="text-gray-500 text-xs mt-1">{album.releaseYear}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-zinc-900 border-red-900/30">
                    <DropdownMenuItem 
                      onClick={() => handleEdit(album)}
                      className="text-white hover:bg-red-900/20 cursor-pointer"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar Álbum
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-500 hover:bg-red-900/20">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir Álbum
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Songs List */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Todas as Músicas</h2>
        <div className="space-y-2">
          {songs.map((song, index) => (
            <div
              key={song.id}
              className="flex items-center gap-4 p-4 rounded-lg hover:bg-red-900/20 transition-colors group"
            >
              <span className="text-gray-400 w-8">{index + 1}</span>
              <img
                src={song.coverImage}
                alt={song.title}
                className="w-14 h-14 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{song.title}</p>
                <p className="text-gray-400 text-sm truncate">{song.albumName}</p>
              </div>
              <div className="text-right">
                <p className="text-white text-sm">{song.plays?.toLocaleString()}</p>
                <p className="text-gray-400 text-xs">reproduções</p>
              </div>
              <p className="text-gray-400 text-sm w-16 text-center">
                {formatDuration(song.duration)}
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-zinc-900 border-red-900/30">
                  <DropdownMenuItem
                    onClick={() => handleEdit(song)}
                    className="text-white hover:bg-red-900/20 cursor-pointer"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Música
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(song)}
                    className="text-red-500 hover:bg-red-900/20 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Música
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Songs;