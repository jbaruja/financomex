import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/common/Modal';
import { useToast } from '../../contexts/ToastContext';
import type { Client, ClientInput } from '../../types/database';
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  checkClientCodeExists,
} from '../../services/clientService';

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientInput>({
    code: '',
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    balance: 0,
    active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [balanceDisplay, setBalanceDisplay] = useState('0,00');
  const { showToast } = useToast();

  // Formatar valor para exibição
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Converter string formatada para número
  const parseCurrency = (value: string): number => {
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  // Handler para input de saldo
  const handleBalanceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleaned = value.replace(/[^\d,]/g, '');
    const parts = cleaned.split(',');
    let formatted = parts[0];

    if (parts.length > 1) {
      formatted = parts[0] + ',' + parts[1].slice(0, 2);
    }

    setBalanceDisplay(formatted);
    const numericValue = parseCurrency(formatted);
    setFormData({ ...formData, balance: numericValue });
  };

  // Carregar clientes
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await getClients();
      setClients(data);
    } catch (error: any) {
      showToast(error.message || 'Erro ao carregar clientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal para visualizar
  const handleView = (client: Client) => {
    setViewingClient(client);
    setIsViewModalOpen(true);
  };

  // Abrir modal para criar
  const handleCreate = () => {
    setEditingClient(null);
    setFormData({
      code: '',
      name: '',
      cnpj: '',
      email: '',
      phone: '',
      balance: 0,
      active: true,
    });
    setBalanceDisplay('0,00');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleEdit = (client: Client) => {
    setEditingClient(client);
    const balance = client.balance || 0;
    setFormData({
      code: client.code,
      name: client.name,
      cnpj: client.cnpj || '',
      email: client.email || '',
      phone: client.phone || '',
      balance: balance,
      active: client.active,
    });
    setBalanceDisplay(formatCurrency(balance));
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Excluir cliente
  const handleDelete = async (client: Client) => {
    if (!confirm(`Deseja realmente excluir o cliente "${client.name}"?`)) {
      return;
    }

    try {
      await deleteClient(client.id);
      showToast('Cliente excluído com sucesso!', 'success');
      loadClients();
    } catch (error: any) {
      showToast(error.message || 'Erro ao excluir cliente', 'error');
    }
  };

  // Validar formulário
  const validateForm = async (): Promise<boolean> => {
    const errors: Record<string, string> = {};

    if (!formData.code.trim()) {
      errors.code = 'Código é obrigatório';
    } else if (formData.code.length !== 4) {
      errors.code = 'Código deve ter exatamente 4 caracteres';
    } else {
      const exists = await checkClientCodeExists(
        formData.code,
        editingClient?.id
      );
      if (exists) {
        errors.code = 'Este código já está em uso';
      }
    }

    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }

    if (formData.email && !formData.email.includes('@')) {
      errors.email = 'Email inválido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submeter formulário
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!(await validateForm())) {
      return;
    }

    setSubmitting(true);

    try {
      if (editingClient) {
        await updateClient(editingClient.id, formData);
        showToast('Cliente atualizado com sucesso!', 'success');
      } else {
        await createClient(formData);
        showToast('Cliente cadastrado com sucesso!', 'success');
      }
      setIsModalOpen(false);
      loadClients();
    } catch (error: any) {
      showToast(error.message || 'Erro ao salvar cliente', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Colunas da tabela
  const columns: Column<Client>[] = [
    {
      key: 'code',
      label: 'Código',
      render: (client) => (
        <span className="font-mono font-semibold">{client.code}</span>
      ),
    },
    {
      key: 'name',
      label: 'Nome',
    },
    {
      key: 'balance',
      label: 'Saldo',
      render: (client) => (
        <span className="font-mono font-semibold text-green-700">
          R$ {client.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
        </span>
      ),
    },
    {
      key: 'active',
      label: 'Status',
      render: (client) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            client.active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {client.active ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="mt-1 text-sm text-gray-600">
            
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Novo Cliente
        </button>
      </div>

      {/* Tabela com botão Ver customizado */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.label}
                  </th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                    <p className="mt-4 text-gray-600">Carregando...</p>
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-12 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <p className="mt-4 text-gray-600">Nenhum cliente cadastrado</p>
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    {columns.map((column) => (
                      <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {column.render
                          ? column.render(client)
                          : (client as any)[column.key]?.toString() || '-'}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {/* Botão Ver */}
                        <button
                          onClick={() => handleView(client)}
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                          title="Ver detalhes"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                        {/* Botão Extrato */}
                        <button
                          onClick={() => navigate(`/clientes/${client.id}`)}
                          className="text-purple-600 hover:text-purple-900 transition-colors"
                          title="Ver extrato"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </button>
                        {/* Botão Editar */}
                        <button
                          onClick={() => handleEdit(client)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Editar"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        {/* Botão Excluir */}
                        <button
                          onClick={() => handleDelete(client)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Excluir"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Visualização (Read-only) */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detalhes do Cliente"
      >
        {viewingClient && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Código</label>
                <p className="text-base font-semibold font-mono">{viewingClient.code}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    viewingClient.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {viewingClient.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Nome</label>
              <p className="text-base font-semibold">{viewingClient.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Saldo</label>
              <p className="text-2xl font-bold text-green-700 font-mono">
                R$ {formatCurrency(viewingClient.balance || 0)}
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Informações Adicionais</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">CNPJ</label>
                  <p className="text-base">{viewingClient.cnpj || '-'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  <p className="text-base">{viewingClient.email || '-'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Telefone</label>
                  <p className="text-base">{viewingClient.phone || '-'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Formulário (Criar/Editar) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? 'Editar Cliente' : 'Novo Cliente'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Código */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              maxLength={4}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                formErrors.code ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: 0058"
            />
            {formErrors.code && (
              <p className="mt-1 text-sm text-red-500">{formErrors.code}</p>
            )}
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                formErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nome do cliente"
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
            )}
          </div>

          {/* Saldo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Saldo Depositado
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                R$
              </span>
              <input
                type="text"
                value={balanceDisplay}
                onChange={handleBalanceChange}
                onBlur={() => {
                  setBalanceDisplay(formatCurrency(formData.balance || 0));
                }}
                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                placeholder="0,00"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Saldo depositado pelo cliente
            </p>
          </div>

          {/* CNPJ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CNPJ
            </label>
            <input
              type="text"
              value={formData.cnpj}
              onChange={(e) =>
                setFormData({ ...formData, cnpj: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="00.000.000/0000-00"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                formErrors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="email@exemplo.com"
            />
            {formErrors.email && (
              <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="(00) 00000-0000"
            />
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) =>
                setFormData({ ...formData, active: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="active" className="text-sm font-medium text-gray-700">
              Cliente ativo
            </label>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {submitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
