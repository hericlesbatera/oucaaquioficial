import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { usePlayer } from '../../context/PlayerContext';
import {
    MessageCircle, Heart, Music, Settings, Mail, LogOut,
    ChevronDown, Plus, Trash2, Eye, EyeOff, Lock, Menu, X, Camera, Send, CheckCircle, ArrowLeft,
    Search, SlidersHorizontal, ListMusic, Play, Edit, Loader2, Disc3, BadgeCheck, Upload
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Card } from '../../components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { toast } from '../../hooks/use-toast';
import Header from '../../components/Layout/Header';
import FavoriteSongCard from '../../components/FavoriteSongCard';
import MobileBottomNav from '../../components/Layout/MobileBottomNav';

const UserPanelNew = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { playSong } = usePlayer();
    const [activeTab, setActiveTab] = useState('playlists');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [userAvatar, setUserAvatar] = useState(null);

    // ====== PLAYLISTS ======
    const [playlists, setPlaylists] = useState([]);
    const [searchPlaylistQuery, setSearchPlaylistQuery] = useState('');
    const [playlistOrderBy, setPlaylistOrderBy] = useState('recent');
    
    // Create playlist modal
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newPlaylist, setNewPlaylist] = useState({
        title: '',
        description: '',
        isPrivate: false,
        coverImage: null
    });
    const [coverPreview, setCoverPreview] = useState(null);
    const [creating, setCreating] = useState(false);
    const coverInputRef = useRef(null);

    // Add songs modal
    const [addSongsModalOpen, setAddSongsModalOpen] = useState(false);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [songSearchQuery, setSongSearchQuery] = useState('');
    const [recentAlbums, setRecentAlbums] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchingAlbums, setSearchingAlbums] = useState(false);
    const [albumSongs, setAlbumSongs] = useState([]);
    const [selectedAlbum, setSelectedAlbum] = useState(null);

    // Edit playlist modal
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingPlaylist, setEditingPlaylist] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', description: '', isPrivate: false });
    const [editCoverFile, setEditCoverFile] = useState(null);
    const [editCoverPreview, setEditCoverPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const editCoverInputRef = useRef(null);
    const [playlistSongs, setPlaylistSongs] = useState([]);

    // Delete confirmation
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [playlistToDelete, setPlaylistToDelete] = useState(null);

    // ====== FAVORITOS ======
    const [favoriteTab, setFavoriteTab] = useState('musicas');
    const [searchFavoriteQuery, setSearchFavoriteQuery] = useState('');
    const [musicSort, setMusicSort] = useState('recent');
    const [albumSort, setAlbumSort] = useState('recent');
    const [favoritos, setFavoritos] = useState({
        musicas: [],
        albums: [],
        playlists: []
    });

    // ====== SETTINGS ======
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // ====== SUPPORT ======
    const [supportMessages, setSupportMessages] = useState([]);
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

    const playlistOrderOptions = [
        { value: 'recent', label: 'MAIS RECENTES' },
        { value: 'played', label: 'MAIS OUVIDAS' },
        { value: 'oldest', label: 'MAIS ANTIGOS' }
    ];

    const favoriteOrderOptions = [
        { id: 'recent', label: 'MAIS RECENTES' },
        { id: 'plays', label: 'MAIS OUVIDAS' },
    ];

    // ====== EFFECTS ======
    useEffect(() => {
        if (user?.user_metadata?.avatar_url) {
            setUserAvatar(user.user_metadata.avatar_url);
        } else {
            setUserAvatar('/images/default-avatar.png');
        }
        
        if (user?.user_metadata?.full_name) {
            setDisplayName(user.user_metadata.full_name);
        }
    }, [user]);

    useEffect(() => {
        if (activeTab === 'playlists') {
            loadUserPlaylists();
            loadRecentAlbums();
        } else if (activeTab === 'favoritos') {
            loadFavorites();
        } else if (activeTab === 'suporte') {
            loadSupportMessages();
        }
    }, [activeTab]);

    // ====== PLAYLISTS FUNCTIONS ======
    const loadUserPlaylists = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('playlists')
                .select('*')
                .eq('user_id', user.id);

            if (playlistOrderBy === 'recent') {
                query = query.order('created_at', { ascending: false });
            } else if (playlistOrderBy === 'oldest') {
                query = query.order('created_at', { ascending: true });
            } else if (playlistOrderBy === 'played') {
                query = query.order('play_count', { ascending: false });
            }

            const { data, error } = await query;

            if (error) throw error;
            setPlaylists(data || []);
        } catch (error) {
            console.error('Erro ao carregar playlists:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar as playlists',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const loadRecentAlbums = async () => {
        try {
            const { data } = await supabase
                .from('albums')
                .select('id, title, artist_name, cover_url')
                .order('created_at', { ascending: false })
                .limit(10);
            setRecentAlbums(data || []);
        } catch (error) {
            console.error('Erro ao carregar álbuns recentes:', error);
        }
    };

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewPlaylist({ ...newPlaylist, coverImage: file });
            const reader = new FileReader();
            reader.onloadend = () => setCoverPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleCreatePlaylist = async () => {
        if (!newPlaylist.title || newPlaylist.title.length < 5) {
            toast({
                title: 'Erro',
                description: 'O título deve ter no mínimo 5 caracteres',
                variant: 'destructive'
            });
            return;
        }

        setCreating(true);

        try {
            let coverUrl = null;

            if (newPlaylist.coverImage) {
                const fileExt = newPlaylist.coverImage.name.split('.').pop();
                const fileName = `playlists/${user.id}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('musica')
                    .upload(fileName, newPlaylist.coverImage, { upsert: true });

                if (!uploadError) {
                    const { data } = supabase.storage
                        .from('musica')
                        .getPublicUrl(fileName);
                    if (data && data.publicUrl) {
                        coverUrl = data.publicUrl;
                    }
                }
            }

            const generateSlug = (text) => {
                return text
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .trim();
            };

            const slug = generateSlug(newPlaylist.title);

            const { data, error } = await supabase
                .from('playlists')
                .insert({
                    user_id: user.id,
                    slug: slug,
                    title: newPlaylist.title,
                    description: newPlaylist.description,
                    cover_url: coverUrl,
                    is_public: !newPlaylist.isPrivate,
                    song_ids: [],
                    play_count: 0
                })
                .select()
                .single();

            if (error) throw error;

            toast({
                title: 'Playlist criada!',
                description: `"${newPlaylist.title}" foi criada com sucesso`
            });

            setPlaylists([data, ...playlists]);
            setCreateModalOpen(false);
            setNewPlaylist({ title: '', description: '', isPrivate: false, coverImage: null });
            setCoverPreview(null);

            setSelectedPlaylist(data);
            setAddSongsModalOpen(true);

        } catch (error) {
            console.error('Erro ao criar playlist:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível criar a playlist',
                variant: 'destructive'
            });
        } finally {
            setCreating(false);
        }
    };

    const searchAlbums = async (query) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearchingAlbums(true);
        try {
            const { data } = await supabase
                .from('albums')
                .select('id, title, artist_name, cover_url')
                .ilike('title', `%${query}%`)
                .limit(10);
            setSearchResults(data || []);
        } catch (error) {
            console.error('Erro na busca:', error);
        } finally {
            setSearchingAlbums(false);
        }
    };

    const loadAlbumSongs = async (album) => {
        setSelectedAlbum(album);
        try {
            const { data } = await supabase
                .from('songs')
                .select('id, title, artist_name, cover_url')
                .eq('album_id', album.id)
                .order('track_number', { ascending: true });
            setAlbumSongs(data || []);
        } catch (error) {
            console.error('Erro ao carregar músicas do álbum:', error);
        }
    };

    const addSongToPlaylist = async (song) => {
        if (!selectedPlaylist) return;

        try {
            const currentSongIds = selectedPlaylist.song_ids || [];
            
            if (currentSongIds.includes(song.id)) {
                toast({
                    title: 'Música já adicionada',
                    description: 'Esta música já está na playlist'
                });
                return;
            }

            const newSongIds = [...currentSongIds, song.id];

            const { error } = await supabase
                .from('playlists')
                .update({ song_ids: newSongIds })
                .eq('id', selectedPlaylist.id);

            if (error) throw error;

            const updatedPlaylist = { ...selectedPlaylist, song_ids: newSongIds };
            setSelectedPlaylist(updatedPlaylist);
            setEditingPlaylist(updatedPlaylist);
            setPlaylists(playlists.map(p => 
                p.id === selectedPlaylist.id ? { ...p, song_ids: newSongIds } : p
            ));
            setPlaylistSongs([...playlistSongs, { id: song.id, title: song.title, artist_name: song.artist_name, cover_url: song.cover_url }]);

            toast({
                title: 'Música adicionada!',
                description: `"${song.title}" foi adicionada à playlist`
            });
        } catch (error) {
            console.error('Erro ao adicionar música:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível adicionar a música',
                variant: 'destructive'
            });
        }
    };

    const openEditModal = async (playlist, e) => {
        if (e) e.stopPropagation();
        setEditingPlaylist(playlist);
        setEditForm({
            title: playlist.title,
            description: playlist.description || '',
            isPrivate: !playlist.is_public
        });
        setEditCoverPreview(playlist.cover_url);
        setEditCoverFile(null);
        setEditModalOpen(true);

        if (playlist.song_ids && playlist.song_ids.length > 0) {
            const { data: songs } = await supabase
                .from('songs')
                .select('id, title, artist_name, cover_url')
                .in('id', playlist.song_ids);

            if (songs) {
                const orderedSongs = playlist.song_ids
                    .map(id => songs.find(s => s.id === id))
                    .filter(Boolean);
                setPlaylistSongs(orderedSongs);
            }
        } else {
            setPlaylistSongs([]);
        }
    };

    const handleEditCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEditCoverFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setEditCoverPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSavePlaylist = async () => {
        if (!editForm.title || editForm.title.length < 5) {
            toast({
                title: 'Erro',
                description: 'O título deve ter no mínimo 5 caracteres',
                variant: 'destructive'
            });
            return;
        }

        setSaving(true);

        try {
            let coverUrl = editingPlaylist.cover_url;

            if (editCoverFile) {
                const fileExt = editCoverFile.name.split('.').pop();
                const fileName = `playlists/${user.id}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('musica')
                    .upload(fileName, editCoverFile, { upsert: true });

                if (!uploadError) {
                    const { data } = supabase.storage
                        .from('musica')
                        .getPublicUrl(fileName);
                    if (data && data.publicUrl) {
                        coverUrl = data.publicUrl;
                    }
                }
            }

            const { error } = await supabase
                .from('playlists')
                .update({
                    title: editForm.title,
                    description: editForm.description,
                    cover_url: coverUrl,
                    is_public: !editForm.isPrivate
                })
                .eq('id', editingPlaylist.id);

            if (error) throw error;

            toast({
                title: 'Playlist atualizada!',
                description: `"${editForm.title}" foi atualizada`
            });

            setPlaylists(playlists.map(p =>
                p.id === editingPlaylist.id
                    ? { ...p, title: editForm.title, description: editForm.description, cover_url: coverUrl, is_public: !editForm.isPrivate }
                    : p
            ));

            setEditModalOpen(false);
        } catch (error) {
            console.error('Erro ao atualizar:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível atualizar a playlist',
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
        }
    };

    const removeSongFromPlaylist = async (songId) => {
        if (!editingPlaylist) return;

        try {
            const newSongIds = (editingPlaylist.song_ids || []).filter(id => id !== songId);

            const { error } = await supabase
                .from('playlists')
                .update({ song_ids: newSongIds })
                .eq('id', editingPlaylist.id);

            if (error) throw error;

            setEditingPlaylist({ ...editingPlaylist, song_ids: newSongIds });
            setPlaylistSongs(playlistSongs.filter(s => s.id !== songId));
            setPlaylists(playlists.map(p =>
                p.id === editingPlaylist.id ? { ...p, song_ids: newSongIds } : p
            ));

            toast({
                title: 'Música removida',
                description: 'A música foi removida da playlist'
            });
        } catch (error) {
            console.error('Erro ao remover música:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível remover a música',
                variant: 'destructive'
            });
        }
    };

    const handleDeletePlaylist = async () => {
        if (!playlistToDelete) return;

        try {
            const { error } = await supabase
                .from('playlists')
                .delete()
                .eq('id', playlistToDelete.id);

            if (error) throw error;

            toast({
                title: 'Playlist excluída',
                description: `"${playlistToDelete.title}" foi excluída`
            });

            setPlaylists(playlists.filter(p => p.id !== playlistToDelete.id));
            setDeleteDialogOpen(false);
            setPlaylistToDelete(null);
        } catch (error) {
            console.error('Erro ao excluir:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível excluir a playlist',
                variant: 'destructive'
            });
        }
    };

    const filteredPlaylistsUser = playlists.filter(p =>
        p.title.toLowerCase().includes(searchPlaylistQuery.toLowerCase())
    );

    // ====== FAVORITES FUNCTIONS ======
    const loadFavorites = async () => {
        try {
            setLoading(true);

            // Músicas favoritas
            let favoriteSongs = null;
            
            const { data: songsSnake } = await supabase
                .from('music_favorites')
                .select(`
                    music_id,
                    created_at,
                    songs:music_id (
                        id,
                        title,
                        artist_name,
                        cover_url,
                        duration,
                        artist_id,
                        album_id,
                        plays,
                        audio_url,
                        artist:artist_id (
                            id,
                            is_verified,
                            slug
                        )
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            
            if (songsSnake && songsSnake.length > 0) {
                favoriteSongs = songsSnake.map(item => ({
                    song_id: item.music_id,
                    created_at: item.created_at,
                    songs: item.songs
                }));
            } else {
                const { data: songsCamel } = await supabase
                    .from('favorites')
                    .select(`
                        songId,
                        createdAt,
                        songs:songId (
                            id,
                            title,
                            artist_name,
                            cover_url,
                            duration,
                            artist_id,
                            album_id,
                            plays,
                            audio_url,
                            artist:artist_id (
                                id,
                                is_verified,
                                slug
                            )
                        )
                    `)
                    .eq('userId', user.id)
                    .order('createdAt', { ascending: false });
                
                if (songsCamel && songsCamel.length > 0) {
                    favoriteSongs = songsCamel.map(item => ({
                        song_id: item.songId,
                        created_at: item.createdAt,
                        songs: item.songs
                    }));
                } else {
                    favoriteSongs = [];
                }
            }

            // Álbuns favoritos
            let favoriteAlbumIds = null;
            
            const { data: albumsSnake } = await supabase
                .from('album_favorites')
                .select('album_id')
                .eq('user_id', user.id);
            
            if (albumsSnake && albumsSnake.length > 0) {
                favoriteAlbumIds = albumsSnake;
            } else {
                const { data: albumsCamel } = await supabase
                    .from('album_favorites')
                    .select('albumId')
                    .eq('userId', user.id);
                favoriteAlbumIds = albumsCamel;
            }

            const albumIds = favoriteAlbumIds?.map(f => f.album_id || f.albumId) || [];
            let favoriteAlbumsData = [];
            
            if (albumIds.length > 0) {
                const { data } = await supabase
                    .from('albums')
                    .select(`
                        *,
                        artist:artist_id (
                            id,
                            slug,
                            is_verified
                        )
                    `)
                    .in('id', albumIds)
                    .order('created_at', { ascending: false });
                favoriteAlbumsData = data || [];
            }

            // Playlists favoritas
            let favoritePlaylists = null;
            
            const { data: playlistIdsSnake } = await supabase
                .from('playlist_favorites')
                .select('playlist_id')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            
            let playlistIds = [];
            
            if (playlistIdsSnake && playlistIdsSnake.length > 0) {
                playlistIds = playlistIdsSnake.map(f => f.playlist_id);
            } else {
                const { data: playlistIdsCamel } = await supabase
                    .from('playlist_favorites')
                    .select('playlistId')
                    .eq('userId', user.id)
                    .order('createdAt', { ascending: false });
                
                if (playlistIdsCamel && playlistIdsCamel.length > 0) {
                    playlistIds = playlistIdsCamel.map(f => f.playlistId);
                }
            }
            
            if (playlistIds.length > 0) {
                const { data } = await supabase
                    .from('playlists')
                    .select(`
                        id, 
                        user_id, 
                        slug, 
                        title, 
                        description, 
                        cover_url, 
                        is_public, 
                        song_ids, 
                        play_count, 
                        created_at, 
                        updated_at
                    `)
                    .in('id', playlistIds)
                    .order('created_at', { ascending: false });
                favoritePlaylists = data || [];
            } else {
                favoritePlaylists = [];
            }

            setFavoritos({
                musicas: favoriteSongs || [],
                albums: favoriteAlbumsData,
                playlists: favoritePlaylists || []
            });
        } catch (error) {
            console.error('Erro ao carregar favoritos:', error);
            toast({
                title: 'Erro',
                description: 'Erro ao carregar favoritos',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFavorite = async (type, id) => {
        try {
            if (type === 'musica') {
                let error = null;
                const { error: errorSnake } = await supabase
                    .from('music_favorites')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('music_id', id);

                if (errorSnake) {
                    const { error: errorCamel } = await supabase
                        .from('favorites')
                        .delete()
                        .eq('userId', user.id)
                        .eq('songId', id);
                    error = errorCamel;
                }

                if (error) throw error;

                setFavoritos(prev => ({
                    ...prev,
                    musicas: prev.musicas.filter(f => (f.song_id || f.songId) !== id)
                }));

                toast({
                    title: 'Sucesso',
                    description: 'Música removida dos favoritos'
                });
            } else if (type === 'album') {
                let error = null;
                const { error: errorSnake } = await supabase
                    .from('album_favorites')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('album_id', id);

                if (errorSnake) {
                    const { error: errorCamel } = await supabase
                        .from('album_favorites')
                        .delete()
                        .eq('userId', user.id)
                        .eq('albumId', id);
                    error = errorCamel;
                }

                if (error) throw error;

                setFavoritos(prev => ({
                    ...prev,
                    albums: prev.albums.filter(a => a.id !== id)
                }));

                toast({
                    title: 'Sucesso',
                    description: 'Álbum removido dos favoritos'
                });
            } else if (type === 'playlist') {
                const { error } = await supabase
                    .from('playlist_favorites')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('playlist_id', id);

                if (error) throw error;

                setFavoritos(prev => ({
                    ...prev,
                    playlists: prev.playlists.filter(p => p.id !== id)
                }));

                toast({
                    title: 'Sucesso',
                    description: 'Playlist removida dos favoritos'
                });
            }
        } catch (error) {
            console.error('Error removing favorite:', error);
            toast({
                title: 'Erro',
                description: error.message || 'Erro ao remover dos favoritos',
                variant: 'destructive'
            });
        }
    };

    const filterBySearch = (items, searchField) => {
        return items.filter(item => {
            const searchLower = searchFavoriteQuery.toLowerCase();
            if (searchField === 'songs') {
                const song = item.songs;
                return (
                    song?.title.toLowerCase().includes(searchLower) ||
                    song?.artist_name.toLowerCase().includes(searchLower)
                );
            } else if (searchField === 'albums') {
                return (
                    item.title?.toLowerCase().includes(searchLower) ||
                    item.artist_name?.toLowerCase().includes(searchLower)
                );
            } else if (searchField === 'playlists') {
                return item.title?.toLowerCase().includes(searchLower);
            }
            return true;
        });
    };

    const sortItems = (items, sortType) => {
        const sorted = [...items];
        switch (sortType) {
            case 'plays':
                if (items[0]?.songs) {
                    return sorted.sort((a, b) => (b.songs?.plays || 0) - (a.songs?.plays || 0));
                }
                return sorted.sort((a, b) => (b.play_count || 0) - (a.play_count || 0));
            case 'recent':
            default:
                return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
    };

    const filteredMusicas = filterBySearch(favoritos.musicas, 'songs');
    const filteredAlbums = filterBySearch(favoritos.albums, 'albums');
    const filteredPlaylists = filterBySearch(favoritos.playlists, 'playlists');

    const sortedMusicas = sortItems(filteredMusicas, musicSort);
    const sortedAlbums = sortItems(filteredAlbums, albumSort);

    // ====== SUPPORT FUNCTIONS ======
    const loadSupportMessages = async () => {
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

            setSupportMessages(data || []);
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
                description: 'Não foi possível enviar a resposta',
                variant: 'destructive'
            });
        } finally {
            setSendingReply(false);
        }
    };

    const handleSendSupportMessage = async (e) => {
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

            toast({
                title: 'Sucesso',
                description: 'Mensagem enviada com sucesso'
            });

            setNewMessageData({ subject: '', message: '' });
            setShowNewMessage(false);
            await loadSupportMessages();
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível enviar a mensagem',
                variant: 'destructive'
            });
        } finally {
            setSendingMessage(false);
        }
    };

    // ====== SETTINGS FUNCTIONS ======
    const handleUpdateEmail = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase.auth.updateUser({ email });

            if (error) throw error;

            toast({
                title: 'Sucesso',
                description: 'Email atualizado. Verifique o novo email para confirmar.'
            });
        } catch (error) {
            console.error('Erro ao atualizar email:', error);
            toast({
                title: 'Erro',
                description: error.message,
                variant: 'destructive'
            });
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();

        if (!password || !newPassword || !confirmPassword) {
            toast({
                title: 'Erro',
                description: 'Preencha todos os campos',
                variant: 'destructive'
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({
                title: 'Erro',
                description: 'As novas senhas não conferem',
                variant: 'destructive'
            });
            return;
        }

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password
            });

            if (authError) {
                toast({
                    title: 'Erro',
                    description: 'Senha atual incorreta',
                    variant: 'destructive'
                });
                return;
            }

            const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

            if (updateError) throw updateError;

            toast({
                title: 'Sucesso',
                description: 'Senha atualizada com sucesso'
            });

            setPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Erro ao atualizar senha:', error);
            toast({
                title: 'Erro',
                description: error.message,
                variant: 'destructive'
            });
        }
    };

    const handleUpdateDisplayName = async (e) => {
        e.preventDefault();

        if (!displayName.trim()) {
            toast({
                title: 'Erro',
                description: 'Nome da conta não pode estar vazio',
                variant: 'destructive'
            });
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: displayName }
            });

            if (error) throw error;

            toast({
                title: 'Sucesso',
                description: 'Nome da conta atualizado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao atualizar nome:', error);
            toast({
                title: 'Erro',
                description: error.message,
                variant: 'destructive'
            });
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast({
                title: 'Erro',
                description: 'Por favor, selecione uma imagem',
                variant: 'destructive'
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: 'Erro',
                description: 'A imagem deve ser menor que 5MB',
                variant: 'destructive'
            });
            return;
        }

        try {
            setUploadingAvatar(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('user-avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('user-avatars')
                .getPublicUrl(filePath);

            const avatarUrl = data.publicUrl;

            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: avatarUrl }
            });

            if (updateError) throw updateError;

            setUserAvatar(avatarUrl);

            toast({
                title: 'Sucesso',
                description: 'Avatar atualizado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao atualizar avatar:', error);
            toast({
                title: 'Erro',
                description: error.message || 'Não foi possível atualizar o avatar',
                variant: 'destructive'
            });
        } finally {
            setUploadingAvatar(false);
        }
    };

    // ====== RENDER ======
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="flex flex-col lg:flex-row">
                {/* Sidebar Menu */}
                <div className={`fixed lg:static inset-0 z-50 lg:z-0 transition-all ${isSidebarOpen ? 'block' : 'hidden lg:block'}`}>
                    <div onClick={() => setIsSidebarOpen(false)} className="lg:hidden absolute inset-0 bg-black/50"></div>
                    <div className="relative w-64 bg-white h-screen border-r border-gray-200 overflow-y-auto">
                        <div className="p-6">
                            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden mb-4">
                                <X className="w-6 h-6" />
                            </button>
                            
                            <div className="flex items-center gap-4 mb-8">
                                <img
                                    src={userAvatar || '/images/default-avatar.png'}
                                    alt="Avatar"
                                    className="w-12 h-12 rounded-full object-cover bg-gray-200"
                                    onError={(e) => e.target.src = '/images/default-avatar.png'}
                                />
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 truncate">{displayName || 'Usuário'}</p>
                                    <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                                </div>
                            </div>

                            <nav className="space-y-2">
                                {[
                                    { id: 'playlists', label: 'Minhas Playlists', icon: ListMusic },
                                    { id: 'favoritos', label: 'Favoritos', icon: Heart },
                                    { id: 'suporte', label: 'Suporte', icon: MessageCircle },
                                    { id: 'configuracoes', label: 'Configurações', icon: Settings },
                                ].map(tab => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                setActiveTab(tab.id);
                                                setIsSidebarOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                                activeTab === tab.id
                                                    ? 'bg-red-50 text-red-600 font-semibold'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            {tab.label}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => {
                                        logout();
                                        navigate('/');
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors mt-8"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Sair
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <main className="flex-1">
                    <div className="p-6 max-w-6xl mx-auto">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden mb-4 p-2"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        {/* MINHAS PLAYLISTS */}
                        {activeTab === 'playlists' && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                        <ListMusic className="w-8 h-8 text-red-600" />
                                        Minhas Playlists
                                    </h2>
                                    <Button
                                        onClick={() => setCreateModalOpen(true)}
                                        className="bg-red-600 hover:bg-red-700 text-white rounded-full"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Nova Playlist
                                    </Button>
                                </div>

                                {/* Toolbar */}
                                <div className="flex items-center justify-between mb-8 gap-4">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            type="text"
                                            placeholder="Buscar Playlists"
                                            value={searchPlaylistQuery}
                                            onChange={(e) => setSearchPlaylistQuery(e.target.value)}
                                            className="pl-10 rounded-full border-gray-300"
                                        />
                                    </div>
                                    
                                    <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700 transition-colors whitespace-nowrap">
                                            <SlidersHorizontal className="w-4 h-4" />
                                            Filtros
                                            <ChevronDown className="w-4 h-4" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-white">
                                            {playlistOrderOptions.map((option) => (
                                                <DropdownMenuItem
                                                    key={option.value}
                                                    onClick={() => {
                                                        setPlaylistOrderBy(option.value);
                                                        loadUserPlaylists();
                                                    }}
                                                    className={`cursor-pointer ${
                                                        playlistOrderBy === option.value
                                                            ? 'bg-red-50 text-red-600 font-medium'
                                                            : ''
                                                    }`}
                                                >
                                                    {option.label}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Playlists List */}
                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                                    </div>
                                ) : filteredPlaylistsUser.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma playlist criada</h3>
                                        <p className="text-gray-600">Clique em "Nova Playlist" para começar</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredPlaylistsUser.map(playlist => (
                                            <Card
                                                key={playlist.id}
                                                className="p-4 hover:shadow-md transition-shadow cursor-pointer group"
                                                onClick={() => openEditModal(playlist)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <img
                                                        src={playlist.cover_url || '/images/default-playlist.jpg'}
                                                        alt={playlist.title}
                                                        className="w-16 h-16 rounded object-cover"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-900 truncate">{playlist.title}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {(playlist.song_ids || []).length} músicas
                                                        </p>
                                                        {!playlist.is_public && (
                                                            <span className="text-xs text-red-500">Privada</span>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={(e) => openEditModal(playlist, e)}
                                                            className="h-8 w-8 border-gray-300 text-gray-600 hover:bg-gray-50"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPlaylistToDelete(playlist);
                                                                setDeleteDialogOpen(true);
                                                            }}
                                                            className="h-8 w-8 border-red-300 text-red-600 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* FAVORITOS */}
                        {activeTab === 'favoritos' && (
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                                    <Heart className="w-8 h-8 text-red-600 fill-red-600" />
                                    Favoritos
                                </h1>
                                <p className="text-gray-600 mb-8">Suas músicas, álbuns e playlists favoritas</p>

                                {/* Tabs */}
                                <div className="flex gap-8 mb-8 border-b border-gray-300">
                                    <button
                                        onClick={() => setFavoriteTab('musicas')}
                                        className={`pb-4 font-semibold text-lg ${
                                            favoriteTab === 'musicas'
                                                ? 'text-gray-900 border-b-4 border-red-600'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        MÚSICAS ({filteredMusicas.length})
                                    </button>
                                    <button
                                        onClick={() => setFavoriteTab('albums')}
                                        className={`pb-4 font-semibold text-lg ${
                                            favoriteTab === 'albums'
                                                ? 'text-gray-900 border-b-4 border-red-600'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        ÁLBUNS ({filteredAlbums.length})
                                    </button>
                                    <button
                                        onClick={() => setFavoriteTab('playlists')}
                                        className={`pb-4 font-semibold text-lg ${
                                            favoriteTab === 'playlists'
                                                ? 'text-gray-900 border-b-4 border-red-600'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        PLAYLISTS ({filteredPlaylists.length})
                                    </button>
                                </div>

                                {/* Toolbar */}
                                <div className="flex items-center justify-between mb-8 gap-4">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            type="text"
                                            placeholder={
                                                favoriteTab === 'musicas' ? 'Buscar Músicas' :
                                                favoriteTab === 'albums' ? 'Buscar Álbuns' :
                                                'Buscar Playlists'
                                            }
                                            value={searchFavoriteQuery}
                                            onChange={(e) => setSearchFavoriteQuery(e.target.value)}
                                            className="pl-10 rounded-full border-gray-300"
                                        />
                                    </div>
                                    
                                    {(favoriteTab === 'musicas' || favoriteTab === 'albums') && (
                                        <DropdownMenu modal={false}>
                                            <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700 transition-colors whitespace-nowrap">
                                                <SlidersHorizontal className="w-4 h-4" />
                                                Filtros
                                                <ChevronDown className="w-4 h-4" />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-white">
                                                {favoriteOrderOptions.map((option) => (
                                                    <DropdownMenuItem
                                                        key={option.id}
                                                        onClick={() => {
                                                            if (favoriteTab === 'musicas') {
                                                                setMusicSort(option.id);
                                                            } else {
                                                                setAlbumSort(option.id);
                                                            }
                                                        }}
                                                        className={`cursor-pointer ${
                                                            (favoriteTab === 'musicas' ? musicSort : albumSort) === option.id
                                                                ? 'bg-red-50 text-red-600 font-medium'
                                                                : ''
                                                        }`}
                                                    >
                                                        {option.label}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>

                                {/* Content */}
                                {loading ? (
                                    <div className="flex justify-center items-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                                    </div>
                                ) : (
                                    <div>
                                        {/* MÚSICAS */}
                                        {favoriteTab === 'musicas' && (
                                            <div>
                                                {sortedMusicas.length === 0 ? (
                                                    <div className="text-center py-12">
                                                        <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                                        <p className="text-gray-600 text-lg">
                                                            {searchFavoriteQuery ? 'Nenhuma música encontrada' : 'Nenhuma música favorita ainda'}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {sortedMusicas.map((item) => (
                                                            <FavoriteSongCard
                                                                key={item.song_id}
                                                                song={item}
                                                                onRemove={() => handleRemoveFavorite('musica', item.song_id)}
                                                                onPlay={() => {
                                                                    const formattedSong = {
                                                                        id: item.songs?.id,
                                                                        title: item.songs?.title,
                                                                        artist_name: item.songs?.artist_name,
                                                                        artistName: item.songs?.artist_name,
                                                                        cover_url: item.songs?.cover_url,
                                                                        coverImage: item.songs?.cover_url,
                                                                        duration: item.songs?.duration,
                                                                        audioUrl: item.songs?.audio_url,
                                                                        albumId: item.songs?.album_id
                                                                    };
                                                                    
                                                                    playSong(formattedSong, [formattedSong]);
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* ÁLBUNS */}
                                        {favoriteTab === 'albums' && (
                                            <div>
                                                {sortedAlbums.length === 0 ? (
                                                    <div className="text-center py-12">
                                                        <Disc3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                                        <p className="text-gray-600 text-lg">
                                                            {searchFavoriteQuery ? 'Nenhum álbum encontrado' : 'Nenhum álbum favorito ainda'}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                                        {sortedAlbums.map((album) => (
                                                            <div
                                                                key={album.id}
                                                                className="group cursor-pointer"
                                                                onClick={() => {
                                                                    const artistSlug = album.artist?.slug || album.artist_id;
                                                                    const albumSlug = album.slug || album.id;
                                                                    navigate(`/${artistSlug}/${albumSlug}`);
                                                                }}
                                                            >
                                                                <div className="relative mb-3 overflow-hidden rounded-lg bg-gray-200">
                                                                    {album.cover_url && (
                                                                        <img
                                                                            src={album.cover_url}
                                                                            alt={album.title}
                                                                            className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                                                                        />
                                                                    )}
                                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                                                                        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                                                                            <Play className="w-5 h-5 text-white ml-1" fill="white" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <h3 className="font-semibold text-gray-900 truncate text-xs">
                                                                        {album.title}
                                                                    </h3>
                                                                    <div className="flex items-center gap-1">
                                                                        <p className="text-xs text-gray-600 truncate">
                                                                            {album.artist_name}
                                                                        </p>
                                                                        {album.artist?.is_verified && (
                                                                            <BadgeCheck className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleRemoveFavorite('album', album.id);
                                                                    }}
                                                                    className="mt-2 w-full text-xs text-red-600 hover:bg-red-50 py-2 rounded transition-colors flex items-center justify-center gap-1 font-medium"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                    Remover
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* PLAYLISTS */}
                                        {favoriteTab === 'playlists' && (
                                            <div>
                                                {filteredPlaylists.length === 0 ? (
                                                    <div className="text-center py-12">
                                                        <ListMusic className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                                        <p className="text-gray-600 text-lg">
                                                            {searchFavoriteQuery ? 'Nenhuma playlist encontrada' : 'Nenhuma playlist favorita ainda'}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                                        {filteredPlaylists.map((playlist) => (
                                                            <div
                                                                key={playlist.id}
                                                                className="group cursor-pointer"
                                                            >
                                                                <div
                                                                    className="relative mb-3 rounded-lg overflow-hidden bg-gradient-to-br from-red-600 to-red-800 cursor-pointer"
                                                                    onClick={() => {
                                                                        navigate(`/playlist/${playlist.slug || playlist.id}`);
                                                                    }}
                                                                >
                                                                    <div className="aspect-square flex items-center justify-center">
                                                                        <ListMusic className="w-16 h-16 text-white opacity-20" />
                                                                    </div>
                                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                                                                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                                                                            <Play className="w-5 h-5 text-red-600 ml-1" fill="#dc2626" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <h3 className="font-semibold text-gray-900 truncate text-xs">
                                                                        {playlist.title}
                                                                    </h3>
                                                                    <p className="text-xs text-gray-600">
                                                                        {playlist.song_ids?.length || 0} músicas
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleRemoveFavorite('playlist', playlist.id);
                                                                    }}
                                                                    className="mt-2 w-full text-xs text-red-600 hover:bg-red-50 py-2 rounded transition-colors flex items-center justify-center gap-1 font-medium"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                    Remover
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SUPORTE */}
                        {activeTab === 'suporte' && (
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-6">Suporte</h2>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                                    {/* Messages List */}
                                    <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden flex flex-col">
                                        <div className="p-4 border-b border-gray-200">
                                            <Button
                                                onClick={() => setShowNewMessage(!showNewMessage)}
                                                className="w-full bg-red-600 hover:bg-red-700 text-white"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Nova Mensagem
                                            </Button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto">
                                            {showNewMessage ? (
                                                <div className="p-4 border-b border-gray-200">
                                                    <form onSubmit={handleSendSupportMessage} className="space-y-4">
                                                        <input
                                                            type="text"
                                                            value={newMessageData.subject}
                                                            onChange={(e) => setNewMessageData({ ...newMessageData, subject: e.target.value })}
                                                            placeholder="Assunto"
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600 text-sm"
                                                        />
                                                        <textarea
                                                            value={newMessageData.message}
                                                            onChange={(e) => setNewMessageData({ ...newMessageData, message: e.target.value })}
                                                            placeholder="Mensagem"
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600 text-sm resize-none"
                                                            rows="4"
                                                        />
                                                        <div className="flex gap-2">
                                                            <Button
                                                                type="submit"
                                                                disabled={sendingMessage}
                                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm"
                                                            >
                                                                Enviar
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => setShowNewMessage(false)}
                                                                className="flex-1 text-sm"
                                                            >
                                                                Cancelar
                                                            </Button>
                                                        </div>
                                                    </form>
                                                </div>
                                            ) : null}
                                            {supportMessages.map((msg) => (
                                                <div
                                                    key={msg.id}
                                                    onClick={() => {
                                                        setSelectedMessage(msg);
                                                        loadReplies(msg.id);
                                                    }}
                                                    className={`p-4 border-b border-gray-200 cursor-pointer transition-colors ${
                                                        selectedMessage?.id === msg.id ? 'bg-red-50' : 'hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <p className="font-semibold text-sm text-gray-900 truncate">{msg.subject}</p>
                                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{msg.message}</p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className={`text-xs px-2 py-1 rounded ${
                                                            msg.status === 'open' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                                        }`}>
                                                            {msg.status === 'open' ? 'Aberto' : 'Resolvido'}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(msg.created_at).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Chat */}
                                    <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden flex flex-col">
                                        {selectedMessage ? (
                                            <>
                                                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{selectedMessage.subject}</p>
                                                        <p className="text-sm text-gray-600">
                                                            {new Date(selectedMessage.created_at).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                    <span className={`text-xs px-3 py-1 rounded ${
                                                        selectedMessage.status === 'open' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                        {selectedMessage.status === 'open' ? 'Aberto' : 'Resolvido'}
                                                    </span>
                                                </div>

                                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                                    <div className="flex justify-end gap-3">
                                                        <div className="bg-red-600 text-white rounded-lg rounded-tr-none px-3 py-2 max-w-xs">
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
                                                    </div>

                                                    {replies.length === 0 && selectedMessage.status === 'open' && (
                                                        <div className="flex justify-start gap-3">
                                                            <div className="bg-gray-200 text-gray-900 rounded-lg rounded-tl-none px-3 py-2 max-w-xs">
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

                                                    {replies.map((reply) => (
                                                        <div key={reply.id} className={`flex ${reply.is_admin_reply ? 'justify-start' : 'justify-end'} gap-3`}>
                                                            {reply.is_admin_reply ? (
                                                                <div className="bg-gray-200 text-gray-900 rounded-lg rounded-tl-none px-3 py-2 max-w-xs">
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
                                                            ) : (
                                                                <div className="bg-red-600 text-white rounded-lg rounded-tr-none px-3 py-2 max-w-xs">
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
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>

                                                {selectedMessage.status !== 'resolved' && (
                                                    <div className="border-t border-gray-200 p-4 bg-white">
                                                        <form onSubmit={handleSendReply} className="flex gap-3">
                                                            <input
                                                                type="text"
                                                                value={replyText}
                                                                onChange={(e) => setReplyText(e.target.value)}
                                                                placeholder="Digite sua resposta..."
                                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600 text-sm"
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
                                                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                    <p className="text-sm">Selecione uma conversa</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CONFIGURAÇÕES */}
                        {activeTab === 'configuracoes' && (
                            <div className="flex justify-center">
                                <div className="w-full max-w-2xl">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Configurações</h2>

                                    <div className="space-y-6">
                                        {/* Avatar Upload */}
                                        <div className="bg-white rounded-lg shadow p-6 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="relative group">
                                                    <img
                                                        src={userAvatar || '/images/default-avatar.png'}
                                                        alt="Avatar"
                                                        className="w-24 h-24 rounded-full object-cover bg-gray-200"
                                                        onError={(e) => e.target.src = '/images/default-avatar.png'}
                                                    />
                                                    <label
                                                        htmlFor="avatar-input"
                                                        className="absolute bottom-0 right-0 bg-red-600 p-2 rounded-full cursor-pointer hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100 transform"
                                                    >
                                                        <Camera className="w-4 h-4 text-white" />
                                                    </label>
                                                </div>
                                                <input
                                                    id="avatar-input"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleAvatarUpload}
                                                    disabled={uploadingAvatar}
                                                    className="hidden"
                                                />
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Foto de Perfil</h3>
                                                    <p className="text-sm text-gray-600 mb-3">Clique no ícone da câmera para alterar sua foto</p>
                                                    <label
                                                        htmlFor="avatar-input"
                                                        className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {uploadingAvatar ? 'Enviando...' : 'Selecionar Foto'}
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Display Name */}
                                        <div className="bg-white rounded-lg shadow p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <Settings className="w-5 h-5 text-red-600" />
                                                Nome da Conta
                                            </h3>
                                            <form onSubmit={handleUpdateDisplayName} className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Nome
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={displayName}
                                                        onChange={(e) => setDisplayName(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                                                        placeholder="Digite seu nome"
                                                    />
                                                </div>
                                                <Button
                                                    type="submit"
                                                    className="bg-red-600 hover:bg-red-700 text-white"
                                                >
                                                    Salvar Nome
                                                </Button>
                                            </form>
                                        </div>

                                        {/* Email */}
                                        <div className="bg-white rounded-lg shadow p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <Mail className="w-5 h-5 text-red-600" />
                                                Email
                                            </h3>
                                            <form onSubmit={handleUpdateEmail} className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Email Atual
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                                                    />
                                                </div>
                                                <Button
                                                    type="submit"
                                                    className="bg-red-600 hover:bg-red-700 text-white"
                                                >
                                                    Atualizar Email
                                                </Button>
                                                <p className="text-xs text-gray-500">
                                                    Um link de confirmação será enviado para o novo email.
                                                </p>
                                            </form>
                                        </div>

                                        {/* Password */}
                                        <div className="bg-white rounded-lg shadow p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <Lock className="w-5 h-5 text-red-600" />
                                                Alterar Senha
                                            </h3>
                                            <form onSubmit={handleUpdatePassword} className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Senha Atual
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPasswords.current ? 'text' : 'password'}
                                                            value={password}
                                                            onChange={(e) => setPassword(e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
                                                            className="absolute right-3 top-2.5 text-gray-500"
                                                        >
                                                            {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Nova Senha
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPasswords.new ? 'text' : 'password'}
                                                            value={newPassword}
                                                            onChange={(e) => setNewPassword(e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
                                                            className="absolute right-3 top-2.5 text-gray-500"
                                                        >
                                                            {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Confirmar Nova Senha
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPasswords.confirm ? 'text' : 'password'}
                                                            value={confirmPassword}
                                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
                                                            className="absolute right-3 top-2.5 text-gray-500"
                                                        >
                                                            {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <Button
                                                    type="submit"
                                                    className="bg-red-600 hover:bg-red-700 text-white"
                                                >
                                                    Atualizar Senha
                                                </Button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation Menu */}
            <MobileBottomNav />

            {/* Add padding to main content for mobile menu */}
            <div className="h-20 md:hidden" />

            {/* MODALS */}

            {/* Create Playlist Modal */}
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Criar Nova Playlist</DialogTitle>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="flex gap-4 mb-4">
                            <div
                                onClick={() => coverInputRef.current?.click()}
                                className="w-32 h-32 bg-red-500 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-red-600 transition-colors flex-shrink-0"
                            >
                                {coverPreview ? (
                                    <img src={coverPreview} alt="Capa" className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <>
                                        <Music className="w-10 h-10 text-white mb-2" />
                                        <span className="text-white text-xs text-center px-2">Adicionar capa</span>
                                    </>
                                )}
                                <input
                                    ref={coverInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleCoverChange}
                                    className="hidden"
                                />
                            </div>

                            <div className="flex-1 space-y-3">
                                <Input
                                    placeholder="Título da playlist"
                                    value={newPlaylist.title}
                                    onChange={(e) => setNewPlaylist({ ...newPlaylist, title: e.target.value })}
                                    maxLength={100}
                                />
                                <Textarea
                                    placeholder="Descrição"
                                    value={newPlaylist.description}
                                    onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                                    rows={3}
                                    className="bg-gray-100 border-0"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-700 mb-1">Tamanho máximo da imagem 500x500 px.</p>
                            <p className="text-xs text-gray-500">
                                Carregue apenas imagens próprias ou sobre as quais você legalmente detém os direitos.
                            </p>
                        </div>

                        <div className="flex items-center justify-between mb-6">
                            <span className="text-gray-700">Tornar a playlist privada?</span>
                            <button
                                onClick={() => setNewPlaylist({ ...newPlaylist, isPrivate: !newPlaylist.isPrivate })}
                                className={`w-12 h-6 rounded-full transition-colors ${
                                    newPlaylist.isPrivate ? 'bg-red-600' : 'bg-gray-300'
                                }`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                    newPlaylist.isPrivate ? 'translate-x-6' : 'translate-x-0.5'
                                }`} />
                            </button>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleCreatePlaylist}
                                disabled={creating}
                                className="bg-red-600 hover:bg-red-700 text-white px-8"
                            >
                                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                CRIAR PLAYLIST
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Songs Modal */}
            <Dialog open={addSongsModalOpen} onOpenChange={setAddSongsModalOpen}>
                <DialogContent className="max-w-md bg-zinc-900 text-white border-zinc-800">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <button onClick={() => {
                                if (selectedAlbum) {
                                    setSelectedAlbum(null);
                                    setAlbumSongs([]);
                                } else {
                                    setAddSongsModalOpen(false);
                                }
                            }}>
                                ←
                            </button>
                            {selectedAlbum ? selectedAlbum.title : 'Adicionar a esta playlist'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            placeholder="Buscar"
                            value={songSearchQuery}
                            onChange={(e) => {
                                setSongSearchQuery(e.target.value);
                                searchAlbums(e.target.value);
                            }}
                            className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder-gray-400"
                        />
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {selectedAlbum ? (
                            <div className="space-y-2">
                                {albumSongs.map(song => (
                                    <div
                                        key={song.id}
                                        className="flex items-center gap-3 p-2 hover:bg-zinc-800 rounded"
                                    >
                                        <img
                                            src={song.cover_url || '/placeholder-album.jpg'}
                                            alt={song.title}
                                            className="w-10 h-10 rounded"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{song.title}</p>
                                            <p className="text-xs text-gray-400 truncate">{song.artist_name}</p>
                                        </div>
                                        <button
                                            onClick={() => addSongToPlaylist(song)}
                                            className="w-8 h-8 rounded-full border border-gray-500 flex items-center justify-center hover:bg-zinc-700"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : songSearchQuery && searchResults.length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-xs text-gray-400 uppercase mb-2">Álbuns encontrados</p>
                                {searchResults.map(album => (
                                    <div
                                        key={album.id}
                                        onClick={() => loadAlbumSongs(album)}
                                        className="flex items-center gap-3 p-2 hover:bg-zinc-800 rounded cursor-pointer"
                                    >
                                        <img
                                            src={album.cover_url || '/placeholder-album.jpg'}
                                            alt={album.title}
                                            className="w-10 h-10 rounded"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{album.title}</p>
                                            <p className="text-xs text-gray-400 truncate">{album.artist_name}</p>
                                        </div>
                                        <ChevronDown className="w-4 h-4 -rotate-90" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-xs text-gray-400 uppercase mb-2">Álbuns recentes</p>
                                {recentAlbums.map(album => (
                                    <div
                                        key={album.id}
                                        onClick={() => loadAlbumSongs(album)}
                                        className="flex items-center gap-3 p-2 hover:bg-zinc-800 rounded cursor-pointer"
                                    >
                                        <img
                                            src={album.cover_url || '/placeholder-album.jpg'}
                                            alt={album.title}
                                            className="w-10 h-10 rounded"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{album.title}</p>
                                            <p className="text-xs text-gray-400 truncate">{album.artist_name}</p>
                                        </div>
                                        <ChevronDown className="w-4 h-4 -rotate-90 text-gray-400" />
                                    </div>
                                ))}

                                {recentAlbums.length === 0 && (
                                    <div className="text-center py-8">
                                        <Music className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-400 font-semibold mb-1">Adicione músicas a esta playlist</p>
                                        <p className="text-xs text-gray-500">
                                            Clique na opção 'Criar/Adicionar' e adicione a música ou um CD as playlists.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Playlist Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Editar Playlist</DialogTitle>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="flex gap-4 mb-4">
                            <div
                                onClick={() => editCoverInputRef.current?.click()}
                                className="w-32 h-32 bg-red-500 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-red-600 transition-colors flex-shrink-0 overflow-hidden"
                            >
                                {editCoverPreview ? (
                                    <img src={editCoverPreview} alt="Capa" className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <Music className="w-10 h-10 text-white mb-2" />
                                        <span className="text-white text-xs text-center px-2">Alterar capa</span>
                                    </>
                                )}
                                <input
                                    ref={editCoverInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleEditCoverChange}
                                    className="hidden"
                                />
                            </div>

                            <div className="flex-1 space-y-3">
                                <Input
                                    placeholder="Título da playlist"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    maxLength={100}
                                />
                                <Textarea
                                    placeholder="Descrição"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    rows={3}
                                    className="bg-gray-100 border-0"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-700">Tornar a playlist privada?</span>
                            <button
                                onClick={() => setEditForm({ ...editForm, isPrivate: !editForm.isPrivate })}
                                className={`w-12 h-6 rounded-full transition-colors ${
                                    editForm.isPrivate ? 'bg-red-600' : 'bg-gray-300'
                                }`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                    editForm.isPrivate ? 'translate-x-6' : 'translate-x-0.5'
                                }`} />
                            </button>
                        </div>

                        <Button
                            onClick={() => {
                                setSelectedPlaylist(editingPlaylist);
                                setAddSongsModalOpen(true);
                            }}
                            variant="outline"
                            className="w-full mb-4 border-dashed border-2"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar músicas à playlist
                        </Button>

                        {playlistSongs.length > 0 && (
                            <div className="border rounded-lg max-h-48 overflow-y-auto mb-4">
                                {playlistSongs.map((song, index) => (
                                    <div
                                        key={song.id}
                                        className="flex items-center gap-3 p-3 border-b last:border-0 hover:bg-gray-50"
                                    >
                                        <span className="text-gray-500 text-sm w-6">{index + 1}.</span>
                                        <img
                                            src={song.cover_url || '/placeholder-album.jpg'}
                                            alt={song.title}
                                            className="w-10 h-10 rounded object-cover"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{song.title}</p>
                                            <p className="text-xs text-gray-500 truncate">{song.artist_name}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeSongFromPlaylist(song.id)}
                                            className="h-8 w-8 text-gray-400 hover:text-red-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSavePlaylist}
                                disabled={saving}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Salvar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Excluir Playlist</DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-600 py-4">
                        Tem certeza que deseja excluir a playlist "<span className="font-semibold">{playlistToDelete?.title}</span>"? Esta ação não pode ser desfeita.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleDeletePlaylist}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Excluir
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UserPanelNew;
