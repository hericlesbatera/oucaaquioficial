import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useAuth } from '../context/AuthContext';

/**
 * Componente que detecta quando app vai offline
 * Redireciona automaticamente para /library quando sem internet
 */
const OfflineDetector = () => {
  const { isOffline } = useNetworkStatus();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Rotas que não devem redirecionar (login, signup, etc)
  const excludedPaths = ['/login', '/cadastrar', '/reset-password'];
  const isExcludedPath = excludedPaths.includes(location.pathname);

  useEffect(() => {
    // Se ficou offline e é usuário autenticado
    if (isOffline && user && !isExcludedPath) {
      // Se não está já na biblioteca, redirecionar
      if (location.pathname !== '/library') {
        console.log('[OfflineDetector] Redirecionando para biblioteca (offline detectado)');
        
        // Salvar caminho anterior para voltar quando online
        sessionStorage.setItem('offlineRedirectFrom', location.pathname);
        
        navigate('/library', { replace: true });
      }
    }
  }, [isOffline, user, location.pathname, navigate, isExcludedPath]);

  return null;
};

export default OfflineDetector;
