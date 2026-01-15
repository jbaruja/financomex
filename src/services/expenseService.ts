import { supabase } from '../lib/supabase';
import type { Expense, ExpenseInput, ExpenseWithRelations } from '../types/database';

/**
 * Busca todas as despesas com relacionamentos
 */
export async function getExpenses(): Promise<ExpenseWithRelations[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      process:processes(
        *,
        client:clients(*),
        importer:importers(*)
      ),
      category:expense_categories(*),
      bank_account:bank_accounts(*)
    `)
    .order('date', { ascending: false });

  if (error) throw error;
  return data as ExpenseWithRelations[];
}

/**
 * Busca uma despesa por ID
 */
export async function getExpenseById(id: string): Promise<ExpenseWithRelations> {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      process:processes(
        *,
        client:clients(*),
        importer:importers(*)
      ),
      category:expense_categories(*),
      bank_account:bank_accounts(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as ExpenseWithRelations;
}

/**
 * Cria uma nova despesa
 */
export async function createExpense(input: ExpenseInput): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data as Expense;
}

/**
 * Atualiza uma despesa
 */
export async function updateExpense(id: string, input: Partial<ExpenseInput>): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Expense;
}

/**
 * Deleta uma despesa
 */
export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Busca despesas com filtros
 */
export async function searchExpenses(filters: {
  processId?: string;
  categoryId?: string;
  bankAccountId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ExpenseWithRelations[]> {
  let query = supabase
    .from('expenses')
    .select(`
      *,
      process:processes(
        *,
        client:clients(*),
        importer:importers(*)
      ),
      category:expense_categories(*),
      bank_account:bank_accounts(*)
    `);

  if (filters.processId) {
    query = query.eq('process_id', filters.processId);
  }

  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
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
  return data as ExpenseWithRelations[];
}

/**
 * Calcula total de despesas
 */
export async function getTotalExpenses(filters?: {
  processId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<number> {
  let query = supabase
    .from('expenses')
    .select('amount');

  if (filters?.processId) {
    query = query.eq('process_id', filters.processId);
  }

  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }

  if (filters?.startDate) {
    query = query.gte('date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('date', filters.endDate);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data.reduce((sum, expense) => sum + Number(expense.amount), 0);
}

/**
 * Busca despesas por processo
 */
export async function getExpensesByProcess(processId: string): Promise<ExpenseWithRelations[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      process:processes(*),
      category:expense_categories(*),
      bank_account:bank_accounts(*)
    `)
    .eq('process_id', processId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data as ExpenseWithRelations[];
}
