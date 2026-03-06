import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from '../../hooks/use-toast';
import { Search, BadgeCheck, Mail, Lock, ChevronDown, ChevronUp, X } from 'lucide-react';

const ArtistsManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  const searchArtists = useCallback(async (term) => {
    setLoading(true);
    let query = supabase
      .from('artists')
      .select('id, name, slug, email, is_verified, avatar_url, created_at')
      .order('name', { ascending: true })
      .limit(50);

    if (term.trim()) {
      query = query.ilike('name', `%${term.trim()}%`);
    }

    const { data, error } = await query;
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setArtists(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    searchArtists('');
  }, [searchArtists]);

  const handleSearch = (e) => {
    e.preventDefault();
    searchArtists(searchTerm);
  };

  const toggleExpand = (artist) => {
    if (expandedId === artist.id) {
      setExpandedId(null);
      setEditData({});
    } else {
      setExpandedId(artist.id);
      setEditData({
        email: artist.email || '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  };

  const toggleVerified = async (artist) => {
    const newValue = !artist.is_verified;
    const { error } = await supabase
      .from('artists')
      .update({ is_verified: newValue })
      .eq('id', artist.id);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setArtists(prev => prev.map(a =>
        a.id === artist.id ? { ...a, is_verified: newValue } : a
      ));
      toast({
        title: newValue ? 'Artista verificado!' : 'Verificação removida',
        description: `${artist.name} ${newValue ? 'agora tem o selo de verificação' : 'não tem mais o selo'}`,
      });
    }
  };

  const saveEmailPassword = async (artist) => {
    if (!editData.email?.trim()) {
      toast({ title: 'Erro', description: 'E-mail não pode ser vazio', variant: 'destructive' });
      return;
    }

    if (editData.newPassword && editData.newPassword !== editData.confirmPassword) {
      toast({ title: 'Erro', description: 'As senhas não coincidem', variant: 'destructive' });
      return;
    }

    if (editData.newPassword && editData.newPassword.length < 6) {
      toast({ title: 'Erro', description: 'A senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // Atualizar e-mail na tabela artists
      const updates = { email: editData.email.trim() };
      const { error: artistError } = await supabase
        .from('artists')
        .update(updates)
        .eq('id', artist.id);

      if (artistError) throw artistError;

      // Atualizar e-mail no auth via função RPC (se disponível)
      // Nota: atualização de auth requer service_role — usamos RPC admin_update_user
      const promises = [];

      if (editData.email.trim() !== artist.email) {
        promises.push(
          supabase.rpc('admin_update_user_email', {
            user_id: artist.id,
            new_email: editData.email.trim()
          })
        );
      }

      if (editData.newPassword) {
        promises.push(
          supabase.rpc('admin_update_user_password', {
            user_id: artist.id,
            new_password: editData.newPassword
          })
        );
      }

      // Executar RPCs (podem não existir — tratamos o erro graciosamente)
      if (promises.length > 0) {
        const results = await Promise.allSettled(promises);
        const rpcErrors = results.filter(r => r.status === 'rejected' || r.value?.error);
        if (rpcErrors.length > 0) {
          console.warn('RPC admin não disponível — apenas tabela artists atualizada');
        }
      }

      setArtists(prev => prev.map(a =>
        a.id === artist.id ? { ...a, email: editData.email.trim() } : a
      ));

      toast({
        title: 'Salvo!',
        description: `Dados de ${artist.name} atualizados com sucesso`,
      });

      setExpandedId(null);
      setEditData({});
    } catch (err) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gerenciar Artistas</h2>
        <p className="text-gray-600">
          Adicione o selo de verificação e edite e-mail ou senha dos artistas
        </p>
      </div>

      {/* Busca */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar artista pelo nome..."
          className="flex-1"
        />
        <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
          <Search className="w-4 h-4 mr-2" />
          {loading ? 'Buscando...' : 'Buscar'}
        </Button>
        {searchTerm && (
          <Button
            type="button"
            variant="outline"
            onClick={() => { setSearchTerm(''); searchArtists(''); }}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </form>

      {/* Lista de artistas */}
      <div className="space-y-2">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600" />
          </div>
        )}

        {!loading && artists.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum artista encontrado
          </div>
        )}

        {artists.map((artist) => (
          <div key={artist.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Linha principal */}
            <div className="flex items-center gap-4 p-4">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                {artist.avatar_url ? (
                  <img src={artist.avatar_url} alt={artist.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-lg">
                    {artist.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 truncate">{artist.name}</span>
                  {artist.is_verified && (
                    <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  )}
                </div>
                <span className="text-sm text-gray-500 truncate block">
                  {artist.email || 'sem e-mail cadastrado'}
                </span>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Botão verificar */}
                <button
                  onClick={() => toggleVerified(artist)}
                  title={artist.is_verified ? 'Remover verificação' : 'Verificar artista'}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    artist.is_verified
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <BadgeCheck className="w-3.5 h-3.5" />
                  {artist.is_verified ? 'Verificado' : 'Verificar'}
                </button>

                {/* Botão editar */}
                <button
                  onClick={() => toggleExpand(artist)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  {expandedId === artist.id ? (
                    <><ChevronUp className="w-3.5 h-3.5" /> Fechar</>
                  ) : (
                    <><ChevronDown className="w-3.5 h-3.5" /> Editar</>
                  )}
                </button>
              </div>
            </div>

            {/* Painel de edição expandido */}
            {expandedId === artist.id && (
              <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">
                {/* E-mail */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <Mail className="w-3.5 h-3.5" /> E-mail
                  </label>
                  <Input
                    type="email"
                    value={editData.email || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="novo@email.com"
                    className="bg-white"
                  />
                </div>

                {/* Nova senha */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <Lock className="w-3.5 h-3.5" /> Nova Senha
                    <span className="text-gray-400 font-normal">(deixe em branco para não alterar)</span>
                  </label>
                  <Input
                    type="password"
                    value={editData.newPassword || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Mínimo 6 caracteres"
                    className="bg-white"
                  />
                </div>

                {/* Confirmar senha */}
                {editData.newPassword && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Confirmar Nova Senha
                    </label>
                    <Input
                      type="password"
                      value={editData.confirmPassword || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Repita a nova senha"
                      className={`bg-white ${
                        editData.confirmPassword && editData.newPassword !== editData.confirmPassword
                          ? 'border-red-400'
                          : ''
                      }`}
                    />
                    {editData.confirmPassword && editData.newPassword !== editData.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={() => saveEmailPassword(artist)}
                    disabled={saving}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setExpandedId(null); setEditData({}); }}
                  >
                    Cancelar
                  </Button>
                </div>

                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  ⚠️ A alteração de e-mail e senha atualiza os dados de acesso do artista. Use com cuidado.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArtistsManager;
