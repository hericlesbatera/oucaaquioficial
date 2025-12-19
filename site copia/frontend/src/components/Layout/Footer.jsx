import React from 'react';
import { Link } from 'react-router-dom';
import { Music, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black text-white border-t border-red-900/30">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo e Descrição */}
          <div className="col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <img src="/images/Logo-rodape.png" alt="Escutaí" className="h-10" />
            </Link>
            <p className="text-gray-400 text-sm">
              Compartilhe sua música com o mundo.<br />
              Plataforma completa para artistas e amantes da música.
            </p>
          </div>

          {/* Explorar */}
          <div>
            <h3 className="font-bold text-lg mb-4">Explorar</h3>
            <ul className="space-y-2">
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
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                  Top Músicas
                </Link>
              </li>
            </ul>
          </div>

          {/* Para Artistas */}
          <div>
            <h3 className="font-bold text-lg mb-4">Para Artistas</h3>
            <ul className="space-y-2">
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
            <h3 className="font-bold text-lg mb-4">Redes Sociais</h3>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-red-900/30 text-center text-gray-400 text-sm">
          <p>© 2025 Escutaí. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;