import React, { createContext, useContext, useState, useEffect } from 'react';
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
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
         // Verificar sessão atual do Supabase
         const getSession = async () => {
             try {
                 const { data: { session } } = await supabase.auth.getSession();
    
                 if (session?.user) {
                     // Se há sessão válida no Supabase, restaurar usuário
                     let avatarUrl = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || DEFAULT_AVATAR;
                     
                     let isAdmin = false;
                     let isAdminOnly = false;
                     let adminAvatar = null;

                     // Verificar se é ADMIN (com timeout)
                     try {
                         const { data: adminData, error } = await Promise.race([
                             supabase
                                 .from('admin_users')
                                 .select('id, avatar_url, is_admin_only')
                                 .eq('id', session.user.id)
                                 .maybeSingle(),
                             new Promise((_, reject) => 
                                 setTimeout(() => reject(new Error('Admin check timeout')), 15000)
                             )
                         ]);

                         if (adminData) {
                             isAdmin = true;
                             isAdminOnly = adminData.is_admin_only === true;
                             adminAvatar = adminData.avatar_url;
                         }
                     } catch (adminError) {
                         console.warn('Erro ao verificar status de admin:', adminError);
                         isAdmin = false;
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
                     // Se não há sessão válida, tentar restaurar do localStorage (offline mode)
                     const savedUser = localStorage.getItem('currentUser');
                     if (savedUser) {
                         try {
                             const userData = JSON.parse(savedUser);
                             setUser(userData);
                             console.log('Usuário restaurado do cache (modo offline):', userData.name);
                         } catch (e) {
                             // Se localStorage está corrompido, deslogar
                             setUser(null);
                             localStorage.removeItem('currentUser');
                         }
                     } else {
                         setUser(null);
                     }
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
                  let avatarUrl = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || DEFAULT_AVATAR;
                  
                  let isAdmin = false;
                  let isAdminOnly = false;
                  let adminAvatar = null;
    
                  // Verificar se é admin (com timeout)
                  try {
                      const { data: adminData, error } = await Promise.race([
                          supabase
                              .from('admin_users')
                              .select('id, avatar_url, is_admin_only')
                              .eq('id', session.user.id)
                              .maybeSingle(),
                          new Promise((_, reject) => 
                              setTimeout(() => reject(new Error('Admin check timeout')), 15000)
                          )
                      ]);
    
                      if (adminData) {
                          isAdmin = true;
                          isAdminOnly = adminData.is_admin_only === true;
                          adminAvatar = adminData.avatar_url;
                      }
                  } catch (adminError) {
                      console.warn('Erro ao verificar status de admin:', adminError);
                      isAdmin = false;
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
             
             // Verificar se é ADMIN com timeout
             try {
                 const { data: adminData } = await Promise.race([
                     supabase
                         .from('admin_users')
                         .select('id, is_admin_only')
                         .eq('id', data.user.id)
                         .maybeSingle(),
                     new Promise((_, reject) => 
                         setTimeout(() => reject(new Error('Admin check timeout')), 15000)
                     )
                 ]);
    
                 if (adminData) {
                     isAdmin = true;
                     isAdminOnly = adminData.is_admin_only === true;
                 }
             } catch (adminError) {
                 console.warn('Erro ao verificar admin status:', adminError);
             }
    
             // Verificar se é ARTISTA (apenas se não for admin-only)
             let artistData = null;
             let isArtist = false;
             
             if (!isAdminOnly) {
                 try {
                     const { data: artistCheck } = await Promise.race([
                         supabase
                             .from('artists')
                             .select('id, name, avatar_url')
                             .eq('id', data.user.id)
                             .maybeSingle(),
                         new Promise((_, reject) => 
                             setTimeout(() => reject(new Error('Artist check timeout')), 15000)
                         )
                     ]);
    
                     artistData = artistCheck;
                     isArtist = !!artistData || data.user.user_metadata?.user_type === 'artist';
                 } catch (artistError) {
                     console.warn('Erro ao verificar artist status:', artistError);
                 }
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
                 avatar: artistData?.avatar_url || DEFAULT_AVATAR
             };
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
                redirectTo: `${window.location.origin}?login=success`,
                skipBrowserRedirect: true
            }
        });
        return { data, error };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        localStorage.removeItem('currentUser');
        // Limpar sessão do Supabase
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
        logout,
        upgradeToPremium,
        updateUser,
        isArtist: user?.type === 'artist' && user?.type !== 'admin',
        isPremium: user?.isPremium,
        isAdmin: user?.isAdmin === true
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
