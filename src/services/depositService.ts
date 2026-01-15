import { supabase } from '../lib/supabase';
import type { Deposit, DepositInput, DepositWithRelations } from '../types/database';

/**
 * Busca todos os depósitos com relacionamentos
 */
export async function getDeposits(): Promise<DepositWithRelations[]> {
  const { data, error } = await supabase
    .from('deposits')
    .select(`
      *,
      client:clients(*),
      bank_account:bank_accounts(*)
    `)
    .order('date', { ascending: false });

  if (error) throw error;
  return data as DepositWithRelations[];
}

/**
 * Busca um depósito por ID
 */
export async function getDepositById(id: string): Promise<DepositWithRelations> {
  const { data, error } = await supabase
    .from('deposits')
    .select(`
      *,
      client:clients(*),
      bank_account:bank_accounts(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as DepositWithRelations;
}

/**
 * Cria um novo depósito
 */
export async function createDeposit(input: DepositInput): Promise<Deposit> {
  const { data, error } = await supabase
    .from('deposits')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data as Deposit;
}

/**
 * Atualiza um depósito
 */
export async function updateDeposit(id: string, input: Partial<DepositInput>): Promise<Deposit> {
  const { data, error } = await supabase
    .from('deposits')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Deposit;
}

/**
 * Deleta um depósito
 */
export async function deleteDeposit(id: string): Promise<void> {
  const { error } = await supabase
    .from('deposits')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Busca depósitos com filtros
 */
export async function searchDeposits(filters: {
  clientId?: string;
  bankAccountId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<DepositWithRelations[]> {
  let query = supabase
    .from('deposits')
    .select(`
      *,
      client:clients(*),
      bank_account:bank_accounts(*)
    `);

  if (filters.clientId) {
    query = query.eq('client_id', filters.clientId);
  }

  if (filters.bankAccountId) {
    query = query.eq('bank_account_id', filters.bankAccountId);
  }

  if (filters.startDate) {
    query = query.gte('date', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('date', filters.endDate);
  }

  query = query.order('date', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;
  return data as DepositWithRelations[];
}

/**
 * Calcula total de depósitos
 */
export async function getTotalDeposits(filters?: {
  clientId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<number> {
  let query = supabase
    .from('deposits')
    .select('amount');

  if (filters?.clientId) {
    query = query.eq('client_id', filters.clientId);
  }

  if (filters?.startDate) {
    query = query.gte('date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('date', filters.endDate);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data.reduce((sum, deposit) => sum + Number(deposit.amount), 0);
}
