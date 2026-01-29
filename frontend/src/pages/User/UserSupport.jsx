import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Layout/Header';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from '../../hooks/use-toast';
import { Send, MessageSquare, Plus, Clock, CheckCircle, ArrowLeft } from 'lucide-react';

const UserSupport = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [replies, setReplies] = useState([]);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [showNewMessage, setShowNewMessage] = useState(false);
    const [newMessageData, setNewMessageData] = useState({
        subject: '',
        message: ''
    });
    const [sendingMessage, setSendingMessage] = useState(false);
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        loadMessages();
        loadUserProfile();
        const subscription = supabase
            .channel('support_messages')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, () => {
                loadMessages();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user?.id]);

    const loadUserProfile = async () => {
        if (!user?.id) return;

        try {
            // Tentar encontrar avatar no user metadata
            if (user?.user_metadata?.avatar_url) {
                setUserProfile({ avatar_url: user.user_metadata.avatar_url });
            } else {
                setUserProfile({ id: user.id });
            }
        } catch (err) {
            console.log('Error loading user profile:', err);
            setUserProfile({ id: user.id });
        }
    };

    useEffect(() => {
        if (selectedMessage?.id) {
            loadReplies(selectedMessage.id);
            
            // Polling como fallback (a cada 2 segundos)
            const pollInterval = setInterval(() => {
                loadReplies(selectedMessage.id);
            }, 2000);
            
            // Real-time subscription
            const subscription = supabase
                .channel(`support_replies_${selectedMessage.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'support_replies',
                        filter: `support_message_id=eq.${selectedMessage.id}`
                    },
                    (payload) => {
                        console.log('Nova resposta recebida:', payload);
                        loadReplies(selectedMessage.id);
                    }
                )
                .subscribe();

            return () => {
                clearInterval(pollInterval);
                supabase.removeChannel(subscription);
            };
        }
    }, [selectedMessage?.id]);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('support_messages')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Erro ao carregar mensagens:', error);
                setLoading(false);
                return;
            }

            setMessages(data || []);
        } catch (err) {
            console.error('Erro ao carregar mensagens:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadReplies = async (messageId) => {
        try {
            const { data, error } = await supabase
                .from('support_replies')
                .select('*')
                .eq('support_message_id', messageId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Erro ao carregar respostas:', error);
                return;
            }

            setReplies(data || []);
        } catch (err) {
            console.error('Erro ao carregar respostas:', err);
        }
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedMessage?.id) return;

        setSendingReply(true);
        try {
            const { error } = await supabase
                .from('support_replies')
                .insert([
                    {
                        support_message_id: selectedMessage.id,
                        user_id: user.id,
                        reply_text: replyText.trim(),
                        is_admin_reply: false
                    }
                ]);

            if (error) throw error;

            setReplyText('');
            await loadReplies(selectedMessage.id);
            toast({
                title: 'Sucesso',
                description: 'Mensagem enviada com sucesso'
            });
        } catch (error) {
            console.error('Erro ao enviar resposta:', error);
            toast({
                title: 'Erro',
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setSendingReply(false);
        }
    };

    const handleCreateNewMessage = async (e) => {
        e.preventDefault();
        if (!newMessageData.subject.trim() || !newMessageData.message.trim()) {
            toast({
                title: 'Erro',
                description: 'Preencha todos os campos',
                variant: 'destructive'
            });
            return;
        }

        setSendingMessage(true);
        try {
            const { error } = await supabase
                .from('support_messages')
                .insert([
                    {
                        user_id: user.id,
                        subject: newMessageData.subject,
                        message: newMessageData.message,
                        status: 'open'
                    }
                ]);

            if (error) throw error;

            setNewMessageData({ subject: '', message: '' });
            setShowNewMessage(false);
            await loadMessages();
            toast({
                title: 'Sucesso',
                description: 'Mensagem enviada! Um administrador responderá em breve'
            });
        } catch (error) {
            console.error('Erro ao criar mensagem:', error);
            toast({
                title: 'Erro',
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setSendingMessage(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600">Carregando...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Chat de Suporte</h1>
                    <p className="text-gray-600">Fale conosco sobre dúvidas ou problemas</p>
                </div>

                {!showNewMessage && messages.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Nenhuma conversa ainda</h2>
                        <p className="text-gray-600 mb-6">Inicie uma conversa com nosso time de suporte</p>
                        <Button
                            onClick={() => setShowNewMessage(true)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Iniciar Conversa
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                        {/* Conversations List */}
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                                <div>
                                    <h2 className="font-semibold text-gray-900">Conversas</h2>
                                    <p className="text-xs text-gray-500 mt-1">{messages.length} conversa(s)</p>
                                </div>
                                {!showNewMessage && (
                                    <Button
                                        onClick={() => setShowNewMessage(true)}
                                        size="sm"
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </Button>
                                )}
                            </div>

                            {messages.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center text-gray-500 p-4">
                                    <div className="text-center">
                                        <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">Nenhuma conversa ainda</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-y-auto flex-1">
                                    {messages.map((message) => (
                                        <button
                                            key={message.id}
                                            onClick={() => setSelectedMessage(message)}
                                            className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition ${selectedMessage?.id === message.id
                                                    ? 'bg-blue-50 border-l-4 border-l-blue-600'
                                                    : ''
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-medium text-gray-900 text-sm truncate flex-1">
                                                    {message.subject}
                                                </h3>
                                                {message.status === 'resolved' && (
                                                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1 truncate">
                                                {message.message}
                                            </p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span
                                                    className={`text-xs px-2 py-1 rounded ${message.status === 'open'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : message.status === 'in_progress'
                                                                ? 'bg-yellow-100 text-yellow-700'
                                                                : 'bg-green-100 text-green-700'
                                                        }`}
                                                >
                                                    {message.status === 'open' && 'Aberto'}
                                                    {message.status === 'in_progress' && 'Em andamento'}
                                                    {message.status === 'resolved' && 'Resolvido'}
                                                </span>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(message.created_at).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Chat Area */}
                        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                            {showNewMessage ? (
                                <>
                                    <div className="border-b border-gray-200 p-4 bg-gray-50 flex items-center gap-3">
                                        <button
                                            onClick={() => {
                                                setShowNewMessage(false);
                                                setNewMessageData({ subject: '', message: '' });
                                            }}
                                            className="text-gray-600 hover:text-gray-900"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>
                                        <h3 className="font-semibold text-gray-900">Nova Conversa</h3>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6">
                                        <form onSubmit={handleCreateNewMessage} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                                    Assunto
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newMessageData.subject}
                                                    onChange={(e) => setNewMessageData({ ...newMessageData, subject: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                                                    placeholder="Qual é o assunto?"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                                    Mensagem
                                                </label>
                                                <textarea
                                                    value={newMessageData.message}
                                                    onChange={(e) => setNewMessageData({ ...newMessageData, message: e.target.value })}
                                                    rows={8}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600 resize-none"
                                                    placeholder="Descreva seu problema ou dúvida..."
                                                />
                                            </div>

                                            <div className="flex gap-3">
                                                <Button
                                                    type="submit"
                                                    disabled={sendingMessage}
                                                    className="bg-red-600 hover:bg-red-700 text-white"
                                                >
                                                    <Send className="w-4 h-4 mr-2" />
                                                    {sendingMessage ? 'Enviando...' : 'Enviar'}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowNewMessage(false);
                                                        setNewMessageData({ subject: '', message: '' });
                                                    }}
                                                    variant="outline"
                                                >
                                                    Cancelar
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                </>
                            ) : selectedMessage ? (
                                <>
                                    {/* Chat Header */}
                                    <div className="border-b border-gray-200 p-4 bg-gray-50">
                                        <div className="flex items-center gap-3 mb-2">
                                            <button
                                                onClick={() => setSelectedMessage(null)}
                                                className="text-gray-600 hover:text-gray-900"
                                            >
                                                <ArrowLeft className="w-5 h-5" />
                                            </button>
                                            <h3 className="font-semibold text-gray-900">
                                                {selectedMessage.subject}
                                            </h3>
                                        </div>
                                        <div className="flex items-center justify-between mt-2 ml-8">
                                            <p className="text-xs text-gray-500">
                                                Iniciada {new Date(selectedMessage.created_at).toLocaleDateString('pt-BR')}
                                            </p>
                                            <span
                                                className={`text-xs px-2 py-1 rounded ${selectedMessage.status === 'open'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : selectedMessage.status === 'in_progress'
                                                            ? 'bg-yellow-100 text-yellow-700'
                                                            : 'bg-green-100 text-green-700'
                                                    }`}
                                            >
                                                {selectedMessage.status === 'open' && 'Aberto'}
                                                {selectedMessage.status === 'in_progress' && 'Em andamento'}
                                                {selectedMessage.status === 'resolved' && 'Resolvido'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                                        {/* Welcome Message */}
                                        <div className="flex justify-center">
                                            <div className="bg-white px-4 py-2 rounded-full text-xs text-gray-500 border border-gray-200">
                                                Conversa iniciada
                                            </div>
                                        </div>

                                        {/* Original Message */}
                                        <div className="flex justify-end gap-3">
                                            <div className="bg-red-600 text-white rounded-lg rounded-tr-none px-4 py-2 max-w-md">
                                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                                    {selectedMessage.message}
                                                </p>
                                                <p className="text-xs mt-2 opacity-70">
                                                    {new Date(selectedMessage.created_at).toLocaleTimeString('pt-BR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0">
                                                {userProfile?.avatar_url ? (
                                                    <img
                                                        src={userProfile.avatar_url}
                                                        alt="Avatar"
                                                        className="w-10 h-10 rounded-full object-cover border-2 border-red-600"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-semibold text-sm">
                                                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Auto Response */}
                                        {replies.length === 0 && selectedMessage.status === 'open' && (
                                            <div className="flex justify-start gap-3">
                                                <div className="flex-shrink-0">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                                                        A
                                                    </div>
                                                </div>
                                                <div className="bg-gray-200 text-gray-900 rounded-lg rounded-tl-none px-4 py-2 max-w-md">
                                                    <p className="text-sm">
                                                        Obrigado por entrar em contato! Um administrador responderá em breve.
                                                    </p>
                                                    <p className="text-xs mt-2 text-gray-600">
                                                        {new Date().toLocaleTimeString('pt-BR', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Replies */}
                                        {replies.map((reply, index) => (
                                            <div key={reply.id} className={`flex ${reply.is_admin_reply ? 'justify-start' : 'justify-end'} gap-3`}>
                                                {reply.is_admin_reply ? (
                                                    <>
                                                        <div className="flex-shrink-0">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                                                                A
                                                            </div>
                                                        </div>
                                                        <div className="bg-gray-200 text-gray-900 rounded-lg rounded-tl-none px-4 py-2 max-w-md">
                                                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                                                {reply.reply_text}
                                                            </p>
                                                            <p className="text-xs mt-2 text-gray-600">
                                                                {new Date(reply.created_at).toLocaleTimeString('pt-BR', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="bg-red-600 text-white rounded-lg rounded-tr-none px-4 py-2 max-w-md">
                                                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                                                {reply.reply_text}
                                                            </p>
                                                            <p className="text-xs mt-2 opacity-70">
                                                                {new Date(reply.created_at).toLocaleTimeString('pt-BR', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </p>
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            {userProfile?.avatar_url ? (
                                                                <img
                                                                    src={userProfile.avatar_url}
                                                                    alt="Avatar"
                                                                    className="w-10 h-10 rounded-full object-cover border-2 border-red-600"
                                                                />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-semibold text-sm">
                                                                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Reply Input */}
                                    {selectedMessage.status !== 'resolved' && (
                                        <div className="border-t border-gray-200 p-4 bg-white">
                                            <form onSubmit={handleSendReply} className="flex gap-3">
                                                <input
                                                    type="text"
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    placeholder="Digite sua resposta..."
                                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                                                />
                                                <Button
                                                    type="submit"
                                                    disabled={sendingReply || !replyText.trim()}
                                                    className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                                                >
                                                    <Send className="w-4 h-4" />
                                                </Button>
                                            </form>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-500">
                                    <div className="text-center">
                                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">Selecione uma conversa para começar</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserSupport;
