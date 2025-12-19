import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BarChart3, ChevronDown, Loader2, Music } from 'lucide-react';
import ArtistSidebar from '../../components/Artist/ArtistSidebar';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const DashboardNew = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('geral');
  const [period, setPeriod] = useState('7');
  const [dataType, setDataType] = useState('plays');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ plays: 0, downloads: 0 });
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showDataTypeDropdown, setShowDataTypeDropdown] = useState(false);

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const formattedToday = today.toLocaleDateString('pt-BR');
  const formattedYesterday = yesterday.toLocaleDateString('pt-BR');

  useEffect(() => {
    loadData();
  }, [user?.id, activeTab, period, selectedAlbum]);

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // Buscar álbuns do artista
      const { data: albumsData } = await supabase
        .from('albums')
        .select('*')
        .eq('artist_id', user.id)
        .order('created_at', { ascending: false });

      setAlbums(albumsData || []);

      // Buscar músicas
      let songsQuery = supabase
        .from('songs')
        .select('id, plays, downloads, created_at')
        .eq('artist_id', user.id);

      if (activeTab === 'cds' && selectedAlbum) {
        songsQuery = songsQuery.eq('album_id', selectedAlbum);
      }

      const { data: songs } = await songsQuery;

      // Calcular totais
      const totalPlays = (songs || []).reduce((sum, s) => sum + (s.plays || 0), 0);
      const totalDownloads = (songs || []).reduce((sum, s) => sum + (s.downloads || 0), 0);
      setStats({ plays: totalPlays, downloads: totalDownloads });

      // Gerar dados do gráfico baseado no período
      const days = parseInt(period);
      const data = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        data.push({
          date: dayStr,
          plays: 0,
          downloads: 0
        });
      }
      setChartData(data);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'geral', label: 'GERAL' },
    { id: 'cds', label: 'CDS/SINGLES' },
    { id: 'playlists', label: 'PLAYLISTS' }
  ];

  const periods = [
    { value: '7', label: 'Últimos 7 dias' },
    { value: '14', label: 'Últimos 14 dias' },
    { value: '30', label: 'Últimos 30 dias' }
  ];

  const maxValue = Math.max(...chartData.map(d => dataType === 'plays' ? d.plays : d.downloads), 1);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ArtistSidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Estatísticas</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {tabs.map(tab => (
              <Button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedAlbum(null);
                }}
                className={`rounded-full px-6 ${
                  activeTab === tab.id
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-white border border-red-600 text-red-600 hover:bg-red-50'
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Album List (CDS/SINGLES tab) */}
          {activeTab === 'cds' && (
            <Card className="mb-6 border-red-200">
              <CardContent className="p-0">
                {loading && albums.length === 0 ? (
                  <div className="p-4 flex items-center gap-2 text-red-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Carregando...
                  </div>
                ) : albums.length === 0 ? (
                  <div className="p-4 text-gray-500">Nenhum álbum encontrado</div>
                ) : (
                  albums.map(album => (
                    <div
                      key={album.id}
                      onClick={() => setSelectedAlbum(selectedAlbum === album.id ? null : album.id)}
                      className={`flex items-center gap-4 p-4 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                        selectedAlbum === album.id ? 'bg-red-50' : ''
                      }`}
                    >
                      <img
                        src={album.cover_url || '/placeholder-album.jpg'}
                        alt={album.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-red-600">{album.title}</p>
                        <p className="text-sm text-gray-500">
                          Enviado: {new Date(album.created_at).toLocaleDateString('pt-BR')} às {new Date(album.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-red-400 transition-transform ${selectedAlbum === album.id ? 'rotate-180' : ''}`} />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Playlists tab */}
          {activeTab === 'playlists' && (
            <Card className="mb-6 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando...
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Card */}
          <Card className="border-gray-200">
            <CardContent className="p-6">
              {/* Period Filter */}
              <div className="flex justify-end mb-4">
                <div className="relative">
                  <Button
                    variant="outline"
                    onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                    className="flex items-center gap-2"
                  >
                    {periods.find(p => p.value === period)?.label}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  {showPeriodDropdown && (
                    <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-10 min-w-[160px]">
                      {periods.map(p => (
                        <div
                          key={p.value}
                          onClick={() => {
                            setPeriod(p.value);
                            setShowPeriodDropdown(false);
                          }}
                          className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${period === p.value ? 'bg-blue-50 text-blue-600' : ''}`}
                        >
                          {p.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Info text */}
              {activeTab === 'cds' && (
                <p className="text-sm text-gray-500 mb-2">
                  * CDs lançados na data de hoje (<span className="font-medium">{formattedToday}</span>) não estão contabilizados abaixo.
                </p>
              )}
              <p className="text-sm text-gray-500 mb-1">
                * Dados atualizados até o dia (<span className="font-medium">{formattedYesterday}</span>)
              </p>
              <p className="text-sm text-gray-500 mb-6">
                ** O carregamento pode demorar entre <span className="font-medium">20-30 segundos</span>
              </p>

              {/* Stats Row */}
              <div className="flex items-center gap-8 mb-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">PLAYS</p>
                  <p className="text-2xl font-bold text-red-600">{stats.plays.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">DOWNLOADS</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.downloads.toLocaleString('pt-BR')}</p>
                </div>
                <div className="flex-1" />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Dados por filtro:</span>
                  <div className="relative">
                    <Button
                      variant="outline"
                      onClick={() => setShowDataTypeDropdown(!showDataTypeDropdown)}
                      className="flex items-center gap-2"
                    >
                      {dataType === 'plays' ? 'PLAYS' : 'DOWNLOADS'}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    {showDataTypeDropdown && (
                      <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-10 min-w-[120px]">
                        <div
                          onClick={() => { setDataType('plays'); setShowDataTypeDropdown(false); }}
                          className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${dataType === 'plays' ? 'bg-blue-50 text-blue-600' : ''}`}
                        >
                          PLAYS
                        </div>
                        <div
                          onClick={() => { setDataType('downloads'); setShowDataTypeDropdown(false); }}
                          className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${dataType === 'downloads' ? 'bg-blue-50 text-blue-600' : ''}`}
                        >
                          DOWNLOADS
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="relative h-64 border-l border-b border-gray-300">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600" />
                        <Music className="w-6 h-6 text-red-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {[0, 1, 2, 3, 4].map(i => (
                        <div key={i} className="border-t border-gray-100 w-full" />
                      ))}
                    </div>

                    {/* Chart bars/line */}
                    <div className="absolute inset-0 flex items-end justify-around px-2">
                      {chartData.map((d, i) => {
                        const value = dataType === 'plays' ? d.plays : d.downloads;
                        const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                        return (
                          <div key={i} className="flex flex-col items-center flex-1">
                            <div
                              className="w-2 bg-blue-500 rounded-t transition-all"
                              style={{ height: `${Math.max(height, 2)}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Line connecting points */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                      <polyline
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        points={chartData.map((d, i) => {
                          const value = dataType === 'plays' ? d.plays : d.downloads;
                          const x = ((i + 0.5) / chartData.length) * 100;
                          const y = 100 - (maxValue > 0 ? (value / maxValue) * 100 : 0);
                          return `${x}%,${y}%`;
                        }).join(' ')}
                      />
                      {chartData.map((d, i) => {
                        const value = dataType === 'plays' ? d.plays : d.downloads;
                        const x = ((i + 0.5) / chartData.length) * 100;
                        const y = 100 - (maxValue > 0 ? (value / maxValue) * 100 : 0);
                        return (
                          <circle
                            key={i}
                            cx={`${x}%`}
                            cy={`${y}%`}
                            r="4"
                            fill="#3b82f6"
                          />
                        );
                      })}
                    </svg>
                  </>
                )}
              </div>

              {/* X-axis labels */}
              <div className="flex justify-around mt-2 text-xs text-gray-500">
                {chartData.map((d, i) => (
                  <span key={i}>{d.date}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardNew;
