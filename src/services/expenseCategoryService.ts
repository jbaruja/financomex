import { supabase } from '../lib/supabase';
import type { ExpenseCategory, ExpenseCategoryInput } from '../types/database';

// Listar todas as categorias
export async function getExpenseCategories() {
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data as ExpenseCategory[];
}

// Buscar categoria por ID
export async function getExpenseCategoryById(id: string) {
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as ExpenseCategory;
}

// Criar nova categoria
export async function createExpenseCategory(category: ExpenseCategoryInput) {
  const { data, error } = await supabase
    .from('expense_categories')
    .insert([category])
    .select()
    .single();

  if (error) throw error;
  return data as ExpenseCategory;
}

// Atualizar categoria
export async function updateExpenseCategory(id: string, category: Partial<ExpenseCategoryInput>) {
  const { data, error } = await supabase
    .from('expense_categories')
    .update(category)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ExpenseCategory;
}

// Deletar categoria
export async function deleteExpenseCategory(id: string) {
  const { error } = await supabase
    .from('expense_categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
