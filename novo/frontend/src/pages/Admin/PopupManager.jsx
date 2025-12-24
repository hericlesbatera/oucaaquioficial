import React, { useState, useEffect } from 'react';
import { supabase, SUPABASE_URL } from '../../lib/supabaseClient';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { toast } from '../../hooks/use-toast';
import { Upload, Trash2, Eye, EyeOff } from 'lucide-react';

const PopupManager = () => {
  const [popup, setPopup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newImage, setNewImage] = useState(null);
  const [newLink, setNewLink] = useState('');

  useEffect(() => {
    loadPopup();
  }, []);

  const loadPopup = async () => {
    const { data, error } = await supabase
      .from('homepage_popup')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setPopup(data);
      setNewLink(data.link_url || '');
    }
    setLoading(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const fileName = `popup-${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from('popups')
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

    const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/popups/${fileName}`;
    setNewImage(imageUrl);
    setUploading(false);
  };

  const handleSavePopup = async () => {
    if (!newImage && !popup?.image_url) {
      toast({
        title: 'Erro',
        description: 'Selecione uma imagem',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    if (popup?.id) {
      // Atualizar existente
      const { error } = await supabase
        .from('homepage_popup')
        .update({
          image_url: newImage || popup.image_url,
          link_url: newLink || null,
          updated_at: new Date()
        })
        .eq('id', popup.id);

      if (error) {
        toast({
          title: 'Erro ao salvar',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        setPopup({
          ...popup,
          image_url: newImage || popup.image_url,
          link_url: newLink || null
        });
        setNewImage(null);
        toast({
          title: 'Sucesso',
          description: 'Pop-up atualizado com sucesso'
        });
      }
    } else {
      // Criar novo
      const { data, error } = await supabase
        .from('homepage_popup')
        .insert({
          image_url: newImage,
          link_url: newLink || null,
          active: true
        })
        .select()
        .single();

      if (error) {
        toast({
          title: 'Erro ao criar',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        setPopup(data);
        setNewImage(null);
        setNewLink('');
        toast({
          title: 'Sucesso',
          description: 'Pop-up criado com sucesso'
        });
      }
    }

    setLoading(false);
  };

  const handleDeletePopup = async () => {
    if (!popup?.id) return;

    if (!window.confirm('Tem certeza que quer deletar este pop-up?')) {
      return;
    }

    setLoading(true);

    // Deletar do storage
    if (popup.image_url) {
      const fileName = popup.image_url.split('/').pop();
      await supabase.storage.from('popups').remove([fileName]);
    }

    const { error } = await supabase
      .from('homepage_popup')
      .delete()
      .eq('id', popup.id);

    if (error) {
      toast({
        title: 'Erro ao deletar',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      setPopup(null);
      setNewImage(null);
      setNewLink('');
      toast({
        title: 'Deletado',
        description: 'Pop-up removido com sucesso'
      });
    }

    setLoading(false);
  };

  const toggleActive = async () => {
    if (!popup?.id) return;

    const { error } = await supabase
      .from('homepage_popup')
      .update({
        active: !popup.active,
        updated_at: new Date()
      })
      .eq('id', popup.id);

    if (error) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      setPopup({ ...popup, active: !popup.active });
      toast({
        title: popup.active ? 'Desativado' : 'Ativado',
        description: `Pop-up foi ${popup.active ? 'desativado' : 'ativado'}`
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pop-up da Home</h2>
        <p className="text-gray-600">
          Gerenciar o pop-up que aparece ao abrir a página inicial
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8">
        <label className="flex flex-col items-center cursor-pointer">
          <Upload className="w-12 h-12 text-gray-400 mb-2" />
          <span className="text-gray-600 font-medium mb-1">Clique para upload nova imagem</span>
          <span className="text-sm text-gray-400">JPG, PNG ou GIF</span>
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

      {/* Preview */}
      {(newImage || popup?.image_url) && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Prévia:</p>
          <img
            src={newImage || popup?.image_url}
            alt="Pop-up preview"
            className="w-full max-h-96 object-cover rounded"
          />
          {newImage && (
            <p className="text-xs text-green-600 mt-2">✓ Nova imagem selecionada</p>
          )}
        </div>
      )}

      {/* Link Input */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <Label className="text-gray-700 font-medium mb-2 block">
          Link (opcional)
        </Label>
        <Input
          value={newLink}
          onChange={(e) => setNewLink(e.target.value)}
          placeholder="Ex: /album/123 ou https://..."
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-2">
          Deixe em branco para o pop-up não ter link clicável
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleSavePopup}
          disabled={loading || (!newImage && !popup?.id)}
          className="bg-green-600 hover:bg-green-700 flex-1"
        >
          {popup?.id ? 'Atualizar' : 'Criar'} Pop-up
        </Button>

        {popup?.id && (
          <>
            <Button
              onClick={toggleActive}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {popup.active ? (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Ativo
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Inativo
                </>
              )}
            </Button>

            <Button
              onClick={handleDeletePopup}
              disabled={loading}
              variant="outline"
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Deletar
            </Button>
          </>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        <p className="font-medium mb-2">ℹ️ Informações:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>O pop-up aparece apenas uma vez ao abrir a home</li>
          <li>Use o link para direcionar usuários a um álbum, artista, ou página externa</li>
          <li>A imagem é exibida em forma de modal popup</li>
        </ul>
      </div>
    </div>
  );
};

export default PopupManager;
