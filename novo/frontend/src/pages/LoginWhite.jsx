import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2, ChevronLeft } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { supabase } from '../lib/supabaseClient';

const LoginWhite = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { loginWithGoogle } = useAuth();

    // Estados principais
    const [userType, setUserType] = useState('user');
    const [signupStep, setSignupStep] = useState(1); // 1: Basic info, 2: Artist info, 3: Success

    // Login
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [loadingLogin, setLoadingLogin] = useState(false);

    // Cadastro - Step 1
    const [signupName, setSignupName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [termsReadByUser, setTermsReadByUser] = useState(false);

    // Cadastro - Step 2 (Artist)
    const [artistName, setArtistName] = useState('');
    const [artistSlug, setArtistSlug] = useState('');
    const [artistSlugError, setArtistSlugError] = useState('');
    const [artistCidade, setArtistCidade] = useState('');
    const [artistEstado, setArtistEstado] = useState('');
    const [artistGenero, setArtistGenero] = useState('');
    const [artistEstiloMusical, setArtistEstiloMusical] = useState('');
    const [acceptTermsArtist, setAcceptTermsArtist] = useState(false);
    const [termsReadByArtist, setTermsReadByArtist] = useState(false);



    // Modal de termos
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [currentTermsFor, setCurrentTermsFor] = useState('user');

    // Loading
    const [loadingSignup, setLoadingSignup] = useState(false);

    // Estados do Brasil
    const estadosBrasil = [
        { value: 'ac', label: 'Acre' },
        { value: 'al', label: 'Alagoas' },
        { value: 'ap', label: 'Amapá' },
        { value: 'am', label: 'Amazonas' },
        { value: 'ba', label: 'Bahia' },
        { value: 'ce', label: 'Ceará' },
        { value: 'df', label: 'Distrito Federal' },
        { value: 'es', label: 'Espírito Santo' },
        { value: 'go', label: 'Goiás' },
        { value: 'ma', label: 'Maranhão' },
        { value: 'mt', label: 'Mato Grosso' },
        { value: 'ms', label: 'Mato Grosso do Sul' },
        { value: 'mg', label: 'Minas Gerais' },
        { value: 'pa', label: 'Pará' },
        { value: 'pb', label: 'Paraíba' },
        { value: 'pr', label: 'Paraná' },
        { value: 'pe', label: 'Pernambuco' },
        { value: 'pi', label: 'Piauí' },
        { value: 'rj', label: 'Rio de Janeiro' },
        { value: 'rn', label: 'Rio Grande do Norte' },
        { value: 'rs', label: 'Rio Grande do Sul' },
        { value: 'ro', label: 'Rondônia' },
        { value: 'rr', label: 'Roraima' },
        { value: 'sc', label: 'Santa Catarina' },
        { value: 'sp', label: 'São Paulo' },
        { value: 'se', label: 'Sergipe' },
        { value: 'to', label: 'Tocantins' }
    ];

    // Ícones SVG
    const UserIcon = ({ className = "w-5 h-5" }) => (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
    );

    const EmailIcon = ({ className = "w-5 h-5" }) => (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
        </svg>
    );

    const LockIcon = ({ className = "w-5 h-5" }) => (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
    );

    // Funções helpers
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

    const handleArtistNameChange = (value) => {
        setArtistName(value);
        const newSlug = slugify(value);
        setArtistSlug(newSlug);
        setArtistSlugError('');
    };

    const checkSlugAvailability = async (slug) => {
        if (!slug) return false;
        const { data } = await supabase
            .from('artists')
            .select('id')
            .eq('slug', slug)
            .single();
        return !data;
    };

    const openTermsModal = (type) => {
        setCurrentTermsFor(type);
        setShowTermsModal(true);
    };

    const acceptTermsModal = () => {
        if (currentTermsFor === 'user') {
            setTermsReadByUser(true);
            setAcceptTerms(true);
        } else {
            setTermsReadByArtist(true);
            setAcceptTermsArtist(true);
        }
        setShowTermsModal(false);
    };

    // Login
    const handleLogin = async (e) => {
        e.preventDefault();

        if (!loginEmail || !loginPassword) {
            toast({
                title: 'Erro',
                description: 'Preencha todos os campos',
                variant: 'destructive'
            });
            return;
        }

        setLoadingLogin(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password: loginPassword
            });

            if (error) throw error;

            // toast({
            //     title: 'Sucesso',
            //     description: 'Login realizado com sucesso!'
            // });

            setLoginEmail('');
            setLoginPassword('');

            localStorage.removeItem('previousPath');
            
            // Não redireciona para usuários comuns - permanece na página atual
        } catch (error) {
            toast({
                title: 'Erro ao fazer login',
                description: error.message || 'Verifique suas credenciais',
                variant: 'destructive'
            });
        } finally {
            setLoadingLogin(false);
        }
    };



    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Erro ao fazer login com Google',
                variant: 'destructive'
            });
        }
    };

    // Signup Step 1
    const handleSignupStep1 = async (e) => {
        e.preventDefault();

        if (!signupName || !signupEmail || !signupPassword || !signupConfirmPassword) {
            toast({
                title: 'Erro',
                description: 'Preencha todos os campos',
                variant: 'destructive'
            });
            return;
        }

        if (!acceptTerms) {
            toast({
                title: 'Erro',
                description: 'Você precisa aceitar os termos de uso',
                variant: 'destructive'
            });
            return;
        }

        if (signupPassword !== signupConfirmPassword) {
            toast({
                title: 'Erro',
                description: 'As senhas não coincidem',
                variant: 'destructive'
            });
            return;
        }

        if (signupPassword.length < 6) {
            toast({
                title: 'Erro',
                description: 'A senha deve ter no mínimo 6 caracteres',
                variant: 'destructive'
            });
            return;
        }

        if (userType === 'artist') {
            setSignupStep(2);
        } else {
            completeSignup();
        }
    };

    // Signup Step 2
    const handleSignupStep2 = async (e) => {
        e.preventDefault();

        if (!artistName || !artistSlug || !artistCidade || !artistEstado || !artistGenero || !artistEstiloMusical) {
            toast({
                title: 'Erro',
                description: 'Preencha todos os campos obrigatórios',
                variant: 'destructive'
            });
            return;
        }

        if (!acceptTermsArtist) {
            toast({
                title: 'Erro',
                description: 'Você precisa aceitar os termos de uso',
                variant: 'destructive'
            });
            return;
        }

        const isAvailable = await checkSlugAvailability(artistSlug);
        if (!isAvailable) {
            setArtistSlugError('Este endereço já está em uso');
            return;
        }

        completeSignup();
    };

    // Complete Signup
    const completeSignup = async () => {
        setLoadingSignup(true);
        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: signupEmail,
                password: signupPassword,
                options: {
                    data: {
                        full_name: signupName,
                        user_type: userType,
                        cidade: userType === 'user' ? '' : artistCidade,
                        estado: userType === 'user' ? '' : artistEstado,
                        genero: userType === 'user' ? '' : artistGenero,
                        estilo_musical: userType === 'artist' ? artistEstiloMusical : undefined
                    }
                }
            });

            if (authError) throw authError;

            // Verificar se o email já é admin no banco
            const { data: adminCheck } = await supabase
                .from('admin_users')
                .select('id')
                .eq('id', authData?.user?.id)
                .maybeSingle();

            if (adminCheck) {
                // Se é admin, não criar profile de artista
                setLoadingSignup(false);
                toast({
                    title: 'Acesso Restrito',
                    description: 'Esta conta é de administrador. Use o painel de admin.'
                });
                navigate('/admin');
                return;
            }

            if (userType === 'artist' && authData?.user?.id) {
                const { error: profileError } = await supabase
                    .from('artists')
                    .insert({
                        id: authData.user.id,
                        name: artistName,
                        slug: artistSlug,
                        email: signupEmail,
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
                }
            }

            toast({
                title: 'Cadastro realizado!',
                description: 'Verifique seu email para confirmar a conta'
            });

            setSignupStep(3);
        } catch (error) {
            toast({
                title: 'Erro ao cadastrar',
                description: error.message || 'Tente novamente mais tarde',
                variant: 'destructive'
            });
        } finally {
            setLoadingSignup(false);
        }
    };

    const termosDeUso = (
        <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>AVISO LEGAL</div>
            <p>O site "Ouça Aqui", oferece uma plataforma para compartilhamento e divulgação de conteúdo musical. Ao acessar ou utilizar nossos serviços, você concorda com os Termos de Uso e a Política de Privacidade, os quais podem ser alterados periodicamente. Recomendamos que você os revise regularmente.</p>

            <div style={{ fontWeight: 700, marginTop: 15, marginBottom: 10 }}>1. Uso do Serviço</div>
            <p>Usuários: Podem acessar, ouvir, compartilhar, e criar suas playlists no "Ouça Aqui".</p>
            <p>Visitantes: Podem acessar o conteúdo disponível para visualização e streaming, sem a capacidade de realizar upload.
            O uso da plataforma está sujeito à criação de uma conta, sendo de sua responsabilidade manter a segurança da mesma.</p>

            <div style={{ fontWeight: 700, marginTop: 15, marginBottom: 10 }}>2. Tipos de Conta e Funcionalidades</div>
            <div style={{ fontWeight: 700, marginTop: 10, marginBottom: 5 }}>Usuário:</div>
            <p>Pode acessar e ouvir músicas e conteúdos disponíveis na plataforma.</p>
            <p>Pode compartilhar músicas com outros usuários e criar suas próprias playlists.</p>
            <p>Não tem permissão para fazer upload de conteúdo.</p>

            <div style={{ fontWeight: 700, marginTop: 10, marginBottom: 5 }}>Artista:</div>
            <p>Pode acessar e ouvir músicas, assim como os usuários.</p>
            <p>Tem a permissão para compartilhar músicas com outros usuários.</p>
            <p>Pode fazer upload de músicas e outros conteúdos, disponibilizando-os para streaming e download pelos usuários.</p>
            <p>Tem a possibilidade de gerenciar e editar seus próprios conteúdos dentro da plataforma.</p>

            <div style={{ fontWeight: 700, marginTop: 15, marginBottom: 10 }}>3. Direitos e Responsabilidades</div>
            <p>Você é o único responsável pelo conteúdo que enviar. Ao fazer upload de conteúdo, concede ao "Ouça Aqui" uma licença não exclusiva para exibição, reprodução e distribuição do conteúdo através de nossa plataforma.</p>
            <p>O conteúdo enviado não pode violar direitos de terceiros, incluindo direitos autorais, marcas registradas, privacidade ou qualquer outra legislação vigente.</p>
            <p>O "Ouça Aqui" reserva-se o direito de remover qualquer conteúdo que infrinja as leis ou que seja considerado inadequado.</p>

            <div style={{ fontWeight: 700, marginTop: 15, marginBottom: 10 }}>4. Modificação do Serviço</div>
            <p>O "Ouça Aqui" pode, a qualquer momento, modificar ou descontinuar serviços, funcionalidades ou recursos sem aviso prévio, não sendo responsável por compensações aos usuários.</p>

            <div style={{ fontWeight: 700, marginTop: 15, marginBottom: 10 }}>5. Propriedade Intelectual</div>
            <p>O conteúdo do "Ouça Aqui", incluindo sua marca, design e funcionalidades, são protegidos por direitos autorais e não podem ser reproduzidos sem autorização prévia.</p>
            <p>O conteúdo publicado por usuários é de sua propriedade, mas você concede ao "Ouça Aqui" uma licença para usá-lo conforme necessário para operar a plataforma.</p>

            <div style={{ fontWeight: 700, marginTop: 15, marginBottom: 10 }}>6. Limitação de Responsabilidade</div>
            <p>O "Ouça Aqui" não se responsabiliza por danos diretos, indiretos, incidentais ou consequenciais relacionados ao uso da plataforma. O serviço é fornecido "como está", sem garantias expressas ou implícitas.</p>

            <div style={{ fontWeight: 700, marginTop: 15, marginBottom: 10 }}>7. Encerramento de Conta</div>
            <p>Você pode encerrar sua conta a qualquer momento. O "Ouça Aqui" também pode suspender ou encerrar sua conta caso haja violação dos Termos de Uso.</p>

            <div style={{ fontWeight: 700, marginTop: 15, marginBottom: 10 }}>8. Foro</div>
            <p>Qualquer disputa relacionada a estes Termos de Uso será resolvida no foro da cidade de São Vicente Férrer, Pernambuco, com exclusão de qualquer outro foro.</p>
        </div>
    );

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {signupStep === 1 ? (
                        // SIGNUP STEP 1 - Apenas Cadastro
                        <div className="bg-white rounded-lg shadow-2xl p-6 md:p-8">
                            <h2 className="text-2xl md:text-2xl font-bold text-gray-900 mb-1">Cadastre-se GRÁTIS</h2>
                            <p className="text-gray-600 text-sm mb-6">Crie sua conta para acessar a plataforma</p>

                            {/* Seletor de Tipo */}
                            <div className="mb-8">
                                <p className="text-gray-700 font-semibold text-sm mb-3">Tipo de conta:</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setUserType('user')}
                                        className={`flex-1 px-4 py-3 rounded-lg font-bold text-sm transition-colors ${
                                            userType === 'user'
                                                ? 'bg-red-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Usuário
                                    </button>
                                    <button
                                        onClick={() => setUserType('artist')}
                                        className={`flex-1 px-4 py-3 rounded-lg font-bold text-sm transition-colors ${
                                            userType === 'artist'
                                                ? 'bg-red-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Artista
                                    </button>
                                </div>
                            </div>

                            {/* Formulário */}
                            <form onSubmit={handleSignupStep1} className="space-y-4">
                                <div className="relative">
                                    <UserIcon className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Nome completo"
                                        value={signupName}
                                        onChange={(e) => setSignupName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600 placeholder-gray-400 text-sm"
                                    />
                                </div>

                                <div className="relative">
                                    <EmailIcon className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" />
                                    <input
                                        type="email"
                                        placeholder="E-mail"
                                        value={signupEmail}
                                        onChange={(e) => setSignupEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600 placeholder-gray-400 text-sm"
                                    />
                                </div>

                                <div className="relative">
                                    <LockIcon className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" />
                                    <input
                                        type={showSignupPassword ? 'text' : 'password'}
                                        placeholder="Senha"
                                        value={signupPassword}
                                        onChange={(e) => setSignupPassword(e.target.value)}
                                        className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600 placeholder-gray-400 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                <div className="relative">
                                    <LockIcon className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" />
                                    <input
                                        type={showSignupConfirmPassword ? 'text' : 'password'}
                                        placeholder="Confirmar Senha"
                                        value={signupConfirmPassword}
                                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                                        className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600 placeholder-gray-400 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showSignupConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                <div className="flex items-start gap-2">
                                    <input
                                        type="checkbox"
                                        id="acceptTerms"
                                        checked={acceptTerms}
                                        onChange={(e) => {
                                            if (!termsReadByUser) {
                                                openTermsModal('user');
                                            } else {
                                                setAcceptTerms(e.target.checked);
                                            }
                                        }}
                                        className="mt-1 cursor-pointer"
                                    />
                                    <label htmlFor="acceptTerms" className="text-xs text-gray-700">
                                        Li e aceito os{' '}
                                        <span 
                                            className="text-red-600 underline cursor-pointer hover:text-red-700"
                                            onClick={() => openTermsModal('user')}
                                        >
                                            termos de uso
                                        </span>
                                        {!termsReadByUser && <span className="text-gray-500 text-xs ml-1">(Abra para ler)</span>}
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loadingSignup}
                                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-full transition-colors flex items-center justify-center gap-2 mt-5 text-sm"
                                >
                                    {loadingSignup && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {userType === 'artist' ? 'PRÓXIMO' : 'CADASTRAR'}
                                </button>
                            </form>
                        </div>
                    ) : signupStep === 2 ? (
                        // SIGNUP STEP 2 - Artist Info
                        <div className="bg-white rounded-lg shadow-2xl p-8 md:p-12 max-w-2xl mx-auto">
                            {/* Stepper Visual */}
                            <div className="flex items-center justify-between mb-12">
                                {/* Step 1 */}
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
                                        ✓
                                    </div>
                                    <p className="text-xs text-gray-600 text-center max-w-[80px]">Informações<br />Básicas</p>
                                </div>

                                {/* Linha 1 */}
                                <div className="flex-1 h-1 bg-red-600 mx-4 mb-6"></div>

                                {/* Step 2 */}
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-sm">
                                        2
                                    </div>
                                    <p className="text-xs text-gray-600 text-center max-w-[80px]">Informações do<br />Artista</p>
                                </div>

                                {/* Linha 2 */}
                                <div className="flex-1 h-1 bg-gray-300 mx-4 mb-6"></div>

                                {/* Step 3 */}
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-gray-300 text-white flex items-center justify-center font-bold text-sm">
                                        3
                                    </div>
                                    <p className="text-xs text-gray-600 text-center max-w-[80px]">Cadastro<br />Finalizado</p>
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-8">Informações do Artista</h2>

                            <form onSubmit={handleSignupStep2} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome (Artista/Banda)</label>
                                    <input
                                        type="text"
                                        placeholder="Nome do artista ou banda"
                                        value={artistName}
                                        onChange={(e) => handleArtistNameChange(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600 placeholder-gray-400 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL do Perfil</label>
                                    <div className="flex items-center gap-1">
                                        <span className="text-gray-600 text-sm whitespace-nowrap">https://oucaaqui.com/</span>
                                        <input
                                            type="text"
                                            placeholder="seuartista"
                                            value={artistSlug}
                                            onChange={(e) => {
                                                setArtistSlug(slugify(e.target.value));
                                                setArtistSlugError('');
                                            }}
                                            className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none placeholder-gray-400 text-sm ${
                                                artistSlugError ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-600'
                                            }`}
                                        />
                                    </div>
                                    {artistSlugError && <p className="text-red-500 text-xs mt-1">{artistSlugError}</p>}
                                    {artistSlug && !artistSlugError && (
                                        <p className="text-green-600 text-xs mt-1">https://oucaaqui.com/{artistSlug}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                                        <input
                                            type="text"
                                            placeholder="Sua cidade"
                                            value={artistCidade}
                                            onChange={(e) => setArtistCidade(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600 placeholder-gray-400 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                        <select
                                            value={artistEstado}
                                            onChange={(e) => setArtistEstado(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600 text-sm"
                                        >
                                            <option value="">Selecione um estado</option>
                                            {estadosBrasil.map((estado) => (
                                                <option key={estado.value} value={estado.value}>
                                                    {estado.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gênero</label>
                                    <select
                                        value={artistGenero}
                                        onChange={(e) => setArtistGenero(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600 text-sm"
                                    >
                                        <option value="">Selecione</option>
                                        <option value="masculino">Masculino</option>
                                        <option value="feminino">Feminino</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estilo Musical</label>
                                    <select
                                        value={artistEstiloMusical}
                                        onChange={(e) => setArtistEstiloMusical(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600 text-sm"
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

                                <div className="flex items-start gap-2">
                                    <input
                                        type="checkbox"
                                        id="acceptTermsArtist"
                                        checked={acceptTermsArtist}
                                        onChange={(e) => {
                                            if (!termsReadByArtist) {
                                                openTermsModal('artist');
                                            } else {
                                                setAcceptTermsArtist(e.target.checked);
                                            }
                                        }}
                                        className="mt-1 cursor-pointer"
                                    />
                                    <label htmlFor="acceptTermsArtist" className="text-xs text-gray-700">
                                        Li e aceito os{' '}
                                        <span 
                                            className="text-red-600 underline cursor-pointer hover:text-red-700"
                                            onClick={() => openTermsModal('artist')}
                                        >
                                            termos de uso
                                        </span>
                                        {!termsReadByArtist && <span className="text-gray-500 text-xs ml-1">(Abra para ler)</span>}
                                    </label>
                                </div>

                                <div className="flex gap-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setSignupStep(1)}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-3 rounded-full transition-colors"
                                    >
                                        VOLTAR
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loadingSignup}
                                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-full transition-colors flex items-center justify-center gap-2 text-sm"
                                    >
                                        {loadingSignup && <Loader2 className="w-4 h-4 animate-spin" />}
                                        CADASTRAR
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : signupStep === 3 ? (
                        // SIGNUP STEP 3 - Success
                        <div className="bg-white rounded-lg shadow-2xl p-8 md:p-12 max-w-2xl mx-auto">
                            {/* Stepper Visual */}
                            <div className="flex items-center justify-between mb-12">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
                                        ✓
                                    </div>
                                    <p className="text-xs text-gray-600 text-center max-w-[80px]">Informações<br />Básicas</p>
                                </div>
                                <div className="flex-1 h-1 bg-red-600 mx-4 mb-6"></div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
                                        ✓
                                    </div>
                                    <p className="text-xs text-gray-600 text-center max-w-[80px]">Informações do<br />Artista</p>
                                </div>
                                <div className="flex-1 h-1 bg-red-600 mx-4 mb-6"></div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
                                        ✓
                                    </div>
                                    <p className="text-xs text-gray-600 text-center max-w-[80px]">Cadastro<br />Finalizado</p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
                                    <svg className="w-12 h-12 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                    </svg>
                                </div>

                                <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Cadastro finalizado com sucesso</h2>
                                <p className="text-gray-600 text-center mb-8">
                                    Seu cadastro foi realizado com sucesso! Verifique seu e-mail para confirmar sua conta e começar a usar a plataforma.
                                </p>

                                <button
                                    onClick={() => {
                                        // Reset form
                                        setSignupName('');
                                        setSignupEmail('');
                                        setSignupPassword('');
                                        setSignupConfirmPassword('');
                                        setArtistName('');
                                        setArtistSlug('');
                                        setArtistSlugError('');
                                        setArtistCidade('');
                                        setArtistEstado('');
                                        setArtistGenero('');
                                        setArtistEstiloMusical('');
                                        setAcceptTerms(false);
                                        setAcceptTermsArtist(false);
                                        setUserType('user');
                                        setSignupStep(1);
                                        navigate('/');
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-full transition-colors"
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Modal de Termos de Uso */}
            {showTermsModal && (
                <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
                    <DialogContent style={{ maxWidth: 600, padding: 0 }}>
                        <DialogTitle style={{ padding: '24px 24px 0 24px', fontWeight: 700, fontSize: 20 }}>Termos de Uso</DialogTitle>
                        <DialogDescription>
                            <div style={{ maxHeight: '50vh', overflowY: 'auto', textAlign: 'left', padding: 24 }}>
                                {termosDeUso}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                                <button
                                    type="button"
                                    style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 48px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
                                    onClick={acceptTermsModal}
                                >
                                    Concordo
                                </button>
                            </div>
                        </DialogDescription>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};

export default LoginWhite;
