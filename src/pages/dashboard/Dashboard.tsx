import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import type { Transaction } from '../../types/database';
import {
  getDashboardMetrics,
  getTopClientsByBalance,
  getFinalizedWithoutBilling,
  getFinancialTrend,
  getProcessesByStatus,
  type DashboardMetrics,
  type ClientWithBalance,
  type FinancialTrendData,
  type ProcessStatusCount,
} from '../../services/dashboardService';
import { getDeposits } from '../../services/depositService';
import { getExpenses } from '../../services/expenseService';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [topClients, setTopClients] = useState<ClientWithBalance[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [financialTrend, setFinancialTrend] = useState<FinancialTrendData[]>([]);
  const [processStatus, setProcessStatus] = useState<ProcessStatusCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [metricsData, topClientsData, depositsData, expensesData, trendData, statusData] = await Promise.all([
        getDashboardMetrics(),
        getTopClientsByBalance(),
        getDeposits(),
        getExpenses(),
        getFinancialTrend(),
        getProcessesByStatus(),
      ]);

      setMetrics(metricsData);
      setTopClients(topClientsData);
      setFinancialTrend(trendData);
      setProcessStatus(statusData);

      // Unificar depósitos e despesas para últimas movimentações
      const depositTransactions: Transaction[] = depositsData.map((d) => ({
        id: d.id,
        type: 'deposit' as const,
        amount: d.amount,
        date: d.date,
        description: d.description,
        client: d.client,
        bank_account: d.bank_account,
        created_at: d.created_at,
      }));

      const expenseTransactions: Transaction[] = expensesData.map((e) => ({
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

      // Últimas 10 movimentações
      const allTransactions = [...depositTransactions, ...expenseTransactions]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      setRecentTransactions(allTransactions);
    } catch (error: any) {
      showToast(error.message || 'Erro ao carregar dashboard', 'error');
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

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInHours < 48) {
      return `Ontem às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const balance = (metrics?.totalDeposits || 0) - (metrics?.totalExpenses || 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral das operações financeiras</p>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Processos em Aberto */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Processos em Aberto</h3>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">{metrics?.openProcesses || 0}</p>
          <p className="text-sm text-gray-500 mt-2">Total de processos ativos</p>
        </div>

        {/* Processos Finalizados */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Processos Finalizados</h3>
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{metrics?.finalizedProcesses || 0}</p>
          <p className="text-sm text-gray-500 mt-2">Aguardando cobrança</p>
        </div>

        {/* ALERTA CRÍTICO: Processos Finalizados SEM Cobrança */}
        <div
          className="bg-red-50 border-2 border-red-200 rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/processos')}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-red-700">🚨 SEM Cobrança</h3>
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-3xl font-bold text-red-600">{metrics?.finalizedWithoutBilling || 0}</p>
          <p className="text-sm text-red-600 mt-2 font-medium">Processos finalizados não cobrados</p>
        </div>

        {/* Clientes Ativos */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Clientes Ativos</h3>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-3xl font-bold text-purple-600">{metrics?.totalClients || 0}</p>
          <p className="text-sm text-gray-500 mt-2">Total de clientes cadastrados</p>
        </div>
      </div>

      {/* Cards Financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 border border-green-200 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-700">Total Depósitos</h3>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-green-800">
            R$ {formatCurrency(metrics?.totalDeposits || 0)}
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-red-700">Total Despesas</h3>
            <span className="text-2xl">💸</span>
          </div>
          <p className="text-3xl font-bold text-red-800">
            R$ {formatCurrency(metrics?.totalExpenses || 0)}
          </p>
        </div>

        <div className={`border rounded-lg shadow p-6 ${balance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-sm font-medium ${balance >= 0 ? 'text-blue-700' : 'text-yellow-700'}`}>
              Saldo Total
            </h3>
            <span className="text-2xl">💵</span>
          </div>
          <p className={`text-3xl font-bold ${balance >= 0 ? 'text-blue-800' : 'text-yellow-800'}`}>
            R$ {formatCurrency(Math.abs(balance))}
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de Evolução Financeira */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Evolução Financeira (Últimos 6 Meses)
          </h2>
          {financialTrend.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Sem dados suficientes para exibir o gráfico
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={financialTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="deposits"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Depósitos"
                  dot={{ fill: '#10b981', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Despesas"
                  dot={{ fill: '#ef4444', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Gráfico de Distribuição de Processos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Distribuição de Processos por Status
          </h2>
          {processStatus.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Nenhum processo cadastrado
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={processStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ label, percent }) => `${label}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {processStatus.map((entry, index) => {
                    const colors = ['#3b82f6', '#10b981', '#f59e0b'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Grid de Conteúdo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas Movimentações */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Últimas Movimentações
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentTransactions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Nenhuma movimentação registrada
              </div>
            ) : (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {transaction.type === 'deposit' ? (
                          <>💰 Depósito - {transaction.client?.name}</>
                        ) : (
                          <>💸 {transaction.category?.name} - {transaction.process?.reference}</>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDateTime(transaction.created_at)}
                      </p>
                    </div>
                    <span
                      className={`text-lg font-semibold ${
                        transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'deposit' ? '+' : '-'} R${' '}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={() => navigate('/financeiro')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Ver todas as movimentações →
            </button>
          </div>
        </div>

        {/* Top 10 Clientes com Maior Saldo */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Top 10 Clientes - Maior Saldo
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {topClients.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Nenhum cliente cadastrado
              </div>
            ) : (
              topClients.map((client, index) => (
                <div
                  key={client.id}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/clientes/${client.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-gray-900">{client.name}</p>
                        <p className="text-sm text-gray-500">{client.code}</p>
                      </div>
                    </div>
                    <span
                      className={`text-lg font-semibold ${
                        client.calculatedBalance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      R$ {formatCurrency(Math.abs(client.calculatedBalance))}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={() => navigate('/clientes')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Ver todos os clientes →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
