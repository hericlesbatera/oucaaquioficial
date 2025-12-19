import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from '../../hooks/use-toast';

const UploadNew = () => {
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
    formData.append('artist_id', user?.id);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: { 'Authorization': `Bearer ${user?.access_token}` }
      });
      
      if (response.ok) {
        toast({ title: 'Sucesso', description: 'Música enviada!' });
        setFile(null);
        setTitle('');
      } else {
        throw new Error('Erro no upload');
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
      <h1 className="text-3xl font-bold mb-6">Upload</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Arquivo</label>
          <Input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0])} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Título</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <Button onClick={handleUpload} disabled={loading}>{loading ? 'Enviando...' : 'Enviar'}</Button>
      </div>
    </div>
  );
};

export default UploadNew;
