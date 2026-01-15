import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import type { Client, Transaction } from '../../types/database';
import { getClientById } from '../../services/clientService';
import { getDeposits } from '../../services/depositService';
import { getExpenses } from '../../services/expenseService';

export default function ClientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Totalizadores
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Buscar cliente
      const clientData = await getClientById(id!);
      setClient(clientData);

      // Buscar todas as transações
      const [depositsData, expensesData] = await Promise.all([
        getDeposits(),
        getExpenses(),
      ]);

      // Filtrar depósitos do cliente
      const clientDeposits = depositsData.filter((d) => d.client_id === id);

      // Filtrar despesas dos processos do cliente
      const clientExpenses = expensesData.filter(
        (e) => e.process?.client_id === id
      );

      // Converter para Transaction[]
      const depositTransactions: Transaction[] = clientDeposits.map((d) => ({
        id: d.id,
        type: 'deposit' as const,
        amount: d.amount,
        date: d.date,
        description: d.description,
        client: d.client,
        bank_account: d.bank_account,
        created_at: d.created_at,
      }));

      const expenseTransactions: Transaction[] = clientExpenses.map((e) => ({
        id: e.id,
        type: 'expense' as const,
        amount: e.amount,
        date: e.date,
        description: e.description,
        process: e.process,
        category: e.category,
        bank_account: e.bank_account,
        created_at: e.created_at,
      }));

      // Unificar e ordenar
      const allTransactions = [...depositTransactions, ...expenseTransactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setTransactions(allTransactions);

      // Calcular totais
      const deposits = depositTransactions.reduce((sum, t) => sum + t.amount, 0);
      const expenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

      setTotalDeposits(deposits);
      setTotalExpenses(expenses);
    } catch (error: any) {
      showToast(error.message || 'Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const balance = totalDeposits - totalExpenses;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Cliente não encontrado</p>
        <button
          onClick={() => navigate('/clientes')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Voltar para Clientes
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/clientes')}
          className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para Clientes
        </button>

        <h1 className="text-2xl font-bold text-gray-900">Detalhes do Cliente</h1>
        <p className="mt-1 text-sm text-gray-600">
          Saldo, depósitos e despesas
        </p>
      </div>

      {/* Informações do Cliente */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Código</p>
            <p className="text-lg font-semibold text-gray-900">{client.code}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Nome</p>
            <p className="text-lg font-semibold text-gray-900">{client.name}</p>
          </div>
          {client.cnpj && (
            <div>
              <p className="text-sm text-gray-500">CNPJ</p>
              <p className="text-lg font-semibold text-gray-900">{client.cnpj}</p>
            </div>
          )}
          {client.email && (
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-lg font-semibold text-gray-900">{client.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Cards de Totalizadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <p className="text-sm text-green-700 font-medium mb-1">Total Depósitos</p>
          <p className="text-3xl font-bold text-green-800">
            R$ {formatCurrency(totalDeposits)}
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-sm text-red-700 font-medium mb-1">Total Despesas</p>
          <p className="text-3xl font-bold text-red-800">
            R$ {formatCurrency(totalExpenses)}
          </p>
        </div>

        <div
          className={`border rounded-lg p-6 ${
            balance >= 0
              ? 'bg-blue-50 border-blue-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          <p
            className={`text-sm font-medium mb-1 ${
              balance >= 0 ? 'text-blue-700' : 'text-yellow-700'
            }`}
          >
            Saldo Calculado
          </p>
          <p
            className={`text-3xl font-bold ${
              balance >= 0 ? 'text-blue-800' : 'text-yellow-800'
            }`}
          >
            R$ {formatCurrency(Math.abs(balance))}
          </p>
        </div>
      </div>

      {/* Extrato */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Extrato de Movimentações
          </h2>
        </div>

        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
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
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Processo/Ref
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleDateString('pt-BR')}
                    </td>
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
                      {transaction.type === 'expense' ? (
                        <span className="font-mono font-semibold">
                          {transaction.process?.reference}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {transaction.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono font-semibold">
                      <span
                        className={
                          transaction.type === 'deposit'
                            ? 'text-green-700'
                            : 'text-red-700'
                        }
                      >
                        {transaction.type === 'deposit' ? '+' : '-'} R${' '}
                        {formatCurrency(transaction.amount)}
                      </span>
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
