export default function Dashboard() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral das operações financeiras</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Processos em Aberto</h3>
            <span className="text-2xl">📦</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">260</p>
          <p className="text-sm text-gray-500 mt-2">Total de processos ativos</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Processos Finalizados</h3>
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">45</p>
          <p className="text-sm text-gray-500 mt-2">Este mês</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Aguardando Cobrança</h3>
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-3xl font-bold text-red-600">8</p>
          <p className="text-sm text-gray-500 mt-2">Processos finalizados não cobrados</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Clientes Ativos</h3>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">42</p>
          <p className="text-sm text-gray-500 mt-2">Total de clientes cadastrados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Últimas Movimentações
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Depósito - Cliente 0058</p>
                <p className="text-sm text-gray-500">Hoje às 14:30</p>
              </div>
              <span className="text-green-600 font-semibold">+ R$ 15.000,00</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Despesa ICMS - Proc. 1209.25</p>
                <p className="text-sm text-gray-500">Hoje às 11:20</p>
              </div>
              <span className="text-red-600 font-semibold">- R$ 3.450,00</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900">Depósito - Cliente 0025</p>
                <p className="text-sm text-gray-500">Ontem às 16:45</p>
              </div>
              <span className="text-green-600 font-semibold">+ R$ 28.500,00</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Alertas Importantes
          </h2>
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-medium text-red-900">8 processos não cobrados</p>
                  <p className="text-sm text-red-700 mt-1">
                    Processos finalizados aguardando cobrança ao cliente
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">⏰</span>
                <div>
                  <p className="font-medium text-yellow-900">12 processos próximos da finalização</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Revise os valores antes de finalizar
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">ℹ️</span>
                <div>
                  <p className="font-medium text-blue-900">Sistema atualizado</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Fase 1 - Autenticação implementada com sucesso
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
