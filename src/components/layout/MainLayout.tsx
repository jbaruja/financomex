import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '../../contexts/SidebarContext';
import { ToastProvider } from '../../contexts/ToastContext';
import Header from './Header';
import Sidebar from './Sidebar';
import ToastContainer from '../common/ToastContainer';

export default function MainLayout() {
  return (
    <ToastProvider>
      <SidebarProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />

          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />

            <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
              <Outlet />
            </main>
          </div>
        </div>

        {/* Toast Container */}
        <ToastContainer />
      </SidebarProvider>
    </ToastProvider>
  );
}
