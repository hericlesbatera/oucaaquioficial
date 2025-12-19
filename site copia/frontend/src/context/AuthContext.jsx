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
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || 'Usuário',
          type: session.user.user_metadata?.user_type || 'user',
          cidade: session.user.user_metadata?.cidade || '',
          estado: session.user.user_metadata?.estado || '',
          genero: session.user.user_metadata?.genero || '',
          estilo_musical: session.user.user_metadata?.estilo_musical || '',
          isPremium: false,
          avatar: DEFAULT_AVATAR
        };
        setUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
      }
      setLoading(false);
    };

    getSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || 'Usuário',
          type: session.user.user_metadata?.user_type || 'user',
          cidade: session.user.user_metadata?.cidade || '',
          estado: session.user.user_metadata?.estado || '',
          genero: session.user.user_metadata?.genero || '',
          estilo_musical: session.user.user_metadata?.estilo_musical || '',
          isPremium: false,
          avatar: DEFAULT_AVATAR
        };
        setUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('currentUser');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { error };
    }

    // Verificar se o usuário é um artista cadastrado
    const { data: artistData } = await supabase
      .from('artists')
      .select('id, name, avatar_url')
      .eq('id', data.user.id)
      .maybeSingle();
    
    const isArtist = !!artistData || data.user.user_metadata?.user_type === 'artist';

    const userData = {
      id: data.user.id,
      email: data.user.email,
      name: artistData?.name || data.user.user_metadata?.full_name || 'Usuário',
      type: isArtist ? 'artist' : 'user',
      cidade: data.user.user_metadata?.cidade || '',
      estado: data.user.user_metadata?.estado || '',
      genero: data.user.user_metadata?.genero || '',
      estilo_musical: data.user.user_metadata?.estilo_musical || '',
      isPremium: false,
      avatar: artistData?.avatar_url || DEFAULT_AVATAR
    };
    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    return { data: userData, isArtist };
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    try { localStorage.setItem('currentUser', JSON.stringify(updatedUser)); } catch (e) {}
  };

  const loginWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    return { data, error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('currentUser');
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
    isArtist: user?.type === 'artist',
    isPremium: user?.isPremium
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
