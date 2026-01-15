import { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react';
import DataTable from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { useToast } from '../../contexts/ToastContext';
import type { ProcessWithRelations, ProcessInput, Client, Importer, ClientInput } from '../../types/database';
import {
  getProcesses,
  createProcess,
  updateProcess,
  deleteProcess,
  finalizeProcess,
  billProcess,
  validateReference,
  findClientByReference,
  searchProcesses,
} from '../../services/processService';
import { getClients, createClient } from '../../services/clientService';
import { getImporters } from '../../services/importerService';

export default function Processes() {
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const [processes, setProcesses] = useState<ProcessWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<ProcessWithRelations | null>(null);
  const [viewingProcess, setViewingProcess] = useState<ProcessWithRelations | null>(null);
  const [formData, setFormData] = useState<ProcessInput>({
    reference: '',
    client_id: '',
    importer_id: '',
    status: 'open',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [suggestedClient, setSuggestedClient] = useState<Client | null>(null);
  const [clientNotFound, setClientNotFound] = useState<string | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientFormData, setClientFormData] = useState<ClientInput>({
    code: '',
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    balance: 0,
    active: true,
  });
  const [clientFormErrors, setClientFormErrors] = useState<Record<string, string>>({});
  const [clientSubmitting, setClientSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [importers, setImporters] = useState<Importer[]>([]);
  const { showToast } = useToast();

  // Filtros
  const [filters, setFilters] = useState({
    clientId: '',
    status: '',
    reference: '',
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  // Debug: Log quando modal abre
  useEffect(() => {
    if (isModalOpen) {
      console.log('Modal aberto - FormData:', formData);
      console.log('Modal aberto - SuggestedClient:', suggestedClient);
      console.log('Modal aberto - Clientes array:', clients.length, clients);
      console.log('Modal aberto - Importers array:', importers.length, importers);
    }
  }, [isModalOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [processesData, clientsData, importersData] = await Promise.all([
        getProcesses(),
        getClients(),
        getImporters(),
      ]);
      setProcesses(processesData);
      setClients(clientsData);
      setImporters(importersData);
      console.log('Dados carregados:', {
        processos: processesData.length,
        clientes: clientsData.length,
        importadoras: importersData.length
      });
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      showToast(error.message || 'Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  const applyFilters = async () => {
    try {
      setLoading(true);
      const filtered = await searchProcesses({
        clientId: filters.clientId || undefined,
        status: filters.status || undefined,
        reference: filters.reference || undefined,
      });
      setProcesses(filtered);
    } catch (error: any) {
      showToast(error.message || 'Erro ao filtrar processos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      clientId: '',
      status: '',
      reference: '',
    });
    loadData();
  };

  // Formatar referência automaticamente (XXXX.XXX.XXXX.XX)
  const formatReference = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');

    // Aplica a formatação
    if (numbers.length <= 4) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 4)}.${numbers.slice(4)}`;
    } else if (numbers.length <= 11) {
      return `${numbers.slice(0, 4)}.${numbers.slice(4, 7)}.${numbers.slice(7)}`;
    } else {
      return `${numbers.slice(0, 4)}.${numbers.slice(4, 7)}.${numbers.slice(7, 11)}.${numbers.slice(11, 13)}`;
    }
  };

  // Handler para mudança na referência
  const handleReferenceChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const rawValue = input.value;
    const cursorPosition = input.selectionStart || 0;

    // Salvar valor anterior para comparação
    const previousValue = formData.reference;

    // Aplicar formatação automática
    const formattedValue = formatReference(rawValue);

    // Calcular nova posição do cursor
    // Contar quantos pontos existem antes da posição do cursor no valor anterior e no novo
    const previousDots = (previousValue.substring(0, cursorPosition).match(/\./g) || []).length;
    const newDots = (formattedValue.substring(0, cursorPosition).match(/\./g) || []).length;

    // Ajustar posição do cursor considerando pontos adicionados/removidos
    let newCursorPosition = cursorPosition + (newDots - previousDots);

    // Se o cursor estava imediatamente antes de um ponto e um ponto foi adicionado, mover para depois do ponto
    if (formattedValue[newCursorPosition] === '.') {
      newCursorPosition++;
    }

    // Atualizar o campo
    setFormData(prev => ({ ...prev, reference: formattedValue }));

    // Restaurar posição do cursor após o React renderizar
    setTimeout(() => {
      if (referenceInputRef.current) {
        referenceInputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);

    // Limpar mensagens de erro e sugestões anteriores
    setClientNotFound(null);
    if (suggestedClient) {
      setSuggestedClient(null);
      setFormData(prev => ({ ...prev, client_id: '' }));
    }

    // Limpar erro de formato enquanto digita
    const newErrors = { ...formErrors };
    delete newErrors.reference;
    setFormErrors(newErrors);

    // Se referência estiver completa, buscar cliente
    if (validateReference(formattedValue)) {
      try {
        const client = await findClientByReference(formattedValue);
        if (client) {
          setSuggestedClient(client);
          setFormData(prev => ({ ...prev, client_id: client.id }));
          console.log('Cliente identificado:', client.code, client.name);
        } else {
          // Cliente não encontrado - mostrar opção de cadastrar
          setClientNotFound(formattedValue.substring(0, 4));
        }
      } catch (error: any) {
        console.error('Erro ao buscar cliente:', error);
      }
    }
  };

  // Validar referência ao sair do campo (onBlur)
  const handleReferenceBlur = () => {
    const value = formData.reference;
    if (value.length > 0 && !validateReference(value)) {
      setFormErrors(prev => ({
        ...prev,
        reference: 'Formato inválido. Use XXXX.XXX.XXXX.XX'
      }));
    }
  };

  // Handler para quando o usuário cola conteúdo
  const handleReferencePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedValue = e.clipboardData.getData('text');
    const formattedValue = formatReference(pastedValue);

    // Validar imediatamente ao colar
    if (formattedValue.length > 0 && !validateReference(formattedValue)) {
      setTimeout(() => {
        setFormErrors(prev => ({
          ...prev,
          reference: 'Formato inválido. Use XXXX.XXX.XXXX.XX'
        }));
      }, 100);
    }
  };

  // Abrir modal para criar
  const handleCreate = () => {
    console.log('Abrindo modal - Clientes disponíveis:', clients.length);
    console.log('Abrindo modal - Importadoras disponíveis:', importers.length);

    // Verificar se os dados foram carregados
    if (clients.length === 0 || importers.length === 0) {
      showToast('Aguarde, carregando dados...', 'warning');
      return;
    }

    setEditingProcess(null);
    setFormData({
      reference: '',
      client_id: '',
      importer_id: '',
      status: 'open',
    });
    setSuggestedClient(null);
    setClientNotFound(null);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Abrir modal para criar novo cliente
  const handleCreateClient = () => {
    setClientFormData({
      code: clientNotFound || '',
      name: '',
      cnpj: '',
      email: '',
      phone: '',
      balance: 0,
      active: true,
    });
    setClientFormErrors({});
    setIsClientModalOpen(true);
  };

  // Validar formulário de cliente
  const validateClientForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!clientFormData.code.trim()) {
      errors.code = 'Código é obrigatório';
    }

    if (!clientFormData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }

    setClientFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submeter formulário de novo cliente
  const handleSubmitClient = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateClientForm()) {
      return;
    }

    setClientSubmitting(true);

    try {
      const newClient = await createClient(clientFormData);
      showToast('Cliente cadastrado com sucesso!', 'success');

      // Recarregar lista de clientes
      const updatedClients = await getClients();
      setClients(updatedClients);

      // Selecionar automaticamente o novo cliente
      setSuggestedClient(newClient);
      setFormData(prev => ({ ...prev, client_id: newClient.id }));
      setClientNotFound(null);

      // Fechar modal de cliente
      setIsClientModalOpen(false);
    } catch (error: any) {
      showToast(error.message || 'Erro ao cadastrar cliente', 'error');
    } finally {
      setClientSubmitting(false);
    }
  };

  // Abrir modal para editar
  const handleEdit = (process: ProcessWithRelations) => {
    setEditingProcess(process);
    setFormData({
      reference: process.reference,
      client_id: process.client_id,
      importer_id: process.importer_id || '',
      status: process.status,
    });
    setSuggestedClient(process.client || null);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Visualizar processo
  const handleView = (process: ProcessWithRelations) => {
    setViewingProcess(process);
    setIsViewModalOpen(true);
  };

  // Excluir processo
  const handleDelete = async (process: ProcessWithRelations) => {
    if (!confirm(`Deseja realmente excluir o processo "${process.reference}"?`)) {
      return;
    }

    try {
      await deleteProcess(process.id);
      showToast('Processo excluído com sucesso!', 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erro ao excluir processo', 'error');
    }
  };

  // Finalizar processo
  const handleFinalize = async (process: ProcessWithRelations) => {
    if (!confirm(`Deseja finalizar o processo "${process.reference}"?`)) {
      return;
    }

    try {
      await finalizeProcess(process.id);
      showToast('Processo finalizado com sucesso!', 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erro ao finalizar processo', 'error');
    }
  };

  // Faturar processo
  const handleBill = async (process: ProcessWithRelations) => {
    if (!confirm(`Deseja faturar o processo "${process.reference}"?`)) {
      return;
    }

    try {
      await billProcess(process.id);
      showToast('Processo faturado com sucesso!', 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erro ao faturar processo', 'error');
    }
  };

  // Validar formulário
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.reference.trim()) {
      errors.reference = 'Referência é obrigatória';
    } else if (!validateReference(formData.reference)) {
      errors.reference = 'Formato inválido. Use XXXX.XXX.XXXX.XX';
    }

    if (!formData.client_id) {
      errors.client_id = 'Cliente é obrigatório';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submeter formulário
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      if (editingProcess) {
        await updateProcess(editingProcess.id, formData);
        showToast('Processo atualizado com sucesso!', 'success');
      } else {
        await createProcess(formData);
        showToast('Processo cadastrado com sucesso!', 'success');
      }
      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erro ao salvar processo', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Função para obter badge de status
  const getStatusBadge = (status: string) => {
    const badges = {
      open: { label: 'Aberto', className: 'bg-blue-100 text-blue-800' },
      finalized: { label: 'Finalizado', className: 'bg-green-100 text-green-800' },
      billed: { label: 'Faturado', className: 'bg-purple-100 text-purple-800' },
    };
    const badge = badges[status as keyof typeof badges] || badges.open;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  // Colunas da tabela
  const columns: Column<ProcessWithRelations>[] = [
    {
      key: 'reference',
      label: 'Referência',
      render: (process) => (
        <span className="font-mono font-semibold">{process.reference}</span>
      ),
    },
    {
      key: 'client',
      label: 'Cliente',
      render: (process) => (
        <div>
          <div className="font-semibold">{process.client?.name || '-'}</div>
          <div className="text-xs text-gray-500">{process.client?.code || '-'}</div>
        </div>
      ),
    },
    {
      key: 'importer',
      label: 'Importadora',
      render: (process) => process.importer?.name || '-',
    },
    {
      key: 'status',
      label: 'Status',
      render: (process) => getStatusBadge(process.status),
    },
    {
      key: 'created_at',
      label: 'Data Criação',
      render: (process) => new Date(process.created_at).toLocaleDateString('pt-BR'),
    },
  ];

  // Ações customizadas
  const customActions = (process: ProcessWithRelations) => (
    <div className="flex items-center justify-center gap-2">
      {/* Botão Ver */}
      <button
        onClick={() => handleView(process)}
        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Ver detalhes"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Botão Finalizar */}
      {process.status === 'open' && (
        <button
          onClick={() => handleFinalize(process)}
          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          title="Finalizar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </button>
      )}

      {/* Botão Faturar */}
      {process.status === 'finalized' && (
        <button
          onClick={() => handleBill(process)}
          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          title="Faturar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
            />
          </svg>
        </button>
      )}

      {/* Botão Editar */}
      <button
        onClick={() => handleEdit(process)}
        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Editar"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        onClick={() => handleDelete(process)}
        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Excluir"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Processos</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gerenciamento de processos de importação
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Novo Processo
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Filtro por Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente
            </label>
            <select
              value={filters.clientId}
              onChange={(e) => setFilters({ ...filters, clientId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Todos</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.code} - {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Todos</option>
              <option value="open">Aberto</option>
              <option value="finalized">Finalizado</option>
              <option value="billed">Faturado</option>
            </select>
          </div>

          {/* Filtro por Referência */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Referência
            </label>
            <input
              type="text"
              value={filters.reference}
              onChange={(e) => setFilters({ ...filters, reference: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Buscar por referência"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex items-end gap-2">
            <button
              onClick={applyFilters}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Filtrar
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <DataTable
        columns={columns}
        data={processes}
        customActions={customActions}
        loading={loading}
        emptyMessage="Nenhum processo cadastrado"
      />

      {/* Modal de Formulário */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProcess ? 'Editar Processo' : 'Novo Processo'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Referência */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Referência <span className="text-red-500">*</span>
            </label>
            <input
              ref={referenceInputRef}
              type="text"
              value={formData.reference}
              onChange={handleReferenceChange}
              onBlur={handleReferenceBlur}
              onPaste={handleReferencePaste}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono ${
                formErrors.reference ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0058.039.1209.25"
            />
            {formErrors.reference && (
              <p className="mt-1 text-sm text-red-500">{formErrors.reference}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Formato: XXXX.XXX.XXXX.XX (os primeiros 4 dígitos são o código do cliente)
            </p>
          </div>

          {/* Cliente não encontrado - Opção de cadastrar */}
          {clientNotFound && !suggestedClient && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-900">
                    Cliente não encontrado para o código {clientNotFound}
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Deseja cadastrar um novo cliente com este código?
                  </p>
                  <button
                    type="button"
                    onClick={handleCreateClient}
                    className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cadastrar Cliente
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sugestão de Cliente */}
          {suggestedClient && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Cliente identificado automaticamente:
                  </p>
                  <p className="text-sm text-blue-700">
                    {suggestedClient.code} - {suggestedClient.name}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cliente Manual (caso não encontre automaticamente) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                formErrors.client_id ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={!!suggestedClient}
            >
              <option value="">Selecione um cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.code} - {client.name}
                </option>
              ))}
            </select>
            {formErrors.client_id && (
              <p className="mt-1 text-sm text-red-500">{formErrors.client_id}</p>
            )}
          </div>

          {/* Importadora */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Importadora
            </label>
            <select
              value={formData.importer_id}
              onChange={(e) => setFormData({ ...formData, importer_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Selecione uma importadora</option>
              {importers.map((importer) => (
                <option key={importer.id} value={importer.id}>
                  {importer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status (apenas em edição) */}
          {editingProcess && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'open' | 'finalized' | 'billed',
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="open">Aberto</option>
                <option value="finalized">Finalizado</option>
                <option value="billed">Faturado</option>
              </select>
            </div>
          )}

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

      {/* Modal de Visualização */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detalhes do Processo"
      >
        {viewingProcess && (
          <div className="space-y-4">
            {/* Referência */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referência
              </label>
              <p className="font-mono font-semibold text-lg">{viewingProcess.reference}</p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              {getStatusBadge(viewingProcess.status)}
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <p className="text-gray-900">
                <span className="font-semibold">{viewingProcess.client?.code}</span> -{' '}
                {viewingProcess.client?.name}
              </p>
              {viewingProcess.client?.cnpj && (
                <p className="text-sm text-gray-600">CNPJ: {viewingProcess.client.cnpj}</p>
              )}
            </div>

            {/* Importadora */}
            {viewingProcess.importer && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Importadora
                </label>
                <p className="text-gray-900">{viewingProcess.importer.name}</p>
                {viewingProcess.importer.cnpj && (
                  <p className="text-sm text-gray-600">CNPJ: {viewingProcess.importer.cnpj}</p>
                )}
              </div>
            )}

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Criação
                </label>
                <p className="text-gray-900">
                  {new Date(viewingProcess.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>

              {viewingProcess.finalized_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Finalização
                  </label>
                  <p className="text-gray-900">
                    {new Date(viewingProcess.finalized_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}

              {viewingProcess.billed_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Faturamento
                  </label>
                  <p className="text-gray-900">
                    {new Date(viewingProcess.billed_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </div>

            {/* Observações */}
            {viewingProcess.billing_notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {viewingProcess.billing_notes}
                </p>
              </div>
            )}

            {/* Botão Fechar */}
            <div className="flex items-center justify-end pt-4 border-t">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Cadastro de Cliente */}
      <Modal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        title="Cadastrar Novo Cliente"
      >
        <form onSubmit={handleSubmitClient} className="space-y-4">
          {/* Código */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={clientFormData.code}
              onChange={(e) =>
                setClientFormData({ ...clientFormData, code: e.target.value })
              }
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                clientFormErrors.code ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0058"
              maxLength={4}
            />
            {clientFormErrors.code && (
              <p className="mt-1 text-sm text-red-500">{clientFormErrors.code}</p>
            )}
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={clientFormData.name}
              onChange={(e) =>
                setClientFormData({ ...clientFormData, name: e.target.value })
              }
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                clientFormErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nome do cliente"
            />
            {clientFormErrors.name && (
              <p className="mt-1 text-sm text-red-500">{clientFormErrors.name}</p>
            )}
          </div>

          {/* CNPJ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CNPJ
            </label>
            <input
              type="text"
              value={clientFormData.cnpj}
              onChange={(e) =>
                setClientFormData({ ...clientFormData, cnpj: e.target.value })
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
              value={clientFormData.email}
              onChange={(e) =>
                setClientFormData({ ...clientFormData, email: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="email@cliente.com"
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <input
              type="text"
              value={clientFormData.phone}
              onChange={(e) =>
                setClientFormData({ ...clientFormData, phone: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="(00) 00000-0000"
            />
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="client-active"
              checked={clientFormData.active}
              onChange={(e) =>
                setClientFormData({ ...clientFormData, active: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="client-active" className="text-sm font-medium text-gray-700">
              Cliente ativo
            </label>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsClientModalOpen(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={clientSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={clientSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {clientSubmitting ? 'Salvando...' : 'Salvar Cliente'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
