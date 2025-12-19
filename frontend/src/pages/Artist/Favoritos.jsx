import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const Favoritos = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [favoritos, setFavoritos] = useState([]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, [user?.id]);

  if (loading) return <LoadingSpinner size="large" text="Carregando favoritos..." />;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Favoritos</h1>
      <p className="text-gray-600">Suas músicas, álbuns e playlists favoritas aparecerão aqui.</p>
    </div>
  );
};

export default Favoritos;
