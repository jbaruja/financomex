-- =====================================================
-- FASE 5 - FUNCTIONS PARA CÁLCULOS DE SALDO E DESPESAS
-- =====================================================

-- Function: Calcular saldo do cliente
-- Retorna: Total de depósitos - Total de despesas dos processos do cliente
CREATE OR REPLACE FUNCTION get_client_balance(client_uuid UUID)
RETURNS DECIMAL AS $$
  SELECT
    COALESCE(SUM(d.amount), 0) -
    COALESCE((
      SELECT SUM(e.amount)
      FROM expenses e
      JOIN processes p ON e.process_id = p.id
      WHERE p.client_id = client_uuid
    ), 0)
  FROM deposits d
  WHERE d.client_id = client_uuid;
$$ LANGUAGE SQL;

-- Function: Calcular total de despesas do processo
-- Retorna: Soma de todas as despesas do processo
CREATE OR REPLACE FUNCTION get_process_expenses(process_uuid UUID)
RETURNS DECIMAL AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM expenses
  WHERE process_id = process_uuid;
$$ LANGUAGE SQL;

-- Comentários
COMMENT ON FUNCTION get_client_balance(UUID) IS 'Calcula o saldo do cliente (depósitos - despesas dos processos)';
COMMENT ON FUNCTION get_process_expenses(UUID) IS 'Calcula o total de despesas de um processo';

-- =====================================================
-- TESTE DAS FUNCTIONS
-- =====================================================
-- Para testar, execute:
-- SELECT get_client_balance('uuid-do-cliente');
-- SELECT get_process_expenses('uuid-do-processo');
