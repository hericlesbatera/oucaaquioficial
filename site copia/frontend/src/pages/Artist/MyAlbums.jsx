import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { Play, Edit, Trash2, Plus, Disc, RotateCcw, Clock, Music, X, Upload, Image } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import ArtistSidebar from '../../components/Artist/ArtistSidebar';
import { toast } from '../../hooks/use-toast';

const MyAlbums = () => {
  const { user } = useAuth();
  const [activeAlbums, setActiveAlbums] = useState([]);
  const [trashedAlbums, setTrashedAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('published');
  const [artistSlug, setArtistSlug] = useState(null);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', coverImage: '' });
  const [albumSongs, setAlbumSongs] = useState([]);
  const [newCoverFile, setNewCoverFile] = useState(null);
  const [newCoverPreview, setNewCoverPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const coverInputRef = useRef(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState(null);
  
  const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false);
  const [albumToPermanentDelete, setAlbumToPermanentDelete] = useState(null);

  useEffect(() => {
    loadAlbums();
    loadArtistSlug();
  }, [user?.id]);

  const loadArtistSlug = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('artists')
      .select('slug')
      .eq('id', user.id)
      .maybeSingle();
    if (data?.slug) {
      setArtistSlug(data.slug);
    }
  };

  const loadAlbums = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      const { data: allAlbums, error } = await supabase
        .from('albums')
        .select('*')
        .eq('artist_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const now = new Date();
      const active = [];
      const trashed = [];
      
      (allAlbums || []).forEach(album => {
        const albumData = {
          id: album.id,
          slug: album.slug,
          title: album.title,
          coverImage: album.cover_url || '/images/default-album.png',
          songCount: album.song_count || 0,
          releaseYear: album.release_year,
          genre: album.genre,
          description: album.description,
          deletedAt: album.deleted_at
        };
        
        if (album.deleted_at) {
          const deletedDate = new Date(album.deleted_at);
          const daysSinceDelete = Math.floor((now - deletedDate) / (1000 * 60 * 60 * 24));
          albumData.daysRemaining = 30 - daysSinceDelete;
          
          if (albumData.daysRemaining > 0) {
            trashed.push(albumData);
          }
        } else {
          active.push(albumData);
        }
      });
      
      setActiveAlbums(active);
      setTrashedAlbums(trashed);
    } catch (error) {
      console.error('Erro ao carregar álbuns:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os álbuns',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToTrash = async () => {
    if (!albumToDelete) return;
    
    try {
      const { error } = await supabase
        .from('albums')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', albumToDelete.id);
      
      if (error) throw error;
      
      toast({
        title: 'Álbum movido para lixeira',
        description: `"${albumToDelete.title}" ficará na lixeira por 30 dias`
      });
      
      loadAlbums();
    } catch (error) {
      console.error('Erro ao mover para lixeira:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível mover o álbum para lixeira',
        variant: 'destructive'
      });
    } finally {
      setDeleteDialogOpen(false);
      setAlbumToDelete(null);
    }
  };

  const handleRestore = async (album) => {
    try {
      const { error } = await supabase
        .from('albums')
        .update({ deleted_at: null })
        .eq('id', album.id);
      
      if (error) throw error;
      
      toast({
        title: 'Álbum restaurado',
        description: `"${album.title}" foi restaurado com sucesso`
      });
      
      loadAlbums();
    } catch (error) {
      console.error('Erro ao restaurar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível restaurar o álbum',
        variant: 'destructive'
      });
    }
  };

  const handlePermanentDelete = async () => {
    if (!albumToPermanentDelete) return;
    
    try {
      await supabase
        .from('songs')
        .delete()
        .eq('album_id', albumToPermanentDelete.id);
      
      const { error } = await supabase
        .from('albums')
        .delete()
        .eq('id', albumToPermanentDelete.id);
      
      if (error) throw error;
      
      toast({
        title: 'Álbum excluído permanentemente',
        description: `"${albumToPermanentDelete.title}" foi excluído`
      });
      
      loadAlbums();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o álbum',
        variant: 'destructive'
      });
    } finally {
      setPermanentDeleteDialogOpen(false);
      setAlbumToPermanentDelete(null);
    }
  };

  const openEditDialog = async (album) => {
    setEditingAlbum(album);
    setEditForm({
      title: album.title,
      description: album.description || '',
      coverImage: album.coverImage
    });
    setNewCoverFile(null);
    setNewCoverPreview(null);
    
    const { data: songs } = await supabase
      .from('songs')
      .select('*')
      .eq('album_id', album.id)
      .order('track_number', { ascending: true });
    
    setAlbumSongs(songs || []);
    setEditDialogOpen(true);
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSong = async (songId) => {
    try {
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId);
      
      if (error) throw error;
      
      setAlbumSongs(prev => prev.filter(s => s.id !== songId));
      
      await supabase
        .from('albums')
        .update({ song_count: albumSongs.length - 1 })
        .eq('id', editingAlbum.id);
      
      toast({
        title: 'Música removida',
        description: 'A música foi removida do álbum'
      });
    } catch (error) {
      console.error('Erro ao remover música:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a música',
        variant: 'destructive'
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingAlbum) return;
    setSaving(true);
    
    try {
      let coverUrl = editForm.coverImage;
      
      if (newCoverFile) {
        const fileExt = newCoverFile.name.split('.').pop();
        const fileName = `albums/${editingAlbum.id}/cover_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('music')
          .upload(fileName, newCoverFile, { upsert: true });
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('music')
          .getPublicUrl(fileName);
        
        coverUrl = publicUrl;
      }
      
      const { error } = await supabase
        .from('albums')
        .update({
          title: editForm.title,
          description: editForm.description,
          cover_url: coverUrl,
          song_count: albumSongs.length
        })
        .eq('id', editingAlbum.id);
      
      if (error) throw error;
      
      toast({
        title: 'Álbum atualizado',
        description: 'As alterações foram salvas com sucesso'
      });
      
      setEditDialogOpen(false);
      loadAlbums();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as alterações',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const renderAlbumCard = (album, isTrash = false) => (
    <Card key={album.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="relative mb-4 group">
          <img
            src={album.coverImage}
            alt={album.title}
            className={`w-full aspect-square object-cover rounded-lg ${isTrash ? 'opacity-60' : ''}`}
          />
          {!isTrash && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 rounded-lg flex items-center justify-center">
              <Link to={`/${artistSlug || user?.id}/${album.slug || album.id}`}>
                <Button
                  className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play className="w-6 h-6 ml-1" fill="white" />
                </Button>
              </Link>
            </div>
          )}
          {isTrash && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {album.daysRemaining} dias
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{album.title}</h3>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{album.songCount} músicas</span>
            <span>{album.releaseYear}</span>
          </div>
          
          {isTrash ? (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRestore(album)}
                className="flex-1 border-green-300 text-green-600 hover:bg-green-50"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Restaurar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAlbumToPermanentDelete(album);
                  setPermanentDeleteDialogOpen(true);
                }}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditDialog(album)}
                className="flex-1 border-gray-300 text-gray-700"
              >
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAlbumToDelete(album);
                  setDeleteDialogOpen(true);
                }}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ArtistSidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Álbuns</h1>
              <p className="text-gray-600">
                {loading ? 'Carregando...' : `${activeAlbums.length} álbuns publicados`}
              </p>
            </div>
            <Link to="/artist/upload">
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                <Plus className="w-5 h-5 mr-2" />
                Novo Álbum
              </Button>
            </Link>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="published" className="flex items-center gap-2">
                <Disc className="w-4 h-4" />
                Publicados ({activeAlbums.length})
              </TabsTrigger>
              <TabsTrigger value="trash" className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Lixeira ({trashedAlbums.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="published">
              {activeAlbums.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {activeAlbums.map(album => renderAlbumCard(album, false))}
                </div>
              ) : (
                <Card className="bg-white shadow-sm">
                  <div className="p-12 text-center">
                    <Disc className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum álbum ainda</h3>
                    <p className="text-gray-600 mb-6">Comece a compartilhar sua música com o mundo</p>
                    <Link to="/artist/upload">
                      <Button className="bg-red-600 hover:bg-red-700 text-white">
                        <Plus className="w-5 h-5 mr-2" />
                        Fazer Primeiro Upload
                      </Button>
                    </Link>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="trash">
              {trashedAlbums.length > 0 ? (
                <>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 text-sm">
                  <strong>Atenção:</strong> Os álbuns na lixeira serão excluídos permanentemente após 30 dias.
                      Você pode restaurá-los a qualquer momento antes disso.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {trashedAlbums.map(album => renderAlbumCard(album, true))}
                  </div>
                </>
              ) : (
                <Card className="bg-white shadow-sm">
                  <div className="p-12 text-center">
                    <Trash2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Lixeira vazia</h3>
                    <p className="text-gray-600">Nenhum álbum na lixeira</p>
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Álbum</DialogTitle>
            <DialogDescription>
              Altere as informações do álbum ou remova músicas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="flex gap-6">
              <div className="relative">
                <img
                  src={newCoverPreview || editForm.coverImage}
                  alt="Capa do álbum"
                  className="w-40 h-40 object-cover rounded-lg"
                />
                <input
                  type="file"
                  ref={coverInputRef}
                  onChange={handleCoverChange}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => coverInputRef.current?.click()}
                  className="absolute bottom-2 right-2 bg-white/90"
                >
                  <Image className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Título</label>
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Descrição</label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => {
                      if (e.target.value.length <= 150) {
                        setEditForm({ ...editForm, description: e.target.value });
                      }
                    }}
                    className="mt-1"
                    rows={3}
                    maxLength={150}
                  />
                  <p className={`text-xs mt-1 ${editForm.description.length >= 150 ? 'text-red-500' : 'text-gray-500'}`}>
                    {editForm.description.length}/150 caracteres
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Music className="w-4 h-4" />
                Músicas do Álbum ({albumSongs.length})
              </h4>
              <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                {albumSongs.length > 0 ? (
                  albumSongs.map((song, index) => (
                    <div key={song.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 w-6 text-center">{index + 1}</span>
                        <span className="font-medium">{song.title}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSong(song.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    Nenhuma música neste álbum
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveEdit} 
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mover para lixeira?</AlertDialogTitle>
            <AlertDialogDescription>
              O álbum "{albumToDelete?.title}" será movido para a lixeira e ficará lá por 30 dias. 
              Você pode restaurá-lo a qualquer momento durante esse período.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMoveToTrash}
              className="bg-red-600 hover:bg-red-700"
            >
              Mover para Lixeira
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={permanentDeleteDialogOpen} onOpenChange={setPermanentDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              O álbum "{albumToPermanentDelete?.title}" e todas as suas músicas serão excluídos permanentemente. 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyAlbums;
