import { supabase } from './supabaseClient';

/**
 * Incrementa os counters quando uma música é tocada
 * @param {string} songId - ID da música
 * @param {string} albumId - ID do álbum
 * @param {string} playlistId - ID da playlist (opcional)
 */
export const recordSongPlay = async (songId, albumId, playlistId = null) => {
  if (!songId || !albumId) {
    console.error('songId and albumId are required for recording play');
    return;
  }

  try {
    // 1. Incrementar plays da MÚSICA - fetch current value and increment
    const { data: songData } = await supabase
      .from('songs')
      .select('plays')
      .eq('id', songId)
      .single();
    
    const newPlays = (songData?.plays || 0) + 1;
    await supabase
      .from('songs')
      .update({ plays: newPlays })
      .eq('id', songId);

    // 2. Incrementar play_count do ÁLBUM
    const { data: albumData } = await supabase
      .from('albums')
      .select('play_count')
      .eq('id', albumId)
      .single();
    
    const newAlbumPlayCount = (albumData?.play_count || 0) + 1;
    await supabase
      .from('albums')
      .update({ play_count: newAlbumPlayCount })
      .eq('id', albumId);

    // 3. Se houver playlistId, incrementar play_count da PLAYLIST
    if (playlistId) {
      const { data: playlistData } = await supabase
        .from('playlists')
        .select('play_count')
        .eq('id', playlistId)
        .single();
      
      const newPlaylistPlayCount = (playlistData?.play_count || 0) + 1;
      await supabase
        .from('playlists')
        .update({ play_count: newPlaylistPlayCount })
        .eq('id', playlistId);
    }

    // 4. Registrar na tabela plays (para filtros de período)
    await supabase
      .from('plays')
      .insert([
        {
          album_id: albumId,
          song_id: songId,
          playlist_id: playlistId || null,
          created_at: new Date().toISOString()
        }
      ]);
  } catch (error) {
    console.error('Error recording song play:', error);
  }
};

/**
 * Incrementa os downloads quando um álbum é baixado
 * @param {string} albumId - ID do álbum
 * @param {string[]} songIds - Array com IDs das músicas do álbum (opcional)
 */
export const recordAlbumDownload = async (albumId, songIds = []) => {
  if (!albumId) {
    console.error('albumId is required for recording download');
    return;
  }

  try {
    // 1. Obter download_count atual do álbum
    const albumRes = await supabase
      .from('albums')
      .select('download_count')
      .eq('id', albumId)
      .single();
    
    if (albumRes.data) {
      const currentCount = albumRes.data.download_count || 0;
      await supabase
        .from('albums')
        .update({ download_count: currentCount + 1 })
        .eq('id', albumId);
    }

    // 2. Incrementar downloads de cada MÚSICA do álbum
    if (songIds && songIds.length > 0) {
      // Buscar downloads atuais das músicas
      const { data: songsData } = await supabase
        .from('songs')
        .select('id, downloads')
        .in('id', songIds);
      
      // Atualizar cada música com download incrementado
      if (songsData && songsData.length > 0) {
        for (const song of songsData) {
          await supabase
            .from('songs')
            .update({ downloads: (song.downloads || 0) + 1 })
            .eq('id', song.id);
        }
      }
    }
  } catch (error) {
    console.error('Error recording album download:', error);
  }
};

/**
 * Incrementa os downloads quando uma música individual é baixada
 * @param {string} songId - ID da música
 * @param {string} albumId - ID do álbum (opcional)
 */
export const recordSongDownload = async (songId, albumId = null) => {
  if (!songId) {
    console.error('songId is required for recording download');
    return;
  }

  try {
    // 1. Incrementar downloads da MÚSICA
    const { data: songData } = await supabase
      .from('songs')
      .select('downloads')
      .eq('id', songId)
      .single();
    
    await supabase
      .from('songs')
      .update({ downloads: (songData?.downloads || 0) + 1 })
      .eq('id', songId);

    // 2. Se houver albumId, incrementar download_count do álbum também
    if (albumId) {
      const { data: albumData } = await supabase
        .from('albums')
        .select('download_count')
        .eq('id', albumId)
        .single();
      
      await supabase
        .from('albums')
        .update({ download_count: (albumData?.download_count || 0) + 1 })
        .eq('id', albumId);
    }
  } catch (error) {
    console.error('Error recording song download:', error);
  }
};
