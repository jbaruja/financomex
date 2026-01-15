-- =====================================================
-- FASE 4 - CRIAR TABELAS FINANCEIRAS (DEPOSITS E EXPENSES)
-- =====================================================

-- Criar tabela de depósitos
CREATE TABLE IF NOT EXISTS deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) NOT NULL,
  bank_account_id UUID REFERENCES bank_accounts(id) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de despesas
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID REFERENCES processes(id) NOT NULL,
  category_id UUID REFERENCES expense_categories(id) NOT NULL,
  bank_account_id UUID REFERENCES bank_accounts(id) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance - DEPOSITS
CREATE INDEX IF NOT EXISTS idx_deposits_client ON deposits(client_id);
CREATE INDEX IF NOT EXISTS idx_deposits_bank_account ON deposits(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_deposits_date ON deposits(date);
CREATE INDEX IF NOT EXISTS idx_deposits_created_at ON deposits(created_at);

-- Índices para melhor performance - EXPENSES
CREATE INDEX IF NOT EXISTS idx_expenses_process ON expenses(process_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_bank_account ON expenses(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_deposits_updated_at ON deposits;
CREATE TRIGGER update_deposits_updated_at
    BEFORE UPDATE ON deposits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários - DEPOSITS
COMMENT ON TABLE deposits IS 'Depósitos realizados pelos clientes';
COMMENT ON COLUMN deposits.client_id IS 'Cliente que realizou o depósito';
COMMENT ON COLUMN deposits.bank_account_id IS 'Conta bancária que recebeu o depósito';
COMMENT ON COLUMN deposits.amount IS 'Valor do depósito';
COMMENT ON COLUMN deposits.date IS 'Data do depósito';
COMMENT ON COLUMN deposits.description IS 'Descrição/observações do depósito';

-- Comentários - EXPENSES
COMMENT ON TABLE expenses IS 'Despesas vinculadas aos processos';
COMMENT ON COLUMN expenses.process_id IS 'Processo ao qual a despesa está vinculada';
COMMENT ON COLUMN expenses.category_id IS 'Categoria da despesa';
COMMENT ON COLUMN expenses.bank_account_id IS 'Conta bancária de onde saiu o pagamento';
COMMENT ON COLUMN expenses.amount IS 'Valor da despesa';
COMMENT ON COLUMN expenses.date IS 'Data da despesa';
COMMENT ON COLUMN expenses.description IS 'Descrição/observações da despesa';

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - DEPOSITS
-- =====================================================

ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem visualizar depósitos
DROP POLICY IF EXISTS "Authenticated users can view deposits" ON deposits;
CREATE POLICY "Authenticated users can view deposits"
  ON deposits FOR SELECT
  TO authenticated
  USING (true);

-- Usuários autenticados podem inserir depósitos
DROP POLICY IF EXISTS "Authenticated users can insert deposits" ON deposits;
CREATE POLICY "Authenticated users can insert deposits"
  ON deposits FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Usuários autenticados podem atualizar depósitos
DROP POLICY IF EXISTS "Authenticated users can update deposits" ON deposits;
CREATE POLICY "Authenticated users can update deposits"
  ON deposits FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Usuários autenticados podem deletar depósitos
DROP POLICY IF EXISTS "Authenticated users can delete deposits" ON deposits;
CREATE POLICY "Authenticated users can delete deposits"
  ON deposits FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - EXPENSES
-- =====================================================

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem visualizar despesas
DROP POLICY IF EXISTS "Authenticated users can view expenses" ON expenses;
CREATE POLICY "Authenticated users can view expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (true);

-- Usuários autenticados podem inserir despesas
DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON expenses;
CREATE POLICY "Authenticated users can insert expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Usuários autenticados podem atualizar despesas
DROP POLICY IF EXISTS "Authenticated users can update expenses" ON expenses;
CREATE POLICY "Authenticated users can update expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Usuários autenticados podem deletar despesas
DROP POLICY IF EXISTS "Authenticated users can delete expenses" ON expenses;
CREATE POLICY "Authenticated users can delete expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (true);
