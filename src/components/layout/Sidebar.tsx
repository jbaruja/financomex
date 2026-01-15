import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useSidebar } from '../../contexts/SidebarContext';

interface NavItem {
  name: string;
  path: string;
  icon: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  { name: 'Clientes', path: '/clientes', icon: '👥' },
  { name: 'Importadoras', path: '/importadoras', icon: '🏢' },
  { name: 'Processos', path: '/processos', icon: '📦' },
  { name: 'Financeiro', path: '/financeiro', icon: '💰' },
  { name: 'Relatórios', path: '/relatorios', icon: '📈' },
  { name: 'Configurações', path: '/configuracoes', icon: '⚙️' },
];

export default function Sidebar() {
  const { isMobileOpen, closeMobile } = useSidebar();

  // Recupera o estado do localStorage ou usa comportamento responsivo como padrão
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) return JSON.parse(saved);

    // Padrão responsivo: colapsado em tablet, expandido em desktop
    return window.innerWidth >= 768 && window.innerWidth < 1024;
  });

  // Salva o estado no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLinkClick = () => {
    // Fecha o sidebar em mobile quando clicar em um link
    closeMobile();
  };

  return (
    <>
      {/* Backdrop (somente mobile) */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          bg-gray-900 text-white min-h-screen transition-all duration-300 z-50
          w-64 ${isCollapsed ? 'md:w-20' : 'md:w-64'}
          md:relative md:translate-x-0
          fixed inset-y-0 left-0
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Botão de toggle (oculto em mobile) */}
        <div className="p-4 flex justify-end hidden md:flex">
          <button
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
            title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {isCollapsed ? (
              // Ícone de expandir (setas para direita)
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
            ) : (
              // Ícone de recolher (setas para esquerda)
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Logo/Título em mobile */}
        <div className="p-4 border-b border-gray-800 md:hidden">
          <h2 className="text-lg font-bold text-center">FINANCOMEX</h2>
        </div>

        {/* Navegação */}
        <nav className="px-4 pb-4 space-y-2 mt-4 md:mt-0">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                } ${isCollapsed ? 'md:justify-center' : ''}`
              }
              title={isCollapsed ? item.name : ''}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <span className={`font-medium ${isCollapsed ? 'md:hidden' : ''}`}>
                {item.name}
              </span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
