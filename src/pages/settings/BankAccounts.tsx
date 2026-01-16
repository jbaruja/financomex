import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import DataTable from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { useToast } from '../../contexts/ToastContext';
import type { BankAccount, BankAccountInput } from '../../types/database';
import {
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
} from '../../services/bankAccountService';

export default function BankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState<BankAccountInput>({
    name: '',
    bank: '',
    balance: 0,
    active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [balanceDisplay, setBalanceDisplay] = useState('0,00');
  const { showToast } = useToast();

  // Formatar valor para exibição (1000.50 -> "1.000,50")
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Converter string formatada para número ("1.000,50" -> 1000.50)
  const parseCurrency = (value: string): number => {
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  // Handler para input de saldo
  const handleBalanceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove tudo exceto números e vírgula
    const cleaned = value.replace(/[^\d,]/g, '');

    // Limita a apenas uma vírgula
    const parts = cleaned.split(',');
    let formatted = parts[0];

    if (parts.length > 1) {
      // Limita a 2 casas decimais
      formatted = parts[0] + ',' + parts[1].slice(0, 2);
    }

    setBalanceDisplay(formatted);

    // Atualiza o valor numérico no formData
    const numericValue = parseCurrency(formatted);
    setFormData({ ...formData, balance: numericValue });
  };

  // Carregar contas
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await getBankAccounts();
      setAccounts(data);
    } catch (error: any) {
      showToast(error.message || 'Erro ao carregar contas', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal para criar
  const handleCreate = () => {
    setEditingAccount(null);
    setFormData({
      name: '',
      bank: '',
      balance: 0,
      active: true,
    });
    setBalanceDisplay('0,00');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account);
    const balance = account.balance || 0;
    setFormData({
      name: account.name,
      bank: account.bank || '',
      balance: balance,
      active: account.active,
    });
    setBalanceDisplay(formatCurrency(balance));
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Excluir conta
  const handleDelete = async (account: BankAccount) => {
    if (!confirm(`Deseja realmente excluir a conta "${account.name}"?`)) {
      return;
    }

    try {
      await deleteBankAccount(account.id);
      showToast('Conta excluída com sucesso!', 'success');
      loadAccounts();
    } catch (error: any) {
      showToast(error.message || 'Erro ao excluir conta', 'error');
    }
  };

  // Validar formulário
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
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
      if (editingAccount) {
        await updateBankAccount(editingAccount.id, formData);
        showToast('Conta atualizada com sucesso!', 'success');
      } else {
        await createBankAccount(formData);
        showToast('Conta cadastrada com sucesso!', 'success');
      }
      setIsModalOpen(false);
      loadAccounts();
    } catch (error: any) {
      showToast(error.message || 'Erro ao salvar conta', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Colunas da tabela
  const columns: Column<BankAccount>[] = [
    {
      key: 'name',
      label: 'Nome',
      render: (account) => (
        <span className="font-semibold">{account.name}</span>
      ),
    },
    {
      key: 'bank',
      label: 'Banco',
      render: (account) => account.bank || '-',
    },
    {
      key: 'balance',
      label: 'Saldo',
      render: (account) => (
        <span className="font-mono font-semibold text-green-700">
          R$ {account.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
        </span>
      ),
    },
    {
      key: 'active',
      label: 'Status',
      render: (account) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            account.active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {account.active ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contas Bancárias</h1>
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
          Nova Conta
        </button>
      </div>

      {/* Tabela */}
      <DataTable
        columns={columns}
        data={accounts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="Nenhuma conta cadastrada"
      />

      {/* Modal de Formulário */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAccount ? 'Editar Conta' : 'Nova Conta'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Nome da conta"
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
            )}
          </div>

          {/* Banco */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Banco
            </label>
            <input
              type="text"
              value={formData.bank}
              onChange={(e) =>
                setFormData({ ...formData, bank: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Nome do banco"
            />
          </div>

          {/* Saldo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Saldo Inicial
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
                  // Formata ao sair do campo
                  setBalanceDisplay(formatCurrency(formData.balance ?? 0));
                }}
                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                placeholder="0,00"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Use vírgula para decimais. Ex: 10000,50
            </p>
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
              Conta ativa
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
