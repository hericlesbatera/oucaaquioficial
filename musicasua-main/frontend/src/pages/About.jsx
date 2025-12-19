import React, { useEffect, useRef } from 'react';
import { useTrackPageView } from '../hooks/useTrackPageView';
import { Music, Heart, Rocket, Zap, Users, Globe, Handshake, CheckCircle, TrendingUp, ChevronDown } from 'lucide-react';

const About = () => {
  useTrackPageView('about');
  const valuesRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const scrollToValues = () => {
    valuesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const values = [
    {
      id: 1,
      title: 'Acreditamos na música',
      description: 'Focamos nos gêneros que representamos e buscamos conectar artistas e fãs de forma única.',
      icon: <Music className="w-16 h-16 text-red-500" strokeWidth={1.5} />
    },
    {
      id: 2,
      title: 'Sonhamos grande',
      description: 'Nosso objetivo é expandir a música brasileira para o mundo.',
      icon: <Rocket className="w-16 h-16 text-red-500" strokeWidth={1.5} />
    },
    {
      id: 3,
      title: 'Somos ágeis e inovadores',
      description: 'Buscamos soluções rápidas e criativas para nossos usuários.',
      icon: <Zap className="w-16 h-16 text-red-500" strokeWidth={1.5} />
    },
    {
      id: 4,
      title: 'Somos colaborativos',
      description: 'Trabalhamos juntos para alcançar os melhores resultados.',
      icon: <Users className="w-16 h-16 text-red-500" strokeWidth={1.5} />
    },
    {
      id: 5,
      title: 'Quebramos barreiras',
      description: 'A música une culturas e ultrapassa fronteiras.',
      icon: <Globe className="w-16 h-16 text-red-500" strokeWidth={1.5} />
    },
    {
      id: 6,
      title: 'Respeito e inclusão',
      description: 'Não toleramos discriminação e promovemos a igualdade.',
      icon: <Handshake className="w-16 h-16 text-red-500" strokeWidth={1.5} />
    },
    {
      id: 7,
      title: 'Cumprimos compromissos',
      description: 'Entregamos sempre o melhor, com qualidade e eficiência.',
      icon: <CheckCircle className="w-16 h-16 text-red-500" strokeWidth={1.5} />
    },
    {
      id: 8,
      title: 'Apoio ao desenvolvimento',
      description: 'Incentivamos o crescimento profissional e a meritocracia.',
      icon: <TrendingUp className="w-16 h-16 text-red-500" strokeWidth={1.5} />
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div 
        className="relative bg-cover bg-center text-white py-32"
        style={{
          backgroundImage: 'url(/images/bg.png)',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Overlay escuro */}
        <div className="absolute inset-0 bg-black/30"></div>
        
        <div className="relative container mx-auto px-4 text-center h-full flex flex-col justify-center min-h-80">
          <h1 className="text-5xl md:text-6xl font-bold mb-2 leading-tight">
            Nossa missão é impulsionar e conectar
          </h1>
          <h1 className="text-5xl md:text-6xl font-bold mb-16 leading-tight">
            o universo da música de forma única.
          </h1>
          <div className="flex justify-center">
            <button
              onClick={scrollToValues}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 transition-colors animate-bounce"
            >
              <ChevronDown className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Who We Are Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-red-600 text-center mb-8">Somos o Ouça Aqui</h2>
          <p className="text-xl text-gray-600 text-center leading-relaxed">
            Ouça Aqui é a nova fronteira da música brasileira, um espaço vibrante onde artistas emergentes podem lançar seu repertório gratuitamente para milhões de fãs. Estamos construindo uma comunidade onde a conexão e o engajamento acontecem de forma fluida através do nosso site intuitivo, aplicativo móvel e redes sociais.
          </p>
        </div>
      </div>

      {/* Vision Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-4xl font-bold text-red-600 text-center mb-8">Visão</h2>
          <p className="text-xl text-gray-600 text-center">
            Ser a maior plataforma de música brasileira, expandindo nosso modelo para outros mercados ao redor do mundo.
          </p>
        </div>
      </div>

      {/* Values Section */}
      <div 
        ref={valuesRef}
        className="bg-gradient-to-b from-red-600 to-red-700 py-20"
      >
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">Nossos Valores</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div
                key={value.id}
                className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex justify-center mb-6">
                  {value.icon}
                </div>
                <h3 className="text-lg font-bold text-red-600 text-center mb-4">
                  {value.title}
                </h3>
                <p className="text-gray-600 text-center text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Faça parte da nossa jornada
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Conecte-se com artistas, descubra novas músicas e faça parte da maior comunidade de música brasileira.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300"
            >
              Explorar Músicas
            </a>
            <a
              href="/cadastrar"
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300"
            >
              Começar Como Artista
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
