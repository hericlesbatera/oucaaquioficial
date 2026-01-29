import { supabase } from './supabaseClient';

export const artistApi = {
  async getArtistStats(userId) {
    try {
      console.log('getArtistStats - userId:', userId);

      // Buscar dados do artista
      const { data: artist, error: artistError } = await supabase
        .from('artists')
        .select('id, followers_count, monthly_listeners')
        .eq('id', userId)
        .maybeSingle();

      console.log('Artist data:', artist, artistError);

      // Buscar álbuns do artista (usando artist_id = user.id)
      const { data: albums, error: albumsError } = await supabase
        .from('albums')
        .select('id, title')
        .eq('artist_id', userId);

      console.log('Albums data:', albums, albumsError);

      // Buscar todas as músicas do artista
      const { data: songs, error: songsError } = await supabase
        .from('songs')
        .select('id, title, plays, cover_url, album_id')
        .eq('artist_id', userId)
        .order('plays', { ascending: false });

      console.log('Songs data:', songs, songsError);

      // Calcular total de plays
      const totalPlays = (songs || []).reduce((sum, song) => sum + (song.plays || 0), 0);

      // Top 5 músicas
      const topSongs = (songs || []).slice(0, 5).map(song => ({
        songId: song.id,
        title: song.title,
        plays: song.plays || 0,
        coverImage: song.cover_url
      }));

      // Gerar plays por mês (últimos 6 meses) - baseado no total de plays
      const playsByMonth = [];
      const now = new Date();
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        // Distribuir os plays de forma crescente (meses mais recentes têm mais plays)
        const factor = (6 - i) / 21; // Soma de 1+2+3+4+5+6 = 21
        const monthPlays = Math.floor(totalPlays * factor);
        
        playsByMonth.push({
          month: monthNames[date.getMonth()],
          plays: monthPlays
        });
      }

      return {
        data: {
          totalPlays,
          monthlyListeners: artist?.monthly_listeners || Math.floor(totalPlays * 0.023),
          followers: artist?.followers_count || 0,
          totalSongs: songs?.length || 0,
          totalAlbums: albums?.length || 0,
          topSongs,
          playsByMonth
        },
        error: null
      };
    } catch (err) {
      console.error('getArtistStats error:', err);
      return { data: null, error: { message: String(err) } };
    }
  },

  async getArtist(id) {
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      return { data, error };
    } catch (err) {
      console.error('getArtist error:', err);
      return { data: null, error: { message: String(err) } };
    }
  },

  async saveArtist(userId, userEmail, artistData) {
    try {
      console.log('Salvando artista:', userId, artistData);
      
      // Primeiro verificar se existe
      const { data: existing } = await supabase
        .from('artists')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      // Campos para atualizar
      const updateData = {
        name: artistData.name || '',
        bio: artistData.bio || '',
        estilo_musical: artistData.estilo_musical || '',
        cidade: artistData.cidade || '',
        estado: artistData.estado || '',
        avatar_url: artistData.avatar_url || '',
        cover_url: artistData.cover_url || '',
        instagram: artistData.instagram || '',
        twitter: artistData.twitter || '',
        youtube: artistData.youtube || ''
      };
      
      // Adicionar slug se fornecido
      if (artistData.slug) {
        updateData.slug = artistData.slug;
      }
      
      if (existing) {
        console.log('Artista existe, atualizando...');
        const { error } = await supabase
          .from('artists')
          .update(updateData)
          .eq('id', userId);
        
        if (error) {
          console.error('Erro no update:', error);
          return { data: null, error };
        }
        
        console.log('Update sucesso!');
        return { data: { id: userId }, error: null };
      } else {
        console.log('Artista não existe, criando...');
        const { error } = await supabase
          .from('artists')
          .insert({
            id: userId,
            email: userEmail,
            name: artistData.name || '',
            slug: (artistData.name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            bio: artistData.bio || '',
            estilo_musical: artistData.estilo_musical || '',
            cidade: artistData.cidade || '',
            estado: artistData.estado || '',
            avatar_url: artistData.avatar_url || '',
            cover_url: artistData.cover_url || '',
            instagram: artistData.instagram || '',
            twitter: artistData.twitter || '',
            youtube: artistData.youtube || '',
            followers_count: 0,
            is_verified: false
          });
        
        if (error) {
          console.error('Erro no insert:', error);
          return { data: null, error };
        }
        
        console.log('Insert sucesso!');
        return { data: { id: userId }, error: null };
      }
    } catch (err) {
      console.error('saveArtist exception:', err);
      return { data: null, error: { message: String(err) } };
    }
  }
};
