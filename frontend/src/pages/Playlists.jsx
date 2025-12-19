import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Play, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from '../hooks/use-toast';

const Playlists = () => {
    const { user } = useAuth();
    const [playlists, setPlaylists] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [playlistName, setPlaylistName] = useState('');

    useEffect(() => {
        loadPlaylists();
    }, [user]);

    const loadPlaylists = async () => {
        if (!user?.id) return;
        
        try {
            const { data, error } = await supabase
                .from('playlists')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPlaylists(data || []);
        } catch (error) {
            console.error('Erro ao carregar playlists:', error);
            toast({
                title: 'Erro',
                description: 'Falha ao carregar playlists',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const createPlaylist = async (e) => {
        e.preventDefault();
        if (!playlistName.trim()) return;

        try {
            const { data, error } = await supabase
                .from('playlists')
                .insert([
                    {
                        name: playlistName,
                        user_id: user.id,
                        slug: playlistName.toLowerCase().replace(/\s+/g, '-'),
                    }
                ])
                .select();

            if (error) throw error;

            setPlaylists([data[0], ...playlists]);
            setPlaylistName('');
            setShowCreateModal(false);
            toast({
                title: 'Sucesso',
                description: 'Playlist criada com sucesso',
            });
        } catch (error) {
            console.error('Erro ao criar playlist:', error);
            toast({
                title: 'Erro',
                description: 'Falha ao criar playlist',
                variant: 'destructive',
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="large" text="Carregando..." />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-black">Minhas Playlists</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Nova Playlist
                </button>
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Criar Nova Playlist</h2>
                        <form onSubmit={createPlaylist}>
                            <input
                                type="text"
                                placeholder="Nome da playlist"
                                value={playlistName}
                                onChange={(e) => setPlaylistName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Criar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {playlists.length === 0 ? (
                    <p className="col-span-full text-gray-500 text-center py-8">
                        Você não tem playlists ainda. Crie uma para começar!
                    </p>
                ) : (
                    playlists.map((playlist) => (
                        <Link
                            key={playlist.id}
                            to={`/playlist/${playlist.slug}`}
                            className="group cursor-pointer"
                        >
                            <div className="relative mb-3 overflow-hidden rounded-lg shadow-lg bg-gradient-to-br from-red-600 to-red-800 aspect-square flex items-center justify-center">
                                <Play className="w-8 h-8 text-white opacity-50" fill="white" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                                        <Play className="w-5 h-5 text-white ml-1" fill="white" />
                                    </div>
                                </div>
                            </div>
                            <h3 className="text-black font-semibold text-sm truncate group-hover:text-red-600 transition-colors">
                                {playlist.name}
                            </h3>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
};

export default Playlists;
