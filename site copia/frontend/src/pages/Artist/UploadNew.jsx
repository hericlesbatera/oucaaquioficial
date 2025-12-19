import React, { useState } from 'react';
import { Image as ImageIcon, CheckCircle, Upload } from 'lucide-react';
import { Progress } from '../../components/ui/progress';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ArtistSidebar from '../../components/Artist/ArtistSidebar';

const UploadNew = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    coverImage: null,
    albumFile: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, [fileType]: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.albumFile || !formData.genre) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha título, gênero e arquivo do álbum',
        variant: 'destructive'
      });
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);
    
    try {
      // Criar FormData para enviar ao backend
      const uploadData = new FormData();
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description || '');
      uploadData.append('genre', formData.genre);
      uploadData.append('artistId', user?.id || '');
      uploadData.append('artistName', user?.name || 'Artista');
      uploadData.append('albumFile', formData.albumFile);
      
      if (formData.coverImage) {
        uploadData.append('coverImage', formData.coverImage);
      }
      
      // Simular progresso enquanto faz upload real
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 500);
      
      // Enviar para o backend
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/album-upload/upload`, {
        method: 'POST',
        body: uploadData
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao fazer upload');
      }
      
      const result = await response.json();
      
      setUploadProgress(100);
      setUploading(false);
      setUploadSuccess(true);
      
      toast({
        title: 'Álbum publicado!',
        description: `"${result.album.title}" foi enviado com ${result.songs.length} músicas!`
      });
      
      // Reset após 3 segundos e redirecionar
      setTimeout(() => {
        setFormData({
          title: '',
          description: '',
          genre: '',
          coverImage: null,
          albumFile: null
        });
        setUploadSuccess(false);
        setUploadProgress(0);
        
        // Resetar inputs de arquivo
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => input.value = '');
        
        // Redirecionar para Meus Álbuns
        navigate('/artist/albums');
      }, 3000);
      
    } catch (error) {
      setUploading(false);
      setUploadProgress(0);
      toast({
        title: 'Erro no upload',
        description: error.message || 'Não foi possível enviar o álbum. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <ArtistSidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload de Músicas</h1>
            <p className="text-gray-600">Envie seu álbum completo em um arquivo ZIP contendo as músicas em MP3</p>
          </div>

          <Card className="bg-white shadow-sm">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Novo Álbum</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Preencha as informações do álbum e envie um arquivo ZIP com as músicas
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-gray-700">Título do Álbum *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Ex: Meu Primeiro Álbum"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-gray-700">Descrição</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={(e) => {
                      if (e.target.value.length <= 150) {
                        setFormData(prev => ({ ...prev, description: e.target.value }));
                      }
                    }}
                    placeholder="Descreva seu álbum..."
                    rows={4}
                    maxLength={150}
                    className="mt-1 resize-none"
                  />
                  <p className={`text-xs mt-1 ${formData.description.length >= 150 ? 'text-red-500' : 'text-gray-500'}`}>
                    {formData.description.length}/150 caracteres
                  </p>
                </div>

                <div>
                  <Label htmlFor="genre" className="text-gray-700">Gênero Musical *</Label>
                  <Select
                    value={formData.genre}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, genre: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o gênero" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="forro">Forró</SelectItem>
                      <SelectItem value="arrocha">Arrocha</SelectItem>
                      <SelectItem value="piseiro">Piseiro</SelectItem>
                      <SelectItem value="arrochadeira">Arrochadeira</SelectItem>
                      <SelectItem value="pagode">Pagode</SelectItem>
                      <SelectItem value="sertanejo">Sertanejo</SelectItem>
                      <SelectItem value="brega-funk">Brega Funk</SelectItem>
                      <SelectItem value="variados">Variados</SelectItem>
                      <SelectItem value="samba">Samba</SelectItem>
                      <SelectItem value="funk">Funk</SelectItem>
                      <SelectItem value="axe">Axé</SelectItem>
                      <SelectItem value="reggae">Reggae</SelectItem>
                      <SelectItem value="brega">Brega</SelectItem>
                      <SelectItem value="gospel">Gospel</SelectItem>
                      <SelectItem value="rap-hiphop">Rap/Hip-Hop</SelectItem>
                      <SelectItem value="pop">Pop</SelectItem>
                      <SelectItem value="mpb">MPB</SelectItem>
                      <SelectItem value="rock">Rock</SelectItem>
                      <SelectItem value="eletronica">Eletrônica</SelectItem>
                      <SelectItem value="podcast">Podcast</SelectItem>
                      <SelectItem value="trap">Trap</SelectItem>
                      <SelectItem value="frevo">Frevo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="coverImage" className="text-gray-700">Capa do Álbum</Label>
                  <div className="mt-1">
                    <label
                      htmlFor="coverImage"
                      className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-500 transition-colors"
                    >
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {formData.coverImage ? formData.coverImage.name : 'Escolher arquivo'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Formatos aceitos: JPG, PNG, GIF</p>
                      </div>
                      <input
                        id="coverImage"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'coverImage')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="albumFile" className="text-gray-700">Arquivo ZIP com Músicas *</Label>
                  <div className="mt-1">
                    <label
                      htmlFor="albumFile"
                      className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-500 transition-colors"
                    >
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {formData.albumFile ? formData.albumFile.name : 'Escolher arquivo'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Envie um arquivo ZIP contendo todas as músicas em formato MP3
                        </p>
                      </div>
                      <input
                        id="albumFile"
                        type="file"
                        accept=".zip,.rar"
                        onChange={(e) => handleFileChange(e, 'albumFile')}
                        className="hidden"
                        required
                      />
                    </label>
                  </div>
                </div>
              </div>

              {uploading && (
                <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 font-medium">Enviando álbum...</span>
                    <span className="text-gray-900 font-bold">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-gray-600">Por favor, não feche esta página</p>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="text-green-900 font-semibold">Álbum publicado com sucesso!</p>
                    <p className="text-green-700 text-sm">Seu álbum já está disponível na plataforma</p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={uploading || uploadSuccess}
                className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-5 h-5 mr-2" />
                {uploading ? 'Enviando...' : uploadSuccess ? 'Enviado!' : 'Fazer Upload'}
              </Button>
            </form>
          </Card>

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200 mt-6">
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Como preparar seu arquivo ZIP</h3>
                  <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                    <li>Crie uma pasta com todas as suas músicas em formato MP3</li>
                    <li>Nomeie os arquivos de forma organizada (ex: 01-Nome da Música.mp3)</li>
                    <li>Compacte a pasta em um arquivo ZIP</li>
                    <li>Faça o upload do arquivo ZIP nesta página</li>
                  </ol>
                  <p className="text-xs text-gray-600 mt-3">
                    💡 Dica: Você poderá adicionar cifras para cada música após o upload
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UploadNew;