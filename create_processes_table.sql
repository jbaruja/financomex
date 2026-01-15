-- =====================================================
-- FASE 3 - CRIAR TABELA PROCESSES
-- =====================================================

-- Criar tabela de processos
CREATE TABLE IF NOT EXISTS processes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference VARCHAR(20) UNIQUE NOT NULL, -- Ex: 0058.039.1209.25
  client_id UUID REFERENCES clients(id) NOT NULL,
  importer_id UUID REFERENCES importers(id),
  status VARCHAR(20) DEFAULT 'open', -- open, finalized, billed
  finalized_at TIMESTAMP WITH TIME ZONE,
  billed_at TIMESTAMP WITH TIME ZONE,
  billing_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_processes_client ON processes(client_id);
CREATE INDEX IF NOT EXISTS idx_processes_importer ON processes(importer_id);
CREATE INDEX IF NOT EXISTS idx_processes_status ON processes(status);
CREATE INDEX IF NOT EXISTS idx_processes_reference ON processes(reference);
CREATE INDEX IF NOT EXISTS idx_processes_created_at ON processes(created_at);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_processes_updated_at ON processes;
CREATE TRIGGER update_processes_updated_at
    BEFORE UPDATE ON processes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE processes IS 'Processos de importação';
COMMENT ON COLUMN processes.reference IS 'Referência no formato XXXX.XXX.XXXX.XX';
COMMENT ON COLUMN processes.status IS 'Status: open (aberto), finalized (finalizado), billed (faturado)';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE processes ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem visualizar processos
DROP POLICY IF EXISTS "Authenticated users can view processes" ON processes;
CREATE POLICY "Authenticated users can view processes"
  ON processes FOR SELECT
  TO authenticated
  USING (true);

-- Usuários autenticados podem inserir processos
DROP POLICY IF EXISTS "Authenticated users can insert processes" ON processes;
CREATE POLICY "Authenticated users can insert processes"
  ON processes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Usuários autenticados podem atualizar processos
DROP POLICY IF EXISTS "Authenticated users can update processes" ON processes;
CREATE POLICY "Authenticated users can update processes"
  ON processes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Usuários autenticados podem deletar processos
DROP POLICY IF EXISTS "Authenticated users can delete processes" ON processes;
CREATE POLICY "Authenticated users can delete processes"
  ON processes FOR DELETE
  TO authenticated
  USING (true);
