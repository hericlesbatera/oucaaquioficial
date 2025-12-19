import React, { useState, useEffect } from 'react';
import { supabase, SUPABASE_URL } from '../../lib/supabaseClient';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from '../../hooks/use-toast';
import { Upload, Trash2, GripVertical, Save } from 'lucide-react';

const SlidesManager = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const [draggedOverId, setDraggedOverId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSlides();
  }, []);

  const loadSlides = async () => {
    const { data, error } = await supabase
      .from('slides')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (data) {
      setSlides(data);
    }
    setLoading(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const fileName = `slide-${Date.now()}-${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('slides')
      .upload(fileName, file);

    if (error) {
      toast({
        title: 'Erro no upload',
        description: error.message,
        variant: 'destructive'
      });
      setUploading(false);
      return;
    }

    const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/slides/${fileName}`;
    
    // Adicionar novo slide
    const { data: newSlide, error: insertError } = await supabase
      .from('slides')
      .insert({
        image_url: imageUrl,
        order_index: slides.length + 1,
        active: true
      })
      .select()
      .single();

    if (insertError) {
      toast({
        title: 'Erro ao salvar',
        description: insertError.message,
        variant: 'destructive'
      });
    } else {
      setSlides([...slides, newSlide]);
      toast({
        title: 'Slide adicionado!',
        description: 'Imagem enviada com sucesso'
      });
    }
    setUploading(false);
  };

  const updateSlide = async (id, field, value) => {
    // Apenas atualizar state local (não salva no banco ainda)
    const updated = slides.map(s => s.id === id ? { ...s, [field]: value } : s);
    setSlides(updated);
    setHasChanges(true);
  };

  const saveAllChanges = async () => {
    setIsSaving(true);
    try {
      console.log('Salvando', slides.length, 'slides...');
      
      // Salvar todas as mudanças em paralelo
      const results = await Promise.all(
        slides.map(slide => {
          console.log(`Salvando slide ${slide.id}:`, {
            title: slide.title,
            link: slide.link,
            order_index: slide.order_index,
            active: slide.active
          });
          
          return supabase
            .from('slides')
            .update({
              title: slide.title || null,
              link: slide.link || null,
              order_index: slide.order_index,
              active: slide.active
            })
            .eq('id', slide.id);
        })
      );

      console.log('Resultados:', results);
      
      const hasErrors = results.some(r => r.error);

      if (!hasErrors) {
        toast({
          title: 'Salvo!',
          description: 'Todas as mudanças foram salvas com sucesso'
        });
        setHasChanges(false);
      } else {
        const errors = results.filter(r => r.error).map(r => r.error.message);
        console.error('Erros ao salvar:', errors);
        toast({
          title: 'Erro ao salvar',
          description: errors[0] || 'Algumas mudanças não foram salvas',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao salvar mudanças',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSlide = async (id, imageUrl) => {
    // Deletar do storage
    const fileName = imageUrl.split('/').pop();
    await supabase.storage.from('slides').remove([fileName]);
    
    // Deletar do banco
    const { error } = await supabase
      .from('slides')
      .delete()
      .eq('id', id);

    if (!error) {
      setSlides(slides.filter(s => s.id !== id));
      toast({
        title: 'Slide removido',
        description: 'Slide deletado com sucesso'
      });
    }
  };

  const toggleActive = async (id, currentValue) => {
    await updateSlide(id, 'active', !currentValue);
  };

  const handleDragStart = (e, slideId) => {
    setDraggedId(slideId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, slideId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverId(slideId);
  };

  const handleDragLeave = () => {
    setDraggedOverId(null);
  };

  const handleDrop = (e, targetSlideId) => {
    e.preventDefault();
    
    if (draggedId === targetSlideId) {
      setDraggedId(null);
      setDraggedOverId(null);
      return;
    }

    // Encontrar índices
    const draggedIndex = slides.findIndex(s => s.id === draggedId);
    const targetIndex = slides.findIndex(s => s.id === targetSlideId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reordenar array
    const newSlides = [...slides];
    const [draggedSlide] = newSlides.splice(draggedIndex, 1);
    newSlides.splice(targetIndex, 0, draggedSlide);

    // Atualizar order_index para todos
    newSlides.forEach((slide, index) => {
      slide.order_index = index + 1;
    });

    // Apenas atualizar local - salvar com o botão "Salvar Mudanças"
    setSlides(newSlides);
    setHasChanges(true);

    setDraggedId(null);
    setDraggedOverId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Slides</h1>
            <Button
              onClick={saveAllChanges}
              disabled={isSaving || !hasChanges}
              className={`flex items-center gap-2 ${hasChanges ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-300 text-gray-500'}`}
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Salvando...' : 'Salvar Mudanças'}
            </Button>
          </div>
          
          {hasChanges && (
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              ⚠️ Você tem mudanças não salvas. Clique em "Salvar Mudanças" para confirmar.
            </div>
          )}
          
          {/* Upload de novo slide */}
          <div className="mb-8 p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <label className="flex flex-col items-center cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mb-2" />
              <span className="text-gray-600 mb-2">Clique para adicionar novo slide</span>
              <span className="text-sm text-gray-400">JPG, PNG (recomendado: 1600x1000px - proporção 1.6:1)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            {uploading && <p className="text-center text-red-600 mt-2">Enviando...</p>}
          </div>

          {/* Lista de slides */}
          <div className="space-y-4">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                draggable
                onDragStart={(e) => handleDragStart(e, slide.id)}
                onDragOver={(e) => handleDragOver(e, slide.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, slide.id)}
                className={`flex items-center gap-4 p-4 border rounded-lg transition-all ${
                  slide.active ? 'bg-white' : 'bg-gray-100 opacity-60'
                } ${draggedId === slide.id ? 'opacity-50' : ''} ${
                  draggedOverId === slide.id ? 'border-red-500 bg-red-50' : ''
                }`}
              >
                <GripVertical className={`w-5 h-5 cursor-grab ${
                  draggedId === slide.id ? 'text-red-600' : 'text-gray-400'
                }`} />
                
                <span className="w-8 h-8 flex items-center justify-center bg-red-600 text-white rounded font-bold">
                  {index + 1}
                </span>
                
                <img
                  src={slide.image_url}
                  alt={slide.title || `Slide ${index + 1}`}
                  className="w-32 h-20 object-cover rounded"
                />
                
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Título (opcional)</Label>
                    <Input
                      value={slide.title || ''}
                      onChange={(e) => updateSlide(slide.id, 'title', e.target.value)}
                      placeholder="Título do slide"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Link do Álbum</Label>
                    <Input
                      value={slide.link || ''}
                      onChange={(e) => updateSlide(slide.id, 'link', e.target.value)}
                      placeholder="/album/ID-DO-ALBUM"
                      className="h-9"
                    />
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleActive(slide.id, slide.active)}
                  className={slide.active ? 'text-green-600' : 'text-gray-400'}
                >
                  {slide.active ? 'Ativo' : 'Inativo'}
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => deleteSlide(slide.id, slide.image_url)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            
            {slides.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                Nenhum slide cadastrado. Adicione o primeiro acima.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlidesManager;
