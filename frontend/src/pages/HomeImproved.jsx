import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { Play, Disc, Disc3, TrendingUp, ChevronLeft, ChevronRight, User, Users, BadgeCheck, Plus, Music, ThumbsUp, Video } from 'lucide-react';
import IconVerified from '../assets/icons/icon-verified.svg';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from '../hooks/use-toast';
import HeroSlider from '../components/HeroSlider';
import IconArtistasDestaque from '../assets/icons/icon-artistas-destaque.svg';
import IconLancamentos from '../assets/icons/icon-lancamentos.svg';
import IconGeneros from '../assets/icons/icon-generos.svg';
import IconTopCds from '../assets/icons/icon-topcds.svg';
import HomePopup from '../components/HomePopup';
import LoadingSpinner from '../components/LoadingSpinner';

const HomeImproved = () => {
    const { playSong } = usePlayer();
    const { user } = useAuth();
    const lancamentosRef = useRef(null);
    const lancamentosDesktopRef = useRef(null);
    const topCdsRef = useRef(null);
    const topCdsDesktopRef = useRef(null);
    const generosRef = useRef(null);
    const clipsRef = useRef(null);
    const artistasRef = useRef(null);
    const artistasMobileRef = useRef(null);
    const recomendaRef = useRef(null);
    const recomendaMobileRef = useRef(null);
    const [topCdsFilter, setTopCdsFilter] = useState('mes');
    const [allAlbums, setAllAlbums] = useState([]);
    const [allArtists, setAllArtists] = useState([]);
    const [topCdsAlbums, setTopCdsAlbums] = useState([]);
    const [followingArtists, setFollowingArtists] = useState(new Set());
    const [recommendedAlbums, setRecommendedAlbums] = useState([]);
    const [clips, setClips] = useState([]);
    const [selectedClipIndex, setSelectedClipIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    // Paginação dos carrosséis
    const PAGE_SIZE = 40;
    const [lancamentosPage, setLancamentosPage] = useState(0);
    const [lancamentosHasMore, setLancamentosHasMore] = useState(true);
    const [lancamentosLoading, setLancamentosLoading] = useState(false);
    const [topCdsPage, setTopCdsPage] = useState(0);
    const [topCdsHasMore, setTopCdsHasMore] = useState(true);
    const [topCdsLoading, setTopCdsLoading] = useState(false);
    const [artistasPage, setArtistasPage] = useState(0);
    const [artistasHasMore, setArtistasHasMore] = useState(true);
    const [artistasLoading, setArtistasLoading] = useState(false);
    const [recomendadosPage, setRecomendadosPage] = useState(0);
    const [recomendadosHasMore, setRecomendadosHasMore] = useState(true);
    const [recomendadosLoading, setRecomendadosLoading] = useState(false);

    // Refs dos sentinelas (elementos invisíveis no final de cada carrossel)
    const lancamentosSentinelRef = useRef(null);
    const topCdsSentinelRef = useRef(null);
    const artistasSentinelRef = useRef(null);
    const recomendadosSentinelRef = useRef(null);

    // Refs para rastrear estado atual sem problemas de closure nos event listeners
    const lancamentosPageRef = useRef(0);
    const lancamentosHasMoreRef = useRef(true);
    const lancamentosLoadingRef = useRef(false);
    const artistasPageRef = useRef(0);
    const artistasHasMoreRef = useRef(true);
    const artistasLoadingRef = useRef(false);
    const recomendadosPageRef = useRef(0);
    const recomendadosHasMoreRef = useRef(true);
    const recomendadosLoadingRef = useRef(false);
    const topCdsHasMoreRef = useRef(true);
    const topCdsLoadingRef = useRef(false);

    const genres = [
        { name: 'Forró', slug: 'forro', imageUrl: '/images/slides/GENEROS/forró.jpg' },
        { name: 'Arrocha', slug: 'arrocha', imageUrl: '/images/slides/GENEROS/ARROCHA.jpg' },
        { name: 'Piseiro', slug: 'piseiro', imageUrl: '/images/slides/GENEROS/PISEIRO.jpg' },
        { name: 'Arrochadeira', slug: 'arrochadeira', imageUrl: '/images/slides/GENEROS/ARROCHADEIRA.jpg' },
        { name: 'Pagode', slug: 'pagode', imageUrl: '/images/slides/GENEROS/PAGODE.jpg' },
        { name: 'Sertanejo', slug: 'sertanejo', imageUrl: '/images/slides/GENEROS/SERTANEJO.jpg' },
        { name: 'Brega Funk', slug: 'brega-funk', imageUrl: '/images/slides/GENEROS/BREGAFUNK.jpg' },
        { name: 'Variados', slug: 'variados', imageUrl: '/images/slides/GENEROS/POP.jpg' },
        { name: 'Samba', slug: 'samba', imageUrl: '/images/slides/GENEROS/SAMBA.jpg' },
        { name: 'Funk', slug: 'funk', imageUrl: '/images/slides/GENEROS/FUNK.jpg' },
        { name: 'Axé', slug: 'axe', imageUrl: '/images/slides/GENEROS/AXÉ.jpg' },
        { name: 'Reggae', slug: 'reggae', imageUrl: '/images/slides/GENEROS/REGGAE.jpg' },
        { name: 'Brega', slug: 'brega', imageUrl: '/images/slides/GENEROS/BREGA.jpg' },
        { name: 'Gospel', slug: 'gospel', imageUrl: '/images/slides/GENEROS/GOSPEL.jpg' },
        { name: 'Rap/Hip-Hop', slug: 'rap-hip-hop', imageUrl: '/images/slides/GENEROS/HIP-HOP.jpg' },
        { name: 'Pop', slug: 'pop', imageUrl: '/images/slides/GENEROS/POP.jpg' },
        { name: 'MPB', slug: 'mpb', imageUrl: '/images/slides/GENEROS/MPB.jpg' },
        { name: 'Rock', slug: 'rock', imageUrl: '/images/slides/GENEROS/ROCK.jpg' },
        { name: 'Eletrônica', slug: 'eletronica', imageUrl: '/images/slides/GENEROS/ELETRÔNICA.jpg' },
        { name: 'Trap', slug: 'trap', imageUrl: '/images/slides/GENEROS/TRAP.jpg' },
        { name: 'Frevo', slug: 'frevo', imageUrl: '/images/slides/GENEROS/FREVO.jpg' },
    ];

    const formatNumber = (num) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const extractYoutubeId = (url) => {
        if (!url) return '';
        // Extrair ID de diferentes formatos de URL do YouTube
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : '';
    };

    // Função auxiliar para formatar álbuns
    const formatAlbums = (supabaseAlbums, artistsMap, collaboratorsByAlbum) => {
        return supabaseAlbums.map(album => {
            const artist = artistsMap[album.artist_id] || {};
            return {
                id: album.id,
                slug: album.slug,
                title: album.title,
                artistName: artist.name || album.artist_name || 'Artista',
                artistId: album.artist_id,
                artistSlug: artist.slug || album.artist_id,
                artistVerified: artist.is_verified || false,
                collaborators: collaboratorsByAlbum ? (collaboratorsByAlbum[album.id] || []) : [],
                coverImage: album.cover_url || '/images/default-album.png',
                releaseYear: album.release_year,
                releaseDate: album.release_date,
                playCount: album.play_count || 0,
                downloadCount: album.download_count || 0
            };
        });
    };

    // Sincronizar refs com estados
    useEffect(() => { lancamentosPageRef.current = lancamentosPage; }, [lancamentosPage]);
    useEffect(() => { lancamentosHasMoreRef.current = lancamentosHasMore; }, [lancamentosHasMore]);
    useEffect(() => { lancamentosLoadingRef.current = lancamentosLoading; }, [lancamentosLoading]);
    useEffect(() => { artistasPageRef.current = artistasPage; }, [artistasPage]);
    useEffect(() => { artistasHasMoreRef.current = artistasHasMore; }, [artistasHasMore]);
    useEffect(() => { artistasLoadingRef.current = artistasLoading; }, [artistasLoading]);
    useEffect(() => { recomendadosPageRef.current = recomendadosPage; }, [recomendadosPage]);
    useEffect(() => { recomendadosHasMoreRef.current = recomendadosHasMore; }, [recomendadosHasMore]);
    useEffect(() => { recomendadosLoadingRef.current = recomendadosLoading; }, [recomendadosLoading]);
    useEffect(() => { topCdsHasMoreRef.current = topCdsHasMore; }, [topCdsHasMore]);
    useEffect(() => { topCdsLoadingRef.current = topCdsLoading; }, [topCdsLoading]);

    // Carregamento incremental de Laçamentos
    const loadMoreLancamentos = async (page) => {
        if (lancamentosLoadingRef.current) return;
        setLancamentosLoading(true);
        lancamentosLoadingRef.current = true;
        try {
            const from = page * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            const { data, error } = await supabase
                .from('albums')
                .select('*')
                .or('is_private.is.null,is_private.eq.false')
                .is('deleted_at', null)
                .order('release_date', { ascending: false, nullsFirst: false })
                .range(from, to);
            if (error) throw error;
            if (!data || data.length < PAGE_SIZE) setLancamentosHasMore(false);
            if (data && data.length > 0) {
                const artistsMap = {};
                const formatted = formatAlbums(data, artistsMap, null);
                setAllAlbums(prev => {
                    const existingIds = new Set(prev.map(a => a.id));
                    const newItems = formatted.filter(a => !existingIds.has(a.id));
                    return [...prev, ...newItems];
                });
            }
        } catch (e) { console.error('loadMoreLancamentos:', e); }
        finally { setLancamentosLoading(false); lancamentosLoadingRef.current = false; }
    };

    // Carregamento incremental de Artistas
    const loadMoreArtistas = async (page) => {
        if (artistasLoadingRef.current) return;
        setArtistasLoading(true);
        artistasLoadingRef.current = true;
        try {
            const from = page * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            const { data, error } = await supabase
                .from('artists')
                .select('*')
                .order('followers_count', { ascending: false })
                .range(from, to);
            if (error) throw error;
            if (!data || data.length < PAGE_SIZE) setArtistasHasMore(false);
            if (data && data.length > 0) {
                const formatted = data.map(a => ({
                    id: a.id, slug: a.slug, name: a.name,
                    avatar: a.avatar_url || '/images/default-avatar.png',
                    coverImage: a.cover_url || '', verified: a.is_verified, bio: a.bio
                }));
                setAllArtists(prev => {
                    const existingIds = new Set(prev.map(a => a.id));
                    const newItems = formatted.filter(a => !existingIds.has(a.id));
                    return [...prev, ...newItems];
                });
            }
        } catch (e) { console.error('loadMoreArtistas:', e); }
        finally { setArtistasLoading(false); artistasLoadingRef.current = false; }
    };

    // Carregamento incremental de Recomendados (usa allAlbums embaralhados)
    const loadMoreRecomendados = async (page) => {
        if (recomendadosLoadingRef.current) return;
        setRecomendadosLoading(true);
        recomendadosLoadingRef.current = true;
        try {
            const from = page * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            const { data, error } = await supabase
                .from('albums')
                .select('*')
                .or('is_private.is.null,is_private.eq.false')
                .is('deleted_at', null)
                .order('play_count', { ascending: false })
                .range(from, to);
            if (error) throw error;
            if (!data || data.length < PAGE_SIZE) setRecomendadosHasMore(false);
            if (data && data.length > 0) {
                const artistsMap = {};
                const formatted = formatAlbums(data, artistsMap, null);
                setRecommendedAlbums(prev => {
                    const existingIds = new Set(prev.map(a => a.id));
                    const newItems = formatted.filter(a => !existingIds.has(a.id));
                    return [...prev, ...newItems];
                });
            }
        } catch (e) { console.error('loadMoreRecomendados:', e); }
        finally { setRecomendadosLoading(false); recomendadosLoadingRef.current = false; }
    };

    // Carregamento incremental de TOP CDS (busca direta no Supabase com paginação própria)
    const loadMoreTopCds = async (page, filter) => {
        const currentFilter = filter || topCdsFilter;
        const currentPage = page !== undefined ? page : topCdsPage;
        if (topCdsLoadingRef.current) return;
        setTopCdsLoading(true);
        topCdsLoadingRef.current = true;
        try {
            const from = (currentPage + 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, error } = await supabase
                .from('albums')
                .select('*')
                .or('is_private.is.null,is_private.eq.false')
                .is('deleted_at', null)
                .order('play_count', { ascending: false })
                .range(from, to);
            if (error) throw error;
            if (!data || data.length < PAGE_SIZE) setTopCdsHasMore(false);
            if (data && data.length > 0) {
                const artistsMap = {};
                const formatted = formatAlbums(data, artistsMap, null);
                setTopCdsAlbums(prev => {
                    const existingIds = new Set(prev.map(a => a.id));
                    const newItems = formatted.filter(a => !existingIds.has(a.id));
                    return [...prev, ...newItems];
                });
                setTopCdsPage(currentPage + 1);
            }
        } catch (e) { console.error('loadMoreTopCds:', e); }
        finally { setTopCdsLoading(false); topCdsLoadingRef.current = false; }
    };

    const loadData = async () => {
        try {
                // Não bloqueia loading para toda página - permite slider renderizar
                setLoadError(null);

                // Paralelizar as queries principais sem timeout
                const [albumsResult, artistsResult, collabResult, clipsResult] = await Promise.all([
                    // Query 1: Primeira página de álbuns
                    supabase
                        .from('albums')
                        .select('*')
                        .or('is_private.is.null,is_private.eq.false')
                        .is('deleted_at', null)
                        .order('release_date', { ascending: false, nullsFirst: false })
                        .range(0, PAGE_SIZE - 1),
                    
                    // Query 2: Primeira página de Artistas
                    supabase
                        .from('artists')
                        .select('*')
                        .order('followers_count', { ascending: false })
                        .range(0, PAGE_SIZE - 1),
                    
                    // Query 3: Colaborações
                    supabase
                        .from('collaboration_invites')
                        .select('album_id, invited_user_id')
                        .eq('status', 'accepted'),
                    
                    // Query 4: Vídeos/Clips
                    supabase
                        .from('artist_videos')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .limit(12)
                ]);

                // Criar mapa de artistas para busca rápida
                const artistsMap = {};
                if (artistsResult.data) {
                    artistsResult.data.forEach(artist => {
                        artistsMap[artist.id] = artist;
                    });
                }

                // Processar álbuns
                if (albumsResult.data && albumsResult.data.length > 0) {
                    const supabaseAlbums = albumsResult.data;
                    
                    // Mapear colaboradores
                    const collaboratorsByAlbum = {};
                    if (collabResult.data && collabResult.data.length > 0) {
                        collabResult.data.forEach(collab => {
                            const artist = artistsMap[collab.invited_user_id];
                            if (artist) {
                                if (!collaboratorsByAlbum[collab.album_id]) {
                                    collaboratorsByAlbum[collab.album_id] = [];
                                }
                                collaboratorsByAlbum[collab.album_id].push({
                                    id: artist.id,
                                    name: artist.name,
                                    slug: artist.slug,
                                    verified: artist.is_verified
                                });
                            }
                        });
                    }

                    const formattedAlbums = supabaseAlbums.map(album => {
                        const artist = artistsMap[album.artist_id] || {};
                        return {
                            id: album.id,
                            slug: album.slug,
                            title: album.title,
                            artistName: artist.name || album.artist_name || 'Artista',
                            artistId: album.artist_id,
                            artistSlug: artist.slug || album.artist_id,
                            artistVerified: artist.is_verified || false,
                            collaborators: collaboratorsByAlbum[album.id] || [],
                            coverImage: album.cover_url || '/images/default-album.png',
                            releaseYear: album.release_year,
                            releaseDate: album.release_date,
                            playCount: album.play_count || 0,
                            downloadCount: album.download_count || 0
                        };
                    });
                    
                    setAllAlbums(formattedAlbums);
                    if (formattedAlbums.length < PAGE_SIZE) setLancamentosHasMore(false);
                    
                    // Recomendados: embaralhar os álbuns da primeira página
                    if (formattedAlbums.length > 0) {
                        const shuffled = [...formattedAlbums].sort(() => Math.random() - 0.5);
                        setRecommendedAlbums(shuffled);
                    }
                }

                // Processar artistas
                const supabaseArtists = artistsResult.data;

            if (supabaseArtists && supabaseArtists.length > 0) {
                // Ordenar artistas apenas por followers_count (evitar query de plays que falha com 400)
                const sortedArtists = supabaseArtists.sort((a, b) => {
                    return (b.followers_count || 0) - (a.followers_count || 0);
                });

                const formattedSupabaseArtists = sortedArtists.map(a => ({
                    id: a.id,
                    slug: a.slug,
                    name: a.name,
                    avatar: a.avatar_url || '/images/default-avatar.png',
                    coverImage: a.cover_url || '',
                    verified: a.is_verified,
                    bio: a.bio
                }));
                setAllArtists(formattedSupabaseArtists);
                if (formattedSupabaseArtists.length < PAGE_SIZE) setArtistasHasMore(false);

                // Carregar artistas que o usuário segue (com try-catch para evitar falhas)
                if (user?.id) {
                    try {
                        const { data: follows } = await supabase
                            .from('follows')
                            .select('artist_id')
                            .eq('follower_id', user.id);

                        if (follows) {
                            setFollowingArtists(new Set(follows.map(f => f.artist_id)));
                        }
                    } catch (followError) {
                        console.warn('Erro ao carregar artistas seguidos:', followError);
                        // Continuar sem dados de follows
                    }
                }
            }
            
            // Processar clips
            if (clipsResult.data && clipsResult.data.length > 0) {
                // Filtrar apenas vídeos públicos
                const publicClips = clipsResult.data.filter(v => v.is_public === true);
                
                if (publicClips.length > 0) {
                    // Buscar dados dos artistas
                    const artistIds = [...new Set(publicClips.map(v => v.artist_id))];
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

                    const formattedClips = publicClips.map(video => {
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
                } else {
                    setClips([]);
                }
            }
                
        } catch (error) {
            console.error('Erro ao carregar dados da home:', error);
            // Mostrar erro apenas se for timeout ou erro crítico
            if (error.message?.includes('Timeout')) {
                setLoadError('Carregamento lento - tentando novamente em breve');
            } else if (error.message?.includes('400')) {
                // Erro 400 geralmente é relacionado a RLS, não mostrar para o usuário
                console.warn('Erro de permissão ao carregar alguns dados');
            } else {
                setLoadError(error.message || 'Erro ao carregar alguns dados');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Scroll infinito: registra listeners após dados carregarem (re-registra quando allAlbums muda)
    useEffect(() => {
        if (isLoading) return; // aguarda dados carregarem para os containers existirem

        const makeHandlers = (refs, onNearEnd) => {
            const containers = refs.map(r => r.current).filter(Boolean);
            const handlers = containers.map(el => {
                const fn = () => {
                    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 400) onNearEnd();
                };
                el.addEventListener('scroll', fn, { passive: true });
                return { el, fn };
            });
            return handlers;
        };

        const allHandlers = [
            ...makeHandlers([lancamentosDesktopRef, lancamentosRef], () => {
                if (!lancamentosHasMoreRef.current || lancamentosLoadingRef.current) return;
                const nextPage = lancamentosPageRef.current + 1;
                lancamentosPageRef.current = nextPage;
                setLancamentosPage(nextPage);
                loadMoreLancamentos(nextPage);
            }),
            ...makeHandlers([artistasRef, artistasMobileRef], () => {
                if (!artistasHasMoreRef.current || artistasLoadingRef.current) return;
                const nextPage = artistasPageRef.current + 1;
                artistasPageRef.current = nextPage;
                setArtistasPage(nextPage);
                loadMoreArtistas(nextPage);
            }),
            ...makeHandlers([recomendaRef, recomendaMobileRef], () => {
                if (!recomendadosHasMoreRef.current || recomendadosLoadingRef.current) return;
                const nextPage = recomendadosPageRef.current + 1;
                recomendadosPageRef.current = nextPage;
                setRecomendadosPage(nextPage);
                loadMoreRecomendados(nextPage);
            }),
            ...makeHandlers([topCdsDesktopRef, topCdsRef], () => {
                if (!topCdsHasMoreRef.current || topCdsLoadingRef.current) return;
                loadMoreTopCds();
            }),
        ];

        return () => allHandlers.forEach(({ el, fn }) => el.removeEventListener('scroll', fn));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading]);

    // Ref para cancelar requisições antigas ao trocar filtro
    const topCdsCancelRef = useRef(0);

    // Carregar TOP CDS quando período muda
    useEffect(() => {
        setTopCdsPage(0);
        setTopCdsHasMore(false);
        setTopCdsLoading(true);
        topCdsLoadingRef.current = true;

        const callId = ++topCdsCancelRef.current;

        const run = async () => {
            try {
                // 1. Buscar artistas
                const { data: artistsData } = await supabase
                    .from('artists')
                    .select('id, name, slug, is_verified, avatar_url');

                if (callId !== topCdsCancelRef.current) return; // cancelado

                const artistsMap = {};
                if (artistsData) artistsData.forEach(a => { artistsMap[a.id] = a; });

                // 2. Buscar TODOS os álbuns públicos (sem limite, igual ao /top-cds)
                const { data: allAlbumsData, error } = await supabase
                    .from('albums')
                    .select('*')
                    .or('is_private.is.null,is_private.eq.false')
                    .is('deleted_at', null)
                    .order('created_at', { ascending: false });

                if (callId !== topCdsCancelRef.current) return; // cancelado
                if (error) throw error;
                if (!allAlbumsData || allAlbumsData.length === 0) { setTopCdsAlbums([]); return; }

                // Filtrar localmente para garantir que não há privados
                const publicAlbums = allAlbumsData.filter(album => !album.is_private);

                // 3. Mapear artistas nos álbuns
                const formattedAlbums = publicAlbums.map(album => ({
                    ...album,
                    artistName: (artistsMap[album.artist_id]?.name) || album.artist_name || 'Artista',
                    artistSlug: (artistsMap[album.artist_id]?.slug) || album.artist_id,
                    artistVerified: artistsMap[album.artist_id]?.is_verified || false,
                    artists: artistsMap[album.artist_id] || null,
                }));

                // 4. GERAL: ordenar por play_count total
                if (topCdsFilter === 'geral') {
                    const sorted = [...formattedAlbums].sort((a, b) => (b.play_count || 0) - (a.play_count || 0));
                    if (callId !== topCdsCancelRef.current) return;
                    setTopCdsAlbums(formatAlbums(sorted, artistsMap, null));
                    return;
                }

                // 5. DIA / SEMANA / MÊS: buscar plays no período
                const now = new Date();
                let startDate;
                if (topCdsFilter === 'dia') {
                    startDate = new Date(now); startDate.setHours(0, 0, 0, 0);
                } else if (topCdsFilter === 'semana') {
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                } else {
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                }

                const { data: plays, error: playsError } = await supabase
                    .from('plays')
                    .select('album_id')
                    .gte('created_at', startDate.toISOString())
                    .lte('created_at', now.toISOString());

                if (callId !== topCdsCancelRef.current) return; // cancelado

                if (playsError) {
                    console.warn('plays error, usando play_count total:', playsError.message);
                    const sorted = [...formattedAlbums].sort((a, b) => (b.play_count || 0) - (a.play_count || 0));
                    setTopCdsAlbums(formatAlbums(sorted, artistsMap, null));
                    return;
                }

                // Contar plays por álbum
                const playCountByAlbum = {};
                (plays || []).forEach(play => {
                    playCountByAlbum[play.album_id] = (playCountByAlbum[play.album_id] || 0) + 1;
                });

                // Se há plays no período, filtrar e ordenar; senão mostrar todos por play_count
                const albumsWithPlays = formattedAlbums.filter(a => playCountByAlbum[a.id] > 0);
                const finalAlbums = albumsWithPlays.length > 0
                    ? albumsWithPlays
                        .map(a => ({ ...a, period_play_count: playCountByAlbum[a.id] || 0 }))
                        .sort((a, b) => b.period_play_count - a.period_play_count)
                    : [...formattedAlbums].sort((a, b) => (b.play_count || 0) - (a.play_count || 0));

                if (callId !== topCdsCancelRef.current) return; // cancelado
                setTopCdsAlbums(formatAlbums(finalAlbums, artistsMap, null));

            } catch (err) {
                console.error('loadTopCds error:', err);
            } finally {
                if (callId === topCdsCancelRef.current) {
                    setTopCdsLoading(false);
                    topCdsLoadingRef.current = false;
                }
            }
        };

        run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topCdsFilter]);

    // loadTopCds mantido como alias para compatibilidade com loadMoreTopCds
    const loadTopCds = (filter) => { setTopCdsFilter(filter || topCdsFilter); };

    const scrollSection = (ref, direction, onNearEnd) => {
        if (ref.current) {
            const scrollAmount = direction === 'left' ? -800 : 800;
            ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            // Verificar após scroll se chegou perto do fim
            if (direction === 'right' && onNearEnd) {
                setTimeout(() => {
                    const el = ref.current;
                    if (el && el.scrollLeft + el.clientWidth >= el.scrollWidth - 600) {
                        onNearEnd();
                    }
                }, 400);
            }
        }
    };

    const handleFollow = async (artistId, e) => {
        e.preventDefault();

        if (!user?.id) {
            toast({
                title: 'Erro',
                description: 'Faça login para seguir artistas',
                variant: 'destructive',
            });
            return;
        }

        try {
            const isFollowing = followingArtists.has(artistId);

            if (isFollowing) {
                // Deixar de seguir
                await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', user.id)
                    .eq('artist_id', artistId);

                const newFollowing = new Set(followingArtists);
                newFollowing.delete(artistId);
                setFollowingArtists(newFollowing);

                toast({
                    title: 'Sucesso',
                    description: 'Deixou de seguir o artista',
                });
            } else {
                // Seguir
                await supabase
                    .from('follows')
                    .insert([
                        {
                            follower_id: user.id,
                            artist_id: artistId,
                        },
                    ]);

                const newFollowing = new Set(followingArtists);
                newFollowing.add(artistId);
                setFollowingArtists(newFollowing);

                toast({
                    title: 'Sucesso',
                    description: 'Agora você segue este artista',
                });
            }
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Ocorreu um erro ao seguir o artista',
                variant: 'destructive',
            });
        }
    };




    // Se está carregando, mostrar loader fullscreen
    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white min-h-screen">
                <LoadingSpinner size="large" text="Carregando..." />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-white relative">
            {/* Content wrapper */}
            <div className="relative">
                {/* Home Popup */}
                <HomePopup />

                {/* Error Banner */}
                {loadError && (
                    <div className="bg-red-50 border border-red-200 px-4 py-3 text-red-800">
                        <p>Erro ao carregar alguns dados: {loadError}</p>
                    </div>
                )}

                {/* Hero Slider - sem padding no mobile para ocupar 100% da tela */}
                <div className="md:max-w-7xl md:mx-auto md:px-4 md:py-8 py-0">
                    <HeroSlider />
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 py-12">

                {/* Retry Button */}
                {loadError && (
                    <div className="flex justify-center mb-8">
                        <Button
                            onClick={() => loadData()}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Tentar Novamente
                        </Button>
                    </div>
                )}

                {/* Lançamentos Recentes - Desktop */}
                <section className="mb-16 hidden md:block">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <img src={IconLancamentos} alt="" className="w-5 h-5" />
                            <h2 className="text-xl font-bold text-black">Lançamentos Recentes</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link to="/lancamentos" className="text-red-600 hover:text-red-500 font-bold text-sm">
                                VER TODOS
                            </Link>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => scrollSection(lancamentosDesktopRef, 'left')}
                                    className="w-7 h-7 border border-red-600 text-red-600 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => scrollSection(lancamentosDesktopRef, 'right', () => { if (!lancamentosHasMoreRef.current || lancamentosLoadingRef.current) return; const np = lancamentosPageRef.current + 1; lancamentosPageRef.current = np; setLancamentosPage(np); loadMoreLancamentos(np); })}
                                    className="w-7 h-7 border border-red-600 text-red-600 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div
                        ref={lancamentosDesktopRef}
                        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {allAlbums.length === 0 ? (
                            <p className="text-gray-500 py-8 w-full">Nenhum lançamento disponível no momento.</p>
                        ) : (
                            <>
                            {allAlbums.map((album) => (
                                <div
                                    key={album.id}
                                    className="flex-shrink-0"
                                    style={{ width: '185px', minWidth: '185px' }}
                                >
                                    <Link
                                        to={`/${album.artistSlug}/${album.slug || album.id}`}
                                        className="group cursor-pointer block"
                                    >
                                        <div className="relative mb-3 overflow-hidden rounded-lg shadow-lg">
                                            <img
                                                src={album.coverImage}
                                                alt={album.title}
                                                className="w-full aspect-square object-cover transform group-hover:scale-110 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                                                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                                                    <Play className="w-5 h-5 text-white ml-1" fill="white" />
                                                </div>
                                            </div>
                                        </div>
                                        <h3 className="text-black font-semibold text-base mb-1 truncate group-hover:text-red-600 transition-colors">
                                            {album.title}
                                        </h3>
                                    </Link>
                                    <div className="flex items-center gap-1 text-gray-600 text-sm mb-2 flex-wrap">
                                        {/* Artista Principal */}
                                        <Link
                                            to={`/${album.artistSlug}`}
                                            className="flex items-center gap-0.5 hover:text-red-600 transition-colors"
                                        >
                                            <span>{album.artistName}</span>
                                            {album.artistVerified && (
                                                <img src={IconVerified} alt="verificado" className="w-3.5 h-3.5 flex-shrink-0" />
                                            )}
                                        </Link>

                                        {/* Colaboradores */}
                                        {album.collaborators && album.collaborators.length > 0 && (
                                            <>
                                                <span>&</span>
                                                {album.collaborators.map((collab, idx) => (
                                                    <Link
                                                        key={collab.id}
                                                        to={`/${collab.slug}`}
                                                        className="flex items-center gap-0.5 hover:text-red-600 transition-colors"
                                                    >
                                                        <span>{collab.name}</span>
                                                        {collab.verified && (
                                                            <img src={IconVerified} alt="verificado" className="w-3.5 h-3.5 flex-shrink-0" />
                                                        )}
                                                    </Link>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                                            <span className="font-bold text-gray-700">{formatNumber(album.period_play_count || album.playCount)}</span>
                                            <span className="text-gray-500">Plays</span>
                                        </div>
                                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                                            <span className="font-bold text-gray-700">{formatNumber(album.downloadCount)}</span>
                                            <span className="text-gray-500">Downloads</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {lancamentosHasMore && (
                                <div ref={lancamentosSentinelRef} className="flex-shrink-0 flex items-center justify-center" style={{ width: '40px', minWidth: '40px' }}>
                                    {lancamentosLoading && <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />}
                                </div>
                            )}
                            </>
                        )}
                    </div>
                </section>

                {/* TOP CDS - Desktop */}
                <section className="mb-16 hidden md:block">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <img src={IconTopCds} alt="" className="w-5 h-5" />
                            <h2 className="text-xl font-bold text-black">TOP CDS</h2>
                            <div className="flex items-center gap-2 text-sm ml-4">
                                <button
                                    onClick={() => setTopCdsFilter('dia')}
                                    className={`font-bold pb-1 transition-colors ${topCdsFilter === 'dia' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-600 hover:text-red-600'
                                        }`}
                                >
                                    DIA
                                </button>
                                <span className="text-gray-400">/</span>
                                <button
                                    onClick={() => setTopCdsFilter('semana')}
                                    className={`font-medium transition-colors ${topCdsFilter === 'semana' ? 'text-red-600 border-b-2 border-red-600 pb-1' : 'text-gray-600 hover:text-red-600'
                                        }`}
                                >
                                    SEMANA
                                </button>
                                <span className="text-gray-400">/</span>
                                <button
                                    onClick={() => setTopCdsFilter('mes')}
                                    className={`font-medium transition-colors ${topCdsFilter === 'mes' ? 'text-red-600 border-b-2 border-red-600 pb-1' : 'text-gray-600 hover:text-red-600'
                                        }`}
                                >
                                    MÊS
                                </button>
                                <span className="text-gray-400">/</span>
                                <button
                                    onClick={() => setTopCdsFilter('geral')}
                                    className={`font-medium transition-colors ${topCdsFilter === 'geral' ? 'text-red-600 border-b-2 border-red-600 pb-1' : 'text-gray-600 hover:text-red-600'
                                        }`}
                                >
                                    GERAL
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link to="/top-cds" className="text-red-600 hover:text-red-500 font-bold text-sm">
                                VER TODOS
                            </Link>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => scrollSection(topCdsDesktopRef, 'left')}
                                    className="w-7 h-7 border border-red-600 text-red-600 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => scrollSection(topCdsDesktopRef, 'right', () => { if (!topCdsHasMoreRef.current || topCdsLoadingRef.current) return; loadMoreTopCds(); })}
                                    className="w-7 h-7 border border-red-600 text-red-600 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div
                        ref={topCdsDesktopRef}
                        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {topCdsAlbums.length === 0 ? (
                            <div className="flex items-center justify-center w-full py-8">
                                {topCdsLoading ? (
                                    <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <p className="text-gray-500">Nenhum CD disponível para este período.</p>
                                )}
                            </div>
                        ) : (
                            <>
                            {topCdsAlbums.map((album, index) => (
                                <div
                                    key={`${album.id}-${topCdsFilter}`}
                                    className="flex-shrink-0"
                                    style={{ width: '185px', minWidth: '185px' }}
                                >
                                    <Link
                                        to={`/${album.artistSlug}/${album.slug || album.id}`}
                                        className="group cursor-pointer block"
                                    >
                                        <div className="relative mb-3 overflow-hidden rounded-lg shadow-lg">
                                            <div className="absolute top-2 left-2 z-10 bg-red-600 text-white font-bold text-lg w-10 h-10 flex items-center justify-center rounded shadow-lg">
                                                {index + 1}
                                            </div>
                                            <img
                                                src={album.coverImage}
                                                alt={album.title}
                                                className="w-full aspect-square object-cover transform group-hover:scale-110 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                                                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                                                    <Play className="w-5 h-5 text-white ml-1" fill="white" />
                                                </div>
                                            </div>
                                        </div>
                                        <h3 className="text-black font-semibold text-base mb-1 truncate group-hover:text-red-600 transition-colors">
                                            {album.title}
                                        </h3>
                                    </Link>
                                    <div className="flex items-center gap-1 text-gray-600 text-sm mb-2 flex-wrap">
                                        {/* Artista Principal */}
                                        <Link
                                            to={`/${album.artistSlug}`}
                                            className="flex items-center gap-0.5 hover:text-red-600 transition-colors"
                                        >
                                            <span>{album.artistName}</span>
                                            {album.artistVerified && (
                                                <img src={IconVerified} alt="verificado" className="w-3.5 h-3.5 flex-shrink-0" />
                                            )}
                                        </Link>

                                        {/* Colaboradores */}
                                        {album.collaborators && album.collaborators.length > 0 && (
                                            <>
                                                <span>&</span>
                                                {album.collaborators.map((collab, idx) => (
                                                    <Link
                                                        key={collab.id}
                                                        to={`/${collab.slug}`}
                                                        className="flex items-center gap-0.5 hover:text-red-600 transition-colors"
                                                    >
                                                        <span>{collab.name}</span>
                                                        {collab.verified && (
                                                            <img src={IconVerified} alt="verificado" className="w-3.5 h-3.5 flex-shrink-0" />
                                                        )}
                                                    </Link>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                                            <span className="font-bold text-gray-700">{formatNumber(album.period_play_count || album.playCount)}</span>
                                            <span className="text-gray-500">Plays</span>
                                        </div>
                                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                                            <span className="font-bold text-gray-700">{formatNumber(album.downloadCount)}</span>
                                            <span className="text-gray-500">Downloads</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {topCdsHasMore && (
                                <div ref={topCdsSentinelRef} className="flex-shrink-0 flex items-center justify-center" style={{ width: '40px', minWidth: '40px' }}>
                                    {topCdsLoading && <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />}
                                </div>
                            )}
                            </>
                        )}
                    </div>
                </section>

                {/* Artistas em Destaque */}
                <section className="mb-4 md:mb-16">
                    <div className="flex items-center justify-between mb-3 md:mb-6 px-4 md:px-0">
                        <div className="flex items-center gap-2">
                            <img src={IconArtistasDestaque} alt="" className="w-5 h-5" />
                            <h2 className="text-base md:text-xl font-bold text-black">Artistas em Destaque</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link to="/artistas" className="text-red-600 font-bold text-xs md:text-sm whitespace-nowrap">VER TODOS</Link>
                            <div className="flex gap-1">
                            <button
                                onClick={() => scrollSection(window.innerWidth < 768 ? artistasMobileRef : artistasRef, 'left')}
                                className="w-7 h-7 border border-red-600 text-red-600 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => scrollSection(window.innerWidth < 768 ? artistasMobileRef : artistasRef, 'right', () => { if (!artistasHasMoreRef.current || artistasLoadingRef.current) return; const np = artistasPageRef.current + 1; artistasPageRef.current = np; setArtistasPage(np); loadMoreArtistas(np); })}
                                className="w-7 h-7 border border-red-600 text-red-600 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            </div>
                        </div>
                    </div>
                    {/* Desktop - scroll horizontal - mostra 7 artistas visíveis */}
                    <div 
                        ref={artistasRef}
                        className="hidden md:flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {allArtists.length === 0 ? (
                            <p className="text-gray-500 py-8">Nenhum artista disponível no momento.</p>
                        ) : (
                            <>
                            {allArtists.map((artist) => (
                                <div
                                    key={artist.id}
                                    className="flex flex-col items-center text-center flex-shrink-0"
                                    style={{ width: '110px', minWidth: '110px' }}
                                >
                                    <Link
                                        to={`/${artist.slug || artist.id}`}
                                        className="group cursor-pointer mb-2"
                                    >
                                        <div className="relative inline-block overflow-visible">
                                            <img
                                                src={artist.avatar}
                                                alt={artist.name}
                                                className="w-20 h-20 lg:w-24 lg:h-24 rounded-full object-cover transform group-hover:scale-105 transition-transform duration-300 shadow-lg"
                                            />
                                        </div>
                                    </Link>
                                    <Link
                                        to={`/${artist.slug || artist.id}`}
                                        className="flex items-center gap-1 justify-center text-black font-semibold text-xs mb-2 hover:text-red-600 transition-colors w-full"
                                    >
                                        <span className="text-xs truncate">{artist.name}</span>
                                        {artist.verified && (
                                            <img src={IconVerified} alt="verificado" className="w-3 h-3 flex-shrink-0" />
                                        )}
                                    </Link>
                                    <button
                                         onClick={(e) => handleFollow(artist.id, e)}
                                         className={`inline-flex items-center justify-center gap-1 whitespace-nowrap text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3 [&_svg]:shrink-0 shadow py-1 px-3 h-7 rounded-full font-semibold ${followingArtists.has(artist.id)
                                              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                              : 'bg-red-600 text-white hover:bg-red-700'
                                              }`}
                                    >
                                         {followingArtists.has(artist.id) ? (
                                             'SEGUINDO'
                                         ) : (
                                             <>
                                                 <Plus className="w-3 h-3" />
                                                 SEGUIR
                                             </>
                                         )}
                                     </button>
                                </div>
                            ))}
                            {artistasHasMore && (
                                <div ref={artistasSentinelRef} className="flex-shrink-0 flex items-center justify-center" style={{ width: '40px', minWidth: '40px' }}>
                                    {artistasLoading && <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />}
                                </div>
                            )}
                            </>
                        )}
                    </div>
                    {/* Mobile - igual ao app: apenas foto circular + nome + badge, sem botão seguir */}
                    <div ref={artistasMobileRef} className="md:hidden flex gap-5 overflow-x-auto scrollbar-hide scroll-smooth pb-2 px-4">
                        {allArtists.length === 0 ? (
                            <p className="text-gray-500 py-8 w-full">Nenhum artista disponível no momento.</p>
                        ) : (
                            <>
                            {allArtists.map((artist) => (
                                <Link
                                    key={artist.id}
                                    to={`/${artist.slug || artist.id}`}
                                    className="flex flex-col items-center text-center flex-shrink-0 group"
                                    style={{ minWidth: '80px', maxWidth: '80px' }}
                                >
                                    <div className="relative mb-1.5">
                                        <img
                                            src={artist.avatar}
                                            alt={artist.name}
                                            className="w-16 h-16 rounded-full object-cover shadow-md group-hover:ring-2 group-hover:ring-red-600 transition-all"
                                        />
                                    </div>
                                    <div className="flex items-center gap-0.5 justify-center w-full">
                                        <span className="text-black font-semibold text-xs truncate group-hover:text-red-600 transition-colors">{artist.name}</span>
                                        {artist.verified && (
                                            <img src={IconVerified} alt="verificado" className="w-2.5 h-2.5 flex-shrink-0" />
                                        )}
                                    </div>
                                </Link>
                            ))}
                            {artistasHasMore && (
                                <div className="flex-shrink-0 flex items-center justify-center" style={{ minWidth: '40px' }}>
                                    {artistasLoading && <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />}
                                </div>
                            )}
                            </>
                        )}
                    </div>
                </section>

                {/* Lançamentos Recentes - Mobile (padrão app) */}
                <section className="mb-4 md:hidden">
                    <div className="flex items-center justify-between mb-3 px-4">
                        <div className="flex items-center gap-2">
                            <img src={IconLancamentos} alt="" className="w-5 h-5" />
                            <h2 className="text-base font-bold text-black">Lançamentos</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link to="/lancamentos" className="text-red-600 font-bold text-xs whitespace-nowrap">VER TODOS</Link>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => scrollSection(lancamentosRef, 'left')}
                                    className="w-7 h-7 border border-red-600 text-red-600 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => scrollSection(lancamentosRef, 'right', () => { if (!lancamentosHasMoreRef.current || lancamentosLoadingRef.current) return; const np = lancamentosPageRef.current + 1; lancamentosPageRef.current = np; setLancamentosPage(np); loadMoreLancamentos(np); })}
                                    className="w-7 h-7 border border-red-600 text-red-600 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div
                        ref={lancamentosRef}
                        className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth px-4"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {allAlbums.length === 0 ? (
                            <p className="text-gray-500 py-4 w-full text-sm">Nenhum lançamento disponível no momento.</p>
                        ) : (
                            <>
                            {allAlbums.map((album) => (
                                <div key={album.id} className="flex-shrink-0" style={{ width: '140px' }}>
                                    <Link to={`/${album.artistSlug}/${album.slug || album.id}`} className="block">
                                        <div className="relative mb-1.5 overflow-hidden rounded-lg shadow" style={{ width: '140px', height: '140px' }}>
                                            <img
                                                src={album.coverImage}
                                                alt={album.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <h3 className="text-black font-semibold text-xs mb-0.5 line-clamp-2 leading-tight">
                                            {album.title}
                                        </h3>
                                    </Link>
                                    <div className="flex items-center gap-0.5 text-gray-500 text-xs mb-1">
                                        <Link to={`/${album.artistSlug}`} className="truncate hover:text-red-600">
                                            {album.artistName}
                                        </Link>
                                        {album.artistVerified && (
                                            <img src={IconVerified} alt="verificado" className="w-3 h-3 flex-shrink-0" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <div className="flex items-center gap-0.5 text-gray-500">
                                            <Play className="w-2.5 h-2.5" />
                                            <span>{formatNumber(album.playCount)}</span>
                                        </div>
                                        <div className="flex items-center gap-0.5 text-gray-500">
                                            <span>↓</span>
                                            <span>{formatNumber(album.downloadCount)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {lancamentosHasMore && (
                                <div className="flex-shrink-0 flex items-center justify-center" style={{ minWidth: '40px' }}>
                                    {lancamentosLoading && <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />}
                                </div>
                            )}
                            </>
                        )}
                    </div>
                </section>

                {/* TOP CDS - Mobile (padrão app) */}
                <section className="mb-4 md:hidden">
                    <div className="flex items-center justify-between mb-2 px-4">
                        <div className="flex items-center gap-2">
                            <img src={IconTopCds} alt="" className="w-5 h-5" />
                            <h2 className="text-base font-bold text-black">TOP CDS</h2>
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => scrollSection(topCdsRef, 'left')}
                                className="w-7 h-7 border border-red-600 text-red-600 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => scrollSection(topCdsRef, 'right', () => { if (!topCdsHasMoreRef.current || topCdsLoadingRef.current) return; loadMoreTopCds(); })}
                                className="w-7 h-7 border border-red-600 text-red-600 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    {/* Filtros mobile */}
                    <div className="flex items-center gap-3 px-4 mb-3">
                        {['dia', 'semana', 'mes', 'geral'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setTopCdsFilter(f)}
                                className={`text-xs font-bold pb-0.5 transition-colors ${
                                    topCdsFilter === f
                                        ? 'text-red-600 border-b-2 border-red-600'
                                        : 'text-gray-500'
                                }`}
                            >
                                {f.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <div
                        ref={topCdsRef}
                        className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth px-4"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {topCdsAlbums.length === 0 ? (
                            <div className="flex items-center justify-center w-full py-4">
                                {topCdsLoading ? (
                                    <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <p className="text-gray-500 text-sm">Nenhum CD disponível para este período.</p>
                                )}
                            </div>
                        ) : (
                            <>
                            {topCdsAlbums.map((album, index) => (
                                <div key={`${album.id}-${topCdsFilter}`} className="flex-shrink-0" style={{ width: '140px' }}>
                                    <Link to={`/${album.artistSlug}/${album.slug || album.id}`} className="block">
                                        <div className="relative mb-1.5 overflow-hidden rounded-lg shadow" style={{ width: '140px', height: '140px' }}>
                                            <div className="absolute top-1.5 left-1.5 z-10 bg-red-600 text-white font-bold text-xs w-6 h-6 flex items-center justify-center rounded">
                                                {index + 1}
                                            </div>
                                            <img
                                                src={album.coverImage}
                                                alt={album.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <h3 className="text-black font-semibold text-xs mb-0.5 line-clamp-2 leading-tight">
                                            {album.title}
                                        </h3>
                                    </Link>
                                    <div className="flex items-center gap-0.5 text-gray-500 text-xs mb-1">
                                        <Link to={`/${album.artistSlug}`} className="truncate hover:text-red-600">
                                            {album.artistName}
                                        </Link>
                                        {album.artistVerified && (
                                            <img src={IconVerified} alt="verificado" className="w-3 h-3 flex-shrink-0" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <div className="flex items-center gap-0.5 text-gray-500">
                                            <Play className="w-2.5 h-2.5" />
                                            <span>{formatNumber(album.period_play_count || album.playCount)}</span>
                                        </div>
                                        <div className="flex items-center gap-0.5 text-gray-500">
                                            <span>↓</span>
                                            <span>{formatNumber(album.downloadCount)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {topCdsHasMore && (
                                <div className="flex-shrink-0 flex items-center justify-center" style={{ minWidth: '40px' }}>
                                    {topCdsLoading && <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />}
                                </div>
                            )}
                            </>
                        )}
                    </div>
                </section>

                {/* Ouça Aqui Recomenda */}
                <section className="mb-8 md:mb-16">
                    <div className="flex items-center justify-between mb-3 md:mb-6 px-4 md:px-0">
                        <div className="flex items-center gap-2">
                            <ThumbsUp className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <h2 className="text-base md:text-xl font-bold text-black whitespace-nowrap">Ouça Aqui Recomenda!</h2>
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => {
                                    const ref = window.innerWidth >= 768 ? recomendaRef : recomendaMobileRef;
                                    scrollSection(ref, 'left');
                                }}
                                className="w-7 h-7 border border-red-600 text-red-600 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => {
                                    const ref = window.innerWidth >= 768 ? recomendaRef : recomendaMobileRef;
                                    scrollSection(ref, 'right');
                                }}
                                className="w-7 h-7 border border-red-600 text-red-600 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    {/* Desktop - 6 cards visíveis igual ao TOP CDS */}
                    <div
                        ref={recomendaRef}
                        className="hidden md:flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {recommendedAlbums.length === 0 ? (
                            <p className="text-gray-500 py-8">Nenhum álbum disponível no momento.</p>
                        ) : (
                            <>
                            {recommendedAlbums.map((album) => (
                                <div
                                    key={album.id}
                                    className="flex-shrink-0"
                                    style={{ width: '185px', minWidth: '185px' }}
                                >
                                    <Link
                                        to={`/${album.artistSlug}/${album.slug || album.id}`}
                                        className="group cursor-pointer block"
                                    >
                                        <div className="relative mb-3 overflow-hidden rounded-lg shadow-lg">
                                            <img
                                                src={album.coverImage}
                                                alt={album.title}
                                                className="w-full aspect-square object-cover transform group-hover:scale-110 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                                                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                                                    <Play className="w-5 h-5 text-white ml-1" fill="white" />
                                                </div>
                                            </div>
                                        </div>
                                        <h3 className="text-black font-semibold text-base mb-1 truncate group-hover:text-red-600 transition-colors">
                                            {album.title}
                                        </h3>
                                    </Link>
                                    <div className="flex items-center gap-1 text-gray-600 text-sm mb-2 flex-wrap">
                                        <Link
                                            to={`/${album.artistSlug}`}
                                            className="flex items-center gap-0.5 hover:text-red-600 transition-colors"
                                        >
                                            <span>{album.artistName}</span>
                                            {album.artistVerified && (
                                                <img src={IconVerified} alt="verificado" className="w-3.5 h-3.5 flex-shrink-0" />
                                            )}
                                        </Link>
                                        {album.collaborators && album.collaborators.length > 0 && (
                                             <>
                                                  <span>&</span>
                                                  {album.collaborators.map((collab) => (
                                                      <Link
                                                          key={collab.id}
                                                          to={`/${collab.slug}`}
                                                          className="flex items-center gap-0.5 hover:text-red-600 transition-colors"
                                                      >
                                                          <span>{collab.name}</span>
                                                          {collab.verified && (
                                                              <img src={IconVerified} alt="verificado" className="w-3.5 h-3.5 flex-shrink-0" />
                                                          )}
                                                      </Link>
                                                  ))}
                                              </>
                                          )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                                            <span className="font-bold text-gray-700">{formatNumber(album.playCount)}</span>
                                            <span className="text-gray-500">Plays</span>
                                        </div>
                                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                                            <span className="font-bold text-gray-700">{formatNumber(album.downloadCount)}</span>
                                            <span className="text-gray-500">Downloads</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {recomendadosHasMore && (
                                <div ref={recomendadosSentinelRef} className="flex-shrink-0 flex items-center justify-center" style={{ width: '40px', minWidth: '40px' }}>
                                    {recomendadosLoading && <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />}
                                </div>
                            )}
                            </>
                        )}
                    </div>
                    {/* Mobile - carrossel de 140px igual a Lançamentos Recentes */}
                    <div
                        ref={recomendaMobileRef}
                        className="md:hidden flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth px-4"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {recommendedAlbums.length === 0 ? (
                            <p className="text-gray-500 py-4 w-full text-sm">Nenhum álbum disponível no momento.</p>
                        ) : (
                            <>
                            {recommendedAlbums.map((album) => (
                                <div key={album.id} className="flex-shrink-0" style={{ width: '140px' }}>
                                    <Link to={`/${album.artistSlug}/${album.slug || album.id}`} className="block">
                                        <div className="relative mb-1.5 overflow-hidden rounded-lg shadow" style={{ width: '140px', height: '140px' }}>
                                            <img
                                                src={album.coverImage}
                                                alt={album.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <h3 className="text-black font-semibold text-xs mb-0.5 line-clamp-2 leading-tight">
                                            {album.title}
                                        </h3>
                                    </Link>
                                    <div className="flex items-center gap-0.5 text-gray-500 text-xs mb-1">
                                        <Link to={`/${album.artistSlug}`} className="truncate hover:text-red-600">
                                            {album.artistName}
                                        </Link>
                                        {album.artistVerified && (
                                            <img src={IconVerified} alt="verificado" className="w-3 h-3 flex-shrink-0" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <div className="flex items-center gap-0.5 text-gray-500">
                                            <Play className="w-2.5 h-2.5" />
                                            <span>{formatNumber(album.playCount)}</span>
                                        </div>
                                        <div className="flex items-center gap-0.5 text-gray-500">
                                            <span>↓</span>
                                            <span>{formatNumber(album.downloadCount)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {recomendadosHasMore && (
                                <div className="flex-shrink-0 flex items-center justify-center" style={{ minWidth: '40px' }}>
                                    {recomendadosLoading && <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />}
                                </div>
                            )}
                            </>
                        )}
                    </div>

                </section>

                {/* CLIPS - Mobile (padrão app) */}
                {clips.length > 0 && (
                    <section className="mb-4 md:hidden">
                        <div className="flex items-center gap-2 mb-3 px-4">
                            <Video className="w-5 h-5 text-red-600" />
                            <h2 className="text-base font-bold text-black">CLIPS</h2>
                        </div>
                        {/* Vídeo principal mobile */}
                        <div className="px-4 mb-3">
                            <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-lg">
                                <div className="relative" style={{ paddingBottom: '56.25%' }}>
                                    <iframe
                                        className="absolute top-0 left-0 w-full h-full"
                                        src={`https://www.youtube.com/embed/${extractYoutubeId(clips[selectedClipIndex].videoUrl)}`}
                                        title={clips[selectedClipIndex].title}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            </div>
                            <h3 className="text-sm font-bold text-black mt-2 mb-0.5">{clips[selectedClipIndex].title}</h3>
                            <Link to={`/${clips[selectedClipIndex].artistSlug}`} className="flex items-center gap-1 text-gray-600 text-xs">
                                <span>{clips[selectedClipIndex].artistName}</span>
                                {clips[selectedClipIndex].artistVerified && (
                                    <img src={IconVerified} alt="verificado" className="w-3 h-3" />
                                )}
                            </Link>
                        </div>
                        {/* Lista horizontal de thumbnails */}
                        <div
                            className="flex gap-2 overflow-x-auto scrollbar-hide px-4"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {clips.slice(0, 20).map((clip, index) => (
                                <div
                                    key={clip.id}
                                    className={`flex-shrink-0 rounded-lg overflow-hidden cursor-pointer border-2 ${
                                        index === selectedClipIndex ? 'border-red-600' : 'border-transparent'
                                    }`}
                                    style={{ width: '100px' }}
                                    onClick={() => setSelectedClipIndex(index)}
                                >
                                    <img
                                        src={clip.thumbnail}
                                        alt={clip.title}
                                        className="w-full object-cover"
                                        style={{ height: '65px' }}
                                    />
                                    <p className="text-xs font-semibold text-black px-1 py-0.5 truncate bg-gray-50">{clip.title}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* CLIPS - Desktop */}
                {clips.length > 0 && (
                    <section className="mb-16 hidden md:block">
                        <div className="flex items-center gap-2 mb-6">
                            <Video className="w-5 h-5 text-red-600" />
                            <h2 className="text-xl font-bold text-black">CLIPS</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Vídeo Principal */}
                            <div className="lg:col-span-2">
                                <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-lg">
                                    <div className="relative" style={{ paddingBottom: '56.25%' }}>
                                        <iframe
                                            className="absolute top-0 left-0 w-full h-full"
                                            src={`https://www.youtube.com/embed/${extractYoutubeId(clips[selectedClipIndex].videoUrl)}`}
                                            title={clips[selectedClipIndex].title}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-xl font-bold text-black mb-2">{clips[selectedClipIndex].title}</h3>
                                    <Link
                                        to={`/${clips[selectedClipIndex].artistSlug}`}
                                        className="flex items-center gap-1 text-gray-600 hover:text-red-600 transition-colors"
                                    >
                                        <span className="font-semibold">{clips[selectedClipIndex].artistName}</span>
                                        {clips[selectedClipIndex].artistVerified && (
                                            <img src={IconVerified} alt="verificado" className="w-4 h-4" />
                                        )}
                                    </Link>
                                </div>
                            </div>

                            {/* Lista de Vídeos */}
                            <div className="lg:col-span-1">
                                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {clips.slice(0, 20).map((clip, index) => (
                                        <div
                                            key={clip.id}
                                            className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                                index === selectedClipIndex
                                                    ? 'bg-red-600' 
                                                    : 'bg-gray-100 hover:bg-gray-200'
                                            }`}
                                            onClick={() => {
                                                setSelectedClipIndex(index);
                                            }}
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
                    </section>
                )}

                {/* Gêneros */}
                <section className="mb-4 md:mb-16">
                    <div className="flex items-center justify-between mb-3 md:mb-6 px-4 md:px-0">
                        <div className="flex items-center gap-2">
                            <img src={IconGeneros} alt="" className="w-5 h-5" />
                            <h2 className="text-base md:text-xl font-bold text-black">Gêneros</h2>
                        </div>
                        {/* Desktop - Navigation Buttons */}
                        <div className="hidden md:flex items-center gap-2">
                            <div className="flex gap-1">
                                <button
                                    onClick={() => scrollSection(generosRef, 'left')}
                                    className="w-7 h-7 border border-red-600 text-red-600 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => scrollSection(generosRef, 'right')}
                                    className="w-7 h-7 border border-red-600 text-red-600 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Desktop */}
                    <div
                        ref={generosRef}
                        className="hidden md:flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {genres.map((genre) => (
                            <Link
                                key={genre.slug}
                                to={`/genero/${genre.slug}`}
                                className="flex-shrink-0"
                                style={{ width: '185px', minWidth: '185px' }}
                            >
                                <div
                                    className="h-32 rounded-lg shadow-lg flex items-center justify-center p-4 cursor-pointer group hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                                    style={{
                                        backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.72) 100%), url('${genre.imageUrl}')`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                >
                                    <div className="absolute inset-0 group-hover:bg-red-600/85 transition-all duration-300" />
                                    <h3 className="text-white font-bold text-lg text-center relative z-10 group-hover:scale-110 transition-transform duration-300">
                                        {genre.name}
                                    </h3>
                                </div>
                            </Link>
                        ))}
                    </div>
                    
                    {/* Mobile */}
                    <div className="md:hidden grid grid-cols-3 gap-3 px-4">
                        {genres.map((genre) => (
                            <Link
                                key={genre.slug}
                                to={`/genero/${genre.slug}`}
                                className="flex-shrink-0"
                            >
                                <div
                                    className="h-24 rounded-lg shadow-lg flex items-center justify-center p-2 cursor-pointer group hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                                    style={{
                                        backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.72) 100%), url('${genre.imageUrl}')`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                >
                                    <div className="absolute inset-0 group-hover:bg-red-600/85 transition-all duration-300" />
                                    <h3 className="text-white font-bold text-sm text-center relative z-10 group-hover:scale-110 transition-transform duration-300">
                                        {genre.name}
                                    </h3>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
            </div>
        </div>
    );
};

export default HomeImproved;
