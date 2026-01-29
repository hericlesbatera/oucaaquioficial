import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from '../../hooks/use-toast';
import { Send, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';

const SupportInbox = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [filter, setFilter] = useState('all'); // all, open, in_progress, resolved

  useEffect(() => {
    loadMessages();
    const subscription = supabase
      .channel('support_messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, () => {
        loadMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    if (selectedMessage?.id) {
      loadReplies(selectedMessage.id);
      
      // Real-time subscription (sem polling)
      const subscription = supabase
        .channel(`support_replies_admin_${selectedMessage.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_replies'
          },
          (payload) => {
            if (payload.new.message_id === selectedMessage.id) {
              loadReplies(selectedMessage.id);
            }
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [selectedMessage?.id]);

  const loadMessages = async () => {
    let query = supabase
      .from('support_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;

    if (data) {
      // Buscar informações dos artistas
      const senderIds = [...new Set(data.map(msg => msg.sender_id))];
      
      const artistsMap = {};
      
      // Buscar artistas um por um para evitar problemas de query
      for (const senderId of senderIds) {
        try {
          // Tenta buscar por user_id primeiro (sem .single())
          let { data: artistDataList, error: artistError } = await supabase
            .from('artists')
            .select('id, user_id, name, avatar_url')
            .eq('user_id', senderId)
            .limit(1);

          let artistData = artistDataList && artistDataList.length > 0 ? artistDataList[0] : null;

          // Se não encontrar, tenta buscar por id direto
          if (!artistData && !artistError) {
            const { data: artistDataById, error: artistErrorById } = await supabase
              .from('artists')
              .select('id, user_id, name, avatar_url')
              .eq('id', senderId)
              .limit(1);
            
            if (artistDataById && artistDataById.length > 0) {
              artistData = artistDataById[0];
            }
            artistError = artistErrorById;
          }

          if (artistData) {
            artistsMap[senderId] = artistData;
            console.log(`✅ Artist loaded for ${senderId}:`, artistData.name);
          } else {
            console.log(`ℹ️ No artist found for ${senderId}`);
          }
          if (artistError) {
            console.warn(`⚠️ Error loading artist ${senderId}:`, artistError);
          }
        } catch (err) {
          console.warn(`❌ Exception loading artist ${senderId}:`, err);
        }
      }

      console.log('Artists Map:', artistsMap);

      // Enriquecher dados com informações do artista
      const enrichedData = data.map(msg => {
        const artist = artistsMap[msg.sender_id];
        
        // Prioridade: artist.name > sender_name > email name > email
        let finalName = msg.sender_name || msg.sender_email;
        if (artist?.name) {
          finalName = artist.name;
        }
        
        const finalAvatar = artist?.avatar_url || msg.sender_avatar_url;
        
        console.log(`Message from ${msg.sender_id}:`, { 
          artist_name: artist?.name, 
          sender_name: msg.sender_name, 
          email: msg.sender_email,
          final_name: finalName,
          avatar: finalAvatar 
        });
        
        return {
          ...msg,
          artistName: finalName,
          artistAvatar: finalAvatar
        };
      });
      setMessages(enrichedData);
    } else {
      console.error('Error loading messages:', error);
    }
    setLoading(false);
  };

  const loadReplies = async (messageId) => {
    const { data, error } = await supabase
      .from('support_replies')
      .select('*')
      .eq('message_id', messageId)
      .order('created_at', { ascending: true });

    if (data) {
      const repliesWithInfo = await Promise.all(data.map(async (reply) => {
        let senderAvatar = reply.sender_avatar_url;
        let senderName = reply.sender_name;
        
        // Se for admin, buscar dados completos
        if (reply.sender_type === 'admin') {
          try {
            const { data: adminData } = await supabase
              .from('admin_users')
              .select('avatar_url, email')
              .eq('id', reply.sender_id)
              .maybeSingle();
            
            if (adminData) {
              if (adminData.avatar_url) {
                senderAvatar = adminData.avatar_url;
              }
              if (!senderName && adminData.email) {
                senderName = adminData.email.split('@')[0];
              }
            }
          } catch (e) {
            console.log('Erro ao buscar avatar:', e);
          }
        }
        
        return {
          ...reply,
          senderAvatar,
          senderName: senderName || 'Suporte'
        };
      }));
      setReplies(repliesWithInfo);
    }
  };

  const handleSendReply = async (e) => {
    if (e && e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      await handleSendReplyInternal();
    }
  };

  const handleSendReplyInternal = async () => {
      if (!replyText.trim()) {
        toast({
          title: 'Erro',
          description: 'Digite uma resposta',
          variant: 'destructive'
        });
        return;
      }

      if (!selectedMessage?.id) return;

      setSendingReply(true);

      // Enviar resposta (avatar será carregado no frontend pelo loadReplies)
      const { error: replyError } = await supabase
        .from('support_replies')
        .insert({
          message_id: selectedMessage.id,
          sender_id: user.id,
          sender_type: 'admin',
          sender_name: user.user_metadata?.name || 'Suporte',
          reply_text: replyText
        });

    const { error: updateError } = await supabase
      .from('support_messages')
      .update({
        status: 'in_progress',
        updated_at: new Date()
      })
      .eq('id', selectedMessage.id);

    if (replyError || updateError) {
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar a resposta',
        variant: 'destructive'
      });
    } else {
      setReplyText('');
      await loadMessages();
      await loadReplies(selectedMessage.id);
      toast({
        title: 'Resposta enviada',
        description: 'O artista será notificado'
      });
    }

    setSendingReply(false);
  };

  const updateStatus = async (messageId, newStatus) => {
    const { error } = await supabase
      .from('support_messages')
      .update({
        status: newStatus,
        updated_at: new Date()
      })
      .eq('id', messageId);

    if (error) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      await loadMessages();
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(prev => ({ ...prev, status: newStatus }));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const filteredMessages = messages;
  const openCount = messages.filter(m => m.status === 'open').length;

  return (
    <div className="max-h-[80vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Suporte de Artistas</h2>
          <p className="text-gray-600 text-sm mt-1">
            {openCount} mensagem{openCount !== 1 ? 's' : ''} não respondida{openCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {['all', 'open', 'in_progress', 'resolved'].map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilter(status);
                setSelectedMessage(null);
              }}
              className={filter === status ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {status === 'all' && 'Todos'}
              {status === 'open' && 'Abertos'}
              {status === 'in_progress' && 'Em Progresso'}
              {status === 'resolved' && 'Resolvidos'}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 overflow-hidden">
        {/* Messages List */}
        <div className="md:col-span-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          {filteredMessages.length === 0 ? (
            <div className="p-8 text-center text-gray-500 flex-1 flex items-center justify-center">
              <div>
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma mensagem</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {filteredMessages.map((message) => (
                <button
                   key={message.id}
                   onClick={() => setSelectedMessage(message)}
                   className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition ${
                     selectedMessage?.id === message.id ? 'bg-red-50 border-l-4 border-l-red-600' : ''
                   }`}
                 >
                   <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm truncate flex-1">
                        {message.subject}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded whitespace-nowrap ml-2 ${
                          message.status === 'open'
                            ? 'bg-red-100 text-red-700'
                            : message.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {message.status === 'open' && 'Aberto'}
                        {message.status === 'in_progress' && 'Em andamento'}
                        {message.status === 'resolved' && 'Resolvido'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                       {message.artistAvatar ? (
                         <img
                           src={message.artistAvatar}
                           alt={message.artistName}
                           className="w-8 h-8 rounded-full object-cover"
                         />
                       ) : (
                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-semibold text-sm">
                           {message.artistName?.charAt(0).toUpperCase()}
                         </div>
                       )}
                       <p className="text-xs text-gray-600 truncate font-medium">{message.artistName}</p>
                     </div>
                   <p className="text-xs text-gray-400 mt-1">
                     {new Date(message.created_at).toLocaleDateString('pt-BR')}
                   </p>
                 </button>
              ))}
            </div>
          )}
        </div>

        {/* Message Detail - Clean Style */}
         <div className="md:col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full">
           {selectedMessage ? (
             <div className="flex flex-col h-full">
               {/* Chat Header */}
               <div className="bg-gray-50 border-b border-gray-200 p-4">
                 <div className="flex items-center justify-between">
                   <div>
                     <h3 className="font-semibold text-gray-900">
                       {selectedMessage.subject}
                     </h3>
                     <div className="flex items-center justify-between mt-2">
                       <p className="text-xs text-gray-500">
                         Iniciada {new Date(selectedMessage.created_at).toLocaleDateString('pt-BR')}
                       </p>
                       <span
                         className={`text-xs px-2 py-1 rounded ${
                           selectedMessage.status === 'open'
                             ? 'bg-red-100 text-red-700'
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
                   {selectedMessage.status !== 'resolved' && (
                     <Button
                       size="sm"
                       onClick={() => updateStatus(selectedMessage.id, 'resolved')}
                       className="bg-green-600 hover:bg-green-700 text-xs ml-4 flex-shrink-0"
                     >
                       ✓ Resolver
                     </Button>
                   )}
                 </div>
               </div>

               {/* Chat Messages */}
               <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                 {/* Welcome Message */}
                 <div className="flex justify-center">
                   <div className="bg-white px-4 py-2 rounded-full text-xs text-gray-500 border border-gray-200">
                     Conversa iniciada
                   </div>
                 </div>

                 {/* Original Message Bubble */}
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
                     {selectedMessage.artistAvatar ? (
                       <img
                         src={selectedMessage.artistAvatar}
                         alt="Avatar"
                         className="w-12 h-12 rounded-full object-cover border-2 border-red-600"
                       />
                     ) : (
                       <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-semibold text-lg">
                         {selectedMessage.artistName?.charAt(0).toUpperCase()}
                       </div>
                     )}
                   </div>
                   </div>

                 {/* Replies */}
                 {replies.map((reply) => (
                   <div
                     key={reply.id}
                     className={`flex ${reply.sender_type === 'admin' ? 'justify-start' : 'justify-end'} gap-3`}
                   >
                     {reply.sender_type === 'admin' && (
                       <div className="flex-shrink-0 flex flex-col items-center gap-1">
                         {reply.senderAvatar ? (
                           <img
                             src={reply.senderAvatar}
                             alt="Avatar"
                             className="w-12 h-12 rounded-full object-cover border-2 border-purple-600"
                           />
                         ) : (
                           <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                             {reply.sender_name?.charAt(0).toUpperCase() || 'S'}
                           </div>
                         )}
                         <p className="text-xs text-gray-600 font-medium text-center">{reply.sender_name}</p>
                       </div>
                     )}
                     <div
                       className={`rounded-lg px-4 py-2 max-w-md ${
                         reply.sender_type === 'admin'
                           ? 'bg-white border border-gray-200 rounded-tl-none'
                           : 'bg-red-600 text-white rounded-tr-none'
                       }`}
                     >
                       <p className={`text-sm whitespace-pre-wrap leading-relaxed ${reply.sender_type === 'admin' ? 'text-gray-700' : 'text-white'}`}>
                         {reply.reply_text}
                       </p>
                       <p className={`text-xs mt-2 ${reply.sender_type === 'admin' ? 'text-gray-500' : 'opacity-70'}`}>
                         {new Date(reply.created_at).toLocaleTimeString('pt-BR', {
                           hour: '2-digit',
                           minute: '2-digit'
                         })}
                       </p>
                     </div>
                     {reply.sender_type !== 'admin' && (
                       <div className="flex-shrink-0">
                         {selectedMessage.artistAvatar ? (
                           <img
                             src={selectedMessage.artistAvatar}
                             alt="Avatar"
                             className="w-12 h-12 rounded-full object-cover border-2 border-red-600"
                           />
                         ) : (
                           <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-semibold text-lg">
                             {selectedMessage.artistName?.charAt(0).toUpperCase()}
                           </div>
                         )}
                       </div>
                     )}
                   </div>
                 ))}
               </div>

               {/* Reply Form */}
               {selectedMessage.status !== 'resolved' && (
                 <div className="border-t border-gray-200 bg-white p-3">
                   <div className="flex gap-2">
                     <textarea
                       value={replyText}
                       onChange={(e) => setReplyText(e.target.value)}
                       onKeyDown={handleSendReply}
                       placeholder="Digite sua resposta..."
                       className="flex-1 border border-gray-300 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent min-h-12 max-h-32"
                     />
                     <Button
                       onClick={handleSendReplyInternal}
                       disabled={sendingReply || !replyText.trim()}
                       className="bg-red-600 hover:bg-red-700 h-12 w-12 p-0 flex items-center justify-center flex-shrink-0"
                       title="Enviar (Ctrl+Enter)"
                     >
                       <Send className="w-5 h-5" />
                     </Button>
                   </div>
                 </div>
               )}
             </div>
           ) : (
             <div className="flex-1 flex items-center justify-center text-gray-500">
               <div className="text-center">
                 <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                 <p>Selecione uma mensagem para ler</p>
               </div>
             </div>
           )}
         </div>
      </div>

    </div>
  );
};

export default SupportInbox;
