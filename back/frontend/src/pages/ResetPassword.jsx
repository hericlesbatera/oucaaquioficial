import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Music, Lock } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasSession, setHasSession] = useState(false);
  const [tokenData, setTokenData] = useState(null);

  useEffect(() => {
    console.log('=== RESET PASSWORD INIT ===');
    const initializeReset = async () => {
      try {
        const hash = window.location.hash;
        console.log('URL:', window.location.href);
        console.log('Hash encontrado:', !!hash);

        if (!hash) {
          setError('Link de recuperação não encontrado.');
          setIsLoading(false);
          return;
        }

        // Extrair tokens do hash
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        const type = params.get('type');

        console.log('Token extraído:', { access_token: !!access_token, refresh_token: !!refresh_token, type });

        if (!access_token || type !== 'recovery') {
          setError('Link de recuperação inválido.');
          setIsLoading(false);
          return;
        }

        // Salvar tokens
        setTokenData({ access_token, refresh_token });
        setHasSession(true);
        setError('');
        setIsLoading(false);
        
      } catch (err) {
        console.error('Erro ao inicializar:', err);
        setError('Erro ao processar link de recuperação.');
        setIsLoading(false);
      }
    };

    initializeReset();
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não conferem');
      return;
    }

    setIsLoading(true);

    try {
      console.log('=== TENTANDO RESETAR SENHA ===');
      
      if (!tokenData?.access_token) {
        throw new Error('Token não encontrado. Por favor, recarregue o link.');
      }

      // Use verifyOtp para validar recovery token
      console.log('Validando recovery token com verifyOtp');
      
      try {
        await supabase.auth.verifyOtp({
          token: tokenData.access_token,
          type: 'recovery',
        });
      } catch (e) {
        console.error('Erro ao verificar token:', e);
        throw new Error(e?.message || 'Token de recuperação inválido');
      }

      console.log('Token verificado!');

      // Aguardar um pouco para a sessão ser estabelecida
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Atualizando senha...');

      // Agora atualizar a senha com a sessão válida
      try {
        await supabase.auth.updateUser({
          password: password,
        });
      } catch (e) {
        console.error('Erro ao atualizar senha:', e);
        throw new Error(e?.message || 'Erro ao atualizar senha');
      }

      console.log('Senha atualizada com sucesso!');
      setSuccess('Sua senha foi redefinida com sucesso!');

      toast({
        title: 'Sucesso!',
        description: 'Sua senha foi redefinida. Redirecionando para login...',
      });

      // Fazer logout para limpar tokens
      await supabase.auth.signOut();

      // Redirecionar
      setTimeout(() => navigate('/login'), 2000);

    } catch (err) {
      console.error('Erro completo:', err);
      const msg = err?.message || 'Erro ao redefinir senha';
      setError(msg);
    }

    setIsLoading(false);
  };

  if (isLoading && !error && !success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="medium" text="Verificando link..." />
      </div>
    );
  }

  if (error && !hasSession) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-white border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-black">Link Inválido</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-4">{error}</p>
              <p className="text-gray-600 text-sm mb-4">
                Se o link expirou, solicite um novo na página de login.
              </p>
              <Button
                onClick={() => navigate('/login')}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                Voltar ao Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-white border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-green-600">Sucesso!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-600 mb-4">{success}</p>
              <p className="text-gray-600 mb-4">Redirecionando para o login...</p>
              <Button
                onClick={() => navigate('/login')}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Ir para Login
              </Button>
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
          <p className="text-gray-600">Redefinir Senha</p>
        </div>

        <Card className="bg-white border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-black">Nova Senha</CardTitle>
            <CardDescription className="text-gray-600">
              Digite sua nova senha abaixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-black">
                  Nova Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white border-gray-300 text-black pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-black">
                  Confirmar Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white border-gray-300 text-black pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Processando...' : 'Redefinir Senha'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-gray-600 text-sm mt-6">
          Lembrou da senha?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-red-600 underline hover:text-red-700"
          >
            Voltar ao login
          </button>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
