import React, { useState } from 'react';
import { mockArtists } from '../../mock';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Camera, Save } from 'lucide-react';
import { toast } from '../../hooks/use-toast';

const Profile = () => {
  const [artist, setArtist] = useState(mockArtists[0]);
  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setArtist(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    toast({
      title: 'Perfil atualizado!',
      description: 'Suas informações foram salvas com sucesso'
    });
    setIsEditing(false);
  };

  const handleImageUpload = (type) => {
    toast({
      title: 'Imagem atualizada',
      description: `Sua ${type === 'avatar' ? 'foto de perfil' : 'capa'} foi atualizada`
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-red-950/20 to-black p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Meu Perfil</h1>
          <Button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            ) : (
              'Editar Perfil'
            )}
          </Button>
        </div>

        {/* Cover Image */}
        <Card className="bg-zinc-900 border-red-900/20 mb-6 overflow-hidden">
          <div className="relative h-64">
            <img
              src={artist.coverImage}
              alt="Capa"
              className="w-full h-full object-cover"
            />
            {isEditing && (
              <label
                htmlFor="coverUpload"
                className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer hover:bg-black/60 transition-colors"
              >
                <div className="text-center">
                  <Camera className="w-12 h-12 text-white mx-auto mb-2" />
                  <p className="text-white font-medium">Alterar Capa</p>
                </div>
                <input
                  id="coverUpload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={() => handleImageUpload('cover')}
                />
              </label>
            )}
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Picture */}
          <Card className="bg-zinc-900 border-red-900/20 lg:col-span-1">
            <CardContent className="pt-6">
              <div className="relative w-48 h-48 mx-auto mb-4">
                <img
                  src={artist.avatar}
                  alt={artist.name}
                  className="w-full h-full rounded-full object-cover"
                />
                {isEditing && (
                  <label
                    htmlFor="avatarUpload"
                    className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/60 transition-colors"
                  >
                    <Camera className="w-8 h-8 text-white" />
                    <input
                      id="avatarUpload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={() => handleImageUpload('avatar')}
                    />
                  </label>
                )}
              </div>
              <div className="text-center space-y-4">
                <div>
                  <p className="text-gray-400 text-sm">Seguidores</p>
                  <p className="text-2xl font-bold text-white">{artist.followers?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Ouvintes Mensais</p>
                  <p className="text-2xl font-bold text-white">{artist.monthlyListeners?.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card className="bg-zinc-900 border-red-900/20 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">Informações do Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Nome Artístico</Label>
                <Input
                  id="name"
                  name="name"
                  value={artist.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="bg-zinc-800 border-red-900/30 text-white disabled:opacity-70"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-white">Biografia</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={artist.bio}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows={4}
                  className="bg-zinc-800 border-red-900/30 text-white disabled:opacity-70 resize-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="genre" className="text-white">Gênero Musical</Label>
                  <Input
                    id="genre"
                    name="genre"
                    value="Pop, R&B"
                    disabled={!isEditing}
                    className="bg-zinc-800 border-red-900/30 text-white disabled:opacity-70"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-white">Localização</Label>
                  <Input
                    id="location"
                    name="location"
                    value="São Paulo, Brasil"
                    disabled={!isEditing}
                    className="bg-zinc-800 border-red-900/30 text-white disabled:opacity-70"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Redes Sociais</Label>
                <div className="space-y-3">
                  <Input
                    placeholder="Instagram"
                    disabled={!isEditing}
                    className="bg-zinc-800 border-red-900/30 text-white disabled:opacity-70"
                  />
                  <Input
                    placeholder="Twitter/X"
                    disabled={!isEditing}
                    className="bg-zinc-800 border-red-900/30 text-white disabled:opacity-70"
                  />
                  <Input
                    placeholder="YouTube"
                    disabled={!isEditing}
                    className="bg-zinc-800 border-red-900/30 text-white disabled:opacity-70"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;