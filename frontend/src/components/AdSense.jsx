import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const AdSense = () => {
  const location = useLocation();

  // Páginas onde NOT deve aparecer anúncios
  const blockedPages = [
    '/user/panel',
    '/artist',
    '/sobre',
    '/politicas',
    '/admin'
  ];

  // Verificar se a página atual está na lista de bloqueadas
  const isBlockedPage = blockedPages.some(page => 
    location.pathname.startsWith(page)
  );

  useEffect(() => {
    // Só carregar o script se não estiver em página bloqueada
    if (!isBlockedPage) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3047194744488474';
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);

      return () => {
        // Limpar script se necessário
        document.head.removeChild(script);
      };
    }
  }, [isBlockedPage]);

  return null;
};

export default AdSense;
