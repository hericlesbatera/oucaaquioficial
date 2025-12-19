import React from 'react';
import { mockSongs, mockAlbums, formatDuration } from '../mock';
import { usePlayer } from '../context/PlayerContext';
import { Play, Heart, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const Library = () => {
  const { playSong } = usePlayer();

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-red-950/20 to-black p-8">
      <h1 className="text-4xl font-bold text-white mb-8">Sua Biblioteca</h1>

      <Tabs defaultValue="songs" className="w-full">
        <TabsList className="bg-zinc-900 border-red-900/30 mb-6">
          <TabsTrigger value="songs" className="data-[state=active]:bg-red-600">
            Músicas
          </TabsTrigger>
          <TabsTrigger value="albums" className="data-[state=active]:bg-red-600">
            Álbuns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="songs">
          <div className="bg-zinc-900/50 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-48 h-48 bg-gradient-to-br from-red-600 to-red-900 rounded-lg flex items-center justify-center">
                <Heart className="w-20 h-20 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">PLAYLIST</p>
                <h2 className="text-5xl font-bold text-white mb-4">Músicas Curtidas</h2>
                <p className="text-gray-400">{mockSongs.length} músicas</p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-4 px-4 py-2 text-gray-400 text-sm border-b border-red-900/30">
                <span className="w-8">#</span>
                <span className="flex-1">TÍTULO</span>
                <span className="w-32">REPRODUÇÕES</span>
                <Clock className="w-5 h-5" />
              </div>
              {mockSongs.map((song, index) => (
                <div
                  key={song.id}
                  className="flex items-center gap-4 px-4 py-3 rounded hover:bg-red-900/20 transition-colors group cursor-pointer"
                  onClick={() => playSong(song, mockSongs)}
                >
                  <span className="text-gray-400 w-8">{index + 1}</span>
                  <img
                    src={song.coverImage}
                    alt={song.title}
                    className="w-12 h-12 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{song.title}</p>
                    <p className="text-gray-400 text-sm truncate">{song.artistName}</p>
                  </div>
                  <span className="text-gray-400 text-sm w-32">
                    {song.plays?.toLocaleString()}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {formatDuration(song.duration)}
                  </span>
                  <Button
                    className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play className="w-4 h-4 ml-0.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="albums">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {mockAlbums.map((album) => (
              <Card
                key={album.id}
                className="bg-zinc-900 border-red-900/20 p-4 hover:bg-zinc-800 transition-colors cursor-pointer group"
              >
                <div className="relative mb-4">
                  <img
                    src={album.coverImage}
                    alt={album.title}
                    className="w-full aspect-square object-cover rounded-md"
                  />
                  <Button
                    onClick={() => {
                      const albumSongs = mockSongs.filter(s => s.albumId === album.id);
                      if (albumSongs.length > 0) {
                        playSong(albumSongs[0], albumSongs);
                      }
                    }}
                    className="absolute bottom-2 right-2 w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play className="w-5 h-5 ml-0.5" />
                  </Button>
                </div>
                <h3 className="text-white font-semibold mb-1 truncate">{album.title}</h3>
                <p className="text-gray-400 text-sm truncate">{album.artistName}</p>
                <p className="text-gray-500 text-xs mt-1">{album.songCount} músicas</p>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Library;