// Determina a URL da API dinamicamente baseado no ambiente
export const getAPIUrl = () => {
  // Se houver variável de ambiente, use-a
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Em produção, use a mesma origem (o frontend está servido pelo mesmo servidor)
  if (process.env.NODE_ENV === 'production') {
    return window.location.origin;
  }
  
  // Em desenvolvimento, use localhost
  return 'http://localhost:8000';
};

export const API_URL = getAPIUrl();
