import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from '../../hooks/use-toast';

const Upload = () => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file || !title) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    try {
      const response = await fetch('/upload_progress', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Música enviada com sucesso!'
        });
        setFile(null);
        setTitle('');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao enviar música',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Upload de Música</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Arquivo de Áudio</label>
          <Input
            type="file"
            accept="audio/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Título da Música</label>
          <Input
            type="text"
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        <Button onClick={handleUpload} disabled={loading} className="w-full">
          {loading ? 'Enviando...' : 'Enviar Música'}
        </Button>
      </div>
    </div>
  );
};

export default Upload;
