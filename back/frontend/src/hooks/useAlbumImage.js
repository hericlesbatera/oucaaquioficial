import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook que garante que a imagem do álbum sempre carregue corretamente
 * mesmo que tenha sido atualizada recentemente
 */
export const useAlbumImage = (albumId, fallbackUrl) => {
    const [imageUrl, setImageUrl] = useState(fallbackUrl);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!albumId) {
            setLoading(false);
            return;
        }

        const fetchAlbumImage = async () => {
            try {
                setLoading(true);

                // Buscar o álbum direto do servidor
                const { data, error } = await supabase
                    .from('albums')
                    .select('cover_url')
                    .eq('id', albumId)
                    .maybeSingle();

                if (error) throw error;

                if (data?.cover_url) {
                    // Adicionar timestamp para forçar refresh do cache da imagem
                    const freshUrl = `${data.cover_url}?t=${new Date().getTime()}`;
                    setImageUrl(freshUrl);
                    setError(null);
                } else {
                    setImageUrl(fallbackUrl);
                }
            } catch (err) {
                console.error('Erro ao buscar imagem do álbum:', err);
                setImageUrl(fallbackUrl);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAlbumImage();
    }, [albumId, fallbackUrl]);

    return { imageUrl, loading, error };
};

export default useAlbumImage;
