import { supabase } from '../lib/supabase';
import type { Client, ClientInput } from '../types/database';

// Listar todos os clientes
export async function getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('code', { ascending: true });

  if (error) throw error;
  return data as Client[];
}

// Buscar cliente por ID
export async function getClientById(id: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Client;
}

// Criar novo cliente
export async function createClient(client: ClientInput) {
  const { data, error } = await supabase
    .from('clients')
    .insert([client])
    .select()
    .single();

  if (error) throw error;
  return data as Client;
}

// Atualizar cliente
export async function updateClient(id: string, client: Partial<ClientInput>) {
  const { data, error } = await supabase
    .from('clients')
    .update(client)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Client;
}

// Deletar cliente
export async function deleteClient(id: string) {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Verificar se código já existe
export async function checkClientCodeExists(code: string, excludeId?: string) {
  let query = supabase
    .from('clients')
    .select('id')
    .eq('code', code);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data?.length || 0) > 0;
}

// Atualizar saldo do cliente (incrementar ou decrementar)
export async function updateClientBalance(clientId: string, amount: number) {
  // Buscar saldo atual
  const client = await getClientById(clientId);

  // Calcular novo saldo
  const newBalance = client.balance + amount;

  // Atualizar cliente
  const { data, error } = await supabase
    .from('clients')
    .update({ balance: newBalance })
    .eq('id', clientId)
    .select()
    .single();

  if (error) throw error;
  return data as Client;
}
