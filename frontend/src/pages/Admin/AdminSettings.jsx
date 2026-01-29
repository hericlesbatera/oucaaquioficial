import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Upload, Lock, Save } from 'lucide-react';
import { toast } from '../../hooks/use-toast';

const AdminSettings = () => {
  const { user } = useAuth();
  const [adminData, setAdminData] = useState({
    email: user?.email || '',
    avatar_url: null
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    loadAdminData();
  }, [user?.id]);

  const loadAdminData = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setAdminData({
        email: data.email || user.email,
        avatar_url: data.avatar_url
      });
      if (data.avatar_url) {
        setPreviewUrl(data.avatar_url);
      }
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileName = `admin-${user.id}-${Date.now()}.${file.name.split('.').pop()}`;
      
      // Upload para a pasta avatars (usa a mesma do site)
      const { error } = await supabase.storage
        .from('avatars')
        .upload(`admin/${fileName}`, file, { upsert: true });

      if (error) throw error;

      // Gerar URL pública
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(`admin/${fileName}`);

      const publicUrl = data?.publicUrl;

      setAdminData(prev => ({
        ...prev,
        avatar_url: publicUrl
      }));
      setPreviewUrl(publicUrl);
      
      toast({
        title: 'Sucesso',
        description: 'Avatar atualizado com sucesso!'
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao fazer upload da imagem',
        variant: 'destructive'
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({
          email: adminData.email,
          avatar_url: adminData.avatar_url
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Configurações atualizadas com sucesso!'
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configurações',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwords.new || !passwords.confirm) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos de senha',
        variant: 'destructive'
      });
      return;
    }

    if (passwords.new !== passwords.confirm) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive'
      });
      return;
    }

    if (passwords.new.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter no mínimo 6 caracteres',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) throw error;

      setPasswords({ current: '', new: '', confirm: '' });
      setShowPasswordForm(false);
      
      toast({
        title: 'Sucesso',
        description: 'Senha alterada com sucesso!'
      });
    } catch (error) {
      console.error('Password change error:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao alterar senha',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Avatar do Administrador</h2>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
            {previewUrl ? (
              <img src={previewUrl} alt="Admin avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-2xl font-bold">
                A
              </div>
            )}
          </div>
          <div className="flex-1">
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="hidden"
              />
              <Button
                type="button"
                onClick={(e) => e.target.closest('label').querySelector('input').click()}
                disabled={uploadingImage}
                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {uploadingImage ? 'Enviando...' : 'Alterar Avatar'}
              </Button>
            </label>
            <p className="text-sm text-gray-500 mt-2">Máximo 5MB. Formatos: JPG, PNG</p>
          </div>
        </div>
      </div>

      {/* Email Section */}
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Email</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <Input
              type="email"
              value={adminData.email}
              onChange={(e) => setAdminData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Segurança</h2>
        
        {!showPasswordForm ? (
          <Button
            onClick={() => setShowPasswordForm(true)}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Alterar Senha
          </Button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha Atual</label>
              <Input
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                placeholder="Digite sua senha atual"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
              <Input
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                placeholder="Digite a nova senha"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Senha</label>
              <Input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                placeholder="Confirme a nova senha"
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handlePasswordChange}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? 'Alterando...' : 'Alterar Senha'}
              </Button>
              <Button
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswords({ current: '', new: '', confirm: '' });
                }}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="bg-white rounded-lg p-6">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 w-full justify-center"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
