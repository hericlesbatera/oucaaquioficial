import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BadgeCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const Clips = () => {
    const [clips, setClips] = useState([]);
    const [selectedClipIndex, setSelectedClipIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadClips();
    }, []);

    const loadClips = async () => {
        try {
            const { data: clipsData } = await supabase
                .from('artist_videos')
                .select('*')
                .eq('is_public', true)
                .order('created_at', { ascending: false })
                .limit(50);

            if (clipsData && clipsData.length > 0) {
                // Buscar dados dos artistas
                const artistIds = [...new Set(clipsData.map(v => v.artist_id))];
                const { data: artistsData } = await supabase
                    .from('artists')
                    .select('id, name, slug, is_verified')
                    .in('id', artistIds);

                const artistsMap = {};
                if (artistsData) {
                    artistsData.forEach(artist => {
                        artistsMap[artist.id] = artist;
                    });
                }

                const formattedClips = clipsData.map(video => {
                    const artist = artistsMap[video.artist_id] || {};
                    return {
                        id: video.id,
                        title: video.title,
                        videoUrl: video.video_url,
                        thumbnail: video.thumbnail || '/images/default-album.png',
                        artistName: artist.name || 'Artista Desconhecido',
                        artistSlug: artist.slug || video.artist_id,
                        artistVerified: artist.is_verified || false,
                        createdAt: video.created_at,
                        views: video.views_count || 0
                    };
                });
                setClips(formattedClips);
            }
        } catch (error) {
            console.error('Erro ao carregar clips:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const extractYoutubeId = (url) => {
        if (!url) return '';
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : '';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="large" text="Carregando..." />
            </div>
        );
    }

    if (clips.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-black mb-8">CLIPS</h1>
                <p className="text-gray-500 text-center py-16">Nenhum clip disponível no momento.</p>
            </div>
        );
    }

    const currentClip = clips[selectedClipIndex];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-black mb-8">CLIPS</h1>

            {/* Desktop Layout */}
            <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Vídeo Principal */}
                <div className="lg:col-span-2">
                    <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-lg">
                        <div className="relative" style={{ paddingBottom: '56.25%' }}>
                            <iframe
                                className="absolute top-0 left-0 w-full h-full"
                                src={`https://www.youtube.com/embed/${extractYoutubeId(currentClip.videoUrl)}`}
                                title={currentClip.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                    <div className="mt-4">
                        <h2 className="text-2xl font-bold text-black mb-2">{currentClip.title}</h2>
                        <Link
                            to={`/${currentClip.artistSlug}`}
                            className="flex items-center gap-1 text-gray-600 hover:text-red-600 transition-colors"
                        >
                            <span className="font-semibold">{currentClip.artistName}</span>
                            {currentClip.artistVerified && (
                                <BadgeCheck className="w-4 h-4 text-blue-500" />
                            )}
                        </Link>
                    </div>
                </div>

                {/* Lista de Vídeos */}
                <div className="lg:col-span-1">
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {clips.map((clip, index) => (
                            <div
                                key={clip.id}
                                className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                    index === selectedClipIndex
                                        ? 'bg-red-600'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                                onClick={() => setSelectedClipIndex(index)}
                            >
                                <img
                                    src={clip.thumbnail}
                                    alt={clip.title}
                                    className="w-24 h-20 rounded object-cover flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <h4 className={`text-sm font-semibold truncate ${index === selectedClipIndex ? 'text-white' : 'text-black'}`}>
                                        {clip.title}
                                    </h4>
                                    <p className={`text-xs truncate ${index === selectedClipIndex ? 'text-red-100' : 'text-gray-600'}`}>
                                        {clip.artistName}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden">
                {/* Vídeo Principal */}
                <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-lg mb-6">
                    <div className="relative" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                            className="absolute top-0 left-0 w-full h-full"
                            src={`https://www.youtube.com/embed/${extractYoutubeId(currentClip.videoUrl)}`}
                            title={currentClip.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-black mb-2">{currentClip.title}</h2>
                    <Link
                        to={`/${currentClip.artistSlug}`}
                        className="flex items-center gap-1 text-gray-600 hover:text-red-600 transition-colors"
                    >
                        <span className="font-semibold">{currentClip.artistName}</span>
                        {currentClip.artistVerified && (
                            <BadgeCheck className="w-4 h-4 text-blue-500" />
                        )}
                    </Link>
                </div>

                {/* Lista de Vídeos */}
                <div className="space-y-3">
                    {clips.map((clip, index) => (
                        <div
                            key={clip.id}
                            className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                index === selectedClipIndex
                                    ? 'bg-red-600'
                                    : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                            onClick={() => setSelectedClipIndex(index)}
                        >
                            <img
                                src={clip.thumbnail}
                                alt={clip.title}
                                className="w-24 h-20 rounded object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-sm font-semibold truncate ${index === selectedClipIndex ? 'text-white' : 'text-black'}`}>
                                    {clip.title}
                                </h4>
                                <p className={`text-xs truncate ${index === selectedClipIndex ? 'text-red-100' : 'text-gray-600'}`}>
                                    {clip.artistName}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Clips;
