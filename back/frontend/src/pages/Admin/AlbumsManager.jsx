import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from '../../hooks/use-toast';
import { Search, Trash2, AlertCircle } from 'lucide-react';

const AlbumsManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite o nome de um álbum para buscar',
        variant: 'destructive'
      });
      return;
    }

    setSearching(true);
    const { data, error } = await supabase
      .from('albums')
      .select('id, title, artist_id, created_at, description')
      .ilike('title', `%${searchTerm}%`)
      .limit(20);

    if (error) {
      toast({
        title: 'Erro na busca',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      setAlbums(data || []);
    }
    setSearching(false);
  };

  const handleDeleteAlbum = async (albumId) => {
    setLoading(true);
    try {
      // Deletar todas as tracks associadas
      const { error: tracksError } = await supabase
        .from('tracks')
        .delete()
        .eq('album_id', albumId);

      // Deletar comentários associados
      const { error: commentsError } = await supabase
        .from('comments')
        .delete()
        .eq('album_id', albumId);

      // Deletar favoritos
      const { error: favoritesError } = await supabase
        .from('favorites')
        .delete()
        .eq('album_id', albumId);

      // Deletar de recomendados
      const { error: recommendedError } = await supabase
        .from('recommended_albums')
        .delete()
        .eq('album_id', albumId);

      // Deletar o álbum
      const { error: albumError } = await supabase
        .from('albums')
        .delete()
        .eq('id', albumId);

      if (albumError || tracksError || commentsError || favoritesError || recommendedError) {
        throw new Error('Erro ao deletar álbum');
      }

      setAlbums(albums.filter(a => a.id !== albumId));
      setDeleteConfirm(null);
      toast({
        title: 'Sucesso',
        description: 'Álbum e todo seu conteúdo foram deletados permanentemente'
      });
    } catch (error) {
      toast({
        title: 'Erro ao deletar',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Gerenciar Álbuns</h2>
        <p className="text-gray-600 mb-6">Busque um álbum para removê-lo permanentemente do site</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Nome do álbum..."
          className="flex-1"
        />
        <Button type="submit" disabled={searching}>
          <Search className="w-4 h-4 mr-2" />
          {searching ? 'Buscando...' : 'Buscar'}
        </Button>
      </form>

      {/* Results */}
      <div className="space-y-3">
        {albums.length === 0 && searchTerm && !searching && (
          <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
            Nenhum álbum encontrado
          </div>
        )}

        {albums.map((album) => (
          <div
            key={album.id}
            className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{album.title}</h3>
              <p className="text-sm text-gray-500 mt-1">
                ID: {album.id}
              </p>
              {album.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {album.description}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Criado em: {new Date(album.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>

            {deleteConfirm === album.id ? (
              <div className="flex gap-2 ml-4">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteAlbum(album.id)}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading ? 'Deletando...' : 'Confirmar Delete'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeleteConfirm(album.id)}
                className="text-red-600 hover:bg-red-50 ml-4"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Warning */}
      {albums.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">⚠️ Ação Irreversível</p>
            <p className="text-sm text-red-800 mt-1">
              Deletar um álbum removerá permanentemente: o álbum, todas as músicas, comentários e favoritos associados. Esta ação não pode ser desfeita.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlbumsManager;
