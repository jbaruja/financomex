import { supabase } from '../lib/supabase';
import type { Importer, ImporterInput } from '../types/database';

// Listar todas as importadoras
export async function getImporters() {
  const { data, error } = await supabase
    .from('importers')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Importer[];
}

// Buscar importadora por ID
export async function getImporterById(id: string) {
  const { data, error } = await supabase
    .from('importers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Importer;
}

// Criar nova importadora
export async function createImporter(importer: ImporterInput) {
  const { data, error } = await supabase
    .from('importers')
    .insert([importer])
    .select()
    .single();

  if (error) throw error;
  return data as Importer;
}

// Atualizar importadora
export async function updateImporter(id: string, importer: Partial<ImporterInput>) {
  const { data, error } = await supabase
    .from('importers')
    .update(importer)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Importer;
}

// Deletar importadora
export async function deleteImporter(id: string) {
  const { error } = await supabase
    .from('importers')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
