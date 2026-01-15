import { useState, useEffect, useRef, FormEvent } from 'react';
import { useToast } from '../../contexts/ToastContext';
import type {
  TransactionType,
  Transaction,
  DepositInput,
  ExpenseInput,
  Client,
  ProcessWithRelations,
  BankAccount,
  ExpenseCategory,
} from '../../types/database';
import {
  getDeposits,
  createDeposit,
  deleteDeposit,
  getTotalDeposits,
} from '../../services/depositService';
import {
  getExpenses,
  createExpense,
  deleteExpense,
  getTotalExpenses,
} from '../../services/expenseService';
import { getClients, updateClientBalance } from '../../services/clientService';
import { getProcesses } from '../../services/processService';
import { getBankAccounts } from '../../services/bankAccountService';
import { getExpenseCategories } from '../../services/expenseCategoryService';

export default function Financial() {
  const [transactionType, setTransactionType] = useState<TransactionType>('deposit');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Client search
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClientIndex, setSelectedClientIndex] = useState(-1);

  // Process search
  const [processSearch, setProcessSearch] = useState('');
  const [showProcessDropdown, setShowProcessDropdown] = useState(false);
  const [selectedProcessIndex, setSelectedProcessIndex] = useState(-1);

  // Form data
  const [depositForm, setDepositForm] = useState<DepositInput>({
    client_id: '',
    bank_account_id: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const [expenseForm, setExpenseForm] = useState<ExpenseInput>({
    process_id: '',
    category_id: '',
    bank_account_id: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Options for selects
  const [clients, setClients] = useState<Client[]>([]);
  const [processes, setProcesses] = useState<ProcessWithRelations[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  // Filters
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
    client: '',
    process: '',
  });

  // Totals
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  // Amount display
  const [amountDisplay, setAmountDisplay] = useState('0,00');

  // Ref for amount input
  const amountInputRef = useRef<HTMLInputElement>(null);

  const { showToast } = useToast();

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Focus on amount input when modal opens
  useEffect(() => {
    if (isModalOpen && amountInputRef.current) {
      setTimeout(() => {
        amountInputRef.current?.focus();
        amountInputRef.current?.select();
      }, 100);
    }
  }, [isModalOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [depositsData, expensesData, clientsData, processesData, bankAccountsData, categoriesData] =
        await Promise.all([
          getDeposits(),
          getExpenses(),
          getClients(),
          getProcesses(),
          getBankAccounts(),
          getExpenseCategories(),
        ]);

      // Convert to unified Transaction format
      const depositTransactions: Transaction[] = depositsData.map((d) => ({
        id: d.id,
        type: 'deposit' as TransactionType,
        amount: d.amount,
        date: d.date,
        description: d.description,
        client: d.client,
        bank_account: d.bank_account,
        created_at: d.created_at,
      }));

      const expenseTransactions: Transaction[] = expensesData.map((e) => ({
        id: e.id,
        type: 'expense' as TransactionType,
        amount: e.amount,
        date: e.date,
        description: e.description,
        process: e.process,
        category: e.category,
        bank_account: e.bank_account,
        created_at: e.created_at,
      }));

      const allTransactions = [...depositTransactions, ...expenseTransactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setTransactions(allTransactions);
      setClients(clientsData);
      setProcesses(processesData);
      setBankAccounts(bankAccountsData);
      setCategories(categoriesData);

      await calculateTotals();
    } catch (error: any) {
      showToast(error.message || 'Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = async () => {
    try {
      const [deposits, expenses] = await Promise.all([
        getTotalDeposits(),
        getTotalExpenses(),
      ]);
      setTotalDeposits(deposits);
      setTotalExpenses(expenses);
    } catch (error: any) {
      console.error('Erro ao calcular totais:', error);
    }
  };

  // Format currency
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseCurrency = (value: string): number => {
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleaned = value.replace(/[^\d,]/g, '');
    const parts = cleaned.split(',');
    let formatted = parts[0];

    if (parts.length > 1) {
      formatted = parts[0] + ',' + parts[1].slice(0, 2);
    }

    setAmountDisplay(formatted);
    const numericValue = parseCurrency(formatted);

    if (transactionType === 'deposit') {
      setDepositForm({ ...depositForm, amount: numericValue });
    } else {
      setExpenseForm({ ...expenseForm, amount: numericValue });
    }
  };

  const handleAmountFocus = () => {
    // Clear 0,00 when focusing
    if (amountDisplay === '0,00') {
      setAmountDisplay('');
    }
  };

  // Filter clients by search
  const filteredClients = clients.filter((client) => {
    const search = clientSearch.toLowerCase();
    return (
      client.code.toLowerCase().includes(search) ||
      client.name.toLowerCase().includes(search)
    );
  });

  // Filter processes by search
  const filteredProcesses = processes.filter((process) => {
    const search = processSearch.toLowerCase();
    return (
      process.reference.toLowerCase().includes(search) ||
      process.client?.name.toLowerCase().includes(search) ||
      process.client?.code.toLowerCase().includes(search)
    );
  });

  const handleClientSelect = (client: Client) => {
    setDepositForm({ ...depositForm, client_id: client.id });
    setClientSearch(`${client.code} - ${client.name}`);
    setShowClientDropdown(false);
    setSelectedClientIndex(-1);
  };

  const handleProcessSelect = (process: ProcessWithRelations) => {
    setExpenseForm({ ...expenseForm, process_id: process.id });
    setProcessSearch(`${process.reference} - ${process.client?.name || ''}`);
    setShowProcessDropdown(false);
    setSelectedProcessIndex(-1);
  };

  const handleClientKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showClientDropdown || filteredClients.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedClientIndex((prev) =>
          prev < filteredClients.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedClientIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedClientIndex >= 0 && selectedClientIndex < filteredClients.length) {
          handleClientSelect(filteredClients[selectedClientIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowClientDropdown(false);
        setSelectedClientIndex(-1);
        break;
      case 'Tab':
        setShowClientDropdown(false);
        setSelectedClientIndex(-1);
        break;
    }
  };

  const handleProcessKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showProcessDropdown || filteredProcesses.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedProcessIndex((prev) =>
          prev < filteredProcesses.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedProcessIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedProcessIndex >= 0 && selectedProcessIndex < filteredProcesses.length) {
          handleProcessSelect(filteredProcesses[selectedProcessIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowProcessDropdown(false);
        setSelectedProcessIndex(-1);
        break;
      case 'Tab':
        setShowProcessDropdown(false);
        setSelectedProcessIndex(-1);
        break;
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    setAmountDisplay('');
    setClientSearch('');
    setProcessSearch('');
    setShowClientDropdown(false);
    setShowProcessDropdown(false);
    setSelectedClientIndex(-1);
    setSelectedProcessIndex(-1);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormErrors({});
    // Reset forms
    setDepositForm({
      client_id: '',
      bank_account_id: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
    setExpenseForm({
      process_id: '',
      category_id: '',
      bank_account_id: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
    setAmountDisplay('');
    setClientSearch('');
    setProcessSearch('');
    setShowClientDropdown(false);
    setShowProcessDropdown(false);
    setSelectedClientIndex(-1);
    setSelectedProcessIndex(-1);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (transactionType === 'deposit') {
      if (!depositForm.client_id) errors.client = 'Cliente é obrigatório';
      if (!depositForm.bank_account_id) errors.bank_account = 'Conta bancária é obrigatória';
      if (depositForm.amount <= 0) errors.amount = 'Valor deve ser maior que zero';
      if (!depositForm.date) errors.date = 'Data é obrigatória';
    } else {
      if (!expenseForm.process_id) errors.process = 'Processo é obrigatório';
      if (!expenseForm.category_id) errors.category = 'Categoria é obrigatória';
      if (!expenseForm.bank_account_id) errors.bank_account = 'Conta bancária é obrigatória';
      if (expenseForm.amount <= 0) errors.amount = 'Valor deve ser maior que zero';
      if (!expenseForm.date) errors.date = 'Data é obrigatória';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      if (transactionType === 'deposit') {
        // Criar depósito
        await createDeposit(depositForm);

        // Atualizar saldo do cliente (incrementar)
        await updateClientBalance(depositForm.client_id, depositForm.amount);

        showToast('Depósito registrado com sucesso!', 'success');

        // Reset form (mantém cliente e conta bancária para lançamentos sequenciais)
        const currentClientId = depositForm.client_id;
        const currentBankAccountId = depositForm.bank_account_id;

        setDepositForm({
          client_id: currentClientId,
          bank_account_id: currentBankAccountId,
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          description: '',
        });
      } else {
        // Criar despesa
        await createExpense(expenseForm);

        // Buscar cliente do processo e atualizar saldo (decrementar)
        const process = processes.find(p => p.id === expenseForm.process_id);
        if (process?.client_id) {
          await updateClientBalance(process.client_id, -expenseForm.amount);
        }

        showToast('Despesa registrada com sucesso!', 'success');

        // Reset form (mantém processo, categoria e conta bancária para lançamentos sequenciais)
        const currentProcessId = expenseForm.process_id;
        const currentCategoryId = expenseForm.category_id;
        const currentBankAccountId = expenseForm.bank_account_id;

        setExpenseForm({
          process_id: currentProcessId,
          category_id: currentCategoryId,
          bank_account_id: currentBankAccountId,
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          description: '',
        });
      }

      // Limpar apenas valor e focar novamente
      setAmountDisplay('');
      setFormErrors({});

      // Focar no campo de valor para próximo lançamento
      setTimeout(() => {
        amountInputRef.current?.focus();
        amountInputRef.current?.select();
      }, 100);

      // NÃO fechar modal - mantém aberto para lançamentos sequenciais
      await loadData();
    } catch (error: any) {
      showToast(error.message || 'Erro ao salvar movimentação', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete transaction
  const handleDelete = async (transaction: Transaction) => {
    if (!confirm(`Deseja realmente excluir esta ${transaction.type === 'deposit' ? 'depósito' : 'despesa'}?`)) {
      return;
    }

    try {
      if (transaction.type === 'deposit') {
        // Deletar depósito
        await deleteDeposit(transaction.id);

        // Reverter saldo do cliente (decrementar)
        if (transaction.client?.id) {
          await updateClientBalance(transaction.client.id, -transaction.amount);
        }
      } else {
        // Deletar despesa
        await deleteExpense(transaction.id);

        // Reverter saldo do cliente (incrementar)
        if (transaction.process?.client_id) {
          await updateClientBalance(transaction.process.client_id, transaction.amount);
        }
      }
      showToast('Movimentação excluída com sucesso!', 'success');
      await loadData();
    } catch (error: any) {
      showToast(error.message || 'Erro ao excluir movimentação', 'error');
    }
  };

  // Apply filters
  const filteredTransactions = transactions.filter((t) => {
    if (filters.type && t.type !== filters.type) return false;
    if (filters.startDate && t.date < filters.startDate) return false;
    if (filters.endDate && t.date > filters.endDate) return false;
    if (filters.client && t.client?.id !== filters.client) return false;
    if (filters.process && t.process?.id !== filters.process) return false;
    return true;
  });

  const filteredTotalDeposits = filteredTransactions
    .filter((t) => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredTotalExpenses = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = filteredTotalDeposits - filteredTotalExpenses;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Movimentações Financeiras</h1>
          <p className="mt-1 text-sm text-gray-600">
            
          </p>
        </div>
        <button
          onClick={openModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Movimentação
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Nova Movimentação</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Toggle */}
              <div className="flex items-center gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setTransactionType('deposit');
                    setAmountDisplay('');
                    setFormErrors({});
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    transactionType === 'deposit'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💰 Depósito
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTransactionType('expense');
                    setAmountDisplay('');
                    setFormErrors({});
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    transactionType === 'expense'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💸 Despesa
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Data */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={transactionType === 'deposit' ? depositForm.date : expenseForm.date}
                      onChange={(e) =>
                        transactionType === 'deposit'
                          ? setDepositForm({ ...depositForm, date: e.target.value })
                          : setExpenseForm({ ...expenseForm, date: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                        formErrors.date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.date && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.date}</p>
                    )}
                  </div>

                  {/* Valor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                        R$
                      </span>
                      <input
                        ref={amountInputRef}
                        type="text"
                        value={amountDisplay}
                        onChange={handleAmountChange}
                        onFocus={handleAmountFocus}
                        onBlur={() => {
                          if (amountDisplay === '') {
                            setAmountDisplay('0,00');
                          } else {
                            const amount = transactionType === 'deposit' ? depositForm.amount : expenseForm.amount;
                            setAmountDisplay(formatCurrency(amount));
                          }
                        }}
                        className={`w-full pl-12 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono ${
                          formErrors.amount ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0,00"
                      />
                    </div>
                    {formErrors.amount && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.amount}</p>
                    )}
                  </div>

                  {/* Cliente (only for deposits) */}
                  {transactionType === 'deposit' && (
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cliente <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => {
                          const value = e.target.value;
                          setClientSearch(value);
                          setShowClientDropdown(true);
                          setSelectedClientIndex(-1);
                          if (value === '') {
                            setDepositForm({ ...depositForm, client_id: '' });
                          }
                        }}
                        onKeyDown={handleClientKeyDown}
                        onFocus={(e) => {
                          // Only show dropdown if there's text to search
                          if (e.target.value.length > 0) {
                            setShowClientDropdown(true);
                          }
                        }}
                        onBlur={() => {
                          // Delay to allow click on dropdown item
                          setTimeout(() => {
                            setShowClientDropdown(false);
                            setSelectedClientIndex(-1);
                          }, 200);
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                          formErrors.client ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Digite o código ou nome do cliente..."
                      />
                      {formErrors.client && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.client}</p>
                      )}

                      {/* Dropdown */}
                      {showClientDropdown && clientSearch && filteredClients.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredClients.map((client, index) => (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => handleClientSelect(client)}
                              className={`w-full px-4 py-2 text-left transition-colors flex items-center justify-between ${
                                index === selectedClientIndex
                                  ? 'bg-blue-100'
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              <div>
                                <div className="font-semibold text-gray-900">{client.name}</div>
                                <div className="text-sm text-gray-500">{client.code}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Processo (only for expenses) */}
                  {transactionType === 'expense' && (
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Processo/Referência <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={processSearch}
                        onChange={(e) => {
                          const value = e.target.value;
                          setProcessSearch(value);
                          setShowProcessDropdown(true);
                          setSelectedProcessIndex(-1);
                          if (value === '') {
                            setExpenseForm({ ...expenseForm, process_id: '' });
                          }
                        }}
                        onKeyDown={handleProcessKeyDown}
                        onFocus={(e) => {
                          // Only show dropdown if there's text to search
                          if (e.target.value.length > 0) {
                            setShowProcessDropdown(true);
                          }
                        }}
                        onBlur={() => {
                          // Delay to allow click on dropdown item
                          setTimeout(() => {
                            setShowProcessDropdown(false);
                            setSelectedProcessIndex(-1);
                          }, 200);
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                          formErrors.process ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Digite a referência ou cliente..."
                      />
                      {formErrors.process && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.process}</p>
                      )}

                      {/* Dropdown */}
                      {showProcessDropdown && processSearch && filteredProcesses.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredProcesses.map((process, index) => (
                            <button
                              key={process.id}
                              type="button"
                              onClick={() => handleProcessSelect(process)}
                              className={`w-full px-4 py-2 text-left transition-colors flex items-center justify-between ${
                                index === selectedProcessIndex
                                  ? 'bg-blue-100'
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              <div>
                                <div className="font-semibold text-gray-900 font-mono">
                                  {process.reference}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {process.client?.name} ({process.client?.code})
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Categoria (only for expenses) */}
                  {transactionType === 'expense' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoria <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={expenseForm.category_id}
                        onChange={(e) =>
                          setExpenseForm({ ...expenseForm, category_id: e.target.value })
                        }
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                          formErrors.category ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Selecione uma categoria</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.category && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.category}</p>
                      )}
                    </div>
                  )}

                  {/* Conta Bancária */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Conta Bancária <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={
                        transactionType === 'deposit'
                          ? depositForm.bank_account_id
                          : expenseForm.bank_account_id
                      }
                      onChange={(e) =>
                        transactionType === 'deposit'
                          ? setDepositForm({ ...depositForm, bank_account_id: e.target.value })
                          : setExpenseForm({ ...expenseForm, bank_account_id: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                        formErrors.bank_account ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Selecione uma conta</option>
                      {bankAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} {account.bank && `- ${account.bank}`}
                        </option>
                      ))}
                    </select>
                    {formErrors.bank_account && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.bank_account}</p>
                    )}
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={
                      transactionType === 'deposit'
                        ? depositForm.description
                        : expenseForm.description
                    }
                    onChange={(e) =>
                      transactionType === 'deposit'
                        ? setDepositForm({ ...depositForm, description: e.target.value })
                        : setExpenseForm({ ...expenseForm, description: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Observações adicionais..."
                  />
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      transactionType === 'deposit'
                        ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                        : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                    } text-white`}
                  >
                    {submitting
                      ? 'Salvando...'
                      : transactionType === 'deposit'
                      ? 'Registrar Depósito'
                      : 'Registrar Despesa'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Totalizadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700 font-medium mb-1">Total Depósitos</p>
          <p className="text-2xl font-bold text-green-800">
            R$ {formatCurrency(filteredTotalDeposits)}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700 font-medium mb-1">Total Despesas</p>
          <p className="text-2xl font-bold text-red-800">
            R$ {formatCurrency(filteredTotalExpenses)}
          </p>
        </div>
        <div className={`border rounded-lg p-4 ${balance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <p className={`text-sm font-medium mb-1 ${balance >= 0 ? 'text-blue-700' : 'text-yellow-700'}`}>
            Saldo
          </p>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-800' : 'text-yellow-800'}`}>
            R$ {formatCurrency(Math.abs(balance))}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="">Todos</option>
              <option value="deposit">Depósitos</option>
              <option value="expense">Despesas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <select
              value={filters.client}
              onChange={(e) => setFilters({ ...filters, client: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="">Todos</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.code} - {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Processo</label>
            <select
              value={filters.process}
              onChange={(e) => setFilters({ ...filters, process: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="">Todos</option>
              {processes.map((process) => (
                <option key={process.id} value={process.id}>
                  {process.reference}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={() =>
              setFilters({ type: '', startDate: '', endDate: '', client: '', process: '' })
            }
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Listagem */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Carregando...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
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
              <p className="mt-4 text-gray-600">Nenhuma movimentação encontrada</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cliente/Processo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Conta
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.type === 'deposit'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {transaction.type === 'deposit' ? '💰 Depósito' : '💸 Despesa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.type === 'deposit' ? (
                        <div>
                          <div className="font-semibold">{transaction.client?.name}</div>
                          <div className="text-xs text-gray-500">{transaction.client?.code}</div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-mono font-semibold">
                            {transaction.process?.reference}
                          </div>
                          <div className="text-xs text-gray-500">
                            {transaction.process?.client?.name}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.bank_account?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono font-semibold">
                      <span
                        className={
                          transaction.type === 'deposit' ? 'text-green-700' : 'text-red-700'
                        }
                      >
                        {transaction.type === 'deposit' ? '+' : '-'} R${' '}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleDelete(transaction)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
