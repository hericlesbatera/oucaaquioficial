import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { DEFAULT_AVATAR } from '../lib/defaults';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    // FAST LOAD: carregar usuário do cache imediatamente para evitar tela de loading
    const getCachedUser = () => {
        try {
            const cached = localStorage.getItem('currentUser');
            return cached ? JSON.parse(cached) : null;
        } catch (e) {
            return null;
        }
    };
    const [user, setUser] = useState(getCachedUser);
    // Se há usuário em cache, não mostrar loading (evita tela branca)
    const [loading, setLoading] = useState(!getCachedUser());
    // Ref para debounce do SIGNED_IN (evitar múltiplos disparos)
    const signedInDebounceRef = useRef(null);
    const lastSignedInUserRef = useRef(null);

    useEffect(() => {
         // Verificar sessão atual do Supabase
         const getSession = async () => {
             try {
                 const { data: { session } } = await supabase.auth.getSession();
    
                 if (session?.user) {
                     // Se há sessão válida no Supabase, restaurar usuário
                     let avatarUrl = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || DEFAULT_AVATAR;
                     
                     // FAST LOAD: se já temos usuário em cache com o mesmo ID, liberar loading imediatamente
                     const cachedUser = getCachedUser();
                     if (cachedUser && cachedUser.id === session.user.id) {
                         setUser(cachedUser);
                         setLoading(false);
                         // Continuar verificações em background sem bloquear a UI
                     }
                     
                     const isGoogleProvider = session.user.app_metadata?.provider === 'google';
                     let isAdmin = false;
                     let isAdminOnly = false;
                     let adminAvatar = null;

                     // Paralelizar verificações de Google + admin para reduzir tempo de carregamento
                     const timeout5s = (msg) => new Promise((_, reject) =>
                         setTimeout(() => reject(new Error(msg)), 5000)
                     );

                     // Para login Google, verificar se o usuário existe nas tabelas (em paralelo com admin)
                     const [adminResult, artistExistsResult, userExistsResult] = await Promise.allSettled([
                         Promise.race([
                             supabase.from('admin_users').select('id, avatar_url, is_admin_only').eq('id', session.user.id).maybeSingle(),
                             timeout5s('Admin check timeout')
                         ]),
                         isGoogleProvider
                             ? Promise.race([supabase.from('artists').select('id').eq('id', session.user.id).maybeSingle(), timeout5s('Artist exists timeout')])
                             : Promise.resolve({ data: null }),
                         isGoogleProvider
                             ? Promise.race([supabase.from('users').select('id').eq('id', session.user.id).maybeSingle(), timeout5s('User exists timeout')])
                             : Promise.resolve({ data: null })
                     ]);

                     if (adminResult.status === 'fulfilled' && adminResult.value?.data) {
                         isAdmin = true;
                         isAdminOnly = adminResult.value.data.is_admin_only === true;
                         adminAvatar = adminResult.value.data.avatar_url;
                     }

                     if (isGoogleProvider) {
                         const artistExists = artistExistsResult.status === 'fulfilled' ? artistExistsResult.value?.data : null;
                         const userExists = userExistsResult.status === 'fulfilled' ? userExistsResult.value?.data : null;
                         if (!artistExists && !userExists) {
                             console.log('[AUTH] getSession: Google user not in tables, showing account type modal');
                             sessionStorage.setItem('googleNeedsAccountType', 'true');
                             sessionStorage.setItem('googlePendingUserId', session.user.id);
                             sessionStorage.setItem('googlePendingEmail', session.user.email);
                             sessionStorage.setItem('googlePendingName', session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Usuário');
                             sessionStorage.setItem('googlePendingAvatar', avatarUrl);
                             setLoading(false);
                             return;
                         }
                     }
    
                     const userData = {
                         id: session.user.id,
                         email: session.user.email,
                         name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Usuário',
                         type: isAdmin ? 'admin' : (session.user.user_metadata?.user_type || 'user'),
                         cidade: session.user.user_metadata?.cidade || '',
                         estado: session.user.user_metadata?.estado || '',
                         genero: session.user.user_metadata?.genero || '',
                         estilo_musical: session.user.user_metadata?.estilo_musical || '',
                         isPremium: false,
                         isAdmin: isAdmin,
                         isAdminOnly: isAdminOnly,
                         avatar: adminAvatar || avatarUrl,
                         user_metadata: session.user.user_metadata
                     };
                     
                     setUser(userData);
                     localStorage.setItem('currentUser', JSON.stringify(userData));
                 } else {
                     // Se não há sessão, deslogar
                     setUser(null);
                     localStorage.removeItem('currentUser');
                 }
                 setLoading(false);
             } catch (error) {
                 console.error('Erro ao verificar sessão:', error);
                 setLoading(false);
             }
         };
    
         getSession();
    
         // Escutar mudanças de autenticação
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
              if (event === 'SIGNED_IN' && session?.user) {
                  // Debounce: ignorar disparos duplicados do mesmo usuário em menos de 3 segundos
                  const currentUserId = session.user.id;
                  if (lastSignedInUserRef.current === currentUserId) {
                      if (signedInDebounceRef.current) {
                          clearTimeout(signedInDebounceRef.current);
                      }
                      signedInDebounceRef.current = setTimeout(() => {
                          lastSignedInUserRef.current = null;
                      }, 3000);
                      console.log('[AUTH] SIGNED_IN debounced for same user, skipping duplicate');
                      return;
                  }
                  lastSignedInUserRef.current = currentUserId;
                  signedInDebounceRef.current = setTimeout(() => {
                      lastSignedInUserRef.current = null;
                  }, 3000);

                  let avatarUrl = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || DEFAULT_AVATAR;
                  
                  let isAdmin = false;
                  let isAdminOnly = false;
                  let adminAvatar = null;

                  // Verificar se é login via Google (OAuth)
                  const isGoogleLogin = session.user.app_metadata?.provider === 'google';
                  const pendingGoogleSignupType = localStorage.getItem('pendingGoogleSignupType');
                  const googleLoginMode = localStorage.getItem('googleLoginMode');
                  
                  console.log('[AUTH] SIGNED_IN event:', { 
                      isGoogleLogin, 
                      pendingGoogleSignupType, 
                      googleLoginMode,
                      userId: session.user.id,
                      provider: session.user.app_metadata?.provider
                  });
                  
                  // Verificar se o usuário já existe nas tabelas (artists ou users)
                  let userExists = false;
                  let existingUserType = null;
                  
                  // Só processar lógica especial de Google se for login/cadastro recente
                  // (não quando é apenas reload de página)
                  const isRecentGoogleAuth = googleLoginMode || pendingGoogleSignupType;
                  
                  if (isGoogleLogin && isRecentGoogleAuth) {
                      // Verificar na tabela artists
                      const { data: artistData, error: artistError } = await supabase
                          .from('artists')
                          .select('id, name')
                          .eq('id', session.user.id)
                          .maybeSingle();
                      
                      console.log('[AUTH] Artist check:', { artistData, artistError, searchId: session.user.id });
                      
                      if (artistData) {
                          userExists = true;
                          existingUserType = 'artist';
                          console.log('[AUTH] User found as artist');
                      } else {
                          // Verificar na tabela users
                          const { data: userData, error: userError } = await supabase
                              .from('users')
                              .select('id, name')
                              .eq('id', session.user.id)
                              .maybeSingle();
                          
                          console.log('[AUTH] User check:', { userData, userError });
                          
                          if (userData) {
                              userExists = true;
                              existingUserType = 'user';
                              console.log('[AUTH] User found as user');
                          }
                      }
                      
                      // Se era tentativa de LOGIN (primeira vez) mas usuário não existe
                      // Mostrar modal para escolher tipo de conta (usuário ou artista)
                      if (googleLoginMode === 'login' && !userExists) {
                          console.log('[AUTH] Login attempt but user not found in tables, prompting for account type');
                          localStorage.removeItem('googleLoginMode');
                          // Marcar que precisa escolher tipo de conta
                          sessionStorage.setItem('googleNeedsAccountType', 'true');
                          sessionStorage.setItem('googlePendingUserId', session.user.id);
                          sessionStorage.setItem('googlePendingEmail', session.user.email);
                          sessionStorage.setItem('googlePendingName', session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Usuário');
                          sessionStorage.setItem('googlePendingAvatar', avatarUrl);
                          setLoading(false);
                          return;
                      }
                      
                      // Se não há modo de login definido (reload de página), não deslogar
                      // O usuário pode estar logado normalmente via sessão
                      
                      // Se era tentativa de CADASTRO, criar ou atualizar a conta
                      console.log('[AUTH] Checking signup:', { pendingGoogleSignupType, userExists });
                      if (pendingGoogleSignupType) {
                          const userType = pendingGoogleSignupType;
                          console.log('[AUTH] Creating/updating account for type:', userType, 'userExists:', userExists);
                          
                          const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Usuário';
                          
                          if (userType === 'artist') {
                              // Usar upsert para criar ou atualizar registro na tabela artists
                              const slug = fullName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                              console.log('[AUTH] Upserting artist:', { id: session.user.id, name: fullName, slug });
                              const { error: artistError } = await supabase.from('artists').upsert({
                                  id: session.user.id,
                                  name: fullName,
                                  slug: slug,
                                  email: session.user.email,
                                  avatar_url: avatarUrl,
                                  created_at: new Date().toISOString()
                              }, { onConflict: 'id' });
                              
                              if (artistError) {
                                  console.error('[AUTH] Error upserting artist:', artistError);
                              } else {
                                  console.log('[AUTH] Artist upserted successfully');
                                  // Atualizar user_metadata no Supabase Auth
                                  await supabase.auth.updateUser({
                                      data: { user_type: 'artist', full_name: fullName }
                                  });
                              }
                          } else {
                              // Usar upsert para criar ou atualizar registro na tabela users
                              console.log('[AUTH] Upserting user:', { id: session.user.id, name: fullName });
                              const { error: userError } = await supabase.from('users').upsert({
                                  id: session.user.id,
                                  name: fullName,
                                  email: session.user.email,
                                  avatar_url: avatarUrl,
                                  created_at: new Date().toISOString()
                              }, { onConflict: 'id' });
                              
                              if (userError) {
                                  console.error('[AUTH] Error upserting user:', userError);
                              } else {
                                  console.log('[AUTH] User upserted successfully');
                                  // Atualizar user_metadata no Supabase Auth
                                  await supabase.auth.updateUser({
                                      data: { user_type: 'user', full_name: fullName }
                                  });
                              }
                          }
                          
                          existingUserType = userType;
                          
                          // Limpar localStorage após o processo
                          localStorage.removeItem('pendingGoogleSignupType');
                          localStorage.removeItem('googleLoginMode');
                      }
                      
                      localStorage.removeItem('googleLoginMode');
                      localStorage.removeItem('pendingGoogleSignupType');
                  } else {
                      // Para QUALQUER login (Google reload ou email/senha) - verificar tipo de usuário
                      // Paralelizar queries de artist, users e admin para reduzir tempo
                      console.log('[AUTH] Checking user type for ID:', session.user.id);
                      try {
                          const t5s = (msg) => new Promise((_, reject) => setTimeout(() => reject(new Error(msg)), 5000));
                          const [artistRes, userRes, adminRes] = await Promise.allSettled([
                              Promise.race([supabase.from('artists').select('id, name, avatar_url').eq('id', session.user.id).maybeSingle(), t5s('Artist timeout')]),
                              Promise.race([supabase.from('users').select('id, name, avatar_url').eq('id', session.user.id).maybeSingle(), t5s('User timeout')]),
                              Promise.race([supabase.from('admin_users').select('id, avatar_url, is_admin_only').eq('id', session.user.id).maybeSingle(), t5s('Admin timeout')])
                          ]);

                          const artistData = artistRes.status === 'fulfilled' ? artistRes.value?.data : null;
                          const userData2 = userRes.status === 'fulfilled' ? userRes.value?.data : null;
                          const adminData = adminRes.status === 'fulfilled' ? adminRes.value?.data : null;

                          if (adminData) {
                              isAdmin = true;
                              isAdminOnly = adminData.is_admin_only === true;
                              adminAvatar = adminData.avatar_url;
                          }

                          if (artistData) {
                              existingUserType = 'artist';
                              if (artistData.name) {
                                  session.user.user_metadata = { ...session.user.user_metadata, full_name: artistData.name, name: artistData.name };
                              }
                              if (artistData.avatar_url) avatarUrl = artistData.avatar_url;
                              console.log('[AUTH] Found in artists table:', artistData.name);
                          } else if (userData2) {
                              existingUserType = 'user';
                              if (userData2.name) {
                                  session.user.user_metadata = { ...session.user.user_metadata, full_name: userData2.name, name: userData2.name };
                              }
                              if (userData2.avatar_url) avatarUrl = userData2.avatar_url;
                              console.log('[AUTH] Found in users table:', userData2.name);
                          } else if (isGoogleLogin) {
                              // Google user não encontrado em nenhuma tabela
                              console.log('[AUTH] Google user not found in any table, prompting for account type');
                              sessionStorage.setItem('googleNeedsAccountType', 'true');
                              sessionStorage.setItem('googlePendingUserId', session.user.id);
                              sessionStorage.setItem('googlePendingEmail', session.user.email);
                              sessionStorage.setItem('googlePendingName', session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Usuário');
                              sessionStorage.setItem('googlePendingAvatar', avatarUrl);
                              setLoading(false);
                              return;
                          }
                          console.log('[AUTH] User type determined:', existingUserType);
                      } catch (e) {
                          console.warn('[AUTH] Error/timeout checking user type:', e.message);
                          existingUserType = session.user.user_metadata?.user_type || 'user';
                      }
                  }
         
                  const userData = {
                      id: session.user.id,
                      email: session.user.email,
                      name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Usuário',
                      type: isAdmin ? 'admin' : (existingUserType || session.user.user_metadata?.user_type || 'user'),
                      cidade: session.user.user_metadata?.cidade || '',
                      estado: session.user.user_metadata?.estado || '',
                      genero: session.user.user_metadata?.genero || '',
                      estilo_musical: session.user.user_metadata?.estilo_musical || '',
                      isPremium: false,
                      isAdmin: isAdmin,
                      isAdminOnly: isAdminOnly,
                      avatar: adminAvatar || avatarUrl,
                      user_metadata: session.user.user_metadata
                  };
                  setUser(userData);
                  localStorage.setItem('currentUser', JSON.stringify(userData));
             } else if (event === 'SIGNED_OUT') {
                 setUser(null);
                 localStorage.removeItem('currentUser');
             } else if (event === 'PASSWORD_RECOVERY') {
                 // Evento disparado quando usuário clica no link de reset password
                 // A sessão foi validada pelo Supabase automaticamente
                 console.log('PASSWORD_RECOVERY event detected, session:', session);
                 if (session?.user) {
                     // Marcar que estamos em modo de reset de senha
                     sessionStorage.setItem('resetPasswordMode', 'true');
                     sessionStorage.setItem('resetPasswordUser', session.user.id);
                 }
             }
         });
    
         return () => subscription.unsubscribe();
     }, []);

    const login = async (email, password) => {
         try {
             const { data, error } = await supabase.auth.signInWithPassword({
                 email,
                 password
             });
    
             if (error) {
                 return { error };
             }
    
             let isAdmin = false;
             let isAdminOnly = false;
             let artistData = null;
             let isArtist = false;

             // Paralelizar verificações de admin e artista para reduzir tempo de login
             try {
                 const timeout5s = (msg) => new Promise((_, reject) =>
                     setTimeout(() => reject(new Error(msg)), 5000)
                 );
                 const [adminResult, artistResult] = await Promise.allSettled([
                     Promise.race([
                         supabase.from('admin_users').select('id, is_admin_only').eq('id', data.user.id).maybeSingle(),
                         timeout5s('Admin check timeout')
                     ]),
                     Promise.race([
                         supabase.from('artists').select('id, name, avatar_url').eq('id', data.user.id).maybeSingle(),
                         timeout5s('Artist check timeout')
                     ])
                 ]);

                 if (adminResult.status === 'fulfilled' && adminResult.value?.data) {
                     isAdmin = true;
                     isAdminOnly = adminResult.value.data.is_admin_only === true;
                 }
                 if (!isAdminOnly && artistResult.status === 'fulfilled' && artistResult.value?.data) {
                     artistData = artistResult.value.data;
                     isArtist = true;
                 }
                 console.log('[LOGIN] Admin/Artist check results:', { isAdmin, isArtist });
             } catch (checkError) {
                 console.warn('Erro ao verificar admin/artist status:', checkError);
             }
    
             // Determinar tipo: admin > artist > user
             let userType = 'user';
             if (isAdmin) {
                 userType = 'admin';
             } else if (isArtist) {
                 userType = 'artist';
             }
    
             const userData = {
                 id: data.user.id,
                 email: data.user.email,
                 name: artistData?.name || data.user.user_metadata?.full_name || 'Usuário',
                 type: userType,
                 cidade: data.user.user_metadata?.cidade || '',
                 estado: data.user.user_metadata?.estado || '',
                 genero: data.user.user_metadata?.genero || '',
                 estilo_musical: data.user.user_metadata?.estilo_musical || '',
                 isPremium: false,
                 isAdmin: isAdmin,
                 isAdminOnly: isAdminOnly,
                 avatar: artistData?.avatar_url || data.user.user_metadata?.avatar_url || DEFAULT_AVATAR
             };
             console.log('[LOGIN] Final userData:', userData);
             setUser(userData);
             localStorage.setItem('currentUser', JSON.stringify(userData));
             return { data: userData, isArtist, isAdmin };
         } catch (authError) {
             console.error('Auth error:', authError);
             return { error: { message: authError.message || 'Erro ao fazer login' } };
         }
     };

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
        try { localStorage.setItem('currentUser', JSON.stringify(updatedUser)); } catch (e) { }
    };

    const loginWithGoogle = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}`
            }
        });
        return { data, error };
    };

    // Completar cadastro Google quando usuário escolhe tipo de conta
    const completeGoogleSignup = async (accountType) => {
        const userId = sessionStorage.getItem('googlePendingUserId');
        const email = sessionStorage.getItem('googlePendingEmail');
        const name = sessionStorage.getItem('googlePendingName');
        const avatar = sessionStorage.getItem('googlePendingAvatar');
        
        if (!userId) {
            console.error('[AUTH] No pending Google signup data');
            return { error: { message: 'Dados de cadastro não encontrados' } };
        }
        
        try {
            if (accountType === 'artist') {
                const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                const { error: artistError } = await supabase.from('artists').upsert({
                    id: userId,
                    name: name,
                    slug: slug,
                    email: email,
                    avatar_url: avatar,
                    created_at: new Date().toISOString()
                }, { onConflict: 'id' });
                
                if (artistError) {
                    console.error('[AUTH] Error creating artist:', artistError);
                    return { error: artistError };
                }
                
                await supabase.auth.updateUser({
                    data: { user_type: 'artist', full_name: name }
                });
            } else {
                const { error: userError } = await supabase.from('users').upsert({
                    id: userId,
                    name: name,
                    email: email,
                    avatar_url: avatar,
                    created_at: new Date().toISOString()
                }, { onConflict: 'id' });
                
                if (userError) {
                    console.error('[AUTH] Error creating user:', userError);
                    return { error: userError };
                }
                
                await supabase.auth.updateUser({
                    data: { user_type: 'user', full_name: name }
                });
            }
            
            // Limpar dados pendentes
            sessionStorage.removeItem('googleNeedsAccountType');
            sessionStorage.removeItem('googlePendingUserId');
            sessionStorage.removeItem('googlePendingEmail');
            sessionStorage.removeItem('googlePendingName');
            sessionStorage.removeItem('googlePendingAvatar');
            
            // Atualizar estado do usuário
            const userData = {
                id: userId,
                email: email,
                name: name,
                type: accountType,
                avatar: avatar,
                isPremium: false,
                isAdmin: false
            };
            
            setUser(userData);
            localStorage.setItem('currentUser', JSON.stringify(userData));
            
            return { data: userData };
        } catch (error) {
            console.error('[AUTH] Error completing Google signup:', error);
            return { error };
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        localStorage.removeItem('currentUser');
        // Limpar sessão do Supabase (incluindo a chave específica configurada)
        localStorage.removeItem('sb-oucaaqui-auth-token');
        localStorage.removeItem('sb-' + (process.env.REACT_APP_SUPABASE_URL || 'localhost') + '-auth-token');
        // Limpar qualquer chave de sessão do Supabase
        Object.keys(localStorage).forEach(key => {
            if (key.includes('supabase') || key.includes('sb-')) {
                localStorage.removeItem(key);
            }
        });
    };

    const upgradeToPremium = () => {
        const updatedUser = { ...user, isPremium: true };
        setUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    };

    const value = {
        user,
        loading,
        login,
        loginWithGoogle,
        completeGoogleSignup,
        logout,
        upgradeToPremium,
        updateUser,
        isArtist: user?.type === 'artist' && user?.type !== 'admin',
        isPremium: user?.isPremium,
        isAdmin: user?.isAdmin === true
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
