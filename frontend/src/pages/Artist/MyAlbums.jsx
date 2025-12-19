import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const MyAlbums = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, [user?.id]);

  if (loading) return <LoadingSpinner size="large" text="Carregando álbuns..." />;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Meus Álbuns</h1>
      <p className="text-gray-600">Seus álbuns aparecerão aqui.</p>
    </div>
  );
};

export default MyAlbums;
