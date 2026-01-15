-- =====================================================
-- FINANCOMEX - FASE 2
-- Script de criação de tabelas e configuração de RLS
-- =====================================================

-- Habilitar extensão UUID (caso não esteja habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABELA: CLIENTS (Clientes)
-- =====================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(4) UNIQUE NOT NULL, -- Ex: 0058
  name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  email VARCHAR(255),
  phone VARCHAR(20),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clients_code ON clients(code);
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(active);

-- =====================================================
-- 2. TABELA: IMPORTERS (Importadoras)
-- =====================================================
CREATE TABLE IF NOT EXISTS importers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_importers_active ON importers(active);

-- =====================================================
-- 3. TABELA: BANK_ACCOUNTS (Contas Bancárias)
-- =====================================================
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  bank VARCHAR(100),
  agency VARCHAR(20),
  account VARCHAR(20),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_active ON bank_accounts(active);

-- =====================================================
-- 4. TABELA: EXPENSE_CATEGORIES (Categorias de Despesa)
-- =====================================================
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_categories_active ON expense_categories(active);

-- =====================================================
-- 5. TRIGGERS: AUTO-UPDATE updated_at
-- =====================================================

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para cada tabela
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_importers_updated_at ON importers;
CREATE TRIGGER update_importers_updated_at
    BEFORE UPDATE ON importers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bank_accounts_updated_at ON bank_accounts;
CREATE TRIGGER update_bank_accounts_updated_at
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expense_categories_updated_at ON expense_categories;
CREATE TRIGGER update_expense_categories_updated_at
    BEFORE UPDATE ON expense_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE importers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

-- Políticas: Usuários autenticados podem fazer tudo
-- (ajuste conforme necessidade de permissões mais granulares)

-- CLIENTS
DROP POLICY IF EXISTS "Authenticated users can view clients" ON clients;
CREATE POLICY "Authenticated users can view clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert clients" ON clients;
CREATE POLICY "Authenticated users can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update clients" ON clients;
CREATE POLICY "Authenticated users can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete clients" ON clients;
CREATE POLICY "Authenticated users can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (true);

-- IMPORTERS
DROP POLICY IF EXISTS "Authenticated users can view importers" ON importers;
CREATE POLICY "Authenticated users can view importers"
  ON importers FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert importers" ON importers;
CREATE POLICY "Authenticated users can insert importers"
  ON importers FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update importers" ON importers;
CREATE POLICY "Authenticated users can update importers"
  ON importers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete importers" ON importers;
CREATE POLICY "Authenticated users can delete importers"
  ON importers FOR DELETE
  TO authenticated
  USING (true);

-- BANK_ACCOUNTS
DROP POLICY IF EXISTS "Authenticated users can view bank_accounts" ON bank_accounts;
CREATE POLICY "Authenticated users can view bank_accounts"
  ON bank_accounts FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert bank_accounts" ON bank_accounts;
CREATE POLICY "Authenticated users can insert bank_accounts"
  ON bank_accounts FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update bank_accounts" ON bank_accounts;
CREATE POLICY "Authenticated users can update bank_accounts"
  ON bank_accounts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete bank_accounts" ON bank_accounts;
CREATE POLICY "Authenticated users can delete bank_accounts"
  ON bank_accounts FOR DELETE
  TO authenticated
  USING (true);

-- EXPENSE_CATEGORIES
DROP POLICY IF EXISTS "Authenticated users can view expense_categories" ON expense_categories;
CREATE POLICY "Authenticated users can view expense_categories"
  ON expense_categories FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert expense_categories" ON expense_categories;
CREATE POLICY "Authenticated users can insert expense_categories"
  ON expense_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update expense_categories" ON expense_categories;
CREATE POLICY "Authenticated users can update expense_categories"
  ON expense_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete expense_categories" ON expense_categories;
CREATE POLICY "Authenticated users can delete expense_categories"
  ON expense_categories FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- 7. DADOS INICIAIS (OPCIONAL - PARA TESTES)
-- =====================================================

-- Inserir algumas categorias padrão
INSERT INTO expense_categories (name, description) VALUES
  ('Transporte', 'Despesas com frete e transporte'),
  ('Taxas Portuárias', 'Taxas e tarifas portuárias'),
  ('Despachante', 'Honorários de despachante aduaneiro'),
  ('Armazenagem', 'Custos de armazenagem'),
  ('Seguro', 'Seguro de carga')
ON CONFLICT DO NOTHING;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
