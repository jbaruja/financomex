import { supabase } from '../lib/supabase';
import type { Process, ProcessInput, ProcessWithRelations, Client } from '../types/database';

/**
 * Valida o formato da referência: XXXX.XXX.XXXX.XX
 */
export function validateReference(reference: string): boolean {
  const pattern = /^\d{4}\.\d{3}\.\d{4}\.\d{2}$/;
  return pattern.test(reference);
}

/**
 * Extrai o código do cliente dos primeiros 4 dígitos da referência
 * Ex: 0058.039.1209.25 -> "0058"
 */
export function extractClientCode(reference: string): string {
  return reference.substring(0, 4);
}

/**
 * Busca cliente pelo código extraído da referência
 */
export async function findClientByReference(reference: string): Promise<Client | null> {
  const clientCode = extractClientCode(reference);

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('code', clientCode)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Nenhum cliente encontrado
      return null;
    }
    throw error;
  }

  return data as Client;
}

/**
 * Busca todos os processos com relacionamentos
 */
export async function getProcesses(): Promise<ProcessWithRelations[]> {
  const { data, error } = await supabase
    .from('processes')
    .select(`
      *,
      client:clients(*),
      importer:importers(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ProcessWithRelations[];
}

/**
 * Busca um processo por ID
 */
export async function getProcessById(id: string): Promise<ProcessWithRelations> {
  const { data, error } = await supabase
    .from('processes')
    .select(`
      *,
      client:clients(*),
      importer:importers(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as ProcessWithRelations;
}

/**
 * Cria um novo processo
 */
export async function createProcess(input: ProcessInput): Promise<Process> {
  // Validar formato da referência
  if (!validateReference(input.reference)) {
    throw new Error('Formato de referência inválido. Use o formato XXXX.XXX.XXXX.XX');
  }

  const { data, error } = await supabase
    .from('processes')
    .insert(input)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Já existe um processo com esta referência');
    }
    throw error;
  }

  return data as Process;
}

/**
 * Atualiza um processo
 */
export async function updateProcess(id: string, input: Partial<ProcessInput>): Promise<Process> {
  // Se estiver atualizando a referência, validar formato
  if (input.reference && !validateReference(input.reference)) {
    throw new Error('Formato de referência inválido. Use o formato XXXX.XXX.XXXX.XX');
  }

  const { data, error } = await supabase
    .from('processes')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Já existe um processo com esta referência');
    }
    throw error;
  }

  return data as Process;
}

/**
 * Deleta um processo
 */
export async function deleteProcess(id: string): Promise<void> {
  const { error } = await supabase
    .from('processes')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Finaliza um processo
 */
export async function finalizeProcess(id: string, notes?: string): Promise<Process> {
  const { data, error } = await supabase
    .from('processes')
    .update({
      status: 'finalized',
      finalized_at: new Date().toISOString(),
      billing_notes: notes,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Process;
}

/**
 * Fatura um processo
 */
export async function billProcess(id: string, notes?: string): Promise<Process> {
  const { data, error } = await supabase
    .from('processes')
    .update({
      status: 'billed',
      billed_at: new Date().toISOString(),
      billing_notes: notes,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Process;
}

/**
 * Busca processos com filtros
 */
export async function searchProcesses(filters: {
  clientId?: string;
  importerId?: string;
  status?: string;
  reference?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ProcessWithRelations[]> {
  let query = supabase
    .from('processes')
    .select(`
      *,
      client:clients(*),
      importer:importers(*)
    `);

  if (filters.clientId) {
    query = query.eq('client_id', filters.clientId);
  }

  if (filters.importerId) {
    query = query.eq('importer_id', filters.importerId);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.reference) {
    query = query.ilike('reference', `%${filters.reference}%`);
  }

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;
  return data as ProcessWithRelations[];
}
