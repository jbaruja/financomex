import { NavLink, Outlet, useLocation } from 'react-router-dom';

export default function Settings() {
  const location = useLocation();

  // Se está na rota raiz de configurações, redirecionar para contas
  const isRootPath = location.pathname === '/configuracoes' || location.pathname === '/configuracoes/';

  const navItems = [
    { name: 'Contas Bancárias', path: '/configuracoes/contas', icon: '🏦' },
    { name: 'Categorias de Despesa', path: '/configuracoes/categorias', icon: '📑' },
    { name: 'Importadoras', path: '/configuracoes/importadoras', icon: '🏢' },
  ];

  if (isRootPath) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Configurações</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 hover:border-blue-300"
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">{item.icon}</span>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{item.name}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Gerenciar {item.name.toLowerCase()}
                  </p>
                </div>
              </div>
            </NavLink>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Navegação de tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Conteúdo da subpágina */}
      <Outlet />
    </div>
  );
}
