import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from '../../hooks/use-toast';
import { Plus, Trash2, Search } from 'lucide-react';

const RecommendedAlbumsManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recommendedAlbums, setRecommendedAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadRecommendedAlbums();
  }, []);

  const loadRecommendedAlbums = async () => {
    const { data, error } = await supabase
      .from('recommended_albums')
      .select(`
        id,
        album_id,
        order_index,
        albums!inner(id, title, description)
      `)
      .order('order_index', { ascending: true });

    if (data) {
      setRecommendedAlbums(data);
    }
    setLoading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const { data, error } = await supabase
      .from('albums')
      .select('id, title, description')
      .ilike('title', `%${searchTerm}%`)
      .limit(10);

    if (data) {
      // Filtrar álbuns já recomendados
      const recommended = recommendedAlbums.map(r => r.album_id);
      setSearchResults(data.filter(a => !recommended.includes(a.id)));
    }
    setSearching(false);
  };

  const addRecommended = async (albumId, title) => {
    const maxOrder = recommendedAlbums.length > 0
      ? Math.max(...recommendedAlbums.map(r => r.order_index))
      : 0;

    const { data, error } = await supabase
      .from('recommended_albums')
      .insert({
        album_id: albumId,
        order_index: maxOrder + 1
      })
      .select('*, albums!inner(id, title, description)')
      .single();

    if (error) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      setRecommendedAlbums([...recommendedAlbums, data]);
      setSearchResults(searchResults.filter(r => r.id !== albumId));
      toast({
        title: 'Sucesso',
        description: `"${title}" adicionado aos recomendados`
      });
    }
  };

  const removeRecommended = async (recommendedId, title) => {
    const { error } = await supabase
      .from('recommended_albums')
      .delete()
      .eq('id', recommendedId);

    if (error) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      setRecommendedAlbums(recommendedAlbums.filter(r => r.id !== recommendedId));
      toast({
        title: 'Removido',
        description: `"${title}" removido dos recomendados`
      });
    }
  };

  const reorderRecommended = async (newOrder) => {
    // Atualizar ordem de todos
    for (let i = 0; i < newOrder.length; i++) {
      await supabase
        .from('recommended_albums')
        .update({ order_index: i })
        .eq('id', newOrder[i].id);
    }
    setRecommendedAlbums(newOrder);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Ouça Aqui Recomenda!
        </h2>
        <p className="text-gray-600">
          Gerencie os álbuns recomendados que aparecem na home e na página de álbuns
        </p>
      </div>

      {/* Search to Add */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-3">Adicionar Álbum</h3>
        <form onSubmit={handleSearch} className="flex gap-2 mb-3">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar álbum para adicionar..."
            className="flex-1"
          />
          <Button type="submit" disabled={searching}>
            <Search className="w-4 h-4 mr-2" />
            {searching ? 'Buscando...' : 'Buscar'}
          </Button>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2 mt-3">
            {searchResults.map((album) => (
              <div
                key={album.id}
                className="flex items-center justify-between bg-white p-3 rounded border border-blue-100"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{album.title}</p>
                  {album.description && (
                    <p className="text-sm text-gray-500 line-clamp-1">
                      {album.description}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => addRecommended(album.id, album.title)}
                  className="bg-green-600 hover:bg-green-700 ml-2"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current Recommended */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">
          Álbuns Recomendados ({recommendedAlbums.length})
        </h3>

        {recommendedAlbums.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg text-center text-gray-500">
            <p className="text-lg mb-2">📭 Nenhum álbum recomendado ainda</p>
            <p className="text-sm">Busque e adicione álbuns acima para começar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recommendedAlbums.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-red-600 text-white font-bold rounded">
                  {index + 1}
                </div>

                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {item.albums.title}
                  </p>
                  {item.albums.description && (
                    <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                      {item.albums.description}
                    </p>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeRecommended(item.id, item.albums.title)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Remover
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      {recommendedAlbums.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-900">
            💡 Os álbuns são exibidos na ordem mostrada acima. Arraste para reordenar (feature em desenvolvimento).
          </p>
        </div>
      )}
    </div>
  );
};

export default RecommendedAlbumsManager;
