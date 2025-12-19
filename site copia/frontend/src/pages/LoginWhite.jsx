import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Music } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { supabase } from '../lib/supabaseClient';

const LoginWhite = () => {
  const termosDeUso = `Termos de uso

Este documento, de agora em diante chamado simplesmente de "Termos de Uso", concentra as regras e condições mais importantes que você precisa conhecer se quiser utilizar os sites www.cifraclub.com.br (Cifra Club), www.palcomp3.com (Palco MP3), www.forum.cifraclub.com.br (Fórum Cifra Club), www.guitarbattle.com.br (Guitar Battle) e www.formesuabanda.com.br (Forme Sua Banda) todos de propriedade da STUDIO SOL COMUNICAÇÃO DIGITAL LTDA, chamada de "Studio Sol" daqui em diante. Esse documento é complementado pelas diretrizes previstas em nossa Política de Privacidade para tratamento dos dados.

ATENÇÃO:

O simples acesso a qualquer dos nossos sites gera a presunção de que você leu a versão mais recente e atualizada dos Termos de Uso. Além disso, nós consideraremos que você concordou com todas as condições aqui indicadas e também com todas as outras políticas publicadas em qualquer desses sites. Por essa razão, recomendamos que você leia com atenção este documento ANTES de começar a usar algum dos nossos sites ou baixar nossos aplicativos. Recomendamos, também, a leitura de todas as outras políticas que adotamos, como, por exemplo, a nossa Política de Privacidade. Se você por acaso não concordar com alguma condição prevista nos Termos de Uso ou se não concordar com alguma de nossas políticas, sugerimos que não acesse os nossos sites e que não utilize os nossos serviços e produtos. Mas, claro, se simplesmente tiver alguma dúvida sobre as regras de uso, fique à vontade para nos consultar. Teremos prazer em lhe responder!`;

  const [userType, setUserType] = useState('user');
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();

  const handleGoogleLogin = () => {
    loginWithGoogle(userType);
    toast({
      title: 'Login realizado!',
      description: 'Bem-vindo!'
    });
    navigate('/');
  };

  // User form states
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userCidade, setUserCidade] = useState('');
  const [userEstado, setUserEstado] = useState('');
  const [userGenero, setUserGenero] = useState('');
  const [userAcceptTerms, setUserAcceptTerms] = useState(false);

  // Artist form states
  const [artistName, setArtistName] = useState('');
  const [artistSlug, setArtistSlug] = useState('');
  const [artistSlugError, setArtistSlugError] = useState('');
  const [artistEmail, setArtistEmail] = useState('');
  const [artistPassword, setArtistPassword] = useState('');
  const [artistCidade, setArtistCidade] = useState('');
  const [artistEstado, setArtistEstado] = useState('');
  const [artistGenero, setArtistGenero] = useState('');
  const [artistEstiloMusical, setArtistEstiloMusical] = useState('');
  const [artistAcceptTerms, setArtistAcceptTerms] = useState(false);

  // Função para gerar slug
  const slugify = (value) => {
    if (!value) return '';
    return value
      .toString()
      .normalize('NFKD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_-]+/g, '')
      .replace(/^-+|-+$/g, '');
  };

  // Atualizar slug quando o nome do artista mudar
  const handleArtistNameChange = (value) => {
    setArtistName(value);
    const newSlug = slugify(value);
    setArtistSlug(newSlug);
    setArtistSlugError('');
  };

  // Verificar se o slug já existe
  const checkSlugAvailability = async (slug) => {
    if (!slug) return false;
    const { data, error } = await supabase
      .from('artists')
      .select('id')
      .eq('slug', slug)
      .single();
    return !data;
  };

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentTermsFor, setCurrentTermsFor] = useState('user');

  const handleUserRegister = async (e) => {
    e.preventDefault();
    if (!userAcceptTerms) {
      toast({ title: 'Você precisa aceitar os termos de uso para se cadastrar.', variant: 'destructive' });
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: userEmail,
        password: userPassword,
        options: {
          data: {
            full_name: userName,
            user_type: 'user',
            cidade: userCidade,
            estado: userEstado,
            genero: userGenero
          }
        }
      });

      if (error) {
        toast({ title: 'Erro no cadastro', description: error.message, variant: 'destructive' });
        return;
      }

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Erro no cadastro:', error);
      toast({ title: 'Erro no cadastro', description: error?.message || 'Ocorreu um erro inesperado.', variant: 'destructive' });
    }
  };

  const handleArtistRegister = async (e) => {
    e.preventDefault();
    if (!artistAcceptTerms) {
      toast({ title: 'Você precisa aceitar os termos de uso para se cadastrar.', variant: 'destructive' });
      return;
    }

    if (!artistSlug) {
      toast({ title: 'Erro', description: 'O nome do artista é obrigatório.', variant: 'destructive' });
      return;
    }

    // Verificar se o slug já existe
    const isAvailable = await checkSlugAvailability(artistSlug);
    if (!isAvailable) {
      setArtistSlugError('Este nome já está em uso. Escolha outro nome.');
      toast({ title: 'Nome indisponível', description: 'Este nome de artista já está em uso. Por favor, escolha outro.', variant: 'destructive' });
      return;
    }

    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: artistEmail,
        password: artistPassword,
        options: {
          data: {
            full_name: artistName,
            user_type: 'artist',
            slug: artistSlug,
            cidade: artistCidade,
            estado: artistEstado,
            genero: artistGenero,
            estilo_musical: artistEstiloMusical
          }
        }
      });

      if (authError) {
        toast({ title: 'Erro no cadastro', description: authError.message, variant: 'destructive' });
        return;
      }

      // 2. Criar perfil do artista na tabela artists
      if (authData?.user?.id) {
        const { error: profileError } = await supabase
          .from('artists')
          .insert({
            id: authData.user.id,
            name: artistName,
            slug: artistSlug,
            email: artistEmail,
            cidade: artistCidade,
            estado: artistEstado,
            genero: artistGenero,
            estilo_musical: artistEstiloMusical,
            bio: '',
            avatar_url: '',
            cover_url: '',
            followers_count: 0,
            is_verified: false
          });

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
          console.error('Detalhes:', JSON.stringify(profileError, null, 2));
        } else {
          console.log('Perfil do artista criado com sucesso!');
        }
      }

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Erro no cadastro:', error);
      toast({ title: 'Erro no cadastro', description: error?.message || 'Ocorreu um erro inesperado.', variant: 'destructive' });
    }
  };

  const openTermsModal = (type) => {
    setCurrentTermsFor(type);
    setShowTermsModal(true);
  };

  const acceptTerms = () => {
    if (currentTermsFor === 'user') {
      setUserAcceptTerms(true);
    } else {
      setArtistAcceptTerms(true);
    }
    setShowTermsModal(false);
  };

  return (
    <>
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
              <CardTitle className="text-black">Cadastrar</CardTitle>
              <CardDescription className="text-gray-600">
                Crie sua conta para acessar a plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={userType} onValueChange={setUserType} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                  <TabsTrigger value="user" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                    Usuário
                  </TabsTrigger>
                  <TabsTrigger value="artist" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                    Artista
                  </TabsTrigger>
                </TabsList>

                {/* Aba Usuário */}
                <TabsContent value="user" className="space-y-4 mt-4">
                  <form onSubmit={handleUserRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="userName" className="text-black">Nome</Label>
                      <Input
                        id="userName"
                        type="text"
                        placeholder="Seu nome"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="bg-white border-gray-300 text-black"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userEmail" className="text-black">E-mail</Label>
                      <Input
                        id="userEmail"
                        type="email"
                        placeholder="seu@email.com"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        className="bg-white border-gray-300 text-black"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userPassword" className="text-black">Senha</Label>
                      <Input
                        id="userPassword"
                        type="password"
                        placeholder="Sua senha"
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        className="bg-white border-gray-300 text-black"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="userCidade" className="text-black">Cidade</Label>
                        <Input
                          id="userCidade"
                          type="text"
                          placeholder="Sua cidade"
                          value={userCidade}
                          onChange={(e) => setUserCidade(e.target.value)}
                          className="bg-white border-gray-300 text-black"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="userEstado" className="text-black">Estado</Label>
                        <Input
                          id="userEstado"
                          type="text"
                          placeholder="Seu estado"
                          value={userEstado}
                          onChange={(e) => setUserEstado(e.target.value)}
                          className="bg-white border-gray-300 text-black"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userGenero" className="text-black">Gênero</Label>
                      <select
                        id="userGenero"
                        value={userGenero}
                        onChange={(e) => setUserGenero(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-black"
                        required
                      >
                        <option value="">Selecione</option>
                        <option value="masculino">Masculino</option>
                        <option value="feminino">Feminino</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="userAcceptTerms"
                        checked={userAcceptTerms}
                        readOnly
                        required
                      />
                      <label htmlFor="userAcceptTerms" className="text-black">
                        Li e aceito os{' '}
                        <span
                          className="text-red-600 underline cursor-pointer"
                          onClick={() => openTermsModal('user')}
                        >
                          termos de uso
                        </span>
                      </label>
                    </div>
                    <Button className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded shadow" type="submit">
                      Cadastrar
                    </Button>
                  </form>
                </TabsContent>

                {/* Aba Artista */}
                <TabsContent value="artist" className="space-y-4 mt-4">
                  <form onSubmit={handleArtistRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="artistName" className="text-black">Nome (Artista/Banda)</Label>
                      <Input
                        id="artistName"
                        type="text"
                        placeholder="Nome do artista ou banda"
                        value={artistName}
                        onChange={(e) => handleArtistNameChange(e.target.value)}
                        className="bg-white border-gray-300 text-black"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="artistSlug" className="text-black">URL do Perfil</Label>
                      <div className="flex items-center">
                        <span className="text-gray-500 text-sm mr-1">{window.location.origin}/</span>
                        <Input
                          id="artistSlug"
                          type="text"
                          placeholder="seuartista"
                          value={artistSlug}
                          onChange={(e) => {
                            setArtistSlug(slugify(e.target.value));
                            setArtistSlugError('');
                          }}
                          className={`bg-white border-gray-300 text-black flex-1 ${artistSlugError ? 'border-red-500' : ''}`}
                          required
                        />
                      </div>
                      {artistSlugError && (
                        <p className="text-red-500 text-xs mt-1">{artistSlugError}</p>
                      )}
                      {artistSlug && !artistSlugError && (
                        <p className="text-green-600 text-xs mt-1">
                          Seu perfil ficará em: {window.location.origin}/{artistSlug}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="artistEmail" className="text-black">E-mail</Label>
                      <Input
                        id="artistEmail"
                        type="email"
                        placeholder="seu@email.com"
                        value={artistEmail}
                        onChange={(e) => setArtistEmail(e.target.value)}
                        className="bg-white border-gray-300 text-black"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="artistPassword" className="text-black">Senha</Label>
                      <Input
                        id="artistPassword"
                        type="password"
                        placeholder="Sua senha"
                        value={artistPassword}
                        onChange={(e) => setArtistPassword(e.target.value)}
                        className="bg-white border-gray-300 text-black"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="artistCidade" className="text-black">Cidade</Label>
                        <Input
                          id="artistCidade"
                          type="text"
                          placeholder="Sua cidade"
                          value={artistCidade}
                          onChange={(e) => setArtistCidade(e.target.value)}
                          className="bg-white border-gray-300 text-black"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="artistEstado" className="text-black">Estado</Label>
                        <Input
                          id="artistEstado"
                          type="text"
                          placeholder="Seu estado"
                          value={artistEstado}
                          onChange={(e) => setArtistEstado(e.target.value)}
                          className="bg-white border-gray-300 text-black"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="artistGenero" className="text-black">Gênero</Label>
                      <select
                        id="artistGenero"
                        value={artistGenero}
                        onChange={(e) => setArtistGenero(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-black"
                        required
                      >
                        <option value="">Selecione</option>
                        <option value="masculino">Masculino</option>
                        <option value="feminino">Feminino</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="artistEstiloMusical" className="text-black">Estilo Musical</Label>
                      <select
                        id="artistEstiloMusical"
                        value={artistEstiloMusical}
                        onChange={(e) => setArtistEstiloMusical(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-black"
                        required
                      >
                        <option value="">Selecione</option>
                        <option value="forro">Forró</option>
                        <option value="arrocha">Arrocha</option>
                        <option value="piseiro">Piseiro</option>
                        <option value="arrochadeira">Arrochadeira</option>
                        <option value="pagode">Pagode</option>
                        <option value="sertanejo">Sertanejo</option>
                        <option value="brega-funk">Brega Funk</option>
                        <option value="variados">Variados</option>
                        <option value="samba">Samba</option>
                        <option value="funk">Funk</option>
                        <option value="axe">Axé</option>
                        <option value="reggae">Reggae</option>
                        <option value="brega">Brega</option>
                        <option value="gospel">Gospel</option>
                        <option value="rap">Rap/Hip-Hop</option>
                        <option value="pop">Pop</option>
                        <option value="mpb">MPB</option>
                        <option value="rock">Rock</option>
                        <option value="eletronica">Eletrônica</option>
                        <option value="podcast">Podcast</option>
                        <option value="trap">Trap</option>
                        <option value="frevo">Frevo</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="artistAcceptTerms"
                        checked={artistAcceptTerms}
                        readOnly
                        required
                      />
                      <label htmlFor="artistAcceptTerms" className="text-black">
                        Li e aceito os{' '}
                        <span
                          className="text-red-600 underline cursor-pointer"
                          onClick={() => openTermsModal('artist')}
                        >
                          termos de uso
                        </span>
                      </label>
                    </div>
                    <Button className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded shadow" type="submit">
                      Cadastrar
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

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

              <p className="text-center text-gray-600 text-sm mt-6">
                Já tem uma conta?{' '}
                <Link to="/login" className="text-red-600 underline">
                  Fazer login
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Termos de Uso */}
      {showTermsModal && (
        <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
          <DialogContent style={{ maxWidth: 600, padding: 0 }}>
            <DialogTitle style={{ padding: '24px 24px 0 24px', fontWeight: 700, fontSize: 20 }}>Termos de Uso</DialogTitle>
            <DialogDescription>
              <div style={{ maxHeight: '50vh', overflowY: 'auto', textAlign: 'left', fontSize: 13, whiteSpace: 'pre-wrap', padding: 24 }}>
                {termosDeUso}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                <button
                  type="button"
                  style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 48px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
                  onClick={acceptTerms}
                >
                  Concordo
                </button>
              </div>
            </DialogDescription>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Sucesso */}
      {showSuccessModal && (
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="text-center">
            <div className="flex flex-col items-center justify-center py-4">
              <div className="text-green-500 text-6xl mb-4">✓</div>
              <DialogTitle className="text-xl font-bold text-black mb-4">Cadastro realizado com sucesso!</DialogTitle>
              <DialogDescription className="text-gray-600 text-center">
                Enviamos um e-mail de confirmação. Por favor, verifique sua caixa de entrada para confirmar o cadastro.
              </DialogDescription>
              <Button onClick={() => { setShowSuccessModal(false); navigate('/'); }} className="mt-6 bg-gray-200 hover:bg-gray-300 text-black px-8">OK</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default LoginWhite;
