import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="text-center max-w-lg">
        <h1 className="text-6xl md:text-8xl font-bold text-red-600 mb-4">404</h1>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Página não encontrada</h2>
        <p className="text-gray-600 text-lg mb-8">
          Desculpe, a página que você está procurando não existe ou foi removida.
        </p>
        <Link
          to="/"
          className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full transition-colors"
        >
          Voltar para Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
