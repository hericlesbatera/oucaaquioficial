import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Check, Download, Music, Smartphone, HeadphonesIcon } from 'lucide-react';
import { toast } from '../hooks/use-toast';

const Premium = () => {
  const { isPremium, upgradeToPremium } = useAuth();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    upgradeToPremium();
    toast({
      title: 'Bem-vindo ao Premium!',
      description: 'Agora você tem acesso a todos os recursos premium'
    });
    navigate('/');
  };

  const features = [
    {
      icon: Download,
      title: 'Download Ilimitado',
      description: 'Baixe suas músicas favoritas e ouça offline'
    },
    {
      icon: Music,
      title: 'Qualidade de Áudio Superior',
      description: 'Áudio em alta qualidade até 320kbps'
    },
    {
      icon: Smartphone,
      title: 'Sem Anúncios',
      description: 'Experimente música sem interrupções'
    },
    {
      icon: HeadphonesIcon,
      title: 'Reprodução Ilimitada',
      description: 'Pule quantas músicas quiser'
    }
  ];

  if (isPremium) {
    return (
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-red-950/20 to-black p-8">
        <div className="max-w-4xl mx-auto text-center py-20">
          <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Você já é Premium!</h1>
          <p className="text-gray-400 text-lg mb-8">
            Aproveite todos os recursos exclusivos do RedMusic Premium
          </p>
          <Button onClick={() => navigate('/')} className="bg-red-600 hover:bg-red-700">
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-red-950/20 to-black p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Seja Premium</h1>
          <p className="text-gray-400 text-xl">
            Libere todo o potencial da sua experiência musical
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="bg-zinc-900 border-red-900/20 text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-red-600" />
                  </div>
                  <CardTitle className="text-white text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-400">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-gradient-to-br from-red-600 to-red-800 border-0 max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-3xl mb-2">Plano Premium</CardTitle>
            <div className="text-white">
              <span className="text-5xl font-bold">R$ 19,90</span>
              <span className="text-xl">/mês</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                'Download ilimitado de músicas',
                'Qualidade de áudio superior',
                'Sem anúncios',
                'Reprodução offline',
                'Pulos ilimitados',
                'Acesso antecipado a novos recursos'
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 text-white">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
            <Button
              onClick={handleUpgrade}
              className="w-full bg-white text-red-600 hover:bg-gray-100 h-12 text-lg font-semibold"
            >
              Assinar Premium
            </Button>
            <p className="text-white/80 text-sm text-center">
              Cancele quando quiser. Termos e condições aplicáveis.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Premium;