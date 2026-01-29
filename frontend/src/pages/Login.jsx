import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Music, Mail, ArrowLeft } from 'lucide-react';
import { toast } from '../hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira seu email e senha',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password);
      
      if (result.error) {
        toast({ 
          title: 'Erro', 
          description: result.error.message || 'Conta não encontrada ou senha incorreta', 
          variant: 'destructive' 
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: 'Login realizado!',
        description: 'Bem-vindo de volta!'
      });
      
      localStorage.removeItem('previousPath'); // Limpar após usar
      
      // Redirecionar apenas para admin e artista para suas áreas específicas
      // Para usuários comuns, permanecer na página atual
      if (result.isAdmin || result.data?.type === 'admin') {
        navigate('/admin');
      } else if (result.isArtist || result.data?.type === 'artist') {
        navigate('/artist/settings');
      }
      // Para usuários comuns: não redireciona, permanece na página atual
    } catch (error) {
      toast({ 
        title: 'Erro', 
        description: 'Ocorreu um erro ao fazer login', 
        variant: 'destructive' 
      });
    }
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await loginWithGoogle();
      if (result.error) {
        toast({
          title: 'Erro',
          description: result.error.message || 'Erro ao fazer login com Google',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao fazer login com Google',
        variant: 'destructive'
      });
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!forgotEmail) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira seu email',
        variant: 'destructive'
      });
      return;
    }

    setIsSendingReset(true);
    try {
      // Usar a URL correta do Supabase com redirectTo no callback
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: window.location.origin
      });

      if (error) {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao enviar link de recuperação',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Sucesso!',
          description: 'Verifique seu email para redefinir sua senha'
        });
        setShowForgotPassword(false);
        setForgotEmail('');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao processar sua solicitação',
        variant: 'destructive'
      });
    }
    setIsSendingReset(false);
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-white border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-black">Redefinir Senha</CardTitle>
              <CardDescription className="text-gray-600">
                Insira seu email para receber um link de recuperação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-black">E-mail</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="bg-white border-gray-300 text-black"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  disabled={isSendingReset}
                >
                  {isSendingReset ? 'Enviando...' : 'Enviar Link de Recuperação'}
                </Button>
              </form>

              <button 
                onClick={() => setShowForgotPassword(false)}
                className="w-full mt-4 flex items-center justify-center text-red-600 hover:text-red-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Login
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Music className="w-12 h-12 text-red-600" />
            <h1 className="text-4xl font-bold text-black">RedMusic</h1>
          </div>
          <p className="text-gray-600">Milhares de músicas ao seu alcance</p>
        </div>

        <Card className="bg-white border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-black">Entrar</CardTitle>
            <CardDescription className="text-gray-600">
              Acesse sua conta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border-gray-300 text-black"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-black">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white border-gray-300 text-black"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                disabled={isLoading}
              >
                <Mail className="w-4 h-4 mr-2" />
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Ou</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-gray-100 text-black border border-gray-300"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Fazer Login com o Google
            </Button>

            <p className="text-center text-gray-600 text-sm mt-4">
              Não tem uma conta?{' '}
              <Link to="/cadastrar" className="text-red-600 underline">
                Cadastre-se
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
