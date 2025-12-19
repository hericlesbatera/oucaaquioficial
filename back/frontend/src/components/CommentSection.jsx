import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { toast } from '../hooks/use-toast';
import { MessageCircle, Send, MoreVertical, Trash2, BadgeCheck } from 'lucide-react';

const CommentSection = ({ albumId, artistId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminInfo, setAdminInfo] = useState(null);

  // Carregar informações do usuário e verificar se é admin
  useEffect(() => {
    const loadUserInfo = async () => {
      if (user?.id) {
        // Usar informações já disponíveis no contexto de autenticação
        setIsAdmin(user.isAdmin || false);
        if (user.isAdmin) {
          setAdminInfo({
            id: user.id,
            avatar_url: user.avatar
          });
        }

        // Se não for admin, buscar dados do artista (só se necessário)
        if (!user.isAdmin) {
          try {
            const { data } = await supabase
              .from('artists')
              .select('id, name, avatar_url, is_verified')
              .eq('id', user.id)
              .maybeSingle();
            
            if (data) {
              setUserInfo(data);
            }
          } catch (error) {
            console.error('Erro ao carregar info do artista:', error);
          }
        }
      }
    };

    loadUserInfo();
  }, [user?.id]);

  // Carregar comentários (com cache simples)
   useEffect(() => {
     // Se já carregou comentários para este álbum, não recarrega
     if (comments.length > 0 && !loading) {
       return;
     }
     loadComments();
   }, [albumId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('album_comments')
        .select('id, user_id, comment_text, user_name, user_avatar, user_verified, created_at')
        .eq('album_id', albumId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Login Necessário',
        description: 'Faça login para comentar',
        variant: 'destructive'
      });
      return;
    }

    if (!commentText.trim()) {
      toast({
        title: 'Comentário vazio',
        description: 'Digite algo antes de comentar',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Preparar dados do comentário (não precisa fazer query extra)
      const userAvatar = isAdmin ? (adminInfo?.avatar_url || null) : (userInfo?.avatar_url || null);
      const userName = isAdmin ? 'Ouça Aqui' : (userInfo?.name || user.email);
      
      const { data, error } = await supabase
        .from('album_comments')
        .insert([
          {
            album_id: albumId,
            user_id: user.id,
            comment_text: commentText.trim(),
            user_name: userName,
            user_avatar: userAvatar,
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;

      // Adicionar novo comentário ao estado sem fazer reload
      if (data && data.length > 0) {
        const newComment = {
          ...data[0],
          user_verified: isAdmin ? false : userInfo?.is_verified
        };
        setComments([newComment, ...comments]);
        setCommentText('');
        
        toast({
          title: 'Comentário publicado!',
          description: 'Seu comentário foi adicionado com sucesso'
        });
      }
    } catch (error) {
      console.error('Erro ao publicar comentário:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao publicar comentário',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const { error } = await supabase
        .from('album_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      await loadComments();
      setOpenMenuId(null);
      
      toast({
        title: 'Comentário deletado',
        description: 'Seu comentário foi removido'
      });
    } catch (error) {
      console.error('Erro ao deletar comentário:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao deletar comentário',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 mt-16 mb-16">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <MessageCircle className="w-8 h-8 text-red-600" />
        <h2 className="text-3xl font-bold text-black">COMENTÁRIOS</h2>
      </div>

      {/* Divisor vermelho */}
      <div className="w-full h-1 bg-red-600 rounded mb-8"></div>

      {/* Seção de comentário (se logado) ou login (se não logado) */}
      {!user ? (
        // Não logado
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200 mb-8">
          <p className="text-gray-700 text-lg mb-6">Faça login para deixar um comentário</p>
          <Button 
            onClick={() => navigate('/login')}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded-lg"
          >
            Iniciar Sessão
          </Button>
        </div>
      ) : (
        // Logado - Mostrar formulário de comentário
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-6">
            {/* Avatar do usuário */}
            {isAdmin && adminInfo?.avatar_url ? (
              <img
                src={adminInfo.avatar_url}
                alt="Ouça Aqui"
                className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-red-600"
              />
            ) : userInfo?.avatar_url ? (
              <img
                src={userInfo.avatar_url}
                alt={userInfo.name}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-red-600"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {(isAdmin ? 'O' : userInfo?.name?.charAt(0)) || user.email?.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Formulário */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-black font-semibold">{isAdmin ? 'Ouça Aqui' : (userInfo?.name || user.email)}</p>
                {userInfo?.is_verified && (
                  <BadgeCheck className="w-4 h-4 text-blue-500" />
                )}
              </div>
              <form onSubmit={handleSubmitComment} className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Seja o primeiro a comentar..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={submitting || !commentText.trim()}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Comentar
                  </Button>
                </div>
              </form>
            </div>
          </div>
          <div className="h-px bg-gray-200 mb-8"></div>
        </div>
      )}

      {/* Lista de comentários */}
      <div>
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Carregando comentários...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Seja o primeiro a comentar!
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-4 pb-6 border-b border-gray-200 last:border-b-0">
                {/* Avatar do comentarista */}
                {comment.user_avatar ? (
                  <img
                    src={comment.user_avatar}
                    alt={comment.user_name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-red-600"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {comment.user_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}

                {/* Conteúdo do comentário */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-black font-semibold">{comment.user_name || 'Usuário'}</p>
                      {comment.user_verified && (
                        <BadgeCheck className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    {(user?.id === comment.user_id || isAdmin) && (
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === comment.id ? null : comment.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                        
                        {openMenuId === comment.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                              Deletar {isAdmin && user?.id !== comment.user_id ? '(Admin)' : ''}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-gray-700 leading-relaxed">{comment.comment_text}</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {new Date(comment.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
