import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockArtists, mockSongs, mockAlbums } from '../mock';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { Play, Heart, Users, Music, Disc } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from '../hooks/use-toast';

const ArtistPublicProfile = () => {
  const { id } = useParams();
  const { playSong } = usePlayer();
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

  const artist = mockArtists.find(a => a.id === id);
  const artistSongs = mockSongs.filter(s => s.artistId === id);
  const artistAlbums = mockAlbums.filter(a => a.artistId === id);

  if (!artist) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black text-xl">Artista não encontrado</p>
      </div>
    );
  }

  const handleFollow = () => {
    if (!user) {
      toast({
        title: 'Login Necessário',
        description: 'Faça login para seguir artistas',
        variant: 'destructive'
      });
      return;
    }
    setIsFollowing(!isFollowing);
    toast({
      title: isFollowing ? 'Deixou de seguir' : 'Seguindo',
      description: artist.name
    });
  };

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Artist Header */}
      <div className="relative">
        <div
          className="h-80 bg-cover bg-center"
          style={{
            backgroundImage: `url(${artist.coverImage})`,
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/50 to-black"></div>
        </div>
        
        <div className="relative -mt-32 max-w-7xl mx-auto px-4">
          <div className="flex items-end gap-6">
            <img
              src={artist.avatar}
              alt={artist.name}
              className="w-48 h-48 rounded-full border-4 border-white shadow-2xl"
            />
            <div className="pb-4">
              <h1 className="text-5xl font-bold text-white mb-2">{artist.name}</h1>
              <p className="text-white/90 text-lg mb-4">{artist.bio}</p>
              <div className="flex items-center gap-6 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{artist.followers?.toLocaleString()} seguidores</span>
                </div>
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  <span>{artist.monthlyListeners?.toLocaleString()} ouvintes mensais</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => {
                if (artistSongs.length > 0) {
                  playSong(artistSongs[0], artistSongs);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-8 h-12 rounded-full shadow-lg"
            >
              <Play className="w-5 h-5 mr-2 ml-1" fill="white" />
              Reproduzir
            </Button>
            <Button
              onClick={handleFollow}
              variant="outline"
              className={`px-6 h-12 rounded-full ${
                isFollowing
                  ? 'bg-gray-200 border-gray-300 text-gray-700'
                  : 'border-red-600 text-red-600 hover:bg-red-50'
              }`}
            >
              <Heart
                className={`w-5 h-5 mr-2 ${
                  isFollowing ? 'fill-current' : ''
                }`}
              />
              {isFollowing ? 'Seguindo' : 'Seguir'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Álbuns */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Disc className="w-7 h-7 text-red-600" />
            <h2 className="text-3xl font-bold text-black">Álbuns</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {artistAlbums.map((album) => (
              <Link
                key={album.id}
                to={`/${artist?.slug || id}/${album.slug || album.id}`}
                className="group cursor-pointer"
              >
                <div className="relative mb-3 overflow-hidden rounded-lg shadow-lg">
                  <img
                    src={album.coverImage}
                    alt={album.title}
                    className="w-full aspect-square object-cover transform group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                      <Play className="w-6 h-6 text-white ml-1" fill="white" />
                    </div>
                  </div>
                </div>
                <h3 className="text-black font-semibold mb-1 truncate group-hover:text-red-600 transition-colors">
                  {album.title}
                </h3>
                <p className="text-gray-600 text-sm">{album.releaseYear} • {album.songCount} músicas</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Músicas Populares */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Music className="w-7 h-7 text-red-600" />
            <h2 className="text-3xl font-bold text-black">Músicas Populares</h2>
          </div>
          <div className="space-y-2">
            {artistSongs.slice(0, 10).map((song, index) => (
              <div
                key={song.id}
                className="flex items-center gap-4 p-4 rounded-lg hover:bg-red-50 transition-colors group cursor-pointer"
                onClick={() => playSong(song, artistSongs)}
              >
                <span className="text-gray-600 w-8 text-center font-bold">{index + 1}</span>
                <img
                  src={song.coverImage}
                  alt={song.title}
                  className="w-14 h-14 rounded shadow"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-black font-semibold truncate">{song.title}</p>
                  <p className="text-gray-600 text-sm">{song.albumName}</p>
                </div>
                <p className="text-gray-600 text-sm">
                  {song.plays?.toLocaleString()} reproduções
                </p>
                <Button
                  className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play className="w-4 h-4 ml-0.5" fill="white" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ArtistPublicProfile;
