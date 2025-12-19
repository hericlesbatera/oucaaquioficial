import React from 'react';
import { Link } from 'react-router-dom';
import { Music, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

const FooterSimple = () => {
  return (
    <footer className="bg-black text-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
          {/* Logo */}
          <div>
            <Link to="/" className="flex items-center space-x-2 mb-3">
              <img src="/images/Logo-rodape.png" alt="Escutaí" className="h-8" />
            </Link>
            <p className="text-gray-400 text-sm">
              Compartilhe sua música com o mundo.
            </p>
          </div>

          {/* Explorar */}
          <div>
            <h3 className="font-semibold mb-3">Explorar</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                  Álbuns
                </Link>
              </li>
              <li>
                <Link to="/artists" className="text-gray-400 hover:text-white transition-colors">
                  Artistas
                </Link>
              </li>
            </ul>
          </div>

          {/* Para Artistas */}
          <div>
            <h3 className="font-semibold mb-3">Para Artistas</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/login" className="text-gray-400 hover:text-white transition-colors">
                  Fazer Upload
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-400 hover:text-white transition-colors">
                  Meu Perfil
                </Link>
              </li>
            </ul>
          </div>

          {/* Redes Sociais */}
          <div>
            <h3 className="font-semibold mb-3">Redes Sociais</h3>
            <div className="flex space-x-3">
              <a
                href="#"
                className="w-9 h-9 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 pt-6 text-center text-gray-400 text-sm">
          <p>© 2025 Escutaí. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSimple;