import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '../../contexts/ToastContext';
import type { Client, ProcessWithRelations, Transaction } from '../../types/database';
import { getClients } from '../../services/clientService';
import { getProcesses } from '../../services/processService';
import { getDeposits } from '../../services/depositService';
import { getExpenses } from '../../services/expenseService';

type ReportType = 'client-balance' | 'process-balance' | 'transactions' | 'unbilled';

export default function Reports() {
  const [activeReport, setActiveReport] = useState<ReportType>('client-balance');
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [processes, setProcesses] = useState<ProcessWithRelations[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { showToast } = useToast();

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientsData, processesData, depositsData, expensesData] = await Promise.all([
        getClients(),
        getProcesses(),
        getDeposits(),
        getExpenses(),
      ]);

      setClients(clientsData);
      setProcesses(processesData);

      // Convert to unified Transaction format
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

      const allTransactions = [...depositTransactions, ...expenseTransactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setTransactions(allTransactions);
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

  const formatDate = (date: string): string => {
    // Trata a data como local, não UTC, para evitar problema de timezone
    const [year, month, day] = date.split('T')[0].split('-');
    return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('pt-BR');
  };

  // RELATÓRIO 1: Saldo por Cliente
  const exportClientBalanceExcel = () => {
    const sortedClients = [...clients].sort((a, b) => a.balance - b.balance);

    const data = sortedClients.map((client) => ({
      Código: client.code,
      Nome: client.name,
      CNPJ: client.cnpj || '-',
      Saldo: client.balance,
      Status: client.active ? 'Ativo' : 'Inativo',
    }));

    const ws = XLSX.utils.json_to_sheet(data);

    // Ajustar largura das colunas
    ws['!cols'] = [
      { wch: 10 }, // Código
      { wch: 30 }, // Nome
      { wch: 20 }, // CNPJ
      { wch: 15 }, // Saldo
      { wch: 10 }, // Status
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Saldo por Cliente');

    const fileName = `saldo_clientes_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast('Relatório exportado com sucesso!', 'success');
  };

  // RELATÓRIO 2: Saldo por Processo
  const exportProcessBalanceExcel = () => {
    let filteredProcesses = processes;

    if (statusFilter) {
      filteredProcesses = filteredProcesses.filter((p) => p.status === statusFilter);
    }

    const data = filteredProcesses.map((process) => {
      const processExpenses = transactions.filter(
        (t) => t.type === 'expense' && t.process?.id === process.id
      );
      const totalExpenses = processExpenses.reduce((sum, t) => sum + t.amount, 0);

      return {
        Referência: process.reference,
        Cliente: process.client?.name || '-',
        'Código Cliente': process.client?.code || '-',
        Status: process.status === 'open' ? 'Aberto' : process.status === 'finalized' ? 'Finalizado' : 'Faturado',
        'Total Despesas': totalExpenses,
        'Data Criação': formatDate(process.created_at),
        'Data Finalização': process.finalized_at ? formatDate(process.finalized_at) : '-',
        'Data Faturamento': process.billed_at ? formatDate(process.billed_at) : '-',
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);

    ws['!cols'] = [
      { wch: 20 }, // Referência
      { wch: 30 }, // Cliente
      { wch: 15 }, // Código Cliente
      { wch: 12 }, // Status
      { wch: 15 }, // Total Despesas
      { wch: 15 }, // Data Criação
      { wch: 18 }, // Data Finalização
      { wch: 18 }, // Data Faturamento
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Saldo por Processo');

    const fileName = `saldo_processos_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast('Relatório exportado com sucesso!', 'success');
  };

  // RELATÓRIO 3: Movimentações por Período
  const exportTransactionsExcel = () => {
    let filteredTransactions = transactions;

    if (startDate) {
      filteredTransactions = filteredTransactions.filter((t) => t.date >= startDate);
    }
    if (endDate) {
      filteredTransactions = filteredTransactions.filter((t) => t.date <= endDate);
    }

    const data = filteredTransactions.map((t) => ({
      Data: formatDate(t.date),
      Tipo: t.type === 'deposit' ? 'Depósito' : 'Despesa',
      'Cliente/Processo':
        t.type === 'deposit'
          ? `${t.client?.code} - ${t.client?.name}`
          : `${t.process?.reference} - ${t.process?.client?.name}`,
      Categoria: t.category?.name || '-',
      'Conta Bancária': t.bank_account?.name || '-',
      Valor: t.amount,
      Descrição: t.description || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(data);

    ws['!cols'] = [
      { wch: 12 }, // Data
      { wch: 10 }, // Tipo
      { wch: 35 }, // Cliente/Processo
      { wch: 20 }, // Categoria
      { wch: 20 }, // Conta Bancária
      { wch: 15 }, // Valor
      { wch: 30 }, // Descrição
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Movimentações');

    const fileName = `movimentacoes_${startDate || 'inicio'}_${endDate || 'fim'}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast('Relatório exportado com sucesso!', 'success');
  };

  const exportTransactionsPDF = () => {
    let filteredTransactions = transactions;

    if (startDate) {
      filteredTransactions = filteredTransactions.filter((t) => t.date >= startDate);
    }
    if (endDate) {
      filteredTransactions = filteredTransactions.filter((t) => t.date <= endDate);
    }

    const doc = new jsPDF();

    // Cabeçalho
    doc.setFontSize(16);
    doc.text('Relatório de Movimentações', 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${formatDate(new Date().toISOString())}`, 14, 22);

    if (startDate || endDate) {
      doc.text(
        `Período: ${startDate ? formatDate(startDate) : 'Início'} até ${endDate ? formatDate(endDate) : 'Hoje'}`,
        14,
        28
      );
    }

    // Tabela
    const tableData = filteredTransactions.map((t) => [
      formatDate(t.date),
      t.type === 'deposit' ? 'Depósito' : 'Despesa',
      t.type === 'deposit'
        ? `${t.client?.code} - ${t.client?.name}`
        : `${t.process?.reference}`,
      t.category?.name || '-',
      `R$ ${formatCurrency(t.amount)}`,
    ]);

    autoTable(doc, {
      startY: startDate || endDate ? 32 : 26,
      head: [['Data', 'Tipo', 'Cliente/Processo', 'Categoria', 'Valor']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 8 },
    });

    // Totalizadores
    const totalDeposits = filteredTransactions
      .filter((t) => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalDeposits - totalExpenses;

    const finalY = (doc as any).lastAutoTable.finalY || 30;
    doc.setFontSize(10);
    doc.text(`Total Depósitos: R$ ${formatCurrency(totalDeposits)}`, 14, finalY + 10);
    doc.text(`Total Despesas: R$ ${formatCurrency(totalExpenses)}`, 14, finalY + 16);
    doc.text(`Saldo: R$ ${formatCurrency(balance)}`, 14, finalY + 22);

    const fileName = `movimentacoes_${startDate || 'inicio'}_${endDate || 'fim'}.pdf`;
    doc.save(fileName);
    showToast('Relatório PDF exportado com sucesso!', 'success');
  };

  // RELATÓRIO 4: Processos Não Faturados
  const exportUnbilledProcessesExcel = () => {
    const unbilledProcesses = processes.filter(
      (p) => p.status === 'finalized' && !p.billed_at
    );

    const data = unbilledProcesses.map((process) => {
      const processExpenses = transactions.filter(
        (t) => t.type === 'expense' && t.process?.id === process.id
      );
      const totalExpenses = processExpenses.reduce((sum, t) => sum + t.amount, 0);

      return {
        Referência: process.reference,
        Cliente: process.client?.name || '-',
        'Código Cliente': process.client?.code || '-',
        'Total Despesas': totalExpenses,
        'Data Criação': formatDate(process.created_at),
        'Data Finalização': process.finalized_at ? formatDate(process.finalized_at) : '-',
        'Dias Aguardando': process.finalized_at
          ? Math.floor(
              (new Date().getTime() - new Date(process.finalized_at).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0,
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);

    ws['!cols'] = [
      { wch: 20 }, // Referência
      { wch: 30 }, // Cliente
      { wch: 15 }, // Código Cliente
      { wch: 15 }, // Total Despesas
      { wch: 15 }, // Data Criação
      { wch: 18 }, // Data Finalização
      { wch: 18 }, // Dias Aguardando
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Processos Não Faturados');

    const fileName = `processos_nao_faturados_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast('Relatório exportado com sucesso!', 'success');
  };

  const renderClientBalanceReport = () => {
    const sortedClients = [...clients].sort((a, b) => a.balance - b.balance);
    const totalBalance = clients.reduce((sum, c) => sum + c.balance, 0);

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Saldo por Cliente</h2>
            <p className="text-sm text-gray-600 mt-1">
              Listagem de clientes ordenados por saldo (devedor primeiro)
            </p>
          </div>
          <button
            onClick={exportClientBalanceExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Exportar Excel
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  CNPJ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Saldo
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-semibold text-gray-900">
                    {client.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.cnpj || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono font-semibold">
                    <span className={client.balance < 0 ? 'text-red-600' : 'text-green-600'}>
                      R$ {formatCurrency(client.balance)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        client.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {client.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-sm font-bold text-gray-900">
                  TOTAL
                </td>
                <td className="px-6 py-4 text-right text-sm font-mono font-bold">
                  <span className={totalBalance < 0 ? 'text-red-600' : 'text-green-600'}>
                    R$ {formatCurrency(totalBalance)}
                  </span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  const renderProcessBalanceReport = () => {
    let filteredProcesses = processes;

    if (statusFilter) {
      filteredProcesses = filteredProcesses.filter((p) => p.status === statusFilter);
    }

    const processesWithExpenses = filteredProcesses.map((process) => {
      const processExpenses = transactions.filter(
        (t) => t.type === 'expense' && t.process?.id === process.id
      );
      const totalExpenses = processExpenses.reduce((sum, t) => sum + t.amount, 0);
      return { ...process, totalExpenses };
    });

    const totalExpenses = processesWithExpenses.reduce((sum, p) => sum + p.totalExpenses, 0);

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Saldo por Processo</h2>
            <p className="text-sm text-gray-600 mt-1">
              Listagem de processos com total de despesas
            </p>
          </div>
          <button
            onClick={exportProcessBalanceExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Exportar Excel
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Todos</option>
            <option value="open">Aberto</option>
            <option value="finalized">Finalizado</option>
            <option value="billed">Faturado</option>
          </select>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Referência
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cliente
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total Despesas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Data Criação
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processesWithExpenses.map((process) => (
                <tr key={process.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-semibold text-gray-900">
                    {process.reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-semibold">{process.client?.name}</div>
                    <div className="text-xs text-gray-500">{process.client?.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        process.status === 'open'
                          ? 'bg-blue-100 text-blue-800'
                          : process.status === 'finalized'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {process.status === 'open'
                        ? 'Aberto'
                        : process.status === 'finalized'
                        ? 'Finalizado'
                        : 'Faturado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono font-semibold text-gray-900">
                    R$ {formatCurrency(process.totalExpenses)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(process.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-sm font-bold text-gray-900">
                  TOTAL
                </td>
                <td className="px-6 py-4 text-right text-sm font-mono font-bold text-gray-900">
                  R$ {formatCurrency(totalExpenses)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  const renderTransactionsReport = () => {
    let filteredTransactions = transactions;

    if (startDate) {
      filteredTransactions = filteredTransactions.filter((t) => t.date >= startDate);
    }
    if (endDate) {
      filteredTransactions = filteredTransactions.filter((t) => t.date <= endDate);
    }

    const totalDeposits = filteredTransactions
      .filter((t) => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalDeposits - totalExpenses;

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Movimentações por Período</h2>
            <p className="text-sm text-gray-600 mt-1">
              Relatório de depósitos e despesas por período
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportTransactionsExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Excel
            </button>
            <button
              onClick={exportTransactionsPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Inicial
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Totalizadores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700 font-medium mb-1">Total Depósitos</p>
            <p className="text-2xl font-bold text-green-800">R$ {formatCurrency(totalDeposits)}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700 font-medium mb-1">Total Despesas</p>
            <p className="text-2xl font-bold text-red-800">R$ {formatCurrency(totalExpenses)}</p>
          </div>
          <div
            className={`border rounded-lg p-4 ${
              balance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <p
              className={`text-sm font-medium mb-1 ${
                balance >= 0 ? 'text-blue-700' : 'text-yellow-700'
              }`}
            >
              Saldo
            </p>
            <p
              className={`text-2xl font-bold ${
                balance >= 0 ? 'text-blue-800' : 'text-yellow-800'
              }`}
            >
              R$ {formatCurrency(Math.abs(balance))}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                  Cliente/Processo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Categoria
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.type === 'deposit'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {transaction.type === 'deposit' ? 'Depósito' : 'Despesa'}
                    </span>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderUnbilledProcessesReport = () => {
    const unbilledProcesses = processes.filter(
      (p) => p.status === 'finalized' && !p.billed_at
    );

    const processesWithExpenses = unbilledProcesses.map((process) => {
      const processExpenses = transactions.filter(
        (t) => t.type === 'expense' && t.process?.id === process.id
      );
      const totalExpenses = processExpenses.reduce((sum, t) => sum + t.amount, 0);
      const daysWaiting = process.finalized_at
        ? Math.floor(
            (new Date().getTime() - new Date(process.finalized_at).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0;
      return { ...process, totalExpenses, daysWaiting };
    });

    const totalExpenses = processesWithExpenses.reduce((sum, p) => sum + p.totalExpenses, 0);

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Processos Não Faturados</h2>
            <p className="text-sm text-gray-600 mt-1">
              Processos finalizados aguardando faturamento
            </p>
          </div>
          <button
            onClick={exportUnbilledProcessesExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Exportar Excel
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Referência
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cliente
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total Despesas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Data Finalização
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Dias Aguardando
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processesWithExpenses.map((process) => (
                <tr key={process.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-semibold text-gray-900">
                    {process.reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-semibold">{process.client?.name}</div>
                    <div className="text-xs text-gray-500">{process.client?.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono font-semibold text-gray-900">
                    R$ {formatCurrency(process.totalExpenses)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {process.finalized_at ? formatDate(process.finalized_at) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        process.daysWaiting > 30
                          ? 'bg-red-100 text-red-800'
                          : process.daysWaiting > 15
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {process.daysWaiting} dias
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={2} className="px-6 py-4 text-sm font-bold text-gray-900">
                  TOTAL ({processesWithExpenses.length} processos)
                </td>
                <td className="px-6 py-4 text-right text-sm font-mono font-bold text-gray-900">
                  R$ {formatCurrency(totalExpenses)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="mt-1 text-sm text-gray-600">
          Gere e exporte relatórios gerenciais
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveReport('client-balance')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeReport === 'client-balance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Saldo por Cliente
            </button>
            <button
              onClick={() => setActiveReport('process-balance')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeReport === 'process-balance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Saldo por Processo
            </button>
            <button
              onClick={() => setActiveReport('transactions')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeReport === 'transactions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Movimentações
            </button>
            <button
              onClick={() => setActiveReport('unbilled')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeReport === 'unbilled'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Não Faturados
            </button>
          </nav>
        </div>
      </div>

      {/* Report Content */}
      <div>
        {activeReport === 'client-balance' && renderClientBalanceReport()}
        {activeReport === 'process-balance' && renderProcessBalanceReport()}
        {activeReport === 'transactions' && renderTransactionsReport()}
        {activeReport === 'unbilled' && renderUnbilledProcessesReport()}
      </div>
    </div>
  );
}
