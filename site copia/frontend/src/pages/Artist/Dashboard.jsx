import React from 'react';
import { mockStats, mockSongs } from '../../mock';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { TrendingUp, Users, Play, Music } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-red-950/20 to-black p-8">
      <h1 className="text-4xl font-bold text-white mb-8">Dashboard do Artista</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-zinc-900 border-red-900/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total de Reproduções
            </CardTitle>
            <Play className="w-5 h-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {mockStats.totalPlays.toLocaleString()}
            </div>
            <p className="text-xs text-green-500 mt-2 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12.5% este mês
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-red-900/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Ouvintes Mensais
            </CardTitle>
            <Users className="w-5 h-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {mockStats.monthlyListeners.toLocaleString()}
            </div>
            <p className="text-xs text-green-500 mt-2 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              +8.3% este mês
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-red-900/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Seguidores
            </CardTitle>
            <Users className="w-5 h-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {mockStats.followers.toLocaleString()}
            </div>
            <p className="text-xs text-green-500 mt-2 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              +5.7% este mês
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-red-900/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Músicas Publicadas
            </CardTitle>
            <Music className="w-5 h-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {mockSongs.filter(s => s.artistId === 'a1').length}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Em 2 álbuns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-zinc-900 border-red-900/20">
          <CardHeader>
            <CardTitle className="text-white">Reproduções por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockStats.playsByMonth.map((item, index) => {
                const maxPlays = Math.max(...mockStats.playsByMonth.map(p => p.plays));
                const percentage = (item.plays / maxPlays) * 100;
                return (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">{item.month}</span>
                      <span className="text-white">{item.plays.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-red-600 to-red-800 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-red-900/20">
          <CardHeader>
            <CardTitle className="text-white">Top Músicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockStats.topSongs.map((item, index) => {
                const song = mockSongs.find(s => s.id === item.songId);
                if (!song) return null;
                return (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-gray-400 text-lg font-bold w-6">{index + 1}</span>
                    <img
                      src={song.coverImage}
                      alt={song.title}
                      className="w-12 h-12 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{song.title}</p>
                      <p className="text-gray-400 text-sm">
                        {item.plays.toLocaleString()} reproduções
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-zinc-900 border-red-900/20">
        <CardHeader>
          <CardTitle className="text-white">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: 'Nova música adicionada', detail: '"Horizonte" foi publicada', time: 'Há 2 horas' },
              { action: 'Milestone alcançado', detail: '1M de reproduções em "Luz do Luar"', time: 'Há 5 horas' },
              { action: 'Novo seguidor', detail: '+1.2k novos seguidores hoje', time: 'Há 8 horas' },
              { action: 'Álbum destaque', detail: '"Noites de Verão" em alta', time: 'Há 1 dia' }
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-4 pb-4 border-b border-red-900/20 last:border-0">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="text-white font-medium">{activity.action}</p>
                  <p className="text-gray-400 text-sm">{activity.detail}</p>
                </div>
                <span className="text-gray-500 text-sm">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;