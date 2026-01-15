-- =====================================================
-- ADICIONAR CAMPO SALDO (BALANCE) EM CLIENTS
-- =====================================================

-- Adicionar coluna balance (saldo) com valor padrão 0
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS balance DECIMAL(15, 2) DEFAULT 0.00;

-- Criar índice para melhorar performance de consultas por saldo
CREATE INDEX IF NOT EXISTS idx_clients_balance ON clients(balance);

-- Comentário na coluna
COMMENT ON COLUMN clients.balance IS 'Saldo depositado pelo cliente em nossas contas';
