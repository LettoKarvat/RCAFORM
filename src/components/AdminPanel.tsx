import React, { useState, useEffect } from 'react';
import { LogOut, Download, Trash2, Search, Calendar, User, Hash, Radio, Clock, FileText, Edit, X, Save } from 'lucide-react';
import type { FormData } from '../types';

interface AdminPanelProps {
  onLogout: () => void;
  data: FormData[];
  onUpdateData: (updatedData: FormData[]) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout, data, onUpdateData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState<FormData[]>(data);
  const [sortBy, setSortBy] = useState<'timestamp' | 'codigoRca' | 'numeroPedido'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FormData>>({});

  const formasDisponiveis = [
    'midia da tv',
    'radio',
    'digital',
    'instagram',
    'facebook',
    'whatsapp',
    'indicação',
    'carro',
    'outros'
  ];

  useEffect(() => {
    let filtered = data.filter((item) =>
      item.codigoRca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.numeroPedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.forma.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.descricaoOutros && item.descricaoOutros.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort data
    filtered.sort((a, b) => {
      let aValue: string | number = a[sortBy];
      let bValue: string | number = b[sortBy];

      if (sortBy === 'timestamp') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredData(filtered);
  }, [data, searchTerm, sortBy, sortOrder]);

  const handleEdit = (item: FormData) => {
    setEditingId(item.id);
    setEditForm(item);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = () => {
    if (!editingId || !editForm.codigoRca || !editForm.numeroPedido || !editForm.forma) {
      alert('Todos os campos obrigatórios devem ser preenchidos');
      return;
    }

    if (editForm.forma === 'outros' && !editForm.descricaoOutros) {
      alert('Descrição é obrigatória quando "outros" é selecionado');
      return;
    }

    const updatedData = data.map(item => 
      item.id === editingId 
        ? { ...item, ...editForm, descricaoOutros: editForm.forma === 'outros' ? editForm.descricaoOutros : undefined }
        : item
    );
    
    onUpdateData(updatedData);
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = (id: string) => {
    const item = data.find(d => d.id === id);
    if (window.confirm(`Tem certeza que deseja excluir o registro do RCA ${item?.codigoRca}?`)) {
      const updatedData = data.filter(item => item.id !== id);
      onUpdateData(updatedData);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) {
      alert('Não há dados para exportar');
      return;
    }

    const headers = ['Data/Hora', 'Código RCA', 'Número Pedido', 'Forma', 'Descrição Outros'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        formatDate(item.timestamp),
        item.codigoRca,
        item.numeroPedido,
        item.forma,
        item.descricaoOutros || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `dados-rca-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearAllData = () => {
    if (window.confirm('Tem certeza que deseja excluir todos os dados? Esta ação não pode ser desfeita.')) {
      onUpdateData([]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <FileText className="w-8 h-8" />
                Painel Administrativo
              </h1>
              <p className="text-gray-300 mt-2">
                {data.length} {data.length === 1 ? 'registro encontrado' : 'registros encontrados'}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-lg"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </div>
        </div>

        <div className="p-8">
          {/* Controls */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as 'timestamp' | 'codigoRca' | 'numeroPedido');
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            >
              <option value="timestamp-desc">Mais Recentes</option>
              <option value="timestamp-asc">Mais Antigos</option>
              <option value="codigoRca-asc">Código RCA (A-Z)</option>
              <option value="codigoRca-desc">Código RCA (Z-A)</option>
              <option value="numeroPedido-asc">Nº Pedido (A-Z)</option>
              <option value="numeroPedido-desc">Nº Pedido (Z-A)</option>
            </select>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <Download className="w-5 h-5" />
                Exportar CSV
              </button>
              <button
                onClick={clearAllData}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Data Table */}
          {filteredData.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum dado disponível'}
              </h3>
              <p className="text-gray-500">
                {searchTerm ? 'Tente alterar os termos de busca' : 'Os dados aparecerão aqui após serem enviados pelo formulário'}
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Data/Hora
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Código RCA
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4" />
                          Nº Pedido
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        <div className="flex items-center gap-2">
                          <Radio className="w-4 h-4" />
                          Forma
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Descrição</th>
                     <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                       {editingId === item.id ? (
                         <>
                           <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                             {formatDate(item.timestamp)}
                           </td>
                           <td className="px-6 py-4">
                             <input
                               type="text"
                               value={editForm.codigoRca || ''}
                               onChange={(e) => setEditForm({...editForm, codigoRca: e.target.value})}
                               className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                             />
                           </td>
                           <td className="px-6 py-4">
                             <input
                               type="text"
                               value={editForm.numeroPedido || ''}
                               onChange={(e) => setEditForm({...editForm, numeroPedido: e.target.value})}
                               className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                             />
                           </td>
                           <td className="px-6 py-4">
                             <select
                               value={editForm.forma || ''}
                               onChange={(e) => setEditForm({...editForm, forma: e.target.value})}
                               className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                             >
                               <option value="">Selecione</option>
                               {formasDisponiveis.map((opcao) => (
                                 <option key={opcao} value={opcao}>
                                   {opcao.charAt(0).toUpperCase() + opcao.slice(1)}
                                 </option>
                               ))}
                             </select>
                           </td>
                           <td className="px-6 py-4">
                             {editForm.forma === 'outros' ? (
                               <input
                                 type="text"
                                 value={editForm.descricaoOutros || ''}
                                 onChange={(e) => setEditForm({...editForm, descricaoOutros: e.target.value})}
                                 className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                 placeholder="Descreva..."
                               />
                             ) : (
                               <span className="text-gray-400">-</span>
                             )}
                           </td>
                           <td className="px-6 py-4">
                             <div className="flex items-center justify-center gap-2">
                               <button
                                 onClick={handleSaveEdit}
                                 className="bg-green-600 hover:bg-green-700 text-white p-1.5 rounded transition-colors"
                                 title="Salvar"
                               >
                                 <Save className="w-4 h-4" />
                               </button>
                               <button
                                 onClick={handleCancelEdit}
                                 className="bg-gray-600 hover:bg-gray-700 text-white p-1.5 rounded transition-colors"
                                 title="Cancelar"
                               >
                                 <X className="w-4 h-4" />
                               </button>
                             </div>
                           </td>
                         </>
                       ) : (
                         <>
                           <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                             {formatDate(item.timestamp)}
                           </td>
                           <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                             {item.codigoRca}
                           </td>
                           <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                             {item.numeroPedido}
                           </td>
                           <td className="px-6 py-4 text-sm text-gray-900">
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                               {item.forma}
                             </span>
                           </td>
                           <td className="px-6 py-4 text-sm text-gray-900">
                             {item.descricaoOutros || '-'}
                           </td>
                           <td className="px-6 py-4">
                             <div className="flex items-center justify-center gap-2">
                               <button
                                 onClick={() => handleEdit(item)}
                                 className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded transition-colors"
                                 title="Editar"
                               >
                                 <Edit className="w-4 h-4" />
                               </button>
                               <button
                                 onClick={() => handleDelete(item.id)}
                                 className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded transition-colors"
                                 title="Excluir"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </div>
                           </td>
                         </>
                       )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;