import React from 'react';
import { Link } from 'react-router-dom';
import { Youtube, Instagram, Twitter, Facebook } from 'lucide-react';

const FooterSimple = () => {
  return (
    <footer className="hidden md:block bg-black text-white pt-10">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-5 justify-items-center text-center md:text-left md:justify-items-start">
        {/* Explorar */}
        <div>
          <h3 className="font-bold mb-4">EXPLORAR</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/lancamentos" className="hover:underline">
                Lançamentos
              </Link>
            </li>
            <li>
              <Link to="/artistas" className="hover:underline">
                Artistas
              </Link>
            </li>
            <li>
              <Link to="/top-cds" className="hover:underline">
                Top CDs
              </Link>
            </li>
          </ul>
        </div>

        {/* Ouça Aqui */}
        <div>
          <h3 className="font-bold mb-4">OUÇA AQUI</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/sobre" className="hover:underline">
                Sobre
              </Link>
            </li>
            <li>
              <Link to="/politicas?tab=privacy" className="hover:underline">
                Política de Privacidade
              </Link>
            </li>
            <li>
              <Link to="/politicas?tab=terms" className="hover:underline">
                Termos de Uso
              </Link>
            </li>
            <li>
              <Link to="/politicas?tab=intellectual" className="hover:underline">
                Política de Proteção da Propriedade Intelectual
              </Link>
            </li>
            <li>
              <Link to="/politicas?tab=report" className="hover:underline">
                Denúncia de Conteúdo
              </Link>
            </li>
          </ul>
        </div>

        {/* Conecte-se (antes de Aplicativos) */}
        <div>
          <h3 className="font-bold mb-4">CONECTE-SE AO OUÇA AQUI</h3>
          <div className="flex space-x-3">
            <a href="#" className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors">
              <Facebook className="w-5 h-5 text-white" />
            </a>
            <a href="#" className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors">
              <Instagram className="w-5 h-5 text-white" />
            </a>
            <a href="#" className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors">
              <Twitter className="w-5 h-5 text-white" />
            </a>
            <a href="#" className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors">
              <Youtube className="w-5 h-5 text-white" />
            </a>
          </div>
        </div>

        {/* Aplicativos */}
        <div>
          <h3 className="font-bold mb-4">APLICATIVOS</h3>
          <a href="#" className="bg-white hover:opacity-80 rounded-full flex items-center px-7 py-2.5 w-fit">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="#DC2626" className="w-5 h-5 mr-3">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
            </svg>
            <span className="text-black leading-none">
              <span className="block text-xs">Download:</span>
              <span className="font-bold text-sm">App Store</span>
            </span>
          </a>
        </div>
      </div>

      {/* Copyright */}
      <div className="w-full bg-black text-sm text-center py-4 mt-10 border-t border-gray-800">
        <p>© 2025 Ouça Aqui. Fácil de ouvir, rápido para baixar.</p>
      </div>
    </footer>
  );
};

export default FooterSimple;
