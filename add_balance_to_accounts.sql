-- =====================================================
-- ADICIONAR CAMPO SALDO (BALANCE) EM BANK_ACCOUNTS
-- =====================================================

-- Adicionar coluna balance (saldo) com valor padrão 0
ALTER TABLE bank_accounts
ADD COLUMN IF NOT EXISTS balance DECIMAL(15, 2) DEFAULT 0.00;

-- Criar índice para melhorar performance de consultas por saldo
CREATE INDEX IF NOT EXISTS idx_bank_accounts_balance ON bank_accounts(balance);

-- Comentário na coluna
COMMENT ON COLUMN bank_accounts.balance IS 'Saldo atual da conta bancária';
