import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const MyAlbums = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [user?.id]);

  if (loading) {
    return <LoadingSpinner size="large" text="Carregando..." />;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Meus Álbuns</h1>
      <p>Gerencie seus álbuns aqui</p>
    </div>
  );
};

export default MyAlbums;
