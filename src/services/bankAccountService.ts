import { supabase } from '../lib/supabase';
import type { BankAccount, BankAccountInput } from '../types/database';

// Listar todas as contas bancárias
export async function getBankAccounts() {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data as BankAccount[];
}

// Buscar conta por ID
export async function getBankAccountById(id: string) {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as BankAccount;
}

// Criar nova conta
export async function createBankAccount(account: BankAccountInput) {
  const { data, error } = await supabase
    .from('bank_accounts')
    .insert([account])
    .select()
    .single();

  if (error) throw error;
  return data as BankAccount;
}

// Atualizar conta
export async function updateBankAccount(id: string, account: Partial<BankAccountInput>) {
  const { data, error } = await supabase
    .from('bank_accounts')
    .update(account)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as BankAccount;
}

// Deletar conta
export async function deleteBankAccount(id: string) {
  const { error } = await supabase
    .from('bank_accounts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
