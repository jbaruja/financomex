import { Outlet } from 'react-router-dom';
import { SidebarProvider, useSidebar } from '../../contexts/SidebarContext';
import { ToastProvider } from '../../contexts/ToastContext';
import Sidebar from './Sidebar';
import ToastContainer from '../common/ToastContainer';

function MainLayoutContent() {
  const { toggleMobile } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Botão hambúrguer flutuante apenas para mobile */}
        <button
          onClick={toggleMobile}
          className="md:hidden fixed top-4 right-4 z-40 bg-blue-600 text-white p-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Abrir menu"
        >
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
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function MainLayout() {
  return (
    <ToastProvider>
      <SidebarProvider>
        <MainLayoutContent />
        {/* Toast Container */}
        <ToastContainer />
      </SidebarProvider>
    </ToastProvider>
  );
}
