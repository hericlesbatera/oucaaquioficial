import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from '../../hooks/use-toast';
import { Plus, Trash2, Search, GripVertical } from 'lucide-react';

const RecommendedAlbumsManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recommendedAlbums, setRecommendedAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

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
        albums!inner(id, title, cover_url, artist_name)
      `)
      .order('order_index', { ascending: true });

    if (data) setRecommendedAlbums(data);
    setLoading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from('albums')
      .select('id, title, cover_url, artist_name')
      .ilike('title', `%${searchTerm}%`)
      .or('is_private.is.null,is_private.eq.false')
      .is('deleted_at', null)
      .limit(15);

    if (data) {
      const recommended = new Set(recommendedAlbums.map(r => r.album_id));
      setSearchResults(data.filter(a => !recommended.has(a.id)));
    }
    setSearching(false);
  };

  const addRecommended = async (album) => {
    // Novo álbum vai para o FINAL da lista (ordem definida pelo admin)
    const maxOrder = recommendedAlbums.length > 0
      ? Math.max(...recommendedAlbums.map(r => r.order_index))
      : -1;

    const { data, error } = await supabase
      .from('recommended_albums')
      .insert({ album_id: album.id, order_index: maxOrder + 1 })
      .select('*, albums!inner(id, title, cover_url, artist_name)')
      .single();

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setRecommendedAlbums(prev => [...prev, data]);
      setSearchResults(prev => prev.filter(r => r.id !== album.id));
      toast({ title: 'Adicionado!', description: `"${album.title}" adicionado aos recomendados` });
    }
  };

  const removeRecommended = async (recommendedId, title) => {
    const { error } = await supabase
      .from('recommended_albums')
      .delete()
      .eq('id', recommendedId);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      const updated = recommendedAlbums
        .filter(r => r.id !== recommendedId)
        .map((r, i) => ({ ...r, order_index: i }));
      // Atualizar ordem no banco
      await Promise.all(updated.map(r =>
        supabase.from('recommended_albums').update({ order_index: r.order_index }).eq('id', r.id)
      ));
      setRecommendedAlbums(updated);
      toast({ title: 'Removido', description: `"${title}" removido dos recomendados` });
    }
  };

  // Drag and drop
  const handleDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(id);
  };

  const handleDrop = async (e, targetId) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null); setDragOverId(null);
      return;
    }

    const fromIndex = recommendedAlbums.findIndex(r => r.id === draggedId);
    const toIndex = recommendedAlbums.findIndex(r => r.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const newOrder = [...recommendedAlbums];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);

    // Atualizar order_index
    const withNewIndex = newOrder.map((r, i) => ({ ...r, order_index: i }));
    setRecommendedAlbums(withNewIndex);
    setDraggedId(null);
    setDragOverId(null);

    // Salvar no banco
    await Promise.all(withNewIndex.map(r =>
      supabase.from('recommended_albums').update({ order_index: r.order_index }).eq('id', r.id)
    ));
    toast({ title: 'Ordem salva!', description: 'A nova ordem foi aplicada na Home' });
  };

  const handleDragEnd = () => { setDraggedId(null); setDragOverId(null); };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ouça Aqui Recomenda!</h2>
        <p className="text-gray-600">
          Os álbuns adicionados aqui aparecem <strong>primeiro</strong> no carrossel da Home, na ordem definida abaixo.
          Arraste para reordenar.
        </p>
      </div>

      {/* Busca */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-3">Adicionar Álbum</h3>
        <form onSubmit={handleSearch} className="flex gap-2 mb-3">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar álbum pelo título..."
            className="flex-1 bg-white"
          />
          <Button type="submit" disabled={searching} className="bg-red-600 hover:bg-red-700 text-white">
            <Search className="w-4 h-4 mr-2" />
            {searching ? 'Buscando...' : 'Buscar'}
          </Button>
        </form>

        {searchResults.length > 0 && (
          <div className="space-y-2 mt-3 max-h-72 overflow-y-auto">
            {searchResults.map((album) => (
              <div key={album.id} className="flex items-center gap-3 bg-white p-3 rounded border border-blue-100">
                {album.cover_url && (
                  <img src={album.cover_url} alt={album.title} className="w-12 h-12 object-cover rounded flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{album.title}</p>
                  {album.artist_name && (
                    <p className="text-sm text-gray-500 truncate">{album.artist_name}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => addRecommended(album)}
                  className="bg-green-600 hover:bg-green-700 flex-shrink-0"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
            ))}
          </div>
        )}

        {searchResults.length === 0 && searchTerm && !searching && (
          <p className="text-sm text-blue-700 mt-2">Nenhum resultado. Tente outro termo.</p>
        )}
      </div>

      {/* Lista recomendados */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">
          Álbuns Fixados ({recommendedAlbums.length})
        </h3>
        <p className="text-sm text-gray-500 mb-3">Arraste para mudar a ordem. Esta é a sequência que aparecerá na Home.</p>

        {recommendedAlbums.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg text-center text-gray-500">
            <p className="text-lg mb-2">💭 Nenhum álbum fixado ainda</p>
            <p className="text-sm">Busque e adicione álbuns acima para começar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recommendedAlbums.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDrop={(e) => handleDrop(e, item.id)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 bg-white border rounded-lg p-3 transition-all cursor-grab ${
                  draggedId === item.id ? 'opacity-40' : ''
                } ${
                  dragOverId === item.id && draggedId !== item.id
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:shadow-sm'
                }`}
              >
                <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />

                <div className="w-7 h-7 flex items-center justify-center bg-red-600 text-white font-bold rounded text-sm flex-shrink-0">
                  {index + 1}
                </div>

                {item.albums?.cover_url && (
                  <img
                    src={item.albums.cover_url}
                    alt={item.albums.title}
                    className="w-12 h-12 object-cover rounded flex-shrink-0"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{item.albums?.title}</p>
                  {item.albums?.artist_name && (
                    <p className="text-sm text-gray-500 truncate">{item.albums.artist_name}</p>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeRecommended(item.id, item.albums?.title)}
                  className="text-red-600 hover:bg-red-50 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {recommendedAlbums.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-900">
            ✅ Estes {recommendedAlbums.length} álbum(ns) aparecem <strong>primeiro</strong> no carrossel "Ouça Aqui Recomenda!" da Home,
            na ordem acima. Os demais álbuns aparecem aleatoriamente após eles.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecommendedAlbumsManager;
