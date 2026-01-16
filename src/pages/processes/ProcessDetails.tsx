import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import type { ProcessWithRelations, ExpenseWithRelations } from '../../types/database';
import { getProcessById, billProcess } from '../../services/processService';
import { getExpensesByProcess } from '../../services/expenseService';

export default function ProcessDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [process, setProcess] = useState<ProcessWithRelations | null>(null);
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [billingNotes, setBillingNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Buscar processo
      const processData = await getProcessById(id!);
      setProcess(processData);

      // Buscar despesas do processo
      const expensesData = await getExpensesByProcess(id!);
      setExpenses(expensesData);

      // Calcular total
      const total = expensesData.reduce((sum, e) => sum + e.amount, 0);
      setTotalExpenses(total);
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: 'Aberto', color: 'bg-blue-100 text-blue-800' },
      finalized: { label: 'Finalizado', color: 'bg-green-100 text-green-800' },
      billed: { label: 'Faturado', color: 'bg-purple-100 text-purple-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const handleBillProcess = async () => {
    try {
      setSubmitting(true);
      await billProcess(id!, billingNotes || undefined);
      showToast('Processo marcado como cobrado com sucesso!', 'success');
      setShowBillingModal(false);
      setBillingNotes('');
      await loadData(); // Recarregar dados
    } catch (error: any) {
      showToast(error.message || 'Erro ao marcar processo como cobrado', 'error');
    } finally {
      setSubmitting(false);
    }
  };

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

  if (!process) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Processo não encontrado</p>
        <button
          onClick={() => navigate('/processos')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Voltar para Processos
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/processos')}
          className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para Processos
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalhes do Processo</h1>
            <p className="mt-1 text-sm text-gray-600">
              Total de despesas e extrato
            </p>
          </div>

          {/* Botão Marcar como Cobrado - só aparece se finalizado e não cobrado */}
          {process.status === 'finalized' && !process.billed_at && (
            <button
              onClick={() => setShowBillingModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Marcar como Cobrado
            </button>
          )}
        </div>
      </div>

      {/* Informações do Processo */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Referência</p>
            <p className="text-lg font-semibold text-gray-900 font-mono">
              {process.reference}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <div className="mt-1">
              {getStatusBadge(process.status)}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Cliente</p>
            <p className="text-lg font-semibold text-gray-900">
              {process.client?.name} ({process.client?.code})
            </p>
          </div>
          {process.importer && (
            <div>
              <p className="text-sm text-gray-500">Importadora</p>
              <p className="text-lg font-semibold text-gray-900">
                {process.importer.name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Card de Total de Despesas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-sm text-red-700 font-medium mb-1">Total de Despesas</p>
          <p className="text-3xl font-bold text-red-800">
            R$ {formatCurrency(totalExpenses)}
          </p>
          <p className="text-sm text-red-600 mt-2">
            {expenses.length} despesa{expenses.length !== 1 ? 's' : ''} registrada{expenses.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-sm text-blue-700 font-medium mb-1">Saldo do Cliente</p>
          <p className="text-3xl font-bold text-blue-800">
            R$ {formatCurrency(process.client?.balance || 0)}
          </p>
          <p className="text-sm text-blue-600 mt-2">
            Saldo disponível para cobrir despesas
          </p>
        </div>
      </div>

      {/* Extrato de Despesas */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Extrato de Despesas
          </h2>
        </div>

        <div className="overflow-x-auto">
          {expenses.length === 0 ? (
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
              <p className="mt-4 text-gray-600">Nenhuma despesa encontrada</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Conta Bancária
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
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(expense.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.category?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.bank_account?.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {expense.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono font-semibold text-red-700">
                      R$ {formatCurrency(expense.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Total */}
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                    Total de Despesas:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono font-bold text-red-700">
                    R$ {formatCurrency(totalExpenses)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Cobrança */}
      {showBillingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Marcar Processo como Cobrado
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Processo: <span className="font-mono font-semibold">{process.reference}</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Cliente: <span className="font-semibold">{process.client?.name}</span>
              </p>
              <p className="text-sm text-gray-600">
                Total de Despesas: <span className="font-semibold text-red-700">R$ {formatCurrency(totalExpenses)}</span>
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações (opcional)
              </label>
              <textarea
                value={billingNotes}
                onChange={(e) => setBillingNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Adicione observações sobre a cobrança..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBillingModal(false);
                  setBillingNotes('');
                }}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleBillProcess}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Confirmar Cobrança
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
