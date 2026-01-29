import { supabase } from './supabaseClient';

export const authApi = {
  async changePassword(userId, newPassword) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { data: null, error: { detail: error.message || 'Erro ao alterar senha' } };
      }

      return { data, error: null };
    } catch (err) {
      console.error('changePassword error:', err);
      return { data: null, error: { detail: String(err) } };
    }
  },

  async changeEmail(userId, newEmail) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) {
        return { data: null, error: { detail: error.message || 'Erro ao alterar email' } };
      }

      return { data, error: null };
    } catch (err) {
      console.error('changeEmail error:', err);
      return { data: null, error: { detail: String(err) } };
    }
  },

  async deleteProfile(userId, password) {
    try {
      // TODO: Implementar função de deleção de perfil
      return { data: null, error: { detail: 'Funcionalidade em desenvolvimento' } };
    } catch (err) {
      console.error('deleteProfile error:', err);
      return { data: null, error: { detail: String(err) } };
    }
  }
};
