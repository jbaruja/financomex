import { supabase } from '../lib/supabase';
import type { Client } from '../types/database';

/**
 * Métricas do Dashboard
 */
export interface DashboardMetrics {
  openProcesses: number;
  finalizedProcesses: number;
  finalizedWithoutBilling: number;
  totalClients: number;
  totalDeposits: number;
  totalExpenses: number;
}

/**
 * Cliente com saldo calculado
 */
export interface ClientWithBalance extends Client {
  calculatedBalance: number;
}

/**
 * Busca métricas gerais do dashboard
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    // Processos em aberto
    const { count: openProcesses } = await supabase
      .from('processes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    // Processos finalizados
    const { count: finalizedProcesses } = await supabase
      .from('processes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'finalized');

    // Processos finalizados SEM cobrança (CRÍTICO)
    const { count: finalizedWithoutBilling } = await supabase
      .from('processes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'finalized')
      .is('billed_at', null);

    // Total de clientes
    const { count: totalClients } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    // Total de depósitos (soma)
    const { data: depositsData } = await supabase
      .from('deposits')
      .select('amount');

    const totalDeposits = depositsData?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

    // Total de despesas (soma)
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('amount');

    const totalExpenses = expensesData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    return {
      openProcesses: openProcesses || 0,
      finalizedProcesses: finalizedProcesses || 0,
      finalizedWithoutBilling: finalizedWithoutBilling || 0,
      totalClients: totalClients || 0,
      totalDeposits,
      totalExpenses,
    };
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    throw error;
  }
}

/**
 * Busca top 10 clientes com maior saldo
 */
export async function getTopClientsByBalance(): Promise<ClientWithBalance[]> {
  try {
    // Buscar todos os clientes ativos
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('active', true);

    if (clientsError) throw clientsError;
    if (!clients) return [];

    // Buscar todos os depósitos
    const { data: deposits, error: depositsError } = await supabase
      .from('deposits')
      .select('client_id, amount');

    if (depositsError) throw depositsError;

    // Buscar todas as despesas com processos
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount, process:processes(client_id)');

    if (expensesError) throw expensesError;

    // Calcular saldo de cada cliente
    const clientsWithBalance: ClientWithBalance[] = clients.map((client) => {
      // Soma de depósitos do cliente
      const clientDeposits = deposits
        ?.filter((d) => d.client_id === client.id)
        .reduce((sum, d) => sum + Number(d.amount), 0) || 0;

      // Soma de despesas dos processos do cliente
      const clientExpenses = expenses
        ?.filter((e: any) => e.process?.client_id === client.id)
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      return {
        ...client,
        calculatedBalance: clientDeposits - clientExpenses,
      };
    });

    // Ordenar por saldo (maior para menor) e pegar top 10
    return clientsWithBalance
      .sort((a, b) => b.calculatedBalance - a.calculatedBalance)
      .slice(0, 10);
  } catch (error) {
    console.error('Erro ao buscar top clientes:', error);
    throw error;
  }
}

/**
 * Busca processos finalizados sem cobrança
 */
export async function getFinalizedWithoutBilling() {
  const { data, error } = await supabase
    .from('processes')
    .select(`
      *,
      client:clients(*),
      importer:importers(*)
    `)
    .eq('status', 'finalized')
    .is('billed_at', null)
    .order('finalized_at', { ascending: false });

  if (error) throw error;
  return data;
}
