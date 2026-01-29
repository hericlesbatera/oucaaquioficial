import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../hooks/use-toast';
import { Eye, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

const ReportsManager = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('copyright_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Erro ao carregar denúncias:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as denúncias',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const openReport = (report) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || '');
    setShowDetail(true);
  };

  const saveAdminNotes = async () => {
    if (!selectedReport) return;

    try {
      setSavingNotes(true);
      const { error } = await supabase
        .from('copyright_reports')
        .update({ admin_notes: adminNotes })
        .eq('id', selectedReport.id);

      if (error) throw error;

      setSelectedReport({ ...selectedReport, admin_notes: adminNotes });
      setReports(reports.map(r =>
        r.id === selectedReport.id ? { ...r, admin_notes: adminNotes } : r
      ));

      toast({
        title: 'Anotações salvas',
        description: 'As notas foram atualizadas com sucesso'
      });
    } catch (error) {
      console.error('Erro ao salvar notas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as notas',
        variant: 'destructive'
      });
    } finally {
      setSavingNotes(false);
    }
  };

  const updateStatus = async (reportId, newStatus) => {
    try {
      const { error } = await supabase
        .from('copyright_reports')
        .update({ status: newStatus })
        .eq('id', reportId);

      if (error) throw error;

      setReports(reports.map(r =>
        r.id === reportId ? { ...r, status: newStatus } : r
      ));

      if (selectedReport?.id === reportId) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }

      toast({
        title: 'Status atualizado',
        description: `Denúncia marcada como ${newStatus}`
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status',
        variant: 'destructive'
      });
    }
  };

  const deleteReport = async (reportId) => {
    if (!window.confirm('Tem certeza que deseja deletar esta denúncia?')) return;

    try {
      const { error } = await supabase
        .from('copyright_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      setReports(reports.filter(r => r.id !== reportId));
      setShowDetail(false);

      toast({
        title: 'Denúncia removida',
        description: 'A denúncia foi deletada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao deletar denúncia:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar a denúncia',
        variant: 'destructive'
      });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'reviewed':
        return <Eye className="w-4 h-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'reviewed':
        return 'Revisado';
      case 'resolved':
        return 'Resolvido';
      default:
        return status;
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Denúncias de Conteúdo</h1>
        <div className="flex gap-2">
          {['all', 'pending', 'reviewed', 'resolved'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status === 'all' ? 'Todas' : getStatusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <p className="text-gray-500">Nenhuma denúncia encontrada</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Solicitante</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Proprietário</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Data</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{report.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{report.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{report.copyright_holder}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(report.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(report.status)}`}>
                        {getStatusIcon(report.status)}
                        {getStatusLabel(report.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => openReport(report)}
                        className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </button>
                      <button
                        onClick={() => deleteReport(report.id)}
                        className="text-red-600 hover:text-red-800 font-medium inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Deletar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Denúncia</DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              {/* Informações do Solicitante */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900">Informações do Solicitante</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Nome</p>
                    <p className="font-medium text-gray-900">{selectedReport.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedReport.email}</p>
                  </div>
                  {selectedReport.phone && (
                    <div>
                      <p className="text-gray-600">Telefone</p>
                      <p className="font-medium text-gray-900">{selectedReport.phone}</p>
                    </div>
                  )}
                  {selectedReport.mobile && (
                    <div>
                      <p className="text-gray-600">Celular</p>
                      <p className="font-medium text-gray-900">{selectedReport.mobile}</p>
                    </div>
                  )}
                  {selectedReport.address && (
                    <div className="col-span-2">
                      <p className="text-gray-600">Endereço</p>
                      <p className="font-medium text-gray-900">{selectedReport.address}</p>
                    </div>
                  )}
                  {selectedReport.is_representative && (
                    <div className="col-span-2">
                      <p className="text-blue-600 font-medium">⚖️ Este é um representante legal</p>
                      {selectedReport.cnpj && <p className="text-gray-600">CNPJ: {selectedReport.cnpj}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Informações do Conteúdo */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900">Conteúdo Protegido</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-gray-600 font-medium">Descrição</p>
                    <p className="text-gray-900 whitespace-pre-wrap mt-1">{selectedReport.protected_content}</p>
                  </div>
                  {selectedReport.content_url && (
                    <div>
                      <p className="text-gray-600 font-medium">URL do Conteúdo</p>
                      <a
                        href={selectedReport.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all mt-1"
                      >
                        {selectedReport.content_url}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações de Copyright */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900">Direitos Autorais</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-gray-600 font-medium">Proprietário</p>
                    <p className="text-gray-900 mt-1">{selectedReport.copyright_holder}</p>
                  </div>
                  {selectedReport.proof_of_ownership && (
                    <div>
                      <p className="text-gray-600 font-medium">Prova de Propriedade</p>
                      <p className="text-gray-900 whitespace-pre-wrap mt-1">{selectedReport.proof_of_ownership}</p>
                    </div>
                  )}
                  {selectedReport.additional_info && (
                    <div>
                      <p className="text-gray-600 font-medium">Informações Adicionais</p>
                      <p className="text-gray-900 whitespace-pre-wrap mt-1">{selectedReport.additional_info}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Anotações Admin */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Anotações Administrativas</h3>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Adicione notas sobre esta denúncia..."
                  rows={4}
                  className="w-full"
                />
                <Button
                  onClick={saveAdminNotes}
                  disabled={savingNotes}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {savingNotes ? 'Salvando...' : 'Salvar Anotações'}
                </Button>
              </div>

              {/* Atualizar Status */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-semibold text-gray-900">Status</h3>
                <div className="flex gap-2">
                  {['pending', 'reviewed', 'resolved'].map((status) => (
                    <Button
                      key={status}
                      onClick={() => updateStatus(selectedReport.id, status)}
                      variant={selectedReport.status === status ? 'default' : 'outline'}
                      className={selectedReport.status === status ? 'bg-red-600' : ''}
                    >
                      {getStatusLabel(status)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Deletar */}
              <div className="border-t pt-4">
                <Button
                  onClick={() => deleteReport(selectedReport.id)}
                  className="bg-red-600 hover:bg-red-700 text-white w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deletar Denúncia
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsManager;
