// Mock data para o clone do Spotify

export const mockUsers = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@example.com',
    type: 'user',
    isPremium: true,
    avatar: '/images/default-avatar.png'
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@example.com',
    type: 'artist',
    isPremium: true,
    avatar: '/images/default-avatar.png'
  }
];

export const mockArtists = [
  {
    id: 'a1',
    userId: '2',
    name: 'Maria Santos',
    bio: 'Cantora e compositora brasileira',
    avatar: '/images/default-avatar.png',
    coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800',
    followers: 45230,
    monthlyListeners: 125000,
    verified: true
  },
  {
    id: 'a2',
    name: 'Pedro Oliveira',
    bio: 'Rapper e produtor musical',
    avatar: '/images/default-avatar.png',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    followers: 89540,
    monthlyListeners: 340000,
    verified: true
  },
  {
    id: 'a3',
    name: 'Ana Costa',
    bio: 'Música eletrônica e experimental',
    avatar: '/images/default-avatar.png',
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
    followers: 62100,
    monthlyListeners: 198000,
    verified: true
  }
];

export const mockAlbums = [
  {
    id: 'alb1',
    title: 'Noites de Verão',
    artistId: 'a1',
    artistName: 'Maria Santos',
    coverImage: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300',
    releaseYear: 2024,
    songCount: 12
  },
  {
    id: 'alb2',
    title: 'Rimas da Quebrada',
    artistId: 'a2',
    artistName: 'Pedro Oliveira',
    coverImage: 'https://images.unsplash.com/photo-1619983081563-430f63602796?w=300',
    releaseYear: 2023,
    songCount: 15
  },
  {
    id: 'alb3',
    title: 'Synthwave Dreams',
    artistId: 'a3',
    artistName: 'Ana Costa',
    coverImage: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=300',
    releaseYear: 2024,
    songCount: 10
  }
];

export const mockSongs = [
  {
    id: 's1',
    title: 'Luz do Luar',
    artistId: 'a1',
    artistName: 'Maria Santos',
    albumId: 'alb1',
    albumName: 'Noites de Verão',
    duration: 245,
    coverImage: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    plays: 1250000,
    likes: 45000
  },
  {
    id: 's2',
    title: 'Horizonte',
    artistId: 'a1',
    artistName: 'Maria Santos',
    albumId: 'alb1',
    albumName: 'Noites de Verão',
    duration: 198,
    coverImage: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    plays: 980000,
    likes: 32000
  },
  {
    id: 's3',
    title: 'Flow Pesado',
    artistId: 'a2',
    artistName: 'Pedro Oliveira',
    albumId: 'alb2',
    albumName: 'Rimas da Quebrada',
    duration: 212,
    coverImage: 'https://images.unsplash.com/photo-1619983081563-430f63602796?w=300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    plays: 2100000,
    likes: 89000
  },
  {
    id: 's4',
    title: 'Midnight Drive',
    artistId: 'a3',
    artistName: 'Ana Costa',
    albumId: 'alb3',
    albumName: 'Synthwave Dreams',
    duration: 267,
    coverImage: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    plays: 1560000,
    likes: 62000
  },
  {
    id: 's5',
    title: 'Neon Lights',
    artistId: 'a3',
    artistName: 'Ana Costa',
    albumId: 'alb3',
    albumName: 'Synthwave Dreams',
    duration: 234,
    coverImage: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    plays: 1320000,
    likes: 54000
  },
  {
    id: 's6',
    title: 'Realidade',
    artistId: 'a2',
    artistName: 'Pedro Oliveira',
    albumId: 'alb2',
    albumName: 'Rimas da Quebrada',
    duration: 189,
    coverImage: 'https://images.unsplash.com/photo-1619983081563-430f63602796?w=300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    plays: 1890000,
    likes: 71000
  }
];

export const mockPlaylists = [
  {
    id: 'p1',
    name: 'Meus Favoritos',
    userId: '1',
    description: 'As músicas que mais escuto',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300',
    songs: ['s1', 's3', 's4'],
    isPublic: true
  },
  {
    id: 'p2',
    name: 'Treino Pesado',
    userId: '1',
    description: 'Para malhar com energia',
    coverImage: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=300',
    songs: ['s3', 's6'],
    isPublic: true
  }
];

export const mockStats = {
  artistId: 'a1',
  totalPlays: 5420000,
  monthlyListeners: 125000,
  followers: 45230,
  topSongs: [
    { songId: 's1', plays: 1250000 },
    { songId: 's2', plays: 980000 }
  ],
  playsByMonth: [
    { month: 'Jan', plays: 450000 },
    { month: 'Fev', plays: 520000 },
    { month: 'Mar', plays: 610000 },
    { month: 'Abr', plays: 680000 },
    { month: 'Mai', plays: 720000 },
    { month: 'Jun', plays: 850000 }
  ]
};

export const getFavoriteSongs = (userId) => {
  return mockSongs.slice(0, 3);
};

export const getPlaylistSongs = (playlistId) => {
  const playlist = mockPlaylists.find(p => p.id === playlistId);
  if (!playlist) return [];
  return mockSongs.filter(song => playlist.songs.includes(song.id));
};

export const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Cleanup helper: remove any demo artist/profile created with slug 'timbalada'
(() => {
  try {
    const demoSlug = 'timbalada';
    const ai = mockArtists.findIndex(a => a.id === demoSlug);
    if (ai !== -1) mockArtists.splice(ai, 1);

    const ui = mockUsers.findIndex(u => u.email === `${demoSlug}@example.com` || u.id === demoSlug || u.name === demoSlug);
    if (ui !== -1) mockUsers.splice(ui, 1);
  } catch (e) {
    // ignore
  }
})();

// Load persisted users/artists created at runtime (from localStorage)
(() => {
  try {
    if (typeof window === 'undefined') return;
    
    // Clear any session for hericlesbatera@gmail.com or Timbalada
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (currentUser && (currentUser.email === 'hericlesbatera@gmail.com' || currentUser.name === 'Timbalada')) {
        localStorage.removeItem('currentUser');
      }
    } catch (e) {}
    
    const persistedUsers = JSON.parse(localStorage.getItem('mockUsersPersist') || 'null');
    if (Array.isArray(persistedUsers)) {
      // Atualiza tipo para artista se nome for ferronaboneca
      persistedUsers.forEach(u => {
        // Exclui a conta ferronaboneca
        if (u.name === 'ferronaboneca') return;
        if (u.name === 'ferronaboneca') u.type = 'artist';
        const exists = mockUsers.find(mu => mu.id === u.id || mu.email === u.email);
        if (!exists && !(u.email === 'hericlesbatera@gmail.com' || u.name === 'Timbalada')) mockUsers.push(u);
      });
    }

    const persistedArtists = JSON.parse(localStorage.getItem('mockArtistsPersist') || 'null');
    if (Array.isArray(persistedArtists)) {
      // Remove artista ferronaboneca e timbalada
      const filtered = persistedArtists.filter(a => a.id !== 'timbalada' && a.name !== 'ferronaboneca');
      filtered.forEach(a => {
        const exists = mockArtists.find(ma => ma.id === a.id);
        if (!exists) mockArtists.push(a);
      });
    }

  } catch (e) {
    // ignore
  }
})();